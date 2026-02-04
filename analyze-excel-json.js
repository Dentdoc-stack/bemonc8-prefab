const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'c:\\Users\\User\\Downloads\\Master of Flood Package Consolidated.xlsx';

try {
    const workbook = XLSX.readFile(filePath);

    const analysis = {
        fileName: 'Master of Flood Package Consolidated.xlsx',
        sheets: []
    };

    workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

        const sheetInfo = {
            name: sheetName,
            totalRows: jsonData.length,
            totalColumns: jsonData.length > 0 ? jsonData[0].length : 0,
            headers: jsonData.length > 0 ? jsonData[0] : [],
            sampleData: jsonData.slice(1, 4) // First 3 data rows
        };

        analysis.sheets.push(sheetInfo);
    });

    fs.writeFileSync('excel-analysis.json', JSON.stringify(analysis, null, 2), 'utf8');
    console.log('Analysis saved to excel-analysis.json');

} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
