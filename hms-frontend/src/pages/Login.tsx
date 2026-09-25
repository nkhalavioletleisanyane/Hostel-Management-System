import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import WaveBackground from '../components/ui/WaveBackground';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import '../styles/login.css';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 350));
    const user = login(userId.trim(), password.trim());
    setLoading(false);
    if (user) {
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/students');
      }
    } else {
      setError('Invalid credentials. Please check your user ID and password.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-wrapper">
        <WaveBackground />
        <div className="login-box fade-in-up">
          {/* Centered Brand Header */}
          <div className="login-header">
            <Link to="/" className="login-brand">
              <span className="brand-icon">🏠</span>
              <span>HMS</span>
            </Link>
            <p className="login-subtitle">Hostel Management System</p>
            <h2 className="login-welcome-title">Sign In</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* User ID Field */}
            <div className="form-group">
              <label>User ID</label>
              <div className="input-with-icon">
                <span className="input-icon-lead">
                  <User size={18} />
                </span>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter your user ID"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <span className="input-icon-lead">
                  <Lock size={18} />
                </span>
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error fade-in">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Actions: Sign In + Back Button right near each other */}
            <div className="login-actions">
              <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
              <Link to="/" className="btn login-back-btn">
                <ArrowLeft size={16} /> Back to Home
              </Link>
            </div>

            {/* Switch to Sign Up */}
            <div className="login-switch-prompt">
              Don't have an account?
              <Link to="/signup" className="login-switch-link">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
