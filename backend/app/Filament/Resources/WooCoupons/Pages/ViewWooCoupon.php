<?php

namespace App\Filament\Resources\WooCoupons\Pages;

use App\Filament\Resources\WooCoupons\WooCouponResource;
use Filament\Resources\Pages\ViewRecord;

class ViewWooCoupon extends ViewRecord
{
    protected static string $resource = WooCouponResource::class;

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
