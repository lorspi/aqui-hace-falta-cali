import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  /** Icon element to show before the selected label */
  icon?: React.ReactNode;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Al abrir, decide si el panel cabe hacia abajo; si no, se despliega hacia arriba.
  // Mide contra el contenedor con scroll más cercano (p. ej. un modal), no solo el
  // viewport: dentro de un modal el espacio real puede ser mucho menor que la ventana.
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
      let el = node?.parentElement ?? null;
      while (el) {
        const { overflowY } = window.getComputedStyle(el);
        if ((overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && el.scrollHeight > el.clientHeight) {
          return el;
        }
        el = el.parentElement;
      }
      return null;
    };

    const decideDirection = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const scrollParent = getScrollParent(buttonRef.current);

      // Límites disponibles: el borde del contenedor con scroll o, si no hay, el viewport.
      const boundsTop = scrollParent ? scrollParent.getBoundingClientRect().top : 0;
      const boundsBottom = scrollParent ? scrollParent.getBoundingClientRect().bottom : window.innerHeight;

      const spaceBelow = boundsBottom - rect.bottom;
      const spaceAbove = rect.top - boundsTop;

      // Alto real del panel (coincide con max-h-60 = 240px) o menos si hay pocas opciones.
      const panelHeight = Math.min(240, options.length * 36 + 8);
      const margin = 8;

      // Sube si no cabe completo abajo pero sí (o mejor) arriba.
      setDropUp(spaceBelow < panelHeight + margin && spaceAbove > spaceBelow);
    };

    decideDirection();
    window.addEventListener('resize', decideDirection);
    window.addEventListener('scroll', decideDirection, true);
    return () => {
      window.removeEventListener('resize', decideDirection);
      window.removeEventListener('scroll', decideDirection, true);
    };
  }, [isOpen, options.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-300 text-slate-800 font-medium text-sm rounded-xl px-3 py-2 h-[38px] hover:bg-slate-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
      >
        <span className="flex items-center gap-1.5 truncate text-xs">
          {icon}
          <span className="font-semibold">{selectedOption?.label || placeholder}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto animate-in fade-in duration-150 ${
            dropUp
              ? 'bottom-full mb-1 slide-in-from-bottom-1'
              : 'top-full mt-1 slide-in-from-top-1'
          }`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-brand-blue/10 text-brand-blue font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <span className="text-brand-blue text-[10px] font-bold">&#10003;</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
