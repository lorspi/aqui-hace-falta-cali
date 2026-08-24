// ============================================================================
// Tests unitarios — Lógica pura del listado de reportes del chatbot (US-5)
// Ticket: DEV-44
//
// Cubre los escenarios Gherkin de la historia sobre la lógica de filtrado y
// orden (módulo `src/utils/chatbotReportUtils.ts`, NFR-4: lógica pura
// testeable sin dependencias de React/Supabase).
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  filterChatbotReports,
  countPendingChatbotReports,
  isChatbotReport,
  type ChatbotReportFilterOptions,
} from '../../src/utils/chatbotReportUtils';
import { Need } from '../../src/types';

/** Helper: construye un Need mínimo de prueba (source por defecto WhatsApp). */
function buildNeed(overrides: Partial<Need> = {}): Need {
  const base: Need = {
    id: 'need-1',
    cityId: 'cali',
    emergencyId: 'terremoto-cali-2026',
    title: 'Necesito agua potable',
    description: 'Necesito agua potable en mi barrio',
    placeType: 'EDIFICIO_AFECTADO',
    categories: ['AGUA'],
    resources: [],
    address: 'Calle 5 #10-20',
    neighborhood: 'San Fernando',
    latitude: 3.4516,
    longitude: -76.532,
    priority: 'MEDIUM',
    status: 'NEED_HELP_NOW',
    verificationStatus: 'PENDING_VERIFICATION',
    contactName: 'Ciudadano',
    contactPhone: null,
    contactWhatsapp: '573001234567',
    contactEmail: null,
    requesterType: 'PERSONA',
    createdAt: '2026-08-24T10:00:00.000Z',
    updatedAt: '2026-08-24T10:00:00.000Z',
    source: 'WhatsApp',
    isDemoData: false,
    sourceEventId: null,
    conversationId: null,
    locationEnrichmentStatus: 'RESOLVED',
  };
  return { ...base, ...overrides };
}

const ALL_OPTS: ChatbotReportFilterOptions = {
  verificationStatus: 'ALL',
  priority: 'ALL',
  placeType: 'ALL',
  sortBy: 'RECENT',
};

// ============================================================================
// Scenario: El operador ve los reportes del chatbot con los datos esenciales
// ============================================================================

describe('US-5 — Filtro por fuente (source = WhatsApp)', () => {
  it('muestra solo los reportes del chatbot y excluye los de la app', () => {
    const whatsapp = buildNeed({ id: 'w1', source: 'WhatsApp' });
    const appReport = buildNeed({ id: 'a1', source: 'Reporte ciudadano en línea' });
    const otraFuente = buildNeed({ id: 'a2', source: 'Cruz Roja' });
    const sinFuente = buildNeed({ id: 'a3', source: null as unknown as string });

    const result = filterChatbotReports([whatsapp, appReport, otraFuente, sinFuente], ALL_OPTS);

    expect(result.map((n) => n.id)).toEqual(['w1']);
  });

  it('isChatbotReport es tolerante a mayúsculas/minúsculas', () => {
    expect(isChatbotReport(buildNeed({ source: 'WhatsApp' }))).toBe(true);
    expect(isChatbotReport(buildNeed({ source: 'whatsapp' }))).toBe(true);
    expect(isChatbotReport(buildNeed({ source: 'WHATSAPP' }))).toBe(true);
    expect(isChatbotReport(buildNeed({ source: 'app' }))).toBe(false);
  });
});

// ============================================================================
// Scenario: El listado por defecto prioriza los reportes pendientes de
// verificación + Scenario: orden cronológico
// ============================================================================

describe('US-5 — Orden por defecto (pendientes primero + cronológico)', () => {
  it('los PENDING_VERIFICATION aparecen primero', () => {
    const verified = buildNeed({ id: 'v1', verificationStatus: 'VERIFIED', createdAt: '2026-08-24T12:00:00.000Z' });
    const rejected = buildNeed({ id: 'r1', verificationStatus: 'REJECTED', createdAt: '2026-08-24T13:00:00.000Z' });
    const pending = buildNeed({ id: 'p1', verificationStatus: 'PENDING_VERIFICATION', createdAt: '2026-08-24T11:00:00.000Z' });

    const result = filterChatbotReports([verified, rejected, pending], ALL_OPTS);

    expect(result[0].id).toBe('p1');
    expect(result.map((n) => n.id)).toEqual(['p1', 'v1', 'r1']);
  });

  it('dentro del mismo estado ordena por created_at de más reciente a más antiguo', () => {
    const older = buildNeed({ id: 'old', createdAt: '2026-08-20T10:00:00.000Z' });
    const middle = buildNeed({ id: 'mid', createdAt: '2026-08-22T10:00:00.000Z' });
    const newer = buildNeed({ id: 'new', createdAt: '2026-08-24T10:00:00.000Z' });

    const result = filterChatbotReports([older, newer, middle], ALL_OPTS);

    expect(result.map((n) => n.id)).toEqual(['new', 'mid', 'old']);
  });

  it('reportes con fechas inválidas o ausentes no rompen el orden', () => {
    const bad = buildNeed({ id: 'bad', createdAt: 'no-una-fecha' });
    const good = buildNeed({ id: 'good', createdAt: '2026-08-24T10:00:00.000Z' });

    const result = filterChatbotReports([good, bad], ALL_OPTS);

    // No lanza y ambos aparecen.
    expect(result).toHaveLength(2);
  });
});

