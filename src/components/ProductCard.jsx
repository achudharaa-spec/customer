import React, { useState } from 'react';

export default function ProductCard({
  product,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  hidePrices = true
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const productImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : [product.imageUrl || '/assets/logo.jpg'];
  const currentImg = productImages[activeIdx] || productImages[0];

  const isBulkUnit = (product.unit === 'per Bundle' || product.unit === 'per Dozen') && product.bundlePieces > 0;
  const perPieceRate = isBulkUnit ? Math.round(product.baseRate / product.bundlePieces) : 0;
  const seasonNotice = product.seasonNotice || 'Price may differ based on the season item or the stock quantity';
  const isOutOfStock = product.inStock === false || product.stockStatus === 'OUT_OF_STOCK' || product.stockQty === 0;
  const isDisabled = Boolean(product.isDisabled);

  return (
    <div
      className={`product-card ${isSelected ? 'selected' : ''} ${isDisabled || isOutOfStock ? 'product-card-disabled' : ''}`}
    >
      {/* Top Header Row of the Card */}
      <div className="card-top-bar">
        <span className="card-category-badge">{product.category || 'Handloom Mats'}</span>
        {productImages.length > 1 && (
          <span className="card-bundle-pill" style={{ background: '#fdf4ff', color: '#9e2267', borderColor: '#f5d0fe' }}>
            <i className="fa-solid fa-camera" style={{ marginRight: '0.25rem' }}></i>
            {productImages.length} Photos
          </span>
        )}
        {isBulkUnit && (
          <span className="card-bundle-pill">
            {product.bundlePieces} Pcs/{product.unit.replace('per ', '')}
          </span>
        )}
        {product.bundlesPerPack && (
          <span className="card-bundle-pill" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
            <i className="fa-solid fa-cube" style={{ marginRight: '0.2rem' }}></i>
            1 Bale = {product.bundlesPerPack} {product.unit === 'per Piece' ? 'Pcs' : 'Bundles'}
          </span>
        )}
      </div>

      {/* Main Split Body: Left Logo/Photo Box, Right Details */}
      <div className="card-main-split">
        <div
          className="card-image-box"
          onClick={() => onOpenDetail && onOpenDetail(product)}
          title="Click to view large image & specifications"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenDetail && onOpenDetail(product); }}
          style={{ position: 'relative' }}
        >
          <img
            src={currentImg}
            alt={product.title}
            className="card-product-img"
            onError={(e) => { e.target.src = '/assets/logo.jpg'; }}
          />
          {productImages.length > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '5px',
                position: 'absolute',
                bottom: '8px',
                left: 0,
                right: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(4px)',
                padding: '4px 8px',
                borderRadius: '12px',
                width: 'fit-content',
                margin: '0 auto',
                zIndex: 2
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {productImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(idx);
                  }}
                  style={{
                    width: activeIdx === idx ? '16px' : '7px',
                    height: '7px',
                    borderRadius: '4px',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: activeIdx === idx ? '#c89a4b' : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.2s ease'
                  }}
                  title={`Photo ${idx + 1}`}
                />
              ))}
            </div>
          )}
          <div className="card-image-zoom-overlay">
            <i className="fa-solid fa-magnifying-glass-plus"></i>
            <span>Zoom</span>
          </div>
        </div>

        <div className="card-info-col">
          <h3
            className="card-title card-title-clickable"
            onClick={() => onOpenDetail && onOpenDetail(product)}
            title="Click to view details"
          >
            {product.title}
          </h3>
          <p className="card-desc">{product.description || 'High quality woven durable mat.'}</p>

          <div className="card-tags-list">
            {/* Tag 1: Purchase Rule Tag */}
            <div className="card-tag card-tag-yellow">
              <i className="fa-solid fa-box-open"></i>
              <span>{product.minOrderNotice || (isBulkUnit ? 'Purchased per full Bundle only' : 'Available for single piece purchase')}</span>
            </div>

            {/* Tag 2: Seasonal / Manufacturer Tag */}
            {!hidePrices ? (
              <div className="card-tag card-tag-yellow">
                <i className="fa-solid fa-circle-info"></i>
                <span>{seasonNotice}</span>
              </div>
            ) : (
              <div className="card-tag card-tag-yellow">
                <i className="fa-solid fa-industry"></i>
                <span>Direct Manufacturer Supply &bull; ERODE</span>
              </div>
            )}
          </div>

          <div className="card-stock-row" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fa-solid fa-warehouse"></i>
            <span>Stock Status: </span>
            <strong style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: isOutOfStock ? '#b91c1c' : '#15803d'
            }}>
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </strong>
          </div>
        </div>
      </div>

      {/* Bottom Pricing & Selection Action Row */}
      <div className="card-footer-row">
        {!hidePrices ? (
          <div className="card-rate-col">
            <span className="card-rate-label">WHOLESALE RATE</span>
            <div className="card-rate-price">
              ₹{product.baseRate ? product.baseRate.toLocaleString('en-IN') : 0}
              <span className="card-rate-unit">/{product.unit ? product.unit.replace('per ', '') : 'Bundle'}</span>
            </div>
            {isBulkUnit && (
              <div className="card-per-pc-hint">(~ ₹{perPieceRate.toLocaleString('en-IN')}/pc)</div>
            )}
          </div>
        ) : (
          <div className="card-rate-col">
            <span className="card-rate-label" style={{ color: 'var(--brand-magenta)', letterSpacing: '0.04em' }}>WHOLESALE LOT</span>
            <div className="card-rate-price" style={{ fontSize: '1rem', color: 'var(--brand-navy)' }}>
              Bulk Catalog
              <span className="card-rate-unit" style={{ fontSize: '0.8rem' }}>/{product.unit ? product.unit.replace('per ', '') : 'Bundle'}</span>
            </div>
            <div className="card-per-pc-hint" style={{ color: '#64748b' }}>Direct Mill Order</div>
          </div>
        )}

        <div className="card-action-col">
          {isDisabled ? (
            <button type="button" className="btn-select-pill btn-disabled" disabled>
              <i className="fa-solid fa-ban"></i>
              <span>Unavailable</span>
            </button>
          ) : isOutOfStock ? (
            <button type="button" className="btn-select-pill btn-disabled" disabled style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' }}>
              <i className="fa-solid fa-box-archive"></i>
              <span>Out of Stock</span>
            </button>
          ) : (
            <button
              type="button"
              className={`btn-select-pill ${isSelected ? 'btn-selected' : ''}`}
              onClick={() => onToggleSelect(product.id)}
            >
              <i className={`fa-solid ${isSelected ? 'fa-check' : 'fa-plus'}`}></i>
              <span>{isSelected ? 'Selected' : 'Select Item'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
