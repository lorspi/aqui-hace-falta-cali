import React from 'react';
import { Button } from '../../components/ui/Button';
import { Hoja } from '../../components/ui/Hoja';
import { Opcion } from '../../components/ui/Opcion';
import { ROTULO_GRUPO } from '../../components/ui/tipografia';
import type { MiembroEquipo } from '../../types/panel';
import { DISPONIBILIDADES } from './dialogos';

/**
 * La hoja de filtros de Mi equipo. Es la misma hoja de la Radar y del Directorio (`Hoja`) con
 * otro cuerpo: hasta el 25 de septiembre de 2026 Mi equipo tenía un popover de 288 con tres
 * `<select>`, y Alejandro pidió unificarlo («el filtro de mi equipo no es igual al de las demás
 * secciones. unifica»).
 *
 * Las opciones de lugar y de vehículo salen del equipo, no de la lista completa de 33
 * departamentos ni de los 6 vehículos del catálogo: filtrar por un departamento donde no hay
 * nadie no sirve de nada, y con la lista completa los chips eran un muro. La disponibilidad sí
 * muestra las tres de siempre, porque cada una agrupa varios valores sueltos del dato.
 *
 * Cada grupo es de una sola opción, así que van `radio` con su «Todas» explícita: con casillas
 * no habría forma de volver a «sin filtro» sin un botón aparte.
 */
const TITULO = ROTULO_GRUPO;

export const HojaFiltrosEquipo: React.FC<{
  abierta: boolean;
  onCerrar: () => void;
  equipo: MiembroEquipo[];
  ubicacion: string;
  veh: string;
  disp: string;
  onUbicacion: (v: string) => void;
  onVeh: (v: string) => void;
  onDisp: (v: string) => void;
  onQuitarTodos: () => void;
  aplicados: number;
  resultados: number;
}> = ({ abierta, onCerrar, equipo, ubicacion, veh, disp, onUbicacion, onVeh, onDisp, onQuitarTodos, aplicados, resultados }) => {
  const distintos = (valor: (m: MiembroEquipo) => string | undefined) =>
    [...new Set(equipo.map(valor).filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b, 'es'));

  const lugares = distintos((m) => m.ubicacion);
  const vehiculos = distintos((m) => m.veh);

  return (
    <Hoja
      abierta={abierta}
      titulo="Filtrar"
      idTitulo="hoja-filtros-equipo-t"
      onCerrar={onCerrar}
      pie={
        <>
          <Button nivel="terciario" tamano="md" onClick={onQuitarTodos} disabled={aplicados === 0}>
            Quitar todos
          </Button>
          <Button nivel="primario" tamano="md" onClick={onCerrar}>
            Ver {resultados} {resultados === 1 ? 'persona' : 'personas'}
          </Button>
        </>
      }
    >
      {lugares.length > 0 && (
        <section className="border-b border-rd-line-soft py-4">
          <h3 className={TITULO}>Dónde está</h3>
          <div className="flex flex-wrap gap-2">
            <Opcion tipo="radio" nombre="eq-lugar" marcada={!ubicacion} onChange={() => onUbicacion('')}>
              Todas
            </Opcion>
            {lugares.map((l) => (
              <Opcion key={l} tipo="radio" nombre="eq-lugar" marcada={ubicacion === l} onChange={() => onUbicacion(l)}>
                {l}
              </Opcion>
            ))}
          </div>
        </section>
      )}

      {vehiculos.length > 0 && (
        <section className="border-b border-rd-line-soft py-4">
          <h3 className={TITULO}>Con qué se mueve</h3>
          <div className="flex flex-wrap gap-2">
            <Opcion tipo="radio" nombre="eq-veh" marcada={!veh} onChange={() => onVeh('')}>
              Todos
            </Opcion>
            {vehiculos.map((v) => (
              <Opcion key={v} tipo="radio" nombre="eq-veh" marcada={veh === v} onChange={() => onVeh(v)}>
                {v}
              </Opcion>
            ))}
          </div>
        </section>
      )}

      <section className="py-4">
        <h3 className={TITULO}>Cuándo puede</h3>
        <div className="flex flex-wrap gap-2">
          <Opcion tipo="radio" nombre="eq-disp" marcada={!disp} onChange={() => onDisp('')}>
            Cualquiera
          </Opcion>
          {DISPONIBILIDADES.map((d) => (
            <Opcion key={d.valor} tipo="radio" nombre="eq-disp" marcada={disp === d.valor} onChange={() => onDisp(d.valor as string)}>
              {d.etiqueta}
            </Opcion>
          ))}
        </div>
      </section>
    </Hoja>
  );
};
