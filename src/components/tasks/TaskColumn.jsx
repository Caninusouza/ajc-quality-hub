import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Clock, User } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const assigneeCardBg = {
  'Rafael Souza': 'bg-blue-50',
  'Gabriela Hidalgo': 'bg-pink-50',
};
const creatorCardBg = {
  'rsouza@ajcgroup.com': 'bg-blue-50',
  'ghidalgo@ajcgroup.com': 'bg-pink-50',
};
const repEmails = {
  'rsouza@ajcgroup.com': 'bg-blue-50',
  'ghidalgo@ajcgroup.com': 'bg-pink-50',
};
const getCardBg = (item) => assigneeCardBg[item.fsqa_assignee] || repEmails[item.assigned_to] || repEmails[item.created_by] || '';

const columnColors = {
  todo: 'border-t-slate-400',
  in_progress: 'border-t-amber-400',
  review: 'border-t-purple-400',
  done: 'border-t-emerald-400',
};

const columnLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export default function TaskColumn({ status, tasks, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="flex flex-col min-w-[260px] flex-1">
      <div className={cn("flex items-center justify-between mb-3 pb-2 border-t-2", columnColors[status])}>
        <div className="flex items-center gap-2 pt-3">
          <h3 className="text-sm font-semibold">{columnLabels[status]}</h3>
          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">{tasks.length}</span>
        </div>
      </div>
      <div className="space-y-2.5 flex-1">
        {tasks.map(task => (
          <Card key={task.id} className={`p-3 hover:shadow-md transition-shadow cursor-default group ${getCardBg(task)}`}>
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-medium leading-snug">{task.title}</h4>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(task)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>}
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge value={task.priority} type="priority" />
              {task.due_date && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {format(new Date(task.due_date), 'MMM d')}
                </span>
              )}
              {task.assigned_to && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <User className="w-3 h-3" />
                  {task.assigned_to.split('@')[0]}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}