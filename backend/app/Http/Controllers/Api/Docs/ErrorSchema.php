<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Error',
    properties: [new OA\Property(property: 'message', type: 'string', example: 'Unauthenticated.')],
)]
final class ErrorSchema {}
