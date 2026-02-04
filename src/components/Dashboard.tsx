'use client';

import { useMemo, useState, useCallback } from 'react';
import { TaskWithStatus, FilterState, PackageComplianceMap } from '@/types';
import {
  groupTasksBySite,
  computeKPIs,
  applyFilters,
  getFilterOptions
} from '@/lib/dataProcessor';
import KPICards from './KPICards';
import Filters from './Filters';
import Charts from './Charts';
import SiteTable from './SiteTable';
import AlertBanner from './AlertBanner';
import GlobalSearch from './GlobalSearch';
import PackageComplianceCard from './PackageComplianceCard';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardProps {
  tasks: TaskWithStatus[];
  packageCompliance?: PackageComplianceMap | null;
  onReset: () => void;
}

export default function Dashboard({ tasks, packageCompliance, onReset }: DashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    packageNames: [],
    districts: [],
    siteNameSearch: '',
    disciplines: [],
    delayFlags: [],
    dateRangeStart: null,
    dateRangeEnd: null,
    showOnlyDelayed: false,
  });

  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  // Handle quick filter clicks from AlertBanner
  const handleQuickFilter = (filterType: 'overdue' | 'stale' | 'high-risk' | 'missing-evidence') => {
    setQuickFilter(filterType);
  };

  // Clear quick filter
  const clearQuickFilter = () => {
    setQuickFilter(null);
  };

  // Handle search result selection
  const handleSearchSelect = useCallback((task: TaskWithStatus) => {
    // Filter to show only the selected site
    setFilters(prev => ({
      ...prev,
      siteNameSearch: task.site_name,
    }));
    // Scroll to sites table
    setTimeout(() => {
      document.getElementById('sites-table')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Compute filtered data
  const baseFilteredTasks = useMemo(() => applyFilters(tasks, filters), [tasks, filters]);

  // Apply quick filter on top of base filters
  const filteredTasks = useMemo(() => {
    if (!quickFilter) return baseFilteredTasks;

    switch (quickFilter) {
      case 'overdue':
        return baseFilteredTasks.filter(t => t.is_overdue);
      case 'stale':
        return baseFilteredTasks.filter(t => t.stale_update_flag);
      case 'high-risk':
        return baseFilteredTasks.filter(t => t.risk_task >= 40);
      case 'missing-evidence':
        return baseFilteredTasks.filter(t => !t.evidence_compliant_flag);
      default:
        return baseFilteredTasks;
    }
  }, [baseFilteredTasks, quickFilter]);

  // CRITICAL FIX: Aggregate ALL tasks to sites FIRST, then filter the sites
  // This ensures site progress is always calculated from all tasks, not just filtered subset
  const allSites = useMemo(() => groupTasksBySite(tasks), [tasks]);

  const sites = useMemo(() => {
    // Filter sites based on which tasks match the filters
    const filteredSiteKeys = new Set(filteredTasks.map(t => t.siteKey));

    const filtered = allSites.filter(site => filteredSiteKeys.has(site.siteKey));

    return [...filtered].sort((a, b) => {
      if (b.delayedTasks !== a.delayedTasks) return b.delayedTasks - a.delayedTasks;
      return a.weightedProgress - b.weightedProgress;
    });
  }, [allSites, filteredTasks]);

  const kpis = useMemo(() => computeKPIs(filteredTasks), [filteredTasks]);
  const filterOptions = useMemo(() => getFilterOptions(tasks), [tasks]);

  const lastUpdated = useMemo(() => {
    const dates = filteredTasks
      .map(t => t.last_updated)
      .filter((d): d is Date => d !== null)
      .map(d => d.getTime());
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates));
  }, [filteredTasks]);

  const attentionItems = useMemo(() => {
    const topDelayed = [...sites]
      .filter(s => s.delayedTasks > 0)
      .slice(0, 3)
      .map(s => `${s.site_name} (${s.delayedTasks} delayed)`);
    const zeroProgressAfterStart = [...sites]
      .filter(s => s.weightedProgress === 0 && s.maxPlannedFinish)
      .slice(0, 3)
      .map(s => `${s.site_name}`);
    return { topDelayed, zeroProgressAfterStart };
  }, [sites]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                📊 Project Progress Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {tasks.length} tasks loaded across {kpis.totalSites} sites
              </p>
            </div>
            <div className="flex items-center gap-2">
              <GlobalSearch tasks={tasks} onSelectResult={handleSearchSelect} />
              <Button onClick={onReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Upload New File
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* KPI Cards */}
        <KPICards kpis={kpis} />

        {/* Package Compliance Card */}
        {packageCompliance && (
          <PackageComplianceCard
            packageCompliance={packageCompliance}
            selectedPackages={filters.packageNames}
          />
        )}

        {/* Alert Banner */}
        <AlertBanner tasks={tasks} onFilterClick={handleQuickFilter} />

        {/* Quick Filter Indicator */}
        {quickFilter && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing: <strong>{quickFilter.replace('-', ' ').toUpperCase()}</strong> tasks
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={clearQuickFilter}
            >
              Clear Filter
            </Button>
          </div>
        )}

        {/* Filters */}
        <Filters
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          allTasks={tasks}
          affectedCount={filteredTasks.length}
        />

        {lastUpdated && (
          <p className="text-xs text-muted-foreground mb-4">Last updated on: {lastUpdated.toLocaleDateString()}</p>
        )}

        {/* Charts */}
        <Charts tasks={filteredTasks} />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Attention Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-foreground">
            <div>
              <span className="font-semibold">Top delayed sites:</span>{' '}
              {attentionItems.topDelayed.length > 0 ? attentionItems.topDelayed.join(', ') : 'None'}
            </div>
            <div>
              <span className="font-semibold">0% progress after planned start:</span>{' '}
              {attentionItems.zeroProgressAfterStart.length > 0 ? attentionItems.zeroProgressAfterStart.join(', ') : 'None'}
            </div>
            <div className="pt-2">
              <a href="#sites-table" className="text-primary hover:underline">Jump to sites table</a>
            </div>
          </CardContent>
        </Card>

        {/* Sites Table */}
        <SiteTable sites={sites} />
      </div>
    </div>
  );
}
