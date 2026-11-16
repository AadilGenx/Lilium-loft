<?php

namespace App\Filament\Resources\WooWebhookDeliveries;

use App\Filament\Concerns\ReadOnlyResource;
use App\Filament\Resources\WooWebhookDeliveries\Pages\ListWooWebhookDeliveries;
use App\Models\WooWebhookDelivery;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

/** Read-only log of webhooks received from WooCommerce. */
class WooWebhookDeliveryResource extends Resource
{
    use ReadOnlyResource;

    protected static ?string $model = WooWebhookDelivery::class;

    protected static ?string $modelLabel = 'Webhook';

    protected static ?string $navigationLabel = 'Webhooks';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBolt;

    protected static ?int $navigationSort = 80;

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('received_at')->label('Received')->dateTime()->sortable(),
                TextColumn::make('topic')->searchable(),
                TextColumn::make('woo_id')->label('Woo ID')->searchable(),
                TextColumn::make('status')->badge()->color(fn (string $state) => match ($state) {
                    'processed' => 'success',
                    'failed' => 'danger',
                    'ignored' => 'gray',
                    default => 'warning',
                }),
                TextColumn::make('attempts')->label('Tries'),
                TextColumn::make('processed_at')->label('Processed')->dateTime()->placeholder('—'),
                TextColumn::make('error')->limit(60)->placeholder('—'),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    'received' => 'Received (waiting)',
                    'processed' => 'Processed',
                    'ignored' => 'Ignored (older copy)',
                    'failed' => 'Failed',
                ]),
            ])
            ->defaultSort('id', 'desc');
    }

    public static function getPages(): array
    {
        return ['index' => ListWooWebhookDeliveries::route('/')];
    }
}
