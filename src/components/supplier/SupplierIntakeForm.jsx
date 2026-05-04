import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Building2, User, Package, ShieldCheck, Factory, Paperclip, ClipboardList, Upload, X, CheckCircle2, Plus, Trash2
} from 'lucide-react';

const PRODUCT_TYPES = ['Chicken', 'Pork', 'Beef', 'Fish', 'Turkey', 'Vegetables', 'Fruits', 'French Fries', 'Other'];
const AUDIT_TYPES = ['SQF', 'BRC', 'FSSC 22000', 'IFS', 'GLOBALG.A.P.', 'Primus GFS', 'Costco', 'Other'];

const INSPECTION_AREAS = [
  { key: 'inspection_exterior', label: 'Exterior / Grounds' },
  { key: 'inspection_receiving', label: 'Receiving Area' },
  { key: 'inspection_storage', label: 'Storage / Warehouse' },
  { key: 'inspection_processing', label: 'Processing / Production Floor' },
  { key: 'inspection_sanitation', label: 'Sanitation Practices' },
  { key: 'inspection_employee_hygiene', label: 'Employee Hygiene & GMP' },
  { key: 'inspection_pest_control', label: 'Pest Control Evidence' },
  { key: 'inspection_temperature_control', label: 'Temperature Control' },
  { key: 'inspection_labeling', label: 'Labeling & Traceability' },
];

const RATING_OPTIONS = ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'];

const RATING_COLORS = {
  'Satisfactory': 'bg-green-100 text-green-800 border-green-200',
  'Needs Improvement': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Unsatisfactory': 'bg-red-100 text-red-800 border-red-200',
  'N/A': 'bg-gray-100 text-gray-600 border-gray-200',
};

