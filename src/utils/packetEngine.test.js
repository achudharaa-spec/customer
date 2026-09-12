/**
 * Customer Portal Client Packing Engine Unit Tests
 * Run with: node src/utils/packetEngine.test.js
 */
import assert from 'assert';
import { packOrder, calculateMasterPacks, bundleCapacityUnits, getMaxAdditionalTable } from './packetEngine.js';

console.log('🧪 Running Customer Portal Packing Engine Validation...\n');

let pass = 0;

// Test 1: packOrder Best-Fit Decreasing
const mockProducts = [
  { id: 'M1', title: 'Robomat', bundlesPerPack: 3, bundlePieces: 50 },
  { id: 'M2', title: '13x19 Mat', bundlesPerPack: 8, bundlePieces: 50 },
  { id: 'M3', title: 'Door Mat', bundlesPerPack: 10, bundlePieces: 50 }
];

const mockQuantities = { M1: 1, M2: 2, M3: 1 };
const result = packOrder(['M1', 'M2', 'M3'], mockProducts, mockQuantities);

assert.strictEqual(result.totalBales, 1, 'Should fit inside 1 master bale');
assert.strictEqual(result.totalBundles, 4);
pass++;
console.log('  ✅ PASS: Multi-item single bale packing');

// Test 2: calculateMasterPacks backward compatibility
const legacyResult = calculateMasterPacks(['M1', 'M2'], mockProducts, { M1: 1, M2: 2 });
assert.strictEqual(legacyResult.estPacks, 1);
assert.ok(Array.isArray(legacyResult.bales));
pass++;
console.log('  ✅ PASS: Legacy calculateMasterPacks compatibility wrapper');

// Test 3: getMaxAdditionalTable calculation
const bale = result.bales[0];
const additionalTable = getMaxAdditionalTable(bale, mockProducts);
assert.ok(Array.isArray(additionalTable));
assert.strictEqual(additionalTable.length, 3);
pass++;
console.log('  ✅ PASS: Remaining capacity expansion table calculation');

console.log(`\n========================================`);
console.log(`Result: ${pass}/3 Tests Passed Cleanly`);
console.log(`========================================\n`);
