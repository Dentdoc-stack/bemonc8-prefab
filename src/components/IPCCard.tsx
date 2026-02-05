'use client';

import { IPCData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface IPCCardProps {
  ipcData: IPCData;
}

export default function IPCCard({ ipcData }: IPCCardProps) {
  if (!ipcData || !ipcData.records || ipcData.records.length === 0) {
    return null;
  }

  console.log('[IPCCard] Received ipcData:', ipcData);
  console.log('[IPCCard] Records count:', ipcData.records.length);

  // Count records by status
  const statusCounts = {
    'released': ipcData.records.filter(r => r.status === 'released').length,
    'in process': ipcData.records.filter(r => r.status === 'in process').length,
    'submitted': ipcData.records.filter(r => r.status === 'submitted').length,
    'not submitted': ipcData.records.filter(r => r.status === 'not submitted').length,
  };

  // Get status badge variant and color
  const getStatusStyles = (status: string | null) => {
    switch (status) {
      case 'released':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'in process':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'submitted':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'not submitted':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <Card id="ipc-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Interim Payment Certificates (IPC)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Payment certificate status tracking</p>
          </div>
          <div className="text-right text-sm">
            {statusCounts['released'] > 0 && (
              <div className="text-emerald-700">✓ {statusCounts['released']} Released</div>
            )}
            {statusCounts['in process'] > 0 && (
              <div className="text-blue-700">◍ {statusCounts['in process']} In Process</div>
            )}
            {statusCounts['submitted'] > 0 && (
              <div className="text-amber-700">→ {statusCounts['submitted']} Submitted</div>
            )}
            {statusCounts['not submitted'] > 0 && (
              <div className="text-red-700">✕ {statusCounts['not submitted']} Not Submitted</div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ipcData.records.map((record) => (
            <div
              key={record.ipcNumber}
              className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center text-center ${getStatusStyles(record.status)}`}
            >
              <div className="font-bold text-lg">{record.ipcNumber}</div>
              <Badge
                variant="outline"
                className={`mt-2 text-xs capitalize ${getStatusStyles(record.status)}`}
              >
                {record.status || 'Unknown'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
