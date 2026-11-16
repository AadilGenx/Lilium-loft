import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useWriteSettingsStore } from '@/store';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';

const GROUP_TITLES: Record<string, string> = {
  products: 'Products',
  orders: 'Orders',
  customers: 'Customers',
  categories: 'Categories',
  coupons: 'Coupons',
  shipping: 'Shipping',
  payments: 'Payments',
  settings: 'Store settings',
};

/** The on/off controls for letting this panel change the live WooCommerce store. */
export function StoreChangesPanel() {
  const { data, isLoading, fetchSettings, setSwitch } = useWriteSettingsStore();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ key: string; title: string; description: string; label: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (!data) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-slate-400">
          {isLoading ? 'Loading...' : 'These settings are not available right now.'}
        </CardContent>
      </Card>
    );
  }

  const canManage = data.can_manage;
  const masterOn = data.master.enabled;

  const apply = async (key: string, label: string, enabled: boolean) => {
    setBusyKey(key);
    try {
      await setSwitch(key, enabled);
      toast.success(`"${label}" turned ${enabled ? 'on' : 'off'}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  /** Turning something off is immediate; turning on the powerful ones asks first. */
  const requestChange = (key: string, label: string, enabled: boolean) => {
    if (enabled && key === 'master') {
      setConfirm({
        key,
        label,
        title: 'Allow changes to your store?',
        description:
          'Anything you create, edit or delete in this panel will be sent to your live WooCommerce store, where customers can see it. Each type of change can still be switched off individually below.',
      });
      return;
    }
    if (enabled && key === 'permanent_delete') {
      setConfirm({
        key,
        label,
        title: 'Allow permanent deletion?',
        description:
          'Customers, categories and shipping methods cannot be moved to a trash: deleting them removes them from WooCommerce for good, and this cannot be undone.',
      });
      return;
    }
    apply(key, label, enabled);
  };

  return (
    <div className="space-y-6">
      {!canManage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <Lock className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            You can see these settings, but your account is not allowed to change them. Ask the account
            owner if you need to make changes to the store.
          </span>
        </div>
      )}

      {/* Master switch */}
      <Card className={masterOn ? 'border-emerald-200' : ''}>
        <CardContent className="p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                masterOn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {masterOn ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{data.master.label}</h3>
                <Badge variant={masterOn ? 'success' : 'outline'} className="text-[10px]">
                  {masterOn ? 'On' : 'Off'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {masterOn
                  ? 'Changes made in this panel are sent to your live store. Switch this off at any time to make the panel read-only again.'
                  : 'The panel is read-only: nothing here can change your WooCommerce store. Turn this on to create, edit and delete products, orders, coupons and more.'}
              </p>
            </div>
          </div>
          <Switch
            checked={masterOn}
            disabled={!canManage || busyKey === 'master'}
            onCheckedChange={(v) => requestChange('master', data.master.label, v)}
          />
        </CardContent>
      </Card>

      {/* Per-action switches */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold">What this panel may change</CardTitle>
          <CardDescription className="text-xs">
            {masterOn
              ? 'Choose which kinds of change are allowed.'
              : 'These take effect once "Allow changes to the store" is on.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100">
          {Object.keys(GROUP_TITLES).map((group) => {
            const rows = data.capabilities.filter((c) => c.group === group);
            if (rows.length === 0) return null;
            return (
              <div key={group} className="p-4 sm:p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  {GROUP_TITLES[group]}
                </div>
                <div className="space-y-3">
                  {rows.map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-4 text-xs">
                      <span className={masterOn ? 'text-slate-700' : 'text-slate-400'}>
                        {c.label.replace(/^[A-Za-z ]+:\s*/, '')}
                      </span>
                      <Switch
                        checked={c.enabled}
                        disabled={!canManage || busyKey === c.key}
                        onCheckedChange={(v) => requestChange(c.key, c.label, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Permanent deletion */}
      <Card className="border-red-100">
        <CardContent className="p-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{data.permanent_delete.label}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Needed to delete customers, categories and shipping methods, because WooCommerce removes
              them for good instead of moving them to a trash. Keep this off unless you need it.
            </p>
          </div>
          <Switch
            checked={data.permanent_delete.enabled}
            disabled={!canManage || busyKey === 'permanent_delete'}
            onCheckedChange={(v) => requestChange('permanent_delete', data.permanent_delete.label, v)}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        confirmLabel="Turn on"
        variant="destructive"
        isLoading={busyKey !== null}
        onConfirm={async () => {
          if (!confirm) return;
          const { key, label } = confirm;
          await apply(key, label, true);
          setConfirm(null);
        }}
      />
    </div>
  );
}
