import React from 'react';
import { Dialogo, Opciones } from './Dialogo';

/**
 * «Reportar un problema»: `reportar()` de `acciones.js`. Tres motivos, que alimentan cosas
 * distintas —una publicación falsa, datos mal, un compromiso que no llegó—, y qué vio la
 * persona (opcional). Enviar es secundario: no compromete a nadie, lo revisa moderación.
 * `titulo` deja que el directorio lo use con «Reportar un problema con X».
 */
export interface Reporte {
  motivo: string;
  detalle: string;
}

export interface DialogoReporteProps {
  abierto: boolean;
  titulo?: string;
  /** Motivos alternativos (el directorio cambia el tercero). */
  motivos?: { valor: string; texto: string }[];
  onCerrar: () => void;
  onEnviar: (reporte: Reporte) => void;
}

export const MOTIVOS_PUBLICACION = [
  { valor: 'falsa', texto: 'No existe o es falsa' },
  { valor: 'datos', texto: 'Los datos están mal' },
  { valor: 'no-llego', texto: 'Se comprometieron y no llegaron' },
];

export const DialogoReporte: React.FC<DialogoReporteProps> = ({ abierto, titulo = 'Reportar esta publicación', motivos = MOTIVOS_PUBLICACION, onCerrar, onEnviar }) => (
  <Dialogo
    abierto={abierto}
    titulo={titulo}
    accion="Reportar"
    nivelAccion="secundario"
    onCerrar={onCerrar}
    onEnviar={(form) => {
      const datos = new FormData(form);
      onEnviar({ motivo: String(datos.get('motivo') ?? ''), detalle: String(datos.get('det') ?? '').trim() });
    }}
  >
    <Opciones nombre="motivo" etiqueta="Qué pasa" opciones={motivos} columna />
    <div className="mb-2 flex flex-col gap-1.5">
      <label htmlFor="rd-rep-det" className="font-rd text-rd-12-5 font-semibold text-rd-ink-2">
        Qué viste <span className="font-normal text-rd-ink-meta">(opcional)</span>
      </label>
      <textarea
        id="rd-rep-det"
        name="det"
        rows={3}
        placeholder="Por ejemplo: llamé y el número no existe"
        className="font-rd w-full resize-y rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 text-rd-14 text-rd-ink placeholder:text-rd-ink-meta focus:border-rd-navy focus:outline-none focus:ring-3 focus:ring-rd-navy-soft"
      />
    </div>
  </Dialogo>
);
