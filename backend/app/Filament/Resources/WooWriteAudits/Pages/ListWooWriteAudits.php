<?php

namespace App\Filament\Resources\WooWriteAudits\Pages;

use App\Filament\Resources\WooWriteAudits\WooWriteAuditResource;
use Filament\Resources\Pages\ListRecords;

class ListWooWriteAudits extends ListRecords
{
    protected static string $resource = WooWriteAuditResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}
