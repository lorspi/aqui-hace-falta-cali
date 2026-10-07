import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ENTIDADES } from '../../../mocks/directorioMock';
import { EQUIPO } from '../../../mocks/panelMock';
import { azar, curva, espiral, ovalo, pasarPor, temblar, trazar, type Punto } from '../trazoAMano';

/**
 * «Tu punto en la red», el lienzo de la sección 5 (Alejandro, 7 de octubre de 2026, sobre la
 * propuesta: «ok»). La sección pedía sumarse y era la única de la landing donde no pasaba nada:
 * una foto con una ficha encima y los pilares en lista. Ahora es la red de quienes ya están en
 * RaDAR, y en el centro un lugar vacío que pregunta «¿Y tú?».
 *
 * - LA RED. Los nodos son gente de la herramienta, no inventada: las organizaciones y comunidades
 *   del Directorio (`ENTIDADES`), los líderes de esas comunidades con su nombre (`lider`) y los
 *   voluntarios del equipo del panel (`EQUIPO`) con su oficio. Se reparten parejos alrededor del
 *   centro, con azar con semilla (`constelacion`), y se unen a pulso en una sola red: el árbol más
 *   corto que pasa por todos y algunos atajos entre vecinos. Al llegar a la sección las uniones se
 *   dibujan, como los anillos del radar.
 * - EL CENTRO. Sin papel elegido, un anillo punteado que late: tu lugar. Al elegir uno
 *   (`rol`), cae ahí un punto amarillo, «tú», como el centro del radar de la sección 4.
 * - LAS TRES LÍNEAS. Desde «tú» salen a pulso tres líneas amarillas, una tras otra, hacia los tres
 *   nodos con los que ese papel trabaja (`destinosDe`, que los elige por tipo y por dirección):
 *   son los tres pilares de la sección, contados para ese papel, y llevan su número en la mitad.
 *   Al llegar, el nodo se enciende con un anillo y su nombre. Cambiar de papel las vuelve a
 *   dibujar.
 * - EL RESALTE. Pasar el cursor por un pilar de la lista, o por un nodo encendido, deja su línea
 *   al frente y apaga las otras (`resaltado`). Los nodos encendidos llevan `data-cursor-eco`: el
 *   cursor late sobre ellos, como sobre los ecos del radar.
 *
 * Todo lo que se lee aquí está también en la lista de la sección (los pilares y a quién llega cada
 * línea), así que el lienzo es una imagen con nombre y sus rótulos van ocultos al lector. Los
 * nombres solo se ven desde 640: en un teléfono no caben al lado de los nodos, y la lista los dice.
 * Con movimiento reducido todo aparece sin dibujarse.
 */

export type RolRed = 'organizacion' | 'lider' | 'voluntario';
type Clase = RolRed | 'comunidad';
type Nodo = { id: string; clase: Clase; nombre: string; detalle: string; x: number; y: number };
export type NodoRed = Nodo;

/* El lienzo es vertical desde el 7 de octubre de 2026: del alto del bloque blanco que lo lleva en la
   sección 5, que antes quedaba vacío arriba y abajo de una red cuadrada (Alejandro: «en el centro
   de esa "card" o bloque hay un par de lineas conectadas... pero el resto del mismo lienzo queda en
   blanco completamente»). */
const ANCHO = 600;
const ALTO = 860;
const CX = ANCHO / 2;
const CY = ALTO / 2;
const CENTRO: Punto = { x: CX, y: CY };
/* Las tres líneas salen una tras otra; el nodo se enciende cuando su línea llega. */
const PAUSA = 0.3;
const ESPERA = 0.2;
const LLEGADA = 0.7;

const ORGANIZACIONES = ENTIDADES.filter((e) => e.clase === 'organizacion').map((e) => ({ id: e.id, clase: 'organizacion' as const, nombre: e.nombre, detalle: e.tipo }));
/* Las comunidades con una persona al frente («Rosa Angulo, presidenta de la JAC») entran como
   líderes, con su nombre; las que lleva un comité, como comunidad. */
