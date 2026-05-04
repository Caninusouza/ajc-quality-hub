import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    supplier_name: { type: 'string' },
    visit_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
    visited_by: { type: 'string' },
    supplier_address: { type: 'string' },
    supplier_contact_name: { type: 'string' },
    supplier_contact_email: { type: 'string' },
    supplier_contact_phone: { type: 'string' },
    product_types: {
      type: 'array',
      items: { type: 'string', enum: ['Chicken', 'Pork', 'Beef', 'Fish', 'Turkey', 'Vegetables', 'Fruits', 'French Fries', 'Other'] }
    },
    product_types_other: { type: 'string' },
    product_production_lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          cut: { type: 'string' },
          volume: { type: 'string' },
          unit: { type: 'string' }
        }
      }
    },
    weekly_slaughter: { type: 'string', enum: ['Yes', 'No', 'N/A'] },
    weekly_slaughter_volume: { type: 'string' },
    number_of_employees: { type: 'number' },
    third_party_audit: { type: 'string', enum: ['Yes', 'No'] },
    third_party_audit_types: {
      type: 'array',
      items: { type: 'string', enum: ['SQF', 'BRC', 'FSSC 22000', 'IFS', 'GLOBALG.A.P.', 'Primus GFS', 'Costco', 'Other'] }
    },
    third_party_audit_other: { type: 'string' },
    audit_expiry_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
    food_safety_plan: { type: 'string', enum: ['HACCP', 'HARPC', 'Both', 'None'] },
    gmp_program: { type: 'string', enum: ['Yes', 'No'] },
    allergen_program: { type: 'string', enum: ['Yes', 'No'] },
    pest_control_program: { type: 'string', enum: ['Yes', 'No'] },
    water_testing_program: { type: 'string', enum: ['Yes', 'No'] },
    traceability_program: { type: 'string', enum: ['Yes', 'No'] },
    plant_inspection_conducted: { type: 'string', enum: ['Yes', 'No'] },
    inspection_exterior: { type: 'string', enum: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'] },
    inspection_exterior_comment: { type: 'string' },
    inspection_receiving: { type: 'string', enum: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'] },
    inspection_receiving_comment: { type: 'string' },
    inspection_storage: { type: 'string', enum: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'] },
    inspection_storage_comment: { type: 'string' },
    inspection_processing: { type: 'string', enum: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'] },
    inspection_processing_comment: { type: 'string' },
    inspection_sanitation: { type: 'string', enum: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'] },
    inspection_sanitation_comment: { type: 'string' },
    inspection_employee_hygiene: { type: 'string', enum: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'] },
    inspection_employee_hygiene_comment: { type: 'string' },
    inspection_pest_control: { type: 'string', enum: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'] },
    inspection_pest_control_comment: { type: 'string' },
    inspection_temperature_control: { type: 'string', enum: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'] },
    inspection_temperature_control_comment: { type: 'string' },
    inspection_labeling: { type: 'string', enum: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'] },
    inspection_labeling_comment: { type: 'string' },
    inspection_overall_rating: { type: 'string', enum: ['Pass', 'Conditional Pass', 'Fail'] },
    inspection_notes: { type: 'string' },
    general_notes: { type: 'string' },
  }
};

export default function UploadFilledForm({ onExtracted }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | extracting | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setErrorMsg('');
    setStatus('idle');
    // Preview for images
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');

    // Upload the file
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    setStatus('extracting');

    // Use AI vision to extract all form fields
    const extracted = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert data extraction assistant. 
This is a filled AJC Supplier Intake & Assessment Form (handwritten or typed).
Extract ALL visible information from this form and return it as structured JSON.

Rules:
- For checkbox fields, only include values that are clearly checked/marked (✓, X, circled, or filled).
- For date fields, return in YYYY-MM-DD format if possible.
- For product_types, only include items that are checked.
- For inspection ratings, only include the rating that is checked for each area.
- If a field is blank or not visible, omit it from the response.
- For product_production_lines, extract each row in the weekly production table.
- Be thorough — extract every piece of information visible on the form.`,
      file_urls: [file_url],
      response_json_schema: EXTRACTION_SCHEMA,
    });

    // Clean up nulls/empty
    const cleaned = {};
    for (const [k, v] of Object.entries(extracted)) {
      if (v === null || v === undefined || v === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;
      cleaned[k] = v;
    }

    setStatus('done');

    // Small delay so user sees the success state
    setTimeout(() => {
      setOpen(false);
      reset();
      onExtracted({ ...cleaned, status: 'Draft' });
    }, 1200);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = ev => setPreview(ev.target.result);
        reader.readAsDataURL(f);
      }
    }
  };

  const isLoading = status === 'uploading' || status === 'extracting';

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => { reset(); setOpen(true); }}
      >
        <Upload className="w-4 h-4" />
        Upload Filled Form
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!isLoading) { setOpen(o); if (!o) reset(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary" />
              Upload Filled Supplier Form
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Upload a photo or scan of the manually filled form. The AI will read all the fields and pre-populate the intake record for you to review.
          </p>

          {/* Drop zone */}
          {status !== 'done' && (
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
                file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40",
                isLoading && "pointer-events-none opacity-60"
              )}
              onClick={() => !isLoading && inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {preview ? (
                <div className="relative inline-block">
                  <img src={preview} alt="Preview" className="max-h-48 max-w-full rounded-lg mx-auto object-contain" />
                  {!isLoading && (
                    <button
                      onClick={e => { e.stopPropagation(); reset(); }}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileImage className="w-10 h-10 text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">Supports images (JPG, PNG) and PDF</p>
                </div>
              )}
            </div>
          )}

          {/* Status messages */}
          {status === 'uploading' && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-700">Uploading file...</p>
                <p className="text-xs text-blue-500">Preparing for analysis</p>
              </div>
            </div>
          )}

          {status === 'extracting' && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-700">Reading form data...</p>
                <p className="text-xs text-blue-500">AI is extracting all fields from your form</p>
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700">Data extracted successfully!</p>
                <p className="text-xs text-green-500">Opening the form with pre-filled data...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Extraction failed</p>
                <p className="text-xs text-red-500">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleExtract}
              disabled={!file || isLoading || status === 'done'}
              className="gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />}
              {status === 'uploading' ? 'Uploading...' : status === 'extracting' ? 'Reading...' : 'Extract & Fill'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}