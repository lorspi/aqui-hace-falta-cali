/**
 * ChatbotReportsList — Listado de reportes del chatbot & Tickets Rápidos
 */
import React, { useMemo, useState, useEffect } from 'react';
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
  Bot,
  User,
  ExternalLink,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react';
import { Need, PlaceType, Priority, QuickTicket, VerificationStatus } from '../types';
import {
  useChatbotReports,
  ChatbotVerificationFilter,
  ChatbotSortOption,
  AdminUser,
  fetchQuickTickets,
  updateQuickTicketStatus,
} from '../lib/supabaseService';
import {
  CATEGORY_LABELS,
  PLACE_TYPE_LABELS,
  PRIORITY_CONFIG,
  VERIFICATION_CONFIG,
  getCategoryLabel,
} from '../utils/formatters';
import { ChatbotReportDetail } from './ChatbotReportDetail';
import { CustomSelect } from './CustomSelect';
import { useTranslation } from '../i18n/LanguageContext';

interface ChatbotReportsListProps {
  /** Muestra la cabecera de la sección (título + tagline). @default true */
  showHeader?: boolean;
  /** Operador autenticado en el panel (se pasa al detalle para `verified_by`). */
  operator?: AdminUser | null;
  /** Subpestaña activa controlada desde el exterior ('QUICK_TICKETS' | 'WHATSAPP') */
  activeSubTab?: 'QUICK_TICKETS' | 'WHATSAPP';
  /** Callback al cambiar subpestaña */
  onSubTabChange?: (tab: 'QUICK_TICKETS' | 'WHATSAPP') => void;
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

const VERIFICATION_BADGE_CONFIG: Record<
  VerificationStatus,
  { label: string; className: string }
> = {
  VERIFIED: {
    label: '✓ Verificado',
    className: 'bg-rd-green-soft text-rd-green border-rd-green-line',
  },
  PENDING_VERIFICATION: {
    label: '◷ Pendiente',
    className: 'bg-rd-amber-soft text-rd-amber-ink border-rd-amber-line',
  },
  REPORTED: {
    label: '⚠️ Reportado',
    className: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line',
  },
  REJECTED: {
    label: '✕ Rechazado',
    className: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line',
  },
  ARCHIVED: {
    label: '📁 Archivado',
    className: 'bg-rd-fondo text-rd-ink-meta border-rd-line',
  },
};

const PRIORITY_BADGE_CONFIG: Record<
  Priority,
  { label: string; className: string }
> = {
  CRITICAL: {
    label: '🔴 Crítica',
    className: 'bg-rd-coral-soft text-rd-coral border-rd-coral-line',
  },
  HIGH: {
    label: '🟠 Alta',
    className: 'bg-rd-amber-soft text-rd-amber-ink border-rd-amber-line',
  },
  MEDIUM: {
    label: '🟡 Media',
    className: 'bg-rd-navy-soft text-rd-navy border-rd-navy-line',
  },
  LOW: {
    label: '🟢 Baja',
    className: 'bg-rd-green-soft text-rd-green border-rd-green-line',
  },
};

/** Badge de estado de verificación con diseño unificado RaDAR. */
function VerificationBadge({ status }: { status: Need['verificationStatus'] }) {
  const cfg = VERIFICATION_BADGE_CONFIG[status] || VERIFICATION_BADGE_CONFIG.PENDING_VERIFICATION;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-rd-sm text-rd-10 font-bold border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

/** Badge de prioridad con diseño unificado RaDAR. */
function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_BADGE_CONFIG[priority] || PRIORITY_BADGE_CONFIG.MEDIUM;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-rd-sm text-rd-10 font-bold border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

/** Tarjeta de un reporte del chatbot WhatsApp */
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
    () => (report.categories?.[0] ? getCategoryLabel(report.categories[0], language)?.label : null),
    [report.categories, language]
  );
  const location = report.address?.trim() || report.neighborhood?.trim() || '';

