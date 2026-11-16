<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Every new capability is created DISABLED. */
    private const CAPABILITIES = [
        'products.create' => 'Products: create',
        'products.delete' => 'Products: move to trash',
        'orders.update' => 'Orders: change status',
        'orders.note' => 'Orders: add notes',
        'orders.refund' => 'Orders: record refunds (never moves money)',
        'customers.create' => 'Customers: create',
        'customers.update' => 'Customers: update',
        'customers.delete' => 'Customers: delete (needs permanent deletion)',
        'categories.create' => 'Categories: create',
        'categories.update' => 'Categories: update',
        'categories.delete' => 'Categories: delete (needs permanent deletion)',
        'coupons.create' => 'Coupons: create',
        'coupons.update' => 'Coupons: update',
        'coupons.delete' => 'Coupons: move to trash',
        'shipping.manage' => 'Shipping: add, change and remove zone methods',
        'payments.update' => 'Payments: enable/disable and edit gateway text',
        'settings.update' => 'Settings: change store settings',
    ];

    public function up(): void
    {
        $now = now();
        DB::table('write_settings')->insert(array_map(
            fn (string $key, string $label) => ['key' => $key, 'label' => $label, 'enabled' => false, 'created_at' => $now, 'updated_at' => $now],
            array_keys(self::CAPABILITIES),
            self::CAPABILITIES,
        ));

        // Per-user "seen" state for the notification bell. Local only; WooCommerce is never involved.
        Schema::create('notification_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->index();
            $table->string('notification_id', 120);
            $table->timestamp('read_at')->useCurrent();

            $table->unique(['user_id', 'notification_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_reads');
        DB::table('write_settings')->whereIn('key', array_keys(self::CAPABILITIES))->delete();
    }
};
