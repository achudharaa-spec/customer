import React, { useState } from 'react';
import { db, collection, addDoc, doc, setDoc, serverTimestamp } from '../firebase';
import { calculateMasterPacks } from '../utils/packetEngine';
import { generatePdfInvoice } from '../utils/pdfGenerator';
import { toast } from '../utils/toast';
import { sanitizeInput, orderRateLimiter } from '../utils/security';
import BalePackingModal from './BalePackingModal';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919842932756';

export default function OrderLayer({
  isOpen,
  onClose,
  selectedProductIds,
  products,
  itemQuantities,
  onUpdateQty,
  onRemoveItem,
  onOpenInvoicePreview,
  masterBaleRate = 100,
  onUpdateMasterBaleRate
}) {
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [address, setAddress] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [isBaleModalOpen, setIsBaleModalOpen] = useState(false);

  // Field validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Real-time validation rule function
  const validateField = (field, val) => {
    const value = (val ?? '').trim();
    switch (field) {
      case 'company':
        if (!value) return 'Company / Shop name is required';
        if (value.length < 3) return 'Company name must be at least 3 characters';
        return '';

      case 'name':
        if (!value) return 'Contact person name is required';
        if (value.length < 2) return 'Contact name must be at least 2 characters';
        if (!/^[a-zA-Z\s.]+$/.test(value)) return 'Name should only contain letters and spaces';
        return '';

      case 'phone': {
        if (!value) return 'WhatsApp / Phone number is required';
        const digits = value.replace(/\D/g, '');
        const normalized = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
        if (normalized.length !== 10) return 'Enter a valid 10-digit mobile number';
        if (!/^[6-9]\d{9}$/.test(normalized)) return 'Mobile number must start with 6, 7, 8, or 9';
        return '';
      }

      case 'gst':
        if (value) {
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
          if (!gstRegex.test(value)) {
            return 'Invalid 15-digit GSTIN (e.g. 33AAAAA0000A1Z5) or leave blank';
          }
        }
        return '';

      case 'address':
        if (!value) return 'Delivery address & transport city is required';
        if (value.length < 8) return 'Please provide full address & city (min 8 characters)';
        return '';

      default:
        return '';
    }
  };

  const handleFieldChange = (field, val) => {
    if (field === 'company') setCompany(val);
    if (field === 'name') setName(val);
    if (field === 'phone') setPhone(val);
    if (field === 'gst') setGst(val.toUpperCase());
    if (field === 'address') setAddress(val);

    if (touched[field]) {
      const err = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleFieldBlur = (field, val) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const validateAllDetails = () => {
    const newErrors = {
      company: validateField('company', company),
      name: validateField('name', name),
      phone: validateField('phone', phone),
      gst: validateField('gst', gst),
      address: validateField('address', address)
    };

    const hasErrors = Object.values(newErrors).some((e) => Boolean(e));
    setErrors(newErrors);
    setTouched({
      company: true,
      name: true,
      phone: true,
      gst: true,
      address: true
    });

    if (hasErrors) {
      toast.error('Please fill in and correct all required business details.', 'Validation Required');
      return false;
    }
    return true;
  };

  // Calculate packet bundling info
  const packInfo = calculateMasterPacks(selectedProductIds, products, itemQuantities);

  // Calculate grand totals with re-editable master bale pricing
  let totalUnits = 0;
  let itemsSubtotal = 0;
  selectedProductIds.forEach((id) => {
    const prod = products.find((p) => p.id === id);
    const qty = itemQuantities[id] || 1;
    if (prod) {
      totalUnits += qty;
      itemsSubtotal += prod.baseRate * qty;
    }
  });

  const estBales = packInfo.estPacks || 0;
  const currentBaleRate = Number(masterBaleRate) >= 0 ? Number(masterBaleRate) : 100;
  const masterBaleTotal = estBales * currentBaleRate;
  const grandTotal = itemsSubtotal + masterBaleTotal;

  const handleWhatsAppSubmit = async () => {
    // Bot Honeypot Defense
    if (honeypot) {
      console.warn('Bot submission blocked via honeypot.');
      return;
    }

    // Client-Side Submission Rate Limiting
    const rateCheck = orderRateLimiter.canProceed();
    if (!rateCheck.allowed) {
      toast.warning(`Please wait ${rateCheck.remainingSecs} seconds before submitting again.`, 'Request Throttled');
      return;
    }

    if (selectedProductIds.length === 0) {
      toast.warning('Please select at least 1 mat item before sending order.', 'Order Form Empty');
      return;
    }

    if (!validateAllDetails()) {
      return;
    }

    const cleanCompany = sanitizeInput(company);
    const cleanName = sanitizeInput(name);
    const cleanPhone = sanitizeInput(phone).replace(/\s+/g, '');
    const cleanAddress = sanitizeInput(address);
    const cleanGst = sanitizeInput(gst);

    // Safely map and filter valid products
    const validItems = selectedProductIds
      .map((id) => {
        const prod = products.find((p) => p.id === id);
        if (!prod) return null;
        return {
          title: prod.title || 'Mat Product',
          category: prod.category || 'General',
          qty: Number(itemQuantities[id]) || 1,
          unitRate: Number(prod.baseRate) || 0
        };
      })
      .filter(Boolean);

    if (validItems.length === 0) {
      toast.error('Selected products are no longer available in the catalog. Please reselect items.', 'Item Unavailable');
      return;
    }

    // Save order in Firestore with strict schema compliance & broadcast to Admin Portal
    try {
      const orderPayload = {
        companyName: cleanCompany,
        contactPerson: cleanName,
        phone: cleanPhone,
        gstNumber: cleanGst || 'N/A',
        deliveryAddress: cleanAddress,
        items: validItems,
        totalUnits: Number(totalUnits),
        itemsSubtotal: Number(itemsSubtotal),
        estBales: Number(estBales) || 1,
        masterBaleRate: Number(currentBaleRate),
        masterBaleTotal: Number(masterBaleTotal),
        bales: packInfo.bales || [],
        balesPacked: true,
        grandTotal: Number(grandTotal),
        status: 'PENDING',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderPayload);

      // Persist dedicated master_bales record for the order
      if (packInfo.bales && packInfo.bales.length > 0) {
        try {
          await setDoc(doc(db, 'master_bales', docRef.id), {
            orderId: docRef.id,
            companyName: cleanCompany,
            totalBales: Number(estBales) || 1,
            totalBundles: Number(totalUnits),
            bales: packInfo.bales,
            createdAt: serverTimestamp()
          });
        } catch (baleErr) {
          console.warn('master_bales sub-doc notice:', baleErr.message);
        }
      }

      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('gsco_realtime_channel');
        channel.postMessage({
          type: 'ORDER_PLACED',
          order: { id: docRef.id, ...orderPayload }
        });
        channel.close();
      }

      toast.success('Your wholesale order inquiry was logged! Opening WhatsApp...', 'Order Registered');
    } catch (err) {
      console.warn('Firestore direct write bypassed or offline. Proceeding to WhatsApp:', err.message);
    }

    // Build WhatsApp Message
    let message = `*NEW WHOLESALE ORDER INQUIRY*\n`;
    message += `*GOVINDASAMY & CO - WHOLESALE MAT CATALOG*\n`;
    message += `====================================\n`;
    message += `🏢 *Company / Shop*: ${cleanCompany}\n`;
    message += `👤 *Contact Person*: ${cleanName}\n`;
    message += `📞 *Phone / WhatsApp*: ${cleanPhone}\n`;
    if (cleanGst) message += `🏛️ *GST Number*: ${cleanGst}\n`;
    message += `📍 *Delivery Address & City*: ${cleanAddress}\n`;
    message += `====================================\n`;
    message += `*ORDERED MAT ITEMS*:\n`;

    validItems.forEach((item, index) => {
      const subtotal = item.qty * item.unitRate;
      message += `${index + 1}. *${item.title}*\n`;
      message += `   Quantity: ${item.qty} Bundle(s) | Rate: Rs. ${item.unitRate.toLocaleString('en-IN')} | Total: Rs. ${subtotal.toLocaleString('en-IN')}\n`;
    });

    message += `====================================\n`;
    message += `📦 *Total Mat Quantity*: ${totalUnits} Bundle(s)\n`;
    message += `🏷️ *Products Subtotal*: Rs. ${itemsSubtotal.toLocaleString('en-IN')}\n`;
    message += `📦 *Est. Master Bales*: ${estBales} Master ${estBales === 1 ? 'Bale' : 'Bales'} @ Rs. ${currentBaleRate}/Bale = Rs. ${masterBaleTotal.toLocaleString('en-IN')}\n`;
    message += `💰 *TOTAL ESTIMATED GRAND RATE*: *Rs. ${grandTotal.toLocaleString('en-IN')}*\n`;
    message += `🏷️ *Wholesale Notice*: Price may differ based on the season item or the stock quantity at dispatch.\n`;
    message += `====================================\n`;
    message += `Please confirm availability & dispatch transport details. Thank you!`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownloadPdf = async () => {
    if (selectedProductIds.length === 0) {
      toast.warning('Please select at least 1 mat item before downloading PDF invoice.', 'Cart Empty');
      return;
    }

    if (!validateAllDetails()) {
      return;
    }

    if (isDownloadingPdf) return;
    try {
      setIsDownloadingPdf(true);
      toast.info('Generating high-resolution A4 Invoice PDF with images...', 'Please wait');
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
        masterBaleRate: currentBaleRate
      });
      toast.success('A4 PDF Invoice downloaded successfully!', 'Invoice Saved');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF. Please try again.', 'Error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <>
      <div className={`layer-backdrop ${isOpen ? '' : 'hidden'}`} onClick={onClose}></div>

      <aside className={`separate-order-layer ${isOpen ? 'layer-open' : ''}`}>
        <div className="layer-content-card">
          {/* Header */}
          <div className="layer-header-bar">
            <div>
              <h3>Wholesale Purchase Order</h3>
              <p>Review items, fill company details & export order</p>
            </div>
            <button type="button" className="btn-close-layer" onClick={onClose} title="Close Order Form">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="layer-body">
            {/* Section 1: Selected Items & Quantities */}
            <div className="order-form-section">
              <div className="form-section-title">
                <i className="fa-solid fa-clipboard-check"></i>
                <h4>1. Selected Items & Quantities</h4>
              </div>

              <div className="selected-items-list">
                {selectedProductIds.length === 0 ? (
                  <div className="empty-cart-notice">
                    <i className="fa-solid fa-cart-arrow-down"></i>
                    <h5>No Items Selected Yet</h5>
                    <p>Click <strong>"+ Select Item"</strong> on any mat card to build your order.</p>
                  </div>
                ) : (
                  selectedProductIds.map((id) => {
                    const prod = products.find((p) => p.id === id);
                    if (!prod) return null;
                    const qty = itemQuantities[id] || 1;
                    const subtotal = prod.baseRate * qty;

                    return (
                      <div key={id} className="order-item-card">
                        <div className="order-item-main">
                          {prod.imageUrl && !prod.imageUrl.includes('logo.jpg') ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              className="layer-item-thumb"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="layer-item-thumb-box">
                              <i className="fa-solid fa-rug"></i>
                            </div>
                          )}
                          <div className="order-item-meta">
                            <h5 className="order-item-name">{prod.title}</h5>
                            <span className="order-item-rate">
                              ₹{prod.baseRate.toLocaleString('en-IN')} / {prod.unit ? prod.unit.replace('per ', '') : 'Bundle'}
                            </span>
                          </div>
                        </div>

                        <div className="order-item-stepper-row">
                          <div className="qty-stepper">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => onUpdateQty(id, Math.max(1, qty - 1))}
                              aria-label="Decrease quantity"
                            >
                              <i className="fa-solid fa-minus"></i>
                            </button>
                            <span className="qty-val">{qty}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => onUpdateQty(id, qty + 1)}
                              aria-label="Increase quantity"
                            >
                              <i className="fa-solid fa-plus"></i>
                            </button>
                          </div>

                          <span className="order-item-subtotal">₹{subtotal.toLocaleString('en-IN')}</span>

                          <button
                            type="button"
                            className="btn-delete-item"
                            onClick={() => onRemoveItem(id)}
                            title="Remove product"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Section 2: Business & Contact Form */}
            <div className="order-form-section">
              <div className="form-section-title">
                <i className="fa-solid fa-building"></i>
                <h4>2. Business & Contact Details</h4>
              </div>

              {/* Anti-Bot Honeypot field (hidden from legitimate users) */}
              <input
                type="text"
                name="hp_order_security"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none', position: 'absolute', left: '-9999px', opacity: 0 }}
                tabIndex="-1"
                autoComplete="off"
              />

              {/* 1. Company Name */}
              <div className="form-group-custom">
                <div className="form-label-row">
                  <label htmlFor="order-company-input">
                    <i className="fa-solid fa-store"></i> Company / Shop Name *
                  </label>
                  {touched.company && !errors.company && company.trim() && (
                    <span className="field-valid-badge"><i className="fa-solid fa-check"></i> Valid</span>
                  )}
                </div>
                <input
                  id="order-company-input"
                  type="text"
                  className={`form-control-custom ${touched.company && errors.company ? 'field-input-error' : touched.company && company.trim() && !errors.company ? 'field-input-valid' : ''}`}
                  value={company}
                  onChange={(e) => handleFieldChange('company', e.target.value)}
                  onBlur={(e) => handleFieldBlur('company', e.target.value)}
                  placeholder="e.g. Sri Lakshmi Textiles & Mat Stores"
                  required
                />
                {touched.company && errors.company && (
                  <span className="field-error-text">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.company}
                  </span>
                )}
              </div>

              {/* 2. Contact Person */}
              <div className="form-group-custom">
                <div className="form-label-row">
                  <label htmlFor="order-name-input">
                    <i className="fa-solid fa-user"></i> Contact Person Name *
                  </label>
                  {touched.name && !errors.name && name.trim() && (
                    <span className="field-valid-badge"><i className="fa-solid fa-check"></i> Valid</span>
                  )}
                </div>
                <input
                  id="order-name-input"
                  type="text"
                  className={`form-control-custom ${touched.name && errors.name ? 'field-input-error' : touched.name && name.trim() && !errors.name ? 'field-input-valid' : ''}`}
                  value={name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={(e) => handleFieldBlur('name', e.target.value)}
                  placeholder="e.g. Mr. K. Ramesh"
                  required
                />
                {touched.name && errors.name && (
                  <span className="field-error-text">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.name}
                  </span>
                )}
              </div>

              {/* 3. Phone / WhatsApp */}
              <div className="form-group-custom">
                <div className="form-label-row">
                  <label htmlFor="order-phone-input">
                    <i className="fa-solid fa-phone"></i> WhatsApp / Phone Number *
                  </label>
                  {touched.phone && !errors.phone && phone.trim() && (
                    <span className="field-valid-badge"><i className="fa-solid fa-check"></i> Valid</span>
                  )}
                </div>
                <input
                  id="order-phone-input"
                  type="tel"
                  className={`form-control-custom ${touched.phone && errors.phone ? 'field-input-error' : touched.phone && phone.trim() && !errors.phone ? 'field-input-valid' : ''}`}
                  value={phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                  placeholder="e.g. 9842932756"
                  required
                />
                {touched.phone && errors.phone && (
                  <span className="field-error-text">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.phone}
                  </span>
                )}
              </div>

              {/* 4. GST Number (Optional) */}
              <div className="form-group-custom">
                <div className="form-label-row">
                  <label htmlFor="order-gst-input">
                    <i className="fa-solid fa-receipt"></i> GST Number (Optional)
                  </label>
                  {touched.gst && !errors.gst && gst.trim() && (
                    <span className="field-valid-badge"><i className="fa-solid fa-check"></i> Valid GST</span>
                  )}
                </div>
                <input
                  id="order-gst-input"
                  type="text"
                  className={`form-control-custom ${touched.gst && errors.gst ? 'field-input-error' : touched.gst && gst.trim() && !errors.gst ? 'field-input-valid' : ''}`}
                  value={gst}
                  onChange={(e) => handleFieldChange('gst', e.target.value)}
                  onBlur={(e) => handleFieldBlur('gst', e.target.value)}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                />
                {touched.gst && errors.gst && (
                  <span className="field-error-text">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.gst}
                  </span>
                )}
              </div>

              {/* 5. Delivery Address */}
              <div className="form-group-custom">
                <div className="form-label-row">
                  <label htmlFor="order-address-input">
                    <i className="fa-solid fa-location-dot"></i> Delivery Address & Lorry Transport City *
                  </label>
                  {touched.address && !errors.address && address.trim() && (
                    <span className="field-valid-badge"><i className="fa-solid fa-check"></i> Valid</span>
                  )}
                </div>
                <textarea
                  id="order-address-input"
                  className={`form-control-custom ${touched.address && errors.address ? 'field-input-error' : touched.address && address.trim() && !errors.address ? 'field-input-valid' : ''}`}
                  rows="2"
                  value={address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  onBlur={(e) => handleFieldBlur('address', e.target.value)}
                  placeholder="Full street address, city, landmark & preferred lorry transport service..."
                  required
                ></textarea>
                {touched.address && errors.address && (
                  <span className="field-error-text">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.address}
                  </span>
                )}
              </div>
            </div>

            {/* Section 3: Summary & Master Bales Calculation */}
            <div className="order-calc-card">
              <div className="calc-row">
                <span>Selected Products:</span>
                <strong>{selectedProductIds.length} Items</strong>
              </div>
              <div className="calc-row">
                <span>Total Ordered Quantity:</span>
                <strong>{totalUnits} Bundle(s)</strong>
              </div>
              <div className="calc-row">
                <span>Products Subtotal:</span>
                <strong style={{ color: '#031b4e' }}>₹{itemsSubtotal.toLocaleString('en-IN')}</strong>
              </div>

              {/* Master Bale Cost & Re-editable Rate Section */}
              <div className="bale-rate-control-box">
                <div className="bale-rate-header-row">
                  <span className="bale-rate-label">
                    <i className="fa-solid fa-boxes-packing"></i> Est. Master Bales:
                  </span>
                  <strong className="bale-count-badge">
                    {estBales} Master {estBales === 1 ? 'Bale' : 'Bales'}
                  </strong>
                </div>

                <div className="bale-rate-input-row">
                  <div className="bale-rate-field-label">
                    <i className="fa-solid fa-tag"></i> Rate / Master Bale (Re-editable):
                  </div>
                  <div className="bale-rate-stepper">
                    <button
                      type="button"
                      className="bale-rate-btn"
                      onClick={() => {
                        const newRate = Math.max(0, (Number(masterBaleRate) || 0) - 10);
                        if (onUpdateMasterBaleRate) onUpdateMasterBaleRate(newRate);
                      }}
                      title="Decrease rate by ₹10"
                    >
                      <i className="fa-solid fa-minus"></i>
                    </button>
                    <div className="bale-rate-input-wrap">
                      <span className="bale-currency-symbol">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        className="bale-rate-input"
                        value={masterBaleRate}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                          if (onUpdateMasterBaleRate) onUpdateMasterBaleRate(val);
                        }}
                        onBlur={() => {
                          if (masterBaleRate === '' || isNaN(masterBaleRate)) {
                            if (onUpdateMasterBaleRate) onUpdateMasterBaleRate(100);
                          }
                        }}
                        placeholder="100"
                      />
                    </div>
                    <button
                      type="button"
                      className="bale-rate-btn"
                      onClick={() => {
                        const newRate = (Number(masterBaleRate) || 0) + 10;
                        if (onUpdateMasterBaleRate) onUpdateMasterBaleRate(newRate);
                      }}
                      title="Increase rate by ₹10"
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                    {Number(masterBaleRate) !== 100 && (
                      <button
                        type="button"
                        className="bale-rate-reset-btn"
                        onClick={() => {
                          if (onUpdateMasterBaleRate) onUpdateMasterBaleRate(100);
                        }}
                        title="Reset to default ₹100 / Bale"
                      >
                        Reset (₹100)
                      </button>
                    )}
                  </div>
                </div>

                <div className="calc-row bale-cost-summary-row">
                  <span>📦 Bale Charges: {estBales} {estBales === 1 ? 'Bale' : 'Bales'} @ ₹{currentBaleRate}/bale = </span>
                  <strong className="bale-cost-val">Rs. {masterBaleTotal.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="calc-row calc-row-total">
                <span>Grand Total (Products + Bales):</span>
                <strong className="calc-grand-total">₹{grandTotal.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Seasonal Pricing Disclaimer */}
            <div className="order-pricing-disclaimer">
              <i className="fa-solid fa-tags"></i>
              <span>
                <strong>Wholesale Note:</strong> Price may differ based on the season item or the stock quantity at dispatch. Final confirmation will be provided with lorry dispatch invoice.
              </span>
            </div>

            {/* Section 4: Action Buttons */}
            <div className="layer-action-buttons">
              {/* Bale Allocation Plan button — no form validation required */}
              <button
                type="button"
                className="btn-bale-plan"
                onClick={() => {
                  if (selectedProductIds.length === 0) {
                    toast.warning('Please select at least 1 mat product to view bale plan.', 'Cart Empty');
                    return;
                  }
                  setIsBaleModalOpen(true);
                }}
              >
                <i className="fa-solid fa-boxes-stacked"></i>
                <span>View Bale Allocation Plan</span>
              </button>

              <button
                type="button"
                className="btn-preview-invoice"
                onClick={() => {
                  if (selectedProductIds.length === 0) {
                    toast.warning('Please select at least 1 mat product to view invoice.', 'Cart Empty');
                    return;
                  }
                  if (!validateAllDetails()) {
                    return;
                  }
                  if (onOpenInvoicePreview) {
                    onOpenInvoicePreview({ company, name, phone, gst, address });
                  }
                }}
              >
                <i className="fa-solid fa-file-invoice"></i>
                <span>View / Preview Order Invoice</span>
              </button>
              <button
                type="button"
                className="btn-whatsapp-submit"
                onClick={handleWhatsAppSubmit}
              >
                <i className="fa-brands fa-whatsapp"></i>
                <span>Send Order via WhatsApp</span>
              </button>
              <button
                type="button"
                className="btn-pdf-download"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
              >
                <i className={`fa-solid ${isDownloadingPdf ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
                <span>{isDownloadingPdf ? 'Generating A4 PDF...' : 'Download PDF Order Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Bale Packing Modal — rendered outside aside so it overlays correctly */}
      <BalePackingModal
        isOpen={isBaleModalOpen}
        onClose={() => setIsBaleModalOpen(false)}
        packInfo={packInfo}
        products={products}
      />
    </>
  );
}
