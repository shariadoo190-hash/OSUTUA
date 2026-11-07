import React, { useState } from 'react';
import {
  FileText,
  Plus,
  CheckCircle,
  Truck,
  PackageCheck,
  X,
  Search,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { PurchaseOrder } from '../types';

export const PurchasesView: React.FC = () => {
  const {
    purchaseOrders,
    suppliers,
    products,
    createPurchaseOrder,
    approvePurchaseOrder,
    hasPermission,
    setActiveView,
  } = usePOS();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<Array<{ productId: string; orderedQty: number; unitCost: number }>>([
    { productId: products[0]?.id || '', orderedQty: 24, unitCost: products[0]?.purchaseCost || 2000 },
  ]);

  const canApprove = hasPermission('purchases');

  const handleAddItem = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    setPoItems([...poItems, { productId: firstProd.id, orderedQty: 12, unitCost: firstProd.purchaseCost }]);
  };

  const handleRemoveItem = (index: number) => {
    if (poItems.length <= 1) return;
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || poItems.length === 0) return;
    createPurchaseOrder(selectedSupplierId, poItems, poNotes);
    setShowCreateModal(false);
    setPoNotes('');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <span>Supplier Purchase Orders</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create restock orders, review supplier costs, and track incoming delivery fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('receiving')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 rounded-lg text-xs font-medium"
          >
            <PackageCheck className="w-4 h-4 text-emerald-600" /> Receive Goods (GRN)
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create Purchase Order
          </button>
        </div>
      </div>

      {/* PO List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Items Ordered</th>
                <th className="py-3 px-3 text-right">Total Cost (KES)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchaseOrders.map((po) => {
                const totalOrderedBottles = po.items.reduce((s, i) => s + i.orderedQty, 0);
                const totalReceivedBottles = po.items.reduce((s, i) => s + i.receivedQty, 0);

                return (
                  <tr key={po.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold font-mono text-slate-900 dark:text-slate-100">
                      {po.orderNo}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {po.supplierName}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{po.date}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      <div>{po.items.length} line items</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {totalReceivedBottles}/{totalOrderedBottles} btls delivered
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold font-mono-numbers text-slate-900 dark:text-amber-400">
                      KES {po.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          po.status === 'fully_received'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : po.status === 'partially_received'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : po.status === 'approved'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {po.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {po.status === 'draft' && canApprove && (
                          <button
                            onClick={() => approvePurchaseOrder(po.id)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold"
                          >
                            Approve PO
                          </button>
                        )}
                        {(po.status === 'approved' || po.status === 'partially_received') && (
                          <button
                            onClick={() => setActiveView('receiving')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1"
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> Receive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                New Purchase Order
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Supplier *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Terms: {s.paymentTerms.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Order Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                  >
                    + Add Product Line
                  </button>
                </div>

                {poItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg"
                  >
                    <div className="col-span-6">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const prod = products.find((p) => p.id === pId);
                          const updated = [...poItems];
                          updated[idx] = {
                            ...updated[idx],
                            productId: pId,
                            unitCost: prod?.purchaseCost || 0,
                          };
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                      >
                        {products.filter((p) => p.status !== 'archived').map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.volume})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={item.orderedQty}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx] = { ...updated[idx], orderedQty: parseInt(e.target.value, 10) || 1 };
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center font-mono"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Cost"
                        value={item.unitCost}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx] = { ...updated[idx], unitCost: parseFloat(e.target.value) || 0 };
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                      />
                    </div>

                    <div className="col-span-1 text-right">
                      {poItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="text-right font-bold text-slate-900 dark:text-amber-400 pt-1 text-sm font-mono-numbers">
                  Estimated Total: KES{' '}
                  {poItems.reduce((s, i) => s + i.orderedQty * i.unitCost, 0).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  PO Notes / Delivery Instructions
                </label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Deliver before Friday 4pm"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
