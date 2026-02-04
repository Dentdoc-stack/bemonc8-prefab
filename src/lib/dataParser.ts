import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { taskSchema, Task, TaskWithStatus, TaskStatus, ScheduleBucket, EvidenceStatus, PhotoStatus, QualityFlag } from '@/types';

// Enable strict date parsing
dayjs.extend(customParseFormat);

// Constants
const STALE_DAYS = 14;
const AHEAD_DELTA = 10;
const ONTRACK_LOW = -10;
const ATRISK_LOW = -25;

/**
 * Parse DD-MM-YYYY or DD/MM/YYYY date strings strictly
 */
export function parseDMY(value: unknown): Date | null {
  if (!value) return null;

  // Handle Excel serial dates (numbers)
  if (typeof value === 'number') {
    return excelDateToJSDate(value);
  }

  // Handle date objects
  if (value instanceof Date) {
    return value;
  }

  // Handle string dates
  if (typeof value === 'string') {
    const str = value.trim();

    // Try DD-MM-YYYY format (strict)
    let parsed = dayjs(str, 'DD-MM-YYYY', true);
    if (parsed.isValid()) {
      return parsed.toDate();
    }

    // Try DD/MM/YYYY format (strict)
    parsed = dayjs(str, 'DD/MM/YYYY', true);
    if (parsed.isValid()) {
      return parsed.toDate();
    }

    // Fallback to default parsing (less strict)
    parsed = dayjs(str);
    if (parsed.isValid()) {
      return parsed.toDate();
    }
  }

  return null;
}

/**
 * Convert Excel serial date to JS Date
 */
export function excelDateToJSDate(serial: number | string | Date): Date | null {
  if (serial instanceof Date) return serial;
  if (!serial) return null;

  // If it's a string, try to parse it
  if (typeof serial === 'string') {
    return parseDMY(serial);
  }

  // Excel serial date (days since 1900-01-01, but Excel incorrectly treats 1900 as leap year)
  if (typeof serial === 'number') {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
  }

  return null;
}

/**
 * Extract Google Drive file ID from URL
 */
export function extractDriveFile(url: string | null): string | null {
  if (!url) return null;

  // Match: /file/d/<ID>/ (drive.google.com or docs.google.com)
  let match = url.match(/\/file\/d\/([-\w]+)/);
  if (match) return match[1];

  // Match: id=<ID> (including open?id= and uc?id=)
  match = url.match(/[?&]id=([-\w]+)/);
  if (match) return match[1];

  // Match: /open?id=<ID> (older style)
  match = url.match(/\/open\?id=([-\w]+)/);
  if (match) return match[1];

  // Match: /uc?id=<ID> (export link)
  match = url.match(/\/uc\?id=([-\w]+)/);
  if (match) return match[1];

  return null;
}

/**
 * Resolve Google Drive URLs to direct image URLs
 */
export function resolvePhotoURL(directUrl: string | null | undefined, shareUrl: string | null | undefined): {
  resolved: string | null;
  status: PhotoStatus;
} {
  // Prefer direct URL
  if (directUrl && directUrl.trim().length > 0) {
    return { resolved: directUrl, status: 'direct-ok' };
  }

  // Try to extract file ID from share URL
  if (shareUrl && shareUrl.trim().length > 0) {
    const fileId = extractDriveFile(shareUrl);
    if (fileId) {
      const resolved = `https://drive.google.com/uc?export=view&id=${fileId}`;
      return { resolved, status: 'resolved-from-share' };
    }
    return { resolved: null, status: 'unresolvable' };
  }

  return { resolved: null, status: 'missing' };
}

/**
 * Validate task data and return quality issues
 */
export function validateTaskData(task: Task, parsedDates: {
  planned_start: Date | null;
  planned_finish: Date | null;
  actual_start: Date | null;
  actual_finish: Date | null;
  last_updated: Date | null;
}): { issues: string[]; flag: QualityFlag } {
  const issues: string[] = [];

  const { planned_start, planned_finish, actual_start, actual_finish, last_updated } = parsedDates;

  // Check: planned finish before start
  if (planned_start && planned_finish && planned_finish < planned_start) {
    issues.push('planned_finish_before_start');
  }

  // Check: actual finish before start
  if (actual_start && actual_finish && actual_finish < actual_start) {
    issues.push('actual_finish_before_start');
  }

  // Check: progress out of range (already clamped in schema, but flag it)
  if (task.progress_pct !== null && (task.progress_pct < 0 || task.progress_pct > 100)) {
    issues.push('progress_out_of_range');
  }

  // Check: completed but missing actual_finish
  if (task.progress_pct !== null && task.progress_pct >= 100 && !actual_finish) {
    issues.push('completed_but_missing_actual_finish');
  }

  // Check: missing planned dates
  if (!planned_start || !planned_finish) {
    issues.push('missing_planned_dates');
  }

  // Check: stale update
  if (last_updated) {
    const daysSinceUpdate = dayjs().diff(dayjs(last_updated), 'day');
    if (daysSinceUpdate > STALE_DAYS) {
      issues.push('stale_update');
    }
  }

  // Check: duration missing or zero
  if (task.planned_duration_days === null || task.planned_duration_days <= 0) {
    issues.push('duration_missing_or_zero');
  }

  // Determine highest severity
  let flag: QualityFlag = null;
  if (issues.includes('planned_finish_before_start') ||
    issues.includes('actual_finish_before_start') ||
    issues.includes('progress_out_of_range')) {
    flag = 'critical';
  } else if (issues.includes('completed_but_missing_actual_finish') ||
    issues.includes('missing_planned_dates') ||
    issues.includes('stale_update')) {
    flag = 'warning';
  } else if (issues.length > 0) {
    flag = 'info';
  }

  return { issues, flag };
}

