import React, { useState } from 'react';
import { Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { FilterState, HelpCategory, NeedStatus, PlaceType, Priority, VerificationStatus, ViewMode } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS, PRIORITY_CONFIG, getCategoryLabel, getPlaceTypeLabel } from '../utils/formatters';
import { CityCombobox } from './CityCombobox';
import { CustomSelect } from './CustomSelect';
import { useTranslation } from '../i18n/LanguageContext';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  onClearFilters: () => void;
  onRequestLocation: (lat: number, lng: number) => void;
  isLoadingLocation: boolean;
  totalResults: number;
  selectedCityName?: string;
  needsCount?: number;
  offersCount?: number;
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  needCounts?: Record<string, number>;
  mobileView?: 'LIST' | 'MAP';
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
  selectedCityId,
  onCityChange,
  needCounts,
  mobileView = 'LIST',
}) => {
  const { language, t } = useTranslation();
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];
  const prioritiesList: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const placeTypesList = Object.keys(PLACE_TYPE_LABELS) as PlaceType[];

  const viewModeOptions: { value: ViewMode; label: string; count?: number }[] = [
    { value: 'ALL', label: t('viewAll'), count: needsCount + offersCount },
    { value: 'NEEDS', label: t('viewNeeds'), count: needsCount },
    { value: 'OFFERS', label: t('viewOffers'), count: offersCount },
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
    filters.verificationStatus !== 'ALL';

  const renderViewModeControl = () => (
    <div className="flex items-center justify-between gap-1 bg-slate-100 rounded-xl p-1 shrink-0 h-[38px] w-full md:w-auto" role="group">
      {viewModeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange({ viewMode: option.value })}
          className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            currentViewMode === option.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
          }`}
        >
          <span>{option.label}</span>
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
  );

  const renderCityCombobox = (extraClass = "w-full md:w-48 shrink-0") => (
    <CityCombobox
      value={selectedCityId}
      onChange={onCityChange}
      showAllOption
      needCounts={needCounts}
      onRequestLocation={(lat, lng) => onRequestLocation(lat, lng)}
      isLoadingLocation={isLoadingLocation}
      className={extraClass}
    />
  );

  const renderSearchInput = () => (
    <div className="relative flex-1 w-full">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={filters.search}
        onChange={(e) => onFilterChange({ search: e.target.value })}
        placeholder={t('searchPlaceholder')}
        className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all placeholder:text-slate-400 h-[38px]"
        id="filter-search-input"
      />
      {filters.search && (
        <button
          onClick={() => onFilterChange({ search: '' })}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const renderFiltersButton = () => (
    <button
      onClick={() => setShowMoreFilters(!showMoreFilters)}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all h-[38px] shrink-0 ${
        showMoreFilters || hasActiveFilters
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
      }`}
    >
      <Filter className="w-3.5 h-3.5" />
      <span>{t('filtersButton')}</span>
      {hasActiveFilters && (
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      )}
    </button>
  );

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 space-y-2.5">
        
        {/* MOBILE NAVIGATION LAYOUT (< md) */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {/* Row 1: Search Input */}
          <div className="w-full">
            {renderSearchInput()}
          </div>

          {/* Row 2: Location Filter + (Sort if LIST) + Filtros button */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 min-w-0">
              {renderCityCombobox("w-full shrink-0")}
            </div>

            {mobileView === 'LIST' && (
              <CustomSelect
                value={filters.sortBy}
                onChange={(val) => onFilterChange({ sortBy: val as any })}
                options={[
                  { value: 'PRIORITY', label: t('sortUrgency') },
                  { value: 'RECENT', label: t('sortRecent') },
                  { value: 'DISTANCE', label: t('sortDistance') },
                ]}
                icon={<ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />}
                className="w-auto shrink-0"
              />
            )}

            {renderFiltersButton()}
          </div>

          {/* Row 3: Segmented Control Pills (Todo, Necesidades, Ofertas) */}
          <div className="w-full">
            {renderViewModeControl()}
          </div>
        </div>

        {/* DESKTOP NAVIGATION LAYOUT (>= md) */}
        <div className="hidden md:flex flex-row items-center justify-between gap-3">
          <div className="flex flex-row items-center gap-2 flex-1">
            {renderViewModeControl()}
            {renderCityCombobox()}
            {renderSearchInput()}
          </div>

          <div className="flex items-center gap-2">
            <CustomSelect
              value={filters.sortBy}
              onChange={(val) => onFilterChange({ sortBy: val as any })}
              options={[
                { value: 'PRIORITY', label: t('sortUrgency') },
                { value: 'RECENT', label: t('sortRecent') },
                { value: 'DISTANCE', label: t('sortDistance') },
              ]}
              icon={<ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />}
              className="w-auto min-w-[140px] shrink-0"
            />
            {renderFiltersButton()}
          </div>
        </div>

        {/* Expanded Filter Panel */}
        {showMoreFilters && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 text-xs animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Priority */}
              {currentViewMode !== 'OFFERS' && (
                <div>
                  <label className="form-label">
                    {t('filterPriority')}
                  </label>
                  <CustomSelect
                    value={filters.priority}
                    onChange={(val) => onFilterChange({ priority: val as any })}
                    options={[
                      { value: 'ALL', label: t('priorityAll') },
                      ...prioritiesList.map((p) => ({
                        value: p,
                        label: `${PRIORITY_CONFIG[p].dot} ${language === 'en' ? (p === 'CRITICAL' ? t('priorityCritical') : p === 'HIGH' ? t('priorityHigh') : p === 'MEDIUM' ? t('priorityMedium') : t('priorityLow')) : PRIORITY_CONFIG[p].label}`,
                      })),
                    ]}
                  />
                </div>
              )}

              {/* Place Type */}
              <div>
                <label className="form-label">{t('filterPlaceType')}</label>
                <CustomSelect
                  value={filters.placeType}
                  onChange={(val) => onFilterChange({ placeType: val as any })}
                  options={[
                    { value: 'ALL', label: t('viewAll') },
                    ...placeTypesList.map((pt) => ({
                      value: pt,
                      label: getPlaceTypeLabel(pt, language),
                    })),
                  ]}
                />
              </div>

              {/* Verification Status */}
              <div>
                <label className="form-label">{t('filterVerification')}</label>
                <CustomSelect
                  value={filters.verificationStatus}
                  onChange={(val) => onFilterChange({ verificationStatus: val as any })}
                  options={[
                    { value: 'ALL', label: t('viewAll') },
                    { value: 'VERIFIED', label: `✓ ${t('cardVerifiedBy')}` },
                    { value: 'PENDING_VERIFICATION', label: `◷ ${t('cardPendingVerification')}` },
                    { value: 'REPORTED', label: `⚠️ ${t('cardReported')}` },
                  ]}
                />
              </div>
            </div>

            {/* Help Categories section inside Expanded Filter Panel */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  {t('filterCategory')}
                  {filters.categories.length > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {filters.categories.length}
                    </span>
                  )}
                </span>
                {filters.categories.length > 0 && (
                  <button
                    onClick={() => onFilterChange({ categories: [] })}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    {t('clearFilters')}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {categoriesList.map((cat) => {
                  const isSelected = filters.categories.includes(cat);
                  const item = getCategoryLabel(cat, language);
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-medium">
                <strong className="text-slate-900">{totalResults}</strong> {t('resultsFound')}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-red-700 hover:text-red-900 font-semibold hover:underline flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('clearFilters')}</span>
                </button>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};
