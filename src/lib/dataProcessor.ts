import { TaskWithStatus, SiteAggregate, DashboardKPIs, FilterState } from '@/types';

/**
 * Normalize task weights per site (so they sum to 1.0)
 */
export function normalizeSiteWeights(tasks: TaskWithStatus[]): TaskWithStatus[] {
  const siteWeights = new Map<string, number>();

  // Calculate total weight per site
  for (const task of tasks) {
    const siteKey = task.site_uid || task.siteKey;
    const currentTotal = siteWeights.get(siteKey) || 0;
    siteWeights.set(siteKey, currentTotal + task.task_weight_final);
  }

  // Normalize weights
  return tasks.map(task => {
    const siteKey = task.site_uid || task.siteKey;
    const siteTotal = siteWeights.get(siteKey) || 1;
    return {
      ...task,
      task_weight_norm_site: task.task_weight_final / siteTotal,
    };
  });
}

/**
 * Group tasks by site
 */
export function groupTasksBySite(tasks: TaskWithStatus[]): SiteAggregate[] {
  const siteMap = new Map<string, TaskWithStatus[]>();

  for (const task of tasks) {
    const existing = siteMap.get(task.siteKey) || [];
    existing.push(task);
    siteMap.set(task.siteKey, existing);
  }

  const sites: SiteAggregate[] = [];

  for (const [siteKey, siteTasks] of siteMap.entries()) {
    const firstTask = siteTasks[0];

    // Compute weighted progress
    // CRITICAL FIX: Tasks with null progress MUST be included with 0% progress
    // BUG WAS: if (task.progress_pct !== null) excluded tasks from denominator
    let totalWeightedProgress = 0;
    let totalWeight = 0;

    // Debug logging for specific site
    const isDebugSite = firstTask.site_name === 'BHU Islampura';
    if (isDebugSite) {
      console.log('\n=== DEBUG: Site Progress Calculation ===');
      console.log(`Site: ${firstTask.site_name} (${siteKey})`);
      console.log(`Total tasks in site: ${siteTasks.length}`);
    }

    for (const task of siteTasks) {
      // CRITICAL: Treat null/undefined progress as 0, NOT exclude the task
      const progress = task.progress_pct ?? 0;
      const weight = task.weight || 1; // Fallback weight if missing

      totalWeightedProgress += progress * weight;
      totalWeight += weight;

      if (isDebugSite) {
        console.log(`  Task: ${task.task_name}`);
        console.log(`    - progress_pct (raw): ${task.progress_pct}`);
        console.log(`    - progress (used): ${progress}`);
        console.log(`    - weight: ${weight}`);
        console.log(`    - contribution: ${progress * weight}`);
      }
    }

    // Calculate final weighted progress
    // Safety: clamp between 0 and 100, handle zero-task edge case
    let weightedProgress = totalWeight > 0 ? totalWeightedProgress / totalWeight : 0;
    weightedProgress = Math.max(0, Math.min(100, weightedProgress));

    if (isDebugSite) {
      console.log(`\n  CALCULATION:`);
      console.log(`    - totalWeightedProgress (numerator): ${totalWeightedProgress}`);
      console.log(`    - totalWeight (denominator): ${totalWeight}`);
      console.log(`    - weightedProgress (final): ${weightedProgress.toFixed(2)}%`);
      console.log('=== END DEBUG ===\n');
    }

    // Count statuses
    const completedTasks = siteTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = siteTasks.filter(t => t.status === 'in-progress').length;
    const notStartedTasks = siteTasks.filter(t => t.status === 'not-started').length;
    const delayedTasks = siteTasks.filter(t => t.isDelayed).length;

    // Risk score: weighted sum of task risk scores
    let totalWeightedRisk = 0;
    let totalRiskWeight = 0;

    for (const task of siteTasks) {
      totalWeightedRisk += task.risk_task * task.task_weight_norm_site;
      totalRiskWeight += task.task_weight_norm_site;
    }

    const riskScore = totalRiskWeight > 0 ? totalWeightedRisk / totalRiskWeight : 0;
    const riskLevel: 'high' | 'medium' | 'low' =
      riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low';

    // Get max dates
    const plannedFinishes = siteTasks
      .map(t => t.planned_finish)
      .filter((d): d is Date => d !== null);
    const maxPlannedFinish = plannedFinishes.length > 0
      ? new Date(Math.max(...plannedFinishes.map(d => d.getTime())))
      : null;

    const lastUpdates = siteTasks
      .map(t => t.last_updated)
      .filter((d): d is Date => d !== null);
    const maxLastUpdated = lastUpdates.length > 0
      ? new Date(Math.max(...lastUpdates.map(d => d.getTime())))
      : null;

    // Get photo URLs (prefer from first task, or find first non-null)
    const coverPhotoDirectUrl = siteTasks.find(t => t.cover_photo_direct_url)?.cover_photo_direct_url || null;
    const photoFolderUrl = siteTasks.find(t => t.photo_folder_url)?.photo_folder_url || null;
    const coverPhotoShareUrl = siteTasks.find(t => t.cover_photo_share_url)?.cover_photo_share_url || null;

    sites.push({
      siteKey,
      package_id: firstTask.package_id,
      package_name: firstTask.package_name,
      district: firstTask.district,
      site_id: firstTask.site_id,
      site_name: firstTask.site_name,
      tasks: siteTasks,
      totalTasks: siteTasks.length,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      delayedTasks,
      weightedProgress,
      riskScore,
      riskLevel,
      maxPlannedFinish,
      maxLastUpdated,
      coverPhotoDirectUrl,
      photoFolderUrl,
      coverPhotoShareUrl,
    });
  }

  return sites;
}

