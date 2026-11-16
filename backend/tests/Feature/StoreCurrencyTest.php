<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WooOrder;
use App\Services\WooCommerce\StoreCurrency;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** The currency is WooCommerce's, never assumed. */
class StoreCurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::forget('woo.currency');
        $this->actingAs(User::factory()->create(), 'api');
    }

    private function configure(): void
    {
        config(['woocommerce.base_url' => 'https://shop.test', 'woocommerce.consumer_key' => 'ck', 'woocommerce.consumer_secret' => 'cs']);
    }

    public function test_unknown_until_woocommerce_or_an_order_says_so(): void
    {
        $this->assertNull(StoreCurrency::current());
        $this->getJson('/api/v1/dashboard/summary')->assertOk()->assertJsonPath('currency', null);
    }

    public function test_the_currency_setting_is_read_from_woocommerce_on_import_even_with_no_orders(): void
    {
        $this->configure();
        Http::fake([
            'shop.test/wp-json/wc/v3/settings/general/woocommerce_currency' => Http::response(['id' => 'woocommerce_currency', 'value' => 'inr']),
            'shop.test/wp-json/wc/v3/*' => Http::response([]),
        ]);

        $this->postJson('/api/v1/sync')->assertOk();

        $this->assertSame('INR', StoreCurrency::current());
        $this->getJson('/api/v1/dashboard/summary')->assertOk()->assertJsonPath('currency', 'INR');
        Http::assertNotSent(fn ($r) => $r->method() !== 'GET');
    }

    public function test_the_setting_wins_over_an_old_orders_currency(): void
    {
        WooOrder::create(['woo_id' => 1, 'number' => '1', 'status' => 'completed', 'currency' => 'USD', 'total' => '5', 'woo_created_at' => now()]);
        $this->assertSame('USD', StoreCurrency::current()); // no setting yet: the latest order

        Cache::forever('woo.currency', 'INR');

        $this->assertSame('INR', StoreCurrency::current());
    }

    public function test_a_garbage_value_is_ignored(): void
    {
        $this->configure();
        Http::fake(['shop.test/wp-json/wc/v3/settings/general/woocommerce_currency' => Http::response(['value' => '<script>'])]);

        StoreCurrency::capture(app(\App\Services\WooCommerce\WooClient::class));

        $this->assertNull(StoreCurrency::current());
    }
}