  return (
    <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-4 md:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-rd-ink-3/40 shadow-xs">
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded-rd-sm text-rd-10 font-bold border bg-rd-green-soft text-rd-green border-rd-green-line">
            💬 WhatsApp
          </span>
          <VerificationBadge status={report.verificationStatus} />
          <PriorityBadge priority={report.priority} />
          {category && (
            <span className="px-2 py-0.5 rounded-rd-sm text-rd-10 font-medium bg-rd-fondo text-rd-ink-2 border border-rd-line">
              {category}
            </span>
          )}
          <span className="text-rd-10 text-rd-ink-meta font-mono">#{report.id.slice(0, 8)}</span>
          <span className="text-rd-10 text-rd-ink-meta font-medium">
            {new Date(report.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'es-CO', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <h4 className="font-semibold text-rd-ink text-rd-14 leading-snug">{title}</h4>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-rd-12 text-rd-ink-meta">
          {contact && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-rd-ink-3" />
              <span className="font-semibold text-rd-ink">{contact}</span>
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rd-ink-3" />
              <span>{location}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onOpenDetail(report)}
          className="bg-rd-navy hover:bg-rd-navy-hover text-white font-semibold text-rd-12 h-8 px-3 rounded-rd-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Ver detalle</span>
        </button>
      </div>
    </div>
  );
}

/** Componente de Tarjeta para QuickTicket */
function QuickTicketCard({
  ticket,
  onStatusChange,
}: {
  ticket: QuickTicket;
  onStatusChange: (id: string, newStatus: string) => void;
}) {
  const cleanPhone = ticket.contactPhone.replace(/[^0-9]/g, '');

  return (
    <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-4 md:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-rd-ink-3/40 shadow-xs">
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded-rd-sm text-rd-10 font-bold border bg-rd-navy-soft text-rd-navy border-rd-navy-line">
            🤖 App Ticket
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-rd-sm text-rd-10 font-bold border ${
              ticket.status === 'PENDING'
                ? 'bg-rd-amber-soft text-rd-amber-ink border-rd-amber-line'
                : ticket.status === 'IN_REVIEW'
                ? 'bg-rd-navy-soft text-rd-navy border-rd-navy-line'
                : ticket.status === 'CONVERTED'
                ? 'bg-rd-green-soft text-rd-green border-rd-green-line'
                : 'bg-rd-fondo text-rd-ink-meta border-rd-line'
            }`}
          >
            {ticket.status === 'PENDING'
              ? '◷ Pendiente'
              : ticket.status === 'IN_REVIEW'
              ? '🔍 En Revisión'
              : ticket.status === 'CONVERTED'
              ? '✓ Convertido'
              : '📁 Archivado'}
          </span>
          <span className="text-rd-10 text-rd-ink-meta font-mono">#{ticket.id.slice(0, 8)}</span>
          <span className="text-rd-10 text-rd-ink-meta font-medium">
            {new Date(ticket.createdAt).toLocaleString('es-CO', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <h4 className="font-semibold text-rd-ink text-rd-14">"{ticket.needSummary}"</h4>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-rd-12 text-rd-ink-meta">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-rd-ink-3" />
            <span>{ticket.locationText}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-rd-ink-3" />
            <span className="font-semibold text-rd-ink">{ticket.contactPhone}</span>
            {ticket.contactName && <span>({ticket.contactName})</span>}
          </span>
        </div>

        {ticket.additionalDetails && (
          <p className="text-rd-11-5 text-rd-ink-2 italic pt-0.5">"{ticket.additionalDetails}"</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {cleanPhone && (
          <a
            href={`https://wa.me/57${cleanPhone}`}
            target="_blank"
            rel="noreferrer"
            className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        )}
        <a
          href={`tel:${ticket.contactPhone}`}
          className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Llamar</span>
        </a>
        <CustomSelect
          className="w-36"
          value={ticket.status}
          onChange={(val) => onStatusChange(ticket.id, val)}
          options={[
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'IN_REVIEW', label: 'En Revisión' },
            { value: 'CONVERTED', label: 'Convertido' },
            { value: 'ARCHIVED', label: 'Archivado' },
          ]}
        />
      </div>
    </div>
  );
}

