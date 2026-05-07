import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '@/lib/constants';

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'status-draft' },
  sent: { label: 'Sent', className: 'status-sent' },
  paid: { label: 'Paid', className: 'status-paid' },
  unpaid: { label: 'Unpaid', className: 'status-unpaid' },
  overdue: { label: 'Overdue', className: 'status-overdue' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
