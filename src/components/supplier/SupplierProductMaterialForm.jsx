import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileAttachments from '@/components/shared/FileAttachments';

const PRODUCT_CATEGORIES = ['Chicken', 'Pork', 'Beef', 'Fish', 'Turkey', 'Vegetables', 'Fruits', 'French Fries', 'Other'];
const PRIMARY_MATERIALS = ['Poly Bag', 'Vacuum Bag', 'Cryovac', 'Tray', 'Foam Tray', 'Other'];
const SECONDARY_MATERIALS = ['Cardboard Box', 'Poly Bag', 'Shrink Wrap', 'Other'];

const defaultForm = () => ({
  supplier_name: '',
  plant_number: '',
  product_name: '',
  product_category: '',
  product_category_other: '',
  product_cut: '',
  brand_type: '',
  market_channel: '',
  primary_packaging_material: '',
  primary_packaging_material_other: '',
  primary_packaging_configuration: '',
  primary_packaging_weight: '',
  primary_bag_type: '',
  primary_recyclable: '',
  secondary_packaging_material: '',
  secondary_packaging_material_other: '',
  secondary_packaging_configuration: '',
  secondary_packaging_weight: '',
  secondary_recyclable: '',
  palletization_configuration: '',
  status: 'Draft',
  notes: '',
  file_attachments: [],
});

const isPrimaryBag = (material) => ['Poly Bag', 'Vacuum Bag', 'Cryovac'].includes(material);

export default function SupplierProductMaterialForm({ initialData, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(initialData || defaultForm());

  useEffect(() => {
    setForm(initialData || defaultForm());
  }, [initialData]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Supplier Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Supplier Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Supplier Name *</Label>
            <Input value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} placeholder="e.g. ABC Foods Inc." required />
          </div>
          <div>
            <Label>Plant Number</Label>
            <Input value={form.plant_number} onChange={e => set('plant_number', e.target.value)} placeholder="e.g. EST. 12345" />
          </div>
        </CardContent>
      </Card>

      {/* Product Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Product Name *</Label>
            <Input value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="e.g. Boneless Skinless Chicken Breast" required />
          </div>
          <div>
            <Label>Product Category</Label>
            <Select value={form.product_category} onValueChange={v => set('product_category', v)}>
              <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
              <SelectContent>{PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.product_category === 'Other' && (
            <div className="sm:col-span-2">
              <Label>Category (Other)</Label>
              <Input value={form.product_category_other} onChange={e => set('product_category_other', e.target.value)} placeholder="Specify category..." />
            </div>
          )}
          <div>
            <Label>Product Cut</Label>
            <Input value={form.product_cut} onChange={e => set('product_cut', e.target.value)} placeholder="e.g. Whole, Half, Diced, Sliced..." />
          </div>
          <div>
            <Label>Brand / Unbranded</Label>
            <Select value={form.brand_type} onValueChange={v => set('brand_type', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Branded">Branded</SelectItem>
                <SelectItem value="Unbranded">Unbranded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Market Channel</Label>
            <Select value={form.market_channel} onValueChange={v => set('market_channel', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Food Service">Food Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Primary Packaging */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Primary Packaging <span className="text-xs font-normal text-muted-foreground">(Inner / consumer unit)</span></CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Primary Package Material</Label>
            <Select value={form.primary_packaging_material} onValueChange={v => set('primary_packaging_material', v)}>
              <SelectTrigger><SelectValue placeholder="Select material..." /></SelectTrigger>
              <SelectContent>{PRIMARY_MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.primary_packaging_material === 'Other' && (
            <div>
              <Label>Primary Material (Other)</Label>
              <Input value={form.primary_packaging_material_other} onChange={e => set('primary_packaging_material_other', e.target.value)} placeholder="Specify..." />
            </div>
          )}
          {isPrimaryBag(form.primary_packaging_material) && (
            <div>
              <Label>Bag Type</Label>
              <Select value={form.primary_bag_type} onValueChange={v => set('primary_bag_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select bag type..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Printed">Printed</SelectItem>
                  <SelectItem value="Clear Poly">Clear Poly</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Primary Configuration</Label>
            <Input value={form.primary_packaging_configuration} onChange={e => set('primary_packaging_configuration', e.target.value)} placeholder="e.g. 10 lb bag, individual vacuum" />
          </div>
          <div>
            <Label>Primary Weight</Label>
            <Input value={form.primary_packaging_weight} onChange={e => set('primary_packaging_weight', e.target.value)} placeholder="e.g. 10 lbs" />
          </div>
          <div>
            <Label>Primary Recyclable</Label>
            <Select value={form.primary_recyclable} onValueChange={v => set('primary_recyclable', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Partially">Partially</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Packaging */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Secondary Packaging <span className="text-xs font-normal text-muted-foreground">(Outer / case)</span></CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Secondary Package Material</Label>
            <Select value={form.secondary_packaging_material} onValueChange={v => set('secondary_packaging_material', v)}>
              <SelectTrigger><SelectValue placeholder="Select material..." /></SelectTrigger>
              <SelectContent>{SECONDARY_MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.secondary_packaging_material === 'Other' && (
            <div>
              <Label>Secondary Material (Other)</Label>
              <Input value={form.secondary_packaging_material_other} onChange={e => set('secondary_packaging_material_other', e.target.value)} placeholder="Specify..." />
            </div>
          )}
          <div>
            <Label>Secondary Configuration</Label>
            <Input value={form.secondary_packaging_configuration} onChange={e => set('secondary_packaging_configuration', e.target.value)} placeholder="e.g. 4 bags per case" />
          </div>
          <div>
            <Label>Secondary Weight</Label>
            <Input value={form.secondary_packaging_weight} onChange={e => set('secondary_packaging_weight', e.target.value)} placeholder="e.g. 40 lbs / case" />
          </div>
          <div>
            <Label>Secondary Recyclable</Label>
            <Select value={form.secondary_recyclable} onValueChange={v => set('secondary_recyclable', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Partially">Partially</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Palletization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Palletization</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Palletization Configuration</Label>
          <Input value={form.palletization_configuration} onChange={e => set('palletization_configuration', e.target.value)} placeholder="e.g. 50 cases / pallet, 5 layers x 10 cases" />
        </CardContent>
      </Card>

      {/* Notes & Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Draft', 'Submitted', 'Approved', 'Rejected'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any additional notes or comments..." />
          </div>
        </CardContent>
      </Card>

      {/* File Attachments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attachments</CardTitle>
          <p className="text-xs text-muted-foreground">Upload product pictures, material certifications, spec sheets, or any supporting documents.</p>
        </CardHeader>
        <CardContent>
          <FileAttachments
            attachments={form.file_attachments || []}
            onChange={files => set('file_attachments', files)}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Form'}</Button>
      </div>
    </form>
  );
}