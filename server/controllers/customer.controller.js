const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const productModel = require('../models/product.model.js');
const customerModel = require('../models/customer.model.js');

exports.registerCustomer = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;

        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "Missing field"
            });
        }

        if (!email.trim().toLowerCase().endsWith('.com')) {
            return res.status(400).json({
                success: false,
                message: "Email address must end with .com"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password too short"
            });
        }

        if(phone.length<10 && phone.length>12){
            return res.status(400).json({
                success:false,
                message:"Invalid Phone number"
            })
        }

        const existingCustomer = await customerModel.findOne({ email });
        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

       
        const customer = await customerModel.create({
            fullName,
            email,
            password: hashedPassword,
            phone
        });

        
        return res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            customer: {
                _id: customer._id,
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !email.trim().toLowerCase().endsWith('.com')) {
            return res.status(400).json({
                success: false,
                message: "Email address must end with .com"
            });
        }

     
        const customer = await customerModel.findOne({ email });
        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        
        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        
        const token = jwt.sign(
            { id: customer._id, email: customer.email },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '1d' }
        );

        
        res.cookie('token', token, {
            httpOnly: true
        });

        return res.status(200).json({
            success: true,
            message: "Login successful"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getProfile = async (req, res) => {
    return res.status(200).json({
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone
    });
};

exports.logoutCustomer = async (req, res) => {
    res.clearCookie('token');
    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
};

exports.addProductToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (req.user.wishlist.some(id => id.toString() === productId)) {
            return res.status(409).json({
                success: false,
                message: "Product is already in wishlist"
            });
        }

        req.user.wishlist.push(product._id);
        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getWishlist = async (req, res) => {
    try {
        const customer = await customerModel.findById(req.user._id)
            .populate({
                path: 'wishlist',
                select: 'name price category image stock'
            });

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        return res.status(200).json({
            success: true,
            count: customer.wishlist.length,
            wishlist: customer.wishlist
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.removeProductFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const wishlist = req.user.wishlist || [];
        const wishlistIndex = wishlist.findIndex(id => id.toString() === productId);

        if (wishlistIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Product not found in wishlist"
            });
        }

        wishlist.splice(wishlistIndex, 1);
        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.addProductToCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const cart = req.user.cart || [];
        const cartItem = cart.find(item => item.product.toString() === productId);
        const newQuantity = cartItem ? cartItem.quantity + 1 : 1;

        if (newQuantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available stock"
            });
        }

        if (cartItem) {
            cartItem.quantity = newQuantity;
        } else {
            cart.push({ product: product._id, quantity: 1 });
        }

        req.user.cart = cart;
        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "Cart updated",
            cart: req.user.cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getCart = async (req, res) => {
    try {
        const customer = await customerModel.findById(req.user._id)
            .populate({
                path: 'cart.product',
                select: 'name price image stock'
            });

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        return res.status(200).json({
            success: true,
            cart: customer.cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateCartProductQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a number of at least 1"
            });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available stock"
            });
        }

        const cartItem = (req.user.cart || []).find(
            item => item.product.toString() === productId
        );
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        cartItem.quantity = quantity;
        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "Cart quantity updated",
            cart: req.user.cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.removeProductFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const cart = req.user.cart || [];
        req.user.cart = cart.filter(item => item.product.toString() !== productId);
        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart: req.user.cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
