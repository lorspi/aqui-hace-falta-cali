/**
 * El trazo a pulso de la landing: las piezas con que se dibujan las líneas, los óvalos y las rutas
 * que tiemblan como hechas a mano, sin filtros (un trazado quieto no cuesta nada al repintar).
 * Nacieron dentro de `LienzoEncuentro` (la sección 3) y salieron aquí el 7 de octubre de 2026,
 * cuando la sección 4 las necesitó también: hoy las usa su radar (`RadarEnVivo`).
 *
 * Todo el azar lleva semilla (`azar`): el mismo dibujo en cada carga y en cada navegador.
 */

export type Punto = { x: number; y: number };

/** Un azar con semilla (Park–Miller). Cada llamada al que devuelve da el siguiente número, de 0 a 1. */
export const azar = (semilla: number) => {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

/** El atributo `d` de una línea por esos puntos, cerrada si se pide. */
export const trazar = (pts: Punto[], cerrado = false) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('') + (cerrado ? 'Z' : '');

/** Una curva cúbica con temblor a pulso: dos ondas perpendiculares a la curva, una larga y una
 *  corta, de fase al azar. `n` puntos más uno y `alto` el desvío de la onda larga. */
export const curva = (p0: Punto, p1: Punto, p2: Punto, p3: Punto, n: number, alto: number, al: () => number): Punto[] => {
  const ondas = [
    { k: 2 + al() * 2, fase: al() * Math.PI * 2, alto },
    { k: 7 + al() * 5, fase: al() * Math.PI * 2, alto: alto * 0.35 },
  ];
  const pts: Punto[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
    const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
    const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    const largo = Math.hypot(dx, dy) || 1;
    const desvio = ondas.reduce((s, o) => s + o.alto * Math.sin(o.k * Math.PI * 2 * t + o.fase), 0);
    pts.push({ x: x - (dy / largo) * desvio, y: y + (dx / largo) * desvio });
  }
  return pts;
};

/* ======================================================================
   LA LÍNEA CONTINUA (7 de octubre de 2026)
   Alejandro: «una ilustración de una sola linea, o sea una sola linea hace toda la ilustración
   completa como si "no se despegara el lapiz del papel". y me gustaría que los otros elementos que
   son de "dibujo" en la landing funcionenes igual». Las piezas de abajo arman ese trazo: una curva
   suave que pasa por unos puntos de paso (`pasarPor`), con espirales donde el dibujo da vueltas
   (`espiral`: los anillos y las curvas de nivel en una sola línea), y un temblor parejo a lo largo
   de toda la línea (`temblar`), que no depende de cuántos puntos tenga cada tramo.
   ====================================================================== */

/** Una curva suave (Catmull–Rom) que pasa por todos los puntos, `porTramo` puntos entre cada par.
 *  Un punto repetido deja un quiebre: así se marcan las puntas. */
export const pasarPor = (pts: Punto[], porTramo = 14): Punto[] => {
  const out: Punto[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < porTramo; k++) {
      const t = k / porTramo;
      const t2 = t * t;
      const t3 = t2 * t;
      const eje = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: eje(p0.x, p1.x, p2.x, p3.x), y: eje(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

/** Una espiral de `c` hacia afuera (o hacia adentro si `r1` < `r0`), de `vueltas` vueltas desde el
 *  ángulo `desde` (grados, en el sentido del reloj), achatada en `ry` / `rx`. */
export const espiral = (c: Punto, r0: number, r1: number, vueltas: number, desde = 0, achate = 1, porVuelta = 48): Punto[] => {
  const n = Math.max(2, Math.round(vueltas * porVuelta));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = ((desde + t * vueltas * 360) * Math.PI) / 180;
    const r = r0 + (r1 - r0) * t;
    return { x: c.x + r * Math.cos(a), y: c.y + r * achate * Math.sin(a) };
  });
};

/** El temblor a pulso a lo largo de una línea: dos ondas perpendiculares medidas por la distancia
 *  recorrida (una larga de unos 140 px y una corta de unos 38), así tiembla igual en un tramo largo
 *  que en uno corto. `alto` es el desvío de la larga. */
export const temblar = (pts: Punto[], alto: number, al: () => number): Punto[] => {
  const fases = [al() * Math.PI * 2, al() * Math.PI * 2];
  let s = 0;
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    if (i > 0) s += Math.hypot(p.x - a.x, p.y - a.y);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const largo = Math.hypot(dx, dy) || 1;
    const desvio = alto * Math.sin((s / 140) * Math.PI * 2 + fases[0]) + alto * 0.35 * Math.sin((s / 38) * Math.PI * 2 + fases[1]);
    return { x: p.x - (dy / largo) * desvio, y: p.y + (dx / largo) * desvio };
  });
};

/** Un óvalo a pulso: el radio sube y baja con tres ondas. `fuerza` las agranda. */
export const ovalo = (c: Punto, rx: number, ry: number, al: () => number, n = 90, fuerza = 1): Punto[] => {
  const ondas = [2, 3, 5].map((k) => ({ k, alto: (0.015 + al() * 0.025) * fuerza, fase: al() * Math.PI * 2 }));
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const f = 1 + ondas.reduce((s, o) => s + o.alto * Math.sin(o.k * t + o.fase), 0);
    return { x: c.x + rx * f * Math.cos(t), y: c.y + ry * f * Math.sin(t) };
  });
};
