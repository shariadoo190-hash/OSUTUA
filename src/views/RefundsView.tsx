import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { RefundItem, PaymentMethod } from '../types';

export const RefundsView: React.FC = () => {
  const { sales, refunds, processRefund, currentUser } = usePOS();

  const [receiptSearch, setReceiptSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  // Return item selection
  const [returnSelections, setReturnSelections] = useState<
    Record<string, { qty: number; restock: boolean; condition: 'good' | 'damaged' }>
  >({});
  const [refundReason, setRefundReason] = useState('Customer changed mind - seal intact');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('cash');
  const [managerPin, setManagerPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSearchReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const target = sales.find(
      (s) => s.receiptNo.toLowerCase() === receiptSearch.trim().toLowerCase()
    );
    if (!target) {
      setErrorMsg(`Receipt "${receiptSearch}" not found in transaction database.`);
      setSelectedSale(null);
      return;
    }
    if (target.status === 'refunded') {
      setErrorMsg(`Receipt ${target.receiptNo} has already been fully refunded.`);
      setSelectedSale(null);
      return;
    }

    setSelectedSale(target);
    // Initialize return selections
    const initial: Record<string, { qty: number; restock: boolean; condition: 'good' | 'damaged' }> = {};
    target.items.forEach((item) => {
      initial[item.productId] = { qty: 0, restock: true, condition: 'good' };
    });
    setReturnSelections(initial);
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedSale) return;

    // Build refund items
    const itemsToRefund: RefundItem[] = [];
    selectedSale.items.forEach((item: any) => {
      const sel = returnSelections[item.productId];
      if (sel && sel.qty > 0) {
        itemsToRefund.push({
          productId: item.productId,
          productName: item.productName,
          returnQty: sel.qty * item.unitFactor,
          refundAmount: sel.qty * item.unitPrice,
          restock: sel.restock,
          condition: sel.condition,
        });
      }
    });

    if (itemsToRefund.length === 0) {
      setErrorMsg('Please select at least 1 item and quantity to refund.');
      return;
    }

    const success = processRefund(
      selectedSale.receiptNo,
      itemsToRefund,
      refundReason,
      refundMethod,
      managerPin
    );

    if (success) {
      setSuccessMsg(`Refund successfully processed! Amount KES ${itemsToRefund.reduce((s, i) => s + i.refundAmount, 0).toLocaleString()} refunded.`);
      setSelectedSale(null);
      setReceiptSearch('');
      setManagerPin('');
    } else {
      setErrorMsg('Manager authorization failed. Invalid PIN code.');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-600" />
          <span>Customer Returns &amp; Refunds Management</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Process authorized product returns with manager override PIN and automatic stock restoration.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: Search & Return Processor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Box */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Lookup Original Customer Receipt
            </h3>
            <form onSubmit={handleSearchReceipt} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Receipt # (e.g. RCP-20260205-001)..."
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Find Receipt
              </button>
            </form>
          </div>

          {/* Refund Formulation Card */}
          {selectedSale && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Receipt: {selectedSale.receiptNo}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Date: {new Date(selectedSale.date).toLocaleString('en-KE')} · Cashier: {selectedSale.cashierName}
                  </span>
                </div>
                <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
                {/* Items to refund */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Select Items &amp; Return Quantities:
                  </span>
                  {selectedSale.items.map((item: any) => {
                    const sel = returnSelections[item.productId] || { qty: 0, restock: true, condition: 'good' };
                    return (
                      <div
                        key={item.productId}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex justify-between">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{item.productName}</span>
                            <span className="text-[11px] text-slate-500 block">
                              Purchased: {item.quantity} {item.unit} @ KES {item.unitPrice.toLocaleString()}
                            </span>
                          </div>
                          <span className="font-bold text-slate-800 dark:text-amber-400 font-mono-numbers">
                            KES {(sel.qty * item.unitPrice).toLocaleString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 items-center">
                          <div>
                            <label className="text-[10px] text-slate-500 block">Return Qty ({item.unit})</label>
                            <input
                              type="number"
                              min={0}
                              max={item.quantity}
                              value={sel.qty}
                              onChange={(e) => {
                                const val = Math.min(item.quantity, Math.max(0, parseInt(e.target.value, 10) || 0));
                                setReturnSelections({
                                  ...returnSelections,
                                  [item.productId]: { ...sel, qty: val },
                                });
                              }}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-center font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block">Condition</label>
                            <select
                              value={sel.condition}
                              onChange={(e) => {
                                const cond = e.target.value as 'good' | 'damaged';
                                setReturnSelections({
                                  ...returnSelections,
                                  [item.productId]: { ...sel, condition: cond, restock: cond === 'good' },
                                });
                              }}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded"
                            >
                              <option value="good">Good / Sealed</option>
                              <option value="damaged">Broken / Defective</option>
                            </select>
                          </div>

                          <div className="pt-3">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={sel.restock}
                                onChange={(e) =>
                                  setReturnSelections({
                                    ...returnSelections,
                                    [item.productId]: { ...sel, restock: e.target.checked },
                                  })
                                }
                                className="rounded text-amber-600"
                              />
                              <span className="text-[11px]">Restock to Shelf</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Reason for Return *
                    </label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    >
                      <option value="Customer changed mind - seal intact">Customer changed mind - seal intact</option>
                      <option value="Wrong bottle purchased by customer">Wrong bottle purchased by customer</option>
                      <option value="Defective cork / leaking bottle">Defective cork / leaking bottle</option>
                      <option value="Pricing / billing discrepancy">Pricing / billing discrepancy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Refund Disbursement Method
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg capitalize"
                    >
                      <option value="cash">Cash Out of Till</option>
                      <option value="mpesa">M-Pesa Reversal</option>
                      <option value="card">Card Reversal</option>
                    </select>
                  </div>
                </div>

                {/* Manager Authorization PIN Requirement */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Manager Security Authorization Required</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    To prevent fraudulent cashier returns, enter Manager or Admin 4-digit PIN (Default Manager PIN: 2345 or Override: 9999)
                  </p>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    className="w-40 text-center tracking-[0.4em] font-mono text-lg py-1.5 bg-white dark:bg-slate-900 border border-amber-400 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>AUTHORIZE &amp; DISBURSE REFUND</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COL: Past Refund Vouchers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Authorized Refunds Ledger</span>
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {refunds.map((r) => (
              <div
                key={r.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
              >
                <div className="flex justify-between font-bold">
                  <span className="font-mono text-slate-900 dark:text-slate-100">{r.refundNo}</span>
                  <span className="text-red-600 dark:text-red-400 font-mono-numbers">
                    -KES {r.totalRefundAmount.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  <div>Original Receipt: {r.originalReceiptNo}</div>
                  <div>Disbursed via: <span className="capitalize font-medium">{r.refundMethod}</span></div>
                  <div>Authorized by: <span className="font-semibold text-slate-700 dark:text-slate-300">{r.authorizedBy}</span></div>
                  <div className="italic text-slate-400 mt-0.5">&quot;{r.reason}&quot;</div>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  {new Date(r.date).toLocaleString('en-KE')}
                </div>
              </div>
            ))}

            {refunds.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">
                No customer returns processed yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
