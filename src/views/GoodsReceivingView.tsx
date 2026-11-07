import React, { useState } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const GoodsReceivingView: React.FC = () => {
  const { purchaseOrders, goodsReceipts, receiveGoods, setActiveView } = usePOS();

  // Filter approved or partially received POs
  const eligiblePOs = purchaseOrders.filter(
    (p) => p.status === 'approved' || p.status === 'partially_received'
  );

  const [selectedPOId, setSelectedPOId] = useState<string>(eligiblePOs[0]?.id || '');
  const [deliveryNoteNo, setDeliveryNoteNo] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryFeedback, setDeliveryFeedback] = useState<string | null>(null);

  const selectedPO = purchaseOrders.find((p) => p.id === selectedPOId);

  // Delivered quantities mapping
  const [deliveryInputs, setDeliveryInputs] = useState<
    Record<string, { deliveredQty: number; damagedQty: number }>
  >({});

  const handleSetDelivered = (productId: string, val: number) => {
    setDeliveryInputs((prev) => ({
      ...prev,
      [productId]: {
        deliveredQty: val,
        damagedQty: prev[productId]?.damagedQty || 0,
      },
    }));
  };

  const handleSetDamaged = (productId: string, val: number) => {
    setDeliveryInputs((prev) => ({
      ...prev,
      [productId]: {
        deliveredQty: prev[productId]?.deliveredQty ?? 0,
        damagedQty: val,
      },
    }));
  };

  const handleConfirmReceiving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    const receiptItems = selectedPO.items.map((item) => {
      const input = deliveryInputs[item.productId];
      const remainingNeeded = Math.max(0, item.orderedQty - item.receivedQty);
      const deliveredQty = input ? input.deliveredQty : remainingNeeded;
      const damagedQty = input ? input.damagedQty : 0;
      const acceptedQty = Math.max(0, deliveredQty - damagedQty);

      return {
        productId: item.productId,
        productName: item.productName,
        deliveredQty,
        damagedQty,
        acceptedQty,
        unitCost: item.unitCost,
      };
    });

    receiveGoods(
      selectedPO.id,
      deliveryNoteNo || `DN-${Date.now().toString().slice(-6)}`,
      receiptItems,
      deliveryNotes
    );

    setDeliveryFeedback(`Delivery verified! Stock received and inventory balances successfully updated.`);
    setDeliveryNoteNo('');
    setDeliveryNotes('');
    setDeliveryInputs({});
    setTimeout(() => setDeliveryFeedback(null), 3500);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <span>Goods Receiving &amp; Intake (GRN)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Physical stock increases ONLY when deliveries are confirmed and verified here.
          </p>
        </div>

        <button
          onClick={() => setActiveView('purchases')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium"
        >
          View All Purchase Orders <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {deliveryFeedback && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{deliveryFeedback}</span>
        </div>
      )}

      {eligiblePOs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
          <Truck className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No Approved Orders Pending Delivery
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All purchase orders are either fulfilled or in draft status. Create and approve a purchase order to record new goods intake.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PO Selector & Delivery Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Select Approved Purchase Order:
                </label>
                <select
                  value={selectedPOId}
                  onChange={(e) => setSelectedPOId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  {eligiblePOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.orderNo} · {po.supplierName} (KES {po.totalAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Delivery Note / Supplier Invoice # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DN-901844"
                  value={deliveryNoteNo}
                  onChange={(e) => setDeliveryNoteNo(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {selectedPO && (
              <form onSubmit={handleConfirmReceiving} className="space-y-4">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                    Verify Delivered Quantities &amp; Damages:
                  </span>

                  {selectedPO.items.map((item) => {
                    const remainingNeeded = Math.max(0, item.orderedQty - item.receivedQty);
                    const inputDelivered = deliveryInputs[item.productId]?.deliveredQty ?? remainingNeeded;
                    const inputDamaged = deliveryInputs[item.productId]?.damagedQty ?? 0;
                    const accepted = Math.max(0, inputDelivered - inputDamaged);

                    return (
                      <div
                        key={item.productId}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {item.productName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Ordered: {item.orderedQty} btls · Already Received: {item.receivedQty} btls · Remaining: {remainingNeeded} btls
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono-numbers">
                            KES {item.unitCost.toLocaleString()} / btl
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                          <div>
                            <label className="text-[10px] text-slate-500 block">Delivered Qty</label>
                            <input
                              type="number"
                              min={0}
                              value={inputDelivered}
                              onChange={(e) =>
                                handleSetDelivered(item.productId, parseInt(e.target.value, 10) || 0)
                              }
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-center font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-red-500 block">Damaged / Missing</label>
                            <input
                              type="number"
                              min={0}
                              value={inputDamaged}
                              onChange={(e) =>
                                handleSetDamaged(item.productId, parseInt(e.target.value, 10) || 0)
                              }
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900/60 rounded text-center font-bold text-red-600"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                              Accepted Intake
                            </label>
                            <div className="w-full px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded text-center font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                              +{accepted} btls
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Receiving Inspection Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Seals intact, expiry dates verified 2028"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRM DELIVERY &amp; UPDATE INVENTORY</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Past Goods Receipt Vouchers */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              <span>Recent Goods Receipts (GRN)</span>
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {goodsReceipts.map((gr) => (
                <div
                  key={gr.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                >
                  <div className="flex justify-between font-bold">
                    <span className="font-mono text-slate-900 dark:text-slate-100">{gr.receiptNo}</span>
                    <span className="text-emerald-600 font-mono-numbers">
                      +KES {gr.totalReceivedValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <div>Supplier: {gr.supplierName}</div>
                    <div>Delivery Note: {gr.deliveryNoteNo}</div>
                    <div>Received by: {gr.receivedByName}</div>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                    {new Date(gr.date).toLocaleString('en-KE')}
                  </div>
                </div>
              ))}

              {goodsReceipts.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">
                  No goods receiving notes recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
