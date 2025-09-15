import React from 'react';
import { AuthProvider } from './contexts/AuthContext.js';
import Dashboard from './pages/Dashboard.js';
import Login from './components/Login.js';
import { useAuth } from './contexts/AuthContext.js';
import './styles/App.css';

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="App">
      {isAuthenticated ? <Dashboard /> : <Login />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;