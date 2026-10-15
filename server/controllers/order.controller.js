const mongoose = require('mongoose');
const crypto = require('crypto');
const orderModel = require('../models/Order.model.js');
const customerModel = require('../models/customer.model.js');
const productModel = require('../models/product.model.js');

const addressFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];

exports.createPaymentOrder = async (req, res) => {
    try {
        const shippingAddress = req.body?.shippingAddress;
        if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) {
            return res.status(400).json({ success: false, message: 'Shipping address is required.' });
        }

        const normalizedAddress = {};
        for (const field of addressFields) {
            const value = shippingAddress[field];
            if (typeof value !== 'string' || !value.trim()) {
                return res.status(400).json({ success: false, message: `${field} is required.` });
            }
            normalizedAddress[field] = value.trim();
        }

        const phone = normalizedAddress.phone;
        const phoneDigits = phone.replace(/\D/g, '');
        if (!/^\+?[\d\s().-]+$/.test(phone) || phoneDigits.length < 10 || phoneDigits.length > 15) {
            return res.status(400).json({ success: false, message: 'Enter a valid phone number.' });
        }
        if (!/^\d{6}$/.test(normalizedAddress.pincode)) {
            return res.status(400).json({ success: false, message: 'Pincode must contain 6 digits.' });
        }

        const cart = req.user.cart || [];
        if (cart.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty.' });
        }

        const productIds = cart.map(({ product }) => product);
        const products = await productModel.find({ _id: { $in: productIds } })
            .select('name price image stock');
        const productsById = new Map(products.map((product) => [product._id.toString(), product]));

        const items = [];
        let totalAmount = 0;
        for (const cartItem of cart) {
            const productId = cartItem.product.toString();
            const product = productsById.get(productId);
            if (!product) {
                return res.status(400).json({ success: false, message: 'A product in your cart is no longer available.' });
            }
            if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity for ${product.name}.`
                });
            }
            if (cartItem.quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}.`
                });
            }

            const price = Number(product.price);
            items.push({
                product: product._id,
                name: product.name,
                price,
                quantity: cartItem.quantity,
                image: product.image
            });
            totalAmount += price * cartItem.quantity;
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            return res.status(500).json({ success: false, message: 'Payment service is not configured.' });
        }

        const amountInPaise = Math.round(totalAmount * 100);
        const gatewayResponse = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `shopkart_${req.user._id}_${Date.now()}`
            })
        });
        const gatewayOrder = await gatewayResponse.json();
        if (!gatewayResponse.ok) {
            console.error('Razorpay order creation failed:', gatewayOrder);
            return res.status(502).json({ success: false, message: 'Could not start the payment. Please try again.' });
        }

        const order = await orderModel.create({
            user: req.user._id,
            items,
            shippingAddress: normalizedAddress,
            totalAmount,
            status: 'PENDING_PAYMENT',
            paymentStatus: 'PENDING',
            razorpayOrderId: gatewayOrder.id
        });

        return res.status(201).json({
            success: true,
            message: 'Payment order created.',
            payment: {
                keyId,
                orderId: gatewayOrder.id,
                amount: gatewayOrder.amount,
                currency: gatewayOrder.currency
            },
            order: {
                _id: order._id,
                items: order.items,
                shippingAddress: order.shippingAddress,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt
            }
        });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Could not create payment order:', error);
        return res.status(500).json({ success: false, message: 'Could not create the order.' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification details are incomplete.' });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            return res.status(500).json({ success: false, message: 'Payment service is not configured.' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        const received = Buffer.from(razorpay_signature, 'hex');
        const expected = Buffer.from(expectedSignature, 'hex');
        if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
            return res.status(400).json({ success: false, message: 'Payment signature is invalid.' });
        }

        const order = await orderModel.findOne({
            razorpayOrderId: razorpay_order_id,
            user: req.user._id
        });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Payment order not found.' });
        }

        if (order.paymentStatus !== 'PAID') {
            order.paymentStatus = 'PAID';
            order.status = 'PLACED';
            order.razorpayPaymentId = razorpay_payment_id;
            await order.save();
        }

        const customer = await customerModel.findById(req.user._id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }
        customer.cart = [];
        await customer.save();

        return res.status(200).json({
            success: true,
            message: 'Payment verified. Order placed.',
            order: {
                _id: order._id,
                totalAmount: order.totalAmount,
                status: order.status,
                paymentStatus: order.paymentStatus
            },
            cart: []
        });
    } catch (error) {
        console.error('Could not verify payment:', error);
        return res.status(500).json({ success: false, message: 'Could not verify payment.' });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select('_id totalAmount status paymentStatus createdAt items');
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Could not load orders:', error);
        return res.status(500).json({ success: false, message: 'Could not load your orders.' });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID.' });
        }

        const order = await orderModel.findOne({ _id: req.params.id, user: req.user._id })
            .select('_id totalAmount status paymentStatus createdAt');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        return res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Could not load order:', error);
        return res.status(500).json({ success: false, message: 'Could not load the order.' });
    }
};
