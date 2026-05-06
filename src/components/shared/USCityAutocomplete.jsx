import React, { useState, useRef, useEffect, useMemo } from 'react';
import { State, City } from 'country-state-city';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

// Build a flat list of "City, STATE" for all US cities once
const US_CITIES = (() => {
  const states = State.getStatesOfCountry('US');
  const list = [];
  for (const state of states) {
    const cities = City.getCitiesOfState('US', state.isoCode);
    for (const city of cities) {
      list.push(`${city.name}, ${state.isoCode}`);
    }
  }
  return list;
})();

export default function USCityAutocomplete({ value, onChange, placeholder = 'City, State...', className = '' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef(null);

  // Sync external value changes
  useEffect(() => { setQuery(value || ''); }, [value]);

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return US_CITIES.filter(c => c.toLowerCase().includes(q)).slice(0, 12);
  }, [query]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (city) => {
    setQuery(city);
    onChange(city);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Input
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((city) => (
            <li
              key={city}
              onMouseDown={() => handleSelect(city)}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}