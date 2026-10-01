import React, { useState, useEffect } from 'react';
import { db, collection, doc, onSnapshot } from './firebase';
import TopNav from './components/TopNav';
import TrustBar from './components/TrustBar';
import HeroBanner from './components/HeroBanner';
import CategoryTabs from './components/CategoryTabs';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import LottieAnimation from './components/LottieAnimation';
import FloatingBar from './components/FloatingBar';
import OrderLayer from './components/OrderLayer';
import InvoiceModal from './components/InvoiceModal';
import ModernToastContainer from './components/ModernToastContainer';
import { calculateMasterPacks } from './utils/packetEngine';
import './styles.css';

const IS_HTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (IS_HTTPS ? '' : 'http://localhost:10000');

export default function App() {
  const [products, setProducts] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('gsco_catalog_products') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch (_) {}
    return [];
  });
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('gsco_catalog_products') || '[]');
      return !(Array.isArray(cached) && cached.length > 0);
    } catch (_) {
      return true;
    }
  });
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [itemQuantities, setItemQuantities] = useState({});
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [activeProductDetail, setActiveProductDetail] = useState(null);
  const [isOrderLayerOpen, setIsOrderLayerOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState({});
  const [masterBaleRate, setMasterBaleRate] = useState(100); // Default ₹100 / Master Bale
  const [hidePrices, setHidePrices] = useState(() => {
    try {
      const cached = localStorage.getItem('sst_hide_prices');
      return cached !== null ? cached === 'true' : true;
    } catch (_) {
      return true;
    }
  });

  // Calculate master packs and totals
  const packInfo = calculateMasterPacks(selectedProductIds, products, itemQuantities);

  let itemsSubtotal = 0;
  selectedProductIds.forEach((id) => {
    const prod = products.find((p) => p.id === id);
    const qty = itemQuantities[id] || 1;
    if (prod) itemsSubtotal += (prod.baseRate || 0) * qty;
  });
  const estBales = packInfo.estPacks || 0;
  const masterBaleTotal = estBales * (Number(masterBaleRate) >= 0 ? Number(masterBaleRate) : 100);
  const grandTotal = itemsSubtotal + masterBaleTotal;

  useEffect(() => {
    let eventSource;
    if (SERVER_URL) {
      // 1. Fetch live products from Centralized Server API
      fetch(`${SERVER_URL}/api/products`)
        .then((res) => (res.ok ? res.json() : null))
        .then((serverProducts) => {
          if (Array.isArray(serverProducts) && serverProducts.length > 0) {
            setProducts(serverProducts);
            localStorage.setItem('gsco_catalog_products', JSON.stringify(serverProducts));
          }
        })
        .catch((err) => console.info('Server catalog sync info:', err.message));

      // 2. Fetch live store config (hidePrices) from Server API
      fetch(`${SERVER_URL}/api/settings/store_config`)
        .then((res) => (res.ok ? res.json() : null))
        .then((cfg) => {
          if (cfg && cfg.hidePrices !== undefined) {
            setHidePrices(Boolean(cfg.hidePrices));
            localStorage.setItem('sst_hide_prices', cfg.hidePrices ? 'true' : 'false');
          }
        })
        .catch((err) => console.info('Server store config sync info:', err.message));

      // 3. Connect to Server-Sent Events (SSE) stream
      try {
        eventSource = new EventSource(`${SERVER_URL}/api/events`);
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PRODUCT_ADDED') {
              setProducts((prev) => {
                if (prev.some((p) => p.id === data.product.id)) return prev;
                const updated = [data.product, ...prev];
                localStorage.setItem('gsco_catalog_products', JSON.stringify(updated));
                return updated;
              });
            } else if (data.type === 'PRODUCT_UPDATED') {
              setProducts((prev) => {
                const updated = prev.map((p) => (p.id === data.product.id ? { ...p, ...data.product } : p));
                localStorage.setItem('gsco_catalog_products', JSON.stringify(updated));
                return updated;
              });
            } else if (data.type === 'PRODUCT_DELETED') {
              setProducts((prev) => {
                const updated = prev.filter((p) => p.id !== data.productId);
                localStorage.setItem('gsco_catalog_products', JSON.stringify(updated));
                return updated;
              });
            } else if (data.type === 'STORE_CONFIG_UPDATED') {
              if (data.hidePrices !== undefined) {
                setHidePrices(Boolean(data.hidePrices));
                localStorage.setItem('sst_hide_prices', data.hidePrices ? 'true' : 'false');
              }
            }
          } catch (_) {}
        };
      } catch (_) {}
    }

    // 4. Listen to real-time events across tabs within the same origin
    let channel;
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      channel = new BroadcastChannel('gsco_realtime_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'PRODUCT_ADDED') {
          setProducts((prev) => {
            const exists = prev.some((p) => p.id === event.data.product.id);
            if (exists) return prev;
            return [event.data.product, ...prev];
          });
        } else if (event.data?.type === 'PRODUCT_UPDATED') {
          setProducts((prev) =>
            prev.map((p) => (p.id === event.data.product.id ? { ...p, ...event.data.product } : p))
          );
        } else if (event.data?.type === 'PRODUCT_DELETED') {
          setProducts((prev) => prev.filter((p) => p.id !== event.data.productId));
        } else if (event.data?.type === 'MASTER_BALE_RATE_UPDATED') {
          if (event.data.rate !== undefined) {
            setMasterBaleRate(Number(event.data.rate));
          }
        } else if (event.data?.type === 'PRICES_VISIBILITY_UPDATED' || event.data?.type === 'SETTINGS_UPDATED' || event.data?.type === 'STORE_CONFIG_UPDATED') {
          if (event.data.hidePrices !== undefined) {
            setHidePrices(Boolean(event.data.hidePrices));
          }
        }
      };
    }

    // 5. Live sync products from Firestore
    const productsRef = collection(db, 'products');
    const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      if (fetched.length > 0) {
        setProducts(fetched);
        localStorage.setItem('gsco_catalog_products', JSON.stringify(fetched));
      }
      setIsLoadingCatalog(false);
    }, (error) => {
      console.warn('Firestore customer sync info:', error.message);
      setIsLoadingCatalog(false);
    });

    // 6. Live sync custom categories from Firestore
    const categoriesRef = collection(db, 'categories');
    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      const cats = snapshot.docs.map((d) => d.data().name).filter(Boolean);
      if (cats.length > 0) {
        setDynamicCategories(cats);
      }
    }, (error) => {
      console.warn('Firestore categories sync info:', error.message);
    });

    // 7. Live sync global master bale rate from Firestore
    const configRef = doc(db, 'settings', 'master_bale_config');
    const unsubscribeConfig = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.rate !== undefined && data.rate !== null) {
          setMasterBaleRate(Number(data.rate));
        }
      }
    }, (error) => {
      console.warn('Firestore master bale config sync info:', error.message);
    });

    // 8. Live sync store price visibility config from Firestore
    const storeConfigRef = doc(db, 'settings', 'store_config');
    const unsubscribeStoreConfig = onSnapshot(storeConfigRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.hidePrices !== undefined) {
          const nextHide = Boolean(data.hidePrices);
          setHidePrices(nextHide);
          localStorage.setItem('sst_hide_prices', nextHide ? 'true' : 'false');
        }
      }
    }, (error) => {
      console.warn('Firestore store config sync info:', error.message);
    });

    return () => {
      if (eventSource) eventSource.close();
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeConfig();
      unsubscribeStoreConfig();
      if (channel) channel.close();
    };
  }, []);

  const handleToggleSelect = (productId) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== productId));
      const updated = { ...itemQuantities };
      delete updated[productId];
      setItemQuantities(updated);
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
      if (!itemQuantities[productId]) {
        setItemQuantities({ ...itemQuantities, [productId]: 1 });
      }
    }
  };

  const handleRemoveItem = (productId) => {
    setSelectedProductIds(selectedProductIds.filter((id) => id !== productId));
    const updated = { ...itemQuantities };
    delete updated[productId];
    setItemQuantities(updated);
  };

  const handleUpdateQty = (productId, val) => {
    setItemQuantities({ ...itemQuantities, [productId]: val });
  };

  return (
    <div className="classic-business-theme">
      <TopNav
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCount={selectedProductIds.length}
        onOpenOrderLayer={() => setIsOrderLayerOpen(true)}
        onSelectCategory={setActiveCategory}
      />

      <ModernToastContainer />

      <TrustBar />

      <main className="main-catalog-container">
        <HeroBanner />

        <CategoryTabs
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          dynamicCategories={dynamicCategories}
          sortOption={sortOption}
          setSortOption={setSortOption}
          hidePrices={hidePrices}
        />

        {isLoadingCatalog ? (
          <div className="catalog-loading-box">
            <LottieAnimation animationPath="/assets/loading.json" width={130} height={130} />
            <p className="catalog-loading-text">Loading fresh wholesale catalog...</p>
          </div>
        ) : (
          <ProductGrid
            products={products}
            selectedProductIds={selectedProductIds}
            onToggleSelect={handleToggleSelect}
            onOpenDetail={(product) => setActiveProductDetail(product)}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            sortOption={sortOption}
            setSortOption={setSortOption}
            hidePrices={hidePrices}
          />
        )}
      </main>

      <FloatingBar
        selectedCount={selectedProductIds.length}
        grandTotal={grandTotal}
        onOpenOrderLayer={() => setIsOrderLayerOpen(true)}
        hidePrices={hidePrices}
      />

      {/* Product Detail / Zoom Modal with 2-4 Photo Carousel & Zero-Price Trace */}
      <ProductDetailModal
        product={activeProductDetail}
        isOpen={Boolean(activeProductDetail)}
        onClose={() => setActiveProductDetail(null)}
        isSelected={activeProductDetail ? selectedProductIds.includes(activeProductDetail.id) : false}
        onToggleSelect={handleToggleSelect}
        qty={activeProductDetail ? (itemQuantities[activeProductDetail.id] || 1) : 1}
        onUpdateQty={handleUpdateQty}
        hidePrices={hidePrices}
      />

      <OrderLayer
        isOpen={isOrderLayerOpen}
        onClose={() => setIsOrderLayerOpen(false)}
        selectedProductIds={selectedProductIds}
        products={products}
        itemQuantities={itemQuantities}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        masterBaleRate={masterBaleRate}
        onUpdateMasterBaleRate={setMasterBaleRate}
        hidePrices={hidePrices}
        onOpenInvoicePreview={(data) => {
          setInvoiceData(data);
          setIsInvoiceModalOpen(true);
        }}
      />

      {/* Modern Responsive Purchase Order Invoice / Wholesale Indent Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        company={invoiceData.company}
        name={invoiceData.name}
        phone={invoiceData.phone}
        gst={invoiceData.gst}
        address={invoiceData.address}
        selectedProductIds={selectedProductIds}
        products={products}
        itemQuantities={itemQuantities}
        packInfo={packInfo}
        masterBaleRate={masterBaleRate}
        onUpdateMasterBaleRate={setMasterBaleRate}
        hidePrices={hidePrices}
      />

      {/* Wholesale Footer with SRI SURYA TEX visiting card details */}
      <footer className="main-footer">
        <div className="footer-top-tier">
          <div className="footer-container">
            {/* Brand block */}
            <div className="footer-brand">
              <img
                src="/assets/logo.png"
                alt="SRI SURYA TEX"
                className="footer-logo"
                onError={(e) => { e.target.src = '/assets/logo.jpg'; }}
              />
              <div>
                <h4>SRI SURYA TEX</h4>
                <p>Prop: P. MYILSAMY • Handloom Mats, Rubber Mats, Fancy Mats, Bed Spreads</p>
              </div>
            </div>

            {/* Address */}
            <div className="footer-col footer-col-address">
              <a href="https://maps.google.com/?q=185+Eswaran+Kovil+Kidangu+Street+Erode" target="_blank" rel="noreferrer">
                <i className="fa-solid fa-location-dot"></i>
                <span>185, Eswaran Kovil Kidangu Street<br />ERODE - 638 001, Tamil Nadu</span>
              </a>
            </div>

            {/* Contacts & GSTIN */}
            <div className="footer-col footer-col-contacts">
              <p>
                <i className="fa-solid fa-phone"></i>
                <span>Cell: <strong>98426 86264</strong></span>
              </p>
              <p>
                <i className="fa-solid fa-receipt"></i>
                <span>GSTIN: <strong>33DBQPM1973N1ZY</strong></span>
              </p>
            </div>

            {/* WhatsApp Inquiry Pill */}
            <div className="footer-action-col">
              <a
                href="https://wa.me/919842686264"
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp-footer"
              >
                <i className="fa-brands fa-whatsapp"></i>
                <span>WhatsApp Inquiry</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Dark Copyright Strip */}
        <div className="footer-bottom-strip">
          <p>© 2026 SRI SURYA TEX (ERODE). All Rights Reserved. • Handloom & Textile Wholesaler</p>
        </div>
      </footer>
    </div>
  );
}
