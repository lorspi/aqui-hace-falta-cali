import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, CircleAlert, Eye, EyeOff } from 'lucide-react';

/**
 * Campo de formulario del sistema de Producto (el `rd-campo-f` del prototipo), con
 * utilidades de Tailwind sobre los tokens `rd-*`. Dos formas:
 *   base     40 de alto, radio 8, etiqueta visible encima (formularios de la app).
 *   pildora  52 de alto, redondo, icono a la izquierda; la etiqueta vive para tecnologías de
 *            apoyo (`sr-only`) y el placeholder la repite (registro).
 * Lo opcional se dice en la etiqueta, «(opcional)», no con asteriscos. Ayuda debajo. Error
 * con icono, `aria-invalid` y `aria-describedby` que enlaza ayuda y error. La validación
 * corre al salir del campo (`onBlur`); el error se quita al corregir.
 *
 * Contraseña: el control **no es controlado**. Su valor nunca pasa por el estado de React ni
 * por un atributo `value`; `onChange` lo entrega para guardarlo en un `ref` y `valorInicial`
 * lo repone al montar (por propiedad). Lleva los atributos que lo enmascaran en Clarity,
 * Hotjar, FullStory, LogRocket y Quantum Metric. El conmutador es el texto «Ver / Ocultar»
 * (`verComoTexto`) o el ojo con `aria-label`; en ambos `aria-pressed`.
 */
export type TipoCampo = 'text' | 'email' | 'tel' | 'password' | 'select' | 'checkbox' | 'textarea' | 'date';

export interface FieldProps {
  id: string;
  etiqueta: React.ReactNode;
  tipo?: TipoCampo;
  valor?: string;
  marcado?: boolean;
  onChange?: (valor: string) => void;
  onChangeMarcado?: (marcado: boolean) => void;
  onBlur?: (valor: string) => void;
  opcional?: boolean;
  ayuda?: string;
  error?: string | null;
  /** Icono Lucide (20) a la izquierda del control. Decorativo. */
  icono?: React.ReactNode;
  /** Opciones del select; la primera opción es la etiqueta, sin valor. */
  opciones?: string[];
  /** Filas del textarea (3 por defecto). */
  filas?: number;
  /** `aria-required` en lo obligatorio que no se dice con asterisco. */
  requerido?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  valorInicial?: string;
  list?: string;
  forma?: 'base' | 'pildora';
  etiquetaOculta?: boolean;
  verComoTexto?: boolean;
  deshabilitado?: boolean;
  className?: string;
}

const CONTROL_BASE =
  'font-rd w-full border border-rd-line bg-rd-surface text-rd-ink transition-colors placeholder:text-rd-ink-meta hover:enabled:not-focus:border-rd-ink-3 focus:border-rd-navy focus:outline-none focus:ring-3 focus:ring-rd-navy-soft disabled:cursor-not-allowed disabled:border-rd-line disabled:bg-rd-sunken disabled:text-rd-ink-meta aria-invalid:border-rd-coral aria-invalid:focus:ring-rd-coral-soft';

