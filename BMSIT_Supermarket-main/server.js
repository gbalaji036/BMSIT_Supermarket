const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const getRoute = (name) => {
    try { return require(`./${name}`); } catch (e) { return require(`./routes/${name}`); }
};

const categoriesRoutes = getRoute('categories');
const productsRoutes = getRoute('products');
const customersRoutes = getRoute('customers');
const salesRoutes = getRoute('sales');
const settingsRoutes = getRoute('settings');

// Use routes
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/settings', settingsRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'BMSIT Supermarket API',
        version: '1.0.0',
        endpoints: {
            categories: '/api/categories',
            products: '/api/products',
            customers: '/api/customers',
            sales: '/api/sales',
            tax_settings: '/api/settings/tax'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
});