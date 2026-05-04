import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ─── Constants ────────────────────────────────────────────────────────────────
const PRODUCT_TYPES = ['Chicken', 'Pork', 'Beef', 'Fish', 'Turkey', 'Vegetables', 'Fruits', 'French Fries', 'Other'];
const AUDIT_TYPES = ['SQF', 'BRC', 'FSSC 22000', 'IFS', 'GLOBALG.A.P.', 'Primus GFS', 'Costco', 'Other'];
const INSPECTION_AREAS = [
  ['inspection_exterior', 'Exterior / Grounds'],
  ['inspection_receiving', 'Receiving Area'],
  ['inspection_storage', 'Storage / Warehouse'],
  ['inspection_processing', 'Processing / Production Floor'],
  ['inspection_sanitation', 'Sanitation Practices'],
  ['inspection_employee_hygiene', 'Employee Hygiene & GMP'],
  ['inspection_pest_control', 'Pest Control Evidence'],
  ['inspection_temperature_control', 'Temperature Control'],
  ['inspection_labeling', 'Labeling & Traceability'],
];

const NAVY = rgb(0.102, 0.212, 0.365);
const LIGHT_BLUE = rgb(0.902, 0.925, 0.957);
const LIGHT_GRAY = rgb(0.96, 0.97, 0.98);
const MID_GRAY = rgb(0.7, 0.7, 0.7);
const WHITE = rgb(1, 1, 1);
const BLACK = rgb(0, 0, 0);
const DARK_GRAY = rgb(0.3, 0.3, 0.3);

const PW = 595; // A4 width in points
const PH = 842; // A4 height in points
const ML = 36;
const CW = PW - ML * 2; // 523

let _fieldId = 0;
const uid = (prefix) => `${prefix}_${++_fieldId}`;

// ─── Page factory ─────────────────────────────────────────────────────────────
function makePage(pdfDoc, fontBold, fontNormal, logoImage) {
  const page = pdfDoc.addPage([PW, PH]);

  // Navy header bar
  page.drawRectangle({ x: 0, y: PH - 52, width: PW, height: 52, color: NAVY });

  // Logo
  if (logoImage) {
    const dims = logoImage.scaleToFit(72, 34);
    page.drawImage(logoImage, {
      x: PW - ML - dims.width,
      y: PH - 48 + (34 - dims.height) / 2,
      width: dims.width,
      height: dims.height,
    });
  }

  page.drawText('AJC FSQA HUB', { x: ML, y: PH - 22, font: fontBold, size: 13, color: WHITE });
  page.drawText('Supplier Intake & Assessment Form', { x: ML, y: PH - 36, font: fontNormal, size: 9, color: rgb(0.8, 0.87, 0.95) });
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: ML, y: PH - 47, font: fontNormal, size: 7, color: rgb(0.65, 0.75, 0.88) });

  // Footer
  page.drawLine({ start: { x: ML, y: 30 }, end: { x: PW - ML, y: 30 }, thickness: 0.4, color: MID_GRAY });
  page.drawText('AJC FSQA Hub — Supplier Intake & Assessment Form  |  CONFIDENTIAL', { x: ML, y: 20, font: fontNormal, size: 6.5, color: MID_GRAY });

  return page;
}

function secHeader(page, text, y, fontBold) {
  page.drawRectangle({ x: ML, y: y - 4, width: CW, height: 15, color: NAVY });
  page.drawText(text, { x: ML + 7, y: y + 4, font: fontBold, size: 9, color: WHITE });
  return y - 22;
}

// ─── Interactive field helpers ────────────────────────────────────────────────

function addText(pdfDoc, page, x, y, w, h, value, name, multiline = false) {
  const form = pdfDoc.getForm();
  const field = form.createTextField(name || uid('tf'));
  field.setText(value != null && value !== '' ? String(value) : '');
  if (multiline) field.enableMultiline();
  field.addToPage(page, {
    x, y,
    width: w,
    height: h,
    textColor: BLACK,
    backgroundColor: rgb(0.98, 0.99, 1),
    borderColor: MID_GRAY,
    borderWidth: 0.8,
  });
  return field;
}

