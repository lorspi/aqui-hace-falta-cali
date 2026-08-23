/**
 * Aquí Hace Falta - Plataforma Ciudadana de Coordinación de Ayuda (Cali)
 * Main Application Component — Convex Backend
 */

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { showAlert } from "./components/ConfirmDialog";
import { useNeeds, useOffers, useCityCounts, createNeed, submitNeedReport, addNeedUpdateNote, getNeedById, getOfferById, updateNeed } from "./lib/supabaseService";
import {
  Map,
  List,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  Maximize2,
  Minimize2,
  Info,
  ChevronUp,
  ChevronDown,
  Navigation,
} from "lucide-react";
import { FilterState, Need, NeedStatus, Offer, Priority } from "./types";
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
import { RegisterWizard } from "./features/auth/components/RegisterWizard";
import { PublicEditOfferModal } from "./components/PublicEditOfferModal";
import { UpdateStatusModal } from "./components/UpdateStatusModal";
import { MobileBottomBar } from "./components/MobileBottomBar";
// Lazy-loaded pages for code-splitting
const ModeradorPage = lazy(() => import("./components/ModeradorPage").then(m => ({ default: m.ModeradorPage })));
const AdminPanelPage = lazy(() => import("./components/AdminPanelPage").then(m => ({ default: m.AdminPanelPage })));
const SocialCardView = lazy(() => import("./components/SocialCardView").then(m => ({ default: m.SocialCardView })));
const LandingHomePage = lazy(() => import("./components/LandingHomePage").then(m => ({ default: m.LandingHomePage })));
const LegalPage = lazy(() => import("./components/LegalPage").then(m => ({ default: m.LegalPage })));
import terminosMd from "./content/terminos.md?raw";
import privacidadMd from "./content/privacidad.md?raw";
import { WelcomeOnboardingModal } from "./components/WelcomeOnboardingModal";
import { RadarMatchModal } from "./components/RadarMatchModal";
import { ALL_COLOMBIA_ID, findCityById, findDepartmentById, getCityDisplayName, getCityCoordinates, detectCityFromCoords } from "./data/colombiaCities";
import { useTranslation } from "./i18n/LanguageContext";

import { DevEnvironmentBanner } from "./components/DevEnvironmentBanner";

interface ParsedRoute {
  cityId: string;
  departmentId?: string;
  needId?: string;
  offerId?: string;
}

function parseUrlPath(pathname: string): ParsedRoute {
  const parts = pathname.replace(/^\//, '').replace(/\/$/, '').split('/').filter(Boolean);
  if (parts.length === 0) {
    return { cityId: ALL_COLOMBIA_ID };
  }

  // 1. Check if first segment is a department slug (e.g. /quindio/armenia...)
  const deptMatch = findDepartmentById(parts[0]);
  if (deptMatch && parts.length >= 2) {
    const departmentId = deptMatch.id;
    const citySlug = parts[1];
    const cityMatch = findCityById(citySlug, departmentId);
    const cityId = cityMatch ? cityMatch.id : citySlug;

    // Format: /dept/city/offer/:offerId OR /dept/city/:needId
    if (parts.length >= 4 && parts[2] === 'offer') {
      return { departmentId, cityId, offerId: parts[3] };
    }
    if (parts.length >= 3 && parts[2] !== 'offer') {
      return { departmentId, cityId, needId: parts[2] };
    }
    return { departmentId, cityId };
  }

  // 2. Otherwise, first segment is city slug (e.g. /medellin/offer/:offerId or /armenia/:needId)
  const citySlug = parts[0];
  if (!citySlug || citySlug === ALL_COLOMBIA_ID) return { cityId: ALL_COLOMBIA_ID };
  const cityMatch = findCityById(citySlug);
  const cityId = cityMatch ? cityMatch.id : citySlug;

  // Format: /city/offer/:offerId OR /city/:needId
  if (parts.length >= 3 && parts[1] === 'offer') {
    return { cityId, offerId: parts[2] };
  }
  if (parts.length >= 2 && parts[1] !== 'offer') {
    return { cityId, needId: parts[1] };
  }

  return { cityId };
}

// Check if current path is a static page or special view
function getSpecialRoute(): { type: 'guia' } | { type: 'moderador' } | { type: 'panel' } | { type: 'terminos' } | { type: 'privacidad' } | { type: 'social'; needId: string; format: 'post' | 'story' } | null {
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  if (path === 'guia') return { type: 'guia' };
  if (path === 'moderador') return { type: 'moderador' };
  if (path === 'panel') return { type: 'panel' };
  if (path === 'terminos') return { type: 'terminos' };
  if (path === 'privacidad') return { type: 'privacidad' };

  // Check for /.../:needId/post or /.../:needId/story
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 3 && (parts[parts.length - 1] === 'post' || parts[parts.length - 1] === 'story')) {
    return { type: 'social', needId: parts[parts.length - 2], format: parts[parts.length - 1] as 'post' | 'story' };
  }
  return null;
}

