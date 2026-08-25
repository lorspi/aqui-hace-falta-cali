// ============================================================================
// Tests unitarios — Lógica pura de la pantalla de detalle del reporte del
// chatbot (US-6 / DEV-45)
//
// Cubre los escenarios Gherkin de la historia sobre la lógica pura
// (`src/utils/conversationDetailUtils.ts`, NFR-4: testeable sin dependencias
// de React/Supabase). La UI consume `GET /needs/{id}/conversation` (US-3) y
// este módulo arma las vistas de chat + el estado del panel.
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  classifyMessageDirection,
  sortConversationMessages,
  dedupeConversationMessages,
  buildChatMessages,
  isValidImageAttachment,
  isLocationWithCoordinates,
  isLocationWithAddress,
  isLocationPending,
  hasResolvedCoordinates,
  senderLabelKey,
  type ConversationMessage,
  type ConversationRebuild,
  type ConversationNeedSummary,
} from '../../src/utils/conversationDetailUtils';

/** Helper: construye un mensaje mínimo del contrato US-3. */
function buildMessage(overrides: Partial<ConversationMessage> = {}): ConversationMessage {
  return {
    event_id: 'evt_1',
    sender: '573001234567',
    content: 'Necesito agua potable',
    type: 'TEXT',
    attachments: [],
    received_at: '2026-08-24T10:01:00.000Z',
    ...overrides,
  };
}

/** Helper: construye un resumen mínimo del incidente (need). */
function buildNeedSummary(overrides: Partial<ConversationNeedSummary> = {}): ConversationNeedSummary {
  return {
    id: 'need_123',
    title: 'Necesito agua potable',
    description: 'Necesito agua potable en mi barrio',
    contact_whatsapp: '573001234567',
    address: 'Calle 5 #10-20',
    neighborhood: 'San Fernando',
    priority: 'MEDIUM',
    status: 'NEED_HELP_NOW',
    verification_status: 'PENDING_VERIFICATION',
    conversation_id: 'conv_123',
    source_event_id: 'evt_comp',
    ...overrides,
  };
}

/** Helper: construye una respuesta de reconstrucción (rebuild) mínima. */
function buildRebuild(overrides: Partial<ConversationRebuild> = {}): ConversationRebuild {
  return {
    conversation_id: 'conv_123',
    has_need: true,
    need: buildNeedSummary(),
    messages: [],
    ...overrides,
  };
}

// ============================================================================
// Scenario: El operador ve la conversación tipo chat con mensajes entrantes y
// salientes en orden cronológico
// ============================================================================

