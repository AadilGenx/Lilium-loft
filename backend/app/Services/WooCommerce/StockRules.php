<?php

namespace App\Services\WooCommerce;

use App\Models\WooProduct;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * What counts as "low stock" is decided by WooCommerce, not by this app:
 *  - each product can have its own "low stock threshold", otherwise
 *  - the store-wide setting (WooCommerce → Settings → Products → Inventory) applies.
 *
 * The store-wide value is read from WooCommerce during every import and remembered here. If it has never
 * been read (and a product has no threshold of its own), that product is simply not called "low stock".
 * Nothing is guessed.
 */
final class StockRules
{
    private const KEY = 'woo.low_stock_amount';

    public static function globalThreshold(): ?int
    {
        $value = Cache::get(self::KEY);

        return is_numeric($value) ? (int) $value : null;
    }

    /** Read the store-wide low-stock level from WooCommerce (GET) and remember it. Never throws. */
    public static function capture(WooClient $woo): void
    {
        try {
            $setting = $woo->get('settings/products/woocommerce_notify_low_stock_amount');

            if (is_numeric($setting['value'] ?? null)) {
                Cache::forever(self::KEY, (int) $setting['value']);
            }
        } catch (Throwable $e) {
            WooErrors::describe($e, 'read the low-stock level');
        }
    }

    /**
     * Published products that track stock and are at or below THEIR low-stock level (but not out of stock).
     *
     * @return Collection<int, WooProduct>
     */
    public static function lowStockProducts(): Collection
    {
        $global = self::globalThreshold();

        return WooProduct::where('status', 'publish')
            ->where('manage_stock', true)
            ->where('stock_quantity', '>', 0)
            ->where('stock_status', '!=', 'outofstock')
            ->get(['id', 'woo_id', 'name', 'sku', 'stock_quantity', 'stock_status', 'woo_modified_at', 'raw'])
            ->filter(function (WooProduct $p) use ($global) {
                $own = $p->raw['low_stock_amount'] ?? null;
                $threshold = is_numeric($own) && $own !== '' ? (int) $own : $global;

                return $threshold !== null && $p->stock_quantity <= $threshold;
            })
            ->values();
    }
}
