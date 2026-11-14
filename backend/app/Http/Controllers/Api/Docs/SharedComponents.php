<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Parameter(parameter: 'page', name: 'page', in: 'query', description: 'Page number', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1))]
#[OA\Parameter(parameter: 'per_page', name: 'per_page', in: 'query', description: 'Records per page (max 100)', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 20))]
#[OA\Parameter(parameter: 'search', name: 'search', in: 'query', description: 'Free-text search', schema: new OA\Schema(type: 'string'))]
#[OA\Response(response: 'Unauthenticated', description: 'Missing or invalid bearer token', content: new OA\JsonContent(ref: '#/components/schemas/Error'))]
#[OA\Response(response: 'NotFound', description: 'Record not found', content: new OA\JsonContent(ref: '#/components/schemas/Error'))]
final class SharedComponents {}
