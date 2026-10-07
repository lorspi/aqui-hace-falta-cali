import React from 'react';
import { BadgeCheck, Camera, Check, Hand, HeartHandshake, MapPin, Truck, Users } from 'lucide-react';

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

/** La ficha que flota sobre el objeto, con su sombra propia. El recurso de las dos referencias.
 *  Tenía una propiedad `style` para animarla al cargar; solo la usaba `MaquetaRadar`, y se fue con
 *  ella el 6 de octubre de 2026 (Alejandro: «borre lo que ya no se usa»). */
const Ficha: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`absolute z-10 rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 shadow-rd-2 ${className}`}>
    {children}
  </div>
);

/* --------------------------------------------------------------- pantallas ---- */
/* Aquí iba `MaquetaRadar`, el teléfono con el mapa y los pines cayendo. Salió del hero el 29 de
   septiembre de 2026, nadie volvió a montarla y se borró el 6 de octubre de 2026 (Alejandro:
   «borre lo que ya no se usa»). Del Radar queda `MaquetaRadarLista`, más abajo. */

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

/**
 * El Radar en vista de lista, para la tarjeta de acceso: el teléfono con el mapa se fue al hero
 * el 29 de septiembre de 2026 y repetirlo aquí era el defecto que Alejandro ya había señalado.
 * Esta es la otra vista real del producto, no un dibujo distinto de lo mismo. Ese teléfono
 * (`MaquetaRadar`) se borró el 6 de octubre de 2026, sin uso: esta es hoy la única maqueta del
 * Radar.
 */
