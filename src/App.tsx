/**
 * Aquí Hace Falta - Plataforma Ciudadana de Coordinación de Ayuda (Cali)
 * Main Application Component — Convex Backend
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  Map,
  List,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { FilterState, Need, NeedStatus, Offer } from "./types";
import { Header } from "./components/Header";
import { BannerDisclaimer } from "./components/BannerDisclaimer";
import { FilterBar } from "./components/FilterBar";
import { MapView } from "./components/MapView";
import { NeedCard } from "./components/NeedCard";
import { NeedDetailModal } from "./components/NeedDetailModal";
import { QuieroAyudarModal } from "./components/QuieroAyudarModal";
import { CreateNeedModal } from "./components/CreateNeedModal";
import { CreateOfferModal } from "./components/CreateOfferModal";
import { OfferCard } from "./components/OfferCard";
import { OfferDetailModal } from "./components/OfferDetailModal";
import { ReportModal } from "./components/ReportModal";
import { PublicEditModal } from "./components/PublicEditModal";
import { PublicEditOfferModal } from "./components/PublicEditOfferModal";
import { UpdateStatusModal } from "./components/UpdateStatusModal";
import { AdminDashboardModal } from "./components/AdminDashboardModal";
import { ModeradorPage } from "./components/ModeradorPage";
import { SocialCardView } from "./components/SocialCardView";
import { VALLE_CITIES, ALL_VALLE_ID, detectCityFromCoords } from "./data/valleCities";

// Adapter: converts Convex document (with _id) to our Need type (with id)
function convexNeedToNeed(doc: any): Need {
  const { _id, _creationTime, ...rest } = doc;
  return { id: _id, ...rest } as Need;
}

// Check if current path is a static page or special view
function getSpecialRoute(): { type: 'moderador' } | { type: 'social'; needId: string; format: 'post' | 'story' } | null {
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  if (path === 'moderador') return { type: 'moderador' };

  // Check for /:cityId/:needId/post or /:cityId/:needId/story
  const parts = path.split('/');
  if (parts.length === 3 && (parts[2] === 'post' || parts[2] === 'story')) {
    return { type: 'social', needId: parts[1], format: parts[2] };
  }
  return null;
}

export default function App() {
  const specialRoute = getSpecialRoute();

  if (specialRoute?.type === 'moderador') {
    return <ModeradorPage />;
  }

  if (specialRoute?.type === 'social') {
    return <SocialCardView needId={specialRoute.needId} format={specialRoute.format} />;
  }

  return <MainApp />;
}

function MainApp() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Parse URL: /:cityId or /:cityId/:needId
  const [initialNeedId] = useState<string | null>(() => {
    const parts = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').split('/');
    return parts.length >= 2 ? parts[1] : null;
  });

  // Selected city/municipality — read initial value from URL path
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    const parts = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').split('/');
    const citySlug = parts[0];
    if (!citySlug || citySlug === ALL_VALLE_ID) return ALL_VALLE_ID;
    const match = VALLE_CITIES.find((c) => c.id === citySlug);
    return match ? match.id : 'cali';
  });

  // Build current URL base for the city
  const getCityPath = (cityId: string) => cityId === ALL_VALLE_ID ? '/' : `/${cityId}`;

  // Sync URL when city changes
  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    if (!selectedNeedRef.current) {
      window.history.replaceState(null, '', getCityPath(cityId));
    }
    const cityName = VALLE_CITIES.find((c) => c.id === cityId)?.name;
    document.title = cityId === ALL_VALLE_ID
      ? 'Aquí Hace Falta — Valle del Cauca'
      : `Aquí Hace Falta — ${cityName}`;
  };

  // Build shareable URL for a need
  const getNeedUrl = (need: Need) => {
    const cityId = need.cityId || selectedCityId;
    const base = window.location.origin;
    return `${base}/${cityId}/${need.id}`;
  };

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    categories: [],
    priority: "ALL",
    placeType: "ALL",
    status: "ALL",
    verificationStatus: "ALL",
    distanceKm: null,
    userLat: null,
    userLng: null,
    sortBy: "PRIORITY",
    viewMode: "ALL",
  });

  // Mobile view
  const [mobileView, setMobileView] = useState<"LIST" | "MAP">("LIST");

  // Selected need modals
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [selectedForHelp, setSelectedForHelp] = useState<Need | null>(null);
  const [selectedForReport, setSelectedForReport] = useState<Need | null>(null);
  const [selectedForPublicEdit, setSelectedForPublicEdit] = useState<Need | null>(null);
  const [selectedOfferForEdit, setSelectedOfferForEdit] = useState<Offer | null>(null);
  const [selectedForStatusUpdate, setSelectedForStatusUpdate] =
    useState<Need | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Moderator edit state (from detail modal)
  const [editingNeedFromDetail, setEditingNeedFromDetail] = useState<Need | null>(null);
  const [editModeFromDetail, setEditModeFromDetail] = useState<"priority" | "full">("full");

  // Check if a moderator is logged in
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("ahf_admin_token") : null;
  const sessionUser = useQuery(
    api.auth.validateSession,
    adminToken ? { token: adminToken } : "skip"
  );
  const isModeratorLoggedIn = !!sessionUser;
  const isAdminUser = (sessionUser as any)?.role === "ADMIN";

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // --- CONVEX QUERIES ---
  const needCounts = useQuery(api.needs.countsByCity) || {};

  // Always-on count queries (never skipped, for tab counters)
  const allNeedsForCount = useQuery(api.needs.list, {
    cityId: selectedCityId !== ALL_VALLE_ID ? selectedCityId : undefined,
  });
  const allOffersForCount = useQuery(api.offers.list, {
    cityId: selectedCityId !== ALL_VALLE_ID ? selectedCityId : undefined,
  });
  const totalNeedsCount = allNeedsForCount?.length ?? 0;
  const totalOffersCount = allOffersForCount?.length ?? 0;

  const rawNeeds = useQuery(api.needs.list,
    filters.viewMode === "OFFERS" ? "skip" : {
      cityId: selectedCityId !== ALL_VALLE_ID ? selectedCityId : undefined,
      search: filters.search || undefined,
      category:
        filters.categories.length === 1 ? filters.categories[0] : undefined,
      priority: filters.priority !== "ALL" ? filters.priority : undefined,
      placeType: filters.placeType !== "ALL" ? filters.placeType : undefined,
      status: filters.status !== "ALL" ? filters.status : undefined,
      verificationStatus:
        filters.verificationStatus !== "ALL"
          ? filters.verificationStatus
          : undefined,
      userLat: filters.userLat ?? undefined,
      userLng: filters.userLng ?? undefined,
      distanceKm: filters.distanceKm ?? undefined,
      sortBy: filters.sortBy || undefined,
    }
  );

  // Offers query — only active when ViewMode is "OFFERS" or "ALL"
  const rawOffers = useQuery(api.offers.list,
    filters.viewMode === "NEEDS" ? "skip" : {
      cityId: selectedCityId !== ALL_VALLE_ID ? selectedCityId : undefined,
      search: filters.search || undefined,
      category:
        filters.categories.length === 1 ? filters.categories[0] : undefined,
      userLat: filters.userLat ?? undefined,
      userLng: filters.userLng ?? undefined,
      distanceKm: filters.distanceKm ?? undefined,
      sortBy: filters.sortBy || undefined,
    }
  );

  // Admin data is now fetched inside AdminDashboardModal with auth token

  // Adapted needs
  const needs: Need[] = useMemo(
    () => (rawNeeds || []).map(convexNeedToNeed),
    [rawNeeds]
  );

  // Adapted offers — graceful fallback to empty array if query fails or is skipped
  const offers: Offer[] = useMemo(
    () => {
      if (!rawOffers) return [];
      try {
        return rawOffers.map((doc: any) => {
          const { _id, _creationTime, ...rest } = doc;
          return { id: _id, ...rest } as Offer;
        });
      } catch {
        return [];
      }
    },
    [rawOffers]
  );

  // Open need from URL on initial load
  const needFromUrl = useQuery(
    api.needs.getById,
    initialNeedId ? { id: initialNeedId as Id<"needs"> } : "skip"
  );

  useEffect(() => {
    if (initialNeedId && needFromUrl && !selectedNeed) {
      const { _id, _creationTime, updates, ...rest } = needFromUrl as any;
      handleSelectNeed({ id: _id, ...rest } as Need);
    }
  }, [initialNeedId, needFromUrl]);

  // Update URL when opening/closing need detail
  const selectedNeedRef = useRef<Need | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const handleSelectNeed = (need: Need | null) => {
    selectedNeedRef.current = need;
    setSelectedNeed(need);
    if (need) {
      const cityId = need.cityId || selectedCityId;
      window.history.replaceState(null, '', `/${cityId}/${need.id}`);
    } else {
      window.history.replaceState(null, '', getCityPath(selectedCityId));
    }
  };

  // Build shareable URL for an offer
  const getOfferUrl = (offer: Offer) => {
    const cityId = offer.cityId || selectedCityId;
    const base = window.location.origin;
    return `${base}/${cityId}/offer/${offer.id}`;
  };

  // Update URL when opening/closing offer detail
  const handleSelectOffer = (offer: Offer | null) => {
    setSelectedOffer(offer);
    if (offer) {
      const cityId = offer.cityId || selectedCityId;
      window.history.replaceState(null, '', `/${cityId}/offer/${offer.id}`);
    } else {
      window.history.replaceState(null, '', getCityPath(selectedCityId));
    }
  };

  const reports = useMemo(() => {
    return [];
  }, []);

  const auditLogs = useMemo(() => {
    return [];
  }, []);

  const isLoading = filters.viewMode === "OFFERS"
    ? rawOffers === undefined
    : filters.viewMode === "ALL"
    ? rawNeeds === undefined && rawOffers === undefined
    : rawNeeds === undefined;
  const lastUpdated = new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // --- CONVEX MUTATIONS ---
  const createNeed = useMutation(api.needs.create);
  const updateNeedStatus = useMutation(api.needs.addUpdateNote);
  const submitReport = useMutation(api.needs.submitReport);
  const adminVerify = useMutation(api.admin.verifyNeed);
  const adminResolveReport = useMutation(api.admin.resolveReport);

  // Geolocation
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFilters((prev) => ({
          ...prev,
          userLat: latitude,
          userLng: longitude,
          distanceKm: prev.distanceKm || 5,
          sortBy: "DISTANCE",
        }));
        // Auto-detect city from user's position
        const detectedCity = detectCityFromCoords(latitude, longitude);
        if (detectedCity) {
          handleCityChange(detectedCity.id);
        }
        setIsLoadingLocation(false);
      },
      () => {
        setIsLoadingLocation(false);
        alert(
          "No pudimos acceder a tu ubicación. Puedes buscar por barrio o explorar el mapa."
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle map center change — detect city
  const handleMapCenterChanged = (lat: number, lng: number) => {
    const detectedCity = detectCityFromCoords(lat, lng);
    if (detectedCity && detectedCity.id !== selectedCityId) {
      setSelectedCityId(detectedCity.id);
      document.title = `Aquí Hace Falta — ${detectedCity.name}`;
      if (!selectedNeedRef.current) {
        window.history.replaceState(null, '', getCityPath(detectedCity.id));
      }
    }
  };

  // Create Need Submit
  const handleCreateNeed = async (data: Partial<Need>) => {
    setIsSubmittingCreate(true);
    try {
      await createNeed({
        title: data.title || "",
        description: data.description || "",
        placeType: data.placeType,
        categories: data.categories,
        resources: data.resources?.map((r) => ({
          type: r.type,
          description: r.description,
          requestedQuantity: r.requestedQuantity,
          fulfilledQuantity: r.fulfilledQuantity,
          unit: r.unit,
        })),
        address: data.address || "",
        neighborhood: data.neighborhood || "",
        latitude: data.latitude,
        longitude: data.longitude,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactWhatsapp: data.contactWhatsapp,
        contactEmail: data.contactEmail,
        organizationName: data.organizationName,
        requesterType: data.requesterType,
        source: data.source,
        evidenceUrl: data.evidenceUrl,
        operatingHours: data.operatingHours,
        priority: data.priority,
        cityId: data.cityId || selectedCityId,
      });
      setIsCreateModalOpen(false);
      alert(
        '¡Solicitud guardada! Tu reporte aparecerá como "Pendiente de verificación" hasta ser confirmado.'
      );
    } catch (err) {
      alert("Error al enviar el reporte.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Report Submit
  const handleSubmitReport = async (
    needId: string,
    reason: string,
    description: string,
    contact: string
  ) => {
    try {
      await submitReport({
        needId: needId as Id<"needs">,
        reason,
        description,
        reporterContact: contact,
      });
      alert(
        "Reporte enviado a moderación. Gracias por ayudar a mantener limpia la información."
      );
    } catch (e) {
      alert("Error al enviar el reporte.");
    }
  };

  // Update Status
  const handleUpdateStatus = async (
    needId: string,
    newStatus: NeedStatus,
    note: string,
    updatedBy: string
  ) => {
    try {
      await updateNeedStatus({
        id: needId as Id<"needs">,
        newStatus,
        description: note,
        updatedBy,
      });
      alert("Estado actualizado exitosamente.");
    } catch (e) {
      alert("Error actualizando el estado.");
    }
  };

  // Admin Verify
  const handleAdminVerify = async (needId: string, updates: Partial<Need>) => {
    const token = localStorage.getItem("ahf_admin_token");
    if (!token) {
      alert("Sesión expirada. Inicia sesión de nuevo.");
      return;
    }
    try {
      await adminVerify({
        token,
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
      alert("Error en moderación.");
    }
  };

  // Admin Resolve Report
  const handleAdminResolveReport = async (
    reportId: string,
    action: string
  ) => {
    const token = localStorage.getItem("ahf_admin_token");
    if (!token) {
      alert("Sesión expirada. Inicia sesión de nuevo.");
      return;
    }
    try {
      await adminResolveReport({
        token,
        reportId: reportId as Id<"reports">,
        action,
      });
    } catch (e) {
      alert("Error al resolver el reporte.");
    }
  };

  // Reset Demo Data (no-op, demo data removed)
  const handleResetDemoData = async () => {
    // No demo data to reset
  };

  const activeCount = needs.filter(
    (n) => n.status !== "CLOSED" && n.verificationStatus !== "ARCHIVED"
  ).length;
  const criticalCount = needs.filter(
    (n) => n.priority === "CRITICAL" && n.status !== "CLOSED"
  ).length;
  const hasDemoData = needs.some((n) => n.isDemoData);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased">
      {/* Platform Header */}
      <Header
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenCreateOfferModal={() => setShowCreateOffer(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onScrollToMap={() => {
          setFilters((f) => ({ ...f, viewMode: "NEEDS" }));
          setMobileView("MAP");
          // Scroll to main content area (past header + filters)
          setTimeout(() => {
            mainContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
        lastUpdated={lastUpdated}
        isOffline={isOffline}
        activeCount={activeCount}
        criticalCount={criticalCount}
        selectedCityId={selectedCityId}
        onCityChange={handleCityChange}
        needCounts={needCounts}
      />
      {/* Spacer for fixed header */}
      <div className="h-[88px] md:h-[116px]" />

      {/* Emergency Disclaimer & Demo Notice */}
      <BannerDisclaimer
        hasDemoData={hasDemoData}
        onResetDemoData={handleResetDemoData}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={(updated) =>
          setFilters((prev) => ({ ...prev, ...updated }))
        }
        onClearFilters={() =>
          setFilters({
            search: "",
            categories: [],
            priority: "ALL",
            placeType: "ALL",
            status: "ALL",
            verificationStatus: "ALL",
            distanceKm: null,
            userLat: null,
            userLng: null,
            sortBy: "PRIORITY",
            viewMode: "ALL",
          })
        }
        onRequestLocation={handleRequestLocation}
        isLoadingLocation={isLoadingLocation}
        totalResults={needs.length + offers.length}
        selectedCityName={selectedCityId === ALL_VALLE_ID ? 'la zona' : VALLE_CITIES.find(c => c.id === selectedCityId)?.name || 'la zona'}
        needsCount={totalNeedsCount}
        offersCount={totalOffersCount}
      />

      {/* Mobile View Toggle Buttons */}
      <div className="md:hidden bg-white border-b border-slate-200 p-2 z-30 flex items-center justify-center gap-2">
        <button
          onClick={() => setMobileView("LIST")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mobileView === "LIST"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <List className="w-4 h-4" />
          <span>Lista ({needs.length})</span>
        </button>

        <button
          onClick={() => setMobileView("MAP")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mobileView === "MAP"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Mapa</span>
        </button>
      </div>

      {/* Main Content Layout */}
      <main className="flex-1 relative" ref={mainContentRef}>
        {/* MAP — Full width background */}
        <div
          className={`w-full h-[calc(100vh-200px)] md:h-[calc(100vh-200px)] ${
            mobileView === "MAP" ? "block" : "hidden md:block"
          }`}
        >
          <MapView
            needs={needs}
            selectedNeedId={selectedNeed?.id}
            onSelectNeed={(need) => handleSelectNeed(need)}
            userLat={filters.userLat}
            userLng={filters.userLng}
            selectedCityId={selectedCityId}
            onMapCenterChanged={handleMapCenterChanged}
            offers={offers}
            viewMode={filters.viewMode}
            onSelectOffer={(offer) => handleSelectOffer(offer)}
          />
        </div>

        {/* LIST PANEL — Constrained to max-w-7xl, aligned right */}
        <div
          className={`${
            mobileView === "LIST" ? "block" : "hidden md:block"
          } md:absolute md:inset-0 md:pointer-events-none z-20`}
        >
          <div className="md:max-w-7xl md:mx-auto md:px-4 md:px-8 md:h-full md:relative">
            {/* Priority Legend — aligned left */}
            <div className="hidden md:block md:absolute md:bottom-3 md:left-0 md:pointer-events-auto">
              <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-300 shadow-md text-xs space-y-1">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                  Prioridad de ayuda
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                  <span className="text-slate-700">Crítica</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                  <span className="text-slate-700">Alta</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span className="text-slate-700">Media</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span className="text-slate-700">Baja</span>
                </div>
              </div>
            </div>

            {/* Cards panel — aligned right */}
            <div className="p-3 md:p-0 md:absolute md:top-3 md:right-0 md:bottom-3 md:w-[380px] lg:w-[420px] md:pointer-events-auto">
          <div className="p-3 md:p-0 space-y-3 md:h-full md:flex md:flex-col">
            <div className="flex items-center justify-between bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 md:shadow-md md:border md:border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 leading-none">
                <span>
                  {filters.viewMode === "OFFERS"
                    ? `Ofertas disponibles${selectedCityId !== ALL_VALLE_ID ? ` en ${VALLE_CITIES.find(c => c.id === selectedCityId)?.name || 'Valle'}` : ''}`
                    : filters.viewMode === "ALL"
                    ? `Necesidades y ofertas${selectedCityId !== ALL_VALLE_ID ? ` en ${VALLE_CITIES.find(c => c.id === selectedCityId)?.name || 'Valle'}` : ''}`
                    : `Necesidades activas${selectedCityId !== ALL_VALLE_ID ? ` en ${VALLE_CITIES.find(c => c.id === selectedCityId)?.name || 'Valle'}` : ''}`
                  }
                </span>
                <span className="bg-slate-800 text-white text-[11px] px-2 py-0.5 rounded-full font-bold leading-none">
                  {filters.viewMode === "OFFERS" ? offers.length : filters.viewMode === "ALL" ? needs.length + offers.length : needs.length}
                </span>
              </h3>
            </div>

            {/* Distance sort prompt when no geolocation */}
            {filters.sortBy === "DISTANCE" && !filters.userLat && !filters.userLng && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Para ordenar por distancia, activa tu ubicación.</span>
                <button
                  onClick={handleRequestLocation}
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold text-[11px] shrink-0"
                >
                  Activar
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 animate-pulse shadow-sm"
                  >
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-12 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (filters.viewMode === "NEEDS" && needs.length === 0) ||
                (filters.viewMode === "OFFERS" && offers.length === 0) ||
                (filters.viewMode === "ALL" && needs.length === 0 && offers.length === 0) ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className="font-bold text-slate-900 text-base">
                  {filters.viewMode === "OFFERS" ? "No se encontraron ofertas" : "No se encontraron resultados"}
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  No hay puntos coincidentes con los filtros seleccionados. Intenta
                  ampliar el radio de distancia o limpiar la búsqueda.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      categories: [],
                      priority: "ALL",
                      placeType: "ALL",
                      status: "ALL",
                      verificationStatus: "ALL",
                      distanceKm: null,
                      userLat: null,
                      userLng: null,
                      sortBy: "PRIORITY",
                      viewMode: "ALL",
                    })
                  }
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto md:flex-1 max-h-[calc(100vh-280px)] pr-1 cards-scroll">
                {/* ViewMode: NEEDS — only needs */}
                {filters.viewMode === "NEEDS" && needs.map((need) => (
                  <NeedCard
                    key={need.id}
                    need={need}
                    onSelect={(item) => handleSelectNeed(item)}
                    onHelp={(item) => setSelectedForHelp(item)}
                    userLat={filters.userLat}
                    userLng={filters.userLng}
                    isSelected={selectedNeed?.id === need.id}
                  />
                ))}

                {/* ViewMode: OFFERS — only offers */}
                {filters.viewMode === "OFFERS" && offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onClick={() => handleSelectOffer(offer)}
                  />
                ))}

                {/* ViewMode: ALL — sectioned: needs then offers */}
                {filters.viewMode === "ALL" && (
                  <>
                    {needs.length > 0 && (
                      <>
                        {needs.map((need) => (
                          <NeedCard
                            key={need.id}
                            need={need}
                            onSelect={(item) => handleSelectNeed(item)}
                            onHelp={(item) => setSelectedForHelp(item)}
                            userLat={filters.userLat}
                            userLng={filters.userLng}
                            isSelected={selectedNeed?.id === need.id}
                          />
                        ))}
                      </>
                    )}
                    {offers.length > 0 && (
                      <>
                        {offers.map((offer) => (
                          <OfferCard
                            key={offer.id}
                            offer={offer}
                            onClick={() => handleSelectOffer(offer)}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          </div>
        </div>
        </div>
      </main>

      {/* Modals */}
      <NeedDetailModal
        need={selectedNeed}
        onClose={() => handleSelectNeed(null)}
        shareUrl={selectedNeed ? getNeedUrl(selectedNeed) : undefined}
        onOpenQuieroAyudar={(need) => setSelectedForHelp(need)}
        onOpenReportModal={(need) => setSelectedForReport(need)}
        onOpenPublicEdit={(need) => setSelectedForPublicEdit(need)}
        onOpenUpdateStatusModal={(need) => setSelectedForStatusUpdate(need)}
        isModeratorLoggedIn={isModeratorLoggedIn}
        isAdmin={isAdminUser}
        onAdminEditNeed={(need) => {
          setEditingNeedFromDetail(need);
          setEditModeFromDetail("full");
          handleSelectNeed(null);
          setIsAdminModalOpen(true);
        }}
        onAdminChangePriority={(need) => {
          setEditingNeedFromDetail(need);
          setEditModeFromDetail("priority");
          handleSelectNeed(null);
          setIsAdminModalOpen(true);
        }}
      />

      <QuieroAyudarModal
        need={selectedForHelp}
        onClose={() => setSelectedForHelp(null)}
      />

      <CreateNeedModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateNeed}
        isSubmitting={isSubmittingCreate}
        initialCityId={selectedCityId !== ALL_VALLE_ID ? selectedCityId : 'cali'}
      />

      <ReportModal
        need={selectedForReport}
        onClose={() => setSelectedForReport(null)}
        onSubmitReport={handleSubmitReport}
      />

      <PublicEditModal
        need={selectedForPublicEdit}
        onClose={() => setSelectedForPublicEdit(null)}
        moderatorName={isModeratorLoggedIn ? (sessionUser as any)?.name : undefined}
      />

      <PublicEditOfferModal
        offer={selectedOfferForEdit}
        onClose={() => setSelectedOfferForEdit(null)}
        moderatorName={isModeratorLoggedIn ? (sessionUser as any)?.name : undefined}
      />

      <UpdateStatusModal
        need={selectedForStatusUpdate}
        onClose={() => setSelectedForStatusUpdate(null)}
        onSubmitUpdate={handleUpdateStatus}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setEditingNeedFromDetail(null);
        }}
        needs={needs}
        reports={reports}
        auditLogs={auditLogs}
        onVerifyNeed={handleAdminVerify}
        onResolveReport={handleAdminResolveReport}
        onResetDemoData={handleResetDemoData}
        initialEditNeed={editingNeedFromDetail}
        initialEditMode={editModeFromDetail}
      />

      <CreateOfferModal
        isOpen={showCreateOffer}
        onClose={() => setShowCreateOffer(false)}
        selectedCityId={selectedCityId !== ALL_VALLE_ID ? selectedCityId : 'cali'}
      />

      <OfferDetailModal
        offer={selectedOffer}
        isOpen={!!selectedOffer}
        onClose={() => handleSelectOffer(null)}
        shareUrl={selectedOffer ? getOfferUrl(selectedOffer) : undefined}
        isModeratorLoggedIn={isModeratorLoggedIn}
        isAdmin={isAdminUser}
        onOpenPublicEdit={(offer) => setSelectedOfferForEdit(offer)}
        onAdminEditOffer={(offer) => setSelectedOfferForEdit(offer)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between text-[11px] font-semibold uppercase tracking-wider gap-3">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8">
          <span className="text-slate-400">Resumen de Cali:</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{" "}
            {criticalCount} Críticas
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />{" "}
            {needs.filter((n) => n.priority === "HIGH").length} Altas
          </span>
          <span className="flex items-center gap-2 text-indigo-400">
            ✓ {needs.filter((n) => n.verificationStatus === "VERIFIED").length}{" "}
            Verificadas
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="hover:text-white transition-colors"
          >
            Acceso Moderación
          </button>
          <span>•</span>
          <span className="text-slate-300">Cali, Colombia</span>
        </div>
        </div>
      </footer>
    </div>
  );
}
