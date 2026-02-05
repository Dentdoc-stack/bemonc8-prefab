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
        sheetId: '2PACX-1vT8ioVcUUv9VXS48-z6-gWirSNDjDZFx9CW0lhlJqF4W7XFBaRGZXrvtmh9OCnLtQOVjiJ5t9dooMXV',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8ioVcUUv9VXS48-z6-gWirSNDjDZFx9CW0lhlJqF4W7XFBaRGZXrvtmh9OCnLtQOVjiJ5t9dooMXV/pub?output=xlsx',
        publishedXlsxUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8ioVcUUv9VXS48-z6-gWirSNDjDZFx9CW0lhlJqF4W7XFBaRGZXrvtmh9OCnLtQOVjiJ5t9dooMXV/pub?output=xlsx',
    },
];

export const CONFIG = {
    tabName: 'Data_Entry',
    range: 'A:AD',
    cacheIntervalMs: 30 * 60 * 1000, // 30 minutes
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || '', // Optional for public sheets
};
