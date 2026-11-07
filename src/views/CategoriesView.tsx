import React, { useState } from 'react';
import { Layers, Plus, Wine, Globe, Edit2, X, Check } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Category, Brand } from '../types';

export const CategoriesView: React.FC = () => {
  const { categories, brands, products, addCategory, updateCategory, addBrand, updateBrand, hasPermission } = usePOS();

  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [showCatModal, setShowCatModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Category form
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Brand form
  const [brandName, setBrandName] = useState('');
  const [brandCountry, setBrandCountry] = useState('Kenya');
  const [brandDesc, setBrandDesc] = useState('');

  const canEdit = hasPermission('products');

  const handleOpenCatModal = (c?: Category) => {
    if (c) {
      setEditingCat(c);
      setCatName(c.name);
      setCatCode(c.code);
      setCatDesc(c.description || '');
    } else {
      setEditingCat(null);
      setCatName('');
      setCatCode(`CAT-${Date.now().toString().slice(-3)}`);
      setCatDesc('');
    }
    setShowCatModal(true);
  };

  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    if (editingCat) {
      updateCategory({ ...editingCat, name: catName, code: catCode, description: catDesc });
    } else {
      addCategory({ name: catName, code: catCode, description: catDesc });
    }
    setShowCatModal(false);
  };

  const handleOpenBrandModal = (b?: Brand) => {
    if (b) {
      setEditingBrand(b);
      setBrandName(b.name);
      setBrandCountry(b.country);
      setBrandDesc(b.description || '');
    } else {
      setEditingBrand(null);
      setBrandName('');
      setBrandCountry('Kenya');
      setBrandDesc('');
    }
    setShowBrandModal(true);
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    if (editingBrand) {
      updateBrand({ ...editingBrand, name: brandName, country: brandCountry, description: brandDesc });
    } else {
      addBrand({ name: brandName, country: brandCountry, description: brandDesc });
    }
    setShowBrandModal(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>Category &amp; Brand Taxonomies</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize spirits and wines into distinct classifications and distillery brands.
          </p>
        </div>

        {canEdit && (
          <div>
            {activeTab === 'categories' ? (
              <button
                onClick={() => handleOpenCatModal()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            ) : (
              <button
                onClick={() => handleOpenBrandModal()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Brand
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'categories'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product Categories ({categories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'brands'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wine className="w-4 h-4" />
          <span>Liquor Brands &amp; Wineries ({brands.length})</span>
        </button>
      </div>

      {/* CATEGORIES GRID */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id && p.status !== 'archived').length;
            return (
              <div
                key={cat.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cat.name}</h4>
                      <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        CODE: {cat.code}
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleOpenCatModal(cat)}
                        className="p-1 text-slate-400 hover:text-amber-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {cat.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Products assigned:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {count} products
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BRANDS GRID */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => {
            const count = products.filter((p) => p.brandId === brand.id && p.status !== 'archived').length;
            return (
              <div
                key={brand.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{brand.name}</h4>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>Origin: {brand.country}</span>
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleOpenBrandModal(brand)}
                        className="p-1 text-slate-400 hover:text-amber-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {brand.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {brand.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Bottles registered:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {count} products
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              {editingCat ? 'Edit Product Category' : 'Create Product Category'}
            </h3>
            <form onSubmit={handleSaveCat} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Tequilas &amp; Mezcal"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Code Prefix *
                </label>
                <input
                  type="text"
                  required
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  placeholder="TEQ"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT BRAND MODAL */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              {editingBrand ? 'Edit Brand' : 'Create Brand'}
            </h3>
            <form onSubmit={handleSaveBrand} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Don Julio"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Country of Origin
                </label>
                <input
                  type="text"
                  value={brandCountry}
                  onChange={(e) => setBrandCountry(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
