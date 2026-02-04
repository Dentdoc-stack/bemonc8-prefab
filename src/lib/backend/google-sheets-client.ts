/**
 * Google Sheets Client - Fetches published XLSX files directly
 */

import { SHEET_SOURCES } from './config';
import type { PackageCompliance, ComplianceStatus, Task } from '@/types';
import { parseDMY } from '../dataParser';

interface RawComplianceData {
    no_of_staff_rfb: string | number | null;
    cesmps_submitted: string | null;
    ohs_measures: string | null;
}

interface SheetRow {
    [key: string]: string | number | null | undefined;
}

/**
 * Parse raw compliance data into PackageCompliance with status logic
 */
function parseComplianceData(raw: RawComplianceData | null): PackageCompliance {
    if (!raw) {
        return {
            no_of_staff_rfb: null,
            cesmps_submitted: null,
            ohs_measures: null,
            status: 'UNKNOWN',
            issues: ['Compliance data not available'],
        };
    }

    // Parse Yes/No fields (all three are Yes/No format)
    const parseYesNo = (val: string | number | null): 'Yes' | 'No' | null => {
        if (!val && val !== 0) return null;
        const normalized = String(val).toLowerCase().trim();
        if (normalized === 'yes') return 'Yes';
        if (normalized === 'no') return 'No';
        return null;
    };

    const staffRfb = parseYesNo(raw.no_of_staff_rfb);
    const cesmps = parseYesNo(raw.cesmps_submitted);
    const ohs = parseYesNo(raw.ohs_measures);

    // Determine status and issues
    const issues: string[] = [];

    const allBlank = staffRfb === null && cesmps === null && ohs === null;
    if (allBlank) {
        return {
            no_of_staff_rfb: staffRfb,
            cesmps_submitted: cesmps,
            ohs_measures: ohs,
            status: 'UNKNOWN',
            issues: ['All compliance fields are blank'],
        };
    }

    // Check each field for compliance issues
    if (staffRfb !== 'Yes') {
        issues.push(staffRfb === null ? 'Staff RFB status unknown' : 'Staff RFB not submitted');
    }
    if (cesmps !== 'Yes') {
        issues.push(cesmps === null ? 'CESMPS submission status unknown' : 'CESMPS not submitted');
    }
    if (ohs !== 'Yes') {
        issues.push(ohs === null ? 'OHS measures status unknown' : 'OHS measures not in place');
    }

    const status: ComplianceStatus = issues.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT';

    return {
        no_of_staff_rfb: staffRfb, // Keep as 'Yes' | 'No' | null
        cesmps_submitted: cesmps,
        ohs_measures: ohs,
        status,
        issues,
    };
}

/**
 * Extract compliance data from published XLSX files
 * Reads row 2 (columns V, W, X) for compliance metadata
 */
export async function fetchAllComplianceData(): Promise<Map<string, PackageCompliance>> {
    console.log('Extracting compliance data from published XLSX files...');

    const complianceMap = new Map<string, PackageCompliance>();

    const results = await Promise.allSettled(
        SHEET_SOURCES.map(async (source) => {
            try {
                console.log(`📋 Fetching compliance for ${source.packageId}...`);

                const response = await fetch(source.publishedXlsxUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch XLSX: ${response.statusText}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);

                // Import XLSX dynamically
                const XLSX = await import('xlsx');
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                // Find Data_Entry sheet
                let sheetName = 'Data_Entry';
                if (!workbook.SheetNames.includes(sheetName)) {
                    sheetName = workbook.SheetNames[0];
                }

                const worksheet = workbook.Sheets[sheetName];
                const jsonRows = XLSX.utils.sheet_to_json<SheetRow>(worksheet, {
                    raw: false,
                    defval: null,
                });

                // Debug: log first row to see all columns
                console.log(`📋 ${source.packageId} - Total rows: ${jsonRows.length}`);
                if (jsonRows.length > 0) {
                    console.log(`📋 ${source.packageId} - Row 1 columns:`, Object.keys(jsonRows[0]));
                    console.log(`📋 ${source.packageId} - Row 1 data:`, jsonRows[0]);
                }

                // Row 2 is at index 0 (since sheet_to_json skips headers)
                if (jsonRows.length > 0) {
                    const row = jsonRows[0];
                    
                    // Try to find columns with different possible names
                    const staffRfbNames = ['No_of_Staff_RFB', 'No of Staff RFB', 'Staff RFB', 'No_of_Staff_RFB'];
                    const cesmpNames = ['CESMPS_Submitted', 'CESMPS_Submitte', 'CEMSPS_Submitted', 'CESMPS'];
                    const ohsNames = ['OHS_Measures', 'OHS Measures', 'OHS', 'OHS_Measures'];

                    let staffValue: string | number | null = null;
                    let cesmpsValue: string | number | null = null;
                    let ohsValue: string | number | null = null;

                    // Search for each column
                    for (const colName of staffRfbNames) {
                        if (colName in row && row[colName] !== null && row[colName] !== undefined && row[colName] !== '') {
                            staffValue = row[colName];
                            console.log(`✅ ${source.packageId} - Found Staff RFB at "${colName}": ${staffValue}`);
                            break;
                        }
                    }

                    for (const colName of cesmpNames) {
                        if (colName in row && row[colName] !== null && row[colName] !== undefined && row[colName] !== '') {
                            cesmpsValue = row[colName];
                            console.log(`✅ ${source.packageId} - Found CESMPS at "${colName}": ${cesmpsValue}`);
                            break;
                        }
                    }

                    for (const colName of ohsNames) {
                        if (colName in row && row[colName] !== null && row[colName] !== undefined && row[colName] !== '') {
                            ohsValue = row[colName];
                            console.log(`✅ ${source.packageId} - Found OHS at "${colName}": ${ohsValue}`);
                            break;
                        }
                    }

                    const rawData: RawComplianceData = {
                        no_of_staff_rfb: staffValue,
                        cesmps_submitted: cesmpsValue?.toString() ?? null,
                        ohs_measures: ohsValue?.toString() ?? null,
                    };

                    console.log(`📋 ${source.packageId} - Final raw data:`, rawData);
                    const compliance = parseComplianceData(rawData);
                    return { packageId: source.packageId, compliance };
                } else {
                    console.warn(`⚠️ No row 1 data found for ${source.packageId}`);
                    return { packageId: source.packageId, compliance: parseComplianceData(null) };
                }
            } catch (error) {
                console.error(`Error extracting compliance for ${source.packageId}:`, error);
                return { packageId: source.packageId, compliance: parseComplianceData(null) };
            }
        })
    );

    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            const { packageId, compliance } = result.value;
            complianceMap.set(packageId, compliance);
            console.log(`✅ Compliance for ${packageId}: ${compliance.status}`);
        }
    });

    return complianceMap;
}

