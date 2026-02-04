const XLSX = require('xlsx');
const path = require('path');

const filePath = 'c:\\Users\\User\\Downloads\\Master of Flood Package Consolidated.xlsx';

console.log('📊 Analyzing Excel file:', filePath);
console.log('='.repeat(80));

try {
  // Read the workbook
  const workbook = XLSX.readFile(filePath);
  
  console.log('\n📋 Sheet Names:');
  workbook.SheetNames.forEach((name, idx) => {
    console.log(`  ${idx + 1}. ${name}`);
  });
  
  // Analyze each sheet
  workbook.SheetNames.forEach((sheetName) => {
    console.log('\n' + '='.repeat(80));
    console.log(`\n📄 Analyzing Sheet: "${sheetName}"`);
    console.log('-'.repeat(80));
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
    
    if (jsonData.length === 0) {
      console.log('  ⚠️  Empty sheet');
      return;
    }
    
    // Get headers (first row)
    const headers = jsonData[0];
    console.log(`\n  Total Rows: ${jsonData.length}`);
    console.log(`  Total Columns: ${headers.length}`);
    
    console.log('\n  Column Headers:');
    headers.forEach((header, idx) => {
      console.log(`    ${idx + 1}. ${header}`);
    });
    
    // Show first 3 data rows
    console.log('\n  Sample Data (First 3 rows):');
    jsonData.slice(0, Math.min(4, jsonData.length)).forEach((row, idx) => {
      if (idx === 0) {
        console.log(`\n  Row ${idx} (Headers):`, JSON.stringify(row));
      } else {
        console.log(`  Row ${idx}:`, JSON.stringify(row.slice(0, 10)) + (row.length > 10 ? '...' : ''));
      }
    });
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Analysis complete!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