export default function App() {
  const specialRoute = getSpecialRoute();

  let content = <MainApp />;
  if (specialRoute?.type === 'guia') {
    content = <LandingHomePage />;
  } else if (specialRoute?.type === 'moderador') {
    content = <ModeradorPage />;
  } else if (specialRoute?.type === 'panel') {
    content = <AdminPanelPage />;
  } else if (specialRoute?.type === 'terminos') {
    content = <LegalPage markdown={terminosMd} />;
  } else if (specialRoute?.type === 'privacidad') {
    content = <LegalPage markdown={privacidadMd} />;
  } else if (specialRoute?.type === 'social') {
    content = <SocialCardView needId={specialRoute.needId} format={specialRoute.format} />;
  }

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-[#F5F6F9] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#1B3A93] border-t-transparent rounded-full animate-spin" /></div>}>
        {content}
      </Suspense>
      <DevEnvironmentBanner />
    </>
  );
}

function MainApp() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const sessionUser = typeof window !== 'undefined' && localStorage.getItem('ahf_admin_token')
    ? (() => {
        const saved = localStorage.getItem('ahf_admin_user');
        if (saved) {
          try { return JSON.parse(saved); } catch { return { name: 'Moderador' }; }
        }
        return { name: 'Moderador' };
      })()
    : null;

  // Parse current URL path
  const [routeInfo] = useState<ParsedRoute>(() => parseUrlPath(window.location.pathname));
  const [initialNeedId] = useState<string | null>(routeInfo.needId || null);
  const [initialOfferId] = useState<string | null>(routeInfo.offerId || null);

  // Selected city/municipality — read initial value from parsed route
  const [selectedCityId, setSelectedCityId] = useState<string>(routeInfo.cityId);

  // Track whether the city change came from the selector or from map panning
  const [cityChangeSource, setCityChangeSource] = useState<'selector' | 'map' | 'init'>('init');

  // Build current URL base for the city (includes department context for homonymous/non-default cities)
  const getCityPath = (cityId: string) => {
    if (cityId === ALL_COLOMBIA_ID) return '/';
    const city = findCityById(cityId);
    if (city && city.departmentId && (city.departmentId === 'quindio' || city.departmentId === 'antioquia')) {
      return `/${city.departmentId}/${city.id}`;
    }
    return `/${cityId}`;
  };

  // Sync URL when city changes
  const handleCityChange = (cityId: string) => {
    setCityChangeSource('selector');
    setSelectedCityId(cityId);
    if (!selectedNeedRef.current) {
      window.history.replaceState(null, '', getCityPath(cityId));
    }
    const cityName = getCityDisplayName(cityId);
    document.title = cityId === ALL_COLOMBIA_ID
      ? 'Aquí Hace Falta — Colombia'
      : `Aquí Hace Falta — ${cityName}`;
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
  const [mobileView, setMobileView] = useState<"LIST" | "MAP">("MAP");

  // Map Legend state (minimized by default)
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Cross-highlight between map pins and cards
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Desktop expanded grid view (list takes full width, map hidden)
  const [isGridExpanded, setIsGridExpanded] = useState(false);

  // Auto-scroll to highlighted card when hovering a pin on the map
  useEffect(() => {
    if (!hoveredItemId) return;
    // Only on desktop — avoid scroll interference on mobile
    if (window.innerWidth < 768) return;
    const cardEl =
      document.getElementById(`need-card-${hoveredItemId}`) ||
      document.getElementById(`offer-card-${hoveredItemId}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hoveredItemId]);

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
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [radarMatchState, setRadarMatchState] = useState<{
    isOpen: boolean;
    type: 'NEED_PUBLISHED' | 'OFFER_PUBLISHED' | null;
    item: Need | Offer | null;
  }>({
    isOpen: false,
    type: null,
    item: null,
  });
  const [targetFocusCoords, setTargetFocusCoords] = useState<{
    lat: number;
    lng: number;
    id: string;
    timestamp: number;
  } | null>(null);

  const handleViewOnMap = (item: Need | Offer) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileView('MAP');
    }
    setHoveredItemId(item.id);
    if (item.latitude && item.longitude) {
      setTargetFocusCoords({
        lat: item.latitude,
        lng: item.longitude,
        id: item.id,
        timestamp: Date.now(),
      });
    }
  };

  // Auto-open welcome onboarding modal on first-time visit
  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('radar_has_seen_onboarding');
      if (!hasSeen) {
        setIsWelcomeModalOpen(true);
      }
    } catch (e) {
      console.warn('LocalStorage not available', e);
    }
  }, []);

  // Check if a moderator or admin is logged in
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("ahf_admin_token") : null;
  const isModeratorLoggedIn = !!localStorage.getItem("ahf_admin_token");
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
  const fetchFilters = useMemo(() => ({ ...filters, viewMode: 'ALL' as const }), [filters]);
  const { needs, loading: needsLoading, refetch: refetchNeeds } = useNeeds(fetchFilters, selectedCityId);
  const { offers, loading: offersLoading, refetch: refetchOffers } = useOffers(fetchFilters, selectedCityId);

  // Combined counts (needs + offers) per city for the city selector
  const combinedCounts = useMemo(() => {
    const combined: Record<string, number> = { ...needCounts };
    for (const [city, count] of Object.entries(offerCounts)) {
      combined[city] = (combined[city] || 0) + count;
    }
    return combined;
  }, [needCounts, offerCounts]);

  // Priority rank helper
  const PRIORITY_ORDER: Record<Priority, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  // Filtered and sorted needs for list view (cards list)
  const displayedNeeds = useMemo(() => {
    let filtered = needs;
    if (selectedCityId && selectedCityId !== ALL_COLOMBIA_ID && selectedCityId !== 'ALL_COLOMBIA' && selectedCityId !== 'todo-colombia') {
      const cleanSel = selectedCityId.toLowerCase().trim();
      filtered = needs.filter((n) => {
        const cId = (n.cityId || '').toLowerCase();
        const neigh = (n.neighborhood || '').toLowerCase();
        return cId === cleanSel || cId.includes(cleanSel) || neigh.includes(cleanSel);
      });
    }

    const copy = [...filtered];

    if (filters.sortBy === 'PRIORITY') {
      copy.sort((a, b) => {
        const pA = PRIORITY_ORDER[a.priority] || 0;
        const pB = PRIORITY_ORDER[b.priority] || 0;
        if (pB !== pA) return pB - pA;
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
      });
    } else if (filters.sortBy === 'RECENT') {
      copy.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const validTA = isNaN(tA) ? 0 : tA;
        const validTB = isNaN(tB) ? 0 : tB;
        if (validTB !== validTA) return validTB - validTA;
        const pA = PRIORITY_ORDER[a.priority] || 0;
        const pB = PRIORITY_ORDER[b.priority] || 0;
        return pB - pA;
      });
    } else if (filters.sortBy === 'DISTANCE') {
      const refLat = filters.userLat ?? (selectedCityId && selectedCityId !== ALL_COLOMBIA_ID ? getCityCoordinates(selectedCityId, routeInfo.departmentId).lat : null);
      const refLng = filters.userLng ?? (selectedCityId && selectedCityId !== ALL_COLOMBIA_ID ? getCityCoordinates(selectedCityId, routeInfo.departmentId).lng : null);

      if (refLat != null && refLng != null) {
        const calculateKm = (lat: number, lng: number) => {
          const R = 6371;
          const dLat = ((lat - refLat) * Math.PI) / 180;
          const dLon = ((lng - refLng) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos((refLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        copy.sort((a, b) => {
          const distA = typeof a.latitude === 'number' && typeof a.longitude === 'number' ? calculateKm(a.latitude, a.longitude) : Infinity;
          const distB = typeof b.latitude === 'number' && typeof b.longitude === 'number' ? calculateKm(b.latitude, b.longitude) : Infinity;
          if (distA !== distB) return distA - distB;
          const pA = PRIORITY_ORDER[a.priority] || 0;
          const pB = PRIORITY_ORDER[b.priority] || 0;
          return pB - pA;
        });
      } else {
        copy.sort((a, b) => (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0));
      }
    }

    return copy;
  }, [needs, selectedCityId, filters.sortBy, filters.userLat, filters.userLng, routeInfo.departmentId]);

  // Filtered and sorted offers for list view (cards list)
  const displayedOffers = useMemo(() => {
    let filtered = offers;
    if (selectedCityId && selectedCityId !== ALL_COLOMBIA_ID && selectedCityId !== 'ALL_COLOMBIA' && selectedCityId !== 'todo-colombia') {
      const cleanSel = selectedCityId.toLowerCase().trim();
      filtered = offers.filter((o) => {
        const cId = (o.cityId || '').toLowerCase();
        const neigh = (o.neighborhood || '').toLowerCase();
        return cId === cleanSel || cId.includes(cleanSel) || neigh.includes(cleanSel);
      });
    }

    const copy = [...filtered];

    if (filters.sortBy === 'RECENT') {
      copy.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
      });
    } else if (filters.sortBy === 'DISTANCE') {
      const refLat = filters.userLat ?? (selectedCityId && selectedCityId !== ALL_COLOMBIA_ID ? getCityCoordinates(selectedCityId, routeInfo.departmentId).lat : null);
      const refLng = filters.userLng ?? (selectedCityId && selectedCityId !== ALL_COLOMBIA_ID ? getCityCoordinates(selectedCityId, routeInfo.departmentId).lng : null);

      if (refLat != null && refLng != null) {
        const calculateKm = (lat: number, lng: number) => {
          const R = 6371;
          const dLat = ((lat - refLat) * Math.PI) / 180;
          const dLon = ((lng - refLng) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos((refLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        copy.sort((a, b) => {
          const distA = typeof a.latitude === 'number' && typeof a.longitude === 'number' ? calculateKm(a.latitude, a.longitude) : Infinity;
          const distB = typeof b.latitude === 'number' && typeof b.longitude === 'number' ? calculateKm(b.latitude, b.longitude) : Infinity;
          return distA - distB;
        });
      } else {
        copy.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
        });
      }
    } else {
      // PRIORITY or default for offers: newest first
      copy.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
      });
    }

    return copy;
  }, [offers, selectedCityId, filters.sortBy, filters.userLat, filters.userLng, routeInfo.departmentId]);

  const totalNeedsCount = displayedNeeds.length;
  const totalOffersCount = displayedOffers.length;

  // Nearest publications when current city has 0 results
  const closestItems = useMemo(() => {
    const isNoResults =
      (filters.viewMode === "NEEDS" && displayedNeeds.length === 0) ||
      (filters.viewMode === "OFFERS" && displayedOffers.length === 0) ||
      (filters.viewMode === "ALL" && displayedNeeds.length === 0 && displayedOffers.length === 0);

    if (!isNoResults || !selectedCityId || selectedCityId === ALL_COLOMBIA_ID) return [];

    const cityCoords = getCityCoordinates(selectedCityId, routeInfo.departmentId);

    const calculateDistance = (lat: number, lng: number) => {
      const R = 6371; // Earth radius in km
      const dLat = ((lat - cityCoords.lat) * Math.PI) / 180;
      const dLon = ((lng - cityCoords.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((cityCoords.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const combined: Array<
      | { type: 'need'; item: Need; distanceKm: number }
      | { type: 'offer'; item: Offer; distanceKm: number }
    > = [];

    if (filters.viewMode !== "OFFERS") {
      needs.forEach((n) => {
        if (n.latitude && n.longitude) {
          combined.push({
            type: 'need',
            item: n,
            distanceKm: calculateDistance(n.latitude, n.longitude),
          });
        }
      });
    }

    if (filters.viewMode !== "NEEDS") {
      offers.forEach((o) => {
        if (o.latitude && o.longitude) {
          combined.push({
            type: 'offer',
            item: o,
            distanceKm: calculateDistance(o.latitude, o.longitude),
          });
        }
      });
    }

    combined.sort((a, b) => a.distanceKm - b.distanceKm);
    return combined.slice(0, 10); // Show top 10 closest
  }, [needs, offers, displayedNeeds.length, displayedOffers.length, filters.viewMode, selectedCityId, routeInfo.departmentId]);

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

  // Helper to build URL prefix for a city/department
  const getItemUrlPrefix = (cityId: string, departmentId?: string) => {
    const city = findCityById(cityId, departmentId);
    if (city && city.departmentId && (city.departmentId === 'quindio' || city.departmentId === 'antioquia')) {
      return `${city.departmentId}/${city.id}`;
    }
    return cityId || selectedCityId;
  };

  // Build shareable URL for a need
  const getNeedUrl = (need: Need) => {
    const prefix = getItemUrlPrefix(need.cityId, need.departmentId);
    const base = window.location.origin;
    return `${base}/${prefix}/${need.id}`;
  };

  // Update URL when opening/closing need detail
  const selectedNeedRef = useRef<Need | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const handleSelectNeed = (need: Need | null) => {
    selectedNeedRef.current = need;
    setSelectedNeed(need);
    if (need) {
      const prefix = getItemUrlPrefix(need.cityId, need.departmentId);
      window.history.replaceState(null, '', `/${prefix}/${need.id}`);
    } else {
      window.history.replaceState(null, '', getCityPath(selectedCityId));
    }
  };

  // Build shareable URL for an offer
  const getOfferUrl = (offer: Offer) => {
    const prefix = getItemUrlPrefix(offer.cityId, offer.departmentId);
    const base = window.location.origin;
    return `${base}/${prefix}/offer/${offer.id}`;
  };

  // Update URL when opening/closing offer detail
  const handleSelectOffer = (offer: Offer | null) => {
    setSelectedOffer(offer);
    if (offer) {
      const prefix = getItemUrlPrefix(offer.cityId, offer.departmentId);
      window.history.replaceState(null, '', `/${prefix}/offer/${offer.id}`);
    } else {
      window.history.replaceState(null, '', getCityPath(selectedCityId));
    }
  };

  const reports = useMemo(() => [], []);
  const auditLogs = useMemo(() => [], []);

  const isLoading = needsLoading || offersLoading;
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
      setCityChangeSource('map');
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
      const createdNeed = await createNeed({
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

      if (refetchNeeds) await refetchNeeds();

      const targetCity = createdNeed?.cityId || data.cityId;
      if (targetCity && targetCity !== selectedCityId) {
        handleCityChange(targetCity);
      }

      setFilters((prev) => ({ ...prev, viewMode: 'NEEDS' }));

      if (createdNeed?.id) {
        setHoveredItemId(createdNeed.id);
        setRadarMatchState({
          isOpen: true,
          type: 'NEED_PUBLISHED',
          item: createdNeed,
        });
      }
    } catch (err: any) {
      console.error("❌ Error al crear necesidad:", err);
      const msg = err?.message || err?.details || String(err);
      showAlert(`Error al guardar la necesidad:\n${msg}`, { title: "Error al guardar", variant: "error" });
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Create Offer Success Callback
  const handleOfferCreated = async (createdOffer: Offer) => {
    if (refetchOffers) await refetchOffers();

    const targetCity = createdOffer.cityId;
    if (targetCity && targetCity !== selectedCityId) {
      handleCityChange(targetCity);
    }

    setFilters((prev) => ({ ...prev, viewMode: 'OFFERS' }));

    if (createdOffer?.id) {
      setHoveredItemId(createdOffer.id);
      setRadarMatchState({
        isOpen: true,
        type: 'OFFER_PUBLISHED',
        item: createdOffer,
      });
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
    } catch (e: any) {
      console.error("❌ Error al enviar reporte:", e);
      const msg = e?.message || e?.details || String(e);
      showAlert(`Error al enviar el reporte:\n${msg}`, { title: "Error", variant: "error" });
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
      const isMod = isModeratorLoggedIn || isAdminUser;
      const modName = (sessionUser as any)?.name || 'Moderador';
      
      const finalUpdatedBy = isMod
        ? (updatedBy.startsWith('[MOD] ') ? updatedBy : `[MOD] ${updatedBy || modName}`)
        : (updatedBy.trim() || 'Ciudadano anónimo');

      const descText = note.trim()
        ? note.trim()
        : `Cambio de estado a ${newStatus}`;

      await addNeedUpdateNote({
        needId,
        previousStatus: need?.status || 'NEED_HELP_NOW',
        newStatus,
        description: descText,
        updatedBy: finalUpdatedBy,
      });

      if (need) {
        await updateNeed(needId, { status: newStatus, lastUpdatedBy: finalUpdatedBy });
      }

      showAlert("¡Operación exitosa!", { title: "Éxito", variant: "success" });
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
    <div className={`min-h-screen md:h-screen md:max-h-screen md:overflow-hidden bg-brand-surface flex flex-col text-brand-text antialiased ${
      mobileView === 'MAP' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : ''
    }`}>
      {/* Platform Header */}
      <Header
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenCreateOfferModal={() => setShowCreateOffer(true)}
        onOpenAdminModal={() => { window.location.href = '/panel'; }}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenWelcomeModal={() => setIsWelcomeModalOpen(true)}
        onScrollToMap={() => {
          setFilters((f) => ({ ...f, viewMode: "NEEDS" }));
          setMobileView("MAP");
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        lastUpdated={lastUpdated}
        isOffline={isOffline}
        activeCount={activeCount}
        criticalCount={criticalCount}
        isLoggedIn={isModeratorLoggedIn}
        userName={(sessionUser as any)?.name}
        onLogout={() => {
          localStorage.removeItem('ahf_admin_token');
          localStorage.removeItem('ahf_admin_user');
          window.location.reload();
        }}
      />
      {/* Spacer for fixed header */}
      <div className="h-[56px] md:h-[64px] shrink-0" />

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
        totalResults={filters.viewMode === "OFFERS" ? displayedOffers.length : filters.viewMode === "NEEDS" ? displayedNeeds.length : displayedNeeds.length + displayedOffers.length}
        selectedCityName={selectedCityId === ALL_COLOMBIA_ID ? 'la zona' : getCityDisplayName(selectedCityId)}
        needsCount={totalNeedsCount}
        offersCount={totalOffersCount}
        selectedCityId={selectedCityId}
        onCityChange={handleCityChange}
        needCounts={combinedCounts}
        mobileView={mobileView}
        needs={needs}
        offers={offers}
      />


      {/* Main Content Layout — Split panel on desktop, toggle on mobile */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0 pb-16 md:pb-0" ref={mainContentRef}>
        {/* MAP PANEL — 60% width on desktop, full width toggle on mobile */}
        <div
          id="mobile-map-anchor"
          className={`w-full md:w-[60%] lg:w-[65%] md:h-full relative ${
            mobileView === "MAP" ? "flex-1 min-h-0 h-full block" : "hidden md:block"
          } ${isGridExpanded ? "md:hidden" : ""}`}
        >
          <MapView
            needs={needs}
            selectedNeedId={selectedNeed?.id}
            onSelectNeed={(need) => handleSelectNeed(need)}
            userLat={filters.userLat}
            userLng={filters.userLng}
            selectedCityId={selectedCityId}
            cityChangeSource={cityChangeSource}
            onMapCenterChanged={handleMapCenterChanged}
            offers={offers}
            viewMode={filters.viewMode}
            onSelectOffer={(offer) => handleSelectOffer(offer)}
            hoveredItemId={hoveredItemId}
            onHoverMarker={setHoveredItemId}
            targetFocusCoords={targetFocusCoords}
          />

          {/* Priority Legend — bottom-left over map */}
          <div className="absolute bottom-3 left-3 z-20">
            {/* Minimized button */}
            {!isLegendExpanded && (
              <button
                onClick={() => setIsLegendExpanded(true)}
                className="flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-md text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{t('mapLegendTitle')}</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
              </button>
            )}

            {/* Expanded Legend box (collapsible on desktop & mobile) */}
            {isLegendExpanded && (
              <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-300 shadow-md text-xs space-y-1 block animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    {t('mapLegendTitle')}
                  </div>
                  <button
                    onClick={() => setIsLegendExpanded(false)}
                    className="p-0.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                    title="Minimizar leyenda"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
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
            )}
          </div>
        </div>

        {/* LIST PANEL — 40% width on desktop (or full width when expanded), full width toggle on mobile */}
        <div
          id="mobile-list-anchor"
          className={`w-full ${isGridExpanded ? "md:w-full" : "md:w-[40%] lg:w-[35%]"} md:h-full md:border-l md:border-slate-200 bg-white md:bg-slate-50 ${
            mobileView === "LIST" ? "flex flex-col" : "hidden md:flex md:flex-col"
          } ${isGridExpanded ? "md:border-l-0" : ""}`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white shrink-0">
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
            {/* Expand/Collapse button — desktop only */}
            <button
              onClick={() => setIsGridExpanded((v) => !v)}
              className="hidden md:flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title={isGridExpanded ? "Volver a vista dividida" : "Expandir lista"}
            >
              {isGridExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Distance sort prompt when no geolocation */}
          {filters.sortBy === "DISTANCE" && !filters.userLat && !filters.userLng && (
            <div className="mx-3 mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-center gap-2 shrink-0">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Para ordenar por distancia, activa tu ubicación desde el selector de ciudad.</span>
            </div>
          )}

          {/* Cards list — scrollable */}
          <div className={`flex-1 overflow-y-auto p-3 pb-20 md:pb-3 cards-scroll ${isGridExpanded ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max" : "space-y-3"}`}>
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
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-100/80 rounded-lg shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        No se encontraron resultados
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        No hay coincidencias en los filtros seleccionados.
                      </p>
                    </div>
                  </div>
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
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-slate-200 shrink-0 transition-colors cursor-pointer w-full sm:w-auto text-center"
                  >
                    Limpiar filtros
                  </button>
                </div>

                {closestItems.length > 0 && (
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center gap-2 px-1 pt-2">
                      <Navigation className="w-4 h-4 text-indigo-600 shrink-0" />
                      <h4 className="font-bold text-slate-800 text-xs">
                        Publicaciones más cercanas a {getCityDisplayName(selectedCityId, routeInfo.departmentId)}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {closestItems.map(({ type, item, distanceKm }) => {
                        const cityCoords = getCityCoordinates(selectedCityId, routeInfo.departmentId);
                        return type === 'need' ? (
                          <NeedCard
                            key={item.id}
                            need={item as Need}
                            onSelect={(n) => handleSelectNeed(n)}
                            onHelp={(n) => setSelectedForHelp(n)}
                            onViewOnMap={(n) => handleViewOnMap(n)}
                            userLat={cityCoords.lat}
                            userLng={cityCoords.lng}
                            isSelected={selectedNeed?.id === item.id}
                            isHighlighted={!isGridExpanded && hoveredItemId === item.id}
                            onHover={isGridExpanded ? undefined : setHoveredItemId}
                          />
                        ) : (
                          <OfferCard
                            key={item.id}
                            offer={item as Offer}
                            onClick={() => handleSelectOffer(item as Offer)}
                            onViewOnMap={(o) => handleViewOnMap(o)}
                            isHighlighted={!isGridExpanded && hoveredItemId === item.id}
                            onHover={isGridExpanded ? undefined : setHoveredItemId}
                            distanceKm={distanceKm}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* ViewMode: NEEDS — only needs */}
                {filters.viewMode === "NEEDS" && displayedNeeds.map((need) => (
                  <NeedCard
                    key={need.id}
                    need={need}
                    onSelect={(item) => handleSelectNeed(item)}
                    onHelp={(item) => setSelectedForHelp(item)}
                    onViewOnMap={(item) => handleViewOnMap(item)}
                    userLat={filters.userLat}
                    userLng={filters.userLng}
                    isSelected={selectedNeed?.id === need.id}
                    isHighlighted={!isGridExpanded && hoveredItemId === need.id}
                    onHover={isGridExpanded ? undefined : setHoveredItemId}
                  />
                ))}

                {/* ViewMode: OFFERS — only offers */}
                {filters.viewMode === "OFFERS" && displayedOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onClick={() => handleSelectOffer(offer)}
                    onViewOnMap={(item) => handleViewOnMap(item)}
                    isHighlighted={!isGridExpanded && hoveredItemId === offer.id}
                    onHover={isGridExpanded ? undefined : setHoveredItemId}
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
                            onViewOnMap={(item) => handleViewOnMap(item)}
                            userLat={filters.userLat}
                            userLng={filters.userLng}
                            isSelected={selectedNeed?.id === need.id}
                            isHighlighted={!isGridExpanded && hoveredItemId === need.id}
                            onHover={isGridExpanded ? undefined : setHoveredItemId}
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
                            onViewOnMap={(item) => handleViewOnMap(item)}
                            isHighlighted={!isGridExpanded && hoveredItemId === offer.id}
                            onHover={isGridExpanded ? undefined : setHoveredItemId}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </>
            )}
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
        onSelectOffer={(offer) => {
          handleSelectNeed(null);
          handleSelectOffer(offer);
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
        initialCityId={selectedCityId !== ALL_COLOMBIA_ID ? selectedCityId : ''}
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
        moderatorName={isModeratorLoggedIn || isAdminUser ? ((sessionUser as any)?.name || 'Juan Perez') : undefined}
      />

      <CreateOfferModal
        isOpen={showCreateOffer}
        onClose={() => setShowCreateOffer(false)}
        onSuccess={handleOfferCreated}
        selectedCityId={selectedCityId !== ALL_COLOMBIA_ID ? selectedCityId : ''}
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
        onSelectNeed={(need) => {
          handleSelectOffer(null);
          handleSelectNeed(need);
        }}
      />

      <WelcomeOnboardingModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        onOpenCreateNeed={() => setIsCreateModalOpen(true)}
        onOpenCreateOffer={() => setShowCreateOffer(true)}
      />

      <RadarMatchModal
        isOpen={radarMatchState.isOpen}
        onClose={() => setRadarMatchState((prev) => ({ ...prev, isOpen: false }))}
        type={radarMatchState.type}
        item={radarMatchState.item}
        onSelectNeed={(need) => {
          setSelectedNeed(need);
        }}
        onSelectOffer={(offer) => {
          setSelectedOffer(offer);
        }}
      />

      {/* Footer — temporarily removed (file preserved for future use) */}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden">
        <MobileBottomBar
          mobileView={mobileView}
          onSetMobileView={setMobileView}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenCreateOfferModal={() => setShowCreateOffer(true)}
          onOpenWelcomeModal={() => setIsWelcomeModalOpen(true)}
          onOpenAdminModal={() => { window.location.href = '/panel'; }}
          onScrollToMap={() => {
            setFilters((f) => ({ ...f, viewMode: "NEEDS" }));
            setMobileView("MAP");
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          listCount={needs.length + offers.length}
          isLoggedIn={isModeratorLoggedIn}
          userName={(sessionUser as any)?.name}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          onLogout={() => {
            localStorage.removeItem('ahf_admin_token');
            localStorage.removeItem('ahf_admin_user');
            window.location.reload();
          }}
        />
      </div>
      <RegisterWizard
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
}
