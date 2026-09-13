import React, { useEffect } from 'react';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919842932756';

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  isSelected,
  onToggleSelect,
  qty = 1,
  onUpdateQty
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // prevent background scrolling
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const isBulkUnit = (product.unit === 'per Bundle' || product.unit === 'per Dozen') && product.bundlePieces > 0;
  const perPieceRate = isBulkUnit ? Math.round(product.baseRate / product.bundlePieces) : 0;
  const seasonNotice = product.seasonNotice || 'Price may differ based on the season item or the stock quantity';
  const isOutOfStock = product.inStock === false || product.stockStatus === 'OUT_OF_STOCK' || product.stockQty === 0;
  const isDisabled = Boolean(product.isDisabled);
  const currentQty = qty || 1;
  const subtotal = (product.baseRate || 0) * currentQty;

  const handleWhatsAppInquiry = () => {
    const msg = `*PRODUCT INQUIRY - GOVINDASAMY & CO*\n` +
      `📦 *Item*: ${product.title}\n` +
      `🏷️ *Category*: ${product.category || 'Panipat Mat'}\n` +
      `💰 *Wholesale Rate*: Rs. ${(product.baseRate || 0).toLocaleString('en-IN')} / ${product.unit ? product.unit.replace('per ', '') : 'Bundle'}\n` +
      `🔢 *Quantity Interested*: ${currentQty} ${product.unit ? product.unit.replace('per ', '') : 'Bundle'}(s)\n` +
      `Please let me know current availability & transport dispatch terms.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="product-detail-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="product-detail-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Prominent X Close Button */}
        <button
          type="button"
          className="btn-modal-close"
          onClick={onClose}
          title="Close Product View (Esc)"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* 2-Column Split: Big Image on Left, Rich Details on Right */}
        <div className="product-detail-split">
          {/* Left Column: Big Image Display */}
          <div className="detail-image-column">
            <div className="detail-image-card">
              <img
                src={product.imageUrl || '/assets/logo.jpg'}
                alt={product.title}
                className="detail-big-image"
                onError={(e) => { e.target.src = '/assets/logo.jpg'; }}
              />
              <div className="detail-image-badges">
                <span className="detail-cat-badge">{product.category || 'Panipat Mat'}</span>
                {product.bundlesPerPack && (
                  <span className="detail-bale-badge">
                    <i className="fa-solid fa-cube"></i> 1 Bale = {product.bundlesPerPack} {product.unit === 'per Piece' ? 'Pcs' : 'Bundles'}
                  </span>
                )}
              </div>
            </div>
            <p className="detail-image-hint">
              <i className="fa-solid fa-magnifying-glass-plus"></i> High-resolution wholesale factory product
            </p>
          </div>

          {/* Right Column: Complete Product Specifications & Actions */}
          <div className="detail-info-column">
            <div className="detail-header-group">
              <div className="detail-meta-strip">
                <span className="detail-category-tag">{product.category || 'Panipat Mat'}</span>
                <span className={`detail-stock-pill ${isOutOfStock ? 'pill-out-of-stock' : 'pill-in-stock'}`}>
                  <i className={`fa-solid ${isOutOfStock ? 'fa-circle-xmark' : 'fa-circle-check'}`}></i>
                  {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                </span>
              </div>
              <h2 className="detail-product-title">{product.title}</h2>
            </div>

            {/* Wholesale Price Box */}
            <div className="detail-price-box">
              <span className="detail-price-label">FACTORY WHOLESALE RATE</span>
              <div className="detail-price-row">
                <span className="detail-price-amount">
                  ₹{(product.baseRate || 0).toLocaleString('en-IN')}
                </span>
                <span className="detail-price-unit">/{product.unit ? product.unit.replace('per ', '') : 'Bundle'}</span>
                {isBulkUnit && (
                  <span className="detail-per-piece-tag">
                    (~ ₹{perPieceRate.toLocaleString('en-IN')} / piece)
                  </span>
                )}
              </div>
            </div>

            {/* Tags & Notice List */}
            <div className="detail-tags-stack">
              <div className="detail-notice-item notice-blue">
                <i className="fa-solid fa-box-open"></i>
                <span>
                  <strong>Packaging:</strong> {product.minOrderNotice || (isBulkUnit ? `Sold in full bundles of ${product.bundlePieces} pcs` : 'Sold per standard unit')}
                </span>
              </div>

              <div className="detail-notice-item notice-amber">
                <i className="fa-solid fa-circle-info"></i>
                <span>
                  <strong>Wholesale Terms:</strong> {seasonNotice}
                </span>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="detail-specs-card">
              <h4 className="specs-card-title">
                <i className="fa-solid fa-list-check"></i> Product Specifications
              </h4>
              <div className="specs-grid">
                <div className="spec-row">
                  <span className="spec-label">Selling Unit</span>
                  <span className="spec-val">{product.unit || 'per Bundle'}</span>
                </div>
                {product.bundlePieces > 0 && (
                  <div className="spec-row">
                    <span className="spec-label">Pieces / Bundle</span>
                    <span className="spec-val">{product.bundlePieces} Pieces</span>
                  </div>
                )}
                {product.bundlesPerPack > 0 && (
                  <div className="spec-row">
                    <span className="spec-label">Master Bale Capacity</span>
                    <span className="spec-val">{product.bundlesPerPack} Bundles / Master Bale</span>
                  </div>
                )}
                <div className="spec-row">
                  <span className="spec-label">Compressibility</span>
                  <span className="spec-val">80% Standard Heavy Mat</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="detail-desc-box">
                <h4 className="desc-heading">Description</h4>
                <p>{product.description}</p>
              </div>
            )}

            {/* Interactive Quantity & Order Actions */}
            <div className="detail-action-section">
              <div className="detail-qty-subtotal-row">
                <div className="detail-qty-controls">
                  <span className="qty-label">Quantity:</span>
                  <div className="qty-stepper-lg">
                    <button
                      type="button"
                      className="qty-btn-lg"
                      onClick={() => onUpdateQty && onUpdateQty(product.id, Math.max(1, currentQty - 1))}
                      disabled={currentQty <= 1 || isDisabled || isOutOfStock}
                    >
                      <i className="fa-solid fa-minus"></i>
                    </button>
                    <span className="qty-val-lg">{currentQty}</span>
                    <button
                      type="button"
                      className="qty-btn-lg"
                      onClick={() => onUpdateQty && onUpdateQty(product.id, currentQty + 1)}
                      disabled={isDisabled || isOutOfStock}
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>
                </div>

                <div className="detail-subtotal-display">
                  <span className="subtotal-label">Subtotal:</span>
                  <strong className="subtotal-val">₹{subtotal.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="detail-button-group">
                {isDisabled ? (
                  <button type="button" className="btn-detail-order btn-disabled" disabled>
                    <i className="fa-solid fa-ban"></i>
                    <span>Currently Unavailable</span>
                  </button>
                ) : isOutOfStock ? (
                  <button type="button" className="btn-detail-order btn-disabled" disabled style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                    <i className="fa-solid fa-box-archive"></i>
                    <span>Out of Stock</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`btn-detail-order ${isSelected ? 'btn-detail-selected' : 'btn-detail-add'}`}
                    onClick={() => onToggleSelect && onToggleSelect(product.id)}
                  >
                    <i className={`fa-solid ${isSelected ? 'fa-check' : 'fa-cart-plus'}`}></i>
                    <span>{isSelected ? '✓ Selected in Order (Click to Remove)' : '+ Add to Wholesale Order'}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn-detail-whatsapp"
                  onClick={handleWhatsAppInquiry}
                  title="Inquire directly about this item on WhatsApp"
                >
                  <i className="fa-brands fa-whatsapp"></i>
                  <span>WhatsApp Inquiry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
