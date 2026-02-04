'use client';

import { useMemo, useState } from 'react';
import { TaskWithStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface TimelineViewProps {
    tasks: TaskWithStatus[];
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
    'completed': '#10b981',
    'in-progress': '#f59e0b',
    'not-started': '#6b7280',
    'overdue': '#ef4444',
    'stalled': '#94a3b8',
};

// Discipline colors
const DISCIPLINE_COLORS: Record<string, string> = {
    'Civil': '#3b82f6',
    'Electrical': '#f59e0b',
    'Plumbing': '#10b981',
    'General': '#8b5cf6',
    'Structural': '#ec4899',
};

export default function TimelineView({ tasks }: TimelineViewProps) {
    const [colorBy, setColorBy] = useState<'status' | 'discipline'>('status');
    const [monthOffset, setMonthOffset] = useState(0);

    // Calculate date range
    const { minDate } = useMemo(() => {
        const dates: number[] = [];
        tasks.forEach(task => {
            if (task.planned_start) dates.push(new Date(task.planned_start).getTime());
            if (task.planned_finish) dates.push(new Date(task.planned_finish).getTime());
        });

        if (dates.length === 0) {
            const now = new Date();
            return {
                minDate: now,
                monthsToShow: 3,
            };
        }

        const min = new Date(Math.min(...dates));
        const max = new Date(Math.max(...dates));
        const months = Math.ceil((max.getTime() - min.getTime()) / (30 * 24 * 60 * 60 * 1000)) + 1;

        return { minDate: min, monthsToShow: Math.max(3, Math.min(12, months)) };
    }, [tasks]);

    // Calculate visible month range
    const visibleMonths = useMemo(() => {
        const months: { label: string; start: Date; end: Date }[] = [];
        const start = new Date(minDate);
        start.setMonth(start.getMonth() + monthOffset);
        start.setDate(1);

        for (let i = 0; i < 4; i++) {
            const monthStart = new Date(start);
            monthStart.setMonth(monthStart.getMonth() + i);
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);

            months.push({
                label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                start: monthStart,
                end: monthEnd,
            });
        }

        return months;
    }, [minDate, monthOffset]);

    const timelineStart = visibleMonths[0]?.start.getTime() || Date.now();
    const timelineEnd = visibleMonths[visibleMonths.length - 1]?.end.getTime() || Date.now();
    const timelineRange = timelineEnd - timelineStart;

    // Group tasks by site
    const siteGroups = useMemo(() => {
        const groups = new Map<string, TaskWithStatus[]>();
        tasks.forEach(task => {
            const key = task.site_uid || task.siteKey;
            const existing = groups.get(key) || [];
            existing.push(task);
            groups.set(key, existing);
        });

        // Sort by site name and limit to first 20 sites for performance
        return Array.from(groups.entries())
            .map(([key, siteTasks]) => ({
                siteKey: key,
                siteName: siteTasks[0]?.site_name || key,
                district: siteTasks[0]?.district || '',
                tasks: siteTasks.slice(0, 10), // Limit tasks per site
            }))
            .slice(0, 20);
    }, [tasks]);

    const getBarPosition = (start: Date | null, finish: Date | null) => {
        if (!start || !finish) return null;

        const startTime = new Date(start).getTime();
        const endTime = new Date(finish).getTime();

        // Check if bar is visible in current view
        if (endTime < timelineStart || startTime > timelineEnd) return null;

        const left = Math.max(0, ((startTime - timelineStart) / timelineRange) * 100);
        const right = Math.min(100, ((endTime - timelineStart) / timelineRange) * 100);
        const width = right - left;

        if (width <= 0) return null;

        return { left: `${left}%`, width: `${width}%` };
    };

    const getBarColor = (task: TaskWithStatus) => {
        if (colorBy === 'status') {
            return STATUS_COLORS[task.status] || '#6b7280';
        }
        return DISCIPLINE_COLORS[task.discipline] || '#6b7280';
    };

    if (tasks.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No tasks to display in timeline</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-8">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <CardTitle>Project Timeline</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Color by toggle */}
                        <div className="flex items-center gap-1 mr-4">
                            <span className="text-sm text-muted-foreground">Color by:</span>
                            <Button
                                variant={colorBy === 'status' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setColorBy('status')}
                            >
                                Status
                            </Button>
                            <Button
                                variant={colorBy === 'discipline' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setColorBy('discipline')}
                            >
                                Discipline
                            </Button>
                        </div>

                        {/* Month navigation */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMonthOffset(prev => prev - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMonthOffset(prev => prev + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs">
                    {colorBy === 'status' ? (
                        Object.entries(STATUS_COLORS).map(([status, color]) => (
                            <div key={status} className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                                <span className="capitalize">{status.replace('-', ' ')}</span>
                            </div>
                        ))
                    ) : (
                        Object.entries(DISCIPLINE_COLORS).map(([discipline, color]) => (
                            <div key={discipline} className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                                <span>{discipline}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Timeline Header (Months) */}
                <div className="flex border-b border-border">
                    <div className="w-48 flex-shrink-0 p-2 font-medium text-sm">Site</div>
                    <div className="flex-1 flex">
                        {visibleMonths.map((month, i) => (
                            <div
                                key={i}
                                className="flex-1 text-center text-sm font-medium p-2 border-l border-border"
                            >
                                {month.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Today marker position */}
                {(() => {
                    const today = Date.now();
                    if (today >= timelineStart && today <= timelineEnd) {
                        const position = ((today - timelineStart) / timelineRange) * 100;
                        return (
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                                style={{ left: `calc(12rem + ${position}%)`, marginLeft: '-1px' }}
                            />
                        );
                    }
                    return null;
                })()}

                {/* Timeline Rows */}
                <div className="max-h-[500px] overflow-y-auto">
                    {siteGroups.map((group) => (
                        <div key={group.siteKey} className="flex border-b border-border hover:bg-muted/30">
                            {/* Site name column */}
                            <div className="w-48 flex-shrink-0 p-2">
                                <div className="text-sm font-medium truncate" title={group.siteName}>
                                    {group.siteName}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {group.district}
                                </div>
                            </div>

                            {/* Timeline bars */}
                            <div className="flex-1 relative h-16">
                                {/* Month grid lines */}
                                <div className="absolute inset-0 flex">
                                    {visibleMonths.map((_, i) => (
                                        <div key={i} className="flex-1 border-l border-border/50" />
                                    ))}
                                </div>

                                {/* Task bars */}
                                {group.tasks.map((task, idx) => {
                                    const pos = getBarPosition(task.planned_start, task.planned_finish);
                                    if (!pos) return null;

                                    return (
                                        <div
                                            key={idx}
                                            className="absolute h-5 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                                            style={{
                                                left: pos.left,
                                                width: pos.width,
                                                top: `${4 + (idx % 3) * 18}px`,
                                                backgroundColor: getBarColor(task),
                                                minWidth: '4px',
                                            }}
                                            title={`${task.task_name}\n${task.discipline} | ${task.status}\nProgress: ${task.progress_pct || 0}%`}
                                        >
                                            {/* Progress indicator */}
                                            <div
                                                className="h-full rounded-sm bg-black/20"
                                                style={{ width: `${task.progress_pct || 0}%` }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 text-xs text-muted-foreground text-center">
                    Showing {siteGroups.length} of {new Set(tasks.map(t => t.site_uid || t.siteKey)).size} sites
                    ({tasks.length} total tasks)
                </div>
            </CardContent>
        </Card>
    );
}
