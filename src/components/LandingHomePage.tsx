import React, { useState } from 'react';
import {
  MapPin,
  HeartHandshake,
  Zap,
  ShieldCheck,
  Share2,
  Search,
  CheckCircle2,
  ArrowRight,
  Navigation,
  Users,
  Globe,
  MessageSquare,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Activity,
  Layers,
  PhoneCall,
  X,
  FileText,
  Map,
  List,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export const LandingHomePage: React.FC = () => {
  const { language, t } = useTranslation();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Dynamic Background Glow Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                RADAR DE AYUDA
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Colombia
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 -mt-1 font-medium">Aquí Hace Falta</p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all"
            >
              <Map className="w-4 h-4 text-indigo-400" />
              <span>Ver Mapa en Vivo</span>
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all"
            >
              <span>Ir a la App</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-semibold mb-8 shadow-inner animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Plataforma Ciudadana Abierta & Geolocalizada</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
          Conectando a quienes <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">necesitan</span> con quienes pueden <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">ayudar</span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
          <strong className="text-slate-200">Radar de Ayuda (Aquí Hace Falta)</strong> es una herramienta digital en tiempo real diseñada para mapear, coordinar y visibilizar necesidades de auxilio y ofertas de solidaridad en emergencias comunitarias.
        </p>

        {/* CTA Button Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <a
            href="/"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 text-white font-black text-sm shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2 group"
          >
            <MapPin className="w-5 h-5 group-hover:animate-bounce" />
            <span>Explorar Mapa Interactivo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href="#como-funciona"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>¿Cómo funciona?</span>
          </a>
        </div>

        {/* Hero Features Bar */}
        <div className="mt-16 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-2xl backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Tiempo Real</h3>
            <p className="text-xs text-slate-400 mt-1">Actualización inmediata sin intermediarios ni burocracia.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-2xl backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <Navigation className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white text-sm">GPS & Mapa</h3>
            <p className="text-xs text-slate-400 mt-1">Detección automática de municipio y coordenadas exactas.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-2xl backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Radar Match</h3>
            <p className="text-xs text-slate-400 mt-1">Algoritmo inteligente de coincidencia por distancia y recurso.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-2xl backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Verificación</h3>
            <p className="text-xs text-slate-400 mt-1">Moderación transparente por líderes comunitarios y voluntarios.</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="relative z-10 py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Paso a Paso
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-4">
              ¿Cómo funciona la plataforma?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-3">
              Tres sencillos pasos para solicitar ayuda o brindar auxilio a quienes lo necesitan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 relative hover:border-slate-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-lg mb-6 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span>Ubica en el Mapa</span>
                <MapPin className="w-5 h-5 text-indigo-400" />
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Ingresa tu municipio o permite que el GPS de tu dispositivo detecte tu ubicación real. Explora las necesidades reportadas a tu alrededor en el mapa interactivo.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 relative hover:border-slate-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg mb-6 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span>Pedir u Ofrecer Ayuda</span>
                <HeartHandshake className="w-5 h-5 text-emerald-400" />
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Completa el formulario interactivo indicando la dirección y los recursos específicos (Alimentos, Medicamentos, Refugio, Maquinaria, etc.). El mapa selector desplegable ubica las coordenadas exactas.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 relative hover:border-slate-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-lg mb-6 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span>Conecta & Coordina</span>
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                El motor de coincidencias **Radar Match** vincula necesidades con ofertas cercanas. Contacta directamente por WhatsApp o comparte el enlace único (`Copiar Link`) para difundir la solicitud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Radar Match Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/80 border border-indigo-500/30 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Tecnología de Impacto
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-4">
                Motor de Coincidencias "Radar Match"
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
                Gracias a las funciones de cálculo espacial de Supabase en PostgreSQL, la plataforma compara automáticamente el tipo de ayuda solicitada contra los recursos disponibles en el mismo sector o departamento.
              </p>

              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span><strong>Score de Relevancia (0 - 100%):</strong> Ponderación por categoría y cercanía.</span>
                </li>
                <li className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span><strong>Cálculo de Distancia en km:</strong> Mapeo dinámico de proximidad Haversine.</span>
                </li>
                <li className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span><strong>Conexión 1-Clic:</strong> Botones de WhatsApp directos y enlaces compartibles.</span>
                </li>
              </ul>

              <div className="mt-8">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
                >
                  <span>Probar Radar Match en la App</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Visual Card Preview Mock */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Demostración Radar Match</span>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  95% Match
                </span>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Necesidad: Agua Potable y Alimentos</span>
                  <span className="text-[10px] text-slate-400">Armenia, Quindío</span>
                </div>
                <p className="text-xs text-slate-400">Se requieren 50 botellones de agua potable para familias afectadas.</p>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>🤝 Oferta Sugerida Cercana (a 1.2 km)</span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30">Disponible</span>
                </div>
                <p className="text-xs text-slate-300">Donación de 100 botellones de agua y alimentos secos en punto logístico.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Preguntas Frecuentes
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight mt-4">
              Resuelve tus dudas
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Tiene algún costo utilizar la plataforma Radar de Ayuda?',
                a: 'No. Es una iniciativa 100% gratuita, abierta y ciudadana diseñada para coordinar esfuerzos durante situaciones de emergencia o ayuda comunitaria.',
              },
              {
                q: '¿Cómo se verifica la autenticidad de un reporte?',
                a: 'Los reportes publicados entran en estado "Pendiente de verificación". Un equipo de moderadores y líderes locales confirman la información directamente antes de marcarla como verificada con la insignia de confianza.',
              },
              {
                q: '¿Puedo usar la aplicación desde mi teléfono móvil?',
                a: 'Sí, la interfaz está optimizada para navegadores móviles y de escritorio, permitiendo acceder al mapa, publicar reportes y usar el GPS de tu celular.',
              },
              {
                q: '¿Cómo comparto una necesidad u oferta en redes sociales?',
                a: 'Cada ventana de detalle incluye un botón superior que dice "Copiar Link". Al presionarlo se guarda el enlace exacto en tu portapapeles para pegarlo en WhatsApp, Facebook o Twitter.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-white text-sm sm:text-base flex items-center justify-between gap-4 hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      activeFaq === idx ? 'rotate-90 text-indigo-400' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="p-5 pt-0 text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-slate-800/50 mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
              AHF
            </div>
            <div>
              <p className="text-xs font-bold text-white">Radar de Ayuda — Aquí Hace Falta</p>
              <p className="text-[11px] text-slate-500">Plataforma Ciudadana Abierta de Coordinación de Ayuda</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="/" className="hover:text-white transition-colors">Mapa Principal</a>
            <span>•</span>
            <a href="/home" className="hover:text-white transition-colors">Acerca del Proyecto</a>
            <span>•</span>
            <a href="/moderador" className="hover:text-white transition-colors">Acceso Moderadores</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
