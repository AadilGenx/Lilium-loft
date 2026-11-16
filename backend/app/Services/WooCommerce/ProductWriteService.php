<?php

namespace App\Services\WooCommerce;

use App\Models\User;
use App\Models\WooProduct;
use App\Models\WooWriteAudit;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use RuntimeException;
use Throwable;

/**
 * Changes a product's price/stock in WooCommerce, then refreshes the local mirror.
 * WooCommerce stays the source of truth: the mirror is only updated from
 * WooCommerce's own response after it confirms the change.
 */
class ProductWriteService
{
    /** The only fields this service will ever send. */
    public const ALLOWED = [
        'regular_price', 'sale_price', 'manage_stock', 'stock_quantity', 'stock_status',
        'name', 'slug', 'sku', 'status', 'description', 'short_description', 'featured', 'categories', 'images',
    ];

    public function __construct(
        private WooWriteClient $writer,
        private WooSyncService $sync,
    ) {}

    /**
     * @param  array<string, mixed>  $changes  already validated input
     *
     * @throws WriteFailed when WooCommerce rejects or cannot be reached
     */
    public function update(WooProduct $product, array $changes, ?User $user, ?string $ip): WooProduct
    {
        $payload = array_intersect_key($changes, array_flip(self::ALLOWED));
        if ($payload === []) {
            throw new RuntimeException('No updatable fields supplied.');
        }

        // Record the attempt BEFORE anything is sent, with the values we are replacing.
        $audit = WooWriteAudit::create([
            'user_id' => $user?->getKey(),
            'resource' => 'products',
            'action' => 'update',
            'woo_id' => $product->woo_id,
            'status' => 'pending',
            'request' => $payload,
            'before' => $product->only(['regular_price', 'sale_price', 'manage_stock', 'stock_quantity', 'stock_status', 'name', 'sku', 'status']),
            'ip' => $ip,
        ]);

        try {
            $response = $this->writer->put("products/{$product->woo_id}", $payload);
        } catch (RequestException|ConnectionException|WooNotConfigured|WriteBlocked $e) {
            $status = $e instanceof RequestException ? $e->response->status() : 0;
            $real = $e instanceof RequestException ? ($e->response->json('message') ?: $e->getMessage()) : $e->getMessage();

            // The audit table (admin-only) keeps the real reason; the API caller only gets a generic sentence.
            $audit->update(['status' => 'failed', 'http_status' => $status ?: null, 'error' => mb_substr($real, 0, 2000)]);

            throw new WriteFailed(WooErrors::describe($e, 'write products.update'), $status);
        }

        $audit->update([
            'status' => 'success',
            'http_status' => 200,
            'after' => array_intersect_key($response, array_flip(self::ALLOWED)),
        ]);

        // WooCommerce has already changed; a mirror hiccup must not look like a failed write.
        try {
            return $this->sync->storeProduct($response);
        } catch (Throwable $e) {
            report($e);
            $audit->update(['error' => 'Saved in WooCommerce; local mirror refresh failed: '.mb_substr($e->getMessage(), 0, 1500)]);

            return $product->refresh();
        }
    }
}