describe('US-6 — Orden cronológico y dirección entrante/saliente', () => {
  it('ordena los mensajes por received_at ascendente', () => {
    const m1 = buildMessage({ event_id: 'm1', received_at: '2026-08-24T10:01:00.000Z' });
    const m2 = buildMessage({ event_id: 'm2', received_at: '2026-08-24T10:02:00.000Z' });
    const m3 = buildMessage({ event_id: 'm3', received_at: '2026-08-24T10:00:00.000Z' });

    const result = sortConversationMessages([m1, m2, m3]);

    expect(result.map((m) => m.event_id)).toEqual(['m3', 'm1', 'm2']);
  });

  it('tiebreak determinista por event_id ante received_at iguales', () => {
    const a = buildMessage({ event_id: 'a', received_at: '2026-08-24T10:00:00.000Z' });
    const b = buildMessage({ event_id: 'b', received_at: '2026-08-24T10:00:00.000Z' });

    const result = sortConversationMessages([b, a]);

    expect(result.map((m) => m.event_id)).toEqual(['a', 'b']);
  });

  it('fechas inválidas no rompen el orden (fallback lexicográfico)', () => {
    const bad = buildMessage({ event_id: 'bad', received_at: 'no-una-fecha' });
    const good = buildMessage({ event_id: 'good', received_at: '2026-08-24T10:00:00.000Z' });

    const result = sortConversationMessages([good, bad]);

    expect(result).toHaveLength(2);
  });

  it('clasifica entrante (ciudadano) cuando sender === contact_whatsapp', () => {
    expect(classifyMessageDirection('573001234567', '573001234567')).toBe('incoming');
  });

  it('clasifica saliente (bot/equipo) cuando sender es distinto de contact_whatsapp', () => {
    expect(classifyMessageDirection('573000000001', '573001234567')).toBe('outgoing');
  });

  it('clasifica neutro cuando sender está ausente o vacío', () => {
    expect(classifyMessageDirection(null, '573001234567')).toBe('neutral');
    expect(classifyMessageDirection('  ', '573001234567')).toBe('neutral');
  });

  it('sender distinto sin contact_whatsapp conocido se muestra como saliente', () => {
    expect(classifyMessageDirection('573000000001', null)).toBe('outgoing');
  });

  it('buildChatMessages arma las vistas con dirección y en orden cronológico', () => {
    const citizen = buildMessage({ event_id: 'c', sender: '573001234567', received_at: '2026-08-24T10:01:00.000Z' });
    const bot = buildMessage({ event_id: 'b', sender: '573000000001', received_at: '2026-08-24T10:02:00.000Z' });
    const missing = buildMessage({ event_id: 'n', sender: null, received_at: '2026-08-24T10:03:00.000Z' });

    const rebuild = buildRebuild({ messages: [bot, missing, citizen] });
    const views = buildChatMessages(rebuild);

    expect(views.map((v) => v.eventId)).toEqual(['c', 'b', 'n']);
    expect(views[0].direction).toBe('incoming');
    expect(views[1].direction).toBe('outgoing');
    expect(views[2].direction).toBe('neutral');
  });
});

// ============================================================================
// Scenario: Las fotos de la conversación se renderizan como imágenes
// ============================================================================

describe('US-6 — Adjuntos de imagen renderizados', () => {
  it('una imagen con URL válida es renderizable', () => {
    expect(isValidImageAttachment({ type: 'image', url: 'https://media.example.com/foto.jpg', mime: 'image/jpeg' })).toBe(true);
  });

  it('una imagen sin URL válida no es renderizable (placeholder sin romper)', () => {
    expect(isValidImageAttachment({ type: 'image', url: '' })).toBe(false);
    expect(isValidImageAttachment({ type: 'image', url: '   ' })).toBe(false);
    expect(isValidImageAttachment({ type: 'image', url: 'no-es-una-url' })).toBe(false);
    expect(isValidImageAttachment({ type: 'image' })).toBe(false);
  });

  it('un adjunto que no es imagen no se considera imagen', () => {
    expect(isValidImageAttachment({ type: 'location', address: 'Calle 5' })).toBe(false);
  });
});

// ============================================================================
// Scenario: Las ubicaciones de la conversación se renderizan como mapa o
// tarjeta de ubicación
// ============================================================================

describe('US-6 — Adjuntos de ubicación (mapa o tarjeta)', () => {
  it('una ubicación con coordenadas válidas es renderizable como mapa', () => {
    const att = { type: 'location' as const, latitude: 3.4516, longitude: -76.532, address: 'Calle 5 #10-20' };
    expect(isLocationWithCoordinates(att)).toBe(true);
    expect(isLocationWithAddress(att)).toBe(true);
  });

  it('una ubicación sin coordenadas pero con address se muestra como tarjeta (sin mapa vacío)', () => {
    const att = { type: 'location' as const, address: 'San Fernando' };
    expect(isLocationWithCoordinates(att)).toBe(false);
    expect(isLocationWithAddress(att)).toBe(true);
  });

  it('una ubicación sin coordenadas ni address no rompe (ni mapa ni tarjeta)', () => {
    const att = { type: 'location' as const };
    expect(isLocationWithCoordinates(att)).toBe(false);
    expect(isLocationWithAddress(att)).toBe(false);
  });
});

// ============================================================================
// Scenario: El panel muestra los campos ya identificados por el receptor
// ============================================================================

