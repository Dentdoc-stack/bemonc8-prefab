'use client';

import { useState, useEffect } from 'react';
import { TaskWithStatus, PackageComplianceMap } from '@/types';
import { fetchAllGoogleSheets } from '@/lib/googleSheetsFetcher';
import Dashboard from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function Home() {
  const [tasks, setTasks] = useState<TaskWithStatus[] | null>(null);
  const [packageCompliance, setPackageCompliance] = useState<PackageComplianceMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      console.log('Loading data from Google Sheets...');
      
      // Fetch tasks and compliance data in parallel
      const [fetchedTasks, complianceResponse] = await Promise.all([
        fetchAllGoogleSheets(),
        fetch('/api/compliance').then(res => res.ok ? res.json() : null).catch(() => null),
      ]);

      setTasks(fetchedTasks);
      setLastRefresh(new Date());
      setError(null);

      // Set compliance data if available
      if (complianceResponse?.packageCompliance) {
        setPackageCompliance(complianceResponse.packageCompliance);
        console.log('✅ Compliance data loaded:', complianceResponse.summary);
      } else {
        console.warn('⚠️ Compliance data not available');
        setPackageCompliance(null);
      }

      console.log(`✅ Successfully loaded ${fetchedTasks.length} tasks`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('❌ Error loading data:', errorMsg);
      setError(`Failed to load data from Google Sheets: ${errorMsg}`);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Initial load on mount
  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Data...</h2>
          <p className="text-gray-600">Fetching from 1 Google Sheet</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few seconds...</p>
        </div>
      </main>
    );
  }

  if (error && !tasks) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">Error Loading Data</h2>
          <p className="text-gray-600 mb-4 text-center">{error}</p>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Make sure the Google Sheets are shared with &quot;Anyone with the link&quot;
            and have a tab named &quot;Data_Entry&quot;.
          </p>
          <Button onClick={() => loadData().finally(() => setLoading(false))} className="w-full">
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  if (tasks) {
    return (
      <div>
        {/* Top status bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700">
                <strong>{tasks.length} tasks</strong> loaded from <strong>1 Google Sheet</strong>
                {lastRefresh && (
                  <span className="text-gray-500 ml-2">
                    (Last updated: {lastRefresh.toLocaleTimeString()})
                  </span>
                )}
              </span>
            </div>
            <Button
              onClick={handleManualRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        <Dashboard tasks={tasks} packageCompliance={packageCompliance} onReset={() => { }} />
      </div>
    );
  }

  return null;
}
