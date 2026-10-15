const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        image: {
            type: String,
            trim: true
        }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'customer',
            required: true
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: 'An order must contain at least one item'
            }
        },
        shippingAddress: {
            fullName: { type: String, required: true, trim: true },
            phone: { type: String, required: true, trim: true },
            addressLine1: { type: String, required: true, trim: true },
            city: { type: String, required: true, trim: true },
            state: { type: String, required: true, trim: true },
            pincode: { type: String, required: true, trim: true }
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
            default: 'PENDING_PAYMENT'
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'PAID', 'FAILED'],
            default: 'PENDING'
        },
        razorpayOrderId: { type: String, unique: true, sparse: true },
        razorpayPaymentId: String
    },
    { timestamps: true }
);

const orderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = orderModel;