const LIDERES = ENTIDADES.filter((e) => e.clase === 'comunidad' && (e.lider ?? '').includes(',')).map((e) => ({
  id: `lider-${e.id}`,
  clase: 'lider' as const,
  nombre: (e.lider ?? '').split(',')[0],
  detalle: e.nombre,
}));
const COMUNIDADES = ENTIDADES.filter((e) => e.clase === 'comunidad' && !(e.lider ?? '').includes(',')).map((e) => ({ id: e.id, clase: 'comunidad' as const, nombre: e.nombre, detalle: e.tipo }));
const VOLUNTARIOS = EQUIPO.map((m) => ({ id: `voluntario-${m.id}`, clase: 'voluntario' as const, nombre: m.n, detalle: m.rol }));

/* Intercalados (organización, líder, voluntario, organización, comunidad…) para que ningún lado
   de la red sea de un solo tipo. */
const intercalar = () => {
  const colas = [[...ORGANIZACIONES], [...LIDERES], [...VOLUNTARIOS], [...COMUNIDADES]];
  const patron = [0, 1, 2, 0, 3];
  const lista: Omit<Nodo, 'x' | 'y'>[] = [];
  for (let k = 0; colas.some((c) => c.length); k++) {
    const cola = colas[patron[k % patron.length]];
    const siguiente = cola.shift() ?? colas.find((c) => c.length)?.shift();
    if (siguiente) lista.push(siguiente);
  }
  return lista;
};

/* Una constelación: puntos al azar (con semilla) en el anillo entre el 30 % y el borde de una elipse
   del alto del lienzo, cuyo centro queda libre para «tú»; ninguno a menos de 74 de otro ni pegado
   al borde, así se reparten parejos por todo el lienzo. Repartidos en franjas o en una vuelta
   ordenada, la red salía como una estrella geométrica; con menos espacio entre puntos, en islas. */
const constelacion = (cuantos: number) => {
  const al = azar(29);
  const puestos: Punto[] = [];
  for (let intento = 0; puestos.length < cuantos && intento < 60000; intento++) {
    const a = al() * Math.PI * 2;
    const f = Math.sqrt(0.09 + al() * 0.91);
    const p = { x: CX + f * 270 * Math.cos(a), y: CY + f * 400 * Math.sin(a) };
    if (p.x < 40 || p.x > ANCHO - 40 || p.y < 40 || p.y > ALTO - 40) continue;
    if (puestos.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > 74)) puestos.push(p);
  }
  return puestos;
};
export const NODOS: Nodo[] = (() => {
  const lista = intercalar();
  const puestos = constelacion(lista.length);
  return lista.map((n, k) => ({ ...n, ...puestos[k] }));
})();

/* Una línea a pulso entre dos puntos, un poco curvada hacia un lado. */
const unir = (a: Punto, b: Punto, curvatura: number, puntos: number, temblor: number, semilla: () => number) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const nx = -dy * curvatura;
  const ny = dx * curvatura;
  return curva(a, { x: a.x + dx / 3 + nx, y: a.y + dy / 3 + ny }, { x: a.x + (2 * dx) / 3 + nx * 0.4, y: a.y + (2 * dy) / 3 + ny * 0.4 }, b, puntos, temblor, semilla);
};

/* La red, en una sola línea que pasa por todos los nodos (Alejandro, 7 de octubre de 2026, sobre
   las ilustraciones: «una sola linea hace toda la ilustración completa como si "no se despegara el
   lapiz del papel"»; antes eran uniones sueltas entre vecinos). El orden es un recorrido corto: se
   empieza por el nodo de más arriba, se va siempre al más cercano que falte, y después se
   deshacen los cruces (2-opt), así la línea serpentea por el lienzo sin enredarse. Un tramo que
   pasara por el centro cuesta el doble: ese lugar es de «tú». */
