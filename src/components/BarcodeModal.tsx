import React from 'react';
import { Barcode, Printer, X } from 'lucide-react';
import { Product } from '../types';
import { usePOS } from '../context/POSContext';

interface BarcodeModalProps {
  product: Product;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ product, onClose }) => {
  const { settings } = usePOS();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Barcode Shelf Tag Generator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Preview the shelf-edge price tag or bottle sticker barcode for inventory scanning and customer display.
          </p>

          {/* Barcode Tag Preview Card */}
          <div className="border-2 border-slate-900 dark:border-slate-300 bg-white p-4 rounded-lg text-slate-950 flex flex-col items-center text-center shadow-md">
            <span className="text-[10px] tracking-wider font-bold text-amber-700 uppercase">
              {settings.businessName}
            </span>
            <h4 className="text-sm font-bold text-slate-950 mt-1 line-clamp-2">
              {product.name}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-600 my-1 font-medium">
              <span>{product.volume}</span>
              <span>·</span>
              <span>{product.abv}</span>
              <span>·</span>
              <span>SKU: {product.sku}</span>
            </div>

            {/* Generated Barcode Stripes */}
            <div className="flex items-center justify-center gap-[2px] h-12 w-full max-w-[260px] py-1 my-2 overflow-hidden bg-white">
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-black h-full"
                  style={{
                    width: i % 4 === 0 ? '3px' : i % 7 === 0 ? '4px' : i % 2 === 0 ? '1.5px' : '2px',
                  }}
                />
              ))}
            </div>

            <span className="font-mono text-xs font-semibold tracking-widest text-slate-900">
              {product.barcode}
            </span>

            {/* Price Tag */}
            <div className="mt-3 pt-2 border-t border-slate-300 w-full flex justify-between items-baseline px-2">
              <span className="text-xs font-bold text-slate-600">RETAIL PRICE</span>
              <span className="text-xl font-extrabold text-slate-950 font-mono-numbers">
                KES {product.sellingPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Multi-unit pricing summary */}
          {product.packagingUnits.length > 1 && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Bulk Packaging Barcodes:
              </span>
              <div className="space-y-1">
                {product.packagingUnits.map((u, i) => (
                  <div key={i} className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span className="capitalize">{u.unit} ({u.factor}x base):</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                      KES {u.sellingPrice.toLocaleString()} {u.barcode ? `[${u.barcode}]` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print Tag
          </button>
        </div>
      </div>
    </div>
  );
};
