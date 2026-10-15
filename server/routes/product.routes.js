const express = require('express');
const router = express.Router();
const { createProduct, getAllProducts, getProductById } = require('../controllers/product.controller.js');

// GET /products
router.get('/getall', getAllProducts);
// router.get('/products/getall', getAllProducts);

// GET /products/:id
router.get('/:id', getProductById);

// POST /products
router.post('/create', createProduct);
// router.post('/products', createProduct);

module.exports = router;


