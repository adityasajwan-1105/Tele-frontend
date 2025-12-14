import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SignupForm from './SignupForm.jsx';
import LoginForm from './LoginForm.jsx';

function LandingPage() {
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="landing">
      <header className="header">
        <div className="container header__inner">
          <div className="brand">TeleMed</div>
          <nav className="nav">
            <button className="btn btn-text" onClick={() => setShowLogin(true)}>Login</button>
            <button className="btn btn-primary" onClick={() => setShowSignup(true)}>Sign Up</button>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero__content">
            <div className="hero__text">
              <h1>See a doctor from anywhere</h1>
              <p>Instant, secure video consultations with licensed physicians. Book in minutes—no waiting rooms.</p>
              <div className="hero__actions">
                <button className="btn btn-primary" onClick={() => setShowSignup(true)}>Get Started</button>
                <a className="btn btn-outline" href="#learn">Learn More</a>
              </div>
            </div>
            <div className="hero__art" aria-hidden="true">
              <div className="card">
                <div className="card__avatar">👩‍⚕️</div>
                <div className="card__lines">
                  <span className="line" />
                  <span className="line" />
                  <span className="line" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="learn" className="features">
          <div className="container features__grid">
            <div className="feature">
              <div className="feature__icon">🔒</div>
              <h3>Private & Secure</h3>
              <p>End‑to‑end encrypted sessions keep your health data safe.</p>
            </div>
            <div className="feature">
              <div className="feature__icon">⚡</div>
              <h3>Fast Access</h3>
              <p>Connect with a doctor in minutes, 24/7 from any device.</p>
            </div>
            <div className="feature">
              <div className="feature__icon">💊</div>
              <h3>e‑Prescriptions</h3>
              <p>Get prescriptions sent directly to your preferred pharmacy.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} TeleMed. All rights reserved.</p>
        </div>
      </footer>

      {showSignup && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__backdrop" onClick={() => setShowSignup(false)} />
          <div className="modal__panel">
            <div className="modal__header">
              <h3>Create Account</h3>
              <button className="modal__close" aria-label="Close" onClick={() => setShowSignup(false)}>×</button>
            </div>
            <SignupForm 
              onClose={() => setShowSignup(false)} 
              onSignupSuccess={() => {
                setShowSignup(false);
                // Automatically open login modal after successful signup
                setTimeout(() => {
                  setShowLogin(true);
                }, 100);
              }}
            />
          </div>
        </div>
      )}

      {showLogin && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__backdrop" onClick={() => setShowLogin(false)} />
          <div className="modal__panel">
            <div className="modal__header">
              <h3>Log In</h3>
              <button className="modal__close" aria-label="Close" onClick={() => setShowLogin(false)}>×</button>
            </div>
            <LoginForm 
              onClose={() => setShowLogin(false)} 
              onLoginSuccess={(user) => {
                console.log('User logged in:', user);
                // You can add redirect or state update here
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;


