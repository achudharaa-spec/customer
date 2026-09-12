/**
 * Master Bale Packing Engine — Best-Fit Decreasing
 *
 * Uses integer capacity units (scale: 120) to eliminate floating-point drift.
 * All common denominators (3,4,5,6,8,10,12) divide evenly into 120.
 *
 * Core formulas:
 *   bundleCapacityUnits  = 120 / product.bundlesPerPack
 *   bale capacity        = SUM(bundleQty × bundleCapacityUnits)  ≤ 120
 *   capacityPercent      = (capacityUnits / 120) × 100
 *   maxAdditionalBundles = Math.floor(remainingUnits / bundleCapacityUnits)
 */

export const BALE_CAPACITY_UNITS = 120;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns integer capacity units consumed by one bundle of a product.
 */
export function bundleCapacityUnits(product) {
  const bpp = Math.round(Number(product.bundlesPerPack) || 0);
  if (!bpp || bpp <= 0) return BALE_CAPACITY_UNITS; // treat as 1 bale per bundle (safe fallback)
  return Math.round(BALE_CAPACITY_UNITS / bpp);
}

/**
 * Converts integer capacity units → display percentage string (2 dp).
 */
export function capacityPercent(units) {
  return ((units / BALE_CAPACITY_UNITS) * 100).toFixed(2);
}

/**
 * Maximum additional bundles of a given product that can fit in remaining space.
 */
export function getMaxAdditionalBundles(remainingUnits, capUnitsPerBundle) {
  if (!capUnitsPerBundle || capUnitsPerBundle <= 0) return 0;
  return Math.floor(remainingUnits / capUnitsPerBundle);
}

// ─── Core Packing Engine ──────────────────────────────────────────────────────

/**
 * packOrder — Best-Fit Decreasing bin-packing algorithm.
 *
 * @param {string[]} selectedProductIds
 * @param {Object[]} products           — Firestore product catalogue
 * @param {Object}   itemQuantities     — { [productId]: bundleCount }
 *
 * @returns {{ bales, totalBales, totalBundles, totalPieces, orderedBundles }}
 *
 * Each bale:
 *   { baleId, capacityUnits, capacityPercent, remainingCapacityUnits,
 *     remainingCapacityPercent, totalBundles, totalPieces,
 *     items: [{ itemId, title, bundleQty, pieces, capacityUnits, capacityPercent }] }
 */
