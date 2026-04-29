import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, FolderKanban, Pencil, Trash2, Calendar, CheckCircle2, Clock, Circle, Paperclip, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import ReminderButton from '@/components/shared/ReminderButton';
import ReportDialog from '@/components/reports/ReportDialog';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

const PROJECT_REPORT_FIELDS = [
  { key: 'name', label: 'Project Name', type: 'text' },
  { key: 'status', label: 'Status', type: 'select' },
  { key: 'priority', label: 'Priority', type: 'select' },
  { key: 'category', label: 'Category', type: 'select' },
  { key: 'owner', label: 'Owner', type: 'select' },
  { key: 'progress', label: 'Progress (%)', type: 'text' },
  { key: 'due_date', label: 'Due Date', type: 'date' },
  { key: 'description', label: 'Description', type: 'text' },
];

const assigneeCardBg = {
  'Rafael Souza': 'bg-blue-50',
  'Gabriela Hidalgo': 'bg-pink-50',
};
const creatorCardBg = {
  'rsouza@ajcgroup.com': 'bg-blue-50',
  'ghidalgo@ajcgroup.com': 'bg-pink-50',
};
const getCardBg = (item) => assigneeCardBg[item.fsqa_assignee] || creatorCardBg[item.created_by] || '';

const stepIcon = { pending: Circle, in_progress: Clock, completed: CheckCircle2 };
const stepColor = { pending: 'text-muted-foreground', in_progress: 'text-amber-500', completed: 'text-emerald-500' };

export default function Projects() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setDialogOpen(false); toast.success('Project created'); }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setDialogOpen(false); setEditingProject(null); toast.success('Project updated'); }
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project deleted'); }
  });

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = (data) => {
    if (editingProject) updateMutation.mutate({ id: editingProject.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div>
      <PageHeader title="Projects" subtitle="Manage quality improvement projects" actionLabel="New Project" onAction={() => { setEditingProject(null); setDialogOpen(true); }}>
        <Button variant="outline" className="gap-2" onClick={() => setReportOpen(true)}>
          <BarChart2 className="w-4 h-4" />
          Generate Report
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-44" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'].map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={FolderKanban} title="No projects found" description="Create your first project to get started." actionLabel="New Project" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(project => {
            const steps = project.timelines || [];
            return (
              <Card key={project.id} className={`p-5 hover:shadow-md transition-shadow flex flex-col gap-4 ${getCardBg(project)}`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-0.5 ml-2 shrink-0">
                    <ReminderButton item={project} entityName="Project" recipientEmail={user?.email} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['projects'] })} />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingProject(project); setDialogOpen(true); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(project.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge value={project.status} />
                  <StatusBadge value={project.priority} type="priority" />
                  <StatusBadge value={project.category} />
                  {project.file_attachments?.length > 0 && (
                    <span className="text-[10px] flex items-center gap-1 text-muted-foreground border rounded px-1.5 py-0.5">
                      <Paperclip className="w-2.5 h-2.5" />{project.file_attachments.length}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span><span className="font-medium">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-1.5" />
                </div>

                {/* Timeline steps */}
                {steps.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Timeline</p>
                    {steps.map((step, i) => {
                      const Icon = stepIcon[step.status] || Circle;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Icon className={cn('w-3.5 h-3.5 shrink-0', stepColor[step.status])} />
                          <span className="flex-1 truncate">{step.label}</span>
                          {step.date && <span className="text-muted-foreground shrink-0">{format(new Date(step.date), 'MMM d')}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {project.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
                    <Calendar className="w-3 h-3" />
                    Due: {format(new Date(project.due_date), 'MMM d, yyyy')}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingProject}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        title="Projects"
        data={projects}
        filterConfig={PROJECT_REPORT_FIELDS}
        dateField="due_date"
      />
    </div>
  );
}