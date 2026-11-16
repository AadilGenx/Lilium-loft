<?php

namespace App\Services\WooCommerce;

use RuntimeException;

/** A write to WooCommerce did not go through (rejected, unreachable or blocked). */
class WriteFailed extends RuntimeException
{
    public function __construct(string $message, public readonly int $upstreamStatus = 0)
    {
        parent::__construct($message);
    }
}
