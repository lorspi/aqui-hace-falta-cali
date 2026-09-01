import React, { useState } from 'react';
import {
  MapPin,
  HeartHandshake,
  Zap,
  ShieldCheck,
  ShieldAlert,
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
  Clock,
  Target,
  Info,
  AlertTriangle,
  Radio,
  ExternalLink,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { VolunteerRegisterModal } from '../features/auth/components/VolunteerRegisterModal';
import { Footer } from './Footer';

export const LandingHomePage: React.FC = () => {
  const { language, t } = useTranslation();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-[#1F1C1A] font-sans selection:bg-[#1B3A93] selection:text-white overflow-x-hidden">
      {/* Background Micro-glow accents */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#F2C33D]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#1B3A93]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#CE3B3B]/05 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <img
              src="/logo-radar.svg"
              alt="RaDAR de Ayuda Logo"
              className="h-9 sm:h-10 w-auto group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#1B3A93]/10 text-[#1B3A93] border border-[#1B3A93]/20">
                Colombia
              </span>
            </div>
          </a>

          <div className="flex items-center gap-2.5">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#1B3A93] hover:bg-[#1B3A93]/90 text-white shadow-md shadow-[#1B3A93]/20 hover:scale-[1.02] transition-all"
            >
              <span>Ir a la App</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Official Emergency Disclaimer Notice */}
      <div className="bg-[#f1f5f9] border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center text-xs sm:text-sm text-slate-700 gap-2.5">
          <div className="flex items-center gap-2 justify-center">
            <div className="p-1 rounded-md bg-amber-100/80 text-amber-800 shrink-0">
              <ShieldAlert className="w-4 h-4 text-[#b45309]" />
            </div>
            <span className="text-xs sm:text-sm text-slate-800 leading-snug">
              <strong className="font-bold text-slate-900">Aviso importante:</strong> Esta plataforma es una capa ciudadana de ayuda y <strong className="font-bold text-[#b45309]">no sustituye los canales oficiales de emergencia.</strong>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 text-xs text-slate-700">
            <span className="text-slate-600 font-medium text-xs">
              Líneas de emergencia:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
            
            <a
              href="tel:123"
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-md text-slate-900 font-bold text-xs shadow-2xs transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>123</span>
            </a>

            <a
              href="tel:132"
              className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-md text-slate-900 text-xs shadow-2xs transition-all"
            >
              <span>Cruz Roja</span>
              <strong className="font-bold text-slate-950">132</strong>
            </a>

            <a
              href="tel:119"
              className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-md text-slate-900 text-xs shadow-2xs transition-all"
            >
              <span>Bomberos</span>
              <strong className="font-bold text-slate-950">119</strong>
            </a>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] text-[#1F1C1A] max-w-4xl mx-auto">
          Conectando a quienes{' '}
          <span className="text-[#1B3A93] underline decoration-[#F2C33D] decoration-4 underline-offset-4">
            necesitan
          </span>{' '}
          con quienes pueden{' '}
          <span className="text-[#CE3B3B]">
            ayudar
          </span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
          <strong className="text-[#1F1C1A] font-bold">RaDAR de Ayuda</strong> es una plataforma abierta que permite a ciudadanos, voluntarios y organizaciones encontrar, reportar y coordinar necesidades y recursos de forma rápida, geolocalizada y organizada en un solo lugar.
        </p>

        {/* Step by Step Section (¿Cómo funciona la plataforma?) */}
        <div id="como-funciona" className="mt-12 pt-10 border-t border-slate-200/80 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1F1C1A] tracking-tight">
            ¿Cómo funciona la plataforma?
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2">
            Tres sencillos pasos para solicitar auxilio o brindar donaciones y voluntariado.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-left">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 relative shadow-sm hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#F2C33D]/20 border border-[#F2C33D]/40 flex items-center justify-center text-slate-900 font-black text-base mb-5 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-lg font-extrabold text-[#1F1C1A] mb-2 flex items-center gap-2">
                <span>Ubica en el Mapa</span>
                <MapPin className="w-4 h-4 text-[#1B3A93]" />
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Selecciona tu municipio o permite que el GPS de tu celular detecte tu posición. Explora los puntos de necesidad e insumos en el mapa interactivo.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 relative shadow-sm hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#1B3A93]/15 border border-[#1B3A93]/30 flex items-center justify-center text-[#1B3A93] font-black text-base mb-5 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-lg font-extrabold text-[#1F1C1A] mb-2 flex items-center gap-2">
                <span>Publica Necesidad u Oferta</span>
                <HeartHandshake className="w-4 h-4 text-[#1B3A93]" />
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Dinos qué hace falta (alimentos, medicina, refugio, herramientas) o qué puedes ofrecer. El selector ubica el punto exacto con dirección y contacto.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 relative shadow-sm hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#CE3B3B]/15 border border-[#CE3B3B]/30 flex items-center justify-center text-[#CE3B3B] font-black text-base mb-5 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-lg font-extrabold text-[#1F1C1A] mb-2 flex items-center gap-2">
                <span>Conecta & Coordina</span>
                <MessageSquare className="w-4 h-4 text-[#CE3B3B]" />
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                El motor Radar Match encuentra coincidencias cercanas. Comunícate en 1-clic por WhatsApp o comparte el enlace directo para movilizar ayuda.
              </p>
            </div>
          </div>

          {/* Radar Match Section */}
          <div className="mt-14 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-md relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#1B3A93]/05 rounded-full blur-2xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black text-[#1F1C1A] tracking-tight">
                  Motor de Coincidencias Radar Match
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Mediante cálculo espacial en tiempo real, el sistema compara automáticamente el tipo de ayuda requerida con las ofertas de donaciones o voluntariado disponibles en el mismo municipio o sector.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#F5F6F9] p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B3A93]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Score % Match</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Por coincidencia de categoría y cercanía.</p>
                  </div>

                  <div className="bg-[#F5F6F9] p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B3A93]">
                      <MapPin className="w-4 h-4 shrink-0 text-[#F2C33D]" />
                      <span>Distancia en km</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Proximidad Haversine precisa en tiempo real.</p>
                  </div>

                  <div className="bg-[#F5F6F9] p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#CE3B3B]">
                      <PhoneCall className="w-4 h-4 shrink-0" />
                      <span>Contacto 1-Clic</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">WhatsApp directo y enlaces compartibles.</p>
                  </div>
                </div>
              </div>

              {/* Visual Match Demo Card */}
              <div className="lg:col-span-5 bg-[#F5F6F9] border border-slate-200 p-4 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#CE3B3B] animate-ping" />
                    <span className="text-xs font-bold text-[#1F1C1A]">Coincidencia Detectada</span>
                  </div>
                  <span className="text-[10px] font-black bg-[#1B3A93] text-white px-2 py-0.5 rounded-md">
                    95% Match
                  </span>
                </div>

                {/* Need item */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-[#CE3B3B]">Necesidad Activa</span>
                  <p className="text-xs font-bold text-[#1F1C1A]">Agua Potable y Cobijas</p>
                  <p className="text-[11px] text-slate-500">Se requieren botellones de agua para familias afectadas.</p>
                </div>

                {/* Offer item */}
                <div className="bg-white p-3 rounded-xl border border-emerald-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-700">Oferta Cercana (a 1.2 km)</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">Disponible</span>
                  </div>
                  <p className="text-xs font-bold text-[#1F1C1A]">Donación de 50 botellones de agua</p>
                </div>
              </div>
            </div>
          </div>

          {/* Voice & Tone Section (Comunicación clara y humana) — OCULTO */}
        </div>
      </section>

      {/* Brand Identity & Symbol Section */}
      <section className="relative z-10 py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Visual Symbol Illustration */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative p-8 bg-[#F5F6F9] rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center max-w-sm w-full">
                <img
                  src="/simbolo-radar.svg"
                  alt="El Símbolo de RaDAR"
                  className="w-48 h-48 object-contain drop-shadow-md"
                />
                <div className="mt-4 text-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">El Símbolo de RaDAR</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">La señal que se propaga y el abrazo que acoge</p>
                </div>
              </div>
            </div>

            {/* Manual Color & Meaning Explanation */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1F1C1A] tracking-tight">
                  ¿Por qué el símbolo y los tres colores?
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
                  Dos arcos abiertos alrededor de un punto. Se lee como una señal que se propaga desde un punto detectado, y como un abrazo que rodea a quien está en el centro. Los tres colores provienen de la bandera de Colombia y cuentan cómo funciona la red:
                </p>
              </div>

              <div className="space-y-3">
                {/* Red */}
                <div className="bg-[#F5F6F9] p-3.5 rounded-2xl border-l-4 border-l-[#CE3B3B] border border-slate-200/80 flex items-start gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#CE3B3B] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#1F1C1A]">Rojo — El centro y la emergencia</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Es el punto exacto donde algo está pasando y alguien necesita ayuda. Es lo primero que se detecta y lo primero que se ve.</p>
                  </div>
                </div>

                {/* Blue */}
                <div className="bg-[#F5F6F9] p-3.5 rounded-2xl border-l-4 border-l-[#1B3A93] border border-slate-200/80 flex items-start gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#1B3A93] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#1F1C1A]">Azul — El arco interior y el apoyo cercano</h4>
                    <p className="text-xs text-slate-600 mt-0.5">El vecino, la cuadra, el voluntario que ya está ahí. Rodea la emergencia de primero porque es el que llega de primero.</p>
                  </div>
                </div>

                {/* Yellow */}
                <div className="bg-[#F5F6F9] p-3.5 rounded-2xl border-l-4 border-l-[#F2C33D] border border-slate-200/80 flex items-start gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#F2C33D] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#1F1C1A]">Amarillo — El arco exterior y la solidaridad amplia</h4>
                    <p className="text-xs text-slate-600 mt-0.5">El apoyo que abraza desde más lejos: las organizaciones, las donaciones, la ciudad entera. La chispa de luz alrededor de lo que está pasando.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1F1C1A] tracking-tight">
            Resuelve tus dudas sobre la plataforma
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: '¿Tiene algún costo utilizar la plataforma RaDAR de Ayuda?',
              a: 'No. Es una iniciativa 100% gratuita, abierta y ciudadana para coordinar auxilio y ayuda comunitaria en momentos de necesidad.',
            },
            {
              q: '¿Cómo se verifica la información de una solicitud?',
              a: 'Cada solicitud u oferta cuenta con estados de verificación transparentes. Voluntarios y líderes locales confirman directamente la veracidad de los datos antes de marcar la tarjeta como verificada.',
            },
            {
              q: '¿Puedo usar la aplicación desde mi teléfono inteligente?',
              a: 'Sí. Toda la plataforma está optimizada para navegadores móviles y de escritorio, permitiendo usar la geolocalización GPS del teléfono.',
            },
            {
              q: '¿Cómo comparto una necesidad en WhatsApp o redes sociales?',
              a: 'Dentro de cada tarjeta o modal de detalle encontrarás el botón "Copiar Link". Al presionar este botón, se copia la dirección web exacta para pegarla directamente en cualquier chat o red social.',
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left font-bold text-[#1F1C1A] text-xs sm:text-sm flex items-center justify-between gap-3 hover:text-[#1B3A93] transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    activeFaq === idx ? 'rotate-90 text-[#1B3A93]' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="p-4 pt-0 text-slate-600 text-xs leading-relaxed border-t border-slate-100 mt-1">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Seccion de Contacto para Voluntarios y Aliados */}
      <section className="relative z-10 bg-gradient-to-br from-[#1B3A93] to-[#0f2461] text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-blue-900/50">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <Users className="w-4 h-4 text-[#F2C33D]" />
            <span>Voluntarios y Aliados</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            ¿Quieres sumarte como voluntario o aliarte con nosotros?
          </h2>
          <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
            Estamos coordinando ayuda activa en Cali y la región. Si eres voluntario, entidad u organización y deseas colaborar, comunícate directamente con nuestro equipo.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Registro de Voluntarios (Modal Directo) */}
            <button
              type="button"
              onClick={() => setIsVolunteerModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#F2C33D] hover:bg-[#e0b232] text-[#1F1C1A] font-black text-sm transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-105"
            >
              <HeartHandshake className="w-5 h-5 shrink-0 text-[#1B3A93]" />
              <span>🧑‍🌾 Registrarme como Voluntario RaDAR</span>
            </button>

            {/* WhatsApp */}
            <a
              href="https://wa.me/573112323588"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-105"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span>WhatsApp: +57 311 232 3588</span>
            </a>

            {/* Correo */}
            <a
              href="mailto:info@radardeayuda.co"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer hover:scale-105 backdrop-blur-xs"
            >
              <Mail className="w-5 h-5 shrink-0 text-blue-200" />
              <span>info@radardeayuda.co</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Modal de Registro para Voluntarios */}
      <VolunteerRegisterModal
        isOpen={isVolunteerModalOpen}
        onClose={() => setIsVolunteerModalOpen(false)}
      />
    </div>
  );
};

