import React, { useRef, useEffect } from 'react';

/**
 * RadarMapBackground (Extendido para envolver el Radar y el Manifiesto raDAR)
 * - Cobertura continua y vertical desde la entrada del radar hasta el encabezado de "¿Cómo funciona?".
 * - Animación fluida de partículas (bolitas viajeras) por GPU y rutas matemáticas nativas.
 * - Nodos con pulsos y filamentos de conexión que flanquean e interactúan con el nuevo header.
 * - Fundido gradual inferior con degradado suave hacia la superficie general.
 */
export const RadarMapBackground: React.FC = () => {
  const mobileParticleRefs = useRef<(SVGGElement | null)[]>([]);
  const desktopParticleRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    // 1. Rutas matemáticas en memoria para móvil (orgánicas, estilo constelación entre el radar y un poco abajo de Conoce raDAR)
    const mobilePathsData = [
      { d: 'M 120 150 L 205 65 L 290 140 L 375 80 L 290 140 L 120 150 Z', dur: 18000 },
      { d: 'M 120 150 Q 30 380 95 630 L 155 710 L 80 755 L 95 630 Q 30 380 120 150 Z', dur: 24000 },
      { d: 'M 290 140 Q 420 380 355 620 L 295 705 L 370 750 L 355 620 Q 420 380 290 140 Z', dur: 26000 },
      { d: 'M 120 150 Q 30 380 95 630 L 295 705 L 355 620 Q 420 380 290 140 L 205 65 L 120 150 Z', dur: 30000 },
      { d: 'M 95 630 L 155 710 L 220 760 L 370 750 L 295 705 L 95 630 Z', dur: 22000 },
      { d: 'M 355 620 L 295 705 L 220 760 L 80 755 L 155 710 L 95 630 L 355 620 Z', dur: 25000 },
    ].map((item) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', item.d);
      return { path: p, length: p.getTotalLength(), dur: item.dur };
    });

    // 2. Rutas matemáticas en memoria para escritorio (superiores y extendidas hacia el manifiesto)
    const desktopPathsData = [
      { d: 'M 80 280 C 250 140, 480 160, 720 120 C 960 80, 1200 160, 1480 240 C 1550 420, 1420 650, 1260 520 C 1050 420, 850 240, 480 480 C 300 480, 160 420, 80 280 Z', dur: 32000 },
      { d: 'M 1480 720 C 1300 820, 1150 720, 880 840 C 600 860, 360 780, 220 640 C 140 480, 280 360, 360 480 C 520 620, 780 760, 1150 720 C 1350 700, 1440 710, 1480 720 Z', dur: 38000 },
      { d: 'M 380 200 C 650 100, 950 160, 1180 220 C 1450 300, 1400 520, 1220 680 C 1000 780, 750 820, 380 760 C 220 720, 240 500, 340 380 C 400 300, 300 240, 380 200 Z', dur: 30000 },
      { d: 'M 1240 340 C 1360 220, 1500 260, 1520 450 C 1440 650, 1200 750, 850 780 C 500 750, 280 620, 120 460 C 80 260, 280 180, 480 220 C 780 150, 1050 250, 1240 340 Z', dur: 36000 },
      { d: 'M 160 580 C 100 420, 180 260, 340 220 C 580 160, 820 140, 1120 300 C 1380 440, 1500 620, 1380 720 C 1180 820, 850 800, 450 740 C 280 720, 200 680, 160 580 Z', dur: 42000 },
      { d: 'M 1440 260 C 1280 380, 1120 320, 880 220 C 640 140, 400 240, 240 360 C 120 480, 180 660, 340 760 C 620 840, 1020 820, 1320 680 C 1520 540, 1540 360, 1440 260 Z', dur: 28000 },
      // Rutas adicionales que flanquean el nuevo header y bajan hacia "¿Cómo funciona?"
      { d: 'M 360 770 C 220 880, 160 1020, 200 1160 C 260 1260, 420 1280, 340 1080 C 260 960, 320 850, 360 770 Z', dur: 34000 },
      { d: 'M 1460 700 C 1360 850, 1420 1020, 1350 1180 C 1240 1280, 1100 1260, 1200 1060 C 1280 920, 1380 820, 1460 700 Z', dur: 36000 },
      { d: 'M 200 1160 C 350 1260, 600 1290, 800 1290 C 1000 1290, 1240 1260, 1350 1180 C 1120 1240, 480 1240, 200 1160 Z', dur: 26000 },
    ].map((item) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', item.d);
      return { path: p, length: p.getTotalLength(), dur: item.dur };
    });

    let rafId: number;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = now - startTime;

      // Animar las partículas móviles
      for (let i = 0; i < mobilePathsData.length; i++) {
        const el = mobileParticleRefs.current[i];
        if (!el) continue;
        const config = mobilePathsData[i];
        if (config.length === 0) continue;
        const progress = (elapsed % config.dur) / config.dur;
        const pt = config.path.getPointAtLength(progress * config.length);
        el.setAttribute('transform', `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
      }

      // Animar las partículas de escritorio
      for (let i = 0; i < desktopPathsData.length; i++) {
        const el = desktopParticleRefs.current[i];
        if (!el) continue;
        const config = desktopPathsData[i];
        if (config.length === 0) continue;
        const progress = (elapsed % config.dur) / config.dur;
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
      {/* 1. DEGRADADOS DE FUNDIDO SUPERIOR E INFERIOR */}
      <div className="absolute inset-x-0 top-0 h-28 sm:h-36 bg-linear-to-b from-brand-surface via-brand-surface/75 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-44 sm:h-60 bg-linear-to-t from-brand-surface via-brand-surface/85 to-transparent pointer-events-none z-10" />

      {/* =========================================================================
          1. VERSIÓN MÓVIL (block sm:hidden) - viewBox extendido (450 x 1200)
          Cubre desde el radar hasta el nuevo header y el inicio de ¿Cómo funciona?
         ========================================================================= */}
      <svg
        viewBox="0 0 450 1200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block sm:hidden w-full h-full object-cover opacity-90"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <linearGradient id="mob-route-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="mob-route-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="mob-route-vertical" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.32" />
          </linearGradient>
        </defs>

        {/* Anillos concéntricos sutiles adaptados al radar grande (Centro: 225, 380) */}
        <g className="pointer-events-none opacity-40">
          <circle cx="225" cy="380" r="195" stroke="#EF4444" strokeWidth="0.8" strokeOpacity="0.18" />
          <circle cx="225" cy="380" r="265" stroke="#EF4444" strokeWidth="0.7" strokeOpacity="0.12" strokeDasharray="4,5" />
          <circle cx="225" cy="380" r="335" stroke="#3B82F6" strokeWidth="0.65" strokeOpacity="0.08" />
        </g>

        {/* Siluetas continentales sutiles en los extremos */}
        <g className="opacity-[0.28] text-slate-400">
          <path
            d="M 60 80 
               C 120 50, 220 40, 290 55 
               C 360 50, 410 70, 430 110 
               C 380 150, 280 160, 200 155 
               C 130 160, 70 130, 60 80 Z"
            fill="currentColor"
            fillOpacity="0.04"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeOpacity="0.2"
          />
          <path
            d="M 70 660 
               C 140 645, 250 645, 340 655 
               C 390 680, 390 740, 340 770 
               C 260 790, 160 785, 110 760 
               C 70 720, 60 680, 70 660 Z"
            fill="currentColor"
            fillOpacity="0.04"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeOpacity="0.2"
          />
        </g>

        {/* Conexiones en red continuas */}
        <g className="pointer-events-none">
          {/* Red superior (la original validada) */}
          <path d="M 120 150 L 205 65" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.35" />
          <path d="M 205 65 L 290 140" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.38" />
          <path d="M 120 150 L 290 140" stroke="#F59E0B" strokeWidth="1.0" strokeOpacity="0.28" strokeDasharray="3,4" />
          <path d="M 290 140 L 375 80" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.32" />
          <path d="M 205 65 L 375 80" stroke="url(#mob-route-blue)" strokeWidth="0.9" />

          {/* Arcos amplios laterales que rodean el radar por los costados SIN cruzarlo */}
          <path d="M 120 150 Q 30 380 95 630" stroke="url(#mob-route-vertical)" strokeWidth="1.0" strokeDasharray="3,4" />
          <path d="M 290 140 Q 420 380 355 620" stroke="url(#mob-route-vertical)" strokeWidth="1.0" strokeDasharray="3,4" />

          {/* Red orgánica tipo constelación entre el radar y un poco abajo del botón de Conoce raDAR (sin bajar al texto del header) */}
          {/* Flanco izquierdo */}
          <path d="M 95 630 L 155 710" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.35" />
          <path d="M 95 630 L 80 755" stroke="#F59E0B" strokeWidth="1.0" strokeOpacity="0.3" strokeDasharray="3,4" />
          <path d="M 155 710 L 80 755" stroke="#3B82F6" strokeWidth="0.95" strokeOpacity="0.32" />

          {/* Flanco derecho */}
          <path d="M 355 620 L 295 705" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.35" />
          <path d="M 355 620 L 370 750" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.3" strokeDasharray="3,4" />
          <path d="M 295 705 L 370 750" stroke="#EF4444" strokeWidth="0.95" strokeOpacity="0.32" />

          {/* Conexión transversal diagonal asimétrica sobre el botón */}
          <path d="M 95 630 L 295 705" stroke="url(#mob-route-red)" strokeWidth="0.9" strokeDasharray="3,4" />

          {/* Cierre suave un poco abajo del botón de Conoce raDAR (sin forma de M y sin bajar al texto) */}
          <path d="M 155 710 L 220 760" stroke="#EF4444" strokeWidth="0.85" strokeOpacity="0.25" />
          <path d="M 80 755 L 220 760" stroke="#F59E0B" strokeWidth="0.9" strokeOpacity="0.28" strokeDasharray="3,4" />
          <path d="M 220 760 L 370 750" stroke="#3B82F6" strokeWidth="0.9" strokeOpacity="0.28" />
        </g>

        {/* Nodos secundarios discretos */}
        <g className="pointer-events-none">
          <circle cx="35" cy="380" r="3.2" fill="#3B82F6" fillOpacity="0.45" />
          <circle cx="415" cy="380" r="3.2" fill="#F59E0B" fillOpacity="0.45" />
          <circle cx="65" cy="110" r="2.8" fill="#EF4444" fillOpacity="0.4" />
          <circle cx="295" cy="705" r="2.8" fill="#3B82F6" fillOpacity="0.4" />
          <circle cx="220" cy="760" r="3.0" fill="#F59E0B" fillOpacity="0.38" />
          <circle cx="380" cy="675" r="2.6" fill="#EF4444" fillOpacity="0.35" />
        </g>

        {/* BOLITAS VIAJERAS EN MÓVIL (Animadas por requestAnimationFrame) */}
        <g className="pointer-events-none">
          <g ref={(el) => { mobileParticleRefs.current[0] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#3B82F6" fillOpacity="0.25" />
            <circle r="3" fill="#2563EB" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[1] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#EF4444" fillOpacity="0.25" />
            <circle r="3" fill="#DC2626" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[2] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#F59E0B" fillOpacity="0.25" />
            <circle r="3" fill="#D97706" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[3] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6" fill="#0EA5E9" fillOpacity="0.25" />
            <circle r="2.8" fill="#0284C7" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[4] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#F59E0B" fillOpacity="0.25" />
            <circle r="3" fill="#D97706" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { mobileParticleRefs.current[5] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6" fill="#EF4444" fillOpacity="0.25" />
            <circle r="2.8" fill="#DC2626" fillOpacity="0.95" />
          </g>
        </g>

        {/* Pines con corazón en móvil (Equilibrados: 3 Amarillos, 3 Rojos, 3 Azules, entre el radar y un poco abajo del botón, NUNCA debajo del texto) */}
        <g>
          {/* Zona Superior */}
          <g transform="translate(120, 150)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#F59E0B" />
          </g>
          <g transform="translate(205, 65)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#EF4444" />
          </g>
          <g transform="translate(290, 140)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#2563EB" />
          </g>
          <g transform="translate(375, 80)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#F59E0B" />
          </g>

          {/* Zona Inferior: Constelación asimétrica y orgánica (entre el radar y un poco abajo del botón de Conoce raDAR) */}
          <g transform="translate(95, 630)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#EF4444" />
          </g>
          <g transform="translate(155, 710)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#2563EB" />
          </g>
          <g transform="translate(80, 755)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#F59E0B" />
          </g>
          <g transform="translate(355, 620)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#2563EB" />
          </g>
          <g transform="translate(370, 750)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#EF4444" />
          </g>
        </g>
      </svg>


      {/* =========================================================================
          2. VERSIÓN ESCRITORIO (hidden sm:block) - viewBox extendido (1600 x 1350)
          Cubre desde el radar hasta el nuevo header y el inicio de ¿Cómo funciona?
         ========================================================================= */}
      <svg
        viewBox="0 0 1600 1350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden sm:block w-full h-full object-cover opacity-90"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <linearGradient id="route-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="route-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.38" />
            <stop offset="50%" stopColor="#F87171" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0.06" />
          </linearGradient>

          <linearGradient id="route-bridge-bottom" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.32" />
          </linearGradient>
        </defs>

        {/* Anillos concéntricos sutiles del radar (Centro: 800, 420) */}
        <g className="pointer-events-none opacity-50">
          <circle cx="800" cy="420" r="285" stroke="#EF4444" strokeWidth="0.8" strokeOpacity="0.18" />
          <circle cx="800" cy="420" r="410" stroke="#EF4444" strokeWidth="0.75" strokeOpacity="0.14" strokeDasharray="4,6" />
          <circle cx="800" cy="420" r="560" stroke="#3B82F6" strokeWidth="0.7" strokeOpacity="0.10" />
          <circle cx="800" cy="420" r="720" stroke="#94A3B8" strokeWidth="0.6" strokeOpacity="0.07" strokeDasharray="6,8" />
        </g>

        {/* Siluetas de continentes sutiles */}
        <g className="opacity-[0.35] text-slate-400">
          <path
            d="M 50 170 
               C 90 120, 180 100, 250 110 
               C 320 105, 390 135, 430 175 
               C 450 215, 440 270, 410 310 
               C 370 340, 330 365, 280 375 
               C 230 395, 180 360, 150 330 
               C 110 320, 70 350, 50 300 Z"
            fill="currentColor"
            fillOpacity="0.035"
            stroke="currentColor"
            strokeWidth="0.85"
            strokeOpacity="0.22"
          />

          <path
            d="M 180 370 
               C 215 365, 260 380, 285 410 
               C 300 435, 320 450, 310 470 
               C 290 480, 265 465, 240 445 
               C 210 425, 175 405, 165 385 Z"
            fill="currentColor"
            fillOpacity="0.04"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.25"
          />

          <path
            d="M 280 460 
               C 310 440, 360 440, 395 460 
               C 435 485, 480 515, 495 565 
               C 510 625, 485 690, 450 740 
               C 410 800, 360 840, 325 870 
               C 310 845, 305 790, 305 740 
               C 295 680, 250 620, 225 570 
               C 210 530, 220 500, 255 475 Z"
            fill="currentColor"
            fillOpacity="0.045"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeOpacity="0.32"
          />

          {/* Extensión de Sudamérica hacia la zona inferior */}
          <path
            d="M 325 870
               C 340 920, 360 1020, 330 1120
               C 290 1200, 220 1250, 180 1240
               C 150 1180, 160 1060, 200 960
               C 240 880, 290 840, 325 870 Z"
            fill="currentColor"
            fillOpacity="0.035"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeOpacity="0.25"
          />

          {/* Continente derecho superior */}
          <path
            d="M 1100 160 
               C 1140 130, 1220 140, 1270 190 
               C 1290 240, 1270 290, 1230 320 
               C 1180 340, 1130 320, 1100 270 
               C 1085 220, 1085 180, 1100 160 Z"
            fill="currentColor"
            fillOpacity="0.035"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.22"
          />

          <path
            d="M 1110 370 
               C 1160 360, 1230 390, 1255 450 
               C 1280 520, 1260 610, 1220 670 
               C 1180 710, 1145 680, 1125 620 
               C 1105 560, 1075 480, 1085 420 Z"
            fill="currentColor"
            fillOpacity="0.035"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.22"
          />

          <path
            d="M 1290 160 
               C 1380 130, 1480 150, 1540 210 
               C 1560 270, 1530 350, 1470 400 
               C 1410 430, 1340 410, 1300 360 
               C 1270 300, 1260 220, 1290 160 Z"
            fill="currentColor"
            fillOpacity="0.03"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.2"
          />

          {/* Continente derecho inferior extendido */}
          <path
            d="M 1390 630 
               C 1440 605, 1510 625, 1540 670 
               C 1550 715, 1515 765, 1465 775 
               C 1415 780, 1375 735, 1370 685 Z"
            fill="currentColor"
            fillOpacity="0.035"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.22"
          />
          <path
            d="M 1420 820
               C 1470 810, 1530 840, 1540 890
               C 1550 960, 1490 1050, 1420 1100
               C 1360 1080, 1340 980, 1370 900
               C 1390 850, 1400 825, 1420 820 Z"
            fill="currentColor"
            fillOpacity="0.03"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeOpacity="0.2"
          />
        </g>

        {/* Conexiones en red en escritorio (superiores e inferiores extendidas) */}
        <g className="pointer-events-none">
          {/* Red Superior */}
          <path d="M 270 500 L 365 470" stroke="#EF4444" strokeWidth="1.2" strokeOpacity="0.38" />
          <path d="M 270 500 L 335 380" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.32" />
          <path d="M 335 380 L 365 470" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.32" />
          <path d="M 335 380 L 170 390" stroke="url(#route-blue)" strokeWidth="1.0" />
          <path d="M 170 390 L 100 260" stroke="url(#route-blue)" strokeWidth="0.9" />
          <path d="M 100 260 L 390 210" stroke="url(#route-blue)" strokeWidth="0.85" />
          <path d="M 390 210 L 335 380" stroke="url(#route-red)" strokeWidth="0.95" />
          <path d="M 270 500 L 230 630" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.35" />
          <path d="M 230 630 L 360 770" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.35" />

          {/* Red Flanco Derecho Superior */}
          <path d="M 1130 320 L 1170 210" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.32" />
          <path d="M 1170 210 L 1260 180" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.28" strokeDasharray="3,5" />
          <path d="M 1130 320 L 1250 350" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.32" />
          <path d="M 1250 350 L 1230 520" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.35" />
          <path d="M 1230 520 L 1180 700" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.3" strokeDasharray="4,5" />
          <path d="M 1250 350 L 1490 260" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.28" />
          <path d="M 1490 260 L 1460 700" stroke="#EF4444" strokeWidth="1.0" strokeOpacity="0.28" />
          <path d="M 1180 700 L 1460 700" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.28" strokeDasharray="3,4" />

          {/* Red Flanco Izquierdo Inferior (flanqueando el manifiesto) */}
          <path d="M 360 770 L 210 930" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.35" />
          <path d="M 230 630 L 130 880" stroke="#EF4444" strokeWidth="1.0" strokeOpacity="0.3" strokeDasharray="3,4" />
          <path d="M 130 880 L 210 930" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.32" />
          <path d="M 210 930 L 320 1090" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.35" />
          <path d="M 130 880 L 160 1180" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.28" strokeDasharray="4,5" />
          <path d="M 320 1090 L 260 1260" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.32" />
          <path d="M 160 1180 L 260 1260" stroke="#EF4444" strokeWidth="1.0" strokeOpacity="0.3" />

          {/* Red Flanco Derecho Inferior (flanqueando el manifiesto) */}
          <path d="M 1180 700 L 1360 910" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.35" />
          <path d="M 1460 700 L 1480 880" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.3" strokeDasharray="3,4" />
          <path d="M 1360 910 L 1480 880" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.32" />
          <path d="M 1360 910 L 1240 1080" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.35" />
          <path d="M 1480 880 L 1420 1180" stroke="#EF4444" strokeWidth="1.0" strokeOpacity="0.28" strokeDasharray="4,5" />
          <path d="M 1240 1080 L 1330 1260" stroke="#EF4444" strokeWidth="1.0" strokeOpacity="0.32" />
          <path d="M 1420 1180 L 1330 1260" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.3" />

          {/* Conexión transversal inferior (curva de cierre sobre el título de ¿Cómo funciona?) */}
          <path
            d="M 260 1260 Q 800 1330 1330 1260"
            stroke="url(#route-bridge-bottom)"
            strokeWidth="1.0"
            strokeDasharray="4,6"
            strokeOpacity="0.4"
          />
        </g>

        {/* Nodos secundarios discretos en escritorio */}
        <g className="pointer-events-none">
          <circle cx="160" cy="580" r="3.2" fill="#3B82F6" fillOpacity="0.4" />
          <circle cx="480" cy="220" r="3" fill="#F59E0B" fillOpacity="0.4" />
          <circle cx="1440" cy="260" r="3" fill="#EF4444" fillOpacity="0.4" />
          <circle cx="850" cy="780" r="3.2" fill="#3B82F6" fillOpacity="0.3" />
          <circle cx="100" cy="1030" r="3" fill="#EF4444" fillOpacity="0.35" />
          <circle cx="1500" cy="1040" r="3" fill="#3B82F6" fillOpacity="0.35" />
          <circle cx="620" cy="1290" r="3.2" fill="#3B82F6" fillOpacity="0.35" />
          <circle cx="980" cy="1290" r="3.2" fill="#EF4444" fillOpacity="0.35" />
        </g>

        {/* BOLITAS VIAJERAS EN ESCRITORIO (Animadas por GPU) */}
        <g className="pointer-events-none">
          <g ref={(el) => { desktopParticleRefs.current[0] = el; }} style={{ willChange: 'transform' }}>
            <circle r="7" fill="#3B82F6" fillOpacity="0.25" />
            <circle r="3.2" fill="#2563EB" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[1] = el; }} style={{ willChange: 'transform' }}>
            <circle r="7" fill="#EF4444" fillOpacity="0.25" />
            <circle r="3.2" fill="#DC2626" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[2] = el; }} style={{ willChange: 'transform' }}>
            <circle r="7" fill="#F59E0B" fillOpacity="0.25" />
            <circle r="3.2" fill="#D97706" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[3] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#0EA5E9" fillOpacity="0.25" />
            <circle r="3" fill="#0284C7" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[4] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#F43F5E" fillOpacity="0.25" />
            <circle r="3" fill="#E11D48" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[5] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6" fill="#FBBF24" fillOpacity="0.25" />
            <circle r="2.8" fill="#B45309" fillOpacity="0.95" />
          </g>
          {/* Partículas inferiores que flanquean el nuevo header */}
          <g ref={(el) => { desktopParticleRefs.current[6] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#3B82F6" fillOpacity="0.25" />
            <circle r="3" fill="#2563EB" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[7] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6.5" fill="#EF4444" fillOpacity="0.25" />
            <circle r="3" fill="#DC2626" fillOpacity="0.95" />
          </g>
          <g ref={(el) => { desktopParticleRefs.current[8] = el; }} style={{ willChange: 'transform' }}>
            <circle r="6" fill="#F59E0B" fillOpacity="0.25" />
            <circle r="2.8" fill="#D97706" fillOpacity="0.95" />
          </g>
        </g>

        {/* PINES CON CORAZÓN EN ESCRITORIO */}
        <g>
          {/* FLANCO IZQUIERDO SUPERIOR */}
          <g transform="translate(270, 500)">
            <path d="M 0 -22 C -6.6 -22 -12 -16.6 -12 -10 C -12 -2.5 0 0 0 0 C 0 0 12 -2.5 12 -10 C 12 -16.6 6.6 -22 0 -22 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.7" />
            <path d="M 0 -13.5 C -0.8 -15 -2.8 -15.5 -4 -14.2 C -5.2 -12.8 -4.8 -10.8 -3.2 -9.3 L 0 -6.5 L 3.2 -9.3 C 4.8 -10.8 5.2 -12.8 4 -14.2 C 2.8 -15.5 0.8 -15 0 -13.5 Z" fill="#EF4444" />
          </g>
          <g transform="translate(365, 470)">
            <path d="M 0 -19 C -5.5 -19 -10 -14.5 -10 -9 C -10 -2 0 0 0 0 C 0 0 10 -2 10 -9 C 10 -14.5 5.5 -19 0 -19 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.4" />
            <path d="M 0 -11.8 C -0.7 -13.2 -2.4 -13.6 -3.5 -12.5 C -4.5 -11.2 -4.2 -9.5 -2.8 -8.2 L 0 -5.8 L 2.8 -8.2 C 4.2 -9.5 4.5 -11.2 3.5 -12.5 C 2.4 -13.6 0.7 -13.2 0 -11.8 Z" fill="#2563EB" />
          </g>
          <g transform="translate(335, 380)">
            <path d="M 0 -18 C -5 -18 -9 -14 -9 -8.5 C -9 -2 0 0 0 0 C 0 0 9 -2 9 -8.5 C 9 -14 5 -18 0 -18 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" />
            <path d="M 0 -11 C -0.6 -12.3 -2.2 -12.7 -3.2 -11.7 C -4.2 -10.5 -3.9 -8.9 -2.6 -7.7 L 0 -5.4 L 2.6 -7.7 C 3.9 -8.9 4.2 -10.5 3.2 -11.7 C 2.2 -12.7 0.6 -12.3 0 -11 Z" fill="#F59E0B" />
          </g>
          <g transform="translate(170, 390)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.3" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#EF4444" />
          </g>
          <g transform="translate(390, 210)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" strokeOpacity="0.8" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#2563EB" fillOpacity="0.8" />
          </g>
          <g transform="translate(100, 260)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.8" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#F59E0B" fillOpacity="0.8" />
          </g>
          <g transform="translate(230, 630)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" strokeOpacity="0.8" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#2563EB" />
          </g>
          <g transform="translate(360, 770)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.3" strokeOpacity="0.85" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#EF4444" fillOpacity="0.85" />
          </g>

          {/* FLANCO IZQUIERDO INFERIOR (flanqueando el nuevo header y el título de ¿Cómo funciona?) */}
          <g transform="translate(210, 930)">
            <path d="M 0 -18 C -5 -18 -9 -14 -9 -8.5 C -9 -2 0 0 0 0 C 0 0 9 -2 9 -8.5 C 9 -14 5 -18 0 -18 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.4" />
            <path d="M 0 -11 C -0.6 -12.3 -2.2 -12.7 -3.2 -11.7 C -4.2 -10.5 -3.9 -8.9 -2.6 -7.7 L 0 -5.4 L 2.6 -7.7 C 3.9 -8.9 4.2 -10.5 3.2 -11.7 C 2.2 -12.7 0.6 -12.3 0 -11 Z" fill="#F59E0B" />
          </g>
          <g transform="translate(130, 880)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.3" strokeOpacity="0.85" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#EF4444" />
          </g>
          <g transform="translate(320, 1090)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#2563EB" />
          </g>
          <g transform="translate(160, 1180)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#F59E0B" />
          </g>
          <g transform="translate(260, 1260)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#EF4444" />
          </g>

          {/* FLANCO DERECHO SUPERIOR */}
          <g transform="translate(1130, 320)">
            <path d="M 0 -19 C -5.5 -19 -10 -14.5 -10 -9 C -10 -2 0 0 0 0 C 0 0 10 -2 10 -9 C 10 -14.5 5.5 -19 0 -19 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.4" strokeOpacity="0.85" />
            <path d="M 0 -11.8 C -0.7 -13.2 -2.4 -13.6 -3.5 -12.5 C -4.5 -11.2 -4.2 -9.5 -2.8 -8.2 L 0 -5.8 L 2.8 -8.2 C 4.2 -9.5 4.5 -11.2 3.5 -12.5 C 2.4 -13.6 0.7 -13.2 0 -11.8 Z" fill="#EF4444" fillOpacity="0.85" />
          </g>
          <g transform="translate(1170, 210)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" strokeOpacity="0.8" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#2563EB" />
          </g>
          <g transform="translate(1260, 180)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" strokeOpacity="0.8" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#F59E0B" fillOpacity="0.8" />
          </g>
          <g transform="translate(1250, 350)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#F59E0B" />
          </g>
          <g transform="translate(1230, 520)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#2563EB" />
          </g>
          <g transform="translate(1180, 700)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.3" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#EF4444" />
          </g>
          <g transform="translate(1490, 260)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" strokeOpacity="0.85" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#F59E0B" fillOpacity="0.85" />
          </g>
          <g transform="translate(1460, 700)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" strokeOpacity="0.8" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#2563EB" fillOpacity="0.8" />
          </g>

          {/* FLANCO DERECHO INFERIOR (flanqueando el nuevo header y el título de ¿Cómo funciona?) */}
          <g transform="translate(1360, 910)">
            <path d="M 0 -18 C -5 -18 -9 -14 -9 -8.5 C -9 -2 0 0 0 0 C 0 0 9 -2 9 -8.5 C 9 -14 5 -18 0 -18 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.4" />
            <path d="M 0 -11 C -0.6 -12.3 -2.2 -12.7 -3.2 -11.7 C -4.2 -10.5 -3.9 -8.9 -2.6 -7.7 L 0 -5.4 L 2.6 -7.7 C 3.9 -8.9 4.2 -10.5 3.2 -11.7 C 2.2 -12.7 0.6 -12.3 0 -11 Z" fill="#EF4444" />
          </g>
          <g transform="translate(1480, 880)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" strokeOpacity="0.8" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#F59E0B" />
          </g>
          <g transform="translate(1240, 1080)">
            <path d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" />
            <path d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z" fill="#2563EB" />
          </g>
          <g transform="translate(1420, 1180)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#EF4444" />
          </g>
          <g transform="translate(1330, 1260)">
            <path d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.3" />
            <path d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z" fill="#F59E0B" />
          </g>
        </g>
      </svg>
    </div>
  );
};
