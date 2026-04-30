import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import ClaimFormDetailDialog from '@/components/claims/ClaimFormDetailDialog';
import { format } from 'date-fns';
import { Search, Paperclip, ExternalLink, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  submitted:    { label: 'Submitted',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  under_review: { label: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress:  { label: 'In Progress',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
  resolved:     { label: 'Resolved',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed:       { label: 'Closed',       color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function ClaimForms() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: claimForms = [], isLoading } = useQuery({
    queryKey: ['claimForms'],
    queryFn: () => base44.entities.ClaimForm.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClaimForm.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claimForms'] });
      setSelected(null);
    },
  });

  const filtered = claimForms.filter(cf => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      cf.customer_company?.toLowerCase().includes(q) ||
      cf.contact_person?.toLowerCase().includes(q) ||
      cf.product_name?.toLowerCase().includes(q) ||
      cf.claim_number?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || cf.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const portalUrl = `${window.location.origin}/claim-form`;

  return (
    <div className="p-6">
      <PageHeader
        title="Customer Claim Forms"
        subtitle="Quality claim submissions from customers"
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={() => { navigator.clipboard.writeText(portalUrl); }}
          title={portalUrl}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Copy Portal Link
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = claimForms.filter(c => c.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${statusFilter === key ? 'ring-2 ring-primary' : ''}`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company, product, claim #..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          No claim forms found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cf => {
            const status = STATUS_CONFIG[cf.status] || { label: cf.status, color: 'bg-muted text-muted-foreground' };
            return (
              <Card
                key={cf.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelected(cf)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {cf.claim_number && (
                          <span className="text-xs font-mono font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {cf.claim_number}
                          </span>
                        )}
                        <p className="font-medium">{cf.customer_company || 'Unknown Company'}</p>
                        <Badge variant="outline" className={`text-xs ${status.color}`}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {cf.contact_person} · {cf.product_name}
                        {cf.claim_type ? ` · ${cf.claim_type}` : ''}
                      </p>
                      {cf.issue_description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{cf.issue_description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(cf.created_date), 'MMM d, yyyy')}
                      </span>
                      {cf.file_attachments?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {cf.file_attachments.length} file(s)
                        </span>
                      )}
                      {cf.fsqa_assignee && <span>{cf.fsqa_assignee}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <ClaimFormDetailDialog
          claimForm={selected}
          onClose={() => setSelected(null)}
          onSave={(id, data) => updateMutation.mutateAsync({ id, data })}
        />
      )}
    </div>
  );
}