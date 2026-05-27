import { format } from 'date-fns';
import { MoreHorizontal, Eye, Trash2, Download, Pencil, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { getCurrencySymbol } from '@/lib/constants';
import type { Invoice } from '@/hooks/useInvoices';
import type { InvoiceStatus } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface InvoiceCardProps {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
  onStatusChange: (invoice: Invoice, status: InvoiceStatus) => void;
}

export function InvoiceCard({ invoice, onView, onDelete, onDownload, onStatusChange }: InvoiceCardProps) {
  const navigate = useNavigate();
  const currencySymbol = getCurrencySymbol(invoice.currency);
  const isPaid = invoice.status === 'paid';

  const handleEdit = () => {
    navigate(`/invoices/${invoice.id}/edit`);
  };

  return (
    <div className="invoice-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground">{invoice.invoice_number}</h3>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-muted-foreground">{invoice.client_name}</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(invoice)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(invoice)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onStatusChange(invoice, isPaid ? 'unpaid' : 'paid')}>
              {isPaid ? (
                <><XCircle className="mr-2 h-4 w-4" />Mark as Unpaid</>
              ) : (
                <><CheckCircle className="mr-2 h-4 w-4" />Mark as Paid</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(invoice)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Issue Date</p>
          <p className="text-sm font-medium">
            {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
          </p>
        </div>
        
        {invoice.due_date && (
          <div className="space-y-1 text-right">
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm font-medium">
              {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-semibold text-foreground">
            {currencySymbol}{Number(invoice.total).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
