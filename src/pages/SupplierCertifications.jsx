import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Search, ShieldCheck, Pencil, Trash2, Plus, Upload, Paperclip, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_STYLES = {
  Active: 'bg-green-100 text-green-700 border-green-200',
  'Expiring Soon': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Expired: 'bg-red-100 text-red-700 border-red-200',
  Updated: 'bg-blue-100 text-blue-700 border-blue-200',
};

const LANGUAGES = ['English', 'Spanish', 'Portuguese', 'French'];
const STATUSES = ['Active', 'Expiring Soon', 'Expired', 'Updated'];

function computeStatus(expirationDate, manualStatus) {
  if (manualStatus === 'Updated') return 'Updated';
  if (!expirationDate) return 'Active';
  const days = differenceInDays(parseISO(expirationDate), new Date());
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Expiring Soon';
  return 'Active';
}

function fmt(d) {
  if (!d) return '—';
  try { return format(parseISO(d), 'MMM d, yyyy'); } catch { return d; }
}

function addDays(dateStr, days) {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    d.setDate(d.getDate() + days);
    return format(d, 'MMM d, yyyy');
  } catch { return '—'; }
}

const EMPTY = {
  company_name: '', commodity: '', plant_est_no: '', location: '',
  language: 'English', contact_name: '', contact_email: '',
  expiration_date: '', status: 'Active', notes: '', file_attachments: [],
};

