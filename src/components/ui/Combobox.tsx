import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, CircleAlert } from 'lucide-react';

export interface ComboboxProps {
  id: string;
  etiqueta: React.ReactNode;
  valor: string;
  opciones: string[];
  onChange: (valor: string) => void;
  onBlur?: (valor: string) => void;
  opcional?: boolean;
  ayuda?: string;
  error?: string | null;
  /** Icono Lucide (20) a la izquierda del control. Decorativo. */
  icono?: React.ReactNode;
  placeholder?: string;
  forma?: 'base' | 'pildora';
  etiquetaOculta?: boolean;
  className?: string;
}

const CONTROL_BASE =
  'font-rd w-full border border-rd-line bg-rd-surface text-rd-ink transition-colors placeholder:text-rd-ink-meta hover:enabled:not-focus:border-rd-ink-3 focus:border-rd-navy focus:outline-none focus:ring-3 focus:ring-rd-navy-soft disabled:cursor-not-allowed disabled:border-rd-line disabled:bg-rd-sunken disabled:text-rd-ink-meta aria-invalid:border-rd-coral aria-invalid:focus:ring-rd-coral-soft';

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Combobox accesible con autocompletado y búsqueda filtrable,
 * adaptado a los tokens y formas ('base' y 'pildora') del sistema de diseño.
 */
export const Combobox: React.FC<ComboboxProps> = ({
  id,
  etiqueta,
  valor,
  opciones,
  onChange,
  onBlur,
  opcional = false,
  ayuda,
  error,
  icono,
  placeholder,
  forma = 'base',
  etiquetaOculta = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [busqueda, setBusqueda] = useState(valor || '');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Sincronizar búsqueda si el valor externo cambia
  useEffect(() => {
    setBusqueda(valor || '');
  }, [valor]);

  // Filtrar opciones
  const opcionesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return opciones;
    const q = normalizar(busqueda);
    return opciones.filter((o) => normalizar(o).includes(q));
  }, [opciones, busqueda]);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Si el texto escrito no coincide con ninguna opción, restaurar el valor seleccionado
        if (busqueda !== valor) {
          const coincideExacta = opciones.find((o) => normalizar(o) === normalizar(busqueda));
          if (coincideExacta) {
            onChange(coincideExacta);
            setBusqueda(coincideExacta);
          } else {
            setBusqueda(valor || '');
          }
        }
        onBlur?.(valor);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [busqueda, valor, opciones, onChange, onBlur]);

  // Asegurar que el elemento resaltado sea visible en el scroll
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const item = listboxRef.current.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const seleccionar = (opcion: string) => {
    onChange(opcion);
    setBusqueda(opcion);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < opcionesFiltradas.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : opcionesFiltradas.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < opcionesFiltradas.length) {
          seleccionar(opcionesFiltradas[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const describedBy = [idAyuda, idError].filter(Boolean).join(' ') || undefined;
  const pildora = forma === 'pildora';
  const textoEtiqueta = typeof etiqueta === 'string' ? etiqueta : '';

  const etiquetaNodo = (
    <>
      {etiqueta}
      {opcional && <span className="font-normal text-rd-ink-meta"> (opcional)</span>}
    </>
  );

  const ayudaNodo = ayuda ? (
    <p id={idAyuda} className="mt-1.5 block text-left text-rd-12 text-rd-ink-meta">
      {ayuda}
    </p>
  ) : null;

  const errorNodo = error ? (
    <p id={idError} className="mt-1.5 flex items-center gap-1.25 text-left text-rd-12-5 text-rd-coral">
      <CircleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span>{error}</span>
    </p>
  ) : null;

  const conIcono = Boolean(icono);
  const claseControl = [
    CONTROL_BASE,
    pildora ? 'h-13 rounded-full text-rd-15' : 'h-rd-h-md rounded-rd-md text-rd-14',
    pildora ? (conIcono ? 'pr-11 pl-12' : 'pr-11 pl-4') : conIcono ? 'pr-9 pl-10' : 'pr-9 px-3',
  ]
    .filter(Boolean)
    .join(' ');

  const placeholderFinal = placeholder ?? (etiquetaOculta ? `${textoEtiqueta}${opcional ? ' (opcional)' : ''}` : undefined);

  return (
    <div className={`text-left ${className}`} ref={containerRef}>
      <label htmlFor={id} className={etiquetaOculta ? 'sr-only' : 'font-rd mb-1 block text-rd-12 font-medium text-rd-ink-2'}>
        {etiquetaNodo}
      </label>

      <div className="relative">
        {conIcono && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-rd-ink-3 ${pildora ? 'left-4.5' : 'left-3'}`}
          >
            {icono}
          </span>
        )}

        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          value={busqueda}
          placeholder={placeholderFinal}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={claseControl}
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label={isOpen ? 'Cerrar opciones' : 'Mostrar opciones'}
          onClick={() => {
            setIsOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-rd-ink-3 hover:text-rd-ink transition-transform duration-200 cursor-pointer ${
            pildora ? 'right-4 h-6 w-6' : 'right-2.5 h-5 w-5'
          }`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <ul
            id={`${id}-listbox`}
            ref={listboxRef}
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-rd-line bg-rd-surface py-1 shadow-lg z-50 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {opcionesFiltradas.length > 0 ? (
              opcionesFiltradas.map((opcion, index) => {
                const esSeleccionado = opcion === valor;
                const esResaltado = index === highlightedIndex;
                return (
                  <li
                    key={opcion}
                    id={`${id}-option-${index}`}
                    role="option"
                    aria-selected={esSeleccionado}
                    onClick={() => seleccionar(opcion)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-center justify-between px-4 py-2.5 text-rd-14 cursor-pointer transition-colors ${
                      esResaltado ? 'bg-rd-sunken text-rd-ink font-medium' : 'text-rd-ink'
                    } ${esSeleccionado ? 'text-rd-navy font-semibold' : ''}`}
                  >
                    <span>{opcion}</span>
                    {esSeleccionado && <Check className="h-4 w-4 text-rd-navy shrink-0" />}
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-rd-13 text-rd-ink-meta text-center">
                No se encontraron opciones
              </li>
            )}
          </ul>
        )}
      </div>

      {ayudaNodo}
      {errorNodo}
    </div>
  );
};
