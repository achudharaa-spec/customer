import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testLiveHosted() {
  console.log('🚀 Testing Live Hosted Portals on Render...');
  const browser = await chromium.launch({ headless: true });
  
  // Create test image buffer
  const imageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  // Log console errors / logs from live site
  adminPage.on('console', msg => console.log(`[Admin Browser Console] ${msg.type()}: ${msg.text()}`));
  adminPage.on('pageerror', err => console.error(`[Admin Browser Error]`, err.message));

  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  customerPage.on('console', msg => console.log(`[Customer Browser Console] ${msg.type()}: ${msg.text()}`));
  customerPage.on('pageerror', err => console.error(`[Customer Browser Error]`, err.message));

  console.log('1. Navigating to Hosted Admin: https://achudharaa-owner.onrender.com/');
  await adminPage.goto('https://achudharaa-owner.onrender.com/', { waitUntil: 'networkidle', timeout: 60000 });
  await adminPage.screenshot({ path: 'live_admin_login_page.png' });

  console.log('2. Logging into Hosted Admin...');
  const idInput = adminPage.locator('#admin-identifier');
  if (await idInput.isVisible()) {
    await idInput.fill('achudharaa@gmail.com');
    await adminPage.locator('input[type="password"]').fill('SriSuryaTex@2026');
    await adminPage.locator('button.btn-login-submit, button[type="submit"]').click();
    await adminPage.waitForTimeout(4000);
  }
  await adminPage.screenshot({ path: 'live_admin_dashboard.png' });

  console.log('3. Navigating to Hosted Customer: https://achudharaa-customer.onrender.com/');
  await customerPage.goto('https://achudharaa-customer.onrender.com/', { waitUntil: 'networkidle', timeout: 60000 });
  await customerPage.screenshot({ path: 'live_customer_initial.png' });

  // Check initial products on customer page
  const initialCustomerTitles = await customerPage.locator('.card-title').allInnerTexts();
  console.log(`📋 Customer initial item count: ${initialCustomerTitles.length}`);
  console.log(`📋 Customer initial titles:`, initialCustomerTitles.slice(0, 5));

  // Test 1: Price Visibility Toggle
  console.log('4. Testing Price Toggle on Live Admin...');
  const priceToggle = adminPage.locator('button.btn-price-toggle-nav, button:has-text("User Prices")').first();
  if (await priceToggle.isVisible()) {
    const initialToggleText = await priceToggle.innerText();
    console.log(`Current Admin toggle status: ${initialToggleText}`);
    
    // Toggle price visibility
    await priceToggle.click();
    await adminPage.waitForTimeout(3000);
    await customerPage.waitForTimeout(3000);
    
    await adminPage.screenshot({ path: 'live_admin_after_toggle.png' });
    await customerPage.screenshot({ path: 'live_customer_after_toggle.png' });
  } else {
    console.warn('⚠️ Price toggle button not visible on admin dashboard');
  }

  // Test 2: Add New Product on Live Admin
  console.log('5. Adding New Test Product on Live Admin...');
  const testTitle = 'TEST LIVE MAT ' + Date.now().toString().slice(-4);
  const nameInput = adminPage.locator('input[placeholder*="Handloom Mat"], input[placeholder*="Name"], input[name="name"], input[placeholder*="Premium"]').first();
  
  if (await nameInput.isVisible()) {
    await nameInput.fill(testTitle);
    
    // Base Rate
    const rateInput = adminPage.locator('input[type="number"]').first();
    await rateInput.fill('499');

    // Upload 2 images
    const fileInput = adminPage.locator('input[type="file"]').first();
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles([
        { name: 'test1.png', mimeType: 'image/png', buffer: imageBuffer },
        { name: 'test2.png', mimeType: 'image/png', buffer: imageBuffer }
      ]);
    }

    await adminPage.waitForTimeout(1000);
    const submitBtn = adminPage.locator('button.btn-submit-product, button[type="submit"]:has-text("Add")').first();
    await submitBtn.click();
    console.log(`Submitted new product: ${testTitle}`);

    await adminPage.waitForTimeout(5000);
    await customerPage.waitForTimeout(5000);

    await adminPage.screenshot({ path: 'live_admin_after_add.png' });
    await customerPage.screenshot({ path: 'live_customer_after_add.png' });

    const updatedCustomerTitles = await customerPage.locator('.card-title').allInnerTexts();
    console.log(`📋 Customer titles after add:`, updatedCustomerTitles.slice(0, 10));
    const isReflected = updatedCustomerTitles.some(t => t.includes(testTitle));
    console.log(`🎯 Live New Item Sync Result: ${isReflected ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  } else {
    console.warn('⚠️ Product name input not found on admin page');
  }

  await browser.close();
  console.log('Done testing live hosted portals.');
}

testLiveHosted().catch(err => {
  console.error('❌ Live test error:', err);
  process.exit(1);
});
