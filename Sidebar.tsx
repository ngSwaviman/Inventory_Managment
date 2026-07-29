import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Truck,
  ShoppingBag,
  ArrowRightLeft,
  QrCode,
  FileBarChart2,
  Bell,
  Settings,
  X,
  Store,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StoreSettings } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: StoreSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onCloseMobile,
  activeTab,
  setActiveTab,
  settings
}) => {
  const { user, isAdmin } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'pos', label: 'POS Billing System', icon: ShoppingCart, adminOnly: false },
    { id: 'products', label: 'Product Inventory', icon: Package, adminOnly: false },
    { id: 'categories', label: 'Categories & Brands', icon: Layers, adminOnly: false },
    { id: 'suppliers', label: 'Suppliers & Customers', icon: Truck, adminOnly: false },
    { id: 'purchases', label: 'Purchase Invoices', icon: ShoppingBag, adminOnly: false },
    { id: 'stock', label: 'Stock Movements', icon: ArrowRightLeft, adminOnly: false },
    { id: 'barcode', label: 'Barcode Generator', icon: QrCode, adminOnly: false },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart2, adminOnly: false },
    { id: 'notifications', label: 'Alerts & History', icon: Bell, adminOnly: false },
    { id: 'settings', label: 'System Settings', icon: Settings, adminOnly: true }
  ];

  const filteredItems = navigationItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container - Clean Minimalism Theme */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-60 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col border-r border-slate-200 dark:border-slate-800 shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            {settings.storeLogo ? (
              <img src={settings.storeLogo} alt="Logo" className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
            ) : (
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs">
                {settings.storeName?.charAt(0) || 'S'}
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white truncate max-w-[130px]">
                {settings.storeName}
              </h1>
              <span className="text-[10px] text-slate-400 font-medium">SmartStore Pro</span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Link List */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer Card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl">
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.role} Role</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};

