const express = require('express');
const router = express.Router();
let db;
try {
    db = require('./database');
} catch (e) {
    db = require('../database');
}

// GET /api/settings/tax - Retrieve current CGST & SGST settings
router.get('/tax', async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT `key`, `value` FROM store_settings WHERE `key` IN ('cgst_rate', 'sgst_rate')"
        );
        const settings = { cgst: 2.5, sgst: 2.5 };
        rows.forEach(row => {
            if (row.key === 'cgst_rate') settings.cgst = parseFloat(row.value) || 0;
            if (row.key === 'sgst_rate') settings.sgst = parseFloat(row.value) || 0;
        });
        res.json(settings);
    } catch (error) {
        res.json({ cgst: 2.5, sgst: 2.5, notice: 'Default rates applied. ' + error.message });
    }
});

// POST /api/settings/tax - Update CGST & SGST rates
router.post('/tax', async (req, res) => {
    try {
        const { cgst, sgst } = req.body;
        if (cgst === undefined || sgst === undefined || isNaN(cgst) || isNaN(sgst) || cgst < 0 || sgst < 0) {
            return res.status(400).json({ error: 'Valid non-negative numeric rates for cgst and sgst are required.' });
        }

        await db.query(
            "INSERT INTO store_settings (`key`, `value`) VALUES ('cgst_rate', ?), ('sgst_rate', ?) " +
            "ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
            [cgst.toString(), sgst.toString()]
        );

        res.json({
            message: 'Tax settings updated successfully',
            settings: { cgst: parseFloat(cgst), sgst: parseFloat(sgst) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
