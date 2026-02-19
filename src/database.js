import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.VERCEL
  ? '/tmp/database.db'
  : path.join(__dirname, '..', 'data', 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  // Products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      categoryId TEXT,
      image TEXT,
      stock INTEGER DEFAULT 0,
      isFeatured INTEGER DEFAULT 0,
      status TEXT DEFAULT 'in_stock',
      estimatedDelivery TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate: add missing columns if upgrading existing DB
  db.run(`ALTER TABLE products ADD COLUMN isFeatured INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'in_stock'`, () => {});
  db.run(`ALTER TABLE products ADD COLUMN estimatedDelivery TEXT`, () => {});

  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`ALTER TABLE categories ADD COLUMN slug TEXT`, () => {});

  // Orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      customerEmail TEXT NOT NULL,
      customerPhone TEXT,
      items TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shippingAddress TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Packages table (for tracking)
  db.run(`
    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      trackingId TEXT NOT NULL UNIQUE,
      orderId TEXT,
      status TEXT DEFAULT 'pending',
      shippingRoute TEXT DEFAULT 'sea',
      origin TEXT,
      destination TEXT,
      currentLocation TEXT,
      estimatedDelivery TEXT,
      weight REAL,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id)
    )
  `);

  db.run(`ALTER TABLE packages ADD COLUMN shippingRoute TEXT DEFAULT 'sea'`, () => {});

  // Admin table
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables initialized');
});

export default db;
