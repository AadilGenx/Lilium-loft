import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowUpRight,
  Download,
  ExternalLink,
} from 'lucide-react';
import { MobileList, MobileRow, TableOnly } from '@/components/ui/mobile-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePaymentStore, useOrderStore } from '@/store';
import { PaymentGateway, Transaction } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { exportToCSV } from '@/utils/csv';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';

export function PaymentsPage() {
  const { gateways, isLoading, fetchGateways, toggleGateway, updateGateway } = usePaymentStore();
  const orders = useOrderStore((s) => s.orders);

  // The ledger is built from the real orders the store reported.
  const transactions = useMemo<Transaction[]>(
    () =>
      orders.map((o) => ({
        id: `tx-${o.id}`,
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        amount: o.total,
        currency: o.currency,
        // Only what WooCommerce recorded: a payment date means paid. (An order being "processing" does not,
        // e.g. cash on delivery.)
        status:
          o.status === 'refunded'
            ? 'refunded'
            : o.status === 'failed' || o.status === 'cancelled'
            ? 'failed'
            : o.datePaid
            ? 'completed'
            : 'pending',
        paymentMethod: o.paymentMethodTitle || o.paymentMethod,
        date: o.dateCreated,
        transactionReference: o.transactionId,
      })),
    [orders]
  );

  const [activeTab, setActiveTab] = useState('gateways');
  const [configModalGateway, setConfigModalGateway] = useState<PaymentGateway | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formInstructions, setFormInstructions] = useState('');

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const openConfigModal = (g: PaymentGateway) => {
    setConfigModalGateway(g);
    setFormTitle(g.title);
    setFormDesc(g.description);
    setFormInstructions(g.instructions || '');
  };

  const handleSaveConfig = async () => {
    if (!configModalGateway) return;
    setSaving(true);
    try {
      await updateGateway(configModalGateway.id, {
        title: formTitle,
        description: formDesc,
        // Only gateways that have an instructions field can change it.
        instructions: configModalGateway.instructions === undefined ? undefined : formInstructions,
      });
      toast.success(`Gateway "${formTitle}" updated.`);
      setConfigModalGateway(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGateway = async (gateway: PaymentGateway, checked: boolean) => {
    try {
      await toggleGateway(gateway.id, checked);
      toast.success(`${gateway.title} is now ${checked ? 'active' : 'inactive'}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleExportTransactions = () => {
    exportToCSV(
      transactions.map((t) => ({
        ID: t.id,
        Order: t.orderNumber,
        Customer: t.customerName,
        Amount: t.amount,
        Currency: t.currency,
        Status: t.status,
        Method: t.paymentMethod,
        Date: t.date,
        Reference: t.transactionReference,
      })),
      'woocommerce-payment-transactions'
    );
    toast.success('Transactions exported to CSV.');
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Unpaid</Badge>;
      case 'refunded':
        return <Badge variant="purple">Refunded</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Payment Gateways & Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Payment methods from your WooCommerce store, and the payment status of your orders.
          </p>
        </div>

        {activeTab === 'transactions' && (
          <Button
            onClick={handleExportTransactions}
            variant="outline"
            size="sm"
            className="gap-1.5 bg-white text-slate-700 self-start sm:self-auto"
          >
            <Download className="h-4 w-4" />
            <span>Export Transactions</span>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="gateways" className="text-xs">
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs">
            Transaction Ledger ({transactions.length})
          </TabsTrigger>
        </TabsList>

        {/* Gateways Tab */}
        <TabsContent value="gateways" className="space-y-4 mt-0">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold">
                Available Payment Gateways
              </CardTitle>
              <CardDescription className="text-xs">
                Toggle options presented to buyers during the checkout flow
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {gateways.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    {isLoading ? 'Loading payment methods...' : 'No payment methods found.'}
                  </div>
                )}
                {gateways.map((gateway) => (
                  <div
                    key={gateway.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900 text-sm">
                            {gateway.title}
                          </h3>
                          {gateway.testMode && (
                            <Badge variant="warning" className="text-[10px]">
                              Sandbox / Test
                            </Badge>
                          )}
                          {gateway.enabled ? (
                            <Badge variant="success" className="text-[10px]">
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                          {gateway.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:shrink-0 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                          {gateway.enabled ? 'On' : 'Off'}
                        </span>
                        <Switch
                          checked={gateway.enabled}
                          onCheckedChange={(checked) => handleToggleGateway(gateway, checked)}
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfigModal(gateway)}
                        className="gap-1.5 text-xs bg-white text-slate-700"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        <span>Manage</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Ledger Tab */}
        <TabsContent value="transactions" className="space-y-4 mt-0">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold">
                Payment Transaction Records
              </CardTitle>
              <CardDescription className="text-xs">
                Gateway capture logs, settlements, and authorizations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <>
<MobileList>
  {transactions.length === 0 && (
    <div className="p-8 text-center text-xs text-slate-400">No transactions yet.</div>
  )}
  {transactions.map((tx) => (
    <MobileRow key={tx.id}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-slate-900 text-sm">{tx.orderNumber}</span>
          {getStatusBadge(tx.status)}
        </div>
        <span className="font-bold text-slate-900 shrink-0">{formatCurrency(tx.amount, tx.currency)}</span>
      </div>
      <div className="text-sm text-slate-800 truncate">{tx.customerName}</div>
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span className="truncate">{tx.paymentMethod}</span>
        <span className="shrink-0">{formatDateTime(tx.date)}</span>
      </div>
      <div className="font-mono text-[11px] text-slate-400 truncate">{tx.transactionReference || '—'}</div>
    </MobileRow>
  ))}
</MobileList>
<TableOnly>
<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-slate-400 py-8">
                          No transactions yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs text-slate-700 whitespace-nowrap">
                          {tx.transactionReference || '—'}
                        </TableCell>
                        <TableCell className="font-bold font-mono text-xs text-slate-900 whitespace-nowrap">
                          {tx.orderNumber}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800 whitespace-nowrap">
                          {tx.customerName}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                          {tx.paymentMethod}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(tx.date)}
                        </TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        <TableCell className="text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(tx.amount, tx.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
</TableOnly>
</>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Modal */}
      {configModalGateway && (
        <Dialog
          open={!!configModalGateway}
          onOpenChange={(open) => !open && setConfigModalGateway(null)}
        >
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Configure {configModalGateway.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Settings and customer-facing instructions for this payment method.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Display Title</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description at Checkout</label>
                <Textarea
                  value={formDesc}
                  rows={2}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              {configModalGateway.instructions !== undefined && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Payment Instructions / Details</label>
                  <Textarea
                    value={formInstructions}
                    rows={3}
                    placeholder="Instructions sent to customer on invoice/email..."
                    onChange={(e) => setFormInstructions(e.target.value)}
                  />
                </div>
              )}

              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                API keys, secrets and sandbox mode are managed in WooCommerce itself and cannot be changed here.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfigModalGateway(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveConfig}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
