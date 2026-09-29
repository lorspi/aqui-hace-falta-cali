import React from 'react';
import { useEnVista } from '../useEnVista';
import { ArrowRight, BadgeCheck, Camera, Check, MapPin, Users } from 'lucide-react';

/**
 * Las piezas visuales de la landing. Una por punto, ninguna repetida.
 *
 * **Rehechas el 28 de septiembre de 2026 por una crítica de Alejandro que las invalidó enteras:**
 * «hay muchos elementos minimalistas que no son claros. piensa desde un usuario que acaba de
 * vivir una tragedia y necesita saber si RaDAR es lo que le sirve para solucionarlo. esos
 * elementos comunican poco o nada».
 *
 * Tenía razón. La primera versión copiaba la abstracción de la referencia —arcos, puntos,
 * cuadrículas— y esa abstracción funciona ahí porque le vende infraestructura a gente técnica.
 * Aquí el que mira acaba de perder su casa y tiene una sola pregunta: *¿esto me sirve?*
 *
 * Así que la regla de estas piezas cambió: **contenido legible antes que dibujo**. Cada una
 * muestra un caso completo y concreto, con nombres, cantidades y estados que se leen sin
 * esforzarse, y responde una pregunta que esa persona se está haciendo:
 *
 *   1. Reporta   → «¿puedo pedir exactamente lo que me falta, y me van a creer?»
 *   2. Conecta   → «¿alguien tiene eso y me lo va a llevar?»
 *   3. Monitorea → «¿cómo sé que llegó y que no se perdió por el camino?»
 *
 * El dibujo se queda solo donde aporta: el mapa de Colombia, que muestra la distancia real que
 * la ayuda recorre. Lo demás es la interfaz del producto, a tamaño que se lee.
 */

const Lienzo: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div aria-hidden="true" className={`pointer-events-none relative w-full select-none ${className}`}>
    {children}
  </div>
);

/**
 * La composición de la referencia: una fotografía de base y, encabalgada sobre ella, la pieza de
 * interfaz. Allí son esferas con burbujas de chat encima; aquí es la escena real con la tarjeta
 * del producto saliéndose del borde, para que se vea que lo de la pantalla es lo de la calle.
 *
 * Las fotografías se generaron con Higgsfield el 28 de septiembre de 2026 a pedido de Alejandro.
 * **Son ilustrativas, no documentales**: muestran qué hace RaDAR, y por eso ninguna va dentro del
 * acta de entrega, donde se leerían como prueba de una entrega que no ocurrió.
 */
export const Composicion: React.FC<{ foto: string; alt: string; children: React.ReactNode }> = ({ foto, alt, children }) => (
  <figure className="relative m-0 pb-14 sm:pb-16">
    <img src={foto} alt={alt} loading="lazy" decoding="async" className="aspect-4/3 w-full rounded-rd-xl object-cover" />
    <div className="absolute right-4 bottom-0 left-4 sm:right-8 sm:left-8">{children}</div>
  </figure>
);

