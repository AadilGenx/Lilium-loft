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
];
