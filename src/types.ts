/**
 * Aquí Hace Falta - Plataforma Ciudadana de Coordinación de Ayuda
 * Types & Data Model
 */

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type VerificationStatus = 'VERIFIED' | 'PENDING_VERIFICATION' | 'REPORTED' | 'ARCHIVED';

export type NeedStatus = 'NEED_HELP_NOW' | 'RECEIVING_HELP' | 'PARTIALLY_COVERED' | 'COVERED' | 'CLOSED';

export type PlaceType =
  | 'EDIFICIO_AFECTADO'
  | 'CENTRO_ACOPIO'
  | 'CENTRO_DISTRIBUCION'
  | 'HOSPITAL'
  | 'BANCO_SANGRE'
  | 'REFUGIO'
  | 'COMUNIDAD_AFECTADA'
  | 'PUNTO_LOGISTICO'
  | 'ORGANIZACION'
  | 'OTRO';

export type HelpCategory =
  | 'ESCOMBROS'
  | 'MANO_OBRA'
  | 'TRANSPORTE'
  | 'ALIMENTOS'
  | 'AGUA'
  | 'ROPA'
  | 'MEDICAMENTOS'
  | 'SANGRE'
  | 'DINERO'
  | 'HERRAMIENTAS'
  | 'MAQUINARIA'
  | 'OPERARIOS_MAQUINARIA'
  | 'ATENCION_MEDICA'
  | 'APOYO_PSICOLOGICO'
  | 'ALOJAMIENTO'
  | 'ANIMALES'
  | 'LOGISTICA'
  | 'CLASIFICACION_DONACIONES'
  | 'VOLUNTARIADO_GENERAL'
  | 'OTRO';

export interface ResourceItem {
  id: string;
  type: HelpCategory;
  description: string;
  requestedQuantity?: number;
  fulfilledQuantity?: number;
  unit?: string;
  status: 'PENDING' | 'PARTIAL' | 'FULFILLED';
}

export interface Need {
  id: string;
  cityId: string;
  emergencyId: string;
  title: string;
  description: string;
  placeType: PlaceType;
  categories: HelpCategory[];
  resources: ResourceItem[];
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  priority: Priority;
  status: NeedStatus;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verificationNotes?: string;
  verifiedAt?: string;
  source?: string; // Source attribution (e.g., 'Cruz Roja', 'Ciudadano', 'Defensa Civil')
  sourceUrl?: string;
  contactName: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  organizationName?: string;
  requesterType: 'PERSONA' | 'ORGANIZACION' | 'FUNDACION' | 'COMUNIDAD' | 'EMPRESA' | 'OTRO';
  operatingHours?: string;
  evidenceUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastUpdatedBy?: string;
  expiresAt?: string;
  isDemoData?: boolean;
}

export interface Report {
  id: string;
  needId: string;
  needTitle?: string;
  reason: 'NOT_NEEDED_ANYMORE' | 'WRONG_LOCATION' | 'FALSE_INFORMATION' | 'BAD_CONTACT' | 'OUTDATED' | 'OTHER';
  description: string;
  reporterContact?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface NeedUpdateLog {
  id: string;
  needId: string;
  previousStatus: NeedStatus;
  newStatus: NeedStatus;
  description: string;
  updatedBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  needId?: string;
  adminEmail: string;
  timestamp: string;
  details: string;
}

export interface City {
  id: string;
  name: string;
  department: string;
  country: string;
  latitude: number;
  longitude: number;
  active: boolean;
}

export interface Emergency {
  id: string;
  name: string;
  type: string;
  description: string;
  startDate: string;
  status: 'ACTIVE' | 'CONTAINED' | 'ARCHIVED';
}

export interface FilterState {
  search: string;
  categories: HelpCategory[];
  priority: Priority | 'ALL';
  placeType: PlaceType | 'ALL';
  status: NeedStatus | 'ALL';
  verificationStatus: VerificationStatus | 'ALL';
  distanceKm: number | null; // null = Toda Cali
  userLat: number | null;
  userLng: number | null;
  sortBy: 'PRIORITY' | 'RECENT' | 'DISTANCE';
}