export const MaquetaRadarLista: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none relative select-none">
    <Ventana titulo="Radar">
      <div className="flex items-center gap-1.5 border-b border-rd-line-soft px-3.5 py-2.5">
        <span className="font-rd rounded-full bg-rd-sel px-2 py-0.5 text-rd-10 font-semibold text-white">Todo</span>
        <span className="font-rd rounded-full px-2 py-0.5 text-rd-10 font-medium text-rd-ink-2">Necesidades</span>
        <span className="font-rd rounded-full px-2 py-0.5 text-rd-10 font-medium text-rd-ink-2">Ofertas</span>
      </div>

      {[
        ['necesidad', 'Agua potable para 45 familias', 'Siloé, Cali', '450 de 900 L'],
        ['oferta', 'Bomberos Voluntarios Usme', 'Usme, Bogotá', '900 L listos'],
        ['necesidad', 'Frazadas y colchonetas', 'Terrón Colorado', '0 de 120'],
        ['oferta', 'Camioneta 4x4 con conductor', 'Ciudad Jardín', 'Disponible'],
      ].map(([tipo, titulo, zona, dato], i) => (
        <div key={titulo} className={`flex items-start gap-2.5 px-3.5 py-2.5 ${i ? 'border-t border-rd-line-soft' : ''}`}>
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tipo === 'necesidad' ? 'bg-rd-coral' : 'bg-rd-navy'}`} />
          <div className="min-w-0 flex-1">
            <p className="font-rd m-0 truncate text-rd-11 font-semibold text-rd-ink">{titulo}</p>
            <p className="font-rd m-0 mt-0.5 flex items-center gap-1 text-rd-10 text-rd-ink-meta">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{zona}</span>
            </p>
          </div>
          <span className="font-rd shrink-0 rounded-full bg-rd-sunken px-2 py-0.5 text-rd-10 font-semibold text-rd-ink-2">{dato}</span>
        </div>
      ))}
    </Ventana>

    <Ficha className="-top-3 -right-5">
      <span className="font-rd flex items-center gap-1.5 text-rd-11 font-semibold text-rd-ink">
        <Hand className="h-3.5 w-3.5 shrink-0 text-rd-coral" />2 compatibles cerca
      </span>
    </Ficha>
  </div>
);

/* ------------------------------------------------- los tres pasos, en grande ---- */
/* Superficies densas para la columna derecha de «Cómo funciona». Calendly pone ahí un lienzo de
   580×580 lleno de producto; lo que había era una fotografía con una tarjeta pequeña encima y se
   veía pobre al lado del acordeón (Alejandro, 29 de septiembre de 2026: «está flojo» → «el visual
   de la derecha»). Son distintas de las del hero y las de los accesos: nada se repite. */

/** Paso 1, Reporta: el formulario de publicar, con lo que se pide y quién lo verifica. */
export const PantallaReporte: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none relative select-none">
    <Telefono className="w-72">
      <div className="px-4 pt-4 pb-5">
        <p className="font-rd m-0 text-rd-10-5 font-semibold text-rd-ink-meta">Paso 3 de 5</p>
        <p className="font-rd m-0 mt-1.5 text-rd-14 leading-snug font-semibold text-rd-ink">¿Cuánto hace falta de cada uno?</p>

        <div className="mt-4 flex flex-col gap-2.5">
          {[
            ['Agua potable', '900', 'L', true],
            ['Sueros de rehidratación', '120', 'unidades', true],
            ['Frazadas', '45', 'unidades', false],
          ].map(([n, c, u, listo]) => (
            <div key={n as string} className={`rounded-rd-md border p-2.5 ${listo ? 'border-rd-line bg-rd-surface' : 'border-rd-coral-soft bg-rd-coral-soft'}`}>
              <p className="font-rd m-0 flex items-center justify-between gap-2 text-rd-11 font-semibold text-rd-ink">
                <span className="truncate">{n as string}</span>
                {listo ? <Check className="h-3 w-3 shrink-0 text-rd-navy" /> : null}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="font-rd flex h-6 flex-1 items-center rounded-rd-sm border border-rd-line bg-rd-surface px-2 text-rd-11 font-semibold text-rd-ink tabular-nums">
                  {c as string}
                </span>
                <span className="font-rd flex h-6 items-center rounded-rd-sm border border-rd-line bg-rd-surface px-2 text-rd-10 text-rd-ink-2">
                  {u as string}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="font-rd m-0 mt-4 flex items-center gap-1.5 rounded-rd-sm bg-rd-navy-soft px-2.5 py-2 text-rd-10 text-rd-navy">
          <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
          La Junta de Acción Comunal verificará este reporte
        </p>

        <span className="font-rd mt-3 flex h-8 items-center justify-center rounded-rd-md bg-rd-coral text-rd-11 font-semibold text-white">
          Publicar necesidad
        </span>
      </div>
    </Telefono>

    <Ficha className="-bottom-3 -left-6">
      <span className="font-rd flex items-center gap-1.5 text-rd-11 font-semibold text-rd-ink">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-rd-coral" />
        Comuna 20, Siloé
      </span>
    </Ficha>
  </div>
);

/** Paso 2, Conecta: el panel de compatibles, que es donde ocurre el cruce. */
export const PantallaCruce: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none relative select-none">
    <Ventana titulo="Compatibles" className="w-88">
      <div className="border-b border-rd-line-soft bg-rd-coral-soft px-3.5 py-2.5">
        <p className="font-rd m-0 text-rd-11-5 font-semibold text-rd-coral-ink">Agua potable para 45 familias</p>
        <p className="font-rd m-0 mt-0.5 text-rd-10 text-rd-ink-2">Faltan 450 de 900 L, Siloé, Cali</p>
      </div>

      {[
        ['Bomberos Voluntarios Usme', '900 L disponibles', 'Bogotá, 461 km', true],
        ['Fundación Manos Unidas', '300 L disponibles', 'Kennedy, 458 km', false],
        ['Acueducto Comunitario', '150 L disponibles', 'Usme, 465 km', false],
      ].map(([n, cant, lugar, top], i) => (
        <div key={n as string} className={`flex items-start gap-2.5 px-3.5 py-2.5 ${i ? 'border-t border-rd-line-soft' : ''}`}>
          <span className="font-rd mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rd-navy-soft text-rd-10 font-semibold text-rd-navy">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-rd m-0 flex items-center gap-1 text-rd-11 font-semibold text-rd-ink">
              <span className="truncate">{n as string}</span>
              <BadgeCheck className="h-3 w-3 shrink-0 text-rd-navy" />
            </p>
            {/* Cantidad y lugar separados por coma, como la línea de la necesidad de arriba
                («Faltan 450 de 900 L, Siloé, Cali»). Aquí había un punto medio, que Alejandro
                prohibió en todo texto visible (6 de octubre de 2026, H1). */}
            <p className="font-rd m-0 mt-0.5 text-rd-10 text-rd-ink-2">
              {cant as string}, <span className="text-rd-ink-meta">{lugar as string}</span>
            </p>
          </div>
          {top ? (
            <span className="font-rd shrink-0 rounded-full bg-rd-navy px-2 py-0.5 text-rd-10 font-semibold text-white">Cubre todo</span>
          ) : null}
        </div>
      ))}

      <div className="flex gap-1.5 border-t border-rd-line-soft p-3">
        <span className="font-rd flex h-7 flex-1 items-center justify-center rounded-rd-sm bg-rd-navy text-rd-10 font-semibold text-white">
          Solicitar a Bomberos Usme
        </span>
      </div>
    </Ventana>

    <Ficha className="-top-3 -right-5">
      <span className="font-rd flex items-center gap-1.5 text-rd-11 font-semibold text-rd-ink">
        <HeartHandshake className="h-3.5 w-3.5 shrink-0 text-rd-navy" />3 compatibles
      </span>
    </Ficha>
  </div>
);

/** Paso 3, Monitorea: el acta, con las dos firmas y los soportes. */
export const PantallaActa: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none relative select-none">
    <Ventana titulo="Acta de entrega" className="w-88">
      <div className="px-4 pt-3.5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-rd m-0 font-mono text-rd-10 font-semibold tracking-wide text-rd-ink-2">RD-2026-BVU-014</p>
          <span className="font-rd shrink-0 rounded-full bg-rd-navy-soft px-2 py-0.5 text-rd-10 font-semibold text-rd-navy">Certificada</span>
        </div>
        <p className="font-rd m-0 mt-2 text-rd-13 font-semibold text-rd-ink">Agua potable, 900 L</p>

        <div className="mt-3.5 flex flex-col gap-2 border-t border-rd-line-soft pt-3.5">
          {[
            ['Entregó', 'Bomberos Voluntarios Usme'],
            ['Recibió', 'Junta de Acción Comunal, Siloé'],
            ['Fecha', '22 de septiembre, 4:10 p. m.'],
            ['Transporte', 'Camioneta, placa XKB-412'],
          ].map(([r, v]) => (
            <p key={r} className="font-rd m-0 flex items-baseline justify-between gap-3 text-rd-10">
              <span className="shrink-0 text-rd-ink-meta">{r}</span>
              <span className="truncate text-right font-medium text-rd-ink">{v}</span>
            </p>
          ))}
        </div>

        {/* Los soportes, como cuadritos de foto */}
        <div className="mt-3.5 border-t border-rd-line-soft pt-3.5">
          <p className="font-rd m-0 mb-2 flex items-center gap-1.5 text-rd-10 font-semibold text-rd-ink-2">
            <Camera className="h-3 w-3 shrink-0" />4 soportes fotográficos
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="block aspect-square rounded-rd-sm bg-rd-sunken" />
            ))}
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-rd-line-soft pt-3.5">
          {['Firma de quien entrega', 'Firma de quien recibe'].map((f) => (
            <div key={f}>
              <span className="block h-6 border-b border-rd-line" />
              <p className="font-rd m-0 mt-1 text-rd-10 text-rd-ink-meta">{f}</p>
            </div>
          ))}
        </div>

        <p className="font-rd m-0 mt-3.5 flex items-center gap-1.5 border-t border-rd-line-soft pt-3 text-rd-10 text-rd-ink-2">
          <Users className="h-3 w-3 shrink-0 text-rd-ink-3" />
          <b className="font-semibold text-rd-ink">120 familias</b> atendidas
        </p>
      </div>
    </Ventana>

    <Ficha className="-bottom-3 -left-5">
      <span className="font-rd flex items-center gap-1.5 text-rd-11 font-semibold text-rd-ink">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rd-navy-soft">
          <Check className="h-3 w-3 text-rd-navy" strokeWidth={3} />
        </span>
        Confirmada por las dos partes
      </span>
    </Ficha>
  </div>
);
