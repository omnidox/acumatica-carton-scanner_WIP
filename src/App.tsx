import { useState } from 'react'
import './App.css'

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

// Mock API call (replace with real Acumatica endpoint)
async function fetchCartonInfo(cartonNumber: string) {
  const url =
    '/api/acumatica/AcumaticaERP/entity/CartonValidation/24.200.001/Carton?$expand=GetCartonResult';
  const body = {
    carton_nbr: {
      value: cartonNumber,
    },
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'include', // If cookies/session are needed
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch carton info: ${response.status} ${response.statusText} - ${errorText}`);
  }

  // Safe JSON parsing
  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse carton response as JSON:', parseError);
    console.log('Raw carton response:', responseText);
    throw new Error(`Invalid carton response format: ${responseText.substring(0, 200)}...`);
  }

  // Map API response to expected items format
  const items = (data.GetCartonResult || []).map((item: any) => ({
    inventory_id: item.InventoryID?.value || '',
    description: 'N/A', // No description in API response
    expected_qty: item.Quantity?.value || 0,
  }));
  return {
    carton_number: cartonNumber,
    items,
  };
}

interface Item {
  inventory_id: string;
  description: string;
  expected_qty: number;
}

// interface ScannedItem {
//   inventory_id: string;
//   count: number;
// }

function App() {
  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState('UAT 2025');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Carton scanning state
  const [cartonNumber, setCartonNumber] = useState('');
  const [expectedItems, setExpectedItems] = useState<Item[]>([]);
  const [scanned, setScanned] = useState<Record<string, number>>({});
  const [inputBarcode, setInputBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      console.log('Attempting login with:', { username, tenant }); // Don't log password
      const result = await loginToAcumatica(username, password, tenant);
      console.log('Login successful:', result);
      setIsLoggedIn(true);
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setCartonNumber('');
    setExpectedItems([]);
    setScanned({});
    setInputBarcode('');
    setError('');
  };

  const handleFetchCarton = async () => {
    setLoading(true);
    setError('');
    setExpectedItems([]);
    setScanned({});
    try {
      const data = await fetchCartonInfo(cartonNumber);
      setExpectedItems(data.items);
    } catch (e) {
      setError('Failed to fetch carton info.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = () => {
    if (!inputBarcode) return;
    // Find if barcode matches an expected item
    const item = expectedItems.find((i) => i.inventory_id === inputBarcode);
    if (!item) {
      setError(`Unknown barcode: ${inputBarcode}`);
      setInputBarcode('');
      return;
    }
    setScanned((prev) => ({
      ...prev,
      [inputBarcode]: (prev[inputBarcode] || 0) + 1,
    }));
    setInputBarcode('');
    setError('');
  };

  const getStatus = (item: Item) => {
    const scannedCount = scanned[item.inventory_id] || 0;
    if (scannedCount > item.expected_qty) return 'over';
    if (scannedCount < item.expected_qty) return 'missing';
    return 'ok';
  };

  return (
    <div className="container mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-4">Carton Scanning</h1>
      {isLoggedIn ? (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Scan carton number"
              value={cartonNumber}
              onChange={(e) => setCartonNumber(e.target.value)}
              className="border p-2 mr-2"
            />
            <button onClick={handleFetchCarton} className="bg-blue-500 text-white px-4 py-2 rounded">
              {loading ? 'Loading...' : 'Fetch Carton'}
            </button>
          </div>
          {expectedItems.length > 0 && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Scan barcode"
                value={inputBarcode}
                onChange={(e) => setInputBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                className="border p-2 mr-2"
                autoFocus
              />
              <button onClick={handleScan} className="bg-green-500 text-white px-4 py-2 rounded">
                Scan
              </button>
            </div>
          )}
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {expectedItems.length > 0 && (
            <table className="w-full border mt-4">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Inventory ID</th>
                  <th className="border px-2 py-1">Description</th>
                  <th className="border px-2 py-1">Expected Qty</th>
                  <th className="border px-2 py-1">Scanned Qty</th>
                  <th className="border px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {expectedItems.map((item) => {
                  const scannedCount = scanned[item.inventory_id] || 0;
                  const status = getStatus(item);
                  return (
                    <tr key={item.inventory_id}>
                      <td className="border px-2 py-1">{item.inventory_id}</td>
                      <td className="border px-2 py-1">{item.description}</td>
                      <td className="border px-2 py-1">{item.expected_qty}</td>
                      <td className="border px-2 py-1">{scannedCount}</td>
                      <td className={`border px-2 py-1 ${status === 'over' ? 'bg-red-200' : status === 'missing' ? 'bg-yellow-200' : 'bg-green-200'}`}>
                        {status === 'over' ? 'Over-Scan' : status === 'missing' ? 'Missing' : 'OK'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded mt-4">
            Logout
          </button>
        </>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border p-2 mr-2 mb-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 mr-2 mb-2"
            />
            <input
              type="text"
              placeholder="Tenant"
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              className="border p-2 mr-2 mb-2"
            />
            <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          <button onClick={handleTestConnection} className="bg-blue-500 text-white px-4 py-2 rounded ml-2">
            Test Connection
          </button>
          {loginError && <div className="text-red-500 mb-2">{loginError}</div>}
        </>
      )}
    </div>
  )
}

export default App
