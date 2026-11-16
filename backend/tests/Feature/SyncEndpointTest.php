<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class SyncEndpointTest extends TestCase
{
    use RefreshDatabase;

    private function configured(): void
    {
        config([
            'woocommerce.base_url' => 'https://shop.test',
            'woocommerce.consumer_key' => 'ck_test',
            'woocommerce.consumer_secret' => 'cs_test',
        ]);
    }

    public function test_requires_login(): void
    {
        $this->postJson('/api/v1/sync')->assertStatus(401);
    }

    public function test_imports_everything_and_saves_it(): void
    {
        $this->actingAs(User::factory()->create(), 'api');
        $this->configured();
        Http::fake([
            'shop.test/wp-json/wc/v3/products/categories*' => Http::response([['id' => 7, 'name' => 'Shirts', 'slug' => 'shirts', 'parent' => 0, 'count' => 1]]),
            'shop.test/wp-json/wc/v3/products*' => Http::response([['id' => 10, 'name' => 'Tee', 'slug' => 'tee', 'type' => 'simple', 'status' => 'publish', 'sku' => '', 'categories' => [['id' => 7]]]]),
            'shop.test/wp-json/wc/v3/customers*' => Http::response([['id' => 5, 'email' => 'a@b.test', 'first_name' => 'Asha', 'last_name' => '', 'username' => 'asha']]),
            'shop.test/wp-json/wc/v3/orders*' => Http::response([['id' => 50, 'number' => '50', 'status' => 'processing', 'currency' => 'INR', 'total' => '99', 'transaction_id' => '', 'customer_note' => '', 'line_items' => []]]),
            'shop.test/wp-json/wc/v3/coupons*' => Http::response([['id' => 3, 'code' => 'HI', 'status' => 'publish', 'discount_type' => 'percent', 'amount' => '10']]),
        ]);

        $res = $this->postJson('/api/v1/sync')->assertOk()->assertJsonPath('ok', true);

        $this->assertCount(5, $res->json('results'));
        $this->assertEqualsCanonicalizing([1, 1, 1, 1, 1], array_column($res->json('results'), 'records'));
        $this->assertDatabaseHas('woo_products', ['woo_id' => 10]);
        $this->assertDatabaseHas('woo_orders', ['woo_id' => 50]);
        $this->assertDatabaseHas('woo_customers', ['woo_id' => 5]);
        $this->assertDatabaseHas('woo_coupons', ['woo_id' => 3]);
        $this->assertDatabaseHas('woo_categories', ['woo_id' => 7]);
        // Strictly read-only towards WooCommerce.
        Http::assertNotSent(fn ($r) => $r->method() !== 'GET');
    }

    public function test_one_failing_resource_does_not_stop_the_others(): void
    {
        $this->actingAs(User::factory()->create(), 'api');
        $this->configured();
        Http::fake([
            'shop.test/wp-json/wc/v3/coupons*' => Http::response(['message' => 'boom'], 500),
            'shop.test/wp-json/wc/v3/*' => Http::response([]),
        ]);

        $res = $this->postJson('/api/v1/sync')->assertOk()->assertJsonPath('ok', false);

        $byResource = collect($res->json('results'))->keyBy('resource');
        $this->assertSame('failed', $byResource['coupons']['status']);
        $this->assertSame('ok', $byResource['products']['status']);
    }

    public function test_reports_502_when_woocommerce_is_not_configured(): void
    {
        $this->actingAs(User::factory()->create(), 'api');
        config(['woocommerce.consumer_key' => null, 'woocommerce.consumer_secret' => null, 'woocommerce.base_url' => 'https://shop.test']);
        Http::fake();

        Log::spy();

        $res = $this->postJson('/api/v1/sync')->assertStatus(502);

        $this->assertSame('WooCommerce is not configured.', $res->json('message'));
        // No setting names or credential hints in the response...
        $this->assertStringNotContainsString('WOO_', $res->getContent());
        $this->assertStringNotContainsString('CONSUMER', $res->getContent());
        // ...but the real reason is logged.
        Log::shouldHaveReceived('error')->withArgs(fn ($m, $ctx = []) => str_contains($ctx['message'] ?? '', 'WOO_CONSUMER_KEY'))->atLeast()->once();
        Http::assertNothingSent();
    }

    public function test_second_import_is_refused_while_one_is_running(): void
    {
        $this->actingAs(User::factory()->create(), 'api');
        $lock = Cache::lock('woo-sync-run', 60);
        $lock->get();

        $this->postJson('/api/v1/sync')->assertStatus(409);

        $lock->release();
    }
}
