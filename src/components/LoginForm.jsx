import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../config/api';

function LoginForm({ onClose, onLoginSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data using auth context
        login(data.user, data.token);
        
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
        onClose();
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setErrors({ submit: data.message || 'Login failed. Please try again.' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'Network error. Please check if the server is running.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form__grid">
        <div className="form__field">
          <label className="form__label" htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form__input"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            required
          />
          {errors.email && <span className="form__error">{errors.email}</span>}
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form__input"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          {errors.password && <span className="form__error">{errors.password}</span>}
        </div>
      </div>

      {errors.submit && (
        <div className="form__errors">
          {errors.submit}
        </div>
      )}

      <div className="form__submit">
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </div>
    </form>
  );
}

export default LoginForm;

