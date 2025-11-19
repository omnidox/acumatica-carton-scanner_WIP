# Acumatica Carton Scanner - Project Summary

## Overview
This is a **warehouse inventory tracking application** that integrates with Acumatica ERP to validate and track carton contents through barcode scanning. It's designed for warehouse workers to verify that cartons contain the correct items and quantities during receiving or shipping operations.

## Core Purpose
The application allows users to:
1. **Login** to Acumatica ERP with credentials
2. **Scan carton barcodes** to fetch expected inventory from Acumatica
3. **Scan individual item UPCs** to track what's actually in the carton
4. **Identify discrepancies** (missing items or over-scans)
5. **Handle over-scans** with a guided return process

## Technology Stack
- **Frontend Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5 (fast development server and optimized builds)
- **Styling**: Tailwind CSS 4.1.10 (utility-first CSS framework)
- **Language**: TypeScript 5.8.3
- **Linting**: ESLint with React-specific rules

## Key Components

### 1. Login Component (`src/components/Login.tsx`)
- Authenticates users with Acumatica ERP
- Requires: username, password, and tenant
- Uses cookie-based session management (`credentials: 'include'`)
- API endpoint: `/api/acumatica/AcumaticaERP/entity/auth/login`

### 2. CartonScanner Component (`src/components/CartonScanner.tsx`)
The main application interface with three operational phases:

**Phase 1: Fetch Carton**
- User scans a carton barcode
- Fetches expected items from Acumatica API
- Validates carton number matches

**Phase 2: Scan Items**
- User scans individual UPC barcodes
- Tracks scanned quantities vs expected quantities
- Real-time status updates (OK, Missing, Over-Scan)
- Auto-scrolling and highlighting of scanned items

**Phase 3: Handle Over-Scans**
- When items are over-scanned, user clicks "Handle Over-Scan"
- Enters a guided mode to return excess items
- Tracks return progress and updates counts

### 3. Performance Utilities (`src/utils/performance.ts`)
A comprehensive performance monitoring system including:
- Timer utilities for tracking operation speeds
- Debounce/throttle functions
- DOM update batching
- Lookup map optimization (O(1) barcode searches)

## Notable Features

### Performance Optimizations
The project has extensive performance work (documented in `PERFORMANCE_OPTIMIZATION.md`):
- **90%+ reduction** in scan-to-display latency (from 50-100ms to 5-15ms)
- O(1) barcode lookups using Map data structures
- Memoized React components to prevent unnecessary re-renders
- GPU-accelerated CSS animations
- Batched DOM updates using `requestAnimationFrame`
- Real-time performance monitoring and reporting

### User Experience Enhancements
- **Auto-focus** on input fields for seamless barcode scanning
- **Visual highlighting** (2-second pulse animation) on scanned items
- **Auto-scrolling** to bring scanned items into view
- **Session timeout detection** with user-friendly error messages
- **Color-coded status** (green=OK, yellow=missing, red=over-scan)

### Error Handling
- Unknown barcode detection
- Carton number validation
- Session expiration handling (401 Unauthorized)
- API error handling with user-friendly messages

## Project Structure
```
acumatica-carton-scanner_WIP/
├── src/
│   ├── components/
│   │   ├── Login.tsx              # Authentication
│   │   ├── CartonScanner.tsx      # Main scanning interface
│   │   └── CartonScanner.css      # Component styles
│   ├── utils/
│   │   └── performance.ts         # Performance monitoring
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── public/                        # Static assets
├── package.json                   # Dependencies
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind setup
├── README.md                      # Basic documentation
└── PERFORMANCE_OPTIMIZATION.md    # Detailed performance docs
```

## API Integration
The app communicates with Acumatica ERP through a proxy at `/api/acumatica/`:
- **Login**: `POST /api/acumatica/AcumaticaERP/entity/auth/login`
- **Fetch Carton**: `PUT /api/acumatica/AcumaticaERP/entity/CartonValidation/24.200.001/Carton`

Note: The API endpoints are proxied to avoid CORS issues.

## Data Models

### CartonItem Interface
```typescript
interface CartonItem {
  returned_carton_number: string;  // Carton identifier
  inventory_id: string;             // Product SKU/ID
  upc: string;                      // Barcode for scanning
  description: string;              // Item description
  expected_qty: number;             // Expected quantity in carton
}
```

### OverScanState Interface
```typescript
interface OverScanState {
  isActive: boolean;               // Is over-scan mode active?
  itemId: string;                  // Which item is over-scanned
  overScanCount: number;           // How many extra items scanned
  returnScanCount: number;         // How many returned so far
  itemDetails: CartonItem | null;  // Full item details
}
```

## Application Workflow

