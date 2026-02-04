'use client';

import { DashboardKPIs } from '@/types';
import { formatPercent } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  PauseCircle,
  TrendingUp,
  Info,
  Target,
  ShieldCheck
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

interface KPICardsProps {
  kpis: DashboardKPIs;
}

type CardItem = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: string;
  tooltip?: string;
};

export default function KPICards({ kpis }: KPICardsProps) {
  const outcomeCards: CardItem[] = [
    {
      label: 'Overall Weighted Progress',
      value: formatPercent(kpis.overallWeightedProgress),
      icon: TrendingUp,
      tone: 'primary',
      tooltip:
        'Weighted by planned duration of tasks with reported progress. Tasks without progress are excluded from the denominator.',
    },
    {
      label: 'Sites with ≥1 Completed Task',
      value: kpis.sitesWithCompleted,
      icon: Target,
      tone: 'accent',
      tooltip: 'Count of sites that have at least one completed task.',
    },
    {
      label: 'Sites Fully Completed',
      value: kpis.sitesFullyCompleted,
      icon: ShieldCheck,
      tone: 'success',
      tooltip: 'Sites where 100% of tasks are completed.',
    },
  ];

  const executionCards: CardItem[] = [
    {
      label: 'Total Tasks',
      value: kpis.totalTasks,
      icon: MapPin,
      tone: 'muted',
    },
    {
      label: 'Completed',
      value: kpis.completedTasks,
      icon: CheckCircle,
      tone: 'success-subtle',
    },
    {
      label: 'In Progress',
      value: kpis.inProgressTasks,
      icon: Clock,
      tone: 'amber',
    },
    {
      label: 'Not Started',
      value: kpis.notStartedTasks,
      icon: PauseCircle,
      tone: 'muted-strong',
    },
    {
      label: 'Delayed',
      value: kpis.delayedTasks,
      icon: AlertCircle,
      tone: 'destructive-strong',
    },
  ];

  const toneClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/20 text-accent-foreground',
    'success-subtle': 'bg-emerald-50 text-emerald-700',
    success: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    'muted-strong': 'bg-muted text-foreground/70',
    destructive: 'bg-destructive/20 text-destructive',
    'destructive-strong': 'bg-destructive/15 text-destructive',
    muted: 'bg-muted text-muted-foreground',
  };

  const renderRow = (cards: CardItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const tone = toneClasses[card.tone] || toneClasses.muted;
        return (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {card.tooltip && (
                  <Info
                    className="w-4 h-4 text-muted-foreground"
                    aria-label={card.tooltip}
                  />
                )}
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">
                {card.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {card.label}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">Outcome KPIs</h3>
      </div>
      {renderRow(outcomeCards)}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">Execution KPIs</h3>
      </div>
      {renderRow(executionCards)}
    </div>
  );
}
