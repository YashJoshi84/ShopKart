import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch logged-in user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Send request with cookies to authenticate via httpOnly JWT
        const res = await axios.get('http://localhost:8003/customers/me', {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (err) {
        // If unauthorized (401) or token expired, redirect to login page immediately
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.loadingText}>Loading your profile...</div>
      </div>
    );
  }

  // Prevent flash of protected UI if user is unauthenticated
  if (!user) {
    return null;
  }

  return (
    <div className="page-shell" style={styles.page}>
      {/* Reusable Navbar with Brand and Logout Button */}
      <Navbar user={user} />

      {/* Main Content Area */}
      <main className="page-main" style={styles.main}>
        <div className="surface-card" style={styles.card}>
          <div style={styles.headerSection}>
            <div style={styles.avatar}>
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 style={styles.welcomeMessage}>Welcome, {user?.fullName}!</h1>
              <p style={styles.subtext}>Here are your account details</p>
            </div>
          </div>

          <hr style={styles.divider} />

          {/* Profile Details Display */}
          <div style={styles.infoGrid}>
            <div style={styles.infoRow}>
              <span style={styles.label}>Customer Name</span>
              <span style={styles.value}>{user?.fullName}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.label}>Email Address</span>
              <span style={styles.value}>{user?.email}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.label}>Phone Number</span>
              <span style={styles.value}>{user?.phone}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  centerContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingText: {
    fontSize: '16px',
    color: '#64748b',
  },
  navbar: {
    backgroundColor: '#ffffff',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  brand: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#5046e5',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  main: {
    maxWidth: '640px',
    margin: '40px auto',
    padding: '0 20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
    border: '1px solid #eef2f6',
  },
  headerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#5046e5',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: '700',
  },
  welcomeMessage: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e293b',
  },
  subtext: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#64748b',
  },
  divider: {
    margin: '24px 0',
    border: 'none',
    borderTop: '1px solid #f1f5f9',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #f1f5f9',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
  },
  value: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
  },
};

export default Home;