/**
 * Compute schedule intelligence and status for a task
 */
export function computeTaskStatus(task: Task): TaskWithStatus {
  const today = new Date();
  const today_epoch = today.getTime();

  // Parse dates using DD-MM-YYYY parser
  const planned_start = parseDMY(task.planned_start);
  const planned_finish = parseDMY(task.planned_finish);
  const actual_start = parseDMY(task.actual_start);
  const actual_finish = parseDMY(task.actual_finish);
  const last_updated = parseDMY(task.last_updated);

  // Generate unique keys
  const site_uid = `${task.package_id}|${task.district}|${task.site_id}`;
  const task_uid = `${site_uid}|${task.discipline}|${task.task_name}`;
  const siteKey = `${task.package_id}__${task.site_id}`; // Legacy format

  // Task weight
  const task_weight_days = Math.max(1, task.planned_duration_days || 1);
  const task_weight_final = task_weight_days; // Can add override logic later

  // Validate data quality
  const qualityReport = validateTaskData(task, {
    planned_start,
    planned_finish,
    actual_start,
    actual_finish,
    last_updated,
  });

  // Stale update check
  const stale_update_flag = last_updated
    ? dayjs(today).diff(dayjs(last_updated), 'day') > STALE_DAYS
    : false;
  // Calculate planned progress (baseline)
  let planned_progress_pct: number | null = null;
  if (planned_start && planned_finish) {
    const S = planned_start.getTime();
    const F = planned_finish.getTime();
    const T = today_epoch;

    if (T <= S) {
      planned_progress_pct = 0;
    } else if (T >= F) {
      planned_progress_pct = 100;
    } else {
      planned_progress_pct = ((T - S) / (F - S)) * 100;
    }
  }

  // Progress delta
  const progress_delta_pct = task.progress_pct !== null && planned_progress_pct !== null
    ? task.progress_pct - planned_progress_pct
    : null;

  // Schedule bucket
  let schedule_bucket: ScheduleBucket | null = null;
  if (progress_delta_pct !== null) {
    if (progress_delta_pct > AHEAD_DELTA) {
      schedule_bucket = 'ahead';
    } else if (progress_delta_pct >= ONTRACK_LOW) {
      schedule_bucket = 'on-track';
    } else if (progress_delta_pct >= ATRISK_LOW) {
      schedule_bucket = 'at-risk';
    } else {
      schedule_bucket = 'delayed';
    }
  }

  // Task status (5 states)
  let status: TaskStatus;
  let is_completed = false;
  let is_overdue = false;
  let is_stalled = false;

  if (actual_finish || (task.progress_pct !== null && task.progress_pct >= 100)) {
    status = 'completed';
    is_completed = true;
  } else if (!actual_start && (task.progress_pct === null || task.progress_pct === 0)) {
    status = 'not-started';
  } else if (planned_finish && today > planned_finish) {
    status = 'overdue';
    is_overdue = true;
  } else if (stale_update_flag && task.progress_pct !== null && task.progress_pct > 0) {
    status = 'stalled';
    is_stalled = true;
  } else {
    status = 'in-progress';
  }

  // Fallback: If schedule_bucket is still null but task is overdue/stalled, mark as delayed
  if (schedule_bucket === null && (is_overdue || is_stalled)) {
    schedule_bucket = 'delayed';
  }
  // If task is completed but no schedule_bucket, mark as on-track
  else if (schedule_bucket === null && is_completed) {
    schedule_bucket = 'on-track';
  }
  // NEW: If no schedule_bucket but task has delay flag from spreadsheet, use that
  else if (schedule_bucket === null && task.delay_flag_calc && task.delay_flag_calc.toUpperCase().includes('DELAY')) {
    schedule_bucket = 'delayed';
  }
  // If task is in progress but no schedule data, mark as on-track
  else if (schedule_bucket === null && status === 'in-progress') {
    schedule_bucket = 'on-track';
  }

  // Slip days
  let slip_days = 0;
  if (status === 'completed' && actual_finish && planned_finish) {
    slip_days = Math.floor((actual_finish.getTime() - planned_finish.getTime()) / (1000 * 60 * 60 * 24));
  } else if (is_overdue && planned_finish) {
    slip_days = Math.floor((today.getTime() - planned_finish.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Photo resolution
  // const coverResult = resolvePhotoURL(task.cover_photo_direct_url, task.cover_photo_share_url);
  const beforeResult = resolvePhotoURL(task.before_photo_direct_url, task.before_photo_share_url);
  const afterResult = resolvePhotoURL(task.after_photo_direct_url, task.after_photo_share_url);

  // Evidence status
  const has_before = beforeResult.resolved !== null;
  const has_after = afterResult.resolved !== null;
  let evidence_status: EvidenceStatus;
  if (has_before && has_after) {
    evidence_status = 'before-after';
  } else if (has_before) {
    evidence_status = 'before-only';
  } else if (has_after) {
    evidence_status = 'after-only';
  } else {
    evidence_status = 'none';
  }

  const evidence_compliant_flag = evidence_status === 'before-after';

  // Risk score
  const missing_evidence = evidence_compliant_flag ? 0 : 1;
  const risk_task =
    (is_overdue ? 50 : 0) +
    (stale_update_flag ? 20 : 0) +
    (missing_evidence * 10) +
    Math.max(0, -(progress_delta_pct || 0));

  // Legacy isDelayed flag (for backward compatibility)
  const isDelayed = task.delay_flag_calc?.toUpperCase().includes('DELAY') ?? false;

  return {
    ...task,
    // Keys
    site_uid,
    task_uid,
    siteKey,

    // Status
    status,
    is_completed,
    is_overdue,
    is_stalled,
    isDelayed,

    // Schedule intelligence
    planned_progress_pct,
    progress_delta_pct,
    schedule_bucket,
    slip_days,
    stale_update_flag,

    // Weights
    weight: task_weight_final, // Legacy
    task_weight_days,
    task_weight_final,
    task_weight_norm_site: 1, // Will be normalized later per site

    // Photos
    before_url_resolved: beforeResult.resolved,
    after_url_resolved: afterResult.resolved,
    before_photo_status: beforeResult.status,
    after_photo_status: afterResult.status,
    evidence_status,
    evidence_compliant_flag,

    // Quality
    data_quality_issues: qualityReport.issues,
    data_quality_flag: qualityReport.flag,

    // Risk
    risk_task,

    // Reference
    today_epoch,
  };
}

/**
 * Parse XLSX file and extract tasks from Data_Entry sheet
 */
export async function parseXLSXFile(file: File): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Find Data_Entry sheet or use first sheet
        let sheetName = 'Data_Entry';
        if (!workbook.SheetNames.includes(sheetName)) {
          sheetName = workbook.SheetNames[0];
          console.warn(`Sheet "Data_Entry" not found, using "${sheetName}"`);
        }

        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: null,
        });

        // Parse and validate each row
        const tasks: Task[] = [];

        if (rawData.length === 0) {
          reject(new Error(`No data found in sheet "${sheetName}"`));
          return;
        }

        console.log(`Found ${rawData.length} rows. First row keys:`, Object.keys(rawData[0] || {}));

        for (let i = 0; i < rawData.length; i++) {
          try {
            const rowData = rawData[i] as Record<string, unknown>;

            // Skip empty rows
            if (!rowData.site_id && !rowData.package_id) {
              console.warn(`Row ${i + 2} skipped: missing site_id or package_id`);
              continue;
            }

            // Convert dates using DD-MM-YYYY parser
            const processedRow = {
              ...rowData,
              planned_start: parseDMY(rowData.planned_start as string | number | Date),
              planned_finish: parseDMY(rowData.planned_finish as string | number | Date),
              actual_start: parseDMY(rowData.actual_start as string | number | Date),
              actual_finish: parseDMY(rowData.actual_finish as string | number | Date),
              last_updated: parseDMY(rowData.last_updated as string | number | Date),
              progress_pct: rowData.progress_pct != null ? Number(rowData.progress_pct) : null,
              planned_duration_days: rowData.planned_duration_days != null ? Number(rowData.planned_duration_days) : null,
              Variance: rowData.Variance != null ? Number(rowData.Variance) : null,
            };

            const validated = taskSchema.parse(processedRow);
            tasks.push(validated);
          } catch (err) {
            console.error(`Failed to parse row ${i + 2}:`, rawData[i], err);
            // Continue with other rows
          }
        }

        if (tasks.length === 0) {
          reject(new Error('No valid tasks could be parsed from the Excel file. Check column names and data format.'));
          return;
        }

        console.log(`Successfully parsed ${tasks.length} tasks`);
        resolve(tasks);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Clamp progress percentage
 */
export function clampProgress(pct: number | null): number {
  if (pct === null) return 0;
  return Math.max(0, Math.min(100, pct));
}
