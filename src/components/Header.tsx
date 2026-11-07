import React, { useState } from 'react';
import {
  Sun,
  Moon,
  UserCheck,
  Menu,
  ChevronDown,
  Shield,
  Clock,
  KeyRound,
  Bell,
  Sparkles,
  AlertTriangle,
  Mail,
  Send,
  CheckCircle2,
  Archive,
  Download,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    currentUser,
    users,
    switchUser,
    activeView,
    setActiveView,
    theme,
    toggleTheme,
    currentShift,
    hasPermission,
    lowStockAlerts,
    sendLowStockEmailAlert,
    sendBatchLowStockEmailAlerts,
    toggleAIChat,
    settings,
  } = usePOS();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedUserForPin, setSelectedUserForPin] = useState<string>('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);
  const [batchSending, setBatchSending] = useState(false);

  const handleSelectUser = (userId: string) => {
    setShowUserDropdown(false);
    setSelectedUserForPin(userId);
    setPinInput('');
    setPinError('');
    setShowPinModal(true);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = switchUser(selectedUserForPin, pinInput);
    if (success) {
      setShowPinModal(false);
      setPinInput('');
    } else {
      setPinError('Invalid 4-digit PIN for selected user');
    }
  };

  const handleSendSingleAlert = async (alertId: string) => {
    setSendingAlertId(alertId);
    await sendLowStockEmailAlert(alertId);
    setSendingAlertId(null);
  };

  const handleSendAllAlerts = async () => {
    setBatchSending(true);
    await sendBatchLowStockEmailAlerts();
    setBatchSending(false);
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Store Manager';
      case 'stock_controller':
        return 'Stock Controller';
      case 'cashier':
        return 'Cashier';
      default:
        return role;
    }
  };

  const canSeeDashboard = hasPermission('access_admin_dashboard');
  const canSeeInventory = hasPermission('manage_inventory');
  const canSeeProcurement = hasPermission('create_purchases') || hasPermission('receive_goods');
  const canSeePOS = hasPermission('process_sales');

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 lg:gap-8 px-4 lg:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        {/* Zone 1: Single-element Brand Wordmark & Mobile Drawer Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveView(canSeePOS ? 'pos' : canSeeDashboard ? 'dashboard' : 'inventory')}
            className="flex items-center gap-2.5 text-left group focus:outline-hidden"
          >
            <img
              src="/src/assets/images/osutua_brand_logo_1793965033386.jpg"
              alt="Osutua Insignia"
              className="w-8 h-8 rounded-md object-cover border border-amber-600/30"
              referrerPolicy="no-referrer"
            />
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-amber-400 whitespace-nowrap uppercase">
              OSUTUA WINES &amp; SPIRITS
            </span>
          </button>
        </div>

        {/* Zone 2: Role-Restricted Concise Single-Line Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {canSeePOS && (
            <button
              onClick={() => setActiveView('pos')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeView === 'pos'
                  ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-600 dark:border-amber-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Point of Sale
            </button>
          )}

          {canSeeDashboard && (
            <button
              onClick={() => setActiveView('dashboard')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeView === 'dashboard'
                  ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-600 dark:border-amber-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </button>
          )}

          {canSeeInventory && (
            <button
              onClick={() => setActiveView('inventory')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeView === 'inventory'
                  ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-600 dark:border-amber-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Inventory &amp; Stock
            </button>
          )}

          {canSeeProcurement && (
            <button
              onClick={() => setActiveView('purchases')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeView === 'purchases'
                  ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-600 dark:border-amber-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Procurement
            </button>
          )}

          {canSeePOS && (
            <button
              onClick={() => setActiveView('shifts')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeView === 'shifts'
                  ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-600 dark:border-amber-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Shifts &amp; Register
            </button>
          )}
        </nav>

        {/* Zone 3: Actions & Context Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Active Shift Indicator */}
          {canSeePOS && (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono-numbers">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Shift: {currentShift ? `Active (${currentShift.shiftNo})` : 'Closed'}</span>
            </div>
          )}

          {/* AI Store Co-Pilot Trigger */}
          <button
            onClick={toggleAIChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs hover:brightness-105 transition"
            title="Open Gemini AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Co-Pilot</span>
          </button>

          {/* Low Stock Alerts Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className={`relative p-2 rounded-lg transition ${
                lowStockAlerts.length > 0
                  ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-label="Stock Alerts"
              title="Low Stock Alerts"
            >
              <Bell className="w-4 h-4" />
              {lowStockAlerts.length > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-bold font-mono">
                  {lowStockAlerts.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Real-Time Stock Alerts
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                    {lowStockAlerts.length} Active
                  </span>
                </div>

                {lowStockAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    All inventory products are above minimum safety thresholds.
                  </div>
                ) : (
                  <>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
                      {lowStockAlerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  alert.severity === 'out_of_stock'
                                    ? 'bg-red-600'
                                    : alert.severity === 'critical'
                                    ? 'bg-orange-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {alert.productName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Stock: <span className="font-semibold text-red-600 dark:text-red-400">{alert.currentStock}</span> / Min: {alert.minStockLevel} · Reorder: {alert.suggestedReorder}
                            </div>
                          </div>

                          <button
                            onClick={() => handleSendSingleAlert(alert.id)}
                            disabled={sendingAlertId === alert.id}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-semibold transition"
                            title={`Email alert to ${settings.alertEmailRecipient || 'shariadoo190@gmail.com'}`}
                          >
                            <Mail className="w-3 h-3" />
                            <span>{sendingAlertId === alert.id ? 'Sending...' : 'Email'}</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={handleSendAllAlerts}
                        disabled={batchSending}
                        className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Send className="w-3 h-3" />
                        <span>{batchSending ? 'Dispatching...' : `Email All to ${settings.alertEmailRecipient || 'shariadoo190@gmail.com'}`}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowNotificationsDropdown(false);
                          setActiveView('inventory');
                        }}
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 text-[11px]"
                      >
                        View Full Stock
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Download Full Application Archive (.ZIP) Button */}
          <a
            href="/api/download-zip"
            download="osutua-pos-system.zip"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-xs transition shrink-0"
            title="Download complete application package as .ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download ZIP</span>
            <span className="sm:hidden">ZIP</span>
          </a>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle dark/light mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User Profile / Quick Cashier Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-lg text-xs transition border border-slate-200 dark:border-slate-700"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {roleLabel(currentUser.role)}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Switch Active Cashier / Staff
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                        u.id === currentUser.id ? 'bg-amber-500/10 font-bold text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[9px] font-bold">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div>{u.fullName}</div>
                          <div className="text-[10px] text-slate-400">{roleLabel(u.role)}</div>
                        </div>
                      </div>
                      {u.id === currentUser.id && <UserCheck className="w-4 h-4 text-amber-500" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 px-2 space-y-1">
                  <a
                    href="/api/download-zip"
                    download="osutua-pos-system.zip"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full text-left px-2 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-md flex items-center gap-2 font-medium"
                  >
                    <Archive className="w-3.5 h-3.5" /> Download Project ZIP Archive
                  </a>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setActiveView('users');
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5" /> Staff Accounts &amp; RBAC Matrix
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cashier PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Staff Authentication
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter 4-digit PIN for {users.find((u) => u.id === selectedUserForPin)?.fullName}
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                {pinError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 text-center">
                    {pinError}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  PINs: Admin=1234, Manager=2345, Cashier=1111, Stock Controller=3456
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length < 4}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition"
                >
                  Authorize Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
