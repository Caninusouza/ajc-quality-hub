import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Paperclip, Download } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = [
  { value: 'submitted',    label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'in_progress',  label: 'In Progress' },
  { value: 'resolved',     label: 'Resolved' },
  { value: 'closed',       label: 'Closed' },
];

const ASSIGNEES = ['Rafael Souza', 'Gabriela Hidalgo'];

const STATUS_COLOR = {
  submitted:    'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress:  'bg-purple-50 text-purple-700 border-purple-200',
  resolved:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed:       'bg-slate-100 text-slate-600 border-slate-200',
};

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

export default function ClaimFormDetailDialog({ claimForm, onClose, onSave }) {
  const [claimNumber, setClaimNumber] = useState(claimForm.claim_number || '');
  const [status, setStatus] = useState(claimForm.status || 'submitted');
  const [assignee, setAssignee] = useState(claimForm.fsqa_assignee || '');
  const [fsqaNotes, setFsqaNotes] = useState(claimForm.fsqa_notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(claimForm.id, {
      claim_number: claimNumber,
      status,
      fsqa_assignee: assignee,
      fsqa_notes: fsqaNotes,
    });
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Customer Quality Claim
            <Badge variant="outline" className={`text-xs ${STATUS_COLOR[claimForm.status]}`}>
              {STATUSES.find(s => s.value === claimForm.status)?.label || claimForm.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* FSQA Actions — top */}
          <section className="bg-accent/30 border border-accent rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-sm">FSQA Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Assign Claim Number</Label>
                <Input
                  value={claimNumber}
                  onChange={e => setClaimNumber(e.target.value)}
                  placeholder="e.g. FSQA-2026-001"
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Assigned To</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Assign FSQA member" /></SelectTrigger>
                <SelectContent>
                  {ASSIGNEES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>FSQA Internal Notes</Label>
              <Textarea
                value={fsqaNotes}
                onChange={e => setFsqaNotes(e.target.value)}
                placeholder="Add internal notes about this claim..."
                className="mt-1 h-20 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </section>

          {/* Claim Submission Details */}
          <section>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Row label="Company" value={claimForm.customer_company} />
              <Row label="Contact Person" value={claimForm.contact_person} />
              <Row label="Contact Email" value={claimForm.contact_email} />
              <Row label="Customer Address" value={claimForm.customer_address} />
              <Row label="SO Number" value={claimForm.so_number} />
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Product & Claim Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Row label="Supplier" value={claimForm.supplier_name} />
              <Row label="Product Name" value={claimForm.product_name} />
              <Row label="Lot / Batch Number" value={claimForm.lot_batch_number} />
              <Row label="Purchase Date" value={claimForm.purchase_date ? format(new Date(claimForm.purchase_date), 'MMM d, yyyy') : null} />
              <Row label="Quantity Affected" value={claimForm.quantity_affected} />
              <Row label="Claim Type" value={claimForm.claim_type} />
              <Row label="Requested Resolution" value={claimForm.requested_resolution} />
            </div>
            {claimForm.issue_description && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Issue Description</p>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{claimForm.issue_description}</p>
              </div>
            )}
            {claimForm.supporting_evidence && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Supporting Evidence</p>
                <p className="text-sm mt-0.5">{claimForm.supporting_evidence}</p>
              </div>
            )}
            {claimForm.additional_comments && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Additional Comments</p>
                <p className="text-sm mt-0.5">{claimForm.additional_comments}</p>
              </div>
            )}
          </section>

          {claimForm.file_attachments?.length > 0 && (
            <section>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Attachments</h3>
              <div className="space-y-2">
                {claimForm.file_attachments.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {f.name}
                    <Download className="w-3.5 h-3.5 opacity-50" />
                  </a>
                ))}
              </div>
            </section>
          )}

          <p className="text-xs text-muted-foreground">Submitted {format(new Date(claimForm.created_date), 'MMM d, yyyy h:mm a')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}