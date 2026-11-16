<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WooOrder;
use App\Models\WooOrderItem;
use App\Models\WooProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TopProductsTest extends TestCase
{
    use RefreshDatabase;

    public function test_top_products_include_local_id_image_and_total_sales(): void
    {
        $this->actingAs(User::factory()->create(), 'api');

        $product = WooProduct::create([
            'woo_id' => 10, 'name' => 'Shirt', 'slug' => 'shirt', 'type' => 'simple', 'status' => 'publish',
            'sku' => 'SH-1', 'image_url' => 'https://shop.test/shirt.jpg', 'stock_status' => 'instock',
        ]);
        WooOrder::create(['woo_id' => 1, 'number' => '1', 'status' => 'completed', 'currency' => 'INR', 'total' => '200']);
        WooOrderItem::create(['order_woo_id' => 1, 'woo_item_id' => 1, 'product_woo_id' => 10, 'name' => 'Shirt', 'quantity' => 2, 'total' => '200']);
        // Item whose product is not in the local copy: still listed, no image.
        WooOrderItem::create(['order_woo_id' => 1, 'woo_item_id' => 2, 'product_woo_id' => 99, 'name' => 'Gone', 'quantity' => 1, 'total' => '50']);

        $res = $this->getJson('/api/v1/dashboard/top-products')->assertOk();

        $res->assertJsonPath('0.id', $product->id)
            ->assertJsonPath('0.total_sales', 2)
            ->assertJsonPath('0.image_url', 'https://shop.test/shirt.jpg')
            ->assertJsonPath('0.sku', 'SH-1')
            ->assertJsonPath('1.id', 99)
            ->assertJsonPath('1.image_url', null);
    }
}
