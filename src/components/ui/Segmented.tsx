/**
 * Conmutador de vistas o modos (Segmented):
 * Pista con marco (border-rd-line sobre rd-surface, p-1) y la opción activa en píldora llena de
 * tinta (bg-rd-sel, texto blanco); las inactivas van sin marco ni fondo sobre la pista.
 * La esquina es `rounded-full`, la misma de Filtros y el buscador, que son los controles con
 * los que comparte la barra de consulta (Alejandro, 24 de septiembre de 2026).
 * La pista mide lo mismo que ellos y que un Button md: 40, y 44 con el dedo. Como el alto sale
 * de la opción más el relleno más el marco, la opción va a 30 (40 − 4 − 4 − 1 − 1) y a 34 con
 * el dedo; cambiar una de las tres medidas obliga a rehacer la cuenta.
 *
 * Sobre la píldora activa el navy y el coral plenos se pierden (1.69:1 el navy), así que el
 * punto de color usa ahí las variantes que los tokens declaran para fondo oscuro, y el anillo
 * de foco pasa a blanco: el rd-navy sobre tinta tampoco se vería.
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
    <div
      role="group"
      aria-label={etiquetaGrupo}
      className={`zona-rd-scroll inline-flex max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto overflow-y-hidden rounded-full border border-rd-line bg-rd-surface p-1 ${className}`}
    >
      {opciones.map((o) => {
        const activa = o.id === valor;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(o.id)}
            className={`font-rd inline-flex h-7.5 flex-none cursor-pointer items-center gap-1.5 rounded-full px-3 text-rd-13-5 whitespace-nowrap transition-colors pointer-coarse:h-8.5 focus-visible:outline-2 focus-visible:-outline-offset-2 active:translate-y-px ${
              activa
                ? 'bg-rd-sel font-semibold text-white focus-visible:outline-white'
                : 'font-medium text-rd-ink-2 hover:bg-rd-sunken hover:text-rd-ink focus-visible:outline-rd-navy'
            }`}
          >
            {o.pip && (
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${
                  o.pip === 'necesidad'
                    ? activa ? 'bg-brand-red-light' : 'bg-rd-coral'
                    : activa ? 'bg-brand-blue-light' : 'bg-rd-navy'
                }`}
              />
            )}
            <span>{o.etiqueta}</span>
            {/* El conteo va en pastilla, no suelto al lado del texto: así se ve de un golpe qué
                es rótulo y qué es cifra (Alejandro, 25 de septiembre de 2026). Sobre la opción
                activa, que es oscura, el fondo es blanco al 20 %; sobre las inactivas, hundido. */}
            {o.n !== undefined && (
              <span
                className={`inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-rd-11 font-semibold tabular-nums ${
                  activa ? 'bg-white/20 text-white' : 'bg-rd-sunken text-rd-ink-2'
                }`}
              >
                {o.n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
