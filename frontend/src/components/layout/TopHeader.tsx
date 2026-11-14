import React from 'react';
import { Menu, Search, Plus, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUIStore, useBackendSyncStore } from '@/store';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function TopHeader() {
  const { setMobileMenuOpen, setSearchOpen } = useUIStore();
  const { status, syncAll, lastSynced } = useBackendSyncStore();
  const navigate = useNavigate();

  const handleManualSync = async () => {
    toast.info('Connecting to backend API...');
    const success = await syncAll();
    if (success) {
      toast.success('Successfully synced data from backend!');
    } else {
      toast.error('Could not connect to backend API. Using local/mock data.');
    }
  };

  return (
    <header className="h-20 shrink-0 bg-white border-b border-slate-200/80 z-20 flex items-center justify-between px-3 sm:px-6 gap-2">
      {/* Left section: mobile hamburger & store badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </button>

        <div className="hidden lg:flex items-center gap-2">
          {status === 'connected' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              API Connected (Live)
            </span>
          ) : status === 'syncing' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
              <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
              Syncing API...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              API Disconnected
            </span>
          )}
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-medium">Lilium & Loft Store</span>
        </div>
      </div>

      {/* Middle section: Global Search Trigger */}
      <div className="flex-1 max-w-lg mx-1 sm:mx-4 min-w-0">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-slate-400 hover:bg-slate-100/70 hover:border-slate-300 transition-all text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-xs sm:text-sm text-slate-500 truncate">
              Search products, orders...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500 shrink-0 ml-2">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right section: Action Buttons, Notifications, Profile */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <Button
          onClick={handleManualSync}
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex gap-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
          title={lastSynced ? `Last synced: ${new Date(lastSynced).toLocaleTimeString()}` : 'Sync with Backend'}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
          <span>{status === 'connected' ? 'Sync' : 'Connect API'}</span>
        </Button>

        <Button
          onClick={() => navigate('/products/new')}
          size="sm"
          className="hidden sm:inline-flex gap-1.5 bg-red-600 hover:bg-red-700 text-white font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        <NotificationDropdown />
        <ProfileDropdown />
      </div>
    </header>
  );
}
