import * as React from 'react';
import { cn } from '@/utils/cn';

/**
 * Phones show a data table as a list of cards: a table with many columns cannot fit a narrow screen without
 * hiding its most important columns off to the side. Put the table in <TableOnly> and the cards in <MobileList>.
 */
export function MobileList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('md:hidden divide-y divide-slate-100', className)}>{children}</div>;
}

/** One card in a MobileList. Tappable when `onClick` is given. */
export function MobileRow({
  onClick,
  className,
  children,
}: {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const base = 'w-full text-left p-4 flex flex-col gap-2';
  return onClick ? (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={cn(base, 'cursor-pointer active:bg-slate-50', className)}
    >
      {children}
    </div>
  ) : (
    <div className={cn(base, className)}>{children}</div>
  );
}

/** The real table, shown from tablet width up. */
export function TableOnly({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('hidden md:block', className)}>{children}</div>;
}