/**
 * Fetch all published sheets as XLSX and return raw rows for task parsing
 * Used for ingesting task data (not compliance - compliance is extracted separately)
 */
export async function fetchAllSheets(): Promise<Map<string, SheetRow[]>> {
    console.log('Fetching published XLSX sheets for task data...');

    const results = await Promise.allSettled(
        SHEET_SOURCES.map(async (source) => {
            try {
                const response = await fetch(source.publishedXlsxUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch XLSX: ${response.statusText}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);

                const XLSX = await import('xlsx');
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                let sheetName = 'Data_Entry';
                if (!workbook.SheetNames.includes(sheetName)) {
                    sheetName = workbook.SheetNames[0];
                }

                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<SheetRow>(worksheet, {
                    raw: false,
                    defval: null,
                });

                // Debug: log all available columns
                console.log(`📋 ${source.packageId} - Total rows: ${jsonData.length}`);
                if (jsonData.length > 0) {
                    console.log(`📋 ${source.packageId} - Column headers:`, Object.keys(jsonData[0]));
                    console.log(`📋 ${source.packageId} - Row 2 data:`, jsonData[0]);
                }

                return { packageId: source.packageId, rows: jsonData };
            } catch (error) {
                console.error(`Error fetching sheet ${source.packageId}:`, error);
                throw error;
            }
        })
    );

    const dataMap = new Map<string, SheetRow[]>();

    results.forEach((result, index) => {
        const source = SHEET_SOURCES[index];
        if (result.status === 'fulfilled') {
            const { packageId, rows } = result.value;
            dataMap.set(packageId, rows);
            console.log(`✅ Fetched ${rows.length} rows from ${packageId}`);
        } else {
            console.error(`❌ Failed to fetch ${source.packageId}:`, result.reason);
            dataMap.set(source.packageId, []);
        }
    });

    return dataMap;
}

/**
 * Map raw sheet row to Task object
 */
export function mapRowToTask(row: SheetRow, packageId: string, packageName: string): Task | null {
    try {
        // Skip empty rows
        if (!row['Site ID'] && !row['site_id']) {
            return null;
        }

        // Handle both possible header formats
        const getValue = (key1: string, key2: string): string => {
            const val = row[key1] || row[key2];
            return val ? String(val).trim() : '';
        };

        const getNumber = (key1: string, key2: string): number | null => {
            const val = row[key1] || row[key2];
            if (val === null || val === undefined || val === '') return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        };

        return {
            package_id: packageId,
            package_name: packageName,
            district: getValue('District', 'district'),
            site_id: getValue('Site ID', 'site_id'),
            site_name: getValue('Site Name', 'site_name'),
            discipline: getValue('Discipline', 'discipline'),
            task_name: getValue('Task Name', 'task_name'),
            planned_start: parseDMY(getValue('Planned Start', 'planned_start')),
            planned_finish: parseDMY(getValue('Planned Finish', 'planned_finish')),
            planned_duration_days: getNumber('Planned Duration (Days)', 'planned_duration_days'),
            actual_start: parseDMY(getValue('Actual Start', 'actual_start')),
            actual_finish: parseDMY(getValue('Actual Finish', 'actual_finish')),
            progress_pct: getNumber('Progress %', 'progress_pct'),
            Variance: getNumber('Variance', 'Variance'),
            delay_flag_calc: getValue('Delay Flag', 'delay_flag_calc'),
            last_updated: parseDMY(getValue('Last Updated', 'last_updated')),
            remarks: getValue('Remarks', 'remarks'),
            photo_folder_url: getValue('Photo Folder', 'photo_folder_url'),
            cover_photo_share_url: getValue('Cover Photo', 'cover_photo_share_url'),
            before_photo_share_url: getValue('Before Photo', 'before_photo_share_url'),
            after_photo_share_url: getValue('After Photo', 'after_photo_share_url'),
            cover_photo_direct_url: null,
            before_photo_direct_url: null,
            after_photo_direct_url: null,
        };
    } catch (error) {
        console.error('Error mapping row to task:', error, row);
        return null;
    }
}