// ============================================================================
// Scenario: El operador filtra los reportes por estado
// ============================================================================

describe('US-5 — Filtro por verification_status', () => {
  const pending = buildNeed({ id: 'p', verificationStatus: 'PENDING_VERIFICATION' });
  const verified = buildNeed({ id: 'v', verificationStatus: 'VERIFIED' });
  const rejected = buildNeed({ id: 'r', verificationStatus: 'REJECTED' });
  const reported = buildNeed({ id: 'rp', verificationStatus: 'REPORTED' });
  const archived = buildNeed({ id: 'a', verificationStatus: 'ARCHIVED' });
  const all = [pending, verified, rejected, reported, archived];

  it('filtro PENDING_VERIFICATION muestra solo pendientes', () => {
    const result = filterChatbotReports(all, { ...ALL_OPTS, verificationStatus: 'PENDING_VERIFICATION' });
    expect(result.map((n) => n.id)).toEqual(['p']);
  });

  it('filtro VERIFIED muestra solo verificados', () => {
    const result = filterChatbotReports(all, { ...ALL_OPTS, verificationStatus: 'VERIFIED' });
    expect(result.map((n) => n.id)).toEqual(['v']);
  });

  it('filtro REJECTED muestra solo rechazados', () => {
    const result = filterChatbotReports(all, { ...ALL_OPTS, verificationStatus: 'REJECTED' });
    expect(result.map((n) => n.id)).toEqual(['r']);
  });

  it('filtro REPORTED muestra solo reportados', () => {
    const result = filterChatbotReports(all, { ...ALL_OPTS, verificationStatus: 'REPORTED' });
    expect(result.map((n) => n.id)).toEqual(['rp']);
  });

  it('filtro ARCHIVED muestra solo archivados', () => {
    const result = filterChatbotReports(all, { ...ALL_OPTS, verificationStatus: 'ARCHIVED' });
    expect(result.map((n) => n.id)).toEqual(['a']);
  });

  it('los reportes que no coinciden no aparecen', () => {
    const result = filterChatbotReports(all, { ...ALL_OPTS, verificationStatus: 'VERIFIED' });
    expect(result.some((n) => n.verificationStatus !== 'VERIFIED')).toBe(false);
  });
});

// ============================================================================
// Scenario: El operador prioriza los reportes por urgencia (priority)
// ============================================================================

describe('US-5 — Filtro y orden por priority', () => {
  const critical = buildNeed({ id: 'c', priority: 'CRITICAL' });
  const high = buildNeed({ id: 'h', priority: 'HIGH' });
  const medium = buildNeed({ id: 'm', priority: 'MEDIUM' });
  const low = buildNeed({ id: 'l', priority: 'LOW' });

  it('filtra por prioridad dejando solo un resultado', () => {
    const result = filterChatbotReports([critical, high, medium, low], {
      ...ALL_OPTS,
      priority: 'CRITICAL',
    });
    expect(result.map((n) => n.id)).toEqual(['c']);
  });

  it('sortBy PRIORITY ordena CRITICAL > HIGH > MEDIUM > LOW', () => {
    const result = filterChatbotReports([low, medium, critical, high], {
      ...ALL_OPTS,
      sortBy: 'PRIORITY',
    });
    expect(result.map((n) => n.id)).toEqual(['c', 'h', 'm', 'l']);
  });

  it('sortBy PRIORITY conserva el orden cronológico dentro de la misma prioridad', () => {
    const cOld = buildNeed({ id: 'c-old', priority: 'CRITICAL', createdAt: '2026-08-20T10:00:00.000Z' });
    const cNew = buildNeed({ id: 'c-new', priority: 'CRITICAL', createdAt: '2026-08-24T10:00:00.000Z' });

    const result = filterChatbotReports([cOld, cNew], { ...ALL_OPTS, sortBy: 'PRIORITY' });
    expect(result.map((n) => n.id)).toEqual(['c-new', 'c-old']);
  });
});

