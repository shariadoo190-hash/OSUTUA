import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  X,
  CreditCard,
  Building,
  Zap,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ExpenseCategory, PaymentMethod } from '../types';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, hasPermission } = usePOS();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('electricity_water');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [reference, setReference] = useState('');

  const canAdd = hasPermission('expenses');

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCat !== 'all' && e.category !== selectedCat) return false;
      const q = search.toLowerCase().trim();
      return (
        !q ||
        e.description.toLowerCase().includes(q) ||
        e.expenseNo.toLowerCase().includes(q) ||
        (e.reference && e.reference.toLowerCase().includes(q))
      );
    });
  }, [expenses, selectedCat, search]);

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount) || 0;
    if (val <= 0 || !description.trim()) return;

    addExpense(category, description.trim(), val, paymentMethod, reference.trim() || undefined);
    setShowAddModal(false);
    setDescription('');
    setAmount('');
    setReference('');
  };

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'rent':
        return <Building className="w-4 h-4 text-amber-600" />;
      case 'electricity_water':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      case 'transport_logistics':
        return <Truck className="w-4 h-4 text-emerald-500" />;
      case 'salaries_wages':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <span>Operational Expense Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track overhead costs including rent, power, liquor licenses, packaging, and store wages.
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" /> Record New Expense
          </button>
        )}
      </div>

      {/* Filter and Summary */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by description, voucher #, or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg capitalize text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Expense Categories</option>
              <option value="rent">Rent Premises</option>
              <option value="electricity_water">Electricity &amp; Water</option>
              <option value="licenses_permits">Licenses &amp; Permits</option>
              <option value="salaries_wages">Salaries &amp; Wages</option>
              <option value="transport_logistics">Transport &amp; Logistics</option>
              <option value="security">Security</option>
              <option value="packaging">Packaging Bags/Cartons</option>
              <option value="maintenance">Maintenance</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other Overhead</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>Found {filteredExpenses.length} entries</span>
          <span className="font-bold text-red-600 dark:text-red-400 font-mono-numbers">
            Total Outflow: KES {totalExpenseAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Expense No</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Method / Ref</th>
                <th className="py-3 px-3 text-right">Amount (KES)</th>
                <th className="py-3 px-4 text-right">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {exp.expenseNo}
                  </td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{exp.date}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 capitalize font-medium text-slate-800 dark:text-slate-200">
                      {getCategoryIcon(exp.category)}
                      <span>{exp.category.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100 max-w-sm">
                    {exp.description}
                  </td>
                  <td className="py-3 px-3 capitalize">
                    <div>{exp.paymentMethod}</div>
                    {exp.reference && <div className="text-[10px] text-slate-400 font-mono">{exp.reference}</div>}
                  </td>
                  <td className="py-3 px-3 text-right font-bold font-mono-numbers text-red-600 dark:text-red-400 text-sm">
                    KES {exp.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">{exp.recordedBy}</td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No operating expenses found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Record Operating Expense
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expense Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg capitalize"
                >
                  <option value="electricity_water">Electricity &amp; Water (KPLC / Tokens)</option>
                  <option value="rent">Shop / Warehouse Rent</option>
                  <option value="licenses_permits">Liquor License &amp; County Permits</option>
                  <option value="salaries_wages">Casual Wages &amp; Staff Salaries</option>
                  <option value="transport_logistics">Transport / Fuel / Delivery</option>
                  <option value="security">Security &amp; Alarms</option>
                  <option value="packaging">Branded Packaging &amp; Paper Bags</option>
                  <option value="maintenance">Display Cooler &amp; POS Maintenance</option>
                  <option value="marketing">Local Advertising &amp; Marketing</option>
                  <option value="other">Miscellaneous Operating Cost</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Payee Details *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenya Power tokens for counter display chiller"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expense Amount (KES) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Disbursement Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg capitalize"
                  >
                    <option value="mpesa">M-Pesa</option>
                    <option value="cash">Cash Out of Till</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Company Debit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Voucher #
                  </label>
                  <input
                    type="text"
                    placeholder="M-Pesa code / Invoice ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
