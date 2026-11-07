import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Receipt,
  Truck,
  CreditCard,
  Wine,
  Calendar,
  ArrowUpRight,
  PieChart as PieChartIcon,
  ShieldAlert,
  Mail,
  Send,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const DashboardView: React.FC = () => {
  const {
    sales,
    products,
    suppliers,
    purchaseOrders,
    expenses,
    hasPermission,
    currentUser,
    setActiveView,
    lowStockAlerts,
    sendLowStockEmailAlert,
    sendBatchLowStockEmailAlerts,
    settings,
  } = usePOS();

  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [batchEmailing, setBatchEmailing] = useState(false);

  // RBAC GUARD: Only Managers and Administrators may access the Admin Dashboard
  if (!hasPermission('access_admin_dashboard')) {
    return (
      <div className="p-6 lg:p-12 max-w-2xl mx-auto flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Admin Dashboard Access Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Your current account role (<strong>{currentUser.role.replace('_', ' ').toUpperCase()}</strong>) does not have privileges to view high-level financial turnover, margins, and store analytics.
          </p>
          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto text-left space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-100">Role Guidelines:</div>
            <div>• <strong>Cashier:</strong> Focus on POS sales processing and shifts.</div>
            <div>• <strong>Stock Controller:</strong> Focus on physical inventory and goods receiving.</div>
            <div>• <strong>Manager / Administrator:</strong> Full business oversight and pricing control.</div>
          </div>
        </div>

        <div className="flex gap-3">
          {currentUser.role === 'cashier' ? (
            <button
              onClick={() => setActiveView('pos')}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <span>Go to Point of Sale</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setActiveView('inventory')}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <span>Go to Inventory &amp; Stock</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | 'month' | 'custom'>('7days');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Determine active date boundaries
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (dateFilter === 'today') {
      const start = new Date(todayStr);
      const end = new Date(todayStr);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    if (dateFilter === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      const start = new Date(yStr);
      const end = new Date(yStr);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    if (dateFilter === '7days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start, endDate: now };
    }
    if (dateFilter === '30days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { startDate: start, endDate: now };
    }
    if (dateFilter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: now };
    }
    // Custom
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }, [dateFilter, customStart, customEnd]);

  // Filtered sales within range
  const rangeSales = useMemo(() => {
    return sales.filter((s) => {
      const sDate = new Date(s.date);
      return sDate >= startDate && sDate <= endDate && s.status !== 'refunded';
    });
  }, [sales, startDate, endDate]);

  // Today and Yesterday benchmark figures
  const { todayTotal, yesterdayTotal } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yStr = y.toISOString().slice(0, 10);

    let tToday = 0;
    let tYesterday = 0;

    sales.forEach((s) => {
      if (s.status === 'refunded') return;
      const sDate = s.date.slice(0, 10);
      if (sDate === todayStr) tToday += s.totalAmount;
      if (sDate === yStr) tYesterday += s.totalAmount;
    });

    return { todayTotal: tToday, yesterdayTotal: tYesterday };
  }, [sales]);

  // Financial calculations
  const totalRevenue = rangeSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTransactionsCount = rangeSales.length;

  // Cost of goods sold (COGS) & Gross Profit
  let totalCOGS = 0;
  rangeSales.forEach((s) => {
    s.items.forEach((item) => {
      totalCOGS += item.costPrice * item.quantity;
    });
  });
  const grossProfit = totalRevenue - totalCOGS;
  const grossMarginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Total inventory valuation (Cost and Retail)
  const inventoryCostValuation = products.reduce((sum, p) => sum + p.stockQuantity * p.purchaseCost, 0);
  const inventoryRetailValuation = products.reduce((sum, p) => sum + p.stockQuantity * p.sellingPrice, 0);

  // Stock status
  const outOfStockProducts = products.filter((p) => p.status !== 'archived' && p.stockQuantity <= 0);
  const lowStockProducts = products.filter(
    (p) => p.status !== 'archived' && p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel
  );

  // Outstanding supplier balances
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + s.balancePayable, 0);

  // Sales by Payment Method
  const paymentMethodBreakdown = useMemo(() => {
    const breakdown = { cash: 0, mpesa: 0, card: 0, bank_transfer: 0 };
    rangeSales.forEach((s) => {
      s.payments.forEach((p) => {
        if (p.method in breakdown) {
          breakdown[p.method] += p.amount;
        }
      });
    });
    return breakdown;
  }, [rangeSales]);

  // Best selling products (volume and revenue)
  const bestSellers = useMemo(() => {
    const map: Record<string, { name: string; sku: string; unitsSold: number; revenue: number }> = {};
    rangeSales.forEach((s) => {
      s.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            sku: item.sku,
            unitsSold: 0,
            revenue: 0,
          };
        }
        map[item.productId].unitsSold += item.quantity * item.unitFactor;
        map[item.productId].revenue += item.lineTotal;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [rangeSales]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Executive Admin Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time sales, inventory valuation, and operating margins for Osutua Wines &amp; Spirits.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                dateFilter === tab.id
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Inputs if 'custom' is active */}
      {dateFilter === 'custom' && (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">From:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
          />
          <span className="font-semibold text-slate-700 dark:text-slate-300">To:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
          />
        </div>
      )}

      {/* KEY METRICS KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue in Selected Period */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-950 dark:text-amber-400 font-mono-numbers">
            KES {totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <span>{totalTransactionsCount} transactions</span>
            <span className="text-emerald-600 font-medium">Avg KES {totalTransactionsCount > 0 ? Math.round(totalRevenue / totalTransactionsCount).toLocaleString() : 0}</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
            KES {grossProfit.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <span>Margin: {grossMarginPct}%</span>
            <span>COGS: KES {totalCOGS.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Inventory Valuation */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Value</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono-numbers">
            KES {inventoryCostValuation.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <span>Retail: KES {inventoryRetailValuation.toLocaleString()}</span>
            <span>{products.reduce((s, p) => s + p.stockQuantity, 0)} btls</span>
          </div>
        </div>

        {/* Supplier Balances Payable */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Supplier Balances</span>
            <Truck className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 font-mono-numbers">
            KES {totalSupplierPayables.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <span>{suppliers.filter((s) => s.balancePayable > 0).length} suppliers pending</span>
            <span className="text-amber-600 font-medium">Payables</span>
          </div>
        </div>
      </div>

      {/* TODAY VS YESTERDAY STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider block">
              Total Sales Today
            </span>
            <span className="text-xl font-bold font-mono-numbers text-slate-950 dark:text-white">
              KES {todayTotal.toLocaleString()}
            </span>
          </div>
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Real-time till updates
          </span>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Yesterday&apos;s Total Sales
            </span>
            <span className="text-xl font-bold font-mono-numbers text-slate-950 dark:text-white">
              KES {yesterdayTotal.toLocaleString()}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Full shift closed
          </span>
        </div>
      </div>

      {/* TWO COLUMN SECTION: Payment Split & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Payment Method */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-amber-600" />
              <span>Sales by Payment Method</span>
            </h3>
            <span className="text-xs text-slate-500">Selected period</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'M-Pesa Mobile Money', amount: paymentMethodBreakdown.mpesa, color: 'bg-emerald-500' },
              { label: 'Cash Tendered', amount: paymentMethodBreakdown.cash, color: 'bg-amber-500' },
              { label: 'Bank Debit/Credit Card', amount: paymentMethodBreakdown.card, color: 'bg-blue-500' },
              { label: 'Bank Transfer / EFT', amount: paymentMethodBreakdown.bank_transfer, color: 'bg-purple-500' },
            ].map((p, i) => {
              const pct = totalRevenue > 0 ? ((p.amount / totalRevenue) * 100).toFixed(1) : '0';
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                      <span>{p.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{pct}%</span>
                      <span className="font-bold font-mono-numbers">KES {p.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${p.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best-Selling Products */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wine className="w-4 h-4 text-amber-600" />
              <span>Top-Selling Products by Revenue</span>
            </h3>
            <span className="text-xs text-slate-500">Fast movers</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {bestSellers.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.sku} · {item.unitsSold} units sold
                    </div>
                  </div>
                </div>
                <div className="font-bold text-slate-950 dark:text-amber-400 font-mono-numbers whitespace-nowrap pl-2">
                  KES {item.revenue.toLocaleString()}
                </div>
              </div>
            ))}

            {bestSellers.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No recorded sales in selected date period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REAL-TIME INVENTORY TRACKING & STOCK REORDER ALERTS */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Real-Time Inventory Alerts &amp; Reorder Dispatch</span>
                <span className="text-[10px] font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                  {lowStockAlerts.length} Attention Needed
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated alerts for stock levels at or below safety thresholds. Dispatch notices directly to management &amp; procurement.
              </p>
            </div>
          </div>

          {lowStockAlerts.length > 0 && (
            <button
              onClick={async () => {
                setBatchEmailing(true);
                await sendBatchLowStockEmailAlerts();
                setBatchEmailing(false);
              }}
              disabled={batchEmailing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{batchEmailing ? 'Dispatching...' : `Email Reorder Alerts (${settings.alertEmailRecipient || 'shariadoo190@gmail.com'})`}</span>
            </button>
          )}
        </div>

        {lowStockAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Inventory Safety Levels Healthy
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              All catalogue items are currently stocked comfortably above minimum thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Product Name &amp; SKU</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Current Stock</th>
                  <th className="py-2.5 px-3">Safety Min</th>
                  <th className="py-2.5 px-3">Suggested Reorder</th>
                  <th className="py-2.5 px-3">Unit Cost</th>
                  <th className="py-2.5 px-3">Est. Investment</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowStockAlerts.map((alert) => {
                  const isOut = alert.severity === 'out_of_stock';
                  const isCrit = alert.severity === 'critical';
                  const totalInvest = alert.suggestedReorder * alert.unitCost;

                  return (
                    <tr
                      key={alert.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${
                        isOut ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        <div>{alert.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{alert.sku}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isOut
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              : isCrit
                              ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isCrit ? 'Critical' : 'Low Stock'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span className={isOut ? 'text-red-600' : 'text-amber-600'}>
                          {alert.currentStock} units
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {alert.minStockLevel} units
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        +{alert.suggestedReorder} units
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        KES {alert.unitCost.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        KES {totalInvest.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {alert.supplierName}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={async () => {
                            setEmailingId(alert.id);
                            await sendLowStockEmailAlert(alert.id);
                            setEmailingId(null);
                          }}
                          disabled={emailingId === alert.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-semibold transition"
                          title={`Send reorder notice to ${settings.alertEmailRecipient || 'shariadoo190@gmail.com'}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{emailingId === alert.id ? 'Sending...' : 'Email Alert'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
