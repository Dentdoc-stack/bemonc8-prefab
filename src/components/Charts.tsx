'use client';

import { useMemo, useState } from 'react';
import { TaskWithStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartsProps {
  tasks: TaskWithStatus[];
}

// Custom tooltip for Schedule Health chart
interface ScheduleHealthTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: {
      onTrackCount: number;
      delayedCount: number;
      unknownCount: number;
      total: number;
      onTrackPct: number;
      delayedPct: number;
      unknownPct: number;
      bucket: string;
    };
  }>;
  label?: string;
}

const ScheduleHealthTooltip = ({ active, payload, label }: ScheduleHealthTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Get the full row data from the first payload item
  const data = payload[0].payload;

  // Guard: check if there are any sites in this bucket
  if (data.total === 0) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-sm text-gray-500">No sites in this bucket</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
      <p className="font-semibold mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
          <span>On Track: <strong>{data.onTrackCount}</strong> sites ({data.onTrackPct.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
          <span>Delayed: <strong>{data.delayedCount}</strong> sites ({data.delayedPct.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#9ca3af' }} />
          <span>Unknown: <strong>{data.unknownCount}</strong> sites ({data.unknownPct.toFixed(1)}%)</span>
        </div>
        <div className="pt-1 mt-1 border-t border-gray-200">
          <span className="text-gray-600">Total: <strong>{data.total}</strong> sites</span>
        </div>
      </div>
    </div>
  );
};

export default function Charts({ tasks }: ChartsProps) {
  const [delayMode, setDelayMode] = useState<'count' | 'percent'>('count');

  // Schedule Health by Project Stage (SITE-LEVEL, not task-level)
  // 100% stacked bars showing On Track / Delayed / Unknown for each progress bucket
  const scheduleHealthByStage = useMemo(() => {
    // Step 1: Aggregate tasks to site level
    const siteMap = new Map<string, {
      siteKey: string;
      weightedProgress: number;
      delayedTasksCount: number;
      totalTasks: number;
      hasPlannedDates: boolean;
    }>();

    tasks.forEach(task => {
      const existing = siteMap.get(task.siteKey) || {
        siteKey: task.siteKey,
        weightedProgress: 0,
        delayedTasksCount: 0,
        totalTasks: 0,
        hasPlannedDates: false,
      };

      existing.totalTasks += 1;
      if (task.isDelayed) existing.delayedTasksCount += 1;
      if (task.planned_start || task.planned_finish) existing.hasPlannedDates = true;

      siteMap.set(task.siteKey, existing);
    });

    // Step 2: Calculate weighted progress per site (consistent with groupTasksBySite logic)
    for (const [siteKey, site] of siteMap.entries()) {
      const siteTasks = tasks.filter(t => t.siteKey === siteKey);
      let totalWeightedProgress = 0;
      let totalWeight = 0;

      for (const task of siteTasks) {
        const progress = task.progress_pct ?? 0;
        const weight = task.weight || 1;
        totalWeightedProgress += progress * weight;
        totalWeight += weight;
      }

      site.weightedProgress = totalWeight > 0 ? totalWeightedProgress / totalWeight : 0;
    }

    // Step 3: Classify each site by delay status
    // A site is "Delayed" if it has ANY delayed tasks
    // "Unknown" if no planned dates
    // "On Track" otherwise
    const sitesWithStatus = Array.from(siteMap.values()).map(site => ({
      ...site,
      delayStatus: !site.hasPlannedDates
        ? 'Unknown'
        : site.delayedTasksCount > 0
          ? 'Delayed'
          : 'On Track',
    }));

    // Step 4: Bucket sites by progress
    const buckets = {
      '0-25%': { onTrack: 0, delayed: 0, unknown: 0 },
      '26-50%': { onTrack: 0, delayed: 0, unknown: 0 },
      '51-75%': { onTrack: 0, delayed: 0, unknown: 0 },
      '76-99%': { onTrack: 0, delayed: 0, unknown: 0 },
      '100%': { onTrack: 0, delayed: 0, unknown: 0 },
    } as Record<string, { onTrack: number; delayed: number; unknown: number }>;

    sitesWithStatus.forEach(site => {
      const pct = site.weightedProgress;
      const bucket = pct < 26
        ? '0-25%'
        : pct < 51
          ? '26-50%'
          : pct < 76
            ? '51-75%'
            : pct < 100
              ? '76-99%'
              : '100%';

      if (site.delayStatus === 'On Track') buckets[bucket].onTrack += 1;
      else if (site.delayStatus === 'Delayed') buckets[bucket].delayed += 1;
      else buckets[bucket].unknown += 1;
    });

    // Step 5: Convert to normalized percentages + raw counts
    const chartData = Object.entries(buckets).map(([range, counts]) => {
      const total = counts.onTrack + counts.delayed + counts.unknown;
      return {
        bucket: range,
        onTrackCount: counts.onTrack,
        delayedCount: counts.delayed,
        unknownCount: counts.unknown,
        total,
        onTrackPct: total > 0 ? (counts.onTrack / total) * 100 : 0,
        delayedPct: total > 0 ? (counts.delayed / total) * 100 : 0,
        unknownPct: total > 0 ? (counts.unknown / total) * 100 : 0,
      };
    });

    // Step 6: VALIDATION / DEBUG
    const totalUniqueSites = siteMap.size;
    const sumBucketTotals = chartData.reduce((sum, d) => sum + d.total, 0);

    console.log('=== SCHEDULE HEALTH BY STAGE VALIDATION ===');
    console.log(`Total unique sites: ${totalUniqueSites}`);
    console.log(`Sum of bucket totals: ${sumBucketTotals}`);
    console.log(`Match: ${totalUniqueSites === sumBucketTotals ? '✅' : '❌'}`);

    chartData.forEach(d => {
      const countSum = d.onTrackCount + d.delayedCount + d.unknownCount;
      const pctSum = d.onTrackPct + d.delayedPct + d.unknownPct;
      console.log(`${d.bucket}: counts=${countSum}, total=${d.total}, match=${countSum === d.total ? '✅' : '❌'}, pctSum=${pctSum.toFixed(2)}%`);
    });
    console.log('===========================================');

    return chartData;
  }, [tasks]);

  // Geography-aware progress: if one district, show site-level; otherwise show districts (stacked by discipline)
  // Geography-aware progress: if one district, show site-level by discipline; otherwise show districts  
  const geographyProgress = useMemo(() => {
    const districtMap = new Map<string, { totalWeightedProgress: number; totalWeight: number }>();
    const siteMap = new Map<string, { name: string; district: string; totalWeightedProgress: number; totalWeight: number }>();

    // For site-level discipline breakdown
    const siteDisciplineMap = new Map<string, Map<string, { totalWeightedProgress: number; totalWeight: number }>>();

    tasks.forEach(task => {
      const districtAgg = districtMap.get(task.district) || { totalWeightedProgress: 0, totalWeight: 0 };
      const progress = task.progress_pct ?? 0;
      const weight = task.weight || 1;

      districtAgg.totalWeightedProgress += progress * weight;
      districtAgg.totalWeight += weight;
      districtMap.set(task.district, districtAgg);

      const siteAgg = siteMap.get(task.siteKey) || {
        name: task.site_name,
        district: task.district,
        totalWeightedProgress: 0,
        totalWeight: 0,
      };
      siteAgg.totalWeightedProgress += progress * weight;
      siteAgg.totalWeight += weight;
      siteMap.set(task.siteKey, siteAgg);

      // Site-discipline aggregation for grouped bars
      if (!siteDisciplineMap.has(task.siteKey)) {
        siteDisciplineMap.set(task.siteKey, new Map());
      }
      const disciplineMap = siteDisciplineMap.get(task.siteKey)!;
      const disciplineAgg = disciplineMap.get(task.discipline) || { totalWeightedProgress: 0, totalWeight: 0 };
      disciplineAgg.totalWeightedProgress += progress * weight;
      disciplineAgg.totalWeight += weight;
      disciplineMap.set(task.discipline, disciplineAgg);
    });

    const districts = Array.from(districtMap.entries()).map(([district, data]) => ({
      label: district,
      progress: data.totalWeight > 0 ? data.totalWeightedProgress / data.totalWeight : 0,
    }));

    const uniqueDistricts = new Set(tasks.map(t => t.district));
    if (uniqueDistricts.size <= 1) {
      // Get all disciplines for grouped bars
      const allDisciplines = Array.from(new Set(tasks.map(t => t.discipline))).sort();

      // Build grouped bar data for sites
      const siteData = Array.from(siteMap.entries()).map(([siteKey, site]) => {
        const row: Record<string, string | number> = { label: site.name };

        const disciplineMap = siteDisciplineMap.get(siteKey);
        allDisciplines.forEach(discipline => {
          const data = disciplineMap?.get(discipline);
          if (data && data.totalWeight > 0) {
            let progress = data.totalWeightedProgress / data.totalWeight;
            progress = Math.max(0, Math.min(100, progress)); // Clamp 0-100
            row[discipline] = progress;
          } else {
            row[discipline] = 0;
          }
        });

        // Calculate average for sorting
        row._avgProgress = allDisciplines.reduce((sum, d) => sum + ((row[d] as number) || 0), 0) / allDisciplines.length;

        return row;
      }).sort((a, b) => (b._avgProgress as number) - (a._avgProgress as number));

      return {
        mode: 'site' as const,
        label: districts[0]?.label,
        data: siteData,
        disciplines: allDisciplines,
      };
    }

    return {
      mode: 'district' as const,
      label: null as string | null,
      data: districts.sort((a, b) => b.progress - a.progress),
      disciplines: [],
    };
  }, [tasks]);

  // District progress by discipline (GROUPED bars, NOT stacked!)
  // Stacking progress percentages is mathematically invalid (would show 200%+)
  const districtDisciplineProgress = useMemo(() => {
    // Map: district -> discipline -> { totalWeightedProgress, totalWeight }
    const districtDisciplineMap = new Map<string, Map<string, { totalWeightedProgress: number; totalWeight: number }>>();

    tasks.forEach(task => {
      if (!districtDisciplineMap.has(task.district)) {
        districtDisciplineMap.set(task.district, new Map());
      }
      const disciplineMap = districtDisciplineMap.get(task.district)!;

      const disciplineAgg = disciplineMap.get(task.discipline) || { totalWeightedProgress: 0, totalWeight: 0 };

      // FIXED: Treat null progress as 0, don't skip
      const progress = task.progress_pct ?? 0;
      const weight = task.weight || 1;

      disciplineAgg.totalWeightedProgress += progress * weight;
      disciplineAgg.totalWeight += weight;

      disciplineMap.set(task.discipline, disciplineAgg);
    });

    // Get all unique disciplines
    const allDisciplines = Array.from(new Set(tasks.map(t => t.discipline))).sort();

    // Create grouped bar data (each discipline is independent 0-100%)
    const chartData = Array.from(districtDisciplineMap.entries()).map(([district, disciplineMap]) => {
      const row: Record<string, string | number> = { district };

      allDisciplines.forEach(discipline => {
        const data = disciplineMap.get(discipline);
        if (data && data.totalWeight > 0) {
          let progress = data.totalWeightedProgress / data.totalWeight;

          // CRITICAL: Clamp progress to 0-100%
          if (progress > 100) {
            console.error(`ERROR: ${district} - ${discipline} progress > 100% (${progress.toFixed(1)}%). Clamping to 100.`);
            progress = 100;
          }
          if (progress < 0) {
            console.error(`ERROR: ${district} - ${discipline} progress < 0% (${progress.toFixed(1)}%). Clamping to 0.`);
            progress = 0;
          }

          row[discipline] = progress;
        } else {
          row[discipline] = 0;
        }
      });

      return row;
    });

    // Sort by average progress across all disciplines
    chartData.sort((a, b) => {
      const avgA = allDisciplines.reduce((sum, d) => sum + ((a[d] as number) || 0), 0) / allDisciplines.length;
      const avgB = allDisciplines.reduce((sum, d) => sum + ((b[d] as number) || 0), 0) / allDisciplines.length;
      return avgB - avgA;
    });

    return { data: chartData, disciplines: allDisciplines };
  }, [tasks]);

  // Delay flag breakdown (toggle count/percent)
  const delayFlagBreakdown = useMemo(() => {
    const flagMap = new Map<string, number>();

    tasks.forEach(task => {
      const flag = task.delay_flag_calc || 'Unknown';
      flagMap.set(flag, (flagMap.get(flag) || 0) + 1);
    });

    const total = tasks.length || 1;
    return Array.from(flagMap.entries()).map(([name, value]) => ({
      name,
      value,
      percent: (value / total) * 100,
    }));
  }, [tasks]);

  // Status breakdown (5 states)
  const statusBreakdown = useMemo(() => {
    return [
      { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
      { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length },
      { name: 'Not Started', value: tasks.filter(t => t.status === 'not-started').length },
      { name: 'Overdue', value: tasks.filter(t => t.status === 'overdue').length },
      { name: 'Stalled', value: tasks.filter(t => t.status === 'stalled').length },
    ].filter(item => item.value > 0); // Only show non-zero categories
  }, [tasks]);

  // Schedule Performance (Ahead/On Track/At Risk/Delayed)
  const schedulePerformance = useMemo(() => {
    const buckets = {
      ahead: 0,
      'on-track': 0,
      'at-risk': 0,
      delayed: 0,
    };

    // DEBUG: Log tasks without schedule_bucket
    let noScheduleBucket = 0;
    let overdueCount = 0;
    let stalledCount = 0;

    tasks.forEach(task => {
      if (task.schedule_bucket) {
        buckets[task.schedule_bucket]++;
      } else {
        noScheduleBucket++;
      }

      if (task.is_overdue) overdueCount++;
      if (task.status === 'stalled') stalledCount++;
    });

    console.log('=== SCHEDULE PERFORMANCE DEBUG ===');
    console.log(`Total tasks: ${tasks.length}`);
    console.log(`Tasks without schedule_bucket: ${noScheduleBucket}`);
    console.log(`Overdue tasks: ${overdueCount}`);
    console.log(`Stalled tasks: ${stalledCount}`);
    console.log(`Buckets:`, buckets);
    console.log('===================================');

    return [
      { name: 'Ahead', value: buckets.ahead, fill: '#10b981' },
      { name: 'On Track', value: buckets['on-track'], fill: '#3b82f6' },
      { name: 'At Risk', value: buckets['at-risk'], fill: '#f59e0b' },
      { name: 'Delayed', value: buckets.delayed, fill: '#ef4444' },
    ]; // Show all categories even if zero
  }, [tasks]);

  const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899'];
  const STATUS_COLORS = {
    'Completed': '#10b981',
    'In Progress': '#f59e0b',
    'Not Started': '#6b7280',
    'Overdue': '#ef4444',
    'Stalled': '#94a3b8',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Schedule Health by Project Stage (SITE-LEVEL) */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Health by Project Stage</CardTitle>
          <p className="text-sm text-muted-foreground">
            Each bar shows the share of <strong>sites</strong> within that progress stage that are On Track vs Delayed vs Unknown.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scheduleHealthByStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis label={{ value: '% of Sites', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<ScheduleHealthTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} />
              <Legend
                formatter={(value: string) => {
                  if (value === 'onTrackPct') return 'On Track';
                  if (value === 'delayedPct') return 'Delayed';
                  if (value === 'unknownPct') return 'Unknown';
                  return value;
                }}
              />
              <Bar dataKey="onTrackPct" stackId="health" fill="#10b981" name="On Track" />
              <Bar dataKey="delayedPct" stackId="health" fill="#ef4444" name="Delayed" />
              <Bar dataKey="unknownPct" stackId="health" fill="#9ca3af" name="Unknown" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Geography Progress - Stacked by Discipline */}
      <Card>
        <CardHeader>
          <CardTitle>
            {geographyProgress.mode === 'district' ? 'District Progress by Discipline' : `Site Progress — ${geographyProgress.label}`}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {geographyProgress.mode === 'district'
              ? 'Weighted progress by district, stacked by discipline to show contribution breakdown.'
              : 'Ranking of sites within the selected district.'}
          </p>
        </CardHeader>
        <CardContent>
          {geographyProgress.mode === 'district' ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtDisciplineProgress.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="district" />
                <YAxis domain={[0, 100]} label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                {districtDisciplineProgress.disciplines.map((discipline, idx) => (
                  <Bar
                    key={discipline}
                    dataKey={discipline}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(400, geographyProgress.data.length * 40)}>
              <BarChart data={geographyProgress.data} layout="vertical" barSize={30}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="label" type="category" width={140} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                {geographyProgress.disciplines && geographyProgress.disciplines.map((discipline, idx) => (
                  <Bar
                    key={discipline}
                    dataKey={discipline}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusBreakdown.map((entry: { name: string; value: number }, index: number) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Schedule Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Task distribution by schedule health (based on progress vs baseline)</p>
        </CardHeader>
        <CardContent>
          {schedulePerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={schedulePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {schedulePerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No schedule data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delay Flag Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Delay Status Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">Toggle between counts and share of total.</p>
            </div>
            <div className="flex rounded-md border border-border overflow-hidden">
              <Button
                type="button"
                variant={delayMode === 'count' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setDelayMode('count')}
              >
                Count
              </Button>
              <Button
                type="button"
                variant={delayMode === 'percent' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setDelayMode('percent')}
              >
                %
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={delayFlagBreakdown}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, value, percent, ...props }) => {
                  const displayText = delayMode === 'percent'
                    ? `${name}: ${(percent * 100).toFixed(0)}%`
                    : `${name}: ${value}`;

                  // Make DELAYED text red
                  const isDelayed = name.toUpperCase().includes('DELAY') || name.toUpperCase().includes('OVERDUE');

                  return (
                    <text
                      x={props.x}
                      y={props.y}
                      fill={isDelayed ? '#ef4444' : '#000000'}
                      textAnchor={props.x > props.cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      fontSize={14}
                      fontWeight={isDelayed ? 600 : 400}
                    >
                      {displayText}
                    </text>
                  );
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey={delayMode === 'count' ? 'value' : 'percent'}
              >
                {delayFlagBreakdown.map((entry: { name: string; value: number }, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, payload) =>
                  delayMode === 'percent'
                    ? [`${value.toFixed(1)}%`, payload?.name]
                    : [`${value}`, payload?.name]
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
