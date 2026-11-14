<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Read-only pull from WooCommerce. Incremental for the big tables, full for the small ones.
Illuminate\Support\Facades\Schedule::command('woo:sync products orders --since="-2 hours"')->hourly()->withoutOverlapping();
Illuminate\Support\Facades\Schedule::command('woo:sync categories customers coupons')->dailyAt('03:00')->withoutOverlapping();
