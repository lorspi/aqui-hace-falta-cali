import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button, type NivelBoton } from './Button';
import { useTranslation } from '../../i18n/LanguageContext';

export interface DialogoProps {
  abierto: boolean;
  titulo: string;
  accion: string;
  nivelAccion?: NivelBoton;
  textoAlterno?: string;
  accionActiva?: boolean;
  onCerrar: () => void;
  onEnviar: (form: HTMLFormElement) => void;
  children: React.ReactNode;
}

export const Dialogo: React.FC<DialogoProps> = ({ abierto, titulo, accion, nivelAccion = 'primario', textoAlterno, accionActiva = true, onCerrar, onEnviar, children }) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    else if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="font-rd m-auto w-full max-w-130 rounded-rd-xl bg-rd-surface p-0 text-rd-ink shadow-rd-2 backdrop:bg-rd-ink/30 max-sm:max-w-full max-sm:mx-4 max-sm:w-auto"
    >
      {abierto && (
        <form
          method="dialog"
          className="relative p-5"
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault();
            onEnviar(e.currentTarget);
          }}
        >
          <button type="button" aria-label={t('detailClose')} onClick={onCerrar} className="absolute top-3 right-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-rd-md bg-rd-surface text-rd-ink-2 hover:bg-rd-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy pointer-coarse:h-rd-tactil pointer-coarse:w-rd-tactil">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
          <h2 id={idTitulo} className="font-rd m-0 mb-4 pr-10 text-rd-18 leading-snug font-semibold tracking-rd-titulo text-rd-ink">{titulo}</h2>
          {children}
          <div className="mt-5 flex flex-wrap gap-2 max-sm:flex-col">
            <Button type="submit" nivel={nivelAccion} tamano="lg" disabled={!accionActiva}>
              {accion}
            </Button>
            {textoAlterno && (
              <Button nivel="secundario" tamano="lg" onClick={onCerrar}>
                {textoAlterno}
              </Button>
            )}
          </div>
        </form>
      )}
    </dialog>
  );
};

/** Grupo de opciones excluyentes dentro de un diálogo (`rd-opciones`): chips con su radio
 *  real dentro; en columna cuando las opciones son frases. */
export const Opciones: React.FC<{ nombre: string; etiqueta: string; opciones: { valor: string; texto: string }[]; columna?: boolean; inicial?: string }> = ({ nombre, etiqueta, opciones, columna = false, inicial }) => (
  <fieldset className="m-0 mb-4 min-w-0 border-0 p-0">
    <legend className="font-rd mb-2 p-0 text-rd-12-5 font-semibold text-rd-ink-2">{etiqueta}</legend>
    <div className={`flex flex-wrap gap-2 ${columna ? 'flex-col items-start' : ''}`}>
      {opciones.map((o, i) => (
        <label key={o.valor} className="relative inline-flex">
          <input type="radio" name={nombre} value={o.valor} defaultChecked={inicial ? o.valor === inicial : i === 0} className="peer absolute inset-0 m-0 cursor-pointer opacity-0" />
          <span className="font-rd inline-flex h-8 items-center rounded-full border border-rd-line bg-rd-surface px-3 text-rd-13 font-medium text-rd-ink peer-checked:border-rd-sel peer-checked:bg-rd-sel peer-checked:text-white peer-hover:border-rd-ink-3 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rd-navy pointer-coarse:h-rd-tactil">
            {o.texto}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);
