import React, { useState, useEffect } from 'react';
import theme from '../theme';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Register Student', href: '/register-student' },
    { name: 'Register Faculty', href: '/register-faculty' },
  ];

  const authButtons = [
    { name: 'Login', href: '/login' },
  ];

  const navbarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backdropFilter: 'blur(16px)',
    backgroundColor: isScrolled ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.9)',
    borderBottom: '1px solid rgba(51, 65, 85, 0.8)',
    transition: 'background-color 0.3s ease',
  };

  return (
    <nav style={navbarStyle}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <h2 style={{
                fontFamily: theme.font.family,
                fontWeight: theme.font.weights.semibold,
                fontSize: '1.875rem', // text-3xl equivalent (increased from text-2xl)
                color: '#3b82f6',
                cursor: 'pointer',
              }}>
                TeamSync
              </h2>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '3rem', flex: 1, justifyContent: 'center', marginLeft: '8rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2rem' }}>
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  style={{
                    textDecoration: 'none',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '1rem', // increased from 0.875rem
                    fontWeight: theme.font.weights.medium,
                    transition: 'all 0.3s ease',
                    color: '#cbd5e1',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#3b82f6';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#cbd5e1';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Auth Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
              {authButtons.map((button, index) => (
                <a
                  key={button.name}
                  href={button.href}
                  style={{
                    textDecoration: 'none',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '0.5rem',
                    fontSize: '1rem', // increased from 0.875rem
                    fontWeight: theme.font.weights.medium,
                    transition: 'all 0.3s ease',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1d4ed8';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2563eb';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  {button.name}
                </a>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div style={{ display: isMobile ? 'block' : 'none' }}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                color: '#cbd5e1',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <svg
                style={{ height: '1.5rem', width: '1.5rem' }}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && isMobile && (
        <div>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
          }}>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '1.125rem', // increased from 1rem
                  fontWeight: theme.font.weights.medium,
                  transition: 'all 0.3s ease',
                  color: '#cbd5e1',
                }}
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                {link.name}
              </a>
            ))}
            
            {/* Mobile Auth Buttons */}
            <div style={{
              borderTop: '1px solid #475569',
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <a
                href="/login"
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '1.125rem', // increased from 1rem
                  fontWeight: theme.font.weights.medium,
                  color: 'white',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#1d4ed8';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#2563eb';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                Login
              </a>
              <a
                href="/signup"
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '1.125rem', // increased from 1rem
                  fontWeight: theme.font.weights.medium,
                  color: 'white',
                  backgroundColor: '#4f46e5',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#4338ca';
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#4f46e5';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
