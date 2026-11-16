<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WooWriteAudit;
use App\Models\WriteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WriteSettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_everyone_signed_in_can_read_the_switches_and_all_start_off(): void
    {
        $this->actingAs(User::factory()->create(['can_write' => false]), 'api');

        $res = $this->getJson('/api/v1/write-settings')->assertOk();

        $res->assertJsonPath('can_manage', false)
            ->assertJsonPath('master.enabled', false)
            ->assertJsonPath('permanent_delete.enabled', false);
        $this->assertNotEmpty($res->json('capabilities'));
        $this->assertSame([], array_values(array_filter($res->json('capabilities'), fn ($c) => $c['enabled'])));
        $this->assertContains('products.create', array_column($res->json('capabilities'), 'key'));
        $this->assertSame('products', collect($res->json('capabilities'))->firstWhere('key', 'products.create')['group']);
    }

    public function test_a_user_who_may_not_write_cannot_flip_anything(): void
    {
        $this->actingAs(User::factory()->create(['can_write' => false]), 'api');

        $this->putJson('/api/v1/write-settings/master', ['enabled' => true])->assertStatus(403);

        $this->assertFalse(WriteSetting::isOn('master'));
        $this->assertSame(0, WooWriteAudit::where('resource', 'write_settings')->count());
    }

    public function test_a_permitted_user_can_flip_a_switch_and_it_is_audited(): void
    {
        $user = User::factory()->create(['can_write' => true]);
        $this->actingAs($user, 'api');

        $this->putJson('/api/v1/write-settings/master', ['enabled' => true])
            ->assertOk()->assertJsonPath('master.enabled', true);

        $this->assertTrue(WriteSetting::isOn('master'));
        $audit = WooWriteAudit::where('resource', 'write_settings')->first();
        $this->assertSame($user->id, $audit->user_id);
        $this->assertSame('enable', $audit->action);
        $this->assertSame(['key' => 'master', 'enabled' => true], $audit->request);

        $this->putJson('/api/v1/write-settings/master', ['enabled' => false])->assertOk()->assertJsonPath('master.enabled', false);
        $this->assertSame('disable', WooWriteAudit::where('resource', 'write_settings')->latest('id')->first()->action);
    }

    public function test_setting_the_same_value_again_is_not_logged_twice(): void
    {
        $this->actingAs(User::factory()->create(['can_write' => true]), 'api');

        $this->putJson('/api/v1/write-settings/master', ['enabled' => false])->assertOk();

        $this->assertSame(0, WooWriteAudit::where('resource', 'write_settings')->count());
    }

    public function test_validation_and_unknown_keys(): void
    {
        $this->actingAs(User::factory()->create(['can_write' => true]), 'api');

        $this->putJson('/api/v1/write-settings/master', [])->assertStatus(422);
        $this->putJson('/api/v1/write-settings/master', ['enabled' => 'maybe'])->assertStatus(422);
        $this->putJson('/api/v1/write-settings/not.a.switch', ['enabled' => true])->assertStatus(404);
    }

    public function test_requires_login(): void
    {
        $this->getJson('/api/v1/write-settings')->assertStatus(401);
        $this->putJson('/api/v1/write-settings/master', ['enabled' => true])->assertStatus(401);
    }

    public function test_changing_the_store_needs_no_env_flag_only_the_switches_set_in_the_app(): void
    {
        config(['woocommerce.base_url' => 'https://shop.test', 'woocommerce.consumer_key' => 'ck', 'woocommerce.consumer_secret' => 'cs']);
        $this->actingAs(User::factory()->create(['can_write' => true]), 'api');
        Http::fake(['shop.test/wp-json/wc/v3/products/categories' => Http::response(['id' => 9, 'name' => 'Sale', 'slug' => 'sale', 'parent' => 0, 'count' => 0], 201)]);

        // Everything is off: blocked, with a message that says where to turn it on.
        $this->postJson('/api/v1/categories', ['name' => 'Sale'])->assertStatus(403)
            ->assertJsonPath('code', 'writes_disabled')
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'Settings'));
        Http::assertNothingSent();

        // Master alone is not enough: the specific action must be on too.
        $this->putJson('/api/v1/write-settings/master', ['enabled' => true])->assertOk();
        $this->postJson('/api/v1/categories', ['name' => 'Sale'])->assertStatus(403);

        $this->putJson('/api/v1/write-settings/categories.create', ['enabled' => true])->assertOk();
        $this->postJson('/api/v1/categories', ['name' => 'Sale'])->assertStatus(201);

        // Switching the master off stops it again straight away.
        $this->putJson('/api/v1/write-settings/master', ['enabled' => false])->assertOk();
        $this->postJson('/api/v1/categories', ['name' => 'Sale'])->assertStatus(403);
    }
}
