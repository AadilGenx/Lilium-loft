<?php

namespace App\Filament\Resources\WooWebhookDeliveries\Pages;

use App\Filament\Resources\WooWebhookDeliveries\WooWebhookDeliveryResource;
use Filament\Resources\Pages\ListRecords;

class ListWooWebhookDeliveries extends ListRecords
{
    protected static string $resource = WooWebhookDeliveryResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}