function SectionHeader({ icon: SectionIcon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
        <SectionIcon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldRow({ label, children, required }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function MultiToggle({ options, selected = [], onChange }) {
  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm border font-medium transition-all",
            selected.includes(opt)
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-foreground border-border hover:border-primary/50"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function YesNoSelect({ value, onChange, options = ['Yes', 'No'] }) {
  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-4 py-1.5 rounded-lg border text-sm font-medium transition-all",
            value === opt
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:border-primary/50"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function SupplierIntakeForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState(initialData || {
    supplier_name: '', visit_date: '', visited_by: '',
    supplier_address: '', supplier_contact_name: '',
    supplier_contact_email: '', supplier_contact_phone: '',
    product_types: [], product_types_other: '',
    product_production_lines: [],
    weekly_slaughter: 'N/A', weekly_slaughter_volume: '',
    number_of_employees: '',
    third_party_audit: 'No', third_party_audit_types: [], third_party_audit_other: '', audit_expiry_date: '',
    food_safety_plan: '', gmp_program: '', allergen_program: '',
    pest_control_program: '', water_testing_program: '', traceability_program: '',
    plant_inspection_conducted: 'No',
    inspection_exterior: 'N/A', inspection_receiving: 'N/A', inspection_storage: 'N/A',
    inspection_processing: 'N/A', inspection_sanitation: 'N/A',
    inspection_employee_hygiene: 'N/A', inspection_pest_control: 'N/A',
    inspection_temperature_control: 'N/A', inspection_labeling: 'N/A',
    inspection_overall_rating: '', inspection_notes: '',
    general_notes: '', status: 'Draft', file_attachments: [],
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ name: file.name, url: file_url });
    }
    set('file_attachments', [...(form.file_attachments || []), ...uploaded]);
    setUploading(false);
  };

  const removeFile = (idx) => {
    set('file_attachments', form.file_attachments.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (status) => {
    setSaving(true);
    await onSave({ ...form, status });
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">

      {/* Section 1: Supplier Info */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Building2} title="Supplier Information" subtitle="Basic contact and visit details" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Supplier Name" required>
            <Input value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} placeholder="e.g. ABC Poultry Co." />
          </FieldRow>
          <FieldRow label="Visit Date" required>
            <Input type="date" value={form.visit_date} onChange={e => set('visit_date', e.target.value)} />
          </FieldRow>
          <FieldRow label="Visited By">
            <Input value={form.visited_by} onChange={e => set('visited_by', e.target.value)} placeholder="FSQA representative name" />
          </FieldRow>
          <FieldRow label="Supplier Address">
            <Input value={form.supplier_address} onChange={e => set('supplier_address', e.target.value)} placeholder="City, State, Country" />
          </FieldRow>
          <FieldRow label="Contact Person">
            <Input value={form.supplier_contact_name} onChange={e => set('supplier_contact_name', e.target.value)} placeholder="Full name" />
          </FieldRow>
          <FieldRow label="Contact Email">
            <Input type="email" value={form.supplier_contact_email} onChange={e => set('supplier_contact_email', e.target.value)} placeholder="email@supplier.com" />
          </FieldRow>
          <FieldRow label="Contact Phone">
            <Input value={form.supplier_contact_phone} onChange={e => set('supplier_contact_phone', e.target.value)} placeholder="+1 (000) 000-0000" />
          </FieldRow>
        </CardContent>
      </Card>

      {/* Section 2: Products & Operations */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Package} title="Products & Operations" subtitle="Product types and production capacity" />
        </CardHeader>
        <CardContent className="space-y-5">
          <FieldRow label="Product Types" required>
            <MultiToggle options={PRODUCT_TYPES} selected={form.product_types} onChange={v => set('product_types', v)} />
            {form.product_types?.includes('Other') && (
              <Input className="mt-2" value={form.product_types_other} onChange={e => set('product_types_other', e.target.value)} placeholder="Specify other product types..." />
            )}
          </FieldRow>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldRow label="Weekly Slaughter">
              <YesNoSelect value={form.weekly_slaughter} onChange={v => set('weekly_slaughter', v)} options={['Yes', 'No', 'N/A']} />
            </FieldRow>
            {form.weekly_slaughter === 'Yes' && (
              <FieldRow label="Slaughter Volume / Week">
                <Input value={form.weekly_slaughter_volume} onChange={e => set('weekly_slaughter_volume', e.target.value)} placeholder="e.g. 50,000 birds" />
              </FieldRow>
            )}
            <FieldRow label="Number of Employees">
              <Input type="number" value={form.number_of_employees} onChange={e => set('number_of_employees', e.target.value)} placeholder="e.g. 450" />
            </FieldRow>
          </div>

          {/* Product Production Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Weekly Production by Product / Cut</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => set('product_production_lines', [...(form.product_production_lines || []), { category: '', cut: '', volume: '', unit: 'lbs' }])}
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </Button>
            </div>

            {(form.product_production_lines || []).length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">No products added yet. Click "Add Product" to specify production volumes per category/cut.</p>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-[1fr_1fr_120px_80px_36px] gap-2 px-1">
                  <span className="text-xs font-medium text-muted-foreground">Category</span>
                  <span className="text-xs font-medium text-muted-foreground">Cut / SKU</span>
                  <span className="text-xs font-medium text-muted-foreground">Weekly Volume</span>
                  <span className="text-xs font-medium text-muted-foreground">Unit</span>
                  <span />
                </div>
                {(form.product_production_lines || []).map((line, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_120px_80px_36px] gap-2 items-center bg-muted/30 rounded-lg p-2 border">
                    <Select
                      value={line.category}
                      onValueChange={val => {
                        const lines = [...(form.product_production_lines || [])];
                        lines[idx] = { ...lines[idx], category: val };
                        set('product_production_lines', lines);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Category..." /></SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-8 text-xs"
                      value={line.cut}
                      onChange={e => {
                        const lines = [...(form.product_production_lines || [])];
                        lines[idx] = { ...lines[idx], cut: e.target.value };
                        set('product_production_lines', lines);
                      }}
                      placeholder="e.g. Boneless Breast"
                    />
                    <Input
                      className="h-8 text-xs"
                      value={line.volume}
                      onChange={e => {
                        const lines = [...(form.product_production_lines || [])];
                        lines[idx] = { ...lines[idx], volume: e.target.value };
                        set('product_production_lines', lines);
                      }}
                      placeholder="e.g. 50,000"
                    />
                    <Select
                      value={line.unit}
                      onValueChange={val => {
                        const lines = [...(form.product_production_lines || [])];
                        lines[idx] = { ...lines[idx], unit: val };
                        set('product_production_lines', lines);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['lbs', 'kg', 'cases', 'units', 'birds', 'heads'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => set('product_production_lines', (form.product_production_lines || []).filter((_, i) => i !== idx))}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Food Safety Programs */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={ShieldCheck} title="Food Safety Programs" subtitle="Certifications, audits, and prerequisite programs" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FieldRow label="Food Safety Plan">
              <Select value={form.food_safety_plan} onValueChange={v => set('food_safety_plan', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {['HACCP', 'HARPC', 'Both', 'None'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="3rd Party Audit Present?">
              <YesNoSelect value={form.third_party_audit} onChange={v => set('third_party_audit', v)} />
            </FieldRow>
          </div>

          {form.third_party_audit === 'Yes' && (
            <div className="space-y-3 p-4 bg-muted/40 rounded-lg border">
              <FieldRow label="Audit Certifications">
                <MultiToggle options={AUDIT_TYPES} selected={form.third_party_audit_types} onChange={v => set('third_party_audit_types', v)} />
                {form.third_party_audit_types?.includes('Other') && (
                  <Input className="mt-2" value={form.third_party_audit_other} onChange={e => set('third_party_audit_other', e.target.value)} placeholder="Specify other certifications..." />
                )}
              </FieldRow>
              <FieldRow label="Audit / Certificate Expiry Date">
                <Input type="date" value={form.audit_expiry_date} onChange={e => set('audit_expiry_date', e.target.value)} className="max-w-xs" />
              </FieldRow>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'gmp_program', label: 'GMP Program' },
              { key: 'allergen_program', label: 'Allergen Program' },
              { key: 'pest_control_program', label: 'Pest Control Program' },
              { key: 'water_testing_program', label: 'Water Testing Program' },
              { key: 'traceability_program', label: 'Traceability Program' },
            ].map(({ key, label }) => (
              <FieldRow key={key} label={label}>
                <YesNoSelect value={form[key]} onChange={v => set(key, v)} />
              </FieldRow>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Plant Inspection */}
      <Card className={cn(form.plant_inspection_conducted === 'Yes' && "border-primary/30")}>
        <CardHeader className="pb-3">
          <SectionHeader icon={ClipboardList} title="Plant Inspection Walk-Through" subtitle="Was a physical plant inspection conducted during this visit?" />
          <YesNoSelect value={form.plant_inspection_conducted} onChange={v => set('plant_inspection_conducted', v)} />
        </CardHeader>

        {form.plant_inspection_conducted === 'Yes' && (
          <CardContent className="space-y-5">
            <Separator />
            <p className="text-sm text-muted-foreground">Rate each area observed during the walk-through:</p>
            <div className="space-y-1">
              {INSPECTION_AREAS.map(({ key, label }) => (
                <div key={key} className="py-2 border-b last:border-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-sm font-medium min-w-[220px]">{label}</span>
                    <div className="flex flex-wrap gap-2">
                      {RATING_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => set(key, opt)}
                          className={cn(
                            "px-3 py-1 rounded-md text-xs font-medium border transition-all",
                            form[key] === opt
                              ? RATING_COLORS[opt]
                              : "bg-background border-border text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form[key] && form[key] !== 'N/A' && (
                    <div className="mt-2 ml-0 sm:ml-[220px]">
                      <Textarea
                        value={form[`${key}_comment`] || ''}
                        onChange={e => set(`${key}_comment`, e.target.value)}
                        placeholder={`Comment on ${label.toLowerCase()}...`}
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <FieldRow label="Overall Inspection Rating">
                <div className="flex gap-2 flex-wrap">
                  {['Pass', 'Conditional Pass', 'Fail'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set('inspection_overall_rating', opt)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg border text-sm font-semibold transition-all",
                        form.inspection_overall_rating === opt
                          ? opt === 'Pass' ? 'bg-green-600 text-white border-green-600'
                            : opt === 'Conditional Pass' ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-red-600 text-white border-red-600'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </FieldRow>
            </div>

            <FieldRow label="Inspection Notes">
              <Textarea
                value={form.inspection_notes}
                onChange={e => set('inspection_notes', e.target.value)}
                placeholder="Observations, corrective actions required, follow-up items..."
                className="min-h-[100px]"
              />
            </FieldRow>
          </CardContent>
        )}
      </Card>

      {/* Section 5: Documentation */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Paperclip} title="Documentation & Attachments" subtitle="Upload audit certificates, photos, or supporting documents" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Drag & drop files or click to browse</p>
            <label className="cursor-pointer">
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                {uploading ? 'Uploading...' : 'Choose Files'}
              </span>
            </label>
          </div>
          {form.file_attachments?.length > 0 && (
            <div className="space-y-2">
              {form.file_attachments.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate">{f.name}</a>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive ml-2 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 6: General Notes */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold text-base">General Notes</h3>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.general_notes}
            onChange={e => set('general_notes', e.target.value)}
            placeholder="Additional observations, recommendations, or follow-up actions..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => handleSubmit('Draft')} disabled={saving}>
            Save as Draft
          </Button>
          <Button type="button" onClick={() => handleSubmit('Submitted')} disabled={saving || !form.supplier_name || !form.visit_date}>
            <CheckCircle2 className="w-4 h-4" />
            {saving ? 'Saving...' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}