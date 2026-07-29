import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Printer, Download, Search, CheckCircle2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Product, StoreSettings } from '../types';
import { fetchApi } from '../services/api';

interface Props {
  settings: StoreSettings;
}

export const BarcodeGenerator: React.FC<Props> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [labelCopies, setLabelCopies] = useState<number>(8);
  const [barcodeType, setBarcodeType] = useState<'CODE128' | 'QR'>('CODE128');

  useEffect(() => {
    fetchApi<Product[]>('/products').then(data => {
      setProducts(data);
      if (data[0]) setSelectedProductId(data[0]._id);
    });
  }, []);

  const selectedProduct = products.find(p => p._id === selectedProductId);

  const handlePrintLabels = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-500" /> Barcode & QR Code Label Generator
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Generate Code128 and QR Code sticker sheets for retail shelves and product packaging
          </p>
        </div>

        <button
          onClick={handlePrintLabels}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
        >
          <Printer className="w-4 h-4" /> Print Sticker Sheet
        </button>
      </div>

      {/* CONTROLS BAR */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Product</label>
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white"
          >
            {products.map(p => (
              <option key={p._id} value={p._id}>
                {p.productName} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Symbology Format</label>
          <select
            value={barcodeType}
            onChange={e => setBarcodeType(e.target.value as any)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
          >
            <option value="CODE128">Code 128 (Standard Linear Barcode)</option>
            <option value="QR">QR Code (2D Matrix Code)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Label Quantity Copies</label>
          <input
            type="number"
            min={1}
            max={50}
            value={labelCopies}
            onChange={e => setLabelCopies(Number(e.target.value))}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
          />
        </div>
      </div>

      {/* PRINTABLE LABEL SHEET PREVIEW */}
      {selectedProduct && (
        <div id="printable-label-sheet" className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="mb-4 pb-2 border-b border-gray-200 flex justify-between items-center text-xs text-gray-500">
            <span>Product: <strong>{selectedProduct.productName}</strong></span>
            <span>SKU: {selectedProduct.sku} | Barcode: {selectedProduct.barcode}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: labelCopies }).map((_, idx) => (
              <BarcodeCard
                key={idx}
                product={selectedProduct}
                type={barcodeType}
                currency={settings.currency}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

// Internal Card Render
const BarcodeCard: React.FC<{ product: Product; type: 'CODE128' | 'QR'; currency: string }> = ({ product, type, currency }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (type === 'CODE128' && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, product.barcode || '8901234567890', {
          format: 'CODE128',
          width: 1.5,
          height: 45,
          displayValue: true,
          fontSize: 10,
          margin: 5
        });
      } catch (e) {
        console.error(e);
      }
    } else if (type === 'QR' && qrRef.current) {
      QRCode.toCanvas(qrRef.current, product.barcode || '8901234567890', { width: 80, margin: 1 });
    }
  }, [product, type]);

  return (
    <div className="p-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center flex flex-col items-center justify-between text-gray-900 font-sans">
      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Smart Store</span>
      <h5 className="font-bold text-xs truncate max-w-full my-0.5">{product.productName}</h5>
      <p className="text-xs font-black text-emerald-600 mb-1">{currency}{product.sellingPrice.toFixed(2)}</p>

      {type === 'CODE128' ? (
        <svg ref={barcodeRef} className="max-w-full h-auto max-h-16"></svg>
      ) : (
        <canvas ref={qrRef} className="w-16 h-16"></canvas>
      )}

      <span className="text-[9px] text-gray-400 font-mono mt-1">SKU: {product.sku}</span>
    </div>
  );
};
