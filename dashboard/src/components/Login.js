import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [token, setToken] = useState('');
  const [adminToken, setAdminToken] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(token, adminToken);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h2>Stigmergy Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
        <input
          type="password"
          placeholder="Auth Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ marginBottom: '10px', padding: '8px' }}
        />
        <input
          type="password"
          placeholder="Admin Token (optional)"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          style={{ marginBottom: '10px', padding: '8px' }}
        />
        <button type="submit" style={{ padding: '10px' }}>Login</button>
      </form>
    </div>
  );
};

export default Login;
