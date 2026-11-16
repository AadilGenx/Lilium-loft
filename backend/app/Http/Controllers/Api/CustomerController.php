<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WooCustomer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class CustomerController extends Controller
{
    #[OA\Get(
        path: '/api/v1/customers',
        operationId: 'customersIndex',
        summary: 'List customers',
        security: [['bearerAuth' => []]],
        tags: ['Customers'],
        parameters: [
            new OA\Parameter(ref: '#/components/parameters/page'),
            new OA\Parameter(ref: '#/components/parameters/per_page'),
            new OA\Parameter(name: 'search', in: 'query', description: 'Matches name, username or email', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort', in: 'query', schema: new OA\Schema(type: 'string', enum: ['woo_created_at', 'total_spent', 'orders_count'], default: 'woo_created_at')),
            new OA\Parameter(name: 'direction', in: 'query', schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'], default: 'desc')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated customers', content: new OA\JsonContent(allOf: [
                new OA\Schema(ref: '#/components/schemas/PaginationEnvelope'),
                new OA\Schema(properties: [new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Customer'))]),
            ])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => 'integer|min:1|max:100',
            'sort' => 'in:woo_created_at,total_spent,orders_count',
            'direction' => 'in:asc,desc',
        ]);

        $q = WooCustomer::query()
            ->when($request->search, fn ($q, $v) => $q->where(fn ($w) => $w
                ->where('first_name', 'like', "%{$v}%")->orWhere('last_name', 'like', "%{$v}%")
                ->orWhere('username', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%")))
            ->orderBy($request->input('sort', 'woo_created_at'), $request->input('direction', 'desc'));

        $page = $q->paginate((int) $request->input('per_page', 20))->withQueryString();
        $page->getCollection()->each->append(WooCustomer::DETAIL_ATTRS);

        return response()->json($page);
    }

    #[OA\Get(
        path: '/api/v1/customers/{id}',
        operationId: 'customersShow',
        summary: 'Customer detail',
        security: [['bearerAuth' => []]],
        tags: ['Customers'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local customer id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(ref: '#/components/schemas/Customer')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ],
    )]
    public function show(int $id): JsonResponse
    {
        return response()->json(WooCustomer::findOrFail($id)->append(WooCustomer::DETAIL_ATTRS));
    }
}
