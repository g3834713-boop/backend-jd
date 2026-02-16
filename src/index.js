import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './database.js';
import { v4 as uuidv4 } from 'crypto';
import bcryptjs from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to generate IDs
const getId = () => Math.random().toString(36).substring(2, 11);

// ============ PRODUCTS ENDPOINTS ============

app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  });
});

app.post('/api/products', (req, res) => {
  const { name, description, price, categoryId, image, stock } = req.body;
  const id = getId();
  
  db.run(
    'INSERT INTO products (id, name, description, price, categoryId, image, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, description, price, categoryId, image, stock || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, name, description, price, categoryId, image, stock });
    }
  );
});

app.put('/api/products/:id', (req, res) => {
  const { name, description, price, categoryId, image, stock } = req.body;
  
  db.run(
    'UPDATE products SET name = ?, description = ?, price = ?, categoryId = ?, image = ?, stock = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [name, description, price, categoryId, image, stock, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, name, description, price, categoryId, image, stock });
    }
  );
});

app.delete('/api/products/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ CATEGORIES ENDPOINTS ============

app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/categories/:id', (req, res) => {
  db.get('SELECT * FROM categories WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Category not found' });
    res.json(row);
  });
});

app.post('/api/categories', (req, res) => {
  const { name, description } = req.body;
  const id = getId();
  
  db.run(
    'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
    [id, name, description],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Category name already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, name, description });
    }
  );
});

app.put('/api/categories/:id', (req, res) => {
  const { name, description } = req.body;
  
  db.run(
    'UPDATE categories SET name = ?, description = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [name, description, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, name, description });
    }
  );
});

app.delete('/api/categories/:id', (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ ORDERS ENDPOINTS ============

app.post('/api/orders', (req, res) => {
  const { customerName, customerEmail, customerPhone, items, totalAmount, shippingAddress } = req.body;
  const id = getId();
  
  db.run(
    'INSERT INTO orders (id, customerName, customerEmail, customerPhone, items, totalAmount, shippingAddress) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, customerName, customerEmail, customerPhone, JSON.stringify(items), totalAmount, shippingAddress],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ 
        id, 
        customerName, 
        customerEmail, 
        customerPhone, 
        items, 
        totalAmount, 
        shippingAddress,
        status: 'pending'
      });
    }
  );
});

app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formattedRows = (rows || []).map(row => ({
      ...row,
      items: JSON.parse(row.items)
    }));
    res.json(formattedRows);
  });
});

app.get('/api/orders/:id', (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Order not found' });
    res.json({
      ...row,
      items: JSON.parse(row.items)
    });
  });
});

// ============ PACKAGES ENDPOINTS ============

app.get('/api/packages', (req, res) => {
  db.all('SELECT * FROM packages ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/packages/track/:trackingId', (req, res) => {
  db.get('SELECT * FROM packages WHERE trackingId = ?', [req.params.trackingId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Package not found' });
    res.json(row);
  });
});

app.post('/api/packages', (req, res) => {
  const { trackingId, orderId, status, origin, destination, weight, notes } = req.body;
  const id = getId();
  
  db.run(
    'INSERT INTO packages (id, trackingId, orderId, status, origin, destination, weight, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, trackingId, orderId, status || 'pending', origin, destination, weight, notes],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Tracking ID already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, trackingId, orderId, status: status || 'pending', origin, destination, weight, notes });
    }
  );
});

app.put('/api/packages/:id', (req, res) => {
  const { status, currentLocation, notes } = req.body;
  
  db.run(
    'UPDATE packages SET status = ?, currentLocation = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [status, currentLocation, notes, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, status, currentLocation, notes });
    }
  );
});

app.delete('/api/packages/:id', (req, res) => {
  db.run('DELETE FROM packages WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ ADMIN AUTHENTICATION ============

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM admins WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isValid = await bcryptjs.compare(password, row.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    res.json({ success: true, email: row.email, name: row.name });
  });
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
