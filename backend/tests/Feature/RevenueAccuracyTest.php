<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WooOrder;
use App\Services\WooCommerce\OrderRefunds;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * "Sales" has ONE definition everywhere (dashboard card, chart, reports):
 * processing + completed orders in the period, minus refunds. Nothing else counts.
 */
class RevenueAccuracyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create(), 'api');

        $n = 0;
        $order = function (string $status, string $total, array $extra = []) use (&$n) {
            $n++;

            return WooOrder::create($extra + [
                'woo_id' => $n, 'number' => (string) $n, 'status' => $status, 'currency' => 'INR', 'total' => $total,
                'woo_created_at' => now()->subDays(5), 'woo_paid_at' => now()->subDays(5),
            ]);
        };

        // These count:
        $order('processing', '100.00', ['shipping_total' => '10.00']);                            // paid
        $order('completed', '200.00', ['refunded_total' => '50.00']);                            // paid, 50 refunded
        $order('processing', '300.00', ['woo_paid_at' => null, 'payment_method' => 'cod']);      // cash on delivery: not paid yet
        // These never count:
        $order('failed', '1000.00');
        $order('cancelled', '500.00');
        $order('pending', '400.00');
        $order('on-hold', '700.00');
        $order('refunded', '900.00');
        // Outside the period:
        $order('completed', '5000.00', ['woo_created_at' => now()->subDays(60), 'woo_paid_at' => now()->subDays(60)]);
    }

    public function test_dashboard_counts_only_processing_and_completed_net_of_refunds(): void
    {
        $s = $this->getJson('/api/v1/dashboard/summary?days=30')->assertOk();

        // 100 + (200 - 50) + 300 = 550; failed, cancelled, pending, on-hold, refunded and the old order are out.
        $s->assertJsonPath('revenue', 550)
            ->assertJsonPath('orders', 3)
            ->assertJsonPath('refunded', 50)
            ->assertJsonPath('paid_revenue', 250)     // 100 + 150
            ->assertJsonPath('unpaid_revenue', 300);  // the cash-on-delivery order
    }

    public function test_the_chart_adds_up_to_the_same_number(): void
    {
        $chart = $this->getJson('/api/v1/dashboard/revenue?days=30')->assertOk()->json();

        $this->assertEqualsWithDelta(550, array_sum(array_column($chart, 'revenue')), 0.001);
        $this->assertSame(3, array_sum(array_column($chart, 'orders')));
    }

    public function test_reports_agree_and_net_sales_really_subtracts_refunds_and_shipping(): void
    {
        $from = now()->subDays(29)->toDateString();
        $to = now()->toDateString();

        $r = $this->getJson("/api/v1/reports/sales?from={$from}&to={$to}&group_by=day")->assertOk()->json('totals');

        $this->assertSame(3, $r['orders']);
        $this->assertEqualsWithDelta(600, $r['gross_sales'], 0.001);   // 100 + 200 + 300 before refunds
        $this->assertEqualsWithDelta(50, $r['refunds'], 0.001);
        // Regression: shipping used to read as 0 because it collided with the order's address accessor.
        $this->assertEqualsWithDelta(10, $r['shipping'], 0.001);
        $this->assertEqualsWithDelta(540, $r['net_sales'], 0.001);     // 600 - 50 refunds - 10 shipping - 0 tax
        $this->assertEqualsWithDelta(183.33, $r['average_order_value'], 0.01); // (600 - 50) / 3
    }

    public function test_top_customers_are_net_of_refunds(): void
    {
        WooOrder::query()->update(['billing_email' => 'a@b.test']);
        $from = now()->subDays(29)->toDateString();
        $to = now()->toDateString();

        $this->getJson("/api/v1/reports/customers?from={$from}&to={$to}")->assertOk()
            ->assertJsonPath('0.total_spent', 550);
    }

    public function test_refunds_are_read_from_what_woocommerce_sends(): void
    {
        $this->assertSame(50.0, OrderRefunds::total(['refunds' => [['id' => 1, 'total' => '-50.00']]]));
        $this->assertSame(75.5, OrderRefunds::total(['refunds' => [['total' => '-50.00'], ['total' => '-25.50']]]));
        $this->assertSame(0.0, OrderRefunds::total(['refunds' => []]));
        $this->assertSame(0.0, OrderRefunds::total([]));
    }

    public function test_an_order_update_from_woocommerce_records_the_refund(): void
    {
        config(['woocommerce.webhook_secret' => 'whsec_test']);
        $payload = ['id' => 9001, 'number' => '9001', 'status' => 'completed', 'currency' => 'INR', 'total' => '400.00',
            'transaction_id' => '', 'customer_note' => '', 'line_items' => [], 'refunds' => [['id' => 5, 'total' => '-120.00']]];
        $body = json_encode($payload);

        $this->call('POST', '/api/webhooks/woocommerce', [], [], [], [
            'HTTP_X-WC-Webhook-Signature' => base64_encode(hash_hmac('sha256', $body, 'whsec_test', true)),
            'HTTP_X-WC-Webhook-Topic' => 'order.updated',
            'HTTP_X-WC-Webhook-Delivery-ID' => 'd-refund-1',
            'CONTENT_TYPE' => 'application/json',
        ], $body)->assertOk();

        $this->assertEquals(120, WooOrder::where('woo_id', 9001)->value('refunded_total'));
    }

    public function test_an_order_without_a_currency_stays_unknown_instead_of_becoming_rupees(): void
    {
        config(['woocommerce.webhook_secret' => 'whsec_test']);
        $body = json_encode(['id' => 9002, 'number' => '9002', 'status' => 'processing', 'total' => '10.00',
            'transaction_id' => '', 'customer_note' => '', 'line_items' => []]);

        $this->call('POST', '/api/webhooks/woocommerce', [], [], [], [
            'HTTP_X-WC-Webhook-Signature' => base64_encode(hash_hmac('sha256', $body, 'whsec_test', true)),
            'HTTP_X-WC-Webhook-Topic' => 'order.created',
            'HTTP_X-WC-Webhook-Delivery-ID' => 'd-cur-1',
            'CONTENT_TYPE' => 'application/json',
        ], $body)->assertOk();

        $this->assertNull(WooOrder::where('woo_id', 9002)->value('currency'));
    }
}
