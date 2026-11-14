<?php

namespace App\Filament\Resources\WooCustomers\Pages;

use App\Filament\Resources\WooCustomers\WooCustomerResource;
use Filament\Resources\Pages\ListRecords;

class ListWooCustomers extends ListRecords
{
    protected static string $resource = WooCustomerResource::class;

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
