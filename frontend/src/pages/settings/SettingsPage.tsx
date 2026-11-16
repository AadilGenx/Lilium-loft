import React, { useEffect, useMemo, useState } from 'react';
import {
  Settings,
  Store,
  Package,
  Receipt,
  Truck,
  CreditCard,
  Mail,
  UserRound,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSettingsStore } from '@/store';
import { BackendSetting } from '@/services/api';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';

/** Groups the backend allows changing; everything else (API keys, webhooks, ...) stays in WooCommerce. */
const EDITABLE_GROUPS = ['general', 'products', 'tax', 'shipping', 'checkout', 'account', 'email'];

const GROUP_ICONS: Record<string, React.ElementType> = {
  general: Store,
  products: Package,
  tax: Receipt,
  shipping: Truck,
  checkout: CreditCard,
  account: UserRound,
  email: Mail,
};

type Draft = Record<string, string | boolean>;

const EMPTY = '__empty__';

/** Settings this page can show and edit. Credentials are never shown. */
const isEditable = (s: BackendSetting) =>
  !s.redacted &&
  s.type !== 'password' &&
  ['text', 'email', 'number', 'textarea', 'select', 'radio', 'checkbox', 'color'].includes(s.type);

const currentValue = (s: BackendSetting, draft: Draft): string | boolean => {
  if (s.id in draft) return draft[s.id];
  return typeof s.value === 'string' ? s.value : '';
};

export function SettingsPage() {
  const { groups, settings, isLoading, fetchGroups, fetchGroup, saveGroup } = useSettingsStore();

  const tabs = useMemo(() => groups.filter((g) => EDITABLE_GROUPS.includes(g.id)), [groups]);
  const [activeTab, setActiveTab] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (!activeTab && tabs.length > 0) setActiveTab(tabs[0].id);
  }, [tabs, activeTab]);

  useEffect(() => {
    if (activeTab) fetchGroup(activeTab);
  }, [activeTab, fetchGroup]);

  const setField = (groupId: string, settingId: string, value: string | boolean) =>
    setDrafts((d) => ({ ...d, [groupId]: { ...(d[groupId] ?? {}), [settingId]: value } }));

  const handleSave = async (groupId: string) => {
    const rows = settings[groupId] ?? [];
    const draft = drafts[groupId] ?? {};

    // Send only what actually changed.
    const changes: Record<string, string | boolean> = {};
    for (const row of rows) {
      if (!(row.id in draft) || !isEditable(row)) continue;
      const original = typeof row.value === 'string' ? row.value : '';
      const next = draft[row.id];
      const same = typeof next === 'boolean' ? (next ? 'yes' : 'no') === original : next === original;
      if (!same) changes[row.id] = next;
    }

    if (Object.keys(changes).length === 0) {
      toast.info('No changes to save.');
      return;
    }

    setSaving(true);
    try {
      await saveGroup(groupId, changes);
      setDrafts((d) => ({ ...d, [groupId]: {} }));
      toast.success(`${tabs.find((t) => t.id === groupId)?.label ?? groupId} settings saved.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const renderField = (groupId: string, s: BackendSetting) => {
    const draft = drafts[groupId] ?? {};
    const value = currentValue(s, draft);

    if (s.type === 'checkbox') {
      return (
        <div key={s.id} className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-slate-800">{s.label}</div>
            {s.description && <div className="text-slate-400">{s.description}</div>}
          </div>
          <Switch
            checked={typeof value === 'boolean' ? value : value === 'yes'}
            onCheckedChange={(val) => setField(groupId, s.id, val)}
          />
        </div>
      );
    }

    return (
      <div key={s.id} className="space-y-1.5">
        <label className="font-semibold text-slate-700">{s.label}</label>
        {s.type === 'textarea' ? (
          <Textarea
            rows={3}
            value={String(value)}
            onChange={(e) => setField(groupId, s.id, e.target.value)}
          />
        ) : (s.type === 'select' || s.type === 'radio') && s.options ? (
          <Select
            value={String(value) === '' ? EMPTY : String(value)}
            onValueChange={(val) => setField(groupId, s.id, val === EMPTY ? '' : val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(s.options).map(([key, label]) => (
                <SelectItem key={key || EMPTY} value={key === '' ? EMPTY : key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={s.type === 'number' ? 'number' : s.type === 'email' ? 'email' : 'text'}
            value={String(value)}
            onChange={(e) => setField(groupId, s.id, e.target.value)}
          />
        )}
        {(s.description || s.tip) && (
          <span className="text-[11px] text-slate-400">{s.description || s.tip}</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          WooCommerce Store Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          These are your live WooCommerce settings. Changes are saved straight to the store.
        </p>
      </div>

      {tabs.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-slate-400">
            {isLoading ? 'Loading settings...' : 'No settings available.'}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-100 p-1 flex-wrap h-auto gap-1">
            {tabs.map((g) => {
              const Icon = GROUP_ICONS[g.id] ?? Settings;
              return (
                <TabsTrigger key={g.id} value={g.id} className="gap-1.5 text-xs">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{g.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map((g) => {
            const rows = (settings[g.id] ?? []).filter(isEditable);
            const readOnly = (settings[g.id] ?? []).filter((s) => !isEditable(s) && !s.redacted && s.type !== 'password');

            return (
              <TabsContent key={g.id} value={g.id} className="space-y-6 mt-0">
                <Card>
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-semibold">{g.label}</CardTitle>
                      {g.description && (
                        <CardDescription className="text-xs">{g.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(g.id)}
                      disabled={saving || rows.length === 0}
                      className="gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs self-start sm:self-auto"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save {g.label}</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-5 text-xs">
                    {rows.length === 0 ? (
                      <div className="py-6 text-center text-slate-400">
                        {settings[g.id] ? 'No editable settings in this group.' : 'Loading...'}
                      </div>
                    ) : (
                      rows.map((s) => renderField(g.id, s))
                    )}

                    {readOnly.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 space-y-2">
                        <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                          Read-only in this panel
                        </div>
                        {readOnly.map((s) => (
                          <div key={s.id} className="flex items-center justify-between gap-4 text-slate-500">
                            <span>{s.label}</span>
                            <span className="text-slate-400 truncate max-w-[50%]">
                              {Array.isArray(s.value) ? s.value.join(', ') : typeof s.value === 'string' ? s.value : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
