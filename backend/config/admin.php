<?php

/*
 * The first administrator, created by `AdminSeeder` (run with `php artisan db:seed`).
 * Set these in the server's .env before the first deploy. The password is never stored in the code.
 */
return [
    'name' => env('ADMIN_NAME', 'Administrator'),
    'email' => env('ADMIN_EMAIL'),
    'password' => env('ADMIN_PASSWORD'),

    // Set to true for ONE deploy to replace the admin's password with ADMIN_PASSWORD (then set it back to false).
    // Without it, re-running the seeder never touches an existing admin's password.
    'reset_password' => (bool) env('ADMIN_RESET_PASSWORD', false),
];
