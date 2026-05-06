import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
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
  const fontSize = 11; // Increased from default

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
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('AJC International', margin + logoW + 4, HEADER_H / 2 - 0.5);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 215, 235);
      doc.text('FOOD SAFETY & QUALITY ASSURANCE', margin + logoW + 4, HEADER_H / 2 + 4.5);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('AJC International', margin, 14);
    }
    // Right: report label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('PRODUCT EVALUATION REPORT', pageW - margin, HEADER_H / 2 - 1, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 215, 235);
    doc.text(fmt(evaluation.date), pageW - margin, HEADER_H / 2 + 4, { align: 'right' });
  };

  const drawFooter = () => {
    doc.setFillColor(...lightBlue);
    doc.rect(0, pageH - FOOTER_H, pageW, FOOTER_H, 'F');
    doc.setFillColor(...accentColor);
    doc.rect(0, pageH - FOOTER_H, pageW, 0.8, 'F');
    doc.setFontSize(9);
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

  const col1W = 46, col2W = 52, col3W = 46, col4W = contentW - col1W - col2W - col3W;
  const cellPadX = 2, cellPadY = 2, lineH = 5.5, minCellH = 9;
  const tableFontSize = 11;

  // Returns wrapped lines array for a given text and max width
  const wrapCell = (text, maxW) => {
    doc.setFontSize(tableFontSize);
    return doc.splitTextToSize(String(text || '—'), maxW - cellPadX * 2);
  };

  infoRows.forEach(([l1, v1, l2, v2], rowIdx) => {
    doc.setFontSize(tableFontSize);

    // Compute wrapped lines for each value cell
    const v1Lines = wrapCell(v1, col2W);
    const v2Lines = l2 ? wrapCell(v2, col4W) : [];

    // Row height = tallest cell, minimum minCellH
    const rowH = Math.max(minCellH, (Math.max(v1Lines.length, l2 ? v2Lines.length : 0)) * lineH + cellPadY * 2);

    const bg = rowIdx % 2 === 0 ? lightBlue : white;
    doc.setFillColor(...bg);
    doc.rect(margin, y, contentW, rowH, 'F');
    doc.setDrawColor(210, 218, 230);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentW, rowH);

    // Vertical dividers
    doc.line(margin + col1W, y, margin + col1W, y + rowH);
    doc.line(margin + col1W + col2W, y, margin + col1W + col2W, y + rowH);
    if (l2) doc.line(margin + col1W + col2W + col3W, y, margin + col1W + col2W + col3W, y + rowH);

    const textBaseY = y + cellPadY + lineH - 0.5;

    // Label 1 (bold, primary)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(l1 || '', margin + cellPadX, textBaseY);

    // Value 1 (wrapped)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    v1Lines.forEach((line, i) => {
      doc.text(line, margin + col1W + cellPadX, textBaseY + i * lineH);
    });

    if (l2) {
      // Label 2
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(l2, margin + col1W + col2W + cellPadX, textBaseY);

      // Value 2 (wrapped)
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);
      v2Lines.forEach((line, i) => {
        doc.text(line, margin + col1W + col2W + col3W + cellPadX, textBaseY + i * lineH);
      });
    }

    y += rowH;
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
    doc.setFontSize(12);
    doc.text(title, margin + 6, currentY + 5);
    return currentY + 11;
  };

  // ── TEXT BLOCK helper ──
  const textBlock = (text, currentY) => {
    if (!text?.trim()) return currentY;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
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
    let { dataUrl, w, h } = result;
    
    // Apply photo transforms (rotation, flip) directly to canvas
    if (photo.transforms) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const rotation = (photo.transforms.rotation || 0) % 360;
      const flipH = photo.transforms.flipH || false;
      const img = new window.Image();
      
      await new Promise((resolve) => {
        img.onload = () => {
          if (rotation === 90 || rotation === 270) {
            canvas.width = h;
            canvas.height = w;
          } else {
            canvas.width = w;
            canvas.height = h;
          }
          
          ctx.translate(canvas.width / 2, canvas.height / 2);
          if (flipH) ctx.scale(-1, 1);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(img, -w / 2, -h / 2);
          
          dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          if (rotation === 90 || rotation === 270) { const tmp = w; w = h; h = tmp; }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = result.dataUrl;
      });
    }
    
    const aspect = h / w;
    const imgW = Math.min(PHOTO_W, contentW);
    const imgH = imgW * aspect;

    const captionH = photo.caption ? 12 : 0;
    const neededH = imgH + captionH + 6;
    currentY = ensureSpace(neededH, currentY);

    const x = margin + (contentW - imgW) / 2;

    doc.setDrawColor(200, 208, 220);
    doc.setLineWidth(0.3);
    doc.rect(x, currentY, imgW, imgH);
    doc.addImage(dataUrl, 'JPEG', x, currentY, imgW, imgH);
    currentY += imgH + 4;

    if (photo.caption) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...darkText);
      const captionLines = doc.splitTextToSize(photo.caption, contentW - 4);
      captionLines.forEach((line, i) => {
        doc.text(line, pageW / 2, currentY + (i * 4.5), { align: 'center' });
      });
      currentY += captionLines.length * 4.5 + 3;
    }

    return currentY + 3;
  };

  // ── MULTI-PHOTO section (max 2 per page, no overlaps) ──
  const addPhotoGrid = async (photos, currentY, maxPerPage = 2) => {
    if (!photos?.length) return currentY;
    
    let photoIdx = 0;
    while (photoIdx < photos.length) {
      const batchPhotos = [];
      const batchSize = Math.min(maxPerPage, photos.length - photoIdx);
      
      for (let i = 0; i < batchSize; i++) {
        batchPhotos.push(photos[photoIdx + i]);
      }
      photoIdx += batchSize;
      
      const photoW = (contentW - (batchSize - 1) * 3) / batchSize;
      const processed = [];

      for (const photo of batchPhotos) {
        const result = await loadImageAsDataURL(photo.url);
        if (!result) continue;

        let { dataUrl, w, h } = result;
        if (photo.transforms) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const rotation = (photo.transforms.rotation || 0) % 360;
          const flipH = photo.transforms.flipH || false;
          const img = new window.Image();
          
          await new Promise((resolve) => {
            img.onload = () => {
              if (rotation === 90 || rotation === 270) {
                canvas.width = h;
                canvas.height = w;
              } else {
                canvas.width = w;
                canvas.height = h;
              }
              ctx.translate(canvas.width / 2, canvas.height / 2);
              if (flipH) ctx.scale(-1, 1);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.drawImage(img, -w / 2, -h / 2);
              dataUrl = canvas.toDataURL('image/jpeg', 0.88);
              if (rotation === 90 || rotation === 270) { const tmp = w; w = h; h = tmp; }
              resolve();
            };
            img.onerror = () => resolve();
            img.src = result.dataUrl;
          });
        }
        
        const pH = photoW * (h / w);
        const captionH = photo.caption ? 16 : 0;
        processed.push({ dataUrl, w, h, pH, caption: photo.caption, captionH });
      }

      if (processed.length === 0) continue;

      const maxH = Math.max(...processed.map(p => p.pH)) + processed[0].captionH;
      currentY = ensureSpace(maxH + 8, currentY);

      processed.forEach((p, i) => {
        const xPos = margin + i * (photoW + 3);
        doc.setDrawColor(200, 208, 220);
        doc.setLineWidth(0.3);
        doc.rect(xPos, currentY, photoW, p.pH);
        doc.addImage(p.dataUrl, 'JPEG', xPos, currentY, photoW, p.pH);

        if (p.caption) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(...darkText);
          const lines = doc.splitTextToSize(p.caption, photoW - 2);
          const lineH = 4;
          lines.forEach((line, j) => {
            doc.text(line, xPos + photoW / 2, currentY + p.pH + 3 + (j * lineH), { align: 'center', maxWidth: photoW - 2 });
          });
        }
      });

      currentY += maxH + 6;
      
      if (photoIdx < photos.length) {
        currentY = addPage();
      }
    }

    return currentY + 2;
  };

  // ── PIECE WEIGHTS ──
  const hasWeights = ANIMAL_PROTEINS.includes(evaluation.product_category) && ['Chicken', 'Pork'].includes(evaluation.product_category) && (evaluation.piece_weights?.length || 0) > 0;
  
  if (hasWeights) {
    const weights = (evaluation.piece_weights || []).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
    if (weights.length > 0) {
      y = sectionTitle(`PIECE WEIGHTS — ${evaluation.product_category}`, y);
      
      const avg = (weights.reduce((s, v) => s + v, 0) / weights.length).toFixed(1);
      const min = Math.min(...weights).toFixed(1);
      const max = Math.max(...weights).toFixed(1);
      const displayCount = evaluation._actual_piece_count || weights.length;
      
      // Summary stats
      y = ensureSpace(18, y);
      doc.setFillColor(...lightBlue);
      doc.rect(margin, y, contentW, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      doc.text(`Avg: ${avg}g  |  Range: ${min}–${max}g  |  Count: ${weights.length}/${displayCount}`, margin + 2, y + 7);
      y += 16;
      
      // Weight grid (5 columns, much larger)
      const gridCols = 5;
      const gridColW = contentW / gridCols;
      const gridItemH = 11;
      doc.setFontSize(9);
      doc.setTextColor(...darkText);
      
      for (let i = 0; i < weights.length; i += gridCols) {
        const row = weights.slice(i, i + gridCols);
        y = ensureSpace(gridItemH + 3, y);
        
        row.forEach((w, idx) => {
          const x = margin + idx * gridColW;
          doc.setDrawColor(150, 170, 200);
          doc.setLineWidth(0.4);
          doc.rect(x, y, gridColW, gridItemH);
          
          // Index number (smaller)
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 110, 130);
          doc.text(String((i + idx + 1)), x + gridColW / 2, y + 2.5, { align: 'center' });
          
          // Weight value + g (larger, bold)
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...primaryColor);
          doc.text(String(w.toFixed(1)) + 'g', x + gridColW / 2, y + 7.5, { align: 'center' });
        });
        
        y += gridItemH + 2;
      }
      y += 3;
    }
  }

  // ── PRODUCT LABEL (on second page if weight grid exists) ──
  const labelPhotos = (evaluation.label_photos || []).filter(p => p.url);
  if (labelPhotos.length > 0) {
    if (hasWeights) {
      y = addPage();
    }
    y = sectionTitle('PRODUCT LABEL', y);
    y = await addPhotoGrid(labelPhotos, y, 2);
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
    y = await addPhotoGrid(gradingPhotos, y, 2);
    y += 4;
  }

  // ── PRODUCT PHOTOS ──
  const productPhotos = (evaluation.product_photos || []).filter(p => p.url);
  if (productPhotos.length > 0) {
    y = sectionTitle('PRODUCT PHOTOS', y);
    y = await addPhotoGrid(productPhotos, y, 2);
  }

  drawFooter();
  return doc;
}

export default function ProductEvaluationPDF({ evaluation }) {
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

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleDownload} disabled={downloading} className="gap-2">
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {downloading ? 'Generating...' : 'Download PDF'}
      </Button>
    </div>
  );
}