import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Package,
} from 'lucide-react';
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
  LineChart,
  Line,
} from 'recharts';
import { useProductStore, useOrderStore, useCustomerStore } from '@/store';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { exportToCSV } from '@/utils/csv';
import { toast } from 'sonner';

export function ReportsPage() {
  const [period, setPeriod] = useState('30d');
  const [reportTab, setReportTab] = useState('sales');

  const products = useProductStore((s) => s.products);
  const orders = useOrderStore((s) => s.orders);
  const customers = useCustomerStore((s) => s.customers);

  // Sales Analytics Sample Datasets
  const salesTimeSeries = [
    { period: 'Week 1', gross: 4200, net: 3890, orders: 14 },
    { period: 'Week 2', gross: 5600, net: 5120, orders: 19 },
    { period: 'Week 3', gross: 7100, net: 6540, orders: 24 },
    { period: 'Week 4', gross: 8400, net: 7890, orders: 28 },
  ];

  const categoryPerformance = [
    { category: 'Watches', revenue: 10458, units: 42 },
    { category: 'Leather Goods', revenue: 9349, units: 30 },
    { category: 'Audio & Tech', revenue: 6615, units: 35 },
    { category: 'Apparel', revenue: 5225, units: 48 },
    { category: 'Home & Living', revenue: 2140, units: 38 },
  ];

  const customerCohorts = [
    { month: 'Nov', newUsers: 34, returning: 12 },
    { month: 'Dec', newUsers: 58, returning: 24 },
    { month: 'Jan', newUsers: 46, returning: 31 },
    { month: 'Feb', newUsers: 62, returning: 39 },
  ];

  const handleExportCurrentReport = () => {
    if (reportTab === 'sales') {
      exportToCSV(salesTimeSeries, 'woocommerce-sales-report');
    } else if (reportTab === 'products') {
      exportToCSV(categoryPerformance, 'woocommerce-product-category-report');
    } else {
      exportToCSV(customerCohorts, 'woocommerce-customer-cohort-report');
    }
    toast.success('CSV export generated successfully.');
  };

  const totalGross = salesTimeSeries.reduce((s, i) => s + i.gross, 0);
  const totalNet = salesTimeSeries.reduce((s, i) => s + i.net, 0);
  const totalOrdersCount = salesTimeSeries.reduce((s, i) => s + i.orders, 0);
  const avgOrderValue = totalOrdersCount > 0 ? totalGross / totalOrdersCount : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Analytics & Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluate revenue velocity, top grossing categories, customer cohorts and order health.
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
              <SelectItem value="90d">Last Quarter</SelectItem>
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
            <span>Export Report CSV</span>
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
            Customer Trends
          </TabsTrigger>
        </TabsList>

        {/* Sales Performance Tab */}
        <TabsContent value="sales" className="space-y-6 mt-0">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Gross Sales
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(totalGross)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="h-3.5 w-3.5" /> +16.4% growth
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Net Sales
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(totalNet)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  After taxes & discounts
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Orders Placed
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {totalOrdersCount}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  98.2% checkout conversion
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Avg. Order Value (AOV)
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(avgOrderValue)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Per completed transaction
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart Gross vs Net */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">
                Gross vs Net Revenue by Week
              </CardTitle>
              <CardDescription className="text-xs">
                Weekly comparison of top-line merchandise volume vs settled earnings
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesTimeSeries}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="gross" name="Gross Sales" fill="#8A1538" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="net" name="Net Sales" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product & Category Tab */}
        <TabsContent value="products" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Revenue by Department
                </CardTitle>
                <CardDescription className="text-xs">
                  Sales breakdown across primary store categories
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryPerformance}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 30, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="category"
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Bar dataKey="revenue" fill="#8A1538" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Department Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Units shipped and net sales volume
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Units Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryPerformance.map((c) => (
                      <TableRow key={c.category}>
                        <TableCell className="font-semibold text-slate-800">
                          {c.category}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {c.units} units
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {formatCurrency(c.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Trends Tab */}
        <TabsContent value="customers" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                New vs Returning Customers
              </CardTitle>
              <CardDescription className="text-xs">
                Monthly customer acquisition and repeat buyer retention rates
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={customerCohorts}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="newUsers"
                      name="New Customers"
                      stroke="#DC2626"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="returning"
                      name="Returning Buyers"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

