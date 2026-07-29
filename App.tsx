import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';

import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { POSBilling } from './pages/POSBilling';
import { Products } from './pages/Products';
import { CategoriesBrands } from './pages/CategoriesBrands';
import { SuppliersCustomers } from './pages/SuppliersCustomers';
import { Purchases } from './pages/Purchases';
import { StockManagement } from './pages/StockManagement';
import { BarcodeGenerator } from './pages/BarcodeGenerator';
import { Reports } from './pages/Reports';
import { NotificationsPage } from './pages/NotificationsPage';
import { Settings } from './pages/Settings';

import { StoreSettings, AppNotification } from './types';
import { fetchApi } from './services/api';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [notifications] = useState<AppNotification[]>([
    {
      _id: '1',
      title: 'Low Stock Alert',
      message: 'Nike Air Max 270 is below minimum stock threshold.',
      type: 'warning',
      read: false,
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      title: 'New Purchase Order',
      message: 'Batch #B2948 from Tech Supplier Ltd delivered.',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    }
  ]);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: 'SmartStore',
    gstNumber: '27AABCU9603R1ZM',
    address: 'Commercial Avenue, Station Road, Tech Hub, Suite 402',
    mobile: '+91 98765 43210',
    email: 'contact@smartstore.com',
    storeLogo: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200&fit=crop',
    currency: '₹',
    invoicePrefix: 'INV-'
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchApi<StoreSettings>('/settings')
        .then(setStoreSettings)
        .catch(err => console.error('Failed fetching store settings:', err));
    }
  }, [isAuthenticated]);

  // Keyboard shortcut Ctrl+K / Cmd+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onOpenSearch={() => setShowGlobalSearch(true)}
        onOpenPOS={() => setCurrentTab('pos')}
        notifications={notifications}
        settings={storeSettings}
        activeView={currentTab}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          activeTab={currentTab}
          setActiveTab={setCurrentTab}
          settings={storeSettings}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 lg:ml-60">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentTab === 'dashboard' && (
              <Dashboard
                settings={storeSettings}
                onOpenPOS={() => setCurrentTab('pos')}
                onNavigateTab={setCurrentTab}
              />
            )}
            {currentTab === 'pos' && <POSBilling settings={storeSettings} />}
            {currentTab === 'products' && <Products settings={storeSettings} />}
            {currentTab === 'categories' && <CategoriesBrands />}
            {currentTab === 'suppliers' && <SuppliersCustomers settings={storeSettings} />}
            {currentTab === 'purchases' && <Purchases settings={storeSettings} />}
            {currentTab === 'stock' && <StockManagement settings={storeSettings} />}
            {currentTab === 'barcode' && <BarcodeGenerator settings={storeSettings} />}
            {currentTab === 'reports' && <Reports settings={storeSettings} />}
            {currentTab === 'notifications' && <NotificationsPage />}
            {currentTab === 'settings' && (
              <Settings
                settings={storeSettings}
                onUpdateSettings={setStoreSettings}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      {showGlobalSearch && (
        <GlobalSearchModal
          onClose={() => setShowGlobalSearch(false)}
          setCurrentTab={setCurrentTab}
          settings={storeSettings}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
