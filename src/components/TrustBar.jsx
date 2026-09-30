import React from 'react';

export default function TrustBar() {
  return (
    <div className="trust-bar">
      <div className="trust-container">
        <div className="trust-item location-link">
          <i className="fa-solid fa-location-dot" style={{ color: 'var(--brand-gold)' }}></i>
          <span>185, Eswaran Kovil Kidangu Street, ERODE - 638 001</span>
        </div>
        <div className="trust-divider"></div>
        <div className="trust-item">
          <i className="fa-solid fa-industry" style={{ color: 'var(--brand-navy)' }}></i>
          <span>Direct Manufacturer Supply</span>
        </div>
        <div className="trust-divider"></div>
        <div className="trust-item">
          <i className="fa-solid fa-truck" style={{ color: 'var(--brand-navy)' }}></i>
          <span>Pan-India Transport Delivery</span>
        </div>
        <div className="trust-divider"></div>
        <div className="trust-item">
          <i className="fa-solid fa-certificate" style={{ color: 'var(--brand-magenta)' }}></i>
          <span>Handloom, Rubber & Fancy Mats</span>
        </div>
      </div>
    </div>
  );
}
