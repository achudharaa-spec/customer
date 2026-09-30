import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '9842686264';

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
  masterBaleRate = 100,
  hidePrices = true
}) {
  const compName = company?.trim() || 'Valued Customer';
  const custName = name?.trim() || 'Wholesale Buyer';
  const custPhone = phone?.trim() || 'N/A';
  const delAddress = address?.trim() || 'Standard Delivery';
  const orderRef = `SST-ORD-${Date.now().toString().slice(-6)}`;
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Calculate items and totals with parallel image preloading
  let itemsSubtotal = 0;
  let totalBundles = 0;
  let totalPieces = 0;

  const itemPromises = selectedProductIds.map(async (id, idx) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return null;
    const qty = itemQuantities[id] || 1;
    const subtotal = (prod.baseRate || 0) * qty;
    itemsSubtotal += subtotal;
    totalBundles += qty;
    totalPieces += qty * (prod.bundlePieces || 10);

    // Pick first valid image from prod.images array or prod.imageUrl
    const candidateImg = Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : prod.imageUrl;
    const hasRealImage = Boolean(candidateImg && !candidateImg.includes('logo.jpg') && !candidateImg.includes('logo.png'));
    let prodImgBase64 = null;
    if (hasRealImage) {
      try {
        prodImgBase64 = await Promise.race([
          getBase64Image(candidateImg),
          new Promise((res) => setTimeout(() => res(null), 2500))
        ]);
      } catch (_) {
        prodImgBase64 = null;
      }
    }

    return {
      sno: idx + 1,
      title: prod.title,
      category: prod.category || 'Handloom Mat',
      unit: prod.unit ? prod.unit.replace('per ', '') : 'Bundle',
      bundlePieces: prod.bundlePieces || 10,
      bundlesPerPack: prod.bundlesPerPack || 5,
      qty,
      rate: prod.baseRate || 0,
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
    getBase64Image('/assets/logo.png')
  ]);
  const items = itemsRaw.filter(Boolean);

  // Generate WhatsApp QR code locally in-browser
  let qrBase64 = null;
  try {
    const cleanWaNumber = WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
    const fullWaNumber = cleanWaNumber.startsWith('91') ? cleanWaNumber : `91${cleanWaNumber}`;
    const waUrl = `https://wa.me/${fullWaNumber}?text=${encodeURIComponent(`OrderRef:${orderRef}`)}`;
    qrBase64 = await QRCode.toDataURL(waUrl, {
      width: 100,
      margin: 1,
      color: { dark: '#15244c', light: '#ffffff' }
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
    <div style="border: 2px solid #15244c; border-radius: 14px; padding: 20px 22px; background: #ffffff; min-height: 1083px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
      <div>
        <!-- 1. Header: Brand on left, Trust box on right -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${logoBase64}" style="width: 58px; height: 58px; object-fit: contain; border-radius: 8px; border: 2px solid #c89a4b; padding: 2px; background: #ffffff;" />
            <div>
              <div style="display: flex; align-items: baseline; gap: 8px;">
                <h1 style="font-size: 1.5rem; font-weight: 900; color: #15244c; margin: 0; letter-spacing: 0.5px; line-height: 1.1;">SRI SURYA TEX</h1>
                <span style="font-size: 0.76rem; font-weight: 700; color: #9e2267;">Prop: P. MYILSAMY</span>
              </div>
              <p style="font-size: 0.72rem; color: #475569; margin: 2px 0 4px 0; font-weight: 600;">Handloom Mats • Rubber Mats • Fancy Mats • Bed Spreads</p>
              <div style="font-size: 0.72rem; color: #334155; display: flex; gap: 8px; flex-wrap: wrap;">
                <span>Cell: <strong>98426 86264</strong></span>
                <span style="color: #cbd5e1;">|</span>
                <span>GSTIN: <strong>33DBQPM1973N1ZY</strong></span>
                <span style="color: #cbd5e1;">|</span>
                <span>ERODE - 638 001</span>
              </div>
            </div>
          </div>

          <div style="background: #15244c; color: #ffffff; border-radius: 10px; padding: 8px 14px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 12px rgba(21, 36, 76, 0.2);">
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.72rem; font-weight: 600;">
              <div><i class="fa-solid fa-industry" style="color: #c89a4b; width: 14px;"></i> Factory Direct Wholesaler</div>
              <div><i class="fa-solid fa-truck-fast" style="color: #c89a4b; width: 14px;"></i> Pan-India Lorry Transport</div>
              <div><i class="fa-solid fa-certificate" style="color: #c89a4b; width: 14px;"></i> Erode Handloom Quality</div>
            </div>
          </div>
        </div>

        <!-- 2. Order Banner -->
        <div style="background: linear-gradient(135deg, #15244c 0%, #295674 100%); color: #ffffff; border-radius: 8px; padding: 7px 12px; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 14px;">
          <span style="color: #c89a4b; font-weight: 700; font-size: 0.85rem;">❖ —</span>
          <h2 style="font-size: 1.05rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin: 0;">
            ${hidePrices ? 'WHOLESALE ORDER INDENT & PACKING SLIP' : 'PURCHASE ORDER INVOICE'}
          </h2>
          <span style="color: #c89a4b; font-weight: 700; font-size: 0.85rem;">— ❖</span>
        </div>

        <!-- 3. Details 2-Card Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <!-- Customer Details -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px;">
            <div style="background: #15244c; color: #ffffff; padding: 3px 10px; border-radius: 9999px; font-size: 0.7rem; font-weight: 800; display: inline-block; margin-bottom: 8px; letter-spacing: 0.4px;">
              <i class="fa-solid fa-user"></i> BUYER & DISPATCH-TO DETAILS
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.78rem;">
              <div style="display: grid; grid-template-columns: 120px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-building" style="color: #15244c;"></i> Firm / Buyer</span>
                <span>:</span>
                <strong style="color: #15244c;">${compName}</strong>
              </div>
              <div style="display: grid; grid-template-columns: 120px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-user-tie" style="color: #15244c;"></i> Contact Person</span>
                <span>:</span>
                <span>${custName}</span>
              </div>
              <div style="display: grid; grid-template-columns: 120px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-phone" style="color: #15244c;"></i> Phone / WA</span>
                <span>:</span>
                <span>${custPhone}</span>
              </div>
              ${gst ? `
              <div style="display: grid; grid-template-columns: 120px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-receipt" style="color: #15244c;"></i> GSTIN</span>
                <span>:</span>
                <span>${gst}</span>
              </div>
              ` : ''}
              <div style="display: grid; grid-template-columns: 120px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-location-dot" style="color: #15244c;"></i> Destination</span>
                <span>:</span>
                <span style="word-break: break-word;">${delAddress}</span>
              </div>
            </div>
          </div>

          <!-- Order Details -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px;">
            <div style="background: #15244c; color: #ffffff; padding: 3px 10px; border-radius: 9999px; font-size: 0.7rem; font-weight: 800; display: inline-block; margin-bottom: 8px; letter-spacing: 0.4px;">
              <i class="fa-solid fa-clipboard-list"></i> INDENT SUMMARY
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.78rem;">
              <div style="display: grid; grid-template-columns: 130px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-calendar-day" style="color: #15244c;"></i> Date</span>
                <span>:</span>
                <span>${today}</span>
              </div>
              <div style="display: grid; grid-template-columns: 130px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-file-invoice" style="color: #15244c;"></i> Indent Ref</span>
                <span>:</span>
                <strong style="color: #15244c;">${orderRef}</strong>
              </div>
              <div style="display: grid; grid-template-columns: 130px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-boxes-packing" style="color: #15244c;"></i> Master Bales</span>
                <span>:</span>
                <strong>${estBales} Bale${estBales === 1 ? '' : 's'} (${totalBundles} Total Bundles)</strong>
              </div>
              <div style="display: grid; grid-template-columns: 130px 8px 1fr;">
                <span style="font-weight: 600; color: #334155;"><i class="fa-solid fa-truck" style="color: #15244c;"></i> Dispatch Mode</span>
                <span>:</span>
                <span>Lorry Transport Delivery</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Items Table with Photos -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 14px; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; table-layout: fixed;">
            <thead>
              <tr style="background: #15244c; color: #ffffff;">
                <th style="padding: 8px 10px; text-align: center; width: 7%; font-size: 0.72rem;">S.No</th>
                <th style="padding: 8px 10px; text-align: left; width: ${hidePrices ? '53%' : '41%'}; font-size: 0.72rem;">PRODUCT DESCRIPTION</th>
                <th style="padding: 8px 10px; text-align: left; width: ${hidePrices ? '22%' : '20%'}; font-size: 0.72rem;">QUANTITY ORDERED</th>
                ${hidePrices ? `
                  <th style="padding: 8px 10px; text-align: left; width: 18%; font-size: 0.72rem;">PACKING CONFIG</th>
                ` : `
                  <th style="padding: 8px 10px; text-align: right; width: 16%; font-size: 0.72rem;">UNIT RATE</th>
                  <th style="padding: 8px 10px; text-align: right; width: 16%; font-size: 0.72rem;">SUBTOTAL AMOUNT</th>
                `}
              </tr>
            </thead>
            <tbody>
              ${items.length === 0 ? `
                <tr><td colspan="${hidePrices ? 4 : 5}" style="text-align: center; padding: 20px; color: #94a3b8;">No items in indent</td></tr>
              ` : items.map((it) => `
                <tr style="border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                  <td style="text-align: center; font-weight: 700; color: #0f172a; padding: 8px 10px;">${it.sno}</td>
                  <td style="padding: 8px 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      ${it.hasRealImage ? `
                        <img src="${it.imageSrc}" style="width: 44px; height: 44px; object-fit: contain; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #ffffff; flex-shrink: 0;" />
                      ` : `
                        <div style="width: 44px; height: 44px; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #f8fafc; color: #15244c; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
                          <i class="fa-solid fa-rug"></i>
                        </div>
                      `}
                      <div>
                        <strong style="color: #0f172a; font-size: 0.84rem; display: block; line-height: 1.25;">${it.title}</strong>
                        <span style="color: #9e2267; font-size: 0.7rem; font-weight: 700;">[${it.category}]</span>
                      </div>
                    </div>
                  </td>
                  <td style="padding: 8px 10px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <i class="fa-solid fa-cube" style="color: #15244c; font-size: 0.95rem;"></i>
                      <div>
                        <span style="font-weight: 700; color: #0f172a; font-size: 0.8rem;">${it.qty} ${it.unit}s</span>
                        <small style="color: #64748b; font-size: 0.7rem; display: block;">(${it.qty * it.bundlePieces} pcs)</small>
                      </div>
                    </div>
                  </td>
                  ${hidePrices ? `
                    <td style="padding: 8px 10px; color: #334155; font-size: 0.76rem;">
                      <span style="display: inline-block; padding: 2px 6px; background: #f1f5f9; border-radius: 4px; font-weight: 600;">
                        ${it.bundlePieces} pcs/bundle
                      </span>
                    </td>
                  ` : `
                    <td style="padding: 8px 10px; text-align: right; font-weight: 600; color: #334155; font-size: 0.82rem;">Rs. ${it.rate.toLocaleString('en-IN')}</td>
                    <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: #15244c; font-size: 0.88rem; font-family: 'Outfit', sans-serif;">Rs. ${it.subtotal.toLocaleString('en-IN')}</td>
                  `}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 5. Totals / Dispatch Box -->
        ${hidePrices ? `
          <div style="display: flex; border: 1.5px solid #15244c; border-radius: 10px; overflow: hidden; margin-bottom: 12px;">
            <div style="background: #f8fafc; flex: 1.2; display: flex; align-items: center; gap: 12px; padding: 10px 14px;">
              <div style="width: 42px; height: 42px; border-radius: 50%; background: #15244c; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.15rem;">
                <i class="fa-solid fa-boxes-stacked"></i>
              </div>
              <div>
                <span style="font-size: 0.73rem; color: #64748b; display: block;">Physical Dispatch Order Quantity</span>
                <strong style="font-size: 1.1rem; color: #15244c;">${totalBundles} Total Bundles (${totalPieces} Pcs)</strong>
                <span style="font-size: 0.72rem; color: #334155; display: block; margin-top: 2px;">Packed across ${items.length} product lines</span>
              </div>
            </div>

            <div style="background: #15244c; color: #ffffff; flex: 1; padding: 10px 16px; display: flex; flex-direction: column; justify-content: center; align-items: flex-end; gap: 3px;">
              <span style="font-size: 0.72rem; color: rgba(255,255,255,0.85);">Master Shipping Estimate</span>
              <strong style="font-size: 1.2rem; color: #c89a4b; font-weight: 800;">${estBales} Master Bale${estBales === 1 ? '' : 's'}</strong>
              <span style="font-size: 0.68rem; color: rgba(255,255,255,0.7);">Lorry Transport Packing</span>
            </div>
          </div>
        ` : `
          <div style="display: flex; border: 1.5px solid #15244c; border-radius: 10px; overflow: hidden; margin-bottom: 12px;">
            <div style="background: #f8fafc; flex: 1; display: flex; align-items: center; gap: 12px; padding: 10px 14px;">
              <div style="width: 42px; height: 42px; border-radius: 50%; background: #15244c; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.15rem;">
                <i class="fa-solid fa-boxes-stacked"></i>
              </div>
              <div>
                <span style="font-size: 0.73rem; color: #64748b; display: block;">Est. Master Bales Packaging</span>
                <strong style="font-size: 1.1rem; color: #15244c;">${estBales} Master ${estBales === 1 ? 'Bale' : 'Bales'}</strong>
                <span style="font-size: 0.72rem; color: #334155; display: block; margin-top: 2px;">@ Rs. ${currentBaleRate} / Bale = <strong>Rs. ${masterBaleTotal.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>

            <div style="background: #15244c; color: #ffffff; flex: 1.3; padding: 10px 16px; display: flex; flex-direction: column; justify-content: center; align-items: flex-end; gap: 3px;">
              <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.72rem; color: rgba(255,255,255,0.85);">
                <span>Products Subtotal:</span>
                <strong style="color: #ffffff;">Rs. ${itemsSubtotal.toLocaleString('en-IN')}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.72rem; color: rgba(255,255,255,0.85); padding-bottom: 4px; border-bottom: 1px dashed rgba(255,255,255,0.3);">
                <span>Bale Packaging (${estBales} × ₹${currentBaleRate}):</span>
                <strong style="color: #ffffff;">Rs. ${masterBaleTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; width: 100%; margin-top: 2px;">
                <span style="font-size: 0.74rem; font-weight: 700; letter-spacing: 0.8px; color: #c89a4b;">GRAND TOTAL</span>
                <span style="font-size: 1.35rem; font-weight: 900; color: #ffffff; line-height: 1.1;">Rs. ${grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        `}

        <!-- 6. Note Box -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #15244c; border-radius: 8px; padding: 6px 10px; font-size: 0.74rem; display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <i class="fa-solid fa-circle-info" style="font-size: 1rem; color: #9e2267; flex-shrink: 0;"></i>
          <div>
            <strong>Note:</strong> Wholesale Order Indent generated by SRI SURYA TEX, Erode. Packaging and lorry transport dispatch will be coordinated directly.
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
              <strong style="font-size: 1.15rem; color: #15244c; display: block; margin: 2px 0;">+91 98426 86264</strong>
              <p style="font-size: 0.7rem; color: #64748b; margin: 0;">for dispatch confirmation & lorry booking.</p>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <img src="${qrBase64}" style="width: 72px; height: 72px; border-radius: 6px; border: 1px solid #cbd5e1; padding: 2px; background: #ffffff;" />
            <span style="background: #15244c; color: #ffffff; font-size: 0.62rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.3px;">SCAN TO CHAT ON WHATSAPP</span>
          </div>
        </div>
      </div>

      <!-- 8. Footer Bar -->
      <div style="background: #15244c; color: #ffffff; border-radius: 8px; padding: 8px 14px; display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem;">
        <span>185, Eswaran Kovil Kidangu Street, Erode - 638 001</span>
        <span style="color: #c89a4b; font-weight: 800;">SRI SURYA TEX • P. MYILSAMY</span>
        <span>Cell: 98426 86264 | GSTIN: 33DBQPM1973N1ZY</span>
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
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    const cleanFileName = compName.replace(/[^a-zA-Z0-9]/g, '_');
    const docPrefix = hidePrices ? 'Sri_Surya_Tex_Indent' : 'Sri_Surya_Tex_Order';
    doc.save(`${docPrefix}_${cleanFileName}.pdf`);
  } finally {
    if (document.body.contains(printContainer)) {
      document.body.removeChild(printContainer);
    }
  }
}