const RED = (() => {
  const n = NODOS.length;
  const costo = (i: number, j: number) => {
    const a = NODOS[i];
    const b = NODOS[j];
    const pasaPorElCentro = Math.hypot((a.x + b.x) / 2 - CX, (a.y + b.y) / 2 - CY) < 120;
    return Math.hypot(a.x - b.x, a.y - b.y) * (pasaPorElCentro ? 2 : 1);
  };
  const orden = [NODOS.reduce((m, p, i) => (p.y < NODOS[m].y ? i : m), 0)];
  while (orden.length < n) {
    const ultimo = orden[orden.length - 1];
    let mejor = -1;
    for (let j = 0; j < n; j++) if (!orden.includes(j) && (mejor < 0 || costo(ultimo, j) < costo(ultimo, mejor))) mejor = j;
    orden.push(mejor);
  }
  for (let vuelta = 0, mejoro = true; mejoro && vuelta < 40; vuelta++) {
    mejoro = false;
    for (let i = 0; i < n - 2; i++) {
      for (let k = i + 2; k < n - 1; k++) {
        const antes = costo(orden[i], orden[i + 1]) + costo(orden[k], orden[k + 1]);
        const despues = costo(orden[i], orden[k]) + costo(orden[i + 1], orden[k + 1]);
        if (despues < antes - 0.5) {
          orden.splice(i + 1, k - i, ...orden.slice(i + 1, k + 1).reverse());
          mejoro = true;
        }
      }
    }
  }
  return trazar(temblar(pasarPor(orden.map((i) => NODOS[i]), 18), 1.4, azar(53)));
})();

/* Con quién trabaja cada papel, en el orden de los pilares (01 cero duplicidad, 02 tus
   habilidades, 03 datos abiertos): qué tipo de nodo y hacia dónde (grados desde la derecha, en el
   sentido del reloj). Se toma el nodo de ese tipo más cerca de esa dirección: así las tres líneas
   abren hacia lados distintos, sea cual sea la red. Con ids fijos, dos caían juntos y sus líneas
   se montaban. */
const PAPELES: Record<RolRed, { clase: Clase; hacia: number }[]> = {
  organizacion: [
    { clase: 'lider', hacia: -60 },
    { clase: 'voluntario', hacia: 180 },
    { clase: 'lider', hacia: 60 },
  ],
  lider: [
    { clase: 'organizacion', hacia: -120 },
    { clase: 'voluntario', hacia: 0 },
    { clase: 'organizacion', hacia: 120 },
  ],
  voluntario: [
    { clase: 'lider', hacia: -90 },
    { clase: 'organizacion', hacia: 30 },
    { clase: 'organizacion', hacia: 150 },
  ],
};
export const destinosDe = (rol: RolRed): NodoRed[] => {
  const usados = new Set<string>();
  const lejos = (n: Nodo, hacia: number) => Math.abs(((((Math.atan2(n.y - CY, n.x - CX) * 180) / Math.PI - hacia) % 360) + 540) % 360 - 180);
  return PAPELES[rol].flatMap(({ clase, hacia }) => {
    const n = NODOS.filter((x) => x.clase === clase && !usados.has(x.id)).sort((a, b) => lejos(a, hacia) - lejos(b, hacia))[0];
    if (!n) return [];
    usados.add(n.id);
    return [n];
  });
};

const an = azar(61);
const NODO = trazar(ovalo({ x: 0, y: 0 }, 5.5, 5.5, an, 24, 1.4), true);
const ANILLO = trazar(ovalo({ x: 0, y: 0 }, 15, 15, an, 40, 1.4), true);
const TU = trazar(ovalo({ x: 0, y: 0 }, 9, 9, an, 32, 1.3), true);
const TU_ONDA = trazar(ovalo({ x: 0, y: 0 }, 14, 14, an, 40, 1.4), true);
/* Tu lugar: una espiral pequeña, en la misma línea continua que el resto. */
const LUGAR = trazar(temblar(espiral({ x: 0, y: 0 }, 4, 26, 2.4, 0, 1, 40), 0.6, an));

