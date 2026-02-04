'use client';

import { TaskWithStatus } from '@/types';
import { AlertTriangle, Clock, AlertCircle, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AlertBannerProps {
    tasks: TaskWithStatus[];
    onFilterClick: (filterType: 'overdue' | 'stale' | 'high-risk' | 'missing-evidence') => void;
}

export default function AlertBanner({ tasks, onFilterClick }: AlertBannerProps) {
    // Calculate alert metrics
    const overdueTasks = tasks.filter(t => t.is_overdue).length;
    const staleTasks = tasks.filter(t => t.stale_update_flag).length;
    const highRiskSites = new Set(
        tasks.filter(t => t.risk_task >= 40).map(t => t.site_uid)
    ).size;
    const missingEvidenceTasks = tasks.filter(t => !t.evidence_compliant_flag).length;

    // Only show banner if there are any issues
    const hasIssues = overdueTasks > 0 || staleTasks > 0 || highRiskSites > 0 || missingEvidenceTasks > 0;

    if (!hasIssues) {
        return null;
    }

    return (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <div className="p-4">
                <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Project Alerts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {overdueTasks > 0 && (
                        <button
                            onClick={() => onFilterClick('overdue')}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200 hover:border-red-400 hover:shadow-md transition-all text-left group"
                        >
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
                                <p className="text-xs text-gray-600 truncate">Overdue Tasks</p>
                            </div>
                        </button>
                    )}

                    {staleTasks > 0 && (
                        <button
                            onClick={() => onFilterClick('stale')}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-400 hover:shadow-md transition-all text-left group"
                        >
                            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200">
                                <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-2xl font-bold text-orange-600">{staleTasks}</p>
                                <p className="text-xs text-gray-600 truncate">Stale Updates (&gt;14 days)</p>
                            </div>
                        </button>
                    )}

                    {highRiskSites > 0 && (
                        <button
                            onClick={() => onFilterClick('high-risk')}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200 hover:border-yellow-400 hover:shadow-md transition-all text-left group"
                        >
                            <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center group-hover:bg-yellow-200">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-2xl font-bold text-yellow-600">{highRiskSites}</p>
                                <p className="text-xs text-gray-600 truncate">High Risk Sites</p>
                            </div>
                        </button>
                    )}

                    {missingEvidenceTasks > 0 && (
                        <button
                            onClick={() => onFilterClick('missing-evidence')}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left group"
                        >
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                                <Camera className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-2xl font-bold text-blue-600">{missingEvidenceTasks}</p>
                                <p className="text-xs text-gray-600 truncate">Missing Evidence</p>
                            </div>
                        </button>
                    )}
                </div>
            </div>
        </Card>
    );
}