### 1. Authentication Flow
```
User enters credentials (username, password, tenant)
  → POST to /api/acumatica/auth/login
  → Session cookie stored
  → User redirected to CartonScanner
```

### 2. Carton Scanning Flow
```
User scans carton barcode
  → PUT to /api/acumatica/.../Carton with carton_nbr
  → API returns list of expected items
  → Items displayed in table with expected quantities
  → All scanned counts reset to 0
```

### 3. Item Scanning Flow
```
User scans UPC barcode
  → Lookup item in cartonItems by UPC (O(1) Map lookup)
  → Increment scanned count for that inventory_id
  → Update status (OK/Missing/Over-Scan)
  → Highlight and scroll to item
  → Clear input for next scan
```

### 4. Over-Scan Handling Flow
```
User clicks "Handle Over-Scan (N)" button
  → Enter over-scan mode
  → Display warning and progress tracker
  → User scans the same item N times to return
  → Each scan increments returnScanCount
  → When returnScanCount == overScanCount:
    → Reduce total scanned count
    → Exit over-scan mode
    → Return to normal scanning
```

## Status Calculation Logic

Items are categorized into three states:
- **OK**: `scannedCount === expectedQty` (green)
- **Missing**: `scannedCount < expectedQty` (yellow)
- **Over-Scan**: `scannedCount > expectedQty` (red)

## Performance Monitoring

The application includes built-in performance tracking:
- **scan-to-display**: Time from barcode scan to UI update
- **render-time**: Time to render component updates
- **barcode-lookup**: Time to find item by UPC

Performance reports are generated automatically and logged to console, showing:
- Average time
- Minimum time
- Maximum time
- Operation count

## Current Status (WIP Branch)
Based on recent commits on branch `claude/review-project-summary-01Egy3pgzi3vr5i6o57JXgHS`:
- Session timeout handling implementation
- Warning message fixes
- Highlighting during scanning
- Performance updates
- Auto-focusing on scanned items

## Development Commands
```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Production build (outputs to dist/)
npm run lint         # Run ESLint checks
npm run preview      # Preview production build
```

## Key Implementation Details

### Session Management
- Cookie-based authentication with Acumatica
- Automatic detection of 401 Unauthorized responses
- User-friendly session expiration messages
- Logout functionality clears session

### Performance Optimizations Applied
1. **React.memo** on expensive components
2. **useMemo** for status calculations and lookup maps
3. **useCallback** for event handlers
4. **Map data structure** for O(1) barcode lookups instead of O(n) array searches
5. **Batched state updates** using requestAnimationFrame
6. **GPU-accelerated CSS** with transform and will-change properties
7. **Optimized Vite configuration** with chunk splitting and tree shaking

### Visual Feedback System
- 2-second highlight animation on scanned items
- Smooth scrolling to bring items into view
- Color-coded status badges
- Real-time quantity updates
- Over-scan warning banners

## API Response Handling

### Login Response
- Empty response or JSON with success indicator
- Session stored in cookie automatically
- Error responses include status codes and messages

### Carton Response Format
```json
{
  "GetCartonResult": [
    {
      "InventoryID": { "value": "ITEM-001" },
      "AlternateID": { "value": "123456789012" },
      "Quantity": { "value": 5 },
      "Carton": { "value": "CARTON-12345" }
    }
  ]
}
```

## Error Scenarios Handled
1. **Empty carton number** - "No carton number found"
2. **Carton mismatch** - "Carton number does not match"
3. **Unknown UPC** - "Unknown barcode: [barcode]"
4. **Wrong item during return** - "Please scan the correct item"
5. **Session expired** - "Your session has expired. Please log in again"
6. **Network errors** - "Failed to fetch carton info"
7. **Invalid JSON responses** - Detailed parsing error messages

## Future Enhancement Opportunities
As noted in `PERFORMANCE_OPTIMIZATION.md`:
1. **Virtual scrolling** for large carton lists
2. **Web Workers** for heavy computations
3. **Service Workers** for offline functionality
4. **IndexedDB** for local caching
5. **WebAssembly** for complex calculations
6. **Performance dashboard** with visual metrics
7. **Alert system** for performance degradation
8. **A/B testing** for optimization validation

## Deployment Considerations
- Requires proxy configuration for `/api/acumatica/` endpoints
- Session cookies must be properly configured
- CORS settings must allow credential sharing
- HTTPS recommended for production (credentials in transit)
- Consider CDN for static assets
- Monitor performance metrics in production

## Summary
This is a **well-architected, production-ready warehouse scanning application** with:
- Robust Acumatica ERP integration
- Extensive performance optimizations
- Comprehensive error handling
- Intuitive user experience
- Real-time feedback and validation
- Built for high-frequency scanning operations

The codebase demonstrates best practices in React/TypeScript development, with particular attention to performance, user experience, and enterprise API integration.
