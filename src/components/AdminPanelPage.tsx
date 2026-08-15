import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
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
import { Need, Offer, Priority, Report, AuditLog, VerificationStatus } from "../types";
import {
  CATEGORY_LABELS,
  PLACE_TYPE_LABELS,
  PRIORITY_CONFIG,
  VERIFICATION_CONFIG,
  formatTimeAgo,
} from "../utils/formatters";
import { geocodeAddress } from "../utils/geocoding";
import { MiniMapPicker } from "./MiniMapPicker";
import { CityCombobox } from "./CityCombobox";
import { PublicEditOfferModal } from "./PublicEditOfferModal";
import { PublicEditModal } from "./PublicEditModal";
import { NeedDetailModal } from "./NeedDetailModal";
import { OfferDetailModal } from "./OfferDetailModal";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const AdminPanelPage: React.FC = () => {
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

  // Admin table search & filters
  const [adminSearch, setAdminSearch] = useState("");
  const [adminPriorityFilter, setAdminPriorityFilter] = useState<string>("ALL");
  const [adminVerificationFilter, setAdminVerificationFilter] = useState<string>("ALL");
  const [adminTypeFilter, setAdminTypeFilter] = useState<string>("ALL");
  const [adminEditOfferId, setAdminEditOfferId] = useState<string | null>(null);

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
  const [editCityId, setEditCityId] = useState("cali");
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

  // View / Edit modals state
  const [viewingNeed, setViewingNeed] = useState<Need | null>(null);
  const [viewingOffer, setViewingOffer] = useState<Offer | null>(null);
  const [editingNeedViaModal, setEditingNeedViaModal] = useState<Need | null>(null);
  const [editingOfferViaModal, setEditingOfferViaModal] = useState<Offer | null>(null);

  // Convex mutations
  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);
  const createUserMutation = useMutation(api.auth.createUser);
  const updateUserMutation = useMutation(api.auth.updateUser);
  const deleteUserMutation = useMutation(api.auth.deleteUser);
  const verifyOfferMutation = useMutation(api.offers.verify);
  const deleteNeedMutation = useMutation(api.admin.deleteNeed);
  const editNeedMutation = useMutation(api.admin.editNeed);
  const adminVerifyMutation = useMutation(api.admin.verifyNeed);

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

  // Fetch all needs for the panel
  const rawNeeds = useQuery(api.needs.list, {});
  const needs: Need[] = (rawNeeds || []).map((doc: any) => {
    const { _id, _creationTime, ...rest } = doc;
    return { id: _id, ...rest } as Need;
  });

  // Fetch offers for moderation (ALL offers including archived)
  const rawOffers = useQuery(api.offers.listAll, {});
  const offers: Offer[] = (rawOffers || []).map((doc: any) => {
    const { _id, _creationTime, ...rest } = doc;
    return { id: _id, ...rest } as Offer;
  });
  const pendingOffers = (rawOffers || []).filter(
    (o: any) => o.verificationStatus === "PENDING_VERIFICATION"
  );

  // Override props with live data when authenticated
  const liveNeeds = adminData
    ? adminData.needs.map((n: any) => ({ ...n, id: n._id }))
    : needs;
  const liveReports = adminData
    ? adminData.reports.map((r: any) => ({ ...r, id: r._id }))
    : [];
  const liveAuditLogs = adminData
    ? adminData.auditLogs.map((a: any) => ({ ...a, id: a._id }))
    : [];

  // List users (only if admin)
  const usersList = useQuery(
    api.auth.listUsers,
    authToken && currentUser?.role === "ADMIN" ? { token: authToken } : "skip"
  );

  // Sync session validation
  useEffect(() => {
    if (sessionUser === null && authToken) {
      localStorage.removeItem("ahf_admin_token");
      setAuthToken(null);
      setCurrentUser(null);
    } else if (sessionUser) {
      setCurrentUser(sessionUser as AuthUser);
    }
  }, [sessionUser, authToken]);

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
      showAlert("Usuario creado exitosamente", { title: "Éxito", variant: "success" });
    } catch (err: any) {
      showAlert(err.message || "Error creando usuario", { title: "Error", variant: "error" });
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
      showAlert(err.message, { title: "Error", variant: "error" });
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!authToken) return;
    if (!(await showConfirm(`¿Estás seguro de eliminar al usuario "${name}"?`, { title: "Eliminar usuario" }))) return;
    try {
      await deleteUserMutation({
        token: authToken,
        userId: userId as Id<"users">,
      });
    } catch (err: any) {
      showAlert(err.message, { title: "Error", variant: "error" });
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
      showAlert("Usuario actualizado.", { title: "Éxito", variant: "success" });
    } catch (err: any) {
      showAlert(err.message, { title: "Error", variant: "error" });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteNeed = async (needId: string, title: string) => {
    if (!authToken) return;
    if (!(await showConfirm(`¿Eliminar la necesidad "${title}"? Esta acción no se puede deshacer.`, { title: "Eliminar necesidad" }))) return;
    try {
      await deleteNeedMutation({
        token: authToken,
        id: needId as Id<"needs">,
      });
      showAlert("Necesidad eliminada.", { title: "Éxito", variant: "success" });
    } catch (err: any) {
      showAlert(err.message, { title: "Error", variant: "error" });
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
    setEditCityId(need.cityId || "cali");
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
        cityId: editCityId,
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
      showAlert("Necesidad editada.", { title: "Éxito", variant: "success" });
    } catch (err: any) {
      showAlert(err.message, { title: "Error", variant: "error" });
    }
  };

  const handleSavePriority = async () => {
    if (!editingNeed || !authToken) return;
    await handleVerifyNeed(editingNeed.id, {
      priority: editPriority,
      verificationStatus: "VERIFIED",
      verifiedBy: currentUser?.name || "Moderador",
    });
    setEditingNeed(null);
  };

  const handleVerifyNeed = async (needId: string, updates: Partial<Need>) => {
    if (!authToken) {
      showAlert("Sesión expirada. Inicia sesión de nuevo.", { title: "Sesión expirada", variant: "error" });
      return;
    }
    try {
      await adminVerifyMutation({
        token: authToken,
        id: needId as Id<"needs">,
        verificationStatus: updates.verificationStatus,
        priority: updates.priority,
        verifiedBy: updates.verifiedBy,
        verificationNotes: updates.verificationNotes,
        status: updates.status,
        title: updates.title,
        description: updates.description,
        categories: updates.categories,
      });
    } catch (e) {
      showAlert("Error en moderación.", { title: "Error", variant: "error" });
    }
  };

  const pendingNeeds = needs.filter(
    (n) => n.verificationStatus === "PENDING_VERIFICATION"
  );
  const pendingReports = liveReports.filter((r: any) => r.status === "PENDING");

  // Offer being edited
  const editingOffer = adminEditOfferId
    ? (rawOffers || []).find((o: any) => o._id === adminEditOfferId)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <a href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-3 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a la plataforma</span>
              </a>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40">
                  <ShieldCheck className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight">Panel de Moderación</h1>
                  {currentUser && (
                    <p className="text-xs text-slate-300 mt-0.5">
                      {currentUser.name} · {currentUser.role}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="/moderador"
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Guía del Moderador</span>
              </a>
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Auth Barrier */}
        {!currentUser ? (
          <div className="py-4 md:py-10">
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
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
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
          <div className="space-y-6 text-xs text-slate-800">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wider block">
                  Pendientes revisión
                </span>
                <strong className="text-2xl font-black text-amber-900">
                  {pendingNeeds.length + pendingOffers.length}
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
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
              {[
                { key: "PENDING", label: `Pendientes (${pendingNeeds.length + pendingOffers.length})`, icon: Clock },
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
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
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
                  Publicaciones pendientes ({pendingNeeds.length + pendingOffers.length})
                </h4>
                {pendingNeeds.length === 0 && pendingOffers.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">¡Todo al día!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      ...pendingNeeds.map((n) => ({ type: 'NEED' as const, id: n.id, title: n.title, description: n.description, address: n.address, neighborhood: n.neighborhood, contactName: n.contactName, createdAt: n.createdAt, raw: n })),
                      ...pendingOffers.map((o: any) => ({ type: 'OFFER' as const, id: o._id, title: o.title, description: o.description, address: o.address, neighborhood: o.neighborhood, contactName: o.contactName, createdAt: o.createdAt, raw: o })),
                    ]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl p-4 flex flex-col gap-3 ${item.type === 'OFFER' ? 'bg-blue-50/50 border border-blue-200' : 'bg-amber-50/50 border border-amber-200'}`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                              PENDIENTE
                            </span>
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${item.type === 'OFFER' ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                              {item.type === 'OFFER' ? 'OFERTA' : 'NECESIDAD'}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              <button
                                onClick={() => {
                                  if (item.type === 'NEED') setViewingNeed(item.raw);
                                  else setViewingOffer({ id: item.raw._id, ...item.raw } as any);
                                }}
                                className="hover:text-indigo-700 hover:underline text-left"
                              >
                                {item.title}
                              </button>
                            </span>
                          </div>
                          <p className="text-slate-700">{item.description}</p>
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                            <span>📍 {item.address} ({item.neighborhood})</span>
                            <span>👤 {item.contactName}</span>
                            <span>🕒 {formatTimeAgo(item.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.type === 'NEED' ? (
                            <>
                              <button
                                onClick={() => handleVerifyNeed(item.id, { verificationStatus: "VERIFIED", priority: "HIGH", verifiedBy: currentUser.name, verificationNotes: "Aprobado por moderación" })}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Aprobar
                              </button>
                              <button
                                onClick={() => setEditingNeedViaModal(item.raw)}
                                className="bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                onClick={async () => { if (await showConfirm(`¿Rechazar "${item.title}"?`, { title: "Rechazar publicación" })) handleVerifyNeed(item.id, { verificationStatus: "ARCHIVED", status: "CLOSED" }); }}
                                className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1.5 rounded-lg text-xs"
                              >
                                Rechazar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={async () => { if (!authToken) return; try { await verifyOfferMutation({ token: authToken, offerId: item.id as any, action: "verify" }); } catch (e: any) { showAlert(e?.message || "Error", { title: "Error", variant: "error" }); } }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Aprobar
                              </button>
                              <button
                                onClick={() => setEditingOfferViaModal({ id: item.raw._id, ...item.raw } as any)}
                                className="bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                onClick={async () => { if (!authToken) return; if (await showConfirm(`¿Rechazar "${item.title}"?`, { title: "Rechazar oferta" })) { try { await verifyOfferMutation({ token: authToken, offerId: item.id as any, action: "archive" }); } catch (e: any) { showAlert(e?.message || "Error", { title: "Error", variant: "error" }); } } }}
                                className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1.5 rounded-lg text-xs"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
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
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
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
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
                            <div className="flex items-center sm:flex-col gap-1.5 shrink-0">
                              <button
                                onClick={async () => {
                                  if (await showConfirm('¿Estás seguro de archivar esta necesidad? Se cerrará permanentemente.', { title: "Archivar necesidad" })) {
                                    // Resolve report and archive need
                                  }
                                }}
                                className="bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Archivar necesidad
                              </button>
                              <button
                                onClick={() => {/* Dismiss report */}}
                                className="bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Desestimar
                              </button>
                            </div>
                          </div>
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
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
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
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs uppercase tracking-wider">
                      Distribución de prioridad
                    </h5>
                    {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => {
                      const cnt = needs.filter((n) => n.priority === p).length;
                      const cfg = PRIORITY_CONFIG[p];
                      return (
                        <div key={p} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border">
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

            {/* ALL TAB */}
            {activeTab === "ALL" && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  Todas las publicaciones ({needs.length + (rawOffers || []).length})
                </h4>

                {/* Search & Filters */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      placeholder="Buscar por título, barrio, dirección..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={adminTypeFilter}
                      onChange={(e) => setAdminTypeFilter(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white font-semibold"
                    >
                      <option value="ALL">Todas (necesidades + ofertas)</option>
                      <option value="NEEDS">Solo necesidades</option>
                      <option value="OFFERS">Solo ofertas</option>
                    </select>
                    <select
                      value={adminPriorityFilter}
                      onChange={(e) => setAdminPriorityFilter(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white font-semibold"
                    >
                      <option value="ALL">Todas las prioridades</option>
                      <option value="CRITICAL">🔴 Crítica</option>
                      <option value="HIGH">🟠 Alta</option>
                      <option value="MEDIUM">🟡 Media</option>
                      <option value="LOW">🟢 Baja</option>
                    </select>
                    <select
                      value={adminVerificationFilter}
                      onChange={(e) => setAdminVerificationFilter(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white font-semibold"
                    >
                      <option value="ALL">Todas las verificaciones</option>
                      <option value="VERIFIED">✓ Verificadas</option>
                      <option value="PENDING_VERIFICATION">◷ Pendientes</option>
                      <option value="REPORTED">⚠️ Reportadas</option>
                      <option value="ARCHIVED">📁 Archivadas</option>
                    </select>
                    {(adminSearch || adminPriorityFilter !== "ALL" || adminVerificationFilter !== "ALL" || adminTypeFilter !== "ALL") && (
                      <button
                        onClick={() => { setAdminSearch(""); setAdminPriorityFilter("ALL"); setAdminVerificationFilter("ALL"); setAdminTypeFilter("ALL"); }}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </div>

                {(() => {
                  type AdminListItem = { id: string; type: 'NEED' | 'OFFER'; title: string; neighborhood: string; address: string; priority?: string; verificationStatus: string; status: string; updatedAt: string };

                  const needItems: AdminListItem[] = (adminTypeFilter === "OFFERS" ? [] : liveNeeds).map((n: any) => ({
                    id: n.id, type: 'NEED' as const, title: n.title, neighborhood: n.neighborhood, address: n.address,
                    priority: n.priority, verificationStatus: n.verificationStatus, status: n.status, updatedAt: n.updatedAt,
                  }));

                  const offerItems: AdminListItem[] = (adminTypeFilter === "NEEDS" ? [] : (rawOffers || [])).map((o: any) => ({
                    id: o._id, type: 'OFFER' as const, title: o.title, neighborhood: o.neighborhood, address: o.address,
                    priority: undefined, verificationStatus: o.verificationStatus, status: o.offerStatus, updatedAt: o.updatedAt,
                  }));

                  const allItems = [...needItems, ...offerItems].filter((item) => {
                    if (adminSearch) {
                      const q = adminSearch.toLowerCase();
                      if (!item.title.toLowerCase().includes(q) && !item.neighborhood.toLowerCase().includes(q) && !item.address.toLowerCase().includes(q)) return false;
                    }
                    if (adminPriorityFilter !== "ALL" && item.priority !== adminPriorityFilter) return false;
                    if (adminVerificationFilter !== "ALL" && item.verificationStatus !== adminVerificationFilter) return false;
                    return true;
                  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

                  return (
                    <>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Mostrando {allItems.length} publicaciones
                      </p>

                      {/* Mobile-friendly cards for ALL tab */}
                      <div className="space-y-2">
                        {allItems.map((item) => (
                          <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.type === 'OFFER' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                                    {item.type === 'OFFER' ? 'OFERTA' : 'NECESIDAD'}
                                  </span>
                                  {item.priority && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PRIORITY_CONFIG[item.priority as Priority]?.badgeClass || ''}`}>
                                      {PRIORITY_CONFIG[item.priority as Priority]?.label || '—'}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${VERIFICATION_CONFIG[item.verificationStatus as VerificationStatus]?.badgeClass || ''}`}>
                                    {VERIFICATION_CONFIG[item.verificationStatus as VerificationStatus]?.label || item.verificationStatus}
                                  </span>
                                </div>
                                <p className="font-bold text-slate-900 text-sm truncate">
                                  <button
                                    onClick={() => {
                                      if (item.type === 'NEED') {
                                        const need = liveNeeds.find((n: any) => n.id === item.id);
                                        if (need) setViewingNeed(need);
                                      } else {
                                        const offer = offers.find((o) => o.id === item.id);
                                        if (offer) setViewingOffer(offer);
                                      }
                                    }}
                                    className="hover:text-indigo-700 hover:underline text-left truncate"
                                  >
                                    {item.title}
                                  </button>
                                </p>
                                <p className="text-[11px] text-slate-500">{item.neighborhood} · {formatTimeAgo(item.updatedAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
                              {item.type === 'NEED' && (
                                <>
                                  {item.verificationStatus === 'PENDING_VERIFICATION' && (
                                    <button
                                      onClick={() => handleVerifyNeed(item.id, { verificationStatus: "VERIFIED", priority: "HIGH", verifiedBy: currentUser.name, verificationNotes: "Aprobado por moderación" })}
                                      className="text-xs font-bold text-emerald-600 hover:underline"
                                    >
                                      Verificar
                                    </button>
                                  )}
                                  {item.verificationStatus === 'ARCHIVED' && (
                                    <button
                                      onClick={async () => { if (await showConfirm('¿Publicar esta necesidad? Volverá a ser visible.', { title: 'Publicar' })) handleVerifyNeed(item.id, { verificationStatus: "PENDING_VERIFICATION" }); }}
                                      className="text-xs font-bold text-emerald-600 hover:underline"
                                    >
                                      Publicar
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { const need = liveNeeds.find((n: any) => n.id === item.id); if (need) setEditingNeedViaModal(need); }}
                                    className="text-xs font-bold text-indigo-600 hover:underline"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => { const need = liveNeeds.find((n: any) => n.id === item.id); if (need) setEditingNeedViaModal(need); }}
                                    className="text-xs font-bold text-amber-600 hover:underline"
                                  >
                                    Prioridad
                                  </button>
                                  {item.verificationStatus !== 'ARCHIVED' && (
                                    <button
                                      onClick={async () => { if (await showConfirm(`¿Archivar "${item.title}"?`, { title: "Archivar publicación" })) handleVerifyNeed(item.id, { verificationStatus: "ARCHIVED", status: "CLOSED" }); }}
                                      className="text-xs font-bold text-rose-600 hover:underline"
                                    >
                                      Archivar
                                    </button>
                                  )}
                                </>
                              )}
                              {item.type === 'OFFER' && (
                                <>
                                  {item.verificationStatus !== 'VERIFIED' && item.verificationStatus !== 'ARCHIVED' && (
                                    <button
                                      onClick={async () => { if (!authToken) return; try { await verifyOfferMutation({ token: authToken, offerId: item.id as any, action: "verify" }); } catch (e: any) { showAlert(e?.message || "Error", { title: "Error", variant: "error" }); } }}
                                      className="text-xs font-bold text-emerald-600 hover:underline"
                                    >
                                      Verificar
                                    </button>
                                  )}
                                  {item.verificationStatus === 'ARCHIVED' && (
                                    <button
                                      onClick={async () => { if (!authToken) return; if (await showConfirm('¿Publicar esta oferta? Volverá a ser visible.', { title: 'Publicar' })) { try { await verifyOfferMutation({ token: authToken, offerId: item.id as any, action: "publish" }); } catch (e: any) { showAlert(e?.message || "Error", { title: "Error", variant: "error" }); } } }}
                                      className="text-xs font-bold text-emerald-600 hover:underline"
                                    >
                                      Publicar
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { const offer = offers.find((o) => o.id === item.id); if (offer) setEditingOfferViaModal(offer); }}
                                    className="text-xs font-bold text-indigo-600 hover:underline"
                                  >
                                    Editar
                                  </button>
                                  {item.verificationStatus !== 'ARCHIVED' && (
                                    <button
                                      onClick={async () => { if (!authToken) return; if (await showConfirm(`¿Archivar "${item.title}"?`, { title: "Archivar oferta" })) { try { await verifyOfferMutation({ token: authToken, offerId: item.id as any, action: "archive" }); } catch (e: any) { showAlert(e?.message || "Error", { title: "Error", variant: "error" }); } } }}
                                      className="text-xs font-bold text-rose-600 hover:underline"
                                    >
                                      Archivar
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* AUDIT TAB */}
            {activeTab === "AUDIT" && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Historial de auditoría</h4>
                <div className="bg-white border border-slate-200 rounded-xl p-3 divide-y divide-slate-200 max-h-[70vh] overflow-y-auto">
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
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Crear nuevo usuario
                  </h5>
                  <form
                    onSubmit={handleCreateUser}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
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
                      className="sm:col-span-2 bg-slate-900 text-white font-bold p-2 rounded-lg text-xs disabled:opacity-50"
                    >
                      {isCreatingUser ? "Creando..." : "Crear usuario"}
                    </button>
                  </form>
                </div>

                {/* Users list — card layout for mobile */}
                <div className="space-y-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider">
                    Usuarios registrados
                  </h5>
                  {!usersList || usersList.length === 0 ? (
                    <p className="text-slate-500 text-xs">Cargando...</p>
                  ) : (
                    <div className="space-y-2">
                      {usersList.map((u: any) => (
                        <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{u.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === "ADMIN" ? "bg-indigo-100 text-indigo-800" : "bg-emerald-100 text-emerald-800"}`}>
                                {u.role}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                {u.active ? "Activo" : "Inactivo"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {u.lastLoginAt ? formatTimeAgo(u.lastLoginAt) : "Nunca"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* View/Edit Modals */}
      <NeedDetailModal
        need={viewingNeed}
        onClose={() => setViewingNeed(null)}
        onOpenQuieroAyudar={() => {}}
        onOpenReportModal={() => {}}
        onOpenPublicEdit={(need) => { setViewingNeed(null); setEditingNeedViaModal(need); }}
        onOpenUpdateStatusModal={() => {}}
        isModeratorLoggedIn={true}
        isAdmin={currentUser?.role === "ADMIN"}
        onAdminEditNeed={(need) => { setViewingNeed(null); setEditingNeedViaModal(need); }}
        onAdminChangePriority={(need) => { setViewingNeed(null); setEditingNeedViaModal(need); }}
      />

      <OfferDetailModal
        offer={viewingOffer}
        isOpen={!!viewingOffer}
        onClose={() => setViewingOffer(null)}
        isModeratorLoggedIn={true}
        isAdmin={currentUser?.role === "ADMIN"}
        onOpenPublicEdit={(offer) => { setViewingOffer(null); setEditingOfferViaModal(offer); }}
        onAdminEditOffer={(offer) => { setViewingOffer(null); setEditingOfferViaModal(offer); }}
      />

      <PublicEditModal
        need={editingNeedViaModal}
        onClose={() => setEditingNeedViaModal(null)}
        moderatorName={currentUser?.name}
      />

      <PublicEditOfferModal
        offer={editingOfferViaModal}
        onClose={() => setEditingOfferViaModal(null)}
        moderatorName={currentUser?.name}
      />
    </div>
  );
};
