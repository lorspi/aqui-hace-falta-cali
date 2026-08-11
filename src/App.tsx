/**
 * Aquí Hace Falta - Plataforma Ciudadana de Coordinación de Ayuda (Cali)
 * Main Application Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Map, List, HeartHandshake, PlusCircle, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AuditLog, FilterState, Need, NeedStatus, Report } from './types';
import { Header } from './components/Header';
import { BannerDisclaimer } from './components/BannerDisclaimer';
import { FilterBar } from './components/FilterBar';
import { MapView } from './components/MapView';
import { NeedCard } from './components/NeedCard';
import { NeedDetailModal } from './components/NeedDetailModal';
import { QuieroAyudarModal } from './components/QuieroAyudarModal';
import { CreateNeedModal } from './components/CreateNeedModal';
import { ReportModal } from './components/ReportModal';
import { UpdateStatusModal } from './components/UpdateStatusModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';

export default function App() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<string>('Hace un instante');

  // Mobile View Mode ('LIST' | 'MAP')
  const [mobileView, setMobileView] = useState<'LIST' | 'MAP'>('LIST');

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    priority: 'ALL',
    placeType: 'ALL',
    status: 'ALL',
    verificationStatus: 'ALL',
    distanceKm: null,
    userLat: null,
    userLng: null,
    sortBy: 'PRIORITY',
  });

  // Selected need for detail modal
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [selectedForHelp, setSelectedForHelp] = useState<Need | null>(null);
  const [selectedForReport, setSelectedForReport] = useState<Need | null>(null);
  const [selectedForStatusUpdate, setSelectedForStatusUpdate] = useState<Need | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Needs from Backend
  const fetchNeeds = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.priority !== 'ALL') params.append('priority', filters.priority);
      if (filters.placeType !== 'ALL') params.append('placeType', filters.placeType);
      if (filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.verificationStatus !== 'ALL') params.append('verificationStatus', filters.verificationStatus);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      filters.categories.forEach((c) => params.append('category', c));

      if (filters.userLat && filters.userLng && filters.distanceKm) {
        params.append('userLat', String(filters.userLat));
        params.append('userLng', String(filters.userLng));
        params.append('distanceKm', String(filters.distanceKm));
      }

      const res = await fetch(`/api/needs?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setNeeds(json.data || []);
        // Cache in localStorage for offline tolerance
        localStorage.setItem('cached_needs_cali', JSON.stringify(json.data || []));
        setLastUpdated(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Network error, using offline cached data:', err);
      const cached = localStorage.getItem('cached_needs_cali');
      if (cached) {
        setNeeds(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchNeeds();
  }, [fetchNeeds]);

  // Fetch Admin Data
  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/needs');
      if (res.ok) {
        const json = await res.json();
        setReports(json.reports || []);
        setAuditLogs(json.auditLogs || []);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    if (isAdminModalOpen) {
      fetchAdminData();
    }
  }, [isAdminModalOpen]);

  // Geolocation Request with explanation
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFilters((prev) => ({
          ...prev,
          userLat: pos.coords.latitude,
          userLng: pos.coords.longitude,
          distanceKm: prev.distanceKm || 5, // Default 5km radius when activated
          sortBy: 'DISTANCE',
        }));
        setIsLoadingLocation(false);
      },
      (err) => {
        setIsLoadingLocation(false);
        alert('No pudimos acceder a tu ubicación. Puedes buscar por barrio o explorar el mapa.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Create Need Submit Handler
  const handleCreateNeed = async (data: Partial<Need>) => {
    setIsSubmittingCreate(true);
    try {
      const res = await fetch('/api/needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        await fetchNeeds();
        setIsCreateModalOpen(false);
        alert('¡Solicitud guardada! Tu reporte aparecerá como "Pendiente de verificación" hasta ser confirmado.');
      } else {
        alert('Ocurrió un error guardando la solicitud.');
      }
    } catch (err) {
      alert('Error de conexión al enviar el reporte.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Report Problem Submit Handler
  const handleSubmitReport = async (needId: string, reason: string, description: string, contact: string) => {
    try {
      const res = await fetch(`/api/needs/${needId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description, reporterContact: contact }),
      });
      if (res.ok) {
        alert('Reporte enviado a moderación. Gracias por ayudar a mantener limpia la información.');
        fetchNeeds();
      }
    } catch (e) {
      alert('Error al enviar el reporte.');
    }
  };

  // Update Status Submit Handler
  const handleUpdateStatus = async (needId: string, newStatus: NeedStatus, note: string, updatedBy: string) => {
    try {
      const res = await fetch(`/api/needs/${needId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, description: note, updatedBy }),
      });
      if (res.ok) {
        alert('Estado actualizado exitosamente.');
        fetchNeeds();
      }
    } catch (e) {
      alert('Error actualizando el estado.');
    }
  };

  // Admin Verification Handler
  const handleAdminVerify = async (needId: string, updates: Partial<Need>) => {
    try {
      const res = await fetch(`/api/admin/needs/${needId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchNeeds();
        fetchAdminData();
      }
    } catch (e) {
      alert('Error en moderación.');
    }
  };

  // Admin Resolve Report Handler
  const handleAdminResolveReport = async (reportId: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchNeeds();
        fetchAdminData();
      }
    } catch (e) {
      alert('Error al resolver el reporte.');
    }
  };

  // Reset Demo Data
  const handleResetDemoData = async () => {
    if (confirm('¿Restablecer todos los datos demo de prueba para Cali?')) {
      try {
        await fetch('/api/admin/reset-demo', { method: 'POST' });
        fetchNeeds();
      } catch (e) {
        // Ignore
      }
    }
  };

  const activeCount = needs.filter((n) => n.status !== 'CLOSED' && n.verificationStatus !== 'ARCHIVED').length;
  const criticalCount = needs.filter((n) => n.priority === 'CRITICAL' && n.status !== 'CLOSED').length;
  const hasDemoData = needs.some((n) => n.isDemoData);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased">
      {/* Platform Header */}
      <Header
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        lastUpdated={lastUpdated}
        isOffline={isOffline}
        activeCount={activeCount}
        criticalCount={criticalCount}
      />

      {/* Emergency Disclaimer & Demo Notice */}
      <BannerDisclaimer
        hasDemoData={hasDemoData}
        onResetDemoData={handleResetDemoData}
      />

      {/* Hero Welcome Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-5 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              Aquí Hace Falta
            </h2>
            <p className="text-xs md:text-sm font-semibold text-indigo-400">
              Encuentra dónde tu ayuda puede hacer la diferencia en Cali.
            </p>
            <p className="text-xs text-slate-400">
              Información verificada en tiempo real sobre recursos, voluntarios y acopios necesarios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setFilters((f) => ({ ...f, priority: 'CRITICAL' }));
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg text-xs shadow-sm transition-colors flex items-center gap-2"
            >
              <HeartHandshake className="w-4 h-4 text-indigo-200" />
              <span>Quiero Ayudar (Ver urgentes)</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-lg text-xs border border-slate-700 transition-colors flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-slate-400" />
              <span>Registrar Necesidad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
        onClearFilters={() =>
          setFilters({
            search: '',
            categories: [],
            priority: 'ALL',
            placeType: 'ALL',
            status: 'ALL',
            verificationStatus: 'ALL',
            distanceKm: null,
            userLat: null,
            userLng: null,
            sortBy: 'PRIORITY',
          })
        }
        onRequestLocation={handleRequestLocation}
        isLoadingLocation={isLoadingLocation}
        totalResults={needs.length}
      />

      {/* Mobile View Toggle Buttons */}
      <div className="md:hidden bg-white border-b border-slate-200 p-2 sticky top-[108px] z-30 flex items-center justify-center gap-2">
        <button
          onClick={() => setMobileView('LIST')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mobileView === 'LIST'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Vista Lista ({needs.length})</span>
        </button>

        <button
          onClick={() => setMobileView('MAP')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mobileView === 'MAP'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Vista Mapa</span>
        </button>
      </div>

      {/* Main Content Layout (Desktop split map + list, Mobile toggle) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
        {/* MAP PANEL (Desktop: 55-60% width ~ col-span-7, Mobile: depending on toggle) */}
        <div
          className={`w-full h-[550px] md:h-[calc(100vh-280px)] sticky top-24 ${
            mobileView === 'MAP' ? 'block' : 'hidden md:block'
          } md:col-span-7`}
        >
          <MapView
            needs={needs}
            selectedNeedId={selectedNeed?.id}
            onSelectNeed={(need) => setSelectedNeed(need)}
            userLat={filters.userLat}
            userLng={filters.userLng}
          />
        </div>

        {/* LIST PANEL (Desktop: ~ col-span-5, Mobile: depending on toggle) */}
        <div
          className={`w-full space-y-3 ${
            mobileView === 'LIST' ? 'block' : 'hidden md:block'
          } md:col-span-5`}
        >
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>Necesidades activas en Cali</span>
              <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {needs.length}
              </span>
            </h3>

            <button
              onClick={fetchNeeds}
              className="text-xs text-slate-600 hover:text-slate-950 font-semibold flex items-center gap-1"
              title="Actualizar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-12 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : needs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">No se encontraron necesidades</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                No hay puntos coincidentes con los filtros seleccionados. Intenta ampliar el radio de distancia o limpiar la búsqueda.
              </p>
              <button
                onClick={() =>
                  setFilters({
                    search: '',
                    categories: [],
                    priority: 'ALL',
                    placeType: 'ALL',
                    status: 'ALL',
                    verificationStatus: 'ALL',
                    distanceKm: null,
                    userLat: null,
                    userLng: null,
                    sortBy: 'PRIORITY',
                  })
                }
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Limpiar todos los filtros
              </button>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {needs.map((need) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  onSelect={(item) => setSelectedNeed(item)}
                  onHelp={(item) => setSelectedForHelp(item)}
                  userLat={filters.userLat}
                  userLng={filters.userLng}
                  isSelected={selectedNeed?.id === need.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <NeedDetailModal
        need={selectedNeed}
        onClose={() => setSelectedNeed(null)}
        onOpenQuieroAyudar={(need) => setSelectedForHelp(need)}
        onOpenReportModal={(need) => setSelectedForReport(need)}
        onOpenUpdateStatusModal={(need) => setSelectedForStatusUpdate(need)}
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
      />

      <ReportModal
        need={selectedForReport}
        onClose={() => setSelectedForReport(null)}
        onSubmitReport={handleSubmitReport}
      />

      <UpdateStatusModal
        need={selectedForStatusUpdate}
        onClose={() => setSelectedForStatusUpdate(null)}
        onSubmitUpdate={handleUpdateStatus}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        needs={needs}
        reports={reports}
        auditLogs={auditLogs}
        onVerifyNeed={handleAdminVerify}
        onResolveReport={handleAdminResolveReport}
        onResetDemoData={handleResetDemoData}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-white px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between text-[11px] font-semibold uppercase tracking-wider gap-3 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8">
          <span className="text-slate-400">Resumen de Cali:</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> {criticalCount} Críticas
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" /> {needs.filter((n) => n.priority === 'HIGH').length} Altas
          </span>
          <span className="flex items-center gap-2 text-indigo-400">
            ✓ {needs.filter((n) => n.verificationStatus === 'VERIFIED').length} Verificadas
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
      </footer>
    </div>
  );
}
