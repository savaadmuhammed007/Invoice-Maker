
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { getCurrencySymbol } from './constants';
import type { Company } from '@/hooks/useCompany';
import type { InvoiceItem } from '@/hooks/useInvoices';

export interface InvoicePdfData {
  company: Company | null;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
  issueDate: string;
  dueDate: string;
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

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLORS = {
  ink: [15, 17, 23] as [number, number, number],   // near-black
  inkMid: [40, 44, 55] as [number, number, number],   // dark text
  inkSoft: [100, 106, 120] as [number, number, number],   // muted text
  inkFaint: [160, 165, 176] as [number, number, number],   // hints
  surface: [248, 248, 250] as [number, number, number],   // light bg
  surfaceAlt: [242, 243, 246] as [number, number, number],   // alternate rows
  accent: [99, 102, 241] as [number, number, number],   // indigo-500
  accentDark: [67, 56, 202] as [number, number, number],   // indigo-700
  accentLight: [238, 242, 255] as [number, number, number],   // indigo-50
  success: [22, 163, 74] as [number, number, number],   // green-600
  danger: [220, 38, 38] as [number, number, number],   // red-600
  white: [255, 255, 255] as [number, number, number],
  rule: [226, 228, 233] as [number, number, number],   // light rule
};

const FONT = {
  light: 'helvetica' as const,
  normal: 'helvetica' as const,
  bold: 'helvetica' as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rgb(doc: jsPDF, color: [number, number, number], target: 'fill' | 'text' | 'draw' = 'text') {
  const [r, g, b] = color;
  if (target === 'fill') doc.setFillColor(r, g, b);
  if (target === 'text') doc.setTextColor(r, g, b);
  if (target === 'draw') doc.setDrawColor(r, g, b);
}

function rule(doc: jsPDF, x1: number, y: number, x2: number, weight = 0.3) {
  rgb(doc, COLORS.rule, 'draw');
  doc.setLineWidth(weight);
  doc.line(x1, y, x2, y);
}



/** Render a currency amount as two tightly-spaced text calls so the symbol
 *  never drifts away from the digits (jsPDF kerning can gap them). */
function drawMoney(
  doc: jsPDF,
  sym: string,
  amount: number,
  x: number,
  y: number,
  align: 'right' | 'left' = 'right',
) {
  const numStr = amount.toFixed(2);
  const full = sym + numStr;
  if (align === 'right') {
    doc.text(full, x, y, { align: 'right' });
  } else {
    doc.text(full, x, y);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function downloadInvoicePdf(data: InvoicePdfData, filename: string): Promise<void> {
  const {
    company, invoiceNumber, clientName, clientEmail, clientAddress, clientPhone,
    issueDate, dueDate, items, subtotal, taxRate, taxAmount,
    discountPercent, discountAmount, total, currency, notes,
  } = data;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // jsPDF's built-in Helvetica only covers latin-1.
  // Multi-byte symbols (₹ € £ ¥ etc.) render as garbage glyphs.
  // Map them to their ASCII-safe equivalents so numbers never scatter.
  const SYMBOL_MAP: Record<string, string> = {
    '₹': 'Rs.', '€': 'EUR ', '£': 'GBP ', '¥': 'JPY ',
    '₩': 'KRW ', '₦': 'NGN ', '₫': 'VND ', '฿': 'THB ',
    '₴': 'UAH ', '₺': 'TRY ', '₱': 'PHP ', 'kr': 'kr ',
  };
  const rawSym = getCurrencySymbol(currency);
  const sym = SYMBOL_MAP[rawSym] ?? (rawSym.length === 1 && rawSym.charCodeAt(0) < 128 ? rawSym : currency + ' ');
  const PW = doc.internal.pageSize.getWidth();   // 210
  const PH = doc.internal.pageSize.getHeight();  // 297
  const M = 18;   // margin
  const W = PW - M * 2;
  let Y = 0;

  // ── 1. Dark header band ────────────────────────────────────────────────────
  const HEADER_H = 44;
  rgb(doc, COLORS.ink, 'fill');
  doc.rect(0, 0, PW, HEADER_H, 'F');

  // Company name – left
  doc.setFont(FONT.bold, 'bold');
  doc.setFontSize(16);
  rgb(doc, COLORS.white, 'text');
  doc.text(company?.name || 'Your Company', M, 18);

  // Tagline / email – left
  doc.setFont(FONT.normal, 'normal');
  doc.setFontSize(8.5);
  rgb(doc, COLORS.inkFaint, 'text');
  const tagLine = [company?.email, company?.phone].filter(Boolean).join('  ·  ');
  if (tagLine) doc.text(tagLine, M, 26);

  // "INVOICE" word – right, large
  doc.setFont(FONT.bold, 'bold');
  doc.setFontSize(26);
  rgb(doc, COLORS.white, 'text');
  doc.text('INVOICE', PW - M, 20, { align: 'right' });

  // Invoice number – right, accent
  doc.setFont(FONT.normal, 'normal');
  doc.setFontSize(9);
  rgb(doc, COLORS.accent, 'text');
  doc.text(invoiceNumber || 'INV-000', PW - M, 28, { align: 'right' });

  // Thin accent rule under header
  rgb(doc, COLORS.accent, 'fill');
  doc.rect(0, HEADER_H, PW, 1.5, 'F');

  Y = HEADER_H + 1.5;

  // ── 2. Meta row (dates) ─────────────────────────────────────────────────────────────
  const META_H = 20;
  rgb(doc, COLORS.surface, 'fill');
  doc.rect(0, Y, PW, META_H, 'F');

  const metaFields: Array<[string, string]> = [];
  if (issueDate) metaFields.push(['Issue date', format(new Date(issueDate), 'MMM dd, yyyy')]);
  if (dueDate) metaFields.push(['Due date', format(new Date(dueDate), 'MMM dd, yyyy')]);

  const colW = 60;
  const metaX0 = M;

  metaFields.forEach(([label, value], i) => {
    const mx = metaX0 + i * (colW + 8);
    doc.setFont(FONT.normal, 'normal');
    doc.setFontSize(7.5);
    rgb(doc, COLORS.inkSoft, 'text');
    doc.text(label.toUpperCase(), mx, Y + 8);
    doc.setFont(FONT.bold, 'bold');
    doc.setFontSize(9.5);
    rgb(doc, COLORS.inkMid, 'text');
    doc.text(value, mx, Y + 15);
  });



  Y += META_H + 1.5;

  // ── 3. Addresses – two-column ──────────────────────────────────────────────
  const ADDR_H = 38;
  Y += 6;

  // FROM
  const fromLines: string[] = [];
  if (company?.address) fromLines.push(company.address);
  const cityLine = [company?.city, company?.country, company?.postal_code].filter(Boolean).join(', ');
  if (cityLine) fromLines.push(cityLine);
  if (company?.tax_id) fromLines.push(`Tax ID: ${company.tax_id}`);

  // BILL TO
  const toLines: string[] = [];
  if (clientEmail) toLines.push(clientEmail);
  if (clientAddress) toLines.push(clientAddress);
  if (clientPhone) toLines.push(clientPhone);

  const col2X = PW / 2 + 4;

  const drawAddressBlock = (labelText: string, name: string, lines: string[], x: number) => {
    doc.setFont(FONT.bold, 'bold');
    doc.setFontSize(7);
    rgb(doc, COLORS.accent, 'text');
    doc.text(labelText, x, Y);

    doc.setFont(FONT.bold, 'bold');
    doc.setFontSize(10.5);
    rgb(doc, COLORS.inkMid, 'text');
    doc.text(name, x, Y + 7);

    doc.setFont(FONT.normal, 'normal');
    doc.setFontSize(8.5);
    rgb(doc, COLORS.inkSoft, 'text');
    lines.forEach((line, i) => {
      const wrapped = doc.splitTextToSize(line, W / 2 - 8);
      doc.text(wrapped, x, Y + 14 + i * 5.5);
    });
  };

  drawAddressBlock('FROM', company?.name || '', fromLines, M);
  drawAddressBlock('BILL TO', clientName || 'Client', toLines, col2X);

  Y += ADDR_H;
  rule(doc, M, Y, PW - M);
  Y += 6;

  // ── 4. Items table ─────────────────────────────────────────────────────────
  // Column right-edges.  Give AMOUNT 32mm, UNIT PRICE 36mm, QTY 16mm.
  // Leave the rest for DESCRIPTION so long text never bleeds into numbers.
  const COL_AMOUNT = PW - M;                  // right edge of AMOUNT col
  const COL_PRICE = COL_AMOUNT - 32;         // right edge of UNIT PRICE col
  const COL_QTY = COL_PRICE - 36;         // right edge of QTY col
  const COL_DESC = M + 3;                   // left edge of DESCRIPTION col
  const DESC_MAX_W = COL_QTY - M - 10;        // max wrap width for description text

  // Table header
  const TH_H = 9;
  rgb(doc, COLORS.accentLight, 'fill');
  doc.rect(M, Y, W, TH_H, 'F');

  doc.setFont(FONT.bold, 'bold');
  doc.setFontSize(7.5);
  rgb(doc, COLORS.accentDark, 'text');
  doc.text('DESCRIPTION', COL_DESC, Y + 6.2);
  doc.text('QTY', COL_QTY, Y + 6.2, { align: 'right' });
  doc.text('UNIT PRICE', COL_PRICE, Y + 6.2, { align: 'right' });
  doc.text('AMOUNT', COL_AMOUNT, Y + 6.2, { align: 'right' });

  Y += TH_H;

  // Table rows
  doc.setFont(FONT.normal, 'normal');
  items.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    const desc = item.description || '';
    const split = doc.splitTextToSize(desc, DESC_MAX_W);
    const rowH = Math.max(split.length * 5.5 + 5, 12);

    if (Y + rowH > PH - 40) {
      doc.addPage();
      Y = 20;
    }

    if (isEven) {
      rgb(doc, COLORS.surfaceAlt, 'fill');
      doc.rect(M, Y, W, rowH, 'F');
    }

    doc.setFontSize(9);
    rgb(doc, COLORS.inkMid, 'text');
    doc.text(split, COL_DESC, Y + 6);

    doc.setFont(FONT.normal, 'normal');
    rgb(doc, COLORS.inkSoft, 'text');
    doc.text(String(item.quantity), COL_QTY, Y + 6, { align: 'right' });

    rgb(doc, COLORS.inkSoft, 'text');
    drawMoney(doc, sym, Number(item.unit_price), COL_PRICE, Y + 6, 'right');

    doc.setFont(FONT.bold, 'bold');
    rgb(doc, COLORS.inkMid, 'text');
    drawMoney(doc, sym, Number(item.amount), COL_AMOUNT, Y + 6, 'right');
    doc.setFont(FONT.normal, 'normal');

    Y += rowH;
  });

  rule(doc, M, Y, PW - M, 0.5);
  Y += 8;

  // ── 5. Summary block ───────────────────────────────────────────────────────
  if (Y > 230) { doc.addPage(); Y = 20; }

  // Summary aligns to the same right edge as AMOUNT column
  const SUMM_X = COL_AMOUNT;
  const LABEL_X = SUMM_X - 52;

  const summaryRow = (
    label: string,
    amount: number,
    prefix = '',
    labelColor = COLORS.inkSoft,
    valueColor = COLORS.inkMid,
  ) => {
    doc.setFont(FONT.normal, 'normal');
    doc.setFontSize(9);
    rgb(doc, labelColor, 'text');
    doc.text(label, LABEL_X, Y, { align: 'right' });
    rgb(doc, valueColor, 'text');
    doc.text(prefix + sym + amount.toFixed(2), SUMM_X, Y, { align: 'right' });
    Y += 7;
  };

  summaryRow('Subtotal', subtotal);

  if (discountPercent > 0) {
    summaryRow(`Discount (${discountPercent}%)`, discountAmount, '-', COLORS.inkSoft, COLORS.danger);
  }

  if (taxRate > 0) {
    summaryRow(`Tax (${taxRate}%)`, taxAmount);
  }

  Y += 2;

  // Total row – accent background pill
  const TOTAL_H = 10;
  rgb(doc, COLORS.accent, 'fill');
  
  // Use the same right edge as the items table (SUMM_X)
  // And a consistent width for the summary box
  const boxW = 60;
  const boxX = SUMM_X - boxW;
  doc.roundedRect(boxX, Y - 1, boxW, TOTAL_H, 2, 2, 'F');

  doc.setFont(FONT.bold, 'bold');
  doc.setFontSize(11);
  rgb(doc, COLORS.white, 'text');
  
  // Vertical center baseline
  const baselineY = Y + 5.8;
  
  // Left side of the box with some padding
  doc.text('Total', boxX + 4, baselineY);
  // Right side of the box with same padding
  doc.text(sym + total.toFixed(2), SUMM_X - 4, baselineY, { align: 'right' });

  Y += TOTAL_H + 10;

  // ── 6. Notes ───────────────────────────────────────────────────────────────
  if (notes) {
    if (Y > 260) { doc.addPage(); Y = 20; }

    doc.setFont(FONT.bold, 'bold');
    doc.setFontSize(8);
    rgb(doc, COLORS.accent, 'text');
    doc.text('NOTES', M, Y);

    Y += 5;
    doc.setFont(FONT.normal, 'normal');
    doc.setFontSize(8.5);
    rgb(doc, COLORS.inkSoft, 'text');
    const splitNotes = doc.splitTextToSize(notes, W);
    doc.text(splitNotes, M, Y);
    Y += splitNotes.length * 5 + 6;
  }

  // ── 7. Footer strip ────────────────────────────────────────────────────────
  const FOOT_Y = PH - 14;
  rule(doc, 0, FOOT_Y - 2, PW, 0.3);
  rgb(doc, COLORS.surface, 'fill');
  doc.rect(0, FOOT_Y - 2, PW, 16, 'F');

  doc.setFont(FONT.normal, 'normal');
  doc.setFontSize(7.5);
  rgb(doc, COLORS.inkFaint, 'text');
  doc.text('Thank you for your business.', M, FOOT_Y + 5);
  doc.text(invoiceNumber || '', PW - M, FOOT_Y + 5, { align: 'right' });

  doc.save(filename);
}
