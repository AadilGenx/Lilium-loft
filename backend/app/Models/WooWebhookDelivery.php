<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WooWebhookDelivery extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['received_at' => 'datetime', 'processed_at' => 'datetime'];
    }
}