/* Dónde va el nombre de un nodo: del lado de afuera, lejos del centro, para no tapar la línea que
   llega desde «tú». De lado si el nodo está más a un lado que arriba o abajo y el nombre cabe en
   el lienzo; si no, encima o debajo, pegado al borde que tenga más cerca. El lienzo mide unos 560
   px de ancho desde 640, así que sus unidades son casi píxeles. */
const ANCHO_ROTULO = 210;
const rotuloEn = (n: Nodo): React.CSSProperties => {
  const dx = n.x - CX;
  const dy = n.y - CY;
  const lugar = { left: `${(n.x / ANCHO) * 100}%`, top: `${(n.y / ALTO) * 100}%` };
  if (Math.abs(dx) > Math.abs(dy) * 0.8) {
    const derecha = dx > 0;
    const cabe = derecha ? n.x + 20 + ANCHO_ROTULO <= ANCHO : n.x - 20 - ANCHO_ROTULO >= 0;
    if (cabe) return { ...lugar, transform: derecha ? 'translate(20px, -50%)' : 'translate(calc(-100% - 20px), -50%)' };
  }
  const x = n.x < 120 ? '-14px' : n.x > ANCHO - 120 ? 'calc(-100% + 14px)' : '-50%';
  return { ...lugar, transform: `translate(${x}, ${dy > 0 ? '20px' : 'calc(-100% - 20px)'})` };
};

