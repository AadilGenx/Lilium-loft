<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WooCustomer;
use App\Models\WooOrder;
use App\Models\WooOrderItem;
use App\Models\WooProduct;
use App\Models\WooSyncLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use OpenApi\Attributes as OA;

class DashboardController extends Controller
{
    /** Statuses that count as "sales". */
    private const PAID = ['completed', 'processing'];

    #[OA\Get(
        path: '/api/v1/dashboard/summary',
        operationId: 'dashboardSummary',
        summary: 'Headline sales numbers for the last N days, compared with the N days before',
        description: 'Sales count orders with status `completed` or `processing`.',
        security: [['bearerAuth' => []]],
        tags: ['Dashboard'],
        parameters: [new OA\Parameter(name: 'days', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 365, default: 30))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'days', type: 'integer', example: 30),
                new OA\Property(property: 'revenue', type: 'number', format: 'float', example: 18250.5),
                new OA\Property(property: 'previous_revenue', type: 'number', format: 'float', example: 12000),
                new OA\Property(property: 'orders', type: 'integer', example: 14),
                new OA\Property(property: 'previous_orders', type: 'integer', example: 9),
                new OA\Property(property: 'average_order_value', type: 'number', format: 'float', example: 1303.61),
                new OA\Property(property: 'awaiting_fulfilment', type: 'integer', description: 'processing + on-hold + pending orders (all time)', example: 3),
                new OA\Property(property: 'customers', type: 'integer', example: 1),
                new OA\Property(property: 'published_products', type: 'integer', example: 95),
                new OA\Property(property: 'out_of_stock_products', type: 'integer', example: 4),
            ])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function summary(Request $request): JsonResponse
    {
        $days = $this->days($request);
        $now = now();

        $current = WooOrder::whereIn('status', self::PAID)->where('woo_created_at', '>=', $now->copy()->subDays($days));
        $previous = WooOrder::whereIn('status', self::PAID)->whereBetween('woo_created_at', [$now->copy()->subDays($days * 2), $now->copy()->subDays($days)]);

        $revenue = (float) $current->sum('total');
        $orders = $current->count();

        return response()->json([
            'days' => $days,
            'revenue' => $revenue,
            'previous_revenue' => (float) $previous->sum('total'),
            'orders' => $orders,
            'previous_orders' => $previous->count(),
            'average_order_value' => $orders ? round($revenue / $orders, 2) : 0,
            'awaiting_fulfilment' => WooOrder::whereIn('status', ['processing', 'on-hold', 'pending'])->count(),
            'customers' => WooCustomer::count(),
            'published_products' => WooProduct::where('status', 'publish')->count(),
            'out_of_stock_products' => WooProduct::where('status', 'publish')->where('stock_status', 'outofstock')->count(),
        ]);
    }

    #[OA\Get(
        path: '/api/v1/dashboard/revenue',
        operationId: 'dashboardRevenue',
        summary: 'Revenue and order count per day (zero-filled)',
        security: [['bearerAuth' => []]],
        tags: ['Dashboard'],
        parameters: [new OA\Parameter(name: 'days', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 365, default: 30))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'array', items: new OA\Items(properties: [
                new OA\Property(property: 'date', type: 'string', format: 'date', example: '2026-11-14'),
                new OA\Property(property: 'revenue', type: 'number', format: 'float', example: 2450),
                new OA\Property(property: 'orders', type: 'integer', example: 2),
            ]))),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function revenue(Request $request): JsonResponse
    {
        $days = $this->days($request);
        $from = now()->subDays($days - 1)->startOfDay();

        $rows = WooOrder::whereIn('status', self::PAID)->where('woo_created_at', '>=', $from)
            ->selectRaw('DATE(woo_created_at) as d, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('d')->get()->keyBy('d');

        $out = [];
        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::parse($from)->addDays($i)->toDateString();
            $out[] = [
                'date' => $date,
                'revenue' => (float) ($rows[$date]->revenue ?? 0),
                'orders' => (int) ($rows[$date]->orders ?? 0),
            ];
        }

        return response()->json($out);
    }

    #[OA\Get(
        path: '/api/v1/dashboard/orders-by-status',
        operationId: 'dashboardOrdersByStatus',
        summary: 'Order counts grouped by status (all time)',
        security: [['bearerAuth' => []]],
        tags: ['Dashboard'],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'array', items: new OA\Items(properties: [
                new OA\Property(property: 'status', type: 'string', example: 'completed'),
                new OA\Property(property: 'count', type: 'integer', example: 11),
            ]))),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function ordersByStatus(): JsonResponse
    {
        return response()->json(
            WooOrder::selectRaw('status, COUNT(*) as count')->groupBy('status')->orderByDesc('count')->get()
        );
    }

    #[OA\Get(
        path: '/api/v1/dashboard/top-products',
        operationId: 'dashboardTopProducts',
        summary: 'Best-selling products by units sold (completed + processing orders)',
        security: [['bearerAuth' => []]],
        tags: ['Dashboard'],
        parameters: [new OA\Parameter(name: 'limit', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 50, default: 10))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'array', items: new OA\Items(properties: [
                new OA\Property(property: 'product_woo_id', type: 'integer'),
                new OA\Property(property: 'name', type: 'string'),
                new OA\Property(property: 'units', type: 'integer'),
                new OA\Property(property: 'revenue', type: 'number', format: 'float'),
            ]))),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function topProducts(Request $request): JsonResponse
    {
        $limit = max(1, min(50, (int) $request->input('limit', 10)));

        $rows = WooOrderItem::query()
            ->join('woo_orders', 'woo_orders.woo_id', '=', 'woo_order_items.order_woo_id')
            ->whereIn('woo_orders.status', self::PAID)
            ->selectRaw('woo_order_items.product_woo_id, MIN(woo_order_items.name) as name, SUM(woo_order_items.quantity) as units, SUM(woo_order_items.total) as revenue')
            ->groupBy('woo_order_items.product_woo_id')
            ->orderByDesc('units')->limit($limit)->get()
            ->map(fn ($r) => [
                'product_woo_id' => (int) $r->product_woo_id,
                'name' => $r->name,
                'units' => (int) $r->units,
                'revenue' => (float) $r->revenue,
            ]);

        return response()->json($rows);
    }

    #[OA\Get(
        path: '/api/v1/sync/status',
        operationId: 'syncStatus',
        summary: 'Most recent import run for each resource',
        description: 'Shows how fresh the mirrored WooCommerce data is.',
        security: [['bearerAuth' => []]],
        tags: ['Sync'],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'array', items: new OA\Items(properties: [
                new OA\Property(property: 'resource', type: 'string', example: 'orders'),
                new OA\Property(property: 'status', type: 'string', enum: ['running', 'ok', 'failed']),
                new OA\Property(property: 'records', type: 'integer'),
                new OA\Property(property: 'error', type: 'string', nullable: true),
                new OA\Property(property: 'started_at', type: 'string', format: 'date-time'),
                new OA\Property(property: 'finished_at', type: 'string', format: 'date-time', nullable: true),
            ]))),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function syncStatus(): JsonResponse
    {
        $latest = WooSyncLog::selectRaw('MAX(id) as id')->groupBy('resource');

        return response()->json(
            WooSyncLog::whereIn('id', $latest)->orderBy('resource')->get(['resource', 'status', 'records', 'error', 'started_at', 'finished_at'])
        );
    }

    private function days(Request $request): int
    {
        return max(1, min(365, (int) $request->input('days', 30)));
    }
}
