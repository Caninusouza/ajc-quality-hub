import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles = {
  // Claims
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  investigating: 'bg-amber-50 text-amber-700 border-amber-200',
  corrective_action: 'bg-purple-50 text-purple-700 border-purple-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  // Projects
  planning: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  on_hold: 'bg-slate-100 text-slate-600 border-slate-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  // Tasks
  todo: 'bg-slate-100 text-slate-600 border-slate-200',
  review: 'bg-purple-50 text-purple-700 border-purple-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const severityStyles = {
  low: 'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

export default function StatusBadge({ value, type = 'status' }) {
  const styles = type === 'severity' || type === 'priority' ? severityStyles : statusStyles;
  const formatted = (value || '').replace(/_/g, ' ');

  return (
    <Badge variant="outline" className={cn("capitalize text-[11px] font-medium", styles[value] || 'bg-muted text-muted-foreground')}>
      {formatted}
    </Badge>
  );
}