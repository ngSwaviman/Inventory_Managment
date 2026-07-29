import React, { useState, useEffect } from 'react';
import { Search, X, Package, Users, Truck, Receipt, ArrowRight } from 'lucide-react';
import { Product, Customer, Supplier, Sale } from '../../types';

interface GlobalSearchModalProps {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  currency?: string;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  products,
  customers,
  suppliers,
  sales,
  currency = '$',
  onClose,
  onSelectProduct
}) => {
  const [query, setQuery] = useState('');

  const filteredProducts = query.trim()
    ? products.filter(
        p =>
          p.productName.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase()) ||
          p.barcode.includes(query) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredCustomers = query.trim()
    ? customers.filter(
        c =>
          c.customerName.toLowerCase().includes(query.toLowerCase()) ||
          c.mobile.includes(query) ||
          c.email.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredSuppliers = query.trim()
    ? suppliers.filter(
        s =>
          s.supplierName.toLowerCase().includes(query.toLowerCase()) ||
          s.companyName.toLowerCase().includes(query.toLowerCase()) ||
          s.mobile.includes(query)
      )
    : [];

  const filteredSales = query.trim()
    ? sales.filter(
        s =>
          s.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
          s.customerName.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search by product name, barcode, SKU, customer, supplier, or invoice..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-base text-gray-900 dark:text-white placeholder-gray-400 font-medium"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors ml-2 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {!query.trim() && (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Type to search across entire store system</p>
              <p className="text-xs text-gray-400 mt-1">Try searching "Headphones", "890123", "Alice", or "INV-2026"</p>
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                <Package className="w-3.5 h-3.5" /> Products ({filteredProducts.length})
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
                {filteredProducts.map(product => (
                  <div
                    key={product._id}
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct(product);
                      onClose();
                    }}
                    className="p-3 flex items-center justify-between hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {product.productImage ? (
                        <img src={product.productImage} alt={product.productName} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{product.productName}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>SKU: {product.sku}</span>
                          <span>•</span>
                          <span>Bar: {product.barcode}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">{product.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{currency}{product.sellingPrice.toFixed(2)}</span>
                      <p className="text-xs text-gray-500">Qty: {product.quantity} {product.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                <Users className="w-3.5 h-3.5" /> Customers ({filteredCustomers.length})
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
                {filteredCustomers.map(cust => (
                  <div key={cust._id} className="p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{cust.customerName}</h4>
                      <p className="text-xs text-gray-500">{cust.mobile} | {cust.email}</p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                      {cust.loyaltyPoints} Loyalty Pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {filteredSuppliers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                <Truck className="w-3.5 h-3.5" /> Suppliers ({filteredSuppliers.length})
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
                {filteredSuppliers.map(sup => (
                  <div key={sup._id} className="p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{sup.supplierName} ({sup.companyName})</h4>
                      <p className="text-xs text-gray-500">{sup.mobile} | GSTIN: {sup.gstNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales Invoices */}
          {filteredSales.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                <Receipt className="w-3.5 h-3.5" /> Sales Invoices ({filteredSales.length})
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
                {filteredSales.map(sale => (
                  <div key={sale._id} className="p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{sale.invoiceNumber}</h4>
                      <p className="text-xs text-gray-500">{sale.customerName} • {new Date(sale.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {currency}{sale.grandTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim() &&
            filteredProducts.length === 0 &&
            filteredCustomers.length === 0 &&
            filteredSuppliers.length === 0 &&
            filteredSales.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm font-medium">No results found matching "{query}"</p>
              </div>
            )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400 flex items-center justify-between px-4">
          <span>Press ESC to exit</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Smart Store Global Index</span>
        </div>
      </div>
    </div>
  );
};
