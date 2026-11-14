<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WooProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ProductController extends Controller
{
    #[OA\Get(
        path: '/api/v1/products',
        operationId: 'productsIndex',
        summary: 'List products',
        security: [['bearerAuth' => []]],
        tags: ['Products'],
        parameters: [
            new OA\Parameter(ref: '#/components/parameters/page'),
            new OA\Parameter(ref: '#/components/parameters/per_page'),
            new OA\Parameter(name: 'search', in: 'query', description: 'Matches name or SKU', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', description: 'e.g. publish, draft, private', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'stock_status', in: 'query', schema: new OA\Schema(type: 'string', enum: ['instock', 'outofstock', 'onbackorder'])),
            new OA\Parameter(name: 'category_id', in: 'query', description: 'WooCommerce category id (woo_id)', schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'sort', in: 'query', schema: new OA\Schema(type: 'string', enum: ['woo_modified_at', 'name', 'price', 'total_sales', 'stock_quantity'], default: 'woo_modified_at')),
            new OA\Parameter(name: 'direction', in: 'query', schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'], default: 'desc')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated products', content: new OA\JsonContent(allOf: [
                new OA\Schema(ref: '#/components/schemas/PaginationEnvelope'),
                new OA\Schema(properties: [new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Product'))]),
            ])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => 'integer|min:1|max:100',
            'category_id' => 'integer',
            'sort' => 'in:woo_modified_at,name,price,total_sales,stock_quantity',
            'direction' => 'in:asc,desc',
        ]);

        $q = WooProduct::query()->with('categories')
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->stock_status, fn ($q, $v) => $q->where('stock_status', $v))
            ->when($request->category_id, fn ($q, $v) => $q->whereHas('categories', fn ($c) => $c->where('woo_categories.woo_id', $v)))
            ->when($request->search, fn ($q, $v) => $q->where(fn ($w) => $w->where('name', 'like', "%{$v}%")->orWhere('sku', 'like', "%{$v}%")))
            ->orderBy($request->input('sort', 'woo_modified_at'), $request->input('direction', 'desc'));

        return response()->json($q->paginate((int) $request->input('per_page', 20))->withQueryString());
    }

    #[OA\Get(
        path: '/api/v1/products/{id}',
        operationId: 'productsShow',
        summary: 'Product detail',
        security: [['bearerAuth' => []]],
        tags: ['Products'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local product id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(ref: '#/components/schemas/Product')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ],
    )]
    public function show(int $id): JsonResponse
    {
        return response()->json(WooProduct::with('categories')->findOrFail($id));
    }
}
