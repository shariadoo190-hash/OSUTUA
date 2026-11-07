import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const ReportsView: React.FC = () => {
  const { sales, products, categories, expenses, suppliers, shifts } = usePOS();

  const [reportTab, setReportTab] = useState<'financial' | 'cashier' | 'products' | 'inventory'>('financial');
  const [period, setPeriod] = useState<'all' | 'month' | '7days'>('all');

  // Filter sales by selected period
  const filteredSales = useMemo(() => {
    if (period === 'all') return sales.filter((s) => s.status !== 'refunded');
    const now = new Date();
    const days = period === '7days' ? 7 : 30;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    return sales.filter((s) => new Date(s.date) >= cutoff && s.status !== 'refunded');
  }, [sales, period]);

  // Financial P&L
  const totalRevenue = filteredSales.reduce((s, item) => s + item.totalAmount, 0);
  let totalCOGS = 0;
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      totalCOGS += item.costPrice * item.quantity;
    });
  });
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const netMarginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Sales by Cashier breakdown
  const cashierBreakdown = useMemo(() => {
    const map: Record<string, { cashierName: string; transactions: number; totalSales: number }> = {};
    filteredSales.forEach((s) => {
      if (!map[s.cashierId]) {
        map[s.cashierId] = { cashierName: s.cashierName, transactions: 0, totalSales: 0 };
      }
      map[s.cashierId].transactions += 1;
      map[s.cashierId].totalSales += s.totalAmount;
    });
    return Object.values(map);
  }, [filteredSales]);

  // Product velocity breakdown (Fast, Slow, Dead stock)
  const productVelocity = useMemo(() => {
    const salesVolumeMap: Record<string, number> = {};
    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        salesVolumeMap[item.productId] = (salesVolumeMap[item.productId] || 0) + item.quantity * item.unitFactor;
      });
    });

    return products.map((p) => {
      const volume = salesVolumeMap[p.id] || 0;
      let status = 'Dead Stock (0 sold)';
      if (volume > 15) status = 'Fast Moving';
      else if (volume >= 5) status = 'Average Moving';
      else if (volume > 0) status = 'Slow Moving';

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stockQuantity,
        volume,
        velocityStatus: status,
      };
    }).sort((a, b) => b.volume - a.volume);
  }, [filteredSales, products]);

  const handleExportPL = () => {
    const lines = [
      'OSUTUA WINES & SPIRITS - FINANCIAL PROFIT & LOSS STATEMENT',
      `Period: ${period.toUpperCase()}`,
      `Exported: ${new Date().toISOString()}`,
      '----------------------------------------',
      `Total Sales Revenue: KES ${totalRevenue}`,
      `Cost of Goods Sold (COGS): KES ${totalCOGS}`,
      `Gross Profit: KES ${grossProfit}`,
      `Gross Margin: ${totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}%`,
      `Operating Expenses: KES ${totalExpenses}`,
      `Net Profit (EBIT): KES ${netProfit}`,
      `Net Margin: ${netMarginPct}%`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osutua_pnl_statement_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <span>Comprehensive Business Analytics &amp; Reports</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Financial profit &amp; loss statements, cashier performance audits, and inventory velocity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            {(['all', 'month', '7days'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition ${
                  period === p
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p === '7days' ? 'Last 7 Days' : p === 'month' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportPL}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Download P&amp;L Statement
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setReportTab('financial')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            reportTab === 'financial'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Financial Profit &amp; Loss (P&amp;L)
        </button>
        <button
          onClick={() => setReportTab('cashier')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            reportTab === 'cashier'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Sales by Cashier Performance
        </button>
        <button
          onClick={() => setReportTab('products')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            reportTab === 'products'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Product Velocity (Fast/Slow/Dead)
        </button>
      </div>

      {/* TAB 1: FINANCIAL P&L */}
      {reportTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Gross Revenue</span>
              <div className="text-2xl font-extrabold text-slate-950 dark:text-amber-400 font-mono-numbers">
                KES {totalRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">From {filteredSales.length} settled customer orders</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Gross Profit</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                KES {grossProfit.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">COGS: KES {totalCOGS.toLocaleString()}</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Net Operating Profit</span>
              <div
                className={`text-2xl font-extrabold font-mono-numbers ${
                  netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'
                }`}
              >
                KES {netProfit.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">After KES {totalExpenses.toLocaleString()} overhead expenses ({netMarginPct}% net margin)</p>
            </div>
          </div>

          {/* Itemized P&L Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Itemized Financial Income Statement (KES)
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-2 font-semibold">
                <span className="text-slate-700 dark:text-slate-300">1. Gross Sales Revenue</span>
                <span className="font-mono text-slate-900 dark:text-white">KES {totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 text-slate-500">
                <span className="pl-4">Less: Cost of Goods Sold (Supplier Inventory Cost)</span>
                <span className="font-mono text-red-500">-KES {totalCOGS.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 font-bold bg-slate-50 dark:bg-slate-800/40 px-3 rounded-lg">
                <span className="text-emerald-700 dark:text-emerald-300">Gross Operating Profit</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">KES {grossProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 text-slate-500">
                <span className="pl-4">Less: Total Store Operating Expenses (Rent, KPLC, Licenses)</span>
                <span className="font-mono text-red-500">-KES {totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 font-extrabold text-sm border-t-2 border-slate-300 dark:border-slate-700 px-3">
                <span className="text-slate-900 dark:text-white">NET STORE PROFIT (EBIT)</span>
                <span className={`font-mono ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                  KES {netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CASHIER PERFORMANCE */}
      {reportTab === 'cashier' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
            Cashier Shift &amp; Till Performance Audit
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Cashier Name</th>
                <th className="py-3 px-3 text-center">Transactions Processed</th>
                <th className="py-3 px-3 text-right">Average Basket Size</th>
                <th className="py-3 px-4 text-right">Total Revenue Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cashierBreakdown.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{c.cashierName}</td>
                  <td className="py-3 px-3 text-center tabular-nums">{c.transactions} orders</td>
                  <td className="py-3 px-3 text-right font-mono-numbers">
                    KES {c.transactions > 0 ? Math.round(c.totalSales / c.transactions).toLocaleString() : 0}
                  </td>
                  <td className="py-3 px-4 text-right font-bold font-mono-numbers text-amber-600 dark:text-amber-400 text-sm">
                    KES {c.totalSales.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PRODUCT VELOCITY */}
      {reportTab === 'products' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Product Movement Velocity Ranking
            </span>
            <span className="text-slate-400">Identifies fast sellers and dead inventory</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-center">Current Shelf Stock</th>
                <th className="py-3 px-3 text-center">Total Volume Sold</th>
                <th className="py-3 px-4 text-right">Velocity Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {productVelocity.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{item.sku}</td>
                  <td className="py-3 px-3 text-center tabular-nums">{item.stock} btls</td>
                  <td className="py-3 px-3 text-center font-bold font-mono-numbers text-slate-900 dark:text-white">
                    {item.volume} btls
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.velocityStatus === 'Fast Moving'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : item.velocityStatus === 'Average Moving'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : item.velocityStatus === 'Slow Moving'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {item.velocityStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
