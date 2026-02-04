# Flood Package Dashboard Parser Spec (XLSX → Canonical Data + Dashboard-Ready Outputs)
**Version:** 1.1 (DD-MM-YYYY Standard + Photo Logic)  
**Timezone:** Asia/Karachi  
**Input date format (team standard):** **DD-MM-YYYY** (also accept DD/MM/YYYY + Excel serial dates)

---

## 0) Objectives

Build a deterministic parser that:

1. Ingests a consolidated XLSX (or multiple sheets merged upstream) containing task-level progress data.
2. Normalizes and validates rows (especially **DD-MM-YYYY** dates).
3. Produces **dashboard-ready tables** + **pre-aggregated KPIs**.
4. Supports **cascading filters** reflecting the workflow:

> **Package → District → Site → Discipline → Task**

5. Provides robust **photo display** (cover + before/after), with graceful fallbacks and “evidence compliance” indicators.

---

## 1) Inputs

### 1.1 Primary workbook
- `.xlsx` file (single consolidated master preferred)

### 1.2 Expected sheets
- **Data_Entry** *(required)*: task-level fact table
- **Sites** *(optional but recommended)*: site metadata + photo links
- **Tasks** *(optional)*: task catalog / ordering / default weights

> If Sites/Tasks are missing, parser still runs using Data_Entry, but flags `warnings[]`.

---

## 2) Canonical Data Model (Outputs)

### 2.1 `fact_tasks` (task-level fact table)
**Granularity:** 1 row = 1 task instance at 1 site.

#### Required fields (from source)
- `package_id`, `package_name`
- `district`
- `site_id`, `site_name`
- `discipline`
- `task_name`
- `planned_start`, `planned_finish` *(DD-MM-YYYY strings in input)*
- `planned_duration_days`
- `actual_start`, `actual_finish` *(DD-MM-YYYY strings in input)*
- `progress_pct`
- `last_updated` *(DD-MM-YYYY)*
- `remarks`
- `photo_folder_url`
- `cover_photo_share_url`, `cover_photo_direct_url`

#### Recommended fields (add to source if possible)
- `before_photo_share_url`, `before_photo_direct_url`
- `after_photo_share_url`, `after_photo_direct_url`
- (optional) `task_weight_override`

#### Parser-derived fields (must add)
**Keys**
- `site_uid = package_id + "|" + district + "|" + site_id`
- `task_uid = site_uid + "|" + discipline + "|" + task_name`

**Date normalization**
For each of: planned_start/finish, actual_start/finish, last_updated:
- `*_raw` (original input string)
- `*_iso` (normalized: YYYY-MM-DD)
- `*_epoch` (ms since epoch) for fast arithmetic

Also:
- `today_iso` and `today_epoch` (fixed once per run)

**Status & schedule intelligence**
- `task_status` ∈ {Not Started, In Progress, Completed, Overdue, Stalled}
- `is_completed` (0/1)
- `is_overdue` (0/1)
- `stale_update_flag` (0/1) using `STALE_DAYS` (default 14)
- `slip_days` (int)
- `planned_progress_pct` (0–100 baseline)
- `progress_delta_pct = progress_pct - planned_progress_pct`
- `schedule_bucket` ∈ {Ahead, On Track, At Risk, Delayed}

**Weights**
- `task_weight_days = max(1, planned_duration_days_num || 1)`
- `task_weight_final = task_weight_override ?? task_weight_days`
- `task_weight_norm_site = task_weight_final / sum(task_weight_final for same site_uid)`

**Evidence**
- `before_url_resolved`, `after_url_resolved` (display-safe)
- `evidence_status` ∈ {None, BeforeOnly, AfterOnly, BeforeAfter}
- `evidence_compliant_flag` (1 if BeforeAfter else 0)

**Data quality**
- `data_quality_issues[]` (array)
- `data_quality_flag` (Highest-severity label)

---

### 2.2 Dimension tables

#### `dim_packages`
- `package_id`, `package_name`
- `districts[]`
- `sites_count`, `tasks_count`
- `package_progress_weighted` (computed)

#### `dim_package_district`
- `package_id`, `district`
- `sites_count`, `tasks_count`
- `district_progress_weighted` (computed)

#### `dim_sites`
Preferred source: **Sites** sheet; fallback: unique sites from `fact_tasks`.

