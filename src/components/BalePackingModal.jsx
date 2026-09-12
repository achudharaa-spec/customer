import React, { useState } from 'react';
import { getMaxAdditionalTable } from '../utils/packetEngine';

/**
 * BalePackingModal
 *
 * Shows the full Best-Fit Decreasing packing result for an order:
 *   Tab 1 — Per-bale breakdown with animated capacity bars
 *   Tab 2 — Max additional bundles per product for a selected bale
 *
 * Props:
 *   isOpen    {boolean}
 *   onClose   {function}
 *   packInfo  { bales, totalBales, totalBundles, totalPieces } from calculateMasterPacks()
 *   products  {Array}  — full Firestore product catalogue (for Max Additional table)
 */
export default function BalePackingModal({ isOpen, onClose, packInfo, products }) {
  const [activeTab, setActiveTab] = useState('breakdown');
  const [selectedBaleIdx, setSelectedBaleIdx] = useState(0);

  if (!isOpen) return null;

  const bales = packInfo?.bales || [];
  const selectedBale = bales[selectedBaleIdx] || null;

  const maxTable = selectedBale
    ? getMaxAdditionalTable(selectedBale, products || [])
    : [];

  const getBarColor = (pct) => {
    const p = parseFloat(pct);
    if (p >= 90) return 'var(--bale-bar-high)';
    if (p >= 60) return 'var(--bale-bar-mid)';
    return 'var(--bale-bar-low)';
  };

  return (
    <div className="bale-modal-overlay" onClick={onClose}>
      <div className="bale-modal-wrapper" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="bale-modal-header">
          <div className="bale-modal-title-row">
            <i className="fa-solid fa-boxes-stacked bale-icon-accent"></i>
            <div>
              <h2 className="bale-modal-title">Master Bale Allocation Plan</h2>
              <p className="bale-modal-subtitle">
                {bales.length} Master {bales.length === 1 ? 'Bale' : 'Bales'} &nbsp;·&nbsp;
                {packInfo?.totalBundles || 0} Total Bundles &nbsp;·&nbsp;
                {packInfo?.totalPieces || 0} Total Pieces
              </p>
            </div>
          </div>
          <button className="bale-modal-close" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="bale-tabs">
          <button
            className={`bale-tab-btn ${activeTab === 'breakdown' ? 'bale-tab-active' : ''}`}
            onClick={() => setActiveTab('breakdown')}
          >
            <i className="fa-solid fa-layer-group"></i> Bale Breakdown
          </button>
          <button
            className={`bale-tab-btn ${activeTab === 'maxadd' ? 'bale-tab-active' : ''}`}
            onClick={() => setActiveTab('maxadd')}
          >
            <i className="fa-solid fa-chart-bar"></i> Max Additional Bundles
          </button>
        </div>

        <div className="bale-modal-body">

          {/* ══ TAB 1 — Bale Breakdown ══ */}
          {activeTab === 'breakdown' && (
            <div className="bale-breakdown-grid">
              {bales.length === 0 ? (
                <div className="bale-empty-state">
                  <i className="fa-solid fa-box-open"></i>
                  <p>No items in order to pack.</p>
                </div>
              ) : (
                bales.map((bale, idx) => (
                  <div key={bale.baleId} className="bale-card">
                    {/* Card Header */}
                    <div className="bale-card-header">
                      <div className="bale-id-badge">
                        <i className="fa-solid fa-cube"></i>
                        <span>{bale.baleId}</span>
                      </div>
                      <div className="bale-capacity-tag" style={{ color: getBarColor(bale.capacityPercent) }}>
                        {bale.capacityPercent}% full
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div className="bale-progress-track">
                      <div
                        className="bale-progress-fill"
                        style={{
                          width: `${Math.min(100, parseFloat(bale.capacityPercent))}%`,
                          background: getBarColor(bale.capacityPercent)
                        }}
                      ></div>
                    </div>
                    <div className="bale-bar-labels">
                      <span>{bale.capacityPercent}% used</span>
                      <span>{bale.remainingCapacityPercent}% free</span>
                    </div>

                    {/* Items Table */}
                    <div className="bale-items-table-wrap">
                      <table className="bale-items-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th className="text-right">Bundles</th>
                            <th className="text-right">Pieces</th>
                            <th className="text-right">Capacity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bale.items.map((item) => (
                            <tr key={item.itemId}>
                              <td className="bale-item-name">
                                <i className="fa-solid fa-rug bale-rug-icon"></i>
                                {item.title}
                              </td>
                              <td className="text-right bale-num">{item.bundleQty}</td>
                              <td className="text-right bale-num">{item.pieces || '—'}</td>
                              <td className="text-right bale-pct">{item.capacityPercent}%</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bale-tfoot-row">
                            <td><strong>Total</strong></td>
                            <td className="text-right"><strong>{bale.totalBundles}</strong></td>
                            <td className="text-right"><strong>{bale.totalPieces || '—'}</strong></td>
                            <td className="text-right"><strong>{bale.capacityPercent}%</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ══ TAB 2 — Max Additional Bundles ══ */}
          {activeTab === 'maxadd' && (
            <div className="bale-maxadd-section">
              {bales.length === 0 ? (
                <div className="bale-empty-state">
                  <i className="fa-solid fa-box-open"></i>
                  <p>No bales to inspect.</p>
                </div>
              ) : (
                <>
                  {/* Bale Selector */}
                  <div className="bale-selector-row">
                    <label className="bale-selector-label">
                      <i className="fa-solid fa-cube"></i> Select Bale to Inspect:
                    </label>
                    <select
                      className="bale-selector-dropdown"
                      value={selectedBaleIdx}
                      onChange={(e) => setSelectedBaleIdx(Number(e.target.value))}
                    >
                      {bales.map((b, i) => (
                        <option key={b.baleId} value={i}>
                          {b.baleId} — {b.capacityPercent}% full ({b.remainingCapacityPercent}% remaining)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Bale Summary */}
                  {selectedBale && (
                    <div className="bale-selected-summary">
                      <div className="bale-summary-stat">
                        <span className="stat-label">Current Capacity</span>
                        <span className="stat-value stat-used">{selectedBale.capacityPercent}%</span>
                      </div>
                      <div className="bale-summary-stat">
                        <span className="stat-label">Remaining Capacity</span>
                        <span className="stat-value stat-free">{selectedBale.remainingCapacityPercent}%</span>
                      </div>
                      <div className="bale-summary-stat">
                        <span className="stat-label">Bundles in Bale</span>
                        <span className="stat-value">{selectedBale.totalBundles}</span>
                      </div>
                    </div>
                  )}

                  {/* Max Additional Table */}
                  <div className="bale-maxadd-table-wrap">
                    <table className="bale-maxadd-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th className="text-right">Capacity / Bundle</th>
                          <th className="text-right">Max Additional Bundles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maxTable.length === 0 ? (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>
                              No products available or bale is full.
                            </td>
                          </tr>
                        ) : (
                          maxTable.map((row) => (
                            <tr key={row.productId} className={row.maxAdditional === 0 ? 'maxadd-row-zero' : ''}>
                              <td className="bale-item-name">
                                <i className="fa-solid fa-rug bale-rug-icon"></i>
                                {row.title}
                              </td>
                              <td className="text-right bale-pct">{row.capacityPerBundlePercent}%</td>
                              <td className="text-right">
                                <span className={`maxadd-badge ${row.maxAdditional === 0 ? 'maxadd-zero' : 'maxadd-positive'}`}>
                                  {row.maxAdditional === 0
                                    ? <><i className="fa-solid fa-ban"></i> Cannot fit</>
                                    : <><i className="fa-solid fa-plus"></i> {row.maxAdditional} bundle{row.maxAdditional !== 1 ? 's' : ''}</>
                                  }
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p className="bale-maxadd-note">
                    <i className="fa-solid fa-circle-info"></i>
                    Values show the maximum additional bundles that can physically fit in this bale
                    given its remaining <strong>{selectedBale?.remainingCapacityPercent}%</strong> capacity.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
