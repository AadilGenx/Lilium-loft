<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('woo_categories', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('woo_id')->unique();
            $t->unsignedBigInteger('parent_woo_id')->default(0);
            $t->string('name');
            $t->string('slug');
            $t->unsignedInteger('products_count')->default(0);
            $t->string('image_url', 500)->nullable();
            $t->timestamps();
        });

        Schema::create('woo_products', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('woo_id')->unique();
            $t->string('name');
            $t->string('slug');
            $t->string('type', 30)->index();
            $t->string('status', 30)->index();
            $t->string('sku')->nullable()->index();
            $t->decimal('price', 12, 2)->nullable();
            $t->decimal('regular_price', 12, 2)->nullable();
            $t->decimal('sale_price', 12, 2)->nullable();
            $t->boolean('on_sale')->default(false);
            $t->string('stock_status', 30)->index();
            $t->boolean('manage_stock')->default(false);
            $t->integer('stock_quantity')->nullable();
            $t->unsignedInteger('total_sales')->default(0);
            $t->decimal('average_rating', 4, 2)->default(0);
            $t->unsignedInteger('rating_count')->default(0);
            $t->string('image_url', 500)->nullable();
            $t->string('permalink', 500)->nullable();
            $t->timestamp('woo_created_at')->nullable();
            $t->timestamp('woo_modified_at')->nullable();
            $t->json('raw')->nullable();
            $t->timestamps();
        });

        Schema::create('woo_category_product', function (Blueprint $t) {
            $t->unsignedBigInteger('product_woo_id');
            $t->unsignedBigInteger('category_woo_id');
            $t->primary(['product_woo_id', 'category_woo_id']);
            $t->index('category_woo_id');
        });

        Schema::create('woo_customers', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('woo_id')->unique();
            $t->string('email')->nullable()->index();
            $t->string('first_name')->nullable();
            $t->string('last_name')->nullable();
            $t->string('username')->nullable();
            $t->string('role', 50)->nullable();
            $t->string('phone', 50)->nullable();
            $t->string('city')->nullable();
            $t->string('state')->nullable();
            $t->string('country', 10)->nullable();
            $t->unsignedInteger('orders_count')->default(0);
            $t->decimal('total_spent', 14, 2)->default(0);
            $t->timestamp('woo_created_at')->nullable();
            $t->json('raw')->nullable();
            $t->timestamps();
        });

        Schema::create('woo_orders', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('woo_id')->unique();
            $t->string('number')->index();
            $t->string('status', 30)->index();
            $t->string('currency', 10)->default('INR');
            $t->decimal('total', 14, 2)->default(0);
            $t->decimal('discount_total', 14, 2)->default(0);
            $t->decimal('shipping_total', 14, 2)->default(0);
            $t->decimal('total_tax', 14, 2)->default(0);
            $t->string('payment_method', 100)->nullable();
            $t->string('payment_method_title')->nullable();
            $t->string('transaction_id')->nullable();
            $t->unsignedBigInteger('customer_woo_id')->default(0)->index();
            $t->string('billing_name')->nullable();
            $t->string('billing_email')->nullable();
            $t->string('billing_phone', 50)->nullable();
            $t->string('billing_city')->nullable();
            $t->string('billing_state')->nullable();
            $t->string('shipping_city')->nullable();
            $t->string('shipping_state')->nullable();
            $t->text('customer_note')->nullable();
            $t->json('coupon_codes')->nullable();
            $t->timestamp('woo_created_at')->nullable()->index();
            $t->timestamp('woo_paid_at')->nullable();
            $t->timestamp('woo_completed_at')->nullable();
            $t->json('raw')->nullable();
            $t->timestamps();
        });

        Schema::create('woo_order_items', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('order_woo_id')->index();
            $t->unsignedBigInteger('woo_item_id');
            $t->unsignedBigInteger('product_woo_id')->default(0)->index();
            $t->unsignedBigInteger('variation_woo_id')->default(0);
            $t->string('name');
            $t->string('sku')->nullable();
            $t->unsignedInteger('quantity')->default(1);
            $t->decimal('subtotal', 14, 2)->default(0);
            $t->decimal('total', 14, 2)->default(0);
            $t->unique(['order_woo_id', 'woo_item_id']);
        });

        Schema::create('woo_coupons', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('woo_id')->unique();
            $t->string('code')->index();
            $t->string('status', 30)->nullable();
            $t->string('discount_type', 30)->nullable();
            $t->decimal('amount', 12, 2)->default(0);
            $t->unsignedInteger('usage_count')->default(0);
            $t->unsignedInteger('usage_limit')->nullable();
            $t->boolean('free_shipping')->default(false);
            $t->timestamp('expires_at')->nullable();
            $t->timestamp('woo_created_at')->nullable();
            $t->json('raw')->nullable();
            $t->timestamps();
        });

        Schema::create('woo_sync_logs', function (Blueprint $t) {
            $t->id();
            $t->string('resource', 50)->index();
            $t->unsignedInteger('records')->default(0);
            $t->string('status', 20);
            $t->text('error')->nullable();
            $t->timestamp('started_at');
            $t->timestamp('finished_at')->nullable();
        });
    }

    public function down(): void
    {
        foreach (['woo_sync_logs', 'woo_coupons', 'woo_order_items', 'woo_orders', 'woo_customers', 'woo_category_product', 'woo_products', 'woo_categories'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
