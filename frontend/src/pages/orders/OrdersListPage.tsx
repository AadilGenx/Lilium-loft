import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { MobileList, MobileRow, TableOnly } from '@/components/ui/mobile-list';
import { EmptyState } from '@/components/ui/empty-state';
import { useOrderStore } from '@/store';
import { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { exportToCSV } from '@/utils/csv';

export function OrdersListPage() {
  const navigate = useNavigate();
  const { orders } = useOrderStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  // Same rolling window the dashboard uses, so the two can be compared directly.
  const [period, setPeriod] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      processing: orders.filter((o) => o.status === 'processing').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      onHold: orders.filter((o) => o.status === 'on-hold').length,
      pending: orders.filter((o) => o.status === 'pending').length,
      refunded: orders.filter((o) => o.status === 'refunded').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || o.status === selectedStatus;

      const matchesPeriod =
        period === 'all' || new Date(o.dateCreated).getTime() >= Date.now() - Number(period) * 86_400_000;

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [orders, searchTerm, selectedStatus, period]);

  // What the list adds up to, and how much of it the dashboard counts as sales
  // (processing + completed orders, after refunds). Only shown when every order is in one currency.
  const totals = useMemo(() => {
    const currencies = new Set(filteredOrders.map((o) => o.currency));
    if (filteredOrders.length === 0 || currencies.size !== 1) return null;
    const listed = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const counted = filteredOrders
      .filter((o) => o.status === 'processing' || o.status === 'completed')
      .reduce((sum, o) => sum + o.total - o.refundedTotal, 0);
    return { currency: filteredOrders[0].currency, listed, counted };
  }, [filteredOrders]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'processing':
        return <Badge variant="info">Processing</Badge>;
      case 'on-hold':
        return <Badge variant="warning">On-Hold</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Payment</Badge>;
      case 'refunded':
        return <Badge variant="purple">Refunded</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExport = () => {
    exportToCSV(
      orders.map((o) => ({
        OrderNumber: o.orderNumber,
        Customer: o.customerName,
        Email: o.customerEmail,
        Status: o.status,
        Date: o.dateCreated,
        ItemsCount: o.items.length,
        Total: o.total,
        Currency: o.currency,
        DatePaid: o.datePaid ?? '',
        PaymentMethod: o.paymentMethodTitle,
        TransactionID: o.transactionId,
      })),
      'woocommerce-orders'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Orders
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor, inspect, fulfill and process customer purchases and refunds.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex-1 sm:flex-none gap-1.5 bg-white text-slate-700"
          >
            <Download className="h-4 w-4" />
            <span>Export Orders</span>
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Orders', count: counts.all },
          { key: 'processing', label: 'Processing', count: counts.processing },
          { key: 'completed', label: 'Completed', count: counts.completed },
          { key: 'on-hold', label: 'On-Hold', count: counts.onHold },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'refunded', label: 'Refunded', count: counts.refunded },
          { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
        ].map((tab) => {
          const isActive = selectedStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedStatus(tab.key);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Secondary Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by order number (#1001), customer name, or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-slate-50/50"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={selectedStatus}
                onValueChange={(val) => {
                  setSelectedStatus(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="bg-slate-50/50">
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On-Hold</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={period}
                onValueChange={(val) => {
                  setPeriod(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="bg-slate-50/50">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What the current list adds up to */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-xs text-slate-500">
        <span>
          <strong className="text-slate-800">{filteredOrders.length}</strong>{' '}
          {filteredOrders.length === 1 ? 'order' : 'orders'}
          {totals && (
            <>
              {' '}· total <strong className="text-slate-800">{formatCurrency(totals.listed, totals.currency)}</strong>
            </>
          )}
        </span>
        {totals && (
          <span>
            Counted as sales (processing + completed, after refunds):{' '}
            <strong className="text-slate-800">{formatCurrency(totals.counted, totals.currency)}</strong>
          </span>
        )}
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={ShoppingCart}
                title="No orders found"
                description="No customer orders match your current filter criteria."
              />
            </div>
          ) : (
            <>
<MobileList>
  {paginatedOrders.map((order) => (
    <MobileRow key={order.id} onClick={() => navigate(`/orders/${order.id}`)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
          {getStatusBadge(order.status)}
        </div>
        <span className="font-bold text-slate-900 shrink-0">
          {formatCurrency(order.total, order.currency)}
        </span>
      </div>
      <div className="text-sm text-slate-800 truncate">{order.customerName}</div>
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          {formatDate(order.dateCreated)} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
        </span>
        {order.paymentMethodTitle && <span className="truncate">{order.paymentMethodTitle}</span>}
      </div>
    </MobileRow>
  ))}
</MobileList>
<TableOnly>
<Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden lg:table-cell">Items</TableHead>
                  <TableHead className="hidden lg:table-cell">Payment Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <TableCell className="font-bold text-slate-900 font-mono">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(order.dateCreated)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800 text-xs">
                        {order.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.customerEmail}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-slate-600">
                      {order.items.length}{' '}
                      {order.items.length === 1 ? 'item' : 'items'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-slate-600">
                      {order.paymentMethodTitle}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {formatCurrency(order.total, order.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChevronRight className="h-4 w-4 text-slate-400 inline" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
</TableOnly>
</>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

