import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  DollarSign,
  QrCode,
  Receipt,
  Sparkles,
  UserPlus,
  CheckCircle2
} from 'lucide-react';
import { Product, Customer, POSCartItem, Sale, StoreSettings } from '../types';
import { fetchApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { InvoiceModal } from '../components/common/InvoiceModal';

interface POSBillingProps {
  settings: StoreSettings;
}

export const POSBilling: React.FC<POSBillingProps> = ({ settings }) => {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Split'>('Cash');
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Quick Add Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');

  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodsData, custsData] = await Promise.all([
        fetchApi<Product[]>('/products'),
        fetchApi<Customer[]>('/customers')
      ]);
      setProducts(prodsData);
      setCustomers(custsData);
      const walkIn = custsData.find(c => c.customerName.toLowerCase().includes('walk-in')) || custsData[0];
      if (walkIn) setSelectedCustomer(walkIn);
    } catch (err) {
      console.error('Failed loading POS data:', err);
    }
  };

  // Barcode Scanner Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedProduct = products.find(
      p => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matchedProduct) {
      addToCart(matchedProduct);
      showToast(`Added ${matchedProduct.productName} to cart`, 'success');
      setBarcodeInput('');
    } else {
      showToast(`No product found with barcode/SKU: ${barcodeInput}`, 'error');
    }
  };

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      showToast(`${product.productName} is OUT OF STOCK!`, 'error');
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          showToast(`Maximum stock limit reached for ${product.productName}`, 'warning');
          return prevCart;
        }
        return prevCart.map(item =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prevCart =>
      prevCart
        .map(item => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.quantity) {
              showToast(`Only ${item.product.quantity} units available`, 'warning');
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product._id !== productId));
  };

  // Financial Calculations
  const calculateCartTotals = () => {
    let subTotal = 0;
    let gstAmount = 0;
    let discountAmount = 0;

    cart.forEach(item => {
      const price = item.customPrice ?? item.product.sellingPrice;
      const qty = item.quantity;
      const rawPrice = price * qty;
      const prodDisc = (rawPrice * (item.product.discount || 0)) / 100;
      const netBase = rawPrice - prodDisc;
      const prodGst = (netBase * (item.product.gst || 0)) / 100;

      subTotal += rawPrice;
      discountAmount += prodDisc;
      gstAmount += prodGst;
    });

    const flatDisc = (subTotal * customDiscount) / 100;
    discountAmount += flatDisc;

    const grandTotal = Math.max(0, subTotal - discountAmount + gstAmount);

    return { subTotal, gstAmount, discountAmount, grandTotal };
  };

  const { subTotal, gstAmount, discountAmount, grandTotal } = calculateCartTotals();

  // Complete Sale Order API call
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty!', 'warning');
      return;
    }

    try {
      const itemsPayload = cart.map(item => {
        const price = item.customPrice ?? item.product.sellingPrice;
        const raw = price * item.quantity;
        const disc = (raw * item.product.discount) / 100;
        const net = raw - disc;
        const gst = (net * item.product.gst) / 100;
        return {
          productId: item.product._id,
          productName: item.product.productName,
          quantity: item.quantity,
          sellingPrice: price,
          gst: item.product.gst,
          discount: item.product.discount,
          total: Number((net + gst).toFixed(2))
        };
      });

      const saleData = await fetchApi<Sale>('/sales', {
        method: 'POST',
        body: JSON.stringify({
          customerName: selectedCustomer?.customerName || 'Walk-In Customer',
          customerMobile: selectedCustomer?.mobile || 'N/A',
          items: itemsPayload,
          subTotal,
          gstAmount,
          discountAmount,
          grandTotal,
          paymentMode,
          paymentStatus: 'Completed'
        })
      });

      showToast(`Sale Invoice ${saleData.invoiceNumber} created!`, 'success');
      setCompletedSale(saleData);
      setCart([]);
      setShowPaymentModal(false);
      loadData(); // Refresh product quantities
    } catch (err: any) {
      showToast(err.message || 'Checkout failed', 'error');
    }
  };

  // Quick Add New Customer
  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      const newCust = await fetchApi<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          customerName: newCustName,
          mobile: newCustMobile || 'N/A'
        })
      });
      setCustomers(prev => [newCust, ...prev]);
      setSelectedCustomer(newCust);
      setShowAddCustomerModal(false);
      setNewCustName('');
      setNewCustMobile('');
      showToast(`Added customer ${newCust.customerName}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add customer', 'error');
    }
  };

  // Filtered Products
  const categoriesList = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden pb-4">
      
      {/* LEFT: PRODUCTS CATALOG & BARCODE SCANNER (60%) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3 bg-gray-50/50 dark:bg-gray-800/40">
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search products by Name, Barcode, or SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2 sm:w-72">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                <input
                  ref={barcodeRef}
                  type="text"
                  placeholder="Scan Barcode / SKU..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-emerald-600/60 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shrink-0"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Products Grid Container */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map(product => {
            const isOutOfStock = product.quantity <= 0;
            return (
              <div
                key={product._id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isOutOfStock
                    ? 'opacity-50 bg-gray-100 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/80 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div>
                  <div className="relative aspect-square w-full mb-2 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {product.productImage ? (
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                        No Image
                      </div>
                    )}
                    {product.discount > 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-rose-500 text-white font-black text-[10px] rounded-md shadow-xs">
                        -{product.discount}%
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">
                    {product.productName}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono">Bar: {product.barcode}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    {settings.currency}{product.sellingPrice.toFixed(2)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-700'
                        : product.quantity <= product.minimumStock
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {isOutOfStock ? 'Out Stock' : `${product.quantity} ${product.unit}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* RIGHT: POS CART & CHECKOUT PANEL (40%) */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl flex flex-col shrink-0 overflow-hidden">
        
        {/* Cart Header & Customer Picker */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-500" />
              Active Billing Cart
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>

          {/* Customer Selection Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <select
                value={selectedCustomer?._id || ''}
                onChange={e => {
                  const cust = customers.find(c => c._id === e.target.value);
                  if (cust) setSelectedCustomer(cust);
                }}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white font-medium focus:outline-none"
              >
                {customers.map(cust => (
                  <option key={cust._id} value={cust._id}>
                    {cust.customerName} ({cust.mobile})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="p-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 transition-colors"
              title="Add New Customer"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cart Items Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-gray-100 dark:divide-gray-800">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6">
              <Receipt className="w-12 h-12 opacity-30 mb-2" />
              <p className="text-sm font-semibold">Cart is empty</p>
              <p className="text-xs text-gray-400">Click products or scan barcode to add billing items</p>
            </div>
          ) : (
            cart.map(item => {
              const price = item.customPrice ?? item.product.sellingPrice;
              const lineTotal = price * item.quantity;
              return (
                <div key={item.product._id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                      {item.product.productName}
                    </h5>
                    <p className="text-[11px] text-gray-500">
                      {settings.currency}{price.toFixed(2)} x {item.quantity}
                      {item.product.gst > 0 && <span className="ml-1 text-[10px] text-emerald-600 font-medium">({item.product.gst}% GST)</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                      onClick={() => updateCartQty(item.product._id, -1)}
                      className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-xs px-2 min-w-5 text-center text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.product._id, 1)}
                      className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block font-bold text-xs text-gray-900 dark:text-white">
                      {settings.currency}{lineTotal.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product._id)}
                      className="text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Totals & Checkout Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 space-y-2">
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{settings.currency}{subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>GST Tax:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{settings.currency}{gstAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-emerald-600 font-medium">
            <span>Discount:</span>
            <span>-{settings.currency}{discountAmount.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="font-extrabold text-sm text-gray-900 dark:text-white">Payable Amount:</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {settings.currency}{grandTotal.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-4 h-4" />
            Proceed to Payment ({settings.currency}{grandTotal.toFixed(2)})
          </button>
        </div>

      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Select Payment Mode</h3>
            <p className="text-xs text-gray-500 mb-4">Invoice Amount: <strong className="text-emerald-600">{settings.currency}{grandTotal.toFixed(2)}</strong></p>

            {/* Payment Mode Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { mode: 'Cash', icon: DollarSign, label: 'Cash Payment' },
                { mode: 'UPI', icon: QrCode, label: 'UPI / QR Code' },
                { mode: 'Card', icon: CreditCard, label: 'Credit/Debit Card' },
                { mode: 'Split', icon: Sparkles, label: 'Split Payment' }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setPaymentMode(item.mode as any)}
                    className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      paymentMode === item.mode
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {paymentMode === 'Cash' && (
              <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Cash Received</label>
                <input
                  type="number"
                  placeholder="Enter cash given by customer..."
                  value={cashTendered}
                  onChange={e => setCashTendered(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 dark:text-white"
                />
                {Number(cashTendered) > grandTotal && (
                  <p className="text-xs font-bold text-emerald-600">
                    Return Change: {settings.currency}{(Number(cashTendered) - grandTotal).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCheckout}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20"
              >
                Complete Order & Print Bill
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Add Customer</h3>
            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Customer name"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="+1 555 123 4567"
                  value={newCustMobile}
                  onChange={e => setNewCustMobile(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">
                  Save Customer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="py-2 px-3 border border-gray-300 dark:border-gray-700 text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETED INVOICE MODAL POPUP */}
      {completedSale && (
        <InvoiceModal
          sale={completedSale}
          settings={settings}
          onClose={() => setCompletedSale(null)}
        />
      )}

    </div>
  );
};
