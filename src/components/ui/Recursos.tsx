import { Barra } from './Barra';
import React, { useId, useState } from 'react';
import { BadgeCheck, ChevronDown, Droplet, Hammer, House, Package, Pill, Shirt, Shovel, Soup, Stethoscope, Truck, Zap } from 'lucide-react';
import { ICONO_ITEM, TAXONOMIA } from '../../mocks/publicacionesMock';
import type { IconoRecurso, Publicacion, Recurso } from '../../types/publicacion';
import { estadoRecurso, porcentaje, restante } from '../../utils/publicaciones';

/**
 * El bloque de recursos de una publicación (`rd-recursos` del prototipo): cabecera que
 * pliega, resumen con un anillo por recurso y, abierto, una fila por recurso con su barra
 * (verde = entregado y confirmado, ámbar rayado = en camino, lo vacío = disponible para
 * actuar) y su ficha. Las cifras salen de `utils/publicaciones.ts`; nadie escribe una a mano.
 */
const ICONO: Record<IconoRecurso, React.ReactNode> = {
  bowl: <Soup className="h-3.75 w-3.75" />,
  stetho: <Stethoscope className="h-3.75 w-3.75" />,
  shovel: <Shovel className="h-3.75 w-3.75" />,
  hammer: <Hammer className="h-3.75 w-3.75" />,
  truck: <Truck className="h-3.75 w-3.75" />,
  package: <Package className="h-3.75 w-3.75" />,
  seal: <BadgeCheck className="h-3.75 w-3.75" />,
  house: <House className="h-3.75 w-3.75" />,
  drop: <Droplet className="h-3.75 w-3.75" />,
  shirt: <Shirt className="h-3.75 w-3.75" />,
  pill: <Pill className="h-3.75 w-3.75" />,
  bolt: <Zap className="h-3.75 w-3.75" />,
};

export function categoriaDe(item: string) {
  return TAXONOMIA.find((c) => c.items.includes(item)) ?? null;
}
export function iconoDe(item: string): IconoRecurso {
  return ICONO_ITEM[item] ?? categoriaDe(item)?.icono ?? 'package';
}

const COMPONENTE: Record<IconoRecurso, React.ElementType> = { bowl: Soup, stetho: Stethoscope, shovel: Shovel, hammer: Hammer, truck: Truck, package: Package, seal: BadgeCheck, house: House, drop: Droplet, shirt: Shirt, pill: Pill, bolt: Zap };

/** El icono de un recurso o de una categoría, al tamaño que pida quien lo usa. Decorativo. */
export const IconoRecursoDe: React.FC<{ nombre: IconoRecurso; className?: string }> = ({ nombre, className = 'h-4 w-4' }) => {
  const C = COMPONENTE[nombre];
  return <C aria-hidden="true" className={className} />;
};

/** Anillo de 32 con el mismo progreso que el pin y que la barra. */
export const Anillo: React.FC<{ recurso: Recurso }> = ({ recurso }) => {
  const hecho = porcentaje(recurso, 'hecho');
  const camino = porcentaje(recurso, 'camino');
  const completo = restante(recurso) === 0;
  return (
    <span className="relative h-8 w-8 shrink-0">
      <svg className="absolute inset-0 h-8 w-8" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="13" fill="none" strokeWidth="3" className="stroke-rd-track" />
        {hecho > 0 && <circle cx="16" cy="16" r="13" fill="none" strokeWidth="3" pathLength={100} strokeDasharray={`${hecho} 100`} transform="rotate(-90 16 16)" className="stroke-rd-green" />}
        {camino > 0 && <circle cx="16" cy="16" r="13" fill="none" strokeWidth="3" pathLength={100} strokeDasharray={`${camino} 100`} strokeDashoffset={-hecho} transform="rotate(-90 16 16)" className="stroke-rd-amber" />}
      </svg>
      <span aria-hidden="true" className={`absolute top-1/2 left-1/2 flex h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center ${completo ? 'text-rd-green' : 'text-rd-ink-2'}`}>
        {ICONO[iconoDe(recurso.item)]}
      </span>
    </span>
  );
};

import { useTranslation } from '../../i18n/LanguageContext';

/** Barra de 8 px: lo hecho en verde, lo en camino en ámbar rayado, lo vacío es lo que queda. */
export const BarraRecurso: React.FC<{ recurso: Recurso; tipo: Publicacion['tipo'] }> = ({ recurso, tipo }) => {
  const { tItem, tResourceStatus } = useTranslation();
  const hecho = porcentaje(recurso, 'hecho');
  const camino = porcentaje(recurso, 'camino');
  return (
    <Barra
      etiqueta={`${tItem(recurso.item)}: ${tResourceStatus(recurso, tipo)}`}
      tramos={[
        { tono: 'confirmada', porcentaje: hecho },
        { tono: 'camino', porcentaje: camino },
      ]}
    />
  );
};

export interface RecursosProps {
  publicacion: Publicacion;
  /** Abierto de entrada (por ejemplo, en la hoja del pin). */
  abierto?: boolean;
  /** Solo las filas con su barra, sin cabecera que pliegue ni resumen de anillos
   *  (`rd-recursos--fijo`): en el Directorio, donde el rótulo «Ofrece» / «Pide» ya lo pone la
   *  fila y no hay resumen corto que plegar. */
  soloFilas?: boolean;
  /** Si debe mostrar todos los recursos en la vista resumida sin compactar con "+N más". */
  mostrarTodos?: boolean;
  className?: string;
}

