const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all customers
router.get('/', async (req, res) => {
    try {
        const [customers] = await db.query('SELECT * FROM customers ORDER BY name');
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET customer by ID
router.get('/:id', async (req, res) => {
    try {
        const [customers] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (customers.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customers[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SEARCH customers
router.get('/search/:query', async (req, res) => {
    try {
        const searchTerm = `%${req.params.query}%`;
        const [customers] = await db.query(
            'SELECT * FROM customers WHERE name LIKE ? OR contact_number LIKE ? ORDER BY name',
            [searchTerm, searchTerm]
        );
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new customer
router.post('/', async (req, res) => {
    try {
        const { name, contact_number, email, address } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }
        const [result] = await db.query(
            'INSERT INTO customers (name, contact_number, email, address) VALUES (?, ?, ?, ?)',
            [name, contact_number, email, address]
        );
        res.status(201).json({
            id: result.insertId,
            name,
            contact_number,
            email,
            address,
            message: 'Customer created successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update customer
router.put('/:id', async (req, res) => {
    try {
        const { name, contact_number, email, address } = req.body;
        const [result] = await db.query(
            'UPDATE customers SET name = ?, contact_number = ?, email = ?, address = ? WHERE id = ?',
            [name, contact_number, email, address, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;