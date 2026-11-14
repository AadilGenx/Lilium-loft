<?php

namespace App\Filament\Resources\WooCoupons;

use App\Filament\Concerns\ReadOnlyResource;
use App\Filament\Resources\WooCoupons\Pages\ListWooCoupons;
use App\Filament\Resources\WooCoupons\Pages\ViewWooCoupon;
use App\Models\WooCoupon;
use BackedEnum;
use Filament\Actions\ViewAction;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class WooCouponResource extends Resource
{
    use ReadOnlyResource;

    protected static ?string $model = WooCoupon::class;

    protected static ?string $modelLabel = 'Coupon';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTicket;

    protected static ?int $navigationSort = 4;

    public static function infolist(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Coupon')->columns(3)->schema([
                TextEntry::make('code'),
                TextEntry::make('discount_type')->badge(),
                TextEntry::make('amount'),
                TextEntry::make('usage_count'),
                TextEntry::make('usage_limit')->placeholder('Unlimited'),
                IconEntry::make('free_shipping')->boolean(),
                TextEntry::make('expires_at')->dateTime()->placeholder('Never'),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('code')->searchable()->sortable(),
                TextColumn::make('discount_type')->badge(),
                TextColumn::make('amount')->sortable(),
                TextColumn::make('usage_count')->label('Used')->sortable(),
                TextColumn::make('usage_limit')->label('Limit')->placeholder('∞'),
                TextColumn::make('expires_at')->dateTime()->placeholder('Never')->sortable(),
            ])
            ->recordActions([ViewAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListWooCoupons::route('/'),
            'view' => ViewWooCoupon::route('/{record}'),
        ];
    }
}
