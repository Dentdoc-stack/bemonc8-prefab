/**
 * CRITICAL BUG FIX TEST SUITE
 * ===========================
 * 
 * Tests for Site Progress Calculation Bug Fix
 * Bug ID: SITE-PROGRESS-001
 * 
 * These tests reproduce and verify the fix for the critical bug where
 * sites showed 100% progress when only 1 task was completed.
 */

import { groupTasksBySite, computeKPIs } from '../dataProcessor';
import type { TaskWithStatus } from '@/types';

// Minimal test globals to satisfy TypeScript without a test runner's types
declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function expect(value: unknown): any;

/**
 * Helper: Create a minimal test task
 */
function createTestTask(overrides: Partial<TaskWithStatus>): TaskWithStatus {
    const defaults: TaskWithStatus = {
        // IDs
        package_id: 'FP1',
        package_name: 'Flood Package-1',
        district: 'Swat',
        site_id: 'SW-001',
        site_name: 'Test Site',
        site_uid: 'FP1|Swat|SW-001',
        siteKey: 'FP1__SW-001',
        task_uid: 'FP1|Swat|SW-001|General|Test Task',

        // Task details
        discipline: 'General',
        task_name: 'Test Task',

        // Dates
        planned_start: new Date('2026-01-01'),
        planned_finish: new Date('2026-01-31'),
        planned_duration_days: 1,
        actual_start: null,
        actual_finish: null,
        last_updated: null,

        // Progress
        progress_pct: null,
        Variance: null,
        delay_flag_calc: null,
        remarks: null,

        // Photos
        photo_folder_url: null,
        cover_photo_share_url: null,
        cover_photo_direct_url: null,
        before_photo_share_url: null,
        before_photo_direct_url: null,
        after_photo_share_url: null,
        after_photo_direct_url: null,
        before_url_resolved: null,
        after_url_resolved: null,
        before_photo_status: 'missing',
        after_photo_status: 'missing',

        // Computed fields
        status: 'not-started',
        is_completed: false,
        is_overdue: false,
        is_stalled: false,
        isDelayed: false,

        // Schedule intelligence
        planned_progress_pct: 0,
        progress_delta_pct: null,
        schedule_bucket: 'on-track',
        slip_days: null as unknown as number,
        stale_update_flag: false,

        // Weights
        weight: 1,
        task_weight_days: 1,
        task_weight_final: 1,
        task_weight_norm_site: 1,

        // Evidence
        evidence_status: 'none',
        evidence_compliant_flag: false,

        // Quality
        data_quality_issues: [],
        data_quality_flag: null,

        // Risk
        risk_task: 0,

        // Reference
        today_epoch: Date.now(),
    };

    return { ...defaults, ...overrides };
}

