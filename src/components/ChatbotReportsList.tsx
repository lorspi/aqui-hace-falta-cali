/**
 * ChatbotReportsList — Listado de reportes del chatbot (US-5 / DEV-44)
 *
 * Muestra los registros en `needs` con `source = 'WhatsApp'` (reportes
 * generados por el bot de WhatsApp) para que el operador de RaDAR de Ayuda
 * priorice cuáles revisar primero.
 *
 * Criterios de aceptación cubiertos:
 *   - Solo reportes del chatbot (`source = 'WhatsApp'`); los de la app quedan
 *     fuera.
 *   - Cada reporte muestra `contact_whatsapp`, tipo/título, fecha y
 *     `verification_status`.
 *   - Filtro por estado (`PENDING_VERIFICATION` / `VERIFIED` / `REJECTED`).
 *   - Filtro/orden por `priority` y por tipo de necesidad (place_type).
 *   - Orden por defecto: pendientes primero + cronológico (created_at desc).
 *   - Estados vacío y error claros (no rompe la pantalla).
 *   - Manejo tolerante de campos opcionales ausentes (contact_whatsapp,
 *     título legible, location_enrichment_status PENDING/RESOLVED).
 *
 * La UI NO interpreta `raw_event` crudos: solo lee los datos ya persistidos
 * por el receptor (S1/S5). La interpretación de eventos la hace el backend
 * (US-3).
 */
import React, { useMemo, useState } from 'react';
import {
  MessageSquare,
  Phone,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Inbox,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Hash,
  Eye,
} from 'lucide-react';
import { Need, PlaceType, Priority } from '../types';
import {
  useChatbotReports,
  ChatbotVerificationFilter,
  ChatbotSortOption,
} from '../lib/supabaseService';
import {
  CATEGORY_LABELS,
  PLACE_TYPE_LABELS,
  PRIORITY_CONFIG,
  VERIFICATION_CONFIG,
  getCategoryLabel,
} from '../utils/formatters';
import { ChatbotReportDetail } from './ChatbotReportDetail';
import { useTranslation } from '../i18n/LanguageContext';

interface ChatbotReportsListProps {
  /** Muestra la cabecera de la sección (título + tagline). @default true */
  showHeader?: boolean;
}

const VERIFICATION_STATUSES: ChatbotVerificationFilter[] = [
  'ALL',
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'REPORTED',
  'ARCHIVED',
];

const PRIORITY_OPTIONS: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/** Badge de estado de verificación con la config compartida del proyecto. */
function VerificationBadge({ status }: { status: Need['verificationStatus'] }) {
  const info = VERIFICATION_CONFIG[status] || VERIFICATION_CONFIG.PENDING_VERIFICATION;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${info.badgeClass}`}
    >
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  );
}

/** Badge de prioridad reutilizando PRIORITY_CONFIG. */
function PriorityBadge({ priority }: { priority: Priority }) {
  const info = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider italic border ${info.badgeClass}`}
    >
      {info.label}
    </span>
  );
}

/** Categorías legibles (tolera ausencia / array vacío). */
function CategoriesText({ need }: { need: Need }) {
  const { language } = useTranslation();
  if (!need.categories || need.categories.length === 0) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <span>
      {need.categories
        .slice(0, 3)
        .map((c) => getCategoryLabel(c, language)?.label || c)
        .join(', ')}
      {need.categories.length > 3 ? ` +${need.categories.length - 3}` : ''}
    </span>
  );
}

