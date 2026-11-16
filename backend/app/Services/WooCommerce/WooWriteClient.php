<?php

namespace App\Services\WooCommerce;

use App\Models\WriteSetting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * The ONLY class that can change data in WooCommerce.
 *
 * Every call re-checks the master switch, so a code path
 * that forgets the route middleware still cannot write while writes are off.
 * Writes are never retried automatically: a retry of a POST could duplicate it.
 */
final class WooWriteClient
{
    /** @throws WriteBlocked when writes are not currently open */
    private function http(): PendingRequest
    {
        if (! WriteSetting::writesOpen()) {
            throw new WriteBlocked('Writes to WooCommerce are disabled.');
        }

        $key = config('woocommerce.consumer_key');
        $secret = config('woocommerce.consumer_secret');
        $base = config('woocommerce.base_url');

        if (! $key || ! $secret || ! $base) {
            throw new WooNotConfigured('WooCommerce credentials are not configured (WOO_BASE_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET).');
        }

        $caBundle = config('woocommerce.ca_bundle');

        return Http::baseUrl($base.'/wp-json/wc/v3')
            ->withOptions($caBundle ? ['verify' => $caBundle] : [])
            ->withBasicAuth($key, $secret)
            ->acceptJson()
            ->asJson()
            ->timeout(config('woocommerce.timeout'));
    }

    public function post(string $endpoint, array $data): array
    {
        return $this->http()->post(ltrim($endpoint, '/'), $data)->throw()->json() ?? [];
    }

    public function put(string $endpoint, array $data): array
    {
        return $this->http()->put(ltrim($endpoint, '/'), $data)->throw()->json() ?? [];
    }

    public function patch(string $endpoint, array $data): array
    {
        return $this->http()->patch(ltrim($endpoint, '/'), $data)->throw()->json() ?? [];
    }

    /**
     * Delete a record. By default WooCommerce moves it to the trash where
     * supported; $force = true removes it permanently and needs its own switch.
     */
    public function delete(string $endpoint, bool $force = false): array
    {
        if ($force && ! WriteSetting::isOn('permanent_delete')) {
            throw new WriteBlocked('Permanent deletion is disabled.');
        }

        return $this->http()->delete(ltrim($endpoint, '/'), ['force' => $force])->throw()->json() ?? [];
    }
}
