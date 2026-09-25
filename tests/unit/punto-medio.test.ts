import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * El punto medio (·) no aparece en ningún texto de la maqueta. Alejandro lo prohibió el 16 de
 * septiembre de 2026 («demasiado AI») y el 24 se barrió lo que quedaba: donde separaba dos
 * datos que se pintan va el `Divisor`, y donde el texto es plano va una coma, una preposición
 * o un punto.
 *
 * El manual de estilo del prototipo lo admite en su §6; manda la decisión de Alejandro y esa
 * contradicción queda anotada aquí, que es el repo que manda.
 *
 * La guarda recorre la fuente en vez de probar función por función: el carácter se cuela en
 * datos simulados, en plantillas y en JSX, y ninguna prueba unitaria los ve todos.
 */

/* Lo nuestro. `features/` y los componentes sueltos de `components/` son del equipo de
   desarrollo y no se tocan sin que un plan lo nombre. */
const NUESTRO = ['src/components/ui', 'src/pages', 'src/utils', 'src/mocks', 'src/types'];

/* `replace(/[·,]/g, ' ')` limpia el carácter para sacar iniciales: lo quita, no lo escribe. */
const LIMPIEZA = /replace\(\/\[·/;

function archivos(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return archivos(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

function esComentario(linea: string): boolean {
  const l = linea.trim();
  return l.startsWith('*') || l.startsWith('/*') || l.startsWith('//');
}

describe('el punto medio no vuelve', () => {
  it('no aparece en ninguna línea de código de la maqueta', () => {
    const culpables: string[] = [];
    NUESTRO.flatMap(archivos).forEach((f) => {
      fs.readFileSync(f, 'utf-8')
        .split('\n')
        .forEach((linea, i) => {
          if (!linea.includes('·')) return;
          if (esComentario(linea) || LIMPIEZA.test(linea)) return;
          culpables.push(`${f}:${i + 1}  ${linea.trim().slice(0, 100)}`);
        });
    });
    expect(culpables).toEqual([]);
  });

  it('cubre de verdad la fuente, no una lista vacía', () => {
    const total = NUESTRO.flatMap(archivos).length;
    expect(total).toBeGreaterThan(40);
  });
});
