import React, { useRef, useEffect } from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { Sale, StoreSettings } from '../../types';

interface InvoiceModalProps {
  sale: Sale;
  settings: StoreSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, settings, onClose }) => {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCanvasRef.current && sale.invoiceNumber) {
      const qrData = `Store: ${settings.storeName}\nInvoice: ${sale.invoiceNumber}\nTotal: ${settings.currency}${sale.grandTotal}\nGSTIN: ${settings.gstNumber}`;
      QRCode.toCanvas(qrCanvasRef.current, qrData, { width: 90, margin: 1 }, (err) => {
        if (err) console.error('QR code generation error:', err);
      });
    }
  }, [sale, settings]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100 dark:border-gray-800 print:hidden">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            Transaction Completed Successfully
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE INVOICE SHEET */}
        <div id="printable-invoice" className="bg-white text-gray-900 p-6 rounded-xl border border-gray-200 shadow-sm font-sans">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {settings.storeLogo && (
                <img
                  src={settings.storeLogo}
                  alt={settings.storeName}
                  className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                />
              )}
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">{settings.storeName}</h2>
                <p className="text-xs text-gray-600 max-w-xs leading-relaxed">{settings.address}</p>
                <p className="text-xs text-gray-500 mt-0.5">Phone: {settings.mobile} | Email: {settings.email}</p>
                <p className="text-xs font-mono font-medium text-emerald-700 mt-1">GSTIN: {settings.gstNumber}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wider uppercase mb-1">
                Tax Invoice
              </span>
              <h3 className="text-lg font-bold text-gray-900">{sale.invoiceNumber}</h3>
              <p className="text-xs text-gray-500">Date: {new Date(sale.createdAt).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Cashier: {sale.cashier}</p>
            </div>
          </div>

          {/* Customer Details & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs">
            <div>
              <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">Billed To</span>
              <p className="font-bold text-gray-900 text-sm">{sale.customerName}</p>
              <p className="text-gray-600">Mobile: {sale.customerMobile}</p>
            </div>
            <div className="sm:text-right">
              <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">Payment Summary</span>
              <p className="font-medium text-gray-800">Mode: <span className="font-bold text-emerald-700">{sale.paymentMode}</span></p>
              <p className="font-medium text-gray-800">Status: <span className="text-emerald-600 font-semibold">{sale.paymentStatus}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="my-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase font-semibold border-y border-gray-200">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Product Description</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Price</th>
                  <th className="py-2.5 px-2 text-right">GST %</th>
                  <th className="py-2.5 px-2 text-right">Disc</th>
                  <th className="py-2.5 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2 px-2 text-gray-400">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium text-gray-900">{item.productName}</td>
                    <td className="py-2 px-2 text-center font-semibold text-gray-800">{item.quantity}</td>
                    <td className="py-2 px-2 text-right text-gray-700">{settings.currency}{item.sellingPrice.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-500">{item.gst}%</td>
                    <td className="py-2 px-2 text-right text-gray-500">{item.discount}%</td>
                    <td className="py-2 px-2 text-right font-bold text-gray-900">{settings.currency}{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & QR Verification */}
          <div className="flex flex-col sm:flex-row justify-between items-end pt-4 border-t border-gray-200 gap-4">
            <div className="flex items-center gap-4">
              <canvas ref={qrCanvasRef} className="w-20 h-20 border border-gray-200 rounded-lg p-1" />
              <div className="text-[11px] text-gray-500 max-w-xs leading-tight">
                <p className="font-semibold text-gray-800 mb-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Authorized Digital Bill
                </p>
                <p>Scan QR to verify invoice authenticity or process store return.</p>
              </div>
            </div>

            <div className="w-full sm:w-60 text-xs space-y-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium">{settings.currency}{sale.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total GST:</span>
                <span className="font-medium">{settings.currency}{sale.gstAmount.toFixed(2)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount:</span>
                  <span className="font-medium">-{settings.currency}{sale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                <span>Grand Total:</span>
                <span className="text-emerald-600">{settings.currency}{sale.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="mt-6 pt-4 border-t border-dashed border-gray-200 text-center text-[11px] text-gray-400">
            Thank you for shopping with {settings.storeName}! Please keep this invoice for returns & warranty.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
