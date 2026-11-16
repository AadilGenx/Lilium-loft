import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  MapPin,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCustomerStore, useOrderStore } from '@/store';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { initials } from '@/utils/initials';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, updateCustomerAddress } = useCustomerStore();
  const { orders } = useOrderStore();

  const customer = customers.find((c) => c.id === id);
  const customerOrders = orders.filter(
    (o) =>
      (customer && customer.wooId > 0 && o.customerId === String(customer.wooId)) ||
      (!!customer?.email && o.customerEmail.toLowerCase() === customer.email.toLowerCase())
  );

  // Address edit modal state
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [billingAddress, setBillingAddress] = useState(
    customer?.billing || {
      firstName: '',
      lastName: '',
      address1: '',
      city: '',
      state: '',
      postcode: '',
      country: '',
      email: '',
      phone: '',
    }
  );

  if (!customer) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Customer not found</h2>
        <Button onClick={() => navigate('/customers')} variant="outline">
          Back to Customers List
        </Button>
      </div>
    );
  }

  // Lifetime figures straight from WooCommerce.
  const computedTotalSpent = customer.totalSpent;
  const computedOrdersCount = customer.totalOrders;
  const aov = computedOrdersCount > 0 ? computedTotalSpent / computedOrdersCount : 0;

  const handleSaveAddress = async () => {
    try {
      await updateCustomerAddress(customer.id, billingAddress);
      toast.success('Customer address updated.');
      setEditAddressOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
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
    <div className="space-y-6 w-full pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/customers')}
            className="h-9 w-9 bg-white shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <span className="h-full w-full flex items-center justify-center text-xs font-semibold text-slate-600">{initials(customer.firstName, customer.lastName)}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {customer.firstName} {customer.lastName}
                </h1>
                <Badge variant="secondary">{customer.role}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Customer since {formatDate(customer.registeredDate)} • @{customer.username}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBillingAddress(customer.billing);
              setEditAddressOpen(true);
            }}
            className="gap-1.5 bg-white text-slate-700"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Addresses</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Lifetime Value (LTV)
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(computedTotalSpent)}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Orders
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {computedOrdersCount}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Average Order Value
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(aov)}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order History (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Purchase History ({customerOrders.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  All past transactions placed by this account
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {customerOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No orders placed by this customer yet.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-12 text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerOrders.map((ord) => (
                        <TableRow
                          key={ord.id}
                          onClick={() => navigate(`/orders/${ord.id}`)}
                          className="cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <TableCell className="font-bold font-mono text-slate-900 text-xs">
                            {ord.orderNumber}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(ord.dateCreated)}
                          </TableCell>
                          <TableCell>{getOrderStatusBadge(ord.status)}</TableCell>
                          <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                            {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900 text-xs">
                            {formatCurrency(ord.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <ExternalLink className="h-3.5 w-3.5 text-slate-400 inline" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Address Cards & Notes (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Contact Details */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <a href={`mailto:${customer.email}`} className="text-red-600 hover:underline truncate">
                  {customer.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{customer.billing.phone || '+1 (217) 555-0192'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Joined {formatDate(customer.registeredDate)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Billing & Shipping Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span>Default Address</span>
              </CardTitle>
              <button
                onClick={() => {
              setBillingAddress(customer.billing);
              setEditAddressOpen(true);
            }}
                className="text-xs text-red-600 hover:underline font-medium"
              >
                Edit
              </button>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800 text-sm">
                {customer.billing.firstName} {customer.billing.lastName}
              </p>
              <p>{customer.billing.address1 || '742 Evergreen Terrace'}</p>
              <p>
                {customer.billing.city || 'Springfield'}, {customer.billing.state || 'IL'}{' '}
                {customer.billing.postcode || '62704'}
              </p>
              <p>{customer.billing.country}</p>
            </CardContent>
          </Card>

          {/* Customer Internal Note */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold">Administrative Note</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-slate-600">
              {customer.notes ? (
                <p className="italic bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-amber-900">
                  "{customer.notes}"
                </p>
              ) : (
                <p className="text-slate-400">No special notes recorded for this customer.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Address Modal */}
      <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Edit Customer Address
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update default billing and shipping destinations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">First Name</label>
                <Input
                  value={billingAddress.firstName}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Last Name</label>
                <Input
                  value={billingAddress.lastName}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Street Address</label>
              <Input
                value={billingAddress.address1}
                onChange={(e) =>
                  setBillingAddress({ ...billingAddress, address1: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">City</label>
                <Input
                  value={billingAddress.city}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">State / Region</label>
                <Input
                  value={billingAddress.state}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, state: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Postcode / ZIP</label>
                <Input
                  value={billingAddress.postcode}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, postcode: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Country</label>
                <Input
                  value={billingAddress.country}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, country: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditAddressOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAddress}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
