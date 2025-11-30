import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Home from '../pages/Home';
import RegisterStudent from '../pages/RegisterStudent';
import RegisterFaculty from '../pages/RegisterFaculty';
import TeamForm from '../pages/TeamForm';
import SubmitProject from '../pages/SubmitProject';

const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleLocationChange);
    
    // Check for hash changes or manual navigation
    const interval = setInterval(() => {
      if (window.location.pathname !== currentPath) {
        handleLocationChange();
      }
    }, 100);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, [currentPath]);

  // Handle anchor tag clicks
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href')?.startsWith('/')) {
        e.preventDefault();
        const href = link.getAttribute('href');
        window.history.pushState({}, '', href);
        setCurrentPath(href);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const renderPage = () => {
    switch (currentPath) {
      case '/register-student':
        return <RegisterStudent />;
      case '/register-faculty':
        return <RegisterFaculty />;
      case '/form-team':
        return <TeamForm />;
      case '/submit-project':
        return <SubmitProject />;
      case '/':
      default:
        return <Home />;
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div>
        {renderPage()}
      </div>
    </>
  );
};

export default App;

