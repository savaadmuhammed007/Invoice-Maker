import { forwardRef } from 'react';
import { format } from 'date-fns';
import { getCurrencySymbol } from '@/lib/constants';
import type { Company } from '@/hooks/useCompany';
import type { InvoiceItem } from '@/hooks/useInvoices';
import type { InvoiceStatus } from '@/lib/constants';

interface InvoicePreviewProps {
  company: Company | null;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  currency: string;
  notes: string;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  (
    {
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
    },
    ref
  ) => {
    const currencySymbol = getCurrencySymbol(currency);

    return (
      <div
        ref={ref}
        className="invoice-preview bg-card p-8 max-w-[800px] mx-auto"
        style={{ minHeight: '1000px' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {company?.logo_url ? (
              <img
                src={company.logo_url}
                alt="Company Logo"
                className="h-16 w-auto object-contain mb-4"
              />
            ) : (
              <div className="h-16 w-16 bg-primary rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-foreground">
                  {company?.name?.charAt(0) || 'C'}
                </span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-foreground">
              {company?.name || 'Your Company'}
            </h1>
            {company?.address && (
              <p className="text-sm text-muted-foreground mt-1">{company.address}</p>
            )}
            {company?.city && company?.country && (
              <p className="text-sm text-muted-foreground">
                {company.city}, {company.country} {company.postal_code}
              </p>
            )}
            {company?.email && (
              <p className="text-sm text-muted-foreground">{company.email}</p>
            )}
            {company?.phone && (
              <p className="text-sm text-muted-foreground">{company.phone}</p>
            )}
            {company?.tax_id && (
              <p className="text-sm text-muted-foreground mt-2">
                Tax ID: {company.tax_id}
              </p>
            )}
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-bold text-primary mb-2">INVOICE</h2>
            <p className="text-lg font-medium text-foreground">{invoiceNumber || 'INV-000'}</p>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">
                Issue Date:{' '}
                <span className="text-foreground font-medium">
                  {issueDate ? format(new Date(issueDate), 'MMM dd, yyyy') : '-'}
                </span>
              </p>
              {dueDate && (
                <p className="text-sm text-muted-foreground">
                  Due Date:{' '}
                  <span className="text-foreground font-medium">
                    {format(new Date(dueDate), 'MMM dd, yyyy')}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">BILL TO</h3>
          <p className="font-medium text-foreground">{clientName || 'Client Name'}</p>
          {clientEmail && (
            <p className="text-sm text-muted-foreground">{clientEmail}</p>
          )}
          {clientAddress && (
            <p className="text-sm text-muted-foreground">{clientAddress}</p>
          )}
          {clientPhone && (
            <p className="text-sm text-muted-foreground">{clientPhone}</p>
          )}
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 text-sm font-semibold text-muted-foreground">
                  Description
                </th>
                <th className="text-right py-3 text-sm font-semibold text-muted-foreground w-24">
                  Qty
                </th>
                <th className="text-right py-3 text-sm font-semibold text-muted-foreground w-32">
                  Unit Price
                </th>
                <th className="text-right py-3 text-sm font-semibold text-muted-foreground w-32">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="py-3 text-foreground">
                      {item.description || 'Item description'}
                    </td>
                    <td className="py-3 text-right text-foreground">{item.quantity}</td>
                    <td className="py-3 text-right text-foreground">
                      {currencySymbol}
                      {Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-medium text-foreground">
                      {currencySymbol}
                      {Number(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-border">
                  <td className="py-3 text-muted-foreground" colSpan={4}>
                    No items added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">
                {currencySymbol}
                {subtotal.toFixed(2)}
              </span>
            </div>

            {discountPercent > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  Discount ({discountPercent}%)
                </span>
                <span className="font-medium text-destructive">
                  -{currencySymbol}
                  {discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            {taxRate > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="font-medium text-foreground">
                  {currencySymbol}
                  {taxAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-3 border-t-2 border-foreground">
              <span className="text-lg font-bold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary">
                {currencySymbol}
                {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">NOTES</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Thank you for your business!
          </p>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = 'InvoicePreview';