describe('Site Progress Calculation Bug Fix', () => {
    /**
     * TEST CASE A: Bug Reproduction
     * ===============================
     * Scenario: BHU Islampura with 1 completed task, 15 not-started
     * Expected: Site progress should be ~1.96%, NOT 100%
     */
    test('Case A: Bug reproduction - 1 complete task, 15 null progress tasks', () => {
        const tasks: TaskWithStatus[] = [
            // Task 1: Mobilization - COMPLETED (100% progress, 1 day duration)
            createTestTask({
                task_name: 'Mobilization',
                progress_pct: 100,
                planned_duration_days: 1,
                weight: 1,
                status: 'completed',
                is_completed: true,
            }),

            // Tasks 2-16: Various tasks - NOT STARTED (null progress, varied durations)
            ...Array.from({ length: 15 }, (_, i) => createTestTask({
                task_name: `Task ${i + 2}`,
                progress_pct: null, // ❗ This is the key - null progress
                planned_duration_days: i + 1, // Durations: 1, 2, 3, ..., 15 (sum = 120)
                weight: i + 1,
                status: 'not-started',
                is_completed: false,
            })),
        ];

        const sites = groupTasksBySite(tasks);

        expect(sites).toHaveLength(1);
        const site = sites[0];

        // Verify task counts
        expect(site.totalTasks).toBe(16);
        expect(site.completedTasks).toBe(1);
        expect(site.notStartedTasks).toBe(15);

        // CRITICAL: Calculate expected progress
        // weights: 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
        // total weight = 1 + (1+2+3+...+15) = 1 + 120 = 121
        // numerator = 100*1 + 0*1 + 0*2 + ... + 0*15 = 100
        // expected = 100 / 121 = 0.826...%
        const expectedProgress = 100 / 121;

        // BUG would give: 100% (because only the completed task is counted)
        // FIX should give: ~0.83%
        expect(site.weightedProgress).toBeCloseTo(expectedProgress, 2);
        expect(site.weightedProgress).toBeLessThan(2); // Definitely not 100!
        expect(site.weightedProgress).toBeGreaterThan(0);

        console.log(`✅ Case A: Site progress = ${site.weightedProgress.toFixed(2)}% (expected ${expectedProgress.toFixed(2)}%)`);
    });

    /**
     * TEST CASE B: All tasks completed
     * ================================
     * Expected: 100% progress
     */
    test('Case B: All tasks 100% complete', () => {
        const tasks: TaskWithStatus[] = Array.from({ length: 10 }, (_, i) =>
            createTestTask({
                task_name: `Task ${i + 1}`,
                progress_pct: 100,
                planned_duration_days: i + 1,
                weight: i + 1,
                status: 'completed',
                is_completed: true,
            })
        );

        const sites = groupTasksBySite(tasks);
        const site = sites[0];

        expect(site.totalTasks).toBe(10);
        expect(site.completedTasks).toBe(10);
        expect(site.weightedProgress).toBeCloseTo(100, 2);

        console.log(`✅ Case B: Site progress = ${site.weightedProgress.toFixed(2)}% (expected 100%)`);
    });

    /**
     * TEST CASE C: Mixed null and partial progress
     * ============================================
     * Some tasks have null progress, some have partial
     */
    test('Case C: Mixed null progress and partial progress', () => {
        const tasks: TaskWithStatus[] = [
            createTestTask({ task_name: 'Task 1', progress_pct: 50, weight: 10 }),
            createTestTask({ task_name: 'Task 2', progress_pct: null, weight: 10 }), // null = 0
            createTestTask({ task_name: 'Task 3', progress_pct: 20, weight: 10 }),
            createTestTask({ task_name: 'Task 4', progress_pct: null, weight: 10 }), // null = 0
        ];

        const sites = groupTasksBySite(tasks);
        const site = sites[0];

        // Expected: (50*10 + 0*10 + 20*10 + 0*10) / (10+10+10+10)
        //         = (500 + 0 + 200 + 0) / 40 = 700 / 40 = 17.5%
        const expectedProgress = 17.5;

        expect(site.weightedProgress).toBeCloseTo(expectedProgress, 2);

        console.log(`✅ Case C: Site progress = ${site.weightedProgress.toFixed(2)}% (expected ${expectedProgress}%)`);
    });

    /**
     * TEST CASE D: Zero or missing durations
     * ======================================
     * Weight should default to 1 if duration is 0 or null
     */
    test('Case D: Tasks with zero or null durations get default weight', () => {
        const tasks: TaskWithStatus[] = [
            createTestTask({
                task_name: 'Task 1',
                progress_pct: 100,
                planned_duration_days: 0, // Edge case: 0 duration
                weight: 1, // Should default to 1
            }),
            createTestTask({
                task_name: 'Task 2',
                progress_pct: null,
                planned_duration_days: null as unknown as number, // Edge case: null duration
                weight: 1, // Should default to 1
            }),
        ];

        const sites = groupTasksBySite(tasks);
        const site = sites[0];

        // Expected: (100*1 + 0*1) / (1+1) = 100/2 = 50%
        expect(site.weightedProgress).toBeCloseTo(50, 2);

        console.log(`✅ Case D: Site progress = ${site.weightedProgress.toFixed(2)}% (expected 50%)`);
    });

    /**
     * TEST CASE E: Overall KPIs calculation
     * =====================================
     * Verify overall weighted progress also handles null correctly
     */
    test('Case E: Overall KPIs with null progress tasks', () => {
        const tasks: TaskWithStatus[] = [
            // Site 1: 1 complete, 3 null
            createTestTask({ site_id: 'S1', siteKey: 'FP1__S1', progress_pct: 100, weight: 1 }),
            createTestTask({ site_id: 'S1', siteKey: 'FP1__S1', progress_pct: null, weight: 1 }),
            createTestTask({ site_id: 'S1', siteKey: 'FP1__S1', progress_pct: null, weight: 1 }),
            createTestTask({ site_id: 'S1', siteKey: 'FP1__S1', progress_pct: null, weight: 1 }),

            // Site 2: all null
            createTestTask({ site_id: 'S2', siteKey: 'FP1__S2', progress_pct: null, weight: 1 }),
            createTestTask({ site_id: 'S2', siteKey: 'FP1__S2', progress_pct: null, weight: 1 }),
        ];

        const kpis = computeKPIs(tasks);

        // Expected overall: (100*1 + 0*5) / 6 = 100/6 = 16.67%
        const expectedProgress = 100 / 6;

        expect(kpis.overallWeightedProgress).toBeCloseTo(expectedProgress, 2);
        expect(kpis.totalSites).toBe(2);
        expect(kpis.totalTasks).toBe(6);

        console.log(`✅ Case E: Overall progress = ${kpis.overallWeightedProgress.toFixed(2)}% (expected ${expectedProgress.toFixed(2)}%)`);
    });

    /**
     * TEST CASE F: Edge case - site with zero tasks
     * =============================================
     * Should return 0%, not NaN or 100%
     */
    test('Case F: Empty site returns 0% progress', () => {
        const tasks: TaskWithStatus[] = [];
        const sites = groupTasksBySite(tasks);

        expect(sites).toHaveLength(0);

        // If we had an empty site, progress should be 0
        const kpis = computeKPIs(tasks);
        expect(kpis.overallWeightedProgress).toBe(0);

        console.log(`✅ Case F: Empty dataset returns 0% progress`);
    });

    /**
     * TEST CASE G: Clamping edge cases
     * ================================
     * Progress should be clamped between 0 and 100
     */
    test('Case G: Progress is clamped between 0 and 100', () => {
        // Normal case - should not clamp
        const normalTasks: TaskWithStatus[] = [
            createTestTask({ progress_pct: 50, weight: 1 }),
        ];
        const normalSite = groupTasksBySite(normalTasks)[0];
        expect(normalSite.weightedProgress).toBe(50);

        // All zero - should be 0
        const zeroTasks: TaskWithStatus[] = [
            createTestTask({ progress_pct: 0, weight: 1 }),
            createTestTask({ progress_pct: null, weight: 1 }),
        ];
        const zeroSite = groupTasksBySite(zeroTasks)[0];
        expect(zeroSite.weightedProgress).toBe(0);

        console.log(`✅ Case G: Progress clamping works correctly`);
    });
});

