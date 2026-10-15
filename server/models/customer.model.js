const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true 
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    wishlist : [{
        type: mongoose.Schema.ObjectId,
        ref:"Product",
        default:[]
    }],
    cart: {
        type: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }],
        default: []
    },
    phone: {
        type: Number,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

const customerModel = mongoose.model('customer', customerSchema);
module.exports = customerModel;
