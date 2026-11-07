import React, { useState, useMemo } from 'react';
import {
  Wine,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Archive,
  Barcode as BarcodeIcon,
  Check,
  X,
  Layers,
  ArrowUpDown,
  Lock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product, PackagingUnitOption, PackagingUnitType } from '../types';
import { BarcodeModal } from '../components/BarcodeModal';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    brands,
    addProduct,
    updateProduct,
    archiveProduct,
    importProductsCSV,
    exportProductsCSV,
    hasPermission,
    currentUser,
    setActiveView,
  } = usePOS();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodePreviewProduct, setBarcodePreviewProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formVolume, setFormVolume] = useState('750ml');
  const [formAbv, setFormAbv] = useState('40.0%');
  const [formCost, setFormCost] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('12');
  const [formMinStock, setFormMinStock] = useState('6');
  const [formUnits, setFormUnits] = useState<PackagingUnitOption[]>([
    { unit: 'bottle', factor: 1, sellingPrice: 0 },
  ]);

  const canEdit = hasPermission('manage_catalog');
  const canManagePricing = hasPermission('manage_pricing');

  // RBAC GUARD: Cashiers are restricted from catalogue manipulation
  if (!canEdit) {
    return (
      <div className="p-6 lg:p-12 max-w-2xl mx-auto flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Catalogue Management Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Your role (<strong>{currentUser.role.toUpperCase()}</strong>) is designated for till checkout operations. Creating, modifying, or archiving beverage products is reserved for Administrators, Store Managers, and Stock Controllers.
          </p>
        </div>
        <button
          onClick={() => setActiveView('pos')}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <span>Return to POS Till</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;
      if (selectedBrand !== 'all' && p.brandId !== selectedBrand) return false;
      const q = search.toLowerCase().trim();
      return (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
      );
    });
  }, [products, statusFilter, selectedCat, selectedBrand, search]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    const randomSku = `SKU-${Date.now().toString().slice(-6)}`;
    const randomBarcode = `616${Math.floor(100000000 + Math.random() * 900000000)}`;
    setFormSku(randomSku);
    setFormBarcode(randomBarcode);
    setFormCategory(categories[0]?.id || '');
    setFormBrand(brands[0]?.id || '');
    setFormVolume('750ml');
    setFormAbv('40.0%');
    setFormCost('2000');
    setFormPrice('2800');
    setFormStock('12');
    setFormMinStock('6');
    setFormUnits([{ unit: 'bottle', factor: 1, sellingPrice: 2800, barcode: randomBarcode }]);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormCategory(p.categoryId);
    setFormBrand(p.brandId);
    setFormVolume(p.volume);
    setFormAbv(p.abv);
    setFormCost(p.purchaseCost.toString());
    setFormPrice(p.sellingPrice.toString());
    setFormStock(p.stockQuantity.toString());
    setFormMinStock(p.minStockLevel.toString());
    setFormUnits(p.packagingUnits.length > 0 ? p.packagingUnits : [{ unit: 'bottle', factor: 1, sellingPrice: p.sellingPrice }]);
    setShowAddEditModal(true);
  };

  const handleAddUnitOption = () => {
    setFormUnits([
      ...formUnits,
      { unit: 'carton', factor: 6, sellingPrice: (parseFloat(formPrice) || 0) * 5.8 },
    ]);
  };

  const handleRemoveUnitOption = (index: number) => {
    if (formUnits.length <= 1) return;
    setFormUnits(formUnits.filter((_, i) => i !== index));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = canManagePricing
      ? (parseFloat(formCost) || 0)
      : (editingProduct?.purchaseCost ?? (parseFloat(formCost) || 0));
    const price = canManagePricing
      ? (parseFloat(formPrice) || 0)
      : (editingProduct?.sellingPrice ?? (parseFloat(formPrice) || 0));
    const stock = parseInt(formStock, 10) || 0;
    const minStock = parseInt(formMinStock, 10) || 5;

    // Ensure base unit exists & sanitize unit pricing according to RBAC
    const sanitizedUnits: PackagingUnitOption[] = formUnits.map((u, i) => {
      const existingUnit = editingProduct?.packagingUnits.find((eu) => eu.unit === u.unit);
      const unitSellingPrice = canManagePricing
        ? u.sellingPrice
        : existingUnit?.sellingPrice ?? u.sellingPrice;

      return i === 0
        ? { ...u, unit: 'bottle', factor: 1, sellingPrice: price, barcode: formBarcode }
        : { ...u, sellingPrice: unitSellingPrice };
    });

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        categoryId: formCategory,
        brandId: formBrand,
        volume: formVolume,
        abv: formAbv,
        purchaseCost: cost,
        sellingPrice: price,
        stockQuantity: stock,
        minStockLevel: minStock,
        packagingUnits: sanitizedUnits,
      });
    } else {
      addProduct({
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        categoryId: formCategory,
        brandId: formBrand,
        volume: formVolume,
        abv: formAbv,
        purchaseCost: cost,
        sellingPrice: price,
        stockQuantity: stock,
        minStockLevel: minStock,
        packagingUnits: sanitizedUnits,
        status: 'active',
      });
    }

    setShowAddEditModal(false);
  };

  const handleExportCSV = () => {
    const csv = exportProductsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osutua_products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = () => {
    if (!importCsvText.trim()) return;
    const count = importProductsCSV(importCsvText);
    setImportFeedback(`Successfully imported and added ${count} products to catalog.`);
    setTimeout(() => {
      setShowImportModal(false);
      setImportFeedback(null);
      setImportCsvText('');
    }, 1500);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wine className="w-5 h-5 text-amber-600" />
            <span>Product Catalogue &amp; Pricing</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage wines, spirits, packaging conversion units, barcodes, and selling prices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tab Filter */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-500">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          <div className="flex items-center gap-2">
            {(['active', 'all', 'archived'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`capitalize transition ${
                  statusFilter === st ? 'text-amber-600 font-bold underline' : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">Category / Brand</th>
                <th className="py-3 px-3">Barcode / SKU</th>
                <th className="py-3 px-3 text-right">Cost (KES)</th>
                <th className="py-3 px-3 text-right">Retail (KES)</th>
                <th className="py-3 px-3 text-right">Margin</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredProducts.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId)?.name || 'Unassigned';
                const br = brands.find((b) => b.id === p.brandId)?.name || 'Unassigned';
                const margin = p.sellingPrice - p.purchaseCost;
                const marginPct = p.sellingPrice > 0 ? ((margin / p.sellingPrice) * 100).toFixed(0) : '0';
                const isOutOfStock = p.stockQuantity <= 0;
                const isLow = p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{p.volume}</span>
                        <span>·</span>
                        <span>{p.abv}</span>
                        {p.packagingUnits.length > 1 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            +{p.packagingUnits.length - 1} bulk units
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div>{cat}</div>
                      <div className="text-[11px] text-slate-400">{br}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div>{p.barcode}</div>
                      <div className="text-slate-400">{p.sku}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers">
                      {p.purchaseCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-amber-400 font-mono-numbers">
                      {p.sellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                      {marginPct}% (+{margin.toLocaleString()})
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-semibold tabular-nums px-2 py-0.5 rounded text-[11px] ${
                          isOutOfStock
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : isLow
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {p.stockQuantity} btls
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setBarcodePreviewProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                          title="Generate Barcode Shelf Tag"
                        >
                          <BarcodeIcon className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => archiveProduct(p.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                              title={p.status === 'archived' ? 'Archived' : 'Archive Product'}
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </>
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

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingProduct ? 'Edit Product Details' : 'Add New Wine / Spirit Product'}
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Johnnie Walker Double Black 750ml"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Barcode Number (EAN/UPC) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Brand
                  </label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Volume / Size
                  </label>
                  <input
                    type="text"
                    value={formVolume}
                    onChange={(e) => setFormVolume(e.target.value)}
                    placeholder="750ml, 1 Litre, 330ml"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ABV %
                  </label>
                  <input
                    type="text"
                    value={formAbv}
                    onChange={(e) => setFormAbv(e.target.value)}
                    placeholder="40.0%"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                {!canManagePricing && (
                  <div className="md:col-span-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400 flex items-center gap-2 text-xs">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>
                      Pricing Control Restricted: Only Store Managers and Administrators can set or modify purchase costs and selling prices.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Purchase Cost (KES) *</span>
                    {!canManagePricing && <span className="text-[10px] text-slate-400 font-normal">Locked</span>}
                  </label>
                  <input
                    type="number"
                    required
                    disabled={!canManagePricing}
                    readOnly={!canManagePricing}
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Standard Selling Price (KES) *</span>
                    {!canManagePricing && <span className="text-[10px] text-slate-400 font-normal">Locked</span>}
                  </label>
                  <input
                    type="number"
                    required
                    disabled={!canManagePricing}
                    readOnly={!canManagePricing}
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Current Physical Stock (bottles)
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Minimum Stock Alert Level
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* PACKAGING UNITS (Bottle, Crate, Carton, Pack) */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    Packaging Units &amp; Conversion Factors (Module 5)
                  </label>
                  {canManagePricing && (
                    <button
                      type="button"
                      onClick={handleAddUnitOption}
                      className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                    >
                      + Add Bulk Packaging Unit
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {formUnits.map((unitOpt, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-xs"
                    >
                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Unit</label>
                        <select
                          value={unitOpt.unit}
                          disabled={idx === 0}
                          onChange={(e) => {
                            const val = e.target.value as PackagingUnitType;
                            const updated = [...formUnits];
                            updated[idx] = { ...updated[idx], unit: val };
                            setFormUnits(updated);
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded capitalize"
                        >
                          <option value="bottle">Bottle</option>
                          <option value="can">Can</option>
                          <option value="crate">Crate</option>
                          <option value="carton">Carton</option>
                          <option value="pack">Pack</option>
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Factor (Base btls)</label>
                        <input
                          type="number"
                          disabled={idx === 0}
                          value={unitOpt.factor}
                          onChange={(e) => {
                            const updated = [...formUnits];
                            updated[idx] = { ...updated[idx], factor: parseInt(e.target.value, 10) || 1 };
                            setFormUnits(updated);
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                        />
                      </div>

                      <div className="col-span-5">
                        <label className="text-[10px] text-slate-400 block mb-0.5 flex items-center justify-between">
                          <span>Selling Price (KES)</span>
                          {!canManagePricing && <span className="text-[9px] text-slate-400">Locked</span>}
                        </label>
                        <input
                          type="number"
                          disabled={!canManagePricing}
                          readOnly={!canManagePricing}
                          value={unitOpt.sellingPrice}
                          onChange={(e) => {
                            const updated = [...formUnits];
                            updated[idx] = { ...updated[idx], sellingPrice: parseFloat(e.target.value) || 0 };
                            setFormUnits(updated);
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 disabled:opacity-60 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                        />
                      </div>

                      <div className="col-span-1 pt-3 text-right">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUnitOption(idx)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              Import Products via CSV
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Paste CSV text formatted as: <br />
              <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">
                Name,SKU,Barcode,CategoryCode,Volume,ABV,Cost,Price,Stock,MinStock
              </code>
            </p>
            <textarea
              rows={8}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder="Example:&#10;Johnnie Walker Green Label,WKY-JWG-750,5000267014299,WKY,750ml,43%,5400,7200,12,4"
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 mb-3"
            />
            {importFeedback && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
                {importFeedback}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCSV}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
              >
                Import Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Tag Modal */}
      {barcodePreviewProduct && (
        <BarcodeModal
          product={barcodePreviewProduct}
          onClose={() => setBarcodePreviewProduct(null)}
        />
      )}
    </div>
  );
};
