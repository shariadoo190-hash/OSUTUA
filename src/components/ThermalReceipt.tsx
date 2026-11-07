import React, { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { SaleTransaction } from '../types';
import { usePOS } from '../context/POSContext';

interface ThermalReceiptProps {
  sale: SaleTransaction;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ sale, onClose }) => {
  const { settings } = usePOS();
  const printRef = useRef<HTMLDivElement>(null);

  const is58mm = settings.receiptWidth === '58mm';
  const widthClass = is58mm ? 'max-w-[280px]' : 'max-w-[360px]';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate text receipt download
    const lines = [
      settings.businessName.toUpperCase(),
      settings.branch,
      `Tel: ${settings.phone}`,
      `KRA PIN: ${settings.kraPin}`,
      '================================',
      `RECEIPT: ${sale.receiptNo}`,
      `DATE: ${new Date(sale.date).toLocaleString('en-KE', { timeZone: settings.timezone })}`,
      `CASHIER: ${sale.cashierName}`,
      sale.customerName ? `CUSTOMER: ${sale.customerName} (${sale.customerPhone || ''})` : '',
      '--------------------------------',
      'ITEM             QTY   PRICE   TOTAL',
      '--------------------------------',
      ...sale.items.map(
        (i) =>
          `${i.productName.slice(0, 16).padEnd(16)} ${String(i.quantity).padStart(2)} ${i.unit.slice(0, 3)} ${String(i.unitPrice).padStart(6)} ${String(i.lineTotal).padStart(7)}`
      ),
      '--------------------------------',
      `SUBTOTAL:            KES ${sale.subtotal.toLocaleString()}`,
      sale.discount > 0 ? `DISCOUNT:           -KES ${sale.discount.toLocaleString()}` : '',
      `TOTAL:               KES ${sale.totalAmount.toLocaleString()}`,
      `VAT (16% Incl):      KES ${sale.taxAmount.toFixed(2)}`,
      '--------------------------------',
      'PAYMENT BREAKDOWN:',
      ...sale.payments.map(
        (p) =>
          `${p.method.toUpperCase().padEnd(12)}: KES ${p.amount.toLocaleString()}${p.reference ? ` (${p.reference})` : ''}`
      ),
      sale.changeDue > 0 ? `CHANGE DUE:          KES ${sale.changeDue.toLocaleString()}` : '',
      '================================',
      settings.receiptFooterMsg,
      '*** THANK YOU - KARIBU TENA ***',
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sale.receiptNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Receipt Preview ({settings.receiptWidth})
            </span>
            {sale.offlineMode && (
              <span className="text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                Offline
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print Thermal
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" /> Text
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/60 flex justify-center">
          <div
            id="thermal-receipt-print-area"
            ref={printRef}
            className={`w-full ${widthClass} bg-white text-black p-5 shadow-sm text-xs font-mono-numbers leading-tight border border-slate-200`}
            style={{ minHeight: '400px' }}
          >
            {/* Business Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
              <h2 className="text-base font-bold tracking-tight text-slate-950 uppercase">
                {settings.businessName}
              </h2>
              <p className="text-[11px] text-slate-700">{settings.branch}</p>
              <p className="text-[11px] text-slate-700">{settings.address}</p>
              <p className="text-[11px] text-slate-700">Tel: {settings.phone}</p>
              <p className="text-[11px] font-semibold text-slate-800">KRA PIN: {settings.kraPin}</p>
              <p className="text-[10px] italic text-slate-600 pt-1">{settings.receiptHeaderMsg}</p>
            </div>

            {/* Transaction Metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">RECEIPT NO:</span>
                <span className="font-bold text-slate-950">{sale.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">DATE &amp; TIME:</span>
                <span>{new Date(sale.date).toLocaleString('en-KE', { timeZone: settings.timezone })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">CASHIER:</span>
                <span className="font-medium">{sale.cashierName}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-600">CUSTOMER:</span>
                  <span>{sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-300">
                <span>ITEM / UNIT</span>
                <span>QTY x PRICE</span>
                <span className="text-right">TOTAL</span>
              </div>
              <div className="pt-2 space-y-2">
                {sale.items.map((item) => (
                  <div key={item.id} className="text-[11px]">
                    <div className="font-semibold text-slate-950 truncate">{item.productName}</div>
                    <div className="flex justify-between text-slate-600 text-[10px] pl-1">
                      <span>
                        {item.quantity} {item.unit} @ KES {item.unitPrice.toLocaleString()}
                      </span>
                      {item.discountAmount > 0 && <span className="text-red-600 font-medium">-KES {item.discountAmount}</span>}
                      <span className="font-bold text-slate-900 tabular-nums">KES {item.lineTotal.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Tax Calculation */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">SUBTOTAL:</span>
                <span className="tabular-nums">KES {sale.subtotal.toLocaleString()}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>DISCOUNT:</span>
                  <span className="tabular-nums font-semibold">-KES {sale.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-300 text-slate-950">
                <span>TOTAL AMOUNT:</span>
                <span className="tabular-nums">KES {sale.totalAmount.toLocaleString()}</span>
              </div>
              {settings.vatInclusive && (
                <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>INCL. VAT (16%):</span>
                  <span className="tabular-nums">KES {sale.taxAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Payment Method Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <span className="font-bold text-[10px] text-slate-700 uppercase tracking-wider">Payment Breakdown:</span>
              {sale.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px]">
                  <span className="capitalize font-medium">
                    {p.method === 'mpesa' ? 'M-Pesa' : p.method.replace('_', ' ')}:
                  </span>
                  <span className="font-bold tabular-nums">KES {p.amount.toLocaleString()}</span>
                </div>
              ))}
              {sale.payments.some((p) => p.reference) && (
                <div className="text-[10px] text-slate-600 pt-0.5 space-y-0.5">
                  {sale.payments.filter((p) => p.reference).map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="uppercase">{p.method} REF:</span>
                      <span className="font-mono font-bold text-slate-900">{p.reference}</span>
                    </div>
                  ))}
                </div>
              )}
              {sale.changeDue > 0 && (
                <div className="flex justify-between text-[11px] font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>CHANGE RETURNED:</span>
                  <span className="tabular-nums">KES {sale.changeDue.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Barcode Graphic & Footer Notice */}
            <div className="pt-3 text-center space-y-2">
              {/* Simulated barcode graphic */}
              <div className="flex justify-center items-center gap-[2px] h-8 px-2 overflow-hidden">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-black h-full"
                    style={{ width: i % 3 === 0 ? '3px' : i % 5 === 0 ? '1px' : '2px' }}
                  />
                ))}
              </div>
              <p className="text-[10px] font-mono tracking-widest text-slate-800">{sale.receiptNo}</p>

              <p className="text-[9px] text-slate-600 leading-tight pt-1">
                {settings.receiptFooterMsg}
              </p>
              <p className="text-[10px] font-bold text-slate-900 uppercase pt-0.5">
                Karibu Tena • Welcome Again
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
