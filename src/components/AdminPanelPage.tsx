import React, { useState, useEffect } from "react";
import { showConfirm, showAlert } from "./ConfirmDialog";
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Flag,
  BarChart3,
  List,
  Lock,
  FileText,
  Clock,
  Check,
  Edit,
  Users,
  Plus,
  LogOut,
  Trash2,
  Loader2,
  MapPin,
  CheckCircle2,
  MessageSquare,
  Search,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { Need, Offer, Priority, VerificationStatus } from "../types";
import {
  CATEGORY_LABELS,
  PLACE_TYPE_LABELS,
  PRIORITY_CONFIG,
  VERIFICATION_CONFIG,
  formatTimeAgo,
  getCategoryLabel,
} from "../utils/formatters";
import { geocodeAddress } from "../utils/geocoding";
import { MiniMapPicker } from "./MiniMapPicker";
import { CityCombobox } from "./CityCombobox";
import { PublicEditOfferModal } from "./PublicEditOfferModal";
import { PublicEditModal } from "./PublicEditModal";
import { NeedDetailModal } from "./NeedDetailModal";
import { OfferDetailModal } from "./OfferDetailModal";
import {
  useNeeds,
  useOffers,
  fetchAdminReports,
  resolveReport,
  fetchAuditLogs,
  fetchUsersList,
  adminLogin,
  createAdminUser,
  updateAdminUserStatus,
  updateAdminUser,
  deleteAdminUser,
  deleteNeed,
  deleteOffer,
  updateNeed,
  updateOffer,
  logAudit,
  AdminReport,
  AdminAuditLog,
  AdminUser,
} from "../lib/supabaseService";
import { useTranslation } from "../i18n/LanguageContext";

