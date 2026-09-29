import React from 'react';
import { Check } from 'lucide-react';
import { Parrafo, Rotulo, Seccion, Titular } from './base';

/**
 * El bloque que la referencia repite en toda la página y que aquí reemplaza a las tarjetas de
 * «¿Cómo funciona?»: rótulo gris pequeño, titular grande cuya segunda línea baja a gris,
 * párrafo, lista de puntos con palomita fina, y a un lado la pieza visual.
 *
 * Se escribió genérico a propósito. En la referencia «Human-like voice agents», «Trained for
 * the real world» y «Smart, without the wait» son el mismo bloque con otro contenido; los tres
 * pasos de RaDAR son el mismo caso. Antes cada paso era una tarjeta distinta dentro de un
 * componente de 597 líneas con auras, desenfoques y filigranas.
 *
 * `lado` alterna la columna del visual, como hace la referencia al bajar por la página.
 */
export const SeccionCaracteristica: React.FC<{
  id?: string;
  rotulo: string;
  titulo: string;
  apagado?: string;
  texto: string;
  puntos: string[];
  visual: React.ReactNode;
  lado?: 'izquierda' | 'derecha';
}> = ({ id, rotulo, titulo, apagado, texto, puntos, visual, lado = 'derecha' }) => (
  <Seccion id={id}>
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
      <div className={lado === 'izquierda' ? 'lg:order-2' : ''}>
        <Rotulo>{rotulo}</Rotulo>
        <Titular apagado={apagado} className="mt-3">
          {titulo}
        </Titular>
        <Parrafo className="mt-6 max-w-xl">{texto}</Parrafo>

        <ul className="mt-8 flex list-none flex-col gap-3 p-0">
          {puntos.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <Check aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rd-ink-3" />
              <span className="font-rd text-rd-15 leading-relaxed text-rd-ink sm:text-rd-16">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`min-w-0 ${lado === 'izquierda' ? 'lg:order-1' : ''}`}>{visual}</div>
    </div>
  </Seccion>
);
