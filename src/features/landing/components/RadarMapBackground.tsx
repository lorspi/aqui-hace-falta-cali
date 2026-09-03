import React, { useRef, useEffect } from 'react';

/**
 * RadarMapBackground (Ultra-Optimizado para 60/120 FPS e inicio instantáneo)
 * - Inicio inmediato del reloj de animación vectorial SMIL sin depender de eventos de ventana.
 * - Difuminado superior/inferior mediante overlays de gradiente ligeros.
 * - Gráficos vectoriales puros sin filtros CPU feDropShadow.
 * - will-change: transform en las partículas viajeras para aceleración directa por hardware en la GPU.
 * - contain: 'paint' para rendimiento óptimo sin suspender los timers de animación.
 */
export const RadarMapBackground: React.FC = () => {
  const mobileParticleRefs = useRef<(SVGGElement | null)[]>([]);
  const desktopParticleRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    // 1. Rutas matemáticas en memoria para móvil
    const mobilePathsData = [
      { d: 'M 120 150 C 30 260, 30 550, 120 665 C 180 750, 290 740, 365 665 C 420 550, 420 260, 375 80 C 290 50, 205 65, 120 150 Z', dur: 26000 },
      { d: 'M 365 665 C 420 540, 420 320, 290 140 C 205 65, 120 150, 35 320 C 35 550, 185 745, 290 740 C 340 740, 360 700, 365 665 Z', dur: 32000 },
      { d: 'M 205 65 C 310 50, 375 80, 400 260 C 320 180, 240 140, 120 150 C 50 200, 80 100, 205 65 Z', dur: 24000 },
      { d: 'M 35 410 C 35 220, 160 100, 290 140 C 420 280, 420 580, 290 740 C 160 720, 35 600, 35 410 Z', dur: 28000 },
    ].map((item) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', item.d);
      return { path: p, length: p.getTotalLength(), dur: item.dur };
    });

    // 2. Rutas matemáticas en memoria para escritorio
    const desktopPathsData = [
      { d: 'M 80 280 C 250 140, 480 160, 720 120 C 960 80, 1200 160, 1480 240 C 1550 420, 1420 650, 1260 520 C 1050 420, 850 240, 480 480 C 300 480, 160 420, 80 280 Z', dur: 32000 },
      { d: 'M 1480 720 C 1300 820, 1150 720, 880 840 C 600 860, 360 780, 220 640 C 140 480, 280 360, 360 480 C 520 620, 780 760, 1150 720 C 1350 700, 1440 710, 1480 720 Z', dur: 38000 },
      { d: 'M 380 200 C 650 100, 950 160, 1180 220 C 1450 300, 1400 520, 1220 680 C 1000 780, 750 820, 380 760 C 220 720, 240 500, 340 380 C 400 300, 300 240, 380 200 Z', dur: 30000 },
      { d: 'M 1240 340 C 1360 220, 1500 260, 1520 450 C 1440 650, 1200 750, 850 780 C 500 750, 280 620, 120 460 C 80 260, 280 180, 480 220 C 780 150, 1050 250, 1240 340 Z', dur: 36000 },
      { d: 'M 160 580 C 100 420, 180 260, 340 220 C 580 160, 820 140, 1120 300 C 1380 440, 1500 620, 1380 720 C 1180 820, 850 800, 450 740 C 280 720, 200 680, 160 580 Z', dur: 42000 },
      { d: 'M 1440 260 C 1280 380, 1120 320, 880 220 C 640 140, 400 240, 240 360 C 120 480, 180 660, 340 760 C 620 840, 1020 820, 1320 680 C 1520 540, 1540 360, 1440 260 Z', dur: 28000 },
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

    // Ejecutar el primer frame de inmediato
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
      {/* 1. DEGRADADOS DE FUNDIDO SUPERIOR E INFERIOR (Cero costo de rasterizado en GPU) */}
      <div className="absolute inset-x-0 top-0 h-28 sm:h-36 bg-gradient-to-b from-[#F5F6F9] via-[#F5F6F9]/75 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-[#F5F6F9] via-[#F5F6F9]/75 to-transparent pointer-events-none z-10" />

      {/* =========================================================================
          1. VERSIÓN MÓVIL (block sm:hidden)
          4 pines arriba y 4 pines abajo, con margen holgado alrededor del radar.
         ========================================================================= */}
      <svg
        viewBox="0 0 450 820"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block sm:hidden w-full h-full object-cover opacity-90"
        preserveAspectRatio="xMidYMid slice"
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

        {/* Anillos concéntricos sutiles adaptados al radar grande (Centro: 225, 410) */}
        <g className="pointer-events-none opacity-40">
          <circle cx="225" cy="410" r="205" stroke="#EF4444" strokeWidth="0.8" strokeOpacity="0.18" />
          <circle cx="225" cy="410" r="275" stroke="#EF4444" strokeWidth="0.7" strokeOpacity="0.12" strokeDasharray="4,5" />
          <circle cx="225" cy="410" r="345" stroke="#3B82F6" strokeWidth="0.65" strokeOpacity="0.08" />
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

        {/* Conexiones en red amplias y abiertas */}
        <g className="pointer-events-none">
          <path d="M 120 150 L 205 65" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.35" />
          <path d="M 205 65 L 290 140" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.38" />
          <path d="M 120 150 L 290 140" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.28" strokeDasharray="3,4" />
          <path d="M 290 140 L 375 80" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.32" />
          <path d="M 205 65 L 375 80" stroke="url(#mob-route-blue)" strokeWidth="0.9" />

          {/* Arcos amplios que rodean el radar por los costados */}
          <path d="M 120 150 Q 30 410 120 665" stroke="url(#mob-route-vertical)" strokeWidth="1.0" strokeDasharray="3,4" />
          <path d="M 290 140 Q 420 410 365 665" stroke="url(#mob-route-vertical)" strokeWidth="1.0" strokeDasharray="3,4" />

          {/* Red inferior */}
          <path d="M 120 665 L 185 745" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.32" />
          <path d="M 185 745 L 290 740" stroke="#EF4444" strokeWidth="1.1" strokeOpacity="0.38" />
          <path d="M 290 740 L 365 665" stroke="#3B82F6" strokeWidth="1.0" strokeOpacity="0.32" />
          <path d="M 120 665 L 365 665" stroke="url(#mob-route-red)" strokeWidth="0.9" strokeDasharray="3,4" />
        </g>

        {/* Nodos secundarios discretos */}
        <g className="pointer-events-none">
          <circle cx="35" cy="410" r="3.2" fill="#3B82F6" fillOpacity="0.45" />
          <circle cx="415" cy="410" r="3.2" fill="#F59E0B" fillOpacity="0.45" />
          <circle cx="65" cy="110" r="2.8" fill="#EF4444" fillOpacity="0.4" />
          <circle cx="380" cy="735" r="2.8" fill="#3B82F6" fillOpacity="0.4" />
        </g>

        {/* BOLITAS VIAJERAS EN MÓVIL (Animadas de forma inmediata por requestAnimationFrame con GPU) */}
        <g className="pointer-events-none">
          <g
            ref={(el) => { mobileParticleRefs.current[0] = el; }}
            style={{ willChange: 'transform' }}
          >
            <circle r="6.5" fill="#3B82F6" fillOpacity="0.25" />
            <circle r="3" fill="#2563EB" fillOpacity="0.95" />
          </g>

          <g
            ref={(el) => { mobileParticleRefs.current[1] = el; }}
            style={{ willChange: 'transform' }}
          >
            <circle r="6.5" fill="#EF4444" fillOpacity="0.25" />
            <circle r="3" fill="#DC2626" fillOpacity="0.95" />
          </g>

          <g
            ref={(el) => { mobileParticleRefs.current[2] = el; }}
            style={{ willChange: 'transform' }}
          >
            <circle r="6.5" fill="#F59E0B" fillOpacity="0.25" />
            <circle r="3" fill="#D97706" fillOpacity="0.95" />
          </g>

          <g
            ref={(el) => { mobileParticleRefs.current[3] = el; }}
            style={{ willChange: 'transform' }}
          >
            <circle r="6" fill="#0EA5E9" fillOpacity="0.25" />
            <circle r="2.8" fill="#0284C7" fillOpacity="0.95" />
          </g>
        </g>

        {/* Pines con corazón en móvil */}
        <g>
          {/* 1. CALI */}
          <g transform="translate(120, 150)">
            <path
              d="M 0 -20 C -6 -20 -11 -15 -11 -9 C -11 -2 0 0 0 0 C 0 0 11 -2 11 -9 C 11 -15 6 -20 0 -20 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.6"
            />
            <path
              d="M 0 -12 C -0.8 -13.5 -2.5 -14 -3.6 -12.7 C -4.7 -11.4 -4.3 -9.6 -2.8 -8.2 L 0 -5.8 L 2.8 -8.2 C 4.3 -9.6 4.7 -11.4 3.6 -12.7 C 2.5 -14 0.8 -13.5 0 -12 Z"
              fill="#EF4444"
            />
          </g>

          {/* 2. BOGOTÁ */}
          <g transform="translate(290, 140)">
            <path
              d="M 0 -18 C -5.2 -18 -9.5 -13.8 -9.5 -8.5 C -9.5 -2 0 0 0 0 C 0 0 9.5 -2 9.5 -8.5 C 9.5 -13.8 5.2 -18 0 -18 Z"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="1.4"
            />
            <path
              d="M 0 -11 C -0.7 -12.4 -2.3 -12.8 -3.3 -11.7 C -4.3 -10.4 -4 -8.8 -2.6 -7.5 L 0 -5.2 L 2.6 -7.5 C 4 -8.8 4.3 -10.4 3.3 -11.7 C 2.3 -12.8 0.7 -12.4 0 -11 Z"
              fill="#2563EB"
            />
          </g>

          {/* 3. BARRANQUILLA / CARIBE */}
          <g transform="translate(205, 65)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.3"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#EF4444"
            />
          </g>

          {/* 4. MADRID / EUROPA */}
          <g transform="translate(375, 80)">
            <path
              d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="1.2"
              strokeOpacity="0.85"
            />
            <path
              d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z"
              fill="#2563EB"
              fillOpacity="0.85"
            />
          </g>

          {/* 5. QUITO / ANDES */}
          <g transform="translate(120, 665)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.3"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#EF4444"
            />
          </g>

          {/* 6. LIMA */}
          <g transform="translate(185, 745)">
            <path
              d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="1.3"
            />
            <path
              d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z"
              fill="#2563EB"
            />
          </g>

          {/* 7. BUENOS AIRES */}
          <g transform="translate(290, 740)">
            <path
              d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.3"
            />
            <path
              d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z"
              fill="#EF4444"
            />
          </g>

          {/* 8. SÃO PAULO / BRASIL */}
          <g transform="translate(365, 665)">
            <path
              d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="1.3"
            />
            <path
              d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z"
              fill="#2563EB"
            />
          </g>
        </g>
      </svg>


      {/* =========================================================================
          2. VERSIÓN ESCRITORIO (hidden sm:block)
          Equilibrada horizontalmente en flancos izquierdo y derecho (viewBox 1600x900)
         ========================================================================= */}
      <svg
        viewBox="0 0 1600 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden sm:block w-full h-full object-cover opacity-90"
        preserveAspectRatio="xMidYMid slice"
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

          <linearGradient id="route-bridge-top" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.32" />
          </linearGradient>

          <linearGradient id="route-bridge-bottom" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.32" />
          </linearGradient>
        </defs>

        {/* Anillos concéntricos sutiles del radar (Centro: 800, 450) */}
        <g className="pointer-events-none opacity-50">
          <circle cx="800" cy="450" r="285" stroke="#EF4444" strokeWidth="0.8" strokeOpacity="0.18" />
          <circle cx="800" cy="450" r="410" stroke="#EF4444" strokeWidth="0.75" strokeOpacity="0.14" strokeDasharray="4,6" />
          <circle cx="800" cy="450" r="560" stroke="#3B82F6" strokeWidth="0.7" strokeOpacity="0.10" />
          <circle cx="800" cy="450" r="720" stroke="#94A3B8" strokeWidth="0.6" strokeOpacity="0.07" strokeDasharray="6,8" />
        </g>

        {/* Siluetas de continentes */}
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

          <path
            d="M 280 455 
               C 305 450, 335 460, 345 485 
               C 335 515, 310 535, 280 528 
               C 260 512, 258 482, 280 455 Z"
            fill="#3B82F6"
            fillOpacity="0.04"
            stroke="#3B82F6"
            strokeWidth="0.75"
            strokeOpacity="0.35"
            strokeDasharray="2,3"
          />

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
        </g>

        {/* Conexiones en escritorio */}
        <g className="pointer-events-none">
          <path d="M 270 500 L 365 470" stroke="#EF4444" strokeWidth="1.2" strokeOpacity="0.38" />
          <path d="M 270 500 L 335 380" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.32" />
          <path d="M 335 380 L 365 470" stroke="#3B82F6" strokeWidth="1.1" strokeOpacity="0.32" />
          <path d="M 335 380 L 170 390" stroke="url(#route-blue)" strokeWidth="1.0" />
          <path d="M 170 390 L 100 260" stroke="url(#route-blue)" strokeWidth="0.9" />
          <path d="M 100 260 L 390 210" stroke="url(#route-blue)" strokeWidth="0.85" />
          <path d="M 390 210 L 335 380" stroke="url(#route-red)" strokeWidth="0.95" />
          <path d="M 270 500 L 230 630" stroke="url(#route-red)" strokeWidth="1.0" />
          <path d="M 230 630 L 360 770" stroke="url(#route-blue)" strokeWidth="0.9" />
          <path d="M 365 470 L 360 770" stroke="url(#route-blue)" strokeWidth="0.8" strokeDasharray="3,4" />

          <path d="M 390 210 Q 780 85 1170 210" stroke="url(#route-bridge-top)" strokeWidth="0.95" strokeDasharray="4,5" />
          <path d="M 365 470 Q 750 140 1130 320" stroke="url(#route-bridge-top)" strokeWidth="0.85" strokeDasharray="3,5" />
          <path d="M 360 770 Q 770 850 1180 700" stroke="url(#route-bridge-bottom)" strokeWidth="0.9" strokeDasharray="4,5" />
          <path d="M 230 630 Q 730 810 1230 520" stroke="url(#route-bridge-bottom)" strokeWidth="0.8" strokeDasharray="3,5" />

          <path d="M 1130 320 L 1170 210" stroke="url(#route-red)" strokeWidth="1.0" />
          <path d="M 1170 210 L 1260 180" stroke="url(#route-blue)" strokeWidth="0.9" />
          <path d="M 1130 320 L 1250 350" stroke="url(#route-blue)" strokeWidth="0.9" />
          <path d="M 1250 350 L 1230 520" stroke="url(#route-blue)" strokeWidth="0.85" />
          <path d="M 1230 520 L 1180 700" stroke="url(#route-red)" strokeWidth="0.85" />
          <path d="M 1250 350 Q 1380 290 1490 260" stroke="url(#route-red)" strokeWidth="0.9" />
          <path d="M 1490 260 Q 1420 400 1390 490" stroke="url(#route-blue)" strokeWidth="0.85" />
          <path d="M 1390 490 Q 1430 610 1460 700" stroke="url(#route-blue)" strokeWidth="0.9" />
          <path d="M 1180 700 Q 1320 730 1460 700" stroke="url(#route-blue)" strokeWidth="0.8" strokeDasharray="3,4" />
        </g>

        {/* BOLITAS VIAJERAS EN ESCRITORIO (Animadas de forma inmediata por requestAnimationFrame con GPU) */}
        <g className="pointer-events-none">
          <g
            ref={(el) => { desktopParticleRefs.current[0] = el; }}
            style={{ willChange: 'transform' }}
          >
            <circle r="7" fill="#3B82F6" fillOpacity="0.25" />
            <circle r="3.2" fill="#1D4ED8" fillOpacity="0.95" />
          </g>

          <g
            ref={(el) => { desktopParticleRefs.current[1] = el; }}
            style={{ willChange: 'transform' }}
          >
            <circle r="7" fill="#EF4444" fillOpacity="0.25" />
            <circle r="3.2" fill="#DC2626" fillOpacity="0.95" />
          </g>

          <g
            ref={(el) => { desktopParticleRefs.current[2] = el; }}
            style={{ willChange: 'transform' }}
          >
            <circle r="7" fill="#F59E0B" fillOpacity="0.25" />
            <circle r="3.2" fill="#D97706" fillOpacity="0.95" />
          </g>

          <g
            ref={(el) => { desktopParticleRefs.current[3] = el; }}
            style={{ willChange: 'transform' }}
          >
            <circle r="6.5" fill="#0EA5E9" fillOpacity="0.25" />
            <circle r="3" fill="#0284C7" fillOpacity="0.95" />
          </g>

          <g
            ref={(el) => { desktopParticleRefs.current[4] = el; }}
            style={{ willChange: 'transform' }}
          >
            <circle r="6.5" fill="#F43F5E" fillOpacity="0.25" />
            <circle r="3" fill="#E11D48" fillOpacity="0.95" />
          </g>

          <g
            ref={(el) => { desktopParticleRefs.current[5] = el; }}
            style={{ willChange: 'transform' }}
          >
            <circle r="6" fill="#FBBF24" fillOpacity="0.25" />
            <circle r="2.8" fill="#B45309" fillOpacity="0.95" />
          </g>
        </g>

        {/* Pines con corazón en escritorio */}
        <g>
          {/* FLANCO IZQUIERDO */}
          <g transform="translate(270, 500)">
            <path
              d="M 0 -22 C -6.6 -22 -12 -16.6 -12 -10 C -12 -2.5 0 0 0 0 C 0 0 12 -2.5 12 -10 C 12 -16.6 6.6 -22 0 -22 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.7"
            />
            <path
              d="M 0 -13.5 C -0.8 -15 -2.8 -15.5 -4 -14.2 C -5.2 -12.8 -4.8 -10.8 -3.2 -9.3 L 0 -6.5 L 3.2 -9.3 C 4.8 -10.8 5.2 -12.8 4 -14.2 C 2.8 -15.5 0.8 -15 0 -13.5 Z"
              fill="#EF4444"
            />
          </g>

          <g transform="translate(365, 470)">
            <path
              d="M 0 -19 C -5.5 -19 -10 -14.5 -10 -9 C -10 -2 0 0 0 0 C 0 0 10 -2 10 -9 C 10 -14.5 5.5 -19 0 -19 Z"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="1.4"
            />
            <path
              d="M 0 -11.8 C -0.7 -13.2 -2.4 -13.6 -3.5 -12.5 C -4.5 -11.2 -4.2 -9.5 -2.8 -8.2 L 0 -5.8 L 2.8 -8.2 C 4.2 -9.5 4.5 -11.2 3.5 -12.5 C 2.4 -13.6 0.7 -13.2 0 -11.8 Z"
              fill="#2563EB"
            />
          </g>

          <g transform="translate(335, 380)">
            <path
              d="M 0 -18 C -5 -18 -9 -14 -9 -8.5 C -9 -2 0 0 0 0 C 0 0 9 -2 9 -8.5 C 9 -14 5 -18 0 -18 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.3"
            />
            <path
              d="M 0 -11 C -0.6 -12.3 -2.2 -12.7 -3.2 -11.7 C -4.2 -10.5 -3.9 -8.9 -2.6 -7.7 L 0 -5.4 L 2.6 -7.7 C 3.9 -8.9 4.2 -10.5 3.2 -11.7 C 2.2 -12.7 0.6 -12.3 0 -11 Z"
              fill="#EF4444"
            />
          </g>

          <g transform="translate(170, 390)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.3"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#EF4444"
            />
          </g>

          <g transform="translate(390, 210)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="1.3"
              strokeOpacity="0.8"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#2563EB"
              fillOpacity="0.8"
            />
          </g>

          <g transform="translate(100, 260)">
            <path
              d="M 0 -16 C -4.5 -16 -8 -12.5 -8 -7.5 C -8 -1.8 0 0 0 0 C 0 0 8 -1.8 8 -7.5 C 8 -12.5 4.5 -16 0 -16 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.2"
              strokeOpacity="0.75"
            />
            <path
              d="M 0 -10 C -0.5 -11.2 -2 -11.5 -2.8 -10.6 C -3.7 -9.6 -3.5 -8.1 -2.3 -7 L 0 -5 L 2.3 -7 C 3.5 -8.1 3.7 -9.6 2.8 -10.6 C 2 -11.5 0.5 -11.2 0 -10 Z"
              fill="#EF4444"
              fillOpacity="0.75"
            />
          </g>

          <g transform="translate(230, 630)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="1.3"
              strokeOpacity="0.8"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#2563EB"
            />
          </g>

          <g transform="translate(360, 770)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.3"
              strokeOpacity="0.85"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#EF4444"
              fillOpacity="0.85"
            />
          </g>

          {/* FLANCO DERECHO */}
          <g transform="translate(1130, 320)">
            <path
              d="M 0 -19 C -5.5 -19 -10 -14.5 -10 -9 C -10 -2 0 0 0 0 C 0 0 10 -2 10 -9 C 10 -14.5 5.5 -19 0 -19 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.4"
              strokeOpacity="0.85"
            />
            <path
              d="M 0 -11.8 C -0.7 -13.2 -2.4 -13.6 -3.5 -12.5 C -4.5 -11.2 -4.2 -9.5 -2.8 -8.2 L 0 -5.8 L 2.8 -8.2 C 4.2 -9.5 4.5 -11.2 3.5 -12.5 C 2.4 -13.6 0.7 -13.2 0 -11.8 Z"
              fill="#EF4444"
              fillOpacity="0.85"
            />
          </g>

          <g transform="translate(1170, 210)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="1.3"
              strokeOpacity="0.8"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#2563EB"
            />
          </g>

          <g transform="translate(1260, 180)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#F59E0B"
              strokeWidth="1.3"
              strokeOpacity="0.8"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#F59E0B"
              fillOpacity="0.8"
            />
          </g>

          <g transform="translate(1250, 350)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.3"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#EF4444"
            />
          </g>

          <g transform="translate(1230, 520)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="1.3"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#2563EB"
            />
          </g>

          <g transform="translate(1180, 700)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.3"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#EF4444"
            />
          </g>

          <g transform="translate(1490, 260)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#EF4444"
              strokeWidth="1.3"
              strokeOpacity="0.85"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#EF4444"
              fillOpacity="0.85"
            />
          </g>

          <g transform="translate(1460, 700)">
            <path
              d="M 0 -17 C -4.8 -17 -8.5 -13.2 -8.5 -8 C -8.5 -2 0 0 0 0 C 0 0 8.5 -2 8.5 -8 C 8.5 -13.2 4.8 -17 0 -17 Z"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="1.3"
              strokeOpacity="0.8"
            />
            <path
              d="M 0 -10.5 C -0.6 -11.8 -2.1 -12.2 -3 -11.2 C -4 -10.1 -3.7 -8.5 -2.5 -7.4 L 0 -5.2 L 2.5 -7.4 C 3.7 -8.5 4 -10.1 3 -11.2 C 2.1 -12.2 0.6 -11.8 0 -10.5 Z"
              fill="#2563EB"
              fillOpacity="0.8"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