export function packOrder(selectedProductIds, products, itemQuantities) {
  if (!selectedProductIds || selectedProductIds.length === 0) {
    return { bales: [], totalBales: 0, totalBundles: 0, totalPieces: 0, orderedBundles: 0 };
  }

  // 1. Build working entries
  const entries = [];
  for (const id of selectedProductIds) {
    const prod = products.find((p) => p.id === id);
    if (!prod) continue;
    const qty = Math.round(Number(itemQuantities[id]) || 0);
    if (qty <= 0) continue;
    const capUnits = bundleCapacityUnits(prod);
    entries.push({
      productId: prod.id,
      title: prod.title || prod.id,
      piecesPerBundle: Number(prod.bundlePieces || prod.piecesPerBundle || 0),
      capUnits,
      remainingBundles: qty,
      orderedBundles: qty
    });
  }

  if (entries.length === 0) {
    return { bales: [], totalBales: 0, totalBundles: 0, totalPieces: 0, orderedBundles: 0 };
  }

  // 2. Sort by capacity per bundle descending (Best-Fit Decreasing)
  entries.sort((a, b) => b.capUnits - a.capUnits);

  const bales = [];
  let baleCounter = 1;

  // 3. Pack each entry
  for (const entry of entries) {
    while (entry.remainingBundles > 0) {
      // Find best existing bale: smallest remaining space after addition
      let bestBale = null;
      let bestRemainingAfterAdd = Infinity;

      for (const bale of bales) {
        const remaining = BALE_CAPACITY_UNITS - bale.capacityUnits;
        const maxCanFit = Math.floor(remaining / entry.capUnits);
        if (maxCanFit <= 0) continue;
        const toAdd = Math.min(entry.remainingBundles, maxCanFit);
        const remainingAfterAdd = remaining - toAdd * entry.capUnits;
        if (remainingAfterAdd < bestRemainingAfterAdd) {
          bestRemainingAfterAdd = remainingAfterAdd;
          bestBale = bale;
        }
      }

      // No existing bale fits → open a new one
      if (!bestBale) {
        bestBale = {
          baleId: `MB${String(baleCounter).padStart(3, '0')}`,
          capacityUnits: 0,
          totalBundles: 0,
          totalPieces: 0,
          items: []
        };
        baleCounter++;
        bales.push(bestBale);
      }

      // Add bundles to the chosen bale
      const remaining = BALE_CAPACITY_UNITS - bestBale.capacityUnits;
      const maxCanFit = Math.floor(remaining / entry.capUnits);
      const toAdd = Math.min(entry.remainingBundles, maxCanFit);
      if (toAdd <= 0) break; // safety

      const addedCapUnits = toAdd * entry.capUnits;
      const addedPieces   = toAdd * entry.piecesPerBundle;

      const existingItem = bestBale.items.find((it) => it.itemId === entry.productId);
      if (existingItem) {
        existingItem.bundleQty     += toAdd;
        existingItem.pieces        += addedPieces;
        existingItem.capacityUnits += addedCapUnits;
      } else {
        bestBale.items.push({
          itemId: entry.productId,
          title: entry.title,
          bundleQty: toAdd,
          pieces: addedPieces,
          capacityUnits: addedCapUnits
        });
      }

      bestBale.capacityUnits += addedCapUnits;
      bestBale.totalBundles  += toAdd;
      bestBale.totalPieces   += addedPieces;
      entry.remainingBundles -= toAdd;
    }
  }

  // 4. Attach display-friendly percent strings
  for (const bale of bales) {
    bale.capacityPercent           = capacityPercent(bale.capacityUnits);
    bale.remainingCapacityUnits    = BALE_CAPACITY_UNITS - bale.capacityUnits;
    bale.remainingCapacityPercent  = capacityPercent(bale.remainingCapacityUnits);
    for (const item of bale.items) {
      item.capacityPercent = capacityPercent(item.capacityUnits);
    }
  }

  const totalBundles = entries.reduce((s, e) => s + e.orderedBundles, 0);
  const totalPieces  = bales.reduce((s, b) => s + b.totalPieces, 0);

  return {
    bales,
    totalBales:     bales.length,
    totalBundles,
    totalPieces,
    orderedBundles: totalBundles
  };
}

/**
 * getMaxAdditionalTable — for a given bale, calculates the max additional
 * bundles that can fit for each product in the catalogue.
 *
 * @returns {Array} [{ productId, title, maxAdditional, capacityPerBundlePercent }]
 */
export function getMaxAdditionalTable(bale, products) {
  if (!bale || !products) return [];
  const remaining = bale.remainingCapacityUnits ?? (BALE_CAPACITY_UNITS - bale.capacityUnits);

  return products
    .filter((p) => !p.isDisabled && (p.bundlesPerPack || 0) > 0)
    .map((p) => {
      const capUnits = bundleCapacityUnits(p);
      return {
        productId: p.id,
        title: p.title,
        maxAdditional: getMaxAdditionalBundles(remaining, capUnits),
        capacityPerBundlePercent: Number(capacityPercent(capUnits))
      };
    })
    .sort((a, b) => b.capacityPerBundlePercent - a.capacityPerBundlePercent);
}

// ─── Backward-Compatible Shim ─────────────────────────────────────────────────

/**
 * calculateMasterPacks — original export used by OrderLayer, InvoiceModal, pdfGenerator.
 * Now wraps the full packing engine and returns the same shape as before
 * PLUS a `bales` array for new consumers.
 *
 * @returns {{ estPacks, totalPoints, bales, totalBundles, totalPieces }}
 */
export function calculateMasterPacks(selectedProductIds, products, itemQuantities) {
  if (!selectedProductIds || selectedProductIds.length === 0) {
    return { estPacks: 0, totalPoints: 0, bales: [], totalBundles: 0, totalPieces: 0 };
  }

  const result = packOrder(selectedProductIds, products, itemQuantities);

  // Reconstruct legacy "capacity points" number for any existing consumer
  const totalPoints = result.bales.reduce(
    (sum, b) => sum + (b.capacityUnits / BALE_CAPACITY_UNITS) * 100,
    0
  );

  return {
    estPacks:     result.totalBales,
    totalPoints:  Number(totalPoints.toFixed(2)),
    bales:        result.bales,
    totalBundles: result.totalBundles,
    totalPieces:  result.totalPieces
  };
}
