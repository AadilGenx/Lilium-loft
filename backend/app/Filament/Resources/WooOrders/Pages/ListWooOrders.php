<?php

namespace App\Filament\Resources\WooOrders\Pages;

use App\Filament\Resources\WooOrders\WooOrderResource;
use Filament\Resources\Pages\ListRecords;

class ListWooOrders extends ListRecords
{
    protected static string $resource = WooOrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
