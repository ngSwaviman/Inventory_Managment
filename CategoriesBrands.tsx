import React, { useState, useEffect } from 'react';
import { Layers, Award, Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { Category, Brand } from '../types';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const CategoriesBrands: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, brds] = await Promise.all([
        fetchApi<Category[]>('/categories'),
        fetchApi<Brand[]>('/brands')
      ]);
      setCategories(cats);
      setBrands(brds);
    } catch (err) {
      console.error('Error loading categories and brands:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'categories') {
        if (editingId) {
          const updated = await fetchApi<Category>(`/categories/${editingId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, description })
          });
          setCategories(prev => prev.map(c => c._id === editingId ? updated : c));
        } else {
          const created = await fetchApi<Category>('/categories', {
            method: 'POST',
            body: JSON.stringify({ name, description })
          });
          setCategories(prev => [created, ...prev]);
        }
        showToast('Category saved!', 'success');
      } else {
        const created = await fetchApi<Brand>('/brands', {
          method: 'POST',
          body: JSON.stringify({
            name,
            description,
            logo: logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop'
          })
        });
        setBrands(prev => [created, ...prev]);
        showToast('Brand saved!', 'success');
      }
      setShowModal(false);
      setName('');
      setDescription('');
      setLogo('');
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return showToast('Only Admins can delete categories/brands!', 'error');
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await fetchApi(`/${activeTab}/${id}`, { method: 'DELETE' });
      if (activeTab === 'categories') {
        setCategories(prev => prev.filter(c => c._id !== id));
      } else {
        setBrands(prev => prev.filter(b => b._id !== id));
      }
      showToast('Item deleted!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" /> Categories & Brand Catalog
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Organize products by category taxonomies and manufacturer brand logos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'categories' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-xs' : 'text-gray-500'
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('brands')}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'brands' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-xs' : 'text-gray-500'
              }`}
            >
              Brands ({brands.length})
            </button>
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setName('');
              setDescription('');
              setLogo('');
              setShowModal(true);
            }}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Add {activeTab === 'categories' ? 'Category' : 'Brand'}
          </button>
        </div>
      </div>

      {/* CATEGORIES LIST TABLE */}
      {activeTab === 'categories' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase border-b border-gray-200 dark:border-gray-800">
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {categories.map(cat => (
                  <tr key={cat._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-500" /> {cat.name}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{cat.description || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {isAdmin && (
                        <button onClick={() => handleDelete(cat._id)} className="text-rose-600 hover:underline font-semibold">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* BRANDS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {brands.map(brand => (
            <div key={brand._id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
              <img src={brand.logo} alt={brand.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{brand.name}</h4>
                <p className="text-xs text-gray-500 truncate">{brand.description || 'Official Brand Vendor'}</p>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(brand._id)} className="text-rose-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">
              Add New {activeTab === 'categories' ? 'Category' : 'Brand'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>

              {activeTab === 'brands' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
                  <input
                    type="text"
                    value={logo}
                    onChange={e => setLogo(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 border border-gray-300 dark:border-gray-700 text-xs rounded-xl"
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
