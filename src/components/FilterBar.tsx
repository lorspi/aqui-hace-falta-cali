import React, { useState } from 'react';
import { Search, Filter, MapPin, X, ArrowUpDown, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { FilterState, HelpCategory, NeedStatus, PlaceType, Priority, VerificationStatus, ViewMode } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS, PRIORITY_CONFIG } from '../utils/formatters';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  onClearFilters: () => void;
  onRequestLocation: () => void;
  isLoadingLocation: boolean;
  totalResults: number;
  selectedCityName?: string;
  needsCount?: number;
  offersCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  onRequestLocation,
  isLoadingLocation,
  totalResults,
  selectedCityName = 'la zona',
  needsCount = 0,
  offersCount = 0,
}) => {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];
  const prioritiesList: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const placeTypesList = Object.keys(PLACE_TYPE_LABELS) as PlaceType[];

  const viewModeOptions: { value: ViewMode; label: string; count?: number }[] = [
    { value: 'ALL', label: 'Todos', count: needsCount + offersCount },
    { value: 'NEEDS', label: 'Necesidades', count: needsCount },
    { value: 'OFFERS', label: 'Ofertas', count: offersCount },
  ];

  const currentViewMode = filters.viewMode ?? 'ALL';

  const handleCategoryToggle = (cat: HelpCategory) => {
    let next: HelpCategory[];
    if (filters.categories.includes(cat)) {
      next = filters.categories.filter((c) => c !== cat);
    } else {
      next = [...filters.categories, cat];
    }
    onFilterChange({ categories: next });
  };

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.categories.length > 0 ||
    filters.priority !== 'ALL' ||
    filters.placeType !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.verificationStatus !== 'ALL' ||
    filters.distanceKm !== null;

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-3">
      {/* Top search & quick controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* ViewMode + Search — left side */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
          {/* ViewMode Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 shrink-0" role="group" aria-label="Modo de vista">
            {viewModeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange({ viewMode: option.value })}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentViewMode === option.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
                aria-pressed={currentViewMode === option.value}
              >
                {option.label}
                {option.count != null && option.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                    currentViewMode === option.value
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Buscar por recurso (agua, palas, escombros, voluntarios)..."
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-100 border-none rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
              id="filter-search-input"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: '' })}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Distance Dropdown & Geolocation */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg p-1 text-xs">
            <button
              onClick={onRequestLocation}
              disabled={isLoadingLocation}
              className={`p-1.5 rounded flex items-center gap-1 font-medium ${
                filters.userLat ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-200 text-slate-700'
              }`}
              title="Obtener mi ubicación actual en Cali"
            >
              <MapPin className={`w-3.5 h-3.5 ${isLoadingLocation ? 'animate-bounce text-amber-600' : ''}`} />
              <span className="hidden sm:inline">
                {filters.userLat ? 'Ubicación activa' : 'Usar mi ubicación'}
              </span>
            </button>

            <select
              value={filters.distanceKm ?? 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  distanceKm: e.target.value === 'ALL' ? null : Number(e.target.value),
                })
              }
              className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none pr-1"
            >
              <option value="ALL">Toda {selectedCityName}</option>
              <option value="1">Hasta 1 km</option>
              <option value="2">Hasta 2 km</option>
              <option value="5">Hasta 5 km</option>
              <option value="10">Hasta 10 km</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
              className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="PRIORITY">Más urgente primero</option>
              <option value="RECENT">Más recientes</option>
              <option value="DISTANCE">Más cercanos a mí</option>
            </select>
          </div>

          {/* More Filters Toggle */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showMoreFilters || hasActiveFilters
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="space-y-1.5">
        <div className="w-full flex items-center justify-between">
          <span className="flex items-center gap-2">
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="text-slate-800 font-bold text-sm hover:text-indigo-700 transition-colors flex items-center gap-1.5"
            >
              ¿Cómo quieres ayudar?
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${showCategories ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {filters.categories.length > 0 && (
              <button
                onClick={() => onFilterChange({ categories: [] })}
                className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold normal-case inline-flex items-center gap-1 hover:bg-indigo-200 transition-colors"
              >
                {filters.categories.length} seleccionado{filters.categories.length > 1 ? 's' : ''}
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        </div>

        {/* Selected categories summary (when collapsed) */}
        {!showCategories && filters.categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {filters.categories.map((cat) => {
              const item = CATEGORY_LABELS[cat];
              return (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px]"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <button
                    onClick={() => handleCategoryToggle(cat)}
                    className="ml-0.5 text-indigo-400 hover:text-indigo-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Expanded category pills */}
        {showCategories && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {categoriesList.map((cat) => {
              const isSelected = filters.categories.includes(cat);
              const item = CATEGORY_LABELS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Expanded Filter Panel */}
      {showMoreFilters && (
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 text-xs animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Priority — hidden when ViewMode is OFFERS */}
            {currentViewMode !== 'OFFERS' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prioridad
                  {currentViewMode === 'ALL' && (
                    <span className="text-[10px] text-slate-500 font-normal ml-1">(solo necesidades)</span>
                  )}
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => onFilterChange({ priority: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                >
                  <option value="ALL">Todas las prioridades</option>
                  {prioritiesList.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_CONFIG[p].dot} {PRIORITY_CONFIG[p].label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Place Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de lugar</label>
              <select
                value={filters.placeType}
                onChange={(e) => onFilterChange({ placeType: e.target.value as any })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
              >
                <option value="ALL">Todos los lugares</option>
                {placeTypesList.map((pt) => (
                  <option key={pt} value={pt}>
                    {PLACE_TYPE_LABELS[pt]}
                  </option>
                ))}
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Verificación</label>
              <select
                value={filters.verificationStatus}
                onChange={(e) => onFilterChange({ verificationStatus: e.target.value as any })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
              >
                <option value="ALL">Todas las verificaciones</option>
                <option value="VERIFIED">✓ Solo información verificada</option>
                <option value="PENDING_VERIFICATION">◷ Pendientes de verificación</option>
                <option value="REPORTED">⚠️ Reportadas</option>
              </select>
            </div>

            {/* Need Status — hidden when ViewMode is OFFERS */}
            {currentViewMode !== 'OFFERS' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estado de necesidad</label>
                <select
                  value={filters.status}
                  onChange={(e) => onFilterChange({ status: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="NEED_HELP_NOW">Necesita ayuda ahora</option>
                  <option value="RECEIVING_HELP">Recibiendo ayuda</option>
                  <option value="PARTIALLY_COVERED">Parcialmente cubierta</option>
                  <option value="COVERED">Ayuda cubierta</option>
                  <option value="CLOSED">Cerrados / Archivados</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-slate-500 font-medium">
              Mostrando <strong className="text-slate-900">{totalResults}</strong> resultados
            </span>
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-red-700 hover:text-red-900 font-semibold hover:underline flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Restablecer todos los filtros</span>
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
