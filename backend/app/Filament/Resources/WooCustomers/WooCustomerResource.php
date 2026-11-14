<?php

namespace App\Filament\Resources\WooCustomers;

use App\Filament\Concerns\ReadOnlyResource;
use App\Filament\Resources\WooCustomers\Pages\ListWooCustomers;
use App\Filament\Resources\WooCustomers\Pages\ViewWooCustomer;
use App\Models\WooCustomer;
use BackedEnum;
use Filament\Actions\ViewAction;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class WooCustomerResource extends Resource
{
    use ReadOnlyResource;

    protected static ?string $model = WooCustomer::class;

    protected static ?string $modelLabel = 'Customer';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUsers;

    protected static ?int $navigationSort = 3;

    public static function infolist(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Customer')->columns(3)->schema([
                TextEntry::make('full_name')->label('Name'),
                TextEntry::make('email'),
                TextEntry::make('phone')->placeholder('-'),
                TextEntry::make('city')->placeholder('-'),
                TextEntry::make('state')->placeholder('-'),
                TextEntry::make('country')->placeholder('-'),
                TextEntry::make('orders_count'),
                TextEntry::make('total_spent')->money('INR'),
                TextEntry::make('woo_created_at')->label('Registered')->dateTime(),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('woo_created_at', 'desc')
            ->columns([
                TextColumn::make('full_name')->label('Name')->searchable(['first_name', 'last_name', 'username']),
                TextColumn::make('email')->searchable(),
                TextColumn::make('phone')->toggleable()->placeholder('-'),
                TextColumn::make('city')->toggleable()->placeholder('-'),
                TextColumn::make('orders_count')->label('Orders')->sortable(),
                TextColumn::make('total_spent')->money('INR')->sortable(),
                TextColumn::make('woo_created_at')->label('Registered')->dateTime()->sortable(),
            ])
            ->recordActions([ViewAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListWooCustomers::route('/'),
            'view' => ViewWooCustomer::route('/{record}'),
        ];
    }
}
