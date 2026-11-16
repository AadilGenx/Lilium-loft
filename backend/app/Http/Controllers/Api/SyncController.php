<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WooCommerce\MirrorVersion;
use App\Services\WooCommerce\WooErrors;
use App\Services\WooCommerce\WooSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use OpenApi\Attributes as OA;
use Throwable;

class SyncController extends Controller
{
    #[OA\Post(
        path: '/api/v1/sync',
        operationId: 'syncRun',
        summary: 'Import everything from WooCommerce into the local database',
        description: 'Runs the same READ-ONLY import as `php artisan woo:sync`: categories, products, customers, orders and coupons are fetched from WooCommerce (GET requests only) and saved or updated in the local database. Nothing is changed in WooCommerce. It runs to completion before responding, so it can take a while on a large store. Only one import runs at a time. Records deleted in WooCommerce are removed locally by webhooks, not by this import.',
        security: [['bearerAuth' => []]],
        tags: ['Sync'],
        responses: [
            new OA\Response(response: 200, description: 'Import finished (check each resource: one can fail while the others succeed)', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'ok', type: 'boolean', description: 'True only when every resource imported'),
                new OA\Property(property: 'results', type: 'array', items: new OA\Items(properties: [
                    new OA\Property(property: 'resource', type: 'string', example: 'products'),
                    new OA\Property(property: 'status', type: 'string', enum: ['ok', 'failed']),
                    new OA\Property(property: 'records', type: 'integer', example: 95),
                    new OA\Property(property: 'error', type: 'string', nullable: true),
                ])),
                new OA\Property(property: 'finished_at', type: 'string', format: 'date-time'),
            ])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 409, description: 'An import is already running', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 502, description: 'Every resource failed (WooCommerce unreachable or not configured)', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function run(WooSyncService $sync): JsonResponse
    {
        $lock = Cache::lock('woo-sync-run', 900);
        if (! $lock->get()) {
            return response()->json(['message' => 'An import is already running. Try again in a moment.'], 409);
        }

        // A full import can outlive a PHP request: let it finish even if the browser goes away.
        ignore_user_abort(true);
        set_time_limit(0);

        try {
            $results = [];
            // Order matters: categories first, so products can be linked to them.
            foreach (WooSyncService::RESOURCES as $resource) {
                try {
                    $results[] = ['resource' => $resource, 'status' => 'ok', 'records' => $sync->sync($resource), 'error' => null];
                } catch (Throwable $e) {
                    // The real cause goes to laravel.log; the response only carries a generic sentence.
                    $results[] = ['resource' => $resource, 'status' => 'failed', 'records' => 0, 'error' => WooErrors::describe($e, "import {$resource}")];
                }
            }
        } finally {
            $lock->release();
        }

        $failed = collect($results)->where('status', 'failed');
        if ($failed->count() === count($results)) {
            return response()->json(['message' => $failed->first()['error']], 502);
        }

        return response()->json([
            'ok' => $failed->isEmpty(),
            'results' => $results,
            'finished_at' => now()->toIso8601String(),
        ]);
    }

    #[OA\Get(
        path: '/api/v1/sync/changes',
        operationId: 'syncChanges',
        summary: 'Change counters for the mirrored data',
        description: 'One number per kind of record that goes up every time a record is saved or removed locally (webhook, import or a change made through this API). Poll it cheaply and reload a list only when its number changed. The numbers are only meaningful to compare with a previous value; they can reset (for example after a cache clear), so treat any difference as a change. Reads local data only; WooCommerce is not contacted.',
        security: [['bearerAuth' => []]],
        tags: ['Sync'],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'products', type: 'integer', example: 12),
                new OA\Property(property: 'orders', type: 'integer', example: 40),
                new OA\Property(property: 'customers', type: 'integer', example: 7),
                new OA\Property(property: 'coupons', type: 'integer', example: 2),
                new OA\Property(property: 'categories', type: 'integer', example: 5),
            ])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function changes(): JsonResponse
    {
        return response()->json(MirrorVersion::all());
    }
}
