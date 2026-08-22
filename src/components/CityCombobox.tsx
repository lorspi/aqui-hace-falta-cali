import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, MapPin, Search, Navigation } from 'lucide-react';
import {
  DEPARTMENTS,
  ALL_COLOMBIA_ID,
  findCityById,
  findDepartmentByCityId,
  detectCityFromCoords,
} from '../data/colombiaCities';
import { showAlert } from './ConfirmDialog';
import { useTranslation } from '../i18n/LanguageContext';

interface CityComboboxProps {
  value: string;
  onChange: (cityId: string) => void;
  showAllOption?: boolean;
  className?: string;
  needCounts?: Record<string, number>;
  onRequestLocation?: (lat: number, lng: number) => void;
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
  const { language, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCity = findCityById(value);
  const selectedDept = findDepartmentByCityId(value);
  const selectedCount = needCounts?.[value] ?? 0;
  const displayLabel = value === ALL_COLOMBIA_ID
    ? t('allCities')
    : selectedCity
      ? `${selectedCity.name}${selectedDept ? `, ${selectedDept.name}` : ''}`
      : (language === 'en' ? 'Select city' : 'Seleccionar ciudad');

  const totalNeeds = needCounts
    ? Object.values(needCounts).reduce((sum, n) => sum + n, 0)
    : 0;

  const groupedCities = useMemo(() => {
    const searchLower = search.toLowerCase();
    const hasCountData = needCounts && Object.keys(needCounts).length > 0;
    const groups: { department: string; departmentId: string; cities: { id: string; name: string; count: number }[] }[] = [];

    for (const dept of DEPARTMENTS) {
      const citiesWithData = dept.cities
        .filter((city) => {
          if (hasCountData && !(needCounts![city.id] > 0)) return false;
          if (search && !city.name.toLowerCase().includes(searchLower) && !dept.name.toLowerCase().includes(searchLower)) return false;
          return true;
        })
        .map((city) => ({
          id: city.id,
          name: city.name,
          count: needCounts?.[city.id] || 0,
        }));

      if (citiesWithData.length > 0) {
        groups.push({
          department: dept.name,
          departmentId: dept.id,
          cities: citiesWithData,
        });
      }
    }

    return groups;
  }, [search, needCounts]);

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

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      showAlert(language === 'en' ? 'Your browser does not support geolocation.' : 'Tu navegador no soporta geolocalización.', { title: language === 'en' ? 'Geolocation unavailable' : 'Geolocalización no disponible', variant: 'info' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const detectedCity = detectCityFromCoords(latitude, longitude);
        if (detectedCity) {
          onChange(detectedCity.id);
        } else {
          onChange(ALL_COLOMBIA_ID);
        }
        onRequestLocation?.(latitude, longitude);
        setIsOpen(false);
        setSearch('');
      },
      () => {
        onChange(ALL_COLOMBIA_ID);
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
        className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-xs rounded-xl px-3 py-2 h-[38px] hover:bg-slate-100 transition-colors text-left"
      >
        <span className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">{displayLabel}</span>
          {needCounts && selectedCount > 0 && value !== ALL_COLOMBIA_ID && (
            <span className="text-[10px] font-bold text-slate-500">({selectedCount})</span>
          )}
          {needCounts && value === ALL_COLOMBIA_ID && totalNeeds > 0 && (
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
                placeholder={language === 'en' ? 'Search city or department...' : 'Buscar ciudad o departamento...'}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {/* Mi ubicación option */}
            <button
              type="button"
              onClick={handleMyLocation}
              className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-between border-b border-slate-100 text-emerald-700"
            >
              <span className="flex items-center gap-2">
                <Navigation className={`w-3 h-3 text-emerald-600 ${isLoadingLocation ? 'animate-pulse' : ''}`} />
                <span>{isLoadingLocation ? (language === 'en' ? 'Searching location...' : 'Buscando ubicación...') : t('useMyLocation')}</span>
              </span>
              <span className="text-[10px] text-emerald-500">GPS</span>
            </button>

            {/* All Colombia option */}
            {showAllOption && (
              <button
                type="button"
                onClick={() => handleSelect(ALL_COLOMBIA_ID)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                  value === ALL_COLOMBIA_ID ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  <span>{t('allCities')}</span>
                </span>
                {needCounts && totalNeeds > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">({totalNeeds})</span>
                )}
              </button>
            )}

            {/* Grouped by department */}
            {groupedCities.length > 0 ? (
              groupedCities.map((group) => (
                <div key={group.departmentId}>
                  <div className="px-3 py-1.5 bg-slate-50 border-y border-slate-100 sticky top-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      {group.department}
                    </span>
                  </div>
                  {group.cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelect(city.id)}
                      className={`w-full text-left px-3 pl-5 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        value === city.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${city.count > 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        <span>{city.name}</span>
                      </span>
                      {city.count > 0 && (
                        <span className="text-[10px] font-bold text-indigo-600">({city.count})</span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">
                {language === 'en' ? `Not found "${search}"` : `No se encontró "${search}"`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
