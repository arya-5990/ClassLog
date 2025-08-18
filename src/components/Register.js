import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    designation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
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
    
    if (!formData.mobileNumber || !formData.password || !formData.confirmPassword || !formData.designation) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signup(formData.mobileNumber, formData.password, formData.designation);
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
              <p className="logo-subtitle">Join us to manage visiting faculty records</p>
            </div>
          </div>

          <div className="auth-body">
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-description">Sign up to get started with faculty management</p>

            {error && (
              <div className="alert alert-danger animate-fade-in">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <div className="alert-title">Registration Failed</div>
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
                <label htmlFor="designation" className="form-label">
                  Designation
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">👤</div>
                  <select
                    id="designation"
                    name="designation"
                    className="input"
                    value={formData.designation}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select your designation</option>
                    <option value="CR">Class Representative (CR)</option>
                    <option value="Batch Mentor">Batch Mentor</option>
                  </select>
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
                    placeholder="Create a password (min. 6 characters)"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">🔒</div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="input"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
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
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
