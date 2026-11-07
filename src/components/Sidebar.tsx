import React from 'react';
import {
  ShoppingCart,
  LayoutDashboard,
  Wine,
  Package,
  Layers,
  Truck,
  PackageCheck,
  CreditCard,
  Receipt,
  FileText,
  DollarSign,
  RotateCcw,
  Clock,
  BarChart3,
  ClipboardList,
  Wifi,
  Users,
  Settings,
  X,
  Archive,
  Download,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeView, setActiveView, hasPermission, heldOrders, offlineQueue, currentShift } = usePOS();

  const handleNav = (viewId: string) => {
    setActiveView(viewId);
    onClose();
  };

  const navGroups = [
    {
      title: 'Counter & Checkout',
      items: [
        {
          id: 'pos',
          label: 'Point of Sale',
          icon: ShoppingCart,
          permission: 'pos',
          badge: heldOrders.length > 0 ? `${heldOrders.length} Held` : undefined,
        },
        {
          id: 'shifts',
          label: 'Cashier Shifts',
          icon: Clock,
          permission: 'shifts',
          badge: currentShift ? 'Active' : undefined,
        },
        {
          id: 'sales',
          label: 'Sales Transactions',
          icon: Receipt,
          permission: 'sales',
        },
      ],
    },
    {
      title: 'Business Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Admin Dashboard',
          icon: LayoutDashboard,
          permission: 'dashboard',
        },
        {
          id: 'reports',
          label: 'Reports & Analytics',
          icon: BarChart3,
          permission: 'reports',
        },
        {
          id: 'expenses',
          label: 'Expense Tracker',
          icon: DollarSign,
          permission: 'expenses',
        },
        {
          id: 'refunds',
          label: 'Returns & Refunds',
          icon: RotateCcw,
          permission: 'refunds',
        },
      ],
    },
    {
      title: 'Stock & Catalogue',
      items: [
        {
          id: 'products',
          label: 'Products Catalogue',
          icon: Wine,
          permission: 'products',
        },
        {
          id: 'categories',
          label: 'Categories & Brands',
          icon: Layers,
          permission: 'products',
        },
        {
          id: 'inventory',
          label: 'Inventory & Stock',
          icon: Package,
          permission: 'inventory',
        },
      ],
    },
    {
      title: 'Suppliers & Purchases',
      items: [
        {
          id: 'purchases',
          label: 'Purchase Orders',
          icon: FileText,
          permission: 'purchases',
        },
        {
          id: 'receiving',
          label: 'Goods Receiving',
          icon: PackageCheck,
          permission: 'receiving',
        },
        {
          id: 'suppliers',
          label: 'Suppliers & Balances',
          icon: Truck,
          permission: 'suppliers',
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          id: 'audit_logs',
          label: 'Audit Trail Logs',
          icon: ClipboardList,
          permission: 'audit_logs',
        },
        {
          id: 'sync',
          label: 'Offline & LAN Sync',
          icon: Wifi,
          permission: 'sync',
          badge: offlineQueue.length > 0 ? `${offlineQueue.length}` : undefined,
        },
        {
          id: 'users',
          label: 'Staff & Roles',
          icon: Users,
          permission: 'users',
        },
        {
          id: 'settings',
          label: 'System Settings',
          icon: Settings,
          permission: 'settings',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-40 h-full lg:h-[calc(100vh-61px)] w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Navigation Menu
          </span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter((item) => hasPermission(item.permission));
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {group.title}
                </h4>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-amber-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Download Project ZIP Archive Box */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-amber-500/5">
          <a
            href="/api/download-zip"
            download="osutua-pos-system.zip"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download Project ZIP</span>
          </a>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1">
            50 files · Full React + Express stack
          </p>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="truncate">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Osutua v1.0</span>
            <span className="mx-1">·</span>
            <span>KES</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px]">Local LAN</span>
          </div>
        </div>
      </aside>
    </>
  );
};