function addCB(pdfDoc, page, x, y, size, checked, name) {
  const form = pdfDoc.getForm();
  const cb = form.createCheckBox(name || uid('cb'));
  cb.addToPage(page, {
    x, y,
    width: size,
    height: size,
    backgroundColor: WHITE,
    borderColor: DARK_GRAY,
    borderWidth: 1,
  });
  if (checked) cb.check();
  return cb;
}

// Draw label text, then a writable text field below it. Returns new y (lower).
function fieldBlock(pdfDoc, page, label, x, y, w, h, value, fontBold, name, multiline) {
  page.drawText(label, { x, y, font: fontBold, size: 7.5, color: BLACK });
  addText(pdfDoc, page, x, y - h - 3, w, h, value, name || uid('tf'), multiline);
  return y - h - 10;
}

// Draw label + checkboxes inline. Returns x after last cb.
function cbGroup(pdfDoc, page, label, opts, values, x, y, cbSz, font, checked_value, name_prefix) {
  if (label) {
    page.drawText(label, { x, y, font, size: 8, color: BLACK });
    x += font.widthOfTextAtSize(label, 8) + 5;
  }
  for (const opt of opts) {
    const isChecked = Array.isArray(checked_value)
      ? checked_value.includes(opt)
      : checked_value === opt;
    addCB(pdfDoc, page, x, y - cbSz + 1, cbSz, isChecked, `${name_prefix}_${opt.replace(/[\s/.]/g, '_')}`);
    page.drawText(opt, { x: x + cbSz + 2, y, font, size: 8, color: BLACK });
    x += cbSz + font.widthOfTextAtSize(opt, 8) + 10;
  }
  return x;
}