/** Tarjeta de un reporte del chatbot (tolerante a campos opcionales ausentes). */
function ChatbotReportCard({
  report,
  onOpenDetail,
}: {
  report: Need;
  onOpenDetail: (report: Need) => void;
}) {
  const { language, t } = useTranslation();
  const contact = report.contactWhatsapp || report.contactPhone || '';
  const title = report.title?.trim() || t('chatbotReportsNoTitle');
  const category = useMemo(
    () => report.categories?.[0] ? getCategoryLabel(report.categories[0], language)?.label : null,
    [report.categories, language]
  );
  const location = report.address?.trim() || report.neighborhood?.trim() || '';

  const enrichment = report.locationEnrichmentStatus;
  const enrichmentLabel =
    enrichment === 'RESOLVED'
      ? t('chatbotReportsLocationResolved')
      : enrichment === 'PENDING'
      ? t('chatbotReportsLocationPending')
      : enrichment || null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(report)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(report);
        }
      }}
      className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      {/* Fila superior: badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <VerificationBadge status={report.verificationStatus} />
          <PriorityBadge priority={report.priority} />
          {category && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {category}
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {new Date(report.createdAt).toLocaleString(language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : language === 'fr' ? 'fr-FR' : 'es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Título / tipo de necesidad */}
      <h4 className="font-bold text-slate-900 text-sm leading-snug">{title}</h4>

      {/* Meta: contacto, ubicación, trazabilidad */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" />
          {contact ? <span className="font-semibold text-slate-700">{contact}</span> : <span className="italic">{t('chatbotReportsNoContact')}</span>}
        </span>
        {location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{location}</span>
          </span>
        )}
        {enrichmentLabel && (
          <span className="inline-flex items-center gap-1">
            <AlertTriangle
              className={`w-3 h-3 ${enrichment === 'PENDING' ? 'text-amber-500' : 'text-emerald-500'}`}
            />
            <span>{enrichmentLabel}</span>
          </span>
        )}
      </div>

      {/* Trazabilidad (source_event_id / conversation_id) */}
      {(report.sourceEventId || report.conversationId) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-mono">
          {report.conversationId && (
            <span className="inline-flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {t('chatbotReportsConversation')}: {report.conversationId}
            </span>
          )}
          {report.sourceEventId && (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              evt: {report.sourceEventId.slice(0, 18)}
            </span>
          )}
        </div>
      )}

      {/* Acción: abrir el detalle (US-6) */}
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(report);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t('chatbotReportsShowDetail')}</span>
        </button>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </div>
  );
}

/**
 * Pantalla de listado de reportes del chatbot. Se monta dentro del panel de
 * moderación (AdminPanelPage, tab "chatbot") y es autónoma: maneja sus propios
 * filtros, estados de carga/vacío/error y refetch.
 */
