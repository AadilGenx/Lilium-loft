<?php

namespace App\Http\Controllers\Api\Write;

use App\Http\Controllers\Controller;
use App\Models\WooProduct;
use App\Models\WooWriteAudit;
use App\Services\WooCommerce\WooClient;
use App\Services\WooCommerce\WooErrors;
use App\Services\WooCommerce\WooSyncService;
use App\Services\WooCommerce\WooWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;
use Throwable;

/**
 * The WooCommerce product trash. The trash is not kept locally: it is read live from WooCommerce,
 * and restoring puts a product back exactly as it was before it was trashed.
 */
class ProductTrashController extends Controller
{
    public function __construct(
        private WooClient $woo,
        private WooWriter $writer,
        private WooSyncService $sync,
    ) {}

    #[OA\Get(
        path: '/api/v1/products/trash',
        operationId: 'productsTrash',
        summary: 'List the products in the WooCommerce trash',
        description: 'Read live from WooCommerce (nothing is stored locally). `previous_status` is the status the product had when it was trashed from this app; it is null when it was trashed somewhere else, and then the status to restore with must be chosen.',
        security: [['bearerAuth' => []]],
        tags: ['Products'],
        responses: [
            new OA\Response(response: 200, description: 'Trashed products'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 502, description: 'WooCommerce could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function index(): JsonResponse
    {
        try {
            $rows = iterator_to_array($this->woo->paginate('products', ['status' => 'trash']), false);
        } catch (Throwable $e) {
            return response()->json(['message' => WooErrors::describe($e, 'read product trash')], 502);
        }

        $ids = array_column($rows, 'id');
        $previous = $this->previousStatuses($ids);

        $items = array_map(fn (array $p) => [
            'woo_id' => $p['id'],
            'name' => html_entity_decode($p['name'] ?? ''),
            'slug' => $p['slug'] ?? null,
            'sku' => ($p['sku'] ?? '') ?: null,
            'type' => $p['type'] ?? 'simple',
            'price' => ($p['price'] ?? '') !== '' ? $p['price'] : null,
            'regular_price' => ($p['regular_price'] ?? '') !== '' ? $p['regular_price'] : null,
            'sale_price' => ($p['sale_price'] ?? '') !== '' ? $p['sale_price'] : null,
            'stock_status' => $p['stock_status'] ?? null,
            'manage_stock' => (bool) ($p['manage_stock'] ?? false),
            'stock_quantity' => $p['stock_quantity'] ?? null,
            'image_url' => $p['images'][0]['src'] ?? null,
            'categories' => array_map(fn ($c) => html_entity_decode($c['name'] ?? ''), $p['categories'] ?? []),
            'trashed_at' => $previous[$p['id']]['trashed_at'] ?? ($p['date_modified_gmt'] ?? null),
            'previous_status' => $previous[$p['id']]['status'] ?? null,
        ], $rows);

        return response()->json(['data' => $items]);
    }

    #[OA\Post(
        path: '/api/v1/products/trash/{wooId}/restore',
        operationId: 'productsRestore',
        summary: 'Restore a product from the WooCommerce trash',
        description: 'CHANGES THE LIVE STORE. Needs the "products.delete" write switch. The product gets back the status it had when it was trashed from this app. If it was trashed elsewhere, `status` must be given.',
        security: [['bearerAuth' => []]],
        tags: ['Products'],
        requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(properties: [
            new OA\Property(property: 'status', type: 'string', enum: ['publish', 'draft', 'pending', 'private']),
        ])),
        parameters: [new OA\Parameter(name: 'wooId', in: 'path', required: true, description: 'WooCommerce product id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Restored product'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 422, description: 'A status is needed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function restore(Request $request, int $wooId): JsonResponse
    {
        $data = $request->validate(['status' => 'sometimes|in:publish,draft,pending,private']);

        try {
            $trashed = $this->woo->get("products/{$wooId}");
        } catch (Throwable $e) {
            return response()->json(['message' => WooErrors::describe($e, 'read trashed product')], 502);
        }

        if (($trashed['status'] ?? null) !== 'trash') {
            throw ValidationException::withMessages(['product' => 'This product is not in the trash.']);
        }

        $status = $this->previousStatuses([$wooId])[$wooId]['status'] ?? ($data['status'] ?? null);
        if ($status === null) {
            throw ValidationException::withMessages(['status' => 'Choose the status to restore this product with.']);
        }

        $payload = ['status' => $status];

        // WordPress renames a trashed product's slug to "<slug>__trashed"; give back the original.
        $slug = (string) ($trashed['slug'] ?? '');
        if (preg_match('/^(.*)__trashed(-\d+)?$/', $slug, $m) && $m[1] !== '') {
            $payload['slug'] = $m[1];
        }

        $response = $this->writer->run('products', 'restore', $wooId, $payload, ['status' => 'trash', 'slug' => $slug], $request->user(), $request->ip(),
            fn ($c) => $c->put("products/{$wooId}", $payload));

        $product = null;
        $this->writer->mirror(function () use ($response, &$product) {
            $product = $this->sync->storeProduct($response);
        });

        return response()->json($product instanceof WooProduct ? $product->load('categories') : ['woo_id' => $wooId, 'status' => $response['status'] ?? $status]);
    }

    /**
     * What each product looked like when it was trashed from this app (from the audit log).
     *
     * @param  array<int, int>  $wooIds
     * @return array<int, array{status: ?string, trashed_at: ?string}>
     */
    private function previousStatuses(array $wooIds): array
    {
        if ($wooIds === []) {
            return [];
        }

        $out = [];
        WooWriteAudit::where('resource', 'products')->whereIn('action', ['delete', 'restore'])->where('status', 'success')
            ->whereIn('woo_id', $wooIds)->orderBy('id')->get()
            ->each(function (WooWriteAudit $a) use (&$out) {
                // A later restore means an older delete no longer says anything about the current trashing.
                if ($a->action === 'restore') {
                    unset($out[$a->woo_id]);

                    return;
                }

                $status = $a->before['status'] ?? null;
                $out[$a->woo_id] = [
                    'status' => in_array($status, ['publish', 'draft', 'pending', 'private'], true) ? $status : null,
                    'trashed_at' => $a->created_at?->toIso8601String(),
                ];
            });

        return $out;
    }
}