- `site_uid`, `package_id`, `package_name`, `district`
- `site_id`, `site_name`
- `photo_folder_url`
- `cover_photo_share_url`, `cover_photo_direct_url`
- `cover_photo_resolved`
- `cover_photo_status` ∈ {DirectOK, ResolvedFromShare, Missing, Unresolvable}
- `latest_update_iso`
- `site_progress_weighted`
- `site_risk_score`

#### `dim_tasks` (optional)
- `discipline`, `task_name`
- `sort_order` (optional)
- `default_weight_days` (optional)

---

### 2.3 Aggregations (for fast dashboard tiles)
- `agg_package` (per package)
- `agg_district` (per package+district)
- `agg_site` (per site)
- `agg_discipline` (per site+discipline)

Also:
- `quality_report` (issue counts + top problematic sites/tasks)

---

## 3) DD-MM-YYYY Date Handling (Critical)

### 3.1 Accepted formats
- **DD-MM-YYYY** (primary)
- DD/MM/YYYY (secondary)
- Excel serial date numbers (seen in XLSX)

### 3.2 `parseDMY(value)` rules
1. Blank/null → `null`
2. If number → interpret as Excel serial date (1900 system unless workbook indicates otherwise)
3. If string:
   - trim
   - strict parse:
     - `DD-MM-YYYY`
     - else try `DD/MM/YYYY`
   - reject invalid calendar dates (e.g., 31-02-2026)

### 3.3 Store both raw + normalized
- Never lose original input: keep `*_raw`.
- Use `*_iso` and `*_epoch` for all comparisons, sorting, and diffs.

### 3.4 Display
- UI displays dates as **DD-MM-YYYY** even if internal is ISO.

---

## 4) Core Calculations

### 4.1 Planned Progress Baseline (Linear)
Let S=planned_start_epoch, F=planned_finish_epoch, T=today_epoch.

- If S/F missing → `planned_progress_pct = null`
- If T ≤ S → 0
- If T ≥ F → 100
- Else:
  - `planned_progress_pct = ((T - S) / (F - S)) * 100`

### 4.2 Task Status
1) If `actual_finish` exists OR `progress_pct >= 100` → **Completed**
2) Else if `actual_start` missing AND `progress_pct == 0` → **Not Started**
3) Else if `planned_finish` exists AND `today > planned_finish` → **Overdue**
4) Else if `stale_update_flag == 1` AND `progress_pct > 0` → **Stalled**
5) Else → **In Progress**

### 4.3 Slip Days
- Completed:
  - If actual_finish & planned_finish: `slip_days = actual_finish - planned_finish` (days)
  - Else: 0 + issue flag if missing planned_finish
- Not completed:
  - If planned_finish and today>planned_finish: `slip_days = today - planned_finish`
  - Else 0

### 4.4 Schedule Bucket
Using `progress_delta_pct`:
- Ahead: > +10
- On Track: [-10, +10]
- At Risk: [-25, -10)
- Delayed: < -25

### 4.5 Site Weighted Progress
Per `site_uid`:
- `site_progress_weighted = Σ(progress_pct * task_weight_norm_site)`

### 4.6 Risk Score (simple but effective)
Per task:
- `missing_evidence = (evidence_compliant_flag==0 ? 1 : 0)`
- `risk_task = (is_overdue*50) + (stale_update_flag*20) + (missing_evidence*10) + max(0, -progress_delta_pct)`
Per site:
- `site_risk_score = Σ(risk_task * task_weight_norm_site)`

---

## 5) Cascading Filter Logic (Workflow)

All options must be derived from canonical outputs (not raw XLSX):

### 5.1 Package → District
- `district_options = distinct(district where package_id == selected_package)`

### 5.2 District → Site
- `site_options = distinct(site_uid/site_name where package_id==selected_package AND district==selected_district)`

### 5.3 Site → Discipline
- `discipline_options = distinct(discipline where site_uid==selected_site_uid)`

### 5.4 Discipline → Task
- `task_options = distinct(task_name where site_uid==selected_site_uid AND discipline==selected_discipline)`

---

## 6) Photo / Evidence Display Logic (Cover + Before/After)

