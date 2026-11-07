import React, { useState } from 'react';
import {
  Users,
  Plus,
  Shield,
  KeyRound,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  X,
  Edit2,
  Lock,
  UserCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { User, UserRole, PermissionKey, ROLE_PERMISSIONS } from '../types';

const PERMISSION_CONFIG: Record<
  PermissionKey,
  { name: string; description: string; category: string }
> = {
  access_admin_dashboard: {
    name: 'Admin Financial Dashboard',
    description: 'View turnover, gross margins, and store benchmarks',
    category: 'Executive',
  },
  manage_pricing: {
    name: 'Product Pricing Control',
    description: 'Set purchase costs, bottle selling prices, and bulk prices',
    category: 'Executive',
  },
  manage_catalog: {
    name: 'Product Catalogue',
    description: 'Register products, SKU codes, volume sizes, and packaging units',
    category: 'Stock',
  },
  process_sales: {
    name: 'POS Checkout & Till Shifts',
    description: 'Ring up sales, scan barcodes, park orders, and take payments',
    category: 'Counter',
  },
  manage_inventory: {
    name: 'Inventory & Stock Reconciliation',
    description: 'Log manual adjustments, write off damaged stock, audit counts',
    category: 'Stock',
  },
  create_purchases: {
    name: 'Create Purchase Orders',
    description: 'Draft restock requisitions and select supplier items',
    category: 'Procurement',
  },
  approve_purchases: {
    name: 'Approve Purchase Orders',
    description: 'Authorize company expenditure with distributors',
    category: 'Procurement',
  },
  receive_goods: {
    name: 'Goods Receiving (GRN)',
    description: 'Inspect delivery notes, verify bottle counts, accept intake',
    category: 'Procurement',
  },
  manage_suppliers: {
    name: 'Suppliers Directory',
    description: 'Manage supplier contacts, credit terms, and delivery reps',
    category: 'Procurement',
  },
  manage_supplier_payments: {
    name: 'Disburse Supplier Payments',
    description: 'Record payment vouchers and deduct account payables',
    category: 'Finance',
  },
  manage_expenses: {
    name: 'Expense Tracker',
    description: 'Record operating expenses (rent, electricity, licenses)',
    category: 'Finance',
  },
  authorize_refunds: {
    name: 'Authorize Returns & Refunds',
    description: 'Sign off on customer returns and restock bottles',
    category: 'Counter',
  },
  view_reports: {
    name: 'Financial & Sales Reports',
    description: 'Export detailed sales, tax VAT 16%, and margin reports',
    category: 'Finance',
  },
  manage_staff_roles: {
    name: 'Staff Accounts & Permissions',
    description: 'Create users, assign roles, and modify till PINs',
    category: 'Security',
  },
  manage_system_settings: {
    name: 'Core System Settings',
    description: 'Configure KRA PIN, VAT parameters, and alert email',
    category: 'Security',
  },
  view_audit_logs: {
    name: 'Security Audit Trail',
    description: 'Inspect timestamped staff actions and parameter updates',
    category: 'Security',
  },
  access_offline_sync: {
    name: 'Offline Mode & Multi-Till LAN',
    description: 'Process offline transactions and sync to central database',
    category: 'Counter',
  },
};

export const UsersView: React.FC = () => {
  const {
    users,
    currentUser,
    createUser,
    updateUser,
    toggleUserStatus,
    hasPermission,
    switchUser,
    addToast,
  } = usePOS();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [pinCode, setPinCode] = useState('');
  const [phone, setPhone] = useState('+254 7');
  const [email, setEmail] = useState('');

  const canManageUsers = hasPermission('manage_staff_roles') || currentUser.role === 'admin';

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setRole('cashier');
    setPinCode(Math.floor(1000 + Math.random() * 9000).toString());
    setPhone('+254 7');
    setEmail('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setFullName(u.fullName);
    setRole(u.role);
    setPinCode(u.pinCode);
    setPhone(u.phone);
    setEmail(u.email || '');
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser({
        ...editingUser,
        username,
        fullName,
        role,
        pinCode,
        phone,
        email,
      });
      addToast(`Updated user details for ${fullName}`, 'success');
    } else {
      createUser({
        username,
        fullName,
        role,
        pinCode,
        phone,
        email,
        status: 'active',
      });
      addToast(`Created new staff member: ${fullName} (${role})`, 'success');
    }
    setShowAddModal(false);
  };

  const handleQuickSwitch = (u: User) => {
    switchUser(u.id, u.pinCode);
    addToast(`Switched active session to ${u.fullName} (${u.role.toUpperCase()})`, 'info');
  };

  const roleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return (
          <span className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            Store Manager
          </span>
        );
      case 'stock_controller':
        return (
          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            Stock Controller
          </span>
        );
      case 'cashier':
        return (
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            Cashier
          </span>
        );
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>Staff Accounts &amp; Role-Based Access Control (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage employee credentials, security PINs, and enforce granular module authorization.
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        )}
      </div>

      {/* Role Testing Simulator (1-Click Tester) */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Role Testing Simulator (Instant User Switch)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Current: <strong>{currentUser.fullName}</strong> ({currentUser.role.toUpperCase()})
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Click any role below to test real-time UI permission restrictions (e.g. Dashboard lockout for Cashier, price edit lockout for Stock Controller):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {users.map((u) => {
            const isMe = u.id === currentUser.id;
            return (
              <button
                key={u.id}
                onClick={() => handleQuickSwitch(u)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                  isMe
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-bold uppercase ${isMe ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'}`}>
                    {u.role.replace('_', ' ')}
                  </span>
                  {isMe && <UserCheck className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="font-semibold text-xs mt-1 truncate w-full">{u.fullName}</span>
                <span className={`text-[10px] font-mono mt-0.5 ${isMe ? 'text-amber-200' : 'text-slate-400'}`}>
                  PIN: {u.pinCode}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u) => {
          const isMe = u.id === currentUser.id;
          return (
            <div
              key={u.id}
              className={`p-5 bg-white dark:bg-slate-900 border rounded-2xl shadow-xs space-y-3 transition ${
                isMe ? 'border-amber-500/60 ring-1 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 font-bold flex items-center justify-center text-sm">
                    {u.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{u.fullName}</span>
                      {isMe && <span className="text-[10px] text-amber-600 font-semibold">(Active Session)</span>}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">@{u.username}</span>
                  </div>
                </div>
                <div>{roleBadge(u.role)}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>PIN: <strong className="font-mono">{u.pinCode}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{u.phone}</span>
                </div>
                {u.email && (
                  <div className="col-span-2 flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{u.email}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="capitalize font-medium text-slate-500">{u.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  {!isMe && (
                    <button
                      onClick={() => handleQuickSwitch(u)}
                      className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-md font-medium transition"
                    >
                      Login As
                    </button>
                  )}
                  {canManageUsers && !isMe && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 text-slate-400 hover:text-amber-600 rounded"
                        title="Edit Staff Member"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`text-xs px-2 py-0.5 rounded font-medium transition ${
                          u.status === 'active'
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Granular RBAC Permissions Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Granular Role-Based Access Control (RBAC) Matrix (17 Permissions)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            System Security Constitution
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          This matrix strictly enforces module visibility, pricing edits, purchase approvals, and inventory modifications across the Osutua POS engine.
        </p>

        <div className="overflow-x-auto text-xs border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Permission &amp; Capability</th>
                <th className="py-2.5 px-3">Scope Category</th>
                <th className="py-2.5 px-3 text-center">Administrator</th>
                <th className="py-2.5 px-3 text-center">Store Manager</th>
                <th className="py-2.5 px-3 text-center">Stock Controller</th>
                <th className="py-2.5 px-3 text-center">Cashier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {(Object.keys(PERMISSION_CONFIG) as PermissionKey[]).map((key) => {
                const conf = PERMISSION_CONFIG[key];
                const adminAllowed = ROLE_PERMISSIONS.admin[key];
                const managerAllowed = ROLE_PERMISSIONS.manager[key];
                const stockAllowed = ROLE_PERMISSIONS.stock_controller[key];
                const cashierAllowed = ROLE_PERMISSIONS.cashier[key];

                return (
                  <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-2 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {conf.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{conf.description}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                        {conf.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      {adminAllowed ? (
                        <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      {managerAllowed ? (
                        <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="text-red-500 dark:text-red-400 inline-flex items-center gap-1 justify-center">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      {stockAllowed ? (
                        <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      {cashierAllowed ? (
                        <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Account Creation / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {editingUser ? 'Edit Staff Profile' : 'Register New Employee'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Samuel Kiptoo"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. samuel"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg capitalize text-slate-900 dark:text-slate-100"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="stock_controller">Stock Controller</option>
                    <option value="manager">Store Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    4-Digit Security PIN *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-mono text-base font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@osutua.co.ke"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {editingUser ? 'Save Updates' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
