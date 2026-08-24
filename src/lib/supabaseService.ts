import { useEffect, useState } from 'react';
import { supabase, dbNeedToNeed, dbOfferToOffer, needToDbNeed, offerToDbOffer } from './supabaseClient';
import { FilterState, HelpCategory, Need, NeedStatus, Offer, OfferStatus, Priority } from '../types';
import { ALL_COLOMBIA_ID, getCityCoordinates, findDepartmentByCityId } from '../data/colombiaCities';

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
    const { data: needsData } = await supabase.from('needs').select('city_id, department_id');
    if (needsData) {
      const counts: Record<string, number> = {};
      needsData.forEach((row) => {
        if (row.city_id) {
          const rawDept = (row.department_id || '').toLowerCase().trim();
          const deptId = rawDept || findDepartmentByCityId(row.city_id)?.id || 'valle-del-cauca';
          const key = `${deptId}:${row.city_id.toLowerCase().trim()}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      setNeedCounts(counts);
    }

    const { data: offersData } = await supabase.from('offers').select('city_id, department_id');
    if (offersData) {
      const counts: Record<string, number> = {};
      offersData.forEach((row) => {
        if (row.city_id) {
          const rawDept = (row.department_id || '').toLowerCase().trim();
          const deptId = rawDept || findDepartmentByCityId(row.city_id)?.id || 'valle-del-cauca';
          const key = `${deptId}:${row.city_id.toLowerCase().trim()}`;
          counts[key] = (counts[key] || 0) + 1;
        }
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

export async function getOfferById(id: string): Promise<Offer | null> {
  const { data, error } = await supabase.from('offers').select('*').eq('id', id).single();
  if (error || !data) return null;
  return dbOfferToOffer(data);
}

export async function createNeed(data: Partial<Need>): Promise<Need> {
  const activeCityId = (data.cityId && data.cityId.trim()) ? data.cityId : 'cali';
  const cityCoords = getCityCoordinates(activeCityId);
  const lat = data.latitude != null && !isNaN(data.latitude) ? data.latitude : cityCoords.lat;
  const lng = data.longitude != null && !isNaN(data.longitude) ? data.longitude : cityCoords.lng;

  const dbData = needToDbNeed({
    ...data,
    emergencyId: data.emergencyId || 'general',
    cityId: activeCityId,
    latitude: lat,
    longitude: lng,
    status: data.status || 'NEED_HELP_NOW',
    verificationStatus: data.verificationStatus || 'PENDING_VERIFICATION',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log('📤 Intentando guardar en Supabase (needs):', dbData);
  const { data: inserted, error } = await supabase.from('needs').insert([dbData]).select().single();
  if (error) {
    console.error('❌ Error Supabase al crear necesidad:', error);
    throw new Error(error.message || error.details || error.hint || JSON.stringify(error));
  }
  return dbNeedToNeed(inserted);
}

export async function createOffer(data: Partial<Offer>): Promise<Offer> {
  const activeCityId = (data.cityId && data.cityId.trim()) ? data.cityId : 'cali';
  const cityCoords = getCityCoordinates(activeCityId);
  const lat = data.latitude != null && !isNaN(data.latitude) ? data.latitude : cityCoords.lat;
  const lng = data.longitude != null && !isNaN(data.longitude) ? data.longitude : cityCoords.lng;

  const dbData = offerToDbOffer({
    ...data,
    cityId: activeCityId,
    latitude: lat,
    longitude: lng,
    offerStatus: data.offerStatus || 'AVAILABLE',
    verificationStatus: data.verificationStatus || 'PENDING_VERIFICATION',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log('📤 Intentando guardar en Supabase (offers):', dbData);
  const { data: inserted, error } = await supabase.from('offers').insert([dbData]).select().single();
  if (error) {
    console.error('❌ Error Supabase al crear oferta:', error);
    throw new Error(error.message || error.details || error.hint || JSON.stringify(error));
  }
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
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.full_name || u.email,
    role: (u.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : (u.role === 'moderador' ? 'MODERATOR' : 'USER')) as any,
    active: u.is_verified ?? true,
    createdAt: u.created_at,
    lastLoginAt: u.updated_at,
  }));
}

export async function adminLogin(email: string, passwordInput: string): Promise<{ user: AdminUser; token: string }> {
  // 1. Intentar inicio de sesión nativo con Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: passwordInput,
  });

  if (authError || !authData.user) {
    // Si falla la autenticación de Supabase, probar clave de paso temporal de acceso de moderación
    if (passwordInput === 'moderador123' || passwordInput === 'admin123') {
      const fallbackUser: AdminUser = {
        id: 'session-mod',
        email: email || 'moderador@aquihacefalta.com',
        name: 'Moderador de Emergencia',
        role: 'ADMIN',
        active: true,
        createdAt: new Date().toISOString(),
      };
      const token = 'ahf_token_' + Date.now();
      return { user: fallbackUser, token };
    }
    throw new Error(authError?.message || 'Correo o contraseña incorrectos.');
  }

  // 2. Consultar el perfil en public.profiles para verificar rol y estado
  const profile = await fetchUserProfile(authData.user.id);
  const roleUpper = (profile?.role || authData.user.user_metadata?.role || '').toString().toUpperCase();

  const isModeratorOrAdmin = roleUpper === 'ADMIN' || roleUpper === 'MODERADOR' || roleUpper === 'MODERATOR';

  if (!isModeratorOrAdmin) {
    throw new Error('No tienes permisos de moderación o administración.');
  }

  const userObj: AdminUser = {
    id: authData.user.id,
    email: authData.user.email || email,
    name: profile?.full_name || authData.user.user_metadata?.full_name || 'Moderador',
    role: roleUpper.includes('ADMIN') ? 'ADMIN' : 'MODERATOR',
    active: true,
    createdAt: profile?.created_at || authData.user.created_at,
    lastLoginAt: new Date().toISOString(),
  };

  const token = authData.session?.access_token || ('ahf_session_' + authData.user.id);

  return { user: userObj, token };
}

export async function createAdminUser(data: { email: string; name: string; password: string; role: 'ADMIN' | 'MODERATOR' }): Promise<AdminUser> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email.trim(),
    password: data.password.trim(),
    options: {
      data: {
        full_name: data.name.trim(),
        role: data.role.toLowerCase(),
      },
    },
  });

  if (authError || !authData.user) throw authError || new Error('No se pudo crear el usuario.');

  await upsertUserProfile({
    id: authData.user.id,
    email: data.email,
    full_name: data.name,
    role: data.role.toLowerCase(),
  });

  return {
    id: authData.user.id,
    email: data.email,
    name: data.name,
    role: data.role,
    active: true,
    createdAt: new Date().toISOString(),
  };
}

export async function updateAdminUserStatus(userId: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_verified: active }).eq('id', userId);
  if (error) throw error;
}

export async function updateAdminUser(userId: string, updates: Partial<{ name: string; role: string; password_hash: string }>): Promise<void> {
  const payload: Record<string, any> = {};
  if (updates.name) payload.full_name = updates.name;
  if (updates.role) payload.role = updates.role.toLowerCase();
  
  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) throw error;
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}

// ==========================================
// GOOGLE OAUTH AUTHENTICATION
// ==========================================

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
    },
  });
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOutUser(): Promise<void> {
  await supabase.auth.signOut();
}

export async function fetchUserProfile(userId: string) {
  if (!userId) return null;

  // 1. Buscar por ID en la tabla `profiles`
  try {
    const { data: profileById } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileById) return profileById;
  } catch (e) {}

  // 2. Buscar por correo de la sesión exclusivamente en `profiles`
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUser = sessionData?.session?.user;
  const sessionEmail = currentUser?.email;

  if (sessionEmail) {
    const cleanEmail = sessionEmail.trim().toLowerCase();

    try {
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profileByEmail) return profileByEmail;
    } catch (e) {}
  }

  return null;
}

export async function upsertUserProfile(profileData: {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  phone_country_code?: string;
  phone_number?: string;
  phone?: string;
  document_type?: string;
  document_number?: string;
  country?: string;
  department?: string;
  city?: string;
  is_auto_detected_location?: boolean;
  role?: string;
  accept_terms?: boolean;
  terms_accepted_at?: string;
  moderator_community_collective?: string;
  moderator_motivation?: string;
  moderation_status?: string;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert([
      {
        id: profileData.id,
        email: profileData.email?.trim().toLowerCase(),
        first_name: profileData.first_name?.trim(),
        last_name: profileData.last_name?.trim(),
        full_name: profileData.full_name?.trim(),
        phone_country_code: profileData.phone_country_code || '+57',
        phone_number: profileData.phone_number?.trim(),
        phone: profileData.phone,
        document_type: profileData.document_type || 'cedula',
        document_number: profileData.document_number?.trim(),
        country: profileData.country || 'Colombia',
        department: profileData.department || 'Quindío',
        city: profileData.city || 'Armenia',
        is_auto_detected_location: profileData.is_auto_detected_location ?? true,
        role: profileData.role || 'voluntario',
        accept_terms: profileData.accept_terms ?? true,
        terms_accepted_at: profileData.terms_accepted_at || new Date().toISOString(),
        moderator_community_collective: profileData.moderator_community_collective?.trim(),
        moderator_motivation: profileData.moderator_motivation?.trim(),
        moderation_status: profileData.moderation_status || (profileData.role === 'moderador' ? 'PENDING' : 'APPROVED'),
        is_verified: false,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Error upserting profile:', error);
    throw error;
  }

  return data;
}

export async function upsertOrganization(orgData: {
  user_id: string;
  org_name: string;
  organization_type: string;
  description?: string;
  website_or_social?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}) {
  const { data, error } = await supabase
    .from('organizations')
    .upsert([
      {
        user_id: orgData.user_id,
        org_name: orgData.org_name?.trim(),
        organization_type: orgData.organization_type,
        description: orgData.description?.trim(),
        website_or_social: orgData.website_or_social?.trim(),
        address: orgData.address?.trim(),
        latitude: orgData.latitude,
        longitude: orgData.longitude,
        is_verified: false,
      },
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Error upserting organization:', error);
    throw error;
  }
  return data;
}

export async function fetchUserOrganization(userId: string) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Supabase] Error fetching user organization:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[Supabase] Exception fetching user organization:', err);
    return null;
  }
}

// ==========================================
// MATCHING FUNCTIONS (NEEDS <-> OFFERS)
// ==========================================

export interface MatchingOfferResult {
  offer: Offer;
  score: number;
  matchingCategories: HelpCategory[];
  distanceKm?: number;
}

export interface MatchingNeedResult {
  need: Need;
  score: number;
  matchingCategories: HelpCategory[];
  distanceKm?: number;
}

export async function fetchMatchingOffersForNeed(needId: string, limit: number = 5): Promise<MatchingOfferResult[]> {
  try {
    const { data, error } = await supabase.rpc('get_matching_offers_for_need', {
      p_need_id: needId,
      p_limit: limit,
    });

    if (!error && data && Array.isArray(data) && data.length > 0) {
      const offerIds = data.map((item: any) => item.offer_id || item.id).filter(Boolean);
      if (offerIds.length > 0) {
        const { data: rawOffers } = await supabase
          .from('offers')
          .select('*')
          .in('id', offerIds);

        if (rawOffers) {
          const offersMap = new Map<string, Offer>();
          for (const raw of rawOffers) {
            const offer = dbOfferToOffer(raw);
            offersMap.set(offer.id, offer);
          }

          const results: MatchingOfferResult[] = [];
          for (const item of data) {
            const id = item.offer_id || item.id;
            const offer = offersMap.get(id);
            if (offer) {
              results.push({
                offer,
                score: item.score || 85,
                matchingCategories: item.matching_categories || item.matchingCategories || [],
                distanceKm: typeof item.distance_km === 'number' ? item.distance_km : undefined,
              });
            }
          }
          if (results.length > 0) return results;
        }
      }
    }

    // Fallback garantizado en JS
    const { data: currentNeedRow } = await supabase.from('needs').select('*').eq('id', needId).maybeSingle();
    if (!currentNeedRow) return [];
    const need = dbNeedToNeed(currentNeedRow);

    const { data: rawOffers } = await supabase
      .from('offers')
      .select('*')
      .not('offer_status', 'in', '("CLOSED","ARCHIVED")')
      .limit(50);

    if (!rawOffers || rawOffers.length === 0) return [];

    const needCats = Array.isArray(need.categories) ? need.categories : [];
    const matches: MatchingOfferResult[] = [];

    for (const raw of rawOffers) {
      const offer = dbOfferToOffer(raw);
      if (offer.id === need.id) continue;

      const offerCats = Array.isArray(offer.categories) ? offer.categories : [];
      const common = offerCats.filter((cat) => needCats.includes(cat));
      const sameCity = !need.cityId || !offer.cityId || need.cityId === offer.cityId;

      if (common.length > 0 || sameCity) {
        const score = Math.min(98, 70 + (sameCity ? 15 : 0) + (common.length * 8));
        matches.push({
          offer,
          score,
          matchingCategories: common.length > 0 ? common : offer.categories,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, limit);
  } catch (err) {
    console.error('Error in fetchMatchingOffersForNeed:', err);
    return [];
  }
}

export async function fetchMatchingNeedsForOffer(offerId: string, limit: number = 5): Promise<MatchingNeedResult[]> {
  try {
    const { data, error } = await supabase.rpc('get_matching_needs_for_offer', {
      p_offer_id: offerId,
      p_limit: limit,
    });

    if (!error && data && Array.isArray(data) && data.length > 0) {
      const needIds = data.map((item: any) => item.need_id || item.id).filter(Boolean);
      const { data: rawNeeds } = await supabase.from('needs').select('*').in('id', needIds);
      if (rawNeeds) {
        const needsMap = new Map<string, Need>();
        for (const raw of rawNeeds) {
          const need = dbNeedToNeed(raw);
          needsMap.set(need.id, need);
        }
        const results: MatchingNeedResult[] = [];
        for (const item of data) {
          const id = item.need_id || item.id;
          const need = needsMap.get(id);
          if (need) {
            results.push({
              need,
              score: item.score || 85,
              matchingCategories: item.matching_categories || item.matchingCategories || [],
              distanceKm: typeof item.distance_km === 'number' ? item.distance_km : undefined,
            });
          }
        }
        if (results.length > 0) return results;
      }
    }

    // Fallback garantizado en JS
    const { data: currentOfferRow } = await supabase.from('offers').select('*').eq('id', offerId).maybeSingle();
    if (!currentOfferRow) return [];
    const offer = dbOfferToOffer(currentOfferRow);

    const { data: rawNeeds } = await supabase
      .from('needs')
      .select('*')
      .not('status', 'in', '("COVERED","CLOSED","ARCHIVED")')
      .limit(50);

    if (!rawNeeds || rawNeeds.length === 0) return [];

    const offerCats = Array.isArray(offer.categories) ? offer.categories : [];
    const matches: MatchingNeedResult[] = [];

    for (const raw of rawNeeds) {
      const need = dbNeedToNeed(raw);
      if (need.id === offer.id) continue;

      const needCats = Array.isArray(need.categories) ? need.categories : [];
      const common = needCats.filter((cat) => offerCats.includes(cat));
      const sameCity = !offer.cityId || !need.cityId || offer.cityId === need.cityId;

      if (common.length > 0 || sameCity) {
        const score = Math.min(98, 70 + (sameCity ? 15 : 0) + (common.length * 8));
        matches.push({
          need,
          score,
          matchingCategories: common.length > 0 ? common : need.categories,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, limit);
  } catch (err) {
    console.error('Error in fetchMatchingNeedsForOffer:', err);
    return [];
  }
}
