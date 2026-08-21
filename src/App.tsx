/**
 * Aquí Hace Falta - Plataforma Ciudadana de Coordinación de Ayuda (Cali)
 * Main Application Component — Convex Backend
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { showAlert } from "./components/ConfirmDialog";
import { useNeeds, useOffers, useCityCounts, createNeed, submitNeedReport, addNeedUpdateNote, getNeedById, getOfferById, updateNeed } from "./lib/supabaseService";
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
import { MobileBottomBar } from "./components/MobileBottomBar";
import { ModeradorPage } from "./components/ModeradorPage";
import { AdminPanelPage } from "./components/AdminPanelPage";
import { SocialCardView } from "./components/SocialCardView";
import { ALL_COLOMBIA_ID, findCityById, getCityDisplayName, detectCityFromCoords } from "./data/colombiaCities";
import { useTranslation } from "./i18n/LanguageContext";



import { DevEnvironmentBanner } from "./components/DevEnvironmentBanner";

// Check if current path is a static page or special view
function getSpecialRoute(): { type: 'moderador' } | { type: 'panel' } | { type: 'social'; needId: string; format: 'post' | 'story' } | null {
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  if (path === 'moderador') return { type: 'moderador' };
  if (path === 'panel') return { type: 'panel' };

  // Check for /:cityId/:needId/post or /:cityId/:needId/story
  const parts = path.split('/');
  if (parts.length === 3 && (parts[2] === 'post' || parts[2] === 'story')) {
    return { type: 'social', needId: parts[1], format: parts[2] };
  }
  return null;
}

export default function App() {
  const specialRoute = getSpecialRoute();

  let content = <MainApp />;
  if (specialRoute?.type === 'moderador') {
    content = <ModeradorPage />;
  } else if (specialRoute?.type === 'panel') {
    content = <AdminPanelPage />;
  } else if (specialRoute?.type === 'social') {
    content = <SocialCardView needId={specialRoute.needId} format={specialRoute.format} />;
  }

  return (
    <>
      {content}
      <DevEnvironmentBanner />
    </>
  );
}

function MainApp() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const sessionUser = typeof window !== 'undefined' && localStorage.getItem('ahf_admin_token') ? { name: 'Moderador' } : null;

  // Parse URL: /:cityId or /:cityId/:needId or /:cityId/offer/:offerId
  const [initialNeedId] = useState<string | null>(() => {
    const parts = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').split('/');
    // Skip if this is an offer URL (/:cityId/offer/:offerId)
    if (parts.length >= 3 && parts[1] === 'offer') return null;
    return parts.length >= 2 && parts[1] !== 'offer' ? parts[1] : null;
  });

  const [initialOfferId] = useState<string | null>(() => {
    const parts = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').split('/');
    if (parts.length >= 3 && parts[1] === 'offer') return parts[2];
    return null;
  });

  // Selected city/municipality — read initial value from URL path
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    const parts = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').split('/');
    const citySlug = parts[0];
    if (!citySlug || citySlug === ALL_COLOMBIA_ID) return ALL_COLOMBIA_ID;
    const match = findCityById(citySlug);
    return match ? match.id : ALL_COLOMBIA_ID;
  });

  // Build current URL base for the city
  const getCityPath = (cityId: string) => cityId === ALL_COLOMBIA_ID ? '/' : `/${cityId}`;

  // Sync URL when city changes
  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    if (!selectedNeedRef.current) {
      window.history.replaceState(null, '', getCityPath(cityId));
    }
    const cityName = getCityDisplayName(cityId);
    document.title = cityId === ALL_COLOMBIA_ID
      ? 'Aquí Hace Falta — Colombia'
      : `Aquí Hace Falta — ${cityName}`;
  };

  // Build shareable URL for a need
  const getNeedUrl = (need: Need) => {
    const cityId = need.cityId || selectedCityId;
    const base = window.location.origin;
    return `${base}/${cityId}/${need.id}`;
  };

  // Translation
  const { t } = useTranslation();

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
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Check if a moderator is logged in
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("ahf_admin_token") : null;
  // Check if a moderator is logged in
  const isModeratorLoggedIn = !!localStorage.getItem("ahf_admin_token");
  const isAdminUser = true;

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

  // Favicon claro/oscuro según el tema del sistema
  useEffect(() => {
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateFavicon = (e: MediaQueryListEvent | MediaQueryList) => {
      if (favicon) {
        favicon.href = e.matches ? '/favicon-dark.svg' : '/favicon.svg';
      }
    };

    updateFavicon(darkModeMediaQuery);
    darkModeMediaQuery.addEventListener('change', updateFavicon);

    return () => darkModeMediaQuery.removeEventListener('change', updateFavicon);
  }, []);

  // --- SUPABASE DATA HOOKS ---
  const { needCounts, offerCounts } = useCityCounts();
  const { needs, loading: needsLoading } = useNeeds(filters, selectedCityId);
  const { offers, loading: offersLoading } = useOffers(filters, selectedCityId);

  // Combined counts (needs + offers) per city for the city selector
  const combinedCounts = useMemo(() => {
    const combined: Record<string, number> = { ...needCounts };
    for (const [city, count] of Object.entries(offerCounts)) {
      combined[city] = (combined[city] || 0) + count;
    }
    return combined;
  }, [needCounts, offerCounts]);

  const totalNeedsCount = needs.length;
  const totalOffersCount = offers.length;

  // Filtered needs for list view (cards list)
  const displayedNeeds = useMemo(() => {
    if (!selectedCityId || selectedCityId === ALL_COLOMBIA_ID || selectedCityId === 'ALL_COLOMBIA' || selectedCityId === 'todo-colombia') {
      return needs;
    }
    const cleanSel = selectedCityId.toLowerCase().trim();
    return needs.filter((n) => {
      const cId = (n.cityId || '').toLowerCase();
      const neigh = (n.neighborhood || '').toLowerCase();
      return cId === cleanSel || cId.includes(cleanSel) || neigh.includes(cleanSel);
    });
  }, [needs, selectedCityId]);

  // Filtered offers for list view (cards list)
  const displayedOffers = useMemo(() => {
    if (!selectedCityId || selectedCityId === ALL_COLOMBIA_ID || selectedCityId === 'ALL_COLOMBIA' || selectedCityId === 'todo-colombia') {
      return offers;
    }
    const cleanSel = selectedCityId.toLowerCase().trim();
    return offers.filter((o) => {
      const cId = (o.cityId || '').toLowerCase();
      const neigh = (o.neighborhood || '').toLowerCase();
      return cId === cleanSel || cId.includes(cleanSel) || neigh.includes(cleanSel);
    });
  }, [offers, selectedCityId]);

  // Open need from URL on initial load
  useEffect(() => {
    if (initialNeedId && !selectedNeed) {
      getNeedById(initialNeedId).then((need) => {
        if (need) handleSelectNeed(need);
      });
    }
  }, [initialNeedId]);

  // Open offer from URL on initial load
  useEffect(() => {
    if (initialOfferId && !selectedOffer) {
      getOfferById(initialOfferId).then((offer) => {
        if (offer) handleSelectOffer(offer);
      });
    }
  }, [initialOfferId]);

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

  const reports = useMemo(() => [], []);
  const auditLogs = useMemo(() => [], []);

  const isLoading = filters.viewMode === "OFFERS" ? offersLoading : needsLoading;
  const lastUpdated = new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Geolocation — triggered from CityCombobox "Mi ubicación" option
  const handleRequestLocation = (lat: number, lng: number) => {
    setFilters((prev) => ({
      ...prev,
      userLat: lat,
      userLng: lng,
      sortBy: "DISTANCE",
    }));
    // Auto-detect city from user's position
    const detectedCity = detectCityFromCoords(lat, lng);
    if (detectedCity) {
      handleCityChange(detectedCity.id);
    }
    setIsLoadingLocation(false);
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
        resources: data.resources?.map((r, idx) => ({
          id: String(idx),
          type: r.type,
          description: r.description,
          requestedQuantity: r.requestedQuantity,
          fulfilledQuantity: r.fulfilledQuantity,
          unit: r.unit,
          status: 'PENDING' as const,
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
      showAlert('¡Solicitud guardada! Tu reporte aparecerá como pendiente de verificación hasta ser confirmado.', { title: 'Solicitud guardada', variant: 'success' });
    } catch (err) {
      showAlert("Error al enviar el reporte.", { title: "Error", variant: "error" });
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
      await submitNeedReport({
        needId,
        reason,
        description,
        reporterContact: contact,
      });
      showAlert("Reporte enviado a moderación. Gracias por ayudar a mantener limpia la información.", { title: "Reporte enviado", variant: "success" });
    } catch (e) {
      showAlert("Error al enviar el reporte.", { title: "Error", variant: "error" });
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
      const need = needs.find((n) => n.id === needId);
      await addNeedUpdateNote({
        needId,
        previousStatus: need?.status || 'NEED_HELP_NOW',
        newStatus,
        description: note,
        updatedBy,
      });
      showAlert("Estado actualizado exitosamente.", { title: "Éxito", variant: "success" });
    } catch (e) {
      showAlert("Error actualizando el estado.", { title: "Error", variant: "error" });
    }
  };

  // Admin Verify
  const handleAdminVerify = async (needId: string, updates: Partial<Need>) => {
    const token = localStorage.getItem("ahf_admin_token");
    if (!token) {
      showAlert("Sesión expirada. Inicia sesión de nuevo.", { title: "Sesión expirada", variant: "error" });
      return;
    }
    try {
      await updateNeed(needId, updates);
      showAlert("Moderación guardada exitosamente.", { title: "Éxito", variant: "success" });
    } catch (e) {
      showAlert("Error en moderación.", { title: "Error", variant: "error" });
    }
  };

  // Admin Resolve Report
  const handleAdminResolveReport = async (
    reportId: string,
    action: string
  ) => {
    const token = localStorage.getItem("ahf_admin_token");
    if (!token) {
      showAlert("Sesión expirada. Inicia sesión de nuevo.", { title: "Sesión expirada", variant: "error" });
      return;
    }
    try {
      const { supabase } = await import("./lib/supabaseClient");
      await supabase.from("reports").update({ status: action === "resolve" ? "RESOLVED" : "DISMISSED" }).eq("id", reportId);
      showAlert("Reporte actualizado.", { title: "Éxito", variant: "success" });
    } catch (e) {
      showAlert("Error al resolver el reporte.", { title: "Error", variant: "error" });
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
    <div className="min-h-screen bg-brand-surface flex flex-col text-brand-text antialiased">
      {/* Platform Header */}
      <Header
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenCreateOfferModal={() => setShowCreateOffer(true)}
        onOpenAdminModal={() => { window.location.href = '/panel'; }}
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
      />
      {/* Spacer for fixed header */}
      <div className="h-[56px] md:h-[72px]" />

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
        selectedCityName={selectedCityId === ALL_COLOMBIA_ID ? 'la zona' : getCityDisplayName(selectedCityId)}
        needsCount={totalNeedsCount}
        offersCount={totalOffersCount}
        selectedCityId={selectedCityId}
        onCityChange={handleCityChange}
        needCounts={combinedCounts}
      />


      {/* Main Content Layout */}
      <main className="flex-1 relative" ref={mainContentRef}>
        {/* MAP — Full width background */}
        <div
          id="mobile-map-anchor"
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
          id="mobile-list-anchor"
          className={`${
            mobileView === "LIST" ? "block" : "hidden md:block"
          } md:absolute md:inset-0 md:pointer-events-none z-20`}
        >
          <div className="md:max-w-7xl md:mx-auto md:px-4 md:px-8 md:h-full md:relative">
            {/* Priority Legend — aligned left */}
            <div className="hidden md:block md:absolute md:bottom-3 md:left-0 md:pointer-events-auto">
              <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-300 shadow-md text-xs space-y-1">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                  {t('mapLegendTitle')}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-red inline-block" />
                  <span className="text-slate-700">{t('mapLegendCritical')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                  <span className="text-slate-700">{t('mapLegendHigh')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow inline-block" />
                  <span className="text-slate-700">{t('mapLegendMedium')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span className="text-slate-700">{t('mapLegendLow')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  <span className="text-slate-700">{t('mapLegendAcopio')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  <span className="text-slate-700">{t('mapLegendOffer')}</span>
                </div>
              </div>
            </div>

            {/* Cards panel — aligned right */}
            <div className="p-3 pb-20 md:pb-0 md:p-0 md:absolute md:top-3 md:right-0 md:bottom-3 md:w-[380px] lg:w-[420px] md:pointer-events-auto">
          <div className="p-3 md:p-0 space-y-3 md:h-full md:flex md:flex-col">
            <div className="flex items-center justify-between bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 md:shadow-md md:border md:border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 leading-none">
                <span>
                  {filters.viewMode === "OFFERS"
                    ? `Ofertas disponibles${selectedCityId !== ALL_COLOMBIA_ID ? ` en ${getCityDisplayName(selectedCityId)}` : ''}`
                    : filters.viewMode === "ALL"
                    ? `Necesidades y ofertas${selectedCityId !== ALL_COLOMBIA_ID ? ` en ${getCityDisplayName(selectedCityId)}` : ''}`
                    : `Necesidades activas${selectedCityId !== ALL_COLOMBIA_ID ? ` en ${getCityDisplayName(selectedCityId)}` : ''}`
                  }
                </span>
                <span className="bg-slate-800 text-white text-[11px] px-2 py-0.5 rounded-full font-bold leading-none">
                  {filters.viewMode === "OFFERS" ? displayedOffers.length : filters.viewMode === "ALL" ? displayedNeeds.length + displayedOffers.length : displayedNeeds.length}
                </span>
              </h3>
            </div>

            {/* Distance sort prompt when no geolocation */}
            {filters.sortBy === "DISTANCE" && !filters.userLat && !filters.userLng && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Para ordenar por distancia, activa tu ubicación desde el selector de ciudad.</span>
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
            ) : (filters.viewMode === "NEEDS" && displayedNeeds.length === 0) ||
                (filters.viewMode === "OFFERS" && displayedOffers.length === 0) ||
                (filters.viewMode === "ALL" && displayedNeeds.length === 0 && displayedOffers.length === 0) ? (
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
              <div className="space-y-3 md:overflow-y-auto md:flex-1 md:max-h-[calc(100vh-280px)] md:pr-1 cards-scroll">
                {/* ViewMode: NEEDS — only needs */}
                {filters.viewMode === "NEEDS" && displayedNeeds.map((need) => (
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
                {filters.viewMode === "OFFERS" && displayedOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onClick={() => handleSelectOffer(offer)}
                  />
                ))}

                {/* ViewMode: ALL — sectioned: needs then offers */}
                {filters.viewMode === "ALL" && (
                  <>
                    {displayedNeeds.length > 0 && (
                      <>
                        {displayedNeeds.map((need) => (
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
                    {displayedOffers.length > 0 && (
                      <>
                        {displayedOffers.map((offer) => (
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
        onClose={() => { handleSelectNeed(null); }}
        shareUrl={selectedNeed ? getNeedUrl(selectedNeed) : undefined}
        onOpenQuieroAyudar={(need) => setSelectedForHelp(need)}
        onOpenReportModal={(need) => setSelectedForReport(need)}
        onOpenPublicEdit={(need) => setSelectedForPublicEdit(need)}
        onOpenUpdateStatusModal={(need) => setSelectedForStatusUpdate(need)}
        isModeratorLoggedIn={isModeratorLoggedIn}
        isAdmin={isAdminUser}
        onAdminEditNeed={(need) => {
          handleSelectNeed(null);
          setSelectedForPublicEdit(need);
        }}
        onAdminChangePriority={(need) => {
          handleSelectNeed(null);
          setSelectedForPublicEdit(need);
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
        initialCityId={selectedCityId !== ALL_COLOMBIA_ID ? selectedCityId : 'cali'}
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

      <CreateOfferModal
        isOpen={showCreateOffer}
        onClose={() => setShowCreateOffer(false)}
        selectedCityId={selectedCityId !== ALL_COLOMBIA_ID ? selectedCityId : 'cali'}
      />

      <OfferDetailModal
        offer={selectedOffer}
        isOpen={!!selectedOffer}
        onClose={() => { handleSelectOffer(null); }}
        shareUrl={selectedOffer ? getOfferUrl(selectedOffer) : undefined}
        isModeratorLoggedIn={isModeratorLoggedIn}
        isAdmin={isAdminUser}
        onOpenPublicEdit={(offer) => setSelectedOfferForEdit(offer)}
        onAdminEditOffer={(offer) => setSelectedOfferForEdit(offer)}
      />

      {/* Footer — temporarily removed (file preserved for future use) */}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden">
        <MobileBottomBar
          mobileView={mobileView}
          onSetMobileView={setMobileView}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenCreateOfferModal={() => setShowCreateOffer(true)}
          onOpenAdminModal={() => { window.location.href = '/panel'; }}
          onScrollToMap={() => {
            setFilters((f) => ({ ...f, viewMode: "NEEDS" }));
            setMobileView("MAP");
            setTimeout(() => {
              mainContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          listCount={needs.length + offers.length}
        />
      </div>
    </div>
  );
}
