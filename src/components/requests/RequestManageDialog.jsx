import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X, Paperclip, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';

const STATUS_OPTIONS = [
  { value: 'submitted',    label: 'Submitted' },
  { value: 'in_review',    label: 'In Review' },
  { value: 'in_progress',  label: 'In Progress' },
  { value: 'pending_info', label: 'Pending Info' },
  { value: 'completed',    label: 'Completed' },
  { value: 'rejected',     label: 'Rejected' },
];

const FSQA_ASSIGNEES = ['Rafael Souza', 'Gabriela Hidalgo'];

export default function RequestManageDialog({ request, onClose, onSave }) {
  const [form, setForm] = useState({
    status: request.status,
    fsqa_notes: request.fsqa_notes || '',
    fsqa_assignee: request.fsqa_assignee || '',
    file_attachments: request.file_attachments || [],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({
        ...prev,
        file_attachments: [...prev.file_attachments, { name: file.name, url: file_url, uploaded_by: 'fsqa' }],
      }));
    }
    setUploading(false);
  };

  const removeFile = (idx) => {
    setForm(prev => ({ ...prev, file_attachments: prev.file_attachments.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(request.id, form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">{request.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">Type:</span> {request.request_type}</p>
          <p><span className="font-medium text-foreground">Submitted by:</span> {request.requested_by_name} ({request.requested_by_email})</p>
          {request.due_date && <p><span className="font-medium text-foreground">Due Date:</span> {request.due_date}</p>}
          {request.description && <p className="pt-1"><span className="font-medium text-foreground">Description:</span> {request.description}</p>}
        </div>

        {/* Requester files */}
        {request.file_attachments?.filter(f => f.uploaded_by === 'requester').length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Files from Requester</Label>
            <div className="mt-1 space-y-1">
              {request.file_attachments.filter(f => f.uploaded_by === 'requester').map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Download className="w-3.5 h-3.5" /> {f.name}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4 space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Assign to</Label>
            <Select value={form.fsqa_assignee} onValueChange={v => set('fsqa_assignee', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {FSQA_ASSIGNEES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes to Requester</Label>
            <Textarea
              value={form.fsqa_notes}
              onChange={e => set('fsqa_notes', e.target.value)}
              placeholder="Add notes visible to the requester..."
              className="mt-1 h-24 resize-none"
            />
          </div>

          <div>
            <Label>Upload Files for Requester</Label>
            <div className="mt-1 space-y-2">
              {form.file_attachments.filter(f => f.uploaded_by === 'fsqa').map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">{f.name}</a>
                  </div>
                  <button type="button" onClick={() => removeFile(form.file_attachments.indexOf(f))} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-3 py-2 transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload files for requester'}
                <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}