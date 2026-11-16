import React from 'react';
import { Badge } from '@/components/ui/badge';

/** The product's publication status exactly as WooCommerce names it; an unknown status is shown as it is. */
export function ProductStatusBadge({ status, className }: { status: string; className?: string }) {
  switch (status) {
    case 'publish':
      return <Badge variant="success" className={className}>Published</Badge>;
    case 'draft':
      return <Badge variant="outline" className={className}>Draft</Badge>;
    case 'pending':
      return <Badge variant="warning" className={className}>Pending Review</Badge>;
    case 'private':
      return <Badge variant="secondary" className={className}>Private</Badge>;
    default:
      return <Badge variant="outline" className={className}>{status}</Badge>;
  }
}
