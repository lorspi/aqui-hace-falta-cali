import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

/**
 * Una zona que se desplaza sin barra tiene que decir que hay más de otra forma (Alejandro, 22
 * de septiembre de 2026): se desvanece por el borde donde queda contenido y deja de hacerlo al
 * llegar al final, así que el desvanecido es a la vez la señal de que hay más y la de dónde
 * está. Es el equivalente vertical del desvanecido de la fila de chips (decisión 143), que ya
 * hace esto mismo en horizontal.
 *
 * Se usa junto a `sin-barra`: quien esconde la barra pone el desvanecido.
 *
 *     const cuerpo = useRef<HTMLDivElement>(null);
 *     const borde = useDesvanecido(cuerpo);
 *     <div ref={cuerpo} className={`sin-barra ${borde.clase} …`} style={borde.style}>
 */
export function useDesvanecido<T extends HTMLElement>(externo?: React.RefObject<T | null>) {
  const propio = useRef<T>(null);
  const ref = externo ?? propio;
  const [borde, setBorde] = useState({ arriba: false, abajo: false });

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const arriba = el.scrollTop > 4;
    const abajo = el.scrollTop + el.clientHeight < el.scrollHeight - 4;
    setBorde((b) => (b.arriba === arriba && b.abajo === abajo ? b : { arriba, abajo }));
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    medir();
    /* Mide la caja y lo que lleva dentro: al filtrar, al plegar un bloque o al cargar una foto
       cambia el alto sin que nadie se desplace. */
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    Array.from(el.children).forEach((hijo) => ro.observe(hijo));
    el.addEventListener('scroll', medir, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', medir);
    };
  }, [medir, ref]);

  return {
    ref,
    clase: 'zona-rd-desvanece',
    style: {
      '--rd-borde-arriba': borde.arriba ? '20px' : '0px',
      '--rd-borde-abajo': borde.abajo ? '28px' : '0px',
    } as React.CSSProperties,
  };
}
