<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ValidationError',
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'The email field is required.'),
        new OA\Property(property: 'errors', type: 'object', example: ['email' => ['The email field is required.']]),
    ],
)]
final class ValidationErrorSchema {}
