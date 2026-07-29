export type UserRole = 'Admin' | 'Staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mobile?: string;
  status?: string;
}

export interface Product {
  _id: string;
  productName: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  supplier: string;
  purchasePrice: number;
  sellingPrice: number;
  gst: number;
  discount: number;
  quantity: number;
  unit: string;
  minimumStock: number;
  maximumStock: number;
  productDescription?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  productStatus: 'Active' | 'Inactive';
  productImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
}

export interface Brand {
  _id: string;
  name: string;
  description: string;
  logo: string;
  status: 'Active' | 'Inactive';
}

export interface Supplier {
  _id: string;
  supplierName: string;
  companyName: string;
  mobile: string;
  email: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface Customer {
  _id: string;
  customerName: string;
  mobile: string;
  email: string;
  address: string;
  loyaltyPoints: number;
  totalPurchases: number;
}

export interface Purchase {
  _id: string;
  invoiceNumber: string;
  supplier: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  gst: number;
  discount: number;
  total: number;
  paymentMode: string;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  purchaseDate: string;
}

export interface POSCartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  customDiscount?: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  gst: number;
  discount: number;
  total: number;
}

export interface Sale {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerMobile: string;
  items: SaleItem[];
  subTotal: number;
  gstAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Split';
  paymentStatus: string;
  cashier: string;
  createdAt: string;
}

export interface StockHistoryItem {
  _id: string;
  productId: string;
  productName: string;
  type: 'Stock In' | 'Stock Out' | 'Stock Transfer' | 'Damaged Stock' | 'Returned Stock' | 'Adjustment';
  quantity: number;
  reason: string;
  performedBy: string;
  date: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  storeLogo: string;
  address: string;
  mobile: string;
  email: string;
  gstNumber: string;
  currency: string;
  invoicePrefix: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalStockQty: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  todaySales: number;
  monthlySales: number;
  totalRevenue: number;
  purchaseCost: number;
  profit: number;
  customersCount: number;
  suppliersCount: number;
}
