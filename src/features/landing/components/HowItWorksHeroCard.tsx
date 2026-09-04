import React, { useState, useEffect, useRef } from 'react';
import {
  Hand,
  HeartHandshake,
  Map,
  MapPin,
  ShieldCheck,
  Zap,
  Users,
  Compass,
  Clock,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Wifi,
  Battery,
  Send,
  Sparkles,
} from 'lucide-react';

interface HighlightItem {
  text: string;
  icon: React.ReactNode;
}

interface StepData {
  id: string;
  pillNumber: string;
  pillTitle: string;
  title: string;
  description: string;
  highlights: HighlightItem[];
  ctaText: string;
  ctaIcon: React.ReactNode;
}

const STEPS: StepData[] = [
  {
    id: 'reporta',
    pillNumber: '01',
    pillTitle: 'Reporta',
    title: 'Transformamos la emergencia en datos accionables',
    description:
      'Centralización, estructuración y verificación de las necesidades en territorio, transformando la emergencia en datos accionables.',
    highlights: [
      {
        text: 'Centralización en territorio',
        icon: <MapPin className="w-4 h-4 text-brand-red" />,
      },
      {
        text: 'Verificación comunitaria',
        icon: <ShieldCheck className="w-4 h-4 text-brand-blue" />,
      },
      {
        text: 'Datos accionables en tiempo real',
        icon: <Zap className="w-4 h-4 text-brand-yellow-dark" />,
      },
    ],
    ctaText: 'Pedir ayuda',
    ctaIcon: <Hand className="w-4 h-4 text-white" />,
  },
  {
    id: 'conecta',
    pillNumber: '02',
    pillTitle: 'Conecta',
    title: 'Articulamos ayuda real con quienes la necesitan',
    description:
      'Articulación de las respuestas de ayuda alineando la capacidad de distintas iniciativas humanitarias, mediante raDARes crowdsourcing.',
    highlights: [
      {
        text: 'Red de aliados e iniciativas activas',
        icon: <Users className="w-4 h-4 text-brand-blue" />,
      },
      {
        text: 'Enrutamiento inteligente de recursos',
        icon: <Compass className="w-4 h-4 text-brand-blue" />,
      },
      {
        text: 'Colaboración abierta y crowdsourcing',
        icon: <HeartHandshake className="w-4 h-4 text-brand-red" />,
      },
    ],
    ctaText: 'Ofrecer ayuda',
    ctaIcon: <HeartHandshake className="w-4 h-4 text-white" />,
  },
  {
    id: 'monitorea',
    pillNumber: '03',
    pillTitle: 'Monitorea',
    title: 'Trazabilidad total del impacto en cada comunidad',
    description:
      'Seguimiento y trazabilidad de la destinación de los recursos y su impacto real en las comunidades atendidas.',
    highlights: [
      {
        text: 'Seguimiento a la entrega de recursos',
        icon: <Clock className="w-4 h-4 text-brand-blue" />,
      },
      {
        text: 'Métricas de impacto verificadas',
        icon: <BarChart3 className="w-4 h-4 text-brand-yellow-dark" />,
      },
      {
        text: 'Transparencia y rendición de cuentas',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      },
    ],
    ctaText: 'Ver mapa',
    ctaIcon: <Map className="w-4 h-4 text-white" />,
  },
];

const STEP_COLORS = [
  {
    activeCircle:
      'bg-brand-red text-white shadow-md shadow-brand-red/25 ring-4 ring-brand-red/15 scale-105',
    inactiveCircle:
      'bg-rose-50/70 text-brand-red/80 border border-rose-200/80 hover:bg-rose-100 hover:text-brand-red hover:border-rose-300',
    activeText: 'text-brand-red font-extrabold',
    inactiveText: 'text-slate-500 font-medium group-hover:text-brand-red',
  },
  {
    activeCircle:
      'bg-brand-blue text-white shadow-md shadow-brand-blue/25 ring-4 ring-brand-blue/15 scale-105',
    inactiveCircle:
      'bg-blue-50/70 text-brand-blue/80 border border-blue-200/80 hover:bg-blue-100 hover:text-brand-blue hover:border-blue-300',
    activeText: 'text-brand-blue font-extrabold',
    inactiveText: 'text-slate-500 font-medium group-hover:text-brand-blue',
  },
  {
    activeCircle:
      'bg-brand-yellow text-slate-900 shadow-md shadow-brand-yellow/35 ring-4 ring-brand-yellow/25 scale-105 font-black',
    inactiveCircle:
      'bg-amber-50/70 text-amber-800/80 border border-amber-200/80 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300',
    activeText: 'text-amber-800 font-extrabold',
    inactiveText: 'text-slate-500 font-medium group-hover:text-amber-800',
  },
];

