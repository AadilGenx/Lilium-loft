<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

/**
 * Creates (or repairs) the administrator account, so a fresh deploy needs no manual commands.
 *
 * The admin can sign in to the web app and to the /admin panel, and is allowed to make changes to the
 * store (`can_write`). Whether changes are actually switched on is a separate choice made in the web app
 * under Settings → Store changes; everything stays OFF until then.
 *
 * Safe to run on every deploy:
 *  - creates the admin if missing,
 *  - if it already exists, makes sure it still has full access, but leaves the password alone
 *    (unless ADMIN_RESET_PASSWORD=true).
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) config('admin.email');
        $password = (string) config('admin.password');

        if ($email === '') {
            // Already set up on a previous deploy: nothing to do. Otherwise there would be no way in.
            if (User::where('can_write', true)->exists()) {
                $this->info('ADMIN_EMAIL is not set; an administrator already exists, so nothing was changed.');

                return;
            }

            throw new RuntimeException('No administrator exists yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in the .env file, then run the seeder again.');
        }

        $validator = Validator::make(['email' => $email], ['email' => 'required|email|max:255']);
        if ($validator->fails()) {
            throw new RuntimeException('ADMIN_EMAIL is not a valid e-mail address.');
        }

        $admin = User::where('email', $email)->first();

        if (! $admin) {
            $this->requireStrong($password, 'create the administrator');

            $admin = new User;
            $admin->forceFill([
                'name' => (string) config('admin.name'),
                'email' => $email,
                'password' => $password, // hashed by the model
                'email_verified_at' => now(),
                'can_write' => true,
            ])->save();

            $this->info("Administrator created: {$email}");

            return;
        }

        $admin->forceFill([
            'can_write' => true,
            'email_verified_at' => $admin->email_verified_at ?? now(),
        ]);

        if (config('admin.reset_password')) {
            $this->requireStrong($password, 'reset the administrator password');
            $admin->forceFill(['password' => $password]);
            $this->info("Administrator password reset: {$email} (set ADMIN_RESET_PASSWORD back to false).");
        }

        $admin->save();
        $this->info("Administrator already exists, access confirmed: {$email}");
    }

    private function requireStrong(string $password, string $action): void
    {
        if ($password === '') {
            throw new RuntimeException("ADMIN_PASSWORD is not set, so the seeder cannot {$action}.");
        }
    }

    private function info(string $message): void
    {
        $this->command?->info($message);
    }
}
