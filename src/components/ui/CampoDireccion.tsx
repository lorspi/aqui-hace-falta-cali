import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2, CircleAlert } from 'lucide-react';
import {
  fetchGooglePlacePredictions,
  fetchCoordinatesFromPlaceId,
  type PlaceSuggestion,
} from '../../utils/geocoding';

export interface CampoDireccionProps {
  id: string;
  etiqueta: React.ReactNode;
  valor: string;
  onChange: (valor: string) => void;
  onSeleccionarLugar?: (lugar: { direccion: string; lat: number; lng: number }) => void;
  onConfirmar?: (valor: string) => void;
  onBlur?: (valor: string) => void;
  biasCoords?: { lat: number; lng: number } | null;
  placeholder?: string;
  ayuda?: string;
  error?: string | null;
  deshabilitado?: boolean;
  className?: string;
}

const CONTROL_BASE =
  'font-rd w-full border border-rd-line bg-rd-surface text-rd-ink transition-colors placeholder:text-rd-ink-meta hover:enabled:not-focus:border-rd-ink-3 focus:border-rd-navy focus:outline-none focus:ring-3 focus:ring-rd-navy-soft disabled:cursor-not-allowed disabled:border-rd-line disabled:bg-rd-sunken disabled:text-rd-ink-meta aria-invalid:border-rd-coral aria-invalid:focus:ring-rd-coral-soft h-10 px-3 rounded-rd-md text-rd-14';

export const CampoDireccion: React.FC<CampoDireccionProps> = ({
  id,
  etiqueta,
  valor,
  onChange,
  onSeleccionarLugar,
  onConfirmar,
  onBlur,
  biasCoords,
  placeholder = 'Ej. Calle 10 # 4-25 o Parque Principal',
  ayuda,
  error,
  deshabilitado = false,
  className = '',
}) => {
  const [sugerencias, setSugerencias] = useState<PlaceSuggestion[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [indiceResaltado, setIndiceResaltado] = useState<number>(-1);

  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seleccionManualRef = useRef(false);

  // Cerrar al hacer clic fuera del componente y limpiar temporizadores al desmontar
  useEffect(() => {
    const alHacerClicFuera = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', alHacerClicFuera);
    return () => {
      document.removeEventListener('mousedown', alHacerClicFuera);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const buscarSugerencias = useCallback(
    async (texto: string) => {
      if (texto.trim().length < 3) {
        setSugerencias([]);
        setAbierto(false);
        setCargando(false);
        return;
      }

      setCargando(true);
      try {
        const resultados = await fetchGooglePlacePredictions(texto, biasCoords);
        if (!seleccionManualRef.current) {
          setSugerencias(resultados);
          setAbierto(resultados.length > 0);
          setIndiceResaltado(-1);
        }
      } catch {
        setSugerencias([]);
        setAbierto(false);
      } finally {
        setCargando(false);
      }
    },
    [biasCoords]
  );

  const manejarCambioInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = e.target.value;
    seleccionManualRef.current = false;
    onChange(nuevoValor);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      buscarSugerencias(nuevoValor);
    }, 350);
  };

  const seleccionarSugerencia = async (sug: PlaceSuggestion) => {
    seleccionManualRef.current = true;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setAbierto(false);
    setSugerencias([]);
    onChange(sug.description);

    if (onSeleccionarLugar) {
      setCargando(true);
      try {
        const coord = await fetchCoordinatesFromPlaceId(sug.placeId);
        if (coord) {
          onSeleccionarLugar({
            direccion: sug.description,
            lat: coord.lat,
            lng: coord.lng,
          });
        } else if (onConfirmar) {
          onConfirmar(sug.description);
        }
      } finally {
        setCargando(false);
      }
    }
  };

  const manejarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (abierto && indiceResaltado >= 0 && sugerencias[indiceResaltado]) {
        seleccionarSugerencia(sugerencias[indiceResaltado]);
      } else {
        setAbierto(false);
        if (onConfirmar) {
          onConfirmar(valor);
        }
        inputRef.current?.blur();
      }
      return;
    }

    if (!abierto || sugerencias.length === 0) {
      if (e.key === 'ArrowDown' && sugerencias.length > 0) {
        setAbierto(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceResaltado((prev) => (prev < sugerencias.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceResaltado((prev) => (prev > 0 ? prev - 1 : sugerencias.length - 1));
    } else if (e.key === 'Escape') {
      setAbierto(false);
      e.preventDefault();
    }
  };

  const ayudaId = ayuda ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [ayudaId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div ref={contenedorRef} className={`relative block text-left ${className}`}>
      <label htmlFor={id} className="mb-1 block text-rd-13 font-semibold text-rd-ink">
        {etiqueta}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={abierto && sugerencias.length > 0}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          value={valor}
          placeholder={placeholder}
          disabled={deshabilitado}
          autoComplete="off"
          onChange={manejarCambioInput}
          onFocus={() => {
            if (sugerencias.length > 0 && !seleccionManualRef.current) {
              setAbierto(true);
            }
          }}
          onBlur={() => {
            // Breve delay para permitir el click en las opciones
            setTimeout(() => {
              if (!seleccionManualRef.current && onBlur) {
                onBlur(valor);
              }
            }, 200);
          }}
          onKeyDown={manejarKeyDown}
          className={`${CONTROL_BASE} pr-8`}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
          {cargando ? (
            <Loader2 className="h-4 w-4 animate-spin text-rd-navy pointer-events-none" />
          ) : (
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                if (onConfirmar) onConfirmar(valor);
              }}
              title="Buscar en el mapa"
              className="p-1 text-rd-ink-meta hover:text-rd-navy transition-colors cursor-pointer rounded"
            >
              <MapPin className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {abierto && sugerencias.length > 0 && (
        <ul
          role="listbox"
          id={`${id}-listbox`}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-rd-md border border-rd-line bg-rd-surface py-1 shadow-lg ring-1 ring-black/5"
        >
          {sugerencias.map((sug, idx) => {
            const estaResaltado = idx === indiceResaltado;
            return (
              <li
                key={sug.placeId || idx}
                role="option"
                aria-selected={estaResaltado}
                onMouseEnter={() => setIndiceResaltado(idx)}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevenir blur prematuro
                  seleccionarSugerencia(sug);
                }}
                className={`flex cursor-pointer items-start gap-2.5 px-3.5 py-2.5 text-left text-rd-13 transition-colors ${
                  estaResaltado ? 'bg-rd-sunken text-rd-navy' : 'text-rd-ink hover:bg-rd-sunken'
                }`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rd-navy" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-rd-ink truncate">{sug.mainText}</div>
                  {sug.secondaryText && (
                    <div className="text-rd-12 text-rd-ink-meta truncate">{sug.secondaryText}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {ayuda && !error && (
        <p id={ayudaId} className="mt-1 text-rd-12 text-rd-ink-meta">
          {ayuda}
        </p>
      )}

      {error && (
        <div id={errorId} className="mt-1 flex items-center gap-1.5 text-rd-12 text-rd-coral">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

