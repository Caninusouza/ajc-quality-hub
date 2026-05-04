import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileAttachments from '@/components/shared/FileAttachments';

const PRODUCT_CATEGORIES = ['Chicken', 'Pork', 'Beef', 'Fish', 'Turkey', 'Vegetables', 'Fruits', 'French Fries', 'Other'];
const PACKAGE_MATERIALS = ['Cardboard Box', 'Poly Bag', 'Vacuum Bag', 'Tray', 'Cryovac', 'Foam Tray', 'Other'];

const defaultForm = () => ({
  supplier_name: '',
  plant_number: '',
  product_name: '',
  product_category: '',
  product_category_other: '',
  product_cut: '',
  packaging_configuration: '',
  package_material: '',
  package_material_other: '',
  packaging_weight: '',
  recyclable: '',
  palletization_configuration: '',
  status: 'Draft',
  notes: '',
  file_attachments: [],
});

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
        </CardContent>
      </Card>

      {/* Packaging */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Packaging & Palletization</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Packaging Configuration</Label>
            <Input value={form.packaging_configuration} onChange={e => set('packaging_configuration', e.target.value)} placeholder="e.g. 4x10 lb bags per case" />
          </div>
          <div>
            <Label>Package Material</Label>
            <Select value={form.package_material} onValueChange={v => set('package_material', v)}>
              <SelectTrigger><SelectValue placeholder="Select material..." /></SelectTrigger>
              <SelectContent>{PACKAGE_MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.package_material === 'Other' && (
            <div className="sm:col-span-2">
              <Label>Package Material (Other)</Label>
              <Input value={form.package_material_other} onChange={e => set('package_material_other', e.target.value)} placeholder="Specify material..." />
            </div>
          )}
          <div>
            <Label>Packaging Weight</Label>
            <Input value={form.packaging_weight} onChange={e => set('packaging_weight', e.target.value)} placeholder="e.g. 40 lbs / case" />
          </div>
          <div>
            <Label>Recyclable</Label>
            <Select value={form.recyclable} onValueChange={v => set('recyclable', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Partially">Partially</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Palletization Configuration</Label>
            <Input value={form.palletization_configuration} onChange={e => set('palletization_configuration', e.target.value)} placeholder="e.g. 50 cases / pallet, 5 layers x 10 cases" />
          </div>
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