import { useState } from 'react';

// Login function
async function loginToAcumatica(username: string, password: string, tenant: string) {
  // Use proxy to avoid CORS issues
  const url = '/api/acumatica/AcumaticaERP/entity/auth/login';
  const body = {
    name: username,
    password: password,
    tenant: tenant,
  };

  console.log('Making login request to:', url);
  console.log('Request body:', { name: username, tenant, password: '***' });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'include', // Important for session cookies
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  // Get the response text first to see what we're actually getting
  const responseText = await response.text();
  console.log('Raw response text:', responseText);

  if (!response.ok) {
    console.error('Login failed with response:', responseText);
    throw new Error(`Login failed: ${response.status} ${response.statusText} - ${responseText}`);
  }

  // Try to parse as JSON, but handle non-JSON responses
  let result;
  try {
    result = JSON.parse(responseText);
    console.log('Login response (parsed):', result);
  } catch (parseError) {
    console.error('Failed to parse response as JSON:', parseError);
    console.log('Response was not valid JSON. Raw response:', responseText);
    // If it's not JSON but the status is OK, we might still be logged in
    if (responseText.trim() === '') {
      result = { success: true, message: 'Login successful (empty response)' };
    } else {
      throw new Error(`Invalid response format: ${responseText.substring(0, 200)}...`);
    }
  }

  return result;
}

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState('UAT 2025');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    try {
      console.log('Attempting login with:', { username, tenant }); // Don't log password
      const result = await loginToAcumatica(username, password, tenant);
      console.log('Login successful:', result);
      onLoginSuccess();
    } catch (e) {
      console.error('Login error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Login failed. Please check your credentials.';
      setLoginError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="container mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-4">Acumatica Carton Scanner - Login</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border p-2 mr-2 mb-2 w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border p-2 mr-2 mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Tenant"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border p-2 mr-2 mb-2 w-full"
        />
        <button 
          onClick={handleLogin} 
          className="bg-blue-500 text-white px-4 py-2 rounded w-full text-sm"
          disabled={loginLoading}
        >
          {loginLoading ? 'Logging in...' : 'Login'}
        </button>
      </div>
      {loginError && <div className="text-red-500 mb-2 text-center">{loginError}</div>}
    </div>
  );
} 