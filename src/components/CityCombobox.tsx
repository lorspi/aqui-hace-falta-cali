import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { VALLE_CITIES, ALL_VALLE_ID, ValleCity } from '../data/valleCities';

interface CityComboboxProps {
  value: string;
  onChange: (cityId: string) => void;
  showAllOption?: boolean;
  className?: string;
}

export const CityCombobox: React.FC<CityComboboxProps> = ({
  value,
  onChange,
  showAllOption = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCity = VALLE_CITIES.find((c) => c.id === value);
  const displayLabel = value === ALL_VALLE_ID
    ? 'Todo el Valle del Cauca'
    : selectedCity?.name || 'Seleccionar ciudad';

  const filtered = VALLE_CITIES.filter((city) =>
    city.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (cityId: string) => {
    onChange(cityId);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ciudad o municipio..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {showAllOption && (
              <button
                type="button"
                onClick={() => handleSelect(ALL_VALLE_ID)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                  value === ALL_VALLE_ID ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                }`}
              >
                <MapPin className="w-3 h-3 text-indigo-500" />
                <span>Todo el Valle del Cauca</span>
              </button>
            )}

            {filtered.length > 0 ? (
              filtered.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelect(city.id)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                    value === city.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                  <span>{city.name}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">
                No se encontró "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
