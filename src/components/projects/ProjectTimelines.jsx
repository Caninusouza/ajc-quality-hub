import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_LABELS = ['Initiation', 'Planning', 'Execution', 'Closure'];

const statusIcon = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
};

const statusColor = {
  pending: 'text-muted-foreground',
  in_progress: 'text-amber-500',
  completed: 'text-emerald-500',
};

export default function ProjectTimelines({ timelines = [], onChange }) {
  const steps = Array.from({ length: 4 }, (_, i) => ({
    step: i + 1,
    label: DEFAULT_LABELS[i],
    description: '',
    date: '',
    status: 'pending',
    ...(timelines[i] || {}),
  }));

  const update = (i, field, value) => {
    const next = steps.map((s, idx) => idx === i ? { ...s, [field]: value } : s);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const Icon = statusIcon[step.status] || Circle;
        return (
          <div key={i} className="border rounded-xl p-4 space-y-3 bg-muted/20">
            <div className="flex items-center gap-3">
              <Icon className={cn('w-5 h-5 shrink-0', statusColor[step.status])} />
              <Input
                value={step.label}
                onChange={e => update(i, 'label', e.target.value)}
                className="font-semibold h-8 text-sm bg-transparent border-0 border-b rounded-none px-0 focus-visible:ring-0"
                placeholder={`Step ${i + 1} label`}
              />
              <span className="text-xs text-muted-foreground shrink-0">Step {i + 1}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-8">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <Input type="date" value={step.date} onChange={e => update(i, 'date', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <Select value={step.status} onValueChange={v => update(i, 'status', v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  value={step.description}
                  onChange={e => update(i, 'description', e.target.value)}
                  placeholder="Notes / deliverables..."
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}