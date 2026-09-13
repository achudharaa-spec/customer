import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919842932756';

// Helper to convert image URL to base64 Data URL to guarantee 100% rendering in html2canvas & jsPDF
async function getBase64Image(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export async function generatePdfInvoice({
  company,
  name,
  phone,
  gst,
  address,
  selectedProductIds,
  products,
  itemQuantities,
  packInfo,
  masterBaleRate = 100
}) {
  const compName = company?.trim() || 'Valued Customer';
  const custName = name?.trim() || 'Wholesale Buyer';
  const custPhone = phone?.trim() || 'N/A';
  const delAddress = address?.trim() || 'Standard Delivery';
  const orderRef = `GSC-ORD-${Date.now().toString().slice(-6)}`;
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Calculate items and totals with parallel image preloading
  let itemsSubtotal = 0;
  const itemPromises = selectedProductIds.map(async (id, idx) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return null;
    const qty = itemQuantities[id] || 1;
    const subtotal = prod.baseRate * qty;
    itemsSubtotal += subtotal;

    // Real product image check: do NOT use company logo for product image
    const hasRealImage = Boolean(prod.imageUrl && !prod.imageUrl.includes('logo.jpg'));
    let prodImgBase64 = null;
    if (hasRealImage) {
      try {
        prodImgBase64 = await Promise.race([
          getBase64Image(prod.imageUrl),
          new Promise((res) => setTimeout(() => res(null), 2500))
        ]);
      } catch (_) {
        prodImgBase64 = null;
      }
    }

    return {
      sno: idx + 1,
      title: prod.title,
      category: prod.category || 'Panipat Mat',
      unit: prod.unit ? prod.unit.replace('per ', '') : 'Bundle',
      bundlePieces: prod.bundlePieces || 10,
      qty,
      rate: prod.baseRate,
      subtotal,
      hasRealImage: Boolean(prodImgBase64),
      imageSrc: prodImgBase64
    };
  });

  const estBales = packInfo?.estPacks || 0;
  const currentBaleRate = Number(masterBaleRate) >= 0 ? Number(masterBaleRate) : 100;
  const masterBaleTotal = estBales * currentBaleRate;
  const grandTotal = itemsSubtotal + masterBaleTotal;

  // Preload logo and product images concurrently
  const [itemsRaw, logoBase64] = await Promise.all([
    Promise.all(itemPromises),
    getBase64Image('/assets/logo.jpg')
  ]);
  const items = itemsRaw.filter(Boolean);

  // Generate WhatsApp QR code locally in-browser (Zero external API dependency)
  let qrBase64 = null;
  try {
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`OrderRef:${orderRef}`)}`;
    qrBase64 = await QRCode.toDataURL(waUrl, {
      width: 100,
      margin: 1,
      color: { dark: '#031b4e', light: '#ffffff' }
    });
  } catch (qrErr) {
    console.warn('Local QR generation error:', qrErr);
  }

  // Create an off-screen A4 container formatted at standard A4 aspect ratio (794px x 1123px)
  const printContainer = document.createElement('div');
  printContainer.id = 'invoice-print-container';
  printContainer.style.position = 'fixed';
  printContainer.style.left = '-9999px';
  printContainer.style.top = '0';
  printContainer.style.width = '794px';
  printContainer.style.minHeight = '1123px';
  printContainer.style.background = '#ffffff';
  printContainer.style.color = '#0f172a';
  printContainer.style.fontFamily = "'Outfit', 'Segoe UI', Roboto, sans-serif";
  printContainer.style.padding = '20px 24px';
  printContainer.style.boxSizing = 'border-box';
  printContainer.style.zIndex = '-9999';
  printContainer.style.opacity = '1';
  printContainer.style.visibility = 'visible';
  printContainer.style.pointerEvents = 'none';

  printContainer.innerHTML = `
    <div style="border: 2px solid #031b4e; border-radius: 14px; padding: 20px 22px; background: #ffffff; min-height: 1083px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
      <div>
        <!-- 1. Header: Brand on left, Trust box on right -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${logoBase64}" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid #d97706; box-shadow: 0 0 8px rgba(217, 119, 6, 0.3);" />
            <div>
              <h1 style="font-size: 1.45rem; font-weight: 900; color: #031b4e; margin: 0; letter-spacing: 0.5px; line-height: 1.1;">GOVINDASAMY & CO</h1>
              <p style="font-size: 0.74rem; color: #64748b; margin: 2px 0 4px 0; font-weight: 500;">Quality Mat & Textile Products Manufacturer & Wholesaler</p>
              <div style="font-size: 0.73rem; color: #334155; display: flex; gap: 8px;">
                <span><i class="fa-solid fa-envelope" style="color: #031b4e;"></i> Email: govindasamy.textile@gmail.com</span>
                <span style="color: #cbd5e1;">|</span>
                <span><i class="fa-solid fa-phone" style="color: #031b4e;"></i> Phone: +91 98429 32756</span>
              </div>
            </div>
          </div>

          <div style="background: #031b4e; color: #ffffff; border-radius: 10px; padding: 8px 14px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 12px rgba(3, 27, 78, 0.2);">
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.74rem; font-weight: 600;">
              <div><i class="fa-solid fa-industry" style="color: #d97706; width: 14px;"></i> Factory Wholesale Rates</div>
              <div><i class="fa-solid fa-truck-fast" style="color: #d97706; width: 14px;"></i> Pan-India Lorry Delivery</div>
              <div><i class="fa-solid fa-leaf" style="color: #d97706; width: 14px;"></i> Premium Cotton Products</div>
            </div>
            <div style="font-size: 1.8rem; color: rgba(255,255,255,0.25);">
              <i class="fa-solid fa-rug"></i>
            </div>
          </div>
        </div>

        <!-- 2. Purchase Order Invoice Banner -->
        <div style="background: #031b4e; color: #ffffff; border-radius: 8px; padding: 7px 12px; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 14px;">
          <span style="color: #d97706; font-weight: 700; font-size: 0.85rem;">❖ —</span>
          <h2 style="font-size: 1.1rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin: 0;">PURCHASE ORDER INVOICE</h2>
          <span style="color: #d97706; font-weight: 700; font-size: 0.85rem;">— ❖</span>
        </div>

        <!-- 3. Details 2-Card Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <!-- Customer Details -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px;">
            <div style="background: #031b4e; color: #ffffff; padding: 3px 10px; border-radius: 9999px; font-size: 0.7rem; font-weight: 800; display: inline-block; margin-bottom: 8px; letter-spacing: 0.4px;">
              <i class="fa-solid fa-user"></i> CUSTOMER & BILL-TO DETAILS
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.78rem;">
              <div style="display: grid; grid-template-columns: 120px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-building" style="color: #031b4e;"></i> Company Name</span>
                <span>:</span>
                <strong style="color: #031b4e;">${compName}</strong>
              </div>
              <div style="display: grid; grid-template-columns: 120px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-user-tie" style="color: #031b4e;"></i> Contact Person</span>
                <span>:</span>
                <span>${custName}</span>
              </div>
              <div style="display: grid; grid-template-columns: 120px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-phone" style="color: #031b4e;"></i> Phone / WA</span>
                <span>:</span>
                <span>${custPhone}</span>
              </div>
              ${gst ? `
              <div style="display: grid; grid-template-columns: 120px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-receipt" style="color: #031b4e;"></i> GSTIN</span>
                <span>:</span>
                <span>${gst}</span>
              </div>
              ` : ''}
              <div style="display: grid; grid-template-columns: 120px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-location-dot" style="color: #031b4e;"></i> Delivery Address</span>
                <span>:</span>
                <span style="word-break: break-word;">${delAddress}</span>
              </div>
            </div>
          </div>

          <!-- Order Details -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px;">
            <div style="background: #031b4e; color: #ffffff; padding: 3px 10px; border-radius: 9999px; font-size: 0.7rem; font-weight: 800; display: inline-block; margin-bottom: 8px; letter-spacing: 0.4px;">
              <i class="fa-solid fa-clipboard-list"></i> ORDER DETAILS
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.78rem;">
              <div style="display: grid; grid-template-columns: 130px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-calendar-day" style="color: #031b4e;"></i> Order Date</span>
                <span>:</span>
                <span>${today}</span>
              </div>
              <div style="display: grid; grid-template-columns: 130px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-file-invoice" style="color: #031b4e;"></i> Order Ref</span>
                <span>:</span>
                <strong style="color: #031b4e;">${orderRef}</strong>
              </div>
              <div style="display: grid; grid-template-columns: 130px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-boxes-packing" style="color: #031b4e;"></i> Master Shipping</span>
                <span>:</span>
                <span>${estBales} Bales (@ Rs. ${currentBaleRate}/Bale)</span>
              </div>
              <div style="display: grid; grid-template-columns: 130px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-truck" style="color: #031b4e;"></i> Dispatch Type</span>
                <span>:</span>
                <span>Lorry Transport Dispatch</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Items Table with Photos (Exact Proportional Columns) -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 14px; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; table-layout: fixed;">
            <thead>
              <tr style="background: #031b4e; color: #ffffff;">
                <th style="padding: 8px 10px; text-align: center; width: 7%; font-size: 0.72rem;">S.No</th>
                <th style="padding: 8px 10px; text-align: left; width: 43%; font-size: 0.72rem;">PRODUCT DESCRIPTION</th>
                <th style="padding: 8px 10px; text-align: left; width: 22%; font-size: 0.72rem;">QUANTITY / PACK</th>
                <th style="padding: 8px 10px; text-align: right; width: 14%; font-size: 0.72rem;">UNIT RATE</th>
                <th style="padding: 8px 10px; text-align: right; width: 14%; font-size: 0.72rem;">SUBTOTAL AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${items.length === 0 ? `
                <tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">No items in order</td></tr>
              ` : items.map((it) => `
                <tr style="border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                  <td style="text-align: center; font-weight: 700; color: #0f172a; padding: 8px 10px;">${it.sno}</td>
                  <td style="padding: 8px 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      ${it.hasRealImage ? `
                        <img src="${it.imageSrc}" style="width: 44px; height: 44px; object-fit: contain; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #ffffff; flex-shrink: 0;" />
                      ` : `
                        <div style="width: 44px; height: 44px; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #f8fafc; color: #031b4e; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
                          <i class="fa-solid fa-rug"></i>
                        </div>
                      `}
                      <div>
                        <strong style="color: #0f172a; font-size: 0.84rem; display: block; line-height: 1.25;">${it.title}</strong>
                        <span style="color: #031b4e; font-size: 0.7rem; font-weight: 700;">[${it.category}]</span>
                      </div>
                    </div>
                  </td>
                  <td style="padding: 8px 10px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <i class="fa-solid fa-cube" style="color: #031b4e; font-size: 0.95rem;"></i>
                      <div>
                        <span style="font-weight: 700; color: #0f172a; font-size: 0.8rem;">${it.qty} ${it.unit}s</span>
                        <small style="color: #64748b; font-size: 0.7rem; display: block;">(${it.qty * it.bundlePieces} pcs)</small>
                      </div>
                    </div>
                  </td>
                  <td style="padding: 8px 10px; text-align: right; font-weight: 600; color: #334155; font-size: 0.82rem;">Rs. ${it.rate.toLocaleString('en-IN')}</td>
                  <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: #031b4e; font-size: 0.88rem; font-family: 'Outfit', sans-serif;">Rs. ${it.subtotal.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 5. Split Totals Box -->
        <div style="display: flex; border: 1.5px solid #031b4e; border-radius: 10px; overflow: hidden; margin-bottom: 12px;">
          <div style="background: #f8fafc; flex: 1; display: flex; align-items: center; gap: 12px; padding: 10px 14px;">
            <div style="width: 42px; height: 42px; border-radius: 50%; background: #031b4e; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.15rem;">
              <i class="fa-solid fa-boxes-stacked"></i>
            </div>
            <div>
              <span style="font-size: 0.73rem; color: #64748b; display: block;">Est. Master Bales Packaging</span>
              <strong style="font-size: 1.1rem; color: #031b4e;">${estBales} Master ${estBales === 1 ? 'Bale' : 'Bales'}</strong>
              <span style="font-size: 0.72rem; color: #334155; display: block; margin-top: 2px;">@ Rs. ${currentBaleRate} / Bale = <strong>Rs. ${masterBaleTotal.toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

          <div style="background: #031b4e; color: #ffffff; flex: 1.3; padding: 10px 16px; display: flex; flex-direction: column; justify-content: center; align-items: flex-end; gap: 3px;">
            <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.72rem; color: rgba(255,255,255,0.85);">
              <span>Products Subtotal:</span>
              <strong style="color: #ffffff;">Rs. ${itemsSubtotal.toLocaleString('en-IN')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.72rem; color: rgba(255,255,255,0.85); padding-bottom: 4px; border-bottom: 1px dashed rgba(255,255,255,0.3);">
              <span>Bale Packaging (${estBales} × ₹${currentBaleRate}):</span>
              <strong style="color: #ffffff;">Rs. ${masterBaleTotal.toLocaleString('en-IN')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; width: 100%; margin-top: 2px;">
              <span style="font-size: 0.74rem; font-weight: 700; letter-spacing: 0.8px; color: #d97706;">GRAND TOTAL</span>
              <span style="font-size: 1.35rem; font-weight: 900; color: #ffffff; line-height: 1.1;">Rs. ${grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- 6. Note Box -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; border-radius: 8px; padding: 6px 10px; font-size: 0.74rem; display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <i class="fa-solid fa-circle-info" style="font-size: 1rem; flex-shrink: 0;"></i>
          <div>
            <strong>Note:</strong> This is an automated Order Inquiry Invoice generated by Govindasamy & Co. Final rates may vary based on seasonal lot & transport terms.
          </div>
        </div>

        <!-- 7. WhatsApp & QR Section -->
        <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 12px; background: #ffffff;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #dcfce7; border: 2px solid #25d366; color: #25d366; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              <i class="fa-brands fa-whatsapp"></i>
            </div>
            <div>
              <p style="font-size: 0.75rem; color: #334155; margin: 0; font-weight: 500;">Please share this PDF or order details to WhatsApp:</p>
              <strong style="font-size: 1.15rem; color: #031b4e; display: block; margin: 2px 0;">+91 98429 32756</strong>
              <p style="font-size: 0.7rem; color: #64748b; margin: 0;">for payment & lorry transport confirmation.</p>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <img src="${qrBase64}" style="width: 72px; height: 72px; border-radius: 6px; border: 1px solid #cbd5e1; padding: 2px; background: #ffffff;" />
            <span style="background: #031b4e; color: #ffffff; font-size: 0.62rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.3px;">SCAN TO CHAT ON WHATSAPP</span>
          </div>
        </div>
      </div>

      <!-- 8. Footer Bar: Plain text without icons as requested -->
      <div style="background: #031b4e; color: #ffffff; border-radius: 8px; padding: 8px 14px; display: flex; align-items: center; justify-content: space-between; font-size: 0.74rem;">
        <span>65, Kamaraj St, Erode - 638001, Tamil Nadu, India</span>
        <span style="color: #d97706; font-weight: 800;">GS & CO • GOVINDASAMY & CO</span>
        <span>Thank you for your trust in our quality & service.</span>
      </div>
    </div>
  `;

  document.body.appendChild(printContainer);

  try {
    // Wait for fonts to be ready
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Wait for all images inside container to load
    const imgs = printContainer.querySelectorAll('img');
    await Promise.all(
      Array.from(imgs).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });
      })
    );

    // Capture using html2canvas at scale 2 for ultra-crisp print quality
    const canvas = await html2canvas(printContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Create jsPDF A4 Document (210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    // Fit perfectly onto standard A4 page (210mm width x 297mm height)
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    const cleanFileName = compName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Govindasamy_Mat_Order_${cleanFileName}.pdf`);
  } finally {
    if (document.body.contains(printContainer)) {
      document.body.removeChild(printContainer);
    }
  }
}