const Tarjeta: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-rd-lg border border-rd-line bg-rd-surface p-4 shadow-2xs ${className}`}>{children}</div>
);

/**
 * Una fila de recurso con su barra: cuánto se pidió y cuánto falta todavía.
 *
 * La barra se llena al aparecer en pantalla, no está ya llena. Es el único sitio de la landing
 * donde el movimiento carga significado en vez de adornar: ver «450 de 900 L» llenándose delante
 * de uno dice que falta la mitad mucho mejor que el mismo dato quieto.
 */
const Recurso: React.FC<{ nombre: string; meta: string; logrado: number }> = ({ nombre, meta, logrado }) => {
  const { ref, visible } = useEnVista<HTMLDivElement>();
  return (
    <div ref={ref}>
      <p className="font-rd m-0 flex items-baseline justify-between gap-2 text-rd-13">
        <span className="font-semibold text-rd-ink">{nombre}</span>
        <span className="shrink-0 text-rd-12 text-rd-ink-2 tabular-nums">{meta}</span>
      </p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-rd-sunken">
        <div
          className={`rd-barra h-full rounded-full bg-rd-coral ${visible ? 'es-visible' : ''}`}
          style={{ width: `${logrado}%` }}
        />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------- cómo funciona ---- */

/**
 * Paso 1, Reporta. Responde: «¿puedo pedir exactamente lo que me falta, y me van a creer?».
 * Por eso lo que se ve es una necesidad real, con sus cantidades y, abajo, quién la verificó.
 */
export const NecesidadEnTerritorio: React.FC = () => (
  <Composicion foto="/images/landing/reporta.jpg" alt="Una líder comunitaria anota en su teléfono lo que hace falta en el barrio, con las casas inundadas al fondo.">
    <Tarjeta>
      <div className="flex items-start justify-between gap-3">
        <span className="font-rd rounded-full bg-rd-coral-soft px-2.5 py-1 text-rd-11 font-semibold text-rd-coral-ink">Hace falta</span>
        <span className="font-rd shrink-0 text-rd-11-5 text-rd-ink-meta">Hace 14 min</span>
      </div>

      <h4 className="font-rd m-0 mt-3 text-rd-16 leading-snug font-semibold text-rd-ink">
        Agua potable para 45 familias
      </h4>
      <p className="font-rd m-0 mt-1.5 flex items-center gap-1.5 text-rd-13 text-rd-ink-2">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
        Comuna 20, Siloé, Cali
      </p>

      <div className="mt-4 flex flex-col gap-3 border-t border-rd-line-soft pt-4">
        <Recurso nombre="Agua potable" meta="450 de 900 L" logrado={50} />
        <Recurso nombre="Sueros de rehidratación" meta="0 de 120" logrado={0} />
      </div>

      <p className="font-rd m-0 mt-4 flex items-center gap-1.5 border-t border-rd-line-soft pt-3.5 text-rd-12-5 text-rd-ink-2">
        <BadgeCheck className="h-4 w-4 shrink-0 text-rd-navy" />
        Verificada por la Junta de Acción Comunal
      </p>
    </Tarjeta>
  </Composicion>
);

/* El contorno de la Colombia continental: Natural Earth 50m (world-atlas, dominio público),
   decodificado del TopoJSON, simplificado con Ramer-Douglas-Peucker a 201 puntos y proyectado
   en Mercator para que el país no salga achatado. Reemplaza a un polígono de 23 puntos puestos a
   mano, que no daba la talla (Alejandro, 28 de septiembre de 2026). */
const COLOMBIA =
  'M152.2 11.5 L139.6 15.5 L133.9 24.9 L130.0 26.6 L125.2 32.2 L121.6 39.1 L118.9 53.2 L111.8 65.1 L115.2 65.1 L117.9 63.8 L119.8 66.3 L123.0 66.8 L125.7 76.5 L130.6 81.4 L131.6 85.9 L130.0 89.7 L129.5 98.5 L131.0 100.6 L134.7 101.5 L138.7 108.2 L140.9 109.1 L146.3 108.2 L156.0 109.2 L163.7 107.1 L170.7 109.5 L175.7 109.8 L189.6 126.3 L192.8 126.8 L199.3 124.8 L208.5 125.7 L220.6 123.0 L228.1 125.2 L228.9 128.3 L228.2 130.2 L226.2 132.1 L224.9 137.5 L221.2 143.3 L220.7 158.4 L224.5 171.1 L231.4 180.0 L221.1 190.4 L220.6 192.3 L222.4 191.5 L225.4 192.3 L226.3 194.4 L233.4 200.3 L235.0 208.0 L239.9 220.7 L240.0 223.4 L235.9 224.1 L235.8 215.6 L229.6 205.7 L226.6 206.6 L221.4 212.1 L219.1 213.0 L217.2 212.2 L214.0 208.3 L212.8 211.1 L214.3 213.6 L191.7 213.5 L187.3 212.5 L181.3 213.8 L181.2 226.6 L191.9 226.8 L194.8 230.5 L195.0 234.8 L192.4 235.1 L188.7 233.1 L177.2 236.1 L176.9 250.3 L179.8 253.8 L185.5 257.6 L186.0 262.6 L189.2 267.3 L190.2 271.1 L179.0 331.3 L171.6 322.9 L167.8 324.0 L163.8 322.3 L176.9 301.9 L176.4 300.1 L159.1 291.1 L154.7 293.2 L150.7 293.6 L143.6 290.0 L139.1 293.5 L134.5 294.9 L131.0 295.5 L126.4 294.0 L120.2 294.8 L116.0 292.5 L116.6 288.6 L115.1 283.7 L109.2 281.0 L108.7 276.1 L105.9 272.2 L102.0 271.2 L98.2 267.8 L94.4 266.7 L91.0 259.0 L84.3 253.4 L83.4 251.5 L80.6 251.2 L76.8 248.5 L75.1 248.3 L73.9 249.6 L64.2 245.8 L58.5 240.7 L54.4 238.8 L52.1 239.5 L51.3 242.4 L50.0 242.9 L43.4 242.6 L32.2 239.7 L30.8 235.0 L27.2 233.2 L26.2 231.0 L23.6 231.2 L14.1 226.9 L6.8 222.2 L0.0 215.4 L1.4 212.9 L4.6 211.0 L8.9 212.5 L9.4 209.5 L7.8 206.9 L8.6 201.0 L12.0 198.5 L19.0 197.9 L22.8 193.7 L24.0 193.9 L26.8 190.6 L26.3 187.4 L29.0 186.7 L31.8 181.5 L33.0 181.3 L38.5 170.2 L36.8 171.2 L34.8 170.6 L34.6 167.3 L32.9 169.5 L31.6 167.2 L31.9 163.6 L29.7 164.2 L33.1 160.6 L34.3 154.1 L32.6 142.2 L29.4 138.0 L35.1 133.2 L30.7 125.3 L30.6 123.1 L32.1 123.3 L32.7 117.4 L31.4 115.0 L29.7 115.0 L22.3 104.3 L25.3 98.2 L25.0 95.0 L28.4 98.1 L29.4 97.6 L33.1 94.9 L33.2 92.2 L36.1 89.5 L30.6 79.0 L32.3 76.1 L43.0 87.2 L41.5 89.5 L42.7 90.6 L44.2 90.3 L45.1 88.9 L44.5 82.8 L43.6 79.7 L41.6 77.5 L54.3 69.2 L59.2 61.7 L61.7 60.4 L66.9 60.0 L67.6 58.2 L66.1 54.4 L68.9 44.9 L68.5 44.2 L65.6 46.1 L68.6 42.4 L70.7 36.7 L82.6 26.7 L92.7 29.0 L89.5 30.2 L89.1 31.7 L91.4 33.6 L96.4 22.4 L105.7 23.4 L112.9 23.0 L124.5 14.6 L133.3 11.0 L136.1 4.9 L139.4 3.9 L144.4 0.2 L148.8 0.0 L153.4 2.0 L155.8 7.8 L152.2 11.5 Z';
/** Cali y Bogotá, proyectadas con esa misma escala desde sus coordenadas reales. */
const CALI = { x: 49.5, y: 179.6 };
const BOGOTA = { x: 97.7, y: 156.4 };
const RUTA = `M${CALI.x} ${CALI.y} Q ${(CALI.x + BOGOTA.x) / 2} ${Math.min(CALI.y, BOGOTA.y) - 30}, ${BOGOTA.x} ${BOGOTA.y}`;

/**
 * Paso 2, Conecta. Responde: «¿alguien tiene eso y me lo va a llevar?». El mapa está para que
 * se vea la distancia real que recorre la ayuda; lo que importa son las dos tarjetas, que dicen
 * con nombre y cantidad quién necesita y quién tiene.
 */
export const RutaEntreCiudades: React.FC = () => (
  <Composicion foto="/images/landing/conecta.jpg" alt="Voluntarios y bomberos cargan botellones de agua y cajas de insumos en una camioneta.">
    <Tarjeta className="flex items-center gap-4">
      {/* El mapa, chico: está para que se vea la distancia, no para mirarlo. */}
      <svg className="block h-28 w-auto shrink-0 sm:h-32" viewBox="0 0 240 331" fill="none" aria-hidden="true">
        <path d={COLOMBIA} className="fill-rd-sunken stroke-rd-line" strokeWidth="2" strokeLinejoin="round" />
        <path d={RUTA} className="stroke-rd-line-strong" strokeWidth="2" strokeDasharray="4 5" />
        <path d={RUTA} className="rd-ruta stroke-rd-navy" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx={CALI.x} cy={CALI.y} r="7" className="rd-late fill-rd-coral" />
        <circle cx={BOGOTA.x} cy={BOGOTA.y} r="7" className="fill-rd-navy" />
      </svg>

      <div className="min-w-0 flex-1">
        <p className="font-rd m-0 flex items-baseline gap-2 text-rd-12-5">
          <span className="h-2 w-2 shrink-0 translate-y-px rounded-full bg-rd-navy" />
          <span className="min-w-0">
            <b className="font-semibold text-rd-ink">Bomberos Usme</b>
            <span className="block text-rd-11-5 text-rd-ink-2">Bogotá, tiene 900 L</span>
          </span>
        </p>

        <p className="font-rd m-0 mt-3 flex items-baseline gap-2 text-rd-12-5">
          <span className="h-2 w-2 shrink-0 translate-y-px rounded-full bg-rd-coral" />
          <span className="min-w-0">
            <b className="font-semibold text-rd-ink">45 familias en Siloé</b>
            <span className="block text-rd-11-5 text-rd-ink-2">Cali, necesitan 900 L</span>
          </span>
        </p>

        <p className="font-rd m-0 mt-3.5 flex items-center gap-1.5 border-t border-rd-line-soft pt-3 text-rd-12 font-semibold text-rd-ink">
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-rd-navy" />
          RaDAR los puso en contacto
        </p>
      </div>
    </Tarjeta>
  </Composicion>
);

/**
 * Paso 3, Monitorea. Responde: «¿cómo sé que llegó y que no se perdió por el camino?». Se ve el
 * acta de entrega con las dos firmas: la de quien entregó y la de quien recibió.
 */
export const LineaDeEntrega: React.FC = () => (
  <Composicion foto="/images/landing/monitorea.jpg" alt="Vecinos se pasan botellones de agua en fila mientras una mujer confirma la entrega en su teléfono.">
    <Tarjeta>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-rd m-0 font-mono text-rd-11-5 font-semibold tracking-wide text-rd-ink-2">RD-2026-BVU-014</p>
          <h4 className="font-rd m-0 mt-1.5 text-rd-16 leading-snug font-semibold text-rd-ink">Agua potable, 900 L</h4>
        </div>
        <span className="font-rd shrink-0 rounded-full bg-rd-navy-soft px-2.5 py-1 text-rd-11 font-semibold text-rd-navy">Entregada</span>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 border-t border-rd-line-soft pt-4">
        {[
          ['Entregó', 'Bomberos Voluntarios Usme'],
          ['Recibió', 'Junta de Acción Comunal, Siloé'],
          ['Fecha', '22 de septiembre, 4:10 p. m.'],
        ].map(([rotulo, valor]) => (
          <p key={rotulo} className="font-rd m-0 flex items-baseline justify-between gap-3 text-rd-12-5">
            <span className="shrink-0 text-rd-ink-meta">{rotulo}</span>
            <span className="truncate text-right font-medium text-rd-ink">{valor}</span>
          </p>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-rd-line-soft pt-4">
        <span className="rd-sello es-visible flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rd-navy-soft">
          <Check className="h-5 w-5 text-rd-navy" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="font-rd m-0 text-rd-12-5 font-semibold text-rd-ink">Confirmada por las dos partes</p>
          <p className="font-rd m-0 mt-0.5 flex items-center gap-1.5 text-rd-11-5 text-rd-ink-2">
            <Camera className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
            Con 4 fotos de la entrega
          </p>
        </div>
      </div>
    </Tarjeta>
  </Composicion>
);

/* ------------------------------------------------------------------ accesos ---- */

/** Radar: la unión entre dos organizaciones, dicha con nombres y cantidades, no con un arco. */
export const UnionOrganizaciones: React.FC = () => (
  <Lienzo className="flex flex-col gap-2">
    <div className="rounded-rd-md border border-rd-coral-soft bg-rd-coral-soft px-3.5 py-2.5">
      <p className="font-rd m-0 text-rd-13 font-semibold text-rd-coral-ink">45 familias sin agua</p>
      <p className="font-rd m-0 mt-0.5 text-rd-11-5 text-rd-ink-2">Siloé, Cali, necesitan 900 L</p>
    </div>

    <p className="font-rd m-0 flex items-center justify-center gap-1.5 py-0.5 text-rd-11-5 font-semibold text-rd-ink">
      <ArrowRight className="h-3.5 w-3.5 shrink-0 rotate-90 text-rd-navy" />
      Compatible
    </p>

    <div className="rounded-rd-md border border-rd-navy-line bg-rd-navy-soft px-3.5 py-2.5">
      <p className="font-rd m-0 text-rd-13 font-semibold text-rd-navy">Bomberos Usme</p>
      <p className="font-rd m-0 mt-0.5 text-rd-11-5 text-rd-ink-2">Bogotá, tienen 900 L listos</p>
    </div>
  </Lienzo>
);

/** Directorio: quién está respondiendo, con nombre y a qué se dedica. */
export const RedDeRespuesta: React.FC = () => (
  <Lienzo className="overflow-hidden rounded-rd-md border border-rd-line bg-rd-surface">
    {[
      ['Bomberos Voluntarios Usme', 'Cuerpo de socorro, Usme'],
      ['Cruz Roja seccional Bogotá', 'Cuerpo de socorro, Teusaquillo'],
      ['Fundación Manos Unidas', 'Fundación, Kennedy'],
    ].map(([nombre, detalle], i) => (
      <div key={nombre} className={`flex items-center gap-2.5 px-3.5 py-2.5 ${i ? 'border-t border-rd-line-soft' : ''}`}>
        <span className="font-rd flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rd-sunken text-rd-11 font-semibold text-rd-ink-2">
          {nombre.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="font-rd m-0 flex items-center gap-1 text-rd-12-5 font-semibold text-rd-ink">
            <span className="truncate">{nombre}</span>
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-rd-navy" />
          </p>
          <p className="font-rd m-0 mt-0.5 truncate text-rd-11 text-rd-ink-2">{detalle}</p>
        </div>
      </div>
    ))}
  </Lienzo>
);

/** Mi organización: la prueba de que la ayuda llegó y a cuánta gente. */
export const EntregaCertificada: React.FC = () => (
  <Lienzo className="rounded-rd-md border border-rd-line bg-rd-surface p-3.5">
    <p className="font-rd m-0 font-mono text-rd-11 font-semibold tracking-wide text-rd-ink-2">RD-2026-BVU-014</p>
    <p className="font-rd m-0 mt-1.5 text-rd-13 font-semibold text-rd-ink">Agua potable, 900 L</p>

    <div className="mt-3 flex items-center gap-2 rounded-rd-sm bg-rd-navy-soft px-2.5 py-2">
      <Check className="h-4 w-4 shrink-0 text-rd-navy" strokeWidth={2.5} />
      <span className="font-rd text-rd-11-5 font-semibold text-rd-navy">Entregada y confirmada</span>
    </div>

    <p className="font-rd m-0 mt-3 flex items-center gap-1.5 border-t border-rd-line-soft pt-3 text-rd-11-5 text-rd-ink-2">
      <Users className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
      <b className="font-semibold text-rd-ink">120 familias</b> atendidas
    </p>
  </Lienzo>
);
