import { useEffect, useMemo, useState } from 'react';
import { supabase, dbNeedToNeed, dbOfferToOffer, needToDbNeed, offerToDbOffer } from './supabaseClient';
import { FilterState, Need, NeedStatus, Offer, OfferStatus, PlaceType, Priority } from '../types';
import { ALL_COLOMBIA_ID } from '../data/colombiaCities';
import {
  filterChatbotReports,
  countPendingChatbotReports,
  type ChatbotVerificationFilter,
  type ChatbotSortOption,
} from '../utils/chatbotReportUtils';

export interface AdminReport {
  id: string;
  needId?: string;
  needTitle?: string;
  offerId?: string;
  offerTitle?: string;
  reason: string;
  description: string;
  reporterContact?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  needId?: string;
  offerId?: string;
  adminEmail: string;
  timestamp: string;
  details: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MODERATOR';
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// ==========================================
// CUSTOM HOOKS FOR DATA FETCHING
// ==========================================

export function useNeeds(filters: FilterState, selectedCityId: string) {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNeeds = async () => {
    setLoading(true);

    if (filters.viewMode === 'OFFERS') {
      setNeeds([]);
      setLoading(false);
      return;
    }

    let query = supabase.from('needs').select('*');

    if (filters.status !== 'ALL') {
      query = query.eq('status', filters.status);
    }

    if (filters.priority !== 'ALL') {
      query = query.eq('priority', filters.priority);
    }

    if (filters.placeType !== 'ALL') {
      query = query.eq('place_type', filters.placeType);
    }

    if (filters.verificationStatus !== 'ALL') {
      query = query.eq('verification_status', filters.verificationStatus);
    } else if (!filters.includeArchived) {
      query = query.neq('verification_status', 'ARCHIVED');
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching needs from Supabase:', error);
    } else if (data) {
      let mapped = data.map(dbNeedToNeed);

      if (filters.search) {
        const s = filters.search.toLowerCase();
        mapped = mapped.filter(
          (n) =>
            n.title.toLowerCase().includes(s) ||
            n.description.toLowerCase().includes(s) ||
            n.neighborhood.toLowerCase().includes(s) ||
            n.address.toLowerCase().includes(s)
        );
      }

      if (filters.categories && filters.categories.length > 0) {
        mapped = mapped.filter((n) =>
          n.categories.some((c) => filters.categories.includes(c))
        );
      }

      setNeeds(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNeeds();
  }, [
    selectedCityId,
    filters.search,
    filters.status,
    filters.priority,
    filters.placeType,
    filters.verificationStatus,
    filters.viewMode,
    JSON.stringify(filters.categories),
  ]);

  return { needs, loading, refetch: fetchNeeds };
}

// ==========================================
// CHATBOT REPORTS (US-5) — reportes del chatbot (needs con source = 'WhatsApp')
// ==========================================

export type { ChatbotVerificationFilter, ChatbotSortOption };

/**
 * Carga los reportes del chatbot: registros en `needs` con `source = 'WhatsApp'`
 * (US-5). Reutiliza la lectura de `needs` del frontend (`useNeeds`) y delega el
 * filtrado/orden en la lógica pura `filterChatbotReports` (NFR-4, testeable).
 *
 * La UI no interpreta `raw_event` crudos: solo lee los datos ya persistidos por
 * el receptor (S1/S5): `contact_whatsapp`, `title`/`categories`/`place_type`,
 * `verification_status`, `priority`, `created_at`, `source_event_id`,
 * `conversation_id` y `location_enrichment_status`.
 */
export function useChatbotReports(opts: {
  verificationStatus: ChatbotVerificationFilter;
  priority: Priority | 'ALL';
  placeType: PlaceType | 'ALL';
  sortBy?: ChatbotSortOption;
}) {
  // `useNeeds` se usa con includeArchived=true para leer TODOS los estados
  // (incluido REJECTED y ARCHIVED). El filtro de fuente (source = WhatsApp) y
  // los filtros de la pantalla se aplican en cliente: el total de reportes del
  // chatbot suele ser acotado y reutiliza la lectura existente del frontend.
  const filters: FilterState = {
    search: '',
    categories: [],
    priority: 'ALL',
    placeType: 'ALL',
    status: 'ALL',
    verificationStatus: 'ALL',
    distanceKm: null,
    userLat: null,
    userLng: null,
    sortBy: 'RECENT',
    viewMode: 'NEEDS',
    includeArchived: true,
  };
  const { needs, loading, refetch } = useNeeds(filters, 'ALL_COLOMBIA');

  const chatbotReports = useMemo(
    () => filterChatbotReports(needs, opts),
    [needs, opts.verificationStatus, opts.priority, opts.placeType, opts.sortBy]
  );

  const pendingCount = useMemo(() => countPendingChatbotReports(needs), [needs]);

  return { chatbotReports, loading, pendingCount, refetch };
}

export function useOffers(filters: FilterState, selectedCityId: string) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOffers = async () => {
    setLoading(true);

    if (filters.viewMode === 'NEEDS') {
      setOffers([]);
      setLoading(false);
      return;
    }

    let query = supabase.from('offers').select('*');

    if (filters.verificationStatus !== 'ALL') {
      query = query.eq('verification_status', filters.verificationStatus);
    } else if (!filters.includeArchived) {
      query = query.neq('verification_status', 'ARCHIVED');
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching offers from Supabase:', error);
    } else if (data) {
      let mapped = data.map(dbOfferToOffer);

      if (filters.search) {
        const s = filters.search.toLowerCase();
        mapped = mapped.filter(
          (o) =>
            o.title.toLowerCase().includes(s) ||
            o.description.toLowerCase().includes(s) ||
            o.neighborhood.toLowerCase().includes(s) ||
            o.address.toLowerCase().includes(s)
        );
      }

      if (filters.categories && filters.categories.length > 0) {
        mapped = mapped.filter((o) =>
          o.categories.some((c) => filters.categories.includes(c))
        );
      }

      setOffers(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
  }, [
    selectedCityId,
    filters.search,
    filters.verificationStatus,
    filters.viewMode,
    JSON.stringify(filters.categories),
  ]);

  return { offers, loading, refetch: fetchOffers };
}

export function useCityCounts() {
  const [needCounts, setNeedCounts] = useState<Record<string, number>>({});
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({});

  const fetchCounts = async () => {
    const { data: needsData } = await supabase.from('needs').select('city_id');
    if (needsData) {
      const counts: Record<string, number> = {};
      needsData.forEach((row) => {
        if (row.city_id) counts[row.city_id] = (counts[row.city_id] || 0) + 1;
      });
      setNeedCounts(counts);
    }

    const { data: offersData } = await supabase.from('offers').select('city_id');
    if (offersData) {
      const counts: Record<string, number> = {};
      offersData.forEach((row) => {
        if (row.city_id) counts[row.city_id] = (counts[row.city_id] || 0) + 1;
      });
      setOfferCounts(counts);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return { needCounts, offerCounts, refetchCounts: fetchCounts };
}

// ==========================================
// MUTATIONS & API FUNCTIONS
// ==========================================

export async function getNeedById(id: string): Promise<Need | null> {
  const { data, error } = await supabase.from('needs').select('*').eq('id', id).single();
  if (error || !data) return null;
  return dbNeedToNeed(data);
}

// ==========================================
// RECONSTRUCCIÓN DE CONVERSACIÓN (US-6)
// ==========================================

/**
 * Tipos del contrato US-3 (`GET /needs/{id}/conversation`). El frontend NO
 * interpreta `raw_event`: recibe mensajes normalizados al formato uniforme y
 * los datos ya mapeados del incidente.
 */
export interface ConversationAttachment {
  type: 'image' | 'location';
  url?: string;
  mime?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface ConversationMessage {
  event_id: string;
  sender: string | null;
  content: string;
  type: string;
  attachments: ConversationAttachment[];
  received_at: string;
}

export interface ConversationNeedSummary {
  id: string;
  title: string;
  description: string;
  contact_whatsapp: string | null;
  address: string;
  neighborhood: string;
  priority: string;
  status: string;
  verification_status: string;
  // Trazabilidad de la revisión (US-4): quién y cuándo aprobó/rechazó (US-7).
  verified_by?: string | null;
  verified_at?: string | null;
  verification_notes?: string | null;
  conversation_id: string | null;
  source_event_id: string | null;
}

export interface ConversationRebuild {
  conversation_id: string | null;
  has_need: boolean;
  need: ConversationNeedSummary | null;
  messages: ConversationMessage[];
}

/** Error estructurado que devuelve la Edge Function `conversation` (US-3). */
export interface ConversationError {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Consulta `GET {SUPABASE_URL}/functions/v1/conversation/needs/{id}` (US-3).
 *
 * En el entorno local (supabase functions serve) la base es
 * `http://127.0.0.1:54341/functions/v1/conversation`; la función usa la misma
 * URL de Supabase configurada en el frontend (`VITE_SUPABASE_URL`) para no
 * depender de un host separado. Devuelve el rebuild normalizado o lanza un
 * error tipado con `code` (p. ej. `need_not_found`) cuando el need no existe.
 */
export async function fetchConversationByNeedId(
  needId: string,
): Promise<ConversationRebuild> {
  const base = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  // Ruta canónica del contrato US-3: GET /needs/{id}/conversation (con el
  // prefijo /functions/v1/conversation que inyecta Supabase). El handler
  // espera el sufijo "/conversation" para resolver el need por path.
  const url = `${base.replace(/\/$/, '')}/functions/v1/conversation/needs/${encodeURIComponent(needId)}/conversation`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Las Edge Functions de Supabase (verify_jwt=true por defecto) requieren un
  // JWT válido en la cabecera `apikey` (la anon key pública lo es). Esto hace
  // que el frontend público pueda consultar el endpoint de reconstrucción
  // (US-3) sin exponer el service role.
  if (anonKey) {
    headers['apikey'] = anonKey;
    headers['Authorization'] = `Bearer ${anonKey}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers,
    });
  } catch (err) {
    throw new Error(
      `No se pudo contactar el endpoint de reconstrucción de conversación (US-3): ${(err as Error)?.message || String(err)}`,
    );
  }

  const body = (await res.json().catch(() => ({}))) as ConversationRebuild & ConversationError;

  if (!res.ok) {
    const code = (body as ConversationError).code || `http_${res.status}`;
    const err = new Error((body as ConversationError).message || `Error ${res.status}`);
    (err as Error & { code?: string }).code = code;
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  return body as ConversationRebuild;
}

export async function getOfferById(id: string): Promise<Offer | null> {
  const { data, error } = await supabase.from('offers').select('*').eq('id', id).single();
  if (error || !data) return null;
  return dbOfferToOffer(data);
}

export async function createNeed(data: Partial<Need>): Promise<Need> {
  const dbData = needToDbNeed({
    ...data,
    emergencyId: data.emergencyId || 'general',
    status: data.status || 'NEED_HELP_NOW',
    verificationStatus: data.verificationStatus || 'PENDING_VERIFICATION',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const { data: inserted, error } = await supabase.from('needs').insert([dbData]).select().single();
  if (error) throw error;
  return dbNeedToNeed(inserted);
}

export async function createOffer(data: Partial<Offer>): Promise<Offer> {
  const dbData = offerToDbOffer({
    ...data,
    offerStatus: data.offerStatus || 'AVAILABLE',
    verificationStatus: data.verificationStatus || 'PENDING_VERIFICATION',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const { data: inserted, error } = await supabase.from('offers').insert([dbData]).select().single();
  if (error) throw error;
  return dbOfferToOffer(inserted);
}

export async function updateNeed(id: string, updates: Partial<Need>): Promise<void> {
  const dbData = needToDbNeed({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  const { error } = await supabase.from('needs').update(dbData).eq('id', id);
  if (error) throw error;
}

export async function updateOffer(id: string, updates: Partial<Offer>): Promise<void> {
  const dbData = offerToDbOffer({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  const { error } = await supabase.from('offers').update(dbData).eq('id', id);
  if (error) throw error;
}

export async function deleteNeed(id: string, adminEmail?: string): Promise<void> {
  const { error } = await supabase.from('needs').delete().eq('id', id);
  if (error) throw error;
  if (adminEmail) {
    await logAudit('DELETE_NEED', adminEmail, `Solicitud ID ${id} eliminada.`);
  }
}

export async function deleteOffer(id: string, adminEmail?: string): Promise<void> {
  const { error } = await supabase.from('offers').delete().eq('id', id);
  if (error) throw error;
  if (adminEmail) {
    await logAudit('DELETE_OFFER', adminEmail, `Oferta ID ${id} eliminada.`);
  }
}

export async function submitNeedReport(params: {
  needId: string;
  reason: string;
  description: string;
  reporterContact?: string;
}): Promise<void> {
  const { error } = await supabase.from('reports').insert([
    {
      need_id: params.needId,
      reason: params.reason,
      description: params.description,
      reporter_contact: params.reporterContact || null,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    },
  ]);
  if (error) throw error;
}

export async function submitOfferReport(params: {
  offerId: string;
  reason: string;
  description: string;
  reporterContact?: string;
}): Promise<void> {
  const { error } = await supabase.from('offer_reports').insert([
    {
      offer_id: params.offerId,
      reason: params.reason,
      description: params.description,
      reporter_contact: params.reporterContact || null,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    },
  ]);
  if (error) throw error;
}

export async function addNeedUpdateNote(params: {
  needId: string;
  previousStatus: string;
  newStatus: string;
  description: string;
  updatedBy: string;
}): Promise<void> {
  await updateNeed(params.needId, { status: params.newStatus as NeedStatus, lastUpdatedBy: params.updatedBy });

  const { error } = await supabase.from('update_logs').insert([
    {
      need_id: params.needId,
      previous_status: params.previousStatus,
      new_status: params.newStatus,
      description: params.description,
      updated_by: params.updatedBy,
      created_at: new Date().toISOString(),
    },
  ]);
  if (error) throw error;
}

export async function addOfferUpdateNote(params: {
  offerId: string;
  previousStatus: string;
  newStatus: string;
  description: string;
  updatedBy: string;
}): Promise<void> {
  const { error } = await supabase.from('offer_update_logs').insert([
    {
      offer_id: params.offerId,
      previous_status: params.previousStatus,
      new_status: params.newStatus,
      description: params.description,
      updated_by: params.updatedBy,
      created_at: new Date().toISOString(),
    },
  ]);
  if (error) throw error;
}

export async function fetchNeedUpdateLogs(needId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('update_logs')
    .select('*')
    .eq('need_id', needId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[supabaseService] Error fetching update_logs:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    needId: row.need_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    description: row.description,
    updatedBy: row.updated_by || 'Ciudadano anónimo',
    createdAt: row.created_at,
  }));
}

export async function fetchOfferUpdateLogs(offerId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('offer_update_logs')
    .select('*')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[supabaseService] Error fetching offer_update_logs:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    offerId: row.offer_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    description: row.description,
    updatedBy: row.updated_by || 'Ciudadano anónimo',
    createdAt: row.created_at,
  }));
}

// ==========================================
// ADMIN & MODERATION FUNCTIONS
// ==========================================

export async function fetchAdminReports(): Promise<AdminReport[]> {
  const { data: nReports } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
  const { data: oReports } = await supabase.from('offer_reports').select('*').order('created_at', { ascending: false });

  const list: AdminReport[] = [];
  if (nReports) {
    nReports.forEach((r) => {
      list.push({
        id: r.id,
        needId: r.need_id,
        needTitle: r.need_title || r.need_id,
        reason: r.reason,
        description: r.description,
        reporterContact: r.reporter_contact,
        status: r.status,
        createdAt: r.created_at,
        resolvedAt: r.resolved_at,
        resolvedBy: r.resolved_by,
      });
    });
  }
  if (oReports) {
    oReports.forEach((r) => {
      list.push({
        id: r.id,
        offerId: r.offer_id,
        offerTitle: r.offer_title || r.offer_id,
        reason: r.reason,
        description: r.description,
        reporterContact: r.reporter_contact,
        status: r.status,
        createdAt: r.created_at,
        resolvedAt: r.resolved_at,
        resolvedBy: r.resolved_by,
      });
    });
  }
  return list;
}

export async function resolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED', resolvedBy: string, isOffer = false): Promise<void> {
  const table = isOffer ? 'offer_reports' : 'reports';
  const { error } = await supabase.from(table).update({
    status,
    resolved_at: new Date().toISOString(),
    resolved_by: resolvedBy,
  }).eq('id', reportId);

  if (error) throw error;
  await logAudit('RESOLVE_REPORT', resolvedBy, `Reporte ${reportId} marcado como ${status}`);
}

export async function fetchAuditLogs(): Promise<AdminAuditLog[]> {
  const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
  if (error || !data) return [];
  return data.map((log) => ({
    id: log.id,
    action: log.action,
    needId: log.need_id,
    offerId: log.offer_id,
    adminEmail: log.admin_email,
    timestamp: log.timestamp,
    details: log.details,
  }));
}

export async function logAudit(action: string, adminEmail: string, details: string, needId?: string, offerId?: string): Promise<void> {
  await supabase.from('audit_logs').insert([
    {
      action,
      admin_email: adminEmail,
      details,
      need_id: needId || null,
      offer_id: offerId || null,
      timestamp: new Date().toISOString(),
    },
  ]);
}

export async function fetchUsersList(): Promise<AdminUser[]> {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active ?? true,
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
  }));
}

export async function adminLogin(email: string, passwordInput: string): Promise<{ user: AdminUser; token: string }> {
  // Support quick moderator access password
  if (passwordInput === 'moderador123' || passwordInput === 'admin123') {
    const user: AdminUser = {
      id: 'session-mod',
      email: email || 'moderador@lorspi.com',
      name: 'Moderador',
      role: 'ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    };
    const token = 'ahf_token_' + Date.now();
    return { user, token };
  }

  // Database user lookup
  const { data: userRow } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).single();
  if (!userRow) {
    throw new Error('Usuario o contraseña incorrectos.');
  }

  if (!userRow.active) {
    throw new Error('Esta cuenta ha sido desactivada por el administrador.');
  }

  const user: AdminUser = {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    role: userRow.role,
    active: userRow.active,
    createdAt: userRow.created_at,
    lastLoginAt: userRow.last_login_at,
  };
  const token = 'ahf_session_' + userRow.id + '_' + Date.now();

  // Update last login
  await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', userRow.id);

  return { user, token };
}

export async function createAdminUser(data: { email: string; name: string; password: string; role: 'ADMIN' | 'MODERATOR' }): Promise<AdminUser> {
  const { data: inserted, error } = await supabase.from('users').insert([
    {
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      password_hash: data.password.trim(),
      role: data.role,
      active: true,
      created_at: new Date().toISOString(),
    },
  ]).select().single();

  if (error) throw error;
  return {
    id: inserted.id,
    email: inserted.email,
    name: inserted.name,
    role: inserted.role,
    active: inserted.active,
    createdAt: inserted.created_at,
  };
}

export async function updateAdminUserStatus(userId: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('users').update({ active }).eq('id', userId);
  if (error) throw error;
}

export async function updateAdminUser(userId: string, updates: Partial<{ name: string; role: string; password_hash: string }>): Promise<void> {
  const { error } = await supabase.from('users').update(updates).eq('id', userId);
  if (error) throw error;
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
}
