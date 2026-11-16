<?php

namespace App\Services\WooCommerce;

use App\Models\User;
use App\Models\WooCategory;
use App\Models\WooCoupon;
use App\Models\WooCustomer;
use App\Models\WooProduct;
use App\Models\WooWriteAudit;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Client\RequestException;
use Throwable;

/**
 * Runs every non-product-update change to WooCommerce through one audited path:
 * the attempt is recorded BEFORE anything is sent, the outcome is recorded after,
 * and the local mirror is refreshed only from WooCommerce's own response.
 */
class WooWriter
{
    /** resource => [Woo endpoint, mirror model, store method, forget key] */
    private const RESOURCES = [
        'products' => ['products', WooProduct::class, 'storeProduct', 'product'],
        'customers' => ['customers', WooCustomer::class, 'storeCustomer', 'customer'],
        'categories' => ['products/categories', WooCategory::class, 'storeCategory', 'category'],
        'coupons' => ['coupons', WooCoupon::class, 'storeCoupon', 'coupon'],
    ];

    public function __construct(
        private WooWriteClient $client,
        private WooSyncService $sync,
        private WooConfigReader $config,
    ) {}

    /**
     * The audited core. $call receives the write client and returns WooCommerce's response.
     *
     * @param  array<string, mixed>  $request  what is being sent (never put secrets in here)
     * @param  array<string, mixed>|null  $before  the values being replaced
     *
     * @throws WriteFailed
     */
    public function run(string $resource, string $action, ?int $wooId, array $request, ?array $before, ?User $user, ?string $ip, Closure $call): array
    {
        $audit = WooWriteAudit::create([
            'user_id' => $user?->getKey(),
            'resource' => $resource,
            'action' => $action,
            'woo_id' => $wooId,
            'status' => 'pending',
            'request' => $this->scrub($request),
            'before' => $before === null ? null : $this->scrub($before),
            'ip' => $ip,
        ]);

        try {
            $response = $call($this->client);
        } catch (Throwable $e) {
            $status = $e instanceof RequestException ? $e->response->status() : 0;
            $real = $e instanceof RequestException ? ($e->response->json('message') ?: $e->getMessage()) : $e->getMessage();

            // The audit table (admin-only) keeps the real reason; the API caller only gets a generic sentence.
            $audit->update(['status' => 'failed', 'http_status' => $status ?: null, 'error' => mb_substr($real, 0, 2000)]);

            throw new WriteFailed(WooErrors::describe($e, "write {$resource}.{$action}"), $status);
        }

        // Keep the audit small and free of secrets: the id plus the fields that were sent.
        $audit->update([
            'status' => 'success',
            'http_status' => 200,
            'woo_id' => $wooId ?? ($response['id'] ?? null),
            'after' => ['id' => $response['id'] ?? null] + array_intersect_key($response, $request),
        ]);

        return $response;
    }

    /** Never write credentials or bulky raw payloads into the audit log. */
    private function scrub(array $data): array
    {
        unset($data['raw']);

        foreach ($data as $key => $value) {
            if (is_string($key) && preg_match('/(secret|key|token|passw|pwd|credential)/i', $key)) {
                $data[$key] = '[hidden]';
            } elseif (is_array($value)) {
                $data[$key] = $this->scrub($value);
            }
        }

        return $data;
    }

    /** WooCommerce has already changed; a mirror problem must never look like a failed write. */
    public function mirror(Closure $refresh): void
    {
        try {
            $refresh();
        } catch (Throwable $e) {
            report($e);
        }
    }

    /** Drop cached shipping/settings/payment reads so the next GET shows the change. */
    public function flushConfig(): void
    {
        $this->config->flush();
    }

    /** @param array<string, mixed> $payload */
    public function create(string $resource, array $payload, ?User $user, ?string $ip): Model|array
    {
        [$endpoint, , $store] = self::RESOURCES[$resource];

        $response = $this->run($resource, 'create', null, $payload, null, $user, $ip, fn (WooWriteClient $c) => $c->post($endpoint, $payload));

        try {
            return $this->sync->{$store}($response);
        } catch (Throwable $e) {
            report($e);

            // Created in WooCommerce; the next sync will bring it into the mirror.
            return $response;
        }
    }

    /** @param array<string, mixed> $payload */
    public function update(string $resource, Model $record, array $payload, ?User $user, ?string $ip): Model
    {
        [$endpoint, , $store] = self::RESOURCES[$resource];

        $response = $this->run($resource, 'update', $record->woo_id, $payload, $record->only(array_keys($payload)), $user, $ip,
            fn (WooWriteClient $c) => $c->put("{$endpoint}/{$record->woo_id}", $payload));

        try {
            return $this->sync->{$store}($response);
        } catch (Throwable $e) {
            report($e);

            return $record->refresh();
        }
    }

    /** Products and coupons go to the trash; customers and categories can only be deleted for good. */
    public function delete(string $resource, Model $record, ?User $user, ?string $ip): void
    {
        [$endpoint, , , $forget] = self::RESOURCES[$resource];
        $force = in_array($resource, ['customers', 'categories'], true);

        $this->run($resource, 'delete', $record->woo_id, ['force' => $force], $record->attributesToArray(), $user, $ip,
            fn (WooWriteClient $c) => $c->delete("{$endpoint}/{$record->woo_id}", $force));

        $this->mirror(fn () => $this->sync->forget($forget, $record->woo_id));
    }

    /** @return array<string, string> resource => mirror model class */
    public static function models(): array
    {
        return array_map(fn (array $r) => $r[1], self::RESOURCES);
    }
}
