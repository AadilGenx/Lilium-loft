<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('woo_categories', function (Blueprint $t) {
            $t->text('description')->nullable()->after('slug');
        });
    }

    public function down(): void
    {
        Schema::table('woo_categories', function (Blueprint $t) {
            $t->dropColumn('description');
        });
    }
};
