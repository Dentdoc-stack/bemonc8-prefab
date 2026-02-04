"use client";

import { useMemo } from 'react';
import { FilterState, TaskWithStatus } from '@/types';
import { X, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface FiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  filterOptions: {
    packageNames: string[];
    districts: string[];
    disciplines: string[];
    delayFlags: string[];
  };
  allTasks: TaskWithStatus[];
  affectedCount: number;
}

export default function Filters({ filters, setFilters, filterOptions, allTasks, affectedCount }: FiltersProps) {
  const availableDistrictSet = useMemo(() => {
    if (filters.packageNames.length === 0) {
      return new Set(filterOptions.districts);
    }
    const tasksInSelectedPackages = allTasks.filter(task => filters.packageNames.includes(task.package_name));
    return new Set(tasksInSelectedPackages.map(t => t.district));
  }, [filters.packageNames, allTasks, filterOptions.districts]);

  const hasActiveFilters =
    filters.packageNames.length > 0 ||
    filters.districts.length > 0 ||
    filters.disciplines.length > 0 ||
    filters.delayFlags.length > 0 ||
    filters.siteNameSearch.trim() !== '' ||
    filters.showOnlyDelayed;

  const clearFilters = () => {
    setFilters({
      packageNames: [],
      districts: [],
      siteNameSearch: '',
      disciplines: [],
      delayFlags: [],
      dateRangeStart: null,
      dateRangeEnd: null,
      showOnlyDelayed: false,
    });
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <div className="text-sm text-muted-foreground">{affectedCount.toLocaleString()} tasks affected</div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
              <X className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        {/* Filter Presets */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2">Quick filters:</span>
          <Button
            variant={filters.showOnlyDelayed ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters({ ...filters, showOnlyDelayed: !filters.showOnlyDelayed })}
            className="h-7 text-xs"
          >
            🔴 Delayed Only
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearFilters();
              // Note: This shows all, which is the default cleared state
            }}
            className="h-7 text-xs"
          >
            📊 All Tasks
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Site Search */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Search Site</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={filters.siteNameSearch}
                onChange={(e) => setFilters({ ...filters, siteNameSearch: e.target.value })}
                placeholder="Site name or ID..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Package Names */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Package ({filters.packageNames.length} selected)</label>
            <div className="border border-input rounded-lg p-2 max-h-32 overflow-y-auto">
              {filterOptions.packageNames.map((pkg) => {
                const id = `pkg-${pkg.replace(/\s+/g, '-')}`;
                const checked = filters.packageNames.includes(pkg);
                return (
                  <div key={pkg} className="flex items-center gap-2 py-1 hover:bg-muted cursor-pointer">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(v) => {
                        const setTo = !!v;
                        const current = filters.packageNames.includes(pkg);
                        const updated = setTo
                          ? current
                            ? filters.packageNames
                            : [...filters.packageNames, pkg]
                          : current
                            ? filters.packageNames.filter((p) => p !== pkg)
                            : filters.packageNames;
                        setFilters({ ...filters, packageNames: updated });
                      }}
                    />
                    <label htmlFor={id} className="text-sm text-foreground">
                      {pkg}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Districts (Cascading from Packages) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              District ({filters.districts.length} selected)
              {filters.packageNames.length > 0 && (
                <span className="ml-1 text-xs text-primary font-normal">(filtered by package)</span>
              )}
            </label>
            <div className="border border-input rounded-lg p-2 max-h-32 overflow-y-auto">
              {filterOptions.districts.map((district) => {
                const id = `district-${district.replace(/\s+/g, '-')}`;
                const checked = filters.districts.includes(district);
                const disabled = filters.packageNames.length > 0 && !availableDistrictSet.has(district);
                return (
                  <div
                    key={district}
                    className={`flex items-center gap-2 py-1 cursor-pointer rounded ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted'}`}
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(v) => {
                        if (disabled) return;
                        const setTo = !!v;
                        const current = filters.districts.includes(district);
                        const updated = setTo
                          ? current
                            ? filters.districts
                            : [...filters.districts, district]
                          : current
                            ? filters.districts.filter((d) => d !== district)
                            : filters.districts;
                        setFilters({ ...filters, districts: updated });
                      }}
                    />
                    <label htmlFor={id} className="text-sm text-foreground">
                      {district}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disciplines */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Discipline ({filters.disciplines.length} selected)</label>
            <div className="border border-input rounded-lg p-2 max-h-32 overflow-y-auto">
              {filterOptions.disciplines.map((discipline) => {
                const id = `discipline-${discipline.replace(/\s+/g, '-')}`;
                const checked = filters.disciplines.includes(discipline);
                return (
                  <div key={discipline} className="flex items-center gap-2 py-1 hover:bg-muted cursor-pointer">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(v) => {
                        const setTo = !!v;
                        const current = filters.disciplines.includes(discipline);
                        const updated = setTo
                          ? current
                            ? filters.disciplines
                            : [...filters.disciplines, discipline]
                          : current
                            ? filters.disciplines.filter((d) => d !== discipline)
                            : filters.disciplines;
                        setFilters({ ...filters, disciplines: updated });
                      }}
                    />
                    <label htmlFor={id} className="text-sm text-foreground">
                      {discipline}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delay Flags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status ({filters.delayFlags.length} selected)</label>
            <div className="border border-input rounded-lg p-2 max-h-32 overflow-y-auto">
              {filterOptions.delayFlags.map((flag) => {
                const id = `flag-${flag.replace(/\s+/g, '-')}`;
                const checked = filters.delayFlags.includes(flag);
                return (
                  <div key={flag} className="flex items-center gap-2 py-1 hover:bg-muted cursor-pointer">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(v) => {
                        const setTo = !!v;
                        const current = filters.delayFlags.includes(flag);
                        const updated = setTo
                          ? current
                            ? filters.delayFlags
                            : [...filters.delayFlags, flag]
                          : current
                            ? filters.delayFlags.filter((f) => f !== flag)
                            : filters.delayFlags;
                        setFilters({ ...filters, delayFlags: updated });
                      }}
                    />
                    <label htmlFor={id} className="text-sm text-foreground">
                      {flag}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Show Only Delayed */}
          <div className="flex items-center">
            <div className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                id="show-only-delayed"
                checked={filters.showOnlyDelayed}
                onCheckedChange={(v) => setFilters({ ...filters, showOnlyDelayed: !!v })}
                className="h-5 w-5"
              />
              <label htmlFor="show-only-delayed" className="text-sm font-medium text-foreground">
                Show only delayed tasks
              </label>
            </div>
          </div>
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {filters.packageNames.map((p) => (
              <span key={`pkg-pill-${p}`} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1">
                Package: {p}
                <button
                  aria-label={`Remove package ${p}`}
                  className="text-primary/80"
                  onClick={() => setFilters({ ...filters, packageNames: filters.packageNames.filter((x) => x !== p) })}
                >
                  ×
                </button>
              </span>
            ))}
            {filters.districts.map((d) => (
              <span key={`dist-pill-${d}`} className="inline-flex items-center gap-1 rounded-full bg-muted text-foreground px-3 py-1">
                District: {d}
                <button
                  aria-label={`Remove district ${d}`}
                  className="text-muted-foreground"
                  onClick={() => setFilters({ ...filters, districts: filters.districts.filter((x) => x !== d) })}
                >
                  ×
                </button>
              </span>
            ))}
            {filters.disciplines.map((d) => (
              <span key={`disc-pill-${d}`} className="inline-flex items-center gap-1 rounded-full bg-muted text-foreground px-3 py-1">
                Discipline: {d}
                <button
                  aria-label={`Remove discipline ${d}`}
                  className="text-muted-foreground"
                  onClick={() => setFilters({ ...filters, disciplines: filters.disciplines.filter((x) => x !== d) })}
                >
                  ×
                </button>
              </span>
            ))}
            {filters.delayFlags.map((d) => (
              <span key={`flag-pill-${d}`} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-3 py-1">
                Status: {d}
                <button
                  aria-label={`Remove status ${d}`}
                  className="text-destructive"
                  onClick={() => setFilters({ ...filters, delayFlags: filters.delayFlags.filter((x) => x !== d) })}
                >
                  ×
                </button>
              </span>
            ))}
            {filters.siteNameSearch.trim() && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 text-accent-foreground px-3 py-1">
                Search: {filters.siteNameSearch}
                <button
                  aria-label="Clear search"
                  className="text-accent-foreground"
                  onClick={() => setFilters({ ...filters, siteNameSearch: '' })}
                >
                  ×
                </button>
              </span>
            )}
            {filters.showOnlyDelayed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-3 py-1">
                Show only delayed
                <button
                  aria-label="Clear show only delayed"
                  className="text-destructive"
                  onClick={() => setFilters({ ...filters, showOnlyDelayed: false })}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
