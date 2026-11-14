<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'PaginationEnvelope',
    description: 'Standard Laravel paginator fields; the records are in `data`.',
    properties: [
        new OA\Property(property: 'current_page', type: 'integer', example: 1),
        new OA\Property(property: 'per_page', type: 'integer', example: 20),
        new OA\Property(property: 'total', type: 'integer', example: 95),
        new OA\Property(property: 'last_page', type: 'integer', example: 5),
        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 20),
        new OA\Property(property: 'next_page_url', type: 'string', nullable: true),
        new OA\Property(property: 'prev_page_url', type: 'string', nullable: true),
    ],
)]
final class PaginationEnvelopeSchema {}
