import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between text-xs text-slate-500 py-3 px-4">
        <span>Showing all {totalItems} items</span>
      </div>
    );
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  // Compute pagination range with ellipsis (...)
  const getPageNumbers = (): (number | string)[] => {
    // If total pages is small, show all
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Near start: 1, 2, 3, 4, 5, '...', totalPages
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    // Near end: 1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages
    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    // In the middle: 1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 py-3 px-4 border-t border-slate-100">
      <div>
        Showing <span className="font-semibold text-slate-700">{start}</span> to{' '}
        <span className="font-semibold text-slate-700">{end}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> results
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex h-8 w-8 p-0"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First</span>
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>

        {/* Numbered & Ellipsis buttons */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="hidden sm:flex h-8 w-8 items-center justify-center text-slate-400 font-bold select-none text-xs"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isCurrent = pageNum === currentPage;

          return (
            <Button
              key={`page-${pageNum}`}
              variant={isCurrent ? 'default' : 'outline'}
              size="sm"
              className={`h-8 w-8 p-0 text-xs font-medium transition-all ${
                isCurrent
                  ? 'bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm'
                  : 'hidden sm:inline-flex text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}

        <span className="sm:hidden px-2 text-xs text-slate-500">of {totalPages}</span>

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex h-8 w-8 p-0"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last</span>
        </Button>
      </div>
    </div>
  );
}
