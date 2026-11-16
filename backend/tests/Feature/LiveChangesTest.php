<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WooProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LiveChangesTest extends TestCase
{
    use RefreshDatabase;

    private function webhook(string $topic, array $payload): void
    {
        $body = json_encode($payload);
        $signature = base64_encode(hash_hmac('sha256', $body, config('woocommerce.webhook_secret'), true));

        $this->call('POST', '/api/webhooks/woocommerce', [], [], [], [
            'HTTP_X-WC-Webhook-Signature' => $signature,
            'HTTP_X-WC-Webhook-Topic' => $topic,
            'HTTP_X-WC-Webhook-Delivery-ID' => bin2hex(random_bytes(6)),
            'CONTENT_TYPE' => 'application/json',
        ], $body)->assertOk();
    }

    private function product(int $id): array
    {
        return ['id' => $id, 'name' => "P{$id}", 'slug' => "p{$id}", 'type' => 'simple', 'status' => 'publish', 'sku' => '', 'categories' => []];
    }

    public function test_requires_login(): void
    {
        $this->getJson('/api/v1/sync/changes')->assertStatus(401);
    }

    public function test_every_kind_of_change_bumps_its_counter(): void
    {
        config(['woocommerce.webhook_secret' => 'whsec_test']);
        $this->actingAs(User::factory()->create(), 'api');

        $before = $this->getJson('/api/v1/sync/changes')->assertOk()->json();
        $this->assertSame(['products', 'orders', 'customers', 'coupons', 'categories'], array_keys($before));

        $this->webhook('product.created', $this->product(10));
        $afterCreate = $this->getJson('/api/v1/sync/changes')->json();
        $this->assertGreaterThan($before['products'], $afterCreate['products']);
        $this->assertSame($before['orders'], $afterCreate['orders']); // other kinds untouched
        $this->assertDatabaseHas('woo_products', ['woo_id' => 10]);

        $this->webhook('product.updated', $this->product(10));
        $afterUpdate = $this->getJson('/api/v1/sync/changes')->json();
        $this->assertGreaterThan($afterCreate['products'], $afterUpdate['products']);

        $this->webhook('product.deleted', ['id' => 10]);
        $afterDelete = $this->getJson('/api/v1/sync/changes')->json();
        $this->assertGreaterThan($afterUpdate['products'], $afterDelete['products']);
        $this->assertDatabaseMissing('woo_products', ['woo_id' => 10]);
    }

    public function test_the_counter_moves_only_after_the_data_is_saved(): void
    {
        config(['woocommerce.webhook_secret' => 'whsec_test']);
        $this->actingAs(User::factory()->create(), 'api');

        $this->webhook('product.created', $this->product(11));

        // By the time the counter has changed, the record is already readable.
        $this->assertSame(1, WooProduct::where('woo_id', 11)->count());
        $this->getJson('/api/v1/products')->assertOk()->assertJsonPath('data.0.woo_id', 11);
    }

    public function test_polling_has_its_own_rate_limit(): void
    {
        $this->actingAs(User::factory()->create(), 'api');

        // 100 polls (a few minutes of a busy tab) must not touch the normal read allowance of 120/min.
        for ($i = 0; $i < 100; $i++) {
            $this->getJson('/api/v1/sync/changes')->assertOk();
        }
        $this->getJson('/api/v1/products')->assertOk();
    }
}
