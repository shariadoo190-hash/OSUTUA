import React, { useState } from 'react';
import {
  Settings,
  Save,
  Printer,
  Shield,
  Database,
  Wifi,
  Download,
  Upload,
  RefreshCw,
  Server,
  CheckCircle2,
  AlertTriangle,
  Archive,
  FileText,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { StorageService } from '../db/storage';
import { SystemSettings } from '../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    hasPermission,
    testLanConnection,
    lanServerStatus,
    offlineQueue,
    syncOfflineQueue,
    isSyncing,
  } = usePOS();

  const [form, setForm] = useState<SystemSettings>({ ...settings });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  const canEditSettings = hasPermission('settings');

  const handleChange = (field: keyof SystemSettings, val: any) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaveMessage('System settings saved successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleExportBackup = () => {
    const json = StorageService.exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osutua_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetFactory = () => {
    if (window.confirm('Are you sure you want to reset all records to initial factory database defaults? All local modifications will be restored to seed state.')) {
      StorageService.resetToDefaults();
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-600" />
          <span>System Settings &amp; Configuration</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure business details, thermal printer paper size, tax compliance, and local LAN sync parameters.
        </p>
      </div>

      {saveMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Identity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            1. Store Identity &amp; Tax Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Business Trading Name *
              </label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Branch / Location
              </label>
              <input
                type="text"
                value={form.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Official Business Phone *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kenya Revenue Authority (KRA) PIN *
              </label>
              <input
                type="text"
                required
                value={form.kraPin}
                onChange={(e) => handleChange('kraPin', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Store Physical Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Currency & Tax Configuration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            2. Currency, Timezone &amp; Tax Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Operating Currency
              </label>
              <input
                type="text"
                disabled
                value="KES (Kenyan Shillings)"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Local Timezone
              </label>
              <input
                type="text"
                disabled
                value="Africa/Nairobi (UTC+3)"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Standard VAT Rate (%)
              </label>
              <input
                type="number"
                value={form.vatRate}
                onChange={(e) => handleChange('vatRate', parseFloat(e.target.value) || 16)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-3 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.vatInclusive}
                  onChange={(e) => handleChange('vatInclusive', e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span>Prices shown to customers are 16% VAT inclusive (standard retail norm in Kenya)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Thermal Printer & Receipt Customization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-600" />
            <span>3. Thermal Receipt Customization (Module 9)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Thermal Roll Paper Width *
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="receiptWidth"
                    value="80mm"
                    checked={form.receiptWidth === '80mm'}
                    onChange={() => handleChange('receiptWidth', '80mm')}
                    className="text-amber-600"
                  />
                  <span>80mm Standard POS Printer (Recommended)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="receiptWidth"
                    value="58mm"
                    checked={form.receiptWidth === '58mm'}
                    onChange={() => handleChange('receiptWidth', '58mm')}
                    className="text-amber-600"
                  />
                  <span>58mm Compact Bluetooth/USB Printer</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Manager Override Security PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={form.managerOverridePin}
                onChange={(e) => handleChange('managerOverridePin', e.target.value)}
                className="w-36 text-center tracking-[0.4em] font-mono text-base px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Receipt Header Greeting Line
              </label>
              <input
                type="text"
                value={form.receiptHeaderMsg}
                onChange={(e) => handleChange('receiptHeaderMsg', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Receipt Return Policy &amp; Footer Line
              </label>
              <textarea
                rows={2}
                value={form.receiptFooterMsg}
                onChange={(e) => handleChange('receiptFooterMsg', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Local LAN Multi-Checkout & Cloud Database Sync */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span>4. Offline Operation &amp; Local LAN Server (Module 20)</span>
          </h3>

          <p className="text-xs text-slate-500">
            For multi-computer stores: Multiple checkout terminals connect to the Node.js local LAN server endpoint, ensuring seamless sales even during complete internet outages.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Local LAN Server Endpoint URL
              </label>
              <input
                type="text"
                value={form.lanServerUrl}
                onChange={(e) => handleChange('lanServerUrl', e.target.value)}
                placeholder="http://192.168.1.100:3000/api"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => testLanConnection()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Server className="w-3.5 h-3.5" /> Test Local Server Ping
              </button>

              {lanServerStatus === 'connected' && (
                <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> LAN Server Online
                </span>
              )}
            </div>
          </div>

          {/* Cloud Database (Supabase) Integration */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              Cloud Database (Supabase / Central Storage Synchronization):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 block mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={form.supabaseUrl}
                  onChange={(e) => handleChange('supabaseUrl', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Supabase Publishable Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={form.supabaseKey}
                  onChange={(e) => handleChange('supabaseKey', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Full Application Package & Source Code Download */}
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-transparent dark:from-amber-500/10 dark:via-slate-800/20 dark:to-transparent border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Download Complete Application Package (.ZIP)</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                    Production Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Complete offline-capable codebase with React 19 frontend, Express backend, Dockerfile, docker-compose, and full setup guides.
                </p>
              </div>
            </div>

            <a
              href="/api/download-zip"
              download="osutua-pos-system.zip"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-md transition shrink-0"
            >
              <Download className="w-4 h-4" /> Download ZIP (~2.1 MB)
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600 dark:text-slate-400 border-t border-amber-200/50 dark:border-amber-900/30">
            <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-slate-200 block mb-1">
                📦 Included in Archive:
              </span>
              <span>50 complete source files, TypeScript configs, Tailwind v4 styling, DB storage, and assets.</span>
            </div>
            <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-slate-200 block mb-1">
                🚀 Deployment Artifacts:
              </span>
              <span>Dockerfile, docker-compose.yml, Express server.ts, systemd service, and Nginx reverse proxy configs.</span>
            </div>
            <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-slate-200 block mb-1">
                📖 Documentation Included:
              </span>
              <span>BACKEND_SETUP_GUIDE.md with LAN setup, hardware printing guides, and SMTP email dispatcher.</span>
            </div>
          </div>
        </div>

        {/* Database Disaster Recovery & Backup */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>5. Disaster Recovery &amp; System Backup</span>
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2 bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-700 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download Complete JSON Backup
            </button>
            <button
              type="button"
              onClick={handleResetFactory}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Reset to Factory Database Defaults
            </button>
          </div>
        </div>

        {/* Save Bar */}
        {canEditSettings && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save System Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
