<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WooCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class CategoryController extends Controller
{
    #[OA\Get(
        path: '/api/v1/categories',
        operationId: 'categoriesIndex',
        summary: 'List product categories',
        security: [['bearerAuth' => []]],
        tags: ['Categories'],
        parameters: [
            new OA\Parameter(ref: '#/components/parameters/page'),
            new OA\Parameter(ref: '#/components/parameters/per_page'),
            new OA\Parameter(ref: '#/components/parameters/search'),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated categories', content: new OA\JsonContent(allOf: [
                new OA\Schema(ref: '#/components/schemas/PaginationEnvelope'),
                new OA\Schema(properties: [new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Category'))]),
            ])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $request->validate(['per_page' => 'integer|min:1|max:100']);

        $q = WooCategory::query()
            ->when($request->search, fn ($q, $v) => $q->where('name', 'like', "%{$v}%"))
            ->orderBy('name');

        return response()->json($q->paginate((int) $request->input('per_page', 20))->withQueryString());
    }

    #[OA\Get(
        path: '/api/v1/categories/{id}',
        operationId: 'categoriesShow',
        summary: 'Category detail',
        security: [['bearerAuth' => []]],
        tags: ['Categories'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local category id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(ref: '#/components/schemas/Category')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ],
    )]
    public function show(int $id): JsonResponse
    {
        return response()->json(WooCategory::findOrFail($id));
    }
}
