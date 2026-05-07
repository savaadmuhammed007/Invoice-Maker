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
      <div className="w-full overflow-x-auto lg:overflow-x-visible pb-8">
        <div
          ref={ref}
          className="invoice-preview bg-white shadow-2xl mx-auto overflow-hidden text-[#0F1117] font-sans transition-all duration-300"
          style={{
            width: '100%',
            maxWidth: '800px',
            minHeight: '1131px',
            fontSize: '12px',
            lineHeight: '1.4',
            position: 'relative',
            aspectRatio: '1 / 1.414'
          }}
        >
          {/* ── 1. Dark header band ──────────────────────────────────────────────────── */}
          <div className="bg-[#0F1117] px-[8%] pt-[6%] pb-[5%] flex justify-between items-start relative">
            <div>
              <h1 className="text-white font-bold text-[24px] mb-2 leading-tight">
                {company?.name || 'Your Company'}
              </h1>
              <div className="text-[#A0A5B0] text-[12px] flex flex-wrap gap-x-4 gap-y-1">
                {company?.email && (
                  <span className="flex items-center gap-2">
                    {company.email}
                  </span>
                )}
                {company?.phone && (
                  <span className="flex items-center gap-2">
                    <span className="opacity-50">·</span>
                    {company.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-white font-bold text-[36px] leading-none mb-2">INVOICE</h2>
              <p className="text-[#6366F1] text-[13px] font-medium tracking-wide">
                {invoiceNumber || 'INV-000'}
              </p>
            </div>
          </div>
          {/* Thin accent rule under header */}
          <div className="h-[6px] w-full bg-[#6366F1]" />

          {/* ── 2. Meta row (dates) ──────────────────────────────────────────────────── */}
          <div className="bg-[#F8F8FA] px-[8%] py-[4%] flex gap-x-12 flex-wrap gap-y-4">
            {issueDate && (
              <div className="min-w-[120px]">
                <label className="block text-[#646A78] text-[10px] font-bold tracking-wider mb-1">ISSUE DATE</label>
                <div className="text-[#282C37] text-[14px] font-bold">
                  {format(new Date(issueDate), 'MMM dd, yyyy')}
                </div>
              </div>
            )}
            {dueDate && (
              <div className="min-w-[120px]">
                <label className="block text-[#646A78] text-[10px] font-bold tracking-wider mb-1">DUE DATE</label>
                <div className="text-[#282C37] text-[14px] font-bold">
                  {format(new Date(dueDate), 'MMM dd, yyyy')}
                </div>
              </div>
            )}
          </div>

          <div className="h-[2px] w-full bg-white" />

          {/* ── 3. Addresses – two-column ────────────────────────────────────────────── */}
          <div className="px-[8%] py-[6%] flex flex-col sm:flex-row gap-x-12 gap-y-8">
            {/* FROM */}
            <div className="flex-1">
              <label className="block text-[#6366F1] text-[10px] font-bold tracking-wider mb-2">FROM</label>
              <div className="text-[#282C37] text-[15px] font-bold mb-2">
                {company?.name || 'Your Company'}
              </div>
              <div className="text-[#646A78] text-[12px] space-y-1">
                {company?.address && <p>{company.address}</p>}
                {(company?.city || company?.country) && (
                  <p>{[company.city, company.country, company.postal_code].filter(Boolean).join(', ')}</p>
                )}
                {company?.tax_id && <p className="mt-2 pt-2 border-t border-[#E2E4E9]">Tax ID: {company.tax_id}</p>}
              </div>
            </div>

            {/* BILL TO */}
            <div className="flex-1">
              <label className="block text-[#6366F1] text-[10px] font-bold tracking-wider mb-2">BILL TO</label>
              <div className="text-[#282C37] text-[15px] font-bold mb-2">
                {clientName || 'Client Name'}
              </div>
              <div className="text-[#646A78] text-[12px] space-y-1">
                {clientEmail && <p>{clientEmail}</p>}
                {clientAddress && <p>{clientAddress}</p>}
                {clientPhone && <p>{clientPhone}</p>}
              </div>
            </div>
          </div>

          <div className="px-[8%]">
            <div className="h-[1px] w-full bg-[#E2E4E9]" />
          </div>

          {/* ── 4. Items table ───────────────────────────────────────────────────────── */}
          <div className="px-[8%] py-[6%]">
            <div className="overflow-hidden rounded-sm border border-[#E2E4E9]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#EEF2FF]">
                    <th className="text-left py-4 px-4 text-[#4338CA] text-[11px] font-bold tracking-wider">DESCRIPTION</th>
                    <th className="text-right py-4 px-4 text-[#4338CA] text-[11px] font-bold tracking-wider w-20">QTY</th>
                    <th className="text-right py-4 px-4 text-[#4338CA] text-[11px] font-bold tracking-wider w-32">UNIT PRICE</th>
                    <th className="text-right py-4 px-4 text-[#4338CA] text-[11px] font-bold tracking-wider w-32">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E4E9]">
                  {items.length > 0 ? (
                    items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F2F3F6]'}>
                        <td className="py-4 px-4 text-[#282C37] text-[13px] align-top">{item.description || '-'}</td>
                        <td className="py-4 px-4 text-[#646A78] text-[13px] text-right align-top">{item.quantity}</td>
                        <td className="py-4 px-4 text-[#646A78] text-[13px] text-right align-top">
                          {currencySymbol}{Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-[#282C37] text-[13px] font-bold text-right align-top">
                          {currencySymbol}{Number(item.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[#A0A5B0] text-[14px]">No items added yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 5. Summary block ─────────────────────────────────────────────────────── */}
          <div className="px-[8%] pb-[8%] flex justify-end">
            <div className="w-full max-w-[320px] space-y-3">
              <div className="flex justify-between items-center px-4">
                <span className="text-[#646A78] text-[13px]">Subtotal</span>
                <span className="text-[#282C37] text-[13px] font-medium">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between items-center px-4">
                  <span className="text-[#646A78] text-[13px]">Discount ({discountPercent}%)</span>
                  <span className="text-[#DC2626] text-[13px] font-medium">-{currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {taxRate > 0 && (
                <div className="flex justify-between items-center px-4">
                  <span className="text-[#646A78] text-[13px]">Tax ({taxRate}%)</span>
                  <span className="text-[#282C37] text-[13px] font-medium">{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="mt-4 bg-[#6366F1] rounded-lg px-6 py-4 flex justify-between items-center shadow-lg transition-transform hover:scale-[1.02]">
                <span className="text-white text-[16px] font-bold">Total</span>
                <span className="text-white text-[20px] font-extrabold">{currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ── 6. Notes ─────────────────────────────────────────────────────────────── */}
          {notes && (
            <div className="px-[8%] py-[6%] border-t border-[#E2E4E9] bg-[#F8F8FA]/50">
              <label className="block text-[#6366F1] text-[11px] font-bold tracking-wider mb-3">NOTES & INSTRUCTIONS</label>
              <div className="text-[#646A78] text-[13px] leading-relaxed whitespace-pre-wrap max-w-2xl">
                {notes}
              </div>
            </div>
          )}

          {/* ── 7. Footer strip ──────────────────────────────────────────────────────── */}
          <div className="absolute bottom-0 left-0 w-full">
            <div className="h-[1px] w-full bg-[#E2E4E9]" />
            <div className="bg-[#F8F8FA] px-[8%] py-[4%] flex justify-between items-center">
              <p className="text-[#A0A5B0] text-[11px] font-medium italic">Thank you for your business.</p>
              <div className="flex items-center gap-4">
                <span className="h-4 w-[1px] bg-[#E2E4E9]" />
                <p className="text-[#A0A5B0] text-[11px] font-bold tracking-widest">{invoiceNumber || ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = 'InvoicePreview';
