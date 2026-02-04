/**
 * API Route: GET /api/summary
 * Returns aggregated KPIs and chart data with integrity assertions
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { dataCache } from '@/lib/backend/cache';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Initialize cache if not already done
        if (!dataCache.isInitialized()) {
            await dataCache.initialize();
        }

        const data = dataCache.getData();
        const sites = data.sites;

        // Compute delay status breakdown (SITE-LEVEL)
        const delayStatusBreakdown = {
            onTrack: 0,
            delayed: 0,
            unknown: 0,
        };

        sites.forEach(site => {
            if (site.delayedTasks > 0) {
                delayStatusBreakdown.delayed += 1;
            } else if (site.tasks.some(t => t.planned_start || t.planned_finish)) {
                delayStatusBreakdown.onTrack += 1;
            } else {
                delayStatusBreakdown.unknown += 1;
            }
        });

        // Compute schedule health by stage (matching frontend)
        const scheduleHealthByStage = [
            { bucket: '0-25%', onTrack: 0, delayed: 0, unknown: 0 },
            { bucket: '26-50%', onTrack: 0, delayed: 0, unknown: 0 },
            { bucket: '51-75%', onTrack: 0, delayed: 0, unknown: 0 },
            { bucket: '76-99%', onTrack: 0, delayed: 0, unknown: 0 },
            { bucket: '100%', onTrack: 0, delayed: 0, unknown: 0 },
        ];

        sites.forEach(site => {
            const pct = site.weightedProgress;
            const bucketIndex = pct < 26 ? 0 : pct < 51 ? 1 : pct < 76 ? 2 : pct < 100 ? 3 : 4;
            const bucket = scheduleHealthByStage[bucketIndex];

            if (site.delayedTasks > 0) {
                bucket.delayed += 1;
            } else if (site.tasks.some(t => t.planned_start || t.planned_finish)) {
                bucket.onTrack += 1;
            } else {
                bucket.unknown += 1;
            }
        });

        // Assertions
        const delaySum = delayStatusBreakdown.onTrack + delayStatusBreakdown.delayed + delayStatusBreakdown.unknown;
        const scheduleSum = scheduleHealthByStage.reduce((sum, b) => sum + b.onTrack + b.delayed + b.unknown, 0);

        const assertions = {
            delayBreakdownMatchesSites: delaySum === sites.length,
            scheduleHealthMatchesSites: scheduleSum === sites.length,
            delaySum,
            scheduleSum,
            totalSites: sites.length,
        };

        if (!assertions.delayBreakdownMatchesSites || !assertions.scheduleHealthMatchesSites) {
            console.error('❌ ASSERTION FAILED:', assertions);
        }

        return res.status(200).json({
            success: true,
            kpis: data.kpis,
            packageCompliance: data.packageCompliance,
            delayStatusBreakdown,
            scheduleHealthByStage,
            _assertions: assertions,
            _metadata: data._metadata,
            lastRefresh: data.lastRefresh,
        });
    } catch (error) {
        console.error('Error in /api/summary:', error);
        return res.status(500).json({
            error: 'Failed to fetch summary',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
