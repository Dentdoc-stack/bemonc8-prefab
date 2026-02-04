import { cn } from '@/lib/utils';
import { AlertCircle, Clock, AlertTriangle, CheckCircle, Camera, XCircle } from 'lucide-react';

type BadgeVariant = 'critical' | 'warning' | 'info' | 'success';

interface IssueBadgeProps {
    variant: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    success: 'bg-green-100 text-green-700 border-green-200',
};

const variantIcons = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Clock,
    success: CheckCircle,
};

export function IssueBadge({ variant, children, className }: IssueBadgeProps) {
    const Icon = variantIcons[variant];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
                variantStyles[variant],
                className
            )}
        >
            <Icon className="h-3 w-3" />
            {children}
        </span>
    );
}

// Specific badge components for common use cases
export function RiskBadge({ riskScore }: { riskScore: number }) {
    if (riskScore >= 40) {
        return <IssueBadge variant="critical">High Risk</IssueBadge>;
    } else if (riskScore >= 20) {
        return <IssueBadge variant="warning">Medium Risk</IssueBadge>;
    }
    return <IssueBadge variant="success">Low Risk</IssueBadge>;
}

export function EvidenceBadge({ evidenceStatus }: { evidenceStatus: string }) {
    if (evidenceStatus === 'before-after') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                <Camera className="h-3 w-3" />
                Complete
            </span>
        );
    } else if (evidenceStatus === 'before-only' || evidenceStatus === 'after-only') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                <Camera className="h-3 w-3" />
                Partial
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <XCircle className="h-3 w-3" />
            None
        </span>
    );
}

export function StaleBadge({ isStale }: { isStale: boolean }) {
    if (!isStale) return null;

    return (
        <IssueBadge variant="warning">
            Stale (&gt;14d)
        </IssueBadge>
    );
}

export function QualityBadge({ flag }: { flag: string | null }) {
    if (!flag) return null;

    if (flag === 'critical') {
        return <IssueBadge variant="critical">Quality Issues</IssueBadge>;
    } else if (flag === 'warning') {
        return <IssueBadge variant="warning">Warnings</IssueBadge>;
    }
    return <IssueBadge variant="info">Info</IssueBadge>;
}
