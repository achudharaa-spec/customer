import React, { useState } from 'react';

export default function HeroBanner() {
  const [showPill, setShowPill] = useState(true);

  return (
    <div className="hero-banner">
      <div className="hero-banner-inner">
        <h1 className="hero-catalog-title">SRI SURYA TEX WHOLESALE CATALOG</h1>
        <p className="hero-catalog-subtitle">Handloom Mats • Rubber Mats • Fancy Mats • Bed Spreads (Erode)</p>
        
        {showPill && (
          <div className="hero-info-pill">
            <i className="fa-solid fa-circle-info"></i>
            <span>Wholesale Direct Catalog — Select items to generate order indent for dispatch and freight quotation.</span>
            <button
              type="button"
              className="hero-pill-close"
              onClick={() => setShowPill(false)}
              aria-label="Dismiss banner notice"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
