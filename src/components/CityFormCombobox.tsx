import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, MapPin, Search, Navigation, ArrowLeft } from 'lucide-react';
import {
  DEPARTMENTS,
  Department,
  findCityById,
  findDepartmentByCityId,
  detectCityFromCoords,
  ALL_CITIES,
} from '../data/colombiaCities';
import { showAlert } from './ConfirmDialog';

interface CityFormComboboxProps {
  value: string;
  onChange: (cityId: string) => void;
  className?: string;
}

/**
 * City selector for forms (CreateNeedModal, CreateOfferModal).
 * Two-level navigation: departments → cities.
 * Also supports text search and "Mi ubicación" via GPS.
 */
export const CityFormCombobox: React.FC<CityFormComboboxProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeDepartment, setActiveDepartment] = useState<Department | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCity = findCityById(value);
  const selectedDept = findDepartmentByCityId(value);
  const displayLabel = selectedCity
    ? `${selectedCity.name}, ${selectedDept?.name || ''}`
    : 'Seleccionar ciudad';

  // Search results: flat list of matching cities across all departments
  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return null;
    const searchLower = search.toLowerCase();
    const matches = ALL_CITIES.filter(
      (city) =>
        city.name.toLowerCase().includes(searchLower) ||
        DEPARTMENTS.find((d) => d.id === city.departmentId)?.name.toLowerCase().includes(searchLower)
    );
    // Limit to 30 results to keep it fast
    return matches.slice(0, 30);
  }, [search]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setActiveDepartment(null);
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
    setActiveDepartment(null);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      showAlert('Tu navegador no soporta geolocalización.', { title: 'Geolocalización no disponible', variant: 'info' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const detectedCity = detectCityFromCoords(latitude, longitude);
        if (detectedCity) {
          onChange(detectedCity.id);
        }
        setIsOpen(false);
        setSearch('');
        setActiveDepartment(null);
      },
      () => {
        showAlert('No se pudo obtener tu ubicación. Selecciona la ciudad manualmente.', { title: 'Ubicación no disponible', variant: 'info' });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // If a city is already selected, open to its department
      if (selectedDept) {
        setActiveDepartment(selectedDept);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-2 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="flex items-center gap-2 truncate">
          <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.length >= 2) {
                    setActiveDepartment(null); // switch to search mode
                  }
                }}
                placeholder="Buscar ciudad..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto">
            {/* Mi ubicación - always visible */}
            <button
              type="button"
              onClick={handleMyLocation}
              className="w-full text-left px-3 py-2.5 text-sm font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-between border-b border-slate-100 text-emerald-700"
            >
              <span className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mi ubicación</span>
              </span>
              <span className="text-[10px] text-emerald-500">GPS</span>
            </button>

            {/* Search results mode */}
            {searchResults !== null ? (
              searchResults.length > 0 ? (
                searchResults.map((city) => {
                  const dept = DEPARTMENTS.find((d) => d.id === city.departmentId);
                  return (
                    <button
                      key={`${city.departmentId}-${city.id}`}
                      type="button"
                      onClick={() => handleSelect(city.id)}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        value === city.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{city.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{dept?.name}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-sm text-slate-400 text-center">
                  No se encontró "{search}"
                </div>
              )
            ) : activeDepartment ? (
              /* Cities in selected department */
              <>
                <button
                  type="button"
                  onClick={() => setActiveDepartment(null)}
                  className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 text-indigo-700 border-b border-slate-100 bg-indigo-50/50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{activeDepartment.name}</span>
                </button>
                {activeDepartment.cities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelect(city.id)}
                    className={`w-full text-left px-3 pl-6 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                      value === city.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${value === city.id ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                    <span>{city.name}</span>
                  </button>
                ))}
              </>
            ) : (
              /* Department list */
              DEPARTMENTS.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setActiveDepartment(dept)}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    selectedDept?.id === dept.id ? 'bg-indigo-50/50 text-indigo-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{dept.name}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
