<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WooCoupon;
use App\Models\WooCustomer;
use App\Models\WooOrder;
use App\Models\WooOrderItem;
use App\Models\WooProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The raw WooCommerce fields the admin forms need must come back from the read endpoints. */
class DetailFieldsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create(), 'api');
    }

    public function test_products_include_descriptions_and_gallery(): void
    {
        $p = WooProduct::create([
            'woo_id' => 1, 'name' => 'Shirt', 'slug' => 'shirt', 'type' => 'simple', 'status' => 'publish', 'stock_status' => 'instock',
            'raw' => [
                'description' => '<p>Long</p>', 'short_description' => 'Short', 'featured' => true,
                'images' => [['id' => 5, 'src' => 'https://shop.test/a.jpg', 'alt' => 'A']],
            ],
        ]);

        $this->getJson("/api/v1/products/{$p->id}")->assertOk()
            ->assertJsonPath('description', '<p>Long</p>')
            ->assertJsonPath('short_description', 'Short')
            ->assertJsonPath('featured', true)
            ->assertJsonPath('gallery.0.src', 'https://shop.test/a.jpg');

        $this->getJson('/api/v1/products')->assertOk()->assertJsonPath('data.0.description', '<p>Long</p>');
    }

    public function test_coupons_include_their_rules_and_empty_limits_are_null(): void
    {
        WooCoupon::create([
            'woo_id' => 2, 'code' => 'HELLO', 'status' => 'publish', 'discount_type' => 'percent', 'amount' => 10,
            'raw' => ['description' => 'Welcome', 'individual_use' => true, 'minimum_amount' => '500.00', 'maximum_amount' => '', 'exclude_sale_items' => true],
        ]);

        $this->getJson('/api/v1/coupons')->assertOk()
            ->assertJsonPath('data.0.description', 'Welcome')
            ->assertJsonPath('data.0.individual_use', true)
            ->assertJsonPath('data.0.minimum_amount', '500.00')
            ->assertJsonPath('data.0.maximum_amount', null)
            ->assertJsonPath('data.0.exclude_sale_items', true);
    }

    public function test_customers_and_orders_include_full_addresses(): void
    {
        $address = ['first_name' => 'Asha', 'address_1' => '12 Lake Rd', 'city' => 'Pune', 'postcode' => '411001', 'country' => 'IN'];
        $c = WooCustomer::create(['woo_id' => 3, 'email' => 'a@b.test', 'raw' => ['billing' => $address, 'shipping' => $address]]);
        $o = WooOrder::create(['woo_id' => 4, 'number' => '4', 'status' => 'processing', 'currency' => 'INR', 'total' => '10', 'raw' => ['billing' => $address, 'shipping' => []]]);

        $this->getJson("/api/v1/customers/{$c->id}")->assertOk()->assertJsonPath('billing.postcode', '411001');
        $this->getJson("/api/v1/orders/{$o->id}")->assertOk()
            ->assertJsonPath('billing.address_1', '12 Lake Rd')
            ->assertJsonPath('shipping', []);
    }

    public function test_raw_payload_itself_stays_hidden(): void
    {
        $p = WooProduct::create(['woo_id' => 9, 'name' => 'X', 'slug' => 'x', 'type' => 'simple', 'status' => 'publish', 'stock_status' => 'instock', 'raw' => ['secret_meta' => 'no']]);

        $this->assertArrayNotHasKey('raw', $this->getJson("/api/v1/products/{$p->id}")->json());
    }

    public function test_product_revenue_counts_only_paid_orders_and_is_zero_for_a_product_nobody_bought(): void
    {
        $sold = WooProduct::create(['woo_id' => 20, 'name' => 'Sold', 'slug' => 'sold', 'type' => 'simple', 'status' => 'publish', 'stock_status' => 'instock', 'total_sales' => 3]);
        $new = WooProduct::create(['woo_id' => 21, 'name' => 'Brand new private', 'slug' => 'new', 'type' => 'simple', 'status' => 'private', 'stock_status' => 'instock']);

        foreach ([[1, 'completed', '100.00'], [2, 'processing', '50.50'], [3, 'cancelled', '999.00'], [4, 'pending', '777.00']] as [$id, $status, $total]) {
            WooOrder::create(['woo_id' => $id, 'number' => (string) $id, 'status' => $status, 'currency' => 'INR', 'total' => $total]);
            WooOrderItem::create(['order_woo_id' => $id, 'woo_item_id' => $id, 'product_woo_id' => 20, 'name' => 'Sold', 'quantity' => 1, 'total' => $total]);
        }

        $this->getJson("/api/v1/products/{$sold->id}")->assertOk()
            ->assertJsonPath('revenue', 150.5)   // completed + processing only
            ->assertJsonPath('total_sales', 3);

        $this->getJson("/api/v1/products/{$new->id}")->assertOk()
            ->assertJsonPath('revenue', 0)
            ->assertJsonPath('total_sales', 0);

        $list = collect($this->getJson('/api/v1/products')->assertOk()->json('data'))->keyBy('woo_id');
        $this->assertSame(150.5, $list[20]['revenue']);
        $this->assertSame(0, $list[21]['revenue']);
    }

    public function test_dashboard_reports_the_store_currency_from_its_latest_order_and_null_when_unknown(): void
    {
        // No orders yet: the app must not be told a currency it cannot know.
        $this->getJson('/api/v1/dashboard/summary')->assertOk()->assertJsonPath('currency', null);

        WooOrder::create(['woo_id' => 1, 'number' => '1', 'status' => 'completed', 'currency' => 'EUR', 'total' => '5', 'woo_created_at' => now()->subDays(2)]);
        WooOrder::create(['woo_id' => 2, 'number' => '2', 'status' => 'completed', 'currency' => 'USD', 'total' => '5', 'woo_created_at' => now()->subDay()]);

        $this->getJson('/api/v1/dashboard/summary')->assertOk()->assertJsonPath('currency', 'USD');
    }
}
