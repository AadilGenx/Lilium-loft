<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Parameter(parameter: 'page', name: 'page', in: 'query', description: 'Page number', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1))]
#[OA\Parameter(parameter: 'per_page', name: 'per_page', in: 'query', description: 'Records per page (max 100)', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 20))]
#[OA\Parameter(parameter: 'search', name: 'search', in: 'query', description: 'Free-text search', schema: new OA\Schema(type: 'string'))]
#[OA\Parameter(parameter: 'report_from', name: 'from', in: 'query', description: 'Start date (inclusive). Default: 30 days before `to`.', schema: new OA\Schema(type: 'string', format: 'date', example: '2026-10-15'))]
#[OA\Parameter(parameter: 'report_to', name: 'to', in: 'query', description: 'End date (inclusive). Default: today. Range is limited to 366 days.', schema: new OA\Schema(type: 'string', format: 'date', example: '2026-11-14'))]
#[OA\Response(response: 'Unauthenticated', description: 'Missing or invalid bearer token', content: new OA\JsonContent(ref: '#/components/schemas/Error'))]
#[OA\Response(response: 'NotFound', description: 'Record not found', content: new OA\JsonContent(ref: '#/components/schemas/Error'))]
final class SharedComponents {}
