import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TYPES = [
  { value: 'customer_complaint', label: 'Customer Complaint' },
  { value: 'supplier_issue', label: 'Supplier Issue' },
  { value: 'internal_nonconformance', label: 'Internal Non-conformance' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'recall', label: 'Recall' },
];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'investigating', 'corrective_action', 'resolved', 'closed'];

export default function ClaimFormDialog({ open, onOpenChange, onSubmit, initialData, isSubmitting }) {
  const [form, setForm] = useState(initialData || {
    title: '', type: 'customer_complaint', severity: 'medium', status: 'open',
    product_name: '', batch_number: '', description: '', claim_number: '',
    root_cause: '', corrective_action: '', assigned_to: '', due_date: ''
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Claim' : 'New Quality Claim'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="Claim title" required />
            </div>
            <div>
              <Label>Claim Number</Label>
              <Input value={form.claim_number} onChange={e => handleChange('claim_number', e.target.value)} placeholder="CLM-001" />
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={v => handleChange('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity *</Label>
              <Select value={form.severity} onValueChange={v => handleChange('severity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
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
              <Label>Product Name</Label>
              <Input value={form.product_name} onChange={e => handleChange('product_name', e.target.value)} placeholder="Product name" />
            </div>
            <div>
              <Label>Batch Number</Label>
              <Input value={form.batch_number} onChange={e => handleChange('batch_number', e.target.value)} placeholder="Batch #" />
            </div>
            <div>
              <Label>Assigned To</Label>
              <Input value={form.assigned_to} onChange={e => handleChange('assigned_to', e.target.value)} placeholder="Email" />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => handleChange('due_date', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Describe the issue..." rows={3} />
            </div>
            <div className="sm:col-span-2">
              <Label>Root Cause</Label>
              <Textarea value={form.root_cause} onChange={e => handleChange('root_cause', e.target.value)} placeholder="Root cause analysis..." rows={2} />
            </div>
            <div className="sm:col-span-2">
              <Label>Corrective Action</Label>
              <Textarea value={form.corrective_action} onChange={e => handleChange('corrective_action', e.target.value)} placeholder="Actions taken..." rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{initialData ? 'Update' : 'Create'} Claim</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}