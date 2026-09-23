import React, { useEffect, useMemo, useState } from 'react';
import { Hand, HeartHandshake } from 'lucide-react';

/**
 * La explosión de la primera publicación (Alejandro, 22 de septiembre de 2026): al abrirse la
 * pantalla de éxito, el icono de lo que la persona acaba de hacer —la mano de pedir o el
 * apretón de ofrecer— sale disparado desde abajo y se desvanece al subir. Solo la primera vez
 * que alguien publica (queda marcado en `localStorage`), nunca con `prefers-reduced-motion`, y
 * sin capturar el ratón: es adorno, no interfaz.
 */
const CLAVE = 'rd-explosion';
const CUANTOS = 18;
/* Coral y navy son los dos colores de la gramática (139); el ámbar entra como acento. */
const TONOS = ['text-rd-coral', 'text-rd-navy', 'text-rd-amber-ink'];

export function yaExplotó(): boolean {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return true;
  }
}

export const Explosion: React.FC<{ tipo: 'pedir' | 'ofrecer' }> = ({ tipo }) => {
  const [va, setVa] = useState(false);
  /* Cada pedazo lleva su desvío, su giro, su tamaño y su retraso; se sortean una vez. */
  const piezas = useMemo(
    () =>
      Array.from({ length: CUANTOS }, (_, i) => ({
        id: i,
        x: `${Math.round((Math.random() - 0.5) * 320)}px`,
        giro: `${Math.round((Math.random() - 0.5) * 540)}deg`,
        alto: `${Math.round(45 + Math.random() * 35)}vh`,
        retraso: `${Math.round(Math.random() * 260)}ms`,
        duracion: `${Math.round(1500 + Math.random() * 900)}ms`,
        medida: 16 + Math.round(Math.random() * 14),
        tono: TONOS[i % TONOS.length],
      })),
    [],
  );

  useEffect(() => {
    if (yaExplotó() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      localStorage.setItem(CLAVE, '1');
    } catch {
      /* sin memoria, igual se ve una vez */
    }
    setVa(true);
    const t = window.setTimeout(() => setVa(false), 2800);
    return () => window.clearTimeout(t);
  }, []);

  if (!va) return null;
  const Icono = tipo === 'pedir' ? Hand : HeartHandshake;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-1 overflow-hidden">
      {piezas.map((p) => (
        <span
          key={p.id}
          className={`absolute bottom-0 left-1/2 animate-rd-explosion ${p.tono}`}
          style={
            {
              '--rd-x': p.x,
              '--rd-giro': p.giro,
              '--rd-alto': p.alto,
              animationDelay: p.retraso,
              animationDuration: p.duracion,
            } as React.CSSProperties
          }
        >
          <Icono style={{ width: p.medida, height: p.medida }} />
        </span>
      ))}
    </div>
  );
};
