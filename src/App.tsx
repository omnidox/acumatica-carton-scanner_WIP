import { useState } from 'react'
import './App.css'

// Mock API call (replace with real Acumatica endpoint)
async function fetchCartonInfo(cartonNumber: string) {
  // Simulate API response
  return new Promise<any>((resolve) => {
    setTimeout(() => {
      resolve({
        carton_number: cartonNumber,
        items: [
          { inventory_id: 'A123', description: 'Widget A', expected_qty: 3 },
          { inventory_id: 'B456', description: 'Widget B', expected_qty: 2 },
          { inventory_id: 'C789', description: 'Widget C', expected_qty: 1 },
        ],
      });
    }, 500);
  });
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
  const [cartonNumber, setCartonNumber] = useState('');
  const [expectedItems, setExpectedItems] = useState<Item[]>([]);
  const [scanned, setScanned] = useState<Record<string, number>>({});
  const [inputBarcode, setInputBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter carton number"
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
    </div>
  )
}

export default App
