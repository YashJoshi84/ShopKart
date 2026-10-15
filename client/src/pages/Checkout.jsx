import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import API from '../services/api';

const initialAddress = {
  fullName: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: '',
};

const requiredFields = [
  ['fullName', 'Full Name'],
  ['phone', 'Phone Number'],
  ['addressLine1', 'Address Line'],
  ['city', 'City'],
  ['state', 'State'],
  ['pincode', 'Pincode'],
];

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load the payment window.'));
    document.body.appendChild(script);
  });
}

function validateAddress(address) {
  const errors = {};

  requiredFields.forEach(([field, label]) => {
    if (!address[field].trim()) errors[field] = `${label} is required.`;
  });

  const phone = address.phone.trim();
  // Accept common international formats with optional + and separators, requiring 10–15 digits.
  if (phone && !/^\+?[\d\s().-]+$/.test(phone)) {
    errors.phone = 'Enter a valid phone number.';
  } else if (phone && (phone.match(/\d/g) || []).length < 10 || phone && (phone.match(/\d/g) || []).length > 15) {
    errors.phone = 'Phone number must contain 10 to 15 digits.';
  }

  const pincode = address.pincode.trim();
  if (pincode && !/^\d{6}$/.test(pincode)) {
    errors.pincode = 'Pincode must contain 6 digits.';
  }

  return errors;
}

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartLoading, cartError, refreshCart, clearCartState } = useCart();
  const [address, setAddress] = useState(initialAddress);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refreshCart().catch((error) => {
      if (error.response?.status === 401) navigate('/login');
    });
  }, [refreshCart, navigate]);

  const items = useMemo(
    () => cartItems.filter(({ product }) => product),
    [cartItems]
  );
  const total = items.reduce(
    (sum, { product, quantity }) => sum + Number(product.price) * quantity,
    0
  );

  const handleChange = (event) => {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [event.target.name]: '' }));
    setNotice('');
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateAddress(address);
    setFieldErrors(errors);
    setNotice('');
    setSubmitError('');
    if (Object.keys(errors).length > 0) {
      setNotice('Please correct the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await API.post('/orders/create-payment-order', {
        shippingAddress: Object.fromEntries(
          Object.entries(address).map(([field, value]) => [field, value.trim()])
        ),
      });
      await loadRazorpayCheckout();
      const { payment, order } = response.data;
      const checkout = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: 'ShopKart',
        description: `Order ${order._id}`,
        order_id: payment.orderId,
        handler: async (paymentResponse) => {
          try {
            const verification = await API.post('/orders/verify-payment', paymentResponse);
            clearCartState();
            navigate(`/order-success/${verification.data.order._id}`);
          } catch (verificationError) {
            if (verificationError.response?.status === 401) {
              navigate('/login');
              return;
            }
            setSubmitError(verificationError.response?.data?.message || 'Payment could not be verified. Contact support before retrying.');
          }
        },
        modal: {
          ondismiss: () => setNotice('Payment was not completed. Your cart is unchanged.'),
        },
        theme: { color: '#5046e5' },
      });
      checkout.on('payment.failed', (paymentFailure) => {
        setSubmitError(paymentFailure.error?.description || 'Payment failed. Your cart is unchanged.');
      });
      checkout.open();
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setSubmitError(error.response?.data?.message || 'Could not create your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cartLoading && cartError) {
    return (
      <div className="page-shell" style={styles.page}>
        <Navbar />
        <main className="page-main" style={styles.main}>
          <h1 style={styles.title}>Checkout</h1>
          <section style={styles.card}>
            <p role="alert" style={styles.error}>{cartError}</p>
            <button type="button" style={styles.primaryButton} onClick={() => refreshCart().catch(() => {})}>Retry</button>
          </section>
        </main>
      </div>
    );
  }

  if (!cartLoading && items.length === 0) {
    return (
      <div className="page-shell" style={styles.page}>
        <Navbar />
        <main className="page-main" style={styles.main}>
          <h1 style={styles.title}>Checkout</h1>
          <section style={styles.card}>
            <p>Your cart is empty.</p>
            <button type="button" style={styles.primaryButton} onClick={() => navigate('/products')}>
              Browse products
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell" style={styles.page}>
      <Navbar />
      <main className="page-main" style={styles.main}>
        <h1 style={styles.title}>Checkout</h1>
        {cartLoading && <p>Loading your order...</p>}
        {cartError && <p role="alert" style={styles.error}>{cartError}</p>}
        {!cartLoading && items.length > 0 && (
          <form onSubmit={handleSubmit} className="checkout-layout" style={styles.layout}>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Shipping Details</h2>
              <div className="checkout-form-grid" style={styles.formGrid}>
                <label style={styles.field}>
                  Full Name
                  <input autoComplete="name" name="fullName" value={address.fullName} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined} style={styles.input} />
                  {fieldErrors.fullName && <span id="fullName-error" role="alert" style={styles.fieldError}>{fieldErrors.fullName}</span>}
                </label>
                <label style={styles.field}>
                  Phone
                  <input autoComplete="tel" name="phone" type="tel" inputMode="tel" value={address.phone} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'phone-error' : undefined} style={styles.input} />
                  {fieldErrors.phone && <span id="phone-error" role="alert" style={styles.fieldError}>{fieldErrors.phone}</span>}
                </label>
                <label style={{ ...styles.field, ...styles.fullWidth }}>
                  Address
                  <input autoComplete="street-address" name="addressLine1" value={address.addressLine1} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.addressLine1)} aria-describedby={fieldErrors.addressLine1 ? 'addressLine1-error' : undefined} style={styles.input} />
                  {fieldErrors.addressLine1 && <span id="addressLine1-error" role="alert" style={styles.fieldError}>{fieldErrors.addressLine1}</span>}
                </label>
                <label style={styles.field}>
                  City
                  <input autoComplete="address-level2" name="city" value={address.city} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.city)} aria-describedby={fieldErrors.city ? 'city-error' : undefined} style={styles.input} />
                  {fieldErrors.city && <span id="city-error" role="alert" style={styles.fieldError}>{fieldErrors.city}</span>}
                </label>
                <label style={styles.field}>
                  State
                  <input autoComplete="address-level1" name="state" value={address.state} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.state)} aria-describedby={fieldErrors.state ? 'state-error' : undefined} style={styles.input} />
                  {fieldErrors.state && <span id="state-error" role="alert" style={styles.fieldError}>{fieldErrors.state}</span>}
                </label>
                <label style={styles.field}>
                  Pincode
                  <input autoComplete="postal-code" name="pincode" inputMode="numeric" value={address.pincode} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.pincode)} aria-describedby={fieldErrors.pincode ? 'pincode-error' : undefined} style={styles.input} />
                  {fieldErrors.pincode && <span id="pincode-error" role="alert" style={styles.fieldError}>{fieldErrors.pincode}</span>}
                </label>
              </div>
            </section>

            <aside style={styles.card}>
              <h2 style={styles.sectionTitle}>Order Summary</h2>
              <div style={styles.summaryItems}>
                {items.map(({ product, quantity }) => (
                  <div key={product._id} style={styles.summaryRow}>
                    <span>{product.name} × {quantity}</span>
                    <strong>₹{(Number(product.price) * quantity).toLocaleString('en-IN')}</strong>
                  </div>
                ))}
              </div>
              <div style={styles.divider} />
              <div style={styles.totalRow}>
                <span>Total</span>
                <strong>₹{total.toLocaleString('en-IN')}</strong>
              </div>
              {notice && <p role="status" style={styles.notice}>{notice}</p>}
              {submitError && <p role="alert" style={styles.error}>{submitError}</p>}
              <button type="submit" disabled={submitting} style={{ ...styles.primaryButton, ...(submitting ? styles.disabledButton : {}) }}>
                {submitting ? 'Opening Payment...' : 'Pay with Razorpay'}
              </button>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Arial, sans-serif' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '36px 24px 64px' },
  title: { margin: '0 0 24px', fontSize: 30, color: '#0f172a' },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 0.8fr)', alignItems: 'start', gap: 24 },
  card: { padding: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' },
  sectionTitle: { margin: '0 0 22px', fontSize: 20, color: '#0f172a' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 },
  field: { display: 'grid', gap: 8, color: '#334155', fontSize: 14, fontWeight: 600 },
  fullWidth: { gridColumn: '1 / -1' },
  input: { width: '100%', boxSizing: 'border-box', minHeight: 44, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', font: 'inherit', fontWeight: 400 },
  summaryItems: { display: 'grid', gap: 16 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', gap: 14, color: '#475569', fontSize: 14 },
  divider: { height: 1, background: '#e2e8f0', margin: '22px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 17, fontWeight: 700, color: '#0f172a' },
  primaryButton: { width: '100%', border: 0, borderRadius: 9, padding: '12px 16px', background: '#5046e5', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  disabledButton: { opacity: 0.7, cursor: 'wait' },
  notice: { color: '#475569', fontSize: 13, lineHeight: 1.5 },
  fieldError: { color: '#dc2626', fontSize: 12, fontWeight: 400 },
  error: { color: '#dc2626' },
};

export default Checkout;
