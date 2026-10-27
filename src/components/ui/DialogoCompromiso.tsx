import React, { useEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import type { Publicacion } from '../../types/publicacion';
import { cifra, restante } from '../../utils/publicaciones';
import { cantidadDe, type Compromiso } from '../../utils/compromiso';
import { numero } from '../../utils/equivalencias';
import { Casilla } from './Casilla';
import { Dialogo } from './Dialogo';
import { useTranslation } from '../../i18n/LanguageContext';

export interface DialogoCompromisoProps {
  publicacion: Publicacion | null;
  onCerrar: () => void;
  onEnviar: (publicacion: Publicacion, compromiso: Compromiso) => void;
}

interface EstadoFila {
  marcado: boolean;
  cantidad: string;
}

export const DialogoCompromiso: React.FC<DialogoCompromisoProps> = ({ publicacion: p, onCerrar, onEnviar }) => {
  const { t, tItem, tUnit, tResourceStatus } = useTranslation();
  const esNecesidad = p?.tipo === 'necesidad';
  const filas = (p?.recursos ?? []).map((r, i) => ({ i, r, queda: restante(r) })).filter((f) => f.queda > 0);
  const [estado, setEstado] = useState<Record<number, EstadoFila>>({});

  /* Al abrir otra publicación se vuelve a empezar: todo marcado y con el saldo entero. Depende
     solo del id, no de `filas`, que se reconstruye en cada pintada. */
  const id = p?.id ?? '';
  useEffect(() => {
    if (!p) return;
    const inicial: Record<number, EstadoFila> = {};
    p.recursos.forEach((r, i) => {
      const queda = restante(r);
      if (queda > 0) inicial[i] = { marcado: true, cantidad: cifra(queda) };
    });
    setEstado(inicial);
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de publicación */
  }, [id]);

  const filaDe = (i: number, queda: number): EstadoFila => estado[i] ?? { marcado: true, cantidad: cifra(queda) };
  const cambiar = (i: number, cambio: Partial<EstadoFila>) => setEstado((e) => ({ ...e, [i]: { ...filaDe(i, 0), ...e[i], ...cambio } }));
  const elegidas = filas.filter((f) => filaDe(f.i, f.queda).marcado);

  const validarFila = (i: number, queda: number, unidadStr: string) => {
    const f = filaDe(i, queda);
    if (!f.marcado) return { valida: true, error: null, puedeAjustar: false };
    const val = (f.cantidad ?? '').trim();
    if (val === '') {
      return { valida: false, error: t('commitmentErrorRequired'), puedeAjustar: false };
    }
    const n = numero(val);
    if (!Number.isFinite(n)) {
      return { valida: false, error: t('commitmentErrorInvalid'), puedeAjustar: false };
    }
    if (n <= 0) {
      return { valida: false, error: t('commitmentErrorPositive'), puedeAjustar: false };
    }
    if (n > queda) {
      const uFmt = tUnit(queda, unidadStr);
      const plantilla = esNecesidad ? t('commitmentErrorExceedsNeed') : t('commitmentErrorExceedsOffer');
      const msg = plantilla.replace('{max}', `${cifra(queda)} ${uFmt}`);
      return { valida: false, error: msg, puedeAjustar: true };
    }
    return { valida: true, error: null, puedeAjustar: false };
  };

  const validaciones = filas.map(({ i, r, queda }) => ({ i, ...validarFila(i, queda, r.unidad) }));
  const todasElegidasValidas =
    elegidas.length > 0 &&
    elegidas.every(({ i }) => {
      const v = validaciones.find((item) => item.i === i);
      return v?.valida;
    });

  return (
    <Dialogo
      abierto={p !== null}
      titulo={p ? `${esNecesidad ? t('commitmentHelpTitle') : t('commitmentRequestTitle')} ${p.org}?` : ''}
      accion={esNecesidad ? t('radarMatchActionCommit') : t('radarMatchActionRequest')}
      accionActiva={todasElegidasValidas}
      onCerrar={onCerrar}
      onEnviar={() => {
        if (!p || !todasElegidasValidas) return;
        onEnviar(p, {
          partes: elegidas.map(({ i, r, queda }) => ({ item: r.item, cantidad: cantidadDe(filaDe(i, queda).cantidad, queda), unidad: r.unidad })),
        });
      }}
    >
      {filas.length === 0 ? (
        <p className="mb-4 rounded-rd-md border border-rd-line bg-rd-fondo px-3 py-3 text-rd-13 text-rd-ink-2">
          {esNecesidad ? t('commitmentNeedCovered') : t('commitmentOfferDepleted')}
        </p>
      ) : (
        <ul className="m-0 mb-3 flex list-none flex-col p-0">
          {filas.map(({ i, r, queda }) => {
            const f = filaDe(i, queda);
            const valInfo = validaciones.find((v) => v.i === i);
            const tieneError = f.marcado && !valInfo?.valida;
            const unidadFila = tUnit(cantidadDe(f.cantidad, queda) || queda, r.unidad);
            const idError = `err-compromiso-${i}`;

            return (
              <li key={r.item} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-rd-line-soft py-2.5 last:border-b-0">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 max-sm:basis-full">
                  <input
                    type="checkbox"
                    checked={f.marcado}
                    onChange={(e) => cambiar(i, { marcado: e.target.checked })}
                    className="peer sr-only"
                  />
                  <Casilla marca={f.marcado ? 'si' : 'no'} className="mt-0.5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rd-navy" />
                  <span className="min-w-0">
                    <span className={`block text-rd-13-5 leading-snug font-semibold ${f.marcado ? 'text-rd-ink' : 'text-rd-ink-meta'}`}>{tItem(r.item)}</span>
                    <span className="block text-rd-12-5 text-rd-ink-meta tabular-nums">{p ? tResourceStatus(r, p.tipo) : ''}</span>
                  </span>
                </label>
                <span
                  className={`flex h-rd-h-md w-36 shrink-0 items-center rounded-rd-sm border transition-colors max-sm:ml-6.5 pointer-coarse:h-rd-tactil ${
                    !f.marcado
                      ? 'border-rd-line-soft bg-rd-sunken'
                      : tieneError
                      ? 'border-rd-coral bg-rd-surface focus-within:border-rd-coral focus-within:ring-3 focus-within:ring-rd-coral-soft'
                      : 'border-rd-line bg-rd-surface hover:not-focus-within:border-rd-ink-3 focus-within:border-rd-navy focus-within:ring-3 focus-within:ring-rd-navy-soft'
                  }`}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={!f.marcado}
                    value={f.cantidad}
                    aria-invalid={tieneError ? true : undefined}
                    aria-describedby={tieneError && valInfo?.error ? idError : undefined}
                    onChange={(e) => cambiar(i, { cantidad: e.target.value })}
                    onBlur={() => {
                      const num = numero(f.cantidad);
                      if (Number.isFinite(num) && num > queda) {
                        cambiar(i, { cantidad: cifra(queda) });
                      } else if (Number.isFinite(num) && num > 0) {
                        cambiar(i, { cantidad: cifra(num) });
                      }
                    }}
                    aria-label={`${t('commitmentHowMuchOf')} ${tItem(r.item)}`}
                    className="font-rd min-w-0 flex-1 bg-transparent px-2 text-right text-rd-13-5 text-rd-ink tabular-nums focus:outline-none disabled:text-rd-ink-meta"
                  />
                  <span className={`shrink-0 pr-2.5 pl-1 text-rd-12-5 font-semibold ${!f.marcado ? 'text-rd-ink-meta' : tieneError ? 'text-rd-coral' : 'text-rd-ink-2'}`}>{unidadFila}</span>
                </span>

                {tieneError && valInfo?.error && (
                  <div
                    id={idError}
                    role="alert"
                    className="basis-full flex items-center justify-end max-sm:justify-start max-sm:pl-6.5 text-rd-12 text-rd-coral"
                  >
                    <CircleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0 mr-1" />
                    <span>{valInfo.error}</span>
                    {valInfo.puedeAjustar && (
                      <button
                        type="button"
                        onClick={() => cambiar(i, { cantidad: cifra(queda) })}
                        className="ml-1.5 font-semibold underline hover:text-rd-coral-ink cursor-pointer"
                      >
                        {t('commitmentAdjustToMax')}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Dialogo>
  );
};
