<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WooOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class OrderController extends Controller
{
    #[OA\Get(
        path: '/api/v1/orders',
        operationId: 'ordersIndex',
        summary: 'List orders',
        security: [['bearerAuth' => []]],
        tags: ['Orders'],
        parameters: [
            new OA\Parameter(ref: '#/components/parameters/page'),
            new OA\Parameter(ref: '#/components/parameters/per_page'),
            new OA\Parameter(name: 'search', in: 'query', description: 'Matches order number, billing name or email', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', description: 'e.g. processing, completed, on-hold, cancelled, refunded', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'date_from', in: 'query', description: 'Placed on/after (YYYY-MM-DD)', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'date_to', in: 'query', description: 'Placed on/before (YYYY-MM-DD)', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'sort', in: 'query', schema: new OA\Schema(type: 'string', enum: ['woo_created_at', 'total'], default: 'woo_created_at')),
            new OA\Parameter(name: 'direction', in: 'query', schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'], default: 'desc')),
            new OA\Parameter(name: 'with_items', in: 'query', description: 'Set to 1 to include line items', schema: new OA\Schema(type: 'integer', enum: [0, 1], default: 0)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated orders', content: new OA\JsonContent(allOf: [
                new OA\Schema(ref: '#/components/schemas/PaginationEnvelope'),
                new OA\Schema(properties: [new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Order'))]),
            ])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => 'integer|min:1|max:100',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'sort' => 'in:woo_created_at,total',
            'direction' => 'in:asc,desc',
        ]);

        $q = WooOrder::query()
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->date_from, fn ($q, $v) => $q->where('woo_created_at', '>=', $v.' 00:00:00'))
            ->when($request->date_to, fn ($q, $v) => $q->where('woo_created_at', '<=', $v.' 23:59:59'))
            ->when($request->search, fn ($q, $v) => $q->where(fn ($w) => $w
                ->where('number', 'like', "%{$v}%")
                ->orWhere('billing_name', 'like', "%{$v}%")
                ->orWhere('billing_email', 'like', "%{$v}%")))
            ->when($request->boolean('with_items'), fn ($q) => $q->with('items'))
            ->orderBy($request->input('sort', 'woo_created_at'), $request->input('direction', 'desc'));

        return response()->json($q->paginate((int) $request->input('per_page', 20))->withQueryString());
    }

    #[OA\Get(
        path: '/api/v1/orders/{id}',
        operationId: 'ordersShow',
        summary: 'Order detail with line items',
        security: [['bearerAuth' => []]],
        tags: ['Orders'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local order id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(ref: '#/components/schemas/Order')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ],
    )]
    public function show(int $id): JsonResponse
    {
        return response()->json(WooOrder::with('items')->findOrFail($id));
    }
}