describe('US-6 — Panel de datos del incidente', () => {
  it('expone title, description, contact_whatsapp, address, neighborhood, priority y verification_status', () => {
    const need = buildNeedSummary({
      title: 'Necesito agua potable',
      description: 'Necesito agua potable en mi barrio',
      contact_whatsapp: '573001234567',
      address: 'Calle 5 #10-20',
      neighborhood: 'San Fernando',
      priority: 'MEDIUM',
      verification_status: 'PENDING_VERIFICATION',
    });

    expect(need.title).toBe('Necesito agua potable');
    expect(need.description).toBe('Necesito agua potable en mi barrio');
    expect(need.contact_whatsapp).toBe('573001234567');
    expect(need.address).toBe('Calle 5 #10-20');
    expect(need.neighborhood).toBe('San Fernando');
    expect(need.priority).toBe('MEDIUM');
    expect(need.verification_status).toBe('PENDING_VERIFICATION');
  });
});

// ============================================================================
// Scenario: La ubicación pendiente de geocoding se indica en el panel
// ============================================================================

describe('US-6 — Ubicación pendiente de geocoding', () => {
  it('PENDING indica que la ubicación aún no fue geolocalizada (sin mapa)', () => {
    expect(isLocationPending({ locationEnrichmentStatus: 'PENDING', latitude: null, longitude: null })).toBe(true);
    expect(hasResolvedCoordinates({ locationEnrichmentStatus: 'PENDING', latitude: null, longitude: null })).toBe(false);
  });

  it('sin estado de enriquecimiento no se muestra ni pendiente ni resuelta', () => {
    expect(isLocationPending({})).toBe(false);
    expect(hasResolvedCoordinates({})).toBe(false);
    expect(isLocationPending(null)).toBe(false);
  });
});

// ============================================================================
// Scenario: La ubicación resuelta se muestra en el panel
// ============================================================================

describe('US-6 — Ubicación resuelta', () => {
  it('RESOLVED con coordenadas válidas habilita el mapa', () => {
    expect(hasResolvedCoordinates({ locationEnrichmentStatus: 'RESOLVED', latitude: 3.4516, longitude: -76.532 })).toBe(true);
  });

  it('RESOLVED sin coordenadas no habilita un mapa vacío', () => {
    expect(hasResolvedCoordinates({ locationEnrichmentStatus: 'RESOLVED', latitude: null, longitude: null })).toBe(false);
    expect(hasResolvedCoordinates({ locationEnrichmentStatus: 'RESOLVED' })).toBe(false);
  });
});

// ============================================================================
// Scenario: Un mensaje con campos faltantes se muestra de forma tolerante
// ============================================================================

