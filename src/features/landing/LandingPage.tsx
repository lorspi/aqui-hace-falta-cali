import React, { useState } from 'react';
import {
  Hand,
  MessageSquarePlus,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  Building2,
  ExternalLink,
  Users,
  Check,
  ChevronDown,
} from 'lucide-react';
import { LandingHeader } from './components/LandingHeader';
import { RadarAnimatedLogo } from './components/RadarAnimatedLogo';
import { RadarMapBackground } from './components/RadarMapBackground';
import { HowItWorksHeroCard } from './components/HowItWorksHeroCard';
import { LandingSplitPortal } from './components/LandingSplitPortal';
import { LandingFooter } from './components/LandingFooter';
import { ChatbotTicketModal } from '../../components/ChatbotTicketModal';

export const LandingPage: React.FC = () => {
  const [isChatbotModalOpen, setIsChatbotModalOpen] = useState(false);

  // Asegurar aislamiento de scroll y comportamiento responsivo idéntico al de la app principal
  React.useEffect(() => {
    if (isChatbotModalOpen) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      const prevBodyOverscroll = document.body.style.overscrollBehaviorY;
      const prevHtmlOverscroll = document.documentElement.style.overscrollBehaviorY;

      document.documentElement.classList.add('overflow-hidden');
      document.body.classList.add('overflow-hidden');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehaviorY = 'none';
      document.body.style.overscrollBehaviorY = 'none';

      return () => {
        document.documentElement.classList.remove('overflow-hidden');
        document.body.classList.remove('overflow-hidden');
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overscrollBehaviorY = prevHtmlOverscroll;
        document.body.style.overscrollBehaviorY = prevBodyOverscroll;
      };
    } else {
      const prevHtml = document.documentElement.style.overscrollBehaviorY;
      const prevBody = document.body.style.overscrollBehaviorY;
      document.documentElement.style.overscrollBehaviorY = 'auto';
      document.body.style.overscrollBehaviorY = 'auto';
      return () => {
        document.documentElement.style.overscrollBehaviorY = prevHtml;
        document.body.style.overscrollBehaviorY = prevBody;
      };
    }
  }, [isChatbotModalOpen]);

  return (
    <div className="min-h-screen bg-brand-surface text-brand-text font-sans selection:bg-brand-blue selection:text-white">
      {/* Header oficial de navegación */}
      <LandingHeader onOpenChat={() => setIsChatbotModalOpen(true)} />

      <main className="space-y-8 sm:space-y-12">
        {/* ========================================================
            HERO SPLIT PRINCIPAL DE ALTO IMPACTO (ABOVE THE FOLD)
            Fondo continuo extendido de mapa satelital con partículas 
            y radar interactivo articulado junto al titular y CTAs.
           ======================================================== */}
        <div className="relative w-full overflow-hidden">
          {/* Fondo animado interactivo unificado (bolitas y rutas) */}
          <RadarMapBackground />

          <section
            id="hero"
            className="relative z-10 w-full min-h-[calc(100svh-4rem)] sm:min-h-[calc(100vh-4.5rem)] flex flex-col justify-start sm:justify-center items-center px-5 sm:px-6 lg:px-8 xl:px-12 pt-7 pb-8 sm:py-12 lg:py-14"
          >
            <div className="max-w-7xl xl:max-w-[1540px] mx-auto w-full flex flex-col lg:flex-row items-center justify-between sm:translate-y-0 gap-7 sm:gap-9 lg:gap-12 xl:gap-16 2xl:gap-20 lg:pl-8 xl:pl-14 2xl:pl-20">
              {/* Columna de Texto: En móvil con márgenes laterales y peso refinado; en desktop dicta ancho en 4 filas fijas */}
              <div className="w-full lg:w-fit lg:shrink-0 flex flex-col justify-center text-center lg:text-left space-y-6 sm:space-y-7 lg:space-y-8 order-2 lg:order-1 px-2 sm:px-4 lg:px-0 max-w-[350px] sm:max-w-md lg:max-w-none mx-auto lg:mx-0">
                
                <h1 className="font-sans tracking-tight font-extrabold lg:font-black text-slate-900 text-[1.65rem] sm:text-2xl md:text-3xl lg:text-[2.1rem] xl:text-[2.55rem] 2xl:text-[2.9rem] leading-[1.22] sm:leading-[1.2] lg:leading-[1.15]">
                  <span className="lg:block lg:whitespace-nowrap">
                    <span className="text-brand-blue">Un solo punto</span>{' '}
                    de encuentro digital
                  </span>{' '}
                  <span className="lg:block lg:whitespace-nowrap">
                    para articular la{' '}
                    <span className="relative inline-block text-slate-900">
                      ayuda en emergencias
                      <span className="absolute -bottom-1 left-0 right-0 h-1 sm:h-1.5 bg-brand-yellow rounded-full" />
                    </span>
                    .
                  </span>
                </h1>

                {/* Botones de Acción Centrados (Fila 5 de CTAs) */}
                <div className="pt-4 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-5 w-full max-w-xs sm:max-w-xl mx-auto">
                  {/* Botón Primario: Pedir ayuda */}
                  <button
                    type="button"
                    onClick={() => setIsChatbotModalOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-3 px-7 sm:px-9 py-4 sm:py-5 rounded-2xl text-base sm:text-lg lg:text-xl font-black text-white bg-brand-red hover:bg-brand-red-hover active:scale-98 shadow-xl shadow-brand-red/30 hover:shadow-2xl hover:shadow-brand-red/45 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer font-sans"
                  >
                    <Hand className="w-6 h-6 text-white shrink-0" />
                    <span>Pedir ayuda</span>
                  </button>

                  {/* Botón Secundario: Ofrecer Ayuda */}
                  <a
                    href="/?ofrecer=true"
                    className="flex-1 inline-flex items-center justify-center gap-3 px-7 sm:px-9 py-4 sm:py-5 rounded-2xl text-base sm:text-lg lg:text-xl font-black text-white bg-brand-blue hover:bg-brand-blue-hover active:scale-98 shadow-xl shadow-brand-blue/30 hover:shadow-2xl hover:shadow-brand-blue/45 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer font-sans"
                  >
                    <HeartHandshake className="w-6 h-6 text-white shrink-0" />
                    <span>Ofrecer ayuda</span>
                  </a>
                </div>
              </div>

              {/* Columna de Radar: En móvil pegado armónicamente arriba; en desktop adaptativo */}
              <div className="w-full lg:flex-1 min-w-0 flex items-center justify-center order-1 lg:order-2 pt-0 sm:pt-0">
                <div className="relative w-full aspect-square max-w-[295px] sm:max-w-[320px] lg:max-w-[420px] xl:max-w-[480px] 2xl:max-w-[530px] max-h-[calc(100vh-14rem)] flex items-center justify-center">
                  <RadarAnimatedLogo
                    onOpenChat={() => setIsChatbotModalOpen(true)}
                    className="w-full h-full aspect-square mx-auto"
                  />
                </div>
              </div>
            </div>

            {/* Píldora interactiva 'Conoce raDAR' al fondo del primer pantallazo */}
            <div className="absolute bottom-4 sm:bottom-6 lg:bottom-7 inset-x-0 z-20 flex justify-center pointer-events-none">
              <button
                type="button"
                onClick={() => {
                  const target = document.getElementById('como-funciona');
                  if (target) {
                    const nav = document.querySelector('header');
                    const navHeight = nav ? nav.getBoundingClientRect().height : 72;
                    const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
                    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
                  }
                }}
                className="pointer-events-auto group relative inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-white/95 hover:bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs text-slate-700 hover:text-slate-950 transition-all duration-300 cursor-pointer text-xs font-semibold backdrop-blur-md"
                aria-label="Conoce raDAR"
              >
                {/* Micro-puntos tricolor representativos del radar */}
                <span className="flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
                </span>

                <span className="tracking-tight font-sans">
                  Conoce RADA<span className="inline-block -scale-x-100">R</span>
                </span>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-transform duration-200 group-hover:translate-y-0.5" />
              </button>
            </div>
          </section>
        </div>

        {/* ========================================================
            TARJETAS DE CONTENIDO PRINCIPALES DE LA PLATAFORMA
            Espaciado aumentado y uniforme entre tarjetas (Cómo funciona, Split Portal y Organizaciones)
           ======================================================== */}
        <div className="space-y-16 sm:space-y-20 lg:space-y-24">
          {/* ========================================================
              1. CÓMO FUNCIONA CON IMAGEN DE FONDO (ORDEN 1)
              Versión fotográfica High-Key Luminous interactiva
             ======================================================== */}
          <section id="como-funciona" className="scroll-mt-20 sm:scroll-mt-24 lg:scroll-mt-28">
            <HowItWorksHeroCard onOpenChat={() => setIsChatbotModalOpen(true)} />
          </section>

          {/* ========================================================
              2. VENTANA / PORTAL EN VIVO DE LA APP (SPLIT-PORTAL) (ORDEN 2)
             ======================================================== */}
          <LandingSplitPortal />

          {/* ========================================================
              3. PARA ORGANIZACIONES, FUNDACIONES & LÍDERES COMUNITARIOS (ORDEN 3)
              Mensaje unificado: articula capacidad de respuesta con conocimiento en territorio
             ======================================================== */}
          <section id="organizaciones" className="w-full max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 sm:scroll-mt-28 mb-16 sm:mb-24 lg:mb-32">
          {/* Tarjeta contenedora sutil: Idéntica en proporción, bordes y sombra al módulo de ¿Cómo funciona? */}
          <div className="relative w-full mx-auto rounded-3xl sm:rounded-4xl overflow-hidden shadow-sm border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-12 transition-all">
            {/* Auras luminosas sutiles con los colores oficiales de raDAR */}
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-brand-blue/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />

            {/* Símbolo raDAR en filigrana institucional de fondo */}
            <img
              src="/simbolo-radar.svg"
              alt=""
              className="absolute -right-8 -bottom-8 w-64 h-64 opacity-[0.035] pointer-events-none select-none"
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-4 sm:space-y-8">
              {/* Encabezado: en escritorio el CTA se centra en el espacio libre disponible alineado con las tarjetas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center border-b border-slate-100 pb-4 sm:pb-6">
                <div className="lg:col-span-2 space-y-1.5 sm:space-y-2.5 text-center lg:text-left">
                  <h3 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-sans tracking-tight leading-snug sm:leading-[1.12]">
                    ¿Quieres actuar? Súmate como{' '}
                    <span className="text-brand-blue relative inline-block">
                      organización
                      <span className="absolute -bottom-1 left-0 right-0 h-1 bg-brand-yellow rounded-full" />
                    </span>
                    , líder comunitario o voluntario
                  </h3>

                  {/* Descripción en desktop */}
                  <p className="hidden md:block text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed font-body">
                    <strong className="text-slate-900 font-semibold">raDAR conecta la capacidad de respuesta con la verdad en territorio.</strong> Articulamos a organizaciones que movilizan recursos, líderes comunitarios que censan las necesidades reales de su sector y voluntarios listos para aportar tiempo o habilidades técnicas. Todo coordinado en tiempo real, sin duplicidades ni esfuerzos aislados.
                  </p>

                  {/* Descripción concisa y legible exclusiva para móvil */}
                  <p className="md:hidden text-slate-600 text-sm leading-relaxed font-body max-w-xl mx-auto">
                    <strong className="text-slate-900 font-semibold">Conectamos la respuesta con el territorio:</strong> articulamos organizaciones, líderes y voluntarios en tiempo real, sin duplicidades ni esfuerzos aislados.
                  </p>
                </div>

                {/* Botón CTA en escritorio: centrado en el espacio libre disponible y con mayor presencia */}
                <div className="hidden lg:flex items-center justify-center p-2">
                  <a
                    href="https://wa.me/573112323588?text=Hola%20raDAR,%20represento%20a%20una%20organizaci%C3%B3n/comunidad%20y%20nos%20gustar%C3%ADa%20sumarnos%20a%20la%20red%20de%20ayuda."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 sm:gap-3 px-7 py-4 lg:px-8 lg:py-4.5 rounded-xl lg:rounded-2xl text-sm lg:text-base font-extrabold text-white bg-brand-blue hover:bg-brand-blue-hover active:scale-98 shadow-md shadow-brand-blue/25 hover:shadow-xl hover:shadow-brand-blue/35 hover:-translate-y-0.5 transition-all cursor-pointer font-sans whitespace-nowrap group"
                  >
                    <MessageSquarePlus className="w-4 h-4 lg:w-5 lg:h-5 text-white shrink-0 group-hover:scale-110 transition-transform" />
                    <span>
                      Sumarme a RADA<span className="inline-block -scale-x-100">R</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white/90 group-hover:text-white transition-colors" />
                  </a>
                </div>
              </div>

              {/* Vista Móvil: Diseño rediseñado, conciso, legible y ágil (md:hidden) */}
              <div className="md:hidden space-y-2.5">
                {/* Pilar 1 Móvil: Coordinación Georreferenciada */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 font-sans">
                        Coordinación Georreferenciada
                      </h4>
                      <span className="text-[11px] font-bold text-brand-blue bg-blue-50/90 border border-blue-100 px-2 py-0.5 rounded-full shrink-0">
                        Cero duplicidad
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 font-body leading-snug">
                      Mapeo satelital preciso para atender puntos censados por líderes sin cruzarse entre brigadas.
                    </p>
                  </div>
                </div>

                {/* Pilar 2 Móvil: Articulación de Manos y Recursos */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-yellow/20 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 font-sans">
                        Articulación de Recursos
                      </h4>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50/90 border border-amber-200/60 px-2 py-0.5 rounded-full shrink-0">
                        Tus habilidades
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 font-body leading-snug">
                      Canaliza donaciones, transporte, brigadas y voluntariado hacia prioridades validadas.
                    </p>
                  </div>
                </div>

                {/* Pilar 3 Móvil: Cuentas Claras y Cierre en Mapa */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 font-sans">
                        Cuentas Claras en Mapa
                      </h4>
                      <span className="text-[11px] font-bold text-brand-red bg-rose-50/90 border border-rose-100 px-2 py-0.5 rounded-full shrink-0">
                        Datos abiertos
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 font-body leading-snug">
                      Confirmación de entregas para liberar recursos a otras zonas con transparencia auditable.
                    </p>
                  </div>
                </div>
              </div>

              {/* Vista Escritorio: 3 Columnas originales 100% preservadas (hidden md:grid) */}
              <div className="hidden md:grid md:grid-cols-3 gap-2.5 sm:gap-5">
                {/* Pilar 1: Azul (Coordinación Georreferenciada) */}
                <div className="group relative rounded-xl p-3 sm:p-5 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-brand-blue/50 shadow-2xs hover:shadow-sm transition-all flex flex-row sm:flex-col items-start gap-3 sm:gap-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0 sm:mb-3 group-hover:scale-108 transition-transform">
                    <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5 sm:mb-1.5">
                      <h4 className="text-xs sm:text-base font-extrabold text-slate-900 font-sans tracking-tight">
                        Coordinación Georreferenciada
                      </h4>
                      <span className="sm:hidden text-[10px] font-bold text-brand-blue shrink-0">
                        Cero duplicidad
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[13px] text-slate-600 font-body leading-snug sm:leading-relaxed">
                      Mapeo satelital preciso de cada reporte para que brigadas y fundaciones atiendan los puntos censados por los líderes comunitarios sin cruzarse entre sí.
                    </p>
                    <div className="hidden sm:flex mt-3.5 pt-2.5 border-t border-slate-200/60 items-center gap-1.5 text-[11px] font-bold text-brand-blue">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Cero duplicidad de esfuerzos</span>
                    </div>
                  </div>
                </div>

                {/* Pilar 2: Amarillo (Articulación de Manos y Recursos) */}
                <div className="group relative rounded-xl p-3 sm:p-5 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-amber-400/60 shadow-2xs hover:shadow-sm transition-all flex flex-row sm:flex-col items-start gap-3 sm:gap-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-amber-700 shrink-0 sm:mb-3 group-hover:scale-108 transition-transform">
                    <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5 sm:mb-1.5">
                      <h4 className="text-xs sm:text-base font-extrabold text-slate-900 font-sans tracking-tight">
                        Articulación de Manos y Recursos
                      </h4>
                      <span className="sm:hidden text-[10px] font-bold text-amber-700 shrink-0">
                        Tus habilidades
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[13px] text-slate-600 font-body leading-snug sm:leading-relaxed">
                      Canaliza donaciones, transporte, brigadas médicas y el talento de voluntarios directamente hacia las prioridades validadas por los líderes comunitarios.
                    </p>
                    <div className="hidden sm:flex mt-3.5 pt-2.5 border-t border-slate-200/60 items-center gap-1.5 text-[11px] font-bold text-amber-700">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Ayuda según tus habilidades</span>
                    </div>
                  </div>
                </div>

                {/* Pilar 3: Rojo (Cuentas Claras y Cierre en Mapa) */}
                <div className="group relative rounded-xl p-3 sm:p-5 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-brand-red/50 shadow-2xs hover:shadow-sm transition-all flex flex-row sm:flex-col items-start gap-3 sm:gap-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0 sm:mb-3 group-hover:scale-108 transition-transform">
                    <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5 sm:mb-1.5">
                      <h4 className="text-xs sm:text-base font-extrabold text-slate-900 font-sans tracking-tight">
                        Cuentas Claras y Cierre en Mapa
                      </h4>
                      <span className="sm:hidden text-[10px] font-bold text-brand-red shrink-0">
                        Datos abiertos
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[13px] text-slate-600 font-body leading-snug sm:leading-relaxed">
                      Confirmación conjunta de entregas para liberar recursos hacia otras zonas y brindar reportes transparentes y abiertos a toda la comunidad.
                    </p>
                    <div className="hidden sm:flex mt-3.5 pt-2.5 border-t border-slate-200/60 items-center gap-1.5 text-[11px] font-bold text-brand-red">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Datos abiertos y auditables</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón CTA en móvil: ubicado al final, después de las pastillas/bullets */}
              <div className="lg:hidden pt-2 flex justify-center w-full">
                <a
                  href="https://wa.me/573112323588?text=Hola%20raDAR,%20represento%20a%20una%20organizaci%C3%B3n/comunidad%20y%20nos%20gustar%C3%ADa%20sumarnos%20a%20la%20red%20de%20ayuda."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-3.5 sm:px-6 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-brand-blue hover:bg-brand-blue-hover active:scale-98 shadow-sm sm:shadow-md shadow-brand-blue/25 hover:shadow-lg transition-all cursor-pointer font-sans group"
                >
                  <MessageSquarePlus className="w-4 h-4 text-white shrink-0 group-hover:scale-110 transition-transform" />
                  <span>
                    Sumarme a RADA<span className="inline-block -scale-x-100">R</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/90 group-hover:text-white transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </section>
        </div>
      </main>

      {/* Footer oficial */}
      <LandingFooter />

      {/* MODAL DEL CHATBOT EXISTENTE: 100% quirúrgico, sin tocar base de datos */}
      <ChatbotTicketModal
        isOpen={isChatbotModalOpen}
        onClose={() => setIsChatbotModalOpen(false)}
        onGoToMap={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
};