export const ChatbotReportsList: React.FC<ChatbotReportsListProps> = ({
  showHeader = true,
  operator = null,
  activeSubTab,
  onSubTabChange,
}) => {
  const { t, language } = useTranslation();
  const [internalSubTab, setInternalSubTab] = useState<'QUICK_TICKETS' | 'WHATSAPP'>('QUICK_TICKETS');
  const subTab = activeSubTab ?? internalSubTab;
  const setSubTab = (newTab: 'QUICK_TICKETS' | 'WHATSAPP') => {
    setInternalSubTab(newTab);
    onSubTabChange?.(newTab);
  };

  // Quick Tickets State
  const [quickTickets, setQuickTickets] = useState<QuickTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [quickTicketFilter, setQuickTicketFilter] = useState('ALL');

  // WhatsApp Reports State
  const [verificationFilter, setVerificationFilter] = useState<ChatbotVerificationFilter>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<PlaceType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<ChatbotSortOption>('RECENT');
  const [selectedReport, setSelectedReport] = useState<Need | null>(null);

  const { chatbotReports, loading: loadingWhatsapp, refetch: refetchWhatsapp } = useChatbotReports({
    verificationStatus: verificationFilter,
    priority: priorityFilter,
    placeType: typeFilter,
    sortBy,
  });

  const loadQuickTicketsData = async () => {
    setLoadingTickets(true);
    try {
      const data = await fetchQuickTickets(quickTicketFilter);
      setQuickTickets(data);
    } catch (e) {
      console.error('[ChatbotReportsList] Error loading quick tickets:', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (subTab === 'QUICK_TICKETS') {
      loadQuickTicketsData();
    }
  }, [subTab, quickTicketFilter]);

  const handleUpdateQuickTicketStatus = async (id: string, newStatus: string) => {
    try {
      await updateQuickTicketStatus(id, newStatus);
      await loadQuickTicketsData();
    } catch (err) {
      console.error('[ChatbotReportsList] Error updating ticket status:', err);
    }
  };

  if (selectedReport) {
    return (
      <ChatbotReportDetail
        needId={selectedReport.id}
        need={{
          locationEnrichmentStatus: selectedReport.locationEnrichmentStatus ?? null,
          latitude: selectedReport.latitude ?? null,
          longitude: selectedReport.longitude ?? null,
        }}
        operator={operator}
        onClose={() => setSelectedReport(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Asistente Conversacional & Chatbot
              </h2>
              <p className="text-xs text-slate-500">Gestión de tickets rápidos recolectados desde la app y WhatsApp</p>
            </div>
          </div>

          {/* Subtabs Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSubTab('QUICK_TICKETS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                subTab === 'QUICK_TICKETS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🤖 Tickets Rápidos App
            </button>
            <button
              type="button"
              onClick={() => setSubTab('WHATSAPP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                subTab === 'WHATSAPP'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💬 WhatsApp Bot
            </button>
          </div>
        </div>
      )}

      {/* Subtab 1: Quick Tickets App */}
      {subTab === 'QUICK_TICKETS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rd-surface p-3.5 rounded-rd-xl border border-rd-line shadow-xs">
            <div className="flex items-center gap-2">
              <label className="text-rd-12 font-semibold text-rd-ink">Filtrar por estado:</label>
              <CustomSelect
                className="min-w-[200px]"
                value={quickTicketFilter}
                onChange={setQuickTicketFilter}
                options={[
                  { value: 'ALL', label: `Todos los tickets (${quickTickets.length})` },
                  { value: 'PENDING', label: 'Pendientes' },
                  { value: 'IN_REVIEW', label: 'En Revisión' },
                  { value: 'CONVERTED', label: 'Convertidos' },
                  { value: 'ARCHIVED', label: 'Archivados' },
                ]}
              />
            </div>

            <button
              type="button"
              onClick={loadQuickTicketsData}
              className="bg-rd-surface hover:bg-rd-fondo text-rd-ink font-medium text-rd-12 h-8 px-3 rounded-rd-md border border-rd-line flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </button>
          </div>

          {loadingTickets ? (
            <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-8 text-center text-rd-ink-meta text-rd-12 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-rd-navy" />
              <span>Cargando tickets rápidos...</span>
            </div>
          ) : quickTickets.length === 0 ? (
            <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-8 text-center space-y-2 shadow-xs">
              <Inbox className="w-10 h-10 text-rd-ink-3 mx-auto" />
              <h4 className="font-semibold text-rd-ink text-rd-14">No se encontraron tickets rápidos</h4>
              <p className="text-rd-12 text-rd-ink-meta">
                Los tickets enviados desde la opción de Chatbot en la app aparecerán aquí para revisión del equipo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quickTickets.map((ticket) => (
                <QuickTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onStatusChange={handleUpdateQuickTicketStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: WhatsApp Reports */}
      {subTab === 'WHATSAPP' && (
        <div className="space-y-4">
          <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-3.5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-rd-ink-2 mb-1 text-rd-11 uppercase tracking-wider">
                  Verificación
                </label>
                <CustomSelect
                  className="w-full"
                  value={verificationFilter}
                  onChange={(val) => setVerificationFilter(val as ChatbotVerificationFilter)}
                  options={[
                    { value: 'ALL', label: 'Todos los estados' },
                    { value: 'PENDING_VERIFICATION', label: 'Pendientes' },
                    { value: 'VERIFIED', label: 'Verificados' },
                    { value: 'REJECTED', label: 'Rechazados' },
                  ]}
                />
              </div>

              <div>
                <label className="block font-semibold text-rd-ink-2 mb-1 text-rd-11 uppercase tracking-wider">
                  Prioridad
                </label>
                <CustomSelect
                  className="w-full"
                  value={priorityFilter}
                  onChange={(val) => setPriorityFilter(val as Priority | 'ALL')}
                  options={[
                    { value: 'ALL', label: 'Todas las prioridades' },
                    ...PRIORITY_OPTIONS.map((p) => ({
                      value: p,
                      label: `${PRIORITY_CONFIG[p].dot} ${PRIORITY_CONFIG[p].label}`,
                    })),
                  ]}
                />
              </div>

              <div>
                <label className="block font-semibold text-rd-ink-2 mb-1 text-rd-11 uppercase tracking-wider">
                  Orden
                </label>
                <CustomSelect
                  className="w-full"
                  value={sortBy}
                  onChange={(val) => setSortBy(val as ChatbotSortOption)}
                  options={[
                    { value: 'RECENT', label: 'Más recientes' },
                    { value: 'PRIORITY', label: 'Mayor prioridad' },
                  ]}
                />
              </div>
            </div>
          </div>

          {loadingWhatsapp ? (
            <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-8 flex items-center justify-center gap-2 text-rd-ink-meta text-rd-12">
              <Loader2 className="w-4 h-4 animate-spin text-rd-navy" />
              <span>{t('loading')}</span>
            </div>
          ) : chatbotReports.length === 0 ? (
            <div className="bg-rd-surface rounded-rd-xl border border-rd-line p-10 text-center space-y-2 shadow-xs">
              <Inbox className="w-10 h-10 text-rd-ink-3 mx-auto" />
              <h4 className="font-semibold text-rd-ink text-rd-14">No hay reportes de WhatsApp</h4>
              <p className="text-rd-ink-meta text-rd-12">
                No hay conversaciones procesadas que coincidan con los filtros seleccionados.
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatbotReportsList;
