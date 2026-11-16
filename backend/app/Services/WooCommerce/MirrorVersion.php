<?php

namespace App\Services\WooCommerce;

use Illuminate\Support\Facades\Cache;

/**
 * A change counter per kind of mirrored record. It goes up whenever a record is stored or removed
 * (webhook, import or one of our own writes), so the admin panel can ask one cheap question
 * ("did anything change?") instead of reloading everything.
 *
 * The counters live in the cache, outside the database transaction on purpose: they are bumped only
 * after the data is committed, so a panel that reacts to a bump always sees the new data.
 */
final class MirrorVersion
{
    public const KINDS = ['products', 'orders', 'customers', 'coupons', 'categories'];

    public static function bump(string $kind): void
    {
        $key = self::key($kind);

        Cache::add($key, 0, now()->addDays(30));
        Cache::increment($key);
    }

    /** @return array<string, int> */
    public static function all(): array
    {
        $values = Cache::many(array_map(fn (string $k) => self::key($k), self::KINDS));

        $versions = [];
        foreach (self::KINDS as $kind) {
            $versions[$kind] = (int) ($values[self::key($kind)] ?? 0);
        }

        return $versions;
    }

    private static function key(string $kind): string
    {
        return "woo-mirror-version:{$kind}";
    }
}
