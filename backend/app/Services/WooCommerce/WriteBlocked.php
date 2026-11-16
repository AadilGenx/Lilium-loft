<?php

namespace App\Services\WooCommerce;

use RuntimeException;

/** A write was refused locally (switch off). The message is written by us and safe to show. */
class WriteBlocked extends RuntimeException {}
