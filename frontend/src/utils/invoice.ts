import { Order } from '@/types';
import { formatCurrency } from './formatters';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export function formatInvoiceDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
}

export function getInvoiceNumber(order: Order): string {
  try {
    const d = new Date(order.dateCreated);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `LLC${order.orderNumber}${month}-${day}-${year}`;
  } catch {
    return `LLC${order.orderNumber}`;
  }
}

export function getInvoiceStampText(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'processing':
      return 'RECEIVED';
    case 'refunded':
      return 'REFUNDED';
    case 'cancelled':
      return 'CANCELLED';
    case 'on-hold':
    case 'pending':
      return 'PENDING';
    default:
      return 'RECEIVED';
  }
}

export function generateInvoiceHTML(order: Order): string {
  const invoiceNo = getInvoiceNumber(order);
  const orderDate = formatInvoiceDate(order.dateCreated);
  const paymentMethod = (order.paymentMethod || order.paymentMethodTitle || 'phonepe').toLowerCase();
  const stampText = getInvoiceStampText(order.status);

  const billName = `${order.billing?.firstName || ''} ${order.billing?.lastName || ''}`.trim() || order.customerName || 'Customer';
  const billAddr1 = order.billing?.address1 || '';
  const billAddr2 = order.billing?.address2 || '';
  const billCity = order.billing?.city || '';
  const billState = order.billing?.state || '';
  const billPostcode = order.billing?.postcode || '';
  const billPhone = order.billing?.phone || '';

  const shipName = `${order.shipping?.firstName || ''} ${order.shipping?.lastName || ''}`.trim() || billName;
  const shipAddr1 = order.shipping?.address1 || billAddr1;
  const shipAddr2 = order.shipping?.address2 || billAddr2;
  const shipCity = order.shipping?.city || billCity;
  const shipState = order.shipping?.state || billState;
  const shipPostcode = order.shipping?.postcode || billPostcode;
  const shipPhone = order.shipping?.phone || billPhone;

  const subtotal = order.subtotal ?? order.items.reduce((sum, item) => sum + (item.subtotal || item.total || item.price * item.quantity), 0);
  const logoUrl = window.location.origin + '/logo.png';

  const itemsRows = order.items.map((item, idx) => {
    const itemPrice = item.price || (item.quantity > 0 ? item.total / item.quantity : 0);
    const itemTotal = item.total || itemPrice * item.quantity;
    const imgHtml = item.image
      ? `<img src="${item.image}" alt="${item.name}" class="item-thumb" />`
      : `<div class="item-thumb-placeholder"></div>`;

    return `
      <tr>
        <td class="col-sno">${idx + 1}</td>
        <td class="col-img">${imgHtml}</td>
        <td class="col-sku">${item.sku || '-'}</td>
        <td class="col-prod">${item.name}</td>
        <td class="col-qty">${item.quantity}</td>
        <td class="col-unit">${formatCurrency(itemPrice, order.currency)}</td>
        <td class="col-tax-item">-</td>
        <td class="col-tax-total">-</td>
        <td class="col-total">${formatCurrency(itemTotal, order.currency)}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #1e293b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-wrapper {
      width: 100%;
      max-width: 860px;
      margin: 0 auto;
      padding: 10mm 10mm;
      background: #ffffff;
      position: relative;
    }

    /* Top Grid: Left (Invoice + Logo), Middle (spacer), Right (From) */
    .top-section {
      display: grid;
      grid-template-columns: 38% 30% 32%;
      gap: 16px;
      margin-bottom: 24px;
      align-items: start;
    }
    .invoice-title {
      font-size: 19px;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .invoice-logo {
      height: 52px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
      display: block;
    }
    .from-block {
      font-size: 11.5px;
      color: #334155;
      line-height: 1.5;
    }
    .from-block strong {
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      display: block;
      margin-bottom: 4px;
    }

    /* 3-Column Info: Bill to, Ship to, Meta */
    .details-section {
      display: grid;
      grid-template-columns: 38% 30% 32%;
      gap: 16px;
      margin-bottom: 30px;
      font-size: 11.5px;
      line-height: 1.5;
    }
    .col-block strong {
      display: block;
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .meta-block {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 11.5px;
    }
    .meta-line {
      display: flex;
      gap: 4px;
    }
    .meta-label {
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }
    .meta-val {
      color: #334155;
    }

    /* Table */
    .table-container {
      margin-bottom: 20px;
    }
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    table.invoice-table th {
      padding: 10px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1.5px solid #94a3b8;
      font-size: 12px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
      vertical-align: bottom;
      line-height: 1.3;
    }
    table.invoice-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: middle;
      font-size: 11.5px;
    }
    .col-sno { width: 36px; text-align: left; }
    .col-img { width: 56px; text-align: left; }
    .col-sku { width: 60px; text-align: left; }
    .col-prod { text-align: left; }
    .col-qty { width: 65px; text-align: center; }
    .col-unit { width: 95px; text-align: right; white-space: nowrap; }
    .col-tax-item { width: 60px; text-align: center; }
    .col-tax-total { width: 60px; text-align: center; }
    .col-total { width: 105px; text-align: right; white-space: nowrap; }

    table.invoice-table td.col-prod {
      font-weight: 500;
      color: #0f172a;
    }
    table.invoice-table td.col-total {
      font-weight: 600;
      color: #0f172a;
    }

    .item-thumb {
      width: 44px;
      height: 44px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      display: block;
    }
    .item-thumb-placeholder {
      width: 44px;
      height: 44px;
      background: #f1f5f9;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    /* Bottom section with stamp and totals */
    .bottom-section {
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      position: relative;
      margin-top: 8px;
    }
    .stamp-container {
      position: absolute;
      right: 310px;
      top: -16px;
      z-index: 10;
      pointer-events: none;
    }
    .stamp {
      display: inline-block;
      padding: 5px 14px;
      border: 2.5px solid #8A1538;
      border-radius: 5px;
      color: #8A1538;
      font-weight: 900;
      font-size: 17px;
      letter-spacing: 2px;
      text-transform: uppercase;
      transform: rotate(-32deg);
      opacity: 0.88;
      background: rgba(255, 255, 255, 0.7);
    }
    .totals-box {
      width: 290px;
      font-size: 11.5px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      color: #334155;
    }
    .totals-row.grand-total {
      border-top: 1.5px solid #cbd5e1;
      margin-top: 6px;
      padding-top: 8px;
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }
      html, body {
        width: 210mm;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .invoice-wrapper {
        width: 210mm !important;
        max-width: 210mm !important;
        padding: 10mm 10mm !important;
        margin: 0 !important;
      }
      .stamp {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <!-- Top Section (INVOICE + Logo on left, From on right) -->
    <div class="top-section">
      <div class="title-logo-block">
        <div class="invoice-title">INVOICE</div>
        <img src="${logoUrl}" alt="Lilium & Loft Crochet Studio" class="invoice-logo" />
      </div>
      <div></div>
      <div class="from-block">
        <strong>From</strong>
        Lilium and Loft Crochet Studio<br />
        45 (13), 2nd Cross, Venkata Nagar<br />
        605011<br />
        Pondicherry (Puducherry)
      </div>
    </div>

    <!-- 3-Column Info (Bill to, Ship to, Invoice Meta) -->
    <div class="details-section">
      <div class="col-block">
        <strong>Bill to</strong>
        ${billName}<br />
        ${billAddr1 ? billAddr1 + '<br />' : ''}
        ${billAddr2 ? billAddr2 + '<br />' : ''}
        ${billCity} ${billPostcode}<br />
        ${billState}<br />
        ${billPhone}
      </div>
      <div class="col-block">
        <strong>Ship to</strong>
        ${shipName}<br />
        ${shipAddr1 ? shipAddr1 + '<br />' : ''}
        ${shipAddr2 ? shipAddr2 + '<br />' : ''}
        ${shipCity} ${shipPostcode}<br />
        ${shipState}<br />
        ${shipPhone}
      </div>
      <div class="meta-block">
        <div class="meta-line">
          <span class="meta-label">Invoice no:</span>
          <span class="meta-val">${invoiceNo}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">Order date:</span>
          <span class="meta-val">${orderDate}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">Payment method:</span>
          <span class="meta-val">${paymentMethod}</span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <table class="invoice-table">
        <thead>
          <tr>
            <th class="col-sno">S.No</th>
            <th class="col-img">Image</th>
            <th class="col-sku">SKU</th>
            <th class="col-prod">Product</th>
            <th class="col-qty">Quantity</th>
            <th class="col-unit">Unit price</th>
            <th class="col-tax-item">Tax<br />items</th>
            <th class="col-tax-total">Total<br />Tax</th>
            <th class="col-total">Total price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Bottom Section with Stamp & Totals -->
    <div class="bottom-section">
      <div class="stamp-container">
        <div class="stamp">${stampText}</div>
      </div>

      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotal, order.currency)}</span>
        </div>
        <div class="totals-row">
          <span>Shipping</span>
          <span>${order.shippingTotal > 0 ? `${formatCurrency(order.shippingTotal, order.currency)} via Weight Based Shipping` : 'Free Shipping'}</span>
        </div>
        ${order.discountTotal > 0 ? `
          <div class="totals-row">
            <span>Discount</span>
            <span>-${formatCurrency(order.discountTotal, order.currency)}</span>
          </div>
        ` : ''}
        ${order.taxTotal > 0 ? `
          <div class="totals-row">
            <span>Tax</span>
            <span>${formatCurrency(order.taxTotal, order.currency)}</span>
          </div>
        ` : ''}
        <div class="totals-row grand-total">
          <span>Total</span>
          <span>${formatCurrency(order.total, order.currency)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers browser print/save-as-PDF dialog with complete invoice formatting
 * with browser header and footer suppressed via @page { margin: 0; }.
 */
export function printInvoice(order: Order): void {
  const invoiceHtml = generateInvoiceHTML(order);

  // Hidden print iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Popup fallback
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(invoiceHtml);
      w.document.close();
      w.focus();
      setTimeout(() => {
        w.print();
      }, 400);
    }
    return;
  }

  doc.open();
  doc.write(invoiceHtml);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 400);
}

/**
 * Directly downloads the invoice as a PDF file without opening the browser print dialog.
 */
export async function downloadInvoicePDF(
  order: Order,
  sourceElement?: HTMLElement | null
): Promise<void> {
  const invoiceNo = getInvoiceNumber(order);
  const filename = `Invoice-${invoiceNo}.pdf`;

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
  };

  if (sourceElement) {
    await html2pdf().set(opt).from(sourceElement).save();
    return;
  }

  // Create temporary container for table row direct download
  const html = generateInvoiceHTML(order);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentWindow?.document;
    if (!doc) throw new Error('Could not open print context');
    doc.open();
    doc.write(html);
    doc.close();

    // Give browser time to load styles and images
    await new Promise((resolve) => setTimeout(resolve, 400));
    const element = (doc.querySelector('.invoice-wrapper') as HTMLElement) || doc.body;
    await html2pdf().set(opt).from(element).save();
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}
