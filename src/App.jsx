import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot } from './firebase';
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

export default function App() {
  const [products, setProducts] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
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
  const [masterBaleRate, setMasterBaleRate] = useState(100); // Default ₹100 / Master Bale (Re-editable)

  // Calculate master packs and totals
  const packInfo = calculateMasterPacks(selectedProductIds, products, itemQuantities);

  let itemsSubtotal = 0;
  selectedProductIds.forEach((id) => {
    const prod = products.find((p) => p.id === id);
    const qty = itemQuantities[id] || 1;
    if (prod) itemsSubtotal += prod.baseRate * qty;
  });
  const estBales = packInfo.estPacks || 0;
  const masterBaleTotal = estBales * (Number(masterBaleRate) >= 0 ? Number(masterBaleRate) : 100);
  const grandTotal = itemsSubtotal + masterBaleTotal;

  useEffect(() => {
    // 1. Listen to real-time events across tabs from Admin
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
        }
      };
    }

    // 2. Live sync products strictly 1-to-1 from Firestore (NO MOCK DATA)
    const productsRef = collection(db, 'products');
    const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setProducts(fetched);
      setIsLoadingCatalog(false);
      localStorage.setItem('gsco_catalog_products', JSON.stringify(fetched));
    }, (error) => {
      console.warn('Firestore customer sync info:', error.message);
      setIsLoadingCatalog(false);
    });

    // 3. Live sync custom categories from Firestore
    const categoriesRef = collection(db, 'categories');
    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      const cats = snapshot.docs.map((d) => d.data().name).filter(Boolean);
      if (cats.length > 0) {
        setDynamicCategories(cats);
      }
    }, (error) => {
      console.warn('Firestore categories sync info:', error.message);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
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
          />
        )}
      </main>

      <FloatingBar
        selectedCount={selectedProductIds.length}
        grandTotal={grandTotal}
        onOpenOrderLayer={() => setIsOrderLayerOpen(true)}
      />

      {/* Product Detail / Zoom Modal (Half Page Split on Desktop, Bottom Sheet on Mobile with X Close Mark) */}
      <ProductDetailModal
        product={activeProductDetail}
        isOpen={Boolean(activeProductDetail)}
        onClose={() => setActiveProductDetail(null)}
        isSelected={activeProductDetail ? selectedProductIds.includes(activeProductDetail.id) : false}
        onToggleSelect={handleToggleSelect}
        qty={activeProductDetail ? (itemQuantities[activeProductDetail.id] || 1) : 1}
        onUpdateQty={handleUpdateQty}
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
        onOpenInvoicePreview={(data) => {
          setInvoiceData(data);
          setIsInvoiceModalOpen(true);
        }}
      />

      {/* Modern Responsive Purchase Order Invoice Modal */}
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
      />

      {/* Two-Tier Wholesale Footer from Reference Image */}
      <footer className="main-footer">
        <div className="footer-top-tier">
          <div className="footer-container">
            {/* Brand block */}
            <div className="footer-brand">
              <img
                src="/assets/logo.jpg"
                alt="Govindasamy & Co"
                className="footer-logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <h4>GOVINDASAMY & CO</h4>
                <p>Quality Mat & Textile Products Manufacturer & Wholesaler</p>
              </div>
            </div>

            {/* Address */}
            <div className="footer-col footer-col-address">
              <a href="https://maps.app.goo.gl/651k1dFnksLthHSq6" target="_blank" rel="noreferrer">
                <i className="fa-solid fa-location-dot"></i>
                <span>65, Kamaraj St, Erode - 638001<br />Tamil Nadu, India</span>
              </a>
            </div>

            {/* Contacts */}
            <div className="footer-col footer-col-contacts">
              <p>
                <i className="fa-solid fa-envelope"></i>
                <span>{import.meta.env.VITE_STORE_EMAIL || 'govindasamy.textitle@gmail.com'}</span>
              </p>
              <p>
                <i className="fa-solid fa-phone"></i>
                <span>+91 98427 12345</span>
              </p>
            </div>

            {/* WhatsApp Inquiry Pill */}
            <div className="footer-action-col">
              <a
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '919842932756'}`}
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

        {/* Bottom Dark Blue Copyright Strip */}
        <div className="footer-bottom-strip">
          <p>© 2026 Govindasamy & Co. All Rights Reserved. • Powered by React & Firebase Firestore Sync</p>
        </div>
      </footer>
    </div>
  );
}
