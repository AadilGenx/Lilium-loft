<?php

namespace App\Http\Controllers\Api\Write;

use App\Http\Controllers\Controller;
use App\Models\WooCoupon;
use App\Services\WooCommerce\WooWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class CouponWriteController extends Controller
{
    public function __construct(private WooWriter $writer) {}

    #[OA\Post(
        path: '/api/v1/coupons',
        operationId: 'couponsCreate',
        summary: 'Create a coupon',
        description: 'CHANGES THE LIVE STORE. Needs the "coupons.create" write switch. Coupons start as `draft` unless `status` is `publish`, so a new code cannot be used by customers by accident.',
        security: [['bearerAuth' => []]],
        tags: ['Coupons'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(required: ['code', 'discount_type', 'amount'], properties: [
            new OA\Property(property: 'code', type: 'string', example: 'WELCOME10'),
            new OA\Property(property: 'discount_type', type: 'string', enum: ['percent', 'fixed_cart', 'fixed_product']),
            new OA\Property(property: 'amount', type: 'string', example: '10'),
            new OA\Property(property: 'description', type: 'string'),
            new OA\Property(property: 'date_expires', type: 'string', format: 'date-time', nullable: true),
            new OA\Property(property: 'usage_limit', type: 'integer', nullable: true),
            new OA\Property(property: 'individual_use', type: 'boolean'),
            new OA\Property(property: 'free_shipping', type: 'boolean'),
            new OA\Property(property: 'exclude_sale_items', type: 'boolean'),
            new OA\Property(property: 'minimum_amount', type: 'string', nullable: true),
            new OA\Property(property: 'maximum_amount', type: 'string', nullable: true),
            new OA\Property(property: 'status', type: 'string', enum: ['publish', 'draft']),
        ])),
        responses: [
            new OA\Response(response: 201, description: 'Created coupon'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:100',
            'discount_type' => 'required|in:percent,fixed_cart,fixed_product',
            'amount' => 'required|numeric|min:0|max:99999999',
            ...$this->rules(),
        ]);
        $this->checkPercent($data);

        $payload = $this->payload(['status' => 'draft'] + $data);

        return response()->json($this->writer->create('coupons', $payload, $request->user(), $request->ip()), 201);
    }

    #[OA\Put(
        path: '/api/v1/coupons/{id}',
        operationId: 'couponsUpdate',
        summary: 'Update a coupon',
        description: 'CHANGES THE LIVE STORE. Needs the "coupons.update" write switch. Partial update; send `status: draft` to switch a coupon off.',
        security: [['bearerAuth' => []]],
        tags: ['Coupons'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local coupon id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Updated coupon'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function update(Request $request, int $id): JsonResponse
    {
        $coupon = WooCoupon::findOrFail($id);

        $data = $request->validate([
            'code' => 'sometimes|string|max:100',
            'discount_type' => 'sometimes|in:percent,fixed_cart,fixed_product',
            'amount' => 'sometimes|numeric|min:0|max:99999999',
            ...$this->rules(),
        ]);
        abort_if($data === [], 422, 'Send at least one field to change.');
        $this->checkPercent($data + ['discount_type' => $coupon->discount_type, 'amount' => $coupon->amount]);

        return response()->json($this->writer->update('coupons', $coupon, $this->payload($data), $request->user(), $request->ip()));
    }

    #[OA\Delete(
        path: '/api/v1/coupons/{id}',
        operationId: 'couponsDelete',
        summary: 'Move a coupon to the trash',
        description: 'CHANGES THE LIVE STORE. Needs the "coupons.delete" write switch. The coupon goes to the WooCommerce trash (not permanently deleted) and is removed from the local copy.',
        security: [['bearerAuth' => []]],
        tags: ['Coupons'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local coupon id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Trashed'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->writer->delete('coupons', WooCoupon::findOrFail($id), $request->user(), $request->ip());

        return response()->json(null, 204);
    }

    /** @return array<string, string> */
    private function rules(): array
    {
        return [
            'description' => 'sometimes|nullable|string|max:1000',
            'date_expires' => 'sometimes|nullable|date',
            'usage_limit' => 'sometimes|nullable|integer|min:1|max:1000000',
            'individual_use' => 'sometimes|boolean',
            'free_shipping' => 'sometimes|boolean',
            'exclude_sale_items' => 'sometimes|boolean',
            'minimum_amount' => 'sometimes|nullable|numeric|min:0|max:99999999',
            'maximum_amount' => 'sometimes|nullable|numeric|min:0|max:99999999',
            'status' => 'sometimes|in:publish,draft',
        ];
    }

    /** @param array<string, mixed> $data */
    private function checkPercent(array $data): void
    {
        if (($data['discount_type'] ?? null) === 'percent' && isset($data['amount']) && (float) $data['amount'] > 100) {
            abort(422, 'A percentage discount cannot be more than 100.');
        }
    }

    /**
     * WooCommerce wants money as strings and an empty string (not null) to clear an amount.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function payload(array $data): array
    {
        foreach (['amount', 'minimum_amount', 'maximum_amount'] as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = $data[$field] === null ? '' : (string) $data[$field];
            }
        }

        return $data;
    }
}
