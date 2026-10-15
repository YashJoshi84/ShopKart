const express = require('express');
const { createPaymentOrder, verifyPayment, getMyOrders, getOrderById } = require('../controllers/order.controller.js');
const { protectCustomer } = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.post('/create-payment-order', protectCustomer, createPaymentOrder);
router.post('/verify-payment', protectCustomer, verifyPayment);
router.get('/', protectCustomer, getMyOrders);
router.get('/:id', protectCustomer, getOrderById);

module.exports = router;
