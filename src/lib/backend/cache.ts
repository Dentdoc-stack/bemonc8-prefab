/**
 * Data Cache Layer
 * Manages in-memory cache with 30-minute auto-refresh
 */

import { ingestAllSheets, type IngestedData } from './data-ingestion';
import { CONFIG } from './config';
import type { TaskWithStatus, SiteAggregate, PackageComplianceMap } from '@/types';

class DataCache {
    private data: IngestedData | null = null;
    private refreshTimer: NodeJS.Timeout | null = null;
    private isRefreshing = false;

    /**
     * Initialize cache and start auto-refresh
     */
    async initialize(): Promise<void> {
        console.log('Initializing data cache...');
        await this.refresh();
        this.startAutoRefresh();
    }

    /**
     * Refresh data from Google Sheets
     */
    async refresh(): Promise<IngestedData> {
        if (this.isRefreshing) {
            console.warn('Refresh already in progress, skipping...');
            if (this.data) return this.data;
            // Wait for ongoing refresh
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.data!;
        }

        this.isRefreshing = true;

        try {
            console.log('Refreshing cache from Google Sheets...');
            const newData = await ingestAllSheets();
            this.data = newData;
            console.log(`✅ Cache refreshed successfully at ${newData.lastRefresh.toISOString()}`);
            return newData;
        } catch (error) {
            console.error('❌ Cache refresh failed:', error);
            if (!this.data) {
                throw new Error('Cache refresh failed and no cached data available');
            }
            // Return stale data if refresh fails
            console.warn('Returning stale data due to refresh failure');
            return this.data;
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * Start automatic refresh every 30 minutes
     */
    private startAutoRefresh(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.refreshTimer = setInterval(async () => {
            console.log('Auto-refresh triggered');
            await this.refresh();
        }, CONFIG.cacheIntervalMs);

        console.log(`Auto-refresh enabled (interval: ${CONFIG.cacheIntervalMs / 1000}s)`);
    }

    /**
     * Get all tasks
     */
    getTasks(): TaskWithStatus[] {
        if (!this.data) {
            throw new Error('Cache not initialized');
        }
        return this.data.tasks;
    }

    /**
     * Get all sites
     */
    getSites(): SiteAggregate[] {
        if (!this.data) {
            throw new Error('Cache not initialized');
        }
        return this.data.sites;
    }

    /**
     * Get filtered sites
     */
    getFilteredSites(filters: {
        packageId?: string;
        district?: string;
    }): SiteAggregate[] {
        let sites = this.getSites();

        if (filters.packageId) {
            sites = sites.filter(s => s.package_id === filters.packageId);
        }

        if (filters.district) {
            sites = sites.filter(s => s.district === filters.district);
        }

        return sites;
    }

    /**
     * Get tasks for a specific site
     */
    getTasksBySite(siteUid: string): TaskWithStatus[] {
        return this.getTasks().filter(t => t.site_uid === siteUid);
    }

    /**
     * Get full ingested data
     */
    getData(): IngestedData {
        if (!this.data) {
            throw new Error('Cache not initialized');
        }
        return this.data;
    }

    /**
     * Get package compliance data
     */
    getPackageCompliance(): PackageComplianceMap {
        if (!this.data) {
            throw new Error('Cache not initialized');
        }
        return this.data.packageCompliance;
    }

    /**
     * Check if cache is initialized
     */
    isInitialized(): boolean {
        return this.data !== null;
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('Auto-refresh stopped');
        }
    }
}

// Singleton instance
export const dataCache = new DataCache();
