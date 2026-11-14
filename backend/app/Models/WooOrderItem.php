<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WooOrderItem extends Model
{
    protected $table = 'woo_order_items';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }


    public $timestamps = false;

    public function order(): BelongsTo
    {
        return $this->belongsTo(WooOrder::class, 'order_woo_id', 'woo_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(WooProduct::class, 'product_woo_id', 'woo_id');
    }
}