// ─── PDF generator ────────────────────────────────────────────────────────────
export async function generateSupplierIntakePDF(intake = {}) {
  _fieldId = 0;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.getForm(); // initialize AcroForm

  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Try to load AJC logo
  let logoImage = null;
  try {
    const res = await fetch('https://www.ajcfood.com/themes/custom/ajc/img/logo-ajc.png');
    if (res.ok) {
      const buf = await res.arrayBuffer();
      logoImage = await pdfDoc.embedPng(new Uint8Array(buf));
    }
  } catch { /* skip */ }

  // ── PAGE 1 ──────────────────────────────────────────────────────────────────
  let page = makePage(pdfDoc, fontBold, fontNormal, logoImage);
  let y = PH - 64;
  const cbSz = 10;
  const half = (CW - 10) / 2;
  const third = (CW - 16) / 3;

  // ── SECTION 1: Supplier Information ─────────────────────────────────────────
  y = secHeader(page, '1.  SUPPLIER INFORMATION', y, fontBold);

  // Row 1
  fieldBlock(pdfDoc, page, 'Supplier Name *', ML, y, half, 14, intake.supplier_name, fontBold, 'supplier_name');
  fieldBlock(pdfDoc, page, 'Visit Date *', ML + half + 10, y, half, 14, intake.visit_date, fontBold, 'visit_date');
  y -= 26;

  // Row 2
  fieldBlock(pdfDoc, page, 'Visited By', ML, y, half, 14, intake.visited_by, fontBold, 'visited_by');
  fieldBlock(pdfDoc, page, 'Supplier Address', ML + half + 10, y, half, 14, intake.supplier_address, fontBold, 'supplier_address');
  y -= 26;

  // Row 3
  fieldBlock(pdfDoc, page, 'Contact Person', ML, y, third, 14, intake.supplier_contact_name, fontBold, 'contact_name');
  fieldBlock(pdfDoc, page, 'Contact Email', ML + third + 8, y, third, 14, intake.supplier_contact_email, fontBold, 'contact_email');
  fieldBlock(pdfDoc, page, 'Contact Phone', ML + 2 * (third + 8), y, third, 14, intake.supplier_contact_phone, fontBold, 'contact_phone');
  y -= 28;

  // ── SECTION 2: Products & Operations ────────────────────────────────────────
  if (y < 180) { page = makePage(pdfDoc, fontBold, fontNormal, logoImage); y = PH - 64; }
  y = secHeader(page, '2.  PRODUCTS & OPERATIONS', y, fontBold);

  page.drawText('Product Types:', { x: ML, y, font: fontBold, size: 8, color: BLACK });
  y -= 14;

  // 5-column checkbox grid
  const ptColW = CW / 5;
  PRODUCT_TYPES.forEach((pt, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const cx = ML + col * ptColW;
    const cy = y - row * 16;
    addCB(pdfDoc, page, cx, cy - cbSz + 2, cbSz, intake.product_types?.includes(pt), `pt_${pt.replace(/\s/g,'_')}`);
    page.drawText(pt, { x: cx + cbSz + 3, y: cy, font: fontNormal, size: 8, color: BLACK });
  });
  y -= (Math.ceil(PRODUCT_TYPES.length / 5)) * 16 + 4;

  page.drawText('If "Other", specify:', { x: ML, y, font: fontNormal, size: 7.5, color: DARK_GRAY });
  addText(pdfDoc, page, ML + 84, y - 13, CW - 84, 12, intake.product_types_other, 'pt_other');
  y -= 22;

  // Slaughter row
  y = cbGroup(pdfDoc, page, 'Weekly Slaughter:', ['Yes', 'No', 'N/A'], null, ML, y, cbSz, fontBold, intake.weekly_slaughter, 'slaughter') - 6;
  page.drawText('Slaughter Volume / Week:', { x: ML + 180, y: y + 6, font: fontNormal, size: 8, color: BLACK });
  addText(pdfDoc, page, ML + 310, y - 6, 100, 12, intake.weekly_slaughter_volume, 'slaughter_vol');
  y -= 4;

  page.drawText('Number of Employees:', { x: ML, y, font: fontBold, size: 8, color: BLACK });
  addText(pdfDoc, page, ML + fontBold.widthOfTextAtSize('Number of Employees:', 8) + 6, y - 13, 60, 12, intake.number_of_employees, 'num_employees');
  y -= 22;

  // Production lines table
  page.drawText('Weekly Production by Product / Cut:', { x: ML, y, font: fontBold, size: 8, color: BLACK });
  y -= 6;

  const tCols = [CW * 0.28, CW * 0.32, CW * 0.22, CW * 0.18];
  const tX = [ML, ML + tCols[0], ML + tCols[0] + tCols[1], ML + tCols[0] + tCols[1] + tCols[2]];
  const tH = 15;
  const tHdrs = ['Category', 'Cut / SKU', 'Weekly Volume', 'Unit'];

  // Header
  page.drawRectangle({ x: ML, y: y - tH, width: CW, height: tH, color: LIGHT_BLUE });
  page.drawRectangle({ x: ML, y: y - tH, width: CW, height: tH, borderColor: MID_GRAY, borderWidth: 0.5 });
  tHdrs.forEach((h, i) => {
    page.drawText(h, { x: tX[i] + 3, y: y - tH + 4, font: fontBold, size: 7.5, color: BLACK });
    if (i > 0) page.drawLine({ start: { x: tX[i], y }, end: { x: tX[i], y: y - tH }, thickness: 0.4, color: MID_GRAY });
  });
  y -= tH;

  const prodLines = intake.product_production_lines?.length > 0
    ? intake.product_production_lines
    : Array(5).fill({});

  prodLines.forEach((line, ri) => {
    if (ri % 2 === 1) page.drawRectangle({ x: ML, y: y - tH, width: CW, height: tH, color: LIGHT_GRAY });
    page.drawRectangle({ x: ML, y: y - tH, width: CW, height: tH, borderColor: MID_GRAY, borderWidth: 0.4 });
    tCols.forEach((cw, ci) => {
      if (ci > 0) page.drawLine({ start: { x: tX[ci], y }, end: { x: tX[ci], y: y - tH }, thickness: 0.4, color: MID_GRAY });
      const val = line && [line.category, line.cut, line.volume, line.unit][ci];
      addText(pdfDoc, page, tX[ci] + 1, y - tH + 1, cw - 2, tH - 2, val || '', `prod_${ri}_${ci}`);
    });
    y -= tH;
  });
  y -= 8;

  // ── SECTION 3: Food Safety Programs ─────────────────────────────────────────
  if (y < 160) { page = makePage(pdfDoc, fontBold, fontNormal, logoImage); y = PH - 64; }
  y = secHeader(page, '3.  FOOD SAFETY PROGRAMS', y, fontBold);

  cbGroup(pdfDoc, page, 'Food Safety Plan:', ['HACCP', 'HARPC', 'Both', 'None'], null, ML, y, cbSz, fontBold, intake.food_safety_plan, 'fsp');
  y -= 16;

  cbGroup(pdfDoc, page, '3rd Party Audit Present:', ['Yes', 'No'], null, ML, y, cbSz, fontBold, intake.third_party_audit, 'audit_present');
  y -= 16;

  page.drawText('Audit Certifications:', { x: ML, y, font: fontBold, size: 8, color: BLACK });
  y -= 14;
  const atColW = CW / 5;
  AUDIT_TYPES.forEach((at, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const cx = ML + col * atColW;
    const cy = y - row * 16;
    addCB(pdfDoc, page, cx, cy - cbSz + 2, cbSz, intake.third_party_audit_types?.includes(at), `audit_${at.replace(/[\s.]/g,'_')}`);
    page.drawText(at, { x: cx + cbSz + 3, y: cy, font: fontNormal, size: 8, color: BLACK });
  });
  y -= (Math.ceil(AUDIT_TYPES.length / 5)) * 16 + 4;

  page.drawText('If "Other", specify:', { x: ML, y, font: fontNormal, size: 7.5, color: DARK_GRAY });
  addText(pdfDoc, page, ML + 84, y - 13, CW * 0.35, 12, intake.third_party_audit_other, 'audit_other');
  page.drawText('Expiry Date:', { x: ML + CW * 0.42, y, font: fontBold, size: 8, color: BLACK });
  addText(pdfDoc, page, ML + CW * 0.42 + fontBold.widthOfTextAtSize('Expiry Date:', 8) + 5, y - 13, 90, 12, intake.audit_expiry_date, 'audit_expiry');
  y -= 22;

  // Prerequisite programs — 3 per row
  page.drawText('Prerequisite Programs:', { x: ML, y, font: fontBold, size: 8, color: BLACK });
  y -= 14;
  const progList = [
    ['GMP Program', 'gmp_program'],
    ['Allergen Program', 'allergen_program'],
    ['Pest Control Program', 'pest_control_program'],
    ['Water Testing Program', 'water_testing_program'],
    ['Traceability Program', 'traceability_program'],
  ];
  const pColW = CW / 3;
  progList.forEach(([lbl, key], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const px = ML + col * pColW;
    const py = y - row * 16;
    page.drawText(lbl + ':', { x: px, y: py, font: fontBold, size: 8, color: BLACK });
    let bx = px + fontBold.widthOfTextAtSize(lbl + ':', 8) + 4;
    for (const opt of ['Yes', 'No']) {
      addCB(pdfDoc, page, bx, py - cbSz + 2, cbSz, intake[key] === opt, `prog_${key}_${opt}`);
      page.drawText(opt, { x: bx + cbSz + 2, y: py, font: fontNormal, size: 8, color: BLACK });
      bx += cbSz + fontNormal.widthOfTextAtSize(opt, 8) + 8;
    }
  });
  y -= Math.ceil(progList.length / 3) * 16 + 8;

  // ── SECTION 4: Plant Inspection ──────────────────────────────────────────────
  if (y < 200) { page = makePage(pdfDoc, fontBold, fontNormal, logoImage); y = PH - 64; }
  y = secHeader(page, '4.  PLANT INSPECTION WALK-THROUGH', y, fontBold);

  cbGroup(pdfDoc, page, 'Plant Inspection Conducted:', ['Yes', 'No'], null, ML, y, cbSz, fontBold, intake.plant_inspection_conducted, 'insp_conducted');
  y -= 20;

  // Table header
  const areaW = CW * 0.27;
  const ratingW = CW * 0.105;
  const commentW = CW - areaW - 4 * ratingW;
  const iX = [ML, ML + areaW, ML + areaW + ratingW, ML + areaW + 2 * ratingW, ML + areaW + 3 * ratingW, ML + areaW + 4 * ratingW];
  const iH = 17;

  page.drawRectangle({ x: ML, y: y - iH, width: CW, height: iH, color: LIGHT_BLUE });
  page.drawRectangle({ x: ML, y: y - iH, width: CW, height: iH, borderColor: MID_GRAY, borderWidth: 0.5 });
  page.drawText('Area', { x: iX[0] + 3, y: y - iH + 5, font: fontBold, size: 7.5, color: BLACK });
  ['Satisfactory', 'Needs Impr.', 'Unsatisfactory', 'N/A', 'Comments'].forEach((h, i) => {
    page.drawLine({ start: { x: iX[i + 1], y }, end: { x: iX[i + 1], y: y - iH }, thickness: 0.4, color: MID_GRAY });
    page.drawText(h, { x: iX[i + 1] + 2, y: y - iH + 5, font: fontBold, size: 6.5, color: BLACK });
  });
  y -= iH;

  INSPECTION_AREAS.forEach(([key, label], ri) => {
    if (y < 60) { page = makePage(pdfDoc, fontBold, fontNormal, logoImage); y = PH - 64; }
    if (ri % 2 === 1) page.drawRectangle({ x: ML, y: y - iH, width: CW, height: iH, color: LIGHT_GRAY });
    page.drawRectangle({ x: ML, y: y - iH, width: CW, height: iH, borderColor: MID_GRAY, borderWidth: 0.4 });
    page.drawText(label, { x: iX[0] + 3, y: y - iH + 5, font: fontNormal, size: 7.5, color: BLACK });
    ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'].forEach((opt, ci) => {
      page.drawLine({ start: { x: iX[ci + 1], y }, end: { x: iX[ci + 1], y: y - iH }, thickness: 0.4, color: MID_GRAY });
      const cbcx = iX[ci + 1] + (ratingW - cbSz) / 2;
      addCB(pdfDoc, page, cbcx, y - iH + (iH - cbSz) / 2, cbSz, intake[key] === opt, `insp_${key}_${opt.replace(/\s/g,'_')}`);
    });
    page.drawLine({ start: { x: iX[5], y }, end: { x: iX[5], y: y - iH }, thickness: 0.4, color: MID_GRAY });
    addText(pdfDoc, page, iX[5] + 1, y - iH + 1, commentW - 2, iH - 2, intake[`${key}_comment`] || '', `insp_${key}_comment`);
    y -= iH;
  });
  y -= 8;

  // Overall rating
  cbGroup(pdfDoc, page, 'Overall Inspection Rating:', ['Pass', 'Conditional Pass', 'Fail'], null, ML, y, cbSz, fontBold, intake.inspection_overall_rating, 'overall_rating');
  y -= 20;

  page.drawText('Inspection Notes:', { x: ML, y, font: fontBold, size: 8, color: BLACK });
  y -= 5;
  addText(pdfDoc, page, ML, y - 38, CW, 38, intake.inspection_notes || '', 'inspection_notes', true);
  y -= 48;

  // ── SECTION 5: General Notes ─────────────────────────────────────────────────
  if (y < 120) { page = makePage(pdfDoc, fontBold, fontNormal, logoImage); y = PH - 64; }
  y = secHeader(page, '5.  GENERAL NOTES', y, fontBold);
  addText(pdfDoc, page, ML, y - 50, CW, 50, intake.general_notes || '', 'general_notes', true);
  y -= 62;

  // ── SECTION 6: Signatures ────────────────────────────────────────────────────
  if (y < 100) { page = makePage(pdfDoc, fontBold, fontNormal, logoImage); y = PH - 64; }
  y = secHeader(page, '6.  SIGNATURES', y, fontBold);
  y -= 6;

  const sigW = (CW - 14) / 2;
  [['FSQA Representative', 'sig_fsqa'], ['Supplier Representative', 'sig_supplier']].forEach(([lbl, key], i) => {
    const sx = ML + i * (sigW + 14);
    page.drawRectangle({ x: sx, y: y - 56, width: sigW, height: 56, borderColor: MID_GRAY, borderWidth: 0.7 });
    page.drawText(lbl, { x: sx + 5, y: y - 14, font: fontBold, size: 8, color: BLACK });
    page.drawText('Signature:', { x: sx + 5, y: y - 26, font: fontNormal, size: 7.5, color: DARK_GRAY });
    page.drawLine({ start: { x: sx + 5, y: y - 40 }, end: { x: sx + sigW - 5, y: y - 40 }, thickness: 0.6, color: MID_GRAY });
    page.drawText('Date:', { x: sx + 5, y: y - 49, font: fontNormal, size: 7.5, color: DARK_GRAY });
    addText(pdfDoc, page, sx + 28, y - 56 + 3, sigW - 33, 11, '', `${key}_date`);
  });

  // Update page numbers in footers
  const totalPages = pdfDoc.getPageCount();
  pdfDoc.getPages().forEach((pg, idx) => {
    pg.drawText(`Page ${idx + 1} of ${totalPages}`, {
      x: PW - ML - 60, y: 20, font: fontNormal, size: 6.5, color: MID_GRAY,
    });
  });

  return pdfDoc;
}

