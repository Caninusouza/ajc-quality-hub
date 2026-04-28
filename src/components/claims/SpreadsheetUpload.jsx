import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

function normalizeDate(val) {
  if (!val) return undefined;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.split('T')[0];
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return undefined;
}

function rowToClaim(row) {
  const claimId = row['CLAIM ID']?.toString().trim();
  const title = [row['CLAIM SUBTYPE'], row['PRODUCT SUBCATEGORY'], row['CUSTOMER']]
    .filter(Boolean).join(' – ') || claimId || 'Untitled Claim';

  return {
    title,
    claim_id: claimId,
    current_status: row['CURRENT STATUS']?.toString().trim() || 'UNDER REVIEW',
    fiscal_year: row['FISCAL YEAR'] ? Number(row['FISCAL YEAR']) : undefined,
    date_of_claim: normalizeDate(row['DATE OF CLAIM']),
    date_received_by_fsqa: normalizeDate(row['DATE RECEIVED BY FSQA']),
    date_of_claim_finalized: normalizeDate(row['DATE OF CLAIM FINALIZED']),
    claim_lifecycle: row['CLAIM LIFECYCLE ']?.toString().trim() || row['CLAIM LIFECYCLE']?.toString().trim(),
    claim_conversion: row['CLAIM CONVERSION ']?.toString().trim() || row['CLAIM CONVERSION']?.toString().trim(),
    filing_amount: row['FILING AMOUNT'] != null ? Number(row['FILING AMOUNT']) : undefined,
    amount_after_validation: row['AMOUNT AFTER VALIDATION'] != null ? Number(row['AMOUNT AFTER VALIDATION']) : undefined,
    so_number: row['SO NUMBER']?.toString().trim(),
    po_number: row['PO NUMBER']?.toString().trim(),
    customer: row['CUSTOMER']?.toString().trim(),
    supplier: row['SUPPLIER']?.toString().trim(),
    primary_plant: row['PRIMARY PLANT ']?.toString().trim() || row['PRIMARY PLANT']?.toString().trim(),
    secondary_plant: row['SECONDARY PLANT           (IF ANY)']?.toString().trim(),
    product_code: row['PRODUCT CODE ']?.toString().trim() || row['PRODUCT CODE']?.toString().trim(),
    proprietary_brand: row['PROPRIETARY BRAND']?.toString().trim(),
    packaging_configuration: row['PACKAGING CONFIGURATION']?.toString().trim(),
    product_category: row['PRODUCT CATEGORY']?.toString().trim(),
    product_subcategory: row['PRODUCT SUBCATEGORY']?.toString().trim(),
    product_form: row['PRODUCT FORM']?.toString().trim(),
    lot_batch_number: row['LOT / BATCH NUMBER']?.toString().trim(),
    production_date: normalizeDate(row['PRODUCTION DATE']),
    expiration_date: normalizeDate(row['EXPIRATION DATE']),
    qty_cases_received: row['QUANTITY OF CASES RECEIVED']?.toString().trim(),
    qty_cases_at_hand: row['QUANTITY OF CASES AT HAND']?.toString().trim(),
    total_shipment_qty: row['TOTAL SHIPMENT QUANTITY']?.toString().trim(),
    qty_affected: row['QUANTITY AFFECTED  (Cases/Lbs/MT)']?.toString().trim(),
    claim_quality_percentage: row['CLAIM QUALITY PERCENTAGE'] != null ? Number(row['CLAIM QUALITY PERCENTAGE']) : undefined,
    root_cause_category: row['ROOT CAUSE CATEGORY']?.toString().trim(),
    claim_type: row['CLAIM TYPE']?.toString().trim(),
    claim_subtype: row['CLAIM SUBTYPE']?.toString().trim(),
    additional_information: row[' ADDITIONAL INFORMATION']?.toString().trim() || row['ADDITIONAL INFORMATION']?.toString().trim(),
    attachments_available: row['ATTACHMENTS / PHOTOS AVAILABLE?']?.toString().trim(),
    capa_report_created: row['AJC CAPA REPORT / LETTER CREATED?']?.toString().trim(),
    destination_region: row['DESTINATION REGION']?.toString().trim(),
    destination_country: row['DESTINATION COUNTRY']?.toString().trim(),
    origin_region: row['ORIGIN REGION']?.toString().trim(),
    origin_country: row['ORIGIN COUNTRY']?.toString().trim(),
    seller: row['SELLER']?.toString().trim(),
    purchaser: row['PURCHASER']?.toString().trim(),
    claims_rep: row['CLAIMS REP']?.toString().trim(),
    third_party_surveyor: row['3RD PARTY SURVEYOR']?.toString().trim(),
  };
}

