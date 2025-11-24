import React from 'react';
import './Login.css'; // Імпортуємо стилі

// Видалено всі класи Tailwind
function Login({
  username,
  setUsername,
  password,
  setPassword,
  loading,
  error,
  handleLogin
}) {
  return (
    <div className="login-container">
      <h2>Login to Matrix</h2>
      
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username (e.g., @user:matrix.org)"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      
      <button
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? 'Вхід...' : 'Увійти'}
      </button>
      
      {error && (
        <p className="error-message">{error}</p>
      )}
    </div>
  );
}

export default Login;