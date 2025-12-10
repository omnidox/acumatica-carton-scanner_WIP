# Acumatica Carton Scanner - Setup and Demo Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Understanding the Application](#understanding-the-application)
4. [Connecting to Acumatica](#connecting-to-acumatica)
5. [Running the Application](#running-the-application)
6. [Testing and Demo Walkthrough](#testing-and-demo-walkthrough)
7. [Troubleshooting](#troubleshooting)
8. [Identifying Improvements](#identifying-improvements)

---

## Prerequisites

### Required Software
Before you begin, ensure you have the following installed on your computer:

1. **Node.js** (version 18.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`
   - Should show v18.x.x or higher

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`
   - Should show 9.x.x or higher

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

4. **Text Editor** (recommended)
   - Visual Studio Code: https://code.visualstudio.com/
   - Or any code editor of your choice

### System Requirements
- **Operating System**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: At least 500MB free space
- **Internet Connection**: Required for installation and Acumatica API access

---

## Initial Setup

### Step 1: Get the Code
If you received this as a zip file:
```bash
# Extract the zip file to a location of your choice
# Navigate to the extracted folder
cd acumatica-carton-scanner_WIP
```

If using Git:
```bash
# Clone the repository
git clone <repository-url>
cd acumatica-carton-scanner_WIP
```

### Step 2: Install Dependencies
Open a terminal/command prompt in the project directory and run:

```bash
npm install
```

This will install all required packages (React, TypeScript, Vite, Tailwind CSS, etc.). This may take 2-5 minutes depending on your internet connection.

**Expected output:**
```
added 234 packages, and audited 235 packages in 2m
```

### Step 3: Verify Installation
After installation completes, verify that everything is set up correctly:

```bash
npm run lint
```

If no errors appear, your setup is correct.

---

## Understanding the Application

### Application Architecture

The Acumatica Carton Scanner is a React-based web application that consists of:

#### 1. **Frontend Components** (`src/components/`)
- **Login.tsx**: Handles user authentication with Acumatica
- **CartonScanner.tsx**: Main scanning interface for carton validation
- **CartonScanner.css**: Component-specific styles

#### 2. **Utility Modules** (`src/utils/`)
- **performance.ts**: Performance monitoring and optimization utilities

#### 3. **Configuration Files**
- **vite.config.ts**: Build tool configuration and API proxy settings
- **tailwind.config.js**: CSS framework configuration
- **tsconfig.json**: TypeScript compiler settings

### How It Works - Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER AUTHENTICATION                                      │
│                                                             │
│  User enters credentials (username, password, tenant)      │
│         ↓                                                   │
│  POST /api/acumatica/AcumaticaERP/entity/auth/login       │
│         ↓                                                   │
│  Session cookie stored (Acumatica session management)      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CARTON SCANNING                                          │
│                                                             │
│  User scans carton barcode (e.g., "CARTON-12345")         │
│         ↓                                                   │
│  PUT /api/acumatica/.../Carton?$expand=GetCartonResult    │
│         ↓                                                   │
│  API returns list of expected items with quantities        │
│         ↓                                                   │
│  Display items in table (all scanned counts = 0)          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ITEM VALIDATION                                          │
│                                                             │
│  User scans item UPC (e.g., "123456789012")               │
│         ↓                                                   │
│  Lookup item in cartonItems by UPC (O(1) Map lookup)      │
│         ↓                                                   │
│  Increment scanned count for matched item                  │
│         ↓                                                   │
│  Update status: OK (green), Missing (yellow), Over (red)   │
│         ↓                                                   │
│  Highlight row and scroll into view                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ERROR HANDLING (If Over-Scanned)                        │
│                                                             │
│  User clicks "Handle Over-Scan (N)" button                 │
│         ↓                                                   │
│  Enter return mode (app expects N return scans)            │
│         ↓                                                   │
│  User scans the same item N times                          │
│         ↓                                                   │
│  Reduce total scanned count by N                           │
│         ↓                                                   │
│  Exit return mode, back to normal scanning                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Features Explained

1. **Session-Based Authentication**
   - Uses cookie-based sessions (no tokens to manage)
   - Session expires after inactivity
   - Automatic detection of expired sessions

2. **Real-Time Validation**
   - Instant feedback as items are scanned
   - Color-coded status indicators
   - Visual highlighting and auto-scrolling

3. **Over-Scan Recovery**
   - Guided process to return excess items
   - Progress tracking
   - Prevents accidental data corruption

4. **Performance Optimizations**
   - O(1) barcode lookups using Map data structures
   - React.memo to prevent unnecessary re-renders
   - GPU-accelerated CSS animations
   - Sub-15ms scan-to-display latency

---

## Connecting to Acumatica

### Current Configuration

The application is currently configured to connect to:
```
Target: https://istar.privatecloudcorp.com
```

This is configured in `vite.config.ts` (lines 8-19).

### Understanding the Proxy

The Vite development server includes a proxy that:
1. Intercepts requests to `/api/acumatica/*`
2. Forwards them to the Acumatica server
3. Removes the `/api/acumatica` prefix
4. Handles CORS headers automatically

**Example:**
```
Frontend Request:  /api/acumatica/AcumaticaERP/entity/auth/login
                          ↓ (proxy rewrites to)
Acumatica Request: /AcumaticaERP/entity/auth/login
```

### Option A: Use Existing Acumatica Instance (Your Company Server)

If you want to connect to your company's Acumatica instance:

1. **Find Your Acumatica URL**
   - Ask your IT department for the Acumatica ERP URL
   - It might look like: `https://your-company.acumatica.com`

2. **Update vite.config.ts**
   - Open `vite.config.ts` in your text editor
   - Find line 10: `target: 'https://istar.privatecloudcorp.com',`
   - Replace with your company's URL:
     ```typescript
     target: 'https://your-company.acumatica.com',
     ```

3. **Check Network Access**
   - Ensure you can access the Acumatica URL from your computer
   - You may need to be on company VPN
   - Test by opening the URL in a web browser

4. **Get Test Credentials**
   - Username (e.g., `admin`)
   - Password
   - Tenant name (e.g., `Company`)

### Option B: Use Acumatica Sandbox (Local Installation)

If you want to set up a local Acumatica instance for testing:

1. **Download Acumatica**
   - Visit: https://builds.acumatica.com
   - Download the latest version (e.g., 2025 R1)

2. **System Requirements**
   - Windows OS (required)
   - SQL Server 2019 or higher
   - IIS (Internet Information Services)
   - Minimum 8GB RAM

3. **Installation Steps**
   - Run the Acumatica installer
   - Choose "Sales Demo" data during setup
   - This will create sample cartons and inventory items
   - Default credentials: `Admin` / `setup`

4. **Update vite.config.ts**
   - Change target to your local instance:
     ```typescript
     target: 'http://localhost',  // or http://localhost:8080
     ```

5. **Create Custom Carton Data**
   - You'll need to create a custom entity "CartonValidation"
   - This requires Acumatica customization knowledge
   - Consider consulting with your company's Acumatica developer

### Option C: Mock Data Mode (No Acumatica Required)

If you don't have access to Acumatica but want to demo the UI:

**Note:** This option requires code modifications. I can help you add a mock data mode that simulates the API responses without requiring a real Acumatica connection. This is ideal for:
- Understanding the UI/UX flow
- Testing the scanning interface
- Demonstrating to stakeholders
- Home development without VPN access

Let me know if you'd like me to implement this option.

---

## Running the Application

### Development Mode (Recommended for Testing)

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Expected Output**
   ```
   VITE v6.3.5  ready in 523 ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ➜  press h + enter to show help
   ```

3. **Open in Browser**
   - Navigate to: http://localhost:5173/
   - You should see the login screen

4. **Development Features**
   - Hot Module Replacement (HMR): Changes reflect instantly
   - Error overlays for debugging
   - TypeScript type checking
   - ESLint warnings in console

### Production Build (For Deployment)

1. **Build the Application**
   ```bash
   npm run build
   ```

   This creates an optimized production build in the `dist/` folder.

2. **Preview the Production Build**
   ```bash
   npm run preview
   ```

   This serves the production build locally for testing.

3. **Deploy to Server**
   - Upload the contents of `dist/` folder to your web server
   - Configure your server to proxy `/api/acumatica/*` requests
   - Ensure proper HTTPS configuration

---

## Testing and Demo Walkthrough

### Pre-Demo Checklist

Before demonstrating the application, ensure:
- [ ] Development server is running (`npm run dev`)
- [ ] You can access the Acumatica instance
- [ ] You have valid login credentials
- [ ] You know at least one valid carton number
- [ ] You have a way to simulate barcode scanning (keyboard entry is fine)

### Demo Scenario: Carton Validation

#### Phase 1: Authentication (2 minutes)

1. **Open the Application**
   - Navigate to http://localhost:5173/
   - You should see "Acumatica Carton Scanner - Login"

2. **Enter Credentials**
   - Username: `[your-username]`
   - Password: `[your-password]`
   - Tenant: `[your-tenant]`

3. **Login**
   - Click "Login" or press Enter
   - Expected result: Redirected to main scanner interface

**Troubleshooting:**
- If login fails with "401 Unauthorized": Check credentials
- If login fails with network error: Check Acumatica URL in vite.config.ts
- If CORS error: Ensure proxy is configured correctly

#### Phase 2: Fetch Carton (2 minutes)

1. **Enter Carton Number**
   - In the "Scan carton number" field, type a valid carton number
   - Example: `CARTON-12345` (use a real one from your system)

2. **Fetch Carton Data**
   - Click "Fetch Carton" or press Enter
   - Expected result: Table appears showing expected items

3. **Review Expected Items**
   - Table shows: UPC, Inventory ID, Expected Quantity
   - All "Scanned Quantity" values should be 0
   - All status should show "Missing" (yellow)

**What to Observe:**
- Loading indicator while fetching
- Clear error messages if carton not found
- Proper formatting of item data

#### Phase 3: Scan Items (5 minutes)

1. **Scan First Item**
   - Click in "Scan UPC barcode" field (should auto-focus)
   - Enter a valid UPC from the table
   - Press Enter

2. **Observe Behavior**
   - ✅ Scanned quantity increments
   - ✅ Row highlights with yellow pulse (2 seconds)
   - ✅ Page auto-scrolls to the scanned item
   - ✅ Input field clears automatically
   - ✅ Status changes based on quantity

3. **Scan Until Complete**
   - Continue scanning items until all show "OK" (green)
   - Status logic:
     - **Missing** (yellow): Scanned < Expected
     - **OK** (green): Scanned = Expected
     - **Over-Scan** (red): Scanned > Expected

4. **Test Performance**
   - Notice the instant feedback (< 15ms)
   - No lag between scans
   - Smooth animations

**What to Observe:**
- Color changes: yellow → green as items are scanned
- Visual highlighting helps identify what was just scanned
- Auto-scrolling keeps scanned item in view
- Clean, intuitive interface

#### Phase 4: Handle Over-Scan (3 minutes)

1. **Create an Over-Scan**
   - Scan an item one more time than expected
   - Example: If expected quantity is 5, scan 6 times

2. **Observe Error State**
   - Status changes to "Over-Scan" (red background)
   - "Handle Over-Scan (1)" button appears in Actions column

3. **Initiate Return Process**
   - Click "Handle Over-Scan (1)" button
   - Orange warning banner appears at top
   - Input field placeholder changes to "Scan item to return"

4. **Return Extra Items**
   - Scan the same UPC again (1 time for 1 over-scan)
   - Progress counter updates: "Returned: 1 / 1"
   - Row highlights as item is "returned"

5. **Complete Return**
   - When all extra items are returned:
     - Scanned quantity decreases by over-scan amount
     - Status returns to "OK" (green)
     - Warning banner disappears
     - Normal scanning mode resumes

**What to Observe:**
- Clear guidance during return process
- Progress tracking
- Validation that correct item is being returned
- Smooth transition back to normal mode

#### Phase 5: Test Error Scenarios (3 minutes)

1. **Unknown Barcode**
   - Scan a UPC that's not in the carton
   - Expected: Red error message "Unknown barcode: [barcode]"

2. **Wrong Item During Return**
   - Trigger over-scan mode
   - Try scanning a different item
   - Expected: Error message prompting for correct item

3. **Invalid Carton Number**
   - Fetch a non-existent carton number
   - Expected: Error message "Carton number does not match"

4. **Session Timeout**
   - Wait for session to expire (or force logout)
   - Try scanning
   - Expected: "Your session has expired. Please log in again."

**What to Observe:**
- Clear, user-friendly error messages
- Errors don't crash the application
- Easy recovery from errors

### Performance Testing

Open browser DevTools (F12) and check Console:

1. **Performance Metrics**
   - Look for messages like: `⏱️ scan-to-display: 12.45ms`
   - These show real-time performance data

2. **After 10 Scans**
   - A performance report is automatically generated
   - Shows average, min, max scan times

3. **Expected Performance**
   - Scan-to-display: 5-15ms
   - Barcode lookup: < 1ms
   - Render time: 2-8ms

### Demo Script Summary

```
Total Demo Time: ~15-20 minutes

1. Login (2 min)
   - Show authentication flow
   - Explain session management

2. Fetch Carton (2 min)
   - Demonstrate carton lookup
   - Review expected items

3. Normal Scanning (5 min)
   - Scan items to completion
   - Highlight performance and UX features
   - Show status changes

4. Over-Scan Handling (3 min)
   - Create over-scan scenario
   - Walk through return process
   - Emphasize error recovery

5. Error Scenarios (3 min)
   - Test various error conditions
   - Show robust error handling

6. Q&A and Discussion (5 min)
   - Gather feedback
   - Discuss improvements
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Cannot find module" errors during `npm install`

**Symptoms:**
```
Error: Cannot find module 'react'
```

**Solution:**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Issue 2: Port 5173 already in use

**Symptoms:**
```
Port 5173 is in use, trying another one...
```

**Solution:**
- Either stop the other process using port 5173
- Or let Vite automatically choose another port
- Or specify a custom port:
  ```bash
  npm run dev -- --port 3000
  ```

#### Issue 3: Login fails with CORS error

**Symptoms:**
```
Access to fetch at '...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution:**
- Ensure proxy is configured in `vite.config.ts`
- Check that `changeOrigin: true` is set
- Verify Acumatica allows requests from your domain
- Try restarting the dev server

#### Issue 4: API returns 401 Unauthorized

**Symptoms:**
- Login button shows error
- Console shows "401 Unauthorized"

**Solution:**
- Verify credentials are correct
- Check tenant name (case-sensitive)
- Ensure Acumatica instance is accessible
- Try logging in directly to Acumatica in browser

#### Issue 5: Carton data not loading

**Symptoms:**
- "Fetch Carton" button does nothing
- Or shows error message

**Solution:**
- Verify carton number exists in Acumatica
- Check browser console for error details
- Verify the CartonValidation entity exists
- Check API endpoint version (24.200.001)

#### Issue 6: Session expires quickly

**Symptoms:**
- "Your session has expired" message appears frequently

**Solution:**
- Check Acumatica session timeout settings
- May need to increase timeout in Acumatica admin
- Consider implementing session refresh mechanism

#### Issue 7: Slow performance

**Symptoms:**
- Lag when scanning items
- UI feels sluggish

**Solution:**
- Check browser console for performance metrics
- Close other browser tabs
- Ensure development server isn't throttled
- Try production build (`npm run build` then `npm run preview`)

#### Issue 8: TypeScript errors

**Symptoms:**
```
Type 'string' is not assignable to type 'number'
```

**Solution:**
- Fix TypeScript errors in code
- Or temporarily disable strict checking (not recommended)
- Check `tsconfig.json` settings

---

## Identifying Improvements

### Areas to Evaluate During Testing

#### 1. Performance Analysis

**What to Measure:**
- [ ] Average scan-to-display time (target: < 15ms)
- [ ] Memory usage over extended scanning sessions
- [ ] Browser CPU usage during scanning
- [ ] Network latency to Acumatica API
- [ ] Time to load large cartons (50+ items)

**Tools:**
- Browser DevTools > Performance tab
- Console logs (automatic performance reporting)
- Network tab (API call timing)

**Questions to Ask:**
- Is the scan response instant enough for warehouse workers?
- Does performance degrade over time?
- Are there any noticeable delays or stutters?

#### 2. User Experience

**What to Observe:**
- [ ] Clarity of error messages
- [ ] Intuitiveness of over-scan recovery process
- [ ] Visibility of status indicators (colors, highlighting)
- [ ] Ease of barcode scanning workflow
- [ ] Mobile responsiveness (if applicable)
- [ ] Accessibility (keyboard navigation, screen readers)

**Questions to Ask:**
- Can a new user understand the workflow without training?
- Are error messages actionable?
- Is the highlight duration (2 seconds) appropriate?
- Would warehouse workers find this easy to use?

#### 3. Data Validation

**What to Test:**
- [ ] Handling of duplicate UPCs
- [ ] Behavior with missing UPC data
- [ ] Large quantity handling (100+ items per carton)
- [ ] Special characters in carton numbers
- [ ] Case sensitivity of barcodes

**Questions to Ask:**
- Are there edge cases that crash the app?
- Does data validation match business rules?
- Are there any data integrity issues?

#### 4. API Integration

**What to Check:**
- [ ] Session management reliability
- [ ] Error handling for API failures
- [ ] Network timeout handling
- [ ] Rate limiting considerations
- [ ] Data consistency between UI and API

**Questions to Ask:**
- What happens if Acumatica is down?
- How does the app handle slow network connections?
- Are API error messages clear enough?

#### 5. Feature Gaps

**Potential Enhancements:**
- [ ] **Print functionality**: Print scanned vs. expected report
- [ ] **Export data**: Export scan results to CSV/Excel
- [ ] **Scan history**: View previous scanning sessions
- [ ] **Multiple cartons**: Switch between cartons without logging out
- [ ] **Barcode scanner integration**: Hardware scanner support
- [ ] **Offline mode**: Cache carton data for offline scanning
- [ ] **Audio feedback**: Beep on successful scan
- [ ] **Batch operations**: Scan multiple cartons in sequence
- [ ] **Real-time sync**: Multi-user carton scanning
- [ ] **Advanced reporting**: Analytics dashboard

**Questions to Ask:**
- What features would make this more useful for warehouse staff?
- What pain points exist in the current workflow?
- What additional data would be valuable to capture?

### Improvement Priority Matrix

After testing, categorize improvements:

**High Priority (Must Have)**
- Critical bugs or errors
- Major performance issues
- Blocking UX problems

**Medium Priority (Should Have)**
- Enhanced error handling
- Performance optimizations
- Minor UX improvements

**Low Priority (Nice to Have)**
- Additional features
- Visual polish
- Advanced functionality

### Documentation Needs

**Current State:**
- ✅ README.md (basic overview)
- ✅ PERFORMANCE_OPTIMIZATION.md (technical details)
- ✅ PROJECT_SUMMARY.md (architecture overview)
- ✅ SETUP_AND_DEMO_GUIDE.md (this document)

**Potential Additions:**
- [ ] API Documentation (endpoint details, request/response formats)
- [ ] User Manual (end-user guide for warehouse workers)
- [ ] Developer Guide (contributing, customization)
- [ ] Deployment Guide (production deployment steps)
- [ ] Security Considerations (auth, data protection)

---

## Next Steps

### 1. Initial Setup (Day 1)
- [ ] Install prerequisites (Node.js, npm)
- [ ] Clone/extract project files
- [ ] Run `npm install`
- [ ] Start development server
- [ ] Verify application loads

### 2. Acumatica Connection (Day 1-2)
- [ ] Identify Acumatica instance URL
- [ ] Update `vite.config.ts` with correct target
- [ ] Obtain test credentials
- [ ] Test login functionality
- [ ] Verify API connectivity

### 3. Testing Phase (Day 2-3)
- [ ] Complete demo walkthrough (all phases)
- [ ] Test with real carton data
- [ ] Perform error scenario testing
- [ ] Monitor performance metrics
- [ ] Document findings

### 4. Evaluation Phase (Day 3-4)
- [ ] Review performance data
- [ ] Identify UX issues
- [ ] List potential improvements
- [ ] Prioritize enhancements
- [ ] Create improvement roadmap

### 5. Optimization Phase (Day 4-5)
- [ ] Implement high-priority fixes
- [ ] Test improvements
- [ ] Update documentation
- [ ] Prepare final demo
- [ ] Gather stakeholder feedback

---

## Additional Resources

### Documentation Files in Project
- `README.md` - Quick start guide
- `PROJECT_SUMMARY.md` - Detailed project overview
- `PERFORMANCE_OPTIMIZATION.md` - Performance details
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build and proxy configuration

### Useful Commands Reference

```bash
# Development
npm run dev              # Start development server
npm run dev -- --port 3000  # Start on custom port

# Building
npm run build            # Create production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint checks

# Maintenance
npm install              # Install dependencies
npm update               # Update dependencies
npm outdated             # Check for outdated packages
```

### Browser DevTools Tips

**Console Tab:**
- View performance metrics
- See error messages
- Monitor API calls

**Network Tab:**
- Inspect API requests/responses
- Check response times
- Debug authentication issues

**Performance Tab:**
- Record scanning session
- Analyze frame rates
- Identify bottlenecks

**Application Tab:**
- View cookies (session management)
- Check local storage
- Inspect cache

### Keyboard Shortcuts

**In Application:**
- `Enter` - Submit login / Fetch carton / Scan barcode
- `Tab` - Navigate between fields

**In DevTools:**
- `F12` - Open/close DevTools
- `Ctrl+Shift+C` - Inspect element
- `Ctrl+Shift+J` - Open console
- `Ctrl+Shift+I` - Open DevTools

---

## Support and Contact

If you encounter issues not covered in this guide:

1. **Check Browser Console**: Most errors provide detailed messages
2. **Review Existing Documentation**: Check other .md files in project
3. **Test with Different Browsers**: Chrome, Firefox, Edge, Safari
4. **Verify Acumatica Access**: Test direct login to Acumatica
5. **Contact IT/DevOps**: For network or infrastructure issues

---

## Appendix: Technical Architecture

### Technology Stack Details

**Frontend Framework:**
- React 19.1.0 (latest stable)
- TypeScript 5.8.3 (type safety)
- Vite 6.3.5 (build tool)

**Styling:**
- Tailwind CSS 4.1.10 (utility-first CSS)
- Custom CSS (component-specific)

**Development Tools:**
- ESLint (code linting)
- PostCSS (CSS processing)
- Autoprefixer (CSS compatibility)

**Performance Features:**
- Hot Module Replacement (HMR)
- Tree shaking (dead code elimination)
- Code splitting (optimized bundles)
- GPU-accelerated animations

### API Endpoints Reference

**Authentication:**
```
POST /api/acumatica/AcumaticaERP/entity/auth/login
Content-Type: application/json

Request Body:
{
  "name": "username",
  "password": "password",
  "tenant": "tenant-name"
}

Response: 200 OK (session cookie set)
```

**Fetch Carton:**
```
PUT /api/acumatica/AcumaticaERP/entity/CartonValidation/24.200.001/Carton?$expand=GetCartonResult
Content-Type: application/json

Request Body:
{
  "carton_nbr": {
    "value": "CARTON-12345"
  }
}

Response:
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

### File Structure Reference

```
acumatica-carton-scanner_WIP/
├── node_modules/           # Dependencies (auto-generated)
├── public/                 # Static assets
│   └── vite.svg           # Vite logo
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── CartonScanner.tsx      # Main scanner interface
│   │   ├── CartonScanner.css      # Scanner styles
│   │   └── Login.tsx              # Authentication
│   ├── utils/             # Utility functions
│   │   └── performance.ts         # Performance monitoring
│   ├── App.tsx            # Root component
│   ├── App.css            # App styles
│   ├── index.css          # Global styles
│   ├── main.tsx           # Entry point
│   └── vite-env.d.ts      # Vite type definitions
├── .gitignore             # Git ignore rules
├── eslint.config.js       # ESLint configuration
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── package-lock.json      # Locked dependency versions
├── postcss.config.cjs     # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── tsconfig.app.json      # App TypeScript config
├── tsconfig.node.json     # Node TypeScript config
├── vite.config.ts         # Vite configuration
├── README.md              # Basic documentation
├── PERFORMANCE_OPTIMIZATION.md  # Performance guide
├── PROJECT_SUMMARY.md     # Project overview
└── SETUP_AND_DEMO_GUIDE.md     # This document
```

---

## Conclusion

You now have a comprehensive guide to:
- ✅ Set up the development environment
- ✅ Understand how the application works
- ✅ Connect to Acumatica (multiple options)
- ✅ Run and demo the application
- ✅ Test all features and workflows
- ✅ Identify areas for improvement
- ✅ Troubleshoot common issues

**Estimated Time to Complete Setup:** 2-3 hours
**Estimated Time for Full Demo:** 15-20 minutes
**Estimated Time for Testing Phase:** 1-2 days

Good luck with your demo and evaluation! The application is well-architected and optimized, providing a solid foundation for warehouse carton scanning operations.
