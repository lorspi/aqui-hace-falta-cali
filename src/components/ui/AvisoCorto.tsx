import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Info, X } from 'lucide-react';

/**
 * El aviso corto abajo (`rd-toast` del prototipo, `rdAviso()` de `acciones.js`): siempre
 * negro, centrado a 24 del borde inferior; el icono lleva el color del contexto —neutro
 * (info), ok (check), error (x), cargando (anillo)—. Con o sin una acción. Se va solo a los
 * 3,6 s (6 s si lleva acción); «cargando» se queda hasta que llega el siguiente aviso.
 * Uno a la vez: el nuevo reemplaza al anterior. `role="status"` con `aria-live="polite"`.
 *
 * Uso: la pantalla se envuelve en `<AvisosProvider>` y quien avisa llama `useAviso()`.
 * Convive con `components/Toast.tsx` (las tarjetas blancas arriba a la derecha); cuál
 * queda es decisión de Frontend.
 */
export type TipoAviso = 'neutro' | 'ok' | 'error' | 'cargando';

export interface OpcionesAviso {
  tipo?: TipoAviso;
  accion?: { texto: string; al: () => void };
}

type Avisar = (texto: string, opciones?: OpcionesAviso) => void;

const Contexto = createContext<Avisar>(() => {});

export function useAviso(): Avisar {
  return useContext(Contexto);
}

interface Aviso extends OpcionesAviso {
  n: number;
  texto: string;
}

const ICONO: Record<Exclude<TipoAviso, 'cargando'>, React.ReactNode> = {
  neutro: <Info aria-hidden="true" className="h-4.5 w-4.5 text-white/70" />,
  ok: <Check aria-hidden="true" className="h-4.5 w-4.5 text-rd-green-line" />,
  error: <X aria-hidden="true" className="h-4.5 w-4.5 text-rd-coral-soft" />,
};

export const AvisosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [visible, setVisible] = useState(false);
  const cuenta = useRef(0);
  const reloj = useRef<number | undefined>(undefined);

  const cerrar = useCallback(() => setVisible(false), []);

  const avisar = useCallback<Avisar>((texto, opciones = {}) => {
    cuenta.current += 1;
    setAviso({ n: cuenta.current, texto, ...opciones });
  }, []);

  /* Cada aviso nuevo entra con transición y arma su propio reloj. */
  useEffect(() => {
    if (!aviso) return;
    const marco = requestAnimationFrame(() => setVisible(true));
    window.clearTimeout(reloj.current);
    if (aviso.tipo !== 'cargando') reloj.current = window.setTimeout(cerrar, aviso.accion ? 6000 : 3600);
    return () => cancelAnimationFrame(marco);
  }, [aviso, cerrar]);

  const valor = useMemo(() => avisar, [avisar]);
  const tipo: TipoAviso = aviso?.tipo ?? 'neutro';

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div
        role="status"
        aria-live="polite"
        /* Con `left-1/2` y sin ancho, el navegador solo le da la mitad derecha del viewport y el
           texto se envuelve estrecho: desde 640 mide lo que su contenido (`w-max`) con tope; bajo
           640 va anclado a los dos lados. */
        className={`font-rd fixed bottom-6 z-3000 flex items-center gap-2.5 rounded-full bg-rd-ink py-2.5 pr-2.5 pl-3.5 text-rd-13 font-medium text-white shadow-rd-2 transition duration-200 max-sm:inset-x-4 sm:left-1/2 sm:w-max sm:max-w-140 sm:-translate-x-1/2 ${
          visible && aviso ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        }`}
      >
        {aviso && (
          <>
            {tipo === 'cargando' ? <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white" /> : ICONO[tipo]}
            <span className="min-w-0 flex-1 leading-snug">{aviso.texto}</span>
            {aviso.accion && (
              <button
                type="button"
                onClick={() => {
                  aviso.accion?.al();
                  cerrar();
                }}
                className="font-rd shrink-0 cursor-pointer rounded-full bg-white/15 px-3 py-1.5 text-rd-13 font-semibold text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {aviso.accion.texto}
              </button>
            )}
            {tipo !== 'cargando' && (
              <button type="button" aria-label="Cerrar" onClick={cerrar} className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white">
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </Contexto.Provider>
  );
};