### 6.1 Goals
- Show **cover image per site**
- Show **before/after per task** in a modal (side-by-side)
- Always provide **Open Folder** and **Open Original Link** fallbacks
- Avoid dashboard breakage if links are private/broken

### 6.2 Preferred fields
- Site-level:
  - `cover_photo_direct_url` (best)
  - else `cover_photo_share_url`
  - plus `photo_folder_url` (Drive folder)
- Task-level:
  - `before_photo_direct_url` or `before_photo_share_url`
  - `after_photo_direct_url` or `after_photo_share_url`

### 6.3 URL Resolution (Google Drive)
**Function:** `extractDriveFileId(url)`
- Match `/file/d/<ID>/`
- Else match `id=<ID>`
- Else null

**Resolved image URL (preview-friendly):**
- `https://drive.google.com/uc?export=view&id=<ID>`

Resolution rules:
1) If `*_direct_url` exists → use as `*_url_resolved` (status DirectOK)
2) Else if share URL has file id → convert to `uc?export=view` (status ResolvedFromShare)
3) Else if URL is a folder or id cannot be extracted → `Unresolvable`
4) Missing → `Missing`

### 6.4 Evidence status (task-level)
- has_before = before_url_resolved exists
- has_after = after_url_resolved exists

Then:
- None / BeforeOnly / AfterOnly / BeforeAfter

### 6.5 UI rules (logic your dashboard should implement)
**Task table**
- show an Evidence chip:
  - ✅ Before+After
  - ⚠️ Missing one
  - ❌ None
- clicking row opens modal:
  - left pane: Before image or placeholder
  - right pane: After image or placeholder
  - buttons:
    - Open Folder
    - Open Original Before/After link

**Site view**
- show `cover_photo_resolved` if available
- fallback order:
  1) cover_photo_resolved
  2) most recent task “after” photo (by last_updated)
  3) placeholder

**Broken images**
- if image fails to load:
  - show “Not accessible (permissions/link)”
  - show Original Link button

---

## 7) Data Quality Rules (must implement)

Populate `data_quality_issues[]` for:
- invalid_date_format
- invalid_calendar_date
- planned_finish_before_start
- actual_finish_before_start
- progress_out_of_range (clamp but flag)
- completed_but_missing_actual_finish (if progress=100 and actual_finish missing)
- missing_planned_dates
- stale_update (>STALE_DAYS)
- duration_missing_or_zero

`data_quality_flag` = highest severity issue (choose severity order in code).

---

## 8) Outputs (files or tables)

Write:
- `fact_tasks.json`
- `dim_packages.json`
- `dim_package_district.json`
- `dim_sites.json`
- `agg_package.json`
- `agg_district.json`
- `agg_site.json`
- `agg_discipline.json`
- `quality_report.json`

Optionally store in SQLite/DuckDB instead of JSON.

---

## 9) Suggested Defaults / Constants
- `STALE_DAYS = 14`
- `AHEAD_DELTA = +10`
- `ONTRACK_LOW = -10`
- `ATRISK_LOW = -25`

---

## 10) Implementation Checklist (Node.js)
- XLSX: `xlsx` or `exceljs`
- Dates: `dayjs` + `customParseFormat` (strict parsing)
- Validation: `zod`
- API: Fastify/Express
- UI: React + shadcn/ui + TanStack Table + Recharts

---

## 11) Pseudocode Skeleton (End-to-End)

```ts
read workbook
load Data_Entry, Sites (optional), Tasks (optional)

normalize rows:
  trim strings
  parseDMY for each date -> raw+iso+epoch
  coerce numbers (progress, duration)

derive keys:
  site_uid, task_uid

derive schedule intelligence:
  planned_progress_pct, progress_delta_pct
  status, slip_days, overdue flag, stale flag

resolve photos:
  cover_photo_resolved + status
  before/after resolved + evidence_status

apply weights:
  task_weight_final
  normalize per site
  compute site weighted progress

aggregate:
  package/district/site/discipline rollups
  build filter option sets

quality report:
  issue counts, top sites/tasks

write outputs (json or db)
```

---

## 12) Excel-side improvement (Optional but High Value)
Add these columns to Data_Entry to make evidence flawless:
- `before_photo_share_url`, `before_photo_direct_url`
- `after_photo_share_url`, `after_photo_direct_url`
- `task_weight_override` (rarely used; only when needed)

---
