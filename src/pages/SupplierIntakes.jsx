import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import SupplierIntakeForm from '@/components/supplier/SupplierIntakeForm';
import { format } from 'date-fns';
import { Search, Building2, Calendar, User, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import SupplierIntakePDFButtons from '@/components/supplier/SupplierIntakePDF';
import UploadFilledForm from '@/components/supplier/UploadFilledForm';

const STATUS_STYLES = {
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  Approved: 'bg-green-100 text-green-700 border-green-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
};

export default function SupplierIntakes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editing, setEditing] = useState(null);

  const { data: intakes = [], isLoading } = useQuery({
    queryKey: ['supplier_intakes'],
    queryFn: () => base44.entities.SupplierIntake.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editing?.id) {
        return base44.entities.SupplierIntake.update(editing.id, data);
      }
      return base44.entities.SupplierIntake.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_intakes'] });
      setView('list');
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SupplierIntake.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplier_intakes'] }),
  });

  const filtered = intakes.filter(i =>
    i.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.visited_by?.toLowerCase().includes(search.toLowerCase())
  );

  if (view === 'form') {
    return (
      <div className="p-6">
        <PageHeader
          title={editing?.id ? 'Edit Supplier Intake' : 'New Supplier Intake'}
          subtitle={editing?.id ? `Editing: ${editing.supplier_name}` : 'Fill out the supplier visit and assessment form'}
        >
          <SupplierIntakePDFButtons intake={editing || {}} />
        </PageHeader>
        <SupplierIntakeForm
          initialData={editing}
          onSave={(data) => saveMutation.mutateAsync(data)}
          onCancel={() => { setView('list'); setEditing(null); }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Supplier Intakes"
        subtitle="Supplier visit assessments and plant inspections"
        actionLabel="New Intake"
        onAction={() => { setEditing(null); setView('form'); }}
      >
        <UploadFilledForm onExtracted={(data) => { setEditing(data); setView('form'); }} />
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by supplier or visitor..."
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
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No supplier intakes found</p>
          <p className="text-sm mt-1">Click "New Intake" to create the first one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(intake => (
            <Card key={intake.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-base">{intake.supplier_name}</span>
                      <Badge className={cn("text-xs border", STATUS_STYLES[intake.status] || STATUS_STYLES.Draft)}>
                        {intake.status || 'Draft'}
                      </Badge>
                      {intake.plant_inspection_conducted === 'Yes' && intake.inspection_overall_rating && (
                        <Badge className={cn("text-xs border",
                          intake.inspection_overall_rating === 'Pass' ? 'bg-green-100 text-green-700 border-green-200' :
                          intake.inspection_overall_rating === 'Conditional Pass' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        )}>
                          Inspection: {intake.inspection_overall_rating}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {intake.visit_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(intake.visit_date + 'T00:00:00'), 'MMM d, yyyy')}
                        </span>
                      )}
                      {intake.visited_by && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {intake.visited_by}
                        </span>
                      )}
                      {intake.product_types?.length > 0 && (
                        <span>{intake.product_types.slice(0, 3).join(', ')}{intake.product_types.length > 3 ? ` +${intake.product_types.length - 3}` : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <SupplierIntakePDFButtons intake={intake} />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(intake); setView('form'); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(intake.id)}>
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