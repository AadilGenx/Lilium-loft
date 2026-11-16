<?php

namespace App\Services\WooCommerce;

/** How much of an order WooCommerce says has been refunded. */
final class OrderRefunds
{
    /**
     * Total refunded on an order, as a positive number. WooCommerce lists refunds on the order with negative
     * totals (e.g. "-50.00"); an order with no refunds returns 0.
     *
     * @param  array<string, mixed>  $order  the order as WooCommerce sends it
     */
    public static function total(array $order): float
    {
        $sum = 0.0;

        foreach ((array) ($order['refunds'] ?? []) as $refund) {
            $sum += abs((float) ($refund['total'] ?? 0));
        }

        return round($sum, 2);
    }
}
