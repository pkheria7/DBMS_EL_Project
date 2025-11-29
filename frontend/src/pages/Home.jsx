import React from 'react';
import theme from '../theme';
import Navbar from '../components/Navbar';

const Home = () => {
  const ctaButtons = [
    { label: 'Register Student', href: '/register-student' },
    { label: 'Form Team', href: '/form-team' },
    { label: 'Submit Project', href: '/submit-project' },
  ];

  return (
    <div>
      <Navbar />
      <div className="min-h-screen hero-gradient flex items-center justify-center relative overflow-hidden">
      <div className="text-center px-4 sm:px-6 lg:px-8 z-10">
        {/* Title with fade-up animation */}
        <h1 className="text-5xl font-bold text-white drop-shadow-lg fade-up mb-4" style={{ fontFamily: theme.font.family }}>
          TeamSync – EL Project Collaboration Platform
        </h1>

        {/* Subtitle with fade-up animation */}
        <p className="text-lg text-white/90 mt-4 fade-up-delay-1">
          Form Teams • Submit Ideas • Get Approved • Build Innovation
        </p>

        {/* CTA Buttons with fade-up animation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12 fade-up-delay-2">
          {ctaButtons.map((button) => (
            <a
              key={button.label}
              href={button.href}
              className="bg-white text-primary px-8 py-4 rounded-xl shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 font-medium"
              style={{ 
                fontFamily: theme.font.family,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {button.label}
            </a>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};

export default Home;
