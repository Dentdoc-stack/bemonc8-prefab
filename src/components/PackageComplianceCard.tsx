'use client';

import { PackageComplianceMap, PackageCompliance, ComplianceStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion,
  Users,
  FileCheck,
  HardHat,
  AlertTriangle
} from 'lucide-react';

interface PackageComplianceCardProps {
  packageCompliance: PackageComplianceMap;
  selectedPackages: string[];
}

// Map package ID to display name
const PACKAGE_NAMES: Record<string, string> = {
  'FP1': 'BEmONC Package 8 Prefab',
  'FP2': 'Flood Package-2',
  'FP3': 'Flood Package-3',
  'FP4': 'Flood Package-4',
  'FP5': 'Flood Package-5',
};

function getStatusBadge(status: ComplianceStatus) {
  switch (status) {
    case 'COMPLIANT':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Compliant
        </Badge>
      );
    case 'NON_COMPLIANT':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <ShieldAlert className="w-3 h-3 mr-1" />
          Non-Compliant
        </Badge>
      );
    case 'UNKNOWN':
      return (
        <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
          <ShieldQuestion className="w-3 h-3 mr-1" />
          Unknown
        </Badge>
      );
  }
}

function ComplianceDetail({ 
  compliance, 
  packageId 
}: { 
  compliance: PackageCompliance; 
  packageId: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-gray-900">
          {PACKAGE_NAMES[packageId] || packageId}
        </span>
        {getStatusBadge(compliance.status)}
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-gray-600">Staff RFB:</span>
          <span className="font-medium">
            {compliance.no_of_staff_rfb !== null ? compliance.no_of_staff_rfb : '—'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-purple-600" />
          <span className="text-gray-600">CESMPS:</span>
          <span className={`font-medium ${
            compliance.cesmps_submitted === 'Yes' ? 'text-emerald-600' : 
            compliance.cesmps_submitted === 'No' ? 'text-red-600' : 'text-gray-400'
          }`}>
            {compliance.cesmps_submitted || '—'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <HardHat className="w-4 h-4 text-amber-600" />
          <span className="text-gray-600">OHS:</span>
          <span className={`font-medium ${
            compliance.ohs_measures === 'Yes' ? 'text-emerald-600' : 
            compliance.ohs_measures === 'No' ? 'text-red-600' : 'text-gray-400'
          }`}>
            {compliance.ohs_measures || '—'}
          </span>
        </div>
      </div>
      
      {compliance.issues.length > 0 && compliance.status === 'NON_COMPLIANT' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-red-600 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{compliance.issues.join('; ')}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function PackageComplianceCard({ 
  packageCompliance, 
  selectedPackages 
}: PackageComplianceCardProps) {
  const allPackages = Object.keys(packageCompliance);
  
  // Determine which packages to show
  const packagesToShow = selectedPackages.length > 0 
    ? selectedPackages.filter(p => packageCompliance[p])
    : allPackages;

  // Calculate summary counts
  const summary = {
    compliant: 0,
    nonCompliant: 0,
    unknown: 0,
  };

  packagesToShow.forEach(pkgId => {
    const compliance = packageCompliance[pkgId];
    if (compliance) {
      switch (compliance.status) {
        case 'COMPLIANT':
          summary.compliant++;
          break;
        case 'NON_COMPLIANT':
          summary.nonCompliant++;
          break;
        case 'UNKNOWN':
          summary.unknown++;
          break;
      }
    }
  });

  // Check if any selected package is non-compliant
  const hasNonCompliant = packagesToShow.some(
    pkgId => packageCompliance[pkgId]?.status === 'NON_COMPLIANT'
  );

  return (
    <div className="mb-6">
      {/* Warning banner for non-compliant packages */}
      {hasNonCompliant && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-600" />
              <div>
                <h4 className="font-semibold text-red-800">Compliance Warning</h4>
                <p className="text-sm text-red-700">
                  {summary.nonCompliant} package{summary.nonCompliant > 1 ? 's' : ''} {summary.nonCompliant > 1 ? 'have' : 'has'} compliance issues that require attention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Package Compliance
            </CardTitle>
            
            {/* Summary badges */}
            <div className="flex items-center gap-2">
              {summary.compliant > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {summary.compliant} Compliant
                </Badge>
              )}
              {summary.nonCompliant > 0 && (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                  {summary.nonCompliant} Non-Compliant
                </Badge>
              )}
              {summary.unknown > 0 && (
                <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
                  {summary.unknown} Unknown
                </Badge>
              )}
            </div>
          </div>
          {selectedPackages.length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing all packages. Use filters to view specific packages.
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packagesToShow.map(pkgId => (
              <ComplianceDetail
                key={pkgId}
                packageId={pkgId}
                compliance={packageCompliance[pkgId]}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
