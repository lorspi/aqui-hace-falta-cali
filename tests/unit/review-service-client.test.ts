// ============================================================================
// Tests unitarios — Cliente HTTP del endpoint de revisión (US-7 / DEV-46)
//
// Cubre los escenarios Gherkin de la historia sobre el cliente que consume el
// endpoint de US-4 (`POST /functions/v1/review`) con la decisión del operador:
//   - Aprobar/Rechazar envían el body correcto (need_id, decision en español,
//     verified_by) y reflejan la respuesta 200 (VERIFIED/REJECTED).
//   - Errores tipados: 400 missing_operator, 404 need_not_found, 409
//     invalid_verification_status, 500 review_failed y error de red.
//   - El payload incluye la identidad del operador (`verified_by`).
//
// El fetch se inyecta (mock) para no tocar red (NFR-4).
// ============================================================================

import { describe, it, expect, vi } from 'vitest';
import { reviewNeed, ReviewNeedError } from '../../src/lib/reviewService';

const BASE = 'http://127.0.0.1:54341';
const ANON = 'anon-key';

/** Crea un mock de fetch que responde con el cuerpo y status dados. */
function mockFetch(body: unknown, status = 200, ok = status >= 200 && status < 300) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as unknown as Response);
}

/** Revisión mínima de entrada. */
function input(overrides: Partial<Parameters<typeof reviewNeed>[0]> = {}) {
  return {
    needId: '00000000-0000-0000-0000-000000000123',
    decision: 'aprobar' as const,
    verifiedBy: 'operador@radar.local',
    ...overrides,
  };
}

// ============================================================================
// Scenario: Aprobar un reporte pendiente llama al endpoint y refleja VERIFIED
// ============================================================================

describe('US-7 — Aprobar llama al endpoint de US-4 y refleja VERIFIED', () => {
  it('envía POST /functions/v1/review con la decisión y el operador, y devuelve la respuesta 200', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 'reviewed',
      decision: 'approve',
      need: {
        id: '00000000-0000-0000-0000-000000000123',
        verification_status: 'VERIFIED',
        verified_by: 'operador@radar.local',
        verified_at: '2026-08-24T19:20:48.547Z',
        verification_notes: null,
      },
    });

    const result = await reviewNeed(input(), { baseUrl: BASE, anonKey: ANON, fetchFn: fetchMock });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/functions/v1/review`);
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', apikey: ANON });
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({
      need_id: '00000000-0000-0000-0000-000000000123',
      decision: 'aprobar',
      verified_by: 'operador@radar.local',
    });

    expect(result.ok).toBe(true);
    expect(result.need.verification_status).toBe('VERIFIED');
    expect(result.need.verified_by).toBe('operador@radar.local');
  });
});

// ============================================================================
// Scenario: Rechazar un reporte pendiente llama al endpoint y refleja REJECTED
// ============================================================================

describe('US-7 — Rechazar llama al endpoint de US-4 y refleja REJECTED', () => {
  it('envía decision "rechazar" y devuelve REJECTED', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 'reviewed',
      decision: 'reject',
      need: {
        id: '00000000-0000-0000-0000-000000000123',
        verification_status: 'REJECTED',
        verified_by: 'operador@radar.local',
        verified_at: '2026-08-24T19:21:00.000Z',
        verification_notes: 'Información falsa',
      },
    });

    const result = await reviewNeed(
      input({ decision: 'rechazar', notes: 'Información falsa' }),
      { baseUrl: BASE, anonKey: ANON, fetchFn: fetchMock },
    );

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.decision).toBe('rechazar');
    expect(body.notes).toBe('Información falsa');
    expect(result.need.verification_status).toBe('REJECTED');
  });
});

// ============================================================================
// Scenario: La decisión identifica al operador autenticado (verified_by)
// ============================================================================

describe('US-7 — La llamada incluye la identidad del operador', () => {
  it('envía verified_by con la identidad del operador', async () => {
    const fetchMock = mockFetch({ ok: true, status: 'reviewed', decision: 'approve', need: {} });
    await reviewNeed(input({ verifiedBy: 'ana@lorspi.com' }), {
      baseUrl: BASE,
      anonKey: ANON,
      fetchFn: fetchMock,
    });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.verified_by).toBe('ana@lorspi.com');
  });
});

// ============================================================================
// Scenario: El endpoint responde con error y la pantalla conserva el estado
// ============================================================================

describe('US-7 — El endpoint responde con error tipado', () => {
  it('400 missing_operator (operador no identificado)', async () => {
    const fetchMock = mockFetch(
      { code: 'missing_operator', message: 'Falta identificar al operador.' },
      400,
    );
    await expect(
      reviewNeed(input(), { baseUrl: BASE, anonKey: ANON, fetchFn: fetchMock }),
    ).rejects.toMatchObject({ code: 'missing_operator', status: 400 });
  });

  it('404 need_not_found (need inexistente)', async () => {
    const fetchMock = mockFetch({ code: 'need_not_found', message: 'No existe el need.' }, 404);
    await expect(
      reviewNeed(input(), { baseUrl: BASE, anonKey: ANON, fetchFn: fetchMock }),
    ).rejects.toMatchObject({ code: 'need_not_found', status: 404 });
  });

  it('409 invalid_verification_status (reporte ya revisado)', async () => {
    const fetchMock = mockFetch(
      {
        code: 'invalid_verification_status',
        message: 'El need ya fue revisado.',
        details: { current_status: 'VERIFIED' },
      },
      409,
    );
    const err = await reviewNeed(input(), {
      baseUrl: BASE,
      anonKey: ANON,
      fetchFn: fetchMock,
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ReviewNeedError);
    expect((err as ReviewNeedError).code).toBe('invalid_verification_status');
    expect((err as ReviewNeedError).status).toBe(409);
    expect((err as ReviewNeedError).details).toMatchObject({ current_status: 'VERIFIED' });
  });

  it('500 review_failed (error interno)', async () => {
    const fetchMock = mockFetch({ code: 'review_failed', message: 'Error interno.' }, 500);
    await expect(
      reviewNeed(input(), { baseUrl: BASE, anonKey: ANON, fetchFn: fetchMock }),
    ).rejects.toMatchObject({ code: 'review_failed', status: 500 });
  });

  it('error de red se traduce a code network_error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const err = await reviewNeed(input(), {
      baseUrl: BASE,
      anonKey: ANON,
      fetchFn: fetchMock,
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ReviewNeedError);
    expect((err as ReviewNeedError).code).toBe('network_error');
  });
});

// ============================================================================
// Scenario: Un doble clic durante la petición no duplica la llamada
// ============================================================================

describe('US-7 — Sin configuración de Supabase no llama al endpoint', () => {
  it('lanza config_missing sin invocar fetch', async () => {
    const fetchMock = vi.fn();
    await expect(
      reviewNeed(input(), { baseUrl: '', anonKey: ANON, fetchFn: fetchMock }),
    ).rejects.toMatchObject({ code: 'config_missing' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
