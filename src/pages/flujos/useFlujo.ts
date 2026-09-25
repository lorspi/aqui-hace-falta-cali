import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RUTAS } from '../../mocks/cuentasMock';
import type { ModulosCuenta } from '../../types/cuenta';
import type { SubPaso } from '../../types/flujo';
import { activarModulo } from '../../utils/panel';

/**
 * La mecánica común de un flujo de publicar (`flujo.js` del prototipo): el estado, el paso
 * actual dentro de un camino que se recalcula con cada respuesta, avanzar y volver, saltar a
 * un paso o a una fase (a donde la persona la dejó), publicar solo si el camino entero está
 * listo, el borrador en `localStorage` y la pregunta de salida cuando hay algo que perder.
 */
interface EstadoBase {
  i: number;
  publicado: boolean;
  ultimoDeFase: Record<number, string>;
  fotos: { url: string }[];
}

export function useFlujo<E extends EstadoBase>(
  clave: string,
  modulo: keyof ModulosCuenta,
  estadoInicial: () => E,
  camino: (e: E) => SubPaso[],
  listo: (e: E, sub: SubPaso) => boolean,
  onGuardar?: (e: E) => Promise<void>,
  onCerrarOverride?: () => void
) {
  const claveBorrador = `rd-borrador-${clave}`;
  const [e, setE] = useState<E>(() => {
    const base = estadoInicial();
    try {
      const crudo = localStorage.getItem(claveBorrador);
      if (crudo) {
        /* Se mezcla sobre el estado inicial: si el borrador es de una versión anterior, las
           claves nuevas conservan su valor por defecto. Las fotos no sobreviven (sus URL
           eran de la sesión anterior). */
        const g = JSON.parse(crudo) as Partial<E>;
        return { ...base, ...g, fotos: [], publicado: false };
      }
    } catch {
      /* sin borrador */
    }
    return base;
  });
  const tocado = useRef(false);
  const [salida, setSalida] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorPublicar, setErrorPublicar] = useState<string | null>(null);

  /** Cambiar algo del estado: marca «tocado» para preguntar antes de salir. */
  const set = useCallback((cambio: Partial<E> | ((prev: E) => Partial<E>)) => {
    tocado.current = true;
    setE((prev) => ({ ...prev, ...(typeof cambio === 'function' ? cambio(prev) : cambio) }));
  }, []);

  const pasos = useMemo(() => camino(e), [camino, e]);
  const i = Math.min(e.i, pasos.length - 1);
  const sub = pasos[i];

  /* Dónde estaba la persona en cada fase: la pestaña de una fase recorrida vuelve ahí. */
  useEffect(() => {
    if (sub && e.ultimoDeFase[sub.paso] !== sub.id) setE((prev) => ({ ...prev, ultimoDeFase: { ...prev.ultimoDeFase, [sub.paso]: sub.id } }));
  }, [sub, e.ultimoDeFase]);

  const irIndice = (k: number) => setE((prev) => ({ ...prev, i: Math.max(0, Math.min(k, pasos.length - 1)) }));
  const siguiente = () => irIndice(i + 1);
  const atras = () => irIndice(i - 1);
  const irA = (id: string) => {
    const k = pasos.findIndex((p) => p.id === id);
    if (k !== -1) irIndice(k);
  };
  const irAFase = (fase: number) => {
    const destino = e.ultimoDeFase[fase];
    const k = pasos.findIndex((p) => p.paso === fase && p.id === destino);
    if (k !== -1) return irIndice(k);
    const primero = pasos.findIndex((p) => p.paso === fase);
    if (primero !== -1) irIndice(primero);
  };

  /* Guarda de verdad: se comprueba el camino entero, no el paso actual. */
  const publicar = async () => {
    if (!pasos.every((p) => listo(e, p))) return;
    setGuardando(true);
    setErrorPublicar(null);
    try {
      if (onGuardar) {
        await onGuardar(e);
      }
      localStorage.removeItem(claveBorrador);
      tocado.current = false;
      activarModulo(modulo);
      setE((prev) => ({ ...prev, publicado: true }));
    } catch (err: any) {
      console.error('❌ Error al publicar en Supabase:', err);
      guardarBorrador();
      const msg = err?.message || 'Error guardando en la base de datos.';
      if (msg === 'AUTH_REQUIRED' || msg.includes('AUTH_REQUIRED')) {
        setErrorPublicar('Debes iniciar sesión para publicar. Tu formulario fue guardado en borrador.');
      } else {
        setErrorPublicar(msg);
      }
    } finally {
      setGuardando(false);
    }
  };

  const guardarBorrador = () => {
    try {
      localStorage.setItem(claveBorrador, JSON.stringify({ ...e, fotos: [] }));
    } catch {
      /* sin espacio */
    }
  };

  const descartarBorrador = () => {
    try {
      localStorage.removeItem(claveBorrador);
    } catch {
      /* nada */
    }
  };

  const descartarYSalir = () => {
    descartarBorrador();
    tocado.current = false;
    setE(estadoInicial());
    salir();
  };

  const salir = () => {
    e.fotos.forEach((f) => {
      try {
        URL.revokeObjectURL(f.url);
      } catch {
        /* nada */
      }
    });
    if (onCerrarOverride) {
      onCerrarOverride();
    } else {
      window.location.href = RUTAS.radar;
    }
  };
  const cerrar = () => {
    if (!tocado.current || e.publicado) return salir();
    setSalida(true);
  };

  const reiniciar = () => {
    descartarBorrador();
    tocado.current = false;
    setE(estadoInicial());
  };

  return { e, set, pasos, sub, i, listoActual: sub ? listo(e, sub) : false, siguiente, atras, irA, irAFase, publicar, cerrar, salida, setSalida, guardarBorrador, descartarBorrador, descartarYSalir, salir, reiniciar, guardando, errorPublicar };
}
