import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, FileText, Loader2 } from 'lucide-react';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import {
  getInvoiceNumber,
  formatInvoiceDate,
  getInvoiceStampText,
  printInvoice,
  downloadInvoicePDF,
} from '@/utils/invoice';
import { toast } from 'sonner';

interface InvoiceModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceModal({ order, open, onOpenChange }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!order) return null;

  const invoiceNo = getInvoiceNumber(order);
  const orderDate = formatInvoiceDate(order.dateCreated);
  const paymentMethod = (order.paymentMethod || order.paymentMethodTitle || 'phonepe').toLowerCase();
  const stampText = getInvoiceStampText(order.status);

  const billName =
    `${order.billing?.firstName || ''} ${order.billing?.lastName || ''}`.trim() ||
    order.customerName ||
    'Customer';
  const billAddr1 = order.billing?.address1 || '';
  const billAddr2 = order.billing?.address2 || '';
  const billCity = order.billing?.city || '';
  const billState = order.billing?.state || '';
  const billPostcode = order.billing?.postcode || '';
  const billPhone = order.billing?.phone || '';

  const shipName =
    `${order.shipping?.firstName || ''} ${order.shipping?.lastName || ''}`.trim() || billName;
  const shipAddr1 = order.shipping?.address1 || billAddr1;
  const shipAddr2 = order.shipping?.address2 || billAddr2;
  const shipCity = order.shipping?.city || billCity;
  const shipState = order.shipping?.state || billState;
  const shipPostcode = order.shipping?.postcode || billPostcode;
  const shipPhone = order.shipping?.phone || billPhone;

  const subtotal =
    order.subtotal ??
    order.items.reduce(
      (sum, item) => sum + (item.subtotal || item.total || item.price * item.quantity),
      0
    );

  const handlePrint = () => {
    printInvoice(order);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      toast.loading('Downloading invoice PDF...', { id: 'invoice-pdf-download' });
      await downloadInvoicePDF(order, invoiceRef.current);
      toast.success('Invoice PDF downloaded successfully!', { id: 'invoice-pdf-download' });
    } catch (err) {
      console.error('Download PDF error:', err);
      toast.error('Failed to download invoice PDF', { id: 'invoice-pdf-download' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[940px] sm:max-w-[940px] md:max-w-[940px] lg:max-w-[940px] p-0 overflow-hidden bg-slate-100 max-h-[94vh] flex flex-col sm:rounded-xl border border-slate-300 shadow-2xl">
        {/* Top Actions Bar */}
        <DialogHeader className="p-3.5 sm:p-4 px-4 sm:px-6 bg-white border-b border-slate-200 flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="h-9 w-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Invoice: {invoiceNo}
                </DialogTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 tracking-wide shrink-0">
                  Order #{order.orderNumber}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                Official Lilium & Loft store tax invoice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrint}
              className="h-8 w-8 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900"
              title="Print Invoice"
              aria-label="Print Invoice"
            >
              <Printer className="h-4 w-4 text-slate-600" />
            </Button>
            <Button
              size="icon"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-8 w-8 bg-red-600 hover:bg-red-700 text-white shadow-sm"
              title="Download PDF"
              aria-label="Download PDF"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Invoice Sheet Container */}
        <div className="p-2 sm:p-5 overflow-y-auto flex-1 flex justify-center bg-slate-100/90">
          <div
            ref={invoiceRef}
            className="w-full max-w-[860px] bg-white rounded shadow-sm border border-slate-200/90 p-4 sm:p-8 text-slate-800 text-xs font-sans relative"
          >
            {/* Top Grid: Left (Invoice + Logo), Middle (spacer), Right (From) */}
            <div className="grid grid-cols-1 sm:grid-cols-[38%_30%_32%] gap-4 mb-6 items-start">
              <div className="flex flex-col gap-2.5">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-wider text-slate-900 uppercase">
                  INVOICE
                </h2>
                <img
                  src="/logo.png"
                  alt="Lilium & Loft Crochet Studio"
                  className="h-12 sm:h-14 w-auto object-contain max-w-[190px] sm:max-w-[215px]"
                />
              </div>

              <div className="hidden sm:block"></div>

              <div className="text-left text-xs leading-relaxed text-slate-600 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <strong className="block text-slate-900 font-bold mb-1 text-[12.5px]">From</strong>
                Lilium and Loft Crochet Studio<br />
                45 (13), 2nd Cross, Venkata Nagar<br />
                605011<br />
                Pondicherry (Puducherry)
              </div>
            </div>

            {/* 3-Column Info (Bill to, Ship to, Meta) - Exactly matching PDF layout */}
            <div className="grid grid-cols-1 sm:grid-cols-[38%_30%_32%] gap-4 mb-6 sm:mb-8 text-xs leading-relaxed">
              <div className="pb-2 sm:pb-0 border-b sm:border-b-0 border-slate-100">
                <strong className="block text-slate-900 font-bold mb-1 text-[12.5px]">Bill to</strong>
                <p className="text-slate-800 font-medium">{billName}</p>
                {billAddr1 && <p className="text-slate-600">{billAddr1}</p>}
                {billAddr2 && <p className="text-slate-600">{billAddr2}</p>}
                {(billCity || billPostcode) && (
                  <p className="text-slate-600">{billCity} {billPostcode}</p>
                )}
                {billState && <p className="text-slate-600">{billState}</p>}
                {billPhone && <p className="text-slate-600 mt-0.5">{billPhone}</p>}
              </div>

              <div className="pb-2 sm:pb-0 border-b sm:border-b-0 border-slate-100">
                <strong className="block text-slate-900 font-bold mb-1 text-[12.5px]">Ship to</strong>
                <p className="text-slate-800 font-medium">{shipName}</p>
                {shipAddr1 && <p className="text-slate-600">{shipAddr1}</p>}
                {shipAddr2 && <p className="text-slate-600">{shipAddr2}</p>}
                {(shipCity || shipPostcode) && (
                  <p className="text-slate-600">{shipCity} {shipPostcode}</p>
                )}
                {shipState && <p className="text-slate-600">{shipState}</p>}
                {shipPhone && <p className="text-slate-600 mt-0.5">{shipPhone}</p>}
              </div>

              <div className="space-y-1 text-xs pt-1 sm:pt-0">
                <div className="flex gap-1.5 justify-between sm:justify-start">
                  <span className="font-bold text-slate-900 sm:min-w-[110px]">Invoice no:</span>
                  <span className="text-slate-700 font-medium">{invoiceNo}</span>
                </div>
                <div className="flex gap-1.5 justify-between sm:justify-start">
                  <span className="font-bold text-slate-900 sm:min-w-[110px]">Order date:</span>
                  <span className="text-slate-700">{orderDate}</span>
                </div>
                <div className="flex gap-1.5 justify-between sm:justify-start">
                  <span className="font-bold text-slate-900 sm:min-w-[110px]">Payment method:</span>
                  <span className="text-slate-700 capitalize">{paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mt-4 -mx-1 sm:mx-0">
              <table className="w-full border-collapse text-xs min-w-[580px]">
                <thead>
                  <tr className="border-t border-b border-slate-300 text-slate-900 font-bold align-bottom">
                    <th className="py-2.5 px-2 text-left w-10 text-xs font-bold text-slate-900">S.No</th>
                    <th className="py-2.5 px-2 text-left w-14 text-xs font-bold text-slate-900">Image</th>
                    <th className="py-2.5 px-2 text-left w-16 text-xs font-bold text-slate-900">SKU</th>
                    <th className="py-2.5 px-2 text-left text-xs font-bold text-slate-900">Product</th>
                    <th className="py-2.5 px-2 text-center w-14 text-xs font-bold text-slate-900">Quantity</th>
                    <th className="py-2.5 px-2 text-right w-24 text-xs font-bold text-slate-900 whitespace-nowrap">Unit price</th>
                    <th className="py-2.5 px-2 text-center w-16 leading-tight text-xs font-bold text-slate-900">Tax<br />items</th>
                    <th className="py-2.5 px-2 text-center w-16 leading-tight text-xs font-bold text-slate-900">Total<br />Tax</th>
                    <th className="py-2.5 px-2 text-right w-24 text-xs font-bold text-slate-900 whitespace-nowrap">Total price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => {
                    const itemPrice =
                      item.price || (item.quantity > 0 ? item.total / item.quantity : 0);
                    const itemTotal = item.total || itemPrice * item.quantity;
                    return (
                      <tr key={item.id || idx} className="text-slate-700">
                        <td className="py-3 px-2 text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-2">
                          <div className="h-11 w-11 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-slate-400 text-sm">🧶</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono text-[11px] text-slate-500">
                          {item.sku || '-'}
                        </td>
                        <td className="py-3 px-2 font-medium text-slate-900 max-w-[200px]">
                          {item.name}
                        </td>
                        <td className="py-3 px-2 text-center font-medium">{item.quantity}</td>
                        <td className="py-3 px-2 text-right font-medium text-slate-800 whitespace-nowrap">
                          {formatCurrency(itemPrice, order.currency)}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-400">-</td>
                        <td className="py-3 px-2 text-center text-slate-400">-</td>
                        <td className="py-3 px-2 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(itemTotal, order.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom section with stamp and totals */}
            <div className="mt-8 flex flex-col sm:flex-row justify-end items-center sm:items-start relative gap-4">
              {/* Slanted Stamp */}
              <div className="self-center sm:self-auto sm:absolute sm:right-[310px] sm:-top-3 flex items-center justify-center select-none pointer-events-none mb-1 sm:mb-0">
                <div className="border-[2.5px] border-[#8A1538] text-[#8A1538] font-black tracking-widest text-sm sm:text-lg px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-md -rotate-[28deg] sm:-rotate-[32deg] opacity-85 uppercase shadow-xs bg-white/70">
                  {stampText}
                </div>
              </div>

              {/* Totals Table */}
              <div className="w-full sm:w-[290px] space-y-1.5 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(subtotal, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {order.shippingTotal > 0
                      ? `${formatCurrency(order.shippingTotal, order.currency)} via Weight Based Shipping`
                      : 'Free Shipping'}
                  </span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between py-1 text-emerald-600">
                    <span>Discount</span>
                    <span className="font-semibold">
                      -{formatCurrency(order.discountTotal, order.currency)}
                    </span>
                  </div>
                )}
                {order.taxTotal > 0 && (
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Tax</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(order.taxTotal, order.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t-2 border-slate-200 text-sm font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-base text-slate-900">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
