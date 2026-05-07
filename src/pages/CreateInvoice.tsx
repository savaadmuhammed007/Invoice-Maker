import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useInvoices, InvoiceItem, CreateInvoiceData } from '@/hooks/useInvoices';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InvoicePreview } from '@/components/InvoicePreview';
import { CustomerSelector } from '@/components/CustomerSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Download, Printer, Save, Loader2 } from 'lucide-react';
import { CURRENCIES, INVOICE_STATUSES, InvoiceStatus } from '@/lib/constants';
import { toast } from 'sonner';
import { downloadInvoicePdf } from '@/lib/generateInvoicePdf';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { company, isLoading: companyLoading, isReady: companyReady } = useCompany();
  const { createInvoice, generateInvoiceNumber, invoices, isLoading: invoicesLoading } = useInvoices();

  const previewRef = useRef<HTMLDivElement>(null);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [currency, setCurrency] = useState('USD');
  const [taxRate, setTaxRate] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      setSelectedCustomerId(customer.id);
      setClientName(customer.name);
      setClientEmail(customer.email || '');
      setClientPhone(customer.phone || '');
      setClientAddress(customer.address || '');
    } else {
      setSelectedCustomerId(undefined);
    }
  };

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

  useEffect(() => {
    // Only generate invoice number once both company and invoices are loaded
    if (company && !invoicesLoading && invoices !== undefined) {
      setInvoiceNumber(generateInvoiceNumber());
      setCurrency(company.default_currency || 'USD');
      setTaxRate(Number(company.default_tax_rate) || 0);
    }
  }, [company, invoices, invoicesLoading, generateInvoiceNumber]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate amount
    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? Number(value) : newItems[index].quantity;
      const price = field === 'unit_price' ? Number(value) : newItems[index].unit_price;
      newItems[index].amount = qty * price;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!clientName.trim()) {
      toast.error('Please enter a client name');
      return;
    }
    if (items.every((item) => !item.description.trim())) {
      toast.error('Please add at least one line item');
      return;
    }

    setSaving(true);
    try {
      const invoiceData: CreateInvoiceData = {
        invoice_number: invoiceNumber,
        client_name: clientName,
        client_email: clientEmail || undefined,
        client_address: clientAddress || undefined,
        client_phone: clientPhone || undefined,
        issue_date: issueDate,
        due_date: dueDate || undefined,
        status,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        total,
        currency,
        notes: notes || undefined,
        items: items.filter((item) => item.description.trim()),
      };

      await createInvoice.mutateAsync(invoiceData);
      navigate('/invoices');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadInvoicePdf({
        company,
        invoiceNumber,
        clientName,
        clientEmail,
        clientAddress,
        clientPhone,
        issueDate,
        dueDate,
        items,
        subtotal,
        taxRate,
        taxAmount,
        discountPercent,
        discountAmount,
        total,
        currency,
        notes,
      }, `${invoiceNumber}.pdf`);
      toast.success('PDF downloaded!');
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || companyLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-[600px]" />
            <Skeleton className="h-[600px]" />
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
            <h1 className="text-2xl font-bold text-foreground">Create Invoice</h1>
            <p className="text-muted-foreground">
              Fill in the details and preview your invoice in real-time.
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Invoice
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-6 no-print">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVOICE_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Client Details */}
            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Saved Customers</Label>
                  <CustomerSelector
                    onSelect={handleCustomerSelect}
                    selectedCustomerId={selectedCustomerId}
                    clientName={clientName}
                    clientEmail={clientEmail}
                    clientPhone={clientPhone}
                    clientAddress={clientAddress}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    placeholder="Enter client name"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      setSelectedCustomerId(undefined);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="client@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Address</Label>
                  <Input
                    id="clientAddress"
                    placeholder="123 Main St, City, Country"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Phone</Label>
                  <Input
                    id="clientPhone"
                    placeholder="+1 234 567 890"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="w-20 space-y-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="w-28 space-y-2">
                      <Input
                        type="number"
                        placeholder="Price"
                        min={0}
                        step={0.01}
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tax & Discount */}
            <Card>
              <CardHeader>
                <CardTitle>Tax & Discount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountPercent">Discount (%)</Label>
                    <Input
                      id="discountPercent"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any additional notes or payment instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-20 h-fit">
            <InvoicePreview
              ref={previewRef}
              company={company}
              invoiceNumber={invoiceNumber}
              clientName={clientName}
              clientEmail={clientEmail}
              clientAddress={clientAddress}
              clientPhone={clientPhone}
              issueDate={issueDate}
              dueDate={dueDate}
              status={status}
              items={items}
              subtotal={subtotal}
              taxRate={taxRate}
              taxAmount={taxAmount}
              discountPercent={discountPercent}
              discountAmount={discountAmount}
              total={total}
              currency={currency}
              notes={notes}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
