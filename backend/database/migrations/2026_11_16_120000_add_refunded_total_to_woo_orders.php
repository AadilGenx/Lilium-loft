<?php

use App\Services\WooCommerce\OrderRefunds;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Sales figures must be net of refunds, so each order carries how much of it was refunded.
        Schema::table('woo_orders', function (Blueprint $table) {
            $table->decimal('refunded_total', 12, 2)->default(0)->after('total');
        });

        // Fill it for orders that are already stored, from the WooCommerce data kept with each one.
        DB::table('woo_orders')->select('id', 'raw')->orderBy('id')->chunkById(200, function ($orders) {
            foreach ($orders as $order) {
                $raw = is_string($order->raw) ? json_decode($order->raw, true) : (array) $order->raw;
                $refunded = OrderRefunds::total(is_array($raw) ? $raw : []);

                if ($refunded > 0) {
                    DB::table('woo_orders')->where('id', $order->id)->update(['refunded_total' => $refunded]);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('woo_orders', function (Blueprint $table) {
            $table->dropColumn('refunded_total');
        });
    }
};
