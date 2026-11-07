import {
  User,
  Category,
  Brand,
  Product,
  Supplier,
  SaleTransaction,
  HeldOrder,
  CashierShift,
  Expense,
  AuditLog,
  SystemSettings,
  StockMovement,
  PurchaseOrder,
  GoodsReceipt,
  SupplierPayment,
  Refund,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_EXPENSES,
  INITIAL_SHIFTS,
  INITIAL_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_PURCHASE_ORDERS,
} from './seedData';

const STORAGE_KEYS = {
  SETTINGS: 'osutua_settings_v1',
  USERS: 'osutua_users_v1',
  CATEGORIES: 'osutua_categories_v1',
  BRANDS: 'osutua_brands_v1',
  PRODUCTS: 'osutua_products_v1',
  SUPPLIERS: 'osutua_suppliers_v1',
  PURCHASE_ORDERS: 'osutua_purchase_orders_v1',
  GOODS_RECEIPTS: 'osutua_goods_receipts_v1',
  SUPPLIER_PAYMENTS: 'osutua_supplier_payments_v1',
  SALES: 'osutua_sales_v1',
  HELD_ORDERS: 'osutua_held_orders_v1',
  SHIFTS: 'osutua_shifts_v1',
  EXPENSES: 'osutua_expenses_v1',
  REFUNDS: 'osutua_refunds_v1',
  AUDIT_LOGS: 'osutua_audit_logs_v1',
  STOCK_MOVEMENTS: 'osutua_stock_movements_v1',
  OFFLINE_QUEUE: 'osutua_offline_queue_v1',
  CURRENT_USER_ID: 'osutua_current_user_id_v1',
  SENT_EMAILS: 'osutua_sent_emails_v1',
};

// Safe JSON parse with fallback
function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const StorageService = {
  getSettings(): SystemSettings {
    return getLocalItem<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: SystemSettings): void {
    setLocalItem(STORAGE_KEYS.SETTINGS, settings);
  },

  getUsers(): User[] {
    return getLocalItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },
  saveUsers(users: User[]): void {
    setLocalItem(STORAGE_KEYS.USERS, users);
  },

  getCategories(): Category[] {
    return getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },
  saveCategories(categories: Category[]): void {
    setLocalItem(STORAGE_KEYS.CATEGORIES, categories);
  },

  getBrands(): Brand[] {
    return getLocalItem<Brand[]>(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
  },
  saveBrands(brands: Brand[]): void {
    setLocalItem(STORAGE_KEYS.BRANDS, brands);
  },

  getProducts(): Product[] {
    return getLocalItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },
  saveProducts(products: Product[]): void {
    setLocalItem(STORAGE_KEYS.PRODUCTS, products);
  },

  getSuppliers(): Supplier[] {
    return getLocalItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  },
  saveSuppliers(suppliers: Supplier[]): void {
    setLocalItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  },

  getPurchaseOrders(): PurchaseOrder[] {
    return getLocalItem<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS);
  },
  savePurchaseOrders(pos: PurchaseOrder[]): void {
    setLocalItem(STORAGE_KEYS.PURCHASE_ORDERS, pos);
  },

  getGoodsReceipts(): GoodsReceipt[] {
    return getLocalItem<GoodsReceipt[]>(STORAGE_KEYS.GOODS_RECEIPTS, []);
  },
  saveGoodsReceipts(receipts: GoodsReceipt[]): void {
    setLocalItem(STORAGE_KEYS.GOODS_RECEIPTS, receipts);
  },

  getSupplierPayments(): SupplierPayment[] {
    return getLocalItem<SupplierPayment[]>(STORAGE_KEYS.SUPPLIER_PAYMENTS, []);
  },
  saveSupplierPayments(payments: SupplierPayment[]): void {
    setLocalItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, payments);
  },

  getSales(): SaleTransaction[] {
    return getLocalItem<SaleTransaction[]>(STORAGE_KEYS.SALES, INITIAL_TRANSACTIONS);
  },
  saveSales(sales: SaleTransaction[]): void {
    setLocalItem(STORAGE_KEYS.SALES, sales);
  },

  getHeldOrders(): HeldOrder[] {
    return getLocalItem<HeldOrder[]>(STORAGE_KEYS.HELD_ORDERS, []);
  },
  saveHeldOrders(orders: HeldOrder[]): void {
    setLocalItem(STORAGE_KEYS.HELD_ORDERS, orders);
  },

  getShifts(): CashierShift[] {
    return getLocalItem<CashierShift[]>(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS);
  },
  saveShifts(shifts: CashierShift[]): void {
    setLocalItem(STORAGE_KEYS.SHIFTS, shifts);
  },

  getExpenses(): Expense[] {
    return getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  },
  saveExpenses(expenses: Expense[]): void {
    setLocalItem(STORAGE_KEYS.EXPENSES, expenses);
  },

  getRefunds(): Refund[] {
    return getLocalItem<Refund[]>(STORAGE_KEYS.REFUNDS, []);
  },
  saveRefunds(refunds: Refund[]): void {
    setLocalItem(STORAGE_KEYS.REFUNDS, refunds);
  },

  getAuditLogs(): AuditLog[] {
    return getLocalItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },
  saveAuditLogs(logs: AuditLog[]): void {
    setLocalItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  getStockMovements(): StockMovement[] {
    return getLocalItem<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
  },
  saveStockMovements(movements: StockMovement[]): void {
    setLocalItem(STORAGE_KEYS.STOCK_MOVEMENTS, movements);
  },

  getOfflineQueue(): SaleTransaction[] {
    return getLocalItem<SaleTransaction[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },
  saveOfflineQueue(queue: SaleTransaction[]): void {
    setLocalItem(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  },

  getCurrentUserId(): string {
    return getLocalItem<string>(STORAGE_KEYS.CURRENT_USER_ID, 'usr_admin');
  },
  saveCurrentUserId(id: string): void {
    setLocalItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  getSentEmails(): any[] {
    return getLocalItem<any[]>(STORAGE_KEYS.SENT_EMAILS, []);
  },
  saveSentEmails(emails: any[]): void {
    setLocalItem(STORAGE_KEYS.SENT_EMAILS, emails);
  },

  // Export full backup JSON
  exportBackupJSON(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      business: 'Osutua Wines and Spirits',
      settings: this.getSettings(),
      users: this.getUsers(),
      categories: this.getCategories(),
      brands: this.getBrands(),
      products: this.getProducts(),
      suppliers: this.getSuppliers(),
      purchaseOrders: this.getPurchaseOrders(),
      goodsReceipts: this.getGoodsReceipts(),
      supplierPayments: this.getSupplierPayments(),
      sales: this.getSales(),
      shifts: this.getShifts(),
      expenses: this.getExpenses(),
      refunds: this.getRefunds(),
      auditLogs: this.getAuditLogs(),
      stockMovements: this.getStockMovements(),
    };
    return JSON.stringify(backup, null, 2);
  },

  // Reset to factory defaults
  resetToDefaults(): void {
    localStorage.clear();
    window.location.reload();
  },
};
