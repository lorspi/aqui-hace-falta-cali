import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, MapPin, Search, Navigation } from 'lucide-react';
import { VALLE_CITIES, ALL_VALLE_ID, ValleCity, detectCityFromCoords } from '../data/valleCities';
import { showAlert } from './ConfirmDialog';

interface CityComboboxProps {
  value: string;
  onChange: (cityId: string) => void;
  showAllOption?: boolean;
  className?: string;
  /** Map of cityId → number of needs. Used to show counts and sort. */
  needCounts?: Record<string, number>;
  /** Callback when user selects "Mi ubicación" — receives lat, lng of device */
  onRequestLocation?: (lat: number, lng: number) => void;
  /** Whether geolocation is currently loading */
  isLoadingLocation?: boolean;
}

export const CityCombobox: React.FC<CityComboboxProps> = ({
  value,
  onChange,
  showAllOption = false,
  className = '',
  needCounts,
  onRequestLocation,
  isLoadingLocation = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [locationError, setLocationError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCity = VALLE_CITIES.find((c) => c.id === value);
  const selectedCount = needCounts?.[value] ?? 0;
  const displayLabel = value === ALL_VALLE_ID
    ? 'Todo el Valle del Cauca'
    : selectedCity?.name || 'Seleccionar ciudad';

  // Filter by search, then sort: cities with needs first (alphabetical), then cities without (alphabetical)
  const sortedCities = useMemo(() => {
    const filtered = VALLE_CITIES.filter((city) =>
      city.name.toLowerCase().includes(search.toLowerCase())
    );

    if (!needCounts) return filtered;

    const withNeeds = filtered.filter((c) => (needCounts[c.id] || 0) > 0);
    const withoutNeeds = filtered.filter((c) => (needCounts[c.id] || 0) === 0);

    withNeeds.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    withoutNeeds.sort((a, b) => a.name.localeCompare(b.name, 'es'));

    return [...withNeeds, ...withoutNeeds];
  }, [search, needCounts]);

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

  const totalNeeds = needCounts ? Object.values(needCounts).reduce((sum, n) => sum + n, 0) : 0;

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      showAlert('Tu navegador no soporta geolocalización.', { title: 'Geolocalización no disponible', variant: 'info' });
      return;
    }
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Detect which city the user is in
        const detectedCity = detectCityFromCoords(latitude, longitude);
        if (detectedCity) {
          onChange(detectedCity.id);
        } else {
          // If not in any known city, select All Valle del Cauca
          onChange(ALL_VALLE_ID);
        }
        // Notify parent about location
        onRequestLocation?.(latitude, longitude);
        setIsOpen(false);
        setSearch('');
      },
      () => {
        setLocationError(true);
        // If denied, select All Valle del Cauca
        onChange(ALL_VALLE_ID);
        setIsOpen(false);
        setSearch('');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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
          {needCounts && selectedCount > 0 && value !== ALL_VALLE_ID && (
            <span className="text-[10px] font-bold text-slate-500">({selectedCount})</span>
          )}
          {needCounts && value === ALL_VALLE_ID && totalNeeds > 0 && (
            <span className="text-[10px] font-bold text-slate-500">({totalNeeds})</span>
          )}
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
            {/* Mi ubicación option */}
            <button
              type="button"
              onClick={handleMyLocation}
              className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-between border-b border-slate-100 text-emerald-700"
            >
              <span className="flex items-center gap-2">
                <Navigation className={`w-3 h-3 text-emerald-600 ${isLoadingLocation ? 'animate-pulse' : ''}`} />
                <span>{isLoadingLocation ? 'Buscando ubicación...' : 'Mi ubicación'}</span>
              </span>
              <span className="text-[10px] text-emerald-500">GPS</span>
            </button>

            {showAllOption && (
              <button
                type="button"
                onClick={() => handleSelect(ALL_VALLE_ID)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                  value === ALL_VALLE_ID ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  <span>Todo el Valle del Cauca</span>
                </span>
                {needCounts && totalNeeds > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">({totalNeeds})</span>
                )}
              </button>
            )}

            {sortedCities.length > 0 ? (
              sortedCities.map((city) => {
                const count = needCounts?.[city.id] || 0;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelect(city.id)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between ${
                      value === city.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${count > 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                      <span>{city.name}</span>
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] font-bold text-indigo-600">({count})</span>
                    )}
                  </button>
                );
              })
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
