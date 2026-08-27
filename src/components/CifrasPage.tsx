import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  MapPin,
  Users,
  Activity,
  Layers,
  ArrowRight,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Heart,
  Package,
  FileText,
  Mail,
  MessageCircle,
  Zap,
  Target,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { DEPARTMENTS, findDepartmentByCityId, getCityDisplayName } from '../data/colombiaCities';

// ==========================================
// TYPES
// ==========================================

interface NeedRow {
  id: string;
  city_id: string;
  department_id?: string;
  categories: string[];
  priority: string;
  status: string;
  verification_status: string;
  place_type: string;
  created_at: string;
  updated_at: string;
}

interface OfferRow {
  id: string;
  city_id: string;
  department_id?: string;
  categories: string[];
  offer_status: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  role: string;
  city?: string;
  department?: string;
  moderation_status?: string;
  created_at: string;
}

interface UpdateLogRow {
  id: string;
  need_id?: string;
  offer_id?: string;
  previous_status: string;
  new_status: string;
  created_at: string;
}

// ==========================================
// HELPER: Category label
// ==========================================

const CATEGORY_LABELS: Record<string, string> = {
  ESCOMBROS: 'Escombros',
  MANO_OBRA: 'Mano de obra',
  TRANSPORTE: 'Transporte',
  ALIMENTOS: 'Alimentos',
  AGUA: 'Agua',
  ROPA: 'Ropa',
  MEDICAMENTOS: 'Medicamentos',
  SANGRE: 'Sangre',
  DINERO: 'Dinero',
  HERRAMIENTAS: 'Herramientas',
  MAQUINARIA: 'Maquinaria',
  OPERARIOS_MAQUINARIA: 'Operarios de maquinaria',
  ATENCION_MEDICA: 'Atención médica',
  APOYO_PSICOLOGICO: 'Apoyo psicológico',
  ALOJAMIENTO: 'Alojamiento',
  ANIMALES: 'Animales',
  LOGISTICA: 'Logística',
  IMPLEMENTOS_ASEO: 'Implementos de aseo',
  CLASIFICACION_DONACIONES: 'Clasificación de donaciones',
  VOLUNTARIADO_GENERAL: 'Voluntariado general',
  OTRO: 'Otro',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

const STATUS_LABELS: Record<string, string> = {
  NEED_HELP_NOW: 'Necesita ayuda ahora',
  RECEIVING_HELP: 'Recibiendo ayuda',
  PARTIALLY_COVERED: 'Parcialmente cubierta',
  COVERED: 'Cubierta',
  CLOSED: 'Cerrada',
};

const OFFER_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  PARTIALLY_AVAILABLE: 'Parcialmente disponible',
  EXHAUSTED: 'Agotada',
  CLOSED: 'Cerrada',
};

const VERIFICATION_LABELS: Record<string, string> = {
  VERIFIED: 'Verificada',
  PENDING_VERIFICATION: 'Pendiente',
  REPORTED: 'Reportada',
  ARCHIVED: 'Archivada',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administradores',
  moderador: 'Moderadores',
  voluntario: 'Voluntarios RaDAR',
  user: 'Usuarios',
};

// ==========================================
// COMPONENT
// ==========================================

