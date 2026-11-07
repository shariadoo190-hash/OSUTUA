import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Clock,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  X,
  AlertTriangle,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product, PackagingUnitType, PaymentBreakdown, PaymentMethod } from '../types';
import { ThermalReceipt } from '../components/ThermalReceipt';

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    updateCartItemQty,
    updateCartItemUnit,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTotal,
    cartTax,
    orderDiscount,
    setOrderDiscount,
    heldOrders,
    holdCurrentOrder,
    recallHeldOrder,
    deleteHeldOrder,
    completeSale,
    lastCompletedSale,
    setLastCompletedSale,
    currentShift,
    openShift,
    isOnline,
  } = usePOS();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);

  // Hold order input
  const [holdLabel, setHoldLabel] = useState('');

  // Discount input
  const [tempDiscount, setTempDiscount] = useState<string>('');

  // Shift opening float input
  const [openingFloat, setOpeningFloat] = useState<string>('5000');
  const [registerName, setRegisterName] = useState<string>('Counter POS 01');

  // Payment states
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
  const [primaryMethod, setPrimaryMethod] = useState<PaymentMethod>('mpesa');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [mpesaCode, setMpesaCode] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [cardRef, setCardRef] = useState<string>('');
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitMpesa, setSplitMpesa] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');

  // Focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status === 'archived') return false;
      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Barcode quick scan handler: if search query exactly matches product barcode, add to cart
  const handleBarcodeOrEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim();
      const exactBarcode = products.find((p) => p.barcode === q || p.sku.toLowerCase() === q.toLowerCase());
      if (exactBarcode) {
        addToCart(exactBarcode, 'bottle', 1);
        setSearchQuery('');
        return;
      }
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0], 'bottle', 1);
        setSearchQuery('');
      }
    }
  };

  // Open Payment dialog
  const handleInitiatePayment = () => {
    if (cart.length === 0) return;
    setCashTendered(cartTotal.toString());
    setSplitCash(Math.floor(cartTotal / 2).toString());
    setSplitMpesa((cartTotal - Math.floor(cartTotal / 2)).toString());
    setMpesaCode(`Q${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setShowPaymentModal(true);
  };

  // Calculate change due for cash
  const cashAmountNum = parseFloat(cashTendered) || 0;
  const cashChangeDue = Math.max(0, cashAmountNum - cartTotal);

  // Submit Completed Sale
  const handleFinalizeSale = () => {
    const payments: PaymentBreakdown[] = [];

    if (paymentMode === 'single') {
      if (primaryMethod === 'cash') {
        payments.push({
          method: 'cash',
          amount: cashAmountNum,
        });
      } else if (primaryMethod === 'mpesa') {
        payments.push({
          method: 'mpesa',
          amount: cartTotal,
          reference: mpesaCode.trim() || undefined,
          phone: customerPhone.trim() || undefined,
          verified: true,
        });
      } else if (primaryMethod === 'card') {
        payments.push({
          method: 'card',
          amount: cartTotal,
          reference: cardRef.trim() || `CRD-${Date.now().toString().slice(-4)}`,
        });
      } else {
        payments.push({
          method: 'bank_transfer',
          amount: cartTotal,
          reference: cardRef.trim() || undefined,
        });
      }
    } else {
      // Split payments
      const c = parseFloat(splitCash) || 0;
      const m = parseFloat(splitMpesa) || 0;
      const d = parseFloat(splitCard) || 0;

      if (c > 0) payments.push({ method: 'cash', amount: c });
      if (m > 0) payments.push({ method: 'mpesa', amount: m, reference: mpesaCode.trim() || undefined, phone: customerPhone.trim() || undefined, verified: true });
      if (d > 0) payments.push({ method: 'card', amount: d, reference: cardRef.trim() || undefined });
    }

    const sale = completeSale(
      payments,
      customerName.trim() || undefined,
      customerPhone.trim() || undefined,
      checkoutNotes.trim() || undefined
    );

    if (sale) {
      setShowPaymentModal(false);
      // Reset forms
      setSearchQuery('');
      setCustomerName('');
      setCustomerPhone('');
      setCheckoutNotes('');
    }
  };

  return (
    <div className="h-[calc(100vh-61px)] flex flex-col lg:flex-row overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* LEFT AREA: Product Catalog & Fast Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200 dark:border-slate-800">
        {/* Top Controls: Search Bar & Barcode Scan Input */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products by name, SKU or scan barcode (Press Enter)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeOrEnter}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
              />
              <Barcode className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Shift warning / quick status */}
            {!currentShift && (
              <button
                onClick={() => setShowOpenShiftModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold whitespace-nowrap transition"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Open Shift Float
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Products ({products.filter((p) => p.status !== 'archived').length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id && p.status !== 'archived').length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stockQuantity <= 0;
              const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.minStockLevel;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product, 'bottle', 1)}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all text-left group select-none ${
                    isOutOfStock
                      ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/60 hover:shadow-md cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-mono">{product.sku}</span>
                      <span className="font-medium text-slate-500 dark:text-slate-400">{product.volume}</span>
                    </div>

                    {/* Product Name */}
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {product.name}
                    </h4>
                  </div>

                  <div>
                    {/* Packaging Units Badges */}
                    {product.packagingUnits.length > 1 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.packagingUnits.map((u, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isOutOfStock) addToCart(product, u.unit, 1);
                            }}
                            className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition"
                          >
                            +1 {u.unit} (KES {u.sellingPrice.toLocaleString()})
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Price and Stock Indicator */}
                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">RETAIL</span>
                        <span className="text-sm font-bold text-slate-950 dark:text-amber-400 font-mono-numbers">
                          KES {product.sellingPrice.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">STOCK</span>
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            isOutOfStock
                              ? 'text-red-500'
                              : isLowStock
                              ? 'text-amber-500'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isOutOfStock ? 'Out of stock' : `${product.stockQuantity} btls`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No products found matching &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline"
              >
                Reset catalog filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT AREA: Shopping Cart & Tender Checkout */}
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-white dark:bg-slate-900 flex flex-col h-full border-t lg:border-t-0 border-slate-200 dark:border-slate-800 shadow-lg">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Current Sale Cart
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {cart.length} item{cart.length === 1 ? '' : 's'} · {cart.reduce((s, i) => s + i.quantity, 0)} units
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {heldOrders.length > 0 && (
              <button
                onClick={() => setShowHeldOrdersModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 rounded-lg transition"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Held ({heldOrders.length})</span>
              </button>
            )}

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                title="Clear Cart"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cart Items Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const availableUnits = product?.packagingUnits || [{ unit: item.unit, factor: 1, sellingPrice: item.unitPrice }];

            return (
              <div
                key={item.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.productName}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>KES {item.unitPrice.toLocaleString()} / {item.unit}</span>
                      {item.discountAmount > 0 && (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          -KES {item.discountAmount}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                  {/* Packaging Unit Selector */}
                  <select
                    value={item.unit}
                    onChange={(e) => updateCartItemUnit(item.id, e.target.value as PackagingUnitType)}
                    className="text-[11px] py-1 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 capitalize focus:outline-hidden"
                  >
                    {availableUnits.map((u, i) => (
                      <option key={i} value={u.unit}>
                        {u.unit} ({u.factor}x)
                      </option>
                    ))}
                  </select>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs tabular-nums text-slate-900 dark:text-slate-100">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItemQty(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <span className="text-xs font-bold font-mono-numbers text-slate-900 dark:text-amber-400">
                    KES {item.lineTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-center px-4">
              <Receipt className="w-12 h-12 mb-3 opacity-25" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cart is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Click any product from catalog or scan a barcode to begin customer sale.
              </p>
            </div>
          )}
        </div>

        {/* Cart Summary & Action Buttons */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                KES {cartSubtotal.toLocaleString()}
              </span>
            </div>

            {orderDiscount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Order Discount:</span>
                <span className="font-semibold tabular-nums">-KES {orderDiscount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>VAT (16% Included):</span>
              <span className="tabular-nums">KES {cartTax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-950 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total Payable:</span>
              <span className="font-mono-numbers text-amber-600 dark:text-amber-400">
                KES {cartTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Action Bar: Hold Sale / Apply Discount */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                setHoldLabel(`Order #${heldOrders.length + 1}`);
                setShowHoldModal(true);
              }}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-40 transition"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Hold Sale
            </button>
            <button
              onClick={() => {
                setTempDiscount(orderDiscount.toString());
                setShowDiscountModal(true);
              }}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-40 transition"
            >
              <Tag className="w-3.5 h-3.5 text-slate-500" /> Discount
            </button>
          </div>

          {/* Primary Checkout Button */}
          <button
            onClick={handleInitiatePayment}
            disabled={cart.length === 0}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition transform active:scale-[0.99]"
          >
            <CreditCard className="w-4 h-4" />
            <span>TENDER PAYMENT (KES {cartTotal.toLocaleString()})</span>
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL (Module 7: Multiple Payment Methods) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Accept Customer Payment
                </h3>
                <p className="text-xs text-slate-500">
                  Total Due: <strong className="text-slate-900 dark:text-amber-400 font-mono-numbers">KES {cartTotal.toLocaleString()}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode: Single vs Split Payment */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPaymentMode('single')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                    paymentMode === 'single'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Single Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('split')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                    paymentMode === 'split'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Split Tender (Cash + M-Pesa / Card)
                </button>
              </div>

              {/* SINGLE PAYMENT METHOD SELECTOR */}
              {paymentMode === 'single' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrimaryMethod('mpesa')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                        primaryMethod === 'mpesa'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mb-1 text-emerald-600" />
                      <span>M-Pesa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrimaryMethod('cash')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                        primaryMethod === 'cash'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Banknote className="w-5 h-5 mb-1 text-amber-600" />
                      <span>Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrimaryMethod('card')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                        primaryMethod === 'card'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mb-1 text-blue-600" />
                      <span>Bank Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrimaryMethod('bank_transfer')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                        primaryMethod === 'bank_transfer'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Receipt className="w-5 h-5 mb-1 text-purple-600" />
                      <span>Bank Transfer</span>
                    </button>
                  </div>

                  {/* Cash Specifics */}
                  {primaryMethod === 'cash' && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Cash Tendered (KES)
                        </label>
                        <input
                          type="number"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="w-full px-3 py-2 text-lg font-bold font-mono-numbers bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      {/* Quick Tender Cash Buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCashTendered(cartTotal.toString())}
                          className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-200 hover:bg-slate-100"
                        >
                          Exact KES {cartTotal.toLocaleString()}
                        </button>
                        {[500, 1000, 2000, 5000, 10000].map((denom) => (
                          <button
                            key={denom}
                            type="button"
                            onClick={() => setCashTendered(denom.toString())}
                            className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-200 hover:bg-slate-100"
                          >
                            KES {denom.toLocaleString()}
                          </button>
                        ))}
                      </div>

                      {/* Change Due Display */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Change Due:</span>
                        <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                          KES {cashChangeDue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* M-Pesa Specifics */}
                  {primaryMethod === 'mpesa' && (
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl space-y-3 border border-emerald-200 dark:border-emerald-800">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          M-Pesa Confirmation Code (Required)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. QGK8192ZZ9"
                          value={mpesaCode}
                          onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 text-sm font-mono font-bold uppercase bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Customer Phone Number (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="0712 345 678"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Prompt verified on Osutua Wines M-Pesa Paybill / Till.</span>
                      </div>
                    </div>
                  )}

                  {/* Card / Bank Transfer Specifics */}
                  {(primaryMethod === 'card' || primaryMethod === 'bank_transfer') && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Terminal Auth Code / Bank Transaction Reference
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. AUTH-918204"
                          value={cardRef}
                          onChange={(e) => setCardRef(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* SPLIT PAYMENT CONTROLS */
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Divide Amount Across Methods:
                  </span>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">Cash Portion (KES):</label>
                    <input
                      type="number"
                      value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">M-Pesa Portion (KES):</label>
                    <input
                      type="number"
                      value={splitMpesa}
                      onChange={(e) => setSplitMpesa(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="M-Pesa code e.g. QGK9128ZZ9"
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                      className="w-full mt-1 px-3 py-1 text-xs font-mono uppercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">Card Portion (KES):</label>
                    <input
                      type="number"
                      value={splitCard}
                      onChange={(e) => setSplitCard(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <span>Total Split Sum:</span>
                    <span className="font-bold tabular-nums">
                      KES {((parseFloat(splitCash) || 0) + (parseFloat(splitMpesa) || 0) + (parseFloat(splitCard) || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Optional Customer Information */}
              <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Sale Notes / Order Ref
                  </label>
                  <input
                    type="text"
                    placeholder="VIP table / Takeaway"
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Complete Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeSale}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CONFIRM &amp; PRINT RECEIPT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOLD ORDER MODAL */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              Park Current Sale
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Save this order temporarily so you can attend to another customer without losing items.
            </p>
            <input
              type="text"
              autoFocus
              value={holdLabel}
              onChange={(e) => setHoldLabel(e.target.value)}
              placeholder="e.g. Customer in Red Cap, Table 4"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowHoldModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  holdCurrentOrder(holdLabel);
                  setShowHoldModal(false);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
              >
                Hold Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECALL HELD ORDERS MODAL */}
      {showHeldOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Parked Held Transactions ({heldOrders.length})
              </h3>
              <button onClick={() => setShowHeldOrdersModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {heldOrders.map((h) => {
                const total = h.items.reduce((s, i) => s + i.lineTotal, 0);
                return (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{h.orderLabel}</h4>
                      <p className="text-[11px] text-slate-500">
                        {h.items.length} items · KES {total.toLocaleString()} · Cashier: {h.cashierName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          recallHeldOrder(h.id);
                          setShowHeldOrdersModal(false);
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-md"
                      >
                        Retrieve
                      </button>
                      <button
                        onClick={() => deleteHeldOrder(h.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DISCOUNT MODAL */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              Apply Order Discount
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter discount amount in Kenyan Shillings (KES) to deduct from total payable.
            </p>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KES</span>
              <input
                type="number"
                autoFocus
                value={tempDiscount}
                onChange={(e) => setTempDiscount(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderDiscount(Math.max(0, parseFloat(tempDiscount) || 0));
                  setShowDiscountModal(false);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPEN SHIFT MODAL */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              Open Cashier Shift
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Record the starting cash float in your till drawer before beginning checkout operations.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Till / Register Name
                </label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Opening Cash Float (KES)
                </label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold font-mono-numbers"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowOpenShiftModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  openShift(registerName, parseFloat(openingFloat) || 0);
                  setShowOpenShiftModal(false);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
              >
                Open Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL RECEIPT DISPLAY MODAL */}
      {lastCompletedSale && (
        <ThermalReceipt
          sale={lastCompletedSale}
          onClose={() => setLastCompletedSale(null)}
        />
      )}
    </div>
  );
};
