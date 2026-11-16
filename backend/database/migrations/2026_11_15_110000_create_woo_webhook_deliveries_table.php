<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per webhook WooCommerce sends us. The payload itself is NOT stored here
        // (it can contain customer details); it only travels through the queue.
        Schema::create('woo_webhook_deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_id', 64)->nullable()->unique();
            $table->string('topic', 60);
            $table->string('resource', 20);
            $table->string('event', 20);
            $table->unsignedBigInteger('woo_id')->nullable();
            $table->string('status', 20)->default('received'); // received | processed | ignored | failed
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->text('error')->nullable();
            $table->timestamp('received_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['resource', 'woo_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('woo_webhook_deliveries');
    }
};
