import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();

  // Controlled state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      return setError('Please provide both email and password');
    }

    if (!formData.email.trim().toLowerCase().endsWith('.com')) {
      return setError('Email address must end with .com');
    }

    setLoading(true);

    try {
      // Send credentials with cookies: withCredentials = true allows browser to store the httpOnly JWT cookie
      const res = await axios.post(
        'http://localhost:8003/customers/login',
        formData,
        { withCredentials: true }
      );

      if (res.data.success) {
        navigate('/home');
      }
    } catch (err) {
      // Display failure message: "Invalid Credentials" or backend message
      const msg = err.response?.data?.message || 'Invalid Credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={styles.page}>
      <div className="auth-card" style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to your ShopKart account</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              pattern=".+\.com"
              title="Email address must end with .com"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

// Consistent styling with registration card
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5fb',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '36px 32px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1f36',
    textAlign: 'center',
    margin: '0 0 6px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#697386',
    textAlign: 'center',
    margin: '0 0 24px 0'
  },
  errorBox: {
    backgroundColor: '#ffebe9',
    color: '#cf222e',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    border: '1px solid rgba(255, 129, 130, 0.4)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#3c4257'
  },
  input: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #dcdfe4',
    fontSize: '14px',
    color: '#1a1f36',
    outline: 'none'
  },
  button: {
    marginTop: '8px',
    backgroundColor: '#5046e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '13px',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(80, 70, 229, 0.25)'
  },
  footerText: {
    marginTop: '20px',
    fontSize: '13px',
    color: '#697386',
    textAlign: 'center'
  },
  link: {
    color: '#5046e5',
    textDecoration: 'none',
    fontWeight: '600'
  }
};

export default Login;
