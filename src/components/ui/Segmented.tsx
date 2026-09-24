/**
 * Conmutador de vistas o modos en píldoras (Segmented):
 * Sigue el diseño de controles de la app: píldoras con esquinas cuadradas (rounded-rd-md),
 * opción activa en overlay claro (bg-rd-navy-soft, border-rd-navy-line, texto rd-navy) e
 * inactivas con fondo hundido (bg-rd-sunken, border-rd-line, texto rd-ink-2).
 * Altura 36 (h-9) y 44 con el dedo (pointer-coarse:h-rd-tactil).
 */
export interface OpcionSegmentada<T extends string> {
  id: T;
  etiqueta: string;
  /** Conteo al lado, en tabular. */
  n?: number;
  /** Punto de color antes del texto (coral pide, navy ofrece). */
  pip?: 'necesidad' | 'oferta';
}

export interface SegmentedProps<T extends string> {
  etiquetaGrupo: string;
  opciones: OpcionSegmentada<T>[];
  valor: T;
  onChange: (valor: T) => void;
  className?: string;
}

export function Segmented<T extends string>({ etiquetaGrupo, opciones, valor, onChange, className = '' }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={etiquetaGrupo} className={`inline-flex flex-nowrap items-center gap-2 zona-rd-scroll ${className}`}>
      {opciones.map((o) => {
        const activa = o.id === valor;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(o.id)}
            className={`font-rd inline-flex h-9 flex-none cursor-pointer items-center gap-1.5 rounded-rd-md border px-3 text-rd-13-5 whitespace-nowrap transition-colors pointer-coarse:h-rd-tactil focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy active:translate-y-px ${
              activa
                ? 'border-rd-navy-line bg-rd-navy-soft font-semibold text-rd-navy shadow-xs'
                : 'border-rd-line bg-rd-sunken font-medium text-rd-ink-2 hover:border-rd-navy-line hover:bg-rd-surface hover:text-rd-ink'
            }`}
          >
            {o.pip && (
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${o.pip === 'necesidad' ? 'bg-rd-coral' : 'bg-rd-navy'}`}
              />
            )}
            <span>{o.etiqueta}</span>
            {o.n !== undefined && (
              <span className={`font-semibold tabular-nums ${activa ? 'text-rd-navy' : 'text-rd-ink-meta'}`}>
                {o.n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
