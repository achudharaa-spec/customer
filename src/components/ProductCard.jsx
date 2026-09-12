import React from 'react';

export default function ProductCard({ product, isSelected, onToggleSelect }) {
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
        <span className="card-category-badge">{product.category || 'Panipat Mat'}</span>
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
        <div className="card-image-box">
          <img
            src={product.imageUrl || '/assets/logo.jpg'}
            alt={product.title}
            className="card-product-img"
            onError={(e) => { e.target.src = '/assets/logo.jpg'; }}
          />
        </div>

        <div className="card-info-col">
          <h3 className="card-title">{product.title}</h3>
          <p className="card-desc">{product.description || 'High quality woven durable mat.'}</p>

          <div className="card-tags-list">
            {/* Tag 1: Purchase Rule Tag */}
            <div className="card-tag card-tag-yellow">
              <i className="fa-solid fa-box-open"></i>
              <span>{product.minOrderNotice || (isBulkUnit ? 'Purchased per full Bundle only' : 'Available for single piece purchase')}</span>
            </div>

            {/* Tag 2: Seasonal / Stock Price Notice Tag */}
            <div className="card-tag card-tag-yellow">
              <i className="fa-solid fa-circle-info"></i>
              <span>{seasonNotice}</span>
            </div>
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
