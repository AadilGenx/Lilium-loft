<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // On/off switches for write features. Every row is created DISABLED.
        Schema::create('write_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->boolean('enabled')->default(false);
            $table->timestamps();
        });

        $now = now();
        DB::table('write_settings')->insert([
            ['key' => 'master', 'label' => 'Allow writes to WooCommerce (master switch)', 'enabled' => false, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'products.update', 'label' => 'Products: update price and stock', 'enabled' => false, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'permanent_delete', 'label' => 'Allow permanent deletion (force delete)', 'enabled' => false, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // Who may use write endpoints at all (in addition to the switches above).
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_write')->default(false)->after('password');
        });

        // Every attempted write, including blocked and failed ones.
        Schema::create('woo_write_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('resource', 40);
            $table->string('action', 20);
            $table->unsignedBigInteger('woo_id')->nullable();
            $table->string('status', 20); // pending | success | failed
            $table->json('request')->nullable();
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->text('error')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            $table->index(['resource', 'woo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('woo_write_audits');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('can_write');
        });
        Schema::dropIfExists('write_settings');
    }
};
