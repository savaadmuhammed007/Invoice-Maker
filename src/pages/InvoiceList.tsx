import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InvoiceCard } from '@/components/InvoiceCard';
import { InvoicePreview } from '@/components/InvoicePreview';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, FileText, Download, Printer, CalendarIcon, X } from 'lucide-react';
import { INVOICE_STATUSES, type InvoiceStatus } from '@/lib/constants';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { downloadInvoicePdf } from '@/lib/generateInvoicePdf';

export default function InvoiceList() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { company, isLoading: companyLoading, isReady: companyReady } = useCompany();
  const { invoices, isLoading: invoicesLoading, deleteInvoice, getInvoiceWithItems, updateInvoiceStatus } = useInvoices();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [invoiceToDownload, setInvoiceToDownload] = useState<Invoice | null>(null);
  const downloadPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (companyReady && !company) {
      navigate('/settings');
    }
  }, [company, companyReady, navigate]);

  const filteredInvoices = useMemo(() => {
    return invoices?.filter((invoice) => {
      const matchesSearch =
        invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const issueDate = parseISO(invoice.issue_date);
        if (dateFrom && dateTo) {
          matchesDate = isWithinInterval(issueDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
        } else if (dateFrom) {
          matchesDate = issueDate >= startOfDay(dateFrom);
        } else if (dateTo) {
          matchesDate = issueDate <= endOfDay(dateTo);
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    }) || [];
  }, [invoices, searchQuery, statusFilter, dateFrom, dateTo]);

  const handleView = async (invoice: Invoice) => {
    const fullInvoice = await getInvoiceWithItems(invoice.id);
    if (fullInvoice) {
      setSelectedInvoice(fullInvoice);
      setViewDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    if (invoiceToDelete) {
      await deleteInvoice.mutateAsync(invoiceToDelete.id);
      setInvoiceToDelete(null);
    }
  };

  const handleDownload = async (invoice: Invoice) => {
    const fullInvoice = await getInvoiceWithItems(invoice.id);
    if (!fullInvoice) return;
    
    try {
      await downloadInvoicePdf({
        company,
        invoiceNumber: fullInvoice.invoice_number,
        clientName: fullInvoice.client_name,
        clientEmail: fullInvoice.client_email || '',
        clientAddress: fullInvoice.client_address || '',
        clientPhone: fullInvoice.client_phone || '',
        issueDate: fullInvoice.issue_date,
        dueDate: fullInvoice.due_date || '',
        items: fullInvoice.items || [],
        subtotal: Number(fullInvoice.subtotal),
        taxRate: Number(fullInvoice.tax_rate),
        taxAmount: Number(fullInvoice.tax_amount),
        discountPercent: Number(fullInvoice.discount_percent),
        discountAmount: Number(fullInvoice.discount_amount),
        total: Number(fullInvoice.total),
        currency: fullInvoice.currency,
        notes: fullInvoice.notes || '',
      }, `${fullInvoice.invoice_number}.pdf`);
      toast.success('PDF downloaded!');
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Failed to generate PDF');
    }
  };



  if (authLoading || companyLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Invoices</h1>
            <p className="text-muted-foreground">
              Manage and track all your invoices.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {INVOICE_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date From */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-44 justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Date To */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-44 justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                disabled={(date) => dateFrom ? date < dateFrom : false}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Clear date filters */}
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Invoice Grid */}
        {invoicesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredInvoices.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onView={handleView}
                onDelete={(inv) => setInvoiceToDelete(inv)}
                onDownload={handleDownload}
                onStatusChange={(inv, status) => updateInvoiceStatus.mutate({ id: inv.id, status })}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery || statusFilter !== 'all'
                ? 'No invoices found'
                : 'No invoices yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first invoice to get started.'}
            </p>
          </div>
        )}


        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedInvoice?.invoice_number}
                {selectedInvoice && <StatusBadge status={selectedInvoice.status} />}
              </DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleDownload(selectedInvoice);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>

                </div>
                <InvoicePreview
                  company={company}
                  invoiceNumber={selectedInvoice.invoice_number}
                  clientName={selectedInvoice.client_name}
                  clientEmail={selectedInvoice.client_email || ''}
                  clientAddress={selectedInvoice.client_address || ''}
                  clientPhone={selectedInvoice.client_phone || ''}
                  issueDate={selectedInvoice.issue_date}
                  dueDate={selectedInvoice.due_date || ''}
                  status={selectedInvoice.status}
                  items={selectedInvoice.items || []}
                  subtotal={Number(selectedInvoice.subtotal)}
                  taxRate={Number(selectedInvoice.tax_rate)}
                  taxAmount={Number(selectedInvoice.tax_amount)}
                  discountPercent={Number(selectedInvoice.discount_percent)}
                  discountAmount={Number(selectedInvoice.discount_amount)}
                  total={Number(selectedInvoice.total)}
                  currency={selectedInvoice.currency}
                  notes={selectedInvoice.notes || ''}
                />
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete invoice {invoiceToDelete?.invoice_number}? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



      </div>
    </DashboardLayout>
  );
}
