import { useState } from 'react';

interface CartonItem {
  returned_carton_number: string;
  inventory_id: string;
  description: string;
  expected_qty: number;
}

// API call to fetch carton information
async function fetchCartonDetailsInfo(cartonNumber: string) {
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

export default function CartonScanner() {
  // State declarations
  const [cartonNumber, setCartonNumber] = useState('');
  const [cartonItems, setCartonItems] = useState<CartonItem[]>([]);
  const [scanned, setScanned] = useState<Record<string, number>>({});
  const [inputBarcode, setInputBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Event handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const handleCartonScanKeyDown = (key: string) => {
    if (key === 'Enter') {
      fetchCartonDetails();
    }
  };

  // Show status of scanned item
  const getStatus = (item: CartonItem) => {
    const scannedCount = scanned[item.inventory_id] || 0;
    if (scannedCount > item.expected_qty) return 'over';
    if (scannedCount < item.expected_qty) return 'missing';
    return 'ok';
  };

  // Scan barcode and update scanned count
  const handleScan = () => {

    if (!inputBarcode) return;

    // Find if barcode matches an expected item
    const item = cartonItems.find((i) => i.inventory_id === inputBarcode);

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

  const fetchCartonDetails = async () => {
    if (cartonNumber == '') {
      console.log('Empty carton number returned - showing error');
      setError('No carton number found.');
      return;
    }
    setError('');
    setCartonItems([]);
    setScanned({});
    try {
      console.log('Fetching carton:', cartonNumber);
      setLoading(true);
      const data = await fetchCartonDetailsInfo(cartonNumber);
      
      // console.log('API response:', data);
      // console.log('Returned carton number:', data.returned_carton_number);
      // console.log('Input carton number:', cartonNumber);
      
      if (data.returned_carton_number == cartonNumber) {
        // console.log('Carton numbers match - setting items');
        setCartonItems(data.items);
      } 

      else {
        console.log('Carton numbers do not match - showing error');
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

  // Render
  return (
    <div className="container mx-auto max-w-xl p-4">      
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Scan carton number"
          value={cartonNumber}
          onChange={(e) => setCartonNumber(e.target.value)}
          onKeyDown={(e) =>handleCartonScanKeyDown(e.key)}
          className="border p-2 mb-2"
          style={{ width: 250 }}
          autoFocus
        />
        <button 
          onClick={fetchCartonDetails} 
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition-colors mb-2"
          disabled={loading}
          style={{ width: 120 }}
        >
          {loading ? 'Loading...' : 'Fetch Carton'}
        </button>
      </div>
      {error && (
        <div className="text-red-500 mt-2 text-center">
          {error}
        </div>
      )}
      {cartonItems.length > 0 && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Scan barcode"
            value={inputBarcode}
            onChange={(e) => setInputBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border p-2 mb-2"
            style={{ width: 250 }}
            autoFocus
          />
          <button 
            onClick={handleScan} 
            className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition-colors mb-2"
            style={{ width: 120 }}
          >
            Scan
          </button>
        </div>
      )}
      
      {cartonItems.length > 0 && (
        <table className="w-full border mt-4">
          <thead>
            <tr>
              <th className="border px-2 py-1">InventoryID</th>
              <th className="border px-2 py-1">Quantity</th>
              <th className="border px-2 py-1">Scanned Quantity</th>
              <th className="border px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {cartonItems.map((item) => {
              const scannedCount = scanned[item.inventory_id] || 0;
              const status = getStatus(item);
              return (
                <tr key={item.inventory_id}>
                  <td className="border px-2 py-1">{item.inventory_id}</td>
                  <td className="border px-2 py-1">{item.expected_qty}</td>
                  <td className="border px-2 py-1">{scannedCount}</td>
                  <td
                    className="border px-2 py-1"
                    style={{
                      backgroundColor:
                        status === 'over'
                          ? '#fecaca' // Tailwind bg-red-200
                          : status === 'missing'
                          ? '#fef08a' // Tailwind bg-yellow-200
                          : '#bbf7d0', // Tailwind bg-green-200

                    }}
                  >
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