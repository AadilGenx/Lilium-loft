<?php

namespace App\Filament\Resources\WooCustomers\Pages;

use App\Filament\Resources\WooCustomers\WooCustomerResource;
use Filament\Resources\Pages\ViewRecord;

class ViewWooCustomer extends ViewRecord
{
    protected static string $resource = WooCustomerResource::class;

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
