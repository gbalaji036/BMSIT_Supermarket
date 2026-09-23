const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all categories
router.get('/', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET category by ID
router.get('/:id', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (categories.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(categories[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new category
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        const [result] = await db.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        res.status(201).json({
            id: result.insertId,
            name,
            description,
            message: 'Category created successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update category
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const [result] = await db.query(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE category
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;