import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableCountrySelect from '@/components/shared/SearchableCountrySelect';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, X, FileText, FileDown } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { jsPDF } from 'jspdf';

// resolvedStatusKey: which status field value means "resolved"
// createdField / resolvedField: date fields for computing resolution time
export default function ReportDialog({
  open, onOpenChange, title, data, filterConfig, dateField = 'created_date',
  resolutionConfig = null,  // { resolvedStatus, statusKey, createdField, resolvedField }
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fieldFilters, setFieldFilters] = useState({});

  const setFilter = (key, value) => {
    setFieldFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

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
      if (dateFrom || dateTo) {
        const raw = item[dateField];
        if (!raw) return false;
        const date = parseISO(raw);
        if (dateFrom && date < startOfDay(parseISO(dateFrom))) return false;
        if (dateTo && date > endOfDay(parseISO(dateTo))) return false;
      }
      for (const [key, value] of Object.entries(fieldFilters)) {
        if (!value) continue;
        const itemVal = (item[key] || '').toString().toLowerCase();
        if (!itemVal.includes(value.toLowerCase())) return false;
      }
      return true;
    });
  }, [data, dateFrom, dateTo, fieldFilters, dateField]);

  // Resolution analytics derived from filtered data
  const resolutionStats = useMemo(() => {
    if (!resolutionConfig) return null;
    const { resolvedStatus, statusKey, createdField, resolvedField } = resolutionConfig;

    const resolved = filtered.filter(item => {
      const s = item[statusKey];
      return Array.isArray(resolvedStatus) ? resolvedStatus.includes(s) : s === resolvedStatus;
    });

    const items = resolved.map(item => {
      const start = item[createdField] ? parseISO(item[createdField]) : null;
      const end = item[resolvedField] ? parseISO(item[resolvedField]) : null;
      const days = start && end ? Math.max(0, differenceInDays(end, start)) : null;
      return { label: item.title || item.claim_id || item.name || item.id, days };
    }).filter(i => i.days !== null);

    if (!items.length) return null;

    const avg = items.reduce((s, i) => s + i.days, 0) / items.length;
    const max = Math.max(...items.map(i => i.days));
    const min = Math.min(...items.map(i => i.days));

    // Bucket into ranges
    const buckets = [
      { label: '0–3 days', count: 0 },
      { label: '4–7 days', count: 0 },
      { label: '8–14 days', count: 0 },
      { label: '15–30 days', count: 0 },
      { label: '30+ days', count: 0 },
    ];
    items.forEach(({ days }) => {
      if (days <= 3) buckets[0].count++;
      else if (days <= 7) buckets[1].count++;
      else if (days <= 14) buckets[2].count++;
      else if (days <= 30) buckets[3].count++;
      else buckets[4].count++;
    });

    return { items, avg, max, min, total: items.length, buckets };
  }, [filtered, resolutionConfig]);

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

    // ── Load AJC logo first ──
    let logoDataUrl = null;
    let logoW = 0;
    const logoH = 38;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'https://media.base44.com/images/public/69f10cbc7366891a2d7229d7/cb8fdd247_AJC.png'; });
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      logoDataUrl = canvas.toDataURL('image/png');
      logoW = (img.width / img.height) * logoH;
    } catch (_) {}

    // ── PAGE 1: Analytics (only if resolutionStats available) ──
    let analyticsPage = false;
    if (resolutionStats) {
      analyticsPage = true;
      drawHeader(doc, pageW, logoDataUrl, logoW, logoH, `${title} — Resolution Analytics`);
      const dateRange = (dateFrom || dateTo)
        ? `${dateFrom ? format(parseISO(dateFrom), 'MMM d, yyyy') : 'Beginning'} – ${dateTo ? format(parseISO(dateTo), 'MMM d, yyyy') : 'Today'}`
        : 'All dates';
      drawSubtitle(doc, pageW, `Generated: ${format(new Date(), 'MMMM d, yyyy')}   |   Date range: ${dateRange}   |   Resolved records: ${resolutionStats.total}`);

      const startY = 95;

      // ── KPI Cards ──
      const kpis = [
        { label: 'Records Resolved', value: String(resolutionStats.total), color: [26, 54, 93] },
        { label: 'Avg Resolution Time', value: `${resolutionStats.avg.toFixed(1)} days`, color: [234, 88, 12] },
        { label: 'Fastest Resolution', value: `${resolutionStats.min} day${resolutionStats.min !== 1 ? 's' : ''}`, color: [16, 130, 80] },
        { label: 'Slowest Resolution', value: `${resolutionStats.max} day${resolutionStats.max !== 1 ? 's' : ''}`, color: [180, 30, 30] },
      ];

      const kpiW = (pageW - 48 - 18) / 4;
      kpis.forEach((kpi, i) => {
        const kx = 24 + i * (kpiW + 6);
        doc.setFillColor(...kpi.color);
        doc.roundedRect(kx, startY, kpiW, 60, 6, 6, 'F');
        doc.setFillColor(255, 255, 255, 0.15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text(kpi.value, kx + kpiW / 2, startY + 28, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(220, 230, 245);
        doc.text(kpi.label, kx + kpiW / 2, startY + 46, { align: 'center' });
      });

      // ── Bar Chart: Distribution ──
      const chartY = startY + 80;
      const chartH = 130;
      const chartX = 24;
      const chartW = pageW - 48;
      const buckets = resolutionStats.buckets;
      const maxCount = Math.max(...buckets.map(b => b.count), 1);
      const barW = (chartW - 40) / buckets.length;
      const COLORS = [
        [26, 54, 93],
        [234, 88, 12],
        [16, 130, 80],
        [140, 60, 180],
        [200, 50, 50],
      ];

      // Chart background
      doc.setFillColor(245, 248, 255);
      doc.roundedRect(chartX, chartY, chartW, chartH + 50, 8, 8, 'F');

      // Chart title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(26, 54, 93);
      doc.text('Resolution Time Distribution', chartX + chartW / 2, chartY + 16, { align: 'center' });

      // Y-axis gridlines
      const gridCount = 4;
      doc.setDrawColor(210, 220, 240);
      doc.setLineWidth(0.5);
      for (let g = 0; g <= gridCount; g++) {
        const gy = chartY + 28 + chartH - (g / gridCount) * chartH;
        doc.line(chartX + 30, gy, chartX + chartW - 10, gy);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(140, 150, 170);
        doc.text(String(Math.round((g / gridCount) * maxCount)), chartX + 26, gy + 2, { align: 'right' });
      }

      // Bars
      buckets.forEach((b, i) => {
        const bx = chartX + 30 + i * barW + barW * 0.1;
        const bw = barW * 0.8;
        const bh = b.count > 0 ? (b.count / maxCount) * chartH : 0;
        const by = chartY + 28 + chartH - bh;

        // Bar shadow
        doc.setFillColor(0, 0, 0, 0.08);
        doc.roundedRect(bx + 2, by + 2, bw, bh || 2, 3, 3, 'F');

        // Bar
        doc.setFillColor(...COLORS[i]);
        doc.roundedRect(bx, by, bw, bh || 2, 3, 3, 'F');

        // Count label on top
        if (b.count > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...COLORS[i]);
          doc.text(String(b.count), bx + bw / 2, by - 4, { align: 'center' });
        }

        // X label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(60, 70, 90);
        doc.text(b.label, bx + bw / 2, chartY + 28 + chartH + 12, { align: 'center' });
      });

      // ── Horizontal bar chart: top 10 longest items ──
      const top10 = [...resolutionStats.items].sort((a, b) => b.days - a.days).slice(0, 10);
      if (top10.length > 0) {
        const detailY = chartY + chartH + 75;
        const detailH = top10.length * 18 + 30;

        doc.setFillColor(245, 248, 255);
        doc.roundedRect(chartX, detailY, chartW, detailH, 8, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(26, 54, 93);
        doc.text('Longest Resolution Times (Top 10)', chartX + chartW / 2, detailY + 16, { align: 'center' });

        const maxDays = top10[0].days;
        const barAreaX = chartX + 180;
        const barAreaW = chartW - 200;

        top10.forEach((item, i) => {
          const iy = detailY + 28 + i * 18;
          const bw = maxDays > 0 ? (item.days / maxDays) * barAreaW : 0;

          // Label
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(40, 55, 80);
          const labelText = item.label.length > 28 ? item.label.slice(0, 26) + '…' : item.label;
          doc.text(labelText, chartX + 10, iy + 9);

          // Bar bg
          doc.setFillColor(220, 228, 245);
          doc.roundedRect(barAreaX, iy + 2, barAreaW, 10, 2, 2, 'F');

          // Bar fill — color by days
          const col = item.days <= 7 ? [16, 130, 80] : item.days <= 14 ? [234, 88, 12] : [180, 30, 30];
          doc.setFillColor(...col);
          doc.roundedRect(barAreaX, iy + 2, bw, 10, 2, 2, 'F');

          // Day label
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(...col);
          doc.text(`${item.days}d`, barAreaX + bw + 4, iy + 10);
        });
      }

      drawFooter(doc, pageW, pageH, 1);
      doc.addPage();
    }

    // ── PAGE 2+: Data Table ──
    drawHeader(doc, pageW, logoDataUrl, logoW, logoH, `${title} Report — Data`);
    const dateRange2 = (dateFrom || dateTo)
      ? `${dateFrom ? format(parseISO(dateFrom), 'MMM d, yyyy') : 'Beginning'} – ${dateTo ? format(parseISO(dateTo), 'MMM d, yyyy') : 'Today'}`
      : 'All dates';
    drawSubtitle(doc, pageW, `Generated: ${format(new Date(), 'MMMM d, yyyy')}   |   Date range: ${dateRange2}   |   Records: ${filtered.length}`);

    const cols = filterConfig;
    const tableStartX = 24;
    const tableW = pageW - 48;
    const colPad = 6;
    const fontSize = 6.5;
    const headerFontSize = 7;

    // ── Compute column widths based on content ──
    doc.setFontSize(fontSize);
    const colWidths = cols.map(col => {
      // measure header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(headerFontSize);
      let maxW = doc.getTextWidth(col.label.toUpperCase()) + colPad * 2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      filtered.slice(0, 50).forEach(item => {
        const raw = item[col.key];
        let cellText = '';
        if (raw == null || raw === '') cellText = '—';
        else if (col.type === 'date') {
          try { cellText = format(parseISO(String(raw)), 'MMM d, yyyy'); } catch { cellText = String(raw); }
        } else if (typeof raw === 'number') cellText = raw.toLocaleString();
        else cellText = String(raw);
        const w = doc.getTextWidth(cellText) + colPad * 2;
        if (w > maxW) maxW = w;
      });
      return Math.min(Math.max(maxW, 40), 160); // min 40, max 160
    });

    // Scale colWidths to fit tableW
    const totalRaw = colWidths.reduce((a, b) => a + b, 0);
    const scaledWidths = colWidths.map(w => (w / totalRaw) * tableW);

    const minRowH = 18;
    const rowLineH = 9; // line height in pt for wrapped text
    const cellPadX = colPad;
    const cellPadY = 4;
    let y = 95;
    let page = analyticsPage ? 2 : 1;

    // Helper: get wrapped lines for a cell value given its column width
    const getCellLines = (raw, col, colW) => {
      let cellText = '';
      if (raw == null || raw === '') cellText = '—';
      else if (col.type === 'date') {
        try { cellText = format(parseISO(String(raw)), 'MMM d, yyyy'); } catch { cellText = String(raw); }
      } else if (typeof raw === 'number') cellText = raw.toLocaleString();
      else cellText = String(raw);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      return doc.splitTextToSize(cellText, colW - cellPadX * 2);
    };

    const drawTableHeader = (yy) => {
      doc.setFillColor(26, 54, 93);
      doc.rect(tableStartX, yy, tableW, minRowH + 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(headerFontSize);
      doc.setTextColor(255, 255, 255);
      let xOff = tableStartX;
      cols.forEach((col, i) => {
        doc.text(col.label.toUpperCase(), xOff + cellPadX, yy + 13, { maxWidth: scaledWidths[i] - cellPadX });
        xOff += scaledWidths[i];
      });
    };

    drawTableHeader(y);
    y += minRowH + 2;

    filtered.forEach((item, rowIdx) => {
      // Pre-compute all wrapped lines to determine row height
      const allLines = cols.map((col, i) => getCellLines(item[col.key], col, scaledWidths[i]));
      const maxLines = Math.max(...allLines.map(l => l.length));
      const rowH = Math.max(minRowH, maxLines * rowLineH + cellPadY * 2);

      if (y + rowH > pageH - 36) {
        drawFooter(doc, pageW, pageH, page);
        doc.addPage();
        page++;
        y = 20;
        drawTableHeader(y);
        y += minRowH + 2;
      }

      // Row bg
      if (rowIdx % 2 === 0) doc.setFillColor(240, 245, 255);
      else doc.setFillColor(255, 255, 255);
      doc.rect(tableStartX, y, tableW, rowH, 'F');

      // Left accent
      if (rowIdx % 2 === 0) {
        doc.setFillColor(234, 88, 12);
        doc.rect(tableStartX, y, 3, rowH, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(30, 41, 59);

      let xOff = tableStartX;
      cols.forEach((col, i) => {
        const lines = allLines[i];
        const xText = xOff + cellPadX + (rowIdx % 2 === 0 && i === 0 ? 3 : 0);
        lines.forEach((line, li) => {
          doc.text(line, xText, y + cellPadY + rowLineH * (li + 0.8));
        });
        xOff += scaledWidths[i];
      });

      // Bottom border
      doc.setDrawColor(210, 220, 240);
      doc.setLineWidth(0.3);
      doc.line(tableStartX, y + rowH, tableStartX + tableW, y + rowH);

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

// ── PDF helpers ──────────────────────────────────────────────────────────────

function drawHeader(doc, pageW, logoDataUrl, logoW, logoH, titleText) {
  doc.setFillColor(26, 54, 93);
  doc.rect(0, 0, pageW, 72, 'F');
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 68, pageW, 5, 'F');

  if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', 22, 17, logoW, logoH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(titleText, pageW / 2, 32, { align: 'center' });
}

function drawSubtitle(doc, pageW, text) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 205, 230);
  doc.text(text, pageW / 2, 52, { align: 'center' });
}

function drawFooter(doc, pageW, pageH, page) {
  doc.setFillColor(26, 54, 93);
  doc.rect(0, pageH - 26, pageW, 26, 'F');
  doc.setFillColor(234, 88, 12);
  doc.rect(0, pageH - 28, pageW, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 205, 230);
  doc.text('AJC International · FSQA Hub · Confidential', 24, pageH - 9);
  doc.text(`Page ${page}`, pageW - 24, pageH - 9, { align: 'right' });
}

function formatCell(value, type) {
  if (value == null || value === '') return <span className="text-muted-foreground">—</span>;
  if (type === 'date' && value) {
    try { return format(parseISO(value), 'MMM d, yyyy'); } catch { return value; }
  }
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}