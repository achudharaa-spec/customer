# SRI SURYA TEX — Customer & Wholesale Buyer Portal

[![Portal](https://img.shields.io/badge/Portal-Customer%20Wholesale-9e2267?style=for-the-badge)](http://localhost:3001)
[![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-v10-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

A modern, responsive, high-performance customer-facing web application for **SRI SURYA TEX**, a leading manufacturer and wholesale supplier of handloom mats, rubber mats, fancy mats, and bed spreads in Erode, Tamil Nadu.

---

## 🏢 Business Information

- **Company**: SRI SURYA TEX
- **Proprietor**: P. MYILSAMY
- **Contact / WhatsApp**: +91 98426 86264
- **GSTIN**: `33DBQPM1973N1ZY`
- **Factory Address**: 185, Eswaran Kovil Kidangu Street, ERODE - 638 001, Tamil Nadu, India
- **Core Product Lines**: Handloom Mats, Rubber Mats, Fancy Mats, Bed Spreads

---

## ✨ Key Features

1. **4 Core Wholesale Categories**:
   - **Handloom Mats**: 100% woven cotton durable entry mats with reinforced borders.
   - **Rubber Mats**: Heavy-duty vulcanized anti-skid ribbed commercial mats.
   - **Fancy Mats**: Jacquard floral, velvet, and luxury microfiber living room mats.
   - **Bed Spreads**: Fast-color yarn-dyed double jacquard woven bed spreads from Erode textile hub.

2. **2 to 4 Photo Zoom Carousel**:
   - Each catalog product displays 2 to 4 high-definition photos with clickable thumbnail selectors, auto-zoom viewer, and angle indicators.

3. **Customer Price Visibility Toggle (Wholesale Indent Mode)**:
   - When the store owner enables price hiding (`hidePrices: true`), all traces of rupee (`₹`) symbols and rate figures are completely removed from the catalog, detail modals, and purchase sheets.
   - Displays clear wholesale mill markers: `WHOLESALE LOT` &bull; `Bulk Catalog / Bundle` &bull; `Direct Mill Order`.
   - When prices are enabled, factory wholesale rates are quoted per bundle and piece.

4. **Real-Time Cross-Portal Sync**:
   - Connects to the centralized server (`http://localhost:10000`) via **Server-Sent Events (SSE)** and REST API.
   - Product additions, updates, stock toggles, and price visibility changes from the Owner portal appear instantly **without page reload**.
   - Cloud Firestore listener acts as an additional real-time cloud data layer.

5. **120-Unit Master Bale Packing Estimator**:
   - Built-in packing engine calculates standard transport bale requirements (1 Master Bale = 120 Units / standard pack).
   - Generates packing breakdown for optimal freight handling across India.

6. **Direct WhatsApp Wholesale Indent & PDF Generator**:
   - Customers can build a product selection, input company/shop details, and generate a formatted wholesale indent sent directly to proprietor P. Myilsamy on WhatsApp.
   - Instant downloadable branded PDF wholesale indent for business record-keeping.

---

## 🛠️ Technology Stack

- **Framework**: React 18 with Vite
- **Styling**: Vanilla CSS (Classic Luxury Textile Theme, Rich Magenta `#9e2267` & Deep Navy `#15244c`)
- **Backend / Real-Time**: Central Server REST & Server-Sent Events (SSE), Firebase Firestore & Storage v10
- **Document Generation**: jsPDF
- **Icons**: FontAwesome 6 Free & Custom SVG Assets

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/achudharaa-spec/customer.git
cd customer

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the project root (refer to `.env.example`):
```env
# Central Backend Server API
VITE_SERVER_URL=http://localhost:10000

# WhatsApp Contact (Proprietor P. Myilsamy)
VITE_WHATSAPP_NUMBER=919842686264

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=sirsuryatex.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sirsuryatex
VITE_FIREBASE_STORAGE_BUCKET=sirsuryatex.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Running Locally
```bash
npm run dev
```
The application will launch at **`http://localhost:3001`**.

---

## 📄 License
Private & Proprietary &bull; Sri Surya Tex &bull; All Rights Reserved.
