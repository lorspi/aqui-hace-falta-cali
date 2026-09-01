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
  Calendar,
  Download,
  CheckSquare,
  Square,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { HelpCategory, Need, Offer, PlaceType, Priority, NeedStatus } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { Footer } from './Footer';
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
  const [dateFilterType, setDateFilterType] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [exportModules, setExportModules] = useState<{
    global: boolean;
    geographic: boolean;
    categories: boolean;
    radarMatch: boolean;
    usersAndModeration: boolean;
  }>({
    global: true,
    geographic: true,
    categories: true,
    radarMatch: true,
    usersAndModeration: true,
  });

  const toggleExportModule = (key: keyof typeof exportModules) => {
    setExportModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    global: true,
    geographic: true,
    categories: true,
    gaps: true,
    radarMatch: true,
    users: true,
    moderation: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Date Filter Helper
  const isWithinDateRange = (createdAt: string | undefined): boolean => {
    if (!createdAt || dateFilterType === 'ALL') return true;
    const itemTime = new Date(createdAt).getTime();
    if (isNaN(itemTime)) return true;

    const now = new Date();

    if (dateFilterType === 'TODAY') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return itemTime >= startOfToday;
    }

    if (dateFilterType === 'WEEK') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
      return itemTime >= sevenDaysAgo;
    }

    if (dateFilterType === 'MONTH') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
      return itemTime >= thirtyDaysAgo;
    }

    if (dateFilterType === 'CUSTOM') {
      let valid = true;
      if (customStartDate) {
        const start = new Date(`${customStartDate}T00:00:00`).getTime();
        if (!isNaN(start)) valid = valid && itemTime >= start;
      }
      if (customEndDate) {
        const end = new Date(`${customEndDate}T23:59:59.999`).getTime();
        if (!isNaN(end)) valid = valid && itemTime <= end;
      }
      return valid;
    }

    return true;
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
    data = data.filter((n) => isWithinDateRange(n.created_at));
    return data;
  }, [needs, selectedDepartment, selectedCity, dateFilterType, customStartDate, customEndDate]);

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
    data = data.filter((o) => isWithinDateRange(o.created_at));
    return data;
  }, [offers, selectedDepartment, selectedCity, dateFilterType, customStartDate, customEndDate]);

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
  const filteredNeedLogs = useMemo(() => {
    return needLogs.filter((l) => isWithinDateRange(l.created_at));
  }, [needLogs, dateFilterType, customStartDate, customEndDate]);

  const filteredOfferLogs = useMemo(() => {
    return offerLogs.filter((l) => isWithinDateRange(l.created_at));
  }, [offerLogs, dateFilterType, customStartDate, customEndDate]);

  const moderationStats = useMemo(() => {
    const totalNeedLogs = filteredNeedLogs.length;
    const totalOfferLogs = filteredOfferLogs.length;
    const totalLogs = totalNeedLogs + totalOfferLogs;

    // Status transitions
    const transitions: Record<string, number> = {};
    [...filteredNeedLogs, ...filteredOfferLogs].forEach((log) => {
      const key = `${log.previous_status || '?'} → ${log.new_status || '?'}`;
      transitions[key] = (transitions[key] || 0) + 1;
    });

    // Logs by month
    const logsByMonth: Record<string, number> = {};
    [...filteredNeedLogs, ...filteredOfferLogs].forEach((log) => {
      const month = log.created_at?.substring(0, 7) || 'desconocido';
      logsByMonth[month] = (logsByMonth[month] || 0) + 1;
    });

    // Unique moderators (just count, no personal data)
    const uniqueNeedIds = new Set(filteredNeedLogs.map((l) => l.need_id).filter(Boolean));
    const uniqueOfferIds = new Set(filteredOfferLogs.map((l) => l.offer_id).filter(Boolean));

    return {
      totalLogs,
      totalNeedLogs,
      totalOfferLogs,
      transitions: Object.entries(transitions).sort((a, b) => b[1] - a[1]).slice(0, 10),
      logsByMonth: Object.entries(logsByMonth).sort((a, b) => a[0].localeCompare(b[0])),
      uniqueNeedsModerated: uniqueNeedIds.size,
      uniqueOffersModerated: uniqueOfferIds.size,
    };
  }, [filteredNeedLogs, filteredOfferLogs]);

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
  // EXPORT HANDLERS
  // ==========================================

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push("REPORTE DE CIFRAS Y ALCANCE - RADAR DE AYUDA");
    lines.push(`Fecha de generación,"${new Date().toLocaleString('es-CO')}"`);
    lines.push(`Filtro de departamento,"${selectedDepartment === 'ALL' ? 'Todos los departamentos' : (DEPARTMENTS.find(d => d.id === selectedDepartment)?.name || selectedDepartment)}"`);
    lines.push(`Filtro de ciudad,"${selectedCity === 'ALL' ? 'Todas las ciudades' : getCityDisplayName(selectedCity)}"`);
    lines.push(`Filtro de fecha,"${dateFilterType === 'ALL' ? 'Todo el tiempo' : dateFilterType === 'TODAY' ? 'Hoy' : dateFilterType === 'WEEK' ? 'Últimos 7 días' : dateFilterType === 'MONTH' ? 'Últimos 30 días' : `Personalizado (${customStartDate} a ${customEndDate})`}"`);
    lines.push("");

    if (exportModules.global) {
      lines.push("--- RESUMEN GENERAL ---");
      lines.push(`Total Publicaciones,${totalPublications}`);
      lines.push(`Necesidades,${totalNeeds}`);
      lines.push(`Ofertas de ayuda,${totalOffers}`);
      lines.push(`Usuarios registrados,${totalUsers}`);
      lines.push("");
      lines.push("NECESIDADES POR PRIORIDAD");
      lines.push("Prioridad,Cantidad");
      Object.entries(priorityStats).forEach(([pri, count]) => {
        lines.push(`"${PRIORITY_LABELS[pri] || pri}",${count}`);
      });
      lines.push("");
      lines.push("ESTADO DE VERIFICACION");
      lines.push("Estado,Cantidad");
      Object.entries(verificationStats).forEach(([ver, count]) => {
        lines.push(`"${VERIFICATION_LABELS[ver] || ver}",${count}`);
      });
      lines.push("");
    }

    if (exportModules.geographic) {
      lines.push("--- DESGLOSE GEOGRAFICO ---");
      lines.push("Departamento,Necesidades,Ofertas,Total");
      geoStats.forEach((g) => {
        lines.push(`"${g.name}",${g.needs},${g.offers},${g.total}`);
      });
      lines.push("");
      lines.push("TOP CIUDADES");
      lines.push("Ciudad,Necesidades,Ofertas,Total");
      cityStats.forEach((c) => {
        lines.push(`"${c.name}",${c.needs},${c.offers},${c.total}`);
      });
      lines.push("");
    }

    if (exportModules.categories) {
      lines.push("--- CATEGORIAS DE AYUDA ---");
      lines.push("Categoria,Necesidades,Ofertas,Total");
      categoryStats.forEach((cat) => {
        lines.push(`"${cat.label}",${cat.needs},${cat.offers},${cat.total}`);
      });
      lines.push("");
    }

    if (exportModules.radarMatch) {
      lines.push("--- MOTOR RADAR MATCH ---");
      lines.push(`Necesidades activas,${radarMatchStats.activeNeeds}`);
      lines.push(`Ofertas activas,${radarMatchStats.activeOffers}`);
      lines.push(`Necesidades conectadas con una oferta compatible,${radarMatchStats.needsWithMatch}`);
      lines.push(`Cobertura potencial (%),${radarMatchStats.coverageRate.toFixed(1)}%`);
      lines.push(`Score promedio (%),${radarMatchStats.avgScore.toFixed(0)}%`);
      lines.push(`Capacidad de respuesta (%),${radarMatchStats.responseCapacity.toFixed(1)}%`);
      lines.push("");
      lines.push("BRECHA DEMANDA VS OFERTA POR CATEGORIA");
      lines.push("Categoria,Demanda (Necesidades),Oferta (Ofertas),Brecha");
      radarMatchStats.gaps.forEach((g) => {
        lines.push(`"${g.label}",${g.needs},${g.offers},${g.gap}`);
      });
      lines.push("");
    }

    if (exportModules.usersAndModeration) {
      lines.push("--- USUARIOS Y MODERACION ---");
      lines.push(`Usuarios totales registrados,${totalUsers}`);
      Object.entries(userRoleStats).forEach(([role, count]) => {
        lines.push(`"${ROLE_LABELS[role] || role}",${count}`);
      });
      lines.push("");
      lines.push(`Acciones de moderación totales,${moderationStats.totalLogs}`);
      lines.push(`Acciones en necesidades,${moderationStats.totalNeedLogs}`);
      lines.push(`Acciones en ofertas,${moderationStats.totalOfferLogs}`);
      lines.push("");
    }

    const csvContent = '\uFEFF' + lines.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_cifras_radar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  const handleExportPDF = () => {
    setIsExportModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-[#1F1C1A] font-sans selection:bg-[#1B3A93] selection:text-white overflow-x-hidden">
      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden no-print">
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

                {/* Date range filter */}
                <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-[#1B3A93]/20 focus-within:border-[#1B3A93]">
                  <Calendar className="w-3.5 h-3.5 text-[#1B3A93]" />
                  <select
                    value={dateFilterType}
                    onChange={(e) => setDateFilterType(e.target.value as any)}
                    className="text-xs bg-transparent outline-none border-none pr-1 cursor-pointer"
                  >
                    <option value="ALL">Todo el tiempo</option>
                    <option value="TODAY">Hoy</option>
                    <option value="WEEK">Últimos 7 días</option>
                    <option value="MONTH">Últimos 30 días</option>
                    <option value="CUSTOM">Rango personalizado</option>
                  </select>
                </div>

                {/* Custom Date Inputs if CUSTOM is selected */}
                {dateFilterType === 'CUSTOM' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      placeholder="Desde"
                      className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-[#1B3A93]/20 focus:border-[#1B3A93] outline-none text-slate-700"
                    />
                    <span className="text-xs text-slate-400 font-semibold">a</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      placeholder="Hasta"
                      className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-[#1B3A93]/20 focus:border-[#1B3A93] outline-none text-slate-700"
                    />
                  </div>
                )}
              </div>
              <div className="sm:ml-auto flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                {(selectedDepartment !== 'ALL' || selectedCity !== 'ALL' || dateFilterType !== 'ALL' || customStartDate !== '' || customEndDate !== '') && (
                  <button
                    onClick={() => {
                      setSelectedDepartment('ALL');
                      setSelectedCity('ALL');
                      setDateFilterType('ALL');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="text-xs text-[#CE3B3B] font-bold hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#1B3A93] hover:bg-[#1B3A93]/90 text-white shadow-sm shadow-[#1B3A93]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Reporte</span>
                </button>
              </div>
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
                <StatCard label="Usuarios registrados (Global)" value={totalUsers} icon={<Users className="w-5 h-5" />} color="yellow" />
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
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 mb-3">Por Departamento</h4>
                <UnifiedProportionTable
                  labelHeader="Departamento"
                  data={geoStats.map((row) => ({
                    id: row.id,
                    label: row.name,
                    needs: row.needs,
                    offers: row.offers,
                    total: row.total,
                  }))}
                  emptyMessage="No hay datos geográficos disponibles."
                />
              </div>

              {/* City ranking */}
              <div className="mt-5">
                <h4 className="text-sm font-extrabold text-slate-800 mb-3">Top 15 Ciudades</h4>
                <UnifiedProportionTable
                  labelHeader="Ciudad"
                  showRank={true}
                  data={cityStats.map((city) => ({
                    id: city.id,
                    label: city.name,
                    needs: city.needs,
                    offers: city.offers,
                    total: city.total,
                  }))}
                  emptyMessage="No hay datos de ciudades disponibles."
                />
              </div>
            </SectionWrapper>

            {/* =========== SECTION 3: CATEGORIES =========== */}
            <SectionWrapper
              title="Categorías de Ayuda"
              icon={<Layers className="w-5 h-5 text-[#F2C33D]" />}
              sectionKey="categories"
              expanded={expandedSections.categories}
              toggle={toggleSection}
            >
              <UnifiedProportionTable
                labelHeader="Categoría"
                data={categoryStats.map((cat) => ({
                  id: cat.category,
                  label: cat.label,
                  needs: cat.needs,
                  offers: cat.offers,
                  total: cat.total,
                }))}
                emptyMessage="No hay datos de categorías disponibles."
              />
            </SectionWrapper>

            {/* =========== SECTION 4: GAP ANALYSIS =========== */}
            <SectionWrapper
              title="Brecha Oferta vs Demanda por Categoría"
              icon={<Target className="w-5 h-5 text-[#CE3B3B]" />}
              sectionKey="gaps"
              expanded={expandedSections.gaps}
              toggle={toggleSection}
            >
              {radarMatchStats.gaps.length === 0 ? (
                <p className="text-xs text-slate-500">No hay datos de brecha disponibles.</p>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-5 overflow-x-auto">
                  <p className="text-[10px] sm:text-xs text-slate-500 mb-3">Categorías donde la demanda supera la oferta disponible.</p>
                  <div className="divide-y divide-slate-100">
                    {radarMatchStats.gaps.slice(0, 10).map((item) => (
                      <div key={item.category} className="flex items-center justify-between py-2 border-b border-slate-100/80 last:border-b-0 hover:bg-slate-50/60 px-2 rounded-lg transition-colors gap-3">
                        {/* 1. Category Name */}
                        <span className="text-xs font-bold text-slate-800 w-28 sm:w-36 shrink-0 truncate">{item.label}</span>

                        {/* 2. Proportion Balance Bar */}
                        <div className="flex-1 max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-[#CE3B3B] transition-all"
                            title={`${item.needs} demanda`}
                            style={{ width: `${item.needs + item.offers > 0 ? (item.needs / (item.needs + item.offers)) * 100 : 0}%` }}
                          />
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            title={`${item.offers} oferta`}
                            style={{ width: `${item.needs + item.offers > 0 ? (item.offers / (item.needs + item.offers)) * 100 : 0}%` }}
                          />
                        </div>

                        {/* 3. Numerical Demanda vs Oferta */}
                        <div className="flex items-center gap-1.5 text-xs shrink-0">
                          <span className="font-semibold text-slate-700">
                            <strong className="text-[#CE3B3B] font-extrabold">{item.needs}</strong> <span className="hidden sm:inline">demanda</span><span className="sm:hidden">dem.</span>
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="font-semibold text-slate-700">
                            <strong className="text-emerald-600 font-extrabold">{item.offers}</strong> <span className="hidden sm:inline">oferta</span><span className="sm:hidden">of.</span>
                          </span>
                        </div>

                        {/* 4. Single Result Badge at far right */}
                        <div className="text-right min-w-[85px] shrink-0">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${
                            item.gap > 0 ? 'bg-red-50 text-[#CE3B3B] border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {item.gap > 0 ? `Falta ${item.gap}` : `Sobran ${Math.abs(item.gap)}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionWrapper>

            {/* =========== SECTION 5: RADAR MATCH =========== */}
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
                <StatCard label="Necesidades conectadas con una oferta compatible" value={radarMatchStats.needsWithMatch} icon={<Target className="w-5 h-5" />} color="blue" />
                <StatCard label="Ofertas conectadas con una necesidad compatible" value={radarMatchStats.offersWithMatch} icon={<Zap className="w-5 h-5" />} color="yellow" />
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
            </SectionWrapper>

            {/* =========== GLOBAL PLATFORM METRICS HEADER =========== */}
            <div className="pt-6 pb-2 border-t border-slate-200/80">
              <h2 className="text-xl font-black text-[#1F1C1A] tracking-tight">
                Datos Generales de la Plataforma
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Métricas globales acumuladas de usuarios registrados y actividad de moderación en todo RaDAR de Ayuda.
              </p>
            </div>

            {/* =========== SECTION 5: USERS =========== */}
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
            </SectionWrapper>

            {/* =========== SECTION 6: MODERATION =========== */}
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
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* =========== EXPORT MODAL =========== */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1B3A93]/10 text-[#1B3A93] flex items-center justify-center border border-[#1B3A93]/20">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Exportar Reporte de Cifras</h3>
                  <p className="text-xs text-slate-500">Selecciona el formato y los módulos a incluir</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Filter Info Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex flex-wrap gap-2 items-center">
              <span className="font-bold text-slate-800">Filtros activos:</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-[#1B3A93]">
                {selectedDepartment === 'ALL' ? 'Todos los dptos' : (DEPARTMENTS.find(d => d.id === selectedDepartment)?.name || selectedDepartment)}
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-[#1B3A93]">
                {selectedCity === 'ALL' ? 'Todas las ciudades' : getCityDisplayName(selectedCity)}
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-[#1B3A93]">
                {dateFilterType === 'ALL' ? 'Todo el tiempo' : dateFilterType === 'TODAY' ? 'Hoy' : dateFilterType === 'WEEK' ? 'Últimos 7 días' : dateFilterType === 'MONTH' ? 'Últimos 30 días' : 'Rango personalizado'}
              </span>
            </div>

            {/* Format Selector */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 block">Formato de Exportación</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('PDF')}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                    exportFormat === 'PDF'
                      ? 'bg-[#1B3A93] text-white border-[#1B3A93] shadow-md shadow-[#1B3A93]/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div>PDF (Informe Visual)</div>
                    <div className={`text-[10px] font-normal ${exportFormat === 'PDF' ? 'text-blue-100' : 'text-slate-400'}`}>Formato gráfico oficial</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('CSV')}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                    exportFormat === 'CSV'
                      ? 'bg-[#1B3A93] text-white border-[#1B3A93] shadow-md shadow-[#1B3A93]/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <div className="text-left">
                    <div>CSV (Hoja de Datos)</div>
                    <div className={`text-[10px] font-normal ${exportFormat === 'CSV' ? 'text-blue-100' : 'text-slate-400'}`}>Para Excel o Sheets</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Module Selection Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700">Módulos a incluir en el reporte</label>
                <button
                  type="button"
                  onClick={() => {
                    const allChecked = Object.values(exportModules).every(Boolean);
                    setExportModules({
                      global: !allChecked,
                      geographic: !allChecked,
                      categories: !allChecked,
                      radarMatch: !allChecked,
                      usersAndModeration: !allChecked,
                    });
                  }}
                  className="text-[11px] font-bold text-[#1B3A93] hover:underline cursor-pointer"
                >
                  {Object.values(exportModules).every(Boolean) ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                <label className="flex items-center gap-2.5 text-xs text-slate-800 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={exportModules.global}
                    onChange={() => toggleExportModule('global')}
                    className="w-4 h-4 rounded text-[#1B3A93] focus:ring-[#1B3A93]/20 accent-[#1B3A93]"
                  />
                  <span>Resumen General (Total publicaciones, prioridades y verificación)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-800 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={exportModules.geographic}
                    onChange={() => toggleExportModule('geographic')}
                    className="w-4 h-4 rounded text-[#1B3A93] focus:ring-[#1B3A93]/20 accent-[#1B3A93]"
                  />
                  <span>Desglose Geográfico (Departamentos y Top Ciudades)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-800 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={exportModules.categories}
                    onChange={() => toggleExportModule('categories')}
                    className="w-4 h-4 rounded text-[#1B3A93] focus:ring-[#1B3A93]/20 accent-[#1B3A93]"
                  />
                  <span>Categorías de Ayuda (Demanda vs Oferta por categoría)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-800 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={exportModules.radarMatch}
                    onChange={() => toggleExportModule('radarMatch')}
                    className="w-4 h-4 rounded text-[#1B3A93] focus:ring-[#1B3A93]/20 accent-[#1B3A93]"
                  />
                  <span>Motor Radar Match (Cobertura, scores y análisis de brecha)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-800 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={exportModules.usersAndModeration}
                    onChange={() => toggleExportModule('usersAndModeration')}
                    className="w-4 h-4 rounded text-[#1B3A93] focus:ring-[#1B3A93]/20 accent-[#1B3A93]"
                  />
                  <span>Usuarios y Moderación (Métricas globales y registros)</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!Object.values(exportModules).some(Boolean)}
                onClick={exportFormat === 'PDF' ? handleExportPDF : handleExportCSV}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#1B3A93] hover:bg-[#1B3A93]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-[#1B3A93]/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{exportFormat === 'PDF' ? 'Generar PDF' : 'Descargar CSV'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========== PRINT-ONLY REPORT CONTAINER =========== */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          header,
          footer,
          section,
          main,
          .no-print,
          div[class*="fixed"],
          div[class*="blur"] {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: #0F172A !important;
          }
          #printable-report {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #0F172A !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-report * {
            opacity: 1 !important;
            filter: none !important;
            text-shadow: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-report h1,
          #printable-report h2,
          #printable-report h3 {
            color: #1B3A93 !important;
            opacity: 1 !important;
          }
          #printable-report p,
          #printable-report span,
          #printable-report td,
          #printable-report th {
            color: #0F172A !important;
            opacity: 1 !important;
          }
          #printable-report .text-[#1B3A93] {
            color: #1B3A93 !important;
          }
          #printable-report .text-red-600,
          #printable-report .text-[#CE3B3B] {
            color: #DC2626 !important;
          }
          #printable-report .text-emerald-600,
          #printable-report .text-emerald-700 {
            color: #047857 !important;
          }
          #printable-report table th,
          #printable-report table td {
            border-bottom: 1px solid #CBD5E1 !important;
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }
          #printable-report .print-row {
            border-bottom: 1px solid #CBD5E1 !important;
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }
          @page {
            margin: 10mm 12mm;
            size: A4 portrait;
          }
          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #CBD5E1 !important;
          }
        }
      ` }} />

      <div id="printable-report" className="hidden print:block p-6 max-w-4xl mx-auto bg-white text-slate-900 font-sans space-y-6">
        {/* Printable Header */}
        <div className="flex items-center justify-between border-b-2 border-[#1B3A93] pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo-radar.svg" alt="RaDAR de Ayuda" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-black text-[#1F1C1A]">RaDAR de Ayuda</h1>
              <p className="text-xs font-bold text-[#1B3A93]">Informe Oficial de Cifras y Alcance</p>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-600">
            <p className="font-bold text-slate-900">Fecha de emisión: {new Date().toLocaleDateString('es-CO')}</p>
            <p>Hora: {new Date().toLocaleTimeString('es-CO')}</p>
          </div>
        </div>

        {/* Filter Summary Badge */}
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs flex flex-wrap gap-3">
          <span className="font-bold text-slate-900">Filtros aplicados en el informe:</span>
          <span><strong>Dpto:</strong> {selectedDepartment === 'ALL' ? 'Todos los departamentos' : selectedDepartment}</span>
          <span>•</span>
          <span><strong>Ciudad:</strong> {selectedCity === 'ALL' ? 'Todas las ciudades' : getCityDisplayName(selectedCity)}</span>
          <span>•</span>
          <span><strong>Período:</strong> {dateFilterType === 'ALL' ? 'Todo el tiempo' : dateFilterType === 'TODAY' ? 'Hoy' : dateFilterType === 'WEEK' ? 'Últimos 7 días' : dateFilterType === 'MONTH' ? 'Últimos 30 días' : 'Rango personalizado'}</span>
        </div>

        {/* MODULE 1: GLOBAL OVERVIEW */}
        {exportModules.global && (
          <div className="print-card border border-slate-300 rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-black text-[#1B3A93] border-b border-slate-200 pb-2">1. Resumen General de Publicaciones</h2>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <p className="text-xl font-black text-[#1B3A93]">{totalPublications}</p>
                <p className="text-[10px] font-bold text-slate-700">Total Publicaciones</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                <p className="text-xl font-black text-[#CE3B3B]">{totalNeeds}</p>
                <p className="text-[10px] font-bold text-slate-700">Necesidades</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <p className="text-xl font-black text-emerald-700">{totalOffers}</p>
                <p className="text-[10px] font-bold text-slate-700">Ofertas</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <p className="text-xl font-black text-amber-800">{totalUsers}</p>
                <p className="text-[10px] font-bold text-slate-700">Usuarios Registrados</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">Necesidades por Prioridad</h3>
                <div className="space-y-1">
                  {Object.entries(priorityStats).map(([pri, count]) => (
                    <div key={pri} className="print-row flex justify-between py-1.5 border-b border-slate-300">
                      <span className="font-semibold text-slate-800">{PRIORITY_LABELS[pri] || pri}</span>
                      <span className="font-bold text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">Estado de Verificación</h3>
                <div className="space-y-1">
                  {Object.entries(verificationStats).map(([ver, count]) => (
                    <div key={ver} className="print-row flex justify-between py-1.5 border-b border-slate-300">
                      <span className="font-semibold text-slate-800">{VERIFICATION_LABELS[ver] || ver}</span>
                      <span className="font-bold text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: GEOGRAPHIC */}
        {exportModules.geographic && (
          <div className="print-card border border-slate-300 rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-black text-[#1B3A93] border-b border-slate-200 pb-2">2. Desglose Geográfico</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">Por Departamento</h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-300 font-bold text-slate-900 bg-slate-50">
                      <th className="py-1.5 px-1">Dpto</th>
                      <th className="text-right py-1.5 px-1">Nec.</th>
                      <th className="text-right py-1.5 px-1">Ofer.</th>
                      <th className="text-right py-1.5 px-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geoStats.map((g) => (
                      <tr key={g.id} className="border-b border-slate-300">
                        <td className="py-1.5 px-1 font-semibold text-slate-800">{g.name}</td>
                        <td className="text-right py-1.5 px-1 text-red-600 font-bold">{g.needs}</td>
                        <td className="text-right py-1.5 px-1 text-emerald-600 font-bold">{g.offers}</td>
                        <td className="text-right py-1.5 px-1 font-bold text-slate-900">{g.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">Top Ciudades</h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-300 font-bold text-slate-900 bg-slate-50">
                      <th className="py-1.5 px-1">Ciudad</th>
                      <th className="text-right py-1.5 px-1">Nec.</th>
                      <th className="text-right py-1.5 px-1">Ofer.</th>
                      <th className="text-right py-1.5 px-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityStats.map((c) => (
                      <tr key={c.id} className="border-b border-slate-300">
                        <td className="py-1.5 px-1 font-semibold text-slate-800">{c.name}</td>
                        <td className="text-right py-1.5 px-1 text-red-600 font-bold">{c.needs}</td>
                        <td className="text-right py-1.5 px-1 text-emerald-600 font-bold">{c.offers}</td>
                        <td className="text-right py-1.5 px-1 font-bold text-slate-900">{c.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 3: CATEGORIES */}
        {exportModules.categories && (
          <div className="print-card border border-slate-300 rounded-2xl p-4 space-y-3 text-xs">
            <h2 className="text-sm font-black text-[#1B3A93] border-b border-slate-200 pb-2">3. Categorías de Ayuda (Oferta vs Demanda)</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-300 font-bold text-slate-900 bg-slate-50">
                  <th className="py-2 px-2">Categoría</th>
                  <th className="text-right py-2 px-2 text-red-600">Necesidades</th>
                  <th className="text-right py-2 px-2 text-emerald-600">Ofertas</th>
                  <th className="text-right py-2 px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((cat) => (
                  <tr key={cat.category} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="py-2 px-2 font-bold text-slate-900">{cat.label}</td>
                    <td className="text-right py-2 px-2 text-red-600 font-bold">{cat.needs}</td>
                    <td className="text-right py-2 px-2 text-emerald-600 font-bold">{cat.offers}</td>
                    <td className="text-right py-2 px-2 font-black text-slate-900">{cat.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODULE 4: RADAR MATCH */}
        {exportModules.radarMatch && (
          <div className="print-card border border-slate-300 rounded-2xl p-4 space-y-3 text-xs">
            <h2 className="text-sm font-black text-[#1B3A93] border-b border-slate-200 pb-2">4. Rendimiento Motor Radar Match</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <p className="text-lg font-black text-emerald-700">{radarMatchStats.coverageRate.toFixed(1)}%</p>
                <p className="text-[10px] font-bold text-slate-700">Cobertura Potencial</p>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                <p className="text-lg font-black text-[#1B3A93]">{radarMatchStats.avgScore.toFixed(0)}%</p>
                <p className="text-[10px] font-bold text-slate-700">Score Promedio</p>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <p className="text-lg font-black text-amber-700">{radarMatchStats.responseCapacity.toFixed(1)}%</p>
                <p className="text-[10px] font-bold text-slate-700">Capacidad de Respuesta</p>
              </div>
            </div>
            
            {radarMatchStats.gaps.length > 0 && (
              <div className="mt-3">
                <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">Brecha Oferta vs Demanda por Categoría</h3>
                <div className="space-y-1 text-xs">
                  {radarMatchStats.gaps.map((g) => (
                    <div key={g.category} className="print-row flex items-center justify-between py-1.5 px-2 border-b border-slate-300 bg-slate-50/60">
                      <span className="font-semibold text-slate-800">{g.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-red-600 font-bold">Demanda: {g.needs}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-600 font-bold">Oferta: {g.offers}</span>
                        <span className="text-slate-400">•</span>
                        <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${g.gap > 0 ? 'text-red-700 bg-red-100' : 'text-emerald-700 bg-emerald-100'}`}>
                          {g.gap > 0 ? `Falta ${g.gap}` : `Superávit +${Math.abs(g.gap)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODULE 5: USERS & MODERATION */}
        {exportModules.usersAndModeration && (
          <div className="print-card border border-slate-300 rounded-2xl p-4 space-y-3 text-xs">
            <h2 className="text-sm font-black text-[#1B3A93] border-b border-slate-200 pb-2">5. Usuarios y Actividad de Moderación</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">Roles de Usuario Registrados</h3>
                <div className="space-y-1">
                  {Object.entries(userRoleStats).map(([role, count]) => (
                    <div key={role} className="print-row flex justify-between py-1.5 border-b border-slate-300">
                      <span className="font-semibold text-slate-800">{ROLE_LABELS[role] || role}</span>
                      <span className="font-bold text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">Estadísticas de Moderación</h3>
                <div className="space-y-1">
                  <div className="print-row flex justify-between py-1.5 border-b border-slate-300">
                    <span className="font-semibold text-slate-800">Acciones totales registradas:</span>
                    <span className="font-bold text-slate-900">{moderationStats.totalLogs}</span>
                  </div>
                  <div className="print-row flex justify-between py-1.5 border-b border-slate-300">
                    <span className="font-semibold text-slate-800">Acciones en necesidades:</span>
                    <span className="font-bold text-red-600">{moderationStats.totalNeedLogs}</span>
                  </div>
                  <div className="print-row flex justify-between py-1.5 border-b border-slate-300">
                    <span className="font-semibold text-slate-800">Acciones en ofertas:</span>
                    <span className="font-bold text-emerald-600">{moderationStats.totalOfferLogs}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Printable Footer */}
        <div className="pt-4 border-t-2 border-slate-300 text-center text-[10px] text-slate-600">
          <p className="font-bold text-slate-800">RaDAR de Ayuda - Plataforma Ciudadana Abierta de Coordinación de Emergencias</p>
          <p>Informe generado automáticamente desde radardeayuda.co • info@radardeayuda.co</p>
        </div>
      </div>
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
        <div className="px-3 sm:px-5 pb-3 sm:pb-5">
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
    <div className="flex items-center gap-3 py-1.5 border-b border-slate-100/80 last:border-b-0">
      <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{label}</span>
      <span className="text-xs font-bold text-slate-800 w-8 text-right">{value}</span>
      <div className="w-24 sm:w-36 md:w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-slate-400 w-10 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

interface UnifiedProportionTableRow {
  id: string;
  label: string;
  needs: number;
  offers: number;
  total: number;
}

interface UnifiedProportionTableProps {
  labelHeader: string;
  data: UnifiedProportionTableRow[];
  emptyMessage: string;
  showRank?: boolean;
}

function UnifiedProportionTable({
  labelHeader,
  data,
  emptyMessage,
  showRank = false,
}: UnifiedProportionTableProps) {
  if (data.length === 0) {
    return <p className="text-xs text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-5 overflow-x-auto">
      <table className="w-full text-[11px] sm:text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            {showRank && (
              <th className="text-center py-2 sm:py-2.5 px-0.5 sm:px-2 font-bold text-slate-400 w-5 sm:w-8">#</th>
            )}
            <th className="text-left py-2 sm:py-2.5 px-1.5 sm:px-3 font-bold text-slate-600 truncate max-w-[90px] sm:max-w-none">{labelHeader}</th>
            <th className="text-right py-2 sm:py-2.5 px-1 sm:px-4 font-bold text-[#CE3B3B] whitespace-nowrap">
              <span className="hidden sm:inline">Necesidades</span>
              <span className="sm:hidden">Nec.</span>
            </th>
            <th className="text-right py-2 sm:py-2.5 px-1 sm:px-4 font-bold text-emerald-600 whitespace-nowrap">
              <span className="hidden sm:inline">Ofertas</span>
              <span className="sm:hidden">Of.</span>
            </th>
            <th className="text-right py-2 sm:py-2.5 px-1 sm:px-5 font-bold text-slate-800 whitespace-nowrap">Total</th>
            <th className="text-left py-2 sm:py-2.5 pl-2 sm:pl-8 pr-1 sm:pr-3 font-bold text-slate-600">
              <span className="hidden sm:inline">Proporción</span>
              <span className="sm:hidden">Prop.</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
              {showRank && (
                <td className="py-2 sm:py-2.5 px-0.5 sm:px-2 text-center text-[10px] sm:text-xs font-black text-slate-400">
                  {idx + 1}
                </td>
              )}
              <td className="py-2 sm:py-2.5 px-1.5 sm:px-3 font-semibold text-slate-800 truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[260px]" title={row.label}>
                {row.label}
              </td>
              <td className="py-2 sm:py-2.5 px-1 sm:px-4 text-right text-[#CE3B3B] font-bold whitespace-nowrap">
                {row.needs.toLocaleString('es-CO')}
              </td>
              <td className="py-2 sm:py-2.5 px-1 sm:px-4 text-right text-emerald-600 font-bold whitespace-nowrap">
                {row.offers.toLocaleString('es-CO')}
              </td>
              <td className="py-2 sm:py-2.5 px-1 sm:px-5 text-right font-black text-slate-900 whitespace-nowrap">
                {row.total.toLocaleString('es-CO')}
              </td>
              <td className="py-2 sm:py-2.5 pl-2 sm:pl-8 pr-1 sm:pr-3">
                <div className="w-full h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-xs min-w-[45px] sm:min-w-0">
                  <div
                    className="h-full bg-[#CE3B3B] transition-all"
                    title={`${row.needs} necesidades (${row.total ? ((row.needs / row.total) * 100).toFixed(0) : 0}%)`}
                    style={{ width: `${row.total ? (row.needs / row.total) * 100 : 0}%` }}
                  />
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    title={`${row.offers} ofertas (${row.total ? ((row.offers / row.total) * 100).toFixed(0) : 0}%)`}
                    style={{ width: `${row.total ? (row.offers / row.total) * 100 : 0}%` }}
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
  );
}

