import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { X, ImageIcon, Camera } from 'lucide-react';

const DEFAULT = {
  date: '', supplier_name: '', product_name: '',
  product_category: '',
  plant_no: '', product_code: '', brand: '',
  location: '', pack: '', special: '',
  avg_live_wt_current: '', avg_live_wt_target: '',
  weekly_slaughter: '', pack_date: '', shelf_life: '',
  notes_comments: '', grading_profile: '',
  label_photos: [], product_photos: [], grading_photos: [],
};

const CATEGORIES = ['Chicken', 'Turkey', 'Pork', 'Beef', 'Lamb', 'Fish/Seafood', 'Vegetables', 'Fruits', 'French Fries', 'Other'];
const ANIMAL_PROTEINS = ['Chicken', 'Turkey', 'Pork', 'Beef', 'Lamb', 'Fish/Seafood'];

const MAX_PRODUCT_PHOTOS = 10;

// Detects mobile/tablet so we can show camera option
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);
}

// Simple uploader for label/grading photos (no caption)
function PhotoUploader({ label, photos, onChange }) {
  const [uploading, setUploading] = useState(false);
  const mobile = isMobile();

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ name: file.name, url: file_url });
    }
    onChange([...photos, ...uploaded]);
    setUploading(false);
    e.target.value = '';
  };

  const remove = (idx) => onChange(photos.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div key={i} className="relative group w-28 h-28 rounded-lg overflow-hidden border border-border bg-muted">
            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Add from library */}
        <label className={`w-28 h-28 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 cursor-pointer hover:bg-muted transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <ImageIcon className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground text-center px-1">{uploading ? 'Uploading...' : 'Add Photo'}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        </label>

        {/* Take photo — mobile only */}
        {mobile && (
          <label className={`w-28 h-28 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Camera className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs text-primary text-center px-1">Take Photo</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFiles} />
          </label>
        )}
      </div>
    </div>
  );
}

// Product photos uploader: up to 10 slots, each with a caption field
function ProductPhotoUploader({ photos, onChange }) {
  const [uploading, setUploading] = useState(null);
  const mobile = isMobile();

  const handleFile = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(idx);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = [...photos];
    updated[idx] = { ...updated[idx], name: file.name, url: file_url };
    onChange(updated);
    setUploading(null);
    e.target.value = '';
  };

  const removePhoto = (idx) => {
    const updated = [...photos];
    updated[idx] = { ...updated[idx], url: '', name: '' };
    onChange(updated);
  };

  const updateCaption = (idx, caption) => {
    const updated = [...photos];
    updated[idx] = { ...updated[idx], caption };
    onChange(updated);
  };

  const slots = Array.from({ length: MAX_PRODUCT_PHOTOS }, (_, i) => photos[i] || { name: '', url: '', caption: '' });

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Product Photos (up to {MAX_PRODUCT_PHOTOS})</Label>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {slots.map((slot, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="relative group w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted/40">
              {slot.url ? (
                <>
                  <img src={slot.url} alt={slot.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${uploading === i ? 'opacity-50' : ''}`}>
                  {uploading === i ? (
                    <span className="text-xs text-muted-foreground">Uploading...</span>
                  ) : mobile ? (
                    /* Mobile: two mini buttons stacked */
                    <>
                      <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        <ImageIcon className="w-3.5 h-3.5" /> Library
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, i)} />
                      </label>
                      <label className="flex items-center gap-1 text-xs text-primary cursor-pointer hover:text-primary/80 transition-colors">
                        <Camera className="w-3.5 h-3.5" /> Camera
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e, i)} />
                      </label>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                      <ImageIcon className="w-5 h-5 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground text-center px-1">Photo {i + 1}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, i)} />
                    </label>
                  )}
                </div>
              )}
            </div>
            <Input
              value={slot.caption || ''}
              onChange={(e) => updateCaption(i, e.target.value)}
              placeholder="What this depicts..."
              className="text-xs h-7 px-2"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

export default function ProductEvaluationForm({ initialData, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState({ ...DEFAULT, ...initialData });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const setVal = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const isAnimalProtein = ANIMAL_PROTEINS.includes(form.product_category);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = {
      ...form,
      product_photos: (form.product_photos || []).filter(p => p.url),
      // Clear weekly_slaughter if not animal protein
      weekly_slaughter: isAnimalProtein ? form.weekly_slaughter : '',
    };
    onSave(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-xl border border-border p-6">
      {/* Header Info */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4 border-b pb-2">Product Evaluation Report</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Date"><Input type="date" value={form.date} onChange={set('date')} required /></Field>
          <Field label="Supplier Name"><Input value={form.supplier_name} onChange={set('supplier_name')} required /></Field>
          <Field label="Product Name"><Input value={form.product_name} onChange={set('product_name')} required /></Field>
          <Field label="Product Category">
            <Select value={form.product_category} onValueChange={v => setVal('product_category', v)}>
              <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Brand"><Input value={form.brand} onChange={set('brand')} /></Field>
          <Field label="Plant No."><Input value={form.plant_no} onChange={set('plant_no')} /></Field>
          <Field label="Product Code"><Input value={form.product_code} onChange={set('product_code')} /></Field>
          <Field label="Location"><Input value={form.location} onChange={set('location')} /></Field>
          <Field label="Pack"><Input value={form.pack} onChange={set('pack')} placeholder="e.g. 3 x 5 kg" /></Field>
          <Field label="Special"><Input value={form.special} onChange={set('special')} /></Field>
          {isAnimalProtein && (
            <Field label="Weekly Slaughter"><Input value={form.weekly_slaughter} onChange={set('weekly_slaughter')} /></Field>
          )}
          <Field label="Pack Date"><Input type="date" value={form.pack_date} onChange={set('pack_date')} /></Field>
          <Field label="Shelf Life"><Input value={form.shelf_life} onChange={set('shelf_life')} placeholder="e.g. 18 months" /></Field>
        </div>
        {isAnimalProtein && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label="Avg. Live Wt. — Current"><Input value={form.avg_live_wt_current} onChange={set('avg_live_wt_current')} /></Field>
            <Field label="Avg. Live Wt. — Target"><Input value={form.avg_live_wt_target} onChange={set('avg_live_wt_target')} /></Field>
          </div>
        )}
      </div>

      {/* Product Label Photos */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary border-b pb-1 mb-3">Product Label</h3>
        <PhotoUploader label="Label Photos" photos={form.label_photos} onChange={v => setVal('label_photos', v)} />
      </div>

      {/* Notes / Comments */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary border-b pb-1 mb-3">Notes / Comments</h3>
        <Textarea
          value={form.notes_comments}
          onChange={set('notes_comments')}
          rows={5}
          placeholder="Add notes, date format, case size, primary packaging, grading percentages, etc."
        />
      </div>

      {/* Grading Profile */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary border-b pb-1 mb-3">Grading Profile</h3>
        <Textarea
          value={form.grading_profile}
          onChange={set('grading_profile')}
          rows={3}
          placeholder="e.g. 17% A grade, 83% B grade..."
        />
        <div className="mt-3">
          <PhotoUploader label="Grading Photos" photos={form.grading_photos} onChange={v => setVal('grading_photos', v)} />
        </div>
      </div>

      {/* Product Photos */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary border-b pb-1 mb-3">Product Photos</h3>
        <ProductPhotoUploader
          photos={form.product_photos}
          onChange={v => setVal('product_photos', v)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save & Preview'}
        </Button>
      </div>
    </form>
  );
}