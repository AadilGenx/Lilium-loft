<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WooCoupon;
use App\Models\WooCustomer;
use App\Models\WooOrder;
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
}
