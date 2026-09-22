/**
 * Sonidos de RaDAR, sintetizados con Web Audio y sin archivos, como los tres pings de la
 * cortinilla de entrada (decisión 76): suenan solo tras un gesto de la persona y nunca con
 * `prefers-reduced-motion`. Si el navegador no tiene audio, no pasa nada.
 */

/** ¿La persona pidió menos movimiento? Entonces tampoco sonido (76). */
export function sinMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Dos notas cortas que suben: «encontramos algo». Unos 350 ms en total. */
export function pingSugerencia(): void {
  if (sinMovimiento() || typeof window === 'undefined' || !('AudioContext' in window)) return;
  try {
    const ctx = new AudioContext();
    const nota = (frecuencia: number, desde: number, dura: number) => {
      const osc = ctx.createOscillator();
      const gan = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frecuencia;
      gan.gain.setValueAtTime(0, ctx.currentTime + desde);
      gan.gain.linearRampToValueAtTime(0.18, ctx.currentTime + desde + 0.02);
      gan.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + desde + dura);
      osc.connect(gan).connect(ctx.destination);
      osc.start(ctx.currentTime + desde);
      osc.stop(ctx.currentTime + desde + dura);
    };
    nota(880, 0, 0.18);
    nota(1318.5, 0.16, 0.22);
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    /* sin audio, sin drama */
  }
}
