const jwt = require('jsonwebtoken');
const customerModel = require('../models/customer.model.js');

exports.protectCustomer = async (req, res, next) => {
    try {
        
        const authorization = req.headers.authorization;
        const bearerToken = authorization?.startsWith('Bearer ')
            ? authorization.slice(7)
            : null;
        const token = req.cookies?.token || bearerToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
       
        const customer = await customerModel.findById(decoded.id).select('-password');
        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        
        req.user = customer;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }
};