export const AdminPanelPage: React.FC = () => {
  const { language, t } = useTranslation();
  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem("ahf_admin_token")
  );
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem("ahf_admin_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "PENDING" | "REPORTS" | "METRICS" | "ALL" | "AUDIT" | "USERS"
  >("PENDING");

  // Search & Filters
  const [adminSearch, setAdminSearch] = useState("");
  const [adminPriorityFilter, setAdminPriorityFilter] = useState<string>("ALL");
  const [adminVerificationFilter, setAdminVerificationFilter] = useState<string>("ALL");
  const [adminTypeFilter, setAdminTypeFilter] = useState<string>("ALL");

  // User management state
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "MODERATOR">("MODERATOR");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Edit user state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserRole, setEditUserRole] = useState<"ADMIN" | "MODERATOR">("MODERATOR");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Reports and Audit logs
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Editing need state
  const [editingNeed, setEditingNeed] = useState<Need | null>(null);
  const [editPriority, setEditPriority] = useState<Priority>("HIGH");
  const [editMode, setEditMode] = useState<"priority" | "full">("priority");

  // View / Edit modals
  const [viewingNeed, setViewingNeed] = useState<Need | null>(null);
  const [viewingOffer, setViewingOffer] = useState<Offer | null>(null);
  const [editingNeedViaModal, setEditingNeedViaModal] = useState<Need | null>(null);
  const [editingOfferViaModal, setEditingOfferViaModal] = useState<Offer | null>(null);

  // Fetch Needs & Offers from Supabase
  const { needs, refetch: refetchNeeds } = useNeeds(
    { search: '', categories: [], priority: 'ALL', placeType: 'ALL', status: 'ALL', verificationStatus: 'ALL', distanceKm: null, userLat: null, userLng: null, sortBy: 'RECENT', viewMode: 'NEEDS', includeArchived: true },
    'ALL_COLOMBIA'
  );
  const { offers, refetch: refetchOffers } = useOffers(
    { search: '', categories: [], priority: 'ALL', placeType: 'ALL', status: 'ALL', verificationStatus: 'ALL', distanceKm: null, userLat: null, userLng: null, sortBy: 'RECENT', viewMode: 'OFFERS', includeArchived: true },
    'ALL_COLOMBIA'
  );

  const pendingNeeds = needs.filter((n) => n.verificationStatus === "PENDING_VERIFICATION");
  const pendingOffers = offers.filter((o) => o.verificationStatus === "PENDING_VERIFICATION");
  const pendingReports = reports.filter((r) => r.status === "PENDING");

  // Load admin reports & users
  const loadData = async () => {
    setIsLoadingReports(true);
    try {
      const [reps, logs, users] = await Promise.all([
        fetchAdminReports(),
        fetchAuditLogs(),
        fetchUsersList(),
      ]);
      setReports(reps);
      setAuditLogs(logs);
      setUsersList(users);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      loadData();
    }
  }, [authToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);
    try {
      const { user, token } = await adminLogin(emailInput, passwordInput);
      setAuthToken(token);
      setCurrentUser(user);
      localStorage.setItem("ahf_admin_token", token);
      localStorage.setItem("ahf_admin_user", JSON.stringify(user));
      setPasswordInput("");
    } catch (err: any) {
      setAuthError(err.message || "Error de autenticación");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ahf_admin_token");
    localStorage.removeItem("ahf_admin_user");
    setAuthToken(null);
    setCurrentUser(null);
  };

  const handleVerifyNeed = async (id: string, action: 'verify' | 'archive') => {
    try {
      await updateNeed(id, {
        verificationStatus: action === 'verify' ? 'VERIFIED' : 'ARCHIVED',
        verifiedBy: currentUser?.name || 'Moderador',
      });
      await logAudit(
        action === 'verify' ? 'VERIFY_NEED' : 'ARCHIVE_NEED',
        currentUser?.email || 'moderador@lorspi.com',
        `Necesidad ID ${id} fue ${action === 'verify' ? 'verificada' : 'archivada'}.`,
        id
      );
      refetchNeeds();
      loadData();
      showAlert(action === 'verify' ? 'Necesidad verificada.' : 'Necesidad archivada.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error en moderación', { title: 'Error', variant: 'error' });
    }
  };

  const handleVerifyOffer = async (id: string, action: 'verify' | 'archive') => {
    try {
      await updateOffer(id, {
        verificationStatus: action === 'verify' ? 'VERIFIED' : 'ARCHIVED',
      });
      await logAudit(
        action === 'verify' ? 'VERIFY_OFFER' : 'ARCHIVE_OFFER',
        currentUser?.email || 'moderador@lorspi.com',
        `Oferta ID ${id} fue ${action === 'verify' ? 'verificada' : 'archivada'}.`,
        undefined,
        id
      );
      refetchOffers();
      loadData();
      showAlert(action === 'verify' ? 'Oferta verificada.' : 'Oferta archivada.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error en moderación', { title: 'Error', variant: 'error' });
    }
  };

  const handleArchiveNeedItem = async (id: string, title: string) => {
    if (!(await showConfirm(`¿Archivar la necesidad "${title}"?`, { title: 'Archivar necesidad' }))) return;
    try {
      await updateNeed(id, { verificationStatus: 'ARCHIVED' });
      await addNeedUpdateNote({
        needId: id,
        previousStatus: 'NEED_HELP_NOW',
        newStatus: 'CLOSED',
        description: 'Archivada por el equipo de moderación.',
        updatedBy: currentUser?.name ? `[MOD] ${currentUser.name}` : '[MOD] Moderador',
      });
      await logAudit(
        'ARCHIVE_NEED',
        currentUser?.email || 'moderador@lorspi.com',
        `Necesidad ID ${id} ("${title}") fue archivada.`,
        id
      );
      refetchNeeds();
      loadData();
      showAlert('Necesidad archivada exitosamente.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al archivar', { title: 'Error', variant: 'error' });
    }
  };

  const handleArchiveOfferItem = async (id: string, title: string) => {
    if (!(await showConfirm(`¿Archivar la oferta "${title}"?`, { title: 'Archivar oferta' }))) return;
    try {
      await updateOffer(id, { verificationStatus: 'ARCHIVED' });
      await logAudit(
        'ARCHIVE_OFFER',
        currentUser?.email || 'moderador@lorspi.com',
        `Oferta ID ${id} ("${title}") fue archivada.`,
        undefined,
        id
      );
      refetchOffers();
      loadData();
      showAlert('Oferta archivada exitosamente.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al archivar', { title: 'Error', variant: 'error' });
    }
  };

  const handleResolveReportItem = async (reportId: string, status: 'RESOLVED' | 'DISMISSED', isOffer = false) => {
    try {
      await resolveReport(reportId, status, currentUser?.email || 'moderador@lorspi.com', isOffer);
      loadData();
      showAlert(status === 'RESOLVED' ? 'Reporte resuelto.' : 'Reporte desestimado.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al actualizar reporte', { title: 'Error', variant: 'error' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      await createAdminUser({
        email: newUserEmail,
        name: newUserName,
        password: newUserPassword,
        role: newUserRole,
      });
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      loadData();
      showAlert('Usuario creado exitosamente.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error creando usuario', { title: 'Error', variant: 'error' });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      await updateAdminUserStatus(userId, !currentActive);
      loadData();
    } catch (err: any) {
      showAlert(err.message || 'Error al actualizar', { title: 'Error', variant: 'error' });
    }
  };

  const handleDeleteUserItem = async (userId: string, name: string) => {
    if (!(await showConfirm(`¿Eliminar al usuario "${name}"?`, { title: 'Eliminar usuario' }))) return;
    try {
      await deleteAdminUser(userId);
      loadData();
      showAlert('Usuario eliminado.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al eliminar', { title: 'Error', variant: 'error' });
    }
  };

  // If not logged in, render Login View
  if (!authToken) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-slate-900">{t('loginTitle')}</h1>
            <p className="text-xs text-slate-500">
              Aquí Hace Falta — Valle del Cauca
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="moderador@lorspi.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('passwordLabel')}</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cargando...</span>
                </>
              ) : (
                <span>{t('loginButton')}</span>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center pt-2">
              Clave de acceso rápido para pruebas: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">moderador123</code>
            </p>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <a href="/" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la plataforma</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-xs text-slate-800">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/" className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="font-black text-sm tracking-tight">PANEL DE MODERACIÓN</span>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-500/30">
                {currentUser?.role || 'MODERATOR'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 hidden sm:inline">
              👤 {currentUser?.name || currentUser?.email || 'Moderador'}
            </span>
            <a
              href="/moderador"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Guía</span>
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-red-500/30 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('logoutButton')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 flex-1 w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'PENDING'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pendientes por Verificar</span>
            {(pendingNeeds.length + pendingOffers.length) > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingNeeds.length + pendingOffers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'REPORTS'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>{t('pendingReports')}</span>
            {pendingReports.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingReports.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Todas las Solicitudes ({needs.length + offers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'AUDIT'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Historial de Auditoría</span>
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'USERS'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios & Moderadores ({usersList.length})</span>
          </button>
        </div>

        {/* TAB 1: PENDING VERIFICATION */}
        {activeTab === 'PENDING' && (
          <div className="space-y-6">
            {/* Pending Needs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Necesidades Pendientes ({pendingNeeds.length})
                </h3>
              </div>

              {pendingNeeds.length === 0 ? (
                <p className="text-slate-500 italic text-center py-6">
                  No hay necesidades pendientes de verificación. 🎉
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingNeeds.map((need) => (
                    <div key={need.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900">{need.title}</h4>
                          <p className="text-[11px] text-slate-500">{need.address}, {need.neighborhood}</p>
                        </div>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {need.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{need.description}</p>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => handleVerifyNeed(need.id, 'verify')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('verifyAction')}</span>
                        </button>
                        <button
                          onClick={() => setViewingNeed(need)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Ver detalle
                        </button>
                        <button
                          onClick={() => handleVerifyNeed(need.id, 'archive')}
                          className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-3 py-1.5 rounded-lg ml-auto"
                        >
                          {t('archiveAction')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Offers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  {t('pendingVerificationOffers')} ({pendingOffers.length})
                </h3>
              </div>

              {pendingOffers.length === 0 ? (
                <p className="text-slate-500 italic text-center py-6">
                  No hay ofertas pendientes de verificación. 🎉
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingOffers.map((offer) => (
                    <div key={offer.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900">{offer.title}</h4>
                          <p className="text-[11px] text-slate-500">{offer.address}, {offer.neighborhood}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Oferta
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{offer.description}</p>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => handleVerifyOffer(offer.id, 'verify')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('verifyAction')}</span>
                        </button>
                        <button
                          onClick={() => setViewingOffer(offer)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Ver detalle
                        </button>
                        <button
                          onClick={() => handleVerifyOffer(offer.id, 'archive')}
                          className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-3 py-1.5 rounded-lg ml-auto"
                        >
                          {t('archiveAction')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REPORTS */}
        {activeTab === 'REPORTS' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" />
              {t('pendingReports')} ({reports.length})
            </h3>

            {reports.length === 0 ? (
              <p className="text-slate-500 italic text-center py-6">
                No hay reportes registrados por los usuarios.
              </p>
            ) : (
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div key={rep.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${rep.status === 'PENDING' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {rep.status}
                        </span>
                        <span className="font-bold text-slate-900">{rep.reason}</span>
                      </div>
                      <p className="text-xs text-slate-600">{rep.description}</p>
                      {rep.reporterContact && (
                        <p className="text-[11px] text-slate-400">Contacto: {rep.reporterContact}</p>
                      )}
                    </div>

                    {rep.status === 'PENDING' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleResolveReportItem(rep.id, 'RESOLVED', !!rep.offerId)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg"
                        >
                          {t('resolveReport')}
                        </button>
                        <button
                          onClick={() => handleResolveReportItem(rep.id, 'DISMISSED', !!rep.offerId)}
                          className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold px-3 py-1.5 rounded-lg"
                        >
                          {t('dismissReport')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALL NEEDS & OFFERS */}
        {activeTab === 'ALL' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h3 className="font-black text-slate-900 text-sm">
                Gestión Global ({needs.length} Necesidades, {offers.length} Ofertas)
              </h3>
              
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 sm:w-60 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Filtrar por título o barrio..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Filter 1: Type */}
                <select
                  value={adminTypeFilter}
                  onChange={(e) => setAdminTypeFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Todas (necesidades + ofertas)</option>
                  <option value="NEEDS">Solo necesidades</option>
                  <option value="OFFERS">Solo ofertas</option>
                </select>

                {/* Filter 2: Priority */}
                <select
                  value={adminPriorityFilter}
                  onChange={(e) => setAdminPriorityFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Todas las prioridades</option>
                  <option value="CRITICAL">🔴 Crítica</option>
                  <option value="HIGH">🟠 Alta</option>
                  <option value="MEDIUM">🟡 Media</option>
                  <option value="LOW">🟢 Baja</option>
                </select>

                {/* Filter 3: Verification */}
                <select
                  value={adminVerificationFilter}
                  onChange={(e) => setAdminVerificationFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Todas las verificaciones</option>
                  <option value="VERIFIED">✓ Verificadas</option>
                  <option value="PENDING_VERIFICATION">◷ Pendientes</option>
                  <option value="REPORTED">⚠️ Reportadas</option>
                  <option value="ARCHIVED">📁 Archivadas</option>
                </select>

                {(adminSearch || adminPriorityFilter !== 'ALL' || adminVerificationFilter !== 'ALL' || adminTypeFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setAdminSearch('');
                      setAdminPriorityFilter('ALL');
                      setAdminVerificationFilter('ALL');
                      setAdminTypeFilter('ALL');
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline ml-1"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {(() => {
              type CombinedItem = {
                id: string;
                type: 'NEED' | 'OFFER';
                item: Need | Offer;
                title: string;
                neighborhood: string;
                address: string;
                priority?: Priority;
                verificationStatus: VerificationStatus;
                updatedAt: string;
              };

              const needItems: CombinedItem[] = (adminTypeFilter === 'OFFERS' ? [] : needs).map((n) => ({
                id: n.id,
                type: 'NEED' as const,
                item: n,
                title: n.title,
                neighborhood: n.neighborhood,
                address: n.address,
                priority: n.priority,
                verificationStatus: n.verificationStatus,
                updatedAt: n.updatedAt,
              }));

              const offerItems: CombinedItem[] = (adminTypeFilter === 'NEEDS' ? [] : offers).map((o) => ({
                id: o.id,
                type: 'OFFER' as const,
                item: o,
                title: o.title,
                neighborhood: o.neighborhood,
                address: o.address,
                priority: undefined,
                verificationStatus: o.verificationStatus,
                updatedAt: o.updatedAt,
              }));

              const filteredItems = [...needItems, ...offerItems].filter((item) => {
                if (adminSearch) {
                  const q = adminSearch.toLowerCase();
                  if (
                    !item.title.toLowerCase().includes(q) &&
                    !item.neighborhood.toLowerCase().includes(q) &&
                    !item.address.toLowerCase().includes(q)
                  )
                    return false;
                }
                if (adminPriorityFilter !== 'ALL' && item.priority !== adminPriorityFilter) return false;
                if (adminVerificationFilter !== 'ALL' && item.verificationStatus !== adminVerificationFilter) return false;
                return true;
              }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

              return (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 font-medium">
                    Mostrando <strong>{filteredItems.length}</strong> publicaciones de {needs.length + offers.length} totales
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-3">Título / Ubicación</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Prioridad</th>
                          <th className="p-3">Estado Verificación</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                              No se encontraron publicaciones con los filtros seleccionados.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3">
                                <p className="font-bold text-slate-900">{entry.title}</p>
                                <p className="text-[11px] text-slate-500">{entry.neighborhood}, {entry.address}</p>
                              </td>
                              <td className="p-3">
                                {entry.type === 'NEED' ? (
                                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                    Necesidad
                                  </span>
                                ) : (
                                  <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                    Oferta
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                {entry.priority ? (
                                  <span className="font-bold text-[11px]">
                                    {entry.priority === 'CRITICAL' ? '🔴 Crítica' : entry.priority === 'HIGH' ? '🟠 Alta' : entry.priority === 'MEDIUM' ? '🟡 Media' : '🟢 Baja'}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  entry.verificationStatus === 'VERIFIED'
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : entry.verificationStatus === 'PENDING_VERIFICATION'
                                    ? 'bg-slate-100 text-slate-700'
                                    : entry.verificationStatus === 'REPORTED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {entry.verificationStatus === 'VERIFIED'
                                    ? '✓ Verificada'
                                    : entry.verificationStatus === 'PENDING_VERIFICATION'
                                    ? '◷ Pendiente'
                                    : entry.verificationStatus === 'REPORTED'
                                    ? '⚠️ Reportada'
                                    : '📁 Archivada'}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    if (entry.type === 'NEED') {
                                      setEditingNeedViaModal(entry.item as Need);
                                    } else {
                                      setEditingOfferViaModal(entry.item as Offer);
                                    }
                                  }}
                                  className="text-blue-600 font-bold hover:underline"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => {
                                    if (entry.type === 'NEED') {
                                      handleArchiveNeedItem(entry.id, entry.title);
                                    } else {
                                      handleArchiveOfferItem(entry.id, entry.title);
                                    }
                                  }}
                                  className="text-slate-600 font-bold hover:underline"
                                >
                                  Archivar
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'AUDIT' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Historial de Auditoría ({auditLogs.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-bold text-indigo-700">{log.action}</span>
                    <p className="text-xs text-slate-700">{log.details}</p>
                    <span className="text-[10px] text-slate-400">{log.adminEmail} • {new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: USERS */}
        {activeTab === 'USERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create User Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm h-fit">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Crear Nuevo Moderador
              </h3>

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre completo</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ej: Ana María"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="ana@lorspi.com"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="MODERATOR">Moderador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  {isCreatingUser ? 'Creando...' : 'Crear Usuario'}
                </button>
              </form>
            </div>

            {/* Users List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Moderadores Registrados ({usersList.length})
              </h3>

              <div className="space-y-3">
                {usersList.map((usr) => (
                  <div key={usr.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{usr.name}</h4>
                      <p className="text-xs text-slate-600">{usr.email}</p>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 mt-1 inline-block">
                        {usr.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleUserActive(usr.id, usr.active)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${usr.active ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}
                      >
                        {usr.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDeleteUserItem(usr.id, usr.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewingNeed && (
        <NeedDetailModal
          need={viewingNeed}
          onClose={() => setViewingNeed(null)}
        />
      )}

      {viewingOffer && (
        <OfferDetailModal
          offer={viewingOffer}
          onClose={() => setViewingOffer(null)}
        />
      )}

      {editingNeedViaModal && (
        <PublicEditModal
          need={editingNeedViaModal}
          onClose={() => {
            setEditingNeedViaModal(null);
            refetchNeeds();
          }}
          moderatorName={currentUser?.name || "Moderador"}
        />
      )}

      {editingOfferViaModal && (
        <PublicEditOfferModal
          offer={editingOfferViaModal}
          onClose={() => {
            setEditingOfferViaModal(null);
            refetchOffers();
          }}
          moderatorName={currentUser?.name || "Moderador"}
        />
      )}
    </div>
  );
};
