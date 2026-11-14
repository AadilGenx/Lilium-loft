<?php

namespace App\Filament\Widgets;

use App\Models\WooOrder;
use Filament\Widgets\ChartWidget;

class OrdersByStatus extends ChartWidget
{
    protected static ?int $sort = 3;

    protected ?string $heading = 'Orders by status';

    protected function getData(): array
    {
        $rows = WooOrder::selectRaw('status, COUNT(*) as c')->groupBy('status')->orderByDesc('c')->pluck('c', 'status');

        return [
            'datasets' => [['data' => $rows->values()->all(), 'backgroundColor' => ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899']]],
            'labels' => $rows->keys()->all(),
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }
}
