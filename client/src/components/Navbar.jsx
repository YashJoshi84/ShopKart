import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';

function Navbar({ user: suppliedUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCartState } = useCart();
  const [user, setUser] = useState(suppliedUser || null);
  const [loggingOut, setLoggingOut] = useState(false);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    if (suppliedUser) {
      setUser(suppliedUser);
      return;
    }
    API.get('/customers/me')
      .then((response) => setUser(response.data))
      .catch(() => setUser(null));
  }, [suppliedUser]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await API.post('/customers/logout');
    } catch (error) {
      // A failed logout request should not trap the user in the current view.
    } finally {
      clearCartState();
      setUser(null);
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <button type="button" className="site-brand" onClick={() => navigate('/products')} aria-label="ShopKart home">
          <span className="site-brand-mark" aria-hidden="true">S</span>
          <span>ShopKart</span>
        </button>

        <div className="site-links">
          <button type="button" className={`site-link ${isActive('/products') ? 'active' : ''}`} onClick={() => navigate('/products')}>Shop</button>
          {user && <button type="button" className={`site-link ${isActive('/home') ? 'active' : ''}`} onClick={() => navigate('/home')}>Account</button>}
          {user && <button type="button" className={`site-link ${isActive('/orders') ? 'active' : ''}`} onClick={() => navigate('/orders')}>Orders</button>}
          {user && <button type="button" className={`site-link ${isActive('/wishlist') ? 'active' : ''}`} onClick={() => navigate('/wishlist')}>Wishlist</button>}
          <button type="button" className={`site-link cart-link ${isActive('/cart') || isActive('/checkout') ? 'active' : ''}`} onClick={() => navigate('/cart')}>
            Cart <span className="cart-count">{cartCount}</span>
          </button>
        </div>

        <div className="site-account">
          {user ? (
            <>
              <span className="site-greeting">Hi, {user.fullName?.split(' ')[0]}</span>
              <button type="button" className="site-account-button subtle" onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : (
            <button type="button" className="site-account-button" onClick={() => navigate('/login')}>Sign in</button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
