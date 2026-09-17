import React from 'react';
import type { Publicacion } from '../../types/publicacion';
import { cifra, restante, unidad } from '../../utils/publicaciones';
import { Dialogo, Opciones } from './Dialogo';

/**
 * «Quiero ayudar» (en una necesidad) / «Solicitar» (en una oferta): `comprometer()` de
 * `acciones.js`. Una fila por recurso que todavía no está cubierto —marcado por defecto,
 * con lo que falta o queda al lado y la cantidad editable—, y cuándo llega o cuándo lo
 * recogen. Sin backend: al enviar, quien llama recibe cuántos recursos y el cuándo, pone
 * la publicación «En proceso» y avisa.
 */
export interface Compromiso {
  recursos: number;
  cuando: string;
}

export interface DialogoCompromisoProps {
  publicacion: Publicacion | null;
  onCerrar: () => void;
  onEnviar: (publicacion: Publicacion, compromiso: Compromiso) => void;
}

const CUANDO = ['Hoy', 'Mañana', 'Esta semana'].map((t) => ({ valor: t, texto: t }));

export const DialogoCompromiso: React.FC<DialogoCompromisoProps> = ({ publicacion: p, onCerrar, onEnviar }) => {
  const esNecesidad = p?.tipo === 'necesidad';
  const filas = (p?.recursos ?? []).map((r, i) => ({ i, r, queda: restante(r) })).filter((f) => f.queda > 0);
  return (
    <Dialogo
      abierto={p !== null}
      titulo={p ? `${esNecesidad ? '¿Con qué puedes ayudar a' : '¿Qué le solicitas a'} ${p.org}?` : ''}
      accion={esNecesidad ? 'Comprometerme' : 'Solicitar'}
      onCerrar={onCerrar}
      onEnviar={(form) => {
        if (!p) return;
        const datos = new FormData(form);
        onEnviar(p, { recursos: datos.getAll('rec').length, cuando: String(datos.get('cuando') ?? '') });
      }}
    >
      <div className="mb-4 flex flex-col gap-2">
        {filas.map(({ i, r, queda }) => (
          <div key={r.item} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-rd-line-soft py-2">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-rd-13-5 font-semibold text-rd-ink">
              <input type="checkbox" name="rec" value={i} defaultChecked className="m-0 h-4 w-4 shrink-0 cursor-pointer accent-rd-sel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy" />
              <span className="min-w-0">
                {r.item}
                <small className="ml-1.5 text-rd-13 font-normal text-rd-ink-meta">
                  {esNecesidad ? (queda === 1 ? 'falta' : 'faltan') : queda === 1 ? 'queda' : 'quedan'} {cifra(queda)} {unidad(queda, r.unidad)}
                </small>
              </span>
            </label>
            <span className="flex items-center gap-2 max-sm:basis-full max-sm:pl-6.5">
              <input
                type="number"
                name={`c${i}`}
                min={0}
                max={queda}
                step="any"
                inputMode="decimal"
                defaultValue={queda}
                aria-label={`Cantidad de ${r.item}`}
                className="font-rd h-rd-h-sm w-24 rounded-rd-sm border border-rd-line bg-rd-surface px-2 text-right text-rd-13 text-rd-ink tabular-nums focus:border-rd-navy focus:outline-none focus:ring-3 focus:ring-rd-navy-soft"
              />
              <span className="text-rd-12-5 font-semibold text-rd-ink-2">{r.unidad}</span>
            </span>
          </div>
        ))}
      </div>
      <Opciones nombre="cuando" etiqueta={esNecesidad ? 'Cuándo llega' : 'Cuándo lo recogen o lo necesitan'} opciones={CUANDO} />
    </Dialogo>
  );
};
