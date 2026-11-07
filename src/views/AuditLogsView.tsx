import React, { useState, useMemo } from 'react';
import { ClipboardList, Search, Filter, ShieldCheck, User, Calendar } from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = usePOS();
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (selectedCat() !== 'all' && log.module !== selectedModule) return false;
      const q = search.toLowerCase().trim();
      return (
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        (log.updatedValue && log.updatedValue.toLowerCase().includes(q)) ||
        (log.reason && log.reason.toLowerCase().includes(q))
      );
    });

    function selectedCat() {
      return selectedModule;
    }
  }, [auditLogs, selectedModule, search]);

  const modules = Array.from(new Set(auditLogs.map((l) => l.module)));

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-amber-600" />
          <span>System Audit Trail &amp; Activity Log</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Immutable chronological ledger tracking stock alterations, price adjustments, refunds, and user actions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by action, staff member, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Modules ({modules.length})</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>{filteredLogs.length} activity records logged</span>
          <span className="text-[11px] text-amber-600 font-medium">Compliance &amp; Traceability active</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Staff / Role</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action Performed</th>
                <th className="py-3 px-3">Details / Value Change</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-KE')}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{log.userName}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{log.role.replace('_', ' ')}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 max-w-sm text-slate-600 dark:text-slate-300">
                    {log.previousValue && (
                      <div className="text-[11px] text-slate-400 line-through">
                        Was: {log.previousValue}
                      </div>
                    )}
                    <div className="font-mono text-[11px]">{log.updatedValue}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                    {log.reason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