export const Field: React.FC<FieldProps> = ({
  id,
  etiqueta,
  tipo = 'text',
  valor = '',
  marcado = false,
  onChange,
  onChangeMarcado,
  onBlur,
  opcional = false,
  ayuda,
  error,
  icono,
  opciones = [],
  filas = 3,
  requerido = false,
  placeholder,
  autoComplete,
  inputMode,
  valorInicial,
  list,
  forma = 'base',
  etiquetaOculta = false,
  verComoTexto = false,
  deshabilitado = false,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tipo === 'password' && passRef.current && valorInicial) passRef.current.value = valorInicial;
    // Solo al montar: reponer lo escrito cuando la persona vuelve al paso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (tipo === 'checkbox') {
    return (
      <div className={className}>
        <label htmlFor={id} className={`font-rd flex items-center gap-2.5 py-1.75 text-rd-13-5 text-rd-ink pointer-coarse:min-h-rd-tactil ${deshabilitado ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
          <input
            id={id}
            type="checkbox"
            checked={marcado}
            disabled={deshabilitado}
            onChange={(e) => onChangeMarcado?.(e.target.checked)}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className="m-0 h-4 w-4 shrink-0 cursor-pointer accent-rd-sel focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy disabled:cursor-not-allowed"
          />
          <span>{etiquetaNodo}</span>
        </label>
        {ayudaNodo}
        {errorNodo}
      </div>
    );
  }

  const conIcono = Boolean(icono);
  const claseControl = [
    CONTROL_BASE,
    pildora ? 'h-13 rounded-full text-rd-15' : 'h-rd-h-md rounded-rd-md text-rd-14',
    pildora ? (conIcono ? 'pr-4 pl-12' : 'px-4') : conIcono ? 'pr-3 pl-10' : 'px-3',
    tipo === 'password' ? (verComoTexto ? 'pr-18' : 'pr-12') : '',
  ]
    .filter(Boolean)
    .join(' ');
  const placeholderFinal = placeholder ?? (etiquetaOculta ? `${textoEtiqueta}${opcional ? ' (opcional)' : ''}` : undefined);

  return (
    <div className={`text-left ${className}`}>
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

        {tipo === 'select' ? (
          <div className="relative w-full">
            <select
              id={id}
              value={valor}
              disabled={deshabilitado}
              onChange={(e) => onChange?.(e.target.value)}
              onBlur={(e) => onBlur?.(e.target.value)}
              aria-describedby={describedBy}
              aria-invalid={error ? true : undefined}
              className={`${claseControl} appearance-none pr-10 ${deshabilitado ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                !valor ? 'text-rd-ink-meta' : 'text-rd-ink font-normal'
              }`}
            >
              <option value="" disabled hidden>
                {placeholder ?? textoEtiqueta}
              </option>
              {opciones.map((o) => (
                <option key={o} value={o} className="text-rd-ink font-normal bg-rd-surface">
                  {o}
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-rd-ink-3 ${
                pildora ? 'right-4' : 'right-3'
              }`}
            >
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        ) : tipo === 'textarea' ? (
          <textarea
            id={id}
            value={valor}
            rows={filas}
            disabled={deshabilitado}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={(e) => onBlur?.(e.target.value)}
            placeholder={placeholderFinal}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            aria-required={requerido || undefined}
            className={`${claseControl} h-auto min-h-18 resize-y py-2 leading-normal`}
          />
        ) : tipo === 'password' ? (
          <>
            <input
              ref={passRef}
              id={id}
              type={visible ? 'text' : 'password'}
              disabled={deshabilitado}
              onChange={(e) => onChange?.(e.target.value)}
              onBlur={(e) => onBlur?.(e.target.value)}
              placeholder={placeholderFinal}
              autoComplete={autoComplete ?? 'off'}
              aria-describedby={describedBy}
              aria-invalid={error ? true : undefined}
              className={`${claseControl} fs-exclude`}
              data-clarity-mask="true"
              data-hj-suppress=""
              data-private="true"
              data-qm-encrypt="true"
            />
            {verComoTexto ? (
              <button
                type="button"
                disabled={deshabilitado}
                onClick={() => setVisible((v) => !v)}
                aria-pressed={visible}
                className="font-rd absolute inset-y-0 right-2 flex cursor-pointer items-center px-3 text-rd-12-5 font-medium text-rd-ink-meta hover:text-rd-ink focus-visible:rounded-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy"
              >
                {visible ? 'Ocultar' : 'Ver'}
              </button>
            ) : (
              <button
                type="button"
                disabled={deshabilitado}
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={visible}
                className="absolute inset-y-0 right-0 flex min-w-rd-tactil cursor-pointer items-center justify-center px-3 text-rd-ink-3 hover:text-rd-ink focus-visible:outline-2 focus-visible:outline-rd-navy"
              >
                {visible ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
              </button>
            )}
          </>
        ) : (
          <input
            id={id}
            type={tipo}
            value={valor}
            disabled={deshabilitado}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={(e) => onBlur?.(e.target.value)}
            placeholder={placeholderFinal}
            autoComplete={autoComplete}
            inputMode={inputMode}
            list={list}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            aria-required={requerido || undefined}
            className={claseControl}
          />
        )}
      </div>
      {ayudaNodo}
      {errorNodo}
    </div>
  );
};
