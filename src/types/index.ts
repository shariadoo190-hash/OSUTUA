export type UserRole = 'admin' | 'manager' | 'cashier' | 'stock_controller';

export type PermissionKey =
  | 'access_admin_dashboard'
  | 'manage_pricing'
  | 'manage_catalog'
  | 'process_sales'
  | 'manage_inventory'
  | 'create_purchases'
  | 'approve_purchases'
  | 'receive_goods'
  | 'manage_suppliers'
  | 'manage_supplier_payments'
  | 'manage_expenses'
  | 'authorize_refunds'
  | 'view_reports'
  | 'manage_staff_roles'
  | 'manage_system_settings'
  | 'view_audit_logs'
  | 'access_offline_sync';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  pinCode: string; // 4-digit PIN for quick cashier switch & overrides
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Brand {
  id: string;
  name: string;
  country: string;
  description?: string;
}

export type PackagingUnitType = 'bottle' | 'can' | 'crate' | 'carton' | 'pack';

export interface PackagingUnitOption {
  unit: PackagingUnitType;
  factor: number; // e.g. 1 for bottle, 24 for crate of 24, 6 for pack of 6
  sellingPrice: number; // KES price when bought in this unit
  barcode?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  brandId: string;
  volume: string; // e.g. "750ml", "1 Litre", "330ml"
  abv: string; // Alcohol By Volume e.g. "40%", "4.2%"
  purchaseCost: number; // KES per base unit (bottle/can)
  sellingPrice: number; // KES per base unit
  stockQuantity: number; // in base units
  minStockLevel: number;
  packagingUnits: PackagingUnitOption[];
  status: 'active' | 'archived';
  isFastMoving?: boolean;
}

export type StockMovementType =
  | 'sale'
  | 'purchase_received'
  | 'adjustment'
  | 'damage_expired'
  | 'return_refund'
  | 'opening_stock';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  movementType: StockMovementType;
  quantity: number; // negative for sales/damages, positive for receipts/returns
  unitCost: number;
  unitPrice?: number;
  userId: string;
  userName: string;
  reason: string;
  timestamp: string;
  referenceNo?: string;
}

export interface CartItem {
  id: string; // unique cart line ID
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  volume: string;
  unit: PackagingUnitType;
  unitFactor: number;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discountAmount: number; // discount per line
  lineTotal: number;
}

export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'bank_transfer';

export interface PaymentBreakdown {
  method: PaymentMethod;
  amount: number;
  reference?: string; // M-Pesa transaction code or Bank auth code
  phone?: string;
  verified?: boolean;
}

export interface SaleTransaction {
  id: string;
  receiptNo: string;
  date: string; // ISO string
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  payments: PaymentBreakdown[];
  changeDue: number;
  status: 'completed' | 'refunded' | 'partially_refunded';
  customerName?: string;
  customerPhone?: string;
  syncStatus: 'synced' | 'pending_local_sync';
  offlineMode: boolean;
  notes?: string;
}

export interface HeldOrder {
  id: string;
  orderLabel: string;
  createdAt: string;
  items: CartItem[];
  cashierId: string;
  cashierName: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  kraPin?: string;
  paymentTerms: 'cash' | 'net15' | 'net30' | 'consignment';
  balancePayable: number;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: 'draft' | 'approved' | 'partially_received' | 'fully_received' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface GoodsReceiptItem {
  productId: string;
  productName: string;
  deliveredQty: number;
  damagedQty: number;
  acceptedQty: number;
  unitCost: number;
}

export interface GoodsReceipt {
  id: string;
  receiptNo: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  date: string;
  receivedByUserId: string;
  receivedByName: string;
  items: GoodsReceiptItem[];
  totalReceivedValue: number;
  deliveryNoteNo?: string;
  notes?: string;
}

export interface SupplierPayment {
  id: string;
  voucherNo: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'bank_transfer' | 'mpesa_paybill' | 'cheque' | 'cash';
  referenceNo: string;
  recordedBy: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'electricity_water'
  | 'licenses_permits'
  | 'salaries_wages'
  | 'transport_logistics'
  | 'security'
  | 'packaging'
  | 'maintenance'
  | 'marketing'
  | 'other';

export interface Expense {
  id: string;
  expenseNo: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  recordedBy: string;
  date: string;
}

export interface RefundItem {
  productId: string;
  productName: string;
  returnQty: number;
  refundAmount: number;
  restock: boolean;
  condition: 'good' | 'damaged';
}

export interface Refund {
  id: string;
  refundNo: string;
  originalReceiptNo: string;
  saleId: string;
  date: string;
  items: RefundItem[];
  totalRefundAmount: number;
  reason: string;
  refundMethod: PaymentMethod;
  authorizedBy: string;
  cashierName: string;
}

export interface CashierShift {
  id: string;
  shiftNo: string;
  cashierId: string;
  cashierName: string;
  registerName: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCashCount?: number;
  expectedCash?: number;
  cashDifference?: number;
  totalSalesCash: number;
  totalSalesMpesa: number;
  totalSalesCard: number;
  totalSalesBank: number;
  totalRefundsCash: number;
  totalTransactions: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  module: string;
  action: string;
  previousValue?: string;
  updatedValue?: string;
  reason?: string;
}

export interface LowStockAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  suggestedReorder: number;
  unitCost: number;
  supplierName: string;
  supplierEmail?: string;
  severity: 'out_of_stock' | 'critical' | 'low';
  triggeredAt: string;
  emailSent?: boolean;
  emailSentAt?: string;
  emailRecipient?: string;
}

export interface SentEmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderQuantity: number;
  sentAt: string;
  status: 'delivered' | 'queued';
}

