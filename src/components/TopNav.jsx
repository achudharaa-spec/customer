import React, { useState } from 'react';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919842932756';

export default function TopNav({
  searchQuery,
  setSearchQuery,
  selectedCount,
  onOpenOrderLayer,
  onSelectCategory
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const categories = [
    { id: 'ALL', label: 'All Products', icon: 'fa-table-cells-large' },
    { id: 'Panipat Mat', label: 'Panipat Mat', icon: 'fa-layer-group' },
    { id: 'Export Mat', label: 'Export Mat', icon: 'fa-globe' },
    { id: 'Local Mat', label: 'Local Mat', icon: 'fa-location-dot' },
    { id: 'Long Mat', label: 'Long Mat', icon: 'fa-pen-ruler' }
  ];

  return (
    <>
      <header className="top-nav">
        <div className="nav-container">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open Navigation Menu"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          {/* Brand Logo & Titles */}
          <div className="brand-group">
            <div className="logo-wrapper">
              <img
                src="/assets/logo.jpg"
                alt="Govindasamy & Co Logo"
                className="brand-logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="brand-titles">
              <h1>GOVINDASAMY & CO</h1>
              <span className="brand-tagline">
                Quality Mat & Textile Products Manufacturer & Wholesaler
              </span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="search-box desktop-search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search for mats, sizes, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Header Action Buttons */}
          <div className="nav-actions">
            {/* Mobile Search Toggle Icon Button */}
            <button
              type="button"
              className="btn-mobile-search-toggle"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              aria-label="Toggle Search"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>

            {/* Order Form Pill */}
            <button
              type="button"
              className="btn btn-header-order"
              onClick={onOpenOrderLayer}
              title={`View Order Form (${selectedCount} items)`}
            >
              <i className="fa-solid fa-clipboard-list"></i>
              <span className="btn-order-text-desktop">Order Form ({selectedCount})</span>
              <span className="btn-order-text-mobile">Order ({selectedCount})</span>
            </button>

            {/* WhatsApp Direct Chat Button */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp-header"
              title="Chat with Wholesale Sales on WhatsApp"
            >
              <i className="fa-brands fa-whatsapp"></i>
              <span className="btn-whatsapp-text-desktop">WhatsApp</span>
              <span className="btn-whatsapp-text-mobile">Chat</span>
            </a>
          </div>
        </div>

        {/* Mobile Slide-Down Search Field */}
        {isMobileSearchOpen && (
          <div className="mobile-search-dropdown">
            <div className="mobile-search-input-wrap">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search for mats, sizes, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Slide-out Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="brand-group">
                <img
                  src="/assets/logo.jpg"
                  alt="Govindasamy & Co"
                  className="brand-logo"
                  style={{ width: '40px', height: '40px' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-navy)', fontWeight: 800 }}>GOVINDASAMY & CO</h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Erode, Tamil Nadu</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-mobile-menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="mobile-menu-body">
              <h4 className="mobile-menu-subtitle">Product Categories</h4>
              <div className="mobile-category-list">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className="mobile-category-item"
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(cat.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <i className={`fa-solid ${cat.icon}`}></i>
                    <span>{cat.label}</span>
                    <i className="fa-solid fa-chevron-right chevron-icon"></i>
                  </button>
                ))}
              </div>

              <h4 className="mobile-menu-subtitle" style={{ marginTop: '1.5rem' }}>Factory & Location</h4>
              <div className="mobile-menu-info-card">
                <a
                  href="https://maps.app.goo.gl/651k1dFnksLthHSq6"
                  target="_blank"
                  rel="noreferrer"
                  className="mobile-location-link"
                >
                  <i className="fa-solid fa-location-dot" style={{ color: 'var(--brand-gold)' }}></i>
                  <div>
                    <strong>Factory & Store:</strong>
                    <p>65, Kamaraj St, NMS Compound, Erode Fort, Erode - 638001</p>
                  </div>
                </a>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-whatsapp-footer"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <i className="fa-brands fa-whatsapp"></i>
                  <span>WhatsApp Inquiry</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
