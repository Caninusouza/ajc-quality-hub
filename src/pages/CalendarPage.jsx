import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import TaskFormDialog from '@/components/tasks/TaskFormDialog';
import ClaimFormDialog from '@/components/claims/ClaimFormDialog';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import RequestManageDialog from '@/components/requests/RequestManageDialog';

const repColors = {
  'Rafael Souza':    { dot: 'bg-blue-400',  pill: 'bg-blue-100 text-blue-800 border-blue-200' },
  'Gabriela Hidalgo':{ dot: 'bg-pink-400',  pill: 'bg-pink-100 text-pink-800 border-pink-200' },
};
const repEmails = {
  'rsouza@ajcgroup.com': 'Rafael Souza',
  'ghidalgo@ajcgroup.com': 'Gabriela Hidalgo',
};

const TYPE_LABELS = { task: 'Task', project: 'Project', timeline: 'Timeline', claim: 'Claim', request: 'Request' };
const TYPE_ICONS  = { task: '✓', project: '◆', timeline: '📍', claim: '⚠', request: '📋' };

function getRepFromItem(item) {
  if (item.fsqa_assignee && repColors[item.fsqa_assignee]) return item.fsqa_assignee;
  if (item.assigned_to && repEmails[item.assigned_to]) return repEmails[item.assigned_to];
  if (item.created_by && repEmails[item.created_by]) return repEmails[item.created_by];
  return null;
}

function getItemColor(item) {
  const rep = getRepFromItem(item);
  return rep ? repColors[rep].pill : 'bg-slate-100 text-slate-700 border-slate-200';
}

function getItemLabel(ev) {
  if (ev._stepLabel) return `${ev.name} — ${ev._stepLabel}`;
  return ev.title || ev.name || '(Untitled)';
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks    = [] } = useQuery({ queryKey: ['tasks'],    queryFn: () => base44.entities.Task.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: claims   = [] } = useQuery({ queryKey: ['claims'],   queryFn: () => base44.entities.Claim.list() });
  const { data: requests = [] } = useQuery({ queryKey: ['requests'], queryFn: () => base44.entities.Request.list() });

  const updateTask    = useMutation({ mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] });    setEditing(null); } });
  const updateProject = useMutation({ mutationFn: ({ id, data }) => base44.entities.Project.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setEditing(null); } });
  const updateClaim   = useMutation({ mutationFn: ({ id, data }) => base44.entities.Claim.update(id, data),   onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['claims'] });   setEditing(null); } });
  const updateRequest = useMutation({ mutationFn: ({ id, data }) => base44.entities.Request.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['requests'] }); setEditing(null); } });

  const eventsMap = {};
  const addEvent = (dateStr, item, type) => {
    if (!dateStr) return;
    if (!eventsMap[dateStr]) eventsMap[dateStr] = [];
    eventsMap[dateStr].push({ ...item, _type: type });
  };

  tasks.forEach(t    => addEvent(t.due_date, t, 'task'));
  claims.forEach(c   => addEvent(c.due_date, c, 'claim'));
  requests.forEach(r => addEvent(r.due_date, r, 'request'));
  projects.forEach(p => {
    addEvent(p.due_date, p, 'project');
    (p.timelines || []).forEach(step => {
      if (step.date) addEvent(step.date, { ...p, _stepLabel: step.label, _stepStatus: step.status }, 'timeline');
    });
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = [];
  let d = gridStart;
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1); }

  const selectedDateStr = selected ? format(selected, 'yyyy-MM-dd') : null;
  const selectedEvents  = selectedDateStr ? (eventsMap[selectedDateStr] || []) : [];

  const openEditor = (ev) => {
    const type = ev._stepLabel ? 'project' : ev._type;
    setEditing({ type, item: ev });
  };

  return (
    <div>
      <PageHeader title="FSQA Calendar" subtitle="Tasks, claims, projects and requests at a glance" />

      <div className="flex gap-4 mb-4 text-xs flex-wrap">
        {Object.entries(repColors).map(([rep, c]) => (
          <span key={rep} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} /> {rep}
          </span>
        ))}
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Unassigned</span>
      </div>

      <div className="bg-card border rounded-xl shadow overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-semibold text-base">{format(currentMonth, 'MMMM yyyy')}</h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 border-b">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dateStr   = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsMap[dateStr] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected     = selected && isSameDay(day, selected);
            const todayDay       = isToday(day);

            return (
              <div
                key={i}
                onClick={() => setSelected(isSameDay(day, selected) ? null : day)}
                className={cn(
                  'min-h-[90px] p-1.5 border-b border-r cursor-pointer transition-colors',
                  !isCurrentMonth && 'bg-muted/30',
                  isSelected && 'bg-accent/40',
                  !isSelected && isCurrentMonth && 'hover:bg-muted/50'
                )}
              >
                <div className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                  todayDay && 'bg-primary text-primary-foreground',
                  !todayDay && !isCurrentMonth && 'text-muted-foreground',
                  !todayDay && isCurrentMonth && 'text-foreground'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev, j) => (
                    <div key={j} className={cn('text-[10px] px-1 py-0.5 rounded border truncate', getItemColor(ev))}>
                      {TYPE_ICONS[ev._stepLabel ? 'timeline' : ev._type]} {getItemLabel(ev)}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="mt-4 bg-card border rounded-xl p-4 shadow">
          <h3 className="font-semibold text-sm mb-3">{format(selected, 'EEEE, MMMM d, yyyy')}</h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items due on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev, i) => {
                const rep  = getRepFromItem(ev);
                const type = ev._stepLabel ? 'timeline' : ev._type;
                return (
                  <button
                    key={i}
                    onClick={() => openEditor(ev)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-lg border text-sm text-left transition-all hover:shadow-md hover:scale-[1.01]',
                      getItemColor(ev)
                    )}
                  >
                    <span className="shrink-0 font-bold">{TYPE_ICONS[type]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{getItemLabel(ev)}</p>
                      <p className="text-xs opacity-70 mt-0.5">
                        {TYPE_LABELS[type]}
                        {rep ? ` · ${rep}` : ''}
                        {ev.status ? ` · ${ev.status.replace(/_/g, ' ')}` : ''}
                        {ev.current_status ? ` · ${ev.current_status}` : ''}
                        {ev._stepStatus ? ` · ${ev._stepStatus}` : ''}
                      </p>
                    </div>
                    <span className="text-xs opacity-50 shrink-0">Click to edit →</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {editing?.type === 'task' && (
        <TaskFormDialog
          open
          onOpenChange={() => setEditing(null)}
          initialData={editing.item}
          projects={projects}
          isSubmitting={updateTask.isPending}
          onSubmit={(data) => updateTask.mutate({ id: editing.item.id, data })}
        />
      )}

      {editing?.type === 'claim' && (
        <ClaimFormDialog
          open
          onOpenChange={() => setEditing(null)}
          initialData={editing.item}
          isSubmitting={updateClaim.isPending}
          onSubmit={(data) => updateClaim.mutate({ id: editing.item.id, data })}
        />
      )}

      {editing?.type === 'project' && (
        <ProjectFormDialog
          open
          onOpenChange={() => setEditing(null)}
          initialData={editing.item}
          isSubmitting={updateProject.isPending}
          onSubmit={(data) => updateProject.mutate({ id: editing.item.id, data })}
        />
      )}

      {editing?.type === 'request' && (
        <RequestManageDialog
          request={editing.item}
          onClose={() => setEditing(null)}
          onSave={(id, data) => updateRequest.mutateAsync({ id, data })}
        />
      )}
    </div>
  );
}