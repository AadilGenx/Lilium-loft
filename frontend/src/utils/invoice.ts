import { Order } from '@/types';
import { formatCurrency } from './formatters';
import { useProductStore } from '@/store';
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
    const products = useProductStore.getState().products;
    const product = products.find(
      (p) =>
        (item.productId && (String(p.id) === String(item.productId) || String(p.wooId) === String(item.productId))) ||
        (item.sku && p.sku && String(p.sku).trim() === String(item.sku).trim()) ||
        (item.name && p.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
    );
    const itemImg =
      item.image ||
      product?.images?.[0]?.src ||
      (product as any)?.image_url ||
      (product as any)?.imageUrl;
    const imgHtml = itemImg
      ? `<img src="${itemImg}" alt="${item.name}" class="item-thumb" referrerpolicy="no-referrer" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';" /><div class="item-thumb-placeholder" style="display:none;align-items:center;justify-content:center;font-size:14px;color:#94a3b8;">🧶</div>`
      : `<div class="item-thumb-placeholder" style="display:flex;align-items:center;justify-content:center;font-size:14px;color:#94a3b8;">🧶</div>`;

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
  <title>Invoice #${order.orderNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    .invoice-wrapper, .invoice-wrapper * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    .invoice-wrapper {
      width: 794px;
      max-width: 794px;
      min-width: 794px;
      margin: 0 auto;
      padding: 36px 36px;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      box-sizing: border-box;
      position: relative;
    }

    table.layout-table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      border: none;
    }
    table.layout-table td {
      padding: 0;
      border: none;
      vertical-align: top;
    }

    .invoice-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .invoice-logo {
      width: 190px;
      max-width: 190px;
      height: auto;
      display: block;
    }
    .from-block {
      font-size: 11px;
      color: #334155;
      line-height: 1.5;
    }
    .from-block strong {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      display: block;
      margin-bottom: 4px;
    }

    .col-block {
      font-size: 11px;
      color: #334155;
      line-height: 1.5;
    }
    .col-block strong {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .client-name {
      font-weight: 600;
      color: #0f172a;
    }

    table.meta-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    table.meta-table td {
      padding: 2.5px 0;
      vertical-align: top;
    }
    .meta-label {
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      width: 115px;
    }
    .meta-val {
      color: #334155;
    }

    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      margin-bottom: 20px;
      font-size: 11.5px;
    }
    table.invoice-table th {
      padding: 10px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #94a3b8;
      font-size: 11.5px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
      vertical-align: bottom;
      line-height: 1.3;
      background: #ffffff;
    }
    table.invoice-table td {
      padding: 9px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: middle;
      font-size: 11px;
    }
    .col-sno { width: 36px; text-align: left; }
    .col-img { width: 56px; text-align: left; }
    .col-sku { width: 60px; text-align: left; font-family: monospace; }
    .col-prod { text-align: left; font-weight: 600; color: #0f172a; }
    .col-qty { width: 65px; text-align: center; font-weight: 500; }
    .col-unit { width: 95px; text-align: right; white-space: nowrap; font-weight: 500; }
    .col-tax-item { width: 60px; text-align: center; }
    .col-tax-total { width: 60px; text-align: center; }
    .col-total { width: 105px; text-align: right; white-space: nowrap; font-weight: 700; color: #0f172a; }

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
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stamp {
      display: inline-block;
      padding: 5px 14px;
      border: 2.5px solid #8A1538;
      border-radius: 5px;
      color: #8A1538;
      font-weight: 900;
      font-size: 16px;
      letter-spacing: 2px;
      text-transform: uppercase;
      transform: rotate(-25deg);
      opacity: 0.88;
      background: rgba(255, 255, 255, 0.85);
    }

    table.totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    table.totals-table td {
      padding: 3.5px 0;
      color: #334155;
    }
    table.totals-table td.text-right {
      text-align: right;
    }
    .grand-total-row td {
      padding-top: 8px !important;
      border-top: 1.5px solid #cbd5e1;
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
        width: 210mm !important;
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
    <table class="layout-table top-table">
      <tr>
        <td style="width: 46%; vertical-align: top;">
          <div class="invoice-title">INVOICE</div>
          <img src="${logoUrl}" alt="Lilium & Loft Crochet Studio" class="invoice-logo" width="180" style="width: 180px; max-width: 180px; height: auto; display: block;" />
        </td>
        <td style="width: 18%;"></td>
        <td style="width: 36%; vertical-align: top;">
          <div class="from-block">
            <strong>From</strong>
            Lilium and Loft Crochet Studio<br />
            45 (13), 2nd Cross, Venkata Nagar<br />
            605011<br />
            Pondicherry (Puducherry)
          </div>
        </td>
      </tr>
    </table>

    <!-- 3-Column Info (Bill to, Ship to, Invoice Meta) -->
    <table class="layout-table details-table" style="margin-top: 24px; margin-bottom: 24px;">
      <tr>
        <td style="width: 38%; vertical-align: top; padding-right: 12px;">
          <div class="col-block">
            <strong>Bill to</strong>
            <span class="client-name">${billName}</span><br />
            ${billAddr1 ? billAddr1 + '<br />' : ''}
            ${billAddr2 ? billAddr2 + '<br />' : ''}
            ${billCity} ${billPostcode}<br />
            ${billState}<br />
            ${billPhone}
          </div>
        </td>
        <td style="width: 32%; vertical-align: top; padding-right: 12px;">
          <div class="col-block">
            <strong>Ship to</strong>
            <span class="client-name">${shipName}</span><br />
            ${shipAddr1 ? shipAddr1 + '<br />' : ''}
            ${shipAddr2 ? shipAddr2 + '<br />' : ''}
            ${shipCity} ${shipPostcode}<br />
            ${shipState}<br />
            ${shipPhone}
          </div>
        </td>
        <td style="width: 30%; vertical-align: top;">
          <table class="meta-table">
            <tr>
              <td class="meta-label">Invoice no:</td>
              <td class="meta-val">${invoiceNo}</td>
            </tr>
            <tr>
              <td class="meta-label">Order date:</td>
              <td class="meta-val">${orderDate}</td>
            </tr>
            <tr>
              <td class="meta-label">Payment method:</td>
              <td class="meta-val" style="text-transform: capitalize;">${paymentMethod}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Items Table -->
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

    <!-- Bottom Section with Stamp & Totals -->
    <table class="layout-table bottom-table" style="margin-top: 15px;">
      <tr>
        <td style="width: 58%; vertical-align: middle; text-align: center;">
          <div class="stamp">${stampText}</div>
        </td>
        <td style="width: 42%; vertical-align: top;">
          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td class="text-right">${formatCurrency(subtotal, order.currency)}</td>
            </tr>
            <tr>
              <td>Shipping</td>
              <td class="text-right">${order.shippingTotal > 0 ? `${formatCurrency(order.shippingTotal, order.currency)} via Weight Based Shipping` : 'Free'}</td>
            </tr>
            ${order.discountTotal > 0 ? `
            <tr>
              <td>Discount</td>
              <td class="text-right">-${formatCurrency(order.discountTotal, order.currency)}</td>
            </tr>` : ''}
            ${order.taxTotal > 0 ? `
            <tr>
              <td>Tax</td>
              <td class="text-right">${formatCurrency(order.taxTotal, order.currency)}</td>
            </tr>` : ''}
            <tr class="grand-total-row">
              <td>Total</td>
              <td class="text-right">${formatCurrency(order.total, order.currency)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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
 * Directly downloads the invoice as a PDF file with layout identical to Print View,
 * using an isolated iframe so the host page zoom, viewport, styles, and scroll are NEVER affected.
 */
export async function downloadInvoicePDF(order: Order): Promise<void> {
  const invoiceNo = getInvoiceNumber(order);
  const filename = `Invoice-${invoiceNo}.pdf`;
  const html = generateInvoiceHTML(order);

  // Render in an isolated off-screen iframe to prevent any viewport, zoom, or style changes to the host page
  const iframe = document.createElement('iframe');
  iframe.id = 'invoice-download-frame';
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  iframe.style.border = '0';
  iframe.style.opacity = '0.001';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentWindow?.document;
    if (!doc) throw new Error('Cannot access iframe document');

    doc.open();
    doc.write(html);
    doc.close();

    // Ensure all images inside the iframe are loaded before capturing
    const images = Array.from(doc.querySelectorAll('img'));
    await Promise.race([
      Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      ),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const targetEl = (doc.querySelector('.invoice-wrapper') as HTMLElement) || doc.body;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const,
      },
    };

    await html2pdf().set(opt).from(targetEl).save();
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}
