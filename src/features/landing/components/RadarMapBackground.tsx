import React, { useRef, useEffect } from 'react';

/**
 * RadarMapBackground (Red de Nodos y Constelaciones Territoriales)
 * - NUNCA forma un circuito ni un marco alrededor de la pantalla.
 * - Sigue la arquitectura de grafo en red territorial (con nodos de 4 puntas, 3 puntas, 2 puntas y hojas).
 * - Constelaciones abiertas en territorio occidental y oriental, con cielo abierto entre ambas.
 * - 8 bolitas viajeras que se desplazan fluidamente a través de las ramas de la red.
 */
export const RadarMapBackground: React.FC = () => {
  const mobileParticleRefs = useRef<(SVGGElement | null)[]>([]);
  const desktopParticleRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    // 1. 8 Rutas en grafo para móvil (Flancos laterales limpios y sector sur despejado)
    const mobilePathsData = [
      // Flanco Izquierdo (sin pisar el radar)
      { d: 'M 45 105 L 35 195 L 65 285 L 35 195 L 45 105', dur: 14000, phase: 0.1 },
      { d: 'M 65 285 L 120 335 L 65 285 L 35 195 L 65 285', dur: 16000, phase: 0.6 },

      // Flanco Derecho (sin pisar el radar)
      { d: 'M 405 100 L 415 190 L 385 285 L 415 190 L 405 100', dur: 15000, phase: 0.25 },
      { d: 'M 385 285 L 330 335 L 385 285 L 415 190 L 385 285', dur: 17000, phase: 0.75 },

      // Sector Sur (por debajo de los CTAs, despejado)
      { d: 'M 60 735 L 170 805 L 280 845 L 170 805 L 60 735', dur: 15000, phase: 0.15 },
      { d: 'M 170 805 L 280 845 L 370 855 L 280 845 L 170 805', dur: 17000, phase: 0.65 },
      { d: 'M 370 855 L 390 765 L 280 845 L 370 855', dur: 16000, phase: 0.35 },
      { d: 'M 390 765 L 370 855 L 280 845 L 170 805 L 60 735 L 170 805', dur: 19000, phase: 0.85 },
    ].map((item) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', item.d);
      return { path: p, length: p.getTotalLength(), dur: item.dur, phase: item.phase };
    });

    // 2. 8 Rutas en grafo para escritorio (Constelación Occidental y Constelación Oriental)
    // CERO CIRCUITO PERIMETRAL: ramas dendríticas y hubs con 4, 3 y 2 conexiones.
    const desktopPathsData = [
      // Constelación Occidental (Izquierda) - 4 partículas
      // Ruta 1: Desde extremo superior izquierdo cruzando hacia la nueva rama sobre 'encuentro digital' y hacia N_L3
      { d: 'M 90 160 L 210 260 L 320 100 L 520 200 L 640 130 L 520 200 L 320 100 L 210 260 L 90 160', dur: 18000, phase: 0.05 },
      // Ruta 2: Hub central izquierdo recorriendo el flanco exterior despejado del texto
      { d: 'M 90 160 L 210 260 L 70 420 L 100 680 L 70 420 L 210 260 L 90 160', dur: 17000, phase: 0.55 },
      // Ruta 3: Rama inferior izquierda recorriendo hacia la antena sur pasando bajo 'Ofrecer ayuda'
      { d: 'M 100 680 L 280 580 L 380 780 L 510 690 L 660 810 L 510 690 L 380 780 L 280 580 L 100 680', dur: 19000, phase: 0.3 },
      // Ruta 4: Bucle triangular local entre N_L1, N_L4 y el hub N_L5
      { d: 'M 90 160 L 70 420 L 210 260 L 90 160', dur: 14000, phase: 0.8 },

      // Constelación Oriental (Derecha / Radar) - 4 partículas
      // Ruta 5: Antena norte oriental hacia el hub este N_R4
      { d: 'M 940 120 L 1220 90 L 1460 360 L 1500 130 L 1220 90', dur: 16000, phase: 0.2 },
      // Ruta 6: Tríada de interconexión en el flanco derecho del radar
      { d: 'M 1460 360 L 1550 470 L 1420 620 L 1460 360', dur: 14000, phase: 0.7 },
      // Ruta 7: Recorrido por el sector sureste y el hub N_R6
      { d: 'M 1420 620 L 1520 770 L 1240 790 L 1420 620', dur: 15000, phase: 0.45 },
      // Ruta 8: Rama inferior oriental terminando en la antena interna sur
      { d: 'M 1460 360 L 1420 620 L 1240 790 L 980 770 L 1240 790 L 1420 620', dur: 19000, phase: 0.9 },
    ].map((item) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', item.d);
      return { path: p, length: p.getTotalLength(), dur: item.dur, phase: item.phase };
    });

    let rafId: number;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = now - startTime;

      // Partículas móvil
      for (let i = 0; i < mobilePathsData.length; i++) {
        const el = mobileParticleRefs.current[i];
        if (!el) continue;
        const config = mobilePathsData[i];
        if (config.length === 0) continue;
        const progress = ((elapsed + config.phase * config.dur) % config.dur) / config.dur;
        const pt = config.path.getPointAtLength(progress * config.length);
        el.setAttribute('transform', `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
      }

      // Partículas escritorio
      for (let i = 0; i < desktopPathsData.length; i++) {
        const el = desktopParticleRefs.current[i];
        if (!el) continue;
        const config = desktopPathsData[i];
        if (config.length === 0) continue;
        const progress = ((elapsed + config.phase * config.dur) % config.dur) / config.dur;
        const pt = config.path.getPointAtLength(progress * config.length);
        el.setAttribute('transform', `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0"
      style={{
        contain: 'paint',
      }}
      aria-hidden="true"
    >
      {/* Degradados sutiles de integración superior e inferior */}
      <div className="absolute inset-x-0 top-0 h-16 sm:h-24 bg-linear-to-b from-brand-surface via-brand-surface/75 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-linear-to-t from-brand-surface via-brand-surface/85 to-transparent pointer-events-none z-10" />

      {/* =========================================================================
          1. VERSIÓN MÓVIL (block sm:hidden) - Redes Territoriales Abiertas
         ========================================================================= */}
      <svg
        viewBox="0 0 450 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block sm:hidden w-full h-full object-cover opacity-90"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* LÍNEAS DE GRAFO MÓVIL (Flancos laterales y sur, 100% libre detrás del radar) */}
        <g className="pointer-events-none">
          {/* Flanco Izquierdo */}
          <path d="M 45 105 L 35 195" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.45" />
          <path d="M 35 195 L 65 285" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.4" strokeDasharray="3,4" />
          <path d="M 65 285 L 120 335" stroke="#F59E0B" strokeWidth="1.1" strokeOpacity="0.4" />

          {/* Flanco Derecho */}
          <path d="M 405 100 L 415 190" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.45" />
          <path d="M 415 190 L 385 285" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.4" strokeDasharray="3,4" />
          <path d="M 385 285 L 330 335" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.4" />

          {/* Sector Sur (despejado debajo de los CTAs) */}
          <path d="M 60 735 L 170 805" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.45" />
          <path d="M 170 805 L 280 845" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.4" strokeDasharray="3,4" />
          <path d="M 280 845 L 370 855" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.42" />
          <path d="M 370 855 L 390 765" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.4" />
        </g>

        {/* Nodos secundarios en móvil (laterales y debajo, sin estorbar) */}
        <g className="pointer-events-none">
          {/* Flanco izquierdo */}
          <circle cx="65" cy="285" r="3.2" fill="#EF4444" fillOpacity="0.6" />
          <circle cx="120" cy="335" r="3.0" fill="#F59E0B" fillOpacity="0.5" />
          {/* Flanco derecho */}
          <circle cx="385" cy="285" r="3.2" fill="#3B82F6" fillOpacity="0.6" />
          <circle cx="330" cy="335" r="3.0" fill="#EF4444" fillOpacity="0.5" />
          {/* Sector Sur */}
          <circle cx="170" cy="805" r="3.2" fill="#3B82F6" fillOpacity="0.6" />
          <circle cx="370" cy="855" r="3.0" fill="#F59E0B" fillOpacity="0.5" />
        </g>

        {/* 8 Bolitas Viajeras en Móvil */}
        <g className="pointer-events-none">
          <g ref={(el) => { mobileParticleRefs.current[0] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#3B82F6" fillOpacity="0.32" />
            <circle r="3.2" fill="#2563EB" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[1] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#EF4444" fillOpacity="0.32" />
            <circle r="3.2" fill="#DC2626" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[2] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#F59E0B" fillOpacity="0.32" />
            <circle r="3.2" fill="#D97706" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[3] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#0EA5E9" fillOpacity="0.32" />
            <circle r="3.0" fill="#0284C7" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[4] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#3B82F6" fillOpacity="0.32" />
            <circle r="3.2" fill="#2563EB" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[5] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#EF4444" fillOpacity="0.32" />
            <circle r="3.0" fill="#DC2626" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[6] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#F59E0B" fillOpacity="0.32" />
            <circle r="3.0" fill="#D97706" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[7] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#0EA5E9" fillOpacity="0.32" />
            <circle r="3.0" fill="#0284C7" fillOpacity="0.95" />
          </g>
        </g>

        {/* Pines con corazón en móvil (Ubicados en flancos laterales y sector sur) */}
        <g>
          {/* Flanco Izquierdo */}
          <g transform="translate(45, 105)">
            <path d="M 0 -15 C -4.2 -15 -7.5 -11.7 -7.5 -7 C -7.5 -1.6 0 0 0 0 C 0 0 7.5 -1.6 7.5 -7 C 7.5 -11.7 4.2 -15 0 -15 Z" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.3" />
            <path d="M 0 -9.5 C -0.5 -10.5 -1.8 -10.8 -2.5 -10 C -3.3 -9 -3 -7.7 -2 -6.6 L 0 -4.6 L 2 -6.6 C 3 -7.7 3.3 -9 2.5 -10 C 1.8 -10.8 0.5 -10.5 0 -9.5 Z" fill="#3B82F6" />
          </g>
          <g transform="translate(35, 195)">
            <path d="M 0 -15 C -4.2 -15 -7.5 -11.7 -7.5 -7 C -7.5 -1.6 0 0 0 0 C 0 0 7.5 -1.6 7.5 -7 C 7.5 -11.7 4.2 -15 0 -15 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" />
            <path d="M 0 -9.5 C -0.5 -10.5 -1.8 -10.8 -2.5 -10 C -3.3 -9 -3 -7.7 -2 -6.6 L 0 -4.6 L 2 -6.6 C 3 -7.7 3.3 -9 2.5 -10 C 1.8 -10.8 0.5 -10.5 0 -9.5 Z" fill="#F59E0B" />
          </g>

          {/* Flanco Derecho */}
          <g transform="translate(405, 100)">
            <path d="M 0 -15 C -4.2 -15 -7.5 -11.7 -7.5 -7 C -7.5 -1.6 0 0 0 0 C 0 0 7.5 -1.6 7.5 -7 C 7.5 -11.7 4.2 -15 0 -15 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" />
            <path d="M 0 -9.5 C -0.5 -10.5 -1.8 -10.8 -2.5 -10 C -3.3 -9 -3 -7.7 -2 -6.6 L 0 -4.6 L 2 -6.6 C 3 -7.7 3.3 -9 2.5 -10 C 1.8 -10.8 0.5 -10.5 0 -9.5 Z" fill="#F59E0B" />
          </g>
          <g transform="translate(415, 190)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.4" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#EF4444" />
          </g>

          {/* Sector Sur */}
          <g transform="translate(60, 735)">
            <path d="M 0 -15 C -4.2 -15 -7.5 -11.7 -7.5 -7 C -7.5 -1.6 0 0 0 0 C 0 0 7.5 -1.6 7.5 -7 C 7.5 -11.7 4.2 -15 0 -15 Z" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.3" />
            <path d="M 0 -9.5 C -0.5 -10.5 -1.8 -10.8 -2.5 -10 C -3.3 -9 -3 -7.7 -2 -6.6 L 0 -4.6 L 2 -6.6 C 3 -7.7 3.3 -9 2.5 -10 C 1.8 -10.8 0.5 -10.5 0 -9.5 Z" fill="#3B82F6" />
          </g>
          <g transform="translate(280, 845)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.4" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#EF4444" />
          </g>
          <g transform="translate(390, 765)">
            <path d="M 0 -15 C -4.2 -15 -7.5 -11.7 -7.5 -7 C -7.5 -1.6 0 0 0 0 C 0 0 7.5 -1.6 7.5 -7 C 7.5 -11.7 4.2 -15 0 -15 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" />
            <path d="M 0 -9.5 C -0.5 -10.5 -1.8 -10.8 -2.5 -10 C -3.3 -9 -3 -7.7 -2 -6.6 L 0 -4.6 L 2 -6.6 C 3 -7.7 3.3 -9 2.5 -10 C 1.8 -10.8 0.5 -10.5 0 -9.5 Z" fill="#F59E0B" />
          </g>
        </g>
      </svg>

      {/* =========================================================================
          2. VERSIÓN ESCRITORIO (hidden sm:block)
          REDES TERRITORIALES ABIERTAS (NODOS DE 4, 3, 2 PUNTAS Y HOJAS)
          TOTALMENTE LIBRE DE CIRCUITOS, MARCOS O LÍNEAS PERIMETRALES.
         ========================================================================= */}
      <svg
        viewBox="0 0 1600 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden sm:block w-full h-full object-cover opacity-90"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* LÍNEAS DE INTERCONEXIÓN DEL GRAFO TERRITORIAL */}
        <g className="pointer-events-none">
          {/* --- CONSTELACIÓN OCCIDENTAL (IZQUIERDA) --- */}
          {/* N_L5 es un HUB con conexiones hacia N_L1, N_L2, N_L4 */}
          <path d="M 90 160 L 210 260" stroke="#3B82F6" strokeWidth="1.3" strokeOpacity="0.45" />
          <path d="M 210 260 L 320 100" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="4,5" />
          <path d="M 210 260 L 70 420" stroke="#EF4444" strokeWidth="1.2" strokeOpacity="0.42" />

          {/* Ramas adicionales occidentales (3 y 2 puntas, y hojas abiertas) */}
          <path d="M 90 160 L 70 420" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.35" strokeDasharray="3,4" />
          <path d="M 320 100 L 640 130" stroke="#F59E0B" strokeWidth="1.3" strokeOpacity="0.45" />
          {/* Nueva rama para poblar el espacio diáfano arriba de 'de encuentro digital' */}
          <path d="M 320 100 L 520 200" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.38" strokeDasharray="4,5" />
          <path d="M 520 200 L 640 130" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.4" />

          <path d="M 70 420 L 100 680" stroke="#94A3B8" strokeWidth="1.1" strokeOpacity="0.4" />
          <path d="M 100 680 L 280 580" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="4,5" />
          <path d="M 280 580 L 380 780" stroke="#EF4444" strokeWidth="1.3" strokeOpacity="0.45" />
          {/* Nueva rama para poblar el espacio diáfano debajo del botón 'Ofrecer ayuda' */}
          <path d="M 380 780 L 510 690" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="3,4" />
          <path d="M 510 690 L 660 810" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.4" />
          <path d="M 380 780 L 660 810" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="4,5" />


          {/* --- CONSTELACIÓN ORIENTAL (DERECHA / ENTORNO AL RADAR) --- */}
          {/* N_R4 es un HUB con 4 conexiones hacia N_R2, N_R3, N_R5, N_R6 */}
          <path d="M 1220 90 L 1460 360" stroke="#F59E0B" strokeWidth="1.3" strokeOpacity="0.45" />
          <path d="M 1500 130 L 1460 360" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="4,5" />
          <path d="M 1460 360 L 1550 470" stroke="#3B82F6" strokeWidth="1.3" strokeOpacity="0.45" />
          <path d="M 1460 360 L 1420 620" stroke="#EF4444" strokeWidth="1.3" strokeOpacity="0.42" />

          {/* N_R6 es un HUB con 4 conexiones hacia N_R4, N_R5, N_R7, N_R8 */}
          <path d="M 1550 470 L 1420 620" stroke="#94A3B8" strokeWidth="1.1" strokeOpacity="0.38" strokeDasharray="3,4" />
          <path d="M 1420 620 L 1520 770" stroke="#F59E0B" strokeWidth="1.3" strokeOpacity="0.45" />
          <path d="M 1420 620 L 1240 790" stroke="#3B82F6" strokeWidth="1.3" strokeOpacity="0.45" />

          {/* Ramas satelitales orientales (3 y 2 puntas, y hojas abiertas hacia el centro) */}
          <path d="M 940 120 L 1220 90" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="4,5" />
          <path d="M 1220 90 L 1500 130" stroke="#EF4444" strokeWidth="1.2" strokeOpacity="0.42" />
          <path d="M 1520 770 L 1240 790" stroke="#F59E0B" strokeWidth="1.1" strokeOpacity="0.38" strokeDasharray="4,5" />
          <path d="M 1240 790 L 980 770" stroke="#EF4444" strokeWidth="1.2" strokeOpacity="0.42" />
        </g>

        {/* Nodos circulares discretos (satélites del mapa) */}
        <g className="pointer-events-none">
          {/* Nodos Occidente */}
          <circle cx="210" cy="260" r="4.0" fill="#3B82F6" fillOpacity="0.6" />
          <circle cx="320" cy="100" r="3.5" fill="#F59E0B" fillOpacity="0.6" />
          <circle cx="520" cy="200" r="3.5" fill="#3B82F6" fillOpacity="0.55" />
          <circle cx="70" cy="420" r="3.5" fill="#3B82F6" fillOpacity="0.5" />
          <circle cx="280" cy="580" r="3.8" fill="#EF4444" fillOpacity="0.6" />
          <circle cx="510" cy="690" r="3.5" fill="#EF4444" fillOpacity="0.55" />
          <circle cx="380" cy="780" r="3.5" fill="#3B82F6" fillOpacity="0.6" />

          {/* Nodos Oriente */}
          <circle cx="940" cy="120" r="3.5" fill="#3B82F6" fillOpacity="0.55" />
          <circle cx="1500" cy="130" r="3.5" fill="#F59E0B" fillOpacity="0.55" />
          <circle cx="1460" cy="360" r="4.2" fill="#3B82F6" fillOpacity="0.65" />
          <circle cx="1420" cy="620" r="4.2" fill="#EF4444" fillOpacity="0.65" />
          <circle cx="1520" cy="770" r="3.5" fill="#F59E0B" fillOpacity="0.55" />
          <circle cx="980" cy="770" r="3.5" fill="#EF4444" fillOpacity="0.55" />
        </g>

        {/* 8 BOLITAS VIAJERAS (Flujo dinámico sin bucle cerrado perimetral) */}
        <g className="pointer-events-none">
          {/* 4 Bolitas en el grafo Occidental */}
          <g ref={(el) => { desktopParticleRefs.current[0] = el; }} style={{ willChange: 'transform' }}>
            <circle r="7.0" fill="#3B82F6" fillOpacity="0.35" />
            <circle r="3.4" fill="#2563EB" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[1] = el; }} style={{ willChange: 'transform' }}>
            <circle r="7.0" fill="#EF4444" fillOpacity="0.35" />
            <circle r="3.4" fill="#DC2626" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[2] = el; }} style={{ willChange: 'transform' }}>
            <circle r="7.0" fill="#F59E0B" fillOpacity="0.35" />
            <circle r="3.4" fill="#D97706" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[3] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.8" fill="#0EA5E9" fillOpacity="0.35" />
            <circle r="3.2" fill="#0284C7" fillOpacity="0.95" />
          </g>

          {/* 4 Bolitas en el grafo Oriental */}
          <g ref={(el) => { desktopParticleRefs.current[4] = el; }} style={{ willChange: 'transform' }}>
            <circle r="7.0" fill="#F43F5E" fillOpacity="0.35" />
            <circle r="3.3" fill="#E11D48" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[5] = el; }} style={{ willChange: 'transform' }}>
            <circle r="7.2" fill="#3B82F6" fillOpacity="0.35" />
            <circle r="3.5" fill="#1D4ED8" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[6] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.8" fill="#FBBF24" fillOpacity="0.35" />
            <circle r="3.2" fill="#B45309" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[7] = el; }} style={{ willChange: 'transform' }}>
            <circle r="7.2" fill="#EF4444" fillOpacity="0.35" />
            <circle r="3.5" fill="#B91C1C" fillOpacity="0.95" />
          </g>
        </g>

        {/* PINES CON CORAZÓN EN ESCRITORIO (Ubicados en vértices seleccionados del grafo) */}
        <g>
          {/* Pins en Grafo Occidental */}
          {/* N_L1: Extremo Noroeste */}
          <g transform="translate(90, 160)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.4" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#2563EB" />
          </g>
          {/* N_L3: Hoja superior norte */}
          <g transform="translate(640, 130)">
            <path d="M 0 -18 C -5 -18 -9 -14 -9 -8.5 C -9 -2 0 0 0 0 C 0 0 9 -2 9 -8.5 C 9 -14 5 -18 0 -18 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.4" />
            <path d="M 0 -11 C -0.6 -12.3 -2.2 -12.7 -3.2 -11.7 C -4.2 -10.5 -3.9 -8.9 -2.6 -7.7 L 0 -5.4 L 2.6 -7.7 C 3.9 -8.9 4.2 -10.5 3.2 -11.7 C 2.2 -12.7 0.6 -12.3 0 -11 Z" fill="#EF4444" />
          </g>
          {/* N_L6: Sector Sudoeste */}
          <g transform="translate(100, 680)">
            <path d="M 0 -18 C -5 -18 -9 -14 -9 -8.5 C -9 -2 0 0 0 0 C 0 0 9 -2 9 -8.5 C 9 -14 5 -18 0 -18 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.4" />
            <path d="M 0 -11 C -0.6 -12.3 -2.2 -12.7 -3.2 -11.7 C -4.2 -10.5 -3.9 -8.9 -2.6 -7.7 L 0 -5.4 L 2.6 -7.7 C 3.9 -8.9 4.2 -10.5 3.2 -11.7 C 2.2 -12.7 0.6 -12.3 0 -11 Z" fill="#F59E0B" />
          </g>
          {/* N_L8: Hoja inferior sur */}
          <g transform="translate(660, 810)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.4" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#2563EB" />
          </g>

          {/* Pins en Grafo Oriental */}
          {/* N_R2: Arriba del radar */}
          <g transform="translate(1220, 90)">
            <path d="M 0 -18 C -5 -18 -9 -14 -9 -8.5 C -9 -2 0 0 0 0 C 0 0 9 -2 9 -8.5 C 9 -14 5 -18 0 -18 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.4" />
            <path d="M 0 -11 C -0.6 -12.3 -2.2 -12.7 -3.2 -11.7 C -4.2 -10.5 -3.9 -8.9 -2.6 -7.7 L 0 -5.4 L 2.6 -7.7 C 3.9 -8.9 4.2 -10.5 3.2 -11.7 C 2.2 -12.7 0.6 -12.3 0 -11 Z" fill="#EF4444" />
          </g>
          {/* N_R5: Extremo Este */}
          <g transform="translate(1550, 470)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.4" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#2563EB" />
          </g>
          {/* N_R8: Abajo del radar */}
          <g transform="translate(1240, 790)">
            <path d="M 0 -18 C -5 -18 -9 -14 -9 -8.5 C -9 -2 0 0 0 0 C 0 0 9 -2 9 -8.5 C 9 -14 5 -18 0 -18 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.4" />
            <path d="M 0 -11 C -0.6 -12.3 -2.2 -12.7 -3.2 -11.7 C -4.2 -10.5 -3.9 -8.9 -2.6 -7.7 L 0 -5.4 L 2.6 -7.7 C 3.9 -8.9 4.2 -10.5 3.2 -11.7 C 2.2 -12.7 0.6 -12.3 0 -11 Z" fill="#F59E0B" />
          </g>
        </g>
      </svg>
    </div>
  );
};

