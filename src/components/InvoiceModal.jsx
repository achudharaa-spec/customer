import React, { useRef, useState } from 'react';
import { generatePdfInvoice } from '../utils/pdfGenerator';
import { toast } from '../utils/toast';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919842686264';

export default function InvoiceModal({
  isOpen,
  onClose,
  company,
  name,
  phone,
  gst,
  address,
  selectedProductIds,
  products,
  itemQuantities,
  packInfo,
  masterBaleRate = 100,
  onUpdateMasterBaleRate,
  hidePrices = true
}) {
  const invoiceRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  if (!isOpen) return null;

  const compName = company?.trim() || 'Valued Customer';
  const custName = name?.trim() || 'Wholesale Buyer';
  const custPhone = phone?.trim() || 'N/A';
  const delAddress = address?.trim() || 'Standard Delivery';
  const orderRef = `SST-ORD-${Date.now().toString().slice(-6)}`;
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Calculate totals
  let totalUnits = 0;
  let itemsSubtotal = 0;
  const items = [];

  selectedProductIds.forEach((id, idx) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    const qty = itemQuantities[id] || 1;
    const subtotal = prod.baseRate * qty;
    totalUnits += qty;
    itemsSubtotal += subtotal;

    items.push({
      sno: idx + 1,
      title: prod.title,
      category: prod.category || 'Handloom Mats',
      unit: prod.unit ? prod.unit.replace('per ', '') : 'Bundle',
      bundlePieces: prod.bundlePieces || 10,
      qty,
      rate: prod.baseRate,
      subtotal,
      imageUrl: prod.imageUrl || '/assets/logo.jpg'
    });
  });

  const estBales = packInfo?.estPacks || 0;
  const currentBaleRate = Number(masterBaleRate) >= 0 ? Number(masterBaleRate) : 100;
  const masterBaleTotal = estBales * currentBaleRate;
  const grandTotal = itemsSubtotal + masterBaleTotal;

  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      toast.info('Generating high-resolution A4 Order Slip PDF...', 'Please wait');
      await generatePdfInvoice({
        company,
        name,
        phone,
        gst,
        address,
        selectedProductIds,
        products,
        itemQuantities,
        packInfo,
        masterBaleRate: currentBaleRate,
        invoiceElement: invoiceRef.current,
        hidePrices
      });
      toast.success('A4 PDF Order Slip downloaded successfully!', 'Slip Saved');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF. Please try again.', 'Error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    let msg = `*${!hidePrices ? 'PURCHASE ORDER INVOICE' : 'WHOLESALE ORDER INDENT'} - ${orderRef}*\n`;
    msg += `🏢 *Company*: ${compName}\n`;
    msg += `👤 *Contact*: ${custName} (${custPhone})\n`;
    msg += `📍 *Delivery Address*: ${delAddress}\n`;
    msg += `------------------------------------\n`;
    items.forEach((it) => {
      if (!hidePrices) {
        msg += `${it.sno}. *${it.title}* - ${it.qty} ${it.unit} @ Rs. ${it.rate.toLocaleString('en-IN')} = Rs. ${it.subtotal.toLocaleString('en-IN')}\n`;
      } else {
        msg += `${it.sno}. *${it.title}* - ${it.qty} ${it.unit}s (${it.qty * it.bundlePieces} pcs)\n`;
      }
    });
    msg += `------------------------------------\n`;
    msg += `📦 *Total Mat Quantity*: ${totalUnits} Bundle(s)\n`;
    msg += `📦 *Est. Master Bales*: ${estBales} Master ${estBales === 1 ? 'Bale' : 'Bales'}\n`;
    if (!hidePrices) {
      msg += `🏷️ *Products Subtotal*: Rs. ${itemsSubtotal.toLocaleString('en-IN')}\n`;
      msg += `💰 *GRAND TOTAL*: *Rs. ${grandTotal.toLocaleString('en-IN')}*\n`;
    }
    msg += `------------------------------------\n`;
    msg += `SRI SURYA TEX, ERODE - 638 001 • Cell: 98426 86264\n`;
    msg += `Please confirm order availability & dispatch details.`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Top Floating Control Bar */}
        <div className="invoice-modal-ctrl-bar">
          <div className="invoice-ctrl-title">
            <i className="fa-solid fa-file-invoice"></i>
            <span>{!hidePrices ? 'Purchase Order Invoice Preview' : 'Wholesale Order Indent Preview'}</span>
          </div>
          <div className="invoice-ctrl-actions">
            <button
              type="button"
              className="btn-invoice-action btn-invoice-pdf"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              title="Download official A4 PDF Slip"
            >
              <i className={`fa-solid ${isDownloading ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
              <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              className="btn-invoice-action btn-invoice-wa"
              onClick={handleShareWhatsApp}
              title="Share indent on WhatsApp"
            >
              <i className="fa-brands fa-whatsapp"></i>
              <span>Share WhatsApp</span>
            </button>
            <button
              type="button"
              className="btn-invoice-close"
              onClick={onClose}
              title="Close Preview"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* The Invoice Document Frame */}
        <div className="invoice-scroll-area">
          <div className="invoice-document-card" ref={invoiceRef}>
            {/* Header: Brand on left, Dark Blue service box on right */}
            <div className="invoice-header-row">
              <div className="invoice-brand-col">
                <div className="invoice-brand-main">
                  <img
                    src="/assets/logo.png"
                    alt="Sri Surya Tex"
                    className="invoice-logo"
                    onError={(e) => { e.target.src = '/assets/logo.jpg'; }}
                  />
                  <div>
                    <h1 className="invoice-company-title">SRI SURYA TEX</h1>
                    <p className="invoice-company-sub">Handloom Mats &bull; Rubber Mats &bull; Fancy Mats &bull; Bed Spreads</p>
                  </div>
                </div>
                <div className="invoice-contact-strip">
                  <span><i className="fa-solid fa-phone"></i> Cell: +91 98426 86264</span>
                  <span className="strip-divider">|</span>
                  <span><i className="fa-solid fa-receipt"></i> GSTIN: 33DBQPM1973N1ZY</span>
                  <span className="strip-divider">|</span>
                  <span><i className="fa-solid fa-location-dot"></i> ERODE - 638 001</span>
                </div>
              </div>

              <div className="invoice-trust-box">
                <div className="trust-points-col">
                  <div className="trust-point-item">
                    <i className="fa-solid fa-industry"></i>
                    <span>Direct Factory Supply</span>
                  </div>
                  <div className="trust-point-item">
                    <i className="fa-solid fa-truck-fast"></i>
                    <span>Pan-India Transport Delivery</span>
                  </div>
                  <div className="trust-point-item">
                    <i className="fa-solid fa-certificate"></i>
                    <span>Premium Handloom & Mats</span>
                  </div>
                </div>
                <div className="trust-mat-deco">
                  <i className="fa-solid fa-rug"></i>
                </div>
              </div>
            </div>

            {/* Banner: TITLE */}
            <div className="invoice-title-banner">
              <div className="banner-ornament">❖ —</div>
              <h2>{!hidePrices ? 'PURCHASE ORDER INVOICE' : 'WHOLESALE ORDER INDENT & PACKING SLIP'}</h2>
              <div className="banner-ornament">— ❖</div>
            </div>

            {/* 2-Card Details Grid */}
            <div className="invoice-details-grid">
              {/* Customer & Bill-To */}
              <div className="invoice-info-card">
                <div className="info-card-badge">
                  <i className="fa-solid fa-user"></i>
                  <span>CUSTOMER & BILL-TO DETAILS</span>
                </div>
                <div className="info-rows-list">
                  <div className="info-row">
                    <span className="info-label"><i className="fa-solid fa-building"></i> Company Name</span>
                    <span className="info-colon">:</span>
                    <span className="info-val strong-val">{compName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label"><i className="fa-solid fa-user-tie"></i> Contact Person</span>
                    <span className="info-colon">:</span>
                    <span className="info-val">{custName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label"><i className="fa-solid fa-phone"></i> Phone / WhatsApp</span>
                    <span className="info-colon">:</span>
                    <span className="info-val">{custPhone}</span>
                  </div>
                  {gst && (
                    <div className="info-row">
                      <span className="info-label"><i className="fa-solid fa-receipt"></i> GST Number</span>
                      <span className="info-colon">:</span>
                      <span className="info-val">{gst}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label"><i className="fa-solid fa-location-dot"></i> Delivery Address</span>
                    <span className="info-colon">:</span>
                    <span className="info-val">{delAddress}</span>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="invoice-info-card">
                <div className="info-card-badge">
                  <i className="fa-solid fa-clipboard-list"></i>
                  <span>INDENT & DISPATCH DETAILS</span>
                </div>
                <div className="info-rows-list">
                  <div className="info-row">
                    <span className="info-label"><i className="fa-solid fa-calendar-day"></i> Indent Date</span>
                    <span className="info-colon">:</span>
                    <span className="info-val">{today}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label"><i className="fa-solid fa-file-invoice"></i> Indent Ref</span>
                    <span className="info-colon">:</span>
                    <span className="info-val strong-val">{orderRef}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label"><i className="fa-solid fa-boxes-packing"></i> Master Shipping Bales</span>
                    <span className="info-colon">:</span>
                    <span className="info-val">{packInfo.estPacks} Bales</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label"><i className="fa-solid fa-clock"></i> Dispatch Type</span>
                    <span className="info-colon">:</span>
                    <span className="info-val">Lorry Transport Dispatch</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Items Table */}
            <div className="invoice-table-container">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th style={{ width: '8%' }}>S.No</th>
                    <th style={{ width: !hidePrices ? '42%' : '48%' }}>PRODUCT DESCRIPTION</th>
                    <th style={{ width: !hidePrices ? '22%' : '24%' }}>QUANTITY / PACK</th>
                    {!hidePrices && <th style={{ width: '14%', textAlign: 'right' }}>UNIT RATE</th>}
                    {!hidePrices && <th style={{ width: '14%', textAlign: 'right' }}>SUBTOTAL AMOUNT</th>}
                    {hidePrices && <th style={{ width: '20%', textAlign: 'right' }}>DISPATCH PACKING</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={!hidePrices ? 5 : 4} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                        No items selected in order
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it.sno}>
                        <td className="table-center">{it.sno}</td>
                        <td>
                          <div className="table-prod-cell">
                            {it.imageUrl && !it.imageUrl.includes('logo.jpg') ? (
                              <img
                                src={it.imageUrl}
                                alt={it.title}
                                className="table-prod-img"
                              />
                            ) : (
                              <div className="table-prod-icon-box" title="Woven Mat Product">
                                <i className="fa-solid fa-rug"></i>
                              </div>
                            )}
                            <div>
                              <strong className="table-prod-title">{it.title}</strong>
                              <span className="table-cat-badge">[{it.category}]</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="table-qty-cell">
                            <i className="fa-solid fa-cube"></i>
                            <div>
                              <span>{it.qty} {it.unit}s</span>
                              <small>({it.qty * it.bundlePieces} pcs)</small>
                            </div>
                          </div>
                        </td>
                        {!hidePrices && <td className="table-rate-cell">Rs. {it.rate.toLocaleString('en-IN')}</td>}
                        {!hidePrices && <td className="table-subtotal-cell">Rs. {it.subtotal.toLocaleString('en-IN')}</td>}
                        {hidePrices && (
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--brand-navy)' }}>
                            Factory Lot
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Grand Total & Est Master Bales Box */}
            <div className="invoice-totals-box">
              <div className="bales-summary-col">
                <div className="bales-icon-circle">
                  <i className="fa-solid fa-boxes-stacked"></i>
                </div>
                <div>
                  <span className="bales-subtext">Est. Master Bales Packaging</span>
                  <strong className="bales-count">{estBales} Master {estBales === 1 ? 'Bale' : 'Bales'}</strong>
                  {!hidePrices && (
                    <div className="invoice-bale-rate-pill">
                      <span>@ ₹{currentBaleRate}/Bale = <strong>Rs. {masterBaleTotal.toLocaleString('en-IN')}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grand-total-col">
                {!hidePrices ? (
                  <>
                    <div className="invoice-subtotal-line">
                      <span>Products Subtotal:</span>
                      <strong>Rs. {itemsSubtotal.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="invoice-bale-line">
                      <span>📦 Bale Charges: {estBales} {estBales === 1 ? 'Bale' : 'Bales'} @ ₹{currentBaleRate}/bale =</span>
                      <strong>Rs. {masterBaleTotal.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="invoice-grand-line">
                      <span className="grand-total-label">GRAND TOTAL ────</span>
                      <span className="grand-total-amount">Rs. {grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="invoice-subtotal-line">
                      <span>Total Products Selected:</span>
                      <strong>{items.length} Products</strong>
                    </div>
                    <div className="invoice-subtotal-line">
                      <span>Total Mat Bundles:</span>
                      <strong>{totalUnits} Bundles</strong>
                    </div>
                    <div className="invoice-grand-line">
                      <span className="grand-total-label">TOTAL PACKING ────</span>
                      <span className="grand-total-amount" style={{ fontSize: '1.2rem' }}>
                        {estBales} Master {estBales === 1 ? 'Bale' : 'Bales'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bale Allocation Breakdown */}
            {Array.isArray(packInfo.bales) && packInfo.bales.length > 0 && (
              <div className="invoice-bale-breakdown">
                <div className="bale-breakdown-header">
                  <i className="fa-solid fa-layer-group"></i>
                  <span>Master Bale Allocation Breakdown</span>
                </div>
                {packInfo.bales.map((bale) => (
                  <div key={bale.baleId} className="invoice-bale-row">
                    <div className="invoice-bale-id">
                      <i className="fa-solid fa-cube"></i> {bale.baleId}
                    </div>
                    <div className="invoice-bale-bar-wrap">
                      <div className="invoice-bale-bar-track">
                        <div
                          className="invoice-bale-bar-fill"
                          style={{ width: `${Math.min(100, parseFloat(bale.capacityPercent))}%` }}
                        ></div>
                      </div>
                      <span className="invoice-bale-pct">{bale.capacityPercent}%</span>
                    </div>
                    <div className="invoice-bale-items">
                      {bale.items.map((it) => (
                        <span key={it.itemId} className="invoice-bale-chip">
                          {it.title}: {it.bundleQty}B ({it.capacityPercent}%)
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Automated Note */}
            <div className="invoice-note-box">
              <i className="fa-solid fa-circle-exclamation note-icon"></i>
              <div>
                <strong>Note:</strong> Automated Wholesale Order Indent & Packing Slip generated by SRI SURYA TEX. Official lorry dispatch terms and transport confirmation will be provided upon dispatch.
              </div>
            </div>

            {/* WhatsApp QR & Direct Action Box */}
            <div className="invoice-whatsapp-box">
              <div className="wa-instructions-col">
                <div className="wa-icon-ring">
                  <i className="fa-brands fa-whatsapp"></i>
                </div>
                <div>
                  <p className="wa-callout-text">Share this Order Slip or details to WhatsApp:</p>
                  <strong className="wa-phone-highlight">+91 98426 86264</strong>
                  <p className="wa-sub-text">P. MYILSAMY &bull; SRI SURYA TEX for transport & stock dispatch.</p>
                </div>
              </div>

              <div className="wa-qr-col">
                <div className="qr-box-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`https://wa.me/919842686264?text=OrderRef:${orderRef}`)}`}
                    alt="WhatsApp QR Code"
                    className="qr-img"
                  />
                  <span className="qr-badge">SCAN TO CHAT ON WHATSAPP</span>
                </div>
              </div>
            </div>

            {/* Footer Bar */}
            <div className="invoice-footer-bar">
              <div className="footer-bar-item">
                <span>185, Eswaran Kovil Kidangu Street, ERODE - 638 001</span>
              </div>
              <div className="footer-bar-item footer-brand-center">
                <strong>SRI SURYA TEX • P. MYILSAMY</strong>
              </div>
              <div className="footer-bar-item footer-trust-right">
                <span>GSTIN: 33DBQPM1973N1ZY • Cell: 98426 86264</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
