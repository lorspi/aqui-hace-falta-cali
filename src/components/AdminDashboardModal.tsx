import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  X,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Flag,
  RotateCcw,
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
} from "lucide-react";
import { Need, Priority, Report, AuditLog } from "../types";
import {
  CATEGORY_LABELS,
  PLACE_TYPE_LABELS,
  PRIORITY_CONFIG,
  VERIFICATION_CONFIG,
  formatTimeAgo,
} from "../utils/formatters";
import { geocodeAddress } from "../utils/geocoding";
import { MiniMapPicker } from "./MiniMapPicker";

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  needs: Need[];
  reports: Report[];
  auditLogs: AuditLog[];
  onVerifyNeed: (needId: string, updates: Partial<Need>) => Promise<void>;
  onResolveReport: (reportId: string, action: string) => Promise<void>;
  onResetDemoData: () => Promise<void>;
  initialEditNeed?: Need | null;
  initialEditMode?: "priority" | "full";
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  needs,
  reports,
  auditLogs,
  onVerifyNeed,
  onResolveReport,
  onResetDemoData,
  initialEditNeed,
  initialEditMode,
}) => {
  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem("ahf_admin_token")
  );
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "PENDING" | "REPORTS" | "METRICS" | "ALL" | "AUDIT" | "USERS"
  >("PENDING");

  // User management state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "MODERATOR">("MODERATOR");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Edit user state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserRole, setEditUserRole] = useState<"ADMIN" | "MODERATOR">("MODERATOR");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Editing need state
  const [editingNeed, setEditingNeed] = useState<Need | null>(null);
  const [editPriority, setEditPriority] = useState<Priority>("HIGH");
  const [editMode, setEditMode] = useState<"priority" | "full">("priority");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editContactWhatsapp, setEditContactWhatsapp] = useState("");
  const [editOperatingHours, setEditOperatingHours] = useState("");
  const [editPlaceType, setEditPlaceType] = useState("");
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editResources, setEditResources] = useState<any[]>([]);
  const [isEditGeocoding, setIsEditGeocoding] = useState(false);
  const [editGeoError, setEditGeoError] = useState("");
  const [editLatitude, setEditLatitude] = useState(0);
  const [editLongitude, setEditLongitude] = useState(0);

  // Convex mutations
  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);
  const createUserMutation = useMutation(api.auth.createUser);
  const updateUserMutation = useMutation(api.auth.updateUser);
  const deleteUserMutation = useMutation(api.auth.deleteUser);

  // Validate session on mount
  const sessionUser = useQuery(
    api.auth.validateSession,
    authToken ? { token: authToken } : "skip"
  );

  // Fetch admin data with auth token
  const adminData = useQuery(
    api.admin.getAllData,
    authToken && currentUser ? { token: authToken } : "skip"
  );

  // Override props with live data when authenticated
  const liveReports = adminData
    ? adminData.reports.map((r: any) => ({ ...r, id: r._id }))
    : reports;
  const liveAuditLogs = adminData
    ? adminData.auditLogs.map((a: any) => ({ ...a, id: a._id }))
    : auditLogs;

  // List users (only if admin)
  const usersList = useQuery(
    api.auth.listUsers,
    authToken && currentUser?.role === "ADMIN" ? { token: authToken } : "skip"
  );

  // Sync session validation
  useEffect(() => {
    if (sessionUser === null && authToken) {
      // Session expired
      localStorage.removeItem("ahf_admin_token");
      setAuthToken(null);
      setCurrentUser(null);
    } else if (sessionUser) {
      setCurrentUser(sessionUser as AuthUser);
    }
  }, [sessionUser, authToken]);

  // Open edit modal from external trigger (detail modal)
  useEffect(() => {
    if (initialEditNeed && currentUser) {
      openEditModal(initialEditNeed, initialEditMode || "full");
    }
  }, [initialEditNeed, currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);
    try {
      const result = await loginMutation({
        email: emailInput,
        password: passwordInput,
      });
      setAuthToken(result.token);
      localStorage.setItem("ahf_admin_token", result.token);
      setCurrentUser(result.user as AuthUser);
      setPasswordInput("");
    } catch (err: any) {
      setAuthError(err.message || "Error de autenticación");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      await logoutMutation({ token: authToken });
    }
    localStorage.removeItem("ahf_admin_token");
    setAuthToken(null);
    setCurrentUser(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setIsCreatingUser(true);
    try {
      await createUserMutation({
        token: authToken,
        email: newUserEmail,
        name: newUserName,
        password: newUserPassword,
        role: newUserRole,
      });
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      alert("Usuario creado exitosamente");
    } catch (err: any) {
      alert(err.message || "Error creando usuario");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleUserActive = async (userId: string, active: boolean) => {
    if (!authToken) return;
    try {
      await updateUserMutation({
        token: authToken,
        userId: userId as Id<"users">,
        active: !active,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!authToken) return;
    if (!confirm(`¿Estás seguro de eliminar al usuario "${name}"?`)) return;
    try {
      await deleteUserMutation({
        token: authToken,
        userId: userId as Id<"users">,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserRole(user.role);
    setEditUserPassword("");
  };

  const handleSaveUser = async () => {
    if (!editingUser || !authToken) return;
    setIsSavingUser(true);
    try {
      await updateUserMutation({
        token: authToken,
        userId: editingUser.id as Id<"users">,
        name: editUserName,
        role: editUserRole,
        ...(editUserPassword ? { password: editUserPassword } : {}),
      });
      setEditingUser(null);
      alert("Usuario actualizado.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingUser(false);
    }
  };

  const deleteNeedMutation = useMutation(api.admin.deleteNeed);
  const editNeedMutation = useMutation(api.admin.editNeed);

  const handleDeleteNeed = async (needId: string, title: string) => {
    if (!authToken) return;
    if (!confirm(`¿Eliminar la necesidad "${title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteNeedMutation({
        token: authToken,
        id: needId as Id<"needs">,
      });
      alert("Necesidad eliminada.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditModal = (need: Need, mode: "priority" | "full") => {
    setEditingNeed(need);
    setEditMode(mode);
    setEditPriority(need.priority);
    setEditTitle(need.title);
    setEditDescription(need.description);
    setEditAddress(need.address);
    setEditNeighborhood(need.neighborhood);
    setEditContactName(need.contactName);
    setEditContactPhone(need.contactPhone || "");
    setEditContactWhatsapp(need.contactWhatsapp || "");
    setEditOperatingHours(need.operatingHours || "");
    setEditPlaceType(need.placeType || "");
    setEditCategories(need.categories ? [...need.categories] : []);
    setEditResources(need.resources ? [...need.resources] : []);
    setEditLatitude(need.latitude || 3.4516);
    setEditLongitude(need.longitude || -76.532);
    setEditGeoError("");
  };

  const handleGeocodeEdit = async () => {
    if (!editAddress) return;
    setIsEditGeocoding(true);
    setEditGeoError("");
    const result = await geocodeAddress(editAddress, editNeighborhood);
    if (result) {
      setEditLatitude(result.latitude);
      setEditLongitude(result.longitude);
      setEditGeoError("");
    } else {
      setEditGeoError("No se encontró la ubicación. Verifica la dirección.");
    }
    setIsEditGeocoding(false);
  };

  const handleSaveEdit = async () => {
    if (!editingNeed || !authToken) return;
    try {
      await editNeedMutation({
        token: authToken,
        id: editingNeed.id as Id<"needs">,
        title: editTitle,
        description: editDescription,
        address: editAddress,
        neighborhood: editNeighborhood,
        contactName: editContactName,
        contactPhone: editContactPhone || undefined,
        contactWhatsapp: editContactWhatsapp || undefined,
        operatingHours: editOperatingHours || undefined,
        placeType: editPlaceType || undefined,
        categories: editCategories,
        latitude: editLatitude,
        longitude: editLongitude,
        resources: editResources,
      });
      setEditingNeed(null);
      alert("Necesidad editada.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSavePriority = async () => {
    if (!editingNeed) return;
    await handleVerifyWithToken(editingNeed.id, {
      priority: editPriority,
      verificationStatus: "VERIFIED",
      verifiedBy: currentUser?.name || "Moderador",
    });
    setEditingNeed(null);
  };

  // Pass token to parent handlers
  const handleVerifyWithToken = async (needId: string, updates: Partial<Need>) => {
    await onVerifyNeed(needId, updates);
  };

  const handleResolveWithToken = async (reportId: string, action: string) => {
    await onResolveReport(reportId, action);
  };

  const pendingNeeds = needs.filter(
    (n) => n.verificationStatus === "PENDING_VERIFICATION"
  );
  const pendingReports = liveReports.filter((r: any) => r.status === "PENDING");

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      return () => document.body.classList.remove("modal-open");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-slate-900 text-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Panel de Moderación
              </h2>
              {currentUser && (
                <p className="text-xs text-slate-300">
                  {currentUser.name} · {currentUser.role}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Salir
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Barrier */}
        {!currentUser ? (
          <div className="p-6 md:p-10 my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-3xl mx-auto">
              {/* Left column — CTA to become moderator */}
              <div className="space-y-4 text-center md:text-left">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto md:mx-0">
                  <ShieldCheck className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-black text-slate-900 text-xl leading-tight">
                  ¿Quieres ayudar a moderar?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Los moderadores verifican la información, actualizan prioridades y mantienen la plataforma confiable para toda la comunidad.
                </p>
                <a
                  href="https://wa.me/@un.tal.juan"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl text-sm shadow-md transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contactar al administrador</span>
                </a>
                <p className="text-[11px] text-slate-400">
                  Te responderemos lo antes posible por WhatsApp.
                </p>
              </div>

              {/* Right column — Login form */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center mx-auto text-slate-700">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Acceso Moderador
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Ingresa tus credenciales para acceder al panel.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                  {authError && (
                    <p className="text-xs text-rose-600 font-bold">{authError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-2.5 rounded-xl text-xs shadow-sm disabled:opacity-50"
                  >
                    {isLoggingIn ? "Verificando..." : "Iniciar sesión"}
                  </button>
                </form>
              </div>
            </div>
          </div>

        ) : (
          /* Authenticated Dashboard Body */
          <div className="p-4 md:p-6 space-y-6 text-xs text-slate-800">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wider block">
                  Pendientes revisión
                </span>
                <strong className="text-2xl font-black text-amber-900">
                  {pendingNeeds.length}
                </strong>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wider block">
                  Reportes de usuarios
                </span>
                <strong className="text-2xl font-black text-rose-900">
                  {pendingReports.length}
                </strong>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wider block">
                  Verificadas activas
                </span>
                <strong className="text-2xl font-black text-emerald-900">
                  {needs.filter((n) => n.verificationStatus === "VERIFIED").length}
                </strong>
              </div>
              <div className="bg-slate-100 border border-slate-300 p-3 rounded-xl">
                <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wider block">
                  Total registradas
                </span>
                <strong className="text-2xl font-black text-slate-900">
                  {needs.length}
                </strong>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
              {[
                { key: "PENDING", label: `Pendientes (${pendingNeeds.length})`, icon: Clock },
                { key: "REPORTS", label: `Reportes (${pendingReports.length})`, icon: Flag },
                { key: "METRICS", label: "Métricas", icon: BarChart3 },
                { key: "ALL", label: "Todas", icon: List },
                { key: "AUDIT", label: "Auditoría", icon: FileText },
                ...(currentUser.role === "ADMIN"
                  ? [{ key: "USERS", label: "Usuarios", icon: Users }]
                  : []),
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === key
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* PENDING TAB */}
            {activeTab === "PENDING" && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  Publicaciones pendientes ({pendingNeeds.length})
                </h4>
                {pendingNeeds.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">¡Todo al día!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingNeeds.map((need) => (
                      <div
                        key={need.id}
                        className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                              PENDIENTE
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {need.title}
                            </span>
                          </div>
                          <p className="text-slate-700">{need.description}</p>
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                            <span>📍 {need.address} ({need.neighborhood})</span>
                            <span>👤 {need.contactName}</span>
                            <span>🕒 {formatTimeAgo(need.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              handleVerifyWithToken(need.id, {
                                verificationStatus: "VERIFIED",
                                priority: "HIGH",
                                verifiedBy: currentUser.name,
                                verificationNotes: "Aprobado por moderación",
                              })
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Aprobar
                          </button>
                          <button
                            onClick={() => openEditModal(need, "full")}
                            className="bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() =>
                              handleVerifyWithToken(need.id, {
                                verificationStatus: "ARCHIVED",
                                status: "CLOSED",
                              })
                            }
                            className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1.5 rounded-lg text-xs"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === "REPORTS" && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  Reportes pendientes ({pendingReports.length})
                </h4>
                {pendingReports.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">No hay reportes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingReports.map((rep: any) => {
                      const reportedNeed = needs.find((n) => n.id === rep.needId);
                      return (
                        <div
                          key={rep.id}
                          className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3"
                        >
                          {/* Report header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                                  REPORTE: {rep.reason}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {rep.reporterContact || "Anónimo"} · {formatTimeAgo(rep.createdAt)}
                                </span>
                              </div>
                              <p className="font-bold text-slate-900 text-sm">{rep.needTitle}</p>
                              <p className="text-slate-800 text-xs bg-white border border-rose-100 rounded-lg p-2">
                                <strong className="text-rose-700">Motivo del reporte:</strong>{" "}
                                {rep.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <button
                                onClick={() => handleResolveWithToken(rep.id, "RESOLVE_ARCHIVE")}
                                className="bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Archivar necesidad
                              </button>
                              <button
                                onClick={() => handleResolveWithToken(rep.id, "DISMISS")}
                                className="bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Desestimar reporte
                              </button>
                            </div>
                          </div>
                          {/* Reported need details */}
                          {reportedNeed && (
                            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1 text-xs">
                              <p className="font-bold text-slate-800">📋 Detalle de la necesidad reportada:</p>
                              <p className="text-slate-700">{reportedNeed.description}</p>
                              <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-1">
                                <span>📍 {reportedNeed.address} ({reportedNeed.neighborhood})</span>
                                <span>👤 {reportedNeed.contactName} {reportedNeed.contactPhone || ""}</span>
                                <span>🏷️ {reportedNeed.categories?.join(", ")}</span>
                                <span>📊 Prioridad: {PRIORITY_CONFIG[reportedNeed.priority]?.label}</span>
                                <span>✅ Verificación: {VERIFICATION_CONFIG[reportedNeed.verificationStatus]?.label}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* METRICS TAB */}
            {activeTab === "METRICS" && (
              <div className="space-y-5">
                <h4 className="font-bold text-slate-900 text-sm">
                  Resumen táctico
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider">
                      Demanda por tipo
                    </h5>
                    <div className="space-y-1.5">
                      {Object.keys(CATEGORY_LABELS).map((cat) => {
                        const count = needs.filter((n) =>
                          n.categories.includes(cat as any)
                        ).length;
                        if (count === 0) return null;
                        const pct = Math.round((count / Math.max(needs.length, 1)) * 100);
                        return (
                          <div key={cat} className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span>
                                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]?.icon}{" "}
                                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]?.label}
                              </span>
                              <strong>{count}</strong>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-900 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs uppercase tracking-wider">
                      Distribución de prioridad
                    </h5>
                    {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => {
                      const cnt = needs.filter((n) => n.priority === p).length;
                      const cfg = PRIORITY_CONFIG[p];
                      return (
                        <div key={p} className="flex items-center justify-between bg-white p-2.5 rounded-lg border">
                          <span className="font-bold text-xs flex items-center gap-1.5">
                            {cfg.dot} {cfg.label}
                          </span>
                          <span className="font-extrabold text-sm">{cnt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ALL NEEDS TAB */}
            {activeTab === "ALL" && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  Todas las necesidades ({needs.length})
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold border-b">
                      <tr>
                        <th className="p-3">Título / Barrio</th>
                        <th className="p-3">Prioridad</th>
                        <th className="p-3">Verificación</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Actualizado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {needs.map((need) => (
                        <tr key={need.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <strong className="block">{need.title}</strong>
                            <span className="text-slate-500">{need.neighborhood}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PRIORITY_CONFIG[need.priority]?.badgeClass}`}>
                              {PRIORITY_CONFIG[need.priority]?.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${VERIFICATION_CONFIG[need.verificationStatus]?.badgeClass}`}>
                              {VERIFICATION_CONFIG[need.verificationStatus]?.label}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">{need.status}</td>
                          <td className="p-3 text-slate-500">{formatTimeAgo(need.updatedAt)}</td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(need, "full")}
                              className="text-xs font-bold text-indigo-600 hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => openEditModal(need, "priority")}
                              className="text-xs font-bold text-amber-600 hover:underline"
                            >
                              Prioridad
                            </button>
                            {currentUser.role === "ADMIN" && (
                              <button
                                onClick={() => handleDeleteNeed(need.id, need.title)}
                                className="text-xs font-bold text-rose-600 hover:underline"
                              >
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AUDIT TAB */}
            {activeTab === "AUDIT" && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Historial de auditoría</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 divide-y divide-slate-200 max-h-96 overflow-y-auto">
                  {liveAuditLogs.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">Sin registros aún</p>
                  ) : (
                    liveAuditLogs.map((log: any) => (
                      <div key={log.id} className="py-2 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span>⚡ {log.action}</span>
                          <span className="text-slate-500 font-normal">
                            {new Date(log.timestamp).toLocaleString("es-CO")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">{log.details}</p>
                        <p className="text-[10px] text-slate-400">
                          Moderador: {log.adminEmail}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* USERS TAB (admin only) */}
            {activeTab === "USERS" && currentUser.role === "ADMIN" && (
              <div className="space-y-5">
                <h4 className="font-bold text-slate-900 text-sm">
                  Gestión de Usuarios y Moderadores
                </h4>

                {/* Create user form */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Crear nuevo usuario
                  </h5>
                  <form
                    onSubmit={handleCreateUser}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Nombre completo"
                      className="p-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="Email"
                      className="p-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Contraseña"
                      className="p-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      <option value="MODERATOR">Moderador</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isCreatingUser}
                      className="md:col-span-2 bg-slate-900 text-white font-bold p-2 rounded-lg text-xs disabled:opacity-50"
                    >
                      {isCreatingUser ? "Creando..." : "Crear usuario"}
                    </button>
                  </form>
                </div>

                {/* Users list */}
                <div className="space-y-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider">
                    Usuarios registrados
                  </h5>
                  {!usersList || usersList.length === 0 ? (
                    <p className="text-slate-500 text-xs">Cargando...</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 font-bold border-b">
                          <tr>
                            <th className="p-3">Nombre</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Rol</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3">Último acceso</th>
                            <th className="p-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {usersList.map((u: any) => (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold">{u.name}</td>
                              <td className="p-3 text-slate-600">{u.email}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    u.role === "ADMIN"
                                      ? "bg-indigo-100 text-indigo-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    u.active
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {u.active ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500">
                                {u.lastLoginAt
                                  ? formatTimeAgo(u.lastLoginAt)
                                  : "Nunca"}
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  onClick={() => openEditUser(u)}
                                  className="text-xs font-bold text-indigo-600 hover:underline"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleToggleUserActive(u.id, u.active)}
                                  className="text-xs font-bold text-slate-700 hover:underline"
                                >
                                  {u.active ? "Desactivar" : "Activar"}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="text-xs font-bold text-rose-600 hover:underline"
                                >
                                  <Trash2 className="w-3 h-3 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit User Overlay */}
        {editingUser && (
          <div className="fixed inset-0 z-[60] bg-slate-900/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4">
              <h3 className="font-bold text-slate-900 text-base">
                Editar Usuario
              </h3>
              <p className="text-xs text-slate-500">{editingUser.email}</p>
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Rol</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as "ADMIN" | "MODERATOR")}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="MODERATOR">Moderador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">
                    Nueva contraseña <span className="font-normal text-slate-400">(dejar vacío para no cambiar)</span>
                  </label>
                  <input
                    type="password"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={isSavingUser}
                  className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs disabled:opacity-50"
                >
                  {isSavingUser ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Need Overlay */}
        {editingNeed && (
          <div className="fixed inset-0 z-[60] bg-slate-900/80 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150">
              {editMode === "priority" ? (
                <>
                  <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Cambiar Prioridad y Verificar</h2>
                      <p className="text-xs text-slate-500">{editingNeed.title}</p>
                    </div>
                    <button onClick={() => setEditingNeed(null)} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nivel de prioridad</label>
                      <div className="flex flex-wrap gap-2">
                        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => {
                          const config = PRIORITY_CONFIG[p];
                          const isSelected = editPriority === p;
                          return (
                            <button
                              type="button"
                              key={p}
                              onClick={() => setEditPriority(p)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? `${config.badgeClass} ring-2 ring-offset-1 ring-slate-400`
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span>{config.dot}</span>
                              <span>{config.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {PRIORITY_CONFIG[editPriority]?.explanation || ''}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Se verificará con: <strong>{currentUser?.name}</strong>
                    </p>
                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                      <button
                        onClick={() => setEditingNeed(null)}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSavePriority}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Guardar y Verificar</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Editar Necesidad</h2>
                      <p className="text-xs text-slate-500">
                        Edición con permisos de moderador. Los cambios se aplican inmediatamente.
                      </p>
                    </div>
                    <button onClick={() => setEditingNeed(null)} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Form Body */}
                  <div className="p-5 space-y-5 text-xs text-slate-800">
                    {/* Section 1: Title & Place Type */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
                        1. ¿Qué está pasando?
                      </h3>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Título corto de la necesidad *</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Ej: Edificio residencial - Remoción de escombros"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Descripción detallada *</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={3}
                          placeholder="Explica detalladamente la situación..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Tipo de lugar</label>
                          <select
                            value={editPlaceType}
                            onChange={(e) => setEditPlaceType(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                          >
                            {Object.entries(PLACE_TYPE_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Prioridad</label>
                          <div className="flex flex-wrap gap-1.5">
                            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => {
                              const config = PRIORITY_CONFIG[p];
                              const isSelected = editPriority === p;
                              return (
                                <button
                                  type="button"
                                  key={p}
                                  onClick={() => setEditPriority(p)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 ${
                                    isSelected
                                      ? `${config.badgeClass} ring-2 ring-offset-1 ring-slate-400`
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{config.dot}</span>
                                  <span>{config.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Location */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
                        2. ¿Dónde está ubicado? (Cali)
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Barrio *</label>
                          <input
                            type="text"
                            value={editNeighborhood}
                            onChange={(e) => setEditNeighborhood(e.target.value)}
                            placeholder="Ej: San Fernando, Siloé, Granada..."
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Dirección / Referencia *</label>
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="Ej: Calle 5 con Carrera 44"
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Geocode & Map */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleGeocodeEdit}
                            disabled={isEditGeocoding || !editAddress}
                            className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                          >
                            <MapPin className="w-3.5 h-3.5 text-red-600" />
                            {isEditGeocoding ? (
                              <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Buscando...</span>
                            ) : (
                              <span>Geocodificar dirección</span>
                            )}
                          </button>
                          <span className="text-[11px] text-emerald-600">
                            📍 {editLatitude.toFixed(4)}, {editLongitude.toFixed(4)}
                          </span>
                          {editGeoError && (
                            <span className="text-[11px] text-amber-600">{editGeoError}</span>
                          )}
                        </div>

                        <MiniMapPicker
                          latitude={editLatitude}
                          longitude={editLongitude}
                          onPositionChange={(lat, lng) => {
                            setEditLatitude(lat);
                            setEditLongitude(lng);
                          }}
                          height="200px"
                        />
                      </div>
                    </div>

                    {/* Section 3: Categories & Resources */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
                        3. ¿Qué necesitan?
                      </h3>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">
                          Categorías de ayuda (selección múltiple)
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                          {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setEditCategories((prev) =>
                                  prev.includes(key)
                                    ? prev.filter((c) => c !== key)
                                    : [...prev, key]
                                );
                              }}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                                editCategories.includes(key)
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {icon} {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Itemized Resources builder */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700">Recursos o insumos requeridos</label>
                          <button
                            type="button"
                            onClick={() => setEditResources([...editResources, {
                              id: `res-${Date.now()}`,
                              type: "VOLUNTARIADO_GENERAL",
                              description: "",
                              requestedQuantity: 0,
                              fulfilledQuantity: 0,
                              unit: "unidades",
                              status: "PENDING",
                            }])}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Añadir insumo
                          </button>
                        </div>

                        {editResources.map((res, idx) => (
                          <div key={res.id || idx} className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <select
                              value={res.type}
                              onChange={(e) => {
                                const updated = [...editResources];
                                updated[idx] = { ...updated[idx], type: e.target.value };
                                setEditResources(updated);
                              }}
                              className="p-1.5 bg-white border border-slate-300 rounded text-xs shrink-0"
                            >
                              {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={res.description}
                              onChange={(e) => {
                                const updated = [...editResources];
                                updated[idx] = { ...updated[idx], description: e.target.value };
                                setEditResources(updated);
                              }}
                              placeholder="Descripción (ej: Palas metálicas...)"
                              className="flex-1 p-1.5 bg-white border border-slate-300 rounded text-xs min-w-[120px]"
                            />

                            <input
                              type="number"
                              min="0"
                              value={res.requestedQuantity || 0}
                              onChange={(e) => {
                                const updated = [...editResources];
                                updated[idx] = { ...updated[idx], requestedQuantity: Number(e.target.value) || 0 };
                                setEditResources(updated);
                              }}
                              placeholder="Necesarios"
                              className="w-16 p-1.5 bg-white border border-slate-300 rounded text-xs"
                            />

                            <input
                              type="number"
                              min="0"
                              value={res.fulfilledQuantity || 0}
                              onChange={(e) => {
                                const updated = [...editResources];
                                updated[idx] = { ...updated[idx], fulfilledQuantity: Number(e.target.value) || 0 };
                                setEditResources(updated);
                              }}
                              placeholder="Cubiertos"
                              className="w-16 p-1.5 bg-white border border-slate-300 rounded text-xs"
                            />

                            <input
                              type="text"
                              value={res.unit || ""}
                              onChange={(e) => {
                                const updated = [...editResources];
                                updated[idx] = { ...updated[idx], unit: e.target.value };
                                setEditResources(updated);
                              }}
                              placeholder="Unidad"
                              className="w-20 p-1.5 bg-white border border-slate-300 rounded text-xs"
                            />

                            <button
                              type="button"
                              onClick={() => setEditResources(editResources.filter((_, i) => i !== idx))}
                              className="text-rose-600 hover:text-rose-800 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 4: Contact */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
                        4. Contacto del responsable
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Nombre del responsable / contacto</label>
                          <input
                            type="text"
                            value={editContactName}
                            onChange={(e) => setEditContactName(e.target.value)}
                            placeholder="Ej: Carlos Restrepo"
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">WhatsApp de contacto</label>
                          <input
                            type="text"
                            value={editContactWhatsapp}
                            onChange={(e) => setEditContactWhatsapp(e.target.value)}
                            placeholder="Ej: 3155550192"
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Teléfono móvil / fijo</label>
                          <input
                            type="text"
                            value={editContactPhone}
                            onChange={(e) => setEditContactPhone(e.target.value)}
                            placeholder="Ej: 3124448821"
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Horario de atención</label>
                          <input
                            type="text"
                            value={editOperatingHours}
                            onChange={(e) => setEditOperatingHours(e.target.value)}
                            placeholder="Ej: 8:00 a.m. - 5:00 p.m. / 24 horas"
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="p-5 border-t border-slate-200 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setEditingNeed(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar cambios</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
