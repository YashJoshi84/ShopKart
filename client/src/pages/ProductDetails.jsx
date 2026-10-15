import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartActionError, setCartActionError] = useState('');
  const { addToCart, cartLoading } = useCart();

  // Soft check for user authentication for Navbar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('http://localhost:8003/customers/me', {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (err) {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  // Fetch single product by ID from GET /products/:id
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`http://localhost:8003/products/${id}`);
        // Handle direct product object or wrapped { success, product }
        const productData = res.data?.product || res.data;
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        if (err.response && err.response.status === 404) {
          setError('Product not found.');
        } else if (err.response && err.response.status === 400) {
          setError('Invalid product ID format.');
        } else {
          setError('Failed to load product details.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = async () => {
    setCartActionError('');
    try {
      await addToCart(product._id);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setCartActionError(error.response?.data?.message || 'Could not add this product to your cart.');
    }
  };

  return (
    <div className="page-shell" style={styles.page}>
      <Navbar user={user} />

      <main className="page-main" style={styles.main}>
        {/* Back Link */}
        <button onClick={() => navigate('/products')} style={styles.backButton}>
          ← Back to Products
        </button>

        {/* Loading State */}
        {loading && (
          <div style={styles.centerBox}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading product details...</p>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && error && (
          <div style={styles.centerBox}>
            <div style={styles.errorBox}>
              <div style={styles.errorIcon}>⚠️</div>
              <h2 style={styles.errorTitle}>{error}</h2>
              <p style={styles.errorSubtitle}>The requested product could not be retrieved.</p>
              <button onClick={() => navigate('/products')} style={styles.actionBtn}>
                Browse All Products
              </button>
            </div>
          </div>
        )}

        {/* Product Details Display */}
        {!loading && !error && product && (
          <div className="product-detail-card" style={styles.card}>
            <div className="product-detail-grid" style={styles.grid}>
              {/* Large Product Image */}
              <div style={styles.imageColumn}>
                <div style={styles.imageWrapper}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={styles.largeImage}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/product-placeholder.svg';
                    }}
                  />
                  <span style={styles.imageBadge}>{product.category}</span>
                </div>
              </div>

              {/* Product Information */}
              <div style={styles.infoColumn}>
                <div style={styles.categoryTag}>{product.category}</div>

                <h1 style={styles.productTitle}>{product.name}</h1>

                <div style={styles.priceRow}>
                  <span style={styles.price}>
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </span>
                  <span
                    style={{
                      ...styles.stockBadge,
                      backgroundColor: product.stock > 0 ? '#f0fdf4' : '#fef2f2',
                      color: product.stock > 0 ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {product.stock > 0 ? `${product.stock} units left in stock` : 'Out of Stock'}
                  </span>
                </div>

                <hr style={styles.divider} />

                {/* Description */}
                <div style={styles.section}>
                  <h3 style={styles.sectionHeading}>Description</h3>
                  <p style={styles.description}>{product.description}</p>
                </div>

                <hr style={styles.divider} />

                {/* Stock Details */}
                <div style={styles.stockDetails}>
                  <span style={styles.stockLabel}>Availability:</span>
                  <span style={styles.stockValue}>
                    {product.stock > 0 ? `${product.stock} units available` : 'Currently unavailable'}
                  </span>
                </div>

                {/* Add to Cart Button (UI Only) */}
                <div style={styles.buttonGroup}>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || cartLoading}
                    style={{
                      ...styles.addToCartBtn,
                      backgroundColor: product.stock === 0 || cartLoading ? '#94a3b8' : '#5046e5',
                      cursor: product.stock === 0 || cartLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {product.stock === 0
                      ? 'Out of Stock'
                      : cartLoading
                      ? 'Adding...'
                      : addedToCart
                      ? '✓ Added to Cart!'
                      : 'Add to Cart'}
                  </button>
                </div>

                {addedToCart && (
                  <div style={styles.toast}>
                    Product added to your cart!
                  </div>
                )}
                {cartActionError && <div role="alert" style={styles.errorSubtitle}>{cartActionError}</div>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1e293b',
  },
  main: {
    maxWidth: '1080px',
    margin: '0 auto',
    padding: '32px 24px 64px 24px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    color: '#5046e5',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'opacity 0.2s',
  },
  centerBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #5046e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '16px',
    color: '#64748b',
  },
  errorBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '48px 32px',
    textAlign: 'center',
    maxWidth: '460px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
  },
  errorIcon: {
    fontSize: '42px',
    marginBottom: '12px',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  errorSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 24px 0',
  },
  actionBtn: {
    backgroundColor: '#5046e5',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '40px',
    padding: '40px',
  },
  imageColumn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '420px',
    backgroundColor: '#f1f5f9',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  largeImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageBadge: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(6px)',
    color: '#334155',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  infoColumn: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  categoryTag: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  productTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: '1.2',
    margin: '0 0 16px 0',
    letterSpacing: '-0.5px',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  price: {
    fontSize: '30px',
    fontWeight: '800',
    color: '#0f172a',
  },
  stockBadge: {
    fontSize: '13px',
    fontWeight: '600',
    padding: '6px 14px',
    borderRadius: '20px',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #f1f5f9',
    margin: '20px 0',
  },
  section: {
    marginBottom: '4px',
  },
  sectionHeading: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 8px 0',
  },
  description: {
    fontSize: '16px',
    lineHeight: '1.65',
    color: '#334155',
    margin: 0,
  },
  stockDetails: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
    marginBottom: '28px',
  },
  stockLabel: {
    color: '#64748b',
    fontWeight: '500',
  },
  stockValue: {
    color: '#0f172a',
    fontWeight: '600',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  addToCartBtn: {
    flex: 1,
    color: '#ffffff',
    border: 'none',
    padding: '16px 28px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    boxShadow: '0 4px 14px rgba(80, 70, 229, 0.3)',
    transition: 'background-color 0.2s, transform 0.1s',
  },
  toast: {
    marginTop: '12px',
    padding: '10px 16px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center',
  },
};

export default ProductDetails;
