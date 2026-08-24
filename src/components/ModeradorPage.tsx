import React, { useState, useRef, useEffect } from 'react';
import { useOffers, updateOffer } from '../lib/supabaseService';
import { ShieldCheck, MessageSquare, CheckCircle2, AlertTriangle, MapPin, Trash2, Phone, Eye, Flag, ArrowLeft, Check, Archive, Loader2, LogIn, UserPlus, User, ChevronDown, Lock } from 'lucide-react';
import { CATEGORY_LABELS, getCategoryLabel } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { RegisterWizard } from '../features/auth/components/RegisterWizard';
import { LoginModal } from '../features/auth/components/LoginModal';

const PendingOffersSection: React.FC = () => {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('ahf_admin_token') : null;
  const sessionUser = adminToken ? { name: 'Moderador', role: 'MODERATOR' } : null;

  const { offers } = useOffers({ search: '', categories: [], priority: 'ALL', placeType: 'ALL', status: 'ALL', verificationStatus: 'PENDING_VERIFICATION', distanceKm: null, userLat: null, userLng: null, sortBy: 'RECENT', viewMode: 'OFFERS' }, 'ALL_COLOMBIA');

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Only show if moderator is logged in
  if (!sessionUser) {
    return null;
  }

  const pendingOffers = offers;

  const handleAction = async (offerId: string, action: 'verify' | 'archive') => {
    if (!adminToken) {
      setActionError('Sesión expirada. Inicia sesión de nuevo.');
      return;
    }
    setActionLoading(offerId + '-' + action);
    setActionError(null);
    setActionSuccess(null);
    try {
      await updateOffer(offerId, {
        verificationStatus: action === 'verify' ? 'VERIFIED' : 'ARCHIVED',
      });
      setActionSuccess(
        action === 'verify'
          ? 'Oferta verificada exitosamente.'
          : 'Oferta archivada exitosamente.'
      );
    } catch (err: any) {
      setActionError(err?.message || 'Error al procesar la acción.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-blue-600" />
        Ofertas pendientes
        <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
          {pendingOffers.length}
        </span>
      </h2>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl p-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {offers === undefined ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Cargando ofertas...</span>
        </div>
      ) : pendingOffers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">
          No hay ofertas pendientes de verificación.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingOffers.map((offer: any) => (
            <div
              key={offer.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {offer.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {offer.description}
                  </p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  Pendiente
                </span>
              </div>

              {/* Categories */}
              {offer.categories && offer.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {offer.categories.map((c: string) => (
                    <span
                      key={c}
                      className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-200"
                    >
                      {(CATEGORY_LABELS as any)[c]?.icon || '🔹'} {(CATEGORY_LABELS as any)[c]?.label || c}
                    </span>
                  ))}
                </div>
              )}

              {/* Location and contact info */}
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {offer.address}, {offer.neighborhood}
                </span>
                {offer.contactName && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {offer.contactName}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => handleAction(offer.id, 'verify')}
                  disabled={actionLoading !== null}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  {actionLoading === offer.id + '-verify' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Verificar</span>
                </button>
                <button
                  onClick={() => handleAction(offer.id, 'archive')}
                  disabled={actionLoading !== null}
                  className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  {actionLoading === offer.id + '-archive' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Archive className="w-3.5 h-3.5" />
                  )}
                  <span>Archivar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export const ModeradorPage: React.FC<{ onOpenRegisterModal?: () => void }> = ({ onOpenRegisterModal }) => {
  const { t } = useTranslation();
  const [showRegisterWizard, setShowRegisterWizard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <a href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-3 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a la plataforma</span>
              </a>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40">
                  <ShieldCheck className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight">Guía del Moderador</h1>
                  <p className="text-xs text-slate-300 mt-0.5">
                    raDAR de Ayuda — Colombia
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors border border-white/20"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t('userMenuLogin')}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-48 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => { setIsMenuOpen(false); setShowRegisterWizard(true); }}
                      className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{t('userMenuRegister')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsMenuOpen(false); setShowLoginModal(true); }}
                      className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-semibold">{t('userMenuSignIn')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-10">

        {/* Tareas del moderador */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Tareas del moderador
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-900">Crear entradas nuevas de otras fuentes de información.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Si encuentras una necesidad reportada en redes sociales, medios o grupos comunitarios que no está en la plataforma, agrégala.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-900">Verificar la información que sea posible.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Confirma llamando al contacto o contrastando con fuentes oficiales.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-900">Rechazar entradas evidentemente falsas.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Si una entrada tiene información falsa o malintencionada, recházala.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-slate-900">Unificar entradas repetidas.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Si hay dos o más entradas de la misma petición, elige una que contenga toda la información y elimina las demás para evitar dispersar la ayuda.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
                <div>
                  <strong className="text-slate-900">Verificar geolocalización.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Algunas entradas no están bien ubicadas en el mapa. Revisa la dirección y ubícala lo mejor posible para que las personas puedan llegar con su ayuda.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">6</span>
                <div>
                  <strong className="text-slate-900">Reportar errores en el funcionamiento de la plataforma.</strong>
                  <p className="text-sm text-slate-600 mt-0.5">Si algo no funciona correctamente, comunícalo al administrador.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* ¿Cómo corroboro la información? */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-600" />
            ¿Cómo corroboro la información?
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                <strong>Llamando o escribiendo</strong> a la información de contacto que tienen algunos posts. Si el contacto confirma la necesidad, puedes marcarla como verificada.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Flag className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                <strong>Estando al tanto de información oficial</strong> de Defensa Civil, Bomberos, Cruz Roja y autoridades locales. Contrasta lo que reporta la ciudadanía con lo que informan las fuentes oficiales.
              </p>
            </div>
          </div>
        </section>

        {/* Instrucciones */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Instrucciones de uso
          </h2>

          {/* Actualizar info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900">Cómo editar una entrada</h3>
            <p className="text-sm text-slate-700">
              Cada entrada tiene un botón <strong>"Actualizar info"</strong>. Esto abre un editor que te permite hacer cambios en toda la información de la publicación.
            </p>
            <p className="text-sm text-slate-700">
              Todos los cambios que hagas como moderador quedarán registrados a tu nombre en el historial de cambios. Así otros moderadores sabrán que esta entrada ya ha sido actualizada oficialmente.
            </p>
            <div className="rounded-xl overflow-hidden border border-slate-200 inline-block">
              <img src="/moderador/actualizar-info.webp" alt="Botón Actualizar info" />
            </div>
          </div>

          {/* Verificar cambios */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900">¿Cómo verificar los cambios recientes?</h3>
            <p className="text-sm text-slate-700">
              Cada entrada tiene en su tarjeta y en la interna el registro de cambios. Todos los cambios marcados con un <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> <strong>escudo azul</strong></span> han sido hechos por moderadores. Los que no tienen el escudo han sido actualizados por ciudadanos y valdría la pena revisarlos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tarjeta con escudo de moderador</p>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src="/moderador/card-actualizada.webp" alt="Card actualizada por moderador" className="w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial de cambios</p>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src="/moderador/historial-de-cambios.webp" alt="Historial de cambios" className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reglas básicas */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Reglas básicas de moderación
          </h2>
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-3">
            <ul className="space-y-2.5 text-sm text-amber-950">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Neutralidad:</strong> No modifiques el contenido para favorecer o perjudicar a ninguna persona u organización.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Precisión:</strong> Solo marca como "verificada" una entrada cuando tengas certeza razonable de que la información es correcta.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Respeto:</strong> Trata con respeto la información de los ciudadanos. Si debes rechazar una entrada, deja un motivo claro.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>No duplicar:</strong> Antes de crear una entrada nueva, busca si ya existe. Unifica en vez de duplicar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Actualización constante:</strong> Si una necesidad ya fue cubierta, actualiza su estado. La información desactualizada confunde a los voluntarios.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Confidencialidad:</strong> No compartas datos personales de los contactos fuera de la plataforma.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-700 shrink-0">•</span>
                <span><strong>Reporta problemas:</strong> Si encuentras un bug o un abuso de la plataforma, comunícalo inmediatamente al administrador.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA: ¿Quieres ayudar a moderar? */}
        <section className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-black text-slate-900 text-xl">
              ¿Quieres ayudar a moderar?
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Para ser moderador debes registrarte, elegir la opción de <strong className="font-bold text-slate-800">Moderador</strong> en el paso de selección de rol, y completar la información solicitada. Nos pondremos en contacto contigo para evaluar tu postulación.
            </p>
            <button
              type="button"
              onClick={() => {
                if (onOpenRegisterModal) {
                  onOpenRegisterModal();
                } else {
                  setShowRegisterWizard(true);
                }
              }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrarme como moderador</span>
            </button>
          </div>
        </section>
      </div>

      {/* Register Wizard Modal (local fallback) */}
      <RegisterWizard
        isOpen={showRegisterWizard}
        onClose={() => setShowRegisterWizard(false)}
        onNavigateToLogin={() => {
          setShowRegisterWizard(false);
          setShowLoginModal(true);
        }}
        onSuccess={() => setShowRegisterWizard(false)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onOpenRegisterModal={() => {
          setShowLoginModal(false);
          setShowRegisterWizard(true);
        }}
        onSuccess={() => setShowLoginModal(false)}
      />
    </div>
  );
};
