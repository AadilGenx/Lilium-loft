<?php

namespace App\Services\WooCommerce;

use RuntimeException;

/** The WooCommerce URL or API credentials are missing. The message is for the log only. */
class WooNotConfigured extends RuntimeException {}
