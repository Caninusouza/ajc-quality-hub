import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X, Paperclip, ShieldAlert, CheckCircle2, LogOut } from 'lucide-react';

const CLAIM_TYPES = ['Quality Defect', 'Foreign Material', 'Labeling Issue', 'Short Weight / Count', 'Temperature Abuse', 'Packaging Damage', 'Other'];
const RESOLUTIONS = ['Credit / Refund', 'Replacement Product', 'Return Authorization', 'Investigation Only', 'Other'];

const EMPTY_FORM = {
  customer_company: '',
  customer_address: '',
  contact_person: '',
  contact_email: '',
  so_number: '',
  supplier_name: '',
  product_name: '',
  issue_description: '',
  lot_batch_number: '',
  purchase_date: '',
  quantity_affected: '',
  claim_type: '',
  supporting_evidence: '',
  requested_resolution: '',
  additional_comments: '',
  file_attachments: [],
};

// ── Simple sign-in gate (any email) ─────────────────────────────────────────────
function InviteGate({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    const user = { email: email.trim(), name: name.trim() };
    localStorage.setItem('claimPortalUser', JSON.stringify(user));
    onSuccess(user);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">AJC International</h1>
          <p className="text-sm text-muted-foreground mt-1">Product Quality Claim Portal</p>
        </div>

        <div className="bg-card border rounded-xl shadow p-6">
          <h2 className="font-semibold mb-1">Access the Claim Portal</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your name and business email to begin a quality claim submission.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className="mt-1" required />
            </div>
            <div>
              <Label>Business Email Address *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="mt-1" required />
            </div>
            <Button type="submit" className="w-full">
              Continue to Claim Form
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Claim Form ──────────────────────────────────────────────────────────────────
export default function ClaimFormPortal() {
  const [portalUser, setPortalUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('claimPortalUser');
    if (stored) {
      try { setPortalUser(JSON.parse(stored)); } catch {}
    }
    setCheckingSession(false);
  }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({
        ...prev,
        file_attachments: [...prev.file_attachments, { name: file.name, url: file_url }],
      }));
    }
    setUploading(false);
  };

  const removeFile = (idx) => setForm(prev => ({ ...prev, file_attachments: prev.file_attachments.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      contact_email: form.contact_email || portalUser?.email,
      contact_person: form.contact_person || portalUser?.name,
      status: 'submitted',
    };
    await base44.entities.ClaimForm.create(payload);

    // Send confirmation email to customer
    const customerEmail = payload.contact_email;
    const attachmentList = payload.file_attachments.map(f => `• ${f.name}`).join('\n');
    await base44.integrations.Core.SendEmail({
      to: customerEmail,
      from_name: 'AJC International FSQA',
      subject: 'Your Quality Claim Has Been Received – AJC International',
      body: `Dear ${payload.contact_person},\n\nThank you for submitting your Product Quality Claim with AJC International. We have received your submission and it is currently under review by our Food Safety & Quality Assurance team.\n\nClaim Summary:\n• Product: ${payload.product_name}\n• Company: ${payload.customer_company}\n• Issue: ${payload.claim_type || 'See description'}\n• SO Number: ${payload.so_number || 'N/A'}${attachmentList ? `\n• Attachments:\n${attachmentList}` : ''}\n\nYou will receive a follow-up from our FSQA team within 3–5 business days.\n\nFor any questions, please contact us at fsqa@ajcfood.com.\n\nBest regards,\nAJC International – Food Safety & Quality Assurance Team`,
    });

    setSubmitting(false);
    setSubmitted(true);
  };

  if (checkingSession) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!portalUser) return <InviteGate onSuccess={(u) => { setPortalUser(u); localStorage.setItem('claimPortalUser', JSON.stringify(u)); }} />;

  if (submitted) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Claim Submitted</h2>
        <p className="text-muted-foreground mb-2">Your quality claim has been received and is now <strong>under review</strong> by our FSQA team.</p>
        <p className="text-sm text-muted-foreground mb-6">A confirmation has been sent to <strong>{form.contact_email || portalUser.email}</strong>.</p>
        <Button onClick={() => { setForm({ ...EMPTY_FORM }); setSubmitted(false); }} variant="outline">Submit Another Claim</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-base">AJC International</h1>
            <p className="text-xs text-muted-foreground">Product Quality Claim Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{portalUser.name || portalUser.email}</span>
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem('claimPortalUser'); setPortalUser(null); }} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Food Product Quality Claim Form</h2>
          <p className="text-sm text-muted-foreground mt-1">Please complete all required fields (*) to submit your claim.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Customer Information */}
          <section className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">Customer Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Customer Company Name *</Label>
                  <Input value={form.customer_company} onChange={e => set('customer_company', e.target.value)} className="mt-1" required />
                </div>
                <div>
                  <Label>Contact Person *</Label>
                  <Input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder={portalUser.name} className="mt-1" required />
                </div>
              </div>
              <div>
                <Label>Customer Address</Label>
                <Textarea value={form.customer_address} onChange={e => set('customer_address', e.target.value)} className="mt-1 h-16 resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Email *</Label>
                  <Input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder={portalUser.email} className="mt-1" required />
                </div>
                <div>
                  <Label>Sales Order (SO) Number</Label>
                  <Input value={form.so_number} onChange={e => set('so_number', e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
          </section>

          {/* Supplier Information */}
          <section className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">Supplier Information</h3>
            <div>
              <Label>Supplier Name</Label>
              <Input value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} className="mt-1" />
            </div>
          </section>

          {/* Product Details */}
          <section className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">Product Details</h3>
            <div className="space-y-4">
              <div>
                <Label>Product Name (as stated on label) *</Label>
                <Input value={form.product_name} onChange={e => set('product_name', e.target.value)} className="mt-1" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Lot / Batch Number</Label>
                  <Input value={form.lot_batch_number} onChange={e => set('lot_batch_number', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Purchase Date</Label>
                  <Input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Quantity Affected</Label>
                  <Input value={form.quantity_affected} onChange={e => set('quantity_affected', e.target.value)} placeholder="e.g. 10 cases" className="mt-1" />
                </div>
              </div>
            </div>
          </section>

          {/* Claim Details */}
          <section className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">Claim Details</h3>
            <div className="space-y-4">
              <div>
                <Label>Detailed Description of the Issue *</Label>
                <Textarea value={form.issue_description} onChange={e => set('issue_description', e.target.value)} placeholder="Please provide a clear and concise description of the quality issue, including any relevant details such as batch numbers, dates of purchase, and specific concerns." className="mt-1 h-28 resize-none" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Claim Type</Label>
                  <Select value={form.claim_type} onValueChange={v => set('claim_type', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{CLAIM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Requested Resolution</Label>
                  <Select value={form.requested_resolution} onValueChange={v => set('requested_resolution', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select resolution" /></SelectTrigger>
                    <SelectContent>{RESOLUTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Supporting Evidence / Documentation Available</Label>
                <Textarea value={form.supporting_evidence} onChange={e => set('supporting_evidence', e.target.value)} placeholder="Describe any photos, lab results, or other documentation you are attaching..." className="mt-1 h-16 resize-none" />
              </div>
              <div>
                <Label>Additional Comments</Label>
                <Textarea value={form.additional_comments} onChange={e => set('additional_comments', e.target.value)} className="mt-1 h-16 resize-none" />
              </div>
            </div>
          </section>

          {/* Attachments */}
          <section className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">Attachments</h3>
            <div className="space-y-2">
              {form.file_attachments.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[260px]">{f.name}</a>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground ml-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-3 py-2.5 transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Attach photos, documents, or other evidence (multiple files allowed)'}
                <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={submitting || uploading} className="min-w-[180px]">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : 'Submit Quality Claim'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}