export const ChatbotReportsList: React.FC<ChatbotReportsListProps> = ({
  showHeader = true,
}) => {
  const { language, t } = useTranslation();

  const [verificationFilter, setVerificationFilter] = useState<ChatbotVerificationFilter>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<PlaceType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<ChatbotSortOption>('RECENT');
  const [error, setError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState(0);
  // Detalle del reporte del chatbot (US-6): cuando hay un reporte seleccionado
  // se muestra la pantalla de detalle en lugar del listado.
  const [selectedReport, setSelectedReport] = useState<Need | null>(null);

  const { chatbotReports, loading, pendingCount, refetch } = useChatbotReports({
    verificationStatus: verificationFilter,
    priority: priorityFilter,
    placeType: typeFilter,
    sortBy,
  });

  const handleRefetch = async () => {
    setError(false);
    setRetryKey((k) => k + 1);
    try {
      await refetch();
    } catch {
      setError(true);
    }
  };

  const hasActiveFilters =
    verificationFilter !== 'ALL' || priorityFilter !== 'ALL' || typeFilter !== 'ALL';

  const clearFilters = () => {
    setVerificationFilter('ALL');
    setPriorityFilter('ALL');
    setTypeFilter('ALL');
  };

  const placeTypesList = Object.keys(PLACE_TYPE_LABELS) as PlaceType[];

  // Pantalla de detalle (US-6): al abrir un reporte se muestra la conversación
  // formateada + panel de validación, en lugar del listado.
  if (selectedReport) {
    return (
      <ChatbotReportDetail
        needId={selectedReport.id}
        need={{
          locationEnrichmentStatus: selectedReport.locationEnrichmentStatus ?? null,
          latitude: selectedReport.latitude ?? null,
          longitude: selectedReport.longitude ?? null,
        }}
        onClose={() => setSelectedReport(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              {t('chatbotReportsTitle')}
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingCount} {t('chatbotReportsPendingCount')}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">{t('chatbotReportsTagline')}</p>
          </div>
        </div>
      )}

      {/* Filtros y orden */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filtro por estado */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">
              {t('chatbotReportsFilterVerification')}
            </label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as ChatbotVerificationFilter)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
            >
              <option value="ALL">{t('chatbotReportsAllStates')}</option>
              <option value="PENDING_VERIFICATION">◷ {t('chatbotReportsPendingBadge')}</option>
              <option value="VERIFIED">✓ {t('chatbotReportsVerifiedBadge')}</option>
              <option value="REJECTED">✕ {t('chatbotReportsRejectedBadge')}</option>
              <option value="REPORTED">⚠️ {t('chatbotReportsReportedBadge')}</option>
              <option value="ARCHIVED">📁 {t('chatbotReportsArchivedBadge')}</option>
            </select>
          </div>

          {/* Filtro por prioridad */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">
              {t('chatbotReportsFilterPriority')}
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | 'ALL')}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
            >
              <option value="ALL">{t('chatbotReportsAllPriorities')}</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_CONFIG[p].dot} {PRIORITY_CONFIG[p].label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por tipo de necesidad */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">
              {t('chatbotReportsFilterType')}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PlaceType | 'ALL')}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
            >
              <option value="ALL">{t('chatbotReportsAllTypes')}</option>
              {placeTypesList.map((pt) => (
                <option key={pt} value={pt}>
                  {PLACE_TYPE_LABELS[pt]}
                </option>
              ))}
            </select>
          </div>

          {/* Orden */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">
              {t('chatbotReportsSortBy')}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ChatbotSortOption)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
            >
              <option value="RECENT">{t('chatbotReportsSortRecent')}</option>
              <option value="PRIORITY">{t('chatbotReportsSortPriority')}</option>
            </select>
          </div>
        </div>

        {(hasActiveFilters || error) && (
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
            <div className="text-xs text-slate-500 font-medium">
              Mostrando <strong>{chatbotReports.length}</strong>{' '}
              {chatbotReports.length === 1 ? 'reporte' : 'reportes'}
              {hasActiveFilters ? ' con los filtros seleccionados' : ''}
            </div>
            <div className="flex items-center gap-2">
              {error && (
                <span className="text-[11px] text-red-600 font-semibold">
                  {t('chatbotReportsError')}
                </span>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
              <button
                onClick={handleRefetch}
                className="text-xs text-slate-600 font-bold hover:text-slate-900 inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{t('chatbotReportsRetry')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cuerpo: carga / error / vacío / listado */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t('loading')}</span>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h4 className="font-bold text-slate-900 text-base">{t('chatbotReportsError')}</h4>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Verifica la conexión con la base de datos e inténtalo de nuevo. El resto de la
            aplicación no se ve afectado.
          </p>
          <button
            onClick={handleRefetch}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('chatbotReportsRetry')}
          </button>
        </div>
      ) : chatbotReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-sm">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-900 text-base">{t('chatbotReportsEmpty')}</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t('chatbotReportsEmptyHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chatbotReports.map((report) => (
            <ChatbotReportCard
              key={report.id}
              report={report}
              onOpenDetail={setSelectedReport}
            />
          ))}
          <div className="flex items-center justify-center text-[11px] text-slate-400 pt-2">
            <ChevronRight className="w-3 h-3" />
            {chatbotReports.length} reporte{chatbotReports.length === 1 ? '' : 's'} ·{' '}
            {t('chatbotReportsTitle')}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotReportsList;
