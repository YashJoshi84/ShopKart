import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';

function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then((response) => setOrder(response.data.order))
      .catch((requestError) => {
        if (requestError.response?.status === 401) {
          navigate('/login');
          return;
        }
        setError(requestError.response?.data?.message || 'Could not load this order.');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  return (
    <div className="page-shell" style={styles.page}>
      <Navbar />
      <main className="page-main" style={styles.main}>
        {loading && <section style={styles.card}><p>Loading order details...</p></section>}
        {!loading && error && <section style={styles.card}><p role="alert" style={styles.error}>{error}</p></section>}
        {!loading && order && (
          <section style={styles.card}>
            <div style={styles.checkmark} aria-hidden="true">✓</div>
            <h1 style={styles.title}>{order.paymentStatus === 'PAID' ? 'Order Placed Successfully' : 'Order Details'}</h1>
            <p style={styles.description}>Your order has been saved successfully.</p>
            <dl style={styles.details}>
              <div style={styles.row}><dt style={styles.label}>Order ID</dt><dd style={styles.value}>{order._id}</dd></div>
              <div style={styles.row}><dt style={styles.label}>Total</dt><dd style={styles.value}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</dd></div>
              <div style={styles.row}><dt style={styles.label}>Status</dt><dd style={styles.value}>{order.status}</dd></div>
            </dl>
            <div style={styles.actions}>
              <button type="button" style={styles.primaryButton} onClick={() => navigate('/orders')}>
                View My Orders
              </button>
              <button type="button" style={styles.secondaryButton} onClick={() => navigate('/products')}>
                Continue Shopping
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Arial, sans-serif' },
  main: { maxWidth: 760, margin: '0 auto', padding: '48px 24px 64px' },
  card: { padding: 32, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, textAlign: 'center', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.05)' },
  checkmark: { width: 58, height: 58, display: 'grid', placeItems: 'center', margin: '0 auto 18px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', fontSize: 34, fontWeight: 700 },
  title: { margin: '0 0 10px', color: '#0f172a', fontSize: 26 },
  description: { margin: '0 0 26px', color: '#64748b' },
  details: { maxWidth: 480, margin: '0 auto 28px', padding: 18, borderRadius: 10, background: '#f8fafc', textAlign: 'left' },
  row: { display: 'flex', justifyContent: 'space-between', gap: 18, padding: '10px 0', borderBottom: '1px solid #e2e8f0' },
  label: { color: '#64748b' },
  value: { margin: 0, color: '#0f172a', fontWeight: 600, textAlign: 'right', overflowWrap: 'anywhere' },
  actions: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 },
  primaryButton: { border: 0, borderRadius: 9, padding: '12px 18px', background: '#5046e5', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  secondaryButton: { border: '1px solid #cbd5e1', borderRadius: 9, padding: '12px 18px', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer' },
  error: { color: '#dc2626' },
};

export default OrderSuccess;
