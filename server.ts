import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'smart_store_inventory_secret_2026_key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://swavimanofficial_db_user:Suman2005@cluster0.z5fimmv.mongodb.net/';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- IN-MEMORY FALLBACK DB & MONGOOSE INTEGRATION ---
let isMongoConnected = false;

// Seed Data & Memory DB
const memoryDb = {
  users: [
    {
      _id: 'usr_admin',
      name: 'Admin User',
      email: 'admin@store.com',
      password: bcrypt.hashSync('admin123', 10),
      role: 'Admin',
      mobile: '+1 800 555 0199',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'usr_staff',
      name: 'Staff Cashier',
      email: 'staff@store.com',
      password: bcrypt.hashSync('staff123', 10),
      role: 'Staff',
      mobile: '+1 800 555 0188',
      status: 'Active',
      createdAt: new Date().toISOString()
    }
  ],
  categories: [
    { _id: 'cat_1', name: 'Electronics', description: 'Gadgets, phones & accessories', status: 'Active', createdAt: new Date().toISOString() },
    { _id: 'cat_2', name: 'Groceries', description: 'Daily essential food items', status: 'Active', createdAt: new Date().toISOString() },
    { _id: 'cat_3', name: 'Apparel', description: 'Clothing and fashionwear', status: 'Active', createdAt: new Date().toISOString() },
    { _id: 'cat_4', name: 'Beverages', description: 'Refreshments & soft drinks', status: 'Active', createdAt: new Date().toISOString() }
  ],
  brands: [
    { _id: 'brd_1', name: 'TechPro', description: 'Premium electronic components', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop', status: 'Active' },
    { _id: 'brd_2', name: 'OrganicFresh', description: 'Farm fresh organic products', logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop', status: 'Active' },
    { _id: 'brd_3', name: 'UrbanStyle', description: 'Trendy modern apparel', logo: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&h=100&fit=crop', status: 'Active' }
  ],
  suppliers: [
    {
      _id: 'sup_1',
      supplierName: 'Global Tech Distributors',
      companyName: 'Global Tech Corp',
      mobile: '+1 987 654 3210',
      email: 'sales@globaltech.com',
      gstNumber: '27AABCU9603R1ZM',
      address: '102 Silicon Valley Way',
      city: 'San Jose',
      state: 'CA',
      pinCode: '95134'
    },
    {
      _id: 'sup_2',
      supplierName: 'AgroFresh WholeSales',
      companyName: 'AgroFresh Pvt Ltd',
      mobile: '+1 888 777 6655',
      email: 'orders@agrofresh.com',
      gstNumber: '29ABCDE1234F1Z5',
      address: '45 Green Park Avenue',
      city: 'Denver',
      state: 'CO',
      pinCode: '80202'
    }
  ],
  customers: [
    {
      _id: 'cust_1',
      customerName: 'Alice Johnson',
      mobile: '+1 555 123 4567',
      email: 'alice@example.com',
      address: '742 Evergreen Terrace',
      loyaltyPoints: 120,
      totalPurchases: 450.00
    },
    {
      _id: 'cust_2',
      customerName: 'Robert Smith',
      mobile: '+1 555 987 6543',
      email: 'robert@example.com',
      address: '12 5th Avenue',
      loyaltyPoints: 340,
      totalPurchases: 1280.50
    },
    {
      _id: 'cust_3',
      customerName: 'Walk-In Customer',
      mobile: 'N/A',
      email: 'walkin@store.com',
      address: 'Store POS counter',
      loyaltyPoints: 0,
      totalPurchases: 0.00
    }
  ],
  products: [
    {
      _id: 'prod_1',
      productName: 'Wireless Noise Cancelling Headphones',
      sku: 'SKU-ELEC-001',
      barcode: '8901234567890',
      category: 'Electronics',
      brand: 'TechPro',
      supplier: 'Global Tech Distributors',
      purchasePrice: 65.00,
      sellingPrice: 119.99,
      gst: 18,
      discount: 10,
      quantity: 42,
      unit: 'Pcs',
      minimumStock: 10,
      maximumStock: 100,
      productDescription: 'High fidelity audio with 30-hr battery life.',
      manufacturingDate: '2026-01-10',
      expiryDate: '',
      productStatus: 'Active',
      productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&fit=crop',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_2',
      productName: 'Smart Fitness Band V4',
      sku: 'SKU-ELEC-002',
      barcode: '8901234567891',
      category: 'Electronics',
      brand: 'TechPro',
      supplier: 'Global Tech Distributors',
      purchasePrice: 22.00,
      sellingPrice: 49.99,
      gst: 18,
      discount: 5,
      quantity: 8, // Low stock alert!
      unit: 'Pcs',
      minimumStock: 15,
      maximumStock: 80,
      productDescription: 'AMOLED display, heart rate monitor, water resistant.',
      manufacturingDate: '2026-02-01',
      expiryDate: '',
      productStatus: 'Active',
      productImage: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&fit=crop',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_3',
      productName: 'Organic Cold Pressed Extra Virgin Olive Oil 1L',
      sku: 'SKU-GROC-001',
      barcode: '8901234567892',
      category: 'Groceries',
      brand: 'OrganicFresh',
      supplier: 'AgroFresh WholeSales',
      purchasePrice: 12.50,
      sellingPrice: 19.99,
      gst: 5,
      discount: 0,
      quantity: 0, // Out of stock alert!
      unit: 'Bottle',
      minimumStock: 10,
      maximumStock: 50,
      productDescription: '100% pure cold pressed Mediterranean olive oil.',
      manufacturingDate: '2025-11-15',
      expiryDate: '2027-11-15',
      productStatus: 'Active',
      productImage: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&fit=crop',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_4',
      productName: 'Classic Cotton Polo Shirt - Navy',
      sku: 'SKU-APP-001',
      barcode: '8901234567893',
      category: 'Apparel',
      brand: 'UrbanStyle',
      supplier: 'Global Tech Distributors',
      purchasePrice: 14.00,
      sellingPrice: 29.99,
      gst: 12,
      discount: 15,
      quantity: 65,
      unit: 'Pcs',
      minimumStock: 12,
      maximumStock: 120,
      productDescription: '100% breathable combed cotton polo shirt.',
      manufacturingDate: '2026-01-05',
      expiryDate: '',
      productStatus: 'Active',
      productImage: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&fit=crop',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_5',
      productName: 'Sparkling Energy Drink 330ml (Pack of 6)',
      sku: 'SKU-BEV-001',
      barcode: '8901234567894',
      category: 'Beverages',
      brand: 'OrganicFresh',
      supplier: 'AgroFresh WholeSales',
      purchasePrice: 4.50,
      sellingPrice: 8.99,
      gst: 18,
      discount: 0,
      quantity: 110,
      unit: 'Pack',
      minimumStock: 20,
      maximumStock: 200,
      productDescription: 'Natural citrus energy drink with B-vitamins.',
      manufacturingDate: '2026-03-01',
      expiryDate: '2026-09-01',
      productStatus: 'Active',
      productImage: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&fit=crop',
      createdAt: new Date().toISOString()
    }
  ],
  purchases: [
    {
      _id: 'pur_101',
      invoiceNumber: 'PUR-2026-001',
      supplier: 'Global Tech Distributors',
      productName: 'Wireless Noise Cancelling Headphones',
      quantity: 20,
      purchasePrice: 65.00,
      gst: 18,
      discount: 5,
      total: 1235.00,
      paymentMode: 'Bank Transfer',
      paymentStatus: 'Paid',
      purchaseDate: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0]
    },
    {
      _id: 'pur_102',
      invoiceNumber: 'PUR-2026-002',
      supplier: 'AgroFresh WholeSales',
      productName: 'Sparkling Energy Drink 330ml (Pack of 6)',
      quantity: 50,
      purchasePrice: 4.50,
      gst: 18,
      discount: 0,
      total: 265.50,
      paymentMode: 'UPI',
      paymentStatus: 'Paid',
      purchaseDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]
    }
  ],
  sales: [
    {
      _id: 'sal_501',
      invoiceNumber: 'INV-2026-1001',
      customerName: 'Alice Johnson',
      customerMobile: '+1 555 123 4567',
      items: [
        { productId: 'prod_1', productName: 'Wireless Noise Cancelling Headphones', quantity: 1, sellingPrice: 119.99, gst: 18, discount: 10, total: 107.99 }
      ],
      subTotal: 119.99,
      gstAmount: 19.43,
      discountAmount: 12.00,
      grandTotal: 127.42,
      paymentMode: 'Card',
      paymentStatus: 'Completed',
      cashier: 'Admin User',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      _id: 'sal_502',
      invoiceNumber: 'INV-2026-1002',
      customerName: 'Robert Smith',
      customerMobile: '+1 555 987 6543',
      items: [
        { productId: 'prod_4', productName: 'Classic Cotton Polo Shirt - Navy', quantity: 2, sellingPrice: 29.99, gst: 12, discount: 15, total: 50.98 },
        { productId: 'prod_5', productName: 'Sparkling Energy Drink 330ml (Pack of 6)', quantity: 1, sellingPrice: 8.99, gst: 18, discount: 0, total: 8.99 }
      ],
      subTotal: 68.97,
      gstAmount: 7.73,
      discountAmount: 9.00,
      grandTotal: 67.70,
      paymentMode: 'UPI',
      paymentStatus: 'Completed',
      cashier: 'Staff Cashier',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
    }
  ],
  stockHistory: [
    {
      _id: 'sth_1',
      productId: 'prod_1',
      productName: 'Wireless Noise Cancelling Headphones',
      type: 'Stock In',
      quantity: 20,
      reason: 'Purchase Order PUR-2026-001 received',
      performedBy: 'Admin User',
      date: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      _id: 'sth_2',
      productId: 'prod_1',
      productName: 'Wireless Noise Cancelling Headphones',
      type: 'Stock Out',
      quantity: 1,
      reason: 'POS Sale INV-2026-1001',
      performedBy: 'Admin User',
      date: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ],
  notifications: [
    { _id: 'notif_1', title: 'Low Stock Alert', message: 'Smart Fitness Band V4 stock is down to 8 pcs (Min: 15)', type: 'warning', read: false, createdAt: new Date().toISOString() },
    { _id: 'notif_2', title: 'Out of Stock Alert', message: 'Organic Cold Pressed Extra Virgin Olive Oil is OUT OF STOCK', type: 'error', read: false, createdAt: new Date().toISOString() },
    { _id: 'notif_3', title: 'New Sale Completed', message: 'Invoice INV-2026-1002 ($67.70) completed by Staff Cashier', type: 'info', read: true, createdAt: new Date().toISOString() }
  ],
  settings: {
    storeName: 'SmartStore Supermarket & Tech',
    storeLogo: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200&h=200&fit=crop',
    address: '100 Innovation Parkway, Suite 400',
    mobile: '+1 (800) 555-STORE',
    email: 'support@smartstore.com',
    gstNumber: '22AAAAA0000A1Z5',
    currency: '$',
    invoicePrefix: 'INV-2026-'
  }
};

// Try connecting to MongoDB Atlas if connection string works
try {
  mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => {
      console.log('Successfully connected to MongoDB Atlas!');
      isMongoConnected = true;
    })
    .catch((err) => {
      console.warn('MongoDB connection fallback: Using memory database engine. Error:', err.message);
      isMongoConnected = false;
    });
} catch (e) {
  console.warn('MongoDB initialization warning:', e);
}

// --- AUTH MIDDLEWARE ---
interface AuthRequest extends express.Request {
  user?: any;
}

const authenticateToken = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access privilege required' });
  }
  next();
};

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = memoryDb.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const validPass = bcrypt.compareSync(password, user.password);
  if (!validPass) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, mobile: user.mobile }
  });
});

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  const user = memoryDb.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User email not found' });
  }
  user.password = bcrypt.hashSync(newPassword, 10);
  res.json({ message: 'Password reset successfully' });
});

