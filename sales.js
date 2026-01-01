const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all sales with items
router.get('/', async (req, res) => {
    try {
        const [sales] = await db.query(`
            SELECT s.*, 
                   JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'id', si.id,
                           'product_id', si.product_id,
                           'product_code', si.product_code,
                           'product_name', si.product_name,
                           'quantity', si.quantity,
                           'unit_price', si.unit_price,
                           'subtotal', si.subtotal
                       )
                   ) as items
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            GROUP BY s.id
            ORDER BY s.sale_date DESC
        `);
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET sale by ID
router.get('/:id', async (req, res) => {
    try {
        const [sales] = await db.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
        if (sales.length === 0) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        const [items] = await db.query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);

        res.json({
            ...sales[0],
            items
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET sales statistics
router.get('/stats/dashboard', async (req, res) => {
    try {
        // Total sales count
        const [salesCount] = await db.query('SELECT COUNT(*) as count FROM sales');

        // Total revenue
        const [revenue] = await db.query('SELECT SUM(total_amount) as total FROM sales');

        // Total products
        const [productsCount] = await db.query('SELECT COUNT(*) as count FROM products');

        // Total customers (unique from sales)
        const [customersCount] = await db.query('SELECT COUNT(DISTINCT contact_number) as count FROM sales WHERE contact_number IS NOT NULL');

        // Recent sales
        const [recentSales] = await db.query(`
            SELECT * FROM sales 
            ORDER BY sale_date DESC 
            LIMIT 10
        `);

        res.json({
            totalSales: salesCount[0].count,
            totalRevenue: revenue[0].total || 0,
            totalProducts: productsCount[0].count,
            totalCustomers: customersCount[0].count,
            recentSales
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new sale (with transaction)
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { customer_name, contact_number, payment_method, total_amount, items } = req.body;

        if (!customer_name || !payment_method || !total_amount || !items || items.length === 0) {
            throw new Error('Missing required fields');
        }

        // Insert sale
        const [saleResult] = await connection.query(
            'INSERT INTO sales (customer_name, contact_number, payment_method, total_amount) VALUES (?, ?, ?, ?)',
            [customer_name, contact_number, payment_method, total_amount]
        );

        const saleId = saleResult.insertId;

        // Insert sale items and update stock
        for (const item of items) {
            // Insert sale item
            await connection.query(
                'INSERT INTO sale_items (sale_id, product_id, product_code, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [saleId, item.product_id, item.product_code, item.product_name, item.quantity, item.unit_price, item.subtotal]
            );

            // Update product stock
            await connection.query(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();

        res.status(201).json({
            id: saleId,
            message: 'Sale completed successfully',
            sale_id: saleId
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// DELETE sale (with transaction to restore stock)
router.delete('/:id', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Get sale items to restore stock
        const [items] = await connection.query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);

        // Restore stock for each item
        for (const item of items) {
            await connection.query(
                'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Delete sale (cascade will delete items)
        const [result] = await connection.query('DELETE FROM sales WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            throw new Error('Sale not found');
        }

        await connection.commit();
        res.json({ message: 'Sale deleted successfully' });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;