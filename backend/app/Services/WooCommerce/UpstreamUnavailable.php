<?php

namespace App\Services\WooCommerce;

use RuntimeException;

/** WooCommerce could not be read right now (error response, unreachable or not configured). */
class UpstreamUnavailable extends RuntimeException {}