export interface SystemSettings {
  businessName: string;
  branch: string;
  phone: string;
  email: string;
  address: string;
  kraPin: string;
  currency: 'KES';
  timezone: string;
  vatRate: number; // e.g. 16
  vatInclusive: boolean;
  receiptWidth: '58mm' | '80mm';
  receiptHeaderMsg: string;
  receiptFooterMsg: string;
  lowStockThresholdDefault: number;
  managerOverridePin: string;
  alertEmailRecipient: string;
  autoSendLowStockAlerts: boolean;
  reorderMultiplier: number;
  supabaseUrl: string;
  supabaseKey: string;
  lanServerUrl: string;
}

// Granular RBAC Permissions Map definition
export const ROLE_PERMISSIONS: Record<UserRole, Record<PermissionKey, boolean>> = {
  admin: {
    access_admin_dashboard: true,
    manage_pricing: true,
    manage_catalog: true,
    process_sales: true,
    manage_inventory: true,
    create_purchases: true,
    approve_purchases: true,
    receive_goods: true,
    manage_suppliers: true,
    manage_supplier_payments: true,
    manage_expenses: true,
    authorize_refunds: true,
    view_reports: true,
    manage_staff_roles: true,
    manage_system_settings: true,
    view_audit_logs: true,
    access_offline_sync: true,
  },
  manager: {
    access_admin_dashboard: true,
    manage_pricing: true,
    manage_catalog: true,
    process_sales: true,
    manage_inventory: true,
    create_purchases: true,
    approve_purchases: true,
    receive_goods: true,
    manage_suppliers: true,
    manage_supplier_payments: true,
    manage_expenses: true,
    authorize_refunds: true,
    view_reports: true,
    manage_staff_roles: false, // Only Administrator can manage users & roles
    manage_system_settings: false, // Only Administrator can modify core system settings
    view_audit_logs: true,
    access_offline_sync: true,
  },
  cashier: {
    access_admin_dashboard: false, // Barred from admin dashboard
    manage_pricing: false, // Cannot alter selling or cost prices
    manage_catalog: false, // Cannot add or edit catalogue items
    process_sales: true, // Primary role: POS checkout, shifts, customer receipts
    manage_inventory: false, // Cannot perform manual adjustments
    create_purchases: false,
    approve_purchases: false,
    receive_goods: false,
    manage_suppliers: false,
    manage_supplier_payments: false,
    manage_expenses: false,
    authorize_refunds: false, // Must request manager override PIN
    view_reports: false,
    manage_staff_roles: false,
    manage_system_settings: false,
    view_audit_logs: false,
    access_offline_sync: true,
  },
  stock_controller: {
    access_admin_dashboard: false, // Barred from financial dashboard
    manage_pricing: false, // Cannot alter selling prices or margins
    manage_catalog: true, // Can register bottle volumes, packaging units & barcodes
    process_sales: false, // Focuses purely on warehouse and receiving
    manage_inventory: true, // Full inventory tracking, adjustments & reconciliation
    create_purchases: true, // Can generate restock requisitions
    approve_purchases: false, // Requires manager/admin approval
    receive_goods: true, // Physical delivery verification and stock intake
    manage_suppliers: true, // Supplier records & delivery contacts
    manage_supplier_payments: false, // Cannot disburse financial settlements
    manage_expenses: false,
    authorize_refunds: false,
    view_reports: false, // Financial P&L restricted to management
    manage_staff_roles: false,
    manage_system_settings: false,
    view_audit_logs: true,
    access_offline_sync: true,
  },
};
