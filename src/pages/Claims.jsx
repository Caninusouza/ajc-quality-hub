import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShieldAlert, Trash2, Pencil, FileSpreadsheet, Paperclip, DollarSign, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ClaimFormDialog from '@/components/claims/ClaimFormDialog';
import SpreadsheetUpload from '@/components/claims/SpreadsheetUpload';
import ReminderButton from '@/components/shared/ReminderButton';
import ReportDialog from '@/components/reports/ReportDialog';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { generateNextClaimId } from '@/utils/claimId';

const CLAIM_REPORT_FIELDS = [
  { key: 'claim_id', label: 'Claim ID', type: 'text' },
  { key: 'current_status', label: 'Status', type: 'select' },
  { key: 'claim_lifecycle', label: 'Lifecycle', type: 'select' },
  { key: 'claim_subtype', label: 'Claim Type', type: 'select' },
  { key: 'customer', label: 'Customer', type: 'select' },
  { key: 'supplier', label: 'Supplier', type: 'select' },
  { key: 'product_category', label: 'Product Category', type: 'select' },
  { key: 'product_subcategory', label: 'Product Subcategory', type: 'select' },
  { key: 'primary_plant', label: 'Primary Plant', type: 'select' },
  { key: 'destination_country', label: 'Destination Country', type: 'country' },
  { key: 'origin_country', label: 'Origin Country', type: 'country' },
  { key: 'claims_rep', label: 'Claims Rep', type: 'select' },
  { key: 'filing_amount', label: 'Filing Amount', type: 'text' },
  { key: 'date_of_claim', label: 'Date of Claim', type: 'date' },
  { key: 'date_of_claim_finalized', label: 'Date Finalized', type: 'date' },
];

const statusStyles = {
  'UNDER REVIEW': 'bg-amber-50 text-amber-700 border-amber-200',
  'OPEN': 'bg-blue-50 text-blue-700 border-blue-200',
  'ON HOLD': 'bg-slate-100 text-slate-600 border-slate-200',
  'RESOLVED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'CLOSED': 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function Claims() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lifecycleFilter, setLifecycleFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: () => base44.entities.Claim.list('-date_of_claim')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Claim.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['claims'] }); setDialogOpen(false); toast.success('Claim created'); }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Claim.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['claims'] }); setDialogOpen(false); setEditingClaim(null); toast.success('Claim updated'); }
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Claim.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['claims'] }); toast.success('Claim deleted'); }
  });

  // Deduplicate by claim_id — keep the most recently updated record
  const deduped = Object.values(
    claims.reduce((acc, c) => {
      if (!c.claim_id) return { ...acc, [c.id]: c };
      if (!acc[c.claim_id] || c.updated_date > acc[c.claim_id].updated_date) {
        acc[c.claim_id] = c;
      }
      return acc;
    }, {})
  );

  const filtered = deduped.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || [c.title, c.claim_id, c.customer, c.supplier, c.product_category, c.claims_rep]
      .some(v => v?.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || c.current_status === statusFilter;
    const matchLifecycle = lifecycleFilter === 'all' || c.claim_lifecycle === lifecycleFilter;
    return matchSearch && matchStatus && matchLifecycle;
  });

  const handleSubmit = (data) => {
    if (editingClaim) updateMutation.mutate({ id: editingClaim.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div>
      <PageHeader title="Claims" subtitle={`${claims.length} total claims`} actionLabel="New Claim" onAction={() => { setEditingClaim({ claim_id: generateNextClaimId(claims) }); setDialogOpen(true); }}>
        <Button variant="outline" className="gap-2" onClick={() => setReportOpen(true)}>
          <BarChart2 className="w-4 h-4" />
          Generate Report
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setUploadOpen(true)}>
          <FileSpreadsheet className="w-4 h-4" />
          Import Spreadsheet
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search claims..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-44" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {['UNDER REVIEW', 'OPEN', 'ON HOLD', 'RESOLVED', 'CLOSED'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Lifecycle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {['CLAIM', 'COMPLAINT', 'INQUIRY'].map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={ShieldAlert} title="No claims found" description="Create a new claim or import from your spreadsheet." actionLabel="New Claim" onAction={() => { setEditingClaim({ claim_id: generateNextClaimId(claims) }); setDialogOpen(true); }} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(claim => (
            <Card key={claim.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {claim.claim_id && (
                      <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{claim.claim_id}</span>
                    )}
                    <h3 className="font-semibold text-sm">{claim.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                    {claim.customer && <span>Customer: <span className="text-foreground font-medium">{claim.customer}</span></span>}
                    {claim.supplier && <span>Supplier: <span className="text-foreground font-medium">{claim.supplier}</span></span>}
                    {claim.product_category && <span>Product: <span className="text-foreground">{claim.product_category}{claim.product_subcategory ? ` / ${claim.product_subcategory}` : ''}</span></span>}
                    {claim.claims_rep && <span>Rep: <span className="text-foreground">{claim.claims_rep}</span></span>}
                    {claim.date_of_claim && <span>Date: {format(new Date(claim.date_of_claim), 'MMM d, yyyy')}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {claim.current_status && (
                      <Badge variant="outline" className={`text-[10px] capitalize ${statusStyles[claim.current_status] || ''}`}>
                        {claim.current_status}
                      </Badge>
                    )}
                    {claim.claim_lifecycle && <Badge variant="outline" className="text-[10px]">{claim.claim_lifecycle}</Badge>}
                    {claim.claim_subtype && <Badge variant="outline" className="text-[10px]">{claim.claim_subtype}</Badge>}
                    {claim.destination_country && <Badge variant="outline" className="text-[10px]">→ {claim.destination_country}</Badge>}
                    {claim.filing_amount && (
                      <Badge variant="outline" className="text-[10px] gap-1 bg-green-50 text-green-700 border-green-200">
                        <DollarSign className="w-2.5 h-2.5" />${Number(claim.filing_amount).toLocaleString()}
                      </Badge>
                    )}
                    {claim.file_attachments?.length > 0 && (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Paperclip className="w-2.5 h-2.5" />{claim.file_attachments.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <ReminderButton item={claim} entityName="Claim" recipientEmail={user?.email} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['claims'] })} />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingClaim(claim); setDialogOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(claim.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ClaimFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingClaim}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
      <SpreadsheetUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        existingClaims={claims}
        onComplete={() => queryClient.invalidateQueries({ queryKey: ['claims'] })}
      />
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        title="Claims"
        data={claims}
        filterConfig={CLAIM_REPORT_FIELDS}
        dateField="date_of_claim"
      />
    </div>
  );
}