<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WooCoupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class CouponController extends Controller
{
    #[OA\Get(
        path: '/api/v1/coupons',
        operationId: 'couponsIndex',
        summary: 'List coupons',
        security: [['bearerAuth' => []]],
        tags: ['Coupons'],
        parameters: [
            new OA\Parameter(ref: '#/components/parameters/page'),
            new OA\Parameter(ref: '#/components/parameters/per_page'),
            new OA\Parameter(name: 'search', in: 'query', description: 'Matches coupon code', schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated coupons', content: new OA\JsonContent(allOf: [
                new OA\Schema(ref: '#/components/schemas/PaginationEnvelope'),
                new OA\Schema(properties: [new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Coupon'))]),
            ])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $request->validate(['per_page' => 'integer|min:1|max:100']);

        $q = WooCoupon::query()
            ->when($request->search, fn ($q, $v) => $q->where('code', 'like', "%{$v}%"))
            ->orderBy('code');

        $page = $q->paginate((int) $request->input('per_page', 20))->withQueryString();
        $page->getCollection()->each->append(WooCoupon::DETAIL_ATTRS);

        return response()->json($page);
    }

    #[OA\Get(
        path: '/api/v1/coupons/{id}',
        operationId: 'couponsShow',
        summary: 'Coupon detail',
        security: [['bearerAuth' => []]],
        tags: ['Coupons'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local coupon id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(ref: '#/components/schemas/Coupon')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ],
    )]
    public function show(int $id): JsonResponse
    {
        return response()->json(WooCoupon::findOrFail($id)->append(WooCoupon::DETAIL_ATTRS));
    }
}
