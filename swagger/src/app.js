const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const productRoutes = require('./routes/products');

const app = express();
app.use(express.json());

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// API Routes
app.use('/api/products', productRoutes);

// 404 Handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({
        error: status === 500 ? 'Internal server error' : err.message
    });
});

module.exports = app;
