import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  QrCode,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  LayoutGrid,
  List,
  AlertTriangle,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product, Category, Brand, Supplier, StoreSettings } from '../types';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BarcodeModal } from '../components/common/BarcodeModal';

interface ProductsProps {
  settings: StoreSettings;
}

export const Products: React.FC<ProductsProps> = ({ settings }) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    productName: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    supplier: '',
    purchasePrice: 0,
    sellingPrice: 0,
    gst: 18,
    discount: 0,
    quantity: 10,
    unit: 'Pcs',
    minimumStock: 5,
    maximumStock: 100,
    productDescription: '',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    productStatus: 'Active',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&fit=crop'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodsData, catsData, brdsData, supsData] = await Promise.all([
        fetchApi<Product[]>('/products'),
        fetchApi<Category[]>('/categories'),
        fetchApi<Brand[]>('/brands'),
        fetchApi<Supplier[]>('/suppliers')
      ]);
      setProducts(prodsData);
      setCategories(catsData);
      setBrands(brdsData);
      setSuppliers(supsData);
    } catch (err) {
      console.error('Error loading products list:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAutoSku = () => {
    const prefix = (formData.category || 'SKU').substring(0, 3).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData(prev => ({ ...prev, sku: `${prefix}-${rand}` }));
  };

  const generateAutoBarcode = () => {
    const code = '890' + Math.floor(100000000 + Math.random() * 900000000);
    setFormData(prev => ({ ...prev, barcode: code }));
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      productName: '',
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      barcode: '890' + Math.floor(100000000 + Math.random() * 900000000),
      category: categories[0]?.name || 'Electronics',
      brand: brands[0]?.name || 'TechPro',
      supplier: suppliers[0]?.supplierName || 'Global Tech Distributors',
      purchasePrice: 10,
      sellingPrice: 20,
      gst: 18,
      discount: 0,
      quantity: 25,
      unit: 'Pcs',
      minimumStock: 5,
      maximumStock: 100,
      productDescription: '',
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      productStatus: 'Active',
      productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&fit=crop'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData(p);
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const updated = await fetchApi<Product>(`/products/${editingProduct._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setProducts(prev => prev.map(p => (p._id === updated._id ? updated : p)));
        showToast(`Updated product ${updated.productName}`, 'success');
      } else {
        const created = await fetchApi<Product>('/products', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setProducts(prev => [created, ...prev]);
        showToast(`Added product ${created.productName}`, 'success');
      }
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed saving product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!isAdmin) {
      showToast('Staff role cannot delete products!', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await fetchApi(`/products/${id}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p._id !== id));
      showToast(`Deleted ${name}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // Export Excel file
  const handleExportExcel = () => {
    const exportData = filteredProducts.map(p => ({
      'Product Name': p.productName,
      'SKU': p.sku,
      'Barcode': p.barcode,
      'Category': p.category,
      'Brand': p.brand,
      'Supplier': p.supplier,
      'Purchase Price': p.purchasePrice,
      'Selling Price': p.sellingPrice,
      'GST %': p.gst,
      'Quantity': p.quantity,
      'Unit': p.unit,
      'Min Stock': p.minimumStock,
      'Status': p.productStatus
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory_Products');
    XLSX.writeFile(workbook, `SmartStore_Products_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Products exported to Excel successfully!', 'success');
  };

  // Filter logic
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchesCat = !filterCategory || p.category === filterCategory;
    const matchesBrd = !filterBrand || p.brand === filterBrand;
    const matchesSup = !filterSupplier || p.supplier === filterSupplier;

    let matchesStock = true;
    if (filterStockStatus === 'low') matchesStock = p.quantity > 0 && p.quantity <= p.minimumStock;
    if (filterStockStatus === 'out') matchesStock = p.quantity <= 0;
    if (filterStockStatus === 'in') matchesStock = p.quantity > p.minimumStock;

    return matchesSearch && matchesCat && matchesBrd && matchesSup && matchesStock;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" /> Product Inventory Catalog
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage store stock items, pricing, SKUs, and barcodes ({products.length} Total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filter and View Toggle Controls */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Product Name, SKU, or Barcode..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>

            <select
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>

            <select
              value={filterStockStatus}
              onChange={e => setFilterStockStatus(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
            >
              <option value="">All Stock Levels</option>
              <option value="in">Normal Stock</option>
              <option value="low">Low Stock Alert</option>
              <option value="out">Out of Stock</option>
            </select>

            <div className="flex items-center justify-end gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-xs' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-xs' : 'text-gray-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* PRODUCTS DISPLAY LIST */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase border-b border-gray-200 dark:border-gray-800">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-3">SKU / Barcode</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Cost Price</th>
                  <th className="py-3 px-3">Selling Price</th>
                  <th className="py-3 px-3">Stock Qty</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredProducts.map(prod => (
                  <tr key={prod._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.productImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&fit=crop'}
                          alt={prod.productName}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-xs">{prod.productName}</h4>
                          <span className="text-[10px] text-gray-400">Brand: {prod.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span className="block text-gray-800 dark:text-gray-200 font-semibold">{prod.sku}</span>
                      <span className="text-gray-400">{prod.barcode}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium text-[10px]">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-600 dark:text-gray-400">
                      {settings.currency}{prod.purchasePrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {settings.currency}{prod.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          prod.quantity <= 0
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : prod.quantity <= prod.minimumStock
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {prod.quantity} {prod.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold ${
                          prod.productStatus === 'Active' ? 'text-emerald-600' : 'text-gray-400'
                        }`}
                      >
                        {prod.productStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setBarcodeModalProduct(prod)}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-emerald-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Print Barcode Label"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="p-1.5 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteProduct(prod._id, prod.productName)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
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
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(prod => (
            <div key={prod._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <img
                  src={prod.productImage}
                  alt={prod.productName}
                  className="w-full h-36 rounded-xl object-cover mb-3"
                />
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{prod.productName}</h4>
                <p className="text-xs text-gray-500 mb-2">Category: {prod.category} | Brand: {prod.brand}</p>
                <div className="flex items-center justify-between text-xs font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded-lg mb-3">
                  <span>SKU: {prod.sku}</span>
                  <span>Bar: {prod.barcode}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Selling Price</span>
                  <span className="font-bold text-base text-emerald-600">{settings.currency}{prod.sellingPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setBarcodeModalProduct(prod)} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                  </button>
                  <button onClick={() => handleOpenEditModal(prod)} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product Details' : 'Add New Inventory Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.productName || ''}
                    onChange={e => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">SKU Code</label>
                    <button type="button" onClick={generateAutoSku} className="text-[10px] text-emerald-600 font-bold hover:underline">
                      Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.sku || ''}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Barcode (Code128)</label>
                    <button type="button" onClick={generateAutoBarcode} className="text-[10px] text-emerald-600 font-bold hover:underline">
                      Auto Barcode
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.barcode || ''}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={formData.category || ''}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  >
                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                  <select
                    value={formData.brand || ''}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  >
                    {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                  <select
                    value={formData.supplier || ''}
                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  >
                    {suppliers.map(s => <option key={s._id} value={s.supplierName}>{s.supplierName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Purchase Price ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice || 0}
                    onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Selling Price ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice || 0}
                    onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity || 0}
                    onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit || 'Pcs'}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">GST Tax %</label>
                  <input
                    type="number"
                    value={formData.gst || 0}
                    onChange={e => setFormData({ ...formData, gst: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Minimum Stock Alert Threshold</label>
                  <input
                    type="number"
                    value={formData.minimumStock || 5}
                    onChange={e => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Product Image URL</label>
                  <input
                    type="text"
                    value={formData.productImage || ''}
                    onChange={e => setFormData({ ...formData, productImage: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 border border-gray-300 dark:border-gray-700 text-xs rounded-xl text-gray-700 dark:text-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT BARCODE MODAL */}
      {barcodeModalProduct && (
        <BarcodeModal
          productName={barcodeModalProduct.productName}
          sku={barcodeModalProduct.sku}
          barcode={barcodeModalProduct.barcode}
          price={barcodeModalProduct.sellingPrice}
          currency={settings.currency}
          onClose={() => setBarcodeModalProduct(null)}
        />
      )}

    </div>
  );
};
