import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import API from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState('');

  const refreshCart = useCallback(async () => {
    setCartLoading(true);
    setCartError('');
    try {
      const response = await API.get('/customers/cart');
      setCartItems(response.data.cart || []);
      return response.data.cart || [];
    } catch (error) {
      setCartError(error.response?.data?.message || 'Could not load your cart.');
      throw error;
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart().catch(() => {});
  }, [refreshCart]);

  const addToCart = useCallback(async (productId) => {
    setCartLoading(true);
    setCartError('');
    try {
      const response = await API.post(`/customers/cart/${productId}`);
      await refreshCart();
      return response.data;
    } catch (error) {
      setCartError(error.response?.data?.message || 'Could not add this product to your cart.');
      throw error;
    } finally {
      setCartLoading(false);
    }
  }, [refreshCart]);

  const removeFromCart = useCallback(async (productId) => {
    setCartLoading(true);
    setCartError('');
    try {
      const response = await API.delete(`/customers/cart/${productId}`);
      // The delete response contains raw product references; reload to keep the
      // shared cart in the populated shape used by cart and checkout screens.
      await refreshCart();
      return response.data;
    } catch (error) {
      setCartError(error.response?.data?.message || 'Could not remove this product.');
      throw error;
    } finally {
      setCartLoading(false);
    }
  }, [refreshCart]);

  const clearCartState = useCallback(() => {
    setCartItems([]);
    setCartError('');
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    setCartLoading(true);
    setCartError('');
    try {
      await API.patch(`/customers/cart/${productId}`, { quantity });
      await refreshCart();
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Could not update the quantity.';
      setCartError(message);
      error.message = message;
      throw error;
    } finally {
      setCartLoading(false);
    }
  }, [refreshCart]);

  const value = useMemo(() => ({
    cartItems,
    cartLoading,
    cartError,
    addToCart,
    removeFromCart,
    clearCartState,
    updateQuantity,
    refreshCart,
  }), [cartItems, cartLoading, cartError, addToCart, removeFromCart, clearCartState, updateQuantity, refreshCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
