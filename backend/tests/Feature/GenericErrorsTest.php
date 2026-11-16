<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WooOrder;
use App\Models\WooSyncLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/** Users only ever see short generic messages; the real cause goes to the log. */
class GenericErrorsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create(['can_write' => true]), 'api');
    }

    public function test_live_reads_say_only_that_woocommerce_is_not_configured(): void
    {
        config(['woocommerce.base_url' => 'https://shop.test', 'woocommerce.consumer_key' => null, 'woocommerce.consumer_secret' => null]);
        Log::spy();

        foreach (['/api/v1/settings', '/api/v1/shipping/zones', '/api/v1/payments'] as $url) {
            $res = $this->getJson($url)->assertStatus(502);
            $this->assertSame('WooCommerce is not configured.', $res->json('message'));
            $this->assertStringNotContainsStringIgnoringCase('key', $res->getContent());
            $this->assertStringNotContainsString('WOO_', $res->getContent());
        }

        Log::shouldHaveReceived('error')->withArgs(fn ($m, $ctx = []) => str_contains($ctx['message'] ?? '', 'WOO_CONSUMER_KEY'))->atLeast()->once();
    }

    public function test_unreachable_and_refused_have_their_own_generic_sentences(): void
    {
        config(['woocommerce.base_url' => 'https://shop.test', 'woocommerce.consumer_key' => 'ck_secretvalue', 'woocommerce.consumer_secret' => 'cs_secretvalue', 'woocommerce.config_cache_ttl' => 0]);
        Http::fake(['shop.test/wp-json/wc/v3/settings' => Http::response(['code' => 'woocommerce_rest_cannot_view', 'message' => 'Sorry, you cannot list resources. key ck_secretvalue'], 401)]);

        $res = $this->getJson('/api/v1/settings')->assertStatus(502);

        $this->assertSame('WooCommerce did not accept the request.', $res->json('message'));
        $this->assertStringNotContainsString('secretvalue', $res->getContent());
        $this->assertStringNotContainsString('401', $res->getContent());
    }

    public function test_sync_status_and_notifications_do_not_expose_stored_error_text(): void
    {
        WooSyncLog::create(['resource' => 'products', 'status' => 'failed', 'started_at' => now(), 'error' => 'cURL error 6: https://internal.example/wp-json?consumer_key=ck_abc']);

        $status = $this->getJson('/api/v1/sync/status')->assertOk();
        $this->assertSame('The import from WooCommerce failed.', $status->json('0.error'));
        $this->assertStringNotContainsString('ck_abc', $status->getContent());

        $notes = $this->getJson('/api/v1/notifications')->assertOk();
        $this->assertStringNotContainsString('ck_abc', $notes->getContent());
        $this->assertStringNotContainsString('internal.example', $notes->getContent());
    }

    public function test_unexpected_server_errors_are_a_plain_message_even_with_debug_on(): void
    {
        config(['app.debug' => true]);
        WooOrder::create(['woo_id' => 1, 'number' => '1', 'status' => 'processing', 'currency' => 'INR', 'total' => '1']);
        // Force a real 500 by breaking the table the endpoint reads.
        \Illuminate\Support\Facades\Schema::drop('woo_order_items');

        $res = $this->getJson('/api/v1/orders?with_items=1')->assertStatus(500);

        $this->assertSame('Something went wrong on the server.', $res->json('message'));
        $this->assertStringNotContainsString('woo_order_items', $res->getContent());
        $this->assertArrayNotHasKey('trace', $res->json());
    }
}
