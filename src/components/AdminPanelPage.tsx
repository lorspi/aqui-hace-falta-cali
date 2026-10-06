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
  Menu,
  Bot,
  ExternalLink,
  Building2,
  Globe,
  Phone,
  Mail,
  Eye,
  EyeOff,
  ArrowUpDown,
  Calendar,
  Archive,
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
import { ChatbotReportsList } from "./ChatbotReportsList";
import { Avatar } from "./ui/Etiqueta";
import { iniciales } from "../utils/publicaciones";
import {
  useNeeds,
  useOffers,
  fetchUserProfile,
  fetchAdminReports,
  resolveReport,
  deleteReport,
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
  AdminOrganization,
  fetchAdminOrganizationsList,
  updateOrganizationVerification,
} from "../lib/supabaseService";
import { cargarDocumentosOrg } from "../utils/documentosVerificacion";
import type { DocumentoVerificacion } from "../types/panel";
import { useTranslation } from "../i18n/LanguageContext";

function AdminPriorityPill({ priority }: { priority?: Priority }) {
  if (!priority) return null;
  const cfg = {
    CRITICAL: { label: '🔴 Crítica', cls: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line' },
    HIGH: { label: '🟠 Alta', cls: 'bg-rd-amber-soft text-rd-amber-ink border-rd-amber-line' },
    MEDIUM: { label: '🟡 Media', cls: 'bg-rd-navy-soft text-rd-navy border-rd-navy-line' },
    LOW: { label: '🟢 Baja', cls: 'bg-rd-green-soft text-rd-green border-rd-green-line' },
  }[priority] || { label: priority, cls: 'bg-rd-fondo text-rd-ink-meta border-rd-line' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-rd-sm text-rd-10 font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function AdminVerificationPill({ status }: { status: VerificationStatus }) {
  const cfg = {
    VERIFIED: { label: '✓ Verificada', cls: 'bg-rd-green-soft text-rd-green border-rd-green-line' },
    PENDING_VERIFICATION: { label: '◷ Pendiente', cls: 'bg-rd-amber-soft text-rd-amber-ink border-rd-amber-line' },
    REPORTED: { label: '⚠️ Reportada', cls: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line' },
    REJECTED: { label: '✕ Rechazada', cls: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line' },
    ARCHIVED: { label: '📁 Archivada', cls: 'bg-rd-fondo text-rd-ink-meta border-rd-line' },
  }[status] || { label: status, cls: 'bg-rd-fondo text-rd-ink-meta border-rd-line' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-rd-sm text-rd-10 font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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

  type AdminTab = "PENDING" | "ORGANIZATIONS" | "REPORTS" | "METRICS" | "ALL" | "AUDIT" | "USERS" | "CHATBOT";
  const VALID_TABS: AdminTab[] = ["PENDING", "ORGANIZATIONS", "REPORTS", "METRICS", "ALL", "AUDIT", "USERS", "CHATBOT"];
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const saved = localStorage.getItem("ahf_admin_active_tab");
    return saved && VALID_TABS.includes(saved as AdminTab) ? (saved as AdminTab) : "PENDING";
  });

  // Persistir la pestaña activa para restaurarla al recargar la página
  useEffect(() => {
    localStorage.setItem("ahf_admin_active_tab", activeTab);
  }, [activeTab]);

  // Subpestaña activa del Chatbot (Tickets Rápidos vs WhatsApp)
  const [chatbotSubTab, setChatbotSubTab] = useState<'QUICK_TICKETS' | 'WHATSAPP'>('QUICK_TICKETS');

  // Subfiltro para la pestaña de Pendientes
  const [pendingSubFilter, setPendingSubFilter] = useState<'ALL' | 'NEEDS' | 'OFFERS' | 'VOLUNTEERS'>('ALL');

  // Organizations & Communities state
  const [organizationsList, setOrganizationsList] = useState<AdminOrganization[]>([]);
  const [viewingOrg, setViewingOrg] = useState<AdminOrganization | null>(null);
  const [previewingDoc, setPreviewingDoc] = useState<DocumentoVerificacion | null>(null);
  const [isSavingOrgStatus, setIsSavingOrgStatus] = useState(false);
  const [orgStatusFilter, setOrgStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [orgCategoryFilter, setOrgCategoryFilter] = useState<'ALL' | 'ORGANIZACION' | 'COMUNIDAD'>('ALL');

  // Search & Filters
  const [adminSearch, setAdminSearch] = useState("");
  const [adminPriorityFilter, setAdminPriorityFilter] = useState<string>("ALL");
  const [adminVerificationFilter, setAdminVerificationFilter] = useState<string>("ALL");
  const [adminTypeFilter, setAdminTypeFilter] = useState<string>("ALL");
  const [adminAuthorTypeFilter, setAdminAuthorTypeFilter] = useState<string>("ALL");
  const [adminAgeFilter, setAdminAgeFilter] = useState<string>("ALL");
  const [adminSortOrder, setAdminSortOrder] = useState<"RECENT" | "OLDEST">("RECENT");

  // Reports tab filters
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("ALL");
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("ALL");

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

  // Reportes del chatbot (US-5) pendientes de verificación: needs con source = 'WhatsApp'.
  const chatbotPendingCount = needs.filter(
    (n) => (n.source || "").toLowerCase() === "whatsapp" && n.verificationStatus === "PENDING_VERIFICATION"
  ).length;

  // Load admin reports, users & organizations
  const loadData = async () => {
    setIsLoadingReports(true);
    try {
      const [reps, logs, users, orgs] = await Promise.all([
        fetchAdminReports(),
        fetchAuditLogs(),
        fetchUsersList(),
        fetchAdminOrganizationsList(),
      ]);
      setReports(reps);
      setAuditLogs(logs);
      setUsersList(users);
      setOrganizationsList(orgs);
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
    if (!(await showConfirm(`¿Ocultar del mapa la necesidad "${title}"? Dejará de ser visible para los ciudadanos en el mapa y la lista pública.`, { title: 'Ocultar del mapa' }))) return;
    try {
      await updateNeed(id, { verificationStatus: 'ARCHIVED' });
      await addNeedUpdateNote({
        needId: id,
        previousStatus: 'NEED_HELP_NOW',
        newStatus: 'CLOSED',
        description: 'Ocultada del mapa por el equipo de moderación.',
        updatedBy: currentUser?.name ? `[MOD] ${currentUser.name}` : '[MOD] Moderador',
      });
      await logAudit(
        'ARCHIVE_NEED',
        currentUser?.email || 'moderador@lorspi.com',
        `Necesidad ID ${id} ("${title}") fue ocultada del mapa (archivada).`,
        id
      );
      refetchNeeds();
      loadData();
      showAlert('Necesidad ocultada del mapa.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al ocultar', { title: 'Error', variant: 'error' });
    }
  };

  const handleArchiveOfferItem = async (id: string, title: string) => {
    if (!(await showConfirm(`¿Ocultar del mapa la oferta "${title}"? Dejará de ser visible para los ciudadanos en el mapa y la lista pública.`, { title: 'Ocultar del mapa' }))) return;
    try {
      await updateOffer(id, { verificationStatus: 'ARCHIVED' });
      await logAudit(
        'ARCHIVE_OFFER',
        currentUser?.email || 'moderador@lorspi.com',
        `Oferta ID ${id} ("${title}") fue ocultada del mapa (archivada).`,
        undefined,
        id
      );
      refetchOffers();
      loadData();
      showAlert('Oferta ocultada del mapa.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al ocultar', { title: 'Error', variant: 'error' });
    }
  };

  const handleRestoreNeedItem = async (id: string, title: string) => {
    if (!(await showConfirm(`¿Restaurar la necesidad "${title}" en el mapa? Volverá a ser visible para todos los ciudadanos.`, { title: 'Restaurar en mapa' }))) return;
    try {
      await updateNeed(id, { verificationStatus: 'VERIFIED' });
      await logAudit(
        'RESTORE_NEED',
        currentUser?.email || 'moderador@lorspi.com',
        `Necesidad ID ${id} ("${title}") fue restaurada al mapa (verificada).`,
        id
      );
      refetchNeeds();
      loadData();
      showAlert('Necesidad restaurada exitosamente en el mapa.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al restaurar', { title: 'Error', variant: 'error' });
    }
  };

  const handleRestoreOfferItem = async (id: string, title: string) => {
    if (!(await showConfirm(`¿Restaurar la oferta "${title}" en el mapa? Volverá a ser visible para todos los ciudadanos.`, { title: 'Restaurar en mapa' }))) return;
    try {
      await updateOffer(id, { verificationStatus: 'VERIFIED' });
      await logAudit(
        'RESTORE_OFFER',
        currentUser?.email || 'moderador@lorspi.com',
        `Oferta ID ${id} ("${title}") fue restaurada al mapa (verificada).`,
        undefined,
        id
      );
      refetchOffers();
      loadData();
      showAlert('Oferta restaurada exitosamente en el mapa.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al restaurar', { title: 'Error', variant: 'error' });
    }
  };

  // Marca el reporte como RESUELTO (no toca la publicación).
  const handleResolveReportItem = async (reportId: string, isOffer = false) => {
    try {
      await resolveReport(reportId, 'RESOLVED', currentUser?.email || 'moderador@lorspi.com', isOffer);
      loadData();
      showAlert('Reporte marcado como resuelto.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al actualizar reporte', { title: 'Error', variant: 'error' });
    }
  };

  // Desestima el reporte eliminándolo por completo (no toca la publicación).
  const handleDismissReportItem = async (reportId: string, isOffer = false) => {
    if (!(await showConfirm('¿Eliminar este reporte? Esta acción no se puede deshacer.', { title: 'Desestimar reporte' }))) return;
    try {
      await deleteReport(reportId, currentUser?.email || 'moderador@lorspi.com', isOffer);
      loadData();
      showAlert('Reporte eliminado.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al eliminar reporte', { title: 'Error', variant: 'error' });
    }
  };

  // Marca el reporte como RESUELTO y archiva la publicación asociada para que deje de mostrarse.
  const handleResolveAndArchiveReportItem = async (
    reportId: string,
    entryId: string | undefined,
    isOffer: boolean,
    entryTitle?: string
  ) => {
    if (!entryId) {
      showAlert('No se encontró la publicación asociada al reporte.', { title: 'Error', variant: 'error' });
      return;
    }
    const kind = isOffer ? 'oferta' : 'necesidad';
    if (!(await showConfirm(
      `¿Marcar el reporte como resuelto y archivar la ${kind}${entryTitle ? ` "${entryTitle}"` : ''}? Dejará de mostrarse públicamente.`,
      { title: 'Resolver y archivar' }
    ))) return;

    try {
      const moderatorEmail = currentUser?.email || 'moderador@lorspi.com';

      // 1. Archivar la publicación asociada.
      if (isOffer) {
        await updateOffer(entryId, {
          verificationStatus: 'ARCHIVED',
          lastUpdatedBy: currentUser?.name ? `[MOD] ${currentUser.name}` : '[MOD] Moderador',
        });
        await logAudit('ARCHIVE_OFFER', moderatorEmail, `Oferta ID ${entryId} archivada tras resolver reporte ${reportId}.`);
      } else {
        await updateNeed(entryId, { verificationStatus: 'ARCHIVED' });
        await logAudit('ARCHIVE_NEED', moderatorEmail, `Necesidad ID ${entryId} archivada tras resolver reporte ${reportId}.`);
      }

      // 2. Marcar el reporte como resuelto.
      await resolveReport(reportId, 'RESOLVED', moderatorEmail, isOffer);

      loadData();
      refetchNeeds();
      refetchOffers();
      showAlert('Reporte resuelto y publicación archivada.', { title: 'Éxito', variant: 'success' });
    } catch (err: any) {
      showAlert(err.message || 'Error al resolver y archivar', { title: 'Error', variant: 'error' });
    }
  };

  const handleChangeModerationStatus = async (
    userId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  ) => {
    setIsSavingUserStatus(true);
    try {
      await updateUserModerationStatus(userId, status);
      let totalCascade = 0;
      if (status === 'APPROVED') {
        const updatePayload = {
          verification_status: 'VERIFIED',
          verified_by: currentUser?.name || 'Super Admin',
          updated_at: new Date().toISOString(),
        };
        await supabase.from('profiles').update({ is_verified: true, updated_at: new Date().toISOString() }).eq('id', userId);
        const [{ data: nData }, { data: oData }] = await Promise.all([
          supabase.from('needs').update(updatePayload).eq('user_id', userId).eq('verification_status', 'PENDING_VERIFICATION').select('id'),
          supabase.from('offers').update(updatePayload).eq('user_id', userId).eq('verification_status', 'PENDING_VERIFICATION').select('id'),
        ]);
        totalCascade = (nData?.length || 0) + (oData?.length || 0);
        refetchNeeds();
        refetchOffers();
        loadData();
      }
      await logAudit(
        'UPDATE_USER_MODERATION_STATUS',
        currentUser?.email || 'admin@lorspi.com',
        `Estado de moderación del usuario ID ${userId} actualizado a ${status}.${totalCascade > 0 ? ` Se auto-aprobaron ${totalCascade} publicaciones pendientes.` : ''}`
      );
      // Refrescar lista y modal abierto
      const updated = await fetchUsersList();
      setUsersList(updated);
      setViewingUser((prev) => (prev ? { ...prev, moderationStatus: status } : prev));
      showAlert(
        `Estado de moderación actualizado a ${status}.${totalCascade > 0 ? ` Se publicaron ${totalCascade} publicaciones pendientes en el mapa.` : ''}`,
        { title: 'Éxito', variant: 'success' }
      );
    } catch (err: any) {
      showAlert(err.message || 'Error al actualizar el estado', { title: 'Error', variant: 'error' });
    } finally {
      setIsSavingUserStatus(false);
    }
  };

  const handleToggleOrgVerification = async (org: AdminOrganization) => {
    const nextStatus = !org.isVerified;
    const actionVerb = nextStatus ? 'verificar' : 'revocar la verificación de';
    if (!(await showConfirm(`¿Estás seguro de ${actionVerb} a "${org.name}"?`, {
      title: nextStatus ? 'Verificar Organización / Comunidad' : 'Revocar Verificación',
    }))) {
      return;
    }

    setIsSavingOrgStatus(true);
    try {
      const { approvedNeedsCount, approvedOffersCount } = await updateOrganizationVerification(
        org.id,
        org.userId,
        nextStatus,
        org.name,
        currentUser?.name || 'Super Admin'
      );
      const totalCascade = approvedNeedsCount + approvedOffersCount;
      await logAudit(
        nextStatus ? 'VERIFY_ORGANIZATION' : 'UNVERIFY_ORGANIZATION',
        currentUser?.email || 'admin@lorspi.com',
        `Entidad "${org.name}" (ID: ${org.id}) marcada como ${nextStatus ? 'VERIFICADA' : 'NO VERIFICADA'}.${totalCascade > 0 ? ` Se auto-aprobaron ${totalCascade} publicaciones pendientes.` : ''}`
      );
      // Refrescar lista y modal abierto si coincide
      const updated = await fetchAdminOrganizationsList();
      setOrganizationsList(updated);
      refetchNeeds();
      refetchOffers();
      loadData();
      if (viewingOrg && viewingOrg.id === org.id) {
        setViewingOrg({ ...viewingOrg, isVerified: nextStatus });
      }
      const cascadeMsg = totalCascade > 0
        ? ` Se aprobaron y publicaron en el mapa ${totalCascade} ${totalCascade === 1 ? 'publicación que estaba' : 'publicaciones que estaban'} en espera.`
        : '';
      showAlert(
        nextStatus ? `"${org.name}" ha sido verificada exitosamente.${cascadeMsg}` : `Se revocó la verificación de "${org.name}".`,
        { title: 'Éxito', variant: 'success' }
      );
    } catch (err: any) {
      showAlert(err.message || 'Error al actualizar verificación', { title: 'Error', variant: 'error' });
    } finally {
      setIsSavingOrgStatus(false);
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
      <div className="min-h-screen bg-rd-fondo flex items-center justify-center p-4 font-rd text-rd-ink">
        <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-6 md:p-8 max-w-md w-full shadow-xs space-y-6 text-center">
          <div className="w-12 h-12 rounded-rd-xl bg-rd-amber-soft border border-rd-amber-line flex items-center justify-center mx-auto text-rd-amber">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-rd-18 font-bold text-rd-ink">Solicitud en Revisión</h1>
            <p className="text-rd-12 text-rd-ink-2 leading-relaxed">
              Tu solicitud de moderador se encuentra en estado <strong>pendiente de aprobación</strong>. Un administrador revisará tu información para habilitar tu acceso al panel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { window.location.href = '/'; }}
            className="w-full bg-rd-navy hover:bg-rd-navy-hover text-white font-semibold py-2.5 rounded-rd-md transition-colors text-rd-13 flex items-center justify-center gap-2 cursor-pointer"
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
      <div className="min-h-screen bg-rd-fondo flex items-center justify-center p-4 font-rd text-rd-ink">
        <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-6 md:p-8 max-w-md w-full shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo-radar.svg" alt="RaDAR de Ayuda" className="h-8 mx-auto mb-1" />
            <h1 className="text-rd-18 font-bold text-rd-ink">{t('loginTitle')}</h1>
            <p className="text-rd-12 text-rd-ink-meta">
              Panel Administrativo y de Moderación
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-rd-12">
            {authError && (
              <div className="bg-rd-coral-soft border border-rd-coral-line text-rd-coral p-3 rounded-rd-md flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-rd-ink-2 mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="moderador@lorspi.com"
                className="w-full h-10 px-3 bg-rd-surface border border-rd-line rounded-rd-md text-rd-13 text-rd-ink focus:border-rd-navy focus:outline-none focus:ring-2 focus:ring-rd-navy-soft transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-rd-ink-2 mb-1">{t('passwordLabel')}</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full h-10 px-3 bg-rd-surface border border-rd-line rounded-rd-md text-rd-13 text-rd-ink focus:border-rd-navy focus:outline-none focus:ring-2 focus:ring-rd-navy-soft transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-10 bg-rd-navy hover:bg-rd-navy-hover text-white font-semibold rounded-rd-md transition-colors shadow-xs flex items-center justify-center gap-2 text-rd-13 cursor-pointer"
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

          <div className="text-center pt-2 border-t border-rd-line">
            <a href="/" className="text-rd-12 text-rd-ink-meta hover:text-rd-navy inline-flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la plataforma</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  type AdminNavTabItem = {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  };

  const adminNavItems: AdminNavTabItem[] = [
    {
      id: 'PENDING',
      label: 'Pendientes',
      icon: <Clock className="w-4 h-4 shrink-0" />,
      count: pendingNeeds.length + pendingOffers.length + pendingVolunteers.length,
    },
    {
      id: 'ORGANIZATIONS',
      label: 'Org & Comunidades',
      icon: <Building2 className="w-4 h-4 shrink-0" />,
      count: organizationsList.filter((o) => !o.isVerified).length,
    },
    {
      id: 'REPORTS',
      label: 'Reportes',
      icon: <Flag className="w-4 h-4 shrink-0" />,
      count: pendingReports.length,
    },
    {
      id: 'CHATBOT',
      label: 'Chatbot',
      icon: <MessageSquare className="w-4 h-4 shrink-0" />,
      count: chatbotPendingCount,
    },
    {
      id: 'ALL',
      label: 'Publicaciones',
      icon: <List className="w-4 h-4 shrink-0" />,
      count: needs.length + offers.length,
    },
    {
      id: 'AUDIT',
      label: 'Auditoría',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    ...(currentUser?.role === 'ADMIN'
      ? [
          {
            id: 'USERS' as AdminTab,
            label: 'Usuarios & Roles',
            icon: <Users className="w-4 h-4 shrink-0" />,
            count: usersList.length,
          },
        ]
      : []),
  ];

  const currentTabConfig = adminNavItems.find((item) => item.id === activeTab) || adminNavItems[0];

  const renderNavItem = (item: AdminNavTabItem) => {
    const isCurrent = activeTab === item.id;
    return (
      <div key={item.id} className="space-y-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab(item.id);
            setMobileMenuOpen(false);
          }}
          aria-current={isCurrent ? 'page' : undefined}
          className={`font-rd flex w-full h-10 shrink-0 items-center gap-2.5 rounded-rd-lg px-3 text-rd-13 font-medium text-left transition-colors cursor-pointer ${
            isCurrent
              ? 'bg-rd-navy-soft font-semibold text-rd-navy'
              : 'text-rd-ink-2 hover:bg-rd-fondo hover:text-rd-ink'
          }`}
        >
          <span className={`shrink-0 ${isCurrent ? 'text-rd-navy' : 'text-rd-ink-3'}`}>
            {item.icon}
          </span>
          <span className="truncate flex-1">{item.label}</span>
          {item.count !== undefined && item.count > 0 && (
            <span className="ml-auto shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-rd-10 font-bold bg-rd-fondo text-rd-ink-meta border border-rd-line">
              {item.count}
            </span>
          )}
        </button>

        {/* Submenú de Chatbot cuando está activo */}
        {item.id === 'CHATBOT' && activeTab === 'CHATBOT' && (
          <div className="ml-4 pl-3 border-l-2 border-rd-line space-y-1 my-1">
            <button
              type="button"
              onClick={() => {
                setChatbotSubTab('QUICK_TICKETS');
                setMobileMenuOpen(false);
              }}
              className={`font-rd flex w-full h-8 items-center gap-2 rounded-rd-md px-2.5 text-rd-12 font-medium text-left transition-colors cursor-pointer ${
                chatbotSubTab === 'QUICK_TICKETS'
                  ? 'bg-rd-navy text-white font-semibold shadow-xs'
                  : 'text-rd-ink-2 hover:bg-rd-fondo hover:text-rd-ink'
              }`}
            >
              <Bot className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">Tickets Rápidos</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setChatbotSubTab('WHATSAPP');
                setMobileMenuOpen(false);
              }}
              className={`font-rd flex w-full h-8 items-center gap-2 rounded-rd-md px-2.5 text-rd-12 font-medium text-left transition-colors cursor-pointer ${
                chatbotSubTab === 'WHATSAPP'
                  ? 'bg-rd-navy text-white font-semibold shadow-xs'
                  : 'text-rd-ink-2 hover:bg-rd-fondo hover:text-rd-ink'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">WhatsApp</span>
              {chatbotPendingCount > 0 && (
                <span
                  className={`ml-auto shrink-0 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-rd-10 font-bold ${
                    chatbotSubTab === 'WHATSAPP'
                      ? 'bg-white/20 text-white'
                      : 'bg-rd-fondo text-rd-ink-meta border border-rd-line'
                  }`}
                >
                  {chatbotPendingCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderUserFooter = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-rd-lg bg-rd-fondo">
        <div className="w-8 h-8 rounded-full bg-rd-navy-soft text-rd-navy font-bold text-rd-12 flex items-center justify-center shrink-0">
          {(currentUser?.name || currentUser?.email || 'M').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-rd-12 font-semibold text-rd-ink truncate">
            {currentUser?.name || 'Moderador'}
          </span>
          <span className="text-rd-10 text-rd-ink-meta truncate">
            {currentUser?.email || ''}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <a
          href="/moderador"
          className="flex-1 flex items-center justify-center gap-1.5 text-rd-11-5 font-medium text-rd-ink-2 hover:text-rd-navy bg-rd-fondo hover:bg-rd-navy-soft/60 px-2.5 py-1.5 rounded-rd-md transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Guía</span>
        </a>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-1.5 text-rd-11-5 font-semibold text-rd-coral hover:bg-rd-coral-soft/50 px-2.5 py-1.5 rounded-rd-md transition-colors cursor-pointer"
          title={t('logoutButton')}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Salir</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="rd-app font-rd flex min-h-dvh gap-3 bg-rd-fondo p-3 lg:h-dvh lg:overflow-hidden text-rd-13-5 leading-relaxed tracking-rd-cuerpo text-rd-ink antialiased max-lg:block max-lg:gap-0 max-lg:bg-rd-fondo max-lg:p-0">
      {/* Mobile Drawer Backdrop & Drawer (<1024px) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-rd-ink/40 backdrop-blur-xs lg:hidden flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-rd-surface border-r border-rd-line p-4 flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="pb-3 mb-2 border-b border-rd-line space-y-2">
              <div className="flex items-center justify-between">
                <img src="/logo-radar.svg" alt="RaDAR de Ayuda" className="h-7 w-auto" />
                <div className="flex items-center gap-2">
                  <span className="bg-rd-fondo text-rd-navy text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm border border-rd-line">
                    {currentUser?.role || 'MOD'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-rd-ink-meta hover:text-rd-ink rounded-rd-md transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div>
                <h2 className="font-bold text-rd-14 text-rd-ink leading-tight">Panel de Moderación</h2>
                <p className="text-rd-11 text-rd-ink-meta">Gestión y verificación</p>
              </div>
            </div>

            {/* Nav list */}
            <nav className="flex-1 overflow-y-auto space-y-1 py-2">
              {adminNavItems.map(renderNavItem)}
            </nav>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-rd-line mt-auto">
              {renderUserFooter()}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (≥1024px) */}
      <aside className="w-64 flex h-full shrink-0 flex-col rounded-rd-xl border border-rd-line bg-rd-surface py-4 px-3.5 max-lg:hidden">
        {/* Return button */}
        <a
          href="/mapa-ayudas-necesidades"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/mapa-ayudas-necesidades');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="inline-flex items-center gap-1.5 text-rd-11-5 text-rd-ink-meta hover:text-rd-navy transition-colors mb-3 px-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a la plataforma</span>
        </a>

        {/* Brand & Title */}
        <div className="px-1 pb-3 mb-2 border-b border-rd-line space-y-2">
          {/* Fila 1: Logo + Rol */}
          <div className="flex items-center justify-between">
            <img src="/logo-radar.svg" alt="RaDAR de Ayuda" className="h-7 w-auto" />
            <span className="bg-rd-fondo text-rd-navy text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm border border-rd-line">
              {currentUser?.role || 'MOD'}
            </span>
          </div>
          {/* Fila 2: Título y subtítulo */}
          <div>
            <h2 className="font-bold text-rd-14 text-rd-ink leading-tight">Panel de Moderación</h2>
            <p className="text-rd-11 text-rd-ink-meta">Gestión y verificación</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto space-y-1 py-1">
          {adminNavItems.map(renderNavItem)}
        </nav>

        {/* Footer profile & actions */}
        <div className="mt-auto border-t border-rd-line pt-3">
          {renderUserFooter()}
        </div>
      </aside>

      {/* Mobile Top Header (<1024px) */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-rd-surface border-b border-rd-line">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1 text-rd-ink-2 hover:bg-rd-fondo rounded-rd-md transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/logo-radar.svg" alt="RaDAR" className="h-6 w-auto" />
          <span className="font-bold text-rd-13 text-rd-ink">Panel Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-rd-navy-soft text-rd-navy text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm border border-rd-navy-line">
            {currentUser?.role || 'MOD'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-rd-coral p-1.5 hover:bg-rd-coral-soft rounded-rd-md transition-colors"
            title={t('logoutButton')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 min-w-0 flex flex-col rounded-rd-xl border border-rd-line bg-rd-surface overflow-hidden max-lg:rounded-none max-lg:border-0">
        {/* Content Header */}
        <div className="px-5 py-3.5 border-b border-rd-line bg-rd-surface flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-rd-navy">
              {currentTabConfig.icon}
            </span>
            <h1 className="font-bold text-rd-15 text-rd-ink truncate">
              {currentTabConfig.label}
              {activeTab === 'CHATBOT' && (
                <span className="font-normal text-rd-ink-meta text-rd-13 ml-1.5">
                  / {chatbotSubTab === 'QUICK_TICKETS' ? 'Tickets Rápidos' : 'WhatsApp'}
                </span>
              )}
            </h1>
            {currentTabConfig.count !== undefined && currentTabConfig.count > 0 && (
              <span className="bg-rd-fondo text-rd-ink-meta text-rd-11 font-semibold px-2 py-0.5 rounded-full border border-rd-line">
                {currentTabConfig.count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-rd-11 text-rd-ink-meta hidden sm:inline">
              👤 {currentUser?.name || currentUser?.email || 'Moderador'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-rd-fondo/40">
        {/* TAB 1: PENDING VERIFICATION */}
        {activeTab === 'PENDING' && (() => {
          const totalPending = pendingNeeds.length + pendingOffers.length + pendingVolunteers.length;
          const showNeeds = pendingSubFilter === 'ALL' || pendingSubFilter === 'NEEDS';
          const showOffers = pendingSubFilter === 'ALL' || pendingSubFilter === 'OFFERS';
          const showVolunteers = pendingSubFilter === 'ALL' || pendingSubFilter === 'VOLUNTEERS';

          const hasItems =
            (showNeeds && pendingNeeds.length > 0) ||
            (showOffers && pendingOffers.length > 0) ||
            (showVolunteers && pendingVolunteers.length > 0);

          return (
            <div className="space-y-4">
              {/* Sub-filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-rd-surface p-3.5 rounded-rd-xl border border-rd-line shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingSubFilter('ALL')}
                    className={`h-8 px-3 rounded-rd-md text-rd-12 font-medium transition-colors cursor-pointer border ${
                      pendingSubFilter === 'ALL'
                        ? 'bg-rd-navy text-white border-rd-navy font-semibold shadow-xs'
                        : 'bg-rd-surface text-rd-ink hover:bg-rd-fondo border-rd-line'
                    }`}
                  >
                    Todos ({totalPending})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingSubFilter('NEEDS')}
                    className={`h-8 px-3 rounded-rd-md text-rd-12 font-medium transition-colors cursor-pointer border ${
                      pendingSubFilter === 'NEEDS'
                        ? 'bg-rd-navy text-white border-rd-navy font-semibold shadow-xs'
                        : 'bg-rd-surface text-rd-ink hover:bg-rd-fondo border-rd-line'
                    }`}
                  >
                    Necesidades ({pendingNeeds.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingSubFilter('OFFERS')}
                    className={`h-8 px-3 rounded-rd-md text-rd-12 font-medium transition-colors cursor-pointer border ${
                      pendingSubFilter === 'OFFERS'
                        ? 'bg-rd-navy text-white border-rd-navy font-semibold shadow-xs'
                        : 'bg-rd-surface text-rd-ink hover:bg-rd-fondo border-rd-line'
                    }`}
                  >
                    Ofertas ({pendingOffers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingSubFilter('VOLUNTEERS')}
                    className={`h-8 px-3 rounded-rd-md text-rd-12 font-medium transition-colors cursor-pointer border ${
                      pendingSubFilter === 'VOLUNTEERS'
                        ? 'bg-rd-navy text-white border-rd-navy font-semibold shadow-xs'
                        : 'bg-rd-surface text-rd-ink hover:bg-rd-fondo border-rd-line'
                    }`}
                  >
                    Voluntarios ({pendingVolunteers.length})
                  </button>
                </div>
                <span className="text-rd-11-5 text-rd-ink-meta font-medium">
                  {totalPending} en cola
                </span>
              </div>

              {!hasItems ? (
                <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-10 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-rd-green mx-auto opacity-70" />
                  <h4 className="font-bold text-rd-ink text-rd-15">¡Todo al día!</h4>
                  <p className="text-rd-ink-meta text-rd-12">
                    No hay solicitudes pendientes de verificación en esta sección. 🎉
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Needs */}
                  {showNeeds &&
                    pendingNeeds.map((need) => (
                      <div
                        key={need.id}
                        className="bg-rd-surface rounded-rd-xl p-4 md:p-4.5 border border-rd-line flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-rd-ink-3/40 shadow-xs"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-rd-coral-soft text-rd-coral border border-rd-coral-line text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm">
                              Necesidad
                            </span>
                            <AdminPriorityPill priority={need.priority} />
                            <span className="bg-rd-amber-soft text-rd-amber-ink border border-rd-amber-line text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm">
                              ◷ Pendiente
                            </span>
                            <span className="text-rd-11-5 text-rd-ink-meta flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rd-ink-3" />
                              {need.neighborhood ? `${need.neighborhood}, ` : ''}{need.address || 'Ubicación registrada'}
                            </span>
                            <span className="text-rd-11 text-rd-ink-meta flex items-center gap-1">
                              <Clock className="w-3 h-3 text-rd-ink-3" />
                              {formatTimeAgo(need.updatedAt, 'es')}
                            </span>
                          </div>
                          <h4 className="font-semibold text-rd-ink text-rd-14">{need.title}</h4>
                          <p className="text-rd-12 text-rd-ink-2 line-clamp-2">{need.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleVerifyNeed(need.id, 'verify')}
                            className="bg-rd-navy hover:bg-rd-navy-hover text-white font-semibold text-rd-12 h-8 px-3 rounded-rd-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('verifyAction')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingNeed(need)}
                            className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
                          >
                            Ver detalle
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyNeed(need.id, 'archive')}
                            className="bg-rd-surface hover:bg-rd-coral-soft/50 text-rd-ink-meta hover:text-rd-coral font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
                          >
                            {t('archiveAction')}
                          </button>
                        </div>
                      </div>
                    ))}

                  {/* Offers */}
                  {showOffers &&
                    pendingOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className="bg-rd-surface rounded-rd-xl p-4 md:p-4.5 border border-rd-line flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-rd-ink-3/40 shadow-xs"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-rd-navy-soft text-rd-navy border border-rd-navy-line text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm">
                              Oferta
                            </span>
                            <span className="bg-rd-amber-soft text-rd-amber-ink border border-rd-amber-line text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm">
                              ◷ Pendiente
                            </span>
                            <span className="text-rd-11-5 text-rd-ink-meta flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rd-ink-3" />
                              {offer.neighborhood ? `${offer.neighborhood}, ` : ''}{offer.address || 'Ubicación registrada'}
                            </span>
                            <span className="text-rd-11 text-rd-ink-meta flex items-center gap-1">
                              <Clock className="w-3 h-3 text-rd-ink-3" />
                              {formatTimeAgo(offer.updatedAt, 'es')}
                            </span>
                          </div>
                          <h4 className="font-semibold text-rd-ink text-rd-14">{offer.title}</h4>
                          <p className="text-rd-12 text-rd-ink-2 line-clamp-2">{offer.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleVerifyOffer(offer.id, 'verify')}
                            className="bg-rd-navy hover:bg-rd-navy-hover text-white font-semibold text-rd-12 h-8 px-3 rounded-rd-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('verifyAction')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingOffer(offer)}
                            className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
                          >
                            Ver detalle
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyOffer(offer.id, 'archive')}
                            className="bg-rd-surface hover:bg-rd-coral-soft/50 text-rd-ink-meta hover:text-rd-coral font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
                          >
                            {t('archiveAction')}
                          </button>
                        </div>
                      </div>
                    ))}

                  {/* Volunteers */}
                  {showVolunteers &&
                    pendingVolunteers.map((vol) => (
                      <div
                        key={vol.id}
                        className="bg-rd-surface rounded-rd-xl p-4 md:p-4.5 border border-rd-line flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-rd-ink-3/40 shadow-xs"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-rd-amber-soft text-rd-amber-ink font-bold text-rd-10 px-2 py-0.5 rounded-rd-sm border border-rd-amber-line uppercase tracking-wider">
                              🧑‍🌾 Voluntario RaDAR
                            </span>
                            <span className="bg-rd-amber-soft text-rd-amber-ink text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm border border-rd-amber-line">
                              ◷ Pendiente
                            </span>
                            <span className="text-rd-11-5 text-rd-ink-meta">
                              {vol.email} {vol.phone ? `• Tel: ${vol.phone}` : ''}
                            </span>
                          </div>
                          <h4 className="font-semibold text-rd-ink text-rd-14">{vol.name}</h4>
                          <p className="text-rd-12 text-rd-ink-2">
                            <strong className="text-rd-ink">Aporte:</strong>{' '}
                            {vol.volunteerConnectionType === 'VOLUNTEER'
                              ? 'Ser voluntario/a'
                              : vol.volunteerConnectionType === 'OFFER_HELP'
                              ? 'Ofrecer ayuda'
                              : vol.volunteerConnectionType === 'COLLABORATE'
                              ? 'Colaborar'
                              : vol.volunteerConnectionType === 'COMMUNITY'
                              ? 'Comunidad'
                              : 'Voluntariado'}{' '}
                            • <strong className="text-rd-ink">Contacto preferido:</strong>{' '}
                            {vol.preferredContactMethod || 'WhatsApp'}
                          </p>
                          {vol.volunteerNotes && (
                            <p className="text-rd-11-5 text-rd-ink-meta italic">"{vol.volunteerNotes}"</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleChangeModerationStatus(vol.id, 'APPROVED')}
                            disabled={isSavingUserStatus}
                            className="bg-rd-navy hover:bg-rd-navy-hover text-white font-semibold text-rd-12 h-8 px-3 rounded-rd-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprobar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingUser(vol)}
                            className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
                          >
                            Ver ficha
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeModerationStatus(vol.id, 'REJECTED')}
                            disabled={isSavingUserStatus}
                            className="bg-rd-surface hover:bg-rd-coral-soft/50 text-rd-ink-meta hover:text-rd-coral font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rechazar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB: ORGANIZATIONS & COMMUNITIES */}
        {activeTab === 'ORGANIZATIONS' && (() => {
          const filteredOrgs = organizationsList.filter((org) => {
            if (orgStatusFilter === 'PENDING' && org.isVerified) return false;
            if (orgStatusFilter === 'VERIFIED' && !org.isVerified) return false;
            if (orgCategoryFilter !== 'ALL' && org.category !== orgCategoryFilter) return false;
            return true;
          });

          const sortedOrgs = [...filteredOrgs].sort((a, b) => {
            if (a.isVerified !== b.isVerified) {
              return a.isVerified ? 1 : -1;
            }
            return (b.createdAt || '').localeCompare(a.createdAt || '');
          });

          return (
            <div className="space-y-4">
              {/* Header de filtros */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-rd-surface p-3.5 rounded-rd-xl border border-rd-line shadow-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-rd-navy" />
                  <h3 className="font-bold text-rd-ink text-rd-14">
                    Organizaciones y Comunidades ({organizationsList.length})
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <CustomSelect
                    value={orgStatusFilter}
                    onChange={(v) => setOrgStatusFilter(v as any)}
                    className="w-48"
                    icon={<CheckCircle className="w-3.5 h-3.5 text-rd-ink-3" />}
                    options={[
                      { value: 'ALL', label: 'Todos los estados' },
                      { value: 'PENDING', label: '◷ Pendiente verificación' },
                      { value: 'VERIFIED', label: '✓ Verificadas' },
                    ]}
                  />
                  <CustomSelect
                    value={orgCategoryFilter}
                    onChange={(v) => setOrgCategoryFilter(v as any)}
                    className="w-52"
                    icon={<Users className="w-3.5 h-3.5 text-rd-ink-3" />}
                    options={[
                      { value: 'ALL', label: 'Todas las categorías' },
                      { value: 'ORGANIZACION', label: '🏢 Organizaciones / ONGs' },
                      { value: 'COMUNIDAD', label: '🤝 Comunidades / Líderes' },
                    ]}
                  />
                </div>
              </div>

              {/* Lista en modo estandarizado */}
              {sortedOrgs.length === 0 ? (
                <div className="text-center py-12 bg-rd-surface rounded-rd-xl border border-rd-line shadow-xs">
                  <p className="text-rd-ink-meta italic text-rd-13">
                    {organizationsList.length === 0
                      ? 'No hay organizaciones ni comunidades registradas.'
                      : 'No se encontraron resultados con los filtros aplicados.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedOrgs.map((org) => {
                    const isOrgCategory = org.category === 'ORGANIZACION';

                    return (
                      <div
                        key={org.id}
                        className="bg-rd-surface rounded-rd-xl border border-rd-line p-4 md:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-rd-ink-3/40 shadow-xs"
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className="shrink-0 mt-0.5">
                            <Avatar iniciales={iniciales(org.name)} tamano="md" />
                          </div>

                          <div className="min-w-0 space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-rd-ink text-rd-14 truncate">
                                {org.name}
                              </h4>

                              {/* Category pill */}
                              <span
                                className={`text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm border ${
                                  isOrgCategory
                                    ? 'bg-rd-coral-soft text-rd-coral border-rd-coral-line'
                                    : 'bg-rd-navy-soft text-rd-navy border-rd-navy-line'
                                }`}
                              >
                                {isOrgCategory ? '🏢 Organización' : '🤝 Comunidad / Líder'}
                              </span>

                              {/* Verification pill */}
                              {org.isVerified ? (
                                <span className="bg-rd-green-soft text-rd-green border border-rd-green-line text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm">
                                  ✓ Verificada
                                </span>
                              ) : (
                                <span className="bg-rd-amber-soft text-rd-amber-ink border border-rd-amber-line text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm">
                                  ◷ Pendiente verificación
                                </span>
                              )}

                              {/* Org type tag */}
                              <span className="bg-rd-fondo text-rd-ink-meta border border-rd-line text-rd-10 font-medium px-2 py-0.5 rounded-rd-sm truncate max-w-xs">
                                {org.organizationType}
                              </span>
                            </div>

                            {/* Contact info row */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-rd-12 text-rd-ink-2">
                              {org.contactName && (
                                <span className="truncate">
                                  <strong>Contacto:</strong> {org.contactName}
                                </span>
                              )}
                              {org.documentNumber && (
                                <span className="text-rd-ink-meta">
                                  {org.documentType ? org.documentType.toUpperCase() : 'DOC'}: {org.documentNumber}
                                </span>
                              )}
                              {org.contactPhone && (
                                <span className="text-rd-ink-meta">
                                  Tel: {org.contactPhone}
                                </span>
                              )}
                              {org.contactEmail && (
                                <span className="text-rd-ink-meta truncate">
                                  {org.contactEmail}
                                </span>
                              )}
                              {org.address && (
                                <span className="text-rd-ink-meta flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-rd-ink-3 shrink-0" />
                                  <span className="truncate max-w-xs">{org.address}</span>
                                </span>
                              )}
                              {org.websiteOrSocial && (
                                <a
                                  href={org.websiteOrSocial.startsWith('http') ? org.websiteOrSocial : `https://${org.websiteOrSocial}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-rd-navy hover:underline flex items-center gap-1 shrink-0"
                                >
                                  <Globe className="w-3 h-3" />
                                  <span>Web / Red</span>
                                </a>
                              )}
                            </div>

                            {org.description && (
                              <p className="text-rd-11 text-rd-ink-meta line-clamp-1 italic">
                                {org.description}
                              </p>
                            )}

                            {/* Documentos de verificación (Miniaturas) */}
                            {(() => {
                              const orgDocs = (org.verificationDocuments && org.verificationDocuments.length > 0)
                                ? org.verificationDocuments
                                : cargarDocumentosOrg(org.id, org.name, org.userId);
                              if (orgDocs.length === 0) return null;
                              return (
                                <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                                  <span className="text-rd-10 font-bold uppercase tracking-wider text-rd-ink-meta flex items-center gap-1">
                                    <FileText className="w-3 h-3 text-rd-navy" />
                                    Docs ({orgDocs.length}):
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {orgDocs.slice(0, 3).map((d) => (
                                      <button
                                        key={d.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPreviewingDoc(d);
                                        }}
                                        title={`Ver ${d.nombre} (${d.categoria || 'Soporte'})`}
                                        className="h-8 w-8 rounded-rd-md border border-rd-line overflow-hidden bg-rd-sunken hover:border-rd-navy hover:scale-105 transition-all shrink-0 cursor-pointer relative group shadow-2xs"
                                      >
                                        {d.tipo === 'imagen' ? (
                                          <img src={d.url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-700 text-rd-8 font-black leading-none">
                                            PDF
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                    {orgDocs.length > 3 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewingOrg(org);
                                        }}
                                        className="h-8 px-2 rounded-rd-md border border-rd-line bg-rd-sunken text-rd-10 font-bold text-rd-ink-meta hover:text-rd-navy hover:border-rd-navy transition-colors cursor-pointer"
                                      >
                                        +{orgDocs.length - 3}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          {!org.isVerified ? (
                            <button
                              type="button"
                              onClick={() => handleToggleOrgVerification(org)}
                              disabled={isSavingOrgStatus}
                              className="bg-rd-navy hover:bg-rd-navy-hover text-white font-semibold text-rd-12 h-8 px-3 rounded-rd-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                              title="Aprobar y verificar esta organización"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verificar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleOrgVerification(org)}
                              disabled={isSavingOrgStatus}
                              className="bg-rd-surface hover:bg-rd-coral-soft/50 text-rd-ink-meta hover:text-rd-coral font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                              title="Revocar sello de verificación"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Revocar verificación</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setViewingOrg(org)}
                            className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Detalle</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 2: REPORTS */}
        {activeTab === 'REPORTS' && (() => {
          const filteredReports = reports.filter((rep) => {
            const repIsOffer = !!rep.offerId;
            if (reportStatusFilter !== 'ALL' && rep.status !== reportStatusFilter) return false;
            if (reportTypeFilter === 'NEEDS' && repIsOffer) return false;
            if (reportTypeFilter === 'OFFERS' && !repIsOffer) return false;
            return true;
          });
          const hasActiveFilters = reportStatusFilter !== 'ALL' || reportTypeFilter !== 'ALL';

          return (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-rd-surface p-3.5 rounded-rd-xl border border-rd-line shadow-xs">
                <h3 className="font-bold text-rd-ink text-rd-14 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rd-coral" />
                  {t('pendingReports')} ({filteredReports.length}{hasActiveFilters ? ` de ${reports.length}` : ''})
                </h3>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Filtro por estado */}
                  <CustomSelect
                    value={reportStatusFilter}
                    onChange={setReportStatusFilter}
                    className="w-44"
                    icon={<Flag className="w-3.5 h-3.5 text-rd-ink-3" />}
                    options={[
                      { value: 'ALL', label: 'Todos los estados' },
                      { value: 'PENDING', label: '◷ Pendientes' },
                      { value: 'RESOLVED', label: '✓ Resueltos' },
                      { value: 'DISMISSED', label: '📁 Desestimados' },
                    ]}
                  />

                  {/* Filtro por tipo */}
                  <CustomSelect
                    value={reportTypeFilter}
                    onChange={setReportTypeFilter}
                    className="w-52"
                    icon={<List className="w-3.5 h-3.5 text-rd-ink-3" />}
                    options={[
                      { value: 'ALL', label: 'Necesidades y ofertas' },
                      { value: 'NEEDS', label: 'Solo necesidades' },
                      { value: 'OFFERS', label: 'Solo ofertas' },
                    ]}
                  />

                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setReportStatusFilter('ALL');
                        setReportTypeFilter('ALL');
                      }}
                      className="text-rd-12 text-rd-coral font-semibold hover:underline ml-1 cursor-pointer"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-10 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-rd-green mx-auto opacity-70" />
                  <h4 className="font-bold text-rd-ink text-rd-15">¡Sin reportes pendientes!</h4>
                  <p className="text-rd-ink-meta text-rd-12">
                    {reports.length === 0
                      ? 'No hay reportes registrados por los usuarios.'
                      : 'No hay reportes que coincidan con los filtros seleccionados.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                {filteredReports.map((rep) => {
                  const isOffer = !!rep.offerId;
                  const relatedNeed = rep.needId ? needs.find((n) => n.id === rep.needId) : undefined;
                  const relatedOffer = rep.offerId ? offers.find((o) => o.id === rep.offerId) : undefined;
                  const entryTitle = isOffer
                    ? (rep.offerTitle || relatedOffer?.title)
                    : (rep.needTitle || relatedNeed?.title);
                  const canOpen = isOffer ? !!relatedOffer : !!relatedNeed;

                  const handleOpenEntry = () => {
                    if (isOffer && relatedOffer) {
                      setViewingOffer(relatedOffer);
                    } else if (!isOffer && relatedNeed) {
                      setViewingNeed(relatedNeed);
                    }
                  };

                  return (
                  <div key={rep.id} className="bg-rd-surface p-4 md:p-4.5 rounded-rd-xl border border-rd-line flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-rd-ink-3/40 shadow-xs">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-rd-10 font-bold rounded-rd-sm border ${
                          isOffer
                            ? 'bg-rd-navy-soft text-rd-navy border-rd-navy-line'
                            : 'bg-rd-coral-soft text-rd-coral border-rd-coral-line'
                        }`}>
                          {isOffer ? 'Oferta' : 'Necesidad'}
                        </span>
                        <span className={`px-2 py-0.5 text-rd-10 font-bold rounded-rd-sm border ${
                          rep.status === 'PENDING'
                            ? 'bg-rd-amber-soft text-rd-amber-ink border-rd-amber-line'
                            : rep.status === 'RESOLVED'
                            ? 'bg-rd-green-soft text-rd-green border-rd-green-line'
                            : 'bg-rd-fondo text-rd-ink-meta border-rd-line'
                        }`}>
                          {rep.status === 'PENDING' ? '◷ Reporte Pendiente' : rep.status === 'RESOLVED' ? '✓ Resuelto' : '📁 Desestimado'}
                        </span>
                        <span className="px-2 py-0.5 text-rd-10 font-medium rounded-rd-sm border border-rd-line bg-rd-fondo text-rd-ink-2">
                          Motivo: {rep.reason}
                        </span>
                      </div>

                      <h4 className="text-rd-13-5 font-semibold text-rd-ink">
                        "{entryTitle || 'Publicación no disponible'}"
                      </h4>

                      <p className="text-rd-12 text-rd-ink-2">{rep.description}</p>
                      {rep.reporterContact && (
                        <p className="text-rd-11 text-rd-ink-meta">Contacto: {rep.reporterContact}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={handleOpenEntry}
                        disabled={!canOpen}
                        title={canOpen ? 'Abrir la entrada reportada' : 'La entrada ya no está disponible'}
                        className="bg-rd-navy hover:bg-rd-navy-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-rd-12 h-8 px-3 rounded-rd-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </button>

                      {rep.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleResolveReportItem(rep.id, isOffer)}
                            className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
                          >
                            {t('resolveReport')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveAndArchiveReportItem(rep.id, isOffer ? rep.offerId : rep.needId, isOffer, entryTitle)}
                            className="bg-rd-surface hover:bg-rd-fondo text-rd-ink-2 font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
                          >
                            Resolver y archivar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissReportItem(rep.id, isOffer)}
                            className="bg-rd-surface hover:bg-rd-coral-soft/50 text-rd-ink-meta hover:text-rd-coral font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
                          >
                            {t('dismissReport')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
            </div>
          );
        })()}

        {/* TAB 2.5: CHATBOT REPORTS (US-5) */}
        {activeTab === 'CHATBOT' && (
          <div className="space-y-4">
            <ChatbotReportsList
              operator={currentUser}
              showHeader={false}
              activeSubTab={chatbotSubTab}
              onSubTabChange={setChatbotSubTab}
            />
          </div>
        )}

        {/* TAB 3: ALL NEEDS & OFFERS */}
        {activeTab === 'ALL' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3.5 bg-rd-surface p-4 rounded-rd-xl border border-rd-line shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="font-bold text-rd-ink text-rd-14">
                  Gestión Global ({needs.length} Necesidades, {offers.length} Ofertas)
                </h3>
                {(adminSearch || adminPriorityFilter !== 'ALL' || adminVerificationFilter !== 'ALL' || adminTypeFilter !== 'ALL' || adminAuthorTypeFilter !== 'ALL' || adminAgeFilter !== 'ALL' || adminSortOrder !== 'RECENT') && (
                  <button
                    onClick={() => {
                      setAdminSearch('');
                      setAdminPriorityFilter('ALL');
                      setAdminVerificationFilter('ALL');
                      setAdminTypeFilter('ALL');
                      setAdminAuthorTypeFilter('ALL');
                      setAdminAgeFilter('ALL');
                      setAdminSortOrder('RECENT');
                    }}
                    className="text-rd-12 text-rd-coral font-semibold hover:underline cursor-pointer self-start sm:self-auto"
                  >
                    Restablecer todos los filtros
                  </button>
                )}
              </div>
              
              {/* Barra de Filtros en 2 filas limpias y responsivas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Buscador */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-rd-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Buscar título o barrio..."
                    className="w-full pl-9 pr-3 py-1.5 bg-rd-fondo border border-rd-line rounded-rd-md text-rd-12 text-rd-ink placeholder:text-rd-ink-meta focus:border-rd-navy focus:outline-none focus:ring-2 focus:ring-rd-navy-soft transition-all"
                  />
                </div>

                {/* Filtro 1: Tipo de publicación */}
                <CustomSelect
                  value={adminTypeFilter}
                  onChange={setAdminTypeFilter}
                  className="w-full"
                  icon={<List className="w-3.5 h-3.5 text-rd-ink-3" />}
                  options={[
                    { value: 'ALL', label: 'Todas las publicaciones' },
                    { value: 'NEEDS', label: 'Solo necesidades' },
                    { value: 'OFFERS', label: 'Solo ofertas' },
                  ]}
                />

                {/* Filtro 2: Tipo de actor / autor */}
                <CustomSelect
                  value={adminAuthorTypeFilter}
                  onChange={setAdminAuthorTypeFilter}
                  className="w-full"
                  icon={<Building2 className="w-3.5 h-3.5 text-rd-ink-3" />}
                  options={[
                    { value: 'ALL', label: 'Todos los autores' },
                    { value: 'ORGANIZACION', label: '🏢 Organizaciones' },
                    { value: 'COMUNIDAD', label: '👥 Comunidades / JAC' },
                    { value: 'CIUDADANO', label: '👤 Ciudadanos' },
                  ]}
                />

                {/* Filtro 3: Antigüedad / Vigencia */}
                <CustomSelect
                  value={adminAgeFilter}
                  onChange={setAdminAgeFilter}
                  className="w-full"
                  icon={<Clock className="w-3.5 h-3.5 text-rd-ink-3" />}
                  options={[
                    { value: 'ALL', label: 'Cualquier antigüedad' },
                    { value: 'LAST_7_DAYS', label: 'Últimos 7 días' },
                    { value: 'OLDER_THAN_15_DAYS', label: '⏳ Más de 15 días' },
                    { value: 'OLDER_THAN_30_DAYS', label: '⚠️ Más de 30 días' },
                  ]}
                />
              </div>

              {/* Fila secundaria de controles: Orden, Prioridad, Verificación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-rd-line/40">
                {/* Filtro 4: Orden cronológico */}
                <CustomSelect
                  value={adminSortOrder}
                  onChange={(val) => setAdminSortOrder(val as 'RECENT' | 'OLDEST')}
                  className="w-full"
                  icon={<ArrowUpDown className="w-3.5 h-3.5 text-rd-ink-3" />}
                  options={[
                    { value: 'RECENT', label: '📅 Más recientes primero' },
                    { value: 'OLDEST', label: '⏳ Más antiguas primero' },
                  ]}
                />

                {/* Filtro 5: Prioridad */}
                <CustomSelect
                  value={adminPriorityFilter}
                  onChange={setAdminPriorityFilter}
                  className="w-full"
                  icon={<AlertTriangle className="w-3.5 h-3.5 text-rd-ink-3" />}
                  options={[
                    { value: 'ALL', label: 'Todas las prioridades' },
                    { value: 'CRITICAL', label: '🔴 Crítica' },
                    { value: 'HIGH', label: '🟠 Alta' },
                    { value: 'MEDIUM', label: '🟡 Media' },
                    { value: 'LOW', label: '🟢 Baja' },
                  ]}
                />

                {/* Filtro 6: Estado de verificación y visibilidad */}
                <CustomSelect
                  value={adminVerificationFilter}
                  onChange={setAdminVerificationFilter}
                  className="w-full"
                  icon={<ShieldCheck className="w-3.5 h-3.5 text-rd-ink-3" />}
                  options={[
                    { value: 'ALL', label: 'Todas las visibilidades' },
                    { value: 'VERIFIED', label: '🟢 En el mapa (Visibles)' },
                    { value: 'PENDING_VERIFICATION', label: '🟡 Fuera del mapa (En espera)' },
                    { value: 'ARCHIVED_BY_AUTHOR', label: '📁 Fuera del mapa (Retiradas por entidad)' },
                    { value: 'ARCHIVED_BY_ADMIN', label: '🚫 Fuera del mapa (Ocultadas por admin)' },
                    { value: 'ARCHIVED_BY_REPORT', label: '⚠️ Fuera del mapa (Por reporte)' },
                    { value: 'REPORTED', label: '🚩 En revisión (Reportes pendientes)' },
                  ]}
                />
              </div>
            </div>

            {(() => {
              type AuthorType = 'ORGANIZACION' | 'COMUNIDAD' | 'CIUDADANO';
              type DiagnosisReasonType = 'VISIBLE' | 'PENDING' | 'ARCHIVED_BY_AUTHOR' | 'ARCHIVED_BY_ADMIN' | 'ARCHIVED_BY_REPORT' | 'REPORTED';

              type VisibilityDiagnosis = {
                statusLabel: string;
                statusBadgeCls: string;
                statusIcon: React.ReactNode;
                detailText?: string;
                reasonType: DiagnosisReasonType;
              };

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
                createdAt: string;
                authorType: AuthorType;
                authorName: string;
                ageDays: number;
                diagnosis: VisibilityDiagnosis;
              };

              const getVisibilityDiagnosis = (
                item: Need | Offer,
                isNeed: boolean,
                verStatus: VerificationStatus,
                authorType: AuthorType
              ): VisibilityDiagnosis => {
                if (verStatus === 'VERIFIED') {
                  return {
                    statusLabel: 'En el mapa • Visible',
                    statusBadgeCls: 'bg-rd-green-soft text-rd-green border-rd-green-line',
                    statusIcon: <CheckCircle className="w-3 h-3 text-rd-green" />,
                    detailText: 'Aprobada y visible en el mapa para los ciudadanos',
                    reasonType: 'VISIBLE',
                  };
                }

                if (verStatus === 'PENDING_VERIFICATION') {
                  return {
                    statusLabel: 'Fuera del mapa • En espera de aprobación',
                    statusBadgeCls: 'bg-rd-amber-soft text-rd-amber-ink border-rd-amber-line',
                    statusIcon: <Clock className="w-3 h-3 text-rd-amber" />,
                    detailText: 'Fuera del mapa: requiere revisión y aprobación del equipo para publicarse',
                    reasonType: 'PENDING',
                  };
                }

                if (verStatus === 'ARCHIVED') {
                  const itemId = item.id;
                  const matchingLog = auditLogs.find((l) =>
                    (isNeed && (l.needId === itemId || l.details?.includes(itemId))) ||
                    (!isNeed && (l.offerId === itemId || l.details?.includes(itemId)))
                  );

                  const isReportResolved = matchingLog?.details?.toLowerCase().includes('reporte') || matchingLog?.action === 'RESOLVE_REPORT';
                  const isModeratorArchived = matchingLog && (matchingLog.action === 'ARCHIVE_NEED' || matchingLog.action === 'ARCHIVE_OFFER');

                  if (isReportResolved) {
                    return {
                      statusLabel: 'Fuera del mapa • Archivada por reporte',
                      statusBadgeCls: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line',
                      statusIcon: <Flag className="w-3 h-3 text-rd-coral" />,
                      detailText: `Fuera del mapa: archivada tras resolver reporte ciudadano (${matchingLog?.adminEmail || 'Moderación'})`,
                      reasonType: 'ARCHIVED_BY_REPORT',
                    };
                  }

                  if (isModeratorArchived) {
                    return {
                      statusLabel: 'Fuera del mapa • Ocultada por moderación',
                      statusBadgeCls: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line',
                      statusIcon: <EyeOff className="w-3 h-3 text-rd-coral" />,
                      detailText: `Fuera del mapa: ocultada por moderación (${matchingLog.adminEmail || 'Admin'})`,
                      reasonType: 'ARCHIVED_BY_ADMIN',
                    };
                  }

                  const actorLabel = authorType === 'ORGANIZACION' ? 'la organización' : authorType === 'COMUNIDAD' ? 'la comunidad' : 'el ciudadano';
                  return {
                    statusLabel: 'Fuera del mapa • Retirada por la entidad',
                    statusBadgeCls: 'bg-rd-fondo text-rd-ink-2 border-rd-line',
                    statusIcon: <Archive className="w-3 h-3 text-rd-ink-meta" />,
                    detailText: `Fuera del mapa: eliminada o retirada por ${actorLabel} desde su panel`,
                    reasonType: 'ARCHIVED_BY_AUTHOR',
                  };
                }

                if (verStatus === 'REPORTED') {
                  return {
                    statusLabel: 'En revisión • Reportes pendientes',
                    statusBadgeCls: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line',
                    statusIcon: <AlertTriangle className="w-3 h-3 text-rd-coral" />,
                    detailText: 'Tiene reportes ciudadanos pendientes de resolución',
                    reasonType: 'REPORTED',
                  };
                }

                return {
                  statusLabel: 'Fuera del mapa • Rechazada',
                  statusBadgeCls: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line',
                  statusIcon: <X className="w-3 h-3 text-rd-coral" />,
                  detailText: 'Rechazada por el equipo de moderación',
                  reasonType: 'ARCHIVED_BY_ADMIN',
                };
              };

              const getAuthorInfo = (item: Need | Offer, isNeed: boolean): { authorType: AuthorType; authorName: string } => {
                if (isNeed) {
                  const need = item as Need;
                  const reqType = (need.requesterType || '').toUpperCase();
                  const orgName = (need.organizationName || '').trim();

                  const matchedOrg = organizationsList.find(
                    (o) =>
                      (orgName && o.name.toLowerCase() === orgName.toLowerCase()) ||
                      (need.userId && o.userId === need.userId)
                  );

                  if (matchedOrg) {
                    return {
                      authorType: matchedOrg.category === 'COMUNIDAD' ? 'COMUNIDAD' : 'ORGANIZACION',
                      authorName: matchedOrg.name,
                    };
                  }

                  if (reqType === 'COMUNIDAD' || /junta|jac|comunidad|colectivo|albergue/i.test(orgName)) {
                    return { authorType: 'COMUNIDAD', authorName: orgName || need.contactName || 'Comunidad' };
                  }

                  if (['ORGANIZACION', 'FUNDACION', 'EMPRESA'].includes(reqType) || orgName) {
                    return { authorType: 'ORGANIZACION', authorName: orgName || 'Organización' };
                  }

                  return { authorType: 'CIUDADANO', authorName: need.contactName || 'Ciudadano' };
                } else {
                  const offer = item as Offer;
                  const orgName = (offer.organizationName || '').trim();

                  const matchedOrg = organizationsList.find(
                    (o) =>
                      (orgName && o.name.toLowerCase() === orgName.toLowerCase()) ||
                      (offer.userId && o.userId === offer.userId)
                  );

                  if (matchedOrg) {
                    return {
                      authorType: matchedOrg.category === 'COMUNIDAD' ? 'COMUNIDAD' : 'ORGANIZACION',
                      authorName: matchedOrg.name,
                    };
                  }

                  if (/junta|jac|comunidad|colectivo|albergue/i.test(orgName)) {
                    return { authorType: 'COMUNIDAD', authorName: orgName || offer.contactName || 'Comunidad' };
                  }

                  if (orgName) {
                    return { authorType: 'ORGANIZACION', authorName: orgName };
                  }

                  return { authorType: 'CIUDADANO', authorName: offer.contactName || 'Ciudadano' };
                }
              };

              const calcAgeDays = (dateStr: string) => {
                const itemDate = new Date(dateStr).getTime();
                if (isNaN(itemDate)) return 0;
                return Math.max(0, Math.floor((Date.now() - itemDate) / (1000 * 60 * 60 * 24)));
              };

              const needItems: CombinedItem[] = (adminTypeFilter === 'OFFERS' ? [] : needs).map((n) => {
                const author = getAuthorInfo(n, true);
                const ageDays = calcAgeDays(n.updatedAt || n.createdAt);
                const diagnosis = getVisibilityDiagnosis(n, true, n.verificationStatus, author.authorType);
                return {
                  id: n.id,
                  type: 'NEED' as const,
                  item: n,
                  title: n.title,
                  neighborhood: n.neighborhood,
                  address: n.address,
                  priority: n.priority,
                  verificationStatus: n.verificationStatus,
                  updatedAt: n.updatedAt,
                  createdAt: n.createdAt,
                  authorType: author.authorType,
                  authorName: author.authorName,
                  ageDays,
                  diagnosis,
                };
              });

              const offerItems: CombinedItem[] = (adminTypeFilter === 'NEEDS' ? [] : offers).map((o) => {
                const author = getAuthorInfo(o, false);
                const ageDays = calcAgeDays(o.updatedAt || o.createdAt);
                const diagnosis = getVisibilityDiagnosis(o, false, o.verificationStatus, author.authorType);
                return {
                  id: o.id,
                  type: 'OFFER' as const,
                  item: o,
                  title: o.title,
                  neighborhood: o.neighborhood,
                  address: o.address,
                  priority: undefined,
                  verificationStatus: o.verificationStatus,
                  updatedAt: o.updatedAt,
                  createdAt: o.createdAt,
                  authorType: author.authorType,
                  authorName: author.authorName,
                  ageDays,
                  diagnosis,
                };
              });

              const filteredItems = [...needItems, ...offerItems]
                .filter((item) => {
                  if (adminSearch) {
                    const q = adminSearch.toLowerCase();
                    if (
                      !item.title.toLowerCase().includes(q) &&
                      !item.neighborhood.toLowerCase().includes(q) &&
                      !item.address.toLowerCase().includes(q) &&
                      !item.authorName.toLowerCase().includes(q)
                    )
                      return false;
                  }
                  if (adminPriorityFilter !== 'ALL' && item.priority !== adminPriorityFilter) return false;
                  if (adminAuthorTypeFilter !== 'ALL' && item.authorType !== adminAuthorTypeFilter) return false;

                  if (adminVerificationFilter !== 'ALL') {
                    if (adminVerificationFilter === 'VERIFIED' && item.diagnosis.reasonType !== 'VISIBLE') return false;
                    if (adminVerificationFilter === 'PENDING_VERIFICATION' && item.diagnosis.reasonType !== 'PENDING') return false;
                    if (adminVerificationFilter === 'REPORTED' && item.diagnosis.reasonType !== 'REPORTED') return false;
                    if (adminVerificationFilter === 'ARCHIVED_BY_AUTHOR' && item.diagnosis.reasonType !== 'ARCHIVED_BY_AUTHOR') return false;
                    if (adminVerificationFilter === 'ARCHIVED_BY_ADMIN' && item.diagnosis.reasonType !== 'ARCHIVED_BY_ADMIN') return false;
                    if (adminVerificationFilter === 'ARCHIVED_BY_REPORT' && item.diagnosis.reasonType !== 'ARCHIVED_BY_REPORT') return false;
                    if (adminVerificationFilter === 'ARCHIVED' && item.verificationStatus !== 'ARCHIVED') return false;
                  }

                  if (adminAgeFilter === 'LAST_7_DAYS' && item.ageDays > 7) return false;
                  if (adminAgeFilter === 'OLDER_THAN_15_DAYS' && item.ageDays < 15) return false;
                  if (adminAgeFilter === 'OLDER_THAN_30_DAYS' && item.ageDays < 30) return false;

                  return true;
                })
                .sort((a, b) => {
                  const timeA = new Date(a.updatedAt || a.createdAt).getTime();
                  const timeB = new Date(b.updatedAt || b.createdAt).getTime();
                  return adminSortOrder === 'OLDEST' ? timeA - timeB : timeB - timeA;
                });

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-rd-12 text-rd-ink-meta font-medium">
                    <span>
                      Mostrando <strong>{filteredItems.length}</strong> publicaciones de {needs.length + offers.length} totales
                    </span>
                    <span className="text-rd-11">
                      Orden: {adminSortOrder === 'OLDEST' ? '⏳ Más antiguas primero' : '📅 Más recientes primero'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {filteredItems.length === 0 ? (
                      <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-8 text-center text-rd-ink-meta italic text-rd-12">
                        No se encontraron publicaciones con los filtros seleccionados.
                      </div>
                    ) : (
                      filteredItems.map((entry) => {
                        const isHidden = entry.verificationStatus === 'ARCHIVED';
                        const isPending = entry.verificationStatus === 'PENDING_VERIFICATION';
                        const isStale = entry.ageDays >= 15;

                        return (
                          <div
                            key={entry.id}
                            className={`bg-rd-surface rounded-rd-xl p-4 md:p-4.5 border transition-colors shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isHidden
                                ? 'border-rd-line/60 bg-rd-fondo/40 opacity-80 hover:opacity-100'
                                : 'border-rd-line hover:border-rd-ink-3/40'
                            }`}
                          >
                            <div className="space-y-2 min-w-0 flex-1">
                              {/* Badges de clasificación y estado */}
                              <div className="flex flex-wrap items-center gap-2">
                                {entry.type === 'NEED' ? (
                                  <span className="bg-rd-coral-soft text-rd-coral border border-rd-coral-line font-bold px-2 py-0.5 rounded-rd-sm text-rd-10">
                                    Necesidad
                                  </span>
                                ) : (
                                  <span className="bg-rd-navy-soft text-rd-navy border border-rd-navy-line font-bold px-2 py-0.5 rounded-rd-sm text-rd-10">
                                    Oferta
                                  </span>
                                )}

                                {/* Badge de Actor */}
                                {entry.authorType === 'ORGANIZACION' ? (
                                  <span className="bg-rd-navy-soft text-rd-navy border border-rd-navy-line font-bold px-2 py-0.5 rounded-rd-sm text-rd-10 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    <span>Org: {entry.authorName}</span>
                                  </span>
                                ) : entry.authorType === 'COMUNIDAD' ? (
                                  <span className="bg-purple-50 text-purple-700 border border-purple-200 font-bold px-2 py-0.5 rounded-rd-sm text-rd-10 flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>Comunidad: {entry.authorName}</span>
                                  </span>
                                ) : (
                                  <span className="bg-rd-fondo text-rd-ink-2 border border-rd-line font-bold px-2 py-0.5 rounded-rd-sm text-rd-10 flex items-center gap-1">
                                    <span>👤 Ciudadano: {entry.authorName}</span>
                                  </span>
                                )}

                                <AdminPriorityPill priority={entry.priority} />

                                {/* Badge de Diagnóstico de Visibilidad */}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-rd-sm text-rd-10 font-bold border ${entry.diagnosis.statusBadgeCls}`}>
                                  {entry.diagnosis.statusIcon}
                                  <span>{entry.diagnosis.statusLabel}</span>
                                </span>

                                {/* Badge de alerta si lleva más de 15 días sin renovación */}
                                {isStale && (
                                  <span
                                    className="bg-rd-amber-soft text-rd-amber-ink border border-rd-amber-line font-bold px-2 py-0.5 rounded-rd-sm text-rd-10 flex items-center gap-1"
                                    title={`Lleva ${entry.ageDays} días desde su última confirmación`}
                                  >
                                    <Clock className="w-3 h-3 text-rd-amber" />
                                    <span>+{entry.ageDays}d sin renovar</span>
                                  </span>
                                )}

                                <span className="text-rd-11-5 text-rd-ink-meta flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-rd-ink-3" />
                                  {entry.neighborhood ? `${entry.neighborhood}, ` : ''}{entry.address || 'Ubicación registrada'}
                                </span>

                                <span className="text-rd-11 text-rd-ink-meta flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-rd-ink-3" />
                                  {formatTimeAgo(entry.updatedAt || entry.createdAt, 'es')}
                                </span>
                              </div>

                              <div>
                                <h4 className="font-semibold text-rd-ink text-rd-14 leading-snug">{entry.title}</h4>
                                {entry.item.description && (
                                  <p className="text-rd-12 text-rd-ink-2 line-clamp-1 mt-0.5">{entry.item.description}</p>
                                )}
                              </div>

                              {/* Línea explicativa del diagnóstico de visibilidad */}
                              {entry.diagnosis.detailText && (
                                <div className="flex items-center gap-1.5 text-rd-11 text-rd-ink-meta bg-rd-fondo/60 px-2.5 py-1 rounded-rd-md border border-rd-line/40 w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rd-ink-3 shrink-0" />
                                  <span>{entry.diagnosis.detailText}</span>
                                </div>
                              )}
                            </div>

                            {/* Botones de acción contextuales según el estado real */}
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              {/* 1. Si está PENDIENTE: NO está en el mapa -> botones Aprobar o Rechazar */}
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (entry.type === 'NEED') {
                                        handleVerifyNeed(entry.id, 'verify');
                                      } else {
                                        handleVerifyOffer(entry.id, 'verify');
                                      }
                                    }}
                                    className="bg-rd-green-soft hover:bg-rd-green-soft/80 text-rd-green border border-rd-green-line font-semibold text-rd-12 h-8 px-3 rounded-rd-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                    title="Aprobar para publicar en el mapa"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Aprobar en mapa</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!(await showConfirm(`¿Rechazar esta ${entry.type === 'NEED' ? 'necesidad' : 'oferta'}? No se publicará en el mapa y quedará archivada.`, { title: 'Rechazar publicación' }))) return;
                                      if (entry.type === 'NEED') {
                                        handleVerifyNeed(entry.id, 'archive');
                                      } else {
                                        handleVerifyOffer(entry.id, 'archive');
                                      }
                                    }}
                                    className="bg-rd-surface hover:bg-rd-coral-soft/50 text-rd-ink-meta hover:text-rd-coral font-medium text-rd-12 h-8 px-2.5 rounded-rd-md border border-rd-line transition-colors cursor-pointer flex items-center gap-1.5"
                                    title="Rechazar y archivar sin publicar en el mapa"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Rechazar</span>
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (entry.type === 'NEED') {
                                    setEditingNeedViaModal(entry.item as Need);
                                  } else {
                                    setEditingOfferViaModal(entry.item as Offer);
                                  }
                                }}
                                className="bg-rd-navy hover:bg-rd-navy-hover text-white font-semibold text-rd-12 h-8 px-3 rounded-rd-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  if (entry.type === 'NEED') {
                                    setViewingNeed(entry.item as Need);
                                  } else {
                                    setViewingOffer(entry.item as Offer);
                                  }
                                }}
                                className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
                              >
                                Ver detalle
                              </button>

                              {/* 2. Si está ARCHIVADA/RETIRADA: NO está en el mapa -> opción de Restaurar */}
                              {isHidden && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (entry.type === 'NEED') {
                                      handleRestoreNeedItem(entry.id, entry.title);
                                    } else {
                                      handleRestoreOfferItem(entry.id, entry.title);
                                    }
                                  }}
                                  className="bg-rd-green-soft hover:bg-rd-green-soft/80 text-rd-green border border-rd-green-line font-medium text-rd-12 h-8 px-3 rounded-rd-md transition-colors cursor-pointer flex items-center gap-1.5"
                                  title="Restaurar visibilidad en el mapa público"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Restaurar en mapa</span>
                                </button>
                              )}

                              {/* 3. Si está VISIBLE en el mapa -> opción de Ocultar del mapa */}
                              {!isHidden && !isPending && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (entry.type === 'NEED') {
                                      handleArchiveNeedItem(entry.id, entry.title);
                                    } else {
                                      handleArchiveOfferItem(entry.id, entry.title);
                                    }
                                  }}
                                  className="bg-rd-surface hover:bg-rd-coral-soft/50 text-rd-ink-meta hover:text-rd-coral font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer flex items-center gap-1.5"
                                  title="Ocultar del mapa público de la plataforma"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Ocultar del mapa</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-4">
            <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-3.5 flex items-center justify-between shadow-xs">
              <h3 className="font-bold text-rd-ink text-rd-14 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rd-navy" />
                Historial de Auditoría ({auditLogs.length})
              </h3>
            </div>
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-rd-surface rounded-rd-xl border border-rd-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rd-ink-3/40 transition-colors shadow-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="font-semibold text-rd-navy text-rd-12">{log.action}</span>
                    <p className="text-rd-12 text-rd-ink-2">{log.details}</p>
                    <span className="text-rd-10 text-rd-ink-meta">
                      {log.adminEmail} • {new Date(log.timestamp).toLocaleString()}
                    </span>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-rd-surface p-3.5 rounded-rd-xl border border-rd-line shadow-xs">
              <h3 className="font-bold text-rd-ink text-rd-14 flex items-center gap-2">
                <Users className="w-4 h-4 text-rd-navy" />
                Usuarios Registrados ({usersList.length})
              </h3>

              <div className="flex items-center gap-2">
                <CustomSelect
                  value={userStatusFilter}
                  onChange={setUserStatusFilter}
                  className="w-40"
                  icon={<CheckCircle className="w-3.5 h-3.5 text-rd-ink-3" />}
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
                  icon={<ShieldCheck className="w-3.5 h-3.5 text-rd-ink-3" />}
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
                    <p className="text-rd-ink-meta italic text-center py-6 text-rd-12">
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
                          className="bg-rd-surface rounded-rd-xl border border-rd-line p-4 md:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-rd-ink-3/40 shadow-xs"
                        >
                          <div className="min-w-0 space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-rd-ink text-rd-14 truncate">{usr.name}</h4>
                              {isVoluntario ? (
                                <span className="bg-rd-amber-soft text-rd-amber-ink font-bold text-rd-10 px-2 py-0.5 rounded-rd-sm border border-rd-amber-line uppercase tracking-wider">
                                  🧑‍🌾 Voluntario RaDAR
                                </span>
                              ) : (
                                <span className="text-rd-10 font-bold text-rd-navy bg-rd-navy-soft px-2 py-0.5 rounded-rd-sm border border-rd-navy-line inline-block">
                                  {usr.role}
                                </span>
                              )}
                              <ModerationStatusChip status={usr.moderationStatus} />
                            </div>

                            <p className="text-rd-12 text-rd-ink-2 truncate">
                              {usr.email} {usr.phone ? `• Tel: ${usr.phone}` : ''}
                            </p>

                            {isVoluntario && (
                              <p className="text-rd-11 text-rd-ink-meta italic truncate">
                                <strong>Aporte:</strong>{' '}
                                {usr.volunteerConnectionType === 'VOLUNTEER'
                                  ? 'Tiempo/Experiencia'
                                  : usr.volunteerConnectionType === 'OFFER_HELP'
                                  ? 'Recursos/Ayuda'
                                  : usr.volunteerConnectionType === 'COLLABORATE'
                                  ? 'Alianza'
                                  : 'Voluntariado'}{' '}
                                • <strong>Prefiere:</strong> {usr.preferredContactMethod || 'WhatsApp'}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleChangeModerationStatus(usr.id, 'APPROVED')}
                                  disabled={isSavingUserStatus}
                                  className="bg-rd-navy hover:bg-rd-navy-hover text-white font-semibold text-rd-12 h-8 px-3 rounded-rd-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                                  title="Aprobar Solicitud"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Aprobar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleChangeModerationStatus(usr.id, 'REJECTED')}
                                  disabled={isSavingUserStatus}
                                  className="bg-rd-surface hover:bg-rd-coral-soft/50 text-rd-ink-meta hover:text-rd-coral font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                                  title="Rechazar Solicitud"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Rechazar</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setViewingUser(usr)}
                              className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>Detalle</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUserItem(usr.id, usr.name)}
                              className="h-8 w-8 flex items-center justify-center text-rd-ink-meta hover:text-rd-coral hover:bg-rd-coral-soft/50 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
          </div>
        )}
        </div>
      </main>

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

      {viewingOrg && (
        <OrgDetailModal
          org={viewingOrg}
          isSaving={isSavingOrgStatus}
          onToggleVerification={(org) => handleToggleOrgVerification(org)}
          onClose={() => setViewingOrg(null)}
          onPreviewDoc={(doc) => setPreviewingDoc(doc)}
        />
      )}

      {previewingDoc && (
        <DocPreviewModal
          doc={previewingDoc}
          onClose={() => setPreviewingDoc(null)}
        />
      )}
    </div>
  );
};

// ==========================================
// MODERATION STATUS CHIP
// ==========================================
const MODERATION_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: '◷ Pendiente', className: 'bg-rd-amber-soft text-rd-amber-ink border-rd-amber-line' },
  APPROVED: { label: '✓ Aprobado', className: 'bg-rd-green-soft text-rd-green border-rd-green-line' },
  REJECTED: { label: '✕ Rechazado', className: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line' },
};

const ModerationStatusChip: React.FC<{ status?: string }> = ({ status }) => {
  const key = (status || 'APPROVED').toUpperCase();
  const cfg = MODERATION_STATUS_STYLES[key] || {
    label: key,
    className: 'bg-rd-fondo text-rd-ink-meta border-rd-line',
  };
  return (
    <span className={`text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm border inline-block ${cfg.className}`}>
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
    <div className="flex flex-col gap-0.5 py-2 border-b border-rd-line/60">
      <span className="text-rd-10 font-semibold text-rd-ink-meta uppercase tracking-wide">{label}</span>
      <span className="text-rd-12 text-rd-ink break-words">{value?.toString().trim() || '—'}</span>
    </div>
  );

  const fullPhone =
    user.phone ||
    [user.phoneCountryCode, user.phoneNumber].filter(Boolean).join(' ') ||
    undefined;

  const isModerator = user.role === 'MODERATOR' || user.rawRole === 'moderador';

  const statusOptions: Array<{ value: 'PENDING' | 'APPROVED' | 'REJECTED'; label: string; className: string }> = [
    { value: 'APPROVED', label: 'Aprobar', className: 'bg-rd-navy hover:bg-rd-navy-hover text-white shadow-xs' },
    { value: 'PENDING', label: 'Marcar pendiente', className: 'bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium border border-rd-line' },
    { value: 'REJECTED', label: 'Rechazar', className: 'bg-rd-surface hover:bg-rd-coral-soft/50 text-rd-coral font-medium border border-rd-line' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-rd-ink/40 backdrop-blur-xs flex items-center justify-center p-4 font-rd text-rd-ink"
      onClick={onClose}
    >
      <div
        className="bg-rd-surface rounded-rd-xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-scroll border border-rd-line shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-rd-surface border-b border-rd-line px-5 py-4 flex items-start justify-between gap-4 z-10">
          <div className="min-w-0">
            <h3 className="font-bold text-rd-ink text-rd-16 truncate">{user.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-rd-10 font-bold text-rd-navy bg-rd-navy-soft px-2 py-0.5 rounded-rd-sm border border-rd-navy-line">
                {user.role}
              </span>
              <ModerationStatusChip status={user.moderationStatus} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rd-ink-meta hover:text-rd-ink hover:bg-rd-fondo rounded-rd-md shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-3">
          <h4 className="text-rd-11 font-bold text-rd-ink-meta uppercase tracking-wider mt-1 mb-1">Datos personales</h4>
          <Row label="Nombres" value={user.firstName} />
          <Row label="Apellidos" value={user.lastName} />
          <Row label="Nombre completo" value={user.name} />
          <Row label="Correo electrónico" value={user.email} />
          <Row label="Teléfono" value={fullPhone} />
          <Row label="Tipo de documento" value={user.documentType} />
          <Row label="Número de documento" value={user.documentNumber} />

          <h4 className="text-rd-11 font-bold text-rd-ink-meta uppercase tracking-wider mt-4 mb-1">Ubicación</h4>
          <Row label="País" value={user.country} />
          <Row label="Departamento" value={user.department} />
          <Row label="Ciudad" value={user.city} />

          {isModerator && (
            <>
              <h4 className="text-rd-11 font-bold text-rd-ink-meta uppercase tracking-wider mt-4 mb-1">Solicitud de moderador</h4>
              <Row label="Comunidad / colectivo" value={user.moderatorCommunityCollective} />
              <Row label="Motivación" value={user.moderatorMotivation} />
            </>
          )}

          {(user.rawRole === 'voluntario' || user.volunteerConnectionType || user.volunteerNotes) && (
            <>
              <h4 className="text-rd-11 font-bold text-rd-amber-ink uppercase tracking-wider mt-4 mb-1">Postulación de Voluntario / Aliado</h4>
              <Row label="Forma de conexión" value={user.volunteerConnectionType === 'VOLUNTEER' ? 'Ser voluntario/a (tiempo/experiencia)' : user.volunteerConnectionType === 'OFFER_HELP' ? 'Ofrecer ayuda (recursos/servicios)' : user.volunteerConnectionType === 'COLLABORATE' ? 'Colaborar (alianza/proyecto)' : user.volunteerConnectionType === 'COMMUNITY' ? 'Ser parte de la comunidad' : user.volunteerConnectionType} />
              <Row label="Contacto preferido" value={user.preferredContactMethod === 'WHATSAPP' ? 'Mensaje WhatsApp' : user.preferredContactMethod === 'PHONE_CALL' ? 'Llamada telefónica' : user.preferredContactMethod === 'EMAIL' ? 'Correo electrónico' : user.preferredContactMethod} />
              <Row label="Propuesta / Notas" value={user.volunteerNotes} />
            </>
          )}

          <h4 className="text-rd-11 font-bold text-rd-ink-meta uppercase tracking-wider mt-4 mb-1">Cuenta</h4>
          <Row label="Rol (crudo)" value={user.rawRole || user.role} />
          <Row label="Términos aceptados" value={user.acceptTerms ? 'Sí' : 'No'} />
          <Row label="Fecha aceptación términos" value={user.termsAcceptedAt} />
          <Row label="Fecha de registro" value={user.createdAt} />
        </div>

        {/* Footer: change moderation status */}
        <div className="sticky bottom-0 bg-rd-fondo border-t border-rd-line px-5 py-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-rd-11 font-semibold text-rd-ink-2">Estado de moderación</span>
            <ModerationStatusChip status={user.moderationStatus} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                disabled={isSaving || currentStatus === opt.value}
                onClick={() => onChangeStatus(opt.value)}
                className={`py-2 rounded-rd-md text-rd-11 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${opt.className}`}
              >
                {isSaving ? '...' : opt.label}
              </button>
            ))}
          </div>
          <p className="text-rd-10 text-rd-ink-meta leading-snug">
            Al aprobar, el usuario obtiene los permisos correspondientes a su rol.
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ORGANIZATION / COMMUNITY DETAIL MODAL
// ==========================================
const OrgDetailModal: React.FC<{
  org: AdminOrganization;
  isSaving: boolean;
  onToggleVerification: (org: AdminOrganization) => void;
  onClose: () => void;
  onPreviewDoc?: (doc: DocumentoVerificacion) => void;
}> = ({ org, isSaving, onToggleVerification, onClose, onPreviewDoc }) => {
  const isOrgCategory = org.category === 'ORGANIZACION';

  const Row: React.FC<{ label: string; value?: string | null; isLink?: boolean }> = ({ label, value, isLink }) => (
    <div className="flex flex-col gap-0.5 py-2 border-b border-rd-line/60">
      <span className="text-rd-10 font-semibold text-rd-ink-meta uppercase tracking-wide">{label}</span>
      {isLink && value ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-rd-12 text-rd-navy hover:underline flex items-center gap-1 break-all"
        >
          <span>{value}</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      ) : (
        <span className="text-rd-12 text-rd-ink break-words">{value?.toString().trim() || '—'}</span>
      )}
    </div>
  );

  const orgDocs = (org.verificationDocuments && org.verificationDocuments.length > 0)
    ? org.verificationDocuments
    : cargarDocumentosOrg(org.id, org.name, org.userId);

  return (
    <div
      className="fixed inset-0 z-50 bg-rd-ink/40 backdrop-blur-xs flex items-center justify-center p-4 font-rd text-rd-ink"
      onClick={onClose}
    >
      <div
        className="bg-rd-surface rounded-rd-xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-scroll border border-rd-line shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-rd-surface border-b border-rd-line px-5 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar iniciales={iniciales(org.name)} tamano="lg" />
            <div className="min-w-0">
              <h3 className="font-bold text-rd-ink text-rd-16 truncate">{org.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className={`text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm border ${
                    isOrgCategory
                      ? 'bg-rd-coral-soft text-rd-coral border-rd-coral-line'
                      : 'bg-rd-navy-soft text-rd-navy border-rd-navy-line'
                  }`}
                >
                  {isOrgCategory ? '🏢 Organización' : '🤝 Comunidad / Líder'}
                </span>
                {org.isVerified ? (
                  <span className="bg-rd-green-soft text-rd-green border border-rd-green-line text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm">
                    ✓ Verificada
                  </span>
                ) : (
                  <span className="bg-rd-amber-soft text-rd-amber-ink border border-rd-amber-line text-rd-10 font-bold px-2 py-0.5 rounded-rd-sm">
                    ◷ Pendiente verificación
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rd-ink-meta hover:text-rd-ink hover:bg-rd-fondo rounded-rd-md shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-3">
          <h4 className="text-rd-11 font-bold text-rd-ink-meta uppercase tracking-wider mt-1 mb-1">
            Información Institucional / Comunitaria
          </h4>
          <Row label="Nombre oficial" value={org.name} />
          <Row label="Tipo de entidad" value={org.organizationType} />
          {org.communityCollective && (
            <Row label="Colectivo / Comunidad" value={org.communityCollective} />
          )}
          <Row
            label={org.documentType ? `Documento (${org.documentType.toUpperCase()})` : 'Documento'}
            value={org.documentNumber}
          />
          <Row label="Sitio Web / Red Social" value={org.websiteOrSocial} isLink />
          <Row label="Descripción / Referencia" value={org.description} />

          <h4 className="text-rd-11 font-bold text-rd-ink-meta uppercase tracking-wider mt-4 mb-1">
            Persona de Contacto y Canales
          </h4>
          <Row label="Contacto principal" value={org.contactName} />
          <Row label="Teléfono de contacto" value={org.contactPhone} />
          <Row label="WhatsApp" value={org.contactWhatsapp} />
          <Row label="Correo electrónico" value={org.contactEmail} />

          <h4 className="text-rd-11 font-bold text-rd-ink-meta uppercase tracking-wider mt-4 mb-1">
            Ubicación y Registro
          </h4>
          <Row label="Dirección / Zona" value={org.address} />
          <Row label="Fecha de registro" value={org.createdAt} />

          {/* Documentos de Verificación */}
          <div className="mt-5 pt-4 border-t border-rd-line">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h4 className="text-rd-11 font-bold text-rd-ink-meta uppercase tracking-wider flex items-center gap-1.5 m-0">
                <FileText className="w-3.5 h-3.5 text-rd-navy" />
                <span>Documentos de Verificación ({orgDocs.length})</span>
              </h4>
              {orgDocs.length > 0 && (
                <span className="text-rd-10 text-rd-ink-meta font-normal">
                  Toca para ampliar
                </span>
              )}
            </div>

            {orgDocs.length === 0 ? (
              <div className="rounded-rd-lg border border-dashed border-rd-line bg-rd-fondo/60 p-4 text-center">
                <p className="text-rd-12 text-rd-ink-meta italic m-0">
                  Esta entidad aún no ha adjuntado documentos de verificación.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {orgDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onPreviewDoc?.(doc)}
                    className="flex items-center gap-3 p-2.5 rounded-rd-lg border border-rd-line bg-rd-sunken/40 hover:bg-rd-sunken hover:border-rd-navy/60 transition-colors cursor-pointer group"
                    title={`Ver ${doc.nombre}`}
                  >
                    {/* Miniatura */}
                    <div className="h-11 w-11 shrink-0 rounded-rd-md border border-rd-line bg-rd-surface overflow-hidden flex items-center justify-center">
                      {doc.tipo === 'imagen' ? (
                        <img
                          src={doc.url}
                          alt=""
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-red-50 text-red-700 h-full w-full">
                          <FileText className="h-5 w-5" />
                          <span className="text-rd-8 font-black">PDF</span>
                        </div>
                      )}
                    </div>

                    {/* Textos */}
                    <div className="min-w-0 flex-1">
                      <p className="text-rd-12 font-semibold text-rd-ink truncate m-0 group-hover:text-rd-navy transition-colors">
                        {doc.nombre}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {doc.categoria && (
                          <span className="text-rd-9 font-bold bg-rd-navy-soft text-rd-navy px-1.5 py-0.5 rounded-rd-xs border border-rd-navy-line">
                            {doc.categoria}
                          </span>
                        )}
                        {doc.peso && (
                          <span className="text-rd-10 text-rd-ink-meta">
                            {doc.peso}
                          </span>
                        )}
                      </div>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-rd-ink-3 group-hover:text-rd-navy shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-rd-fondo border-t border-rd-line px-5 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-9 px-4 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {!org.isVerified ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onToggleVerification(org)}
              className="bg-rd-navy hover:bg-rd-navy-hover text-white font-semibold text-rd-12 h-9 px-4 rounded-rd-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Verificar Entidad'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onToggleVerification(org)}
              className="bg-rd-surface hover:bg-rd-coral-soft/50 text-rd-coral font-medium text-rd-12 h-9 px-4 rounded-rd-md border border-rd-line transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <X className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Revocar Verificación'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// DOCUMENT PREVIEW MODAL (LIGHTBOX)
// ==========================================
const DocPreviewModal: React.FC<{
  doc: DocumentoVerificacion | null;
  onClose: () => void;
}> = ({ doc, onClose }) => {
  if (!doc) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-rd-ink/60 backdrop-blur-xs flex items-center justify-center p-4 font-rd text-rd-ink"
      onClick={onClose}
    >
      <div
        className="bg-rd-surface rounded-rd-xl w-full max-w-3xl max-h-[92vh] overflow-hidden border border-rd-line shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-rd-sunken/60 border-b border-rd-line px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-5 h-5 text-rd-navy shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-rd-ink text-rd-14 truncate">{doc.nombre}</h3>
              <div className="flex items-center gap-2 text-rd-11 text-rd-ink-meta mt-0.5">
                {doc.categoria && (
                  <span className="bg-rd-navy-soft text-rd-navy font-bold px-1.5 py-0.2 rounded-rd-xs border border-rd-navy-line text-rd-9">
                    {doc.categoria}
                  </span>
                )}
                <span>Subido el {doc.creadoEn}</span>
                {doc.peso && <span>• {doc.peso}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rd-ink-meta hover:text-rd-ink hover:bg-rd-fondo rounded-rd-md shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-rd-sunken/20 min-h-[300px] max-h-[72vh]">
          {doc.tipo === 'imagen' ? (
            <img
              src={doc.url}
              alt={doc.nombre}
              className="max-h-[68vh] w-auto max-w-full rounded-rd-md object-contain border border-rd-line shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <b className="text-rd-14 font-semibold text-rd-ink mb-1">{doc.nombre}</b>
              <p className="text-rd-12 text-rd-ink-meta mb-4">Documento en formato PDF</p>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-rd-navy hover:bg-rd-navy-hover text-white text-rd-12 font-semibold px-4 py-2 rounded-rd-md shadow-xs flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir PDF en pestaña nueva</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-rd-fondo border-t border-rd-line px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line transition-colors cursor-pointer"
          >
            Cerrar visor
          </button>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rd-navy hover:underline text-rd-12 font-semibold flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver archivo original</span>
          </a>
        </div>
      </div>
    </div>
  );
};

