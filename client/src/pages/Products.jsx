import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';
import { addProductToWishlist, getProducts, getWishlist } from '../services/productService';
import { useCart } from '../context/CartContext';

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [savingWishlist, setSavingWishlist] = useState({});
  const [wishlistProductIds, setWishlistProductIds] = useState(() => new Set());
  const [wishlistErrors, setWishlistErrors] = useState({});
  const [addingToCart, setAddingToCart] = useState({});
  const [cartErrors, setCartErrors] = useState({});
  const { addToCart } = useCart();

  const handleAddToCart = async (productId) => {
    setAddingToCart((current) => ({ ...current, [productId]: true }));
    setCartErrors((current) => ({ ...current, [productId]: '' }));
    try {
      await addToCart(productId);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setCartErrors((current) => ({
        ...current,
        [productId]: err.response?.data?.message || 'Could not add this product to your cart.',
      }));
    } finally {
      setAddingToCart((current) => ({ ...current, [productId]: false }));
    }
  };

  const handleAddToWishlist = async (productId) => {
    if (savingWishlist[productId] || wishlistProductIds.has(productId)) return;

    setSavingWishlist((current) => ({ ...current, [productId]: true }));
    setWishlistErrors((current) => ({ ...current, [productId]: '' }));

    try {
      await addProductToWishlist(productId);
      setWishlistProductIds((current) => new Set(current).add(productId));
    } catch (err) {
      const status = err.response?.status;
      const message = status === 401
        ? 'Please sign in to add items to your wishlist.'
        : err.response?.data?.message || 'Could not save this product. Please try again.';
      setWishlistErrors((current) => ({ ...current, [productId]: message }));
    } finally {
      setSavingWishlist((current) => ({ ...current, [productId]: false }));
    }
  };

  const categoryOptions = ['All Categories', ...categories];

  // Soft check for user auth to display in navbar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await API.get('/customers/me');
        setUser(res.data);
        getWishlist()
          .then((wishlist) => setWishlistProductIds(new Set((wishlist.wishlist || []).map((product) => product._id))))
          .catch(() => {});
      } catch (err) {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    let active = true;
    getProducts('', '')
      .then((allProducts) => {
        if (!active) return;
        setCategories([...new Set(allProducts.map((product) => product.category).filter(Boolean))].sort());
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Fetch products from GET /products with query parameters
  const fetchProducts = async (currentSearch, currentCategory) => {
    setLoading(true);
    setError(null);
    try {
      const productList = await getProducts(currentSearch, currentCategory);
      setProducts(productList);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Expected flow:
  // User types in search or changes category
  //   ↓
  // React updates state (search / category)
  //   ↓
  // API request with debounce (300ms)
  //   ↓
  // Backend filters MongoDB results
  //   ↓
  // Products UI updates
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(search, category);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
  };

  return (
    <div className="page-shell" style={styles.page}>
      <Navbar user={user} />

      <main className="page-main" style={styles.main}>
        {/* Header and Controls */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>All Products</h1>
            <p style={styles.subtitle}>Explore our latest collection of premium items</p>
          </div>

          {/* Search & Category Filter Bar */}
          <div style={styles.filterBar}>
            {/* Search Input */}
            <div style={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={styles.clearSearchBtn}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.categorySelect}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                  {cat}
                </option>
              ))}
            </select>

            {(search || (category && category !== 'All Categories')) && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={styles.resetButton}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={styles.centerBox}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={styles.centerBox}>
            <div style={styles.errorBox}>
              <p style={styles.errorText}>{error}</p>
              <button onClick={() => fetchProducts(search, category)} style={styles.retryButton}>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div style={styles.centerBox}>
            <div style={styles.emptyBox}>
              <div style={styles.emptyIcon}>📦</div>
              <h3 style={styles.emptyTitle}>No Products Found</h3>
              <p style={styles.emptySubtitle}>
                {search || (category && category !== 'All Categories')
                  ? 'Try adjusting your search or category filter.'
                  : 'No products have been added yet.'}
              </p>
              {(search || (category && category !== 'All Categories')) && (
                <button onClick={handleClearFilters} style={styles.retryButton}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Product Cards Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="product-grid" style={styles.productGrid}>
            {products.map((product) => {
              const inStock = product.stock > 0;

              return (
                <div key={product._id} className="product-card" style={styles.card}>
                  {/* Product Image */}
                  <div style={styles.imageContainer}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                      style={styles.image}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/product-placeholder.svg';
                      }}
                    />
                    <span style={styles.categoryBadge}>{product.category}</span>
                  </div>

                  {/* Product Details */}
                  <div style={styles.cardBody}>
                    <h2 style={styles.productName} title={product.name}>
                      {product.name}
                    </h2>

                    <p style={styles.productCategory}>{product.category}</p>

                    <div style={styles.priceRow}>
                      <span style={styles.price}>
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </span>
                      <span
                        style={{
                          ...styles.stockStatus,
                          color: inStock ? '#16a34a' : '#dc2626',
                          backgroundColor: inStock ? '#f0fdf4' : '#fef2f2',
                        }}
                      >
                        {inStock ? `${product.stock} units left` : 'Out of stock'}
                      </span>
                    </div>

                    {/* View Details Button */}
                    <button
                      style={styles.viewDetailsButton}
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      style={styles.addToCartButton}
                      onClick={() => handleAddToCart(product._id)}
                      disabled={!inStock || addingToCart[product._id]}
                    >
                      {!inStock ? 'Out of Stock' : addingToCart[product._id] ? 'Adding...' : 'Add to Cart'}
                    </button>
                    {cartErrors[product._id] && (
                      <p role="alert" style={styles.wishlistError}>{cartErrors[product._id]}</p>
                    )}
                    <button
                      type="button"
                      style={{
                        ...styles.wishlistButton,
                        ...(wishlistProductIds.has(product._id) ? styles.wishlistButtonAdded : {}),
                        ...(savingWishlist[product._id] ? styles.wishlistButtonSaving : {}),
                      }}
                      onClick={() => handleAddToWishlist(product._id)}
                      disabled={savingWishlist[product._id] || wishlistProductIds.has(product._id)}
                      aria-live="polite"
                    >
                      {savingWishlist[product._id]
                        ? '⏳ Saving...'
                        : wishlistProductIds.has(product._id)
                          ? '♥ Added to Wishlist'
                          : '♡ Add to Wishlist'}
                    </button>
                    {wishlistErrors[product._id] && (
                      <p role="alert" style={styles.wishlistError}>
                        {wishlistErrors[product._id]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px 64px 24px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    margin: 0,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 260px',
    minWidth: '220px',
  },
  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 36px 11px 16px',
    fontSize: '14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
  },
  categorySelect: {
    padding: '11px 16px',
    fontSize: '14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '170px',
  },
  resetButton: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '11px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  centerBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 20px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #5046e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '15px',
    color: '#64748b',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '24px 32px',
    textAlign: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '15px',
    margin: '0 0 16px 0',
  },
  retryButton: {
    backgroundColor: '#5046e5',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyBox: {
    textAlign: 'center',
    backgroundColor: '#ffffff',
    padding: '48px 32px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    maxWidth: '420px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 20px 0',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '65%',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(4px)',
    color: '#334155',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
  },
  cardBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  productName: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 4px 0',
    lineHeight: '1.3',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  productCategory: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 14px 0',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
  },
  price: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
  },
  stockStatus: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  viewDetailsButton: {
    marginTop: 'auto',
    width: '100%',
    backgroundColor: '#5046e5',
    color: '#ffffff',
    border: 'none',
    padding: '11px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    textAlign: 'center',
  },
  addToCartButton: {
    marginTop: '10px',
    width: '100%',
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    border: '1px solid #c7d2fe',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  wishlistButton: {
    marginTop: '10px',
    width: '100%',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  wishlistButtonSaving: {
    cursor: 'wait',
    opacity: 0.7,
  },
  wishlistButtonAdded: {
    color: '#be123c',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    cursor: 'default',
  },
  wishlistError: {
    color: '#dc2626',
    fontSize: '12px',
    margin: '8px 0 0',
  },
};

export default Products;
