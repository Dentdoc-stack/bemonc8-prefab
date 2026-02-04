/**
 * BUG ANALYSIS & FIX DOCUMENTATION
 * =================================
 * 
 * SEVERITY: CRITICAL - Data Integrity Issue
 * 
 * SYMPTOMS:
 * --------
 * Site "BHU Islampura" shows 100.0% progress when only 1/16 tasks is completed.
 * - 1 task (Mobilization) has progress_pct = 100
 * - 15 tasks have progress_pct = null (not started)
 * - Expected site progress: ~1.96% (assuming equal weights)
 * - Actual site progress shown: 100.0%
 * 
 * ROOT CAUSE:
 * ----------
 * File: src/lib/dataProcessor.ts
 * Function: groupTasksBySite()
 * Lines: 48-53
 * 
 * ```typescript
 * for (const task of siteTasks) {
 *   if (task.progress_pct !== null) {  // ❌ BUG HERE
 *     totalWeightedProgress += task.progress_pct * task.weight;
 *     totalWeight += task.weight;
 *   }
 * }
 * ```
 * 
 * The conditional `if (task.progress_pct !== null)` causes tasks with null/missing 
 * progress to be COMPLETELY EXCLUDED from both numerator AND denominator.
 * 
 * INCORRECT CALCULATION EXAMPLE:
 * ------------------------------
 * Given:
 * - Task 1 (Mobilization): progress = 100%, weight = 1 day
 * - Tasks 2-16: progress = null, weights = varied days (total ~50 days)
 * 
 * Current WRONG calculation:
 *   weightedProgress = (100 * 1) / 1 = 100%  ❌
 * 
 * CORRECT calculation should be:
 *   weightedProgress = (100 * 1 + 0 * weight2 + ... + 0 * weight16) / (1 + weight2 + ... + weight16)
 *                    = 100 / 51 ≈ 1.96%  ✅
 * 
 * AFFECTED CODE PATHS:
 * -------------------
 * 1. dataProcessor.ts:groupTasksBySite() - Site aggregation (PRIMARY BUG)
 * 2. dataProcessor.ts:computeKPIs() - Overall project progress (SAME BUG at lines 142-147)
 * 3. Charts.tsx - District/discipline aggregations (SAME PATTERN)
 * 
 * THE FIX:
 * --------
 * Rule: Tasks with null progress MUST be treated as 0% progress, NOT excluded.
 * 
 * BEFORE (lines 48-53):
 * ```typescript
 * for (const task of siteTasks) {
 *   if (task.progress_pct !== null) {
 *     totalWeightedProgress += task.progress_pct * task.weight;
 *     totalWeight += task.weight;
 *   }
 * }
 * ```
 * 
 * AFTER:
 * ```typescript
 * for (const task of siteTasks) {
 *   const progress = task.progress_pct ?? 0;  // Treat null as 0
 *   totalWeightedProgress += progress * task.weight;
 *   totalWeight += task.weight;
 * }
 * ```
 * 
 * VERIFICATION:
 * ------------
 * Test Case: BHU Islampura reproduction
 * - 16 tasks total
 * - Task 1: progress=100, duration=1 day
 * - Tasks 2-16: progress=null, duration=1-15 days (sum=50)
 * 
 * Expected: (100*1 + 0*50) / (1+50) = 1.96%
 * 
 * SAFEGUARDS ADDED:
 * ----------------
 * 1. Explicit null coalescing: `?? 0`
 * 2. Debug logging for one site (BHU Islampura)
 * 3. Clamping final result: Math.max(0, Math.min(100, weightedProgress))
 * 4. Zero-task sites return 0% (not 100%, not NaN)
 * 
 * TEST COVERAGE:
 * -------------
 * See: src/lib/__tests__/dataProcessor.test.ts
 * - Test A: Bug reproduction (1 complete, 15 null)
 * - Test B: All complete (100%)
 * - Test C: Mixed null and partial progress
 * - Test D: Zero/missing durations (default weight=1)
 * - Test E: Grouping key normalization
 */

export const BUG_FIX_METADATA = {
  bugId: 'SITE-PROGRESS-001',
  severity: 'CRITICAL',
  discoveredDate: '2026-01-22',
  affectedVersions: ['all'],
  fixedIn: 'v1.1.0',
  reproducibility: '100%',
  dataCorruption: true,
};
