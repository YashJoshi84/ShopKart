const express = require('express');
const router = express.Router();
const { registerCustomer, loginCustomer, getProfile, logoutCustomer, addProductToWishlist, getWishlist, removeProductFromWishlist, addProductToCart, getCart, updateCartProductQuantity, removeProductFromCart } = require('../controllers/customer.controller.js');
const { protectCustomer } = require('../middlewares/auth.middleware.js');

router.post('/register', registerCustomer);
router.post('/login', loginCustomer);
router.get('/me', protectCustomer, getProfile);
router.post('/logout', protectCustomer, logoutCustomer);
router.post('/wishlist/:productId', protectCustomer, addProductToWishlist);
router.get('/wishlist', protectCustomer, getWishlist);
router.delete('/wishlist/:productId', protectCustomer, removeProductFromWishlist);
router.post('/cart/:productId', protectCustomer, addProductToCart);
router.get('/cart', protectCustomer, getCart);
router.patch('/cart/:productId', protectCustomer, updateCartProductQuantity);
router.delete('/cart/:productId', protectCustomer, removeProductFromCart);

module.exports = router;
