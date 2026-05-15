import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ENTITIES = [
  { key: 'Claim', label: 'Claims' },
  { key: 'Project', label: 'Projects' },
  { key: 'Task', label: 'Tasks' },
  { key: 'SupplierIntake', label: 'Supplier Intakes' },
  { key: 'SupplierProductMaterial', label: 'Supplier Product Materials' },
  { key: 'ProductEvaluation', label: 'Product Evaluations' },
  { key: 'ClaimForm', label: 'Claim Forms' },
  { key: 'Request', label: 'Requests' },
];

export default function DataExport() {
  const [status, setStatus] = useState({}); // { entityKey: 'idle' | 'loading' | 'done' }
  const [exporting, setExporting] = useState(false);

  const exportAll = async () => {
    setExporting(true);
    const allData = {};
    const newStatus = {};

    for (const entity of ENTITIES) {
      newStatus[entity.key] = 'loading';
      setStatus({ ...newStatus });
      try {
        const records = await base44.entities[entity.key].list('-created_date', 5000);
        allData[entity.key] = records.map(r => {
          // Strip platform metadata, keep only data fields
          const { id, created_date, updated_date, created_by, ...rest } = r;
          return { id, created_date, updated_date, created_by, ...rest };
        });
        newStatus[entity.key] = 'done';
      } catch (err) {
        newStatus[entity.key] = 'error';
        console.error(`Failed to export ${entity.key}:`, err);
      }
      setStatus({ ...newStatus });
    }

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ajc_fsqa_full_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const totalRecords = Object.values(allData).reduce((sum, arr) => sum + arr.length, 0);
    toast.success(`Exported ${totalRecords} total records across ${ENTITIES.length} modules`);
    setExporting(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Full Data Export</h1>
        <p className="text-muted-foreground mt-1">
          Download all data from every module as a single JSON file for transfer to another instance of this app.
        </p>
      </div>

      <div className="bg-white rounded-xl border divide-y">
        {ENTITIES.map(entity => (
          <div key={entity.key} className="flex items-center justify-between px-5 py-3">
            <span className="font-medium text-sm">{entity.label}</span>
            <span className="text-sm">
              {status[entity.key] === 'loading' && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Fetching...
                </span>
              )}
              {status[entity.key] === 'done' && (
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> Done
                </span>
              )}
              {status[entity.key] === 'error' && (
                <span className="text-red-500 text-xs">Error</span>
              )}
              {!status[entity.key] && (
                <span className="text-muted-foreground text-xs">Waiting</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <Button onClick={exportAll} disabled={exporting} size="lg" className="w-full gap-2">
        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {exporting ? 'Exporting...' : 'Export All Data'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        The downloaded file can be imported into the destination app via the database import tool.
      </p>
    </div>
  );
}