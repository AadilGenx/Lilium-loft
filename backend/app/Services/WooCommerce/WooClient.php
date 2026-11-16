<?php

namespace App\Services\WooCommerce;

use Generator;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Read-only WooCommerce REST client.
 *
 * This class intentionally exposes GET requests only. There is no method
 * that can create, update or delete anything in WooCommerce.
 */
final class WooClient
{
    private function http(): PendingRequest
    {
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
            ->timeout(config('woocommerce.timeout'))
            ->retry(3, 1000, throw: false);
    }

    /** Single GET request; returns decoded JSON. */
    public function get(string $endpoint, array $query = []): array
    {
        $response = $this->http()->get(ltrim($endpoint, '/'), $query);
        $response->throw();

        return $response->json() ?? [];
    }

    /**
     * Several GET requests at the same time (one round trip's worth of waiting instead of one per request).
     *
     * @param  array<string, string>  $endpoints  key => endpoint
     * @return array<string, Response|\Throwable>  key => response (not thrown, so the caller can handle each)
     */
    public function getMany(array $endpoints): array
    {
        if ($endpoints === []) {
            return [];
        }

        $this->http(); // fail early (not configured) before any request is made

        $caBundle = config('woocommerce.ca_bundle');

        return Http::pool(function (Pool $pool) use ($endpoints, $caBundle) {
            foreach ($endpoints as $key => $endpoint) {
                $pool->as((string) $key)
                    ->baseUrl(config('woocommerce.base_url').'/wp-json/wc/v3')
                    ->withOptions($caBundle ? ['verify' => $caBundle] : [])
                    ->withBasicAuth(config('woocommerce.consumer_key'), config('woocommerce.consumer_secret'))
                    ->acceptJson()
                    ->timeout(config('woocommerce.timeout'))
                    ->get(ltrim($endpoint, '/'));
            }
        });
    }

    /**
     * Iterate every record of a collection endpoint, page by page.
     *
     * @return Generator<int, array>
     */
    public function paginate(string $endpoint, array $query = []): Generator
    {
        $perPage = config('woocommerce.per_page');
        $page = 1;

        do {
            $response = $this->http()->get(ltrim($endpoint, '/'), $query + ['per_page' => $perPage, 'page' => $page]);
            $response->throw();

            foreach ($response->json() ?? [] as $row) {
                yield $row;
            }

            $totalPages = (int) $response->header('X-WP-TotalPages');
            $page++;
        } while ($page <= $totalPages);
    }
}
