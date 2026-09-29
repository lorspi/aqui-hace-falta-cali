import React from 'react';
import { ArrowUpRight, BadgeCheck, Check, Hand, HeartHandshake, MapPin, Search, Truck } from 'lucide-react';

/**
 * Las maquetas de producto de las tarjetas de la primera sección.
 *
 * Rehechas el 29 de septiembre de 2026. Las anteriores eran «muy flojas» (Alejandro), y lo eran:
 * recuadritos planos, chicos y centrados. Mirando Ramp y Superpower, lo que les da calidad es
 * concreto y copiable:
 *
 * 1. **Un objeto con masa.** Una tarjeta física, un teléfono, una ventana. No un widget suelto.
 * 2. **Grande y recortado** por el borde del contenedor, no cabiendo entero con aire alrededor.
 * 3. **Sombra de verdad** bajo el objeto, y las fichas flotantes con la suya propia encima de él.
 * 4. **Densidad**: la pantalla muestra muchas filas, no dos. Una pantalla vacía parece un error.
 *
 * Todo con los tokens `rd-*` y con los datos que el producto tiene de verdad.
 */

/* ------------------------------------------------------------------ marcos ---- */

/** Un teléfono. El usuario de RaDAR está en la calle, con el barrio inundado: es su objeto. */
const Telefono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`relative w-64 rounded-rd-3xl bg-rd-ink p-1.5 shadow-rd-2 ${className}`}>
    <div className="overflow-hidden rounded-rd-2xl bg-rd-surface">
      {/* La isla superior, que es lo que hace que se lea como teléfono y no como una caja. */}
      <div className="flex justify-center bg-rd-surface pt-2">
        <span className="h-4 w-16 rounded-full bg-rd-ink" />
      </div>
      {children}
    </div>
  </div>
);

/** Una ventana de escritorio, para lo que se consulta sentado: el directorio. */
const Ventana: React.FC<{ titulo: string; children: React.ReactNode; className?: string }> = ({ titulo, children, className = '' }) => (
  <div className={`w-80 overflow-hidden rounded-rd-lg border border-rd-line bg-rd-surface shadow-rd-2 ${className}`}>
    <div className="flex items-center gap-2 border-b border-rd-line bg-rd-fondo px-3.5 py-2.5">
      <span className="flex shrink-0 items-center gap-1.25">
        <span className="h-2 w-2 rounded-full bg-rd-line-strong" />
        <span className="h-2 w-2 rounded-full bg-rd-line-strong" />
        <span className="h-2 w-2 rounded-full bg-rd-line-strong" />
      </span>
      <span className="font-rd ml-1 text-rd-11 font-semibold text-rd-ink-2">{titulo}</span>
    </div>
    {children}
  </div>
);

/** La ficha que flota sobre el objeto, con su sombra propia. El recurso de las dos referencias. */
const Ficha: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`absolute z-10 rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 shadow-rd-2 ${className}`}>{children}</div>
);

/* --------------------------------------------------------------- pantallas ---- */

