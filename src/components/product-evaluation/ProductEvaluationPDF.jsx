import React, { useState } from 'react';
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
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.88), w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const AJC_LOGO_URL = 'https://media.base44.com/images/public/69f10cbc7366891a2d7229d7/cb8fdd247_AJC.png';

async function generatePDF(evaluation) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const contentW = pageW - margin * 2;
  const PHOTO_W = 127;
  const HEADER_H = 22;
  const FOOTER_H = 10;
  const SAFE_BOTTOM = pageH - FOOTER_H;

  // AJC Color scheme: navy + orange accent
  const primaryColor = [27, 54, 100];   // AJC navy
  const accentColor  = [220, 100, 30];  // AJC orange
  const lightBlue    = [240, 244, 252];
  const white        = [255, 255, 255];
  const darkText     = [30, 30, 30];
  const mutedText    = [100, 110, 130];

  // Pre-load AJC logo
  const logoResult = await loadImageAsDataURL(AJC_LOGO_URL);

  let pageNum = 1;

  const drawHeader = () => {
    // Navy background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageW, HEADER_H, 'F');
    // Orange accent stripe at bottom of header
    doc.setFillColor(...accentColor);
    doc.rect(0, HEADER_H - 1.5, pageW, 1.5, 'F');

    // AJC Logo (white version loaded from URL, rendered small on left)
    if (logoResult) {
      // Logo height = 12mm, width proportional
      const logoH = 12;
      const logoW = logoH * (logoResult.w / logoResult.h);
      doc.addImage(logoResult.dataUrl, 'PNG', margin, (HEADER_H - logoH) / 2, logoW, logoH);
      // Title next to logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('AJC International', margin + logoW + 4, HEADER_H / 2 - 0.5);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 215, 235);
      doc.text('FOOD SAFETY & QUALITY ASSURANCE', margin + logoW + 4, HEADER_H / 2 + 4.5);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('AJC International', margin, 14);
    }
    // Right: report label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('PRODUCT EVALUATION REPORT', pageW - margin, HEADER_H / 2 - 1, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(200, 215, 235);
    doc.text(fmt(evaluation.date), pageW - margin, HEADER_H / 2 + 4, { align: 'right' });
  };

  const drawFooter = () => {
    doc.setFillColor(...lightBlue);
    doc.rect(0, pageH - FOOTER_H, pageW, FOOTER_H, 'F');
    doc.setFillColor(...accentColor);
    doc.rect(0, pageH - FOOTER_H, pageW, 0.8, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    doc.text(`${evaluation.supplier_name} — ${evaluation.product_name}`, margin, pageH - 3.5);
    doc.text(`Page ${pageNum}`, pageW - margin, pageH - 3.5, { align: 'right' });
  };

  const addPage = () => {
    drawFooter();
    doc.addPage();
    pageNum++;
    drawHeader();
    return HEADER_H + 8;
  };

  // Ensure enough space, else new page; returns updated y
  const ensureSpace = (neededH, currentY) => {
    if (currentY + neededH > SAFE_BOTTOM) {
      return addPage();
    }
    return currentY;
  };

  // ── FIRST PAGE ──
  drawHeader();
  let y = HEADER_H + 8;

  // ── INFO TABLE ──
  const ANIMAL_PROTEINS = ['Chicken', 'Turkey', 'Pork', 'Beef', 'Lamb', 'Fish/Seafood'];
  const isAnimalProtein = ANIMAL_PROTEINS.includes(evaluation.product_category);

  const infoRows = [
    ['Supplier Name', evaluation.supplier_name, 'Product Name', evaluation.product_name],
    ['Product Category', evaluation.product_category, 'Date', fmt(evaluation.date)],
    ['Plant No.', evaluation.plant_no, 'Product Code', evaluation.product_code],
    ['Brand', evaluation.brand, 'Location', evaluation.location],
    ['Pack', evaluation.pack, 'Special', evaluation.special],
    ...(isAnimalProtein ? [
      ['Avg. Live Wt. (Current)', evaluation.avg_live_wt_current, 'Avg. Live Wt. (Target)', evaluation.avg_live_wt_target],
      ['Weekly Slaughter', evaluation.weekly_slaughter, 'Pack Date', fmt(evaluation.pack_date)],
    ] : [
      ['Pack Date', fmt(evaluation.pack_date), '', ''],
    ]),
    ['Shelf Life', evaluation.shelf_life, '', ''],
  ];

  const cellH = 7;
  const col1W = 46, col2W = 52, col3W = 46, col4W = contentW - col1W - col2W - col3W;

  infoRows.forEach(([l1, v1, l2, v2], rowIdx) => {
    const bg = rowIdx % 2 === 0 ? lightBlue : white;
    doc.setFillColor(...bg);
    doc.rect(margin, y, contentW, cellH, 'F');
    doc.setDrawColor(210, 218, 230);
    doc.rect(margin, y, contentW, cellH);
    // vertical dividers
    doc.line(margin + col1W, y, margin + col1W, y + cellH);
    doc.line(margin + col1W + col2W, y, margin + col1W + col2W, y + cellH);
    if (l2) doc.line(margin + col1W + col2W + col3W, y, margin + col1W + col2W + col3W, y + cellH);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(l1 || '', margin + 2, y + 4.6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    doc.text(String(v1 || '—'), margin + col1W + 2, y + 4.6);

    if (l2) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(l2, margin + col1W + col2W + 2, y + 4.6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);
      doc.text(String(v2 || '—'), margin + col1W + col2W + col3W + 2, y + 4.6);
    }
    y += cellH;
  });

  y += 8;

  // ── SECTION TITLE helper ──
  const sectionTitle = (title, currentY) => {
    currentY = ensureSpace(12, currentY);
    doc.setFillColor(...primaryColor);
    doc.rect(margin, currentY, contentW, 7, 'F');
    doc.setFillColor(...accentColor);
    doc.rect(margin, currentY, 3, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, margin + 6, currentY + 5);
    return currentY + 11;
  };

  // ── TEXT BLOCK helper ──
  const textBlock = (text, currentY) => {
    if (!text?.trim()) return currentY;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    const lines = doc.splitTextToSize(text, contentW);
    for (const line of lines) {
      currentY = ensureSpace(6, currentY);
      doc.text(line, margin, currentY);
      currentY += 5.5;
    }
    return currentY + 4;
  };

  // ── PHOTO (single, centered, 5" wide, with optional caption) ──
  const addPhoto = async (photo, currentY) => {
    const result = await loadImageAsDataURL(photo.url);
    if (!result) return currentY;
    const { dataUrl, w, h } = result;
    const aspect = h / w;
    const imgW = Math.min(PHOTO_W, contentW); // 127mm or page width
    const imgH = imgW * aspect;

    // Check if it fits on current page (image + optional caption)
    const captionH = photo.caption ? 8 : 0;
    const neededH = imgH + captionH + 4;
    currentY = ensureSpace(neededH, currentY);

    // Center horizontally
    const x = margin + (contentW - imgW) / 2;

    // Subtle shadow/border
    doc.setDrawColor(200, 208, 220);
    doc.setLineWidth(0.3);
    doc.rect(x, currentY, imgW, imgH);
    doc.addImage(dataUrl, 'JPEG', x, currentY, imgW, imgH);
    currentY += imgH + 2;

    // Caption
    if (photo.caption) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...mutedText);
      doc.text(photo.caption, pageW / 2, currentY, { align: 'center' });
      currentY += 6;
    }

    return currentY + 4;
  };

  // ── PRODUCT LABEL ──
  const labelPhotos = (evaluation.label_photos || []).filter(p => p.url);
  if (labelPhotos.length > 0) {
    y = sectionTitle('PRODUCT LABEL', y);
    for (const photo of labelPhotos) {
      y = await addPhoto(photo, y);
    }
    y += 4;
  }

  // ── NOTES / COMMENTS ──
  if (evaluation.notes_comments?.trim()) {
    y = sectionTitle('NOTES / COMMENTS', y);
    y = textBlock(evaluation.notes_comments, y);
    y += 2;
  }

  // ── GRADING PROFILE ──
  const gradingPhotos = (evaluation.grading_photos || []).filter(p => p.url);
  const hasGradingText = evaluation.grading_profile?.trim();
  if (hasGradingText || gradingPhotos.length > 0) {
    y = sectionTitle('GRADING PROFILE', y);
    if (hasGradingText) y = textBlock(evaluation.grading_profile, y);
    for (const photo of gradingPhotos) {
      y = await addPhoto(photo, y);
    }
    y += 4;
  }

  // ── PRODUCT PHOTOS ──
  const productPhotos = (evaluation.product_photos || []).filter(p => p.url);
  if (productPhotos.length > 0) {
    y = sectionTitle('PRODUCT PHOTOS', y);
    for (const photo of productPhotos) {
      y = await addPhoto(photo, y);
    }
  }

  drawFooter();
  return doc;
}

