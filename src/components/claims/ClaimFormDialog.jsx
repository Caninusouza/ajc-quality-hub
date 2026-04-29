import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileAttachments from '@/components/shared/FileAttachments';
import SearchableCountrySelect from '@/components/shared/SearchableCountrySelect';

const FSQA_REPS = {
  'Rafael Souza': 'rsouza@ajcgroup.com',
  'Gabriela Hidalgo': 'ghidalgo@ajcgroup.com',
};
const STATUSES = ['UNDER REVIEW', 'OPEN', 'ON HOLD', 'RESOLVED', 'CLOSED'];
const LIFECYCLES = ['CLAIM', 'COMPLAINT', 'INQUIRY'];
const CLAIM_TYPES = ['QUALITY', 'COMMERCIAL', 'LOGISTIC', 'OTHER'];
const CLAIM_SUBTYPES = ['SPOIL', 'FOREIGN', 'S/WGT', 'OTHER', 'MISLABEL', 'DAMAGE', 'SHORT', 'CONTAMINATION', 'TEMP ABUSE', 'PACKAGING'];
const PRODUCT_CATEGORIES = ['PORK', 'POULTRY', 'BEEF', 'SEAFOOD', 'OTHER'];
const PRODUCT_FORMS = ['FROZEN', 'FRESH', 'CHILLED', 'PROCESSED', 'OTHER'];
const ROOT_CAUSE_CATEGORIES = ['SUPPLIER', 'LOGISTICS', 'STORAGE', 'HANDLING', 'UNKNOWN', 'OTHER'];
const YES_NO = ['YES', 'NO'];
const REGIONS = ['NORTH AMERICA', 'SOUTH AMERICA', 'CENTRAL AMERICA', 'MCA', 'EUROPE', 'ASIA', 'CHINA', 'MIDDLE EAST', 'AFRICA', 'OCEANIA', 'OTHER'];

const defaultForm = () => ({
  title: '', claim_id: '', current_status: 'UNDER REVIEW', fiscal_year: new Date().getFullYear(),
  date_of_claim: '', date_received_by_fsqa: '', date_of_claim_finalized: '', due_date: '',
  claim_lifecycle: 'CLAIM', claim_conversion: 'NO', filing_amount: '', amount_after_validation: '',
  so_number: '', po_number: '', customer: '', supplier: '',
  primary_plant: '', secondary_plant: '', product_code: '', proprietary_brand: 'NO',
  packaging_configuration: '', product_category: '', product_subcategory: '', product_form: '',
  lot_batch_number: '', production_date: '', expiration_date: '',
  qty_cases_received: '', qty_cases_at_hand: '', total_shipment_qty: '', qty_affected: '',
  claim_quality_percentage: '', root_cause_category: '', claim_type: 'QUALITY', claim_subtype: '',
  additional_information: '', attachments_available: 'NO', capa_report_created: 'NO',
  destination_region: '', destination_country: '', origin_region: '', origin_country: '',
  seller: '', purchaser: '', claims_rep: '', third_party_surveyor: 'NO',
  file_attachments: []
});

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

