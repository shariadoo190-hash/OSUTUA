import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  User,
  Category,
  Brand,
  Product,
  PackagingUnitType,
  CartItem,
  PaymentBreakdown,
  SaleTransaction,
  HeldOrder,
  CashierShift,
  Supplier,
  PurchaseOrder,
  GoodsReceipt,
  SupplierPayment,
  Expense,
  Refund,
  RefundItem,
  AuditLog,
  StockMovement,
  SystemSettings,
  ExpenseCategory,
  PaymentMethod,
  ROLE_PERMISSIONS,
  PermissionKey,
  LowStockAlert,
  SentEmailLog,
} from '../types';
import { StorageService } from '../db/storage';

interface POSContextType {
  // Auth
  currentUser: User;
  users: User[];
  switchUser: (userId: string, pinCode?: string) => boolean;
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (user: User) => void;
  toggleUserStatus: (userId: string) => void;
  logout: () => void;
  hasPermission: (moduleOrPermission: PermissionKey | string) => boolean;

  // Catalogue
  products: Product[];
  categories: Category[];
  brands: Brand[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  archiveProduct: (productId: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  addBrand: (brand: Omit<Brand, 'id'>) => void;
  updateBrand: (brand: Brand) => void;
  importProductsCSV: (csv: string) => number;
  exportProductsCSV: () => string;

  // Cart & POS
  cart: CartItem[];
  addToCart: (product: Product, unit?: PackagingUnitType, quantity?: number) => void;
  updateCartItemQty: (cartItemId: string, quantity: number) => void;
  updateCartItemUnit: (cartItemId: string, unit: PackagingUnitType) => void;
  applyItemDiscount: (cartItemId: string, discount: number) => void;
  orderDiscount: number;
  setOrderDiscount: (discount: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTotal: number;
  cartTax: number;
  cartTotalBaseUnits: number;

  // Held Orders
  heldOrders: HeldOrder[];
  holdCurrentOrder: (label: string, notes?: string) => boolean;
  recallHeldOrder: (heldOrderId: string) => void;
  deleteHeldOrder: (heldOrderId: string) => void;

  // Transactions & Receipts
  sales: SaleTransaction[];
  completeSale: (
    payments: PaymentBreakdown[],
    customerName?: string,
    customerPhone?: string,
    notes?: string
  ) => SaleTransaction | null;
  lastCompletedSale: SaleTransaction | null;
  setLastCompletedSale: (sale: SaleTransaction | null) => void;

  // Shifts
  shifts: CashierShift[];
  currentShift: CashierShift | null;
  openShift: (registerName: string, openingCash: number) => void;
  closeShift: (closingCashCount: number, notes?: string) => CashierShift | null;

  // Stock & Inventory
  stockMovements: StockMovement[];
  adjustStock: (productId: string, newStock: number, reason: string, reasonType: 'adjustment' | 'damage_expired') => void;

  // Procurement & Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'balancePayable'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  purchaseOrders: PurchaseOrder[];
  createPurchaseOrder: (
    supplierId: string,
    items: Array<{ productId: string; orderedQty: number; unitCost: number }>,
    notes?: string
  ) => void;
  approvePurchaseOrder: (poId: string) => void;
  goodsReceipts: GoodsReceipt[];
  receiveGoods: (
    purchaseOrderId: string,
    deliveryNoteNo: string,
    items: Array<{ productId: string; deliveredQty: number; damagedQty: number; acceptedQty: number; unitCost: number }>,
    notes?: string
  ) => void;
  supplierPayments: SupplierPayment[];
  recordSupplierPayment: (
    supplierId: string,
    amount: number,
    paymentMethod: 'bank_transfer' | 'mpesa_paybill' | 'cheque' | 'cash',
    referenceNo: string,
    notes?: string
  ) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (
    category: ExpenseCategory,
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => void;

  // Returns & Refunds
  refunds: Refund[];
  processRefund: (
    receiptNo: string,
    items: RefundItem[],
    reason: string,
    refundMethod: PaymentMethod,
    managerPin: string
  ) => boolean;

  // Audit Logs
  auditLogs: AuditLog[];
  logAuditAction: (module: string, action: string, previous?: string, updated?: string, reason?: string) => void;

  // Offline & LAN Sync
  isOnline: boolean;
  offlineQueue: SaleTransaction[];
  isSyncing: boolean;
  syncOfflineQueue: () => Promise<{ success: boolean; syncedCount: number }>;
  lanServerStatus: 'connected' | 'unreachable' | 'idle';
  testLanConnection: () => Promise<boolean>;

  // Real-Time Inventory Alerts & Email Dispatches
  lowStockAlerts: LowStockAlert[];
  sentEmailLogs: SentEmailLog[];
  sendLowStockEmailAlert: (
    alertId: string,
    customRecipient?: string
  ) => Promise<{ success: boolean; message: string; trackingId?: string }>;
  sendBatchLowStockEmailAlerts: (recipient?: string) => Promise<{ success: boolean; sentCount: number }>;

  // AI Store Assistant Drawer
  isAIChatOpen: boolean;
  toggleAIChat: () => void;
  setIsAIChatOpen: (open: boolean) => void;

  // Notification Toasts
  toasts: Array<{ id: string; type: 'success' | 'warning' | 'error' | 'info'; message: string }>;
  addToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // System Settings
  settings: SystemSettings;
  updateSettings: (newSettings: SystemSettings) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // System Data
  const [settings, setSettings] = useState<SystemSettings>(() => StorageService.getSettings());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => StorageService.getCurrentUserId());
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [brands, setBrands] = useState<Brand[]>(() => StorageService.getBrands());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => StorageService.getPurchaseOrders());
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(() => StorageService.getGoodsReceipts());
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => StorageService.getSupplierPayments());
  const [sales, setSales] = useState<SaleTransaction[]>(() => StorageService.getSales());
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => StorageService.getHeldOrders());
  const [shifts, setShifts] = useState<CashierShift[]>(() => StorageService.getShifts());
  const [expenses, setExpenses] = useState<Expense[]>(() => StorageService.getExpenses());
  const [refunds, setRefunds] = useState<Refund[]>(() => StorageService.getRefunds());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => StorageService.getStockMovements());
  const [offlineQueue, setOfflineQueue] = useState<SaleTransaction[]>(() => StorageService.getOfflineQueue());
  const [sentEmailLogs, setSentEmailLogs] = useState<SentEmailLog[]>(() => StorageService.getSentEmails());
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'warning' | 'error' | 'info'; message: string }>>([]);

  // POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);

  // App Navigation & UI
  const [activeView, setActiveView] = useState<string>('pos');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lanServerStatus, setLanServerStatus] = useState<'connected' | 'unreachable' | 'idle'>('idle');

  // Initialize Theme on Mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Monitor Online/Offline Status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync on reconnect if queue has pending items
      if (offlineQueue.length > 0) {
        syncOfflineQueue();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  // Current User
  const currentUser: User = users.find((u) => u.id === currentUserId && u.status === 'active') || users[0];

  // Helper for Audit Logging
  const logAuditAction = useCallback(
    (module: string, action: string, previous?: string, updated?: string, reason?: string) => {
      const newLog: AuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        role: currentUser.role,
        module,
        action,
        previousValue: previous,
        updatedValue: updated,
        reason,
      };
      setAuditLogs((prev) => {
        const updatedLogs = [newLog, ...prev];
        StorageService.saveAuditLogs(updatedLogs);
        return updatedLogs;
      });
    },
    [currentUser]
  );

  // Toast Notification Handlers
  const addToast = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleAIChat = () => setIsAIChatOpen((prev) => !prev);

  // Granular Role-Based Access Control (RBAC) Permission Checker
  const hasPermission = useCallback(
    (moduleOrPermission: PermissionKey | string): boolean => {
      const role = currentUser.role;
      const roleMatrix = ROLE_PERMISSIONS[role];
      if (!roleMatrix) return false;

      // 1. Direct PermissionKey evaluation
      if (moduleOrPermission in roleMatrix) {
        return !!roleMatrix[moduleOrPermission as PermissionKey];
      }

      // 2. Navigation Module & View Aliases
      switch (moduleOrPermission) {
        case 'dashboard':
          return roleMatrix.access_admin_dashboard;
        case 'pricing':
          return roleMatrix.manage_pricing;
        case 'pos':
        case 'shifts':
          return roleMatrix.process_sales;
        case 'sales':
          return roleMatrix.process_sales || roleMatrix.view_reports;
        case 'reports':
          return roleMatrix.view_reports;
        case 'products':
        case 'categories':
          return roleMatrix.manage_catalog;
        case 'inventory':
          return roleMatrix.manage_inventory;
        case 'purchases':
          return roleMatrix.create_purchases || roleMatrix.approve_purchases;
        case 'receiving':
          return roleMatrix.receive_goods;
        case 'suppliers':
          return roleMatrix.manage_suppliers;
        case 'expenses':
          return roleMatrix.manage_expenses;
        case 'refunds':
          return roleMatrix.authorize_refunds;
        case 'audit_logs':
          return roleMatrix.view_audit_logs;
        case 'sync':
          return roleMatrix.access_offline_sync;
        case 'users':
        case 'system_users_admin':
          return roleMatrix.manage_staff_roles;
        case 'settings':
          return roleMatrix.manage_system_settings;
        default:
          return false;
      }
    },
    [currentUser]
  );

  // Real-Time Computed Low-Stock & Out-of-Stock Alerts
  const lowStockAlerts: LowStockAlert[] = useMemo(() => {
    const alerts: LowStockAlert[] = [];
    products.forEach((p) => {
      if (p.status === 'archived') return;
      if (p.stockQuantity <= p.minStockLevel) {
        const severity: 'out_of_stock' | 'critical' | 'low' =
          p.stockQuantity <= 0
            ? 'out_of_stock'
            : p.stockQuantity <= Math.ceil(p.minStockLevel / 2)
            ? 'critical'
            : 'low';
        const mult = settings.reorderMultiplier || 2;
        const suggestedReorder = Math.max(1, p.minStockLevel * mult - Math.max(0, p.stockQuantity));
        const brand = brands.find((b) => b.id === p.brandId);
        const supplier = suppliers[0]; // primary supplier
        const matchingEmail = sentEmailLogs.find((e) => e.sku === p.sku);

        alerts.push({
          id: `alert_${p.id}`,
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          currentStock: p.stockQuantity,
          minStockLevel: p.minStockLevel,
          suggestedReorder,
          unitCost: p.purchaseCost,
          supplierName: supplier?.name || brand?.name || 'Primary Distributor',
          supplierEmail: supplier?.email,
          severity,
          triggeredAt: new Date().toISOString(),
          emailSent: !!matchingEmail,
          emailSentAt: matchingEmail?.sentAt,
          emailRecipient: matchingEmail?.to,
        });
      }
    });

    // Prioritize out of stock, then critical, then low
    return alerts.sort((a, b) => {
      const order = { out_of_stock: 0, critical: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });
  }, [products, brands, suppliers, sentEmailLogs, settings.reorderMultiplier]);

  // Dispatch Email Alert for Low-Stock Reorder
  const sendLowStockEmailAlert = async (
    alertId: string,
    customRecipient?: string
  ): Promise<{ success: boolean; message: string; trackingId?: string }> => {
    const alert = lowStockAlerts.find((a) => a.id === alertId);
    if (!alert) return { success: false, message: 'Alert item not found' };

    const recipient = customRecipient || settings.alertEmailRecipient || 'shariadoo190@gmail.com';
    const severityLabel =
      alert.severity === 'out_of_stock'
        ? 'OUT OF STOCK'
        : alert.severity === 'critical'
        ? 'CRITICAL LOW STOCK'
        : 'LOW STOCK';

    const subject = `[Osutua POS] ${severityLabel}: ${alert.productName} (${alert.currentStock} Remaining)`;
    const body = `OSUTUA WINES AND SPIRITS - AUTOMATED REORDER ADVICE
Product Name: ${alert.productName}
SKU: ${alert.sku}
Current Physical Stock: ${alert.currentStock} units
Safety Threshold: ${alert.minStockLevel} units
Recommended Reorder Quantity: ${alert.suggestedReorder} units
Unit Purchase Cost: KES ${alert.unitCost.toLocaleString()}
Estimated Total Reorder Investment: KES ${(alert.suggestedReorder * alert.unitCost).toLocaleString()}
Preferred Supplier: ${alert.supplierName}

Notice generated automatically by Osutua POS Real-Time Inventory Tracking Engine.
Triggered by: ${currentUser.fullName} (${currentUser.role.toUpperCase()})`;

    try {
      const res = await fetch('/api/alerts/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject,
          body,
          productName: alert.productName,
          sku: alert.sku,
          currentStock: alert.currentStock,
          reorderQuantity: alert.suggestedReorder,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const newLog: SentEmailLog = {
          id: data.trackingId || `EML-${Date.now().toString().slice(-6)}`,
          to: recipient,
          subject,
          body,
          productName: alert.productName,
          sku: alert.sku,
          currentStock: alert.currentStock,
          reorderQuantity: alert.suggestedReorder,
          sentAt: data.sentAt || new Date().toISOString(),
          status: 'delivered',
        };
        const updatedLogs = [newLog, ...sentEmailLogs];
        setSentEmailLogs(updatedLogs);
        StorageService.saveSentEmails(updatedLogs);

        logAuditAction(
          'Inventory Alert',
          'Dispatched Low-Stock Alert Email',
          undefined,
          `Dispatched to ${recipient} for ${alert.productName} (Tracking: ${newLog.id})`
        );
        addToast(`Email alert sent to ${recipient} (${newLog.id})`, 'success');
        return { success: true, message: data.message, trackingId: data.trackingId };
      } else {
        addToast(`Failed to dispatch alert email: ${data.error || 'Server error'}`, 'error');
        return { success: false, message: data.error || 'Failed to dispatch email' };
      }
    } catch (err: any) {
      console.error('Email dispatch error:', err);
      addToast(`Network error sending alert to ${recipient}`, 'error');
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const sendBatchLowStockEmailAlerts = async (recipient?: string): Promise<{ success: boolean; sentCount: number }> => {
    const targetRecipient = recipient || settings.alertEmailRecipient || 'shariadoo190@gmail.com';
    let count = 0;
    for (const alert of lowStockAlerts) {
      const res = await sendLowStockEmailAlert(alert.id, targetRecipient);
      if (res.success) count++;
    }
    if (count > 0) {
      addToast(`Dispatched ${count} stock alert emails to ${targetRecipient}`, 'success');
    }
    return { success: count > 0, sentCount: count };
  };

  // Switch User
  const switchUser = (userId: string, pinCode?: string): boolean => {
    const target = users.find((u) => u.id === userId && u.status === 'active');
    if (!target) return false;
    if (pinCode && target.pinCode !== pinCode) {
      return false;
    }
    setCurrentUserId(target.id);
    StorageService.saveCurrentUserId(target.id);
    logAuditAction('Authentication', 'Cashier Switch', undefined, `Switched to user: ${target.fullName} (${target.role})`);
    return true;
  };

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    StorageService.saveUsers(updated);
    logAuditAction('Users', 'Created User', undefined, `Created user ${newUser.fullName} (${newUser.role})`);
  };

  const updateUser = (user: User) => {
    const updated = users.map((u) => (u.id === user.id ? user : u));
    setUsers(updated);
    StorageService.saveUsers(updated);
    logAuditAction('Users', 'Updated User', undefined, `Updated user ${user.fullName}`);
  };

  const toggleUserStatus = (userId: string) => {
    const updated = users.map((u) =>
      u.id === userId ? { ...u, status: u.status === 'active' ? ('inactive' as const) : ('active' as const) } : u
    );
    setUsers(updated);
    StorageService.saveUsers(updated);
    logAuditAction('Users', 'Toggled User Status', undefined, `User ID: ${userId}`);
  };

  const logout = () => {
    // Switch to first cashier or prompt login
    logAuditAction('Authentication', 'User Logout', undefined, `User ${currentUser.fullName} logged out`);
  };

  // Catalogue Handlers
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod_${Date.now()}`,
    };
    const updated = [newProd, ...products];
    setProducts(updated);
    StorageService.saveProducts(updated);

    // Initial stock movement record
    if (newProd.stockQuantity > 0) {
      const movement: StockMovement = {
        id: `sm_${Date.now()}`,
        productId: newProd.id,
        productName: newProd.name,
        movementType: 'opening_stock',
        quantity: newProd.stockQuantity,
        unitCost: newProd.purchaseCost,
        unitPrice: newProd.sellingPrice,
        userId: currentUser.id,
        userName: currentUser.fullName,
        reason: 'New product creation initial stock',
        timestamp: new Date().toISOString(),
        referenceNo: newProd.sku,
      };
      const updatedMovements = [movement, ...stockMovements];
      setStockMovements(updatedMovements);
      StorageService.saveStockMovements(updatedMovements);
    }

    logAuditAction('Catalogue', 'Added Product', undefined, `${newProd.name} (SKU: ${newProd.sku})`);
  };

  const updateProduct = (product: Product) => {
    const oldProd = products.find((p) => p.id === product.id);
    const updated = products.map((p) => (p.id === product.id ? product : p));
    setProducts(updated);
    StorageService.saveProducts(updated);

    logAuditAction(
      'Catalogue',
      'Updated Product',
      oldProd ? `${oldProd.name} (Price: KES ${oldProd.sellingPrice})` : undefined,
      `${product.name} (Price: KES ${product.sellingPrice})`
    );
  };

  const archiveProduct = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, status: 'archived' as const } : p
    );
    setProducts(updated);
    StorageService.saveProducts(updated);
    logAuditAction('Catalogue', 'Archived Product', undefined, `Product ID: ${productId}`);
  };

  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = { ...catData, id: `cat_${Date.now()}` };
    const updated = [...categories, newCat];
    setCategories(updated);
    StorageService.saveCategories(updated);
    logAuditAction('Categories', 'Added Category', undefined, newCat.name);
  };

  const updateCategory = (category: Category) => {
    const updated = categories.map((c) => (c.id === category.id ? category : c));
    setCategories(updated);
    StorageService.saveCategories(updated);
  };

  const addBrand = (brandData: Omit<Brand, 'id'>) => {
    const newBrand: Brand = { ...brandData, id: `br_${Date.now()}` };
    const updated = [...brands, newBrand];
    setBrands(updated);
    StorageService.saveBrands(updated);
    logAuditAction('Brands', 'Added Brand', undefined, newBrand.name);
  };

  const updateBrand = (brand: Brand) => {
    const updated = brands.map((b) => (b.id === brand.id ? brand : b));
    setBrands(updated);
    StorageService.saveBrands(updated);
  };

  // CSV Import / Export
  const importProductsCSV = (csvText: string): number => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return 0;
    let count = 0;
    const newProds: Product[] = [];

    // Header: Name,SKU,Barcode,CategoryCode,Volume,ABV,Cost,Price,Stock,MinStock
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 8) {
        const [name, sku, barcode, catCode, volume, abv, costStr, priceStr, stockStr, minStockStr] = cols;
        const matchedCat = categories.find((c) => c.code.toLowerCase() === catCode.toLowerCase()) || categories[0];
        const cost = parseFloat(costStr) || 0;
        const price = parseFloat(priceStr) || 0;
        const stock = parseInt(stockStr, 10) || 0;
        const minStock = parseInt(minStockStr, 10) || 5;

        newProds.push({
          id: `prod_${Date.now()}_${i}`,
          name,
          sku: sku || `SKU-${Date.now()}-${i}`,
          barcode: barcode || `${Date.now()}${i}`,
          categoryId: matchedCat.id,
          brandId: brands[0]?.id || 'br_generic',
          volume: volume || '750ml',
          abv: abv || '40.0%',
          purchaseCost: cost,
          sellingPrice: price,
          stockQuantity: stock,
          minStockLevel: minStock,
          packagingUnits: [{ unit: 'bottle', factor: 1, sellingPrice: price, barcode }],
          status: 'active',
        });
        count++;
      }
    }

    if (newProds.length > 0) {
      const merged = [...newProds, ...products];
      setProducts(merged);
      StorageService.saveProducts(merged);
      logAuditAction('Catalogue', 'CSV Bulk Import', undefined, `Imported ${count} products`);
    }
    return count;
  };

  const exportProductsCSV = (): string => {
    const headers = ['Name', 'SKU', 'Barcode', 'Category', 'Volume', 'ABV', 'PurchaseCost', 'SellingPrice', 'StockQty', 'MinStockLevel'];
    const rows = products.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name || '';
      return [
        `"${p.name}"`,
        `"${p.sku}"`,
        `"${p.barcode}"`,
        `"${cat}"`,
        `"${p.volume}"`,
        `"${p.abv}"`,
        p.purchaseCost,
        p.sellingPrice,
        p.stockQuantity,
        p.minStockLevel,
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  };

  // Cart Operations
  const addToCart = (product: Product, unit: PackagingUnitType = 'bottle', quantity = 1) => {
    // Find unit details
    const unitOption = product.packagingUnits.find((u) => u.unit === unit) || {
      unit: 'bottle' as PackagingUnitType,
      factor: 1,
      sellingPrice: product.sellingPrice,
    };

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.productId === product.id && item.unit === unit
      );

      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        const newQty = item.quantity + quantity;
        const newLineTotal = newQty * item.unitPrice - item.discountAmount;

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          lineTotal: Math.max(0, newLineTotal),
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `ci_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          barcode: product.barcode,
          volume: product.volume,
          unit: unitOption.unit,
          unitFactor: unitOption.factor,
          unitPrice: unitOption.sellingPrice,
          costPrice: product.purchaseCost * unitOption.factor,
          quantity,
          discountAmount: 0,
          lineTotal: unitOption.sellingPrice * quantity,
        };
        return [newItem, ...prevCart];
      }
    });
  };

  const updateCartItemQty = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const lineTotal = Math.max(0, quantity * item.unitPrice - item.discountAmount);
          return { ...item, quantity, lineTotal };
        }
        return item;
      })
    );
  };

  const updateCartItemUnit = (cartItemId: string, newUnit: PackagingUnitType) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return item;
          const unitOpt = product.packagingUnits.find((u) => u.unit === newUnit) || {
            unit: newUnit,
            factor: 1,
            sellingPrice: product.sellingPrice,
          };
          const unitPrice = unitOpt.sellingPrice;
          const lineTotal = Math.max(0, item.quantity * unitPrice - item.discountAmount);
          return {
            ...item,
            unit: newUnit,
            unitFactor: unitOpt.factor,
            unitPrice,
            costPrice: product.purchaseCost * unitOpt.factor,
            lineTotal,
          };
        }
        return item;
      })
    );
  };

  const applyItemDiscount = (cartItemId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const lineTotal = Math.max(0, item.quantity * item.unitPrice - discount);
          return { ...item, discountAmount: discount, lineTotal };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setOrderDiscount(0);
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartTotal = Math.max(0, cartSubtotal - orderDiscount);
  // Kenya VAT is 16% inclusive: Tax = Total * 16 / 116
  const cartTax = settings.vatInclusive ? (cartTotal * settings.vatRate) / (100 + settings.vatRate) : 0;
  const cartTotalBaseUnits = cart.reduce((sum, item) => sum + item.quantity * item.unitFactor, 0);

  // Held Orders
  const holdCurrentOrder = (label: string, notes?: string): boolean => {
    if (cart.length === 0) return false;
    const newHeld: HeldOrder = {
      id: `hld_${Date.now()}`,
      orderLabel: label || `Order #${heldOrders.length + 1}`,
      createdAt: new Date().toISOString(),
      items: [...cart],
      cashierId: currentUser.id,
      cashierName: currentUser.fullName,
      notes,
    };
    const updated = [newHeld, ...heldOrders];
    setHeldOrders(updated);
    StorageService.saveHeldOrders(updated);
    clearCart();
    logAuditAction('POS', 'Held Order', undefined, `Order parked: ${newHeld.orderLabel}`);
    return true;
  };

  const recallHeldOrder = (heldOrderId: string) => {
    const found = heldOrders.find((h) => h.id === heldOrderId);
    if (!found) return;
    setCart(found.items);
    deleteHeldOrder(heldOrderId);
    logAuditAction('POS', 'Recalled Held Order', undefined, `Order retrieved: ${found.orderLabel}`);
  };

  const deleteHeldOrder = (heldOrderId: string) => {
    const updated = heldOrders.filter((h) => h.id !== heldOrderId);
    setHeldOrders(updated);
    StorageService.saveHeldOrders(updated);
  };

  // Cashier Shifts
  const currentShift = shifts.find((s) => s.status === 'open' && s.cashierId === currentUser.id) || null;

  const openShift = (registerName: string, openingCash: number) => {
    const newShift: CashierShift = {
      id: `shf_${Date.now()}`,
      shiftNo: `SHF-${new Date().getFullYear()}-${String(shifts.length + 1).padStart(3, '0')}`,
      cashierId: currentUser.id,
      cashierName: currentUser.fullName,
      registerName: registerName || 'Main Register 01',
      startTime: new Date().toISOString(),
      openingCash,
      totalSalesCash: 0,
      totalSalesMpesa: 0,
      totalSalesCard: 0,
      totalSalesBank: 0,
      totalRefundsCash: 0,
      totalTransactions: 0,
      status: 'open',
    };
    const updated = [newShift, ...shifts];
    setShifts(updated);
    StorageService.saveShifts(updated);
    logAuditAction('Shifts', 'Opened Shift', undefined, `Opening float: KES ${openingCash.toLocaleString()} on ${registerName}`);
  };

  const closeShift = (closingCashCount: number, notes?: string): CashierShift | null => {
    if (!currentShift) return null;
    const expectedCash = currentShift.openingCash + currentShift.totalSalesCash - currentShift.totalRefundsCash;
    const cashDifference = closingCashCount - expectedCash;

    const closedShift: CashierShift = {
      ...currentShift,
      endTime: new Date().toISOString(),
      closingCashCount,
      expectedCash,
      cashDifference,
      status: 'closed',
      notes,
    };

    const updated = shifts.map((s) => (s.id === currentShift.id ? closedShift : s));
    setShifts(updated);
    StorageService.saveShifts(updated);

    logAuditAction(
      'Shifts',
      'Closed Shift',
      `Expected Cash: KES ${expectedCash}`,
      `Actual Cash Counted: KES ${closingCashCount} (Variance: KES ${cashDifference})`,
      notes
    );
    return closedShift;
  };

  // Complete Sale (Checkout)
  const completeSale = (
    payments: PaymentBreakdown[],
    customerName?: string,
    customerPhone?: string,
    notes?: string
  ): SaleTransaction | null => {
    if (cart.length === 0) return null;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const changeDue = Math.max(0, totalPaid - cartTotal);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = isOnline ? 'RCP' : 'OFF';
    const receiptNo = `${prefix}-${dateStr}-${randSuffix}`;

    const newSale: SaleTransaction = {
      id: `tx_${Date.now()}_${randSuffix}`,
      receiptNo,
      date: now.toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.fullName,
      shiftId: currentShift?.id,
      items: [...cart],
      subtotal: cartSubtotal,
      discount: orderDiscount,
      taxAmount: cartTax,
      totalAmount: cartTotal,
      payments,
      changeDue,
      status: 'completed',
      customerName,
      customerPhone,
      syncStatus: isOnline ? 'synced' : 'pending_local_sync',
      offlineMode: !isOnline,
      notes,
    };

    // 1. Deduct Stock Immediately
    const productDeductions: Record<string, number> = {};
    const newStockMovements: StockMovement[] = [];

    cart.forEach((item) => {
      const baseUnitsToDeduct = item.quantity * item.unitFactor;
      productDeductions[item.productId] = (productDeductions[item.productId] || 0) + baseUnitsToDeduct;

      newStockMovements.push({
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: item.productId,
        productName: item.productName,
        movementType: 'sale',
        quantity: -baseUnitsToDeduct,
        unitCost: item.costPrice / item.unitFactor,
        unitPrice: item.unitPrice,
        userId: currentUser.id,
        userName: currentUser.fullName,
        reason: `POS Sale Receipt ${receiptNo}`,
        timestamp: now.toISOString(),
        referenceNo: receiptNo,
      });
    });

    const updatedProducts = products.map((prod) => {
      const deduction = productDeductions[prod.id];
      if (deduction) {
        return {
          ...prod,
          stockQuantity: Math.max(0, prod.stockQuantity - deduction),
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    // 2. Append Stock Movements
    const updatedMovements = [...newStockMovements, ...stockMovements];
    setStockMovements(updatedMovements);
    StorageService.saveStockMovements(updatedMovements);

    // 3. Update Sales History
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    StorageService.saveSales(updatedSales);

    // 4. Update Shift Totals if Shift is active
    if (currentShift) {
      let cashTotal = 0;
      let mpesaTotal = 0;
      let cardTotal = 0;
      let bankTotal = 0;

      payments.forEach((p) => {
        if (p.method === 'cash') cashTotal += Math.min(p.amount, cartTotal);
        if (p.method === 'mpesa') mpesaTotal += p.amount;
        if (p.method === 'card') cardTotal += p.amount;
        if (p.method === 'bank_transfer') bankTotal += p.amount;
      });

      const updatedShift: CashierShift = {
        ...currentShift,
        totalSalesCash: currentShift.totalSalesCash + cashTotal,
        totalSalesMpesa: currentShift.totalSalesMpesa + mpesaTotal,
        totalSalesCard: currentShift.totalSalesCard + cardTotal,
        totalSalesBank: currentShift.totalSalesBank + bankTotal,
        totalTransactions: currentShift.totalTransactions + 1,
      };

      const updatedShifts = shifts.map((s) => (s.id === currentShift.id ? updatedShift : s));
      setShifts(updatedShifts);
      StorageService.saveShifts(updatedShifts);
    }

    // 5. Offline Queue Handling
    if (!isOnline) {
      const updatedQueue = [newSale, ...offlineQueue];
      setOfflineQueue(updatedQueue);
      StorageService.saveOfflineQueue(updatedQueue);
    }

    // 6. Audit Log
    logAuditAction(
      'POS',
      'Completed Sale',
      undefined,
      `Receipt ${receiptNo}: KES ${cartTotal.toLocaleString()} (${payments.map((p) => `${p.method}: KES ${p.amount}`).join(', ')})`
    );

    // 7. Check for Low Stock / Out of Stock automated alert dispatch
    if (settings.autoSendLowStockAlerts) {
      updatedProducts.forEach((p) => {
        const prevProd = products.find((oldP) => oldP.id === p.id);
        const prevQty = prevProd ? prevProd.stockQuantity : p.stockQuantity;
        // Trigger if quantity crossed below minStockLevel or hit 0
        if (prevQty > p.minStockLevel && p.stockQuantity <= p.minStockLevel) {
          const recipient = settings.alertEmailRecipient || 'shariadoo190@gmail.com';
          const suggestedReorder = Math.max(1, p.minStockLevel * (settings.reorderMultiplier || 2) - p.stockQuantity);
          fetch('/api/alerts/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: recipient,
              subject: `[Osutua Auto-Alert] Low Stock Reorder Required: ${p.name} (${p.stockQuantity} remaining)`,
              body: `Automated alert triggered after sale ${receiptNo}.\nProduct: ${p.name} (SKU: ${p.sku})\nCurrent Stock: ${p.stockQuantity} units (Safety Level: ${p.minStockLevel})\nSuggested Reorder: ${suggestedReorder} units\nUnit Cost: KES ${p.purchaseCost}`,
              productName: p.name,
              sku: p.sku,
              currentStock: p.stockQuantity,
              reorderQuantity: suggestedReorder,
            }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.success) {
                const autoEmail: SentEmailLog = {
                  id: data.trackingId || `EML-${Date.now().toString().slice(-6)}`,
                  to: recipient,
                  subject: `[Osutua Auto-Alert] Low Stock: ${p.name}`,
                  body: `Auto-alert after sale ${receiptNo}`,
                  productName: p.name,
                  sku: p.sku,
                  currentStock: p.stockQuantity,
                  reorderQuantity: suggestedReorder,
                  sentAt: new Date().toISOString(),
                  status: 'delivered',
                };
                setSentEmailLogs((prev) => {
                  const merged = [autoEmail, ...prev];
                  StorageService.saveSentEmails(merged);
                  return merged;
                });
              }
            })
            .catch(console.error);
        }
      });
    }

    // Set for receipt viewing & clear cart
    setLastCompletedSale(newSale);
    clearCart();
    return newSale;
  };

  // Stock Adjustments
  const adjustStock = (
    productId: string,
    newStock: number,
    reason: string,
    reasonType: 'adjustment' | 'damage_expired'
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const diff = newStock - prod.stockQuantity;
    const updated = products.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p));
    setProducts(updated);
    StorageService.saveProducts(updated);

    const movement: StockMovement = {
      id: `sm_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      movementType: reasonType,
      quantity: diff,
      unitCost: prod.purchaseCost,
      unitPrice: prod.sellingPrice,
      userId: currentUser.id,
      userName: currentUser.fullName,
      reason,
      timestamp: new Date().toISOString(),
      referenceNo: `ADJ-${Date.now().toString().slice(-4)}`,
    };

    const updatedMovements = [movement, ...stockMovements];
    setStockMovements(updatedMovements);
    StorageService.saveStockMovements(updatedMovements);

    logAuditAction(
      'Inventory',
      reasonType === 'damage_expired' ? 'Damaged Stock Written Off' : 'Manual Stock Adjustment',
      `${prod.name}: ${prod.stockQuantity} bottles`,
      `${prod.name}: ${newStock} bottles (Diff: ${diff > 0 ? `+${diff}` : diff})`,
      reason
    );
  };

  // Suppliers & Procurement
  const addSupplier = (supData: Omit<Supplier, 'id' | 'balancePayable'>) => {
    const newSup: Supplier = {
      ...supData,
      id: `sup_${Date.now()}`,
      balancePayable: 0,
    };
    const updated = [...suppliers, newSup];
    setSuppliers(updated);
    StorageService.saveSuppliers(updated);
    logAuditAction('Suppliers', 'Added Supplier', undefined, newSup.name);
  };

  const updateSupplier = (supplier: Supplier) => {
    const updated = suppliers.map((s) => (s.id === supplier.id ? supplier : s));
    setSuppliers(updated);
    StorageService.saveSuppliers(updated);
  };

  const createPurchaseOrder = (
    supplierId: string,
    items: Array<{ productId: string; orderedQty: number; unitCost: number }>,
    notes?: string
  ) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    const poItems = items.map((i) => {
      const prod = products.find((p) => p.id === i.productId);
      return {
        productId: i.productId,
        productName: prod?.name || 'Unknown Product',
        orderedQty: i.orderedQty,
        receivedQty: 0,
        unitCost: i.unitCost,
        totalCost: i.orderedQty * i.unitCost,
      };
    });

    const totalAmount = poItems.reduce((sum, item) => sum + item.totalCost, 0);
    const newPO: PurchaseOrder = {
      id: `po_${Date.now()}`,
      orderNo: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      supplierId,
      supplierName: sup.name,
      date: new Date().toISOString().slice(0, 10),
      status: 'draft',
      items: poItems,
      totalAmount,
      notes,
    };

    const updated = [newPO, ...purchaseOrders];
    setPurchaseOrders(updated);
    StorageService.savePurchaseOrders(updated);
    logAuditAction('Purchases', 'Created Purchase Order', undefined, `${newPO.orderNo} for ${sup.name} (KES ${totalAmount.toLocaleString()})`);
  };

  const approvePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;
    const updated = purchaseOrders.map((p) =>
      p.id === poId
        ? {
            ...p,
            status: 'approved' as const,
            approvedBy: currentUser.fullName,
            approvedAt: new Date().toISOString(),
          }
        : p
    );
    setPurchaseOrders(updated);
    StorageService.savePurchaseOrders(updated);
    logAuditAction('Purchases', 'Approved Purchase Order', undefined, po.orderNo);
  };

  const receiveGoods = (
    purchaseOrderId: string,
    deliveryNoteNo: string,
    receiptItems: Array<{ productId: string; deliveredQty: number; damagedQty: number; acceptedQty: number; unitCost: number }>,
    notes?: string
  ) => {
    const po = purchaseOrders.find((p) => p.id === purchaseOrderId);
    if (!po) return;

    const totalReceivedValue = receiptItems.reduce((sum, item) => sum + item.acceptedQty * item.unitCost, 0);

    const receipt: GoodsReceipt = {
      id: `gr_${Date.now()}`,
      receiptNo: `GRN-${Date.now().toString().slice(-6)}`,
      purchaseOrderId,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      date: new Date().toISOString(),
      receivedByUserId: currentUser.id,
      receivedByName: currentUser.fullName,
      items: receiptItems.map((r) => {
        const prod = products.find((p) => p.id === r.productId);
        return {
          productId: r.productId,
          productName: prod?.name || 'Product',
          deliveredQty: r.deliveredQty,
          damagedQty: r.damagedQty,
          acceptedQty: r.acceptedQty,
          unitCost: r.unitCost,
        };
      }),
      totalReceivedValue,
      deliveryNoteNo,
      notes,
    };

    // 1. Increase stock in products
    const stockIncrements: Record<string, number> = {};
    receiptItems.forEach((r) => {
      stockIncrements[r.productId] = (stockIncrements[r.productId] || 0) + r.acceptedQty;
    });

    const updatedProducts = products.map((prod) => {
      const inc = stockIncrements[prod.id];
      if (inc) {
        return { ...prod, stockQuantity: prod.stockQuantity + inc };
      }
      return prod;
    });
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    // 2. Stock Movements
    const newMovements: StockMovement[] = receiptItems.map((r) => {
      const prod = products.find((p) => p.id === r.productId);
      return {
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: r.productId,
        productName: prod?.name || 'Product',
        movementType: 'purchase_received',
        quantity: r.acceptedQty,
        unitCost: r.unitCost,
        unitPrice: prod?.sellingPrice,
        userId: currentUser.id,
        userName: currentUser.fullName,
        reason: `Goods Received: PO ${po.orderNo} (DN: ${deliveryNoteNo})`,
        timestamp: new Date().toISOString(),
        referenceNo: po.orderNo,
      };
    });

    const updatedMovements = [...newMovements, ...stockMovements];
    setStockMovements(updatedMovements);
    StorageService.saveStockMovements(updatedMovements);

    // 3. Update Purchase Order Status & Items received
    const updatedPOItems = po.items.map((poItem) => {
      const rec = receiptItems.find((r) => r.productId === poItem.productId);
      return {
        ...poItem,
        receivedQty: poItem.receivedQty + (rec ? rec.acceptedQty : 0),
      };
    });

    const allFulfilled = updatedPOItems.every((item) => item.receivedQty >= item.orderedQty);
    const updatedPOs = purchaseOrders.map((p) =>
      p.id === purchaseOrderId
        ? {
            ...p,
            items: updatedPOItems,
            status: allFulfilled ? ('fully_received' as const) : ('partially_received' as const),
          }
        : p
    );
    setPurchaseOrders(updatedPOs);
    StorageService.savePurchaseOrders(updatedPOs);

    // 4. Update Supplier Payable Balance
    const updatedSuppliers = suppliers.map((s) =>
      s.id === po.supplierId ? { ...s, balancePayable: s.balancePayable + totalReceivedValue } : s
    );
    setSuppliers(updatedSuppliers);
    StorageService.saveSuppliers(updatedSuppliers);

    // 5. Append Goods Receipt
    const updatedReceipts = [receipt, ...goodsReceipts];
    setGoodsReceipts(updatedReceipts);
    StorageService.saveGoodsReceipts(updatedReceipts);

    logAuditAction(
      'Goods Receiving',
      'Goods Received and Stock Updated',
      undefined,
      `PO ${po.orderNo} from ${po.supplierName}: +KES ${totalReceivedValue.toLocaleString()} stock received`
    );
  };

  const recordSupplierPayment = (
    supplierId: string,
    amount: number,
    paymentMethod: 'bank_transfer' | 'mpesa_paybill' | 'cheque' | 'cash',
    referenceNo: string,
    notes?: string
  ) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    const payment: SupplierPayment = {
      id: `sp_${Date.now()}`,
      voucherNo: `VCH-${Date.now().toString().slice(-6)}`,
      supplierId,
      supplierName: sup.name,
      amount,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod,
      referenceNo,
      recordedBy: currentUser.fullName,
      notes,
    };

    const updatedSuppliers = suppliers.map((s) =>
      s.id === supplierId ? { ...s, balancePayable: Math.max(0, s.balancePayable - amount) } : s
    );
    setSuppliers(updatedSuppliers);
    StorageService.saveSuppliers(updatedSuppliers);

    const updatedPayments = [payment, ...supplierPayments];
    setSupplierPayments(updatedPayments);
    StorageService.saveSupplierPayments(updatedPayments);

    logAuditAction(
      'Suppliers',
      'Recorded Supplier Payment',
      `Balance was: KES ${sup.balancePayable.toLocaleString()}`,
      `Paid KES ${amount.toLocaleString()} via ${paymentMethod} (Ref: ${referenceNo})`
    );
  };

  // Expenses
  const addExpense = (
    category: ExpenseCategory,
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => {
    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      expenseNo: `EXP-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(3, '0')}`,
      category,
      description,
      amount,
      paymentMethod,
      reference,
      recordedBy: currentUser.fullName,
      date: new Date().toISOString().slice(0, 10),
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    StorageService.saveExpenses(updated);

    logAuditAction('Expenses', 'Recorded Expense', undefined, `${newExpense.expenseNo}: KES ${amount.toLocaleString()} for ${category} - ${description}`);
  };

  // Refunds & Returns
  const processRefund = (
    receiptNo: string,
    items: RefundItem[],
    reason: string,
    refundMethod: PaymentMethod,
    managerPin: string
  ): boolean => {
    // Validate Manager PIN
    const isManagerValid =
      managerPin === settings.managerOverridePin ||
      users.some((u) => (u.role === 'admin' || u.role === 'manager') && u.pinCode === managerPin);

    if (!isManagerValid) {
      return false;
    }

    const sale = sales.find((s) => s.receiptNo.toLowerCase() === receiptNo.toLowerCase());
    const totalRefund = items.reduce((sum, item) => sum + item.refundAmount, 0);

    const refund: Refund = {
      id: `ref_${Date.now()}`,
      refundNo: `REF-${Date.now().toString().slice(-6)}`,
      originalReceiptNo: receiptNo,
      saleId: sale?.id || '',
      date: new Date().toISOString(),
      items,
      totalRefundAmount: totalRefund,
      reason,
      refundMethod,
      authorizedBy: currentUser.fullName,
      cashierName: currentUser.fullName,
    };

    // 1. Restock items if flagged for restock & condition is good
    const restockMap: Record<string, number> = {};
    const refundMovements: StockMovement[] = [];

    items.forEach((item) => {
      if (item.restock && item.condition === 'good') {
        restockMap[item.productId] = (restockMap[item.productId] || 0) + item.returnQty;
      }
      refundMovements.push({
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: item.productId,
        productName: item.productName,
        movementType: 'return_refund',
        quantity: item.returnQty,
        unitCost: 0,
        userId: currentUser.id,
        userName: currentUser.fullName,
        reason: `Refund on ${receiptNo}: ${reason} (${item.condition})`,
        timestamp: new Date().toISOString(),
        referenceNo: refund.refundNo,
      });
    });

    const updatedProducts = products.map((prod) => {
      const restockQty = restockMap[prod.id];
      if (restockQty) {
        return { ...prod, stockQuantity: prod.stockQuantity + restockQty };
      }
      return prod;
    });
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    const updatedMovements = [...refundMovements, ...stockMovements];
    setStockMovements(updatedMovements);
    StorageService.saveStockMovements(updatedMovements);

    // 2. Update Sale Status
    if (sale) {
      const updatedSales = sales.map((s) =>
        s.id === sale.id ? { ...s, status: 'refunded' as const } : s
      );
      setSales(updatedSales);
      StorageService.saveSales(updatedSales);
    }

    // 3. Update active shift if cash refund
    if (currentShift && refundMethod === 'cash') {
      const updatedShift: CashierShift = {
        ...currentShift,
        totalRefundsCash: currentShift.totalRefundsCash + totalRefund,
      };
      const updatedShifts = shifts.map((s) => (s.id === currentShift.id ? updatedShift : s));
      setShifts(updatedShifts);
      StorageService.saveShifts(updatedShifts);
    }

    const updatedRefunds = [refund, ...refunds];
    setRefunds(updatedRefunds);
    StorageService.saveRefunds(updatedRefunds);

    logAuditAction(
      'Refunds',
      'Authorized Refund Processed',
      undefined,
      `${refund.refundNo} for ${receiptNo}: KES ${totalRefund.toLocaleString()} refunded via ${refundMethod}. Reason: ${reason}`
    );
    return true;
  };

  // Offline & LAN Synchronization
  const syncOfflineQueue = async (): Promise<{ success: boolean; syncedCount: number }> => {
    if (offlineQueue.length === 0) return { success: true, syncedCount: 0 };
    setIsSyncing(true);

    try {
      // In real deployment, posts to /api/sync or Supabase
      // Simulate network roundtrip
      await new Promise((resolve) => setTimeout(resolve, 900));

      const count = offlineQueue.length;
      // Mark all sales in queue as synced
      const syncedSaleIds = new Set(offlineQueue.map((s) => s.id));
      const updatedSales = sales.map((s) =>
        syncedSaleIds.has(s.id) ? { ...s, syncStatus: 'synced' as const } : s
      );
      setSales(updatedSales);
      StorageService.saveSales(updatedSales);

      // Clear queue
      setOfflineQueue([]);
      StorageService.saveOfflineQueue([]);

      logAuditAction('Sync', 'Synchronized Offline Transactions', undefined, `Synced ${count} pending transactions to central database.`);
      setIsSyncing(false);
      return { success: true, syncedCount: count };
    } catch (e) {
      console.error('Offline synchronization failed:', e);
      setIsSyncing(false);
      return { success: false, syncedCount: 0 };
    }
  };

  const testLanConnection = async (): Promise<boolean> => {
    try {
      setLanServerStatus('idle');
      const res = await fetch('/api/health');
      if (res.ok) {
        setLanServerStatus('connected');
        return true;
      }
      setLanServerStatus('unreachable');
      return false;
    } catch {
      setLanServerStatus('unreachable');
      return false;
    }
  };

  const updateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    logAuditAction('Settings', 'Updated System Settings', undefined, 'Modified business configuration & parameters');
  };

  return (
    <POSContext.Provider
      value={{
        currentUser,
        users,
        switchUser,
        createUser,
        updateUser,
        toggleUserStatus,
        logout,
        hasPermission,

        products,
        categories,
        brands,
        addProduct,
        updateProduct,
        archiveProduct,
        addCategory,
        updateCategory,
        addBrand,
        updateBrand,
        importProductsCSV,
        exportProductsCSV,

        cart,
        addToCart,
        updateCartItemQty,
        updateCartItemUnit,
        applyItemDiscount,
        orderDiscount,
        setOrderDiscount,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartTotal,
        cartTax,
        cartTotalBaseUnits,

        heldOrders,
        holdCurrentOrder,
        recallHeldOrder,
        deleteHeldOrder,

        sales,
        completeSale,
        lastCompletedSale,
        setLastCompletedSale,

        shifts,
        currentShift,
        openShift,
        closeShift,

        stockMovements,
        adjustStock,

        suppliers,
        addSupplier,
        updateSupplier,
        purchaseOrders,
        createPurchaseOrder,
        approvePurchaseOrder,
        goodsReceipts,
        receiveGoods,
        supplierPayments,
        recordSupplierPayment,

        expenses,
        addExpense,

        refunds,
        processRefund,

        auditLogs,
        logAuditAction,

        isOnline,
        offlineQueue,
        isSyncing,
        syncOfflineQueue,
        lanServerStatus,
        testLanConnection,

        // Real-Time Inventory Alerts & Email Dispatches
        lowStockAlerts,
        sentEmailLogs,
        sendLowStockEmailAlert,
        sendBatchLowStockEmailAlerts,

        // AI Store Assistant
        isAIChatOpen,
        toggleAIChat,
        setIsAIChatOpen,

        // Toasts
        toasts,
        addToast,
        removeToast,

        settings,
        updateSettings,

        activeView,
        setActiveView,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = (): POSContextType => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
