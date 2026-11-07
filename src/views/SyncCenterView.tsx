import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Server,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldCheck,
  Laptop,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const SyncCenterView: React.FC = () => {
  const {
    isOnline,
    offlineQueue,
    isSyncing,
    syncOfflineQueue,
    lanServerStatus,
    testLanConnection,
    settings,
  } = usePOS();

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    const res = await syncOfflineQueue();
    if (res.success) {
      setSyncFeedback(`Successfully synchronized ${res.syncedCount} transaction(s) to central database!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-amber-600" />
          <span>Offline Operation &amp; Multi-Checkout LAN Synchronization</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Guarantees uninterrupted business operations during internet outages across multiple counter checkouts.
        </p>
      </div>

      {syncFeedback && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Connectivity Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Public Internet Status */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Public Internet</span>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-500 animate-pulse" />
            )}
          </div>
          <div className="text-lg font-bold">
            {isOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400">Online &amp; Connected</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">Offline Mode Active</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {isOnline ? 'Direct Cloud / Supabase access' : 'Saving to local browser IndexedDB'}
          </p>
        </div>

        {/* Local Network (LAN) Server */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Local LAN Server Node</span>
            <Server className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold">
            {lanServerStatus === 'connected' ? (
              <span className="text-emerald-600 dark:text-emerald-400">LAN Node Ready</span>
            ) : (
              <span className="text-slate-700 dark:text-slate-300">Ready / Standby</span>
            )}
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <span className="text-slate-400 font-mono truncate">{settings.lanServerUrl}</span>
            <button
              onClick={() => testLanConnection()}
              className="text-blue-600 hover:underline font-semibold"
            >
              Ping
            </button>
          </div>
        </div>

        {/* Pending Sync Queue */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Offline Queue</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-950 dark:text-amber-400 font-mono-numbers">
            {offlineQueue.length} sale{offlineQueue.length === 1 ? '' : 's'}
          </div>
          <div className="pt-1">
            <button
              onClick={handleManualSync}
              disabled={offlineQueue.length === 0 || isSyncing}
              className="w-full py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Now...' : 'Synchronize Queue'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Checkout Network Architecture Diagram */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          How Osutua POS Operates During Internet Outages:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <Laptop className="w-4 h-4 text-amber-600" />
              <span>1. Zero-Downtime Checkout</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              When Safaricom/Zuku fiber goes down, cashiers notice zero interruptions. Products, prices, and stock counts remain instantly searchable from IndexedDB.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <Server className="w-4 h-4 text-blue-600" />
              <span>2. Multi-Terminal LAN Relay</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Terminals share stock updates over the local shop Wi-Fi / Ethernet router through the internal Express server node, preventing overselling.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>3. Conflict-Free Cloud Sync</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Upon internet restoration, the queue automatically reconciles with Supabase / central storage, deduplicating via unique receipt numbers.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Transactions in Local Queue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Transactions Stored in Local Browser Queue
          </span>
          <span className="text-slate-400">{offlineQueue.length} pending sync</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-3">Date &amp; Time</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Items Count</th>
                <th className="py-3 px-3 text-right">Total (KES)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {offlineQueue.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {s.receiptNo}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{new Date(s.date).toLocaleString('en-KE')}</td>
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">{s.cashierName}</td>
                  <td className="py-3 px-3 tabular-nums">{s.items.length} items</td>
                  <td className="py-3 px-3 text-right font-bold font-mono-numbers text-amber-600 dark:text-amber-400">
                    KES {s.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600">
                      Pending Sync
                    </span>
                  </td>
                </tr>
              ))}

              {offlineQueue.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    All local transactions are fully synced with the central database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
