import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  User,
  CreditCard,
  Truck,
  RotateCcw,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOrderStore, useCustomerStore } from '@/store';
import { OrderStatus } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import { useCurrencyLabel } from '@/hooks/useCurrencySymbol';
import { STICKY_COLUMN } from '@/utils/sticky';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';

export function OrderDetailPage() {
  const currencyLabel = useCurrencyLabel();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, loaded: ordersLoaded, loadOrderDetails, updateOrderStatus, addOrderNote, refundOrder } = useOrderStore();

  const order = orders.find((o) => o.id === id);
  const customers = useCustomerStore((st) => st.customers);
  const linkedCustomer = order
    ? customers.find((c) => c.wooId > 0 && String(c.wooId) === order.customerId)
    : undefined;

  // Notes and refunds live in WooCommerce; load them for this order.
  useEffect(() => {
    if (id && order?.id) loadOrderDetails(id);
  }, [id, order?.id, order?.status, order?.total, loadOrderDetails]);

  // New Note State
  const [newNote, setNewNote] = useState('');
  const [isCustomerNote, setIsCustomerNote] = useState(false);

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');

  if (!order && !ordersLoaded) return <PageLoading label="Loading order..." />;

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4">
        <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Order not found</h2>
        <Button onClick={() => navigate('/orders')} variant="outline">
          Back to Orders
        </Button>
      </div>
    );
  }

  const totalRefunded = order.refunds.reduce((sum, r) => sum + r.amount, 0);
  const remainingRefundable = Math.max(0, order.total - totalRefunded);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus);
      toast.success(`Order status changed to ${newStatus}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await addOrderNote(order.id, newNote.trim(), isCustomerNote);
      setNewNote('');
      toast.success('Note added to order history.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleProcessRefund = async () => {
    if (refundAmount <= 0) {
      toast.error('Refund amount must be greater than zero.');
      return;
    }
    if (refundAmount > remainingRefundable) {
      toast.error(`Maximum refundable amount is ${formatCurrency(remainingRefundable, order.currency)}.`);
      return;
    }
    if (!refundReason.trim()) {
      toast.error('Please specify a reason for this refund.');
      return;
    }

    try {
      await refundOrder(order.id, refundAmount, refundReason.trim());
      toast.success(`Refund of ${formatCurrency(refundAmount, order.currency)} recorded in WooCommerce.`);
      setRefundModalOpen(false);
      setRefundReason('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

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

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/orders')}
            className="h-9 w-9 bg-white shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Order {order.orderNumber}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {formatDateTime(order.dateCreated)}
              {order.paymentMethodTitle ? ` • Via ${order.paymentMethodTitle}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status selector */}
          <div className="flex-1 sm:w-44">
            <Select
              value={order.status}
              onValueChange={(val: OrderStatus) => handleStatusChange(val)}
            >
              <SelectTrigger className="bg-white text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On-Hold</SelectItem>
                <SelectItem value="pending">Pending Payment</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {remainingRefundable > 0 && order.status !== 'cancelled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRefundAmount(remainingRefundable);
                setRefundModalOpen(true);
              }}
              className="gap-1.5 bg-white text-red-600 border-red-200 hover:bg-red-50 shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Refund</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Columns: Items, Totals, Addresses (8 cols on lg/xl) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Ordered Items Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold">
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingCart className="h-5 w-5 m-3.5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">
                          {item.name}
                        </div>
                        {item.sku && (
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            SKU: {item.sku}
                          </div>
                        )}
                        {item.attributes && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {Object.entries(item.attributes)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.total, order.currency)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatCurrency(item.price, order.currency)} × {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown: only amounts WooCommerce reports for this order */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2 text-xs">
                {order.subtotal !== undefined && (
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal:</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(order.subtotal, order.currency)}
                    </span>
                  </div>
                )}
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount:</span>
                    <span>-{formatCurrency(order.discountTotal, order.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Shipping:</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(order.shippingTotal, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax:</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(order.taxTotal, order.currency)}
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Order Total:</span>
                  <span>{formatCurrency(order.total, order.currency)}</span>
                </div>

                {totalRefunded > 0 && (
                  <>
                    <div className="flex justify-between text-purple-600 font-medium">
                      <span>Total Refunded:</span>
                      <span>-{formatCurrency(totalRefunded, order.currency)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Net After Refunds:</span>
                      <span className="text-red-600">
                        {formatCurrency(order.total - totalRefunded, order.currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing & Shipping Addresses Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Billing */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  <span>Billing Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 text-sm">
                  {order.billing.firstName} {order.billing.lastName}
                </p>
                {order.billing.address1 && <p>{order.billing.address1}</p>}
                {order.billing.address2 && <p>{order.billing.address2}</p>}
                <p>
                  {[order.billing.city, order.billing.state, order.billing.postcode].filter(Boolean).join(', ')}
                </p>
                {order.billing.country && <p>{order.billing.country}</p>}
                {order.billing.email && (
                  <p className="pt-2 text-slate-500">
                    Email: <span className="text-slate-800">{order.billing.email}</span>
                  </p>
                )}
                {order.billing.phone && (
                  <p className="text-slate-500">
                    Phone: <span className="text-slate-800">{order.billing.phone}</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-500" />
                  <span>Shipping Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 text-sm">
                  {order.shipping.firstName} {order.shipping.lastName}
                </p>
                {order.shipping.address1 && <p>{order.shipping.address1}</p>}
                {order.shipping.address2 && <p>{order.shipping.address2}</p>}
                <p>
                  {[order.shipping.city, order.shipping.state, order.shipping.postcode].filter(Boolean).join(', ')}
                </p>
                {order.shipping.country && <p>{order.shipping.country}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Refund History (if any) */}
          {order.refunds.length > 0 && (
            <Card className="border-purple-200 bg-purple-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-purple-600" />
                  <span>Refund Transactions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-purple-100">
                  {order.refunds.map((ref) => (
                    <div key={ref.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-1 text-xs">
                      <div>
                        <div className="font-semibold text-purple-900">
                          {formatCurrency(ref.amount, order.currency)} Refunded
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Reason: {ref.reason}
                        </div>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatDateTime(ref.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Customer Info & Order Notes Feed (4 cols on lg/xl) */}
        <div className={`lg:col-span-4 space-y-6 ${STICKY_COLUMN}`}>
          {/* Customer Overview Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                <span>Customer Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {order.customerName}
                </p>
                <p className="text-slate-500">{order.customerEmail}</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                {order.customerId === '0' ? (
                  <span className="text-xs text-slate-400">Guest checkout (no customer account)</span>
                ) : linkedCustomer ? (
                  <button
                    onClick={() => navigate(`/customers/${linkedCustomer.id}`)}
                    className="text-xs text-red-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View Customer History</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <span>Payment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-semibold text-slate-800">
                  {order.paymentMethodTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-800 text-[11px] truncate max-w-[140px]" title={order.transactionId}>
                  {order.transactionId || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid:</span>
                <span className="font-semibold text-slate-800">
                  {order.datePaid ? formatDateTime(order.datePaid) : 'Not paid'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes Feed Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <span>Order Notes & Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Notes timeline */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {order.notes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notes on this order yet.</p>
                ) : (
                  order.notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg text-xs space-y-1 ${
                        note.isCustomerNote
                          ? 'bg-blue-50/80 border border-blue-200'
                          : 'bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${
                            note.isCustomerNote ? 'text-blue-700' : 'text-slate-700'
                          }`}
                        >
                          {note.author}{' '}
                          {note.isCustomerNote && (
                            <span className="text-[10px] font-normal text-blue-500">(Customer Note)</span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(note.date)}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-3 pt-3 border-t border-slate-100">
                <Textarea
                  placeholder="Add a private note or customer message..."
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="text-xs"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={isCustomerNote}
                      onChange={(e) => setIsCustomerNote(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-600"
                    />
                    <span>Visible to customer</span>
                  </label>
                  <Button type="submit" size="sm" className="gap-1 bg-red-600 hover:bg-red-700 text-white text-xs h-8">
                    <Send className="h-3 w-3" />
                    <span>Add Note</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Refund Modal Dialog */}
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="h-4 w-4 text-red-600" />
              <span>Record Order Refund</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Records a refund on this order in WooCommerce. It does not send money back: return the payment to the customer through {order.paymentMethodTitle || 'the payment gateway'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs flex justify-between">
              <span className="text-slate-600">Max Refundable Amount:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(remainingRefundable, order.currency)}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Refund Amount{currencyLabel}
              </label>
              <Input
                type="number"
                step="0.01"
                max={remainingRefundable}
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Reason for Refund <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="e.g. Customer returned items, damaged during shipment, cancellation"
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefundModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleProcessRefund}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Refund of {formatCurrency(refundAmount, order.currency)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
