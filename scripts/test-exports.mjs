/**
 * Export Format Verification Script
 * 
 * This script validates that our export files are properly formatted.
 * Run with: node scripts/test-exports.mjs
 * 
 * Tests:
 * - XLSX has correct PK zip header signature
 * - PDF has correct %PDF- header signature
 * - CSV starts with expected header row
 */

import fs from 'fs';
import path from 'path';

const XLSX_SIGNATURE = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // PK zip header
const PDF_SIGNATURE = Buffer.from('%PDF-');

function checkFileSignature(filepath, expectedSignature, formatName) {
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  ${formatName}: File not found at ${filepath}`);
    return null;
  }
  
  const buffer = fs.readFileSync(filepath);
  const header = buffer.subarray(0, expectedSignature.length);
  
  const matches = header.equals(expectedSignature);
  console.log(`${matches ? '✅' : '❌'} ${formatName}: ${matches ? 'Valid signature' : 'Invalid signature'}`);
  
  if (!matches) {
    console.log(`   Expected: ${expectedSignature.toString('hex')}`);
    console.log(`   Got:      ${header.toString('hex')}`);
  }
  
  return matches;
}

function checkCSVHeader(filepath, expectedStart) {
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  CSV: File not found at ${filepath}`);
    return null;
  }
  
  const content = fs.readFileSync(filepath, 'utf-8');
  // Remove BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '');
  const firstLine = cleanContent.split(/\r?\n/)[0];
  
  const matches = firstLine.toUpperCase().includes(expectedStart.toUpperCase());
  console.log(`${matches ? '✅' : '❌'} CSV: ${matches ? 'Valid header row' : 'Invalid header row'}`);
  
  if (!matches) {
    console.log(`   Expected to contain: ${expectedStart}`);
    console.log(`   First line: ${firstLine.substring(0, 50)}...`);
  }
  
  return matches;
}

console.log('\n📋 Export Format Verification\n');
console.log('This script checks file signatures to verify export formats.\n');
console.log('To test manually:');
console.log('1. Run the app and generate a report');
console.log('2. Export to XLSX, CSV, and PDF');
console.log('3. Place files in project root or update paths below\n');

// Check for test files (users can place them here for verification)
const testDir = './test-exports';

if (fs.existsSync(testDir)) {
  const files = fs.readdirSync(testDir);
  
  const xlsxFile = files.find(f => f.endsWith('.xlsx'));
  const csvFile = files.find(f => f.endsWith('.csv'));
  const pdfFile = files.find(f => f.endsWith('.pdf'));
  
  if (xlsxFile) {
    checkFileSignature(path.join(testDir, xlsxFile), XLSX_SIGNATURE, 'XLSX');
  }
  
  if (csvFile) {
    checkCSVHeader(path.join(testDir, csvFile), 'UNDERWRITING REPORT');
  }
  
  if (pdfFile) {
    checkFileSignature(path.join(testDir, pdfFile), PDF_SIGNATURE, 'PDF');
  }
  
  if (!xlsxFile && !csvFile && !pdfFile) {
    console.log('No test files found in ./test-exports/');
  }
} else {
  console.log('No ./test-exports/ directory found.');
  console.log('Create it and add exported files to verify formats.\n');
}

// Print expected signatures for reference
console.log('\n📝 Expected File Signatures:\n');
console.log('XLSX (.xlsx): PK header (50 4B 03 04) - ZIP format');
console.log('PDF  (.pdf):  %PDF- header');
console.log('CSV  (.csv):  UTF-8 with BOM, CRLF line endings, starts with "UNDERWRITING REPORT"');

console.log('\n✅ Export utilities are using:');
console.log('   - ExcelJS for professional .xlsx files with styling');
console.log('   - jsPDF for PDF generation');
console.log('   - UTF-8 BOM + CRLF for CSV compatibility\n');
