const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all products with category info
router.get('/', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.name
        `);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET product by ID
router.get('/:id', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
        `, [req.params.id]);
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(products[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET product by code
router.get('/code/:code', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.product_code = ?
        `, [req.params.code]);
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(products[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SEARCH products by name
router.get('/search/:query', async (req, res) => {
    try {
        const searchTerm = `%${req.params.query}%`;
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.name LIKE ? OR p.product_code LIKE ?
            ORDER BY p.name
        `, [searchTerm, searchTerm]);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET products by category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.category_id = ?
            ORDER BY p.name
        `, [req.params.categoryId]);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new product
router.post('/', async (req, res) => {
    try {
        const { product_code, name, category_id, price, stock_quantity } = req.body;
        if (!product_code || !name || !price) {
            return res.status(400).json({ error: 'Product code, name, and price are required' });
        }
        const [result] = await db.query(
            'INSERT INTO products (product_code, name, category_id, price, stock_quantity) VALUES (?, ?, ?, ?, ?)',
            [product_code, name, category_id, price, stock_quantity || 0]
        );
        res.status(201).json({
            id: result.insertId,
            product_code,
            name,
            category_id,
            price,
            stock_quantity,
            message: 'Product created successfully'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Product code already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// PUT update product
router.put('/:id', async (req, res) => {
    try {
        const { product_code, name, category_id, price, stock_quantity } = req.body;
        const [result] = await db.query(
            'UPDATE products SET product_code = ?, name = ?, category_id = ?, price = ?, stock_quantity = ? WHERE id = ?',
            [product_code, name, category_id, price, stock_quantity, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH update stock quantity
router.patch('/:id/stock', async (req, res) => {
    try {
        const { quantity } = req.body;
        if (quantity === undefined) {
            return res.status(400).json({ error: 'Quantity is required' });
        }
        const [result] = await db.query(
            'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [quantity, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Stock updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE product
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;