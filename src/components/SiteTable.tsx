'use client';

import { useState } from 'react';
import { SiteAggregate } from '@/types';
import { formatDate, formatPercent } from '@/lib/utils';
import { ChevronDown, ChevronRight, ExternalLink, Timer, Camera, Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RiskBadge } from './IssueBadge';
import PhotoModal from './PhotoModal';

interface SiteTableProps {
  sites: SiteAggregate[];
}

export default function SiteTable({ sites }: SiteTableProps) {
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [photoModalSite, setPhotoModalSite] = useState<SiteAggregate | null>(null);

  const toggleSite = (siteKey: string) => {
    const newExpanded = new Set(expandedSites);
    if (newExpanded.has(siteKey)) {
      newExpanded.delete(siteKey);
    } else {
      newExpanded.add(siteKey);
    }
    setExpandedSites(newExpanded);
  };

  if (sites.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No sites match the current filters</p>
        </CardContent>
      </Card>
    );
  }

  // Count of visible columns for colSpan
  const COLUMN_COUNT = 6;

  return (
    <Card id="sites-table">
      <CardHeader>
        <CardTitle>Sites & Tasks</CardTitle>
        <CardDescription>{sites.length} sites shown</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Site</TableHead>
                <TableHead className="w-[150px]">Package / District</TableHead>
                <TableHead className="w-[180px]">Progress</TableHead>
                <TableHead className="w-[120px]">Tasks</TableHead>
                <TableHead className="w-[80px]">Risk</TableHead>
                <TableHead className="w-[80px] text-center">Photos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => {
                const isExpanded = expandedSites.has(site.siteKey);
                const photoCount = [
                  site.coverPhotoDirectUrl,
                  ...site.tasks.map(t => t.before_photo_direct_url),
                  ...site.tasks.map(t => t.after_photo_direct_url)
                ].filter(Boolean).length;

                return (
                  <tbody key={site.siteKey}>
                    {/* Compact Site Row */}
                    <TableRow
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleSite(site.siteKey)}
                    >
                      {/* Site Name */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-foreground">{site.site_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{site.site_id}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Package / District (two-line) */}
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-foreground">{site.package_name}</div>
                          <div className="text-xs text-muted-foreground">{site.district}</div>
                        </div>
                      </TableCell>

                      {/* Progress Bar */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-muted rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${site.weightedProgress <= 25
                                ? 'bg-red-500'
                                : site.weightedProgress <= 75
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                }`}
                              style={{ width: `${site.weightedProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-foreground min-w-[45px]">
                            {formatPercent(site.weightedProgress)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Tasks Summary */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600 font-medium">✓{site.completedTasks}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground font-medium">{site.totalTasks}</span>
                          </div>
                          {site.delayedTasks > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="font-medium">{site.delayedTasks} delayed</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Risk Badge */}
                      <TableCell>
                        <RiskBadge riskScore={site.riskScore} />
                      </TableCell>

                      {/* Photos Icon (Clickable) */}
                      <TableCell>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoModalSite(site);
                          }}
                          className="flex items-center justify-center gap-1.5 w-full hover:bg-primary/10 rounded-md py-1 transition-colors"
                          disabled={photoCount === 0}
                        >
                          {photoCount > 0 ? (
                            <>
                              <Camera className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-primary">{photoCount}</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </button>
                      </TableCell>
                    </TableRow>

                    {/* Full-Width Expanded Panel */}
                    {isExpanded && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={COLUMN_COUNT} className="p-0">
                          <div className="px-6 py-5 space-y-5">
                            {/* Site Summary Strip */}
                            <div className="flex items-center justify-between bg-background rounded-lg p-4 border">
                              <div className="flex items-center gap-6">
                                {/* Overall Progress */}
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Overall Progress</div>
                                  <div className="text-2xl font-bold text-foreground">
                                    {formatPercent(site.weightedProgress)}
                                  </div>
                                </div>

                                {/* Task Breakdown */}
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Task Status</div>
                                  <div className="flex gap-3 text-sm">
                                    <span className="text-green-600 font-semibold">✓ {site.completedTasks}</span>
                                    <span className="text-yellow-600 font-semibold">◐ {site.inProgressTasks}</span>
                                    <span className="text-muted-foreground font-semibold">○ {site.notStartedTasks}</span>
                                    {site.delayedTasks > 0 && (
                                      <Badge variant="destructive" className="text-xs">
                                        <Timer className="w-3 h-3 mr-1" />
                                        {site.delayedTasks} delayed
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Last Updated */}
                                {site.maxLastUpdated && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span className="font-medium">{formatDate(site.maxLastUpdated)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Photos & Folder Link */}
                              <div className="flex items-center gap-3">
                                {site.photoFolderUrl && (
                                  <a
                                    href={site.photoFolderUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Open Photo Folder
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Tasks Table (Full Width) */}
                            <div>
                              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                Tasks ({site.totalTasks})
                              </h4>
                              <div className="border rounded-lg overflow-hidden">
                                <Table className="text-sm">
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead className="w-[200px]">Task</TableHead>
                                      <TableHead className="w-[120px]">Discipline</TableHead>
                                      <TableHead className="w-[180px]">Planned Dates</TableHead>
                                      <TableHead className="w-[180px]">Actual Dates</TableHead>
                                      <TableHead className="w-[140px]">Progress</TableHead>
                                      <TableHead className="w-[120px]">Status</TableHead>
                                      <TableHead className="w-[60px] text-center">Before</TableHead>
                                      <TableHead className="w-[60px] text-center">After</TableHead>
                                      <TableHead>Remarks</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {site.tasks.map((task, idx) => (
                                      <TableRow key={idx} className="text-xs hover:bg-muted/30">
                                        {/* Task Name */}
                                        <TableCell className="font-medium">
                                          <div className="max-w-[200px] truncate" title={task.task_name}>
                                            {task.task_name}
                                          </div>
                                        </TableCell>

                                        {/* Discipline */}
                                        <TableCell className="text-muted-foreground">
                                          {task.discipline}
                                        </TableCell>

                                        {/* Planned Dates */}
                                        <TableCell className="text-muted-foreground">
                                          <div className="text-xs whitespace-nowrap">
                                            {formatDate(task.planned_start)} → {formatDate(task.planned_finish)}
                                          </div>
                                        </TableCell>

                                        {/* Actual Dates */}
                                        <TableCell className="text-muted-foreground">
                                          <div className="text-xs whitespace-nowrap">
                                            {formatDate(task.actual_start)} → {formatDate(task.actual_finish)}
                                          </div>
                                        </TableCell>

                                        {/* Progress */}
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-muted rounded-full h-1.5">
                                              <div
                                                className="h-1.5 bg-blue-500 rounded-full"
                                                style={{ width: `${task.progress_pct || 0}%` }}
                                              ></div>
                                            </div>
                                            <span className="text-xs font-medium min-w-[35px]">
                                              {task.progress_pct !== null ? `${task.progress_pct}%` : '—'}
                                            </span>
                                          </div>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                          <Badge
                                            variant={
                                              task.status === 'completed'
                                                ? 'default'
                                                : task.status === 'overdue'
                                                  ? 'destructive'
                                                  : 'secondary'
                                            }
                                            className="text-xs"
                                          >
                                            {task.status}
                                          </Badge>
                                        </TableCell>

                                        {/* Before Photo Link */}
                                        <TableCell className="text-center">
                                          {task.before_photo_direct_url || task.before_photo_share_url ? (
                                            <a
                                              href={task.before_photo_direct_url || task.before_photo_share_url || '#'}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="text-primary hover:underline text-xs font-medium"
                                            >
                                              Open
                                            </a>
                                          ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                          )}
                                        </TableCell>

                                        {/* After Photo Link */}
                                        <TableCell className="text-center">
                                          {task.after_photo_direct_url || task.after_photo_share_url ? (
                                            <a
                                              href={task.after_photo_direct_url || task.after_photo_share_url || '#'}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="text-primary hover:underline text-xs font-medium"
                                            >
                                              Open
                                            </a>
                                          ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                          )}
                                        </TableCell>

                                        {/* Remarks */}
                                        <TableCell className="text-muted-foreground max-w-[200px]">
                                          <div className="truncate" title={task.remarks || ''}>
                                            {task.remarks || '—'}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </tbody>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Photo Modal */}
      <PhotoModal
        isOpen={photoModalSite !== null}
        onClose={() => setPhotoModalSite(null)}
        siteName={photoModalSite?.site_name || ''}
        coverPhoto={photoModalSite?.coverPhotoDirectUrl}
        beforePhoto={photoModalSite?.tasks.find(t => t.before_photo_direct_url)?.before_photo_direct_url}
        afterPhoto={photoModalSite?.tasks.find(t => t.after_photo_direct_url)?.after_photo_direct_url}
        photoFolderUrl={photoModalSite?.photoFolderUrl}
      />
    </Card>
  );
}