/** Radar: el mapa con sus pines y la publicación abierta abajo, como en el producto. */
export const MaquetaRadar: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none relative select-none">
    <Telefono>
      {/* La barra de consulta */}
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-2">
        <span className="font-rd flex h-6.5 flex-1 items-center gap-1.5 rounded-full border border-rd-line px-2.5 text-rd-10 text-rd-ink-3">
          <Search className="h-3 w-3 shrink-0" />
          Buscar recurso o barrio
        </span>
      </div>

      {/* El mapa: tesela, calles y pines de los dos colores */}
      <div className="relative h-38 bg-rd-mapa">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 150" fill="none">
          <path d="M-10 40 L120 62 L250 30" className="stroke-rd-surface" strokeWidth="7" />
          <path d="M-10 96 L110 84 L250 108" className="stroke-rd-surface" strokeWidth="5" />
          <path d="M64 -10 L82 160" className="stroke-rd-surface" strokeWidth="5" />
          <path d="M168 -10 L152 160" className="stroke-rd-surface" strokeWidth="6" />
          <rect x="18" y="52" width="34" height="26" rx="2" className="fill-rd-surface/45" />
          <rect x="96" y="20" width="40" height="24" rx="2" className="fill-rd-surface/45" />
          <rect x="182" y="66" width="42" height="30" rx="2" className="fill-rd-surface/45" />
          <rect x="100" y="108" width="36" height="28" rx="2" className="fill-rd-surface/45" />
        </svg>

        {[
          { x: 'left-11', y: 'top-14', tono: 'bg-rd-coral' },
          { x: 'left-28', y: 'top-6', tono: 'bg-rd-navy' },
          { x: 'left-44', y: 'top-20', tono: 'bg-rd-navy' },
          { x: 'left-20', y: 'top-26', tono: 'bg-rd-coral' },
        ].map((p, i) => (
          <span key={i} className={`absolute ${p.x} ${p.y} flex h-5 w-5 items-center justify-center rounded-full ${p.tono} shadow-sm ring-2 ring-rd-surface`}>
            <MapPin className="h-2.5 w-2.5 text-white" />
          </span>
        ))}

        {/* El pin en foco, más grande y con su halo */}
        <span className="absolute top-16 left-32 flex h-7 w-7 items-center justify-center rounded-full bg-rd-coral shadow-md ring-3 ring-rd-surface">
          <Hand className="h-3.5 w-3.5 text-white" />
        </span>
      </div>

      {/* La hoja del pin, abierta */}
      <div className="rounded-t-rd-lg border-t border-rd-line bg-rd-surface px-3.5 pt-3 pb-4">
        <span className="mx-auto mb-2.5 block h-1 w-9 rounded-full bg-rd-line" />
        <p className="font-rd m-0 flex items-center gap-1.5 text-rd-11 font-semibold text-rd-ink">
          Agua potable para 45 familias
        </p>
        <p className="font-rd m-0 mt-1 text-rd-10 text-rd-ink-2">Comuna 20, Siloé, a 1,2 km</p>

        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-rd-sunken">
          <div className="h-full w-1/2 rounded-full bg-rd-coral" />
        </div>
        <p className="font-rd m-0 mt-1.5 flex justify-between text-rd-10 text-rd-ink-2">
          <span>450 de 900 L</span>
          <span className="font-semibold text-rd-ink">50 %</span>
        </p>

        <div className="mt-3 flex gap-1.5">
          <span className="font-rd flex h-7 flex-1 items-center justify-center rounded-rd-sm bg-rd-navy text-rd-10 font-semibold text-white">
            Quiero ayudar
          </span>
          <span className="font-rd flex h-7 w-7 items-center justify-center rounded-rd-sm border border-rd-line text-rd-ink-2">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Telefono>

    <Ficha className="-top-2 -right-6">
      <span className="font-rd flex items-center gap-1.5 text-rd-11 font-semibold text-rd-ink">
        <HeartHandshake className="h-3.5 w-3.5 shrink-0 text-rd-navy" />1 compatible
      </span>
      <span className="font-rd mt-0.5 block text-rd-10 text-rd-ink-2">Bomberos Usme, 900 L</span>
    </Ficha>
  </div>
);

