<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WooProduct;
use App\Services\WooCommerce\StockRules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** "Low stock" is WooCommerce's rule (the product's own level, else the store-wide one). Never a guess. */
class StockRulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::forget('woo.low_stock_amount');
        $this->actingAs(User::factory()->create(), 'api');
    }

    private function product(int $wooId, int $qty, array $extra = [], ?int $ownLevel = null): WooProduct
    {
        return WooProduct::create($extra + [
            'woo_id' => $wooId, 'name' => "P{$wooId}", 'slug' => "p{$wooId}", 'type' => 'simple', 'status' => 'publish',
            'manage_stock' => true, 'stock_quantity' => $qty, 'stock_status' => $qty > 0 ? 'instock' : 'outofstock',
            'raw' => $ownLevel === null ? [] : ['low_stock_amount' => $ownLevel],
        ]);
    }

    public function test_with_no_known_rule_nothing_is_called_low_stock(): void
    {
        $this->product(1, 1);
        $this->product(2, 5);

        $this->assertNull(StockRules::globalThreshold());
        $this->assertCount(0, StockRules::lowStockProducts());

        $report = $this->getJson('/api/v1/reports/stock')->assertOk();
        $report->assertJsonPath('threshold', null)->assertJsonPath('low_stock_count', 0);

        $types = collect($this->getJson('/api/v1/notifications')->json('data'))->pluck('type');
        $this->assertNotContains('low_stock', $types->all());
    }

    public function test_the_store_wide_level_is_read_from_woocommerce(): void
    {
        config(['woocommerce.base_url' => 'https://shop.test', 'woocommerce.consumer_key' => 'ck', 'woocommerce.consumer_secret' => 'cs']);
        Http::fake(['shop.test/wp-json/wc/v3/settings/products/woocommerce_notify_low_stock_amount' => Http::response(['id' => 'woocommerce_notify_low_stock_amount', 'value' => '3'])]);

        StockRules::capture(app(\App\Services\WooCommerce\WooClient::class));

        $this->assertSame(3, StockRules::globalThreshold());
        Http::assertNotSent(fn ($r) => $r->method() !== 'GET');
    }

    public function test_products_are_low_by_their_own_level_else_the_store_wide_one(): void
    {
        Cache::forever('woo.low_stock_amount', 3);

        $this->product(1, 3);                      // at the store-wide level: low
        $this->product(2, 4);                      // above it: fine
        $this->product(3, 8, [], 10);              // own level 10 wins: low although 8 > 3
        $this->product(4, 2, [], 1);               // own level 1 wins: fine although 2 <= 3
        $this->product(5, 0);                      // out of stock is its own state, not "low"
        $this->product(6, 2, ['manage_stock' => false]); // not tracked: no quantity to judge
        $this->product(7, 2, ['status' => 'draft']);     // not published

        $low = StockRules::lowStockProducts()->pluck('woo_id')->sort()->values()->all();

        $this->assertSame([1, 3], $low);
    }

    public function test_the_api_reports_the_same_rule(): void
    {
        Cache::forever('woo.low_stock_amount', 3);
        $this->product(1, 3);
        $this->product(2, 4);
        $this->product(5, 0);

        $report = $this->getJson('/api/v1/reports/stock')->assertOk();
        $report->assertJsonPath('threshold', 3)
            ->assertJsonPath('low_stock_count', 1)
            ->assertJsonPath('out_of_stock_count', 1)
            ->assertJsonPath('low_stock.0.woo_id', 1);

        $this->getJson('/api/v1/dashboard/summary')->assertOk()->assertJsonPath('low_stock_threshold', 3);

        $alerts = collect($this->getJson('/api/v1/notifications')->json('data'));
        $this->assertSame(1, $alerts->where('type', 'low_stock')->count());
        $this->assertSame(1, $alerts->where('type', 'out_of_stock')->count());
    }

    public function test_a_products_own_level_is_returned_with_its_details(): void
    {
        $p = $this->product(1, 8, [], 10);
        $none = $this->product(2, 8);

        $this->getJson("/api/v1/products/{$p->id}")->assertOk()->assertJsonPath('low_stock_amount', 10);
        $this->getJson("/api/v1/products/{$none->id}")->assertOk()->assertJsonPath('low_stock_amount', null);
    }

    public function test_the_import_remembers_the_level(): void
    {
        config(['woocommerce.base_url' => 'https://shop.test', 'woocommerce.consumer_key' => 'ck', 'woocommerce.consumer_secret' => 'cs']);
        Http::fake([
            'shop.test/wp-json/wc/v3/settings/*' => Http::response(['id' => 'woocommerce_notify_low_stock_amount', 'value' => '2']),
            'shop.test/wp-json/wc/v3/*' => Http::response([]),
        ]);

        $this->postJson('/api/v1/sync')->assertOk()->assertJsonPath('ok', true);

        $this->assertSame(2, StockRules::globalThreshold());
    }

    public function test_the_import_still_works_when_the_level_cannot_be_read(): void
    {
        config(['woocommerce.base_url' => 'https://shop.test', 'woocommerce.consumer_key' => 'ck', 'woocommerce.consumer_secret' => 'cs']);
        Http::fake([
            'shop.test/wp-json/wc/v3/settings/*' => Http::response(['message' => 'nope'], 500),
            'shop.test/wp-json/wc/v3/*' => Http::response([]),
        ]);

        $this->postJson('/api/v1/sync')->assertOk()->assertJsonPath('ok', true);

        $this->assertNull(StockRules::globalThreshold());
    }
}
