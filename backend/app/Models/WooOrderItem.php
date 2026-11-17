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

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if ($this->relationLoaded('product') && $this->product) {
            return $this->product->image_url;
        }

        if ($this->product_woo_id) {
            $product = WooProduct::where('woo_id', $this->product_woo_id)->first();
            if ($product && !empty($product->image_url)) {
                return $product->image_url;
            }
        }

        if ($this->order_woo_id) {
            $order = $this->relationLoaded('order') ? $this->order : WooOrder::where('woo_id', $this->order_woo_id)->first();
            if ($order && is_array($order->raw)) {
                foreach ($order->raw['line_items'] ?? [] as $rawItem) {
                    if (($rawItem['id'] ?? null) == $this->woo_item_id) {
                        return $rawItem['image']['src'] ?? null;
                    }
                }
            }
        }

        return null;
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(WooOrder::class, 'order_woo_id', 'woo_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(WooProduct::class, 'product_woo_id', 'woo_id');
    }
}