describe('US-6 — Tolerancia a campos faltantes', () => {
  it('un mensaje sin sender se muestra con remitente neutro y no se pierde', () => {
    const missing = buildMessage({ event_id: 'tol', sender: null, content: 'Solicitud de ayuda vía WhatsApp' });
    const rebuild = buildRebuild({ messages: [missing] });

    const views = buildChatMessages(rebuild);

    expect(views).toHaveLength(1);
    expect(views[0].direction).toBe('neutral');
    expect(views[0].content).toBe('Solicitud de ayuda vía WhatsApp');
  });

  it('un mensaje con contenido por defecto no rompe el chat', () => {
    const missing = buildMessage({ event_id: 'tol2', sender: null, content: 'Solicitud de ayuda vía WhatsApp' });
    const views = buildChatMessages(buildRebuild({ messages: [missing] }));

    expect(views[0].content.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Scenario: Un mensaje con message_type desconocido se muestra como mensaje
// genérico
// ============================================================================

describe('US-6 — message_type desconocido (UNKNOWN)', () => {
  it('UNKNOWN se conserva en la vista sin intentar renderizar adjuntos', () => {
    const unknown = buildMessage({ event_id: 'unk', type: 'UNKNOWN' });
    const views = buildChatMessages(buildRebuild({ messages: [unknown] }));

    expect(views).toHaveLength(1);
    expect(views[0].type).toBe('UNKNOWN');
    expect(views[0].attachments).toEqual([]);
  });

  it('no lanza por datos incompletos y la fila permanece en la conversación', () => {
    const unknown = buildMessage({ event_id: 'unk2', type: 'UNKNOWN', content: '' });
    const views = buildChatMessages(buildRebuild({ messages: [unknown] }));

    expect(views).toHaveLength(1);
  });
});

// ============================================================================
// Scenario: Un reenvío con el mismo event.id aparece una sola vez en el chat
// ============================================================================

describe('US-6 — Deduplicación por event.id', () => {
  it('cada event.id aparece una sola vez entre los mensajes del chat', () => {
    const m1 = buildMessage({ event_id: 'dup', received_at: '2026-08-24T10:01:00.000Z' });
    const m2 = buildMessage({ event_id: 'dup', received_at: '2026-08-24T10:02:00.000Z', content: 'DUPLICADO' });
    const m3 = buildMessage({ event_id: 'other', received_at: '2026-08-24T10:03:00.000Z' });

    const views = buildChatMessages(buildRebuild({ messages: [m1, m2, m3] }));

    expect(views.map((v) => v.eventId)).toEqual(['dup', 'other']);
    expect(views).toHaveLength(2);
  });

  it('dedupeConversationMessages conserva la primera ocurrencia', () => {
    const m1 = buildMessage({ event_id: 'x', content: 'original' });
    const m2 = buildMessage({ event_id: 'x', content: 'duplicado' });

    const result = dedupeConversationMessages([m1, m2]);

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('original');
  });
});

// ============================================================================
// Scenario: El evento de completado no se muestra como un mensaje del chat
// ============================================================================

describe('US-6 — Evento de completado', () => {
  it('no aparece como burbuja y su event.id queda disponible en source_event_id', () => {
    // El backend (US-3) ya excluye el completado de `messages`; el frontend
    // renderiza SOLO lo que llega en `messages` y expone `source_event_id`.
    const citizen = buildMessage({ event_id: 'msg', sender: '573001234567' });
    const rebuild = buildRebuild({
      need: buildNeedSummary({ source_event_id: 'evt_comp' }),
      messages: [citizen],
    });

    const views = buildChatMessages(rebuild);

    expect(views.map((v) => v.eventId)).toEqual(['msg']);
    expect(rebuild.need?.source_event_id).toBe('evt_comp');
    expect(views.some((v) => v.eventId === 'evt_comp')).toBe(false);
  });
});

// ============================================================================
// Scenario: Una conversación aún sin incidente asociado se muestra sin romper
// ============================================================================

describe('US-6 — Conversación sin incidente asociado (has_need=false)', () => {
  it('muestra los mensajes disponibles y no fabrica datos de un need inexistente', () => {
    const msg = buildMessage({ event_id: 'ongoing', sender: '573001234567' });
    const rebuild = buildRebuild({
      conversation_id: 'conv_ongoing',
      has_need: false,
      need: null,
      messages: [msg],
    });

    const views = buildChatMessages(rebuild);

    expect(views).toHaveLength(1);
    expect(rebuild.has_need).toBe(false);
    expect(rebuild.need).toBeNull();
  });

  it('los mensajes de una conversación en curso se clasifican sin contact_whatsapp conocido', () => {
    const msg = buildMessage({ event_id: 'ongoing2', sender: '573001234567' });
    const rebuild = buildRebuild({ has_need: false, need: null, messages: [msg] });

    const views = buildChatMessages(rebuild);

    // Sin contact_whatsapp del need no se puede afirmar que sea el ciudadano.
    expect(views[0].direction).toBe('outgoing');
  });
});

// ============================================================================
// Etiquetas de remitente (claves de traducción)
// ============================================================================

describe('US-6 — Etiquetas de remitente', () => {
  it('mapea la dirección a una clave de traducción', () => {
    expect(senderLabelKey('incoming')).toBe('conversationSenderCitizen');
    expect(senderLabelKey('outgoing')).toBe('conversationSenderBot');
    expect(senderLabelKey('neutral')).toBe('conversationSenderNeutral');
  });
});