/** Directorio: la tabla de entidades, densa, como se consulta de verdad. */
export const MaquetaDirectorio: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none relative select-none">
    <Ventana titulo="Directorio">
      <div className="flex items-center gap-1.5 border-b border-rd-line-soft px-3.5 py-2.5">
        <span className="font-rd rounded-full bg-rd-sel px-2 py-0.5 text-rd-10 font-semibold text-white">Organizaciones</span>
        <span className="font-rd rounded-full px-2 py-0.5 text-rd-10 font-medium text-rd-ink-2">Comunidades</span>
      </div>

      {[
        ['Bomberos Voluntarios Usme', 'Cuerpo de socorro', 'Usme'],
        ['Cruz Roja seccional Bogotá', 'Cuerpo de socorro', 'Teusaquillo'],
        ['Fundación Manos Unidas', 'Fundación', 'Kennedy'],
        ['Brigada Solidaria Siloé', 'Comunidad', 'Siloé'],
        ['Acueducto Comunitario', 'Junta de acción', 'Usme'],
      ].map(([nombre, tipo, zona], i) => (
        <div key={nombre} className={`flex items-center gap-2.5 px-3.5 py-2.5 ${i ? 'border-t border-rd-line-soft' : ''}`}>
          <span className="font-rd flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rd-sunken text-rd-10 font-semibold text-rd-ink-2">
            {nombre.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-rd m-0 flex items-center gap-1 text-rd-11 font-semibold text-rd-ink">
              <span className="truncate">{nombre}</span>
              <BadgeCheck className="h-3 w-3 shrink-0 text-rd-navy" />
            </p>
            <p className="font-rd m-0 mt-0.5 truncate text-rd-10 text-rd-ink-meta">{tipo}</p>
          </div>
          <span className="font-rd shrink-0 rounded-full bg-rd-sunken px-2 py-0.5 text-rd-10 text-rd-ink-2">{zona}</span>
        </div>
      ))}
    </Ventana>

    <Ficha className="-bottom-3 -left-5">
      <span className="font-rd flex items-center gap-1.5 text-rd-11 font-semibold text-rd-ink">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
        12 respondiendo en tu zona
      </span>
    </Ficha>
  </div>
);

/** Mi organización: el tablero de seguimiento con la entrega avanzando. */
export const MaquetaPanel: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none relative select-none">
    <Ventana titulo="Seguimiento">
      <div className="grid grid-cols-3 gap-2 p-3">
        {[
          { t: 'Comprometido', n: 2, items: ['Frazadas, 120', 'Mercados, 40'] },
          { t: 'En camino', n: 1, items: ['Agua potable, 900 L'] },
          { t: 'Entregada', n: 3, items: ['Planta eléctrica', 'Kits de aseo', 'Colchonetas'] },
        ].map((c, ci) => (
          <div key={c.t} className="rounded-rd-sm bg-rd-fondo p-1.5">
            <p className="font-rd m-0 mb-1.5 flex items-center justify-between text-rd-10 font-semibold text-rd-ink">
              <span className="truncate">{c.t}</span>
              <span className="text-rd-ink-meta tabular-nums">{c.n}</span>
            </p>
            <div className="flex flex-col gap-1">
              {c.items.map((it) => (
                <p
                  key={it}
                  className={`font-rd m-0 rounded-rd-sm border bg-rd-surface p-1.5 text-rd-10 leading-snug ${
                    ci === 1 ? 'border-rd-navy-line text-rd-ink' : 'border-rd-line text-rd-ink-2'
                  }`}
                >
                  {it}
                  {ci === 1 && (
                    <span className="mt-1 flex items-center gap-1 text-rd-navy">
                      <Truck className="h-2.5 w-2.5 shrink-0" />
                      <span className="font-semibold">Despachada</span>
                    </span>
                  )}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-rd-line-soft px-3.5 py-2.5">
        <p className="font-rd m-0 font-mono text-rd-10 font-semibold text-rd-ink-2">RD-2026-BVU-014</p>
        <p className="font-rd m-0 mt-1 flex items-center justify-between text-rd-10 text-rd-ink-2">
          <span>Acta firmada por las dos partes</span>
          <span className="font-semibold text-rd-ink">120 familias</span>
        </p>
      </div>
    </Ventana>

    <Ficha className="-top-3 -right-5">
      <span className="font-rd flex items-center gap-1.5 text-rd-11 font-semibold text-rd-ink">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rd-navy-soft">
          <Check className="h-3 w-3 text-rd-navy" strokeWidth={3} />
        </span>
        Entregada y confirmada
      </span>
    </Ficha>
  </div>
);
