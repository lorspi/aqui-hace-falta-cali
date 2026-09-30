import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Tarjeta } from './Tarjeta';
import { useTranslation } from '../../i18n/LanguageContext';
import type { Publicacion } from '../../types/publicacion';
import type { CoincidenciaPublicacion } from '../../utils/cruce';

export interface DialogoDetallePublicacionProps {
  publicacion?: Publicacion | null;
  distanciaKm?: number | null;
  coincidencias?: CoincidenciaPublicacion[];
  enProceso?: boolean;
  /** Texto personalizado para el botón de acción principal */
  textoPrimaria?: string;
  onCerrar: () => void;
  onPrimaria?: (id: string) => void;
  onVerEnMapa?: (id: string) => void;
  onVerCoincidencias?: (id: string) => void;
  onCompartir?: (id: string) => void;
  onReportar?: (id: string) => void;
}

/**
 * Diálogo modal que muestra la tarjeta completa de una publicación con su descripción completa,
 * fotos, desglose de recursos y acciones disponibles.
 */
export const DialogoDetallePublicacion: React.FC<DialogoDetallePublicacionProps> = ({
  publicacion: p,
  distanciaKm,
  coincidencias,
  enProceso,
  textoPrimaria,
  onCerrar,
  onPrimaria,
  onVerEnMapa,
  onVerCoincidencias,
  onCompartir,
  onReportar,
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p && !d.open) d.showModal();
    else if (!p && d.open) d.close();
  }, [p]);

  const { t } = useTranslation();

  if (!p) return null;

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="font-rd m-auto flex max-h-[90dvh] w-full max-w-lg flex-col rounded-rd-xl border border-rd-line bg-rd-surface p-0 text-rd-ink shadow-rd-2 backdrop:bg-rd-ink/30 max-sm:mx-4 max-sm:w-auto overflow-hidden"
    >
      <div className="flex flex-none items-center justify-between border-b border-rd-line px-5 py-3 bg-rd-sunken/40">
        <span className="text-rd-13 font-semibold text-rd-ink">{t('postDetailTitle')}</span>
        <Button nivel="terciario" tamano="md" soloIcono aria-label={t('closeDetail')} onClick={onCerrar}>
          <X aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] p-4 sm:p-5 bg-rd-fondo/40">
        <Tarjeta
          publicacion={p}
          distanciaKm={distanciaKm}
          coincidencias={coincidencias}
          enProceso={enProceso}
          textoPrimaria={textoPrimaria}
          completa
          onPrimaria={(id) => {
            onCerrar();
            onPrimaria?.(id);
          }}
          onVerEnMapa={(id) => {
            onCerrar();
            onVerEnMapa?.(id);
          }}
          onVerCoincidencias={(id) => {
            onCerrar();
            onVerCoincidencias?.(id);
          }}
          onCompartir={onCompartir}
          onReportar={(id) => {
            onCerrar();
            onReportar?.(id);
          }}
        />
      </div>
    </dialog>
  );
};
