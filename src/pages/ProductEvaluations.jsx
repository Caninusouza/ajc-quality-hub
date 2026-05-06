import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import ProductEvaluationForm from '@/components/product-evaluation/ProductEvaluationForm';
import ProductEvaluationPDF from '@/components/product-evaluation/ProductEvaluationPDF';
import { format } from 'date-fns';
import { Search, FlaskConical, Calendar, Pencil, Trash2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_STYLES = {
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Submitted: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function ProductEvaluations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editing, setEditing] = useState(null);

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['product_evaluations'],
    queryFn: () => base44.entities.ProductEvaluation.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, status: 'Submitted' };
      if (editing?.id) return base44.entities.ProductEvaluation.update(editing.id, payload);
      return base44.entities.ProductEvaluation.create(payload);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['product_evaluations'] });
      setEditing(saved);
      setView('preview');
      toast.success('Evaluation saved!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductEvaluation.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product_evaluations'] });
      toast.success('Deleted');
    },
  });

  const filtered = evaluations.filter(e =>
    e.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d) => {
    if (!d) return '—';
    try { return format(new Date(d + 'T00:00:00'), 'MMM d, yyyy'); } catch { return d; }
  };

  if (view === 'form') {
    return (
      <div className="p-6">
        <PageHeader
          title={editing?.id ? 'Edit Evaluation' : 'New Product Evaluation'}
          subtitle="Fill out the product evaluation report"
        />
        <ProductEvaluationForm
          initialData={editing || {}}
          onSave={(data) => saveMutation.mutateAsync(data)}
          onCancel={() => { setView('list'); setEditing(null); }}
          isSaving={saveMutation.isPending}
        />
      </div>
    );
  }

  if (view === 'preview' && editing) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Evaluation Preview"
          subtitle={`${editing.supplier_name} — ${editing.product_name}`}
        />
        <div className="flex gap-3 mb-4">
          <Button variant="outline" onClick={() => { setView('form'); }}>Edit</Button>
          <Button variant="outline" onClick={() => { setView('list'); setEditing(null); }}>Back to List</Button>
          <ProductEvaluationPDF evaluation={editing} />
        </div>
        <EvaluationPreview evaluation={editing} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Product Evaluations"
        subtitle="Product evaluation reports"
        actionLabel="New Evaluation"
        onAction={() => { setEditing(null); setView('form'); }}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by supplier or product..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No product evaluations yet</p>
          <p className="text-sm mt-1">Click "New Evaluation" to create the first one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ev => (
            <Card key={ev.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setEditing(ev); setView('preview'); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-base">{ev.supplier_name}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">{ev.product_name}</span>
                      <Badge className={`text-xs border ${STATUS_STYLES[ev.status] || STATUS_STYLES.Draft}`}>
                        {ev.status || 'Draft'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {ev.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />{fmt(ev.date)}
                        </span>
                      )}
                      {ev.plant_no && <span>Plant: {ev.plant_no}</span>}
                      {ev.brand && <span>Brand: {ev.brand}</span>}
                      {(ev.product_photos?.length > 0 || ev.label_photos?.length > 0) && (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {(ev.product_photos?.length || 0) + (ev.label_photos?.length || 0) + (ev.grading_photos?.length || 0)} photos
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <ProductEvaluationPDF evaluation={ev} />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(ev); setView('form'); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm('Delete this evaluation?')) deleteMutation.mutate(ev.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EvaluationPreview({ evaluation }) {
  const fmt = (d) => {
    if (!d) return '—';
    try { return format(new Date(d + 'T00:00:00'), 'MMM d, yyyy'); } catch { return d; }
  };

  const rows = [
    ['Supplier Name', evaluation.supplier_name, 'Product Name', evaluation.product_name],
    ['Plant No.', evaluation.plant_no, 'Product Code', evaluation.product_code],
    ['Brand', evaluation.brand, 'Location', evaluation.location],
    ['Pack', evaluation.pack, 'Special', evaluation.special],
    ['Avg. Live Wt. (Current)', evaluation.avg_live_wt_current, 'Avg. Live Wt. (Target)', evaluation.avg_live_wt_target],
    ['Weekly Slaughter', evaluation.weekly_slaughter, 'Pack Date', fmt(evaluation.pack_date)],
    ['Shelf Life', evaluation.shelf_life, 'Date', fmt(evaluation.date)],
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Info grid */}
      <div className="rounded-xl border overflow-hidden">
        {rows.map(([l1, v1, l2, v2], i) => (
          <div key={i} className={`grid grid-cols-4 divide-x divide-border ${i % 2 === 0 ? 'bg-muted/30' : 'bg-white'}`}>
            <div className="px-3 py-2 text-xs font-semibold text-primary">{l1}</div>
            <div className="px-3 py-2 text-sm">{v1 || '—'}</div>
            <div className="px-3 py-2 text-xs font-semibold text-primary">{l2}</div>
            <div className="px-3 py-2 text-sm">{v2 || '—'}</div>
          </div>
        ))}
      </div>

      <PhotoSection title="Product Label" photos={evaluation.label_photos} />
      {evaluation.notes_comments && (
        <div className="rounded-xl border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-primary mb-2">Notes / Comments</h3>
          <p className="text-sm whitespace-pre-wrap">{evaluation.notes_comments}</p>
        </div>
      )}
      {evaluation.grading_profile && (
        <div className="rounded-xl border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-primary mb-2">Grading Profile</h3>
          <p className="text-sm whitespace-pre-wrap">{evaluation.grading_profile}</p>
        </div>
      )}
      <PhotoSection title="Grading Photos" photos={evaluation.grading_photos} />
      <PhotoSection title="Product Photos" photos={evaluation.product_photos} />
    </div>
  );
}

function PhotoSection({ title, photos }) {
  if (!photos?.length) return null;
  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-primary mb-3">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <a key={i} href={p.url} target="_blank" rel="noopener noreferrer">
            <img src={p.url} alt={p.name} className="w-36 h-36 object-cover rounded-lg border hover:opacity-90 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
}