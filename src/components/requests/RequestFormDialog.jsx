import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X, Paperclip } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const REQUEST_TYPES = ['Specification Sheet', 'Letter', 'Corrective Action', 'Certificate', 'Audit Report', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function RequestFormDialog({ onSubmit, onClose, isLoading }) {
  const [form, setForm] = useState({
    title: '',
    request_type: 'Specification Sheet',
    priority: 'medium',
    due_date: '',
    description: '',
    file_attachments: [],
  });
  const [uploading, setUploading] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({
        ...prev,
        file_attachments: [...prev.file_attachments, { name: file.name, url: file_url, uploaded_by: 'requester' }],
      }));
    }
    setUploading(false);
  };

  const removeFile = (idx) => {
    setForm(prev => ({ ...prev, file_attachments: prev.file_attachments.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New FSQA Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Request Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief description of your request" className="mt-1" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={form.request_type} onValueChange={v => set('request_type', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Due Date</Label>
            <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Provide details about your request..." className="mt-1 h-24 resize-none" />
          </div>

          <div>
            <Label>Attachments</Label>
            <div className="mt-1 space-y-2">
              {form.file_attachments.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">{f.name}</a>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-3 py-2 transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Attach files'}
                <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading || uploading || !form.title.trim()}>
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}