// --- DASHBOARD STATS API ---
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const totalProducts = memoryDb.products.length;
  const totalCategories = memoryDb.categories.length;
  const totalStockQty = memoryDb.products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const lowStockProducts = memoryDb.products.filter(p => p.quantity > 0 && p.quantity <= p.minimumStock).length;
  const outOfStockProducts = memoryDb.products.filter(p => p.quantity <= 0).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = memoryDb.sales
    .filter(s => s.createdAt.startsWith(todayStr))
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const monthlySales = memoryDb.sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const purchaseCost = memoryDb.purchases.reduce((acc, p) => acc + p.total, 0);
  const totalRevenue = monthlySales;
  const profit = totalRevenue - (purchaseCost * 0.4); // Estimated gross profit margin calculation

  const customersCount = memoryDb.customers.length;
  const suppliersCount = memoryDb.suppliers.length;

  res.json({
    totalProducts,
    totalCategories,
    totalStockQty,
    lowStockProducts,
    outOfStockProducts,
    todaySales,
    monthlySales,
    totalRevenue,
    purchaseCost,
    profit,
    customersCount,
    suppliersCount
  });
});

// --- PRODUCTS API ---
app.get('/api/products', authenticateToken, (req, res) => {
  res.json(memoryDb.products);
});

app.post('/api/products', authenticateToken, (req: AuthRequest, res) => {
  const newProd = {
    _id: 'prod_' + Date.now(),
    ...req.body,
    quantity: Number(req.body.quantity || 0),
    purchasePrice: Number(req.body.purchasePrice || 0),
    sellingPrice: Number(req.body.sellingPrice || 0),
    gst: Number(req.body.gst || 0),
    discount: Number(req.body.discount || 0),
    minimumStock: Number(req.body.minimumStock || 5),
    maximumStock: Number(req.body.maximumStock || 100),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  memoryDb.products.unshift(newProd);

  // Add stock history log
  memoryDb.stockHistory.unshift({
    _id: 'sth_' + Date.now(),
    productId: newProd._id,
    productName: newProd.productName,
    type: 'Stock In',
    quantity: newProd.quantity,
    reason: 'Initial Product Registration',
    performedBy: req.user?.name || 'User',
    date: new Date().toISOString()
  });

  res.status(201).json(newProd);
});

app.put('/api/products/:id', authenticateToken, (req, res) => {
  const index = memoryDb.products.findIndex(p => p._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  memoryDb.products[index] = {
    ...memoryDb.products[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json(memoryDb.products[index]);
});

app.delete('/api/products/:id', authenticateToken, requireAdmin, (req, res) => {
  memoryDb.products = memoryDb.products.filter(p => p._id !== req.params.id);
  res.json({ message: 'Product deleted successfully' });
});

// --- CATEGORIES API ---
app.get('/api/categories', authenticateToken, (req, res) => {
  res.json(memoryDb.categories);
});

app.post('/api/categories', authenticateToken, (req, res) => {
  const newCat = {
    _id: 'cat_' + Date.now(),
    name: req.body.name,
    description: req.body.description || '',
    status: req.body.status || 'Active',
    createdAt: new Date().toISOString()
  };
  memoryDb.categories.unshift(newCat);
  res.status(201).json(newCat);
});

app.put('/api/categories/:id', authenticateToken, (req, res) => {
  const cat = memoryDb.categories.find(c => c._id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  Object.assign(cat, req.body);
  res.json(cat);
});

app.delete('/api/categories/:id', authenticateToken, requireAdmin, (req, res) => {
  memoryDb.categories = memoryDb.categories.filter(c => c._id !== req.params.id);
  res.json({ message: 'Category deleted' });
});

// --- BRANDS API ---
app.get('/api/brands', authenticateToken, (req, res) => {
  res.json(memoryDb.brands);
});

app.post('/api/brands', authenticateToken, (req, res) => {
  const newBrand = {
    _id: 'brd_' + Date.now(),
    name: req.body.name,
    description: req.body.description || '',
    logo: req.body.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
    status: req.body.status || 'Active'
  };
  memoryDb.brands.unshift(newBrand);
  res.status(201).json(newBrand);
});

// --- SUPPLIERS API ---
app.get('/api/suppliers', authenticateToken, (req, res) => {
  res.json(memoryDb.suppliers);
});

app.post('/api/suppliers', authenticateToken, (req, res) => {
  const newSup = {
    _id: 'sup_' + Date.now(),
    ...req.body
  };
  memoryDb.suppliers.unshift(newSup);
  res.status(201).json(newSup);
});

app.put('/api/suppliers/:id', authenticateToken, (req, res) => {
  const sup = memoryDb.suppliers.find(s => s._id === req.params.id);
  if (!sup) return res.status(404).json({ error: 'Supplier not found' });
  Object.assign(sup, req.body);
  res.json(sup);
});

app.delete('/api/suppliers/:id', authenticateToken, requireAdmin, (req, res) => {
  memoryDb.suppliers = memoryDb.suppliers.filter(s => s._id !== req.params.id);
  res.json({ message: 'Supplier deleted' });
});

// --- CUSTOMERS API ---
app.get('/api/customers', authenticateToken, (req, res) => {
  res.json(memoryDb.customers);
});

app.post('/api/customers', authenticateToken, (req, res) => {
  const newCust = {
    _id: 'cust_' + Date.now(),
    customerName: req.body.customerName,
    mobile: req.body.mobile || 'N/A',
    email: req.body.email || '',
    address: req.body.address || '',
    loyaltyPoints: 10,
    totalPurchases: 0
  };
  memoryDb.customers.unshift(newCust);
  res.status(201).json(newCust);
});

// --- PURCHASES API ---
app.get('/api/purchases', authenticateToken, (req, res) => {
  res.json(memoryDb.purchases);
});

app.post('/api/purchases', authenticateToken, (req: AuthRequest, res) => {
  const { supplier, productName, quantity, purchasePrice, gst, discount, paymentMode, paymentStatus, purchaseDate } = req.body;
  const qty = Number(quantity || 1);
  const price = Number(purchasePrice || 0);
  const gstPct = Number(gst || 0);
  const discPct = Number(discount || 0);

  const rawSub = qty * price;
  const discAmt = (rawSub * discPct) / 100;
  const gstAmt = ((rawSub - discAmt) * gstPct) / 100;
  const total = rawSub - discAmt + gstAmt;

  const newPur = {
    _id: 'pur_' + Date.now(),
    invoiceNumber: 'PUR-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
    supplier,
    productName,
    quantity: qty,
    purchasePrice: price,
    gst: gstPct,
    discount: discPct,
    total: Number(total.toFixed(2)),
    paymentMode: paymentMode || 'Cash',
    paymentStatus: paymentStatus || 'Paid',
    purchaseDate: purchaseDate || new Date().toISOString().split('T')[0]
  };

  memoryDb.purchases.unshift(newPur);

  // Auto-update stock if matching product exists
  const prod = memoryDb.products.find(p => p.productName.toLowerCase() === productName.toLowerCase());
  if (prod) {
    prod.quantity += qty;
    (prod as any).updatedAt = new Date().toISOString();

    memoryDb.stockHistory.unshift({
      _id: 'sth_' + Date.now(),
      productId: prod._id,
      productName: prod.productName,
      type: 'Stock In',
      quantity: qty,
      reason: `Purchase Invoice ${newPur.invoiceNumber}`,
      performedBy: req.user?.name || 'User',
      date: new Date().toISOString()
    });
  }

  // Create Notification
  memoryDb.notifications.unshift({
    _id: 'notif_' + Date.now(),
    title: 'New Purchase Order',
    message: `Received ${qty} pcs of ${productName} (${newPur.invoiceNumber})`,
    type: 'info',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.status(201).json(newPur);
});

// --- POS SALES API ---
app.get('/api/sales', authenticateToken, (req, res) => {
  res.json(memoryDb.sales);
});

app.post('/api/sales', authenticateToken, (req: AuthRequest, res) => {
  const { customerName, customerMobile, items, paymentMode, paymentStatus, subTotal, gstAmount, discountAmount, grandTotal } = req.body;

  const invNumber = memoryDb.settings.invoicePrefix + Math.floor(1000 + Math.random() * 9000);

  const saleRecord = {
    _id: 'sal_' + Date.now(),
    invoiceNumber: invNumber,
    customerName: customerName || 'Walk-In Customer',
    customerMobile: customerMobile || 'N/A',
    items: items || [],
    subTotal: Number(subTotal || 0),
    gstAmount: Number(gstAmount || 0),
    discountAmount: Number(discountAmount || 0),
    grandTotal: Number(grandTotal || 0),
    paymentMode: paymentMode || 'Cash',
    paymentStatus: paymentStatus || 'Completed',
    cashier: req.user?.name || 'Cashier',
    createdAt: new Date().toISOString()
  };

  memoryDb.sales.unshift(saleRecord);

  // Auto reduce stock for sold products & log stock history
  if (Array.isArray(items)) {
    items.forEach(item => {
      const prod = memoryDb.products.find(p => p._id === item.productId || p.productName === item.productName);
      if (prod) {
        prod.quantity = Math.max(0, prod.quantity - (item.quantity || 1));
        (prod as any).updatedAt = new Date().toISOString();

        memoryDb.stockHistory.unshift({
          _id: 'sth_' + Date.now(),
          productId: prod._id,
          productName: prod.productName,
          type: 'Stock Out',
          quantity: item.quantity,
          reason: `POS Sale ${invNumber}`,
          performedBy: req.user?.name || 'Cashier',
          date: new Date().toISOString()
        });

        // Trigger stock alert notification if below threshold
        if (prod.quantity <= prod.minimumStock) {
          memoryDb.notifications.unshift({
            _id: 'notif_' + Date.now(),
            title: prod.quantity === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
            message: `${prod.productName} balance: ${prod.quantity} ${prod.unit}`,
            type: prod.quantity === 0 ? 'error' : 'warning',
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    });
  }

  // Update customer loyalty points & purchases
  if (customerName && customerName !== 'Walk-In Customer') {
    const cust = memoryDb.customers.find(c => c.customerName.toLowerCase() === customerName.toLowerCase());
    if (cust) {
      cust.totalPurchases += saleRecord.grandTotal;
      cust.loyaltyPoints += Math.floor(saleRecord.grandTotal / 10);
    }
  }

  res.status(201).json(saleRecord);
});

// --- STOCK HISTORY & ADJUSTMENT API ---
app.get('/api/stock/history', authenticateToken, (req, res) => {
  res.json(memoryDb.stockHistory);
});

app.post('/api/stock/adjust', authenticateToken, (req: AuthRequest, res) => {
  const { productId, adjustmentType, quantity, reason } = req.body;
  const prod = memoryDb.products.find(p => p._id === productId);
  if (!prod) return res.status(404).json({ error: 'Product not found' });

  const qty = Number(quantity || 0);
  if (['Stock In', 'Returned Stock'].includes(adjustmentType)) {
    prod.quantity += qty;
  } else if (['Stock Out', 'Damaged Stock', 'Stock Transfer'].includes(adjustmentType)) {
    prod.quantity = Math.max(0, prod.quantity - qty);
  }

  const historyItem = {
    _id: 'sth_' + Date.now(),
    productId: prod._id,
    productName: prod.productName,
    type: adjustmentType,
    quantity: qty,
    reason: reason || 'Manual Stock Adjustment',
    performedBy: req.user?.name || 'User',
    date: new Date().toISOString()
  };

  memoryDb.stockHistory.unshift(historyItem);
  res.json({ message: 'Stock adjusted successfully', product: prod, history: historyItem });
});

// --- NOTIFICATIONS API ---
app.get('/api/notifications', authenticateToken, (req, res) => {
  res.json(memoryDb.notifications);
});

app.put('/api/notifications/read-all', authenticateToken, (req, res) => {
  memoryDb.notifications.forEach(n => n.read = true);
  res.json({ message: 'All notifications marked as read' });
});

// --- SETTINGS API ---
app.get('/api/settings', authenticateToken, (req, res) => {
  res.json(memoryDb.settings);
});

app.put('/api/settings', authenticateToken, requireAdmin, (req, res) => {
  memoryDb.settings = { ...memoryDb.settings, ...req.body };
  res.json(memoryDb.settings);
});

// --- STAFF / USERS MANAGEMENT API ---
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  const safeUsers = memoryDb.users.map(u => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    mobile: u.mobile,
    status: u.status,
    createdAt: u.createdAt
  }));
  res.json(safeUsers);
});

app.post('/api/users', authenticateToken, requireAdmin, (req, res) => {
  const { name, email, password, role, mobile } = req.body;
  if (memoryDb.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const newUser = {
    _id: 'usr_' + Date.now(),
    name,
    email,
    password: bcrypt.hashSync(password || 'password123', 10),
    role: role || 'Staff',
    mobile: mobile || '',
    status: 'Active',
    createdAt: new Date().toISOString()
  };

  memoryDb.users.push(newUser);
  res.status(201).json({
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    status: newUser.status
  });
});

// --- VITE DEV / PRODUCTION HANDLER ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Store Inventory System listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