export const CifrasPage: React.FC = () => {
  const [needs, setNeeds] = useState<NeedRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [needLogs, setNeedLogs] = useState<UpdateLogRow[]>([]);
  const [offerLogs, setOfferLogs] = useState<UpdateLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    global: true,
    geographic: true,
    users: true,
    moderation: true,
    categories: true,
    radarMatch: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ==========================================
  // DATA FETCHING
  // ==========================================

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [needsRes, offersRes, profilesRes, needLogsRes, offerLogsRes] = await Promise.all([
          supabase.from('needs').select('id, city_id, department_id, categories, priority, status, verification_status, place_type, created_at, updated_at'),
          supabase.from('offers').select('id, city_id, department_id, categories, offer_status, verification_status, created_at, updated_at'),
          supabase.from('profiles').select('id, role, city, department, moderation_status, created_at'),
          supabase.from('update_logs').select('id, need_id, previous_status, new_status, created_at'),
          supabase.from('offer_update_logs').select('id, offer_id, previous_status, new_status, created_at'),
        ]);

        if (needsRes.error) throw new Error('Error cargando necesidades');
        if (offersRes.error) throw new Error('Error cargando ofertas');
        if (profilesRes.error) throw new Error('Error cargando perfiles');

        setNeeds(needsRes.data || []);
        setOffers(offersRes.data || []);
        setProfiles(profilesRes.data || []);
        setNeedLogs(needLogsRes.data || []);
        setOfferLogs(offerLogsRes.data || []);
      } catch (e: any) {
        setError(e.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ==========================================
  // FILTERED DATA
  // ==========================================

  const filteredNeeds = useMemo(() => {
    let data = needs;
    if (selectedDepartment !== 'ALL') {
      data = data.filter((n) => {
        const dept = n.department_id || findDepartmentByCityId(n.city_id)?.id;
        return dept === selectedDepartment;
      });
    }
    if (selectedCity !== 'ALL') {
      data = data.filter((n) => n.city_id === selectedCity);
    }
    return data;
  }, [needs, selectedDepartment, selectedCity]);

  const filteredOffers = useMemo(() => {
    let data = offers;
    if (selectedDepartment !== 'ALL') {
      data = data.filter((o) => {
        const dept = o.department_id || findDepartmentByCityId(o.city_id)?.id;
        return dept === selectedDepartment;
      });
    }
    if (selectedCity !== 'ALL') {
      data = data.filter((o) => o.city_id === selectedCity);
    }
    return data;
  }, [offers, selectedDepartment, selectedCity]);

  // Cities available for the selected department
  const availableCities = useMemo(() => {
    if (selectedDepartment === 'ALL') {
      const cityIds = new Set<string>();
      needs.forEach((n) => cityIds.add(n.city_id));
      offers.forEach((o) => cityIds.add(o.city_id));
      return Array.from(cityIds).sort();
    }
    const dept = DEPARTMENTS.find((d) => d.id === selectedDepartment);
    if (dept) {
      return dept.cities.map((c) => c.id);
    }
    return [];
  }, [selectedDepartment, needs, offers]);

  // Departments that actually have data
  const activeDepartments = useMemo(() => {
    const deptIds = new Set<string>();
    needs.forEach((n) => {
      const dept = n.department_id || findDepartmentByCityId(n.city_id)?.id;
      if (dept) deptIds.add(dept);
    });
    offers.forEach((o) => {
      const dept = o.department_id || findDepartmentByCityId(o.city_id)?.id;
      if (dept) deptIds.add(dept);
    });
    return DEPARTMENTS.filter((d) => deptIds.has(d.id));
  }, [needs, offers]);

  // ==========================================
  // COMPUTED STATS
  // ==========================================

  // Global stats
  const totalNeeds = filteredNeeds.length;
  const totalOffers = filteredOffers.length;
  const totalPublications = totalNeeds + totalOffers;

  // Priority breakdown (needs only)
  const priorityStats = useMemo(() => {
    const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    filteredNeeds.forEach((n) => {
      if (counts[n.priority] !== undefined) counts[n.priority]++;
    });
    return counts;
  }, [filteredNeeds]);

  // Status breakdown (needs)
  const needStatusStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredNeeds.forEach((n) => {
      counts[n.status] = (counts[n.status] || 0) + 1;
    });
    return counts;
  }, [filteredNeeds]);

  // Offer status breakdown
  const offerStatusStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOffers.forEach((o) => {
      counts[o.offer_status] = (counts[o.offer_status] || 0) + 1;
    });
    return counts;
  }, [filteredOffers]);

  // Verification status breakdown (combined)
  const verificationStats = useMemo(() => {
    const counts: Record<string, number> = {};
    [...filteredNeeds, ...filteredOffers].forEach((item) => {
      const vs = item.verification_status;
      counts[vs] = (counts[vs] || 0) + 1;
    });
    return counts;
  }, [filteredNeeds, filteredOffers]);

  // Geographic breakdown by department
  const geoStats = useMemo(() => {
    const deptCounts: Record<string, { needs: number; offers: number }> = {};
    filteredNeeds.forEach((n) => {
      const dept = n.department_id || findDepartmentByCityId(n.city_id)?.id || 'desconocido';
      if (!deptCounts[dept]) deptCounts[dept] = { needs: 0, offers: 0 };
      deptCounts[dept].needs++;
    });
    filteredOffers.forEach((o) => {
      const dept = o.department_id || findDepartmentByCityId(o.city_id)?.id || 'desconocido';
      if (!deptCounts[dept]) deptCounts[dept] = { needs: 0, offers: 0 };
      deptCounts[dept].offers++;
    });
    return Object.entries(deptCounts)
      .map(([id, counts]) => ({
        id,
        name: DEPARTMENTS.find((d) => d.id === id)?.name || id,
        ...counts,
        total: counts.needs + counts.offers,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredNeeds, filteredOffers]);

  // City breakdown (top 10)
  const cityStats = useMemo(() => {
    const cityCounts: Record<string, { needs: number; offers: number }> = {};
    filteredNeeds.forEach((n) => {
      if (!cityCounts[n.city_id]) cityCounts[n.city_id] = { needs: 0, offers: 0 };
      cityCounts[n.city_id].needs++;
    });
    filteredOffers.forEach((o) => {
      if (!cityCounts[o.city_id]) cityCounts[o.city_id] = { needs: 0, offers: 0 };
      cityCounts[o.city_id].offers++;
    });
    return Object.entries(cityCounts)
      .map(([id, counts]) => ({
        id,
        name: getCityDisplayName(id),
        ...counts,
        total: counts.needs + counts.offers,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [filteredNeeds, filteredOffers]);

  // User role stats (no sensitive data)
  const userRoleStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const hiddenRoles = ['entidad_profesional'];
    profiles.forEach((p) => {
      const role = (p.role || 'user').toLowerCase();
      if (hiddenRoles.includes(role)) return;
      counts[role] = (counts[role] || 0) + 1;
    });
    return counts;
  }, [profiles]);

  const totalUsers = profiles.length;

  // Moderation stats
  const moderationStats = useMemo(() => {
    const totalNeedLogs = needLogs.length;
    const totalOfferLogs = offerLogs.length;
    const totalLogs = totalNeedLogs + totalOfferLogs;

    // Status transitions
    const transitions: Record<string, number> = {};
    [...needLogs, ...offerLogs].forEach((log) => {
      const key = `${log.previous_status || '?'} → ${log.new_status || '?'}`;
      transitions[key] = (transitions[key] || 0) + 1;
    });

    // Logs by month
    const logsByMonth: Record<string, number> = {};
    [...needLogs, ...offerLogs].forEach((log) => {
      const month = log.created_at?.substring(0, 7) || 'desconocido';
      logsByMonth[month] = (logsByMonth[month] || 0) + 1;
    });

    // Unique moderators (just count, no personal data)
    const uniqueNeedIds = new Set(needLogs.map((l) => l.need_id).filter(Boolean));
    const uniqueOfferIds = new Set(offerLogs.map((l) => l.offer_id).filter(Boolean));

    return {
      totalLogs,
      totalNeedLogs,
      totalOfferLogs,
      transitions: Object.entries(transitions).sort((a, b) => b[1] - a[1]).slice(0, 10),
      logsByMonth: Object.entries(logsByMonth).sort((a, b) => a[0].localeCompare(b[0])),
      uniqueNeedsModerated: uniqueNeedIds.size,
      uniqueOffersModerated: uniqueOfferIds.size,
    };
  }, [needLogs, offerLogs]);

  // Category stats
  const categoryStats = useMemo(() => {
    const needCats: Record<string, number> = {};
    const offerCats: Record<string, number> = {};

    filteredNeeds.forEach((n) => {
      (n.categories || []).forEach((c) => {
        needCats[c] = (needCats[c] || 0) + 1;
      });
    });

    filteredOffers.forEach((o) => {
      (o.categories || []).forEach((c) => {
        offerCats[c] = (offerCats[c] || 0) + 1;
      });
    });

    const allCats = new Set([...Object.keys(needCats), ...Object.keys(offerCats)]);
    return Array.from(allCats)
      .map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat] || cat,
        needs: needCats[cat] || 0,
        offers: offerCats[cat] || 0,
        total: (needCats[cat] || 0) + (offerCats[cat] || 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredNeeds, filteredOffers]);

  // Radar Match stats (client-side simulation of matching algorithm)
  const radarMatchStats = useMemo(() => {
    // Only consider active needs and available offers
    const activeNeeds = filteredNeeds.filter(
      (n) => n.status !== 'CLOSED' && n.status !== 'COVERED' && n.verification_status !== 'ARCHIVED'
    );
    const activeOffers = filteredOffers.filter(
      (o) => o.offer_status !== 'CLOSED' && o.offer_status !== 'EXHAUSTED' && o.verification_status !== 'ARCHIVED'
    );

    let needsWithMatch = 0;
    let offersWithMatch = 0;
    const allScores: number[] = [];
    const categoryGap: Record<string, { needs: number; offers: number }> = {};

    // For each active need, check if there's at least one offer in same city with category overlap
    for (const need of activeNeeds) {
      const needCats = need.categories || [];
      needCats.forEach((c) => {
        if (!categoryGap[c]) categoryGap[c] = { needs: 0, offers: 0 };
        categoryGap[c].needs++;
      });

      let bestScore = 0;
      for (const offer of activeOffers) {
        const offerCats = offer.categories || [];
        const common = offerCats.filter((cat) => needCats.includes(cat));
        const sameCity = need.city_id === offer.city_id;

        if (common.length > 0 || sameCity) {
          const score = Math.min(98, 70 + (sameCity ? 15 : 0) + (common.length * 8));
          if (score > bestScore) bestScore = score;
        }
      }

      if (bestScore > 0) {
        needsWithMatch++;
        allScores.push(bestScore);
      }
    }

    // For each active offer, check coverage
    for (const offer of activeOffers) {
      const offerCats = offer.categories || [];
      offerCats.forEach((c) => {
        if (!categoryGap[c]) categoryGap[c] = { needs: 0, offers: 0 };
        categoryGap[c].offers++;
      });

      let hasMatch = false;
      for (const need of activeNeeds) {
        const needCats = need.categories || [];
        const common = needCats.filter((cat) => offerCats.includes(cat));
        const sameCity = need.city_id === offer.city_id;
        if (common.length > 0 || sameCity) {
          hasMatch = true;
          break;
        }
      }
      if (hasMatch) offersWithMatch++;
    }

    const coverageRate = activeNeeds.length > 0 ? (needsWithMatch / activeNeeds.length) * 100 : 0;
    const responseCapacity = activeOffers.length > 0 ? (offersWithMatch / activeOffers.length) * 100 : 0;
    const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

    // Score distribution
    const scoreDistribution = { above90: 0, above80: 0, above70: 0, below70: 0 };
    allScores.forEach((s) => {
      if (s >= 90) scoreDistribution.above90++;
      else if (s >= 80) scoreDistribution.above80++;
      else if (s >= 70) scoreDistribution.above70++;
      else scoreDistribution.below70++;
    });

    // Categories with most demand but least supply (gap)
    const gaps = Object.entries(categoryGap)
      .map(([cat, counts]) => ({
        category: cat,
        label: CATEGORY_LABELS[cat] || cat,
        needs: counts.needs,
        offers: counts.offers,
        gap: counts.needs - counts.offers,
      }))
      .sort((a, b) => b.gap - a.gap);

    return {
      activeNeeds: activeNeeds.length,
      activeOffers: activeOffers.length,
      needsWithMatch,
      offersWithMatch,
      coverageRate,
      responseCapacity,
      avgScore,
      scoreDistribution,
      gaps,
    };
  }, [filteredNeeds, filteredOffers]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-[#1F1C1A] font-sans selection:bg-[#1B3A93] selection:text-white overflow-x-hidden">
      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#F2C33D]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#1B3A93]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#CE3B3B]/05 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <img
              src="/logo-radar.svg"
              alt="RaDAR de Ayuda Logo"
              className="h-9 sm:h-10 w-auto group-hover:scale-105 transition-transform"
            />
          </a>

          <div className="flex items-center gap-2.5">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#1B3A93] hover:bg-[#1B3A93]/90 text-white shadow-md shadow-[#1B3A93]/20 hover:scale-[1.02] transition-all"
            >
              <span>Ir a la App</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15] text-[#1F1C1A]">
          Cifras y{' '}
          <span className="text-[#1B3A93] underline decoration-[#F2C33D] decoration-4 underline-offset-4">
            Alcance
          </span>{' '}
          de la Plataforma
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Estadísticas públicas y en tiempo real de las publicaciones, usuarios, moderación y categorías de ayuda en <strong className="text-[#1F1C1A]">RaDAR de Ayuda</strong>.
        </p>
      </section>

      {/* Main Content */}
      <main className="relative z-10 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Loading / Error states */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-[#1B3A93] animate-spin" />
            <span className="ml-3 text-sm text-slate-600">Cargando estadísticas...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* =========== FILTER BAR =========== */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Filter className="w-4 h-4 text-[#1B3A93]" />
                <span>Filtrar por:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* Department filter */}
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedCity('ALL');
                  }}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#1B3A93]/20 focus:border-[#1B3A93] outline-none"
                >
                  <option value="ALL">Todos los departamentos</option>
                  {activeDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>

                {/* City filter */}
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#1B3A93]/20 focus:border-[#1B3A93] outline-none"
                >
                  <option value="ALL">Todas las ciudades</option>
                  {availableCities.map((cityId) => (
                    <option key={cityId} value={cityId}>
                      {getCityDisplayName(cityId)}
                    </option>
                  ))}
                </select>
              </div>
              {(selectedDepartment !== 'ALL' || selectedCity !== 'ALL') && (
                <button
                  onClick={() => { setSelectedDepartment('ALL'); setSelectedCity('ALL'); }}
                  className="text-xs text-[#CE3B3B] font-bold hover:underline ml-auto"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* =========== SECTION 1: GLOBAL OVERVIEW =========== */}
            <SectionWrapper
              title="Resumen General"
              icon={<BarChart3 className="w-5 h-5 text-[#1B3A93]" />}
              sectionKey="global"
              expanded={expandedSections.global}
              toggle={toggleSection}
            >
              {/* Big number cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Publicaciones" value={totalPublications} icon={<Globe className="w-5 h-5" />} color="blue" />
                <StatCard label="Necesidades" value={totalNeeds} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
                <StatCard label="Ofertas de ayuda" value={totalOffers} icon={<Heart className="w-5 h-5" />} color="green" />
                <StatCard label="Usuarios registrados" value={totalUsers} icon={<Users className="w-5 h-5" />} color="yellow" />
              </div>

              {/* Priority breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#CE3B3B]" />
                    Necesidades por Prioridad
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(priorityStats).map(([key, count]) => (
                      <ProgressRow
                        key={key}
                        label={PRIORITY_LABELS[key] || key}
                        value={count}
                        total={totalNeeds}
                        color={key === 'CRITICAL' ? '#CE3B3B' : key === 'HIGH' ? '#F59E0B' : key === 'MEDIUM' ? '#3B82F6' : '#6B7280'}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Estado de Verificación
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(verificationStats).map(([key, count]) => (
                      <ProgressRow
                        key={key}
                        label={VERIFICATION_LABELS[key] || key}
                        value={count}
                        total={totalPublications}
                        color={key === 'VERIFIED' ? '#10B981' : key === 'PENDING_VERIFICATION' ? '#F59E0B' : key === 'REPORTED' ? '#EF4444' : '#6B7280'}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#1B3A93]" />
                    Estado de Necesidades
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(needStatusStats).map(([key, count]) => (
                      <ProgressRow
                        key={key}
                        label={STATUS_LABELS[key] || key}
                        value={count}
                        total={totalNeeds}
                        color="#1B3A93"
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    Estado de Ofertas
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(offerStatusStats).map(([key, count]) => (
                      <ProgressRow
                        key={key}
                        label={OFFER_STATUS_LABELS[key] || key}
                        value={count}
                        total={totalOffers}
                        color="#10B981"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </SectionWrapper>

            {/* =========== SECTION 2: GEOGRAPHIC BREAKDOWN =========== */}
            <SectionWrapper
              title="Desglose Geográfico"
              icon={<MapPin className="w-5 h-5 text-[#F2C33D]" />}
              sectionKey="geographic"
              expanded={expandedSections.geographic}
              toggle={toggleSection}
            >
              {/* Department table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 overflow-x-auto">
                <h4 className="text-sm font-extrabold text-slate-800 mb-3">Por Departamento</h4>
                {geoStats.length === 0 ? (
                  <p className="text-xs text-slate-500">No hay datos geográficos disponibles.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-2 font-bold text-slate-600">Departamento</th>
                        <th className="text-right py-2 px-2 font-bold text-slate-600">Necesidades</th>
                        <th className="text-right py-2 px-2 font-bold text-slate-600">Ofertas</th>
                        <th className="text-right py-2 px-2 font-bold text-slate-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {geoStats.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-2 font-semibold text-slate-800">{row.name}</td>
                          <td className="py-2 px-2 text-right text-[#CE3B3B] font-bold">{row.needs}</td>
                          <td className="py-2 px-2 text-right text-emerald-600 font-bold">{row.offers}</td>
                          <td className="py-2 px-2 text-right font-black text-slate-900">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* City ranking */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-4">
                <h4 className="text-sm font-extrabold text-slate-800 mb-3">Top 15 Ciudades</h4>
                {cityStats.length === 0 ? (
                  <p className="text-xs text-slate-500">No hay datos de ciudades disponibles.</p>
                ) : (
                  <div className="space-y-2">
                    {cityStats.map((city, idx) => (
                      <div key={city.id} className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 w-5 text-right">{idx + 1}</span>
                        <span className="text-xs font-semibold text-slate-800 flex-1 truncate">{city.name}</span>
                        <span className="text-[10px] font-bold text-[#CE3B3B] bg-red-50 px-1.5 py-0.5 rounded">{city.needs} nec.</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{city.offers} of.</span>
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1B3A93] rounded-full"
                            style={{ width: `${cityStats[0]?.total ? (city.total / cityStats[0].total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionWrapper>

            {/* =========== SECTION 3: USERS =========== */}
            <SectionWrapper
              title="Usuarios de la Plataforma"
              icon={<Users className="w-5 h-5 text-[#1B3A93]" />}
              sectionKey="users"
              expanded={expandedSections.users}
              toggle={toggleSection}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(userRoleStats).map(([role, count]) => (
                  <div key={role} className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-[#1B3A93]">{count}</p>
                    <p className="text-[11px] font-bold text-slate-600 mt-1">{ROLE_LABELS[role] || role}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-4">
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Datos agregados. No se expone información personal de los usuarios.
                </p>
              </div>
            </SectionWrapper>

            {/* =========== SECTION 4: MODERATION =========== */}
            <SectionWrapper
              title="Estadísticas de Moderación"
              icon={<Activity className="w-5 h-5 text-emerald-600" />}
              sectionKey="moderation"
              expanded={expandedSections.moderation}
              toggle={toggleSection}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Acciones totales" value={moderationStats.totalLogs} icon={<FileText className="w-5 h-5" />} color="blue" />
                <StatCard label="En necesidades" value={moderationStats.totalNeedLogs} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
                <StatCard label="En ofertas" value={moderationStats.totalOfferLogs} icon={<Heart className="w-5 h-5" />} color="green" />
                <StatCard label="Entradas moderadas" value={moderationStats.uniqueNeedsModerated + moderationStats.uniqueOffersModerated} icon={<CheckCircle2 className="w-5 h-5" />} color="yellow" />
              </div>

              {/* Transitions - hidden */}

              {/* Monthly timeline */}
              {moderationStats.logsByMonth.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-4">
                  <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Actividad de moderación por mes
                  </h4>
                  <div className="space-y-1.5">
                    {moderationStats.logsByMonth.map(([month, count]) => {
                      const maxCount = Math.max(...moderationStats.logsByMonth.map(([, c]) => c));
                      return (
                        <div key={month} className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-slate-500 w-16">{month}</span>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#1B3A93] to-[#1B3A93]/60 rounded-full transition-all"
                              style={{ width: `${maxCount ? (count / maxCount) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </SectionWrapper>

            {/* =========== SECTION 5: CATEGORIES =========== */}
            <SectionWrapper
              title="Categorías de Ayuda"
              icon={<Layers className="w-5 h-5 text-[#F2C33D]" />}
              sectionKey="categories"
              expanded={expandedSections.categories}
              toggle={toggleSection}
            >
              {categoryStats.length === 0 ? (
                <p className="text-xs text-slate-500">No hay datos de categorías disponibles.</p>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-2 font-bold text-slate-600">Categoría</th>
                        <th className="text-right py-2 px-2 font-bold text-[#CE3B3B]">Necesidades</th>
                        <th className="text-right py-2 px-2 font-bold text-emerald-600">Ofertas</th>
                        <th className="text-right py-2 px-2 font-bold text-slate-800">Total</th>
                        <th className="text-left py-2 px-3 font-bold text-slate-600 w-32">Proporción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryStats.map((cat) => (
                        <tr key={cat.category} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-2 font-semibold text-slate-800">{cat.label}</td>
                          <td className="py-2 px-2 text-right text-[#CE3B3B] font-bold">{cat.needs}</td>
                          <td className="py-2 px-2 text-right text-emerald-600 font-bold">{cat.offers}</td>
                          <td className="py-2 px-2 text-right font-black text-slate-900">{cat.total}</td>
                          <td className="py-2 px-3">
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                              <div
                                className="h-full bg-[#CE3B3B]"
                                style={{ width: `${cat.total ? (cat.needs / cat.total) * 100 : 0}%` }}
                              />
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${cat.total ? (cat.offers / cat.total) * 100 : 0}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="w-3 h-2 bg-[#CE3B3B] rounded-sm" /> Necesidades
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="w-3 h-2 bg-emerald-500 rounded-sm" /> Ofertas
                    </span>
                  </div>
                </div>
              )}
            </SectionWrapper>

            {/* =========== SECTION 6: RADAR MATCH =========== */}
            <SectionWrapper
              title="Motor Radar Match"
              icon={<Zap className="w-5 h-5 text-emerald-500" />}
              sectionKey="radarMatch"
              expanded={expandedSections.radarMatch}
              toggle={toggleSection}
            >
              {/* Coverage cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Necesidades activas" value={radarMatchStats.activeNeeds} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
                <StatCard label="Ofertas activas" value={radarMatchStats.activeOffers} icon={<Heart className="w-5 h-5" />} color="green" />
                <StatCard label="Necesidades con match" value={radarMatchStats.needsWithMatch} icon={<Target className="w-5 h-5" />} color="blue" />
                <StatCard label="Ofertas conectadas" value={radarMatchStats.offersWithMatch} icon={<Zap className="w-5 h-5" />} color="yellow" />
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
                  <p className="text-3xl font-black text-emerald-600">{radarMatchStats.coverageRate.toFixed(1)}%</p>
                  <p className="text-[11px] font-bold text-slate-600 mt-1">Cobertura potencial</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Necesidades con al menos 1 oferta compatible</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
                  <p className="text-3xl font-black text-[#1B3A93]">{radarMatchStats.avgScore.toFixed(0)}%</p>
                  <p className="text-[11px] font-bold text-slate-600 mt-1">Score promedio</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Promedio de coincidencia del mejor match</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
                  <p className="text-3xl font-black text-[#F2C33D]">{radarMatchStats.responseCapacity.toFixed(1)}%</p>
                  <p className="text-[11px] font-bold text-slate-600 mt-1">Capacidad de respuesta</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ofertas que pueden cubrir alguna necesidad</p>
                </div>
              </div>

              {/* Score distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-4">
                <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Distribución de scores de coincidencia
                </h4>
                <div className="space-y-2">
                  <ProgressRow
                    label="Excelente (90%+)"
                    value={radarMatchStats.scoreDistribution.above90}
                    total={radarMatchStats.needsWithMatch}
                    color="#10B981"
                  />
                  <ProgressRow
                    label="Bueno (80-89%)"
                    value={radarMatchStats.scoreDistribution.above80}
                    total={radarMatchStats.needsWithMatch}
                    color="#3B82F6"
                  />
                  <ProgressRow
                    label="Regular (70-79%)"
                    value={radarMatchStats.scoreDistribution.above70}
                    total={radarMatchStats.needsWithMatch}
                    color="#F59E0B"
                  />
                  <ProgressRow
                    label="Bajo (<70%)"
                    value={radarMatchStats.scoreDistribution.below70}
                    total={radarMatchStats.needsWithMatch}
                    color="#6B7280"
                  />
                </div>
              </div>

              {/* Category gap analysis */}
              {radarMatchStats.gaps.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-4 overflow-x-auto">
                  <h4 className="text-sm font-extrabold text-slate-800 mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#CE3B3B]" />
                    Brecha oferta vs demanda por categoría
                  </h4>
                  <p className="text-[10px] text-slate-500 mb-3">Categorías donde la demanda supera la oferta disponible.</p>
                  <div className="space-y-2">
                    {radarMatchStats.gaps.slice(0, 10).map((item) => (
                      <div key={item.category} className="flex items-center gap-3">
                        <span className="text-xs text-slate-700 flex-1 truncate">{item.label}</span>
                        <span className="text-[10px] font-bold text-[#CE3B3B] bg-red-50 px-1.5 py-0.5 rounded">{item.needs} nec.</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{item.offers} of.</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${item.gap > 0 ? 'text-red-700 bg-red-100' : 'text-emerald-700 bg-emerald-100'}`}>
                          {item.gap > 0 ? `−${item.gap}` : `+${Math.abs(item.gap)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-4">
                <p className="text-[11px] text-emerald-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  Cálculo basado en el mismo algoritmo del motor Radar Match: coincidencia de categorías + proximidad por ciudad.
                </p>
              </div>
            </SectionWrapper>

            {/* Footer note */}
            <div className="text-center pt-4 pb-8">
              <p className="text-[11px] text-slate-400">
                Datos cargados en tiempo real desde la base de datos de RaDAR de Ayuda. No se expone información personal.
              </p>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#1F1C1A] text-slate-300 py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo-radar.svg" alt="RaDAR de Ayuda" className="h-8 w-auto brightness-0 invert opacity-90" />
            <div className="border-l border-slate-700 pl-3">
              <p className="text-xs font-bold text-white">RaDAR de Ayuda</p>
              <p className="text-[11px] text-slate-400">Plataforma Ciudadana Abierta de Coordinación de Emergencias</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
            <a
              href="mailto:Info@radardeayuda.co"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-semibold bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>Info@radardeayuda.co</span>
            </a>
            <a
              href="https://wa.me/573112323588"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-semibold bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp: +57 311 232 3588</span>
            </a>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="/" className="hover:text-white transition-colors">Mapa Principal</a>
            <span>•</span>
            <a href="/guia" className="hover:text-white transition-colors">¿Cómo Funciona?</a>
            <span>•</span>
            <a href="/moderador" className="hover:text-white transition-colors">Acceso Moderadores</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface SectionWrapperProps {
  title: string;
  icon: React.ReactNode;
  sectionKey: string;
  expanded: boolean;
  toggle: (key: string) => void;
  children: React.ReactNode;
}

function SectionWrapper({ title, icon, sectionKey, expanded, toggle, children }: SectionWrapperProps) {
  return (
    <section className="bg-[#F5F6F9] border border-slate-200/80 rounded-3xl overflow-hidden">
      <button
        onClick={() => toggle(sectionKey)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/50 transition-colors text-left"
      >
        {icon}
        <h3 className="text-base sm:text-lg font-black text-[#1F1C1A] flex-1">{title}</h3>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {expanded && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </section>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'green' | 'yellow';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-[#1B3A93]/10 text-[#1B3A93] border-[#1B3A93]/20',
    red: 'bg-[#CE3B3B]/10 text-[#CE3B3B] border-[#CE3B3B]/20',
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    yellow: 'bg-[#F2C33D]/10 text-[#9A7B00] border-[#F2C33D]/30',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClasses[color]} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl font-black text-[#1F1C1A]">{value.toLocaleString('es-CO')}</p>
      <p className="text-[11px] font-bold text-slate-500 mt-1">{label}</p>
    </div>
  );
}

interface ProgressRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function ProgressRow({ label, value, total, color }: ProgressRowProps) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-700 flex-1 truncate">{label}</span>
      <span className="text-xs font-bold text-slate-800 w-8 text-right">{value}</span>
      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-slate-400 w-10 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}
