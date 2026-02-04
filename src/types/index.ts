import { z } from 'zod';

// Date triple: stores raw, ISO, and epoch formats
export interface DateTriple {
  raw: string;
  iso: string;
  epoch: number;
}

// Task status (5 states)
export type TaskStatus = 'completed' | 'in-progress' | 'not-started' | 'overdue' | 'stalled';

// Schedule bucket
export type ScheduleBucket = 'ahead' | 'on-track' | 'at-risk' | 'delayed';

// Evidence status
export type EvidenceStatus = 'none' | 'before-only' | 'after-only' | 'before-after';

// Photo resolution status
export type PhotoStatus = 'direct-ok' | 'resolved-from-share' | 'unresolvable' | 'missing';

// Data quality flag
export type QualityFlag = 'critical' | 'warning' | 'info' | null;

// Raw task schema from Excel
export const taskSchema = z.object({
  package_id: z.union([z.string(), z.number()]).transform(val => String(val)),
  package_name: z.string(),
  district: z.string(),
  site_id: z.union([z.string(), z.number()]).transform(String),
  site_name: z.string(),
  discipline: z.string(),
  task_name: z.string(),
  planned_start: z.date().nullable(),
  planned_finish: z.date().nullable(),
  planned_duration_days: z.number().nullable(),
  actual_start: z.date().nullable(),
  actual_finish: z.date().nullable(),
  progress_pct: z.number().min(0).max(100).nullable(),
  Variance: z.number().nullable(),
  delay_flag_calc: z.string().nullable(),
  last_updated: z.date().nullable(),
  remarks: z.string().nullable(),
  // Photo fields - allow empty strings and transform to null
  photo_folder_url: z.string().transform(val => val === '' ? null : val).nullable().optional(),
  cover_photo_share_url: z.string().transform(val => val === '' ? null : val).nullable().optional(),
  cover_photo_direct_url: z.string().transform(val => val === '' ? null : val).nullable().optional(),
  // Optional fields for before/after photos
  before_photo_share_url: z.string().transform(val => val === '' ? null : val).nullable().optional(),
  before_photo_direct_url: z.string().transform(val => val === '' ? null : val).nullable().optional(),
  after_photo_share_url: z.string().transform(val => val === '' ? null : val).nullable().optional(),
  after_photo_direct_url: z.string().transform(val => val === '' ? null : val).nullable().optional(),
});

export type Task = z.infer<typeof taskSchema>;

// Enhanced task with all computed fields
export interface TaskWithStatus extends Task {
  // Keys
  site_uid: string;
  task_uid: string;
  siteKey: string; // Keep for backward compatibility

  // Status fields
  status: TaskStatus;
  is_completed: boolean;
  is_overdue: boolean;
  is_stalled: boolean;
  isDelayed: boolean; // Keep for backward compatibility

  // Schedule intelligence
  planned_progress_pct: number | null;
  progress_delta_pct: number | null;
  schedule_bucket: ScheduleBucket | null;
  slip_days: number;
  stale_update_flag: boolean;

  // Weights
  weight: number; // Keep for backward compatibility
  task_weight_days: number;
  task_weight_final: number;
  task_weight_norm_site: number;

  // Photo resolution
  before_url_resolved: string | null;
  after_url_resolved: string | null;
  before_photo_status: PhotoStatus;
  after_photo_status: PhotoStatus;
  evidence_status: EvidenceStatus;
  evidence_compliant_flag: boolean;

  // Data quality
  data_quality_issues: string[];
  data_quality_flag: QualityFlag;

  // Risk
  risk_task: number;

  // Today reference (for calculations)
  today_epoch: number;
}

// Site aggregate
export interface SiteAggregate {
  siteKey: string;
  package_id: string;
  package_name: string;
  district: string;
  site_id: string;
  site_name: string;
  tasks: TaskWithStatus[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  delayedTasks: number;
  weightedProgress: number;
  riskScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  maxPlannedFinish: Date | null;
  maxLastUpdated: Date | null;
  coverPhotoDirectUrl: string | null;
  photoFolderUrl: string | null;
  coverPhotoShareUrl: string | null;
}

// Overall KPIs
export interface DashboardKPIs {
  totalSites: number;
  totalTasks: number;
  overallWeightedProgress: number;
  sitesWithCompleted: number;
  sitesFullyCompleted: number;
  delayedTasks: number;
  notStartedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
}

// Filter state
export interface FilterState {
  packageNames: string[];
  districts: string[];
  siteNameSearch: string;
  disciplines: string[];
  delayFlags: string[];
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
  showOnlyDelayed: boolean;
}

// Package-level compliance status
export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN';

// Package compliance data (read from V2:X2 in each sheet)
export interface PackageCompliance {
  no_of_staff_rfb: 'Yes' | 'No' | null;
  cesmps_submitted: 'Yes' | 'No' | null;
  ohs_measures: 'Yes' | 'No' | null;
  status: ComplianceStatus;
  issues: string[];
}

// Map of package_id -> compliance
export type PackageComplianceMap = Record<string, PackageCompliance>;
