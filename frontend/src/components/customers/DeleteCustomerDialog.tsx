import React, { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCustomerStore } from '@/store';
import { Customer } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';

/**
 * Asks before deleting a customer. WooCommerce has no trash for customers, so this removes the account for good
 * (their past orders are kept). The backend also refuses unless the two matching switches are on in Settings.
 */
export function DeleteCustomerDialog({
  customer,
  onClose,
  onDeleted,
}: {
  customer: Customer | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const deleteCustomer = useCustomerStore((s) => s.deleteCustomer);
  const [busy, setBusy] = useState(false);

  const name = customer ? `${customer.firstName} ${customer.lastName}`.trim() || customer.email : '';

  const confirm = async () => {
    if (!customer) return;
    setBusy(true);
    try {
      await deleteCustomer(customer.id);
      toast.success(`Customer "${name}" deleted.`);
      onClose();
      onDeleted?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDialog
      open={customer !== null}
      onOpenChange={(open) => !open && !busy && onClose()}
      title="Delete customer permanently"
      description={`Delete "${name}" from WooCommerce? Customers have no trash, so this cannot be undone. Their past orders are kept. It only works when "Customers: delete" and "Allow permanent deletion" are on in Settings → Store changes.`}
      confirmLabel="Delete customer"
      isLoading={busy}
      onConfirm={confirm}
    />
  );
}
