import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShieldAlert, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ClaimFormDialog from '@/components/claims/ClaimFormDialog';
import { toast } from 'sonner';

export default function Claims() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);
  const queryClient = useQueryClient();

  const { data: claims = [], isLoading } = useQuery({ queryKey: ['claims'], queryFn: () => base44.entities.Claim.list('-created_date') });

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

  const filtered = claims.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.product_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSeverity = severityFilter === 'all' || c.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  });

  const handleSubmit = (data) => {
    if (editingClaim) {
      updateMutation.mutate({ id: editingClaim.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div>
      <PageHeader title="Claims" subtitle="Track and manage food quality claims" actionLabel="New Claim" onAction={() => { setEditingClaim(null); setDialogOpen(true); }}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search claims..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {['open', 'investigating', 'corrective_action', 'resolved', 'closed'].map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {['low', 'medium', 'high', 'critical'].map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={ShieldAlert} title="No claims found" description="Create your first quality claim to start tracking." actionLabel="New Claim" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map(claim => (
            <Card key={claim.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{claim.title}</h3>
                    {claim.claim_number && <span className="text-xs text-muted-foreground shrink-0">#{claim.claim_number}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{claim.description || 'No description'}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={claim.status} />
                    <StatusBadge value={claim.severity} type="severity" />
                    <StatusBadge value={claim.type} />
                    {claim.product_name && <span className="text-xs text-muted-foreground">· {claim.product_name}</span>}
                    {claim.due_date && <span className="text-xs text-muted-foreground">· Due {format(new Date(claim.due_date), 'MMM d')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
    </div>
  );
}