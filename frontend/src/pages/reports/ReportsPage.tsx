import React, { useEffect, useMemo, useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  reportsApi,
  BackendSalesReport,
  BackendCategoryReportRow,
  BackendProductReportRow,
  BackendCustomerReportRow,
  ReportRange,
} from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { exportToCSV } from '@/utils/csv';
import { toast } from 'sonner';

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Date range and chart grouping for each period choice. */
function rangeFor(period: string): { range: ReportRange; groupBy: 'day' | 'week' | 'month' } {
  const to = new Date();
  const from = new Date();
  if (period === '7d') from.setDate(to.getDate() - 6);
  else if (period === '30d') from.setDate(to.getDate() - 29);
  else if (period === '90d') from.setDate(to.getDate() - 89);
  else {
    from.setMonth(0, 1);
  }
  const groupBy = period === '7d' || period === '30d' ? 'day' : period === '90d' ? 'week' : 'month';
  return { range: { from: isoDay(from), to: isoDay(to) }, groupBy };
}

const EmptyChart = ({ text }: { text: string }) => (
  <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">{text}</div>
);

export function ReportsPage() {
  const [period, setPeriod] = useState('30d');
  const [reportTab, setReportTab] = useState('sales');
  const [loading, setLoading] = useState(false);

  const [sales, setSales] = useState<BackendSalesReport | null>(null);
  const [categories, setCategories] = useState<BackendCategoryReportRow[]>([]);
  const [products, setProducts] = useState<BackendProductReportRow[]>([]);
  const [customers, setCustomers] = useState<BackendCustomerReportRow[]>([]);

  // Reads never raise toasts: a failed report simply shows its empty state.
  useEffect(() => {
    let cancelled = false;
    const { range, groupBy } = rangeFor(period);
    setLoading(true);

    Promise.allSettled([
      reportsApi.sales(range, groupBy),
      reportsApi.categories(range),
      reportsApi.products(range),
      reportsApi.customers(range),
    ]).then(([s, c, p, cu]) => {
      if (cancelled) return;
      setSales(s.status === 'fulfilled' ? s.value : null);
      setCategories(c.status === 'fulfilled' ? c.value : []);
      setProducts(p.status === 'fulfilled' ? p.value : []);
      setCustomers(cu.status === 'fulfilled' ? cu.value : []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [period]);

  const salesSeries = useMemo(
    () =>
      (sales?.data ?? []).map((d) => ({
        period: formatDate(d.period),
        gross: d.gross_sales,
        net: d.net_sales,
        orders: d.orders,
      })),
    [sales]
  );
  const hasSales = (sales?.totals.orders ?? 0) > 0;
  const totals = sales?.totals;

  const handleExportCurrentReport = () => {
    if (reportTab === 'sales') {
      exportToCSV(
        (sales?.data ?? []).map((d) => ({
          Period: d.period,
          Orders: d.orders,
          GrossSales: d.gross_sales,
          NetSales: d.net_sales,
          Discounts: d.discounts,
          Shipping: d.shipping,
          Tax: d.tax,
        })),
        'woocommerce-sales-report'
      );
    } else if (reportTab === 'products') {
      exportToCSV(
        categories.map((c) => ({ Category: c.name, Orders: c.orders, Units: c.units, Revenue: c.revenue })),
        'woocommerce-category-report'
      );
    } else {
      exportToCSV(
        customers.map((c) => ({
          Customer: c.name ?? '',
          Email: c.email,
          Orders: c.orders,
          TotalSpent: c.total_spent,
          LastOrder: c.last_order_at,
        })),
        'woocommerce-customer-report'
      );
    }
    toast.success('CSV export generated successfully.');
  };

  const noData = (text: string) => (
    <div className="p-8 text-center text-xs text-slate-400">{loading ? 'Loading...' : text}</div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Analytics & Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sales, top categories and products, and your best customers. Only processing and completed
            orders count; failed, cancelled, pending and on-hold orders do not.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="flex-1 sm:w-36 bg-white">
              <Calendar className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleExportCurrentReport}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none gap-1.5 bg-white text-slate-700"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={reportTab} onValueChange={setReportTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="sales" className="text-xs">
            Sales Performance
          </TabsTrigger>
          <TabsTrigger value="products" className="text-xs">
            Product & Categories
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs">
            Top Customers
          </TabsTrigger>
        </TabsList>

        {/* Sales Performance Tab */}
        <TabsContent value="sales" className="space-y-6 mt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4 md:p-5">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate block">
                  Gross Sales
                </span>
                <div className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">
                  {totals ? formatCurrency(totals.gross_sales) : '—'}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
                  {totals ? `${totals.items_sold} items sold` : ''}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 md:p-5">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate block">
                  Net Sales
                </span>
                <div className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">
                  {totals ? formatCurrency(totals.net_sales) : '—'}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">After refunds, shipping & tax</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 md:p-5">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate block">
                  Orders Placed
                </span>
                <div className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">{totals ? totals.orders : '—'}</div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
                  {totals
                    ? `${formatCurrency(totals.discounts)} in discounts${
                        totals.refunds > 0 ? ` · ${formatCurrency(totals.refunds)} refunded` : ''
                      }`
                    : ''}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 md:p-5">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate block">
                  Avg. Order Value (AOV)
                </span>
                <div className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">
                  {totals ? formatCurrency(totals.average_order_value) : '—'}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Per order</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">
                Gross vs Net Sales
              </CardTitle>
              <CardDescription className="text-xs">
                {sales ? `Grouped by ${sales.group_by}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] w-full">
                {!hasSales ? (
                  <EmptyChart text={loading ? 'Loading...' : 'No sales in this period'} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip
                        formatter={(val: number) => formatCurrency(val)}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                      <Bar dataKey="gross" name="Gross Sales" fill="#8A1538" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net" name="Net Sales" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product & Category Tab */}
        <TabsContent value="products" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Revenue by Category</CardTitle>
                <CardDescription className="text-xs">
                  Sales across your product categories
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px] w-full">
                  {categories.length === 0 ? (
                    <EmptyChart text={loading ? 'Loading...' : 'No category sales in this period'} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categories}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 30, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(val: number) => formatCurrency(val)} />
                        <Bar dataKey="revenue" name="Revenue" fill="#8A1538" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
                <CardDescription className="text-xs">Units sold and revenue</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {categories.length === 0 ? (
                  noData('No category sales in this period')
                ) : (
                  <>
                    {/* Mobile & Tablet Card View (< lg) */}
                    <div className="lg:hidden p-3 sm:p-4 space-y-2.5 bg-slate-50/40">
                      {categories.map((c) => (
                        <div key={c.category_woo_id} className="p-3 sm:p-3.5 rounded-lg border border-slate-200/80 bg-white shadow-sm flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-xs text-slate-800 block">{c.name}</span>
                            <span className="text-[11px] text-slate-400">{c.units} units sold</span>
                          </div>
                          <span className="font-bold text-xs text-slate-900">{formatCurrency(c.revenue)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View (lg and above) */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">Units Sold</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categories.map((c) => (
                            <TableRow key={c.category_woo_id}>
                              <TableCell className="font-semibold text-slate-800">{c.name}</TableCell>
                              <TableCell className="text-center text-xs">{c.units} units</TableCell>
                              <TableCell className="text-right font-bold text-slate-900">
                                {formatCurrency(c.revenue)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Products</CardTitle>
              <CardDescription className="text-xs">By revenue in this period</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {products.length === 0 ? (
                noData('No product sales in this period')
              ) : (
                <>
                  {/* Mobile & Tablet Card View (< lg) */}
                  <div className="lg:hidden p-3 sm:p-4 space-y-2.5 bg-slate-50/40">
                    {products.map((p) => (
                      <div key={p.product_woo_id} className="p-3 sm:p-3.5 rounded-lg border border-slate-200/80 bg-white shadow-sm flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <span className="font-semibold text-xs text-slate-800 block truncate">{p.name}</span>
                          <span className="text-[11px] text-slate-400">{p.orders} orders • {p.units} units</span>
                        </div>
                        <span className="font-bold text-xs text-slate-900 shrink-0">{formatCurrency(p.revenue)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (lg and above) */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Orders</TableHead>
                          <TableHead className="text-center">Units Sold</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((p) => (
                          <TableRow key={p.product_woo_id}>
                            <TableCell className="font-semibold text-slate-800">{p.name}</TableCell>
                            <TableCell className="text-center text-xs">{p.orders}</TableCell>
                            <TableCell className="text-center text-xs">{p.units}</TableCell>
                            <TableCell className="text-right font-bold text-slate-900">
                              {formatCurrency(p.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Customers Tab */}
        <TabsContent value="customers" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
              <CardDescription className="text-xs">
                Highest spenders in this period, matched by billing e-mail
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {customers.length === 0 ? (
                noData('No customer orders in this period')
              ) : (
                <>
                  {/* Mobile & Tablet Card View (< lg) */}
                  <div className="lg:hidden p-3 sm:p-4 space-y-2.5 bg-slate-50/40">
                    {customers.map((c) => (
                      <div key={c.email} className="p-3 sm:p-3.5 rounded-lg border border-slate-200/80 bg-white shadow-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-800">{c.name || 'Anonymous'}</span>
                          <span className="font-bold text-xs text-slate-900">{formatCurrency(c.total_spent)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="truncate max-w-[200px]">{c.email}</span>
                          <span>{c.orders} {c.orders === 1 ? 'order' : 'orders'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (lg and above) */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-center">Orders</TableHead>
                          <TableHead>Last Order</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((c) => (
                          <TableRow key={c.email}>
                            <TableCell className="font-semibold text-slate-800">{c.name || '-'}</TableCell>
                            <TableCell className="text-xs text-slate-600">{c.email}</TableCell>
                            <TableCell className="text-center text-xs">{c.orders}</TableCell>
                            <TableCell className="text-xs text-slate-500">{formatDate(c.last_order_at)}</TableCell>
                            <TableCell className="text-right font-bold text-slate-900">
                              {formatCurrency(c.total_spent)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