export default function SpreadsheetUpload({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState('idle'); // idle | extracting | preview | importing | done
  const [preview, setPreview] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [results, setResults] = useState({ created: 0, skipped: 0, errors: [] });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStep('extracting');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  'CLAIM ID': { type: 'string' },
                  'CURRENT STATUS': { type: 'string' },
                  'FISCAL YEAR': { type: 'number' },
                  'DATE OF CLAIM': { type: 'string' },
                  'DATE RECEIVED BY FSQA': { type: 'string' },
                  'CLAIM LIFECYCLE ': { type: 'string' },
                  'CLAIM CONVERSION ': { type: 'string' },
                  'FILING AMOUNT': { type: 'number' },
                  'AMOUNT AFTER VALIDATION': { type: 'number' },
                  'SO NUMBER': { type: 'string' },
                  'PO NUMBER': { type: 'string' },
                  'CUSTOMER': { type: 'string' },
                  'SUPPLIER': { type: 'string' },
                  'PRIMARY PLANT ': { type: 'string' },
                  'SECONDARY PLANT           (IF ANY)': { type: 'string' },
                  'PRODUCT CODE ': { type: 'string' },
                  'PROPRIETARY BRAND': { type: 'string' },
                  'PACKAGING CONFIGURATION': { type: 'string' },
                  'PRODUCT CATEGORY': { type: 'string' },
                  'PRODUCT SUBCATEGORY': { type: 'string' },
                  'PRODUCT FORM': { type: 'string' },
                  'LOT / BATCH NUMBER': { type: 'string' },
                  'PRODUCTION DATE': { type: 'string' },
                  'EXPIRATION DATE': { type: 'string' },
                  'QUANTITY OF CASES RECEIVED': { type: 'string' },
                  'QUANTITY OF CASES AT HAND': { type: 'string' },
                  'TOTAL SHIPMENT QUANTITY': { type: 'string' },
                  'QUANTITY AFFECTED  (Cases/Lbs/MT)': { type: 'string' },
                  'CLAIM QUALITY PERCENTAGE': { type: 'number' },
                  'ROOT CAUSE CATEGORY': { type: 'string' },
                  'CLAIM TYPE': { type: 'string' },
                  'CLAIM SUBTYPE': { type: 'string' },
                  ' ADDITIONAL INFORMATION': { type: 'string' },
                  'ATTACHMENTS / PHOTOS AVAILABLE?': { type: 'string' },
                  'AJC CAPA REPORT / LETTER CREATED?': { type: 'string' },
                  'DESTINATION REGION': { type: 'string' },
                  'DESTINATION COUNTRY': { type: 'string' },
                  'ORIGIN REGION': { type: 'string' },
                  'ORIGIN COUNTRY': { type: 'string' },
                  'SELLER': { type: 'string' },
                  'PURCHASER': { type: 'string' },
                  'CLAIMS REP': { type: 'string' },
                  '3RD PARTY SURVEYOR': { type: 'string' },
                  'DATE OF CLAIM FINALIZED': { type: 'string' }
                }
              }
            }
          }
        }
      });
      const rows = result?.output?.rows || result?.output || [];
      const mapped = (Array.isArray(rows) ? rows : []).map(rowToClaim).filter(r => r.claim_id || r.title);
      setPreview(mapped);
      setStep('preview');
    } catch (err) {
      toast.error('Failed to extract spreadsheet data');
      setStep('idle');
    }
    e.target.value = '';
  };

  const handleImport = async () => {
    setStep('importing');
    let created = 0, skipped = 0;
    const errors = [];
    for (const claim of preview) {
      try {
        // Check if claim_id already exists
        if (claim.claim_id) {
          const existing = await base44.entities.Claim.filter({ claim_id: claim.claim_id });
          if (existing && existing.length > 0) {
            // Update existing record
            await base44.entities.Claim.update(existing[0].id, claim);
            created++;
            continue;
          }
        }
        await base44.entities.Claim.create(claim);
        created++;
      } catch (e) {
        errors.push(claim.claim_id || claim.title);
        skipped++;
      }
    }
    setResults({ created, skipped, errors });
    setStep('done');
    onComplete?.();
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('idle');
    setPreview([]);
    setResults({ created: 0, skipped: 0, errors: [] });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import Claims from Spreadsheet
          </DialogTitle>
        </DialogHeader>

        {step === 'idle' && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">Upload your Traceability Master Sheet</p>
            <p className="text-xs text-muted-foreground mb-5">Excel (.xlsx) — new claims will be created, existing ones updated</p>
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
              <Button type="button" className="gap-2 pointer-events-none" asChild>
                <span><Upload className="w-4 h-4" /> Select File</span>
              </Button>
            </label>
          </div>
        )}

        {step === 'extracting' && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Extracting data from spreadsheet...</p>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{preview.length} claims found — review before importing</p>
              <Badge variant="outline">{preview.length} records</Badge>
            </div>
            <div className="max-h-72 overflow-y-auto border rounded-lg divide-y text-xs">
              {preview.map((c, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30">
                  <div className="min-w-0">
                    <span className="font-mono text-primary font-medium">{c.claim_id}</span>
                    <span className="ml-2 text-muted-foreground truncate">{c.customer}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[10px]">{c.claim_subtype}</Badge>
                    <Badge variant="outline" className="text-[10px]">{c.current_status}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('idle')}>Back</Button>
              <Button onClick={handleImport} className="gap-2">
                <Upload className="w-4 h-4" />
                Import {preview.length} Claims
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Importing claims...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800">{results.created} claims imported/updated</p>
                {results.skipped > 0 && <p className="text-xs text-emerald-700">{results.skipped} skipped due to errors</p>}
              </div>
            </div>
            {results.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                <p className="font-medium mb-1">Errors:</p>
                {results.errors.map((e, i) => <p key={i}>• {e}</p>)}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}