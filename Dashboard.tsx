import React, { useEffect, useState } from 'react';
import {
  Package,
  Layers,
  Boxes,
  AlertTriangle,
  XCircle,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Users,
  Truck,
  ArrowUpRight,
  ShoppingCart,
  BellRing
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DashboardStats, Product, Sale, Purchase, StoreSettings } from '../types';
import { fetchApi } from '../services/api';

interface DashboardProps {
  settings: StoreSettings;
  onOpenPOS: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ settings, onOpenPOS, onNavigateTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, prodsData, salesData, purData] = await Promise.all([
          fetchApi<DashboardStats>('/dashboard/stats'),
          fetchApi<Product[]>('/products'),
          fetchApi<Sale[]>('/sales'),
          fetchApi<Purchase[]>('/purchases')
        ]);
        setStats(statsData);
        setProducts(prodsData);
        setSales(salesData);
        setPurchases(purData);
      } catch (err) {
        console.error('Failed loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading SmartStore Analytics...
      </div>
    );
  }

  // Weekly sales chart data
  const chartData = [
    { day: 'Mon', sales: 180, revenue: 3200 },
    { day: 'Tue', sales: 240, revenue: 4500 },
    { day: 'Wed', sales: 310, revenue: 6000 },
    { day: 'Thu', sales: 290, revenue: 5200 },
    { day: 'Fri', sales: 420, revenue: 8900 },
    { day: 'Sat', sales: 550, revenue: 11200 },
    { day: 'Sun', sales: 480, revenue: 9800 }
  ];

  const lowStockList = products.filter(p => p.quantity <= p.minimumStock);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Cards Grid - Clean Minimalism Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Revenue</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{settings.currency}{stats.totalRevenue.toFixed(2)}</h3>
          <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-2 font-medium">↑ 12.5% from last month</p>
        </div>

        {/* Card 2: Stock Quantity */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Stock Quantity</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalStockQty.toLocaleString()} Units</h3>
          <p className="text-slate-400 text-xs mt-2">Across {stats.totalCategories} categories</p>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Low Stock Alerts</p>
          <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.lowStockProducts} Items</h3>
          <p className="text-rose-500 text-xs mt-2 font-medium">Requires restock reorder</p>
        </div>

        {/* Card 4: Active Performance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Today's Sales</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{settings.currency}{stats.todaySales.toFixed(2)}</h3>
          <p className="text-indigo-600 dark:text-indigo-400 text-xs mt-2 font-medium">Today's performance</p>
        </div>

      </div>

      {/* Main Visuals & Critical Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue & Growth Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-base">Revenue & Sales Growth</h4>
              <p className="text-xs text-slate-400 mt-0.5">Weekly performance breakdown</p>
            </div>
            <select className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              <option>Last 30 Days</option>
              <option>This Week</option>
            </select>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Alerts Card (1 Col) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center justify-between">
              <span>Critical Alerts</span>
              <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-semibold">{lowStockList.length} Active</span>
            </h4>
            
            <div className="space-y-3">
              {/* Out of stock alert */}
              <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <span className="text-rose-600 text-sm">⚠️</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300">Out of Stock</span>
                  <span className="text-[11px] text-rose-700 dark:text-rose-400">
                    {lowStockList[0]?.productName || 'Nike Air Max 270 (Size 10)'}
                  </span>
                </div>
              </div>

              {/* Expiring soon / reorder alert */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <span className="text-amber-600 text-sm">⌛</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Low Stock Reorder</span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400">
                    {lowStockList[1]?.productName || 'Batch #B2948 - Organic Supplies'}
                  </span>
                </div>
              </div>

              {/* New purchase alert */}
              <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-indigo-600 text-sm">📦</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">New Purchase Received</span>
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-400">
                    {purchases[0]?.supplier || 'Tech Supplier Ltd'} • Invoice #{purchases[0]?.invoiceNumber || 'INV-4928'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('stock')}
            className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold mt-4 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            View All Alerts
          </button>
        </div>

      </div>

      {/* Recent Sales Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h4 className="font-bold text-slate-800 dark:text-white">Recent Transactions</h4>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Export PDF Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-3">Invoice</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
              {sales.slice(0, 5).map(sale => (
                <tr key={sale._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                    #{sale.invoiceNumber}
                  </td>
                  <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300 font-medium">{sale.customerName}</td>
                  <td className="px-6 py-3.5 text-slate-500 text-xs">{sale.paymentMode}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                    {settings.currency}{sale.grandTotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                      PAID
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