interface HowItWorksHeroCardProps {
  onOpenChat: () => void;
}

export const HowItWorksHeroCard: React.FC<HowItWorksHeroCardProps> = ({ onOpenChat }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = STEPS[activeStepIndex];

  // Detectar cuando el usuario está efectivamente posicionado sobre el módulo
  useEffect(() => {
    const element = cardRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Se activa cuando el módulo entra firmemente en el área de visión del usuario
        setIsInView(entry.isIntersecting);
      },
      {
        rootMargin: '-5% 0px -5% 0px',
        threshold: 0.25,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Transición ultra-suave y elegante de desvanecimiento
  const changeStepSmoothly = (newIndex: number) => {
    if (newIndex === activeStepIndex) return;
    setIsFading(true);
    setTimeout(() => {
      setActiveStepIndex(newIndex);
      setIsFading(false);
    }, 180);
  };

  // Auto-play de 10 segundos: SOLO activo si el usuario está sobre el módulo (isInView) y no está pausado
  useEffect(() => {
    if (isPaused || !isInView) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setActiveStepIndex((prev) => (prev + 1) % STEPS.length);
        setIsFading(false);
      }, 180);
    }, 10000); // Al menos 10 segundos para dar tiempo completo de lectura

    return () => clearInterval(interval);
  }, [isPaused, isInView, activeStepIndex]);

  // Al posarse (hover) sobre los números, cambia de tarjeta de inmediato y pausa el contador
  const handleStepHover = (index: number) => {
    setIsPaused(true);
    if (index !== activeStepIndex) {
      changeStepSmoothly(index);
    }
  };

  // Al hacer clic, también pausa y cambia
  const handleStepClick = (index: number) => {
    setIsPaused(true);
    if (index !== activeStepIndex) {
      changeStepSmoothly(index);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Encabezado editorial con símbolo raDAR y R volteada */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-text font-sans tracking-tight">
          ¿Cómo funciona RADA<span className="inline-block -scale-x-100">R</span>?
        </h2>
      </div>

      {/* Tarjeta contenedora principal: al pasar el mouse por encima se pausa el temporizador de lectura */}
      <div
        ref={cardRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto rounded-3xl sm:rounded-4xl overflow-hidden shadow-sm border border-slate-200/90 bg-white p-5 sm:p-8 lg:p-12 transition-all"
      >
        {/* Auras luminosas sutiles de fondo institucional */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ========================================================
              COLUMNA IZQUIERDA: Stepper Conectado, Textos y CTA
              Optimizado: centrado armónico en móvil y alineado a la izquierda en desktop
             ======================================================== */}
          <div className="w-full lg:col-span-6 flex flex-col justify-between space-y-6 sm:space-y-8 text-center lg:text-left items-center lg:items-start">
            {/* 1. Stepper Conectado Horizontal: 1 Rojo, 2 Azul, 3 Amarillo */}
            <div className="flex items-center justify-between sm:justify-start w-full max-w-[290px] sm:max-w-sm mx-auto lg:mx-0">
              {STEPS.map((s, index) => {
                const isActive = activeStepIndex === index;
                const colors = STEP_COLORS[index];

                return (
                  <React.Fragment key={s.id}>
                    <button
                      type="button"
                      onMouseEnter={() => handleStepHover(index)}
                      onClick={() => handleStepClick(index)}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      {/* Círculo numerado con color acorde a su CTA: 1 Rojo, 2 Azul, 3 Amarillo */}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold font-sans transition-all duration-300 ${
                          isActive
                            ? colors.activeCircle
                            : colors.inactiveCircle
                        }`}
                      >
                        {s.pillNumber}
                      </div>

                      {/* Etiqueta de la pastilla debajo del número con color acorde */}
                      <span
                        className={`text-xs font-sans transition-colors ${
                          isActive
                            ? colors.activeText
                            : colors.inactiveText
                        }`}
                      >
                        {s.pillTitle}
                      </span>
                    </button>

                    {/* Línea horizontal de conexión entre pasos */}
                    {index < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 sm:mx-3 -mt-5.5 transition-colors duration-300 ${
                          activeStepIndex > index
                            ? index === 0
                              ? 'bg-brand-blue/50'
                              : 'bg-brand-yellow/60'
                            : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* 2. Bloque de Textos e Iconos con Transición Ultra-Smooth de Opacidad */}
            <div
              className={`space-y-4 sm:space-y-5 transition-opacity duration-300 ease-in-out w-full ${
                isFading ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {/* Título principal: centrado en móvil, alineado a la izquierda en desktop */}
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-sans tracking-tight leading-snug text-center lg:text-left max-w-xl mx-auto lg:mx-0">
                {step.title}
              </h3>

              {/* Párrafo explicativo: centrado en móvil, alineado a la izquierda en desktop */}
              <p className="text-slate-600 text-xs sm:text-sm md:text-base font-body leading-relaxed max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
                {step.description}
              </p>

              {/* Lista de tres puntos con iconos minimalistas personalizados: centrados en móvil */}
              <div className="space-y-2 sm:space-y-2.5 pt-1 w-full max-w-md mx-auto lg:mx-0 flex flex-col items-center lg:items-start">
                {step.highlights.map((item) => (
                  <div
                    key={item.text}
                    className="w-full flex items-center justify-center lg:justify-start gap-2.5 sm:gap-3 p-2 sm:p-0 rounded-xl bg-slate-50/80 sm:bg-transparent border border-slate-100/90 sm:border-0"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                      {item.icon}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 font-sans text-center lg:text-left">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Botón de Acción Contextual Anclado */}
            <div className="pt-2 w-full flex justify-center lg:justify-start">
              {activeStepIndex === 0 ? (
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-3 rounded-xl bg-brand-red hover:bg-brand-red/90 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-brand-red/25 active:scale-98 transition-all cursor-pointer font-sans"
                >
                  <Hand className="w-4 h-4 text-white" />
                  <span>Pedir ayuda</span>
                </button>
              ) : activeStepIndex === 1 ? (
                <a
                  href="/?ofrecer=true"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-3 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-blue/20 active:scale-98 transition-all cursor-pointer font-sans"
                >
                  <HeartHandshake className="w-4 h-4 text-white" />
                  <span>Ofrecer ayuda</span>
                </a>
              ) : (
                <a
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-3 rounded-xl bg-brand-yellow hover:bg-brand-yellow/90 text-slate-900 text-xs sm:text-sm font-extrabold shadow-md shadow-brand-yellow/30 active:scale-98 transition-all cursor-pointer font-sans"
                >
                  <Map className="w-4 h-4 text-slate-900" />
                  <span>Ver mapa</span>
                </a>
              )}
            </div>
          </div>

          {/* ========================================================
              COLUMNA DERECHA: Visual Dinámico en Modo Claro (Visible únicamente en escritorio / pantallas grandes)
             ======================================================== */}
          <div className="hidden lg:flex lg:col-span-6 items-center justify-center relative min-h-95 sm:min-h-110">
            <div
              className={`w-full transition-opacity duration-300 ease-in-out flex items-center justify-center ${
                isFading ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {activeStepIndex === 0 ? (
                /* PASO 01: Mockup móvil de reporte en territorio (Modo Claro Oficial) */
                <div className="relative w-full max-w-[290px] sm:max-w-[315px] rounded-[2.5rem] bg-slate-100 p-2.5 shadow-xl border border-slate-300/80">
                  {/* Pantalla del dispositivo móvil */}
                  <div className="rounded-[2rem] bg-white text-slate-900 overflow-hidden p-4 sm:p-5 flex flex-col justify-between border border-slate-200 min-h-100 sm:min-h-105 shadow-xs">
                    {/* Barra de estado superior */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pb-2 border-b border-slate-100">
                      <span>9:41</span>
                      <div className="w-14 h-3 bg-slate-200 rounded-full mx-auto" />
                      <div className="flex items-center gap-1.5">
                        <Wifi className="w-3 h-3 text-slate-600" />
                        <Battery className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </div>

                    {/* Contenido del Formulario en Territorio */}
                    <div className="space-y-3 py-2">
                      {/* Cabecera del ticket */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-ping" />
                          <span className="text-[10px] font-mono uppercase font-bold text-brand-red tracking-wider">
                            Emergencia Activa
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          Ticket #084
                        </span>
                      </div>

                      {/* Tarjeta de necesidad en territorio */}
                      <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Necesidad prioritaria
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 font-sans leading-tight">
                          Agua potable & remoción de escombros
                        </p>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-brand-red font-bold border border-rose-200">
                          Prioridad Alta
                        </span>
                      </div>

                      {/* Tarjeta de ubicación GPS */}
                      <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Siloé, Sector La Estrella
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            3.4214° N, -76.5542° W · Cali
                          </p>
                        </div>
                      </div>

                      {/* Verificación raDAR */}
                      <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-brand-blue shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Verificado por RADA<span className="inline-block -scale-x-100">R</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Validación directa en territorio
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botón interactivo simulado en el móvil */}
                    <div className="pt-2">
                      <div className="w-full py-2.5 px-3 rounded-xl bg-brand-red text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm shadow-brand-red/25">
                        <Send className="w-3.5 h-3.5" />
                        <span>Transmitir a raDAR</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeStepIndex === 1 ? (
                /* PASO 02: Mockup de Articulación y Enrutamiento (Modo Claro) */
                <div className="w-full max-w-sm sm:max-w-md rounded-3xl bg-slate-50 text-slate-900 p-5 sm:p-7 shadow-lg border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-brand-blue" />
                      <span className="text-xs font-bold font-sans text-slate-900">
                        Enrutamiento raDAR Match
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-100 text-brand-blue font-bold border border-blue-200">
                      96% Coincidencia
                    </span>
                  </div>

                  {/* Nodo 1: Necesidad en terreno */}
                  <div className="bg-white rounded-2xl p-3.5 border-l-4 border-l-brand-red border border-slate-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-brand-red font-bold uppercase">
                        Demanda en Terreno
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Siloé, Cali</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      Atención médica y medicamentos
                    </p>
                  </div>

                  {/* Conector dinámico central */}
                  <div className="flex items-center justify-center py-0.5">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[10px] text-brand-blue font-mono font-bold border border-slate-200 shadow-2xs">
                      <ArrowRight className="w-3 h-3 text-brand-blue rotate-90" />
                      <span>Conexión directa sin intermediarios</span>
                    </div>
                  </div>

                  {/* Nodo 2: Oferta / Iniciativa aliada asignada */}
                  <div className="bg-white rounded-2xl p-3.5 border-l-4 border-l-brand-blue border border-slate-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-brand-blue font-bold uppercase">
                        Iniciativa Humanitaria Asignada
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        En camino
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      Brigada Voluntarios Valle & Aliados
                    </p>
                    <p className="text-[11px] text-slate-600">
                      4 brigadistas equipados · Despacho coordinado
                    </p>
                  </div>
                </div>
              ) : (
                /* PASO 03: Mockup de Trazabilidad Total y Métricas (Modo Claro) */
                <div className="w-full max-w-sm sm:max-w-md rounded-3xl bg-slate-50 text-slate-900 p-5 sm:p-7 shadow-lg border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-brand-yellow-dark" />
                      <span className="text-xs font-bold font-sans text-slate-900">
                        Trazabilidad Comunitaria
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      Reporte Completado
                    </span>
                  </div>

                  {/* Ficha de impacto verificado */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ayuda entregada con éxito</span>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                      14 familias abastecidas en Siloé
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Tiempo de atención
                        </span>
                        <span className="text-xs font-bold text-slate-900">1h 15 min</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Transparencia
                        </span>
                        <span className="text-xs font-bold text-emerald-700">100% Auditada</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge de liberación de recursos */}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-sans flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-brand-yellow-dark shrink-0" />
                    <span>Recursos liberados en el mapa para atender el siguiente punto.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
