import React, { useState } from 'react';
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Printer,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { CashierShift } from '../types';

export const ShiftsView: React.FC = () => {
  const { shifts, currentShift, openShift, closeShift, currentUser, settings } = usePOS();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedShiftForPrint, setSelectedShiftForPrint] = useState<CashierShift | null>(null);

  // Open Shift Form
  const [registerName, setRegisterName] = useState('Counter POS 01');
  const [openingFloat, setOpeningFloat] = useState('5000');

  // Close Shift Form
  const [countedCash, setCountedCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    openShift(registerName, parseFloat(openingFloat) || 0);
    setShowOpenModal(false);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = parseFloat(countedCash) || 0;
    const closed = closeShift(counted, closingNotes);
    setShowCloseModal(false);
    setCountedCash('');
    setClosingNotes('');
    if (closed) {
      setSelectedShiftForPrint(closed);
    }
  };

  // Expected cash for active shift
  const currentExpectedCash = currentShift
    ? currentShift.openingCash + currentShift.totalSalesCash - currentShift.totalRefundsCash
    : 0;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Cashier Shifts &amp; Till Float Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit cashier drawer floats, count physical cash at shift close, and print shift Z-reports.
          </p>
        </div>

        <div>
          {!currentShift ? (
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Play className="w-4 h-4" /> Open New Cashier Shift
            </button>
          ) : (
            <button
              onClick={() => {
                setCountedCash(currentExpectedCash.toString());
                setShowCloseModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Close Active Shift
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE SHIFT STATUS CARD */}
      {currentShift ? (
        <div className="p-6 bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ACTIVE SHIFT: {currentShift.shiftNo} ({currentShift.registerName})
              </h3>
            </div>
            <div className="text-xs text-slate-500">
              Cashier: <strong className="text-slate-800 dark:text-slate-200">{currentShift.cashierName}</strong> · Started at: {new Date(currentShift.startTime).toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Opening Cash Float</span>
              <span className="text-lg font-bold font-mono-numbers text-slate-900 dark:text-slate-100">
                KES {currentShift.openingCash.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Cash Sales In Drawer</span>
              <span className="text-lg font-bold font-mono-numbers text-amber-600 dark:text-amber-400">
                KES {currentShift.totalSalesCash.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">M-Pesa Collections</span>
              <span className="text-lg font-bold font-mono-numbers text-emerald-600 dark:text-emerald-400">
                KES {currentShift.totalSalesMpesa.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Expected Physical Cash</span>
              <span className="text-lg font-bold font-mono-numbers text-slate-950 dark:text-white">
                KES {currentExpectedCash.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>
              Transactions logged: <strong>{currentShift.totalTransactions}</strong> · Card: KES {currentShift.totalSalesCard.toLocaleString()}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Till drawer live audit running
            </span>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
              No Active Shift for {currentUser.fullName}
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Please open a new cashier shift with an opening cash float to begin checkout.
            </p>
          </div>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Open Shift Now
          </button>
        </div>
      )}

      {/* HISTORICAL SHIFTS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Shift Z-Reports History (Reconciled Cash Logs)
          </span>
          <span className="text-slate-400">{shifts.length} shifts logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Shift No</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Start / End Time</th>
                <th className="py-3 px-3 text-right">Float</th>
                <th className="py-3 px-3 text-right">Cash Sales</th>
                <th className="py-3 px-3 text-right">M-Pesa Sales</th>
                <th className="py-3 px-3 text-right">Expected Cash</th>
                <th className="py-3 px-3 text-right">Counted Cash</th>
                <th className="py-3 px-3 text-center">Variance</th>
                <th className="py-3 px-4 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shifts.map((s) => {
                const diff = s.cashDifference ?? 0;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {s.shiftNo}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {s.cashierName}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      <div>{new Date(s.startTime).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {s.endTime ? new Date(s.endTime).toLocaleTimeString() : 'Running'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers">KES {s.openingCash.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-amber-600 dark:text-amber-400 font-bold">
                      KES {s.totalSalesCash.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-emerald-600 dark:text-emerald-400 font-bold">
                      KES {s.totalSalesMpesa.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers">
                      KES {s.expectedCash ? s.expectedCash.toLocaleString() : (s.openingCash + s.totalSalesCash).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold">
                      {s.closingCashCount !== undefined ? `KES ${s.closingCashCount.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold font-mono-numbers">
                      {s.status === 'open' ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-sans uppercase">
                          Open
                        </span>
                      ) : diff === 0 ? (
                        <span className="text-emerald-600 text-xs font-semibold">Balanced (0)</span>
                      ) : diff > 0 ? (
                        <span className="text-emerald-600 text-xs font-semibold">+KES {diff.toLocaleString()} (Over)</span>
                      ) : (
                        <span className="text-red-600 text-xs font-semibold">-KES {Math.abs(diff).toLocaleString()} (Short)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedShiftForPrint(s)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 rounded"
                        title="Print Shift Z-Report"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPEN SHIFT MODAL */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              Start Cashier Shift
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter register details and opening float to initialize drawer session.
            </p>
            <form onSubmit={handleOpenShift} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  POS Register
                </label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Opening Float (KES) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-base font-bold font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE SHIFT MODAL */}
      {showCloseModal && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              Close Cashier Shift {currentShift.shiftNo}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perform drawer cash count. System will compute expected cash and any variance.
            </p>

            <form onSubmit={handleCloseShift} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Opening Float:</span>
                  <span className="font-mono">KES {currentShift.openingCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Sales:</span>
                  <span className="font-mono text-emerald-600 font-bold">+KES {currentShift.totalSalesCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-1 text-slate-900 dark:text-slate-100">
                  <span>Expected Physical Cash:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    KES {currentExpectedCash.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Actual Physical Cash Counted (KES) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-base font-bold font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Closing Shift Notes / Discrepancy Explanation
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="e.g. Exact match with cashier float handover"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Finalize &amp; Close Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHIFT Z-REPORT PREVIEW MODAL */}
      {selectedShiftForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Cashier Shift Z-Report
              </span>
              <button onClick={() => setSelectedShiftForPrint(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Z-Report Paper */}
            <div className="bg-white text-black p-4 border border-slate-300 font-mono text-xs space-y-2">
              <div className="text-center font-bold uppercase pb-2 border-b border-dashed border-slate-400">
                <div>{settings.businessName}</div>
                <div className="text-[10px] font-normal">SHIFT END Z-REPORT</div>
              </div>
              <div className="text-[11px] space-y-0.5">
                <div>SHIFT NO: {selectedShiftForPrint.shiftNo}</div>
                <div>REGISTER: {selectedShiftForPrint.registerName}</div>
                <div>CASHIER: {selectedShiftForPrint.cashierName}</div>
                <div>STARTED: {new Date(selectedShiftForPrint.startTime).toLocaleString('en-KE')}</div>
                {selectedShiftForPrint.endTime && (
                  <div>CLOSED:  {new Date(selectedShiftForPrint.endTime).toLocaleString('en-KE')}</div>
                )}
              </div>
              <div className="border-t border-dashed border-slate-400 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>OPENING FLOAT:</span>
                  <span>KES {selectedShiftForPrint.openingCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASH SALES:</span>
                  <span>KES {selectedShiftForPrint.totalSalesCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>M-PESA SALES:</span>
                  <span>KES {selectedShiftForPrint.totalSalesMpesa.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>CARD SALES:</span>
                  <span>KES {selectedShiftForPrint.totalSalesCard.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-300 pt-1">
                  <span>EXPECTED CASH:</span>
                  <span>
                    KES {(selectedShiftForPrint.expectedCash || selectedShiftForPrint.openingCash + selectedShiftForPrint.totalSalesCash).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>ACTUAL COUNT:</span>
                  <span>
                    KES {(selectedShiftForPrint.closingCashCount ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>VARIANCE:</span>
                  <span>
                    {(selectedShiftForPrint.cashDifference ?? 0) >= 0 ? `+KES ${selectedShiftForPrint.cashDifference || 0}` : `-KES ${Math.abs(selectedShiftForPrint.cashDifference || 0)}`}
                  </span>
                </div>
              </div>
              <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-dashed border-slate-400">
                End of Cashier Shift Verification
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Z-Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
