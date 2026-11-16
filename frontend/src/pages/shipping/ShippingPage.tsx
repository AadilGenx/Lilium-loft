import React, { useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Globe,
  MapPin,
  Check,
  IndianRupee,
  Package,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShippingStore } from '@/store';
import { ShippingMethod } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCurrencyLabel } from '@/hooks/useCurrencySymbol';
import { STICKY_COLUMN } from '@/utils/sticky';
import { toast } from 'sonner';

export function ShippingPage() {
  const currencyLabel = useCurrencyLabel();
  const {
    shippingZones,
    isLoading,
    fetchShipping,
    updateShippingMethod,
    addShippingMethod,
    deleteShippingMethod,
  } = useShippingStore();

  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<ShippingMethod | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  // Form state
  const [methodType, setMethodType] = useState<string>('flat_rate');
  const [methodTitle, setMethodTitle] = useState('');
  const [methodCost, setMethodCost] = useState<number>(0);
  const [taxStatus, setTaxStatus] = useState<'taxable' | 'none' | undefined>(undefined);

  useEffect(() => {
    fetchShipping();
  }, [fetchShipping]);

  const currentZone = shippingZones.find((z) => z.id === selectedZoneId) || shippingZones[0];

  const openAddMethodModal = () => {
    setEditingMethod(null);
    setMethodType('flat_rate');
    setMethodTitle('');
    setTitleError(null);
    setMethodCost(0);
    setTaxStatus(undefined);
    setMethodModalOpen(true);
  };

  const openEditMethodModal = (m: ShippingMethod) => {
    setEditingMethod(m);
    setMethodType(m.type);
    setMethodTitle(m.title);
    setTitleError(null);
    setMethodCost(m.cost ?? 0);
    setTaxStatus(m.taxStatus);
    setMethodModalOpen(true);
  };

  const handleSaveMethod = async () => {
    if (!currentZone) return;
    if (!methodTitle.trim()) {
      setTitleError('Method title is required');
      toast.error('Title is required.');
      return;
    }
    setTitleError(null);

    setSaving(true);
    try {
      if (editingMethod) {
        await updateShippingMethod(currentZone.id, editingMethod.id, {
          title: methodTitle.trim(),
          cost: editingMethod.type === 'flat_rate' ? methodCost : undefined,
          taxStatus,
        });
        toast.success(`Shipping method "${methodTitle}" updated.`);
      } else {
        await addShippingMethod(currentZone.id, {
          title: methodTitle.trim(),
          type: methodType,
          cost: methodCost,
          enabled: true,
          taxStatus,
        });
        toast.success(`Shipping method "${methodTitle}" added.`);
      }
      setMethodModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMethod = async (method: ShippingMethod, checked: boolean) => {
    if (!currentZone) return;
    try {
      await updateShippingMethod(currentZone.id, method.id, { enabled: checked });
      toast.success(`${method.title} is now ${checked ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteMethod = async (mId: string, title: string) => {
    if (!currentZone) return;
    try {
      await deleteShippingMethod(currentZone.id, mId);
      toast.success(`Method "${title}" removed.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!currentZone) {
    return (
      <div className="space-y-6 w-full pb-12">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Shipping Zones & Methods
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Fulfillment regions and shipping methods from your WooCommerce store.
          </p>
        </div>
        <Card>
          <CardContent className="p-10 text-center text-sm text-slate-400">
            {isLoading ? 'Loading shipping zones...' : 'No shipping zones found.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Shipping Zones & Methods
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Fulfillment regions and shipping methods from your WooCommerce store.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Shipping Zones List (4 cols) */}
        <div className={`lg:col-span-4 space-y-4 ${STICKY_COLUMN}`}>
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-500" />
                <span>Geographic Zones</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Select a zone to configure rate options
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {shippingZones.map((zone) => {
                const isSelected = zone.id === currentZone?.id;
                return (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition-colors flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-red-50 text-red-700 font-semibold border border-red-200'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{zone.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 break-words">
                        {zone.regions.length > 0
                          ? zone.regions.join(', ')
                          : 'Locations not covered by your other zones'}
                      </div>
                    </div>
                    <Badge
                      variant={isSelected ? 'default' : 'outline'}
                      className="text-[10px] shrink-0 whitespace-nowrap ml-2"
                    >
                      {zone.methods.length} {zone.methods.length === 1 ? 'method' : 'methods'}
                    </Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Zone Methods (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">
                  {currentZone.name} Methods
                </CardTitle>
                <CardDescription className="text-xs">
                  Region coverage: {currentZone.regions.join(', ')}
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={openAddMethodModal}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Add Method</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {currentZone.methods.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No shipping methods configured for this region yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {currentZone.methods.map((method) => (
                    <div
                      key={method.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-800 text-sm truncate">
                            {method.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Type:{' '}
                            <span className="capitalize font-medium text-slate-600">
                              {method.type.replace(/_/g, ' ')}
                            </span>{' '}
                            {method.taxStatus && (
                              <>
                                {' '}• Tax:{' '}
                                <span className="capitalize text-slate-600">
                                  {method.taxStatus}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <div className="text-left sm:text-right">
                          <div className="text-sm font-bold text-slate-900">
                            {method.type === 'free_shipping' ? 'Free' : method.cost === null ? '-' : formatCurrency(method.cost)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={method.enabled}
                            onCheckedChange={(checked) => handleToggleMethod(method, checked)}
                          />

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditMethodModal(method)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMethodToDelete(method)}
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add / Edit Method Dialog */}
      <Dialog open={methodModalOpen} onOpenChange={setMethodModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingMethod ? `Edit: ${editingMethod.title}` : 'Add Shipping Method'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure delivery rates for {currentZone.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Method Type</label>
              <Select
                value={methodType}
                disabled={Boolean(editingMethod)}
                onValueChange={(val: string) => setMethodType(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat_rate">Flat Rate</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  <SelectItem value="local_pickup">Local Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Method Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={methodTitle}
                onChange={(e) => {
                  setMethodTitle(e.target.value);
                  if (titleError && e.target.value.trim()) setTitleError(null);
                }}
                placeholder="e.g. Standard Ground Shipping"
                className={titleError ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {titleError && (
                <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {titleError}
                </p>
              )}
            </div>

            {methodType === 'flat_rate' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Cost{currencyLabel}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={methodCost}
                  onChange={(e) => setMethodCost(Number(e.target.value))}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tax Status</label>
              <Select
                value={taxStatus}
                onValueChange={(val: any) => setTaxStatus(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Use WooCommerce default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="taxable">Taxable</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMethodModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMethod}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Save Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={methodToDelete !== null}
        onOpenChange={(open) => !open && setMethodToDelete(null)}
        title="Remove shipping method"
        description={`Remove "${methodToDelete?.title}" from this zone in WooCommerce? Customers will no longer be offered it. This cannot be undone.`}
        confirmLabel="Remove method"
        onConfirm={async () => {
          if (!methodToDelete) return;
          await handleDeleteMethod(methodToDelete.id, methodToDelete.title);
          setMethodToDelete(null);
        }}
      />
    </div>
  );
}