// ─── Printable HTML (for Print button) ───────────────────────────────────────
function PrintableForm({ intake = {} }) {
  const CB = ({ checked }) => (
    <span style={{
      display: 'inline-block', width: 10, height: 10,
      border: '1.5px solid #444', marginRight: 3, verticalAlign: 'middle',
      flexShrink: 0, background: checked ? '#1a365d' : 'white', position: 'relative'
    }}>
      {checked && <span style={{ position: 'absolute', top: -1, left: 1, color: 'white', fontSize: 9, lineHeight: '11px', fontWeight: 'bold' }}>✓</span>}
    </span>
  );
  const Field = ({ label, value, w = '100%' }) => (
    <div style={{ display: 'inline-block', width: w, paddingRight: 8, marginBottom: 7, verticalAlign: 'top', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 7, fontWeight: 'bold', marginBottom: 1 }}>{label}</div>
      <div style={{ borderBottom: '1px solid #888', minHeight: 14, fontSize: 8, paddingLeft: 2 }}>{value || '\u00A0'}</div>
    </div>
  );
  const SecHead = ({ n, title }) => (
    <div style={{ background: '#1a365d', color: 'white', padding: '4px 8px', fontWeight: 'bold', fontSize: 9, marginTop: 10, marginBottom: 5 }}>
      {n}.  {title.toUpperCase()}
    </div>
  );
  const Row = ({ children, style }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: 6, ...style }}>{children}</div>
  );
  const CBLabel = ({ opt, checked }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 3, marginRight: 14, fontSize: 8 }}>
      <CB checked={checked} />{opt}
    </label>
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 8, color: '#000', padding: '8mm 10mm', width: '190mm', margin: '0 auto', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ background: '#1a365d', color: 'white', padding: '6px 10px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>AJC FSQA HUB</div>
          <div style={{ fontSize: 9, opacity: 0.85 }}>Supplier Intake &amp; Assessment Form</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <img src="https://www.ajcfood.com/themes/custom/ajc/img/logo-ajc.png"
            alt="AJC" style={{ height: 32, filter: 'brightness(0) invert(1)' }}
            onError={e => e.target.style.display = 'none'} />
          <div style={{ fontSize: 7, opacity: 0.7, marginTop: 2 }}>{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <SecHead n="1" title="Supplier Information" />
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <Field label="Supplier Name *" value={intake.supplier_name} w="50%" />
        <Field label="Visit Date *" value={intake.visit_date} w="50%" />
        <Field label="Visited By" value={intake.visited_by} w="50%" />
        <Field label="Supplier Address" value={intake.supplier_address} w="50%" />
        <Field label="Contact Person" value={intake.supplier_contact_name} w="34%" />
        <Field label="Contact Email" value={intake.supplier_contact_email} w="34%" />
        <Field label="Contact Phone" value={intake.supplier_contact_phone} w="32%" />
      </div>

      <SecHead n="2" title="Products & Operations" />
      <div style={{ fontWeight: 'bold', fontSize: 7.5, marginBottom: 4 }}>Product Types:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 18px', marginBottom: 7 }}>
        {PRODUCT_TYPES.map(p => <CBLabel key={p} opt={p} checked={intake.product_types?.includes(p)} />)}
      </div>
      <Row>
        <span style={{ fontWeight: 'bold', fontSize: 8, marginRight: 6 }}>Weekly Slaughter:</span>
        {['Yes', 'No', 'N/A'].map(o => <CBLabel key={o} opt={o} checked={intake.weekly_slaughter === o} />)}
        <Field label="Slaughter Volume / Week" value={intake.weekly_slaughter_volume} w="28%" />
      </Row>
      <Field label="Number of Employees" value={intake.number_of_employees} w="25%" />
      <div style={{ fontWeight: 'bold', fontSize: 7.5, marginTop: 4, marginBottom: 3 }}>Weekly Production by Product / Cut:</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
        <thead>
          <tr style={{ background: '#e6ecf5' }}>
            {['Category', 'Cut / SKU', 'Weekly Volume', 'Unit'].map(h => (
              <th key={h} style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'left', fontSize: 7.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(intake.product_production_lines?.length > 0 ? intake.product_production_lines : Array(5).fill({})).map((line, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f7f9fc' }}>
              <td style={{ border: '1px solid #ccc', padding: '4px 5px', height: 14 }}>{line.category || ''}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px 5px' }}>{line.cut || ''}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px 5px' }}>{line.volume || ''}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px 5px' }}>{line.unit || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SecHead n="3" title="Food Safety Programs" />
      <Row>
        <span style={{ fontWeight: 'bold', fontSize: 8, marginRight: 6 }}>Food Safety Plan:</span>
        {['HACCP', 'HARPC', 'Both', 'None'].map(o => <CBLabel key={o} opt={o} checked={intake.food_safety_plan === o} />)}
      </Row>
      <Row>
        <span style={{ fontWeight: 'bold', fontSize: 8, marginRight: 6 }}>3rd Party Audit Present:</span>
        {['Yes', 'No'].map(o => <CBLabel key={o} opt={o} checked={intake.third_party_audit === o} />)}
      </Row>
      <div style={{ fontWeight: 'bold', fontSize: 7.5, marginBottom: 4 }}>Audit Certifications:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 18px', marginBottom: 6 }}>
        {AUDIT_TYPES.map(p => <CBLabel key={p} opt={p} checked={intake.third_party_audit_types?.includes(p)} />)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <Field label='If "Other", specify' value={intake.third_party_audit_other} w="40%" />
        <Field label="Audit / Certificate Expiry Date" value={intake.audit_expiry_date} w="35%" />
      </div>
      <div style={{ fontWeight: 'bold', fontSize: 7.5, marginBottom: 4 }}>Prerequisite Programs:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 0', marginBottom: 4 }}>
        {[['GMP Program', 'gmp_program'], ['Allergen Program', 'allergen_program'], ['Pest Control Program', 'pest_control_program'], ['Water Testing Program', 'water_testing_program'], ['Traceability Program', 'traceability_program']].map(([lbl, key]) => (
          <div key={key} style={{ width: '33%', display: 'flex', alignItems: 'center', gap: 4, fontSize: 8 }}>
            <span style={{ fontWeight: 'bold', marginRight: 3 }}>{lbl}:</span>
            {['Yes', 'No'].map(o => <CBLabel key={o} opt={o} checked={intake[key] === o} />)}
          </div>
        ))}
      </div>

      <SecHead n="4" title="Plant Inspection Walk-Through" />
      <Row style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 'bold', fontSize: 8, marginRight: 6 }}>Plant Inspection Conducted:</span>
        {['Yes', 'No'].map(o => <CBLabel key={o} opt={o} checked={intake.plant_inspection_conducted === o} />)}
      </Row>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8, marginBottom: 6 }}>
        <thead>
          <tr style={{ background: '#e6ecf5' }}>
            <th style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'left', width: '26%', fontSize: 7.5 }}>Area</th>
            {['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'].map(h => (
              <th key={h} style={{ border: '1px solid #bbb', padding: '3px 5px', width: '10%', textAlign: 'center', fontSize: 7 }}>{h}</th>
            ))}
            <th style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'left', fontSize: 7.5 }}>Comments</th>
          </tr>
        </thead>
        <tbody>
          {INSPECTION_AREAS.map(([key, label], i) => (
            <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : '#f7f9fc' }}>
              <td style={{ border: '1px solid #ccc', padding: '4px 5px' }}>{label}</td>
              {['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'].map(opt => (
                <td key={opt} style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>
                  <CB checked={intake[key] === opt} />
                </td>
              ))}
              <td style={{ border: '1px solid #ccc', padding: '4px 5px', fontSize: 7.5 }}>{intake[`${key}_comment`] || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Row>
        <span style={{ fontWeight: 'bold', fontSize: 8, marginRight: 6 }}>Overall Inspection Rating:</span>
        {['Pass', 'Conditional Pass', 'Fail'].map(o => <CBLabel key={o} opt={o} checked={intake.inspection_overall_rating === o} />)}
      </Row>
      <div style={{ fontWeight: 'bold', fontSize: 7.5, marginBottom: 2 }}>Inspection Notes:</div>
      <div style={{ border: '1px solid #ccc', minHeight: 30, padding: '3px 5px', fontSize: 8, marginBottom: 6 }}>{intake.inspection_notes || ''}</div>

      <SecHead n="5" title="General Notes" />
      <div style={{ border: '1px solid #ccc', minHeight: 40, padding: '3px 5px', fontSize: 8, marginBottom: 10 }}>{intake.general_notes || ''}</div>

      <SecHead n="6" title="Signatures" />
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {['FSQA Representative', 'Supplier Representative'].map(lbl => (
          <div key={lbl} style={{ flex: 1, border: '1px solid #ccc', padding: '6px 8px', minHeight: 55 }}>
            <div style={{ fontWeight: 'bold', fontSize: 7.5, marginBottom: 22 }}>{lbl}</div>
            <div style={{ borderBottom: '1px solid #555', marginBottom: 4 }} />
            <div style={{ fontSize: 7, color: '#666' }}>Signature &amp; Date</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 4, fontSize: 6.5, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
        <span>AJC FSQA Hub — Supplier Intake Form</span>
        <span>CONFIDENTIAL</span>
      </div>
    </div>
  );
}

// ─── Exported buttons ─────────────────────────────────────────────────────────
export default function SupplierIntakePDFButtons({ intake = {} }) {
  const printRef = useRef(null);

  const handleDownloadPDF = async () => {
    try {
      const pdfDoc = await generateSupplierIntakePDF(intake);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = intake.supplier_name
        ? `supplier-intake-${intake.supplier_name.replace(/\s+/g, '-').toLowerCase()}.pdf`
        : 'supplier-intake-form.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF: ' + err.message);
    }
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=960,height=800');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Supplier Intake Form${intake.supplier_name ? ' — ' + intake.supplier_name : ''}</title>
      <style>
        @page { size: A4; margin: 0; }
        @media print { body { margin: 0; } }
        body { margin: 0; background: white; }
      </style>
    </head><body>${content}<script>window.onload=()=>window.print();<\/script></body></html>`);
    win.document.close();
  };

  return (
    <>
      <div style={{ display: 'none' }}>
        <div ref={printRef}><PrintableForm intake={intake} /></div>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPDF}>
        <FileDown className="w-4 h-4" /> Download PDF
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
        <Printer className="w-4 h-4" /> Print Form
      </Button>
    </>
  );
}