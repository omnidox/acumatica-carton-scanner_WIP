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

// Test function to check if the proxy is working
async function testProxyConnection() {
  try {
    console.log('Testing proxy connection...');
    const response = await fetch('/api/acumatica/AcumaticaERP/entity/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    console.log('Proxy test response status:', response.status);
    const text = await response.text();
    console.log('Proxy test response:', text.substring(0, 500));
    return response.status < 500; // Consider any non-server error as "working"
  } catch (error) {
    console.error('Proxy test failed:', error);
    return false;
  }
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

  const handleTestConnection = async () => {
    setLoginError('');
    try {
      const isWorking = await testProxyConnection();
      if (isWorking) {
        setLoginError('Connection test successful! Proxy is working.');
      } else {
        setLoginError('Connection test failed. Check proxy configuration.');
      }
    } catch (e) {
      setLoginError(`Connection test error: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
          className="border p-2 mr-2 mb-2 w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 mr-2 mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Tenant"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          className="border p-2 mr-2 mb-2 w-full"
        />
        <div className="flex gap-2">
          <button 
            onClick={handleLogin} 
            className="bg-blue-500 text-white px-4 py-2 rounded flex-1"
            disabled={loginLoading}
          >
            {loginLoading ? 'Logging in...' : 'Login'}
          </button>
          <button 
            onClick={handleTestConnection} 
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Test Connection
          </button>
        </div>
      </div>
      {loginError && <div className="text-red-500 mb-2">{loginError}</div>}
    </div>
  );
} 