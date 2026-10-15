import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';

function Cart() {
  const navigate = useNavigate();
  const { cartItems, cartLoading, cartError, refreshCart, removeFromCart, updateQuantity } = useCart();

  useEffect(() => {
    refreshCart().catch((error) => {
      if (error.response?.status === 401) navigate('/login');
    });
  }, [refreshCart, navigate]);

  const handleCartAction = async (action) => {
    try {
      await action();
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  return (
    <div className="page-shell" style={styles.page}>
      <Navbar />
      <main className="page-main" style={styles.main}>
        <h1 style={styles.title}>My Cart</h1>
        {cartLoading && <p>Loading cart...</p>}
        {!cartLoading && cartError && (
          <section role="alert" style={styles.emptyState}>
            <p style={styles.error}>{cartError}</p>
            <button type="button" style={styles.primaryButton} onClick={() => refreshCart().catch(() => {})}>Retry</button>
          </section>
        )}
        {!cartLoading && !cartError && cartItems.length === 0 && (
          <section style={styles.emptyState}>
            <p>Your cart is empty.</p>
            <button style={styles.primaryButton} onClick={() => navigate('/products')}>Browse products</button>
          </section>
        )}
        {!cartLoading && !cartError && cartItems.length > 0 && (
          <div className="cart-layout" style={styles.layout}>
            <section style={styles.items}>
              {cartItems.map(({ product, quantity }) => product && (
                <article key={product._id} className="cart-item" style={styles.item}>
                  <img src={product.image} alt={product.name} className="cart-item-image" style={styles.image} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/product-placeholder.svg'; }} />
                  <div style={styles.details}>
                    <div style={styles.productHeading}>
                      <div>
                        <h2 style={styles.productName}>{product.name}</h2>
                        <p style={styles.unitPrice}>₹{Number(product.price).toLocaleString('en-IN')}</p>
                      </div>
                      <strong style={styles.lineTotal}>
                        ₹{(Number(product.price) * quantity).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="cart-item-actions" style={styles.itemActions}>
                      <div style={styles.quantityControl} aria-label={`Quantity for ${product.name}`}>
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={cartLoading}
                          onClick={() => quantity === 1
                            ? handleCartAction(() => removeFromCart(product._id))
                            : handleCartAction(() => updateQuantity(product._id, quantity - 1))}
                          style={styles.quantityButton}
                        >−</button>
                        <span style={styles.quantityValue}>{quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={cartLoading || quantity >= product.stock}
                          onClick={() => handleCartAction(() => updateQuantity(product._id, quantity + 1))}
                          style={styles.quantityButton}
                        >+</button>
                      </div>
                      {quantity >= product.stock && (
                        <span style={styles.stockNote}>Maximum stock reached</span>
                      )}
                      <button
                        type="button"
                        disabled={cartLoading}
                        onClick={() => handleCartAction(() => removeFromCart(product._id))}
                        style={styles.removeButton}
                      >Remove</button>
                    </div>
                  </div>
                </article>
              ))}
              <button type="button" style={styles.continueButton} onClick={() => navigate('/products')}>
                ← Continue shopping
              </button>
            </section>
            <aside style={styles.summary}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>
              <div style={styles.summaryRow}><span>Items</span><span>{itemCount}</span></div>
              <div style={styles.summaryRow}><span>Subtotal</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div>
              <div style={styles.summaryDivider} />
              <div style={styles.summaryTotal}><span>Total</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div>
              <button type="button" style={styles.primaryButton} onClick={() => navigate('/checkout')}>
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Arial, sans-serif' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '36px 24px 64px' },
  title: { margin: '0 0 24px', fontSize: 30, color: '#0f172a' },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', alignItems: 'start', gap: 28 },
  items: { display: 'grid', gap: 16 },
  item: { display: 'flex', gap: 22, padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' },
  image: { width: 150, height: 140, flexShrink: 0, objectFit: 'cover', background: '#f1f5f9', borderRadius: 10 },
  details: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  productHeading: { display: 'flex', justifyContent: 'space-between', gap: 16 },
  productName: { margin: '2px 0 8px', fontSize: 19, color: '#0f172a' },
  unitPrice: { margin: 0, color: '#64748b' },
  lineTotal: { color: '#0f172a', whiteSpace: 'nowrap' },
  itemActions: { display: 'flex', alignItems: 'center', gap: 18, marginTop: 20 },
  quantityControl: { display: 'inline-flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden' },
  quantityButton: { width: 36, height: 34, border: 0, background: '#f8fafc', color: '#334155', fontSize: 20, cursor: 'pointer' },
  quantityValue: { minWidth: 38, textAlign: 'center', fontSize: 14, fontWeight: 600 },
  stockNote: { color: '#64748b', fontSize: 12 },
  removeButton: { border: 0, background: 'transparent', color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  continueButton: { justifySelf: 'start', border: 0, background: 'transparent', color: '#5046e5', fontWeight: 600, padding: '8px 0', cursor: 'pointer' },
  summary: { padding: 22, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' },
  summaryTitle: { margin: '0 0 22px', fontSize: 19, color: '#0f172a' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', margin: '14px 0', color: '#475569', fontSize: 14 },
  summaryDivider: { height: 1, background: '#e2e8f0', margin: '18px 0' },
  summaryTotal: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontWeight: 700, color: '#0f172a' },
  primaryButton: { width: '100%', border: 0, borderRadius: 9, padding: '12px 16px', background: '#5046e5', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  emptyState: { padding: 32, textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 },
  error: { color: '#dc2626' },
};

export default Cart;