function CertForm({ initial, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setVal = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ name: file.name, url: file_url });
    }
    setForm(f => ({ ...f, file_attachments: [...(f.file_attachments || []), ...uploaded] }));
    setUploading(false);
    e.target.value = '';
  };

  const removeAttachment = (idx) => {
    setForm(f => ({ ...f, file_attachments: f.file_attachments.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Company Name *</Label>
          <Input value={form.company_name} onChange={set('company_name')} required />
        </div>
        <div className="space-y-1">
          <Label>Commodity</Label>
          <Input value={form.commodity} onChange={set('commodity')} />
        </div>
        <div className="space-y-1">
          <Label>Plant Est. No.</Label>
          <Input value={form.plant_est_no} onChange={set('plant_est_no')} />
        </div>
        <div className="space-y-1">
          <Label>Location</Label>
          <Input value={form.location} onChange={set('location')} />
        </div>
        <div className="space-y-1">
          <Label>Language</Label>
          <Select value={form.language} onValueChange={v => setVal('language', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => setVal('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Contact Name</Label>
          <Input value={form.contact_name} onChange={set('contact_name')} />
        </div>
        <div className="space-y-1">
          <Label>Contact Email</Label>
          <Input type="email" value={form.contact_email} onChange={set('contact_email')} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Expiration Date *</Label>
          <Input type="date" value={form.expiration_date} onChange={set('expiration_date')} required />
          {form.expiration_date && (
            <p className="text-xs text-muted-foreground mt-1">
              Reminder 1: {addDays(form.expiration_date, -7)} · Reminder 2: {addDays(form.expiration_date, 14)}
            </p>
          )}
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={set('notes')} rows={2} />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Certificate Files (PDF, images, etc.)</Label>
          <div className="flex flex-wrap gap-2">
            {(form.file_attachments || []).map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-muted/50 border rounded-lg px-3 py-1.5 text-sm">
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[180px]">{f.name}</a>
                <button type="button" onClick={() => removeAttachment(i)} className="ml-1 text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className={`flex items-center gap-2 px-3 py-1.5 text-sm border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/40 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{uploading ? 'Uploading...' : 'Attach files'}</span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  );
}

export default function SupplierCertifications() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCommodity, setFilterCommodity] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importing, setImporting] = useState(false);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['supplier_certifications'],
    queryFn: () => base44.entities.SupplierCertification.list('-expiration_date'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editing?.id) return base44.entities.SupplierCertification.update(editing.id, data);
      return base44.entities.SupplierCertification.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_certifications'] });
      setDialogOpen(false);
      setEditing(null);
      toast.success('Saved!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SupplierCertification.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_certifications'] });
      toast.success('Deleted');
    },
  });

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company_name: { type: "string" },
                  commodity: { type: "string" },
                  plant_est_no: { type: "string" },
                  location: { type: "string" },
                  language: { type: "string" },
                  contact_name: { type: "string" },
                  contact_email: { type: "string" },
                  expiration_date: { type: "string" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });
      const rows = result?.output?.items || (Array.isArray(result?.output) ? result.output : []);
      let created = 0;
      for (const row of rows) {
        if (!row.company_name) continue;
        await base44.entities.SupplierCertification.create({
          company_name: row.company_name || '',
          commodity: row.commodity || '',
          plant_est_no: row.plant_est_no || '',
          location: row.location || '',
          language: LANGUAGES.includes(row.language) ? row.language : 'English',
          contact_name: row.contact_name || '',
          contact_email: row.contact_email || '',
          expiration_date: row.expiration_date ? row.expiration_date.slice(0, 10) : '',
          status: 'Active',
          notes: row.notes || '',
        });
        created++;
      }
      qc.invalidateQueries({ queryKey: ['supplier_certifications'] });
      toast.success(`Imported ${created} records`);
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    }
    setImporting(false);
    e.target.value = '';
  };

  const commodities = useMemo(() => {
    const s = new Set(certs.map(c => c.commodity).filter(Boolean));
    return [...s].sort();
  }, [certs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return certs
      .map(c => ({ ...c, computed_status: computeStatus(c.expiration_date, c.status) }))
      .filter(c =>
        (!q || c.company_name?.toLowerCase().includes(q) || c.plant_est_no?.toLowerCase().includes(q) || c.commodity?.toLowerCase().includes(q) || c.contact_email?.toLowerCase().includes(q)) &&
        (filterStatus === 'all' || c.computed_status === filterStatus) &&
        (filterCommodity === 'all' || c.commodity === filterCommodity)
      );
  }, [certs, search, filterStatus, filterCommodity]);

  const counts = useMemo(() => {
    const all = certs.map(c => computeStatus(c.expiration_date, c.status));
    return {
      total: all.length,
      expired: all.filter(s => s === 'Expired').length,
      expiring: all.filter(s => s === 'Expiring Soon').length,
      updated: all.filter(s => s === 'Updated').length,
    };
  }, [certs]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Supplier Certification Tracking"
        subtitle="Monitor GFSI/HACCP certificate expiration and automated reminders"
      >
        <label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload className="w-4 h-4" />
          {importing ? 'Importing...' : 'Import Excel'}
          <input type="file" accept=".xlsx,.csv" className="hidden" onChange={handleImport} />
        </label>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Supplier
        </Button>
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, color: 'text-primary' },
          { label: 'Expired', value: counts.expired, color: 'text-red-600' },
          { label: 'Expiring Soon', value: counts.expiring, color: 'text-yellow-600' },
          { label: 'Updated', value: counts.updated, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search company, plant, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCommodity} onValueChange={setFilterCommodity}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All commodities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Commodities</SelectItem>
            {commodities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No supplier certifications found</p>
          <p className="text-sm mt-1">Add a supplier or import from Excel</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Company</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Commodity</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Plant Est. No.</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Location</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Contact</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Expiration</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Reminder 1</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Reminder 2</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Lang</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Files</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((cert, i) => (
                <tr key={cert.id} className={`hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                  <td className="px-4 py-3 font-medium max-w-[180px] truncate">{cert.company_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cert.commodity || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{cert.plant_est_no || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{cert.location || '—'}</td>
                  <td className="px-4 py-3">
                    {cert.contact_name && <div className="font-medium">{cert.contact_name}</div>}
                    {cert.contact_email && <div className="text-xs text-muted-foreground">{cert.contact_email}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmt(cert.expiration_date)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {cert.expiration_date ? addDays(cert.expiration_date, -7) : '—'}
                    {cert.reminder1_sent && <span className="ml-1 text-green-600">✓</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {cert.expiration_date ? addDays(cert.expiration_date, 14) : '—'}
                    {cert.reminder2_sent && <span className="ml-1 text-green-600">✓</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs border ${STATUS_STYLES[cert.computed_status] || STATUS_STYLES.Active}`}>
                      {cert.computed_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{cert.language || '—'}</td>
                  <td className="px-4 py-3">
                    {(cert.file_attachments?.length || 0) > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cert.file_attachments.map((f, i) => (
                          <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" title={f.name}
                            className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 hover:bg-blue-100">
                            <FileText className="w-3 h-3" />
                            <span className="max-w-[80px] truncate">{f.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(cert); setDialogOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete this record?')) deleteMutation.mutate(cert.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Supplier Certification' : 'Add Supplier Certification'}</DialogTitle>
          </DialogHeader>
          <CertForm
            initial={editing || {}}
            onSave={(data) => saveMutation.mutateAsync(data)}
            onClose={() => { setDialogOpen(false); setEditing(null); }}
            isSaving={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}