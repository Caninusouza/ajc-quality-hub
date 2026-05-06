import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Number of pieces per species
const PIECE_COUNTS = { Chicken: 50, Pork: 30 };

export default function WeightGrid({ category, weights = [], onChange }) {
  const [expanded, setExpanded] = useState(true);
  const count = PIECE_COUNTS[category];
  if (!count) return null;

  const slots = Array.from({ length: count }, (_, i) => weights[i] ?? '');

  const handleChange = (idx, val) => {
    const updated = [...slots];
    updated[idx] = val === '' ? '' : val;
    onChange(updated);
  };

  const filled = slots.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
  const avg = filled.length > 0 ? (filled.reduce((s, v) => s + v, 0) / filled.length).toFixed(1) : null;
  const min = filled.length > 0 ? Math.min(...filled).toFixed(1) : null;
  const max = filled.length > 0 ? Math.max(...filled).toFixed(1) : null;
  const allFilled = filled.length === count;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Hide grid' : 'Show grid'} — {count} pieces total, {filled.length} entered
        </button>
        {filled.length > 0 && (
          <div className={`flex gap-4 text-sm font-medium rounded-lg px-4 py-2 border ${allFilled ? 'bg-green-50 border-green-200 text-green-800' : 'bg-muted/50 border-border text-foreground'}`}>
            <span>Avg: <strong>{avg} g</strong></span>
            <span className="text-muted-foreground">|</span>
            <span>Range: <strong>{min} g – {max} g</strong></span>
            <span className="text-muted-foreground">|</span>
            <span>{filled.length}/{count} pieces</span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {slots.map((val, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-muted-foreground font-mono">{i + 1}</span>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={val}
                onChange={e => handleChange(i, e.target.value)}
                className={`h-8 px-1 text-center text-sm font-mono ${val !== '' && parseFloat(val) > 0 ? 'border-primary/40 bg-primary/5' : ''}`}
                placeholder="—"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}