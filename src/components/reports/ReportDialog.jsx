import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableCountrySelect from '@/components/shared/SearchableCountrySelect';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, X, FileText, FileDown } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { jsPDF } from 'jspdf';

export default function ReportDialog({ open, onOpenChange, title, data, filterConfig, dateField = 'created_date' }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fieldFilters, setFieldFilters] = useState({});

  const setFilter = (key, value) => {
    setFieldFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  // Unique values for each filterable field
  const uniqueValues = useMemo(() => {
    const result = {};
    filterConfig.forEach(f => {
      if (f.type === 'select') {
        result[f.key] = [...new Set(data.map(d => d[f.key]).filter(Boolean))].sort();
      }
    });
    return result;
  }, [data, filterConfig]);

  const filtered = useMemo(() => {
    return data.filter(item => {
      // Date range filter
      if (dateFrom || dateTo) {
        const raw = item[dateField];
        if (!raw) return false;
        const date = parseISO(raw);
        if (dateFrom && date < startOfDay(parseISO(dateFrom))) return false;
        if (dateTo && date > endOfDay(parseISO(dateTo))) return false;
      }
      // Field filters
      for (const [key, value] of Object.entries(fieldFilters)) {
        if (!value) continue;
        const itemVal = (item[key] || '').toString().toLowerCase();
        if (!itemVal.includes(value.toLowerCase())) return false;
      }
      return true;
    });
  }, [data, dateFrom, dateTo, fieldFilters, dateField]);

  const exportCSV = () => {
    if (!filtered.length) return;
    const columns = filterConfig.map(f => f.key);
    const header = filterConfig.map(f => f.label);
    const rows = filtered.map(item =>
      columns.map(col => {
        const val = item[col];
        if (val == null) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val;
      })
    );
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!filtered.length) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // ── HEADER BACKGROUND ──────────────────────────────────────────────
    // Navy gradient bar
    doc.setFillColor(26, 54, 93); // deep navy
    doc.rect(0, 0, pageW, 70, 'F');

    // Orange accent stripe
    doc.setFillColor(234, 88, 12); // accent orange
    doc.rect(0, 66, pageW, 6, 'F');

    // Load AJC logo via canvas
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = 'https://media.base44.com/images/public/69f10cbc7366891a2d7229d7/cb8fdd247_AJC.png';
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      // Draw logo (height 40pt, keep aspect ratio)
      const logoH = 40;
      const logoW = (img.width / img.height) * logoH;
      doc.addImage(dataUrl, 'PNG', 24, 15, logoW, logoH);
    } catch (_) { /* logo failed, skip */ }

    // Report title & subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(`${title} Report`, pageW / 2, 30, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 205, 230);
    const dateRange = (dateFrom || dateTo)
      ? `${dateFrom ? format(parseISO(dateFrom), 'MMM d, yyyy') : 'Beginning'} – ${dateTo ? format(parseISO(dateTo), 'MMM d, yyyy') : 'Today'}`
      : 'All dates';
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}   |   Date range: ${dateRange}   |   Records: ${filtered.length}`, pageW / 2, 50, { align: 'center' });

    // ── TABLE ──────────────────────────────────────────────────────────
    const cols = filterConfig;
    const startY = 90;
    const rowH = 22;
    const colPad = 8;
    const tableW = pageW - 48;
    const colW = tableW / cols.length;

    // Column header background
    doc.setFillColor(26, 54, 93);
    doc.rect(24, startY, tableW, rowH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    cols.forEach((col, i) => {
      const x = 24 + i * colW + colPad;
      doc.text(col.label.toUpperCase(), x, startY + 14, { maxWidth: colW - colPad * 2 });
    });

    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let y = startY + rowH;
    let page = 1;

    filtered.forEach((item, rowIdx) => {
      if (y + rowH > pageH - 40) {
        // Footer on current page
        drawFooter(doc, pageW, pageH, page);
        doc.addPage();
        page++;
        y = 30;

        // Re-draw column headers
        doc.setFillColor(26, 54, 93);
        doc.rect(24, y, tableW, rowH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        cols.forEach((col, i) => {
          doc.text(col.label.toUpperCase(), 24 + i * colW + colPad, y + 14, { maxWidth: colW - colPad * 2 });
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        y += rowH;
      }

      // Alternating row background
      if (rowIdx % 2 === 0) {
        doc.setFillColor(240, 245, 255);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(24, y, tableW, rowH, 'F');

      // Left accent bar for even rows
      if (rowIdx % 2 === 0) {
        doc.setFillColor(234, 88, 12);
        doc.rect(24, y, 3, rowH, 'F');
      }

      doc.setTextColor(30, 41, 59);
      cols.forEach((col, i) => {
        const raw = item[col.key];
        let cellText = '';
        if (raw == null || raw === '') cellText = '—';
        else if (col.type === 'date') {
          try { cellText = format(parseISO(String(raw)), 'MMM d, yyyy'); } catch { cellText = String(raw); }
        } else if (typeof raw === 'number') cellText = raw.toLocaleString();
        else cellText = String(raw);

        doc.text(cellText, 24 + i * colW + colPad + (rowIdx % 2 === 0 ? 3 : 0), y + 14, { maxWidth: colW - colPad * 2 });
      });

      // Bottom border
      doc.setDrawColor(220, 230, 245);
      doc.setLineWidth(0.5);
      doc.line(24, y + rowH, 24 + tableW, y + rowH);

      y += rowH;
    });

    drawFooter(doc, pageW, pageH, page);

    doc.save(`${title.replace(/\s+/g, '_')}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFieldFilters({});
  };

  const hasFilters = dateFrom || dateTo || Object.values(fieldFilters).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {title} Report
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex items-center gap-1.5"><Filter className="w-4 h-4" /> Filter Report</p>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearFilters}>
                <X className="w-3 h-3" /> Clear all
              </Button>
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>

          {/* Dynamic field filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filterConfig.map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                {f.type === 'country' ? (
                  <SearchableCountrySelect
                    value={fieldFilters[f.key] || ''}
                    onChange={v => setFilter(f.key, v)}
                    placeholder={`All ${f.label}`}
                  />
                ) : f.type === 'select' ? (
                  <Select value={fieldFilters[f.key] || 'all'} onValueChange={v => setFilter(f.key, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={`All ${f.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {f.label}</SelectItem>
                      {(uniqueValues[f.key] || []).map(v => (
                        <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={fieldFilters[f.key] || ''}
                    onChange={e => setFilter(f.key, e.target.value)}
                    placeholder={`Filter by ${f.label.toLowerCase()}`}
                    className="h-8 text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</Badge>
            {hasFilters && <span className="text-xs text-muted-foreground">filtered from {data.length} total</span>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2 h-8" onClick={exportCSV} disabled={!filtered.length}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <Button size="sm" className="gap-2 h-8 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={exportPDF} disabled={!filtered.length}>
              <FileDown className="w-3.5 h-3.5" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Table preview */}
        <div className="overflow-auto flex-1 border rounded-lg">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No records match the selected filters</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  {filterConfig.map(f => (
                    <th key={f.key} className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap border-b">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                    {filterConfig.map(f => (
                      <td key={f.key} className="px-3 py-2 border-b border-border/50 max-w-[200px] truncate whitespace-nowrap">
                        {formatCell(item[f.key], f.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function drawFooter(doc, pageW, pageH, page) {
  doc.setFillColor(26, 54, 93);
  doc.rect(0, pageH - 28, pageW, 28, 'F');
  doc.setFillColor(234, 88, 12);
  doc.rect(0, pageH - 30, pageW, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 205, 230);
  doc.text('AJC International · FSQA Hub · Confidential', 24, pageH - 10);
  doc.text(`Page ${page}`, pageW - 24, pageH - 10, { align: 'right' });
}

function formatCell(value, type) {
  if (value == null || value === '') return <span className="text-muted-foreground">—</span>;
  if (type === 'date' && value) {
    try { return format(parseISO(value), 'MMM d, yyyy'); } catch { return value; }
  }
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}