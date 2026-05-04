import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';

const INSPECTION_AREAS = [
  'Exterior / Grounds',
  'Receiving Area',
  'Storage / Warehouse',
  'Processing / Production Floor',
  'Sanitation Practices',
  'Employee Hygiene & GMP',
  'Pest Control Evidence',
  'Temperature Control',
  'Labeling & Traceability',
];

const PRODUCT_TYPES = ['Chicken', 'Pork', 'Beef', 'Fish', 'Turkey', 'Vegetables', 'Fruits', 'French Fries', 'Other'];
const AUDIT_TYPES = ['SQF', 'BRC', 'FSSC 22000', 'IFS', 'GLOBALG.A.P.', 'Primus GFS', 'Costco', 'Other'];

// ─── jsPDF helpers ───────────────────────────────────────────────────────────
function addSectionHeader(doc, text, y, pageWidth) {
  doc.setFillColor(26, 54, 93);
  doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(text, 18, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  return y + 8;
}

function addTextField(doc, label, x, y, w, value = '') {
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(label, x, y - 1);
  doc.setFont('helvetica', 'normal');
  // Draw border
  doc.setDrawColor(180, 180, 180);
  doc.rect(x, y + 1, w, 8);
  if (value) {
    doc.setFontSize(7);
    doc.text(String(value).substring(0, Math.floor(w / 1.8)), x + 1, y + 6.5);
  }
  return y + 12;
}

function checkBox(doc, x, y, checked = false) {
  doc.setDrawColor(100, 100, 100);
  doc.rect(x, y, 3.5, 3.5);
  if (checked) {
    doc.setDrawColor(26, 54, 93);
    doc.setLineWidth(0.6);
    doc.line(x + 0.5, y + 2, x + 1.5, y + 3.2);
    doc.line(x + 1.5, y + 3.2, x + 3.2, y + 0.5);
    doc.setLineWidth(0.2);
    doc.setDrawColor(100, 100, 100);
  }
}

function addCheckList(doc, label, options, selectedArr, x, y, cols = 4) {
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(label, x, y);
  y += 4;
  const colW = 42;
  options.forEach((opt, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x + col * colW;
    const cy = y + row * 6;
    checkBox(doc, cx, cy - 3, Array.isArray(selectedArr) && selectedArr.includes(opt));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(opt, cx + 5, cy);
  });
  const rows = Math.ceil(options.length / cols);
  return y + rows * 6 + 2;
}

function addYesNoField(doc, label, value, x, y) {
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(label + ':', x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const opts = label.includes('Slaughter') ? ['Yes', 'No', 'N/A'] : ['Yes', 'No'];
  let cx = x + doc.getTextWidth(label + ': ') + 2;
  opts.forEach(opt => {
    checkBox(doc, cx, y - 3.5, value === opt);
    doc.text(opt, cx + 5, y);
    cx += 18;
  });
  return y + 6;
}

function addRatingRow(doc, label, value, comment, x, y, pageWidth) {
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(label, x, y);
  const opts = ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'];
  let cx = x + 52;
  opts.forEach(opt => {
    checkBox(doc, cx, y - 3.5, value === opt);
    doc.setFontSize(6.5);
    doc.text(opt, cx + 4.5, y);
    cx += 32;
  });
  y += 4;
  // comment line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(x + 52, y + 2, pageWidth - 14, y + 2);
  if (comment) {
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text(comment.substring(0, 100), x + 52, y + 1.5);
    doc.setTextColor(0, 0, 0);
  }
  return y + 6;
}

function maybeAddPage(doc, y, margin = 20) {
  if (y > 270) {
    doc.addPage();
    return 18;
  }
  return y;
}

// ─── Main PDF generator ───────────────────────────────────────────────────────
export function generateSupplierIntakePDF(intake = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  let y = 14;

  // ── Header ──
  doc.setFillColor(26, 54, 93);
  doc.rect(0, 0, pw, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('AJC FSQA HUB', 14, 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Supplier Intake & Assessment Form', 14, 16);
  doc.setFontSize(7.5);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pw - 14, 16, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  y = 28;

  // ── Section 1: Supplier Information ──
  y = addSectionHeader(doc, '1. SUPPLIER INFORMATION', y, pw);
  y += 3;
  const half = (pw - 28) / 2;
  addTextField(doc, 'Supplier Name *', 14, y, half - 2, intake.supplier_name);
  addTextField(doc, 'Visit Date *', 16 + half, y, half - 2, intake.visit_date);
  y += 14;
  addTextField(doc, 'Visited By', 14, y, half - 2, intake.visited_by);
  addTextField(doc, 'Supplier Address', 16 + half, y, half - 2, intake.supplier_address);
  y += 14;
  const third = (pw - 28) / 3;
  addTextField(doc, 'Contact Person', 14, y, third - 2, intake.supplier_contact_name);
  addTextField(doc, 'Contact Email', 16 + third, y, third - 2, intake.supplier_contact_email);
  addTextField(doc, 'Contact Phone', 18 + 2 * third, y, third - 2, intake.supplier_contact_phone);
  y += 16;

  // ── Section 2: Products & Operations ──
  y = maybeAddPage(doc, y);
  y = addSectionHeader(doc, '2. PRODUCTS & OPERATIONS', y, pw);
  y += 4;
  y = addCheckList(doc, 'Product Types:', PRODUCT_TYPES, intake.product_types, 14, y, 5);
  y += 1;
  y = addYesNoField(doc, 'Weekly Slaughter', intake.weekly_slaughter, 14, y);
  if (intake.weekly_slaughter === 'Yes') {
    doc.setFontSize(7);
    doc.text('Slaughter Volume/Week:', 14, y);
    doc.setDrawColor(180, 180, 180);
    doc.rect(52, y - 3, 40, 5);
    if (intake.weekly_slaughter_volume) doc.text(intake.weekly_slaughter_volume, 53, y);
    y += 7;
  }
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Number of Employees:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(180, 180, 180);
  doc.rect(52, y - 3, 25, 5);
  if (intake.number_of_employees) doc.setFontSize(7), doc.text(String(intake.number_of_employees), 53, y);
  y += 7;

  // Production lines table
  if (intake.product_production_lines?.length > 0) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Weekly Production by Product / Cut:', 14, y);
    y += 4;
    // Table header
    doc.setFillColor(230, 236, 245);
    doc.rect(14, y - 3.5, pw - 28, 5.5, 'F');
    doc.setFontSize(6.5);
    doc.text('Category', 16, y);
    doc.text('Cut / SKU', 60, y);
    doc.text('Weekly Volume', 110, y);
    doc.text('Unit', 155, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    intake.product_production_lines.forEach((line, i) => {
      y = maybeAddPage(doc, y);
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 3.5, pw - 28, 5.5, 'F');
      }
      doc.setFontSize(7);
      doc.text(line.category || '—', 16, y);
      doc.text(line.cut || '—', 60, y);
      doc.text(line.volume || '—', 110, y);
      doc.text(line.unit || '—', 155, y);
      doc.setDrawColor(220, 220, 220);
      doc.line(14, y + 2, pw - 14, y + 2);
      y += 6;
    });
  } else {
    // Blank rows for hand-fill
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Weekly Production by Product / Cut:', 14, y);
    y += 4;
    doc.setFillColor(230, 236, 245);
    doc.rect(14, y - 3.5, pw - 28, 5.5, 'F');
    doc.setFontSize(6.5);
    doc.text('Category', 16, y); doc.text('Cut / SKU', 60, y);
    doc.text('Weekly Volume', 110, y); doc.text('Unit', 155, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(200, 200, 200);
    for (let r = 0; r < 5; r++) {
      doc.rect(14, y - 3.5, pw - 28, 6);
      doc.line(56, y - 3.5, 56, y + 2.5);
      doc.line(106, y - 3.5, 106, y + 2.5);
      doc.line(150, y - 3.5, 150, y + 2.5);
      y += 6;
    }
  }
  y += 2;

  // ── Section 3: Food Safety Programs ──
  y = maybeAddPage(doc, y);
  y = addSectionHeader(doc, '3. FOOD SAFETY PROGRAMS', y, pw);
  y += 4;

  // Food Safety Plan
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Food Safety Plan:', 14, y);
  doc.setFont('helvetica', 'normal');
  let cx2 = 46;
  ['HACCP', 'HARPC', 'Both', 'None'].forEach(opt => {
    checkBox(doc, cx2, y - 3.5, intake.food_safety_plan === opt);
    doc.setFontSize(7);
    doc.text(opt, cx2 + 5, y);
    cx2 += 18;
  });
  y += 6;

  y = addYesNoField(doc, '3rd Party Audit Present', intake.third_party_audit, 14, y);
  if (intake.third_party_audit === 'Yes' || !intake.third_party_audit) {
    y = addCheckList(doc, 'Audit Certifications:', AUDIT_TYPES, intake.third_party_audit_types, 14, y, 5);
    addTextField(doc, 'Audit / Certificate Expiry Date', 14, y, 50, intake.audit_expiry_date);
    y += 12;
  }

  // Prerequisite programs
  const programs = [
    ['GMP Program', 'gmp_program'],
    ['Allergen Program', 'allergen_program'],
    ['Pest Control Program', 'pest_control_program'],
    ['Water Testing Program', 'water_testing_program'],
    ['Traceability Program', 'traceability_program'],
  ];
  const progColW = (pw - 28) / 3;
  programs.forEach(([ label, key ], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const px = 14 + col * progColW;
    const py = y + row * 8;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', px, py);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let bx = px + doc.getTextWidth(label + ': ') + 1;
    ['Yes', 'No'].forEach(opt => {
      checkBox(doc, bx, py - 3.5, intake[key] === opt);
      doc.text(opt, bx + 5, py);
      bx += 14;
    });
  });
  y += Math.ceil(programs.length / 3) * 8 + 2;

  // ── Section 4: Plant Inspection ──
  y = maybeAddPage(doc, y);
  y = addSectionHeader(doc, '4. PLANT INSPECTION WALK-THROUGH', y, pw);
  y += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Plant Inspection Conducted:', 14, y);
  doc.setFont('helvetica', 'normal');
  let pix = 62;
  ['Yes', 'No'].forEach(opt => {
    checkBox(doc, pix, y - 3.5, intake.plant_inspection_conducted === opt);
    doc.setFontSize(7);
    doc.text(opt, pix + 5, y);
    pix += 14;
  });
  y += 6;

  // Column headers
  doc.setFillColor(230, 236, 245);
  doc.rect(14, y - 3.5, pw - 28, 5.5, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Area', 16, y);
  doc.text('Satisfactory', 68, y);
  doc.text('Needs Improvement', 98, y);
  doc.text('Unsatisfactory', 133, y);
  doc.text('N/A', 163, y);
  doc.text('Comments', 175, y);
  y += 5;
  doc.setFont('helvetica', 'normal');

  const inspKeys = [
    'inspection_exterior', 'inspection_receiving', 'inspection_storage', 'inspection_processing',
    'inspection_sanitation', 'inspection_employee_hygiene', 'inspection_pest_control',
    'inspection_temperature_control', 'inspection_labeling',
  ];
  INSPECTION_AREAS.forEach((area, i) => {
    y = maybeAddPage(doc, y);
    if (i % 2 === 0) { doc.setFillColor(250, 251, 253); doc.rect(14, y - 3.5, pw - 28, 7.5, 'F'); }
    doc.setFontSize(7);
    doc.text(area, 16, y);
    checkBox(doc, 68, y - 3.5, intake[inspKeys[i]] === 'Satisfactory');
    checkBox(doc, 102, y - 3.5, intake[inspKeys[i]] === 'Needs Improvement');
    checkBox(doc, 137, y - 3.5, intake[inspKeys[i]] === 'Unsatisfactory');
    checkBox(doc, 163, y - 3.5, intake[inspKeys[i]] === 'N/A');
    // comment box
    doc.setDrawColor(200, 200, 200);
    doc.rect(173, y - 3.5, pw - 187, 7);
    const comment = intake[`${inspKeys[i]}_comment`];
    if (comment) {
      doc.setFontSize(5.5);
      doc.setTextColor(60, 60, 60);
      doc.text(comment.substring(0, 45), 174, y);
      doc.setTextColor(0, 0, 0);
    }
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y + 4, pw - 14, y + 4);
    y += 8;
  });

  y += 2;
  // Overall rating
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Inspection Rating:', 14, y);
  doc.setFont('helvetica', 'normal');
  let orx = 63;
  ['Pass', 'Conditional Pass', 'Fail'].forEach(opt => {
    checkBox(doc, orx, y - 3.5, intake.inspection_overall_rating === opt);
    doc.setFontSize(7);
    doc.text(opt, orx + 5, y);
    orx += 30;
  });
  y += 7;

  // Inspection notes
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Inspection Notes:', 14, y);
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.rect(14, y, pw - 28, 18);
  if (intake.inspection_notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const lines = doc.splitTextToSize(intake.inspection_notes, pw - 32);
    doc.text(lines.slice(0, 5), 16, y + 4);
  }
  y += 20;

  // ── Section 5: General Notes & Signature ──
  y = maybeAddPage(doc, y);
  y = addSectionHeader(doc, '5. GENERAL NOTES', y, pw);
  y += 3;
  doc.setDrawColor(180, 180, 180);
  doc.rect(14, y, pw - 28, 22);
  if (intake.general_notes) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(intake.general_notes, pw - 32);
    doc.text(lines.slice(0, 6), 16, y + 4);
  }
  y += 25;

  // Signature block
  y = maybeAddPage(doc, y);
  doc.setDrawColor(150, 150, 150);
  const sigW = (pw - 36) / 2;
  doc.line(14, y + 8, 14 + sigW, y + 8);
  doc.line(22 + sigW, y + 8, 22 + 2 * sigW, y + 8);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('FSQA Representative Signature & Date', 14, y + 11);
  doc.text('Supplier Representative Signature & Date', 22 + sigW, y + 11);
  doc.setTextColor(0, 0, 0);
  y += 16;

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text('AJC FSQA Hub — Supplier Intake Form', 14, 293);
    doc.text(`Page ${p} of ${totalPages}`, pw - 14, 293, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  return doc;
}

// ─── Printable HTML component ─────────────────────────────────────────────────
function PrintableForm({ intake = {} }) {
  const PRODUCT_TYPES_ALL = ['Chicken', 'Pork', 'Beef', 'Fish', 'Turkey', 'Vegetables', 'Fruits', 'French Fries', 'Other'];
  const AUDIT_TYPES_ALL = ['SQF', 'BRC', 'FSSC 22000', 'IFS', 'GLOBALG.A.P.', 'Primus GFS', 'Costco', 'Other'];
  const inspKeys = [
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

  const CB = ({ checked }) => (
    <span style={{ display: 'inline-block', width: 11, height: 11, border: '1.5px solid #555', marginRight: 4, verticalAlign: 'middle', background: checked ? '#1a365d' : 'white', position: 'relative' }}>
      {checked && <span style={{ position: 'absolute', top: 0, left: 1, color: 'white', fontSize: 9, lineHeight: '10px' }}>✓</span>}
    </span>
  );
  const Line = ({ label, value, width = '100%' }) => (
    <div style={{ display: 'inline-block', width, marginBottom: 6, paddingRight: 8 }}>
      <div style={{ fontSize: 7.5, fontWeight: 'bold', marginBottom: 2 }}>{label}</div>
      <div style={{ borderBottom: '1px solid #999', minHeight: 16, fontSize: 8, paddingLeft: 2 }}>{value || ''}</div>
    </div>
  );
  const SecHead = ({ n, title }) => (
    <div style={{ background: '#1a365d', color: 'white', padding: '3px 8px', fontWeight: 'bold', fontSize: 9, marginTop: 10, marginBottom: 6 }}>
      {n}. {title.toUpperCase()}
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 8, color: '#000', padding: '10mm', width: '190mm', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#1a365d', color: 'white', padding: '6px 10px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 13 }}>AJC FSQA HUB</div>
          <div style={{ fontSize: 9 }}>Supplier Intake & Assessment Form</div>
        </div>
        <div style={{ fontSize: 7.5, textAlign: 'right' }}>
          <div>Date Printed: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* 1 - Supplier Info */}
      <SecHead n="1" title="Supplier Information" />
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <Line label="Supplier Name *" value={intake.supplier_name} width="50%" />
        <Line label="Visit Date *" value={intake.visit_date} width="50%" />
        <Line label="Visited By" value={intake.visited_by} width="50%" />
        <Line label="Supplier Address" value={intake.supplier_address} width="50%" />
        <Line label="Contact Person" value={intake.supplier_contact_name} width="34%" />
        <Line label="Contact Email" value={intake.supplier_contact_email} width="34%" />
        <Line label="Contact Phone" value={intake.supplier_contact_phone} width="32%" />
      </div>

      {/* 2 - Products & Operations */}
      <SecHead n="2" title="Products & Operations" />
      <div style={{ fontWeight: 'bold', fontSize: 7.5, marginBottom: 3 }}>Product Types:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 6 }}>
        {PRODUCT_TYPES_ALL.map(p => (
          <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 7.5 }}>
            <CB checked={intake.product_types?.includes(p)} /> {p}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 6 }}>
        <div>
          <span style={{ fontWeight: 'bold', fontSize: 7.5 }}>Weekly Slaughter: </span>
          {['Yes', 'No', 'N/A'].map(o => <label key={o} style={{ fontSize: 7.5, marginRight: 8 }}><CB checked={intake.weekly_slaughter === o} />{o}</label>)}
        </div>
        {intake.weekly_slaughter === 'Yes' && <Line label="Slaughter Volume/Week" value={intake.weekly_slaughter_volume} width="30%" />}
      </div>
      <Line label="Number of Employees" value={intake.number_of_employees} width="30%" />

      {/* Production Lines Table */}
      <div style={{ fontWeight: 'bold', fontSize: 7.5, marginTop: 6, marginBottom: 3 }}>Weekly Production by Product / Cut:</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7.5 }}>
        <thead>
          <tr style={{ background: '#e6ecf5' }}>
            <th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'left' }}>Category</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'left' }}>Cut / SKU</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'left' }}>Weekly Volume</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'left' }}>Unit</th>
          </tr>
        </thead>
        <tbody>
          {(intake.product_production_lines?.length > 0 ? intake.product_production_lines : Array(5).fill({})).map((line, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
              <td style={{ border: '1px solid #ddd', padding: '3px 4px', height: 14 }}>{line.category || ''}</td>
              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{line.cut || ''}</td>
              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{line.volume || ''}</td>
              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{line.unit || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 3 - Food Safety Programs */}
      <SecHead n="3" title="Food Safety Programs" />
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 'bold', fontSize: 7.5 }}>Food Safety Plan: </span>
        {['HACCP', 'HARPC', 'Both', 'None'].map(o => <label key={o} style={{ fontSize: 7.5, marginRight: 10 }}><CB checked={intake.food_safety_plan === o} />{o}</label>)}
      </div>
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 'bold', fontSize: 7.5 }}>3rd Party Audit Present: </span>
        {['Yes', 'No'].map(o => <label key={o} style={{ fontSize: 7.5, marginRight: 10 }}><CB checked={intake.third_party_audit === o} />{o}</label>)}
      </div>
      <div style={{ fontWeight: 'bold', fontSize: 7.5, marginBottom: 3 }}>Audit Certifications:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 5 }}>
        {AUDIT_TYPES_ALL.map(p => (
          <label key={p} style={{ fontSize: 7.5 }}><CB checked={intake.third_party_audit_types?.includes(p)} />{p}</label>
        ))}
      </div>
      <Line label="Audit / Certificate Expiry Date" value={intake.audit_expiry_date} width="35%" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginTop: 5 }}>
        {[['GMP Program', 'gmp_program'], ['Allergen Program', 'allergen_program'], ['Pest Control Program', 'pest_control_program'], ['Water Testing Program', 'water_testing_program'], ['Traceability Program', 'traceability_program']].map(([lbl, key]) => (
          <div key={key}>
            <span style={{ fontWeight: 'bold', fontSize: 7.5 }}>{lbl}: </span>
            {['Yes', 'No'].map(o => <label key={o} style={{ fontSize: 7.5, marginRight: 6 }}><CB checked={intake[key] === o} />{o}</label>)}
          </div>
        ))}
      </div>

      {/* 4 - Plant Inspection */}
      <SecHead n="4" title="Plant Inspection Walk-Through" />
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 'bold', fontSize: 7.5 }}>Plant Inspection Conducted: </span>
        {['Yes', 'No'].map(o => <label key={o} style={{ fontSize: 7.5, marginRight: 10 }}><CB checked={intake.plant_inspection_conducted === o} />{o}</label>)}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7.5, marginBottom: 6 }}>
        <thead>
          <tr style={{ background: '#e6ecf5' }}>
            <th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'left', width: '28%' }}>Area</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 4px', width: '12%' }}>Satisfactory</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 4px', width: '16%' }}>Needs Improvement</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 4px', width: '14%' }}>Unsatisfactory</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 4px', width: '8%' }}>N/A</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'left' }}>Comments</th>
          </tr>
        </thead>
        <tbody>
          {inspKeys.map(([key, label], i) => (
            <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{label}</td>
              {['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'].map(opt => (
                <td key={opt} style={{ border: '1px solid #ddd', padding: '3px 4px', textAlign: 'center' }}>
                  <CB checked={intake[key] === opt} />
                </td>
              ))}
              <td style={{ border: '1px solid #ddd', padding: '3px 4px', fontSize: 7 }}>{intake[`${key}_comment`] || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 'bold', fontSize: 7.5 }}>Overall Inspection Rating: </span>
        {['Pass', 'Conditional Pass', 'Fail'].map(o => <label key={o} style={{ fontSize: 7.5, marginRight: 12 }}><CB checked={intake.inspection_overall_rating === o} />{o}</label>)}
      </div>
      <div style={{ fontWeight: 'bold', fontSize: 7.5, marginBottom: 2 }}>Inspection Notes:</div>
      <div style={{ border: '1px solid #ccc', minHeight: 28, padding: '2px 4px', fontSize: 7.5, marginBottom: 6 }}>{intake.inspection_notes || ''}</div>

      {/* 5 - General Notes */}
      <SecHead n="5" title="General Notes" />
      <div style={{ border: '1px solid #ccc', minHeight: 36, padding: '2px 4px', fontSize: 7.5, marginBottom: 10 }}>{intake.general_notes || ''}</div>

      {/* Signature block */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ borderBottom: '1px solid #555', height: 20 }} />
          <div style={{ fontSize: 7, color: '#666', marginTop: 2 }}>FSQA Representative Signature & Date</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ borderBottom: '1px solid #555', height: 20 }} />
          <div style={{ fontSize: 7, color: '#666', marginTop: 2 }}>Supplier Representative Signature & Date</div>
        </div>
      </div>

      <div style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 4, fontSize: 6.5, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
        <span>AJC FSQA Hub — Supplier Intake Form</span>
        <span>For internal use only</span>
      </div>
    </div>
  );
}

// ─── Exported buttons component ───────────────────────────────────────────────
export default function SupplierIntakePDFButtons({ intake = {} }) {
  const printRef = useRef(null);

  const handleDownloadPDF = () => {
    const doc = generateSupplierIntakePDF(intake);
    const name = intake.supplier_name
      ? `supplier-intake-${intake.supplier_name.replace(/\s+/g, '-').toLowerCase()}.pdf`
      : 'supplier-intake-form.pdf';
    doc.save(name);
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Supplier Intake Form${intake.supplier_name ? ' — ' + intake.supplier_name : ''}</title>
          <style>
            @media print { body { margin: 0; } }
            body { margin: 0; background: white; }
            input[type=checkbox] { accent-color: #1a365d; }
          </style>
        </head>
        <body>${content}</body>
        <script>window.onload = () => { window.print(); }</script>
      </html>
    `);
    win.document.close();
  };

  return (
    <>
      {/* Hidden printable DOM element */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <PrintableForm intake={intake} />
        </div>
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