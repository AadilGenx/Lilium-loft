<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // An order without a currency must stay "unknown", not be labelled rupees by a column default.
        Schema::table('woo_orders', function (Blueprint $table) {
            $table->string('currency', 10)->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('woo_orders', function (Blueprint $table) {
            $table->string('currency', 10)->default('INR')->change();
        });
    }
};
