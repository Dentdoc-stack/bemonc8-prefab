/**
 * Data source configuration for Google Sheets ingestion
 */

export interface SheetSource {
    packageId: string;
    packageName: string;
    sheetId: string;
    sheetUrl: string;
    publishedXlsxUrl: string; // For direct XLSX access without API key
}

export const SHEET_SOURCES: SheetSource[] = [
    {
        packageId: 'FP1',
        packageName: 'Flood Package',
        sheetId: '2PACX-1vTX2fHyqqmdrtemmhVh0pDi3WOH0zOXWk6blv--r9PVzm1Mz0Gr6jqE4IxDI66FC-42FLw4X3ye5hEz',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTX2fHyqqmdrtemmhVh0pDi3WOH0zOXWk6blv--r9PVzm1Mz0Gr6jqE4IxDI66FC-42FLw4X3ye5hEz/pub?output=xlsx',
        publishedXlsxUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTX2fHyqqmdrtemmhVh0pDi3WOH0zOXWk6blv--r9PVzm1Mz0Gr6jqE4IxDI66FC-42FLw4X3ye5hEz/pub?output=xlsx',
    },
];

export const CONFIG = {
    tabName: 'Data_Entry',
    range: 'A:U',
    cacheIntervalMs: 30 * 60 * 1000, // 30 minutes
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || '', // Optional for public sheets
};
