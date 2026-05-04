import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import SupplierProductMaterialForm from '@/components/supplier/SupplierProductMaterialForm';
import { Search, Package, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_STYLES = {
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  Approved: 'bg-green-100 text-green-700 border-green-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
};

export default function SupplierProductMaterials() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['supplier_product_materials'],
    queryFn: () => base44.entities.SupplierProductMaterial.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editing?.id) return base44.entities.SupplierProductMaterial.update(editing.id, data);
      return base44.entities.SupplierProductMaterial.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_product_materials'] });
      setView('list');
      setEditing(null);
      toast.success('Form saved successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SupplierProductMaterial.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_product_materials'] });
      toast.success('Record deleted');
    },
  });

  const filtered = records.filter(r =>
    r.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (view === 'form') {
    return (
      <div className="p-6">
        <PageHeader
          title={editing?.id ? 'Edit Product Material Form' : 'New Product Material Form'}
          subtitle={editing?.id ? `Editing: ${editing.supplier_name} — ${editing.product_name}` : 'Document supplier product and packaging material details'}
        />
        <SupplierProductMaterialForm
          initialData={editing}
          onSave={(data) => saveMutation.mutateAsync(data)}
          onCancel={() => { setView('list'); setEditing(null); }}
          isSaving={saveMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Supplier Product Material Forms"
        subtitle="Document product, packaging, and palletization specifications per supplier"
        actionLabel="New Form"
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
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No product material forms found</p>
          <p className="text-sm mt-1">Click "New Form" to create the first one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(record => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-base">{record.supplier_name}</span>
                      {record.plant_number && (
                        <span className="text-xs text-muted-foreground">Plant {record.plant_number}</span>
                      )}
                      <Badge className={cn('text-xs border', STATUS_STYLES[record.status] || STATUS_STYLES.Draft)}>
                        {record.status || 'Draft'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{record.product_name}</span>
                      {record.product_category && <span>{record.product_category}</span>}
                      {record.product_cut && <span>Cut: {record.product_cut}</span>}
                      {record.package_material && <span>Pkg: {record.package_material}</span>}
                      {record.packaging_weight && <span>{record.packaging_weight}</span>}
                      {record.recyclable && (
                        <span className={cn(
                          'text-xs font-medium',
                          record.recyclable === 'Yes' ? 'text-green-600' :
                          record.recyclable === 'Partially' ? 'text-yellow-600' : 'text-red-500'
                        )}>
                          ♻ {record.recyclable}
                        </span>
                      )}
                      {record.file_attachments?.length > 0 && (
                        <span className="text-xs">{record.file_attachments.length} attachment{record.file_attachments.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(record); setView('form'); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(record.id)}>
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