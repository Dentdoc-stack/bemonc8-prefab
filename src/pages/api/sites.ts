/**
 * API Route: GET /api/sites
 * Returns site-level aggregated data with optional filtering
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

        // Get query parameters
        const { package: packageId, district } = req.query;

        // Get filtered sites
        const sites = dataCache.getFilteredSites({
            packageId: packageId as string | undefined,
            district: district as string | undefined,
        });

        return res.status(200).json({
            success: true,
            data: sites,
            count: sites.length,
            filters: {
                package: packageId || null,
                district: district || null,
            },
            lastRefresh: dataCache.getData().lastRefresh,
        });
    } catch (error) {
        console.error('Error in /api/sites:', error);
        return res.status(500).json({
            error: 'Failed to fetch sites',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
