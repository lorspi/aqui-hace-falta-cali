import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CampoBuscarEnBloque } from './Consulta';
import { Hoja } from './Hoja';
import { ROTULO_GRUPO } from './tipografia';
import { TAXONOMIA } from '../../mocks/publicacionesMock';
import type { Publicacion, Ubicacion } from '../../types/publicacion';
import { DISTANCIAS, ESTADOS, ORDENES, conDistancia, conOrden, cuantosAplicados, filtrosVacios, type Filtros } from '../../utils/filtros';
import { conteoPorCiudad } from '../../utils/lugares';
import type { EstadoPublicacion } from '../../utils/publicaciones';
import { Button } from './Button';
import { Opcion } from './Opcion';
import { SelectorCiudad } from './SelectorCiudad';
import { FilaSwitch } from './Switch';

export { Opcion } from './Opcion';

/**
 * La hoja lateral de filtros (`rd-hoja` del prototipo): diálogo modal a la derecha de 440,
 * con Filtrar / Ordenar como pestañas, secciones (lugar con `SelectorCiudad`: Cerca de mí,
 * Seleccionar todo, ciudades por departamento; recurso por categoría, estado, solo
 * verificadas; en Ordenar, «Más cerca» con su radio en km), opciones como chips con `input`
 * real, y el pie «Quitar todos» / «Ver N resultados», donde N se cuenta con todos los
 * filtros. Escape y el velo cierran.
 */
export interface HojaFiltrosProps {
  abierta: boolean;
  filtros: Filtros;
  onCambiar: (f: Filtros) => void;
  onCerrar: () => void;
  publicaciones: Publicacion[];
  resultados: number;
  /** La ubicación de la persona: da su ciudad («Tu ciudad · Bogotá») y el radio en km. */
  ubicacion: Ubicacion;
}

const TITULO = ROTULO_GRUPO;

export const HojaFiltros: React.FC<HojaFiltrosProps> = ({ abierta, filtros: f, onCambiar, onCerrar, publicaciones, resultados, ubicacion }) => {
  const [pestana, setPestana] = useState<'filtrar' | 'ordenar'>('filtrar');
  const [buscaRecurso, setBuscaRecurso] = useState('');

  if (!abierta) return null;

  const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);
  const conteos = conteoPorCiudad(publicaciones);
  const q = buscaRecurso.trim().toLowerCase();

  return (
    <Hoja
      abierta={abierta}
      titulo="Filtrar y ordenar"
      idTitulo="hoja-filtros-t"
      onCerrar={onCerrar}
      pestanas={
        <div role="tablist" aria-label="Filtrar u ordenar" className="flex border-b border-rd-line px-4">
          {(['filtrar', 'ordenar'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={pestana === t}
              onClick={() => setPestana(t)}
              className={`font-rd -mb-px h-10 cursor-pointer border-b-2 px-3 text-rd-13-5 font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy ${pestana === t ? 'border-rd-sel text-rd-ink' : 'border-transparent text-rd-ink-2'}`}
            >
              {t === 'filtrar' ? 'Filtrar' : 'Ordenar'}
            </button>
          ))}
        </div>
      }
      pie={
        <>
          <Button nivel="terciario" tamano="md" onClick={() => onCambiar(filtrosVacios())} disabled={cuantosAplicados(f) === 0}>
            Quitar todos
          </Button>
          <Button nivel="primario" tamano="md" onClick={onCerrar}>
            Ver {resultados} {resultados === 1 ? 'resultado' : 'resultados'}
          </Button>
        </>
      }
    >
      <>
          {pestana === 'filtrar' ? (
            <>
              <section className="border-b border-rd-line-soft py-4">
                <h3 className={TITULO}>Lugar</h3>
                <SelectorCiudad ciudades={f.ciudades} onCambiar={(ciudades) => onCambiar({ ...f, ciudades })} conteos={conteos} ubicacion={ubicacion} onCercaDeMi={(ciudad) => onCambiar(conOrden({ ...f, ciudades: [ciudad] }, 'cerca'))} />
              </section>

              <section className="border-b border-rd-line-soft py-4">
                <h3 className={TITULO}>Qué recurso</h3>
                <CampoBuscarEnBloque valor={buscaRecurso} onChange={setBuscaRecurso} placeholder="Buscar un recurso" etiqueta="Buscar un recurso" className="mb-3" />
                {TAXONOMIA.map((cat, i) => {
                  const items = cat.items.filter((it) => !q || it.toLowerCase().includes(q));
                  if (!items.length) return null;
                  const marcados = items.filter((it) => f.recursos.includes(it)).length;
                  return (
                    <details key={cat.nombre} open={i === 0 || Boolean(q) || marcados > 0} className="group mb-2 rounded-rd-lg border border-rd-line">
                      <summary className="font-rd flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-rd-13-5 font-semibold text-rd-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy">
                        {cat.nombre}
                        {marcados > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-sunken px-1.5 text-rd-11-5 font-semibold text-rd-ink-2 tabular-nums">{marcados}</span>}
                        <ChevronDown aria-hidden="true" className="ml-auto h-3.5 w-3.5 text-rd-ink-3 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="flex flex-col px-3 pb-2">
                        {items.map((it) => (
                          <label key={it} className="font-rd flex cursor-pointer items-center gap-2.5 py-1.75 text-rd-13-5 text-rd-ink pointer-coarse:min-h-rd-tactil">
                            <input type="checkbox" name="recurso" checked={f.recursos.includes(it)} onChange={() => onCambiar({ ...f, recursos: alternar(f.recursos, it) })} className="m-0 h-4 w-4 shrink-0 cursor-pointer accent-rd-sel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy" />
                            {it}
                          </label>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </section>

              <section className="border-b border-rd-line-soft py-4">
                <h3 className={TITULO}>Estado</h3>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.map((e) => (
                    <Opcion key={e.id} tipo="checkbox" nombre="estado" marcada={f.estados.includes(e.id)} onChange={() => onCambiar({ ...f, estados: alternar<EstadoPublicacion>(f.estados, e.id) })}>
                      {e.etiqueta}
                    </Opcion>
                  ))}
                </div>
              </section>

              <section className="py-4">
                <FilaSwitch id="radar-verificadas" rotulo="Solo organizaciones verificadas" encendido={f.verificadas} onCambiar={(v) => onCambiar({ ...f, verificadas: v })} />
              </section>
            </>
          ) : (
            <section className="py-4">
              <h3 className={TITULO}>Ordenar por</h3>
              <div className="flex flex-wrap gap-2">
                {ORDENES.map((o) => (
                  <Opcion key={o.id} tipo="radio" nombre="orden" marcada={f.orden === o.id} onChange={() => onCambiar(conOrden(f, o.id))}>
                    {o.etiqueta}
                  </Opcion>
                ))}
              </div>
              {/* El radio en km complementa «Más cerca» (Alejandro, 21 de septiembre de 2026). */}
              {f.orden === 'cerca' && (
                <>
                  <p className="mt-4 mb-2 text-rd-12-5 text-rd-ink-2">Distancia desde tu ubicación</p>
                  <div className="flex flex-wrap gap-2">
                    {DISTANCIAS.map((d) => (
                      <Opcion key={d.etiqueta} tipo="radio" nombre="dist" marcada={f.distancia === d.km} onChange={() => onCambiar(conDistancia(f, d.km))}>
                        {d.etiqueta}
                      </Opcion>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
      </>
    </Hoja>
  );
};
