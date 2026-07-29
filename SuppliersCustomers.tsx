import React, { useState, useEffect } from 'react';
import { Truck, Users, Plus, Edit2, Trash2, Phone, Mail, MapPin, Award } from 'lucide-react';
import { Supplier, Customer, StoreSettings } from '../types';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Props {
  settings: StoreSettings;
}

export const SuppliersCustomers: React.FC<Props> = ({ settings }) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'customers'>('suppliers');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [supForm, setSupForm] = useState<Partial<Supplier>>({});
  const [custForm, setCustForm] = useState<Partial<Customer>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sups, custs] = await Promise.all([
        fetchApi<Supplier[]>('/suppliers'),
        fetchApi<Customer[]>('/customers')
      ]);
      setSuppliers(sups);
      setCustomers(custs);
    } catch (err) {
      console.error('Failed loading suppliers & customers:', err);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (supForm._id) {
        const updated = await fetchApi<Supplier>(`/suppliers/${supForm._id}`, {
          method: 'PUT',
          body: JSON.stringify(supForm)
        });
        setSuppliers(prev => prev.map(s => s._id === updated._id ? updated : s));
      } else {
        const created = await fetchApi<Supplier>('/suppliers', {
          method: 'POST',
          body: JSON.stringify(supForm)
        });
        setSuppliers(prev => [created, ...prev]);
      }
      showToast('Supplier saved!', 'success');
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed saving supplier', 'error');
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await fetchApi<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(custForm)
      });
      setCustomers(prev => [created, ...prev]);
      showToast('Customer saved!', 'success');
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed saving customer', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-500" /> Supplier & Customer Directory
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage wholesale vendors, GST numbers, customer loyalty profiles & addresses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'suppliers' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-xs' : 'text-gray-500'
              }`}
            >
              Suppliers ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'customers' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-xs' : 'text-gray-500'
              }`}
            >
              Customers ({customers.length})
            </button>
          </div>

          <button
            onClick={() => {
              setSupForm({});
              setCustForm({});
              setShowModal(true);
            }}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Add {activeTab === 'suppliers' ? 'Supplier' : 'Customer'}
          </button>
        </div>
      </div>

      {/* SUPPLIERS VIEW */}
      {activeTab === 'suppliers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map(sup => (
            <div key={sup._id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{sup.supplierName}</h4>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{sup.companyName}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  GSTIN: {sup.gstNumber}
                </span>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {sup.mobile}</p>
                <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {sup.email}</p>
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {sup.address}, {sup.city}, {sup.state} - {sup.pinCode}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* CUSTOMERS VIEW */
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase border-b border-gray-200 dark:border-gray-800">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Loyalty Points</th>
                  <th className="py-3 px-4 text-right">Total Purchases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {customers.map(cust => (
                  <tr key={cust._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" /> {cust.customerName}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{cust.mobile}</td>
                    <td className="py-3 px-4 text-gray-500">{cust.email || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{cust.address || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                        ★ {cust.loyaltyPoints} Pts
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                      {settings.currency}{cust.totalPurchases.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER / CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">
              Add New {activeTab === 'suppliers' ? 'Supplier' : 'Customer'}
            </h3>

            {activeTab === 'suppliers' ? (
              <form onSubmit={handleSaveSupplier} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={supForm.supplierName || ''}
                    onChange={e => setSupForm({ ...supForm, supplierName: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={supForm.companyName || ''}
                    onChange={e => setSupForm({ ...supForm, companyName: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">GST Number</label>
                  <input
                    type="text"
                    required
                    value={supForm.gstNumber || ''}
                    onChange={e => setSupForm({ ...supForm, gstNumber: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile</label>
                  <input
                    type="text"
                    required
                    value={supForm.mobile || ''}
                    onChange={e => setSupForm({ ...supForm, mobile: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-3">
                  <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">Save</button>
                  <button type="button" onClick={() => setShowModal(false)} className="py-2 px-4 border text-xs rounded-xl">Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveCustomer} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={custForm.customerName || ''}
                    onChange={e => setCustForm({ ...custForm, customerName: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={custForm.mobile || ''}
                    onChange={e => setCustForm({ ...custForm, mobile: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={custForm.email || ''}
                    onChange={e => setCustForm({ ...custForm, email: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-3">
                  <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">Save</button>
                  <button type="button" onClick={() => setShowModal(false)} className="py-2 px-4 border text-xs rounded-xl">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
