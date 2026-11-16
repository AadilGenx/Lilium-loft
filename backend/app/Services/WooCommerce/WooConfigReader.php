<?php

namespace App\Services\WooCommerce;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Reads store configuration (shipping, settings, payment gateways) live from
 * WooCommerce with GET only, and caches it briefly.
 *
 * Secrets are removed BEFORE the data is cached or returned, so API keys and
 * passwords never reach the cache table or an API response.
 */
final class WooConfigReader
{
    /** Field ids / keys whose values must never be exposed. */
    private const SECRET_NAME = '/(secret|key|token|passw|pwd|private|signature|credential|salt|webhook)/i';

    private const MASK = '********';

    public function __construct(private WooClient $woo) {}

    /**
     * @throws NotFoundHttpException when WooCommerce answers 404
     * @throws UpstreamUnavailable for any other failure
     */
    public function fetch(string $endpoint, array $query = []): array
    {
        $load = fn () => $this->clean($this->load($endpoint, $query));

        $ttl = (int) config('woocommerce.config_cache_ttl');

        return $ttl > 0
            ? Cache::remember($this->cacheKey($endpoint, $query), $ttl, $load)
            : $load();
    }

    /**
     * Several reads at once. Cached ones are served from the cache; the rest are fetched in parallel.
     * A WooCommerce 404 gives null for that entry (e.g. a zone without a region list).
     *
     * @param  array<string, string>  $endpoints  key => endpoint
     * @return array<string, array|null>
     *
     * @throws UpstreamUnavailable
     */
    public function fetchMany(array $endpoints): array
    {
        $ttl = (int) config('woocommerce.config_cache_ttl');
        $out = [];
        $missing = [];

        foreach ($endpoints as $key => $endpoint) {
            $hit = $ttl > 0 ? Cache::get($this->cacheKey($endpoint, [])) : null;
            if (is_array($hit)) {
                $out[$key] = $hit['missing'] ?? false ? null : $hit['data'];
            } else {
                $missing[$key] = $endpoint;
            }
        }

        try {
            $responses = $this->woo->getMany($missing);
        } catch (WooNotConfigured $e) {
            throw new UpstreamUnavailable(WooErrors::describe($e, 'read config'));
        }

        foreach ($missing as $key => $endpoint) {
            $r = $responses[$key] ?? null;

            if ($r instanceof \Throwable) {
                throw new UpstreamUnavailable(WooErrors::describe($r, "read {$endpoint}"));
            }
            if ($r->status() === 404) {
                $out[$key] = null;
                $entry = ['missing' => true, 'data' => null];
            } elseif ($r->failed()) {
                throw new UpstreamUnavailable(WooErrors::describe($r->toException() ?? new \RuntimeException('Request failed'), "read {$endpoint}"));
            } else {
                $out[$key] = $this->clean($r->json() ?? []);
                $entry = ['missing' => false, 'data' => $out[$key]];
            }

            if ($ttl > 0) {
                Cache::put($this->cacheKey($endpoint, []), $entry, $ttl);
            }
        }

        return $out;
    }

    /** True when a setting/field id looks like a credential (writes to these are refused). */
    public static function looksSecret(string $id): bool
    {
        return preg_match(self::SECRET_NAME, $id) === 1;
    }

    /** Forget every cached read (called after a change so the next GET is fresh). */
    public function flush(): void
    {
        Cache::forever('woo-config:generation', $this->generation() + 1);
    }

    private function cacheKey(string $endpoint, array $query): string
    {
        return 'woo-config:'.$this->generation().':'.md5($endpoint.json_encode($query));
    }

    private function generation(): int
    {
        return (int) Cache::get('woo-config:generation', 1);
    }

    private function load(string $endpoint, array $query): array
    {
        try {
            return $this->woo->get($endpoint, $query);
        } catch (RequestException $e) {
            if ($e->response->status() === 404) {
                throw new NotFoundHttpException('Not found in WooCommerce.');
            }

            throw new UpstreamUnavailable(WooErrors::describe($e, "read {$endpoint}"));
        } catch (ConnectionException|WooNotConfigured $e) {
            throw new UpstreamUnavailable(WooErrors::describe($e, "read {$endpoint}"));
        }
    }

    /** Strip HATEOAS links and mask secret values, at any depth. */
    private function clean(array $data): array
    {
        unset($data['_links']);

        // A WooCommerce setting object: {id, label, type, value, default, ...}
        if (array_key_exists('id', $data) && array_key_exists('value', $data) && $this->isSecretSetting($data)) {
            foreach (['value', 'default'] as $field) {
                if (array_key_exists($field, $data) && $data[$field] !== '' && $data[$field] !== null && $data[$field] !== []) {
                    $data[$field] = self::MASK;
                }
            }
            $data['redacted'] = true;
        }

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->clean($value);
            } elseif (is_string($key) && preg_match(self::SECRET_NAME, $key) && is_scalar($value) && $value !== '' && $value !== false) {
                // Plain key/value form, e.g. "api_key": "abc".
                $data[$key] = self::MASK;
            }
        }

        return $data;
    }

    private function isSecretSetting(array $setting): bool
    {
        return ($setting['type'] ?? null) === 'password'
            || preg_match(self::SECRET_NAME, (string) $setting['id']) === 1;
    }
}
