import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  History,
  ClipboardCheck,
  Search,
  PlusCircle,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  X,
  CheckCircle2,
  Mail,
  Send,
  Bell,
  Lock,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product, StockMovementType } from '../types';

export const InventoryView: React.FC = () => {
  const {
    products,
    stockMovements,
    adjustStock,
    hasPermission,
    lowStockAlerts,
    sentEmailLogs,
    sendLowStockEmailAlert,
    sendBatchLowStockEmailAlerts,
    settings,
    currentUser,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'levels' | 'movements' | 'reconciliation' | 'alerts'>('levels');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [batchEmailing, setBatchEmailing] = useState(false);
  const [targetRecipient, setTargetRecipient] = useState<string>(
    settings.alertEmailRecipient || 'shariadoo190@gmail.com'
  );

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState<'adjustment' | 'damage_expired'>('adjustment');

  // Physical Stock Reconciliation State
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({});
  const [reconciliationSubmitted, setReconciliationSubmitted] = useState(false);

  const canManageStock = hasPermission('manage_inventory');

  // Stock valuation metrics
  const totalCostVal = products.reduce((s, p) => s + p.stockQuantity * p.purchaseCost, 0);
  const totalRetailVal = products.reduce((s, p) => s + p.stockQuantity * p.sellingPrice, 0);
  const potentialMargin = totalRetailVal - totalCostVal;

  const lowStockList = products.filter((p) => p.status !== 'archived' && p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel);
  const outOfStockList = products.filter((p) => p.status !== 'archived' && p.stockQuantity <= 0);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status === 'archived') return false;
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      if (filterType === 'low') return matchesSearch && p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel;
      if (filterType === 'out') return matchesSearch && p.stockQuantity <= 0;
      return matchesSearch;
    });
  }, [products, search, filterType]);

  // Open adjustment modal
  const handleOpenAdjust = (p: Product) => {
    setSelectedProduct(p);
    setNewStockInput(p.stockQuantity.toString());
    setAdjustReason('');
    setAdjustType('adjustment');
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const newQty = parseInt(newStockInput, 10);
    if (isNaN(newQty) || newQty < 0) return;
    adjustStock(selectedProduct.id, newQty, adjustReason || 'Physical inventory audit', adjustType);
    setShowAdjustModal(false);
  };

  // Submit physical stock reconciliation
  const handleReconcileAll = () => {
    let count = 0;
    Object.entries(physicalCounts).forEach(([prodId, countedStr]) => {
      const counted = parseInt(countedStr, 10);
      const prod = products.find((p) => p.id === prodId);
      if (prod && !isNaN(counted) && counted !== prod.stockQuantity) {
        adjustStock(
          prod.id,
          counted,
          `Physical Stock Reconciliation (Counted: ${counted}, System was: ${prod.stockQuantity})`,
          'adjustment'
        );
        count++;
      }
    });

    setReconciliationSubmitted(true);
    setPhysicalCounts({});
    setTimeout(() => setReconciliationSubmitted(false), 3000);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Valuation Summary Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <span>Inventory &amp; Stock Control</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trace bottle movements, record physical counts, and reconcile stock variances.
          </p>
        </div>

        {/* Valuation Summary Card */}
        <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Cost Valuation</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono-numbers">
              KES {totalCostVal.toLocaleString()}
            </span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Retail Valuation</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono-numbers">
              KES {totalRetailVal.toLocaleString()}
            </span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Potential Margin</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
              +KES {potentialMargin.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'levels'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock Levels ({products.filter((p) => p.status !== 'archived').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'movements'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Movement History ({stockMovements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'reconciliation'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Physical Stock Count Sheet</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'alerts'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Stock Alerts &amp; Dispatches ({lowStockAlerts.length})</span>
          {lowStockAlerts.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* TAB 1: STOCK LEVELS */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search stock by product name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All Stock
              </button>
              <button
                onClick={() => setFilterType('low')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filterType === 'low'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                }`}
              >
                Low Stock ({lowStockList.length})
              </button>
              <button
                onClick={() => setFilterType('out')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filterType === 'out'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                Out of Stock ({outOfStockList.length})
              </button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-center">Min Level</th>
                  <th className="py-3 px-3 text-center">Available Stock</th>
                  <th className="py-3 px-3 text-right">Stock Valuation</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((p) => {
                  const isOut = p.stockQuantity <= 0;
                  const isLow = p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel;
                  const valuation = p.stockQuantity * p.purchaseCost;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {p.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="py-3 px-3 text-right font-mono-numbers">KES {p.purchaseCost.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-bold text-amber-600 dark:text-amber-400">
                        KES {p.sellingPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">{p.minStockLevel}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-bold tabular-nums px-2 py-0.5 rounded text-[11px] ${
                            isOut
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : isLow
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {p.stockQuantity} btls
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-medium text-slate-900 dark:text-slate-200">
                        KES {valuation.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canManageStock && (
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-md transition"
                          >
                            Adjust Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENTS AUDIT TRAIL */}
      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Complete Immutable Stock Movement Ledger
            </span>
            <span className="text-slate-400">Showing past movements</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Movement Type</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3">Responsible User</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stockMovements.map((sm) => {
                  const isPositive = sm.quantity > 0;
                  return (
                    <tr key={sm.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(sm.timestamp).toLocaleString('en-KE')}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {sm.productName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                          {sm.movementType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold font-mono-numbers">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPositive ? `+${sm.quantity}` : sm.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{sm.userName}</td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        {sm.reason} {sm.referenceNo ? `(${sm.referenceNo})` : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PHYSICAL STOCK COUNT RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Physical Stock Count &amp; Reconciliation Sheet
              </h3>
              <p className="text-xs text-slate-500">
                Enter your physical shelf count below. System will automatically calculate variances and update stock balances.
              </p>
            </div>
            {canManageStock && (
              <button
                onClick={handleReconcileAll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Apply Count Reconciliation
              </button>
            )}
          </div>

          {reconciliationSubmitted && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Physical stock reconciliation successfully applied! Inventory ledger updated.</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">System Recorded Stock</th>
                  <th className="py-2.5 px-3 text-center">Physical Count (Bottles)</th>
                  <th className="py-2.5 px-3 text-center">Count Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.filter((p) => p.status !== 'archived').map((p) => {
                  const inputVal = physicalCounts[p.id];
                  const hasInput = inputVal !== undefined && inputVal !== '';
                  const countedNum = hasInput ? parseInt(inputVal, 10) : p.stockQuantity;
                  const variance = countedNum - p.stockQuantity;

                  return (
                    <tr key={p.id}>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {p.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{p.sku}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {p.stockQuantity} btls
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          placeholder={p.stockQuantity.toString()}
                          value={physicalCounts[p.id] ?? ''}
                          onChange={(e) =>
                            setPhysicalCounts({ ...physicalCounts, [p.id]: e.target.value })
                          }
                          className="w-24 text-center px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-mono font-bold"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono-numbers">
                        {hasInput && variance !== 0 ? (
                          <span className={variance > 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {variance > 0 ? `+${variance}` : variance} btls
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REAL-TIME LOW-STOCK ALERTS & EMAIL DISPATCH LOG */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Dispatch Settings & Quick Action Banner */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-600" />
                  <span>Real-Time Automated Alert Dispatcher</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Send restock notices and suggested purchase orders to management and procurement.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                  <span className="text-slate-400">Recipient:</span>
                  <input
                    type="email"
                    value={targetRecipient}
                    onChange={(e) => setTargetRecipient(e.target.value)}
                    className="bg-transparent font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden min-w-[210px]"
                    placeholder="shariadoo190@gmail.com"
                  />
                </div>

                <button
                  onClick={async () => {
                    setBatchEmailing(true);
                    await sendBatchLowStockEmailAlerts(targetRecipient);
                    setBatchEmailing(false);
                  }}
                  disabled={batchEmailing || lowStockAlerts.length === 0}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{batchEmailing ? 'Dispatching...' : `Dispatch All (${lowStockAlerts.length})`}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Alerts Table */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Critical Stock Items ({lowStockAlerts.length})
              </h4>
              <span className="text-xs text-slate-500">
                Formula: (Safety Threshold × Multiplier) - Current Physical
              </span>
            </div>

            {lowStockAlerts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Zero Stock Shortages
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  All catalogue products are stocked safely above minimum levels.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Product &amp; SKU</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Current Stock</th>
                      <th className="py-2.5 px-3">Min Safety</th>
                      <th className="py-2.5 px-3">Suggested Reorder</th>
                      <th className="py-2.5 px-3">Unit Cost</th>
                      <th className="py-2.5 px-3">Est. Order Cost</th>
                      <th className="py-2.5 px-3">Preferred Supplier</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lowStockAlerts.map((alert) => {
                      const isOut = alert.severity === 'out_of_stock';
                      const isCrit = alert.severity === 'critical';
                      const totalCost = alert.suggestedReorder * alert.unitCost;

                      return (
                        <tr
                          key={alert.id}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition ${
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
                            KES {totalCost.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {alert.supplierName}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={async () => {
                                setEmailingId(alert.id);
                                await sendLowStockEmailAlert(alert.id, targetRecipient);
                                setEmailingId(null);
                              }}
                              disabled={emailingId === alert.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-semibold transition"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>{emailingId === alert.id ? 'Sending...' : 'Email Notice'}</span>
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

          {/* Historical Dispatched Alert Emails Log */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dispatched Alert Notifications Log ({sentEmailLogs.length})
              </h4>
              <span className="text-xs text-slate-500">
                Audited Email Deliveries
              </span>
            </div>

            {sentEmailLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No stock alert emails have been dispatched yet.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Tracking ID</th>
                      <th className="py-2 px-3">Dispatched At</th>
                      <th className="py-2 px-3">Recipient</th>
                      <th className="py-2 px-3">Product Name &amp; SKU</th>
                      <th className="py-2 px-3">Reorder Qty</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sentEmailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-2 px-3 font-mono font-semibold text-amber-600 dark:text-amber-400">
                          {log.id}
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {new Date(log.sentAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {log.to}
                        </td>
                        <td className="py-2 px-3">
                          <div>{log.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.sku}</div>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold">
                          +{log.reorderQuantity} units
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Adjust Physical Stock
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Product:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedProduct.name}</span>
                <span className="text-[11px] text-slate-400 block">Current System Stock: {selectedProduct.stockQuantity} bottles</span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Stock Count (Bottles) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Movement Category
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="adjustment">Stock Count Variance / Audit Adjustment</option>
                  <option value="damage_expired">Damaged / Broken / Expired Stock</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Reason / Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Broken during shelf reorganization, verified by store manager Faith"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Record Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
