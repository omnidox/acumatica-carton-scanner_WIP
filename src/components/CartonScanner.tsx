import { useState } from 'react';

interface Item {
  returned_carton_number: string;
  inventory_id: string;
  description: string;
  expected_qty: number;
}

// API call to fetch carton information
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
    credentials: 'include', // TODO:what is this? If cookies/session are needed
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch carton info: ${response.status} ${response.statusText} - ${errorText}`);
  }

  // JSON parsing
  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse carton response as JSON:', parseError);
    console.log('Raw carton response:', responseText);
    throw new Error(`Invalid carton response format: ${responseText.substring(0, 200)}...`);
  }

  // Check if we have any items in the response
  if (!data.GetCartonResult || data.GetCartonResult.length === 0) {
    // No items found - this means the carton number doesn't exist
    return {
      returned_carton_number: '',
      items: [],
    };
  }

  // Map API response to expected items format
  const items = data.GetCartonResult.map((item: any) => ({
    inventory_id: item.InventoryID?.value || '',
    expected_qty: item.Quantity?.value || 0,
    returned_carton_number: item.Carton?.value || '',
  }));

  // Check if the first item has a valid carton number
  const firstItem = items[0];
  const returnedCartonNumber = firstItem.returned_carton_number || '';

  return {
    returned_carton_number: returnedCartonNumber,
    items,
  };
}

interface CartonScannerProps {
  onLogout: () => void;
}

export default function CartonScanner({ onLogout }: CartonScannerProps) {
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
      console.log('Fetching carton:', cartonNumber);
      const data = await fetchCartonInfo(cartonNumber);
      console.log('API response:', data);
      console.log('Returned carton number:', data.returned_carton_number);
      console.log('Input carton number:', cartonNumber);
      
      if (data.returned_carton_number == cartonNumber) {
        console.log('Carton numbers match - setting items');
        setExpectedItems(data.items);
      } 
      else if (data.returned_carton_number == '') {
        console.log('Empty carton number returned - showing error');
        // No carton number found
        setError('No carton number found.');
        return;
      }
      else {
        console.log('Carton numbers do not match - showing error');
        // Error with carton number fetching
        setError('Carton number does not match.');
        return;
      }
    } catch (e) {
      console.error('Exception caught:', e);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const handleCartonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFetchCarton();
    }
  };

  return (
    <div className="container mx-auto max-w-xl p-4">
      <h1 className="text-xs font-bold mb-4">Carton Scanning</h1>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Scan carton number"
          value={cartonNumber}
          onChange={(e) => setCartonNumber(e.target.value)}
          onKeyDown={handleCartonKeyDown}
          className="border p-2 mr-2 w-full mb-2"
        />
        <button 
          onClick={handleFetchCarton} 
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Carton'}
        </button>
        
        {/* ERROR MESSAGE - BELOW THE CARTON NUMBER FIELD */}
        {error && (
          <div className="text-red-500 mt-2 text-center">
            {error}
          </div>
        )}
      </div>
      
      {expectedItems.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Scan barcode"
            value={inputBarcode}
            onChange={(e) => setInputBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border p-2 mr-2 w-full mb-2"
            autoFocus
          />
          <button 
            onClick={handleScan} 
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
          >
            Scan
          </button>
        </div>
      )}
      
      {expectedItems.length > 0 && (
        <table className="w-full border mt-4">
          <thead>
            <tr>
              <th className="border px-2 py-1">Inventory ID</th>
              {/* <th className="border px-2 py-1">Description</th> */}
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
                  {/* <td className="border px-2 py-1">{item.description}</td> */}
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
  );
} 