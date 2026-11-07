import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { POSView } from './views/POSView';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { InventoryView } from './views/InventoryView';
import { PurchasesView } from './views/PurchasesView';
import { GoodsReceivingView } from './views/GoodsReceivingView';
import { SuppliersView } from './views/SuppliersView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { ExpensesView } from './views/ExpensesView';
import { RefundsView } from './views/RefundsView';
import { ShiftsView } from './views/ShiftsView';
import { ReportsView } from './views/ReportsView';
import { AuditLogsView } from './views/AuditLogsView';
import { UsersView } from './views/UsersView';
import { SettingsView } from './views/SettingsView';
import { SyncCenterView } from './views/SyncCenterView';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { ToastContainer } from './components/ToastContainer';

const MainLayout: React.FC = () => {
  const { activeView } = usePOS();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'pos':
        return <POSView />;
      case 'dashboard':
        return <DashboardView />;
      case 'products':
        return <ProductsView />;
      case 'categories':
        return <CategoriesView />;
      case 'inventory':
        return <InventoryView />;
      case 'purchases':
        return <PurchasesView />;
      case 'receiving':
        return <GoodsReceivingView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'sales':
        return <SalesHistoryView />;
      case 'expenses':
        return <ExpensesView />;
      case 'refunds':
        return <RefundsView />;
      case 'shifts':
        return <ShiftsView />;
      case 'reports':
        return <ReportsView />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      case 'sync':
        return <SyncCenterView />;
      default:
        return <POSView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Bar Contract Compliant Header */}
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Real-time Network & Queue Synchronization Banner */}
      <OfflineSyncBanner />

      {/* Main Responsive Body with Fixed/Sticky Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* AI Assistant Drawer & System Toast Notifications */}
      <AIAssistantDrawer />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <MainLayout />
    </POSProvider>
  );
}
