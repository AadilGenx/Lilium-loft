<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WooCategory;
use App\Models\WooCustomer;
use App\Models\WooOrder;
use App\Models\WooProduct;
use App\Models\WooWriteAudit;
use App\Models\WriteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class WriteEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'woocommerce.base_url' => 'https://shop.test',
            'woocommerce.consumer_key' => 'ck_test',
            'woocommerce.consumer_secret' => 'cs_test',
            'woocommerce.config_cache_ttl' => 0,
        ]);
    }

    private function writer(): User
    {
        $user = User::factory()->create(['can_write' => true]);
        $this->actingAs($user, 'api');

        return $user;
    }

    private function allow(string ...$keys): void
    {
        WriteSetting::whereIn('key', ['master', ...$keys])->update(['enabled' => true]);
    }

    private function product(array $attrs = []): WooProduct
    {
        return WooProduct::create($attrs + [
            'woo_id' => 10, 'name' => 'Old', 'slug' => 'old', 'type' => 'simple', 'status' => 'publish',
            'regular_price' => '100', 'price' => '100', 'stock_status' => 'instock',
        ]);
    }

    private function order(): WooOrder
    {
        return WooOrder::create([
            'woo_id' => 50, 'number' => '50', 'status' => 'processing', 'currency' => 'INR', 'total' => '500.00',
        ]);
    }

    public function test_every_new_write_is_blocked_while_switches_are_off(): void
    {
        $this->writer();
        Http::fake();
        $product = $this->product();
        $order = $this->order();

        $this->postJson('/api/v1/products', ['name' => 'X'])->assertStatus(403)->assertJson(['code' => 'writes_disabled']);
        $this->deleteJson("/api/v1/products/{$product->id}")->assertStatus(403);
        $this->putJson("/api/v1/orders/{$order->id}/status", ['status' => 'completed'])->assertStatus(403);
        $this->postJson("/api/v1/orders/{$order->id}/refunds", ['amount' => 10])->assertStatus(403);
        $this->putJson('/api/v1/settings/general', ['settings' => ['woocommerce_currency' => 'INR']])->assertStatus(403);
        $this->putJson('/api/v1/payments/cod', ['enabled' => false])->assertStatus(403);

        Http::assertNothingSent();
    }

    public function test_a_user_without_write_permission_is_blocked_even_with_switches_on(): void
    {
        $this->actingAs(User::factory()->create(['can_write' => false]), 'api');
        $this->allow('products.create');
        Http::fake();

        $this->postJson('/api/v1/products', ['name' => 'X'])->assertStatus(403);
        Http::assertNothingSent();
    }

    public function test_create_product_defaults_to_draft_and_updates_the_mirror(): void
    {
        $this->writer();
        $this->allow('products.create');
        WooCategory::create(['woo_id' => 7, 'name' => 'Shirts', 'slug' => 'shirts']);
        Http::fake(['shop.test/wp-json/wc/v3/products' => Http::response([
            'id' => 321, 'name' => 'Linen shirt', 'slug' => 'linen-shirt', 'sku' => '', 'type' => 'simple', 'status' => 'draft',
            'regular_price' => '499.00', 'price' => '499.00', 'stock_status' => 'instock', 'categories' => [['id' => 7, 'name' => 'Shirts', 'slug' => 'shirts']],
        ], 201)]);

        $this->postJson('/api/v1/products', ['name' => 'Linen shirt', 'regular_price' => 499, 'categories' => [7]])
            ->assertStatus(201)->assertJsonPath('woo_id', 321);

        Http::assertSent(fn (Request $r) => $r->method() === 'POST'
            && $r['status'] === 'draft' && $r['type'] === 'simple'
            && $r['regular_price'] === '499' && $r['categories'] === [['id' => 7]]);
        $this->assertDatabaseHas('woo_products', ['woo_id' => 321, 'name' => 'Linen shirt']);
        $this->assertDatabaseHas('woo_write_audits', ['resource' => 'products', 'action' => 'create', 'status' => 'success', 'woo_id' => 321]);
    }

    public function test_create_product_rejects_unknown_category_and_bad_sale_price(): void
    {
        $this->writer();
        $this->allow('products.create');
        Http::fake();

        $this->postJson('/api/v1/products', ['name' => 'X', 'categories' => [999]])->assertStatus(422);
        $this->postJson('/api/v1/products', ['name' => 'X', 'regular_price' => 10, 'sale_price' => 20])->assertStatus(422);
        Http::assertNothingSent();
    }

    public function test_product_update_accepts_the_wider_field_set(): void
    {
        $this->writer();
        $this->allow('products.update');
        $product = $this->product();
        Http::fake(['shop.test/wp-json/wc/v3/products/10' => Http::response([
            'id' => 10, 'name' => 'New name', 'slug' => 'old', 'type' => 'simple', 'status' => 'draft', 'sku' => 'S1',
            'regular_price' => '100', 'price' => '100', 'stock_status' => 'instock',
        ])]);

        $this->patchJson("/api/v1/products/{$product->id}", ['name' => 'New name', 'status' => 'draft', 'sku' => 'S1'])
            ->assertOk()->assertJsonPath('name', 'New name');

        Http::assertSent(fn (Request $r) => $r->method() === 'PUT' && $r['name'] === 'New name' && $r['status'] === 'draft');
    }

    public function test_deleting_a_product_trashes_it_and_removes_the_local_copy(): void
    {
        $this->writer();
        $this->allow('products.delete');
        $product = $this->product();
        Http::fake(['shop.test/wp-json/wc/v3/products/10*' => Http::response(['id' => 10])]);

        $this->deleteJson("/api/v1/products/{$product->id}")->assertStatus(204);

        Http::assertSent(fn (Request $r) => $r->method() === 'DELETE' && $r['force'] === false);
        $this->assertDatabaseMissing('woo_products', ['woo_id' => 10]);
    }

    public function test_deleting_a_customer_needs_the_permanent_delete_switch(): void
    {
        $this->writer();
        $this->allow('customers.delete');
        $customer = WooCustomer::create(['woo_id' => 5, 'email' => 'a@b.test']);
        Http::fake();

        $this->deleteJson("/api/v1/customers/{$customer->id}")->assertStatus(502);
        Http::assertNothingSent();
        $this->assertDatabaseHas('woo_customers', ['woo_id' => 5]);
        $this->assertDatabaseHas('woo_write_audits', ['resource' => 'customers', 'action' => 'delete', 'status' => 'failed']);

        $this->allow('permanent_delete');
        Http::fake(['shop.test/wp-json/wc/v3/customers/5*' => Http::response(['id' => 5])]);

        $this->deleteJson("/api/v1/customers/{$customer->id}")->assertStatus(204);
        Http::assertSent(fn (Request $r) => $r->method() === 'DELETE' && $r['force'] === true);
        $this->assertDatabaseMissing('woo_customers', ['woo_id' => 5]);
    }

    public function test_create_customer_sends_nested_addresses_and_never_a_password(): void
    {
        $this->writer();
        $this->allow('customers.create');
        Http::fake(['shop.test/wp-json/wc/v3/customers' => Http::response([
            'id' => 77, 'email' => 'new@shop.test', 'first_name' => 'Asha', 'last_name' => 'Rao', 'username' => 'asha',
            'billing' => ['phone' => '999', 'city' => 'Pune', 'state' => 'MH', 'country' => 'IN'],
        ], 201)]);

        $this->postJson('/api/v1/customers', ['email' => 'new@shop.test', 'first_name' => 'Asha', 'last_name' => 'Rao', 'phone' => '999', 'city' => 'Pune', 'password' => 'hunter22'])
            ->assertStatus(201);

        Http::assertSent(fn (Request $r) => $r['billing']['city'] === 'Pune' && $r['billing']['phone'] === '999'
            && ! isset($r['shipping']['phone']) && ! isset($r['password']));
        $this->assertDatabaseHas('woo_customers', ['woo_id' => 77, 'city' => 'Pune']);
    }

    public function test_category_and_coupon_create(): void
    {
        $this->writer();
        $this->allow('categories.create', 'coupons.create');
        Http::fake([
            'shop.test/wp-json/wc/v3/products/categories' => Http::response(['id' => 9, 'name' => 'Sale', 'slug' => 'sale', 'parent' => 0, 'count' => 0], 201),
            'shop.test/wp-json/wc/v3/coupons' => Http::response(['id' => 3, 'code' => 'WELCOME10', 'status' => 'draft', 'discount_type' => 'percent', 'amount' => '10.00'], 201),
        ]);

        $this->postJson('/api/v1/categories', ['name' => 'Sale'])->assertStatus(201);
        $this->postJson('/api/v1/coupons', ['code' => 'WELCOME10', 'discount_type' => 'percent', 'amount' => 10])->assertStatus(201);
        $this->postJson('/api/v1/coupons', ['code' => 'BAD', 'discount_type' => 'percent', 'amount' => 150])->assertStatus(422);

        $this->assertDatabaseHas('woo_categories', ['woo_id' => 9]);
        $this->assertDatabaseHas('woo_coupons', ['woo_id' => 3, 'status' => 'draft']);
        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/coupons') && $r['status'] === 'draft');
    }

    public function test_order_status_change_refreshes_the_mirror(): void
    {
        $this->writer();
        $this->allow('orders.update');
        $order = $this->order();
        Http::fake([
            'shop.test/wp-json/wc/v3/orders/50' => Http::sequence()
                ->push(['id' => 50, 'status' => 'completed'])
                ->push(['id' => 50, 'number' => '50', 'status' => 'completed', 'currency' => 'INR', 'total' => '500.00', 'transaction_id' => '', 'customer_note' => '', 'line_items' => [], 'billing' => [], 'shipping' => []]),
        ]);

        $this->putJson("/api/v1/orders/{$order->id}/status", ['status' => 'completed'])->assertOk()->assertJsonPath('status', 'completed');
        $this->putJson("/api/v1/orders/{$order->id}/status", ['status' => 'nonsense'])->assertStatus(422);
    }

    public function test_refund_never_asks_the_gateway_to_move_money(): void
    {
        $this->writer();
        $this->allow('orders.refund');
        $order = $this->order();
        Http::fake([
            'shop.test/wp-json/wc/v3/orders/50/refunds' => Http::response(['id' => 8, 'amount' => '120.00', 'reason' => 'damaged'], 201),
            'shop.test/wp-json/wc/v3/orders/50' => Http::response(['id' => 50, 'number' => '50', 'status' => 'processing', 'currency' => 'INR', 'total' => '500.00', 'transaction_id' => '', 'customer_note' => '', 'line_items' => []]),
        ]);

        $this->postJson("/api/v1/orders/{$order->id}/refunds", ['amount' => 120, 'reason' => 'damaged', 'api_refund' => true])
            ->assertStatus(201)->assertJsonPath('amount', '120.00');
        $this->postJson("/api/v1/orders/{$order->id}/refunds", ['amount' => 900])->assertStatus(422);
        $this->postJson("/api/v1/orders/{$order->id}/refunds", ['amount' => 0])->assertStatus(422);

        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/refunds') && $r['api_refund'] === false);
    }

    public function test_order_notes_are_listed_and_added(): void
    {
        $this->writer();
        $this->allow('orders.note');
        $order = $this->order();
        Http::fake(['shop.test/wp-json/wc/v3/orders/50/notes*' => Http::sequence()
            ->push([['id' => 1, 'author' => 'system', 'note' => 'Paid', 'customer_note' => false, 'date_created_gmt' => '2026-11-01T10:00:00']])
            ->push(['id' => 2, 'author' => 'admin', 'note' => 'Shipped', 'customer_note' => true], 201)]);

        $this->getJson("/api/v1/orders/{$order->id}/notes")->assertOk()->assertJsonPath('0.note', 'Paid');
        $this->postJson("/api/v1/orders/{$order->id}/notes", ['note' => 'Shipped', 'customer_note' => true])->assertStatus(201)->assertJsonPath('customer_note', true);
    }

    public function test_shipping_method_create_update_and_delete(): void
    {
        $this->writer();
        $this->allow('shipping.manage');
        Http::fake(['shop.test/wp-json/wc/v3/shipping/zones/1/methods*' => Http::response(['id' => 4, 'method_id' => 'flat_rate', 'enabled' => true], 200)]);

        $this->postJson('/api/v1/shipping/zones/1/methods', ['method_id' => 'flat_rate', 'title' => 'Flat', 'cost' => 50, 'enabled' => true])->assertStatus(201);
        Http::assertSent(fn (Request $r) => $r->method() === 'POST' && $r['settings']['cost'] === '50' && $r['settings']['title'] === 'Flat');

        $this->putJson('/api/v1/shipping/zones/1/methods/4', ['enabled' => false])->assertOk();
        $this->deleteJson('/api/v1/shipping/zones/1/methods/4')->assertStatus(502); // permanent_delete still off

        $this->allow('permanent_delete');
        $this->deleteJson('/api/v1/shipping/zones/1/methods/4')->assertStatus(204);
    }

    public function test_payment_update_only_sends_safe_fields_and_returns_a_masked_gateway(): void
    {
        $this->writer();
        $this->allow('payments.update');
        Http::fake(['shop.test/wp-json/wc/v3/payment_gateways/razorpay' => Http::response([
            'id' => 'razorpay', 'title' => 'Razorpay', 'enabled' => true,
            'settings' => ['key_secret' => ['id' => 'key_secret', 'type' => 'password', 'value' => 'rzp_live_SECRET']],
        ])]);

        $res = $this->putJson('/api/v1/payments/razorpay', ['enabled' => true, 'title' => 'Razorpay', 'key_secret' => 'evil', 'settings' => ['key_secret' => 'evil']])
            ->assertOk();

        $this->assertStringNotContainsString('rzp_live_SECRET', $res->getContent());
        Http::assertSent(fn (Request $r) => $r->method() === 'PUT' && ! str_contains($r->body(), 'evil'));
    }

    public function test_settings_refuse_credentials_and_unlisted_groups(): void
    {
        $this->writer();
        $this->allow('settings.update');
        Http::fake(['shop.test/wp-json/wc/v3/settings/general*' => Http::response([['id' => 'woocommerce_currency', 'value' => 'USD']])]);

        $this->putJson('/api/v1/settings/advanced', ['settings' => ['woocommerce_api_enabled' => 'yes']])->assertStatus(422);
        $this->putJson('/api/v1/settings/general', ['settings' => ['woocommerce_stripe_secret_key' => 'x']])->assertStatus(422);
        Http::assertNothingSent();

        $this->putJson('/api/v1/settings/general', ['settings' => ['woocommerce_calc_taxes' => true, 'woocommerce_currency' => 'USD']])->assertOk();
        Http::assertSent(fn (Request $r) => $r->method() === 'POST' && str_ends_with($r->url(), '/settings/general/batch')
            && $r['update'][0] === ['id' => 'woocommerce_calc_taxes', 'value' => 'yes']);
    }

    public function test_woocommerce_rejection_is_reported_as_502_and_audited(): void
    {
        $this->writer();
        $this->allow('categories.create');
        Http::fake(['shop.test/wp-json/wc/v3/products/categories' => Http::response(['message' => 'Name exists'], 400)]);

        Log::spy();

        $res = $this->postJson('/api/v1/categories', ['name' => 'Dup'])->assertStatus(502);

        // The caller only gets a generic sentence...
        $this->assertSame('WooCommerce did not accept the request.', $res->json('message'));
        $this->assertStringNotContainsString('Name exists', $res->getContent());
        // ...the real reason is in the log and in the admin-only audit row.
        Log::shouldHaveReceived('error')->withArgs(fn ($m, $ctx = []) => str_contains($ctx['response'] ?? '', 'Name exists'))->once();
        $audit = WooWriteAudit::where('resource', 'categories')->first();
        $this->assertSame('failed', $audit->status);
        $this->assertSame(400, $audit->http_status);
        $this->assertStringContainsString('Name exists', $audit->error);
    }

    public function test_notifications_can_be_marked_read_per_user(): void
    {
        $user = $this->writer();
        WooOrder::create(['woo_id' => 60, 'number' => '60', 'status' => 'processing', 'currency' => 'INR', 'total' => '10', 'woo_created_at' => now()]);

        $first = $this->getJson('/api/v1/notifications')->assertOk();
        $first->assertJsonPath('unread', 1)->assertJsonPath('data.0.read', false);
        $id = $first->json('data.0.id');

        $this->postJson('/api/v1/notifications/read', ['ids' => [$id]])->assertOk()->assertJson(['marked' => 1]);
        $this->getJson('/api/v1/notifications')->assertJsonPath('unread', 0)->assertJsonPath('data.0.read', true);

        $this->postJson('/api/v1/notifications/read', [])->assertStatus(422);
        $this->assertSame(1, DB::table('notification_reads')->where('user_id', $user->id)->count());

        // another user still sees it as unread
        $this->actingAs(User::factory()->create(), 'api');
        $this->getJson('/api/v1/notifications')->assertJsonPath('unread', 1);
    }
}
