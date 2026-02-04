/**
 * API Route: GET /api/compliance
 * Returns package-level compliance data for all flood packages
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { dataCache } from '@/lib/backend/cache';
import type { PackageComplianceMap, ComplianceStatus } from '@/types';

interface ComplianceResponse {
    success: boolean;
    packageCompliance: PackageComplianceMap;
    summary: {
        compliant: number;
        nonCompliant: number;
        unknown: number;
        total: number;
    };
    lastRefresh: Date;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ComplianceResponse | { error: string; message?: string }>
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
        const packageCompliance = data.packageCompliance;

        // Compute summary counts
        const entries = Object.values(packageCompliance);
        const summary = {
            compliant: entries.filter(c => c.status === 'COMPLIANT').length,
            nonCompliant: entries.filter(c => c.status === 'NON_COMPLIANT').length,
            unknown: entries.filter(c => c.status === 'UNKNOWN').length,
            total: entries.length,
        };

        return res.status(200).json({
            success: true,
            packageCompliance,
            summary,
            lastRefresh: data.lastRefresh,
        });
    } catch (error) {
        console.error('Error in /api/compliance:', error);
        return res.status(500).json({
            error: 'Failed to fetch compliance data',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
