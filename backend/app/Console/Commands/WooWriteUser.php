<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/** Grants or revokes permission to use write endpoints. Local database only. */
class WooWriteUser extends Command
{
    protected $signature = 'woo:write-user {email : The admin user\'s email} {--revoke : Remove write permission instead of granting it}';

    protected $description = 'Grant or revoke a user\'s permission to change WooCommerce through the API (no WooCommerce call is made)';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();
        if (! $user) {
            $this->error('No user with that email.');

            return self::FAILURE;
        }

        $user->can_write = ! $this->option('revoke');
        $user->save();

        $this->info(($user->can_write ? 'Granted' : 'Revoked')." write permission for {$user->email}.");
        $this->line('Writes still stay blocked until WOO_WRITES_ALLOWED=true and the switches are turned on.');

        return self::SUCCESS;
    }
}
