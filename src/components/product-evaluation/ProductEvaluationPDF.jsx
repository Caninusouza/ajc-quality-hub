import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Mail, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

function fmt(dateStr) {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr + 'T00:00:00'), 'MMM d, yyyy'); } catch { return dateStr; }
}

async function loadImageAsDataURL(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function generatePDF(evaluation) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  const primaryColor = [27, 54, 100]; // deep blue
  const accentColor = [220, 100, 30];  // orange

  // Header bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('AJC International — Product Evaluation Report', margin, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${fmt(evaluation.date)}`, pageW - margin, 12, { align: 'right' });
  y = 24;

  // Info Table
  const fields = [
    ['Supplier Name', evaluation.supplier_name, 'Product Name', evaluation.product_name],
    ['Plant No.', evaluation.plant_no, 'Product Code', evaluation.product_code],
    ['Brand', evaluation.brand, 'Location', evaluation.location],
    ['Pack', evaluation.pack, 'Special', evaluation.special],
    ['Avg. Live Wt. (Current)', evaluation.avg_live_wt_current, 'Avg. Live Wt. (Target)', evaluation.avg_live_wt_target],
    ['Weekly Slaughter', evaluation.weekly_slaughter, 'Pack Date', fmt(evaluation.pack_date)],
    ['Shelf Life', evaluation.shelf_life, '', ''],
  ];

  const cellH = 7;
  const col1W = 45, col2W = 55, col3W = 45, col4W = contentW - col1W - col2W - col3W;

  fields.forEach(([l1, v1, l2, v2]) => {
    doc.setFillColor(240, 243, 250);
    doc.rect(margin, y, col1W, cellH, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(margin + col1W, y, col2W, cellH, 'F');
    if (l2) {
      doc.setFillColor(240, 243, 250);
      doc.rect(margin + col1W + col2W, y, col3W, cellH, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(margin + col1W + col2W + col3W, y, col4W, cellH, 'F');
    }
    doc.setDrawColor(210, 215, 225);
    doc.rect(margin, y, contentW, cellH);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(l1 || '', margin + 1.5, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(v1 || '—', margin + col1W + 1.5, y + 4.5);
    if (l2) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(l2, margin + col1W + col2W + 1.5, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text(v2 || '—', margin + col1W + col2W + col3W + 1.5, y + 4.5);
    }
    y += cellH;
  });

  y += 5;

  // Section helper
  const sectionTitle = (title) => {
    if (y > pageH - 30) { doc.addPage(); y = margin; }
    doc.setFillColor(...primaryColor);
    doc.rect(margin, y, contentW, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, margin + 2, y + 4.3);
    y += 9;
    doc.setTextColor(40, 40, 40);
  };

  // Text block helper
  const textBlock = (text) => {
    if (!text) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text, contentW);
    lines.forEach(line => {
      if (y > pageH - 15) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 3;
  };

  // Photo grid helper
  const photoGrid = async (photos, cols = 3) => {
    if (!photos?.length) return;
    const gap = 3;
    const imgW = (contentW - gap * (cols - 1)) / cols;
    let col = 0;
    let rowStartX = margin;
    let rowMaxH = 0;

    for (const photo of photos) {
      const dataUrl = await loadImageAsDataURL(photo.url);
      if (!dataUrl) continue;
      const imgEl = await new Promise(res => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = dataUrl;
      });
      if (!imgEl) continue;
      const aspect = imgEl.naturalHeight / imgEl.naturalWidth;
      const imgH = Math.min(imgW * aspect, 70);

      if (y + imgH > pageH - 15) { doc.addPage(); y = margin; col = 0; rowMaxH = 0; rowStartX = margin; }

      const x = margin + col * (imgW + gap);
      doc.addImage(dataUrl, 'JPEG', x, y, imgW, imgH);
      rowMaxH = Math.max(rowMaxH, imgH);
      col++;
      if (col >= cols) { y += rowMaxH + gap; col = 0; rowMaxH = 0; rowStartX = margin; }
    }
    if (col > 0) y += rowMaxH + gap;
    y += 3;
  };

  // Product Label
  sectionTitle('PRODUCT LABEL');
  await photoGrid(evaluation.label_photos, 3);

  // Notes
  sectionTitle('NOTES / COMMENTS');
  textBlock(evaluation.notes_comments);

  // Grading Profile
  sectionTitle('GRADING PROFILE');
  textBlock(evaluation.grading_profile);
  await photoGrid(evaluation.grading_photos, 3);

  // Product Photos
  sectionTitle('PRODUCT PHOTOS');
  await photoGrid(evaluation.product_photos, 3);

  return doc;
}

export default function ProductEvaluationPDF({ evaluation }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const filename = `ProductEvaluation_${evaluation.supplier_name?.replace(/\s+/g, '_')}_${evaluation.date || 'draft'}.pdf`;

  const handleDownload = async () => {
    setDownloading(true);
    const doc = await generatePDF(evaluation);
    doc.save(filename);
    setDownloading(false);
  };

  const handleEmail = async () => {
    if (!emailTo) return;
    setSending(true);
    const doc = await generatePDF(evaluation);
    const pdfDataUri = doc.output('datauristring');
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      subject: `Product Evaluation Report — ${evaluation.supplier_name} — ${evaluation.product_name}`,
      body: `Please find attached the product evaluation report for ${evaluation.product_name} from ${evaluation.supplier_name} dated ${fmt(evaluation.date)}.\n\nNote: The PDF is attached below as a data link. For full attachment support, use the Download option and attach manually.\n\n${pdfDataUri.slice(0, 200)}...`
    });
    setSending(false);
    setEmailOpen(false);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleDownload} disabled={downloading} className="gap-2">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? 'Generating...' : 'Download PDF'}
        </Button>
        <Button variant="outline" onClick={() => setEmailOpen(true)} className="gap-2">
          <Mail className="w-4 h-4" />
          Email PDF
        </Button>
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Email Evaluation Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-sm">Recipient Email</Label>
              <Input
                type="email"
                placeholder="recipient@email.com"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              An email will be sent with the report details for <strong>{evaluation.supplier_name} — {evaluation.product_name}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
              <Button onClick={handleEmail} disabled={sending || !emailTo}>
                {sending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</> : 'Send Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}