import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectTimelines from './ProjectTimelines';
import FileAttachments from '@/components/shared/FileAttachments';

const FSQA_PEOPLE = ['Rafael Souza', 'Gabriela Hidalgo'];
const CATEGORIES = [
  { value: 'quality_improvement', label: 'Quality Improvement' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'audit', label: 'Audit' },
  { value: 'training', label: 'Training' },
  { value: 'process_optimization', label: 'Process Optimization' },
  { value: 'other', label: 'Other' },
];
const STATUSES = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const defaultForm = () => ({
  name: '', description: '', category: 'quality_improvement', status: 'planning',
  priority: 'medium', owner: '', due_date: '', progress: 0, timelines: [], file_attachments: []
});

export default function ProjectFormDialog({ open, onOpenChange, onSubmit, initialData, isSubmitting }) {
  const [form, setForm] = useState(initialData || defaultForm());

  useEffect(() => {
    setForm(initialData || defaultForm());
  }, [initialData, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2">
          <Tabs defaultValue="details">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
              <TabsTrigger value="files" className="flex-1">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Project name" required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Project description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => set('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
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
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Owner</Label>
                  <Input value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Owner email" />
                </div>
                <div>
                  <Label>FSQA Assignee</Label>
                  <Select value={form.fsqa_assignee || ''} onValueChange={v => set('fsqa_assignee', v)}>
                    <SelectTrigger><SelectValue placeholder="Select assignee..." /></SelectTrigger>
                    <SelectContent>
                      {FSQA_PEOPLE.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Progress: {form.progress}%</Label>
                <Slider value={[form.progress]} onValueChange={([v]) => set('progress', v)} max={100} step={5} className="mt-2" />
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Define the 4 phases of this project with dates and status.</p>
              <ProjectTimelines timelines={form.timelines || []} onChange={tl => set('timelines', tl)} />
            </TabsContent>

            <TabsContent value="files">
              <FileAttachments attachments={form.file_attachments || []} onChange={files => set('file_attachments', files)} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{initialData ? 'Update' : 'Create'} Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}