import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, FileText, CheckCircle2 } from 'lucide-react';
import { Purchase, Supplier, Product, StoreSettings } from '../types';
import { fetchApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  settings: StoreSettings;
}

export const Purchases: React.FC<Props> = ({ settings }) => {
  const { showToast } = useToast();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    supplier: '',
    productName: '',
    quantity: 10,
    purchasePrice: 20,
    gst: 18,
    discount: 0,
    paymentMode: 'Bank Transfer',
    paymentStatus: 'Paid',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [purs, sups, prods] = await Promise.all([
        fetchApi<Purchase[]>('/purchases'),
        fetchApi<Supplier[]>('/suppliers'),
        fetchApi<Product[]>('/products')
      ]);
      setPurchases(purs);
      setSuppliers(sups);
      setProducts(prods);
      if (sups[0]) setFormData(prev => ({ ...prev, supplier: sups[0].supplierName }));
      if (prods[0]) setFormData(prev => ({ ...prev, productName: prods[0].productName, purchasePrice: prods[0].purchasePrice }));
    } catch (err) {
      console.error('Error loading purchases:', err);
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await fetchApi<Purchase>('/purchases', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setPurchases(prev => [created, ...prev]);
      showToast(`Purchase Order ${created.invoiceNumber} created and stock updated!`, 'success');
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed creating purchase order', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-500" /> Wholesale Purchase Orders
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Log supplier restock purchases, track inventory costs & automatic stock increments
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" /> Create Purchase Invoice
        </button>
      </div>

      {/* PURCHASES TABLE */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase border-b border-gray-200 dark:border-gray-800">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Product Purchased</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Total Order Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {purchases.map(pur => (
                <tr key={pur._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" /> {pur.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">{pur.supplier}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">{pur.productName}</td>
                  <td className="py-3 px-3 text-center font-bold text-gray-900 dark:text-white">{pur.quantity} Pcs</td>
                  <td className="py-3 px-3 text-right text-gray-500">{settings.currency}{pur.purchasePrice.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {settings.currency}{pur.total.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                      {pur.paymentMode} ({pur.paymentStatus})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{pur.purchaseDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">
              Create Wholesale Purchase Invoice
            </h3>
            <form onSubmit={handleCreatePurchase} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                <select
                  value={formData.supplier}
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                >
                  {suppliers.map(s => <option key={s._id} value={s.supplierName}>{s.supplierName} ({s.companyName})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Product Item</label>
                <select
                  value={formData.productName}
                  onChange={e => {
                    const selected = products.find(p => p.productName === e.target.value);
                    setFormData({
                      ...formData,
                      productName: e.target.value,
                      purchasePrice: selected?.purchasePrice || formData.purchasePrice
                    });
                  }}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {products.map(p => <option key={p._id} value={p.productName}>{p.productName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Restock Qty</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Unit Cost ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchasePrice}
                    onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">GST Tax %</label>
                  <input
                    type="number"
                    value={formData.gst}
                    onChange={e => setFormData({ ...formData, gst: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">
                  Submit Order & Update Stock
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="py-2.5 px-4 border text-xs rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