/**
 * Compute overall KPIs
 */
export function computeKPIs(tasks: TaskWithStatus[]): DashboardKPIs {
  const uniqueSites = new Set(tasks.map(t => t.siteKey));

  // Site-level aggregates for site KPIs
  const siteStatus = new Map<string, { total: number; completed: number }>();
  tasks.forEach(t => {
    const entry = siteStatus.get(t.siteKey) || { total: 0, completed: 0 };
    entry.total += 1;
    if (t.status === 'completed') entry.completed += 1;
    siteStatus.set(t.siteKey, entry);
  });

  // Weighted progress (same fix as site progress)
  let totalWeightedProgress = 0;
  let totalWeight = 0;

  for (const task of tasks) {
    // CRITICAL FIX: Treat null progress as 0, NOT exclude
    const progress = task.progress_pct ?? 0;
    const weight = task.weight || 1;

    totalWeightedProgress += progress * weight;
    totalWeight += task.weight;
  }

  let overallWeightedProgress = totalWeight > 0 ? totalWeightedProgress / totalWeight : 0;
  overallWeightedProgress = Math.max(0, Math.min(100, overallWeightedProgress));

  const sitesWithCompleted = Array.from(siteStatus.values()).filter(s => s.completed > 0).length;
  const sitesFullyCompleted = Array.from(siteStatus.values()).filter(s => s.completed === s.total && s.total > 0).length;

  return {
    totalSites: uniqueSites.size,
    totalTasks: tasks.length,
    overallWeightedProgress,
    sitesWithCompleted,
    sitesFullyCompleted,
    delayedTasks: tasks.filter(t => t.isDelayed).length,
    notStartedTasks: tasks.filter(t => t.status === 'not-started').length,
    inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
  };
}

/**
 * Apply filters to tasks
 */
export function applyFilters(tasks: TaskWithStatus[], filters: FilterState): TaskWithStatus[] {
  let filtered = tasks;

  // Package names
  if (filters.packageNames.length > 0) {
    filtered = filtered.filter(t => filters.packageNames.includes(t.package_name));
  }

  // Districts
  if (filters.districts.length > 0) {
    filtered = filtered.filter(t => filters.districts.includes(t.district));
  }

  // Site name search
  if (filters.siteNameSearch.trim()) {
    const search = filters.siteNameSearch.toLowerCase();
    filtered = filtered.filter(t =>
      t.site_name.toLowerCase().includes(search) ||
      t.site_id.toLowerCase().includes(search)
    );
  }

  // Disciplines
  if (filters.disciplines.length > 0) {
    filtered = filtered.filter(t => filters.disciplines.includes(t.discipline));
  }

  // Delay flags
  if (filters.delayFlags.length > 0) {
    filtered = filtered.filter(t =>
      t.delay_flag_calc && filters.delayFlags.includes(t.delay_flag_calc)
    );
  }

  // Date range
  if (filters.dateRangeStart) {
    filtered = filtered.filter(t =>
      t.planned_start && t.planned_start >= filters.dateRangeStart!
    );
  }
  if (filters.dateRangeEnd) {
    filtered = filtered.filter(t =>
      t.planned_finish && t.planned_finish <= filters.dateRangeEnd!
    );
  }

  // Show only delayed
  if (filters.showOnlyDelayed) {
    filtered = filtered.filter(t => t.isDelayed);
  }

  return filtered;
}

/**
 * Get unique values for filter options
 */
export function getFilterOptions(tasks: TaskWithStatus[]) {
  const packageNames = Array.from(new Set(tasks.map(t => t.package_name))).sort();
  const districts = Array.from(new Set(tasks.map(t => t.district))).sort();
  const disciplines = Array.from(new Set(tasks.map(t => t.discipline))).sort();
  const delayFlags = Array.from(
    new Set(tasks.map(t => t.delay_flag_calc).filter((d): d is string => d !== null))
  ).sort();

  return { packageNames, districts, disciplines, delayFlags };
}