function SimpleSelect({ value, onChange, options, placeholder }) {
  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder || 'Select...'} /></SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function ClaimFormDialog({ open, onOpenChange, onSubmit, initialData, isSubmitting }) {
  const [form, setForm] = useState({ ...defaultForm(), ...(initialData || {}) });

  useEffect(() => {
    setForm({ ...defaultForm(), ...(initialData || {}) });
  }, [initialData, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Claim' : 'New Quality Claim'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2">
          <Tabs defaultValue="general">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
              <TabsTrigger value="product" className="flex-1">Product</TabsTrigger>
              <TabsTrigger value="financial" className="flex-1">Financial</TabsTrigger>
              <TabsTrigger value="logistics" className="flex-1">Logistics</TabsTrigger>
              <TabsTrigger value="attachments" className="flex-1">Files</TabsTrigger>
            </TabsList>

            {/* GENERAL TAB */}
            <TabsContent value="general" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Title *">
                  <Input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Brief description" />
                </Field>
                <Field label="Claim ID">
                  <Input value={form.claim_id} onChange={e => set('claim_id', e.target.value)} placeholder="FSQA-2026-001" />
                </Field>
                <Field label="Status">
                  <SimpleSelect value={form.current_status} onChange={v => set('current_status', v)} options={STATUSES} />
                </Field>
                <Field label="Lifecycle">
                  <SimpleSelect value={form.claim_lifecycle} onChange={v => set('claim_lifecycle', v)} options={LIFECYCLES} />
                </Field>
                <Field label="Claim Type">
                  <SimpleSelect value={form.claim_type} onChange={v => set('claim_type', v)} options={CLAIM_TYPES} />
                </Field>
                <Field label="Claim Subtype">
                  <SimpleSelect value={form.claim_subtype} onChange={v => set('claim_subtype', v)} options={CLAIM_SUBTYPES} placeholder="Select subtype..." />
                </Field>
                <Field label="Date of Claim">
                  <Input type="date" value={form.date_of_claim} onChange={e => set('date_of_claim', e.target.value)} />
                </Field>
                <Field label="Date Received by FSQA">
                  <Input type="date" value={form.date_received_by_fsqa} onChange={e => set('date_received_by_fsqa', e.target.value)} />
                </Field>
                <Field label="Due Date">
                  <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                </Field>
                <Field label="Date Finalized">
                  <Input type="date" value={form.date_of_claim_finalized} onChange={e => set('date_of_claim_finalized', e.target.value)} />
                </Field>
                <Field label="Customer">
                  <Input value={form.customer} onChange={e => set('customer', e.target.value)} />
                </Field>
                <Field label="Supplier">
                  <Input value={form.supplier} onChange={e => set('supplier', e.target.value)} />
                </Field>
                <Field label="Claims Rep">
                  <Input value={form.claims_rep} onChange={e => set('claims_rep', e.target.value)} />
                </Field>
                <Field label="Root Cause Category">
                  <SimpleSelect value={form.root_cause_category} onChange={v => set('root_cause_category', v)} options={ROOT_CAUSE_CATEGORIES} placeholder="Select root cause..." />
                </Field>
                <Field label="CAPA Report Created?">
                  <SimpleSelect value={form.capa_report_created} onChange={v => set('capa_report_created', v)} options={YES_NO} />
                </Field>
                <Field label="3rd Party Surveyor?">
                  <SimpleSelect value={form.third_party_surveyor} onChange={v => set('third_party_surveyor', v)} options={YES_NO} />
                </Field>
                <Field label="Attachments / Photos Available?">
                  <SimpleSelect value={form.attachments_available} onChange={v => set('attachments_available', v)} options={YES_NO} />
                </Field>
                <Field label="FSQA Representative">
                  <SimpleSelect value={form.fsqa_assignee} onChange={v => setForm(prev => ({ ...prev, fsqa_assignee: v, claims_rep: FSQA_REPS[v] || '' }))} options={Object.keys(FSQA_REPS)} placeholder="Select representative..." />
                </Field>
                <Field label="FSQA Representative Email">
                  <Input value={FSQA_REPS[form.fsqa_assignee] || ''} disabled className="bg-muted text-muted-foreground cursor-not-allowed opacity-100" placeholder="Auto-populated from representative" />
                </Field>
              </div>
              <Field label="Additional Information">
                <Textarea value={form.additional_information} onChange={e => set('additional_information', e.target.value)} rows={4} placeholder="Detailed description..." />
              </Field>
            </TabsContent>

            {/* PRODUCT TAB */}
            <TabsContent value="product" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Product Category">
                  <SimpleSelect value={form.product_category} onChange={v => set('product_category', v)} options={PRODUCT_CATEGORIES} placeholder="Select category..." />
                </Field>
                <Field label="Product Subcategory">
                  <Input value={form.product_subcategory} onChange={e => set('product_subcategory', e.target.value)} placeholder="e.g. BONE-IN LOIN, CHICKEN PAWS" />
                </Field>
                <Field label="Product Code">
                  <Input value={form.product_code} onChange={e => set('product_code', e.target.value)} />
                </Field>
                <Field label="Product Form">
                  <SimpleSelect value={form.product_form} onChange={v => set('product_form', v)} options={PRODUCT_FORMS} placeholder="Select form..." />
                </Field>
                <Field label="Proprietary Brand">
                  <Input value={form.proprietary_brand} onChange={e => set('proprietary_brand', e.target.value)} placeholder="YES / NO / Brand name" />
                </Field>
                <Field label="Packaging Configuration">
                  <Input value={form.packaging_configuration} onChange={e => set('packaging_configuration', e.target.value)} />
                </Field>
                <Field label="Primary Plant">
                  <Input value={form.primary_plant} onChange={e => set('primary_plant', e.target.value)} placeholder="e.g. 717CR, P-510" />
                </Field>
                <Field label="Secondary Plant (if any)">
                  <Input value={form.secondary_plant} onChange={e => set('secondary_plant', e.target.value)} placeholder="N/A if none" />
                </Field>
                <Field label="Lot / Batch Number">
                  <Input value={form.lot_batch_number} onChange={e => set('lot_batch_number', e.target.value)} />
                </Field>
                <Field label="Production Date">
                  <Input type="date" value={form.production_date} onChange={e => set('production_date', e.target.value)} />
                </Field>
                <Field label="Expiration Date">
                  <Input type="date" value={form.expiration_date} onChange={e => set('expiration_date', e.target.value)} />
                </Field>
                <Field label="Claim Quality %">
                  <Input type="number" value={form.claim_quality_percentage} onChange={e => set('claim_quality_percentage', e.target.value)} step="0.01" placeholder="0.00" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cases Received">
                  <Input value={form.qty_cases_received} onChange={e => set('qty_cases_received', e.target.value)} />
                </Field>
                <Field label="Cases at Hand">
                  <Input value={form.qty_cases_at_hand} onChange={e => set('qty_cases_at_hand', e.target.value)} />
                </Field>
                <Field label="Total Shipment Qty">
                  <Input value={form.total_shipment_qty} onChange={e => set('total_shipment_qty', e.target.value)} />
                </Field>
                <Field label="Qty Affected (Cases/Lbs/MT)">
                  <Input value={form.qty_affected} onChange={e => set('qty_affected', e.target.value)} />
                </Field>
              </div>
            </TabsContent>

            {/* FINANCIAL TAB */}
            <TabsContent value="financial" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fiscal Year">
                  <Input type="number" value={form.fiscal_year} onChange={e => set('fiscal_year', e.target.value)} />
                </Field>
                <Field label="Claim Conversion">
                  <SimpleSelect value={form.claim_conversion} onChange={v => set('claim_conversion', v)} options={YES_NO} />
                </Field>
                <Field label="SO Number">
                  <Input value={form.so_number} onChange={e => set('so_number', e.target.value)} />
                </Field>
                <Field label="PO Number">
                  <Input value={form.po_number} onChange={e => set('po_number', e.target.value)} />
                </Field>
                <Field label="Filing Amount (USD)">
                  <Input type="number" value={form.filing_amount} onChange={e => set('filing_amount', e.target.value)} step="0.01" placeholder="0.00" />
                </Field>
                <Field label="Amount After Validation (USD)">
                  <Input type="number" value={form.amount_after_validation} onChange={e => set('amount_after_validation', e.target.value)} step="0.01" placeholder="0.00" />
                </Field>
                <Field label="Seller">
                  <Input value={form.seller} onChange={e => set('seller', e.target.value)} />
                </Field>
                <Field label="Purchaser">
                  <Input value={form.purchaser} onChange={e => set('purchaser', e.target.value)} />
                </Field>
              </div>
            </TabsContent>

            {/* LOGISTICS TAB */}
            <TabsContent value="logistics" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Origin Region">
                  <SimpleSelect value={form.origin_region} onChange={v => set('origin_region', v)} options={REGIONS} placeholder="Select region..." />
                </Field>
                <Field label="Origin Country">
                  <SearchableCountrySelect value={form.origin_country} onChange={v => set('origin_country', v)} />
                </Field>
                <Field label="Destination Region">
                  <SimpleSelect value={form.destination_region} onChange={v => set('destination_region', v)} options={REGIONS} placeholder="Select region..." />
                </Field>
                <Field label="Destination Country">
                  <SearchableCountrySelect value={form.destination_country} onChange={v => set('destination_country', v)} />
                </Field>
              </div>
            </TabsContent>

            {/* FILES TAB */}
            <TabsContent value="attachments">
              <FileAttachments
                attachments={form.file_attachments || []}
                onChange={files => set('file_attachments', files)}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{initialData ? 'Update' : 'Create'} Claim</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}