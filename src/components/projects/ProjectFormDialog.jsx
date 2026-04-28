import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

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

export default function ProjectFormDialog({ open, onOpenChange, onSubmit, initialData, isSubmitting }) {
  const [form, setForm] = useState(initialData || {
    name: '', description: '', category: 'quality_improvement', status: 'planning',
    priority: 'medium', owner: '', start_date: '', end_date: '', progress: 0
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Project name" required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Project description..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => handleChange('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => handleChange('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Owner</Label>
              <Input value={form.owner} onChange={e => handleChange('owner', e.target.value)} placeholder="Owner email" />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => handleChange('start_date', e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => handleChange('end_date', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Progress: {form.progress}%</Label>
            <Slider value={[form.progress]} onValueChange={([v]) => handleChange('progress', v)} max={100} step={5} className="mt-2" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{initialData ? 'Update' : 'Create'} Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}