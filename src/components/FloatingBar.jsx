import React from 'react';

export default function FloatingBar({ selectedCount, grandTotal, onOpenOrderLayer, hidePrices = true }) {
  if (selectedCount === 0) return null;

  return (
    <div className="floating-order-bar">
      <button type="button" className="floating-order-btn" onClick={onOpenOrderLayer}>
        <i className="fa-solid fa-clipboard-list"></i>
        <span>View Order Indent ({selectedCount} {selectedCount === 1 ? 'Item' : 'Items'})</span>
        {!hidePrices ? (
          <span className="floating-total-badge">Rs. {grandTotal.toLocaleString('en-IN')}</span>
        ) : (
          <span className="floating-total-badge" style={{ background: 'var(--brand-magenta, #9e2267)', color: '#ffffff' }}>
            Wholesale Indent
          </span>
        )}
      </button>
    </div>
  );
}
