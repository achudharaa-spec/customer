# AGENTS.md — Developer & AI Agent Guidelines (Customer Portal)

This document provides architectural standards, data flow specifications, and implementation rules for autonomous AI agents and engineers working on the **SRI SURYA TEX Customer Portal (`surya-tex-user`)**.

---

## 🏛️ Application Architecture & Directory Structure

```
surya-tex-user/
├── public/
│   ├── assets/              # Static branding: logo.png, logo.jpg, visiting_card.jpg, Lottie JSONs
│   └── favicon.ico
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CategoryTabs.jsx # Category filter chips & sorting controls
│   │   ├── FloatingBar.jsx  # Sticky bottom action bar with selection count & indent trigger
│   │   ├── HeroBanner.jsx   # Wholesale factory banner & key trust metrics
│   │   ├── InvoiceModal.jsx # Wholesale Indent preview & PDF download modal
│   │   ├── OrderLayer.jsx   # Wholesale indent registration & WhatsApp builder
│   │   ├── ProductCard.jsx  # Individual catalog card with 2-4 photo carousel & zero-price support
│   │   ├── ProductDetailModal.jsx # Large photo zoom & packaging specifications modal
│   │   ├── ProductGrid.jsx  # Responsive grid & filter logic
│   │   ├── TopNav.jsx       # Brand header, search bar, contact chips, and order counter
│   │   └── TrustBar.jsx     # Manufacturer trust badges (Erode supply, direct transport)
│   ├── data/
│   │   └── initialProducts.js # Seed catalog fallback with 4 core categories & 2-4 photos
│   ├── utils/
│   │   ├── packetEngine.js  # 120-unit master bale calculation engine
│   │   ├── pdfGenerator.js  # Client-side jsPDF indent document generator
│   │   ├── security.js      # XSS sanitization & client-side rate limiters
│   │   └── toast.js         # Modern toast notifications
│   ├── App.jsx              # Main application root & dual-source real-time sync hub
│   ├── firebase.js          # Firebase SDK client initialization
│   ├── main.jsx             # React DOM entrypoint
│   └── styles.css           # Global design system & responsive styling tokens
├── index.html               # Main HTML entry with SEO metadata
└── vite.config.js           # Vite build configuration (Port 3001)
```

---

## 🔄 Real-Time Data Synchronization Architecture

The Customer Portal employs a **dual-source real-time synchronization strategy** to guarantee high availability and instant responsiveness across different browser origins:

```
+------------------------------------------------------------------------+
|                      SRI SURYA TEX CUSTOMER PORTAL                      |
+-----------------------------------+------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-----------------------------+             +-----------------------------+
|    CENTRAL SERVER (REST)    |             |    FIREBASE CLOUD FIRESTORE |
|   http://localhost:10000    |             |       Collection: products  |
|                             |             |       Doc: settings/config  |
| - GET /api/products         |             |                             |
| - GET /api/settings/config  |             | - onSnapshot('products')    |
| - GET /api/events (SSE)     |             | - onSnapshot('store_config')|
+-----------------------------+             +-----------------------------+
          |                                                   |
          +-------------------------> <-----------------------+
                                    |
                                    v
                    +-------------------------------+
                    |  React State & LocalStorage   |
                    |  (Zero Initial Blank Screen)  |
                    +-------------------------------+
```

### Protocol Rules:
1. **Initial Hydration**:
   - `products` state initializes synchronously from `localStorage['gsco_catalog_products']` or fallback `INITIAL_PRODUCTS`.
   - Asynchronously fetches `GET /api/products` and `GET /api/settings/store_config` from `${SERVER_URL}`.
2. **Server-Sent Events (SSE)**:
   - An active `EventSource(`${SERVER_URL}/api/events`)` receives real-time broadcasts:
     - `PRODUCT_ADDED` -> Prepends product to catalog state.
     - `PRODUCT_UPDATED` -> Updates matching product item in-place.
     - `PRODUCT_DELETED` -> Removes product from catalog state.
     - `STORE_CONFIG_UPDATED` -> Switches `hidePrices` state live.
3. **Firestore Fallback**:
   - `onSnapshot` listeners to `collection(db, 'products')` and `doc(db, 'settings', 'store_config')` ensure data remains synced if the local server is running in production with cloud Firestore rules enabled.

---

## 🔒 Customer Price Visibility & Zero-Price Trace Rules

> **CRITICAL REQUIREMENT**: When `hidePrices` is `true`, there must be **ZERO TRACE** of monetary values in the customer UI.

1. **Card Rendering**:
   - Do NOT display rupee (`₹`) symbols or rate amounts.
   - Display `WHOLESALE LOT` &bull; `Bulk Catalog / Bundle` &bull; `Direct Mill Order`.
2. **Detail Modal & Purchase Layer**:
   - Total amounts, line-item pricing, and bale surcharges must be hidden or replaced with package piece counts and estimated bales.
3. **Generated Documents**:
   - Invoices and WhatsApp messages in indent mode list items with quantities and packaging details only, marked as `Factory Wholesale Indent (Rates Quoted on Final Order Confirmation)`.

---

## 📦 Multi-Image Specifications

- Every product must support between **2 and 4 photos**.
- Primary image is at index 0 (`product.images[0]`).
- Additional angles are rendered as clickable dot indicators on cards and full thumbnail carousels inside [`ProductDetailModal.jsx`](file:///e:/Github/surya-tex-user/src/components/ProductDetailModal.jsx).

---

## 🧪 Testing & Verification Protocols

When making changes to this codebase:
1. Run Playwright verification:
   ```bash
   node verify_cross_portal_sync.mjs
   ```
2. Verify that port 3001 does not crash if port 10000 is temporarily unreachable (graceful fallback to `INITIAL_PRODUCTS`).
3. Ensure no console errors occur on fresh browser sessions.
