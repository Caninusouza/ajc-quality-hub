import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, Paperclip, Download, Clock, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RequestFormDialog from '@/components/requests/RequestFormDialog';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  submitted:     { label: 'Submitted',            color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_review:     { label: 'In Review',            color: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress:   { label: 'In Progress',          color: 'bg-purple-50 text-purple-700 border-purple-200' },
  pending_info:  { label: 'Pending Info',         color: 'bg-orange-50 text-orange-700 border-orange-200' },
  completed:     { label: 'Completed',            color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:      { label: 'Rejected',             color: 'bg-red-50 text-red-700 border-red-200' },
};

const PRIORITY_CONFIG = {
  low:    'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high:   'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

export default function MyRequests() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-requests', user?.email],
    queryFn: () => base44.entities.Request.filter({ requested_by_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Request.create({
      ...data,
      requested_by_email: user.email,
      requested_by_name: user.full_name || user.email,
      status: 'submitted',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      setShowForm(false);
    },
  });

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight">AJC FSQA Portal</h1>
            <p className="text-xs text-muted-foreground">My Requests</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{user.full_name || user.email}</span>
          <Button variant="ghost" size="sm" onClick={() => base44.auth.logout()} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Your Requests</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Track the status of your FSQA requests</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">Submit your first request to get started</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> New Request
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <RequestFormDialog
          onSubmit={(data) => createMutation.mutate(data)}
          onClose={() => setShowForm(false)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function RequestCard({ request }) {
  const status = STATUS_CONFIG[request.status] || { label: request.status, color: 'bg-muted text-muted-foreground' };
  const priorityColor = PRIORITY_CONFIG[request.priority] || 'bg-muted text-muted-foreground';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base">{request.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{request.request_type}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs ${priorityColor}`}>
              {request.priority}
            </Badge>
            <Badge variant="outline" className={`text-xs ${status.color}`}>
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {request.description && (
          <p className="text-sm text-muted-foreground">{request.description}</p>
        )}
        {request.fsqa_notes && (
          <div className="bg-accent/50 border border-accent rounded-lg p-3">
            <p className="text-xs font-medium text-accent-foreground mb-1">FSQA Response</p>
            <p className="text-sm">{request.fsqa_notes}</p>
          </div>
        )}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {request.due_date && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Due {format(new Date(request.due_date), 'MMM d, yyyy')}
              </span>
            )}
            <span>Submitted {format(new Date(request.created_date), 'MMM d, yyyy')}</span>
          </div>
          {request.file_attachments?.length > 0 && (
            <div className="flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{request.file_attachments.length} file(s)</span>
              <div className="flex gap-1 flex-wrap">
                {request.file_attachments.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="w-3 h-3" />
                    {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}