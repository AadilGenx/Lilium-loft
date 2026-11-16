import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
  Calendar,
  Download,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProductStore, useOrderStore, useCustomerStore, useBackendSyncStore } from '@/store';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import { exportToCSV } from '@/utils/csv';
import { stockState } from '@/utils/stock';
import { useCurrencyLabel } from '@/hooks/useCurrencySymbol';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TopProductItem {
  id: string;
  name: string;
  sku: string;
  price?: number;
  salesCount: number;
  revenue: number;
  image: string;
}

export function DashboardPage() {
  const currencyLabel = useCurrencyLabel();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30d');

  const products = useProductStore((s) => s.products);
  const orders = useOrderStore((s) => s.orders);
  const customers = useCustomerStore((s) => s.customers);
  const { summary, revenueHistory, topProducts: backendTopProducts } = useBackendSyncStore();

  // Everything here comes from the backend dashboard endpoints; with no data it simply shows zeros / empty states.
  const totalRevenue = summary?.revenue ?? 0;
  const ordersInPeriod = summary?.orders ?? 0;
  const processingOrders = summary?.awaiting_fulfilment ?? 0;

  const pctChange = (current: number, previous: number): number | null =>
    previous > 0 ? ((current - previous) / previous) * 100 : null;
  const revenueChange = summary ? pctChange(summary.revenue, summary.previous_revenue) : null;
  const ordersChange = summary ? pctChange(summary.orders, summary.previous_orders) : null;

  const Change = ({ value }: { value: number | null }) =>
    value === null ? null : (
      <span
        className={`flex items-center font-medium ${value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
      >
        <TrendingUp className={`h-3.5 w-3.5 mr-0.5 ${value < 0 ? 'rotate-180' : ''}`} />
        {value >= 0 ? '+' : ''}
        {value.toFixed(1)}%
      </span>
    );

  const lowStockProducts = products.filter((p) => stockState(p) !== 'in');

  const activeChartData = useMemo(
    () =>
      (revenueHistory ?? []).map((pt) => ({
        date: pt.date.slice(5),
        sales: pt.revenue,
        orders: pt.orders,
      })),
    [revenueHistory]
  );

  const topSellingProducts = useMemo<TopProductItem[]>(
    () =>
      (backendTopProducts ?? []).slice(0, 5).map((tp) => ({
        id: String(tp.id),
        name: tp.name,
        sku: tp.sku ?? '',
        price: tp.total_sales > 0 ? tp.revenue / tp.total_sales : undefined,
        salesCount: tp.total_sales,
        revenue: tp.revenue,
        image: tp.image_url ?? '',
      })),
    [backendTopProducts]
  );

  const handleExportSummary = () => {
    exportToCSV(
      orders.map((o) => ({
        OrderNumber: o.orderNumber,
        Customer: o.customerName,
        Status: o.status,
        Date: o.dateCreated,
        Total: o.total,
        PaymentMethod: o.paymentMethodTitle,
      })),
      'woocommerce-sales-summary'
    );
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'processing':
        return <Badge variant="info">Processing</Badge>;
      case 'on-hold':
        return <Badge variant="warning">On-Hold</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'refunded':
        return <Badge variant="purple">Refunded</Badge>;
      case 'cancelled':
      case 'failed':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Store Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time analytics and store performance from your WooCommerce catalog.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="flex-1 sm:w-36 bg-white">
              <Calendar className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleExportSummary}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none gap-1.5 bg-white text-slate-700"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Revenue
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {summary ? formatCurrency(totalRevenue) : '—'}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <Change value={revenueChange} />
                <span className="text-slate-400">
                  {summary ? (revenueChange === null ? `last ${summary.days} days` : 'vs previous period') : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Orders
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {summary ? formatNumber(ordersInPeriod) : '—'}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <Change value={ordersChange} />
                <span className="text-slate-400">
                  {summary ? `${processingOrders} processing` : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Products */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Catalog Items
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {summary ? formatNumber(summary.published_products) : '—'}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                {(summary?.out_of_stock_products ?? 0) > 0 ? (
                  <span className="flex items-center text-amber-600 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 mr-0.5" />
                    {summary?.out_of_stock_products} out of stock
                  </span>
                ) : (
                  <span className="text-slate-400">published products</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Customers
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {summary ? formatNumber(summary.customers) : '—'}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="text-slate-400">registered customers</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Sales Chart & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Gross Revenue & Sales
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Daily sales performance over selected period
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600"></span>
                <span>Revenue{currencyLabel}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              {activeChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No sales data yet.
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activeChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8A1538" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#8A1538" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                            <p className="font-semibold text-slate-800">
                              {payload[0].payload.date}
                            </p>
                            <p className="text-red-600 font-bold mt-1">
                              Revenue: {formatCurrency(payload[0].value as number)}
                            </p>
                            <p className="text-slate-500">
                              Orders: {payload[0].payload.orders}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Watchlist */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Low Stock Alerts</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Products requiring replenishment
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/inventory')}
              className="text-xs text-red-600 hover:text-red-700 h-8"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto divide-y divide-slate-100 p-0 px-6">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No low-stock or out-of-stock products.
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {p.images[0] && (
                        <img
                          src={p.images[0].src}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-slate-400">SKU: {p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        stockState(p) === 'out'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {stockState(p) === 'out' ? 'Out of stock' : `${p.stockQuantity} left`}
                    </span>
                    <button
                      onClick={() => navigate('/inventory')}
                      className="block text-[11px] text-red-600 hover:underline mt-0.5 ml-auto font-medium"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Recent Orders
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Latest customer transactions from checkout
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/orders')}
              className="text-xs h-8"
            >
              View all orders
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {orders.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">No orders yet.</div>
              )}
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                      {order.orderNumber}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {order.customerName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(order.dateCreated)} • {order.items.length}{' '}
                        {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getOrderStatusBadge(order.status)}
                    <span className="text-xs font-bold text-slate-800 w-16 text-right">
                      {formatCurrency(order.total, order.currency)}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Top Performing Products
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Bestsellers by revenue and unit volume
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/reports')}
              className="text-xs h-8"
            >
              Full report
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {topSellingProducts.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">No sales yet.</div>
              )}
              {topSellingProducts.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/products/${p.id}`)}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">
                      #{idx + 1}
                    </span>
                    <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {p.salesCount} sold{p.price !== undefined ? ` • ${formatCurrency(p.price)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(p.revenue)}
                    </span>
                    <span className="block text-[10px] text-emerald-600 font-medium">
                      High margin
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

