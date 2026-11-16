import React from 'react';
import { Loader2 } from 'lucide-react';

/** Shown while a page's data is still loading, so "not found" never flashes up before the data arrives. */
export function PageLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-red-600" />
      <p className="text-xs">{label}</p>
    </div>
  );
}
