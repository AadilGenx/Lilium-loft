import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  activeCount?: number;
  onApply?: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

export function FilterModal({
  open,
  onOpenChange,
  title = 'Filters',
  description = 'Refine what is displayed in the list.',
  activeCount = 0,
  onApply,
  onClear,
  children,
}: FilterModalProps) {
  const handleApply = () => {
    onApply?.();
    onOpenChange(false);
  };

  const handleClear = () => {
    onClear?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md rounded-2xl max-h-[85vh] flex flex-col p-5 sm:p-6 gap-0">
        <DialogHeader className="pb-4 border-b border-slate-100 pr-6 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 shrink-0">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-semibold text-slate-900">{title}</DialogTitle>
                  {activeCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.2 bg-red-50 text-red-700 border-red-200">
                      {activeCount} active
                    </Badge>
                  )}
                </div>
                {description && (
                  <DialogDescription className="text-xs text-slate-500 mt-0.5">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>

            {onClear && activeCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 px-2 gap-1 shrink-0"
                title="Clear all filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {children}
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 flex-row items-center justify-end gap-2 mt-auto">
          {onClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
              Clear
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex-1 sm:flex-none text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="flex-1 sm:flex-none text-xs bg-red-600 hover:bg-red-700 text-white gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