export const RedSumarse: React.FC<{
  rol: RolRed | null;
  /** Los ids de los tres nodos con los que trabaja el papel elegido, en el orden de los pilares. */
  destinos: string[];
  /** El pilar al frente (0, 1 o 2), o ninguno. */
  resaltado: number | null;
  onResaltar: (pilar: number | null) => void;
  textos: { etiqueta: string; tu: string; tuLugar: string };
}> = ({ rol, destinos, resaltado, onResaltar, textos }) => {
  const caja = useRef<HTMLDivElement>(null);
  const [dibujado, setDibujado] = useState(false);

  useEffect(() => {
    const el = caja.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setDibujado(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setDibujado(true);
        io.disconnect();
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Las tres líneas del papel elegido, con su punto medio para el número. */
  const lineas = useMemo(
    () =>
      destinos
        .map((id) => NODOS.find((n) => n.id === id))
        .filter((n): n is Nodo => Boolean(n))
        .map((n, i) => {
          const pts = unir(CENTRO, n, i % 2 ? -0.14 : 0.14, 40, 1.5, azar(71 + i));
          return { nodo: n, d: trazar(pts), medio: pts[20] };
        }),
    [destinos],
  );
  const encendido = (i: number) => resaltado === null || resaltado === i;
  const llega = (i: number) => `${ESPERA + i * PAUSA + LLEGADA}s`;

  return (
    <div ref={caja} role="img" aria-label={textos.etiqueta} className="relative mx-auto aspect-30/43 w-full max-w-140">
      <svg aria-hidden="true" viewBox={`0 0 ${ANCHO} ${ALTO}`} className="absolute inset-0 h-full w-full overflow-visible">
        {/* La red que ya existe, una sola línea que se dibuja al llegar. */}
        <path
          d={RED}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={dibujado ? 0 : 1}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="rd-radar-trazo fill-none stroke-rd-noche-linea"
          style={{ transitionDuration: '3s' }}
        />

        {/* Las tres líneas de quien se suma. */}
        {rol &&
          lineas.map((l, i) => (
            <path
              key={`${rol}-${l.nodo.id}`}
              d={l.d}
              pathLength={1}
              strokeDasharray="1 1"
              strokeWidth={resaltado === i ? 2.75 : 1.75}
              strokeLinecap="round"
              className="rd-red-traza fill-none stroke-rd-ayuda transition-opacity duration-200"
              style={{ animationDelay: `${ESPERA + i * PAUSA}s`, opacity: encendido(i) ? 1 : 0.3 }}
            />
          ))}

        {/* Los nodos; los que reciben una línea, encendidos. */}
        {NODOS.map((n) => {
          const k = rol ? lineas.findIndex((l) => l.nodo.id === n.id) : -1;
          const destino = k >= 0;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`}
              {...(destino ? { 'data-cursor-eco': '', onMouseEnter: () => onResaltar(k), onMouseLeave: () => onResaltar(null) } : {})}
            >
              {destino && <circle r={24} fill="transparent" />}
              <path
                d={NODO}
                className={`transition-[fill,opacity] duration-500 ${destino ? 'fill-rd-noche-tinta' : 'fill-rd-noche-meta'}`}
                style={{ opacity: dibujado ? (destino ? 1 : 0.6) : 0 }}
              />
              {destino && (
                <path
                  key={`${rol}-anillo`}
                  d={ANILLO}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  className="rd-red-aparece fill-none stroke-rd-ayuda transition-opacity duration-200"
                  style={{ animationDelay: llega(k), opacity: encendido(k) ? 1 : 0.3 }}
                />
              )}
            </g>
          );
        })}

        {/* El centro: tu lugar, o tú. */}
        <g transform={`translate(${CX} ${CY})`}>
          {rol ? (
            <g key={rol}>
              <path d={TU_ONDA} strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="rd-encuentro-onda fill-none stroke-rd-ayuda" style={{ animationDuration: '2.4s' }} />
              <path d={TU} className="rd-red-aparece fill-rd-ayuda" />
            </g>
          ) : (
            <>
              <path d={LUGAR} strokeWidth={1.25} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="fill-none stroke-rd-noche-meta" />
              <path d={TU_ONDA} strokeWidth={1.25} vectorEffect="non-scaling-stroke" className="rd-encuentro-onda fill-none stroke-rd-noche-meta" style={{ animationDuration: '3s' }} />
            </>
          )}
        </g>
      </svg>

      {/* Lo que se escribe sobre el lienzo, en HTML para que no se encoja con él. */}
      <span
        aria-hidden="true"
        className={`font-rd pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-9 text-rd-13-5 font-semibold whitespace-nowrap ${rol ? 'text-rd-ayuda' : 'text-rd-noche-meta'}`}
      >
        {rol ? textos.tu : textos.tuLugar}
      </span>

      {rol &&
        lineas.map((l, i) => (
          <React.Fragment key={`${rol}-${l.nodo.id}-rotulos`}>
            <span
              aria-hidden="true"
              className="rd-red-etiqueta font-rd pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-rd-ayuda text-rd-12 font-semibold text-rd-noche tabular-nums transition-opacity duration-200"
              style={{ left: `${(l.medio.x / ANCHO) * 100}%`, top: `${(l.medio.y / ALTO) * 100}%`, animationDelay: `${ESPERA + i * PAUSA + 0.35}s`, opacity: encendido(i) ? undefined : 0.3 }}
            >
              {i + 1}
            </span>
            <span
              aria-hidden="true"
              className="rd-red-etiqueta font-rd pointer-events-none absolute hidden max-w-52 rounded-rd-md border border-rd-noche-linea bg-rd-noche-2 px-2.5 py-1.5 transition-opacity duration-200 sm:block"
              style={{ ...rotuloEn(l.nodo), animationDelay: llega(i), opacity: encendido(i) ? undefined : 0.3 }}
            >
              <span className="block truncate text-rd-12-5 font-semibold text-rd-noche-tinta">{l.nodo.nombre}</span>
              <span className="block truncate text-rd-11-5 text-rd-noche-meta">{l.nodo.detalle}</span>
            </span>
          </React.Fragment>
        ))}
    </div>
  );
};
