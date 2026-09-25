import React from 'react';

/**
 * La tabla del panel (`rd-tabla` del prototipo, decisión 184): desde 1280 es una tabla de
 * verdad —rótulos en tipografía normal y en tinta (Alejandro, 25 de septiembre de 2026: el
 * mismo trato que los títulos de las columnas del tablero; antes iban en mayúscula pequeña y
 * gris), filas con línea suave, cifras a la derecha, acciones
 * a la derecha—; por debajo, cada fila es una tarjeta: el título a lo ancho (15/600) con su
 * meta debajo y, si hay estado, el chip a su derecha en la misma línea; las demás celdas a
 * media fila con el rótulo encima del valor; una celda con control o barra ocupa la fila
 * entera; las acciones son el pie, con línea arriba, a la derecha (bajo 640 reparten el ancho).
 */
export interface Columna<T> {
  k: string;
  etiqueta: string;
  celda: (fila: T) => React.ReactNode;
  /** Cifra: a la derecha en la tabla. */
  num?: boolean;
  /** El chip de estado: junto al título en la tarjeta. */
  estado?: boolean;
  /** Control o barra: la fila entera en la tarjeta. */
  ancha?: boolean;
  /** Las acciones: el pie de la tarjeta. */
  acc?: boolean;
}

export interface TablaProps<T> {
  columnas: Columna<T>[];
  filas: T[];
  clave: (fila: T) => string | number;
  /** Nombre de la tabla para tecnologías de apoyo. */
  etiqueta: string;
  /** Bajo 1280, una tarjeta propia por fila en vez de la genérica (p. ej. `TarjetaEntrega`,
   *  para que las entregas se vean igual en todo el panel). */
  tarjeta?: (fila: T) => React.ReactNode;
}

export function Tabla<T>({ columnas, filas, clave, etiqueta, tarjeta }: TablaProps<T>) {
  const conEstado = columnas.some((c) => c.estado);
  if (tarjeta) {
    return (
      <>
        <div className="flex flex-col gap-3 xl:hidden">
          {filas.map((f) => (
            <React.Fragment key={clave(f)}>{tarjeta(f)}</React.Fragment>
          ))}
        </div>
        <div className="max-xl:hidden">
          <Tabla columnas={columnas} filas={filas} clave={clave} etiqueta={etiqueta} />
        </div>
      </>
    );
  }
  return (
    <table aria-label={etiqueta} className="w-full border-collapse text-rd-13 max-xl:block">
      <thead className="max-xl:hidden">
        <tr>
          {columnas.map((c) => (
            <th key={c.k} scope="col" className={`font-rd border-b border-rd-line px-2 pb-2 text-left text-rd-13 font-semibold whitespace-nowrap text-rd-ink ${c.num ? 'text-right' : ''}`}>
              {c.acc ? <span className="sr-only">{c.etiqueta}</span> : c.etiqueta}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="max-xl:flex max-xl:flex-col max-xl:gap-3">
        {filas.map((f) => (
          <tr key={clave(f)} className="group max-xl:grid max-xl:grid-cols-2 max-xl:items-start max-xl:gap-3 max-sm:gap-2.5 max-xl:rounded-rd-xl max-xl:border max-xl:border-rd-line max-xl:bg-rd-surface max-xl:p-4 max-sm:p-3.5 max-sm:shadow-2xs xl:hover:bg-rd-fondo">
            {columnas.map((c, i) => {
              const titulo = i === 0;
              const clases = [
                'xl:border-b xl:border-rd-line-soft xl:px-2 xl:py-3 xl:align-middle group-last:xl:border-b-0',
                'max-xl:block max-xl:min-w-0 max-xl:wrap-anywhere',
                titulo ? (conEstado ? 'max-xl:order-first max-xl:col-span-1 max-xl:text-rd-15' : 'max-xl:order-first max-xl:col-span-2 max-xl:text-rd-15') : '',
                c.estado ? 'max-xl:-order-1 max-xl:col-span-1 max-xl:justify-self-end' : '',
                c.ancha ? 'max-xl:col-span-2' : '',
                c.num ? 'xl:text-right xl:tabular-nums' : '',
                /* El `td` nunca lleva `flex`: eso lo saca del formato de tabla y la columna se
                   desborda. Desde 1280 el flex va en un envoltorio por dentro (abajo); aquí solo
                   se alinea la celda. */
                c.acc ? 'xl:text-right xl:whitespace-nowrap max-xl:col-span-2 max-xl:mt-1 max-xl:flex max-xl:flex-wrap max-xl:items-center max-xl:gap-1.5 max-xl:border-t max-xl:border-rd-line-soft max-xl:pt-2' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <td key={c.k} className={clases}>
                  {!titulo && !c.estado && !c.acc && <span className="mb-1 block text-rd-11-5 font-medium text-rd-ink-meta xl:hidden">{c.etiqueta}</span>}
                  {/* Desde 1280 las acciones van en un envoltorio flex: centra los botones por
                      su eje y no por la línea base del texto, que es lo que los descolgaba en
                      una fila alta (Alejandro, 25 de septiembre de 2026). Bajo 1280 el `td` ya
                      es flex y este envoltorio se deshace (`contents`).
                      `inline-flex` y no `flex`: con `flex` la celda dejaba de reclamar el ancho
                      de sus botones, la tabla le daba una columna estrecha y el contenido se
                      salía de la fila. En línea conserva el ancho intrínseco de antes, y el
                      `shrink-0` evita que el ⋮ salga más angosto que alto. */}
                  {c.acc ? <span className="contents xl:inline-flex xl:items-center xl:gap-1.5 xl:align-middle xl:[&>*]:shrink-0">{c.celda(f)}</span> : c.celda(f)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
