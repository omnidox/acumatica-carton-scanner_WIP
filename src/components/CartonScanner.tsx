import { useState, useRef, useEffect } from 'react';
import './CartonScanner.css';

interface CartonItem {
  returned_carton_number: string;
  inventory_id: string;
  upc: string;
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
    upc: item.AlternateID?.value || '',
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
  const [lastScannedItem, setLastScannedItem] = useState<string | null>(null);

  // Refs for scrolling to items
  const itemRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

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

  // Helper function for status styling
  const getStatusClass = (status: string) => {
    const statusClasses = {
      over: 'carton-status-over',
      missing: 'carton-status-missing', 
      ok: 'carton-status-ok'
    };
    return statusClasses[status as keyof typeof statusClasses];
  };

  // Scan barcode and update scanned count
  const handleScan = () => {
    if (!inputBarcode) return;

    // Find if barcode matches an expected item by UPC
    const item = cartonItems.find((i) => i.upc === inputBarcode);

    if (!item) {
      setError(`Unknown barcode: ${inputBarcode}`);
      setInputBarcode('');
      return;
    }
    
    setScanned((prev) => ({
      ...prev,
      [item.inventory_id]: (prev[item.inventory_id] || 0) + 1,
    }));
    
    // Set the last scanned item for highlighting and scrolling
    setLastScannedItem(item.inventory_id);
    setInputBarcode('');
    setError('');
  };

  // Effect to scroll to the last scanned item
  useEffect(() => {
    if (lastScannedItem && itemRefs.current[lastScannedItem]) {
      const element = itemRefs.current[lastScannedItem];
      if (element) {
        // Scroll the element into view with smooth behavior
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Add a temporary highlight class
        element.classList.add('carton-item-highlight');
        
        // Remove the highlight after 2 seconds
        setTimeout(() => {
          element.classList.remove('carton-item-highlight');
        }, 2000);
      }
    }
  }, [lastScannedItem]);

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
    <div className="carton-scanner-container">      
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Scan carton number"
          value={cartonNumber}
          onChange={(e) => setCartonNumber(e.target.value)}
          onKeyDown={(e) => handleCartonScanKeyDown(e.key)}
          className="carton-input"
          autoFocus
        />
        <button 
          onClick={fetchCartonDetails} 
          className="carton-button-primary"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Carton'}
        </button>
      </div>

      {error && (
        <div className="carton-error">
          {error}
        </div>
      )}

      {cartonItems.length > 0 && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Scan UPC barcode"
            value={inputBarcode}
            onChange={(e) => setInputBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="carton-input"
            autoFocus
          />
          <button 
            onClick={handleScan} 
            className="carton-button-success"
          >
            Scan
          </button>
        </div>
      )}
      
      {cartonItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="carton-table">
            <thead className="carton-table-header">
              <tr>
                <th className="carton-table-header-cell">UPC</th>
                <th className="carton-table-header-cell">InventoryID</th>
                <th className="carton-table-header-cell">Quantity</th>
                <th className="carton-table-header-cell">Scanned Quantity</th>
                <th className="carton-table-header-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {cartonItems.map((item) => {
                const scannedCount = scanned[item.inventory_id] || 0;
                const status = getStatus(item);
                return (
                  <tr 
                    key={item.inventory_id} 
                    className="carton-table-row"
                    ref={(el) => {
                      itemRefs.current[item.inventory_id] = el;
                    }}
                  >
                    <td className="carton-table-cell">{item.upc}</td>
                    <td className="carton-table-cell">{item.inventory_id}</td>
                    <td className="carton-table-cell">{item.expected_qty}</td>
                    <td className="carton-table-cell">{scannedCount}</td>
                    <td className={getStatusClass(status)}>
                      {status === 'over' ? 'Over-Scan' : status === 'missing' ? 'Missing' : 'OK'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 