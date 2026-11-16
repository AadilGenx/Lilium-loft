import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileNav } from './MobileNav';
import { SearchModal } from './SearchModal';
import { Breadcrumbs } from './Breadcrumbs';
import { Toaster } from 'sonner';
import { useLiveUpdates } from '@/hooks/useLiveUpdates';
import { useBackendSyncStore } from '@/store';

export function MainLayout() {
  // Reload lists as soon as WooCommerce changes something (no manual refresh needed).
  useLiveUpdates();

  // Amounts are formatted with the store's currency. Redraw the screen once it becomes known (or changes).
  const currency = useBackendSyncStore((s) => s.summary?.currency ?? 'unknown');

  return (
    <div className="h-screen h-[100dvh] flex bg-slate-50/50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Permanent Fixed Sidebar */}
      <Sidebar />
      <MobileNav />
      <SearchModal />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Permanent Fixed Top Header */}
        <TopHeader />

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full max-w-[1680px]">
            <Breadcrumbs />
            <Outlet key={currency} />
          </div>
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
