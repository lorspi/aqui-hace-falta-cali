import React, { useState } from 'react';
import {
  MessageSquarePlus,
  HeartHandshake,
  Map,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  ExternalLink,
  Users,
  Check,
} from 'lucide-react';
import { LandingHeader } from './components/LandingHeader';
import { ElasticRadarHero } from './components/ElasticRadarHero';
import { HowItWorksHeroCard } from './components/HowItWorksHeroCard';
import { LandingFooter } from './components/LandingFooter';
import { ChatbotTicketModal } from '../../components/ChatbotTicketModal';

export const LandingPage: React.FC = () => {
  const [isChatbotModalOpen, setIsChatbotModalOpen] = useState(false);

  // Asegurar scroll nativo fluido en móviles sin rebotes ni bloqueos elásticos de overscroll
  React.useEffect(() => {
    const prevHtml = document.documentElement.style.overscrollBehaviorY;
    const prevBody = document.body.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = 'auto';
    document.body.style.overscrollBehaviorY = 'auto';
    return () => {
      document.documentElement.style.overscrollBehaviorY = prevHtml;
      document.body.style.overscrollBehaviorY = prevBody;
    };
  }, []);

  return (
    <div className="min-h-screen bg-brand-surface text-brand-text font-sans selection:bg-brand-blue selection:text-white">
      {/* Header oficial de navegación */}
      <LandingHeader onOpenChat={() => setIsChatbotModalOpen(true)} />

      <main className="space-y-16 sm:space-y-24">
        {/* ========================================================
            0. ENTRADA MONUMENTAL DEL RADAR EN SOLITARIO
           ======================================================== */}
        <ElasticRadarHero onOpenChat={() => setIsChatbotModalOpen(true)} />

        {/* ========================================================
            1. HERO PRINCIPAL (ORDEN 1)
            Gran tarjeta con foto de la cadena humana, título tricolor en 3 filas y CTAs equilibrados
           ======================================================== */}
        <section
          id="contenido-principal"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20 sm:scroll-mt-24"
        >
          <div className="relative rounded-3xl sm:rounded-4xl overflow-hidden shadow-2xl border border-slate-800/60 p-6 sm:p-12 lg:p-16 transition-all min-h-[540px] flex items-center">
            {/* Foto de fondo real: Cadena de personas ayudando (baldes de escombros) */}
            <img
              src="/images/landing/baldes-escombros.jpg"
              alt="Cadena humana de personas cooperando y ayudando en terreno"
              className="absolute inset-0 w-full h-full object-cover object-center scale-102 brightness-105 contrast-95"
            />

            {/* Capas de gradiente direccional más luminosas y diáfanas */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/50 to-slate-950/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/15" />
            <div className="absolute inset-0 bg-brand-blue/10 mix-blend-multiply pointer-events-none" />

            {/* Contenido del Hero con balance vertical óptimo */}
            <div className="relative z-10 max-w-3xl space-y-8">
              {/* Título Principal: Conectamos la ayuda (blanco) / donde realmente (amarillo) / hace falta. (azul) */}
              <h1 className="text-[2.6rem] xs:text-5xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-extrabold font-sans tracking-tight leading-[1.03]">
                <span className="block lg:whitespace-nowrap text-white">
                  Conectamos la ayuda
                </span>
                <span className="block mt-1 sm:mt-2 lg:whitespace-nowrap text-brand-yellow drop-shadow-sm">
                  donde realmente
                </span>
                <span className="block mt-1 sm:mt-2 lg:whitespace-nowrap text-brand-blue-light drop-shadow-sm">
                  hace falta.
                </span>
              </h1>

              {/* Botones de Acción: en móvil más chicos y ligeros, en escritorio tamaño normal */}
              <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5">
                {/* Botón Primario: Pedir ayuda */}
                <button
                  type="button"
                  onClick={() => setIsChatbotModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 sm:gap-2.5 px-4.5 py-2.5 sm:px-6 sm:py-3.5 rounded-xl text-xs sm:text-base font-semibold sm:font-bold text-white bg-brand-red hover:bg-[#B83232] active:scale-98 shadow-xs sm:shadow-md shadow-brand-red/30 transition-all cursor-pointer font-sans"
                >
                  <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
                  <span>Pedir ayuda</span>
                </button>

                {/* Botón Secundario: Ir al Mapa */}
                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl text-[11px] sm:text-sm font-normal sm:font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 active:scale-98 transition-all cursor-pointer font-sans"
                >
                  <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  <span>Ver mapa en vivo</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/60" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            2. CÓMO FUNCIONA CON IMAGEN DE FONDO (ORDEN 2)
            Versión fotográfica High-Key Luminous interactiva
           ======================================================== */}
        <section id="como-funciona">
          <HowItWorksHeroCard onOpenChat={() => setIsChatbotModalOpen(true)} />
        </section>

        {/* ========================================================
            3. PARA ORGANIZACIONES & BRIGADAS (ORDEN 3)
            Compacto, con colores raDAR y aviso de desarrollo activo
           ======================================================== */}
        <section id="organizaciones" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 sm:scroll-mt-28 mb-16 sm:mb-24 lg:mb-32">
          <div className="relative rounded-2xl sm:rounded-4xl bg-white text-slate-900 overflow-hidden p-4 sm:p-8 lg:p-10 border border-slate-200/90 shadow-md sm:shadow-lg shadow-slate-900/5">
            {/* Auras luminosas sutiles con los colores oficiales de raDAR */}
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-brand-yellow/15 blur-3xl pointer-events-none" />

            {/* Símbolo raDAR en filigrana institucional de fondo */}
            <img
              src="/simbolo-radar.svg"
              alt=""
              className="absolute -right-8 -bottom-8 w-64 h-64 opacity-[0.035] pointer-events-none select-none"
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-4 sm:space-y-8">
              {/* Encabezado compacto */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 border-b border-slate-100 pb-3.5 sm:pb-5">
                <div className="max-w-3xl space-y-1.5 sm:space-y-2.5">
                  <h3 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-sans tracking-tight leading-snug sm:leading-[1.12]">
                    ¿Lideras una{' '}
                    <span className="text-brand-blue relative inline-block">
                      organización
                      <span className="absolute -bottom-1 left-0 right-0 h-1 bg-brand-yellow rounded-full" />
                    </span>
                    , fundación o brigada en terreno?
                  </h3>

                  <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl font-body">
                    <strong className="text-slate-900 font-semibold">raDAR articula la fuerza solidaria de un país.</strong> Actualmente
                    nos encontramos en desarrollo de herramientas dedicadas para que fundaciones y brigadas comunitarias se conecten
                    directamente con las necesidades verificadas en tiempo real.
                  </p>
                </div>

                {/* Botón CTA en azul oficial raDAR */}
                <div className="flex flex-col items-start lg:items-end justify-center shrink-0 w-full sm:w-auto">
                  <a
                    href="https://wa.me/573112323588?text=Hola%20raDAR,%20somos%20de%20la%20organizaci%C3%B3n%20[Nombre]%20y%20nos%20gustar%C3%ADa%20sumarnos%20a%20la%20red%20de%20ayuda."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3.5 sm:px-6 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-brand-blue hover:bg-brand-blue-hover active:scale-98 shadow-sm sm:shadow-md shadow-brand-blue/25 hover:shadow-lg transition-all cursor-pointer font-sans group"
                  >
                    <MessageSquarePlus className="w-4 h-4 text-brand-yellow shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Vincular mi organización</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white/80 group-hover:text-white transition-colors" />
                  </a>
                </div>
              </div>

              {/* 3 Pilares ultra-condensados en móvil (layout horizontal fluido) y columnas en escritorio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-5">
                {/* Pilar 1: Azul (Asignación) */}
                <div className="group relative rounded-xl p-3 sm:p-5 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-brand-blue/50 shadow-2xs hover:shadow-sm transition-all flex flex-row sm:flex-col items-start gap-3 sm:gap-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0 sm:mb-3 group-hover:scale-108 transition-transform">
                    <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5 sm:mb-1.5">
                      <h4 className="text-xs sm:text-base font-extrabold text-slate-900 font-sans tracking-tight">
                        Asignación Georreferenciada
                      </h4>
                      <span className="sm:hidden text-[10px] font-bold text-brand-blue shrink-0">
                        Cero duplicidad
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[13px] text-slate-600 font-body leading-snug sm:leading-relaxed">
                      Ubicación satelital precisa de cada reporte verificado para que tus unidades acudan sin cruzarse con otros equipos.
                    </p>
                    <div className="hidden sm:flex mt-3.5 pt-2.5 border-t border-slate-200/60 items-center gap-1.5 text-[11px] font-bold text-brand-blue">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Cero duplicidad de esfuerzos</span>
                    </div>
                  </div>
                </div>

                {/* Pilar 2: Amarillo (Gestión de Roles y Brigadas) */}
                <div className="group relative rounded-xl p-3 sm:p-5 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-amber-400/60 shadow-2xs hover:shadow-sm transition-all flex flex-row sm:flex-col items-start gap-3 sm:gap-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-amber-700 shrink-0 sm:mb-3 group-hover:scale-108 transition-transform">
                    <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5 sm:mb-1.5">
                      <h4 className="text-xs sm:text-base font-extrabold text-slate-900 font-sans tracking-tight">
                        Voluntarios & Especialistas
                      </h4>
                      <span className="sm:hidden text-[10px] font-bold text-amber-700 shrink-0">
                        Perfiles activos
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[13px] text-slate-600 font-body leading-snug sm:leading-relaxed">
                      Canaliza médicos, rescatistas y transporte especializado según el tipo de incidente reportado en terreno.
                    </p>
                    <div className="hidden sm:flex mt-3.5 pt-2.5 border-t border-slate-200/60 items-center gap-1.5 text-[11px] font-bold text-amber-700">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Perfiles técnicos activos</span>
                    </div>
                  </div>
                </div>

                {/* Pilar 3: Rojo (Trazabilidad y Métricas Abiertas) */}
                <div className="group relative rounded-xl p-3 sm:p-5 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-brand-red/50 shadow-2xs hover:shadow-sm transition-all flex flex-row sm:flex-col items-start gap-3 sm:gap-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0 sm:mb-3 group-hover:scale-108 transition-transform">
                    <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5 sm:mb-1.5">
                      <h4 className="text-xs sm:text-base font-extrabold text-slate-900 font-sans tracking-tight">
                        Trazabilidad & Cierre Real
                      </h4>
                      <span className="sm:hidden text-[10px] font-bold text-brand-red shrink-0">
                        Auditables
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[13px] text-slate-600 font-body leading-snug sm:leading-relaxed">
                      Actualiza entregas en mapa vivo, libera recursos para otras zonas y genera métricas transparentes.
                    </p>
                    <div className="hidden sm:flex mt-3.5 pt-2.5 border-t border-slate-200/60 items-center gap-1.5 text-[11px] font-bold text-brand-red">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Datos auditables</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer oficial */}
      <LandingFooter />

      {/* MODAL DEL CHATBOT EXISTENTE: 100% quirúrgico, sin tocar base de datos */}
      <ChatbotTicketModal
        isOpen={isChatbotModalOpen}
        onClose={() => setIsChatbotModalOpen(false)}
      />
    </div>
  );
};
