/**
 * Data Ingestion Module
 * Fetches Google Sheets, processes tasks with status computation, deduplicates
 */

import { fetchAllSheets, mapRowToTask, fetchAllComplianceData } from './google-sheets-client';
import { computeTaskStatus } from '../dataParser';
import { groupTasksBySite, computeKPIs } from '../dataProcessor';
import { SHEET_SOURCES } from './config';
import type { Task, TaskWithStatus, SiteAggregate, DashboardKPIs, PackageComplianceMap } from '@/types';

export interface IngestedData {
    tasks: TaskWithStatus[];
    sites: SiteAggregate[];
    kpis: DashboardKPIs;
    packageCompliance: PackageComplianceMap;
    lastRefresh: Date;
    source: 'google-sheets';
    _metadata: {
        totalRawRows: number;
        validTasks: number;
        uniqueSites: number;
        packages: string[];
    };
}

/**
 * Ingest all Google Sheets and process into structured data
 */
export async function ingestAllSheets(): Promise<IngestedData> {
    console.log('=== STARTING DATA INGESTION ===');
    const startTime = Date.now();

    // Step 1: Fetch all sheets and compliance data in parallel
    const [sheetsData, complianceData] = await Promise.all([
        fetchAllSheets(),
        fetchAllComplianceData(),
    ]);

    // Convert compliance Map to Record
    const packageCompliance: PackageComplianceMap = {};
    complianceData.forEach((value, key) => {
        packageCompliance[key] = value;
    });

    // Step 2: Map to Task objects
    const rawTasks: Task[] = [];
    let totalRawRows = 0;

    for (const source of SHEET_SOURCES) {
        const rows = sheetsData.get(source.packageId) || [];
        totalRawRows += rows.length;

        rows.forEach(row => {
            const task = mapRowToTask(row, source.packageId, source.packageName);
            if (task) {
                rawTasks.push(task);
            }
        });
    }

    console.log(`Mapped ${rawTasks.length} tasks from ${totalRawRows} raw rows`);

    // Step 3: Compute status for each task (adds derived fields)
    const tasksWithStatus = rawTasks.map(task => computeTaskStatus(task));

    // Step 4: Deduplicate by task_uid
    const taskMap = new Map<string, TaskWithStatus>();
    tasksWithStatus.forEach(task => {
        if (!taskMap.has(task.task_uid)) {
            taskMap.set(task.task_uid, task);
        }
    });

    const tasks = Array.from(taskMap.values());
    console.log(`Deduplicated to ${tasks.length} unique tasks`);

    // Step 5: Aggregate to sites
    const sites = groupTasksBySite(tasks);
    console.log(`Aggregated into ${sites.length} sites`);

    // Step 6: Compute KPIs
    const kpis = computeKPIs(tasks);

    // Step 7: Validate data integrity
    validateDataIntegrity(tasks, sites, kpis);

    // Log compliance summary
    const compliantCount = Object.values(packageCompliance).filter(c => c.status === 'COMPLIANT').length;
    const nonCompliantCount = Object.values(packageCompliance).filter(c => c.status === 'NON_COMPLIANT').length;
    console.log(`Package compliance: ${compliantCount} compliant, ${nonCompliantCount} non-compliant`);

    const endTime = Date.now();
    console.log(`=== INGESTION COMPLETE (${endTime - startTime}ms) ===`);

    return {
        tasks,
        sites,
        kpis,
        packageCompliance,
        lastRefresh: new Date(),
        source: 'google-sheets',
        _metadata: {
            totalRawRows,
            validTasks: tasks.length,
            uniqueSites: sites.length,
            packages: SHEET_SOURCES.map(s => s.packageId),
        },
    };
}

/**
 * Validate data integrity - throw errors if assertions fail
 */
function validateDataIntegrity(
    tasks: TaskWithStatus[],
    sites: SiteAggregate[],
    kpis: DashboardKPIs
) {
    console.log('=== VALIDATING DATA INTEGRITY ===');

    // Assertion 1: Unique site count
    const uniqueSiteUids = new Set(tasks.map(t => t.site_uid));
    if (uniqueSiteUids.size !== sites.length) {
        throw new Error(
            `Site count mismatch: ${uniqueSiteUids.size} unique site_uids but ${sites.length} aggregated sites`
        );
    }
    console.log(`✅ Site count: ${sites.length}`);

    // Assertion 2: KPI totalSites matches
    if (kpis.totalSites !== sites.length) {
        throw new Error(
            `KPI site count mismatch: kpis.totalSites=${kpis.totalSites}, sites.length=${sites.length}`
        );
    }
    console.log(`✅ KPI totalSites matches: ${kpis.totalSites}`);

    // Assertion 3: Site progress cannot be 100% unless all tasks complete
    const invalidSites = sites.filter(site => {
        if (site.weightedProgress >= 99.9) {
            const allComplete = site.tasks.every(t => t.status === 'completed');
            return !allComplete;
        }
        return false;
    });

    if (invalidSites.length > 0) {
        throw new Error(
            `Found ${invalidSites.length} site(s) with 100% progress but incomplete tasks: ${invalidSites.map(s => s.site_name).join(', ')}`
        );
    }
    console.log(`✅ All 100% sites have all tasks completed`);

    // Assertion 4: No negative progress
    const negativeProgress = tasks.filter(t => (t.progress_pct ?? 0) < 0);
    if (negativeProgress.length > 0) {
        throw new Error(`Found ${negativeProgress.length} tasks with negative progress`);
    }
    console.log(`✅ No negative progress values`);

    console.log('=== VALIDATION PASSED ===');
}
