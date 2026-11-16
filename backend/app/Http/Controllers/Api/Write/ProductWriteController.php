<?php

namespace App\Http\Controllers\Api\Write;

use App\Http\Controllers\Controller;
use App\Models\WooProduct;
use App\Services\WooCommerce\WooWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class ProductWriteController extends Controller
{
    public function __construct(private WooWriter $writer) {}

    #[OA\Post(
        path: '/api/v1/products',
        operationId: 'productsCreate',
        summary: 'Create a simple product',
        description: 'CHANGES THE LIVE STORE. Needs the "products.create" write switch. New products are created as `draft` unless `status` says otherwise. Only simple products can be created here; variations are not supported. `categories` are WooCommerce category ids (`woo_id`).',
        security: [['bearerAuth' => []]],
        tags: ['Products'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(required: ['name'], properties: [
            new OA\Property(property: 'name', type: 'string', example: 'Linen shirt'),
            new OA\Property(property: 'status', type: 'string', enum: ['publish', 'draft', 'pending', 'private']),
            new OA\Property(property: 'sku', type: 'string', nullable: true),
            new OA\Property(property: 'regular_price', type: 'string', example: '499.00'),
            new OA\Property(property: 'sale_price', type: 'string', nullable: true),
            new OA\Property(property: 'manage_stock', type: 'boolean'),
            new OA\Property(property: 'stock_quantity', type: 'integer', nullable: true),
            new OA\Property(property: 'stock_status', type: 'string', enum: ['instock', 'outofstock', 'onbackorder']),
            new OA\Property(property: 'description', type: 'string', nullable: true),
            new OA\Property(property: 'short_description', type: 'string', nullable: true),
            new OA\Property(property: 'featured', type: 'boolean'),
            new OA\Property(property: 'categories', type: 'array', items: new OA\Items(type: 'integer')),
            new OA\Property(property: 'images', type: 'array', items: new OA\Items(type: 'string', format: 'uri')),
        ])),
        responses: [
            new OA\Response(response: 201, description: 'Created product', content: new OA\JsonContent(ref: '#/components/schemas/Product')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'sometimes|string|max:200|regex:/^[a-z0-9-]+$/',
            'status' => 'sometimes|in:publish,draft,pending,private',
            'sku' => 'sometimes|nullable|string|max:100',
            'regular_price' => 'sometimes|numeric|min:0|max:99999999',
            'sale_price' => 'sometimes|nullable|numeric|min:0|max:99999999',
            'manage_stock' => 'sometimes|boolean',
            'stock_quantity' => 'sometimes|nullable|integer|min:0|max:1000000',
            'stock_status' => 'sometimes|in:instock,outofstock,onbackorder',
            'description' => 'sometimes|nullable|string|max:65000',
            'short_description' => 'sometimes|nullable|string|max:5000',
            'featured' => 'sometimes|boolean',
            'categories' => 'sometimes|array|max:50',
            'categories.*' => 'integer|exists:woo_categories,woo_id',
            'images' => 'sometimes|array|max:10',
            'images.*' => 'url|max:2000',
        ]);

        if (($data['sale_price'] ?? null) !== null && isset($data['regular_price']) && (float) $data['sale_price'] > (float) $data['regular_price']) {
            throw ValidationException::withMessages(['sale_price' => 'The sale price cannot be higher than the regular price.']);
        }

        foreach (['regular_price', 'sale_price'] as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = $data[$field] === null ? '' : (string) $data[$field];
            }
        }
        if (isset($data['categories'])) {
            $data['categories'] = array_map(fn ($id) => ['id' => (int) $id], $data['categories']);
        }
        if (isset($data['images'])) {
            $data['images'] = array_map(fn ($src) => ['src' => $src], $data['images']);
        }

        $payload = ['type' => 'simple', 'status' => 'draft'] + $data;
        $created = $this->writer->create('products', $payload, $request->user(), $request->ip());

        return response()->json($created instanceof WooProduct ? $created->load('categories') : $created, 201);
    }

    #[OA\Delete(
        path: '/api/v1/products/{id}',
        operationId: 'productsDelete',
        summary: 'Move a product to the trash',
        description: 'CHANGES THE LIVE STORE. Needs the "products.delete" write switch. The product goes to the WooCommerce trash (it is NOT permanently deleted) and is removed from the local copy.',
        security: [['bearerAuth' => []]],
        tags: ['Products'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local product id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Trashed'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->writer->delete('products', WooProduct::findOrFail($id), $request->user(), $request->ip());

        return response()->json(null, 204);
    }
}
