import React, { useState, useEffect } from 'react';
import { FileBarChart2, FileSpreadsheet, Download, Printer, TrendingUp, DollarSign, Package } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Sale, Purchase, Product, StoreSettings } from '../types';
import { fetchApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  settings: StoreSettings;
}

export const Reports: React.FC<Props> = ({ settings }) => {
  const { showToast } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reportType, setReportType] = useState<
    'sales' | 'purchases' | 'profit' | 'gst' | 'stock' | 'top_selling' | 'dead_stock'
  >('sales');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sData, pData, prData] = await Promise.all([
        fetchApi<Sale[]>('/sales'),
        fetchApi<Purchase[]>('/purchases'),
        fetchApi<Product[]>('/products')
      ]);
      setSales(sData);
      setPurchases(pData);
      setProducts(prData);
    } catch (err) {
      console.error('Error loading reports data:', err);
    }
  };

  const handleExportExcel = () => {
    let exportData: any[] = [];
    let filename = `Report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (reportType === 'sales') {
      exportData = sales.map(s => ({
        'Invoice #': s.invoiceNumber,
        'Customer': s.customerName,
        'Payment Mode': s.paymentMode,
        'Subtotal': s.subTotal,
        'GST': s.gstAmount,
        'Discount': s.discountAmount,
        'Grand Total': s.grandTotal,
        'Date': new Date(s.createdAt).toLocaleString()
      }));
    } else if (reportType === 'purchases') {
      exportData = purchases.map(p => ({
        'Invoice #': p.invoiceNumber,
        'Supplier': p.supplier,
        'Product': p.productName,
        'Qty': p.quantity,
        'Price': p.purchasePrice,
        'Total': p.total,
        'Date': p.purchaseDate
      }));
    } else if (reportType === 'stock') {
      exportData = products.map(p => ({
        'Product Name': p.productName,
        'SKU': p.sku,
        'Category': p.category,
        'Quantity': p.quantity,
        'Selling Price': p.sellingPrice,
        'Stock Status': p.quantity <= 0 ? 'Out of Stock' : p.quantity <= p.minimumStock ? 'Low Stock' : 'In Stock'
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report_Sheet');
    XLSX.writeFile(workbook, filename);
    showToast(`Exported ${reportType} report to Excel`, 'success');
  };

  const totalSalesRevenue = sales.reduce((a, b) => a + b.grandTotal, 0);
  const totalPurchaseExpenses = purchases.reduce((a, b) => a + b.total, 0);
  const totalGstCollected = sales.reduce((a, b) => a + b.gstAmount, 0);
  const estimatedProfit = totalSalesRevenue - totalPurchaseExpenses * 0.4;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-emerald-500" /> Store Reports & Financial Analytics
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Generate and export Sales, Purchase, Profit & Loss, GST Tax & Stock valuation reports
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export Report (Excel)
        </button>
      </div>

      {/* REPORT METRICS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold block mb-1">Total Sales Revenue</span>
          <span className="text-lg font-bold text-emerald-600">{settings.currency}{totalSalesRevenue.toFixed(2)}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold block mb-1">Total Purchase Expenses</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{settings.currency}{totalPurchaseExpenses.toFixed(2)}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold block mb-1">GST Tax Collected</span>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{settings.currency}{totalGstCollected.toFixed(2)}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold block mb-1">Estimated Net Profit</span>
          <span className="text-lg font-bold text-emerald-600">{settings.currency}{estimatedProfit.toFixed(2)}</span>
        </div>
      </div>

      {/* REPORT TYPE TABS */}
      <div className="bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'sales', label: 'Sales Report' },
          { id: 'purchases', label: 'Purchase Report' },
          { id: 'profit', label: 'Profit & Loss' },
          { id: 'gst', label: 'GST Tax' },
          { id: 'stock', label: 'Stock Valuation' },
          { id: 'top_selling', label: 'Fast Moving Products' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              reportType === tab.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REPORT CONTENT TABLE */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden p-4">
        {reportType === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase border-b border-gray-200 dark:border-gray-800">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sales.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{s.invoiceNumber}</td>
                    <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">{s.customerName}</td>
                    <td className="py-2.5 px-3">{s.paymentMode}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{settings.currency}{s.grandTotal.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase border-b border-gray-200 dark:border-gray-800">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {purchases.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{p.invoiceNumber}</td>
                    <td className="py-2.5 px-3 font-semibold">{p.supplier}</td>
                    <td className="py-2.5 px-3">{p.productName}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{p.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{settings.currency}{p.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase border-b border-gray-200 dark:border-gray-800">
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">In Stock Qty</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.map(pr => (
                  <tr key={pr._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{pr.productName}</td>
                    <td className="py-2.5 px-3 font-mono">{pr.sku}</td>
                    <td className="py-2.5 px-3">{pr.category}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{pr.quantity} {pr.unit}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{settings.currency}{pr.sellingPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
