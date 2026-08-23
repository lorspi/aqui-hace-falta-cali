import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, MapPin, FileText } from 'lucide-react';
import { Need, Offer } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  needs: Need[];
  offers: Offer[];
  placeholder?: string;
}

interface Suggestion {
  id: string;
  text: string;
  type: 'title' | 'neighborhood';
  source: 'need' | 'offer';
}

/**
 * Highlights the matched portion of a suggestion text by wrapping it in a bold span.
 */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) return <span>{text}</span>;

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + lowerQuery.length);
  const after = text.slice(matchIndex + lowerQuery.length);

  return (
    <span>
      {before}
      <span className="font-bold text-slate-900">{match}</span>
      {after}
    </span>
  );
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  value,
  onChange,
  needs,
  offers,
  placeholder,
}) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate unique suggestions from needs and offers data
  const suggestions = useMemo<Suggestion[]>(() => {
    const query = value.toLowerCase().trim();
    if (query.length < 2) return [];

    const seen = new Set<string>();
    const results: Suggestion[] = [];
    const MAX_SUGGESTIONS = 8;

    // Helper to add a suggestion if not duplicate
    const addSuggestion = (text: string, type: 'title' | 'neighborhood', source: 'need' | 'offer', id: string) => {
      if (results.length >= MAX_SUGGESTIONS) return;
      const key = `${type}:${text.toLowerCase()}`;
      if (seen.has(key)) return;
      if (!text.toLowerCase().includes(query)) return;
      seen.add(key);
      results.push({ id: `${source}-${type}-${id}`, text, type, source });
    };

    // Process needs
    for (const need of needs) {
      if (results.length >= MAX_SUGGESTIONS) break;
      addSuggestion(need.title, 'title', 'need', need.id);
      if (need.neighborhood) {
        addSuggestion(need.neighborhood, 'neighborhood', 'need', need.id);
      }
    }

    // Process offers
    for (const offer of offers) {
      if (results.length >= MAX_SUGGESTIONS) break;
      addSuggestion(offer.title, 'title', 'offer', offer.id);
      if (offer.neighborhood) {
        addSuggestion(offer.neighborhood, 'neighborhood', 'offer', offer.id);
      }
    }

    return results;
  }, [value, needs, offers]);

  const showDropdown = isFocused && suggestions.length > 0;

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.text);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 w-full">
      {/* Search icon */}
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? t('searchPlaceholder')}
        className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all placeholder:text-slate-400 h-[42px] md:h-[38px]"
        id="filter-search-input"
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls="search-suggestions-list"
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label="Limpiar búsqueda"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div
          id="search-suggestions-list"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                role="option"
                onClick={() => handleSelect(suggestion)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                {/* Icon based on type */}
                {suggestion.type === 'neighborhood' ? (
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}

                {/* Text with highlighted match */}
                <span className="truncate text-slate-600">
                  <HighlightedText text={suggestion.text} query={value} />
                </span>

                {/* Source badge */}
                <span className={`ml-auto text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-md ${
                  suggestion.source === 'offer'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {suggestion.source === 'offer' ? 'Oferta' : 'Necesidad'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
