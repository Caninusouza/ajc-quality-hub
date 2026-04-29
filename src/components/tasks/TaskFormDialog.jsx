import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileAttachments from '@/components/shared/FileAttachments';

const FSQA_REPS = {
  'Rafael Souza': 'rsouza@ajcgroup.com',
  'Gabriela Hidalgo': 'ghidalgo@ajcgroup.com',
};
const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const defaultForm = () => ({
  title: '', description: '', status: 'todo', priority: 'medium',
  assigned_to: '', project_id: '', due_date: '', file_attachments: []
});

export default function TaskFormDialog({ open, onOpenChange, onSubmit, initialData, projects = [], isSubmitting }) {
  const [form, setForm] = useState(initialData || defaultForm());

  useEffect(() => {
    setForm(initialData || defaultForm());
  }, [initialData, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2">
          <Tabs defaultValue="details">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="files" className="flex-1">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Task details..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => set('priority', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>FSQA Representative</Label>
                  <Select value={form.fsqa_assignee || ''} onValueChange={v => { set('fsqa_assignee', v); set('assigned_to', FSQA_REPS[v] || ''); }}>
                    <SelectTrigger><SelectValue placeholder="Select representative..." /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(FSQA_REPS).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Representative Email</Label>
                  <Input value={FSQA_REPS[form.fsqa_assignee] || ''} readOnly className="bg-muted text-muted-foreground" placeholder="Auto-populated" />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                </div>
              </div>
              {projects.length > 0 && (
                <div>
                  <Label>Project</Label>
                  <Select value={form.project_id || 'none'} onValueChange={v => set('project_id', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            <TabsContent value="files">
              <FileAttachments attachments={form.file_attachments || []} onChange={files => set('file_attachments', files)} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{initialData ? 'Update' : 'Create'} Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}