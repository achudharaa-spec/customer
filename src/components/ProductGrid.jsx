import React, { useMemo } from 'react';
import ProductCard from './ProductCard';
import LottieAnimation from './LottieAnimation';

export default function ProductGrid({
  products,
  selectedProductIds,
  onToggleSelect,
  onOpenDetail,
  activeCategory,
  searchQuery,
  sortOption = 'default',
  setSortOption
}) {
  const filtered = useMemo(() => {
    const searchLower = (searchQuery || '').toLowerCase().trim();

    const list = products.filter((p) => {
      const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
      const matchesSearch =
        !searchLower ||
        (p.title && p.title.toLowerCase().includes(searchLower)) ||
        (p.category && p.category.toLowerCase().includes(searchLower)) ||
        (p.description && p.description.toLowerCase().includes(searchLower));
      return matchesCategory && matchesSearch;
    });

    return list.sort((a, b) => {
      const aDisabled = !!a.isDisabled;
      const bDisabled = !!b.isDisabled;
      if (aDisabled && !bDisabled) return 1;  // Disabled item moved to last
      if (!aDisabled && bDisabled) return -1; // Enabled item kept in front

      if (sortOption === 'price-low') {
        return a.baseRate - b.baseRate;
      } else if (sortOption === 'price-high') {
        return b.baseRate - a.baseRate;
      } else if (sortOption === 'stock') {
        return (b.stockQty || 0) - (a.stockQty || 0);
      }
      return 0;
    });
  }, [products, activeCategory, searchQuery, sortOption]);

  return (
    <section className="catalog-products-section">
      {/* Straight-line Section Title & Modern Sort By */}
      <div className="catalog-section-header-row">
        <h2 className="catalog-section-title">
          {activeCategory === 'ALL' ? 'All Mat Products' : activeCategory}
        </h2>

        {setSortOption && (
          <div className="straight-line-sort-box">
            <label htmlFor="catalog-sort-select" className="sort-label">
              <i className="fa-solid fa-arrow-down-short-wide"></i> Sort By:
            </label>
            <select
              id="catalog-sort-select"
              className="sort-dropdown-modern"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="default">Default Order</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock">Stock Quantity</option>
            </select>
          </div>
        )}
      </div>

      {/* Light Blue Wholesale Pricing Notice Banner from Reference */}
      <div className="pricing-notice-box">
        <i className="fa-solid fa-circle-info"></i>
        <span>
          <strong>Wholesale Pricing Notice:</strong> Quoted rates are factory standard wholesale rates. Final rates may vary based on order quantity, destination & delivery terms.
        </span>
      </div>

      {/* Product Cards Grid */}
      <div className="product-cards-grid">
        {filtered.length === 0 ? (
          <div className="no-products-box">
            <LottieAnimation animationPath="/assets/Error 404.json" width={220} height={200} />
            <h3>No Mat Products Found</h3>
            <p>No catalog items match your search or filter criteria. Try searching for a different keyword or category tab.</p>
          </div>
        ) : (
          filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={selectedProductIds.includes(product.id)}
              onToggleSelect={onToggleSelect}
              onOpenDetail={onOpenDetail}
            />
          ))
        )}
      </div>
    </section>
  );
}
