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

const STATUSES = ['UNDER REVIEW', 'OPEN', 'ON HOLD', 'RESOLVED', 'CLOSED'];
const LIFECYCLES = ['CLAIM', 'COMPLAINT', 'INQUIRY'];

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

export default function ClaimFormDialog({ open, onOpenChange, onSubmit, initialData, isSubmitting }) {
  const [form, setForm] = useState(initialData || defaultForm());

  useEffect(() => {
    setForm(initialData || defaultForm());
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

            <TabsContent value="general" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Title *">
                  <Input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Brief description" />
                </Field>
                <Field label="Claim ID">
                  <Input value={form.claim_id} onChange={e => set('claim_id', e.target.value)} placeholder="FSQA-2026-001" />
                </Field>
                <Field label="Status">
                  <Select value={form.current_status} onValueChange={v => set('current_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Lifecycle">
                  <Select value={form.claim_lifecycle} onValueChange={v => set('claim_lifecycle', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LIFECYCLES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
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
                <Field label="Claim Type">
                  <Input value={form.claim_type} onChange={e => set('claim_type', e.target.value)} placeholder="e.g. QUALITY" />
                </Field>
                <Field label="Claim Subtype">
                  <Input value={form.claim_subtype} onChange={e => set('claim_subtype', e.target.value)} placeholder="e.g. SPOIL, FOREIGN" />
                </Field>
                <Field label="Claims Rep">
                  <Input value={form.claims_rep} onChange={e => set('claims_rep', e.target.value)} />
                </Field>
                <Field label="Root Cause Category">
                  <Input value={form.root_cause_category} onChange={e => set('root_cause_category', e.target.value)} />
                </Field>
                <Field label="Customer">
                  <Input value={form.customer} onChange={e => set('customer', e.target.value)} />
                </Field>
                <Field label="Supplier">
                  <Input value={form.supplier} onChange={e => set('supplier', e.target.value)} />
                </Field>
              </div>
              <Field label="Additional Information">
                <Textarea value={form.additional_information} onChange={e => set('additional_information', e.target.value)} rows={4} placeholder="Detailed description..." />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CAPA Report Created?">
                  <Select value={form.capa_report_created} onValueChange={v => set('capa_report_created', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="YES">YES</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="3rd Party Surveyor?">
                  <Select value={form.third_party_surveyor} onValueChange={v => set('third_party_surveyor', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="YES">YES</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent>
                  </Select>
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="product" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Product Category">
                  <Input value={form.product_category} onChange={e => set('product_category', e.target.value)} placeholder="e.g. PORK, POULTRY" />
                </Field>
                <Field label="Product Subcategory">
                  <Input value={form.product_subcategory} onChange={e => set('product_subcategory', e.target.value)} />
                </Field>
                <Field label="Product Code">
                  <Input value={form.product_code} onChange={e => set('product_code', e.target.value)} />
                </Field>
                <Field label="Product Form">
                  <Input value={form.product_form} onChange={e => set('product_form', e.target.value)} placeholder="e.g. FROZEN, FRESH" />
                </Field>
                <Field label="Proprietary Brand">
                  <Input value={form.proprietary_brand} onChange={e => set('proprietary_brand', e.target.value)} placeholder="YES/NO or brand name" />
                </Field>
                <Field label="Packaging Configuration">
                  <Input value={form.packaging_configuration} onChange={e => set('packaging_configuration', e.target.value)} />
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
                <Field label="Primary Plant">
                  <Input value={form.primary_plant} onChange={e => set('primary_plant', e.target.value)} />
                </Field>
                <Field label="Secondary Plant">
                  <Input value={form.secondary_plant} onChange={e => set('secondary_plant', e.target.value)} />
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
                <Field label="Claim Quality %">
                  <Input type="number" value={form.claim_quality_percentage} onChange={e => set('claim_quality_percentage', e.target.value)} step="0.01" />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="SO Number">
                  <Input value={form.so_number} onChange={e => set('so_number', e.target.value)} />
                </Field>
                <Field label="PO Number">
                  <Input value={form.po_number} onChange={e => set('po_number', e.target.value)} />
                </Field>
                <Field label="Fiscal Year">
                  <Input type="number" value={form.fiscal_year} onChange={e => set('fiscal_year', e.target.value)} />
                </Field>
                <Field label="Claim Conversion">
                  <Select value={form.claim_conversion} onValueChange={v => set('claim_conversion', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="YES">YES</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Filing Amount (USD)">
                  <Input type="number" value={form.filing_amount} onChange={e => set('filing_amount', e.target.value)} step="0.01" />
                </Field>
                <Field label="Amount After Validation (USD)">
                  <Input type="number" value={form.amount_after_validation} onChange={e => set('amount_after_validation', e.target.value)} step="0.01" />
                </Field>
                <Field label="Seller">
                  <Input value={form.seller} onChange={e => set('seller', e.target.value)} />
                </Field>
                <Field label="Purchaser">
                  <Input value={form.purchaser} onChange={e => set('purchaser', e.target.value)} />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="logistics" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Origin Region">
                  <Input value={form.origin_region} onChange={e => set('origin_region', e.target.value)} />
                </Field>
                <Field label="Origin Country">
                  <SearchableCountrySelect value={form.origin_country} onChange={v => set('origin_country', v)} />
                </Field>
                <Field label="Destination Region">
                  <Input value={form.destination_region} onChange={e => set('destination_region', e.target.value)} />
                </Field>
                <Field label="Destination Country">
                  <SearchableCountrySelect value={form.destination_country} onChange={v => set('destination_country', v)} />
                </Field>
              </div>
            </TabsContent>

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