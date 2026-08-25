import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, Search, ChevronDown } from 'lucide-react';
import { CityFormCombobox } from '../../../../components/CityFormCombobox';
import { COUNTRIES } from '../../../../data/countries';

interface Step2LocationProps {
  country: string;
  cityId: string;
  departmentId: string;
  onChangeCountry: (country: string) => void;
  onChangeCityId: (cityId: string, departmentId?: string) => void;
}

/** Country searchable combobox */
const CountryCombobox: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.name === value);
  const displayLabel = selectedCountry ? selectedCountry.name : value || 'Seleccionar país';

  const filtered = useMemo(() => {
    if (!search) return COUNTRIES;
    const s = search.toLowerCase();
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(s));
  }, [search]);

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-xl px-3.5 py-2.5 hover:bg-slate-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-semibold truncate">{displayLabel}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar país..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange(c.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                    value === c.name
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{c.name}</span>
                  </span>
                  {value === c.name && (
                    <span className="text-blue-600 text-[10px] font-bold">&#10003;</span>
                  )}
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

export const Step2Location: React.FC<Step2LocationProps> = ({
  country,
  cityId,
  departmentId,
  onChangeCountry,
  onChangeCityId,
}) => {
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ¿Dónde estás?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Confirma tu ubicación para conectar con las solicitudes y apoyos más cercanos en tu territorio.
        </p>
      </div>

      {/* Formulario de Ubicación */}
      <div className="space-y-4">
        {/* País */}
        <div>
          <label className="form-label">
            País <span className="text-blue-600">*</span>
          </label>
          <CountryCombobox value={country} onChange={onChangeCountry} />
        </div>

        {/* Departamento / Municipio */}
        <div>
          <label className="form-label">
            Departamento / Municipio <span className="text-blue-600">*</span>
          </label>
          {country === 'Colombia' ? (
            <CityFormCombobox
              value={cityId}
              departmentId={departmentId}
              onChange={onChangeCityId}
            />
          ) : (
            <div className="w-full flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-400 text-sm rounded-lg px-3 py-2.5 cursor-not-allowed">
              <Globe className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="text-xs">Solo disponible para Colombia</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
