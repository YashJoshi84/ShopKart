import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';
import { getWishlist, removeProductFromWishlist } from '../services/productService';

function Wishlist() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingIds, setRemovingIds] = useState(() => new Set());

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getWishlist();
      setProducts(result.wishlist || []);
    } catch (err) {
      setError(err.response?.status === 401
        ? 'Please sign in to view your wishlist.'
        : err.response?.data?.message || 'Could not load your wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    API.get('/customers/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId) => {
    if (removingIds.has(productId)) return;

    setRemovingIds((current) => new Set(current).add(productId));
    setError('');
    try {
      await removeProductFromWishlist(productId);
      setProducts((current) => current.filter((product) => product._id !== productId));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove this product. Please try again.');
    } finally {
      setRemovingIds((current) => {
        const next = new Set(current);
        next.delete(productId);
        return next;
      });
    }
  };

  return (
    <div className="page-shell" style={styles.page}>
      <Navbar user={user} />
      <main className="page-main" style={styles.main}>
        <h1 style={styles.title}>My Wishlist</h1>
        <p style={styles.subtitle}>Products you have saved for later.</p>

        {loading && <p style={styles.message}>Loading your wishlist...</p>}

        {!loading && error && (
          <div role="alert" style={styles.errorBox}>
            <p>Unable to load wishlist.</p>
            <button type="button" style={styles.retryButton} onClick={fetchWishlist}>Try Again</button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div style={styles.emptyBox}>
            <p style={styles.emptyTitle}>Your wishlist is empty ❤️</p>
            <p style={styles.emptySubtitle}>Start saving products you love.</p>
            <button type="button" style={styles.primaryButton} onClick={() => navigate('/products')}>
              Browse Products
            </button>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="product-grid" style={styles.grid}>
            {products.map((product) => (
              <article key={product._id} style={styles.card}>
                <img src={product.image} alt={product.name} style={styles.image} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/product-placeholder.svg'; }} />
                <div style={styles.cardBody}>
                  <p style={styles.category}>{product.category}</p>
                  <h2 style={styles.name}>{product.name}</h2>
                  <p style={styles.price}>₹{Number(product.price).toLocaleString('en-IN')}</p>
                  <p style={styles.stock}>
                    {product.stock > 0 ? `${product.stock} units left` : 'Out of stock'}
                  </p>
                  <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    style={styles.removeButton}
                    onClick={() => handleRemove(product._id)}
                    disabled={removingIds.has(product._id)}
                  >
                    {removingIds.has(product._id) ? 'Removing...' : 'Remove from Wishlist'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e293b' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 64px' },
  title: { margin: '0 0 6px', color: '#0f172a', fontSize: '28px' },
  subtitle: { margin: '0 0 28px', color: '#64748b' },
  message: { padding: '32px 0', color: '#64748b' },
  errorBox: { padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c' },
  emptyBox: { padding: '40px', textAlign: 'center', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' },
  emptyTitle: { margin: '0 0 8px', color: '#0f172a', fontSize: '18px', fontWeight: 600 },
  emptySubtitle: { margin: '0 0 20px', color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' },
  card: { display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  image: { width: '100%', height: '190px', objectFit: 'cover', backgroundColor: '#f1f5f9' },
  cardBody: { display: 'flex', flexDirection: 'column', flex: 1, padding: '18px' },
  category: { margin: '0 0 6px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' },
  name: { margin: '0 0 10px', color: '#0f172a', fontSize: '18px' },
  price: { margin: '0 0 6px', fontWeight: '700', fontSize: '20px' },
  stock: { margin: '0 0 16px', color: '#64748b', fontSize: '13px' },
  primaryButton: { width: '100%', marginTop: 'auto', padding: '11px 16px', border: 0, borderRadius: '9px', backgroundColor: '#5046e5', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  removeButton: { width: '100%', marginTop: '10px', padding: '10px 16px', border: '1px solid #fecaca', borderRadius: '9px', backgroundColor: '#fff', color: '#b91c1c', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  retryButton: { padding: '9px 16px', border: 0, borderRadius: '8px', backgroundColor: '#5046e5', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};

export default Wishlist;
