/**
 * API Route: POST /api/refresh
 * Manually trigger cache refresh
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { dataCache } from '@/lib/backend/cache';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Manual refresh triggered via API');
        const data = await dataCache.refresh();

        return res.status(200).json({
            success: true,
            message: 'Cache refreshed successfully',
            refreshedAt: data.lastRefresh,
            metadata: data._metadata,
        });
    } catch (error) {
        console.error('Error in /api/refresh:', error);
        return res.status(500).json({
            error: 'Failed to refresh cache',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
