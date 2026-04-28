import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CheckSquare, LayoutGrid, List } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import TaskFormDialog from '@/components/tasks/TaskFormDialog';
import TaskColumn from '@/components/tasks/TaskColumn';
import ReminderButton from '@/components/shared/ReminderButton';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [view, setView] = useState('board');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-created_date') });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setDialogOpen(false); toast.success('Task created'); }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setDialogOpen(false); setEditingTask(null); toast.success('Task updated'); }
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task deleted'); }
  });

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const handleSubmit = (data) => {
    if (editingTask) updateMutation.mutate({ id: editingTask.id, data });
    else createMutation.mutate(data);
  };
  const handleEdit = (task) => { setEditingTask(task); setDialogOpen(true); };
  const handleDelete = (id) => deleteMutation.mutate(id);

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Manage and track your tasks" actionLabel="New Task" onAction={() => { setEditingTask(null); setDialogOpen(true); }}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-40" />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {['low', 'medium', 'high', 'urgent'].map(p => (
                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setView('board')} className={`p-2 ${view === 'board' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </PageHeader>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={CheckSquare} title="No tasks found" description="Create your first task to get started." actionLabel="New Task" onAction={() => setDialogOpen(true)} />
      ) : view === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map(status => (
            <TaskColumn
              key={status}
              status={status}
              tasks={filtered.filter(t => t.status === status)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <Card key={task.id} className="p-3 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{task.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge value={task.status} />
                <StatusBadge value={task.priority} type="priority" />
                {task.due_date && <span className="text-xs text-muted-foreground hidden sm:inline">{format(new Date(task.due_date), 'MMM d')}</span>}
                {task.file_attachments?.length > 0 && (
                  <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                    <Paperclip className="w-3 h-3" />{task.file_attachments.length}
                  </span>
                )}
                <ReminderButton item={task} entityName="Task" recipientEmail={task.assigned_to || user?.email} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })} />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(task)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(task.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingTask}
        projects={projects}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}