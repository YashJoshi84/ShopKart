const mongoose = require('mongoose');
const productModel = require('../models/product.model.js');

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, category, image, stock } = req.body;

        // 1. Missing required field validation
        if (
            !name || (typeof name === 'string' && !name.trim()) ||
            !description || (typeof description === 'string' && !description.trim()) ||
            !category || (typeof category === 'string' && !category.trim()) ||
            !image || (typeof image === 'string' && !image.trim()) ||
            price === undefined || price === null || price === '' ||
            stock === undefined || stock === null || stock === ''
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required field"
            });
        }

        // 2. Invalid price validation (price must be greater than 0)
        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid price: price must be greater than 0"
            });
        }

        // 3. Invalid stock validation (stock cannot be negative)
        const numericStock = Number(stock);
        if (isNaN(numericStock) || numericStock < 0 || !Number.isInteger(numericStock)) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock: stock cannot be negative"
            });
        }

        // Create and save the product
        const product = await productModel.create({
            name: typeof name === 'string' ? name.trim() : name,
            description: typeof description === 'string' ? description.trim() : description,
            price: numericPrice,
            category: typeof category === 'string' ? category.trim() : category,
            image: typeof image === 'string' ? image.trim() : image,
            stock: numericStock
        });

        return res.status(201).json(product);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const { search, category } = req.query;
        const query = {};

        // Case-insensitive search on product name
        if (search && search.trim()) {
            query.name = { $regex: search.trim(), $options: 'i' };
        }

        // Category filter (case-insensitive exact match)
        if (category && category.trim()) {
            query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
        }

        const products = await productModel.find(query);

        return res.status(200).json({
            success: true,
            count: products.length,
            products: products
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json(product);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


