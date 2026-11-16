<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AdminSeeder;
use Database\Seeders\DatabaseSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class AdminSeederTest extends TestCase
{
    use RefreshDatabase;

    private function configure(array $values = []): void
    {
        config(['admin' => array_merge([
            'name' => 'Site Owner',
            'email' => 'owner@client.test',
            'password' => 'a-long-secret-pass',
            'reset_password' => false,
        ], $values)]);
    }

    public function test_it_creates_an_administrator_with_full_access(): void
    {
        $this->configure();

        $this->seed(AdminSeeder::class);

        $admin = User::where('email', 'owner@client.test')->first();
        $this->assertNotNull($admin);
        $this->assertSame('Site Owner', $admin->name);
        $this->assertTrue($admin->can_write);
        $this->assertNotNull($admin->email_verified_at);
        $this->assertTrue(Hash::check('a-long-secret-pass', $admin->password));
        $this->assertNotSame('a-long-secret-pass', $admin->getRawOriginal('password'));
    }

    public function test_the_admin_can_sign_in_to_the_web_app_api_and_may_make_changes(): void
    {
        $this->configure();
        $this->seed(AdminSeeder::class);

        $this->postJson('/api/v1/auth/login', ['email' => 'owner@client.test', 'password' => 'a-long-secret-pass'])
            ->assertOk()->assertJsonStructure(['access_token']);

        $token = $this->postJson('/api/v1/auth/login', ['email' => 'owner@client.test', 'password' => 'a-long-secret-pass'])->json('access_token');
        app('auth')->forgetGuards();
        app()->forgetInstance('tymon.jwt');
        $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/v1/write-settings')
            ->assertOk()->assertJsonPath('can_manage', true);
    }

    public function test_the_admin_can_open_the_admin_panel_on_a_live_server(): void
    {
        $this->configure();
        $this->seed(AdminSeeder::class);
        $admin = User::where('email', 'owner@client.test')->first();

        // Outside a local environment Filament refuses everyone unless the user model allows it.
        $this->assertTrue($admin->canAccessPanel(Filament::getPanel('admin')));
        config(['app.env' => 'production']);
        $this->actingAs($admin)->get('/admin')->assertOk();
    }

    public function test_running_it_again_changes_nothing_and_keeps_the_password(): void
    {
        $this->configure();
        $this->seed(AdminSeeder::class);
        $hash = User::where('email', 'owner@client.test')->value('password');

        // The owner changes their password later, then a deploy re-runs the seeder with the old .env value.
        $this->configure(['password' => 'a-different-long-pass']);
        $this->seed(AdminSeeder::class);

        $this->assertSame(1, User::count());
        $this->assertSame($hash, User::where('email', 'owner@client.test')->value('password'));
    }

    public function test_a_demoted_admin_gets_full_access_back(): void
    {
        $this->configure();
        $this->seed(AdminSeeder::class);
        User::where('email', 'owner@client.test')->update(['can_write' => false]);

        $this->seed(AdminSeeder::class);

        $this->assertTrue(User::where('email', 'owner@client.test')->first()->can_write);
    }

    public function test_the_password_is_only_replaced_when_explicitly_asked(): void
    {
        $this->configure();
        $this->seed(AdminSeeder::class);

        $this->configure(['password' => 'brand-new-long-pass', 'reset_password' => true]);
        $this->seed(AdminSeeder::class);

        $this->assertTrue(Hash::check('brand-new-long-pass', User::where('email', 'owner@client.test')->value('password')));
    }

    public function test_it_refuses_a_missing_password(): void
    {
        $this->configure(['password' => '']);
        try {
            $this->seed(AdminSeeder::class);
            $this->fail('Expected an error');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('ADMIN_PASSWORD', $e->getMessage());
        }

        $this->assertSame(0, User::count());
    }

    public function test_with_no_email_it_fails_loudly_on_a_first_deploy_but_not_after(): void
    {
        $this->configure(['email' => null]);
        try {
            $this->seed(AdminSeeder::class);
            $this->fail('Expected an error');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('ADMIN_EMAIL', $e->getMessage());
        }

        User::factory()->create(['can_write' => true]);
        $this->seed(AdminSeeder::class); // an admin exists: quietly does nothing
        $this->assertSame(1, User::count());
    }

    public function test_the_database_seeder_runs_it_and_creates_no_demo_account(): void
    {
        $this->configure();

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(['owner@client.test'], User::pluck('email')->all());
    }
}