export default function ProductEvaluationPDF({ evaluation }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Format: SupplierName PlantNo - ProductName - DD Mon YYYY
  const buildFilename = () => {
    const supplier = evaluation.supplier_name || 'Supplier';
    const plant = evaluation.plant_no ? ` ${evaluation.plant_no}` : '';
    const product = evaluation.product_name || 'Product';
    let datePart = 'draft';
    if (evaluation.date) {
      try {
        datePart = format(new Date(evaluation.date + 'T00:00:00'), 'd MMM yyyy');
      } catch {}
    }
    return `${supplier}${plant} - ${product} - ${datePart}.pdf`.replace(/[/\\?%*:|"<>]/g, '-');
  };
  const filename = buildFilename();

  const handleDownload = async () => {
    setDownloading(true);
    const doc = await generatePDF(evaluation);
    doc.save(filename);
    setDownloading(false);
  };

  const handleEmail = async () => {
    if (!emailTo) return;
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      subject: `Product Evaluation Report — ${evaluation.supplier_name} — ${evaluation.product_name}`,
      body: `Please find the product evaluation report for ${evaluation.product_name} from ${evaluation.supplier_name} dated ${fmt(evaluation.date)}.\n\nTo download the PDF, please use the Download PDF button in the app and attach it manually to your email.`,
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
              A notification email will be sent for <strong>{evaluation.supplier_name} — {evaluation.product_name}</strong>. Use Download PDF to attach it.
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