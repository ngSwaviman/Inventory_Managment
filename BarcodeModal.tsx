import React, { useEffect, useRef } from 'react';
import { X, Printer, Download, QrCode as QrIcon } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface BarcodeModalProps {
  productName: string;
  sku: string;
  barcode: string;
  price: number;
  currency?: string;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  productName,
  sku,
  barcode,
  price,
  currency = '$',
  onClose
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (barcodeRef.current && barcode) {
      try {
        JsBarcode(barcodeRef.current, barcode, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          margin: 10
        });
      } catch (e) {
        console.error('JsBarcode error:', e);
      }
    }

    if (qrRef.current && barcode) {
      QRCode.toCanvas(qrRef.current, barcode, { width: 120, margin: 1 }, (err) => {
        if (err) console.error('QRCode error:', err);
      });
    }
  }, [barcode]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Product Barcode Label</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {sku}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Container */}
        <div id="printable-barcode-card" className="my-6 p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center flex flex-col items-center">
          <span className="text-xs font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500 mb-1">
            Smart Store Label
          </span>
          <h4 className="font-bold text-gray-900 dark:text-white text-base max-w-xs truncate mb-1">
            {productName}
          </h4>
          <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mb-3">
            {currency}{price.toFixed(2)}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-2 bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 w-full">
            <div className="flex flex-col items-center">
              <svg ref={barcodeRef} className="max-w-full h-auto max-h-20"></svg>
            </div>
            <div className="flex flex-col items-center">
              <canvas ref={qrRef} className="w-24 h-24"></canvas>
              <span className="text-[10px] text-gray-400 mt-1">QR Scan</span>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between w-full px-2">
            <span>SKU: {sku}</span>
            <span>Code: {barcode}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Printer className="w-4 h-4" />
            Print Barcode
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
