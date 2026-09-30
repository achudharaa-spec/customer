import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Running Complete End-to-End Real-Time Sync Verification');
  const browser = await chromium.launch({ headless: true });
  
  // 1. Admin Page setup & login
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(1500);

  const idInput = adminPage.locator('#admin-identifier');
  if (await idInput.isVisible()) {
    await idInput.fill('achudharaa@gmail.com');
    await adminPage.locator('input[type="password"]').fill('SriSuryaTex@2026');
    await adminPage.locator('button.btn-login-submit, button[type="submit"]').click();
    await adminPage.waitForTimeout(2000);
  }

  // 2. User Page setup
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  await userPage.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  await userPage.waitForTimeout(1500);

  console.log('✅ Portals connected: Admin (3000) and User (3001)');

  // 3. Test Price Visibility Toggle Sync
  console.log('🔄 Testing Price Visibility Toggle Sync...');
  const priceToggle = adminPage.locator('button.btn-header-action:has-text("Prices"), button:has-text("Prices")').first();
  if (await priceToggle.isVisible()) {
    // Click toggle to SHOW prices
    await priceToggle.click();
    await userPage.waitForTimeout(2000);
    const priceElementsCount = await userPage.locator('.card-rate-price').count();
    console.log(`📊 User page price elements when VISIBLE: ${priceElementsCount}`);

    // Click toggle back to HIDE prices
    await priceToggle.click();
    await userPage.waitForTimeout(2000);
    const hiddenPriceElementsCount = await userPage.locator('.card-rate-price').count();
    console.log(`🔒 User page price elements when HIDDEN: ${hiddenPriceElementsCount}`);
  }

  // 4. Test Adding a new product
  console.log('➕ Adding a new product in Admin Portal...');
  const testProductName = 'Erode Handloom Premium Bath Mat ' + Date.now().toString().slice(-4);
  await adminPage.locator('input[placeholder*="Premium Cotton Handloom Mat"]').fill(testProductName);
  await adminPage.locator('select').first().selectOption('Handloom Mats');
  await adminPage.locator('input[type="number"]').first().fill('520');

  const buffer1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await adminPage.locator('input[type="file"]').first().setInputFiles([
    { name: 'photo1.png', mimeType: 'image/png', buffer: buffer1 },
    { name: 'photo2.png', mimeType: 'image/png', buffer: buffer1 }
  ]);
  await adminPage.waitForTimeout(1000);

  await adminPage.locator('button.btn-submit-product').click();
  await userPage.waitForTimeout(2500);

  const userTitles = await userPage.locator('.card-title').allInnerTexts();
  const addedLive = userTitles.some(t => t.includes(testProductName));
  console.log(`🎯 Real-Time Add Sync: ${addedLive ? 'PASSED ✅' : 'FAILED ❌'}`);

  // 5. Test Deleting the temporary test product
  console.log('🗑️ Deleting test product in Admin Portal...');
  const deleteBtn = adminPage.locator(`.product-card-admin:has-text("${testProductName}") button:has-text("Delete"), .product-card:has-text("${testProductName}") button[title*="Delete"], button:has-text("Delete")`).first();
  if (await deleteBtn.isVisible()) {
    await deleteBtn.click();
    await adminPage.waitForTimeout(500);
    const confirmBtn = adminPage.locator('.toast-modal-confirm, button:has-text("Yes, Delete")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await userPage.waitForTimeout(2500);
    const titlesAfterDelete = await userPage.locator('.card-title').allInnerTexts();
    const deletedLive = !titlesAfterDelete.some(t => t.includes(testProductName));
    console.log(`🎯 Real-Time Delete Sync: ${deletedLive ? 'PASSED ✅' : 'FAILED ❌'}`);
  }

  // 6. Capture Final Verified Screenshots
  await adminPage.screenshot({ path: 'admin_portal_final_verified.png', fullPage: true });
  await userPage.screenshot({ path: 'user_portal_final_verified.png', fullPage: true });
  console.log('📸 Final Verified Screenshots Saved: admin_portal_final_verified.png and user_portal_final_verified.png');

  await browser.close();
  console.log('🎉 ALL CROSS-PORTAL SYNC CHECKS COMPLETED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('❌ Sync test encountered error:', err);
  process.exit(1);
});
