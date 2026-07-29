import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Store, Users, Shield, Database, Plus, Download, Upload, Save } from 'lucide-react';
import { StoreSettings, User } from '../types';
import { fetchApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
}

export const Settings: React.FC<Props> = ({ settings, onUpdateSettings }) => {
  const { showToast } = useToast();

  const [formSettings, setFormSettings] = useState<StoreSettings>(settings);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // New staff form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'Admin' | 'Staff'>('Staff');
  const [staffMobile, setStaffMobile] = useState('');

  useEffect(() => {
    fetchApi<User[]>('/users').then(setUsers).catch(console.error);
  }, []);

  const handleSaveStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await fetchApi<StoreSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(formSettings)
      });
      onUpdateSettings(updated);
      showToast('Store Profile Settings Updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await fetchApi<User>('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          password: staffPassword,
          role: staffRole,
          mobile: staffMobile
        })
      });
      setUsers(prev => [...prev, created]);
      showToast(`User account created for ${created.name}`, 'success');
      setShowAddStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed creating staff user', 'error');
    }
  };

  // Database Backup Dump
  const handleBackupDatabase = async () => {
    try {
      const [prods, sales, purs, sups, custs] = await Promise.all([
        fetchApi('/products'),
        fetchApi('/sales'),
        fetchApi('/purchases'),
        fetchApi('/suppliers'),
        fetchApi('/customers')
      ]);

      const backupObj = {
        timestamp: new Date().toISOString(),
        storeSettings: formSettings,
        products: prods,
        sales,
        purchases: purs,
        suppliers: sups,
        customers: custs
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `SmartStore_Database_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Full Database JSON Backup exported!', 'success');
    } catch (err: any) {
      showToast('Backup failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      
      {/* Header Bar */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-emerald-500" /> System Settings & Staff Administration
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Configure store identity, invoice branding, staff permissions & database backup/restore
        </p>
      </div>

      {/* STORE PROFILE FORM */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Store className="w-4 h-4 text-emerald-500" /> Store Profile & Tax Registration
        </h3>

        <form onSubmit={handleSaveStoreInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={formSettings.storeName}
                onChange={e => setFormSettings({ ...formSettings, storeName: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">GSTIN Tax Registration Number</label>
              <input
                type="text"
                required
                value={formSettings.gstNumber}
                onChange={e => setFormSettings({ ...formSettings, gstNumber: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Store Logo URL</label>
              <input
                type="text"
                value={formSettings.storeLogo}
                onChange={e => setFormSettings({ ...formSettings, storeLogo: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Store Currency Symbol</label>
              <input
                type="text"
                value={formSettings.currency}
                onChange={e => setFormSettings({ ...formSettings, currency: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={formSettings.mobile}
                onChange={e => setFormSettings({ ...formSettings, mobile: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Store Email</label>
              <input
                type="email"
                value={formSettings.email}
                onChange={e => setFormSettings({ ...formSettings, email: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <input
                type="text"
                value={formSettings.address}
                onChange={e => setFormSettings({ ...formSettings, address: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" /> Save Store Settings
          </button>
        </form>
      </div>

      {/* USER & STAFF MANAGEMENT SECTION */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" /> Staff User Management & Role Access
          </h3>

          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center gap-2 py-2 px-3.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Staff User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase border-b border-gray-200 dark:border-gray-800">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Mobile</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(u => (
                <tr key={u.id || u.email} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{u.name}</td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500">{u.mobile || 'N/A'}</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-600">Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DATABASE BACKUP & RESTORE */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
        <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-500" /> Database Backup & Restore
        </h3>
        <p className="text-xs text-gray-500">
          Export full database snapshot (Products, Sales, Suppliers, Purchases, Settings) as a JSON backup file.
        </p>

        <button
          onClick={handleBackupDatabase}
          className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Download className="w-4 h-4 text-emerald-600" /> Download Full Database Backup JSON
        </button>
      </div>

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-3">Add Staff Account</h3>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={e => setStaffEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={staffPassword}
                  onChange={e => setStaffPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select
                  value={staffRole}
                  onChange={e => setStaffRole(e.target.value as any)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="Staff">Staff / Cashier</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="py-2 px-4 border text-xs rounded-xl"
                >
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
