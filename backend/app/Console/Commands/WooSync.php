<?php

namespace App\Console\Commands;

use App\Services\WooCommerce\WooSyncService;
use Illuminate\Console\Command;

class WooSync extends Command
{
    protected $signature = 'woo:sync
        {resource?* : categories, products, customers, orders, coupons (default: all)}
        {--since= : Only fetch products/orders modified after this ISO date}';

    protected $description = 'Read-only import of WooCommerce data into the local mirror';

    public function handle(WooSyncService $sync): int
    {
        $resources = $this->argument('resource') ?: WooSyncService::RESOURCES;
        $failed = false;

        foreach ($resources as $resource) {
            if (! in_array($resource, WooSyncService::RESOURCES, true)) {
                $this->error("Unknown resource: {$resource}");
                $failed = true;

                continue;
            }

            try {
                $since = $this->option('since')
                    ? \Illuminate\Support\Carbon::parse($this->option('since'), 'UTC')->utc()->format('Y-m-d\TH:i:s')
                    : null;
                $n = $sync->sync($resource, $since);
                $this->info("{$resource}: {$n} synced");
            } catch (\Throwable $e) {
                $this->error("{$resource}: failed - {$e->getMessage()}");
                $failed = true;
            }
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
