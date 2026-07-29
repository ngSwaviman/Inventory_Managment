import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, AlertTriangle, CheckCircle2, RefreshCw, Plus, Package } from 'lucide-react';
import { Product, StockHistoryItem, StoreSettings } from '../types';
import { fetchApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  settings: StoreSettings;
}

export const StockManagement: React.FC<Props> = ({ settings }) => {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<StockHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'Stock In' | 'Stock Out' | 'Stock Transfer' | 'Damaged Stock' | 'Returned Stock' | 'Adjustment'>('Stock In');
  const [quantity, setQuantity] = useState<number>(5);
  const [reason, setReason] = useState('Routine Warehouse Stock Check');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, hist] = await Promise.all([
        fetchApi<Product[]>('/products'),
        fetchApi<StockHistoryItem[]>('/stock/history')
      ]);
      setProducts(prods);
      setHistory(hist);
      if (prods[0]) setSelectedProductId(prods[0]._id);
    } catch (err) {
      console.error('Error loading stock history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    try {
      const res = await fetchApi<{ message: string; history: StockHistoryItem }>('/stock/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProductId,
          adjustmentType,
          quantity,
          reason
        })
      });

      showToast(res.message, 'success');
      loadData(); // Reload updated products and audit trail
      setQuantity(5);
    } catch (err: any) {
      showToast(err.message || 'Stock adjustment failed', 'error');
    }
  };

  const lowStockProds = products.filter(p => p.quantity <= p.minimumStock);
  const outOfStockProds = products.filter(p => p.quantity <= 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-emerald-500" /> Stock & Inventory Management
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Process stock in/out transfers, damaged item write-offs, and inspect complete audit trail
        </p>
      </div>

      {/* QUICK ALERTS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Alerts
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{lowStockProds.length} products below minimum threshold</p>
          </div>
          <span className="text-xl font-black text-amber-600">{lowStockProds.length}</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Out of Stock Items
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">{outOfStockProds.length} products with zero balance</p>
          </div>
          <span className="text-xl font-black text-rose-600">{outOfStockProds.length}</span>
        </div>
      </div>

      {/* STOCK ADJUSTMENT FORM & AUDIT TRAIL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Adjustment Form (1 Col) */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm h-fit">
          <h3 className="font-bold text-base text-gray-900 dark:text-white mb-3">Record Stock Movement</h3>
          <form onSubmit={handleAdjustStock} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Product</label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white"
              >
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.productName} (Current: {p.quantity} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Movement Type</label>
              <select
                value={adjustmentType}
                onChange={e => setAdjustmentType(e.target.value as any)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="Stock In">Stock In (+ Restock)</option>
                <option value="Stock Out">Stock Out (- Dispatch)</option>
                <option value="Stock Transfer">Stock Transfer (- Location Shift)</option>
                <option value="Damaged Stock">Damaged Stock (- Write Off)</option>
                <option value="Returned Stock">Returned Stock (+ Customer Return)</option>
                <option value="Adjustment">Adjustment (Physical Count Sync)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
              <input
                type="number"
                required
                min={1}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Reason / Reference</label>
              <input
                type="text"
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all mt-2"
            >
              Confirm Stock Movement
            </button>
          </form>
        </div>

        {/* Audit Log Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">Stock Movement Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase border-b border-gray-200 dark:border-gray-800">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">By</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {history.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{item.productName}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          ['Stock In', 'Returned Stock'].includes(item.type)
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-gray-500 max-w-xs truncate">{item.reason}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">{item.performedBy}</td>
                    <td className="py-2.5 px-3 text-gray-400">{new Date(item.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
