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
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const customersRoutes = require('./routes/customers');
const salesRoutes = require('./routes/sales');

// Use routes
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales', salesRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'BMSIT Supermarket API',
        version: '1.0.0',
        endpoints: {
            categories: '/api/categories',
            products: '/api/products',
            customers: '/api/customers',
            sales: '/api/sales'
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