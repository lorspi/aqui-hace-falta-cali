import { createClient } from '@supabase/supabase-js';
import { Need, Offer, Report, NeedUpdateLog, AuditLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const envName = (import.meta.env.VITE_ENV_NAME || import.meta.env.MODE || 'development') as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(`[AHF] ⚠️ Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para el entorno (${envName}).`);
} else {
  console.log(`[AHF] 🚀 Conectado a Supabase en modo (${envName.toUpperCase()}) -> ${supabaseUrl}`);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Mappers: DB (snake_case) <-> Frontend (camelCase)

export function dbNeedToNeed(row: any): Need {
  return {
    id: row.id,
    cityId: row.city_id,
    departmentId: row.department_id,
    emergencyId: row.emergency_id,
    title: row.title,
    description: row.description,
    placeType: row.place_type,
    categories: row.categories || [],
    resources: row.resources || [],
    address: row.address,
    neighborhood: row.neighborhood,
    latitude: row.latitude,
    longitude: row.longitude,
    priority: row.priority,
    status: row.status,
    verificationStatus: row.verification_status,
    verifiedBy: row.verified_by,
    verificationNotes: row.verification_notes,
    verifiedAt: row.verified_at,
    source: row.source,
    sourceUrl: row.source_url,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    contactEmail: row.contact_email,
    organizationName: row.organization_name,
    requesterType: row.requester_type,
    operatingHours: row.operating_hours,
    evidenceUrl: row.evidence_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUpdatedBy: row.last_updated_by,
    expiresAt: row.expires_at,
    isDemoData: row.is_demo_data,
  };
}

export function needToDbNeed(need: Partial<Need>): Record<string, any> {
  const data: Record<string, any> = {};
  if (need.cityId !== undefined) data.city_id = need.cityId;
  if (need.departmentId !== undefined) data.department_id = need.departmentId;
  if (need.emergencyId !== undefined) data.emergency_id = need.emergencyId;
  if (need.title !== undefined) data.title = need.title;
  if (need.description !== undefined) data.description = need.description;
  if (need.placeType !== undefined) data.place_type = need.placeType;
  if (need.categories !== undefined) data.categories = need.categories;
  if (need.resources !== undefined) data.resources = need.resources;
  if (need.address !== undefined) data.address = need.address;
  if (need.neighborhood !== undefined) data.neighborhood = need.neighborhood;
  if (need.latitude !== undefined) data.latitude = need.latitude;
  if (need.longitude !== undefined) data.longitude = need.longitude;
  if (need.priority !== undefined) data.priority = need.priority;
  if (need.status !== undefined) data.status = need.status;
  if (need.verificationStatus !== undefined) data.verification_status = need.verificationStatus;
  if (need.verifiedBy !== undefined) data.verified_by = need.verifiedBy;
  if (need.verificationNotes !== undefined) data.verification_notes = need.verificationNotes;
  if (need.verifiedAt !== undefined) data.verified_at = need.verifiedAt;
  if (need.source !== undefined) data.source = need.source;
  if (need.sourceUrl !== undefined) data.source_url = need.sourceUrl;
  if (need.contactName !== undefined) data.contact_name = need.contactName;
  if (need.contactPhone !== undefined) data.contact_phone = need.contactPhone;
  if (need.contactWhatsapp !== undefined) data.contact_whatsapp = need.contactWhatsapp;
  if (need.contactEmail !== undefined) data.contact_email = need.contactEmail;
  if (need.organizationName !== undefined) data.organization_name = need.organizationName;
  if (need.requesterType !== undefined) data.requester_type = need.requesterType;
  if (need.operatingHours !== undefined) data.operating_hours = need.operatingHours;
  if (need.evidenceUrl !== undefined) data.evidence_url = need.evidenceUrl;
  if (need.createdAt !== undefined) data.created_at = need.createdAt;
  if (need.updatedAt !== undefined) data.updated_at = need.updatedAt;
  if (need.lastUpdatedBy !== undefined) data.last_updated_by = need.lastUpdatedBy;
  if (need.expiresAt !== undefined) data.expires_at = need.expiresAt;
  if (need.isDemoData !== undefined) data.is_demo_data = need.isDemoData;
  return data;
}

export function dbOfferToOffer(row: any): Offer {
  return {
    id: row.id,
    cityId: row.city_id,
    departmentId: row.department_id,
    title: row.title,
    description: row.description,
    categories: row.categories || [],
    resources: row.resources || [],
    address: row.address,
    neighborhood: row.neighborhood,
    latitude: row.latitude,
    longitude: row.longitude,
    offerStatus: row.offer_status,
    verificationStatus: row.verification_status,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    contactEmail: row.contact_email,
    organizationName: row.organization_name,
    operatingHours: row.operating_hours,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function offerToDbOffer(offer: Partial<Offer>): Record<string, any> {
  const data: Record<string, any> = {};
  if (offer.cityId !== undefined) data.city_id = offer.cityId;
  if (offer.departmentId !== undefined) data.department_id = offer.departmentId;
  if (offer.title !== undefined) data.title = offer.title;
  if (offer.description !== undefined) data.description = offer.description;
  if (offer.categories !== undefined) data.categories = offer.categories;
  if (offer.resources !== undefined) data.resources = offer.resources;
  if (offer.address !== undefined) data.address = offer.address;
  if (offer.neighborhood !== undefined) data.neighborhood = offer.neighborhood;
  if (offer.latitude !== undefined) data.latitude = offer.latitude;
  if (offer.longitude !== undefined) data.longitude = offer.longitude;
  if (offer.offerStatus !== undefined) data.offer_status = offer.offerStatus;
  if (offer.verificationStatus !== undefined) data.verification_status = offer.verificationStatus;
  if (offer.verifiedBy !== undefined) data.verified_by = offer.verifiedBy;
  if (offer.verifiedAt !== undefined) data.verified_at = offer.verifiedAt;
  if (offer.contactName !== undefined) data.contact_name = offer.contactName;
  if (offer.contactPhone !== undefined) data.contact_phone = offer.contactPhone;
  if (offer.contactWhatsapp !== undefined) data.contact_whatsapp = offer.contactWhatsapp;
  if (offer.contactEmail !== undefined) data.contact_email = offer.contactEmail;
  if (offer.organizationName !== undefined) data.organization_name = offer.organizationName;
  if (offer.operatingHours !== undefined) data.operating_hours = offer.operatingHours;
  if (offer.createdAt !== undefined) data.created_at = offer.createdAt;
  if (offer.updatedAt !== undefined) data.updated_at = offer.updatedAt;
  return data;
}

export function dbReportToReport(row: any): Report {
  return {
    id: row.id,
    needId: row.need_id,
    needTitle: row.need_title,
    reason: row.reason,
    description: row.description,
    reporterContact: row.reporter_contact,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
  };
}
