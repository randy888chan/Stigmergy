import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard.js';
import Login from './components/Login.js';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token, adminToken) => {
    localStorage.setItem('authToken', token);
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
    }
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Dashboard />
  );
}

export default App;
