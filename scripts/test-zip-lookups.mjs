/**
 * ZIP Lookup Verification Script
 * Run with: node scripts/test-zip-lookups.cjs
 * 
 * This script verifies the ZIP->City/State lookup using the npm package
 */

const TEST_CASES = [
  { zip: '90210', city: 'Beverly Hills', state: 'CA' },
  { zip: '10001', city: 'New York', state: 'NY' },
  { zip: '94105', city: 'San Francisco', state: 'CA' },
  { zip: '33139', city: 'Miami Beach', state: 'FL' },
  { zip: '60601', city: 'Chicago', state: 'IL' },
  { zip: '75201', city: 'Dallas', state: 'TX' },
  { zip: '98101', city: 'Seattle', state: 'WA' },
  { zip: '30303', city: 'Atlanta', state: 'GA' },
  { zip: '96815', city: 'Honolulu', state: 'HI' },
  { zip: '85001', city: 'Phoenix', state: 'AZ' },
  { zip: '78701', city: 'Austin', state: 'TX' },
  { zip: '02108', city: 'Boston', state: 'MA' },
];

const EDGE_CASES = [
  { zip: '90210-1234', expected: { city: 'Beverly Hills', state: 'CA' } },
  { zip: '00000', expected: null },
];

async function runTests() {
  console.log('\n=== ZIP LOOKUP VERIFICATION ===\n');
  
  // Dynamic import of the npm package
  const module = await import('zip-code-to-usa-city-state');
  const rawData = module.default;
  
  // Fix swapped city/state (package bug)
  const data = {};
  for (const [zip, value] of Object.entries(rawData)) {
    data[zip] = {
      city: value.state,  // state field contains city
      state: value.city,  // city field contains state
    };
  }
  
  console.log(`Dataset loaded: ${Object.keys(data).length} ZIP codes\n`);
  
  let passed = 0;
  let failed = 0;
  
  console.log('--- Standard Lookups ---');
  for (const test of TEST_CASES) {
    const result = data[test.zip];
    if (result && result.city === test.city && result.state === test.state) {
      console.log(`PASS: ${test.zip} -> ${result.city}, ${result.state}`);
      passed++;
    } else {
      console.log(`FAIL: ${test.zip} -> Expected "${test.city}, ${test.state}", got "${result ? result.city + ', ' + result.state : 'NOT FOUND'}"`);
      failed++;
    }
  }
  
  console.log('\n--- Edge Cases ---');
  for (const test of EDGE_CASES) {
    const zip5 = test.zip.replace(/\D/g, '').slice(0, 5);
    const result = data[zip5];
    
    if (test.expected === null) {
      if (!result) {
        console.log(`PASS: ${test.zip} -> NOT FOUND (as expected)`);
        passed++;
      } else {
        console.log(`FAIL: ${test.zip} -> Expected NOT FOUND, got "${result.city}, ${result.state}"`);
        failed++;
      }
    } else {
      if (result && result.city === test.expected.city && result.state === test.expected.state) {
        console.log(`PASS: ${test.zip} -> ${result.city}, ${result.state}`);
        passed++;
      } else {
        console.log(`FAIL: ${test.zip} -> Expected "${test.expected.city}, ${test.expected.state}", got "${result ? result.city + ', ' + result.state : 'NOT FOUND'}"`);
        failed++;
      }
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${passed}/${passed + failed}`);
  console.log(`Failed: ${failed}/${passed + failed}`);
  
  if (failed > 0) {
    console.log('\nZIP VERIFICATION: FAIL\n');
    process.exit(1);
  }
  
  console.log('\nZIP VERIFICATION: PASS\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
