import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import RequestManageDialog from '@/components/requests/RequestManageDialog';
import { format } from 'date-fns';
import { Search, Clock, Paperclip, ExternalLink } from 'lucide-react';

const STATUS_CONFIG = {
  submitted:     { label: 'Submitted',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_review:     { label: 'In Review',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress:   { label: 'In Progress',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
  pending_info:  { label: 'Pending Info', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  completed:     { label: 'Completed',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:      { label: 'Rejected',     color: 'bg-red-50 text-red-700 border-red-200' },
};

const PRIORITY_CONFIG = {
  low:    'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high:   'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

export default function Requests() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => base44.entities.Request.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Request.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });

  const filtered = requests.filter(r => {
    const matchSearch = !search || r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.requested_by_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.requested_by_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const portalUrl = `${window.location.origin}/my-requests`;

  return (
    <div className="p-6">
      <PageHeader
        title="FSQA Requests"
        subtitle="Manage incoming requests from AJC staff"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = requests.filter(r => r.status === key).length;
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
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requests..." className="pl-9" />
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
          No requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const status = STATUS_CONFIG[req.status] || { label: req.status, color: 'bg-muted text-muted-foreground' };
            const priority = PRIORITY_CONFIG[req.priority] || 'bg-muted text-muted-foreground';
            return (
              <Card
                key={req.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedRequest(req)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{req.title}</p>
                        <Badge variant="outline" className={`text-xs ${status.color}`}>{status.label}</Badge>
                        <Badge variant="outline" className={`text-xs ${priority} capitalize`}>{req.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{req.request_type} · {req.requested_by_name || req.requested_by_email}</p>
                      {req.description && <p className="text-sm text-muted-foreground mt-1 truncate">{req.description}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground shrink-0">
                      {req.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(req.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {req.file_attachments?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {req.file_attachments.length} file(s)
                        </span>
                      )}
                      <span>{format(new Date(req.created_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedRequest && (
        <RequestManageDialog
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSave={(id, data) => updateMutation.mutateAsync({ id, data })}
        />
      )}
    </div>
  );
}