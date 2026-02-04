/**
 * API Route: GET /api/tasks
 * Returns task-level data, optionally filtered by site_uid
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

        const { site_uid } = req.query;

        let tasks;
        if (site_uid) {
            tasks = dataCache.getTasksBySite(site_uid as string);
        } else {
            tasks = dataCache.getTasks();
        }

        return res.status(200).json({
            success: true,
            data: tasks,
            count: tasks.length,
            filters: {
                site_uid: site_uid || null,
            },
            lastRefresh: dataCache.getData().lastRefresh,
        });
    } catch (error) {
        console.error('Error in /api/tasks:', error);
        return res.status(500).json({
            error: 'Failed to fetch tasks',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
