// ============================================================================
// Tests unitarios — Lógica pura de las acciones de aprobar/rechazar (US-7)
// Ticket: DEV-46
//
// Cubre los escenarios Gherkin de la historia sobre la lógica PURE
// (`src/utils/reviewUtils.ts`, NFR-4: sin dependencias de React/Supabase):
//   - `isReviewable`: solo PENDING_VERIFICATION habilita las acciones.
//   - `resolveVerifiedBy`: la identidad del operador se obtiene de la sesión
//     del panel (MODERATOR/ADMIN); sin identidad disponible → '' (la operación
//     se rechaza sin modificar el estado).
//   - `buildReviewPayload`: arma el body de US-4 con `need_id`, `decision` en
//     español (`aprobar`/`rechazar`), `verified_by` y `notes` opcional.
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  isReviewable,
  resolveVerifiedBy,
  buildReviewPayload,
  reviewDecisionLabel,
} from '../../src/utils/reviewUtils';

// ============================================================================
// Scenario: Aprobar/Rechazar solo se habilita en PENDING_VERIFICATION
// ============================================================================

describe('US-7 — isReviewable', () => {
  it('habilita las acciones cuando verification_status = PENDING_VERIFICATION', () => {
    expect(isReviewable('PENDING_VERIFICATION')).toBe(true);
  });

  it('deshabilita las acciones en cualquier estado distinto de PENDING_VERIFICATION', () => {
    expect(isReviewable('VERIFIED')).toBe(false);
    expect(isReviewable('REJECTED')).toBe(false);
    expect(isReviewable('REPORTED')).toBe(false);
    expect(isReviewable('ARCHIVED')).toBe(false);
  });

  it('deshabilita las acciones cuando el estado es null/undefined/vacío', () => {
    expect(isReviewable(null)).toBe(false);
    expect(isReviewable(undefined)).toBe(false);
    expect(isReviewable('')).toBe(false);
  });
});

// ============================================================================
// Scenario: La decisión identifica al operador autenticado (verified_by)
// ============================================================================

describe('US-7 — resolveVerifiedBy', () => {
  it('usa el email del operador autenticado cuando está presente', () => {
    expect(
      resolveVerifiedBy({ email: 'operador@radar.local', name: 'Operadora Ana' }),
    ).toBe('operador@radar.local');
  });

  it('cae al nombre cuando no hay email', () => {
    expect(resolveVerifiedBy({ email: '', name: 'Operadora Ana' })).toBe('Operadora Ana');
    expect(resolveVerifiedBy({ name: 'Operadora Ana' })).toBe('Operadora Ana');
  });

  it('devuelve "" cuando el operador no tiene email ni nombre', () => {
    expect(resolveVerifiedBy({})).toBe('');
    expect(resolveVerifiedBy({ email: '   ' })).toBe('');
    expect(resolveVerifiedBy(null)).toBe('');
    expect(resolveVerifiedBy(undefined)).toBe('');
  });

  it('devuelve "" cuando el operador no está disponible (sesión no autenticada)', () => {
    expect(resolveVerifiedBy(null)).toBe('');
  });

  it('recorta espacios en blanco del email', () => {
    expect(resolveVerifiedBy({ email: '  operador@radar.local  ' })).toBe('operador@radar.local');
  });
});

// ============================================================================
// Scenario: La pantalla llama al endpoint de US-4 con la decisión y el operador
// ============================================================================

describe('US-7 — buildReviewPayload', () => {
  it('arma el body de US-4 con decision "aprobar" y verified_by', () => {
    const payload = buildReviewPayload('need-1', 'aprobar', 'operador@radar.local');
    expect(payload).toEqual({
      need_id: 'need-1',
      decision: 'aprobar',
      verified_by: 'operador@radar.local',
    });
  });

  it('arma el body de US-4 con decision "rechazar"', () => {
    const payload = buildReviewPayload('need-1', 'rechazar', 'operador@radar.local');
    expect(payload.decision).toBe('rechazar');
  });

  it('incluye notes solo cuando es un string no vacío (rechazo sin motivo es válido)', () => {
    expect(buildReviewPayload('n1', 'aprobar', 'op', 'Verificado en terreno').notes).toBe('Verificado en terreno');
    expect(buildReviewPayload('n1', 'aprobar', 'op', '  ').notes).toBeUndefined();
    expect(buildReviewPayload('n1', 'aprobar', 'op', null).notes).toBeUndefined();
    expect(buildReviewPayload('n1', 'aprobar', 'op', undefined).notes).toBeUndefined();
  });
});

describe('US-7 — reviewDecisionLabel', () => {
  it('mapea la decisión en español al literal canónico del endpoint', () => {
    expect(reviewDecisionLabel('aprobar')).toBe('approve');
    expect(reviewDecisionLabel('rechazar')).toBe('reject');
  });
});
