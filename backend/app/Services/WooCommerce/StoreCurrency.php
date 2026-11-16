<?php

namespace App\Services\WooCommerce;

use App\Models\WooOrder;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * The store's currency, as WooCommerce has it (WooCommerce → Settings → General → Currency).
 *
 * It is read from WooCommerce during every import. Until that has happened, the currency of the most
 * recent order is used. If neither exists, it is unknown (null) and the app shows plain numbers:
 * a currency is never assumed.
 */
final class StoreCurrency
{
    private const KEY = 'woo.currency';

    public static function current(): ?string
    {
        $stored = Cache::get(self::KEY);
        if (is_string($stored) && preg_match('/^[A-Z]{3}$/', $stored)) {
            return $stored;
        }

        return WooOrder::whereNotNull('currency')->orderByDesc('woo_created_at')->orderByDesc('id')->value('currency');
    }

    /** Read the currency from WooCommerce (GET) and remember it. Never throws. */
    public static function capture(WooClient $woo): void
    {
        try {
            $setting = $woo->get('settings/general/woocommerce_currency');
            $code = strtoupper((string) ($setting['value'] ?? ''));

            if (preg_match('/^[A-Z]{3}$/', $code)) {
                Cache::forever(self::KEY, $code);
            }
        } catch (Throwable $e) {
            WooErrors::describe($e, 'read the store currency');
        }
    }
}
