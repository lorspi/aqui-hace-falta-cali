import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
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
  LogOut,
  Trash2,
  Loader2,
  MapPin,
  CheckCircle2,
  MessageSquare,
  Search,
  ArrowLeft,
  BookOpen,
  X,
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
import { CustomSelect } from "./CustomSelect";
import { PublicEditOfferModal } from "./PublicEditOfferModal";
import { PublicEditModal } from "./PublicEditModal";
import { NeedDetailModal } from "./NeedDetailModal";
import { OfferDetailModal } from "./OfferDetailModal";
import {
  useNeeds,
  useOffers,
  fetchUserProfile,
  fetchAdminReports,
  resolveReport,
  fetchAuditLogs,
  fetchUsersList,
  adminLogin,
  updateUserModerationStatus,
  deleteAdminUser,
  deleteNeed,
  deleteOffer,
  updateNeed,
  updateOffer,
  logAudit,
  addNeedUpdateNote,
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
  const [pendingStatusUser, setPendingStatusUser] = useState<boolean>(false);

  // Auto-login si ya existe una sesión activa autenticada en Supabase
  useEffect(() => {
    const checkSupabaseSession = async () => {
      if (authToken) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            const isApprovedMod = profile.role === 'moderador' && profile.moderation_status === 'APPROVED';
            const isAdmin = profile.role === 'ADMIN';
            const isPendingMod = profile.role === 'moderador' && profile.moderation_status !== 'APPROVED';

            if (isPendingMod) {
              setPendingStatusUser(true);
              return;
            }

            if (isApprovedMod || isAdmin) {
              const token = session.access_token || 'supabase_mod_token';
              const adminUserObj: AdminUser = {
                id: profile.id,
                name: profile.full_name || profile.name || session.user.email?.split('@')[0] || 'Moderador',
                email: session.user.email || '',
                role: isAdmin ? 'ADMIN' : 'MODERATOR',
                active: true,
                createdAt: new Date().toISOString(),
              };
              localStorage.setItem('ahf_admin_token', token);
              localStorage.setItem('ahf_admin_user', JSON.stringify(adminUserObj));
              setAuthToken(token);
              setCurrentUser(adminUserObj);
            }
          }
        }
      } catch (err) {
        console.warn('[AdminPanelPage] Auto session check note:', err);
      }
    };
    checkSupabaseSession();
  }, [authToken]);

  type AdminTab = "PENDING" | "REPORTS" | "METRICS" | "ALL" | "AUDIT" | "USERS";
  const VALID_TABS: AdminTab[] = ["PENDING", "REPORTS", "METRICS", "ALL", "AUDIT", "USERS"];
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const saved = localStorage.getItem("ahf_admin_active_tab");
    return saved && VALID_TABS.includes(saved as AdminTab) ? (saved as AdminTab) : "PENDING";
  });

  // Persistir la pestaña activa para restaurarla al recargar la página
  useEffect(() => {
    localStorage.setItem("ahf_admin_active_tab", activeTab);
  }, [activeTab]);

  // Search & Filters
  const [adminSearch, setAdminSearch] = useState("");
  const [adminPriorityFilter, setAdminPriorityFilter] = useState<string>("ALL");
  const [adminVerificationFilter, setAdminVerificationFilter] = useState<string>("ALL");
  const [adminTypeFilter, setAdminTypeFilter] = useState<string>("ALL");

  // User management state
  const [usersList, setUsersList] = useState<AdminUser[]>([]);

  // User detail modal state
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
  const [isSavingUserStatus, setIsSavingUserStatus] = useState(false);

  // User list filters
  const [userStatusFilter, setUserStatusFilter] = useState<string>("ALL");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");

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
  const pendingVolunteers = usersList.filter((u) => 
    (u.rawRole === 'voluntario' || u.role === 'VOLUNTARIO' || u.volunteerConnectionType) &&
    (u.moderationStatus || 'PENDING') === 'PENDING'
  );

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

  // Comprobar automáticamente la sesión activa de Supabase Auth para moderadores aprobados
  useEffect(() => {
    const checkActiveSession = async () => {
      if (authToken && currentUser) return;

      setIsLoggingIn(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            const isModeratorRole = profile.role === 'moderador' || profile.role === 'ADMIN';
            const isApproved = profile.moderation_status === 'APPROVED' || profile.role === 'ADMIN';

            if (isModeratorRole && isApproved) {
              const adminUser: AdminUser = {
                id: profile.id,
                email: session.user.email || profile.email || '',
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.full_name || 'Moderador',
                role: profile.role === 'ADMIN' ? 'ADMIN' : 'MODERATOR',
                active: true,
                createdAt: profile.created_at || new Date().toISOString(),
              };

              setAuthToken(session.access_token);
              setCurrentUser(adminUser);
              localStorage.setItem('ahf_admin_token', session.access_token);
              localStorage.setItem('ahf_admin_user', JSON.stringify(adminUser));
            } else if (isModeratorRole && profile.moderation_status === 'PENDING') {
              setAuthError('Tu solicitud de moderador se encuentra en estado pendiente de aprobación.');
            } else if (isModeratorRole && profile.moderation_status === 'REJECTED') {
              setAuthError('Tu solicitud de moderador fue rechazada.');
            }
          }
        }
      } catch (err) {
        console.error('[AdminPanelPage] Error al verificar sesión activa:', err);
      } finally {
        setIsLoggingIn(false);
      }
    };

    checkActiveSession();
  }, []);

  useEffect(() => {
    if (authToken) {
      loadData();
    }
  }, [authToken]);

  useEffect(() => {
    if (activeTab === 'USERS' && currentUser?.role !== 'ADMIN') {
      setActiveTab('PENDING');
    }
  }, [activeTab, currentUser]);

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

  const handleLogout = async () => {
    localStorage.removeItem("ahf_admin_token");
    localStorage.removeItem("ahf_admin_user");
    localStorage.removeItem("ahf_auth_user");
    setAuthToken(null);
    setCurrentUser(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Error al cerrar sesión en Supabase:", e);
    }
    window.location.href = "/";
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
        verifiedBy: action === 'verify' ? (currentUser?.name || 'Moderador') : undefined,
        lastUpdatedBy: currentUser?.name ? `[MOD] ${currentUser.name}` : '[MOD] Moderador',
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

  const handleChangeModerationStatus = async (
    userId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  ) => {
    setIsSavingUserStatus(true);
    try {
      await updateUserModerationStatus(userId, status);
      await logAudit(
        'UPDATE_USER_MODERATION_STATUS',
        currentUser?.email || 'admin@lorspi.com',
        `Estado de moderación del usuario ID ${userId} actualizado a ${status}.`
      );
      // Refrescar lista y modal abierto
      const updated = await fetchUsersList();
      setUsersList(updated);
      setViewingUser((prev) => (prev ? { ...prev, moderationStatus: status } : prev));
      showAlert('Estado de moderación actualizado.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al actualizar el estado', { title: 'Error', variant: 'error' });
    } finally {
      setIsSavingUserStatus(false);
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

  if (pendingStatusUser && !authToken) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900">Solicitud en Revisión</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tu solicitud de moderador se encuentra en estado <strong>pendiente de aprobación</strong>. Un administrador revisará tu información para habilitar tu acceso al panel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { window.location.href = '/'; }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la plataforma</span>
          </button>
        </div>
      </div>
    );
  }

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

          {currentUser?.role === 'ADMIN' && (
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
          )}
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

            {/* Pending Volunteers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  Postulaciones de Voluntarios Pendientes ({pendingVolunteers.length})
                </h3>
              </div>

              {pendingVolunteers.length === 0 ? (
                <p className="text-slate-500 italic text-center py-6">
                  No hay solicitudes de voluntarios pendientes de revisión. 🎉
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingVolunteers.map((vol) => (
                    <div key={vol.id} className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                            🧑‍🌾 Voluntario RaDAR
                          </span>
                          <h4 className="font-extrabold text-slate-900 mt-1">{vol.name}</h4>
                          <p className="text-xs text-slate-600">{vol.email}</p>
                        </div>
                        <span className="bg-amber-500/20 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                          ◷ PENDIENTE
                        </span>
                      </div>

                      <div className="bg-white/80 rounded-xl p-2.5 text-xs text-slate-700 space-y-1 border border-amber-100">
                        <p><strong className="text-slate-900">Contacto:</strong> {vol.phone || 'No registrado'} ({vol.preferredContactMethod || 'WhatsApp'})</p>
                        <p><strong className="text-slate-900">Tipo Aporte:</strong> {vol.volunteerConnectionType === 'VOLUNTEER' ? 'Ser voluntario/a' : vol.volunteerConnectionType === 'OFFER_HELP' ? 'Ofrecer ayuda' : vol.volunteerConnectionType === 'COLLABORATE' ? 'Colaborar' : vol.volunteerConnectionType === 'COMMUNITY' ? 'Comunidad' : 'Voluntariado'}</p>
                        {vol.volunteerNotes && (
                          <p className="italic text-slate-600 border-t border-slate-100 pt-1 mt-1">"{vol.volunteerNotes}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                        <button
                          onClick={() => handleChangeModerationStatus(vol.id, 'APPROVED')}
                          disabled={isSavingUserStatus}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprobar</span>
                        </button>
                        <button
                          onClick={() => handleChangeModerationStatus(vol.id, 'REJECTED')}
                          disabled={isSavingUserStatus}
                          className="bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs px-3 py-2 rounded-xl transition-all border border-red-200 flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                        <button
                          onClick={() => setViewingUser(vol)}
                          className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 ml-auto cursor-pointer"
                        >
                          Ver detalle
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
                <CustomSelect
                  value={adminTypeFilter}
                  onChange={setAdminTypeFilter}
                  className="w-52"
                  icon={<List className="w-3.5 h-3.5 text-slate-400" />}
                  options={[
                    { value: 'ALL', label: 'Todas (necesidades + ofertas)' },
                    { value: 'NEEDS', label: 'Solo necesidades' },
                    { value: 'OFFERS', label: 'Solo ofertas' },
                  ]}
                />

                {/* Filter 2: Priority */}
                <CustomSelect
                  value={adminPriorityFilter}
                  onChange={setAdminPriorityFilter}
                  className="w-44"
                  icon={<AlertTriangle className="w-3.5 h-3.5 text-slate-400" />}
                  options={[
                    { value: 'ALL', label: 'Todas las prioridades' },
                    { value: 'CRITICAL', label: '🔴 Crítica' },
                    { value: 'HIGH', label: '🟠 Alta' },
                    { value: 'MEDIUM', label: '🟡 Media' },
                    { value: 'LOW', label: '🟢 Baja' },
                  ]}
                />

                {/* Filter 3: Verification */}
                <CustomSelect
                  value={adminVerificationFilter}
                  onChange={setAdminVerificationFilter}
                  className="w-48"
                  icon={<ShieldCheck className="w-3.5 h-3.5 text-slate-400" />}
                  options={[
                    { value: 'ALL', label: 'Todas las verificaciones' },
                    { value: 'VERIFIED', label: '✓ Verificadas' },
                    { value: 'PENDING_VERIFICATION', label: '◷ Pendientes' },
                    { value: 'REPORTED', label: '⚠️ Reportadas' },
                    { value: 'ARCHIVED', label: '📁 Archivadas' },
                  ]}
                />

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
        {activeTab === 'USERS' && currentUser?.role === 'ADMIN' && (
          <div className="space-y-4">
            {/* Users List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Usuarios Registrados ({usersList.length})
                </h3>

                <div className="flex items-center gap-2">
                  <CustomSelect
                    value={userStatusFilter}
                    onChange={setUserStatusFilter}
                    className="w-40"
                    icon={<CheckCircle className="w-3.5 h-3.5 text-slate-400" />}
                    options={[
                      { value: 'ALL', label: 'Todos los estados' },
                      { value: 'PENDING', label: 'Pendiente' },
                      { value: 'APPROVED', label: 'Aprobado' },
                      { value: 'REJECTED', label: 'Rechazado' },
                    ]}
                  />
                  <CustomSelect
                    value={userRoleFilter}
                    onChange={setUserRoleFilter}
                    className="w-44"
                    icon={<ShieldCheck className="w-3.5 h-3.5 text-slate-400" />}
                    options={[
                      { value: 'ALL', label: 'Todos los roles' },
                      { value: 'VOLUNTARIO', label: '🧑‍🌾 Voluntario RaDAR' },
                      { value: 'MODERATOR', label: '🛡️ Moderador' },
                      { value: 'ADMIN', label: '👑 Administrador' },
                      { value: 'USER', label: '👤 Usuario Regular' },
                    ]}
                  />
                </div>
              </div>

              {(() => {
                const filteredUsers = usersList.filter((u) => {
                  const status = (u.moderationStatus || 'APPROVED').toUpperCase();
                  const matchesStatus = userStatusFilter === 'ALL' || status === userStatusFilter;
                  
                  const isVoluntario = u.rawRole === 'voluntario' || u.role === 'VOLUNTARIO' || !!u.volunteerConnectionType;
                  const isModerator = u.role === 'MODERATOR' || u.rawRole === 'moderador';
                  const isAdmin = u.role === 'ADMIN';
                  const isRegularUser = !isVoluntario && !isModerator && !isAdmin;

                  const matchesRole =
                    userRoleFilter === 'ALL' ||
                    (userRoleFilter === 'VOLUNTARIO' && isVoluntario) ||
                    (userRoleFilter === 'MODERATOR' && isModerator) ||
                    (userRoleFilter === 'ADMIN' && isAdmin) ||
                    (userRoleFilter === 'USER' && isRegularUser);

                  return matchesStatus && matchesRole;
                });

                const sortedUsers = [...filteredUsers].sort((a, b) => {
                  const aPending = (a.moderationStatus || 'APPROVED') === 'PENDING' ? 0 : 1;
                  const bPending = (b.moderationStatus || 'APPROVED') === 'PENDING' ? 0 : 1;
                  if (aPending !== bPending) return aPending - bPending;
                  return (b.createdAt || '').localeCompare(a.createdAt || '');
                });

                if (sortedUsers.length === 0) {
                  return (
                    <p className="text-slate-500 italic text-center py-6">
                      {usersList.length === 0
                        ? 'No hay usuarios registrados.'
                        : 'No hay usuarios que coincidan con los filtros.'}
                    </p>
                  );
                }

                return (
                  <div className="space-y-3">
                    {sortedUsers.map((usr) => {
                      const isVoluntario = usr.rawRole === 'voluntario' || usr.role === 'VOLUNTARIO' || !!usr.volunteerConnectionType;
                      const isPending = (usr.moderationStatus || 'APPROVED') === 'PENDING';

                      return (
                        <div
                          key={usr.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isPending
                              ? 'bg-amber-50/70 border-amber-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 truncate">{usr.name}</h4>
                              {isVoluntario ? (
                                <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                                  🧑‍🌾 Voluntario RaDAR
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                                  {usr.role}
                                </span>
                              )}
                              <ModerationStatusChip status={usr.moderationStatus} />
                            </div>

                            <p className="text-xs text-slate-600 truncate">{usr.email} {usr.phone ? `• Tel: ${usr.phone}` : ''}</p>

                            {isVoluntario && (
                              <p className="text-[11px] text-slate-500 italic truncate">
                                <strong>Aporte:</strong> {usr.volunteerConnectionType === 'VOLUNTEER' ? 'Tiempo/Experiencia' : usr.volunteerConnectionType === 'OFFER_HELP' ? 'Recursos/Ayuda' : usr.volunteerConnectionType === 'COLLABORATE' ? 'Alianza' : 'Voluntariado'} • <strong>Prefiere:</strong> {usr.preferredContactMethod || 'WhatsApp'}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleChangeModerationStatus(usr.id, 'APPROVED')}
                                  disabled={isSavingUserStatus}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                                  title="Aprobar Solicitud"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Aprobar</span>
                                </button>
                                <button
                                  onClick={() => handleChangeModerationStatus(usr.id, 'REJECTED')}
                                  disabled={isSavingUserStatus}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs px-3 py-1.5 rounded-lg transition-all border border-red-200 flex items-center gap-1 cursor-pointer"
                                  title="Rechazar Solicitud"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Rechazar</span>
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => setViewingUser(usr)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>Detalle</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUserItem(usr.id, usr.name)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewingNeed && (
        <NeedDetailModal
          need={viewingNeed}
          onClose={() => setViewingNeed(null)}
          onOpenQuieroAyudar={() => {}}
          onOpenReportModal={() => {}}
          onOpenUpdateStatusModal={() => {}}
        />
      )}

      {viewingOffer && (
        <OfferDetailModal
          offer={viewingOffer}
          isOpen={!!viewingOffer}
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
          onSaved={(updatedNeed) => {
            setEditingNeedViaModal(null);
            refetchNeeds();
            // Reabrir el detalle de la necesidad específica
            setViewingNeed(updatedNeed);
          }}
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
          onSaved={(updatedOffer) => {
            setEditingOfferViaModal(null);
            refetchOffers();
            // Reabrir el detalle de la oferta específica
            setViewingOffer(updatedOffer);
          }}
        />
      )}

      {viewingUser && (
        <UserDetailModal
          user={viewingUser}
          isSaving={isSavingUserStatus}
          onChangeStatus={(status) => handleChangeModerationStatus(viewingUser.id, status)}
          onClose={() => setViewingUser(null)}
        />
      )}
    </div>
  );
};

// ==========================================
// MODERATION STATUS CHIP
// ==========================================
const MODERATION_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Aprobado', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Rechazado', className: 'bg-red-100 text-red-700 border-red-200' },
};

const ModerationStatusChip: React.FC<{ status?: string }> = ({ status }) => {
  const key = (status || 'APPROVED').toUpperCase();
  const cfg = MODERATION_STATUS_STYLES[key] || {
    label: key,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

// ==========================================
// USER DETAIL MODAL
// ==========================================
const UserDetailModal: React.FC<{
  user: AdminUser;
  isSaving: boolean;
  onChangeStatus: (status: 'PENDING' | 'APPROVED' | 'REJECTED') => void;
  onClose: () => void;
}> = ({ user, isSaving, onChangeStatus, onClose }) => {
  const currentStatus = (user.moderationStatus || 'APPROVED').toUpperCase();

  const Row: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <div className="flex flex-col gap-0.5 py-2 border-b border-slate-100">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-xs text-slate-800 break-words">{value?.toString().trim() || '—'}</span>
    </div>
  );

  const fullPhone =
    user.phone ||
    [user.phoneCountryCode, user.phoneNumber].filter(Boolean).join(' ') ||
    undefined;

  const isModerator = user.role === 'MODERATOR' || user.rawRole === 'moderador';

  const statusOptions: Array<{ value: 'PENDING' | 'APPROVED' | 'REJECTED'; label: string; className: string }> = [
    { value: 'APPROVED', label: 'Aprobar', className: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
    { value: 'PENDING', label: 'Marcar pendiente', className: 'bg-amber-500 hover:bg-amber-400 text-white' },
    { value: 'REJECTED', label: 'Rechazar', className: 'bg-red-600 hover:bg-red-500 text-white' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-scroll shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-black text-slate-900 text-base truncate">{user.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {user.role}
              </span>
              <ModerationStatusChip status={user.moderationStatus} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-3">
          <h4 className="text-xs font-black text-slate-700 mt-1 mb-1">Datos personales</h4>
          <Row label="Nombres" value={user.firstName} />
          <Row label="Apellidos" value={user.lastName} />
          <Row label="Nombre completo" value={user.name} />
          <Row label="Correo electrónico" value={user.email} />
          <Row label="Teléfono" value={fullPhone} />
          <Row label="Tipo de documento" value={user.documentType} />
          <Row label="Número de documento" value={user.documentNumber} />

          <h4 className="text-xs font-black text-slate-700 mt-4 mb-1">Ubicación</h4>
          <Row label="País" value={user.country} />
          <Row label="Departamento" value={user.department} />
          <Row label="Ciudad" value={user.city} />

          {isModerator && (
            <>
              <h4 className="text-xs font-black text-slate-700 mt-4 mb-1">Solicitud de moderador</h4>
              <Row label="Comunidad / colectivo" value={user.moderatorCommunityCollective} />
              <Row label="Motivación" value={user.moderatorMotivation} />
            </>
          )}

          {(user.rawRole === 'voluntario' || user.volunteerConnectionType || user.volunteerNotes) && (
            <>
              <h4 className="text-xs font-black text-amber-700 mt-4 mb-1">Postulación de Voluntario / Aliado</h4>
              <Row label="Forma de conexión" value={user.volunteerConnectionType === 'VOLUNTEER' ? 'Ser voluntario/a (tiempo/experiencia)' : user.volunteerConnectionType === 'OFFER_HELP' ? 'Ofrecer ayuda (recursos/servicios)' : user.volunteerConnectionType === 'COLLABORATE' ? 'Colaborar (alianza/proyecto)' : user.volunteerConnectionType === 'COMMUNITY' ? 'Ser parte de la comunidad' : user.volunteerConnectionType} />
              <Row label="Contacto preferido" value={user.preferredContactMethod === 'WHATSAPP' ? 'Mensaje WhatsApp' : user.preferredContactMethod === 'PHONE_CALL' ? 'Llamada telefónica' : user.preferredContactMethod === 'EMAIL' ? 'Correo electrónico' : user.preferredContactMethod} />
              <Row label="Propuesta / Notas" value={user.volunteerNotes} />
            </>
          )}

          <h4 className="text-xs font-black text-slate-700 mt-4 mb-1">Cuenta</h4>
          <Row label="Rol (crudo)" value={user.rawRole || user.role} />
          <Row label="Términos aceptados" value={user.acceptTerms ? 'Sí' : 'No'} />
          <Row label="Fecha aceptación términos" value={user.termsAcceptedAt} />
          <Row label="Fecha de registro" value={user.createdAt} />
        </div>

        {/* Footer: change moderation status */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-5 py-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-600">Estado de moderación</span>
            <ModerationStatusChip status={user.moderationStatus} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                disabled={isSaving || currentStatus === opt.value}
                onClick={() => onChangeStatus(opt.value)}
                className={`py-2 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${opt.className}`}
              >
                {isSaving ? '...' : opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Al aprobar, el usuario obtiene los permisos correspondientes a su rol.
          </p>
        </div>
      </div>
    </div>
  );
};
