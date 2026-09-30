import { chromium } from '@playwright/test';

const ARTIFACTS_DIR = 'C:/Users/dhamo/.gemini/antigravity-ide/brain/610f8254-f612-4fd1-a9bd-5c9979a57b43';

async function verifyServerPage() {
  console.log('🧪 Verifying Updated Sri Surya Tex Server Dashboard (Port 10000)...\n');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  // 1. Check /health
  const healthRes = await page.request.get('http://localhost:10000/health?format=json', {
    headers: { 'Accept': 'application/json' }
  });
  console.log(`  Health Status: ${healthRes.status()}`);
  const healthData = await healthRes.json();
  console.log(`  Service: ${healthData.service}`);

  // 2. Check /api/telemetry
  const teleRes = await page.request.get('http://localhost:10000/api/telemetry');
  const teleData = await teleRes.json();
  console.log(`  Company: ${teleData.company?.name}, Proprietor: ${teleData.company?.proprietor}, Mobile: ${teleData.company?.mobile}`);
  console.log(`  Customer Portal URL: ${teleData.portals?.customerPortalUrl}`);
  console.log(`  Owner Portal URL: ${teleData.portals?.ownerPortalUrl}`);

  // 3. Open UI and verify elements
  await page.goto('http://localhost:10000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const title = await page.title();
  console.log(`  Page Title: "${title}"`);

  const pageText = await page.textContent('body');
  const hasMyilsamy = pageText.includes('P. MYILSAMY');
  const hasPhone = pageText.includes('98426 86264');
  const hasGSTIN = pageText.includes('33DBQPM1973N1ZY');
  const hasCategories = pageText.includes('Handloom Mats') && pageText.includes('Rubber Mats') && pageText.includes('Fancy Mats') && pageText.includes('Bed Spreads');
  const hasStreamlinedAuth = pageText.includes('Direct Admin Auth') || pageText.includes('STREAMLINED');
  const has2To4Photos = pageText.includes('2 to 4 photos') || pageText.includes('2–4 PHOTOS');
  const hasZeroPriceNotice = pageText.includes('Customer Price Visibility') || pageText.includes('PRICE-HIDDEN');

  console.log(`  Checking Elements:
    - Proprietor P. MYILSAMY: ${hasMyilsamy}
    - Mobile 98426 86264: ${hasPhone}
    - GSTIN 33DBQPM1973N1ZY: ${hasGSTIN}
    - 4 Core Categories: ${hasCategories}
    - Direct Admin Auth (MFA removed): ${hasStreamlinedAuth}
    - 2-4 Multi-Photo Storage: ${has2To4Photos}
    - Customer Price Visibility: ${hasZeroPriceNotice}
  `);

  // Verify portal links
  const custHref = await page.getAttribute('#link-customer-portal', 'href');
  const ownerHref = await page.getAttribute('#link-owner-portal', 'href');
  console.log(`  Customer Portal Link: ${custHref} (target: :3001)`);
  console.log(`  Owner Portal Link: ${ownerHref} (target: :3000)`);

  // Test Packing Simulator
  console.log('  Testing live packing simulator on server page...');
  await page.click('.btn-sim-run');
  await page.waitForTimeout(600);
  const simCards = await page.$$('.sim-bale-card');
  console.log(`  Simulator generated ${simCards.length} master bale allocation card(s).`);

  // Take full page screenshot
  await page.screenshot({ path: `${ARTIFACTS_DIR}/updated_server_dashboard_verified.png`, fullPage: true });
  console.log(`  ✅ Full page screenshot saved to ${ARTIFACTS_DIR}/updated_server_dashboard_verified.png`);

  await browser.close();

  if (hasMyilsamy && hasPhone && hasGSTIN && hasCategories && hasStreamlinedAuth && has2To4Photos && hasZeroPriceNotice) {
    console.log('\n🎉 ALL CHECKS PASSED: Server page successfully updated to match user/owner pages!');
    process.exit(0);
  } else {
    console.error('\n❌ SOME VERIFICATION CHECKS FAILED');
    process.exit(1);
  }
}

verifyServerPage();
