import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.mobileNumber || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(formData.mobileNumber, formData.password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-background-overlay"></div>
        <div className="auth-background-pattern"></div>
      </div>
      
      <div className="auth-content">
        <div className="auth-card animate-scale-in">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">🎓</div>
              <h1 className="logo-title">Faculty Attendance</h1>
              <p className="logo-subtitle">Manage visiting faculty records efficiently</p>
            </div>
          </div>

          <div className="auth-body">
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-description">Sign in to your account to continue</p>

            {error && (
              <div className="alert alert-danger animate-fade-in">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <div className="alert-title">Login Failed</div>
                  <div className="alert-message">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="mobileNumber" className="form-label">
                  Mobile Number
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">📱</div>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    className="input"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your mobile number"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">🔒</div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="input"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
