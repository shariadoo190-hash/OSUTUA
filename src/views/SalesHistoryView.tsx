import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Download,
  RotateCcw,
  Eye,
  Calendar,
  CreditCard,
  X,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { SaleTransaction } from '../types';
import { ThermalReceipt } from '../components/ThermalReceipt';

export const SalesHistoryView: React.FC = () => {
  const { sales, setActiveView } = usePOS();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<SaleTransaction | null>(null);
  const [viewDetailsSale, setViewDetailsSale] = useState<SaleTransaction | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (methodFilter !== 'all') {
        const hasMethod = s.payments.some((p) => p.method === methodFilter);
        if (!hasMethod) return false;
      }
      const q = search.toLowerCase().trim();
      return (
        !q ||
        s.receiptNo.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.includes(q))
      );
    });
  }, [sales, search, methodFilter, statusFilter]);

  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const handleExportCSV = () => {
    const headers = ['ReceiptNo', 'Date', 'Cashier', 'Customer', 'ItemsCount', 'Subtotal', 'Discount', 'Tax', 'Total', 'PaymentMethods', 'Status'];
    const rows = filteredSales.map((s) => [
      s.receiptNo,
      s.date,
      `"${s.cashierName}"`,
      `"${s.customerName || 'Walk-in'}"`,
      s.items.length,
      s.subtotal,
      s.discount,
      s.taxAmount.toFixed(2),
      s.totalAmount,
      `"${s.payments.map((p) => `${p.method}:${p.amount}`).join(';')}"`,
      s.status,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osutua_sales_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <span>Sales Transaction History</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit customer receipts, reprint thermal roll vouchers, and export transaction logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 rounded-lg text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" /> Export Sales CSV
          </button>
          <button
            onClick={() => setActiveView('refunds')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Process Refund
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipt #, cashier, or customer phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="all">All Payment Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="cash">Cash</option>
              <option value="card">Bank Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>Found {filteredSales.length} transactions</span>
          <span className="font-bold text-slate-900 dark:text-amber-400 font-mono-numbers">
            Sum Total: KES {totalSalesAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-3">Date &amp; Time</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Customer / Items</th>
                <th className="py-3 px-3">Payment Breakdown</th>
                <th className="py-3 px-3 text-right">Total (KES)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {s.receiptNo}
                    {s.offlineMode && (
                      <span className="ml-1.5 text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1 py-0.2 rounded font-sans font-bold">
                        Offline
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(s.date).toLocaleString('en-KE')}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">{s.cashierName}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    <div>{s.customerName || 'Walk-in'} {s.customerPhone ? `(${s.customerPhone})` : ''}</div>
                    <div className="text-[11px] text-slate-400">
                      {s.items.length} line item{s.items.length > 1 ? 's' : ''} ({s.items.reduce((sum, i) => sum + i.quantity, 0)} btls)
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      {s.payments.map((p, i) => (
                        <div key={i} className="text-[11px] capitalize">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{p.method}:</span>{' '}
                          <span className="font-mono tabular-nums">KES {p.amount.toLocaleString()}</span>
                          {p.reference && <span className="text-[10px] text-slate-400 ml-1">({p.reference})</span>}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold font-mono-numbers text-slate-900 dark:text-amber-400 text-sm">
                    KES {s.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        s.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewDetailsSale(s)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 rounded"
                        title="View Line Items"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedReceiptForPrint(s)}
                        className="p-1.5 text-amber-600 hover:bg-amber-500/10 rounded"
                        title="Reprint Thermal Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Line Items Inspection Modal */}
      {viewDetailsSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Sale Details: {viewDetailsSale.receiptNo}
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date(viewDetailsSale.date).toLocaleString('en-KE')} · Cashier: {viewDetailsSale.cashierName}
                </p>
              </div>
              <button onClick={() => setViewDetailsSale(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto text-xs">
              {viewDetailsSale.items.map((i) => (
                <div
                  key={i.id}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">{i.productName}</span>
                    <span className="text-[11px] text-slate-400">
                      {i.quantity} {i.unit} @ KES {i.unitPrice.toLocaleString()} {i.discountAmount > 0 ? `(Disc: -KES ${i.discountAmount})` : ''}
                    </span>
                  </div>
                  <span className="font-bold font-mono-numbers text-slate-900 dark:text-amber-400">
                    KES {i.lineTotal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">Total Charged:</span>
              <span className="text-base font-extrabold text-slate-950 dark:text-amber-400 font-mono-numbers">
                KES {viewDetailsSale.totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedReceiptForPrint(viewDetailsSale);
                  setViewDetailsSale(null);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Thermal Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Modal */}
      {selectedReceiptForPrint && (
        <ThermalReceipt
          sale={selectedReceiptForPrint}
          onClose={() => setSelectedReceiptForPrint(null)}
        />
      )}
    </div>
  );
};