// ============================================================================
// Scenario: El operador filtra los reportes por tipo de necesidad
// ============================================================================

describe('US-5 — Filtro por tipo de necesidad (place_type)', () => {
  const edificio = buildNeed({ id: 'e', placeType: 'EDIFICIO_AFECTADO' });
  const refugio = buildNeed({ id: 'r', placeType: 'REFUGIO' });
  const hospital = buildNeed({ id: 'h', placeType: 'HOSPITAL' });

  it('selecciona un tipo y muestra solo los que coinciden', () => {
    const result = filterChatbotReports([edificio, refugio, hospital], {
      ...ALL_OPTS,
      placeType: 'REFUGIO',
    });
    expect(result.map((n) => n.id)).toEqual(['r']);
  });

  it('los reportes de otros tipos no aparecen', () => {
    const result = filterChatbotReports([edificio, refugio, hospital], {
      ...ALL_OPTS,
      placeType: 'HOSPITAL',
    });
    expect(result.some((n) => n.placeType !== 'HOSPITAL')).toBe(false);
  });
});

// ============================================================================
// Scenario: Un reporte sin algún campo opcional se muestra de forma tolerante
// ============================================================================

describe('US-5 — Tolerancia a campos opcionales ausentes', () => {
  it('un reporte sin contact_whatsapp ni teléfono no rompe el listado', () => {
    const sinContacto = buildNeed({ id: 'nc', contactWhatsapp: null, contactPhone: null });

    const result = filterChatbotReports([sinContacto], ALL_OPTS);

    expect(result).toHaveLength(1);
    expect(result[0].contactWhatsapp).toBeNull();
  });

  it('un reporte con location_enrichment_status PENDING no rompe el listado', () => {
    const pendingLoc = buildNeed({ id: 'pl', locationEnrichmentStatus: 'PENDING' });

    const result = filterChatbotReports([pendingLoc], ALL_OPTS);

    expect(result).toHaveLength(1);
    expect(result[0].locationEnrichmentStatus).toBe('PENDING');
  });

  it('convive un reporte RESOLVED y otro PENDING sin error', () => {
    const resolved = buildNeed({ id: 'rs', locationEnrichmentStatus: 'RESOLVED' });
    const pending = buildNeed({ id: 'pd', locationEnrichmentStatus: 'PENDING' });

    const result = filterChatbotReports([resolved, pending], ALL_OPTS);

    expect(result).toHaveLength(2);
  });

  it('un reporte sin título legible no rompe el listado', () => {
    const sinTitulo = buildNeed({ id: 'st', title: '   ' });

    const result = filterChatbotReports([sinTitulo], ALL_OPTS);

    expect(result).toHaveLength(1);
  });
});

// ============================================================================
// Scenario: No hay reportes del chatbot todavía
// ============================================================================

describe('US-5 — Estado vacío', () => {
  it('si no existen registros con source WhatsApp el listado queda vacío', () => {
    const soloApp = buildNeed({ id: 'a1', source: 'Reporte ciudadano en línea' });

    const result = filterChatbotReports([soloApp], ALL_OPTS);

    expect(result).toHaveLength(0);
  });

  it('listado vacío con entrada vacía', () => {
    expect(filterChatbotReports([], ALL_OPTS)).toHaveLength(0);
  });

  it('countPendingChatbotReports devuelve 0 sin pendientes', () => {
    expect(countPendingChatbotReports([])).toBe(0);
  });
});

// ============================================================================
// Count de pendientes (badge de la pantalla)
// ============================================================================

describe('US-5 — Conteo de pendientes', () => {
  it('cuenta solo los reportes del chatbot pendientes de verificación', () => {
    const pendingWa = buildNeed({ id: 'p1', source: 'WhatsApp', verificationStatus: 'PENDING_VERIFICATION' });
    const pendingApp = buildNeed({ id: 'p2', source: 'Reporte ciudadano en línea', verificationStatus: 'PENDING_VERIFICATION' });
    const verifiedWa = buildNeed({ id: 'v1', source: 'WhatsApp', verificationStatus: 'VERIFIED' });

    const result = countPendingChatbotReports([pendingWa, pendingApp, verifiedWa]);

    expect(result).toBe(1);
  });
});
