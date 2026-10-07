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

/** Un óvalo a pulso: el radio sube y baja con tres ondas. `fuerza` las agranda. */
export const ovalo = (c: Punto, rx: number, ry: number, al: () => number, n = 90, fuerza = 1): Punto[] => {
  const ondas = [2, 3, 5].map((k) => ({ k, alto: (0.015 + al() * 0.025) * fuerza, fase: al() * Math.PI * 2 }));
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const f = 1 + ondas.reduce((s, o) => s + o.alto * Math.sin(o.k * t + o.fase), 0);
    return { x: c.x + rx * f * Math.cos(t), y: c.y + ry * f * Math.sin(t) };
  });
};
