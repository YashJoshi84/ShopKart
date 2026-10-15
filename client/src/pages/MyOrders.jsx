import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/orders');
      setOrders(response.data.orders || []);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(requestError.response?.data?.message || 'Could not load your orders.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="page-shell" style={styles.page}>
      <Navbar />
      <main className="page-main" style={styles.main}>
        <h1 style={styles.title}>My Orders</h1>
        {loading && <section style={styles.stateCard} role="status">Loading your orders...</section>}
        {!loading && error && (
          <section style={styles.stateCard}>
            <p role="alert" style={styles.error}>{error}</p>
            <button type="button" style={styles.secondaryButton} onClick={loadOrders}>Try Again</button>
          </section>
        )}
        {!loading && !error && orders.length === 0 && (
          <section style={styles.stateCard}>
            <p>You have not placed any orders yet.</p>
            <button type="button" style={styles.primaryButton} onClick={() => navigate('/products')}>Start Shopping</button>
          </section>
        )}
        {!loading && orders.length > 0 && (
          <div style={styles.list}>
            {orders.map((order) => (
              <article key={order._id} style={styles.order}>
                <div style={styles.orderHeading}>
                  <div>
                    <h2 style={styles.orderTitle}>Order #{order._id}</h2>
                    <p style={styles.date}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span style={styles.status}>{order.status}</span>
                </div>
                <ul style={styles.items}>
                  {(order.items || []).map((item, index) => (
                    <li key={`${item.product || item.name}-${index}`}>{item.name} × {item.quantity}</li>
                  ))}
                </ul>
                <div className="order-footer" style={styles.orderFooter}>
                  <p style={styles.total}>Total: ₹{Number(order.totalAmount).toLocaleString('en-IN')}</p>
                  <button type="button" style={styles.secondaryButton} onClick={() => navigate(`/order-success/${order._id}`)}>
                    View Details
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
  page: { minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Arial, sans-serif' },
  main: { maxWidth: 900, margin: '0 auto', padding: '36px 24px 64px' },
  title: { margin: '0 0 24px', fontSize: 30, color: '#0f172a' },
  list: { display: 'grid', gap: 16 },
  stateCard: { padding: 28, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, textAlign: 'center' },
  order: { padding: 22, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, color: '#0f172a', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' },
  orderHeading: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 },
  orderTitle: { margin: 0, fontSize: 18, overflowWrap: 'anywhere' },
  date: { margin: '7px 0 0', color: '#64748b', fontSize: 14 },
  status: { padding: '5px 10px', borderRadius: 20, background: '#eef2ff', color: '#4338ca', fontSize: 12, fontWeight: 700 },
  items: { display: 'grid', gap: 8, padding: '16px 0 16px 20px', margin: 0, color: '#475569' },
  orderFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' },
  total: { margin: 0, fontWeight: 700, color: '#0f172a' },
  primaryButton: { border: 0, borderRadius: 9, padding: '11px 16px', background: '#5046e5', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  secondaryButton: { border: '1px solid #cbd5e1', borderRadius: 9, padding: '10px 15px', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer' },
  error: { color: '#dc2626' },
};

export default MyOrders;
