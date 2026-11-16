<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** Each rate limit must count only its own routes (they used to share one counter per user). */
class RateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_ordinary_reads_do_not_use_up_the_sync_allowance(): void
    {
        $this->actingAs(User::factory()->create(), 'api');
        config(['woocommerce.base_url' => 'https://shop.test', 'woocommerce.consumer_key' => 'k', 'woocommerce.consumer_secret' => 's']);
        Http::fake(['shop.test/*' => Http::response([])]);

        // A page load plus a reload is well over 6 requests.
        for ($i = 0; $i < 15; $i++) {
            $this->getJson('/api/v1/products')->assertOk();
        }

        $this->postJson('/api/v1/sync')->assertOk();
    }

    public function test_sync_still_has_its_own_limit(): void
    {
        $this->actingAs(User::factory()->create(), 'api');
        config(['woocommerce.base_url' => 'https://shop.test', 'woocommerce.consumer_key' => 'k', 'woocommerce.consumer_secret' => 's']);
        Http::fake(['shop.test/*' => Http::response([])]);

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/v1/sync')->assertOk();
        }
        $this->postJson('/api/v1/sync')->assertStatus(429);
    }

    public function test_reads_do_not_eat_the_write_allowance(): void
    {
        $this->actingAs(User::factory()->create(['can_write' => true]), 'api');

        for ($i = 0; $i < 35; $i++) {
            $this->getJson('/api/v1/products')->assertOk();
        }

        // Reaches the write gate (403 "writes disabled"), not the rate limiter (429).
        $this->postJson('/api/v1/products', ['name' => 'X'])->assertStatus(403);
    }
}
