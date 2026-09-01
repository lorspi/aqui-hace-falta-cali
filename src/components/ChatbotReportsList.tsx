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
import { Need, PlaceType, Priority, QuickTicket } from '../types';
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
import { useTranslation } from '../i18n/LanguageContext';

interface ChatbotReportsListProps {
  /** Muestra la cabecera de la sección (título + tagline). @default true */
  showHeader?: boolean;
  /** Operador autenticado en el panel (se pasa al detalle para `verified_by`). */
  operator?: AdminUser | null;
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
      className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
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
          {new Date(report.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <h4 className="font-bold text-slate-900 text-sm leading-snug">{title}</h4>

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
      </div>
    </div>
  );
}

/** Componente de Tarjeta para QuickTicket */
function QuickTicketCard({ ticket, onStatusChange }: { ticket: QuickTicket; onStatusChange: (id: string, newStatus: string) => void }) {
  const cleanPhone = ticket.contactPhone.replace(/[^0-9]/g, '');

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'PENDING':
        return <span className="bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">◷ Pendiente</span>;
      case 'IN_REVIEW':
        return <span className="bg-blue-50 text-blue-800 border border-blue-300 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">🔍 En Revisión</span>;
      case 'CONVERTED':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">✓ Convertido</span>;
      case 'ARCHIVED':
        return <span className="bg-slate-100 text-slate-600 border border-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">📁 Archivada</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          {getStatusBadge(ticket.status)}
          <span className="text-[10px] font-mono text-slate-400">#{ticket.id.slice(0, 8)}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400">
          {new Date(ticket.createdAt).toLocaleString('es-CO', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Necesidad expresada */}
      <div>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide text-blue-600">Necesidad Solicitada</h4>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          "{ticket.needSummary}"
        </p>
      </div>

      {/* Ubicación y Contacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Ubicación</span>
            <span className="font-semibold">{ticket.locationText}</span>
          </div>
        </div>

        <div className="flex items-start gap-1.5">
          <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Contacto</span>
            <span className="font-bold text-slate-900">{ticket.contactPhone}</span>
            {ticket.contactName && <span className="text-slate-500 text-[11px]"> ({ticket.contactName})</span>}
          </div>
        </div>
      </div>

      {/* Detalles Adicionales */}
      {ticket.additionalDetails && (
        <div className="text-xs text-slate-600 bg-amber-50/60 border border-amber-100 p-2 rounded-xl">
          <strong className="text-amber-900 font-bold block text-[10px] uppercase">Detalles adicionales:</strong>
          <span>{ticket.additionalDetails}</span>
        </div>
      )}

      {/* Acciones del Moderador */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {cleanPhone && (
            <a
              href={`https://wa.me/57${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
          )}
          <a
            href={`tel:${ticket.contactPhone}`}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
          >
            <Phone className="w-3 h-3" />
            <span>Llamar</span>
          </a>
        </div>

        {/* Cambiar Estado */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Estado:</span>
          <select
            value={ticket.status}
            onChange={(e) => onStatusChange(ticket.id, e.target.value)}
            className="bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold py-1 px-2 text-slate-800 cursor-pointer"
          >
            <option value="PENDING">Pendiente</option>
            <option value="IN_REVIEW">En Revisión</option>
            <option value="CONVERTED">Convertido</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export const ChatbotReportsList: React.FC<ChatbotReportsListProps> = ({
  showHeader = true,
  operator = null,
}) => {
  const { t, language } = useTranslation();
  const [subTab, setSubTab] = useState<'QUICK_TICKETS' | 'WHATSAPP'>('QUICK_TICKETS');

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
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Filtrar por estado:</label>
              <select
                value={quickTicketFilter}
                onChange={(e) => setQuickTicketFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold py-1.5 px-3 text-slate-800"
              >
                <option value="ALL">Todos los tickets ({quickTickets.length})</option>
                <option value="PENDING">Pendientes</option>
                <option value="IN_REVIEW">En Revisión</option>
                <option value="CONVERTED">Convertidos</option>
                <option value="ARCHIVED">Archivados</option>
              </select>
            </div>

            <button
              onClick={loadQuickTicketsData}
              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </button>
          </div>

          {loadingTickets ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Cargando tickets rápidos...</span>
            </div>
          ) : quickTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-xs">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">No se encontraron tickets rápidos</h4>
              <p className="text-xs text-slate-500">
                Los tickets enviados desde la opción de Chatbot en la app aparecerán aquí para revisión del equipo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">
                  Verificación
                </label>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value as ChatbotVerificationFilter)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="PENDING_VERIFICATION">Pendientes</option>
                  <option value="VERIFIED">Verificados</option>
                  <option value="REJECTED">Rechazados</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">
                  Prioridad
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as Priority | 'ALL')}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                >
                  <option value="ALL">Todas las prioridades</option>
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_CONFIG[p].dot} {PRIORITY_CONFIG[p].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">
                  Orden
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ChatbotSortOption)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                >
                  <option value="RECENT">Más recientes</option>
                  <option value="PRIORITY">Mayor prioridad</option>
                </select>
              </div>
            </div>
          </div>

          {loadingWhatsapp ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('loading')}</span>
            </div>
          ) : chatbotReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-sm">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">No hay reportes de WhatsApp</h4>
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
