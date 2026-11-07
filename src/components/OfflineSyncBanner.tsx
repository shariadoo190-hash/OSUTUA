import React from 'react';
import { WifiOff, RefreshCw, CheckCircle, Server } from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, offlineQueue, isSyncing, syncOfflineQueue, lanServerStatus, testLanConnection } = usePOS();

  if (isOnline && offlineQueue.length === 0 && lanServerStatus !== 'unreachable') {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
            <WifiOff className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Offline Mode Active: Transactions are securely queued in local IndexedDB.</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Internet Connected</span>
          </div>
        )}

        {offlineQueue.length > 0 && (
          <span className="bg-amber-500/20 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300 font-semibold tabular-nums">
            {offlineQueue.length} pending sale{offlineQueue.length > 1 ? 's' : ''} to sync
          </span>
        )}

        {lanServerStatus === 'unreachable' && (
          <span className="text-red-500 flex items-center gap-1">
            <Server className="w-3.5 h-3.5" /> LAN Server Unreachable
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => testLanConnection()}
          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 rounded transition text-xs font-medium"
        >
          Check LAN Server
        </button>
        {offlineQueue.length > 0 && (
          <button
            onClick={() => syncOfflineQueue()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded transition text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
};
