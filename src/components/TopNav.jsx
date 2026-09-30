import React, { useState } from 'react';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919842686264';

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
    { id: 'Handloom Mats', label: 'Handloom Mats', icon: 'fa-rug' },
    { id: 'Rubber Mats', label: 'Rubber Mats', icon: 'fa-cubes' },
    { id: 'Fancy Mats', label: 'Fancy Mats', icon: 'fa-wand-magic-sparkles' },
    { id: 'Bed Spreads', label: 'Bed Spreads', icon: 'fa-bed' }
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
                src="/assets/logo.png"
                alt="Sri Surya Tex Logo"
                className="brand-logo"
                onError={(e) => { e.target.src = '/assets/logo.jpg'; }}
              />
            </div>
            <div className="brand-titles">
              <h1>SRI SURYA TEX</h1>
              <span className="brand-tagline">
                Handloom, Rubber & Fancy Mats &bull; Bed Spreads
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
              title={`View Order Indent (${selectedCount} items)`}
            >
              <i className="fa-solid fa-clipboard-list"></i>
              <span className="btn-order-text-desktop">Order Indent ({selectedCount})</span>
              <span className="btn-order-text-mobile">Indent ({selectedCount})</span>
            </button>

            {/* WhatsApp Direct Chat Button */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp-header"
              title="Chat with P. Myilsamy on WhatsApp"
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
                  src="/assets/logo.png"
                  alt="Sri Surya Tex"
                  className="brand-logo"
                  style={{ width: '40px', height: '40px' }}
                  onError={(e) => { e.target.src = '/assets/logo.jpg'; }}
                />
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-navy)', fontWeight: 800 }}>SRI SURYA TEX</h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--brand-magenta)', fontWeight: 700 }}>P. MYILSAMY &bull; 98426 86264</span>
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
                <div className="mobile-location-link">
                  <i className="fa-solid fa-location-dot" style={{ color: 'var(--brand-gold)' }}></i>
                  <div>
                    <strong>SRI SURYA TEX</strong>
                    <p style={{ margin: '2px 0' }}>185, Eswaran Kovil Kidangu Street, ERODE - 638 001</p>
                    <p style={{ margin: '2px 0', fontSize: '0.72rem', color: '#64748b' }}>GSTIN: 33DBQPM1973N1ZY &bull; Cell: 98426 86264</p>
                  </div>
                </div>
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