export const Recursos: React.FC<RecursosProps> = ({ publicacion: p, abierto: abiertoInicial = false, soloFilas = false, mostrarTodos = false, className = 'mb-4' }) => {
  const { t, tItem, tCategory, tResourceStatus } = useTranslation();
  const [abierto, setAbierto] = useState(abiertoInicial || soloFilas);
  const [expandirResumen, setExpandirResumen] = useState(false);
  const id = useId();
  const esOferta = p.tipo === 'oferta';

  const tieneMuchos = p.recursos.length > 2;
  const recursosVisibles = mostrarTodos || expandirResumen || !tieneMuchos
    ? p.recursos
    : p.recursos.slice(0, 2);
  const restantes = p.recursos.length - 2;

  return (
    <div className={`rounded-rd-lg border border-rd-line ${className}`}>
      {!soloFilas && (
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={`${id}-cuerpo`}
        onClick={() => setAbierto((a) => !a)}
        className="font-rd flex w-full cursor-pointer items-center gap-2 rounded-t-rd-lg border-b border-rd-line bg-rd-sunken px-3 py-2 text-left text-rd-10-5 font-semibold tracking-wider text-rd-ink-meta uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy"
      >
        <span>{esOferta ? t('resourcesOffered') : t('resourcesNeeded')}</span>
        <ChevronDown aria-hidden="true" className={`ml-auto h-3.5 w-3.5 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      )}

      {/* El resumen de anillos es lo que se ve plegado; abierto, su sitio lo toman las filas,
          que son ese mismo resumen con detalle (Alejandro, 22 de septiembre de 2026: antes se
          veían los dos, repitiendo cada recurso). */}
      {!soloFilas && !abierto && (
      <div className="flex flex-wrap items-center gap-2.5 p-2.5 sm:p-3">
        {recursosVisibles.map((r) => {
          const completo = restante(r) === 0;
          return (
            <span key={r.item} className="flex min-w-34 flex-1 basis-34 items-start gap-2">
              <Anillo recurso={r} />
              <span className="flex min-w-0 flex-col leading-snug">
                <b className="truncate text-rd-12 font-semibold text-rd-ink">{tItem(r.item)}</b>
                <span className={`text-rd-11 tabular-nums ${completo ? 'font-semibold text-rd-green' : 'text-rd-ink-2'}`}>{tResourceStatus(r, p.tipo)}</span>
              </span>
            </span>
          );
        })}
        {tieneMuchos && !expandirResumen && !mostrarTodos && (
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              setExpandirResumen(true);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-rd-line bg-rd-sunken px-2.5 py-1 text-rd-11 font-semibold text-rd-navy hover:bg-rd-fondo transition-colors cursor-pointer"
          >
            +{restantes} {t('moreResources')}
          </button>
        )}
        {tieneMuchos && expandirResumen && !mostrarTodos && (
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              setExpandirResumen(false);
            }}
            className="w-full text-center text-rd-11 font-medium text-rd-ink-meta hover:text-rd-navy hover:underline cursor-pointer pt-1"
          >
            {t('showLess')}
          </button>
        )}
      </div>
      )}

      {abierto && (
        <div id={`${id}-cuerpo`}>
          {p.recursos.map((r, i) => {
            const completo = restante(r) === 0;
            const cat = categoriaDe(r.item);
            return (
              <div key={r.item} className={`flex gap-2 p-3 last:rounded-b-rd-md ${soloFilas && i === 0 ? 'rounded-t-rd-md' : 'border-t border-rd-line-soft'} ${completo ? 'bg-rd-sunken' : ''}`}>
                <span aria-hidden="true" className={`mt-px flex h-6.5 w-6.5 items-center justify-center rounded-rd-sm border ${completo ? 'border-rd-green-line bg-rd-green-soft text-rd-green' : 'border-rd-line bg-rd-sunken text-rd-ink-2'}`}>
                  {ICONO[iconoDe(r.item)]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className={`text-rd-13 ${completo ? 'font-medium text-rd-ink-2' : 'font-semibold text-rd-ink'}`}>
                      {tItem(r.item)}
                      {cat && <span className="mt-0.5 block text-rd-11 font-normal text-rd-ink-meta">{tCategory(cat.nombre)}</span>}
                    </span>
                    <span className={`text-rd-12-5 font-semibold whitespace-nowrap tabular-nums ${completo ? 'text-rd-green' : 'text-rd-ink'}`}>{tResourceStatus(r, p.tipo)}</span>
                  </div>
                  <BarraRecurso recurso={r} tipo={p.tipo} />
                  {r.ficha && (
                    <dl className="mt-3 flex flex-wrap gap-3">
                      {r.ficha.map(([k, v]) => (
                        <div key={k} className="min-w-31 flex-1 basis-31">
                          <dt className="mb-0.5 text-rd-11 leading-snug font-medium text-rd-ink-meta">{k}</dt>
                          <dd className="text-rd-12-5 leading-snug font-semibold text-rd-ink tabular-nums">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
