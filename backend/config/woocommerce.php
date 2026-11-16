<?php

return [
    'base_url' => rtrim(env('WOO_BASE_URL', ''), '/'),
    'consumer_key' => env('WOO_CONSUMER_KEY'),
    'consumer_secret' => env('WOO_CONSUMER_SECRET'),
    'webhook_secret' => env('WOO_WEBHOOK_SECRET'),
    // Optional path to a CA bundle (useful on Windows where PHP has no default one).
    'ca_bundle' => env('WOO_CA_BUNDLE'),
    'per_page' => 100,
    'timeout' => 30,

    // Store configuration (shipping, settings, payment gateways) is read live from
    // WooCommerce with GET and cached this many seconds. 0 disables the cache.
    'config_cache_ttl' => (int) env('WOO_CONFIG_CACHE_TTL', 300),

    // Products at or below this stock level count as "low stock".
    'low_stock_threshold' => (int) env('WOO_LOW_STOCK_THRESHOLD', 5),
];