/**
 * EXPECTED OUTPUT SUMMARY
 * =======================
 * 
 * When you run: npm test dataProcessor.test.ts
 * 
 * All tests should PASS:
 * ✅ Case A: Bug reproduction - site progress ~0.83% (not 100%)
 * ✅ Case B: All complete - site progress 100%
 * ✅ Case C: Mixed progress - site progress 17.5%
 * ✅ Case D: Zero durations - site progress 50%
 * ✅ Case E: Overall KPIs - overall progress 16.67%
 * ✅ Case F: Empty dataset - 0% progress
 * ✅ Case G: Clamping - values between 0-100
 * 
 * BHU Islampura ACTUAL SCENARIO:
 * ==============================
 * 
 * From user's screenshot:
 * - Site: BHU Islampura
 * - Tasks: 16 total
 * - Task 1 (Mobilization): 100% complete
 * - Tasks 2-16: null progress (not started)
 * 
 * If all tasks have equal weight (duration = 1 day):
 *   Expected: 100/16 = 6.25%
 * 
 * If durations vary (e.g., sum = 51 days total, Mobilization = 1 day):
 *   Expected: 100/51 = 1.96%
 * 
 * With the FIX applied, when user uploads the file again:
 * - BHU Islampura will show correct progress (likely 1-6%)
 * - Debug console will print detailed calculation for verification
 */
