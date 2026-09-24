import { describe, it, expect } from 'vitest';
import {
  calcularTiemposPorColumna,
  calcularMetricasCertificacion,
  calcularCumplimientoOrganizaciones,
  calcularActividadRed,
} from '../../src/utils/impacto';
import type { EntregaRecibida, Solicitud, TransicionEstado } from '../../src/types/panel';

describe('Métricas de Impacto (src/utils/impacto.ts)', () => {
  it('1. calcularTiemposPorColumna calcula correctamente horas y días promedio', () => {
    const transiciones: TransicionEstado[] = [
      { id: '1', solicitudId: 10, tipo: 'solicitud', estadoAnterior: null, estadoNuevo: 'nueva', actor: 'A', creadoEl: '2026-09-01T08:00:00Z' },
      { id: '2', solicitudId: 10, tipo: 'solicitud', estadoAnterior: 'nueva', estadoNuevo: 'aceptada', actor: 'B', creadoEl: '2026-09-01T12:00:00Z' }, // 4h en nueva
      { id: '3', solicitudId: 10, tipo: 'solicitud', estadoAnterior: 'aceptada', estadoNuevo: 'camino', actor: 'C', creadoEl: '2026-09-02T12:00:00Z' }, // 24h en aceptada (1 día)

      { id: '4', solicitudId: 20, tipo: 'solicitud', estadoAnterior: null, estadoNuevo: 'nueva', actor: 'A', creadoEl: '2026-09-01T08:00:00Z' },
      { id: '5', solicitudId: 20, tipo: 'solicitud', estadoAnterior: 'nueva', estadoNuevo: 'aceptada', actor: 'B', creadoEl: '2026-09-01T14:00:00Z' }, // 6h en nueva
    ];

    const tiempos = calcularTiemposPorColumna(transiciones);
    // nueva: promedio de 4h y 6h = 5h
    expect(tiempos.nueva.horasPromedio).toBe(5);
    expect(tiempos.nueva.diasPromedio).toBe(0.2);
    expect(tiempos.nueva.muestra).toBe(2);

    // aceptada: 24h
    expect(tiempos.aceptada.horasPromedio).toBe(24);
    expect(tiempos.aceptada.diasPromedio).toBe(1);
    expect(tiempos.aceptada.muestra).toBe(1);
  });

  it('2. calcularMetricasCertificacion mide % de evidencia completa y beneficiarios', () => {
    const entregas: EntregaRecibida[] = [
      {
        id: 1,
        org: 'Cruz Roja',
        rec: 'Agua',
        cant: 100,
        u: 'L',
        estado: 'distribuida',
        cuando: 'hoy',
        vol: null,
        cierre: { recibe: { fotos: 2 }, historia: 'Entrega comunitaria a 40 familias albergadas.', personasBeneficiadas: 160 },
      },
      {
        id: 2,
        org: 'Defensa Civil',
        rec: 'Kits',
        cant: 10,
        u: 'kits',
        estado: 'distribuida',
        cuando: 'ayer',
        vol: null,
        cierre: { recibe: { fotos: 0 }, historia: 'Sin fotos adjuntas pero con historia', personasBeneficiadas: 50 },
      },
      {
        id: 3,
        org: 'Alcaldía',
        rec: 'Cobijas',
        cant: 20,
        u: 'unidades',
        estado: 'confirmada', // En acopio, aún no distribuida
        cuando: 'ayer',
        vol: null,
      },
    ];

    const metricas = calcularMetricasCertificacion(entregas);
    expect(metricas.totalDistribuidas).toBe(2);
    expect(metricas.conFoto).toBe(1);
    expect(metricas.conHistoria).toBe(2);
    expect(metricas.conBeneficiarios).toBe(2);
    expect(metricas.certificacionCompleta).toBe(1);
    expect(metricas.porcentajeCertificacionCompleta).toBe(50);
    expect(metricas.totalPersonasBeneficiadas).toBe(210);
  });

  it('3. calcularCumplimientoOrganizaciones calcula tasa de cumplimiento y cancelaciones', () => {
    const solicitudes: (Solicitud & { canceladaEnEstado?: any; motivoCancelacion?: string })[] = [
      { id: 1, quien: 'A', rec: 'Agua', cant: 100, u: 'L', estado: 'confirmada', cuando: 'hoy', vol: null },
      { id: 2, quien: 'B', rec: 'Alimentos', cant: 50, u: 'kits', estado: 'distribuida', cuando: 'hoy', vol: null },
      { id: 3, quien: 'C', rec: 'Plantas', cant: 1, u: 'u', estado: 'archivada', cuando: 'ayer', vol: null, motivoCancelacion: 'Falta de transporte', canceladaEnEstado: 'aceptada' },
      { id: 4, quien: 'D', rec: 'Ropa', cant: 20, u: 'kits', estado: 'nueva', cuando: 'hoy', vol: null }, // no aceptada aún
    ];

    const cum = calcularCumplimientoOrganizaciones(solicitudes);
    expect(cum.totalAceptadas).toBe(3); // 1, 2 y la cancelada que fue aceptada
    expect(cum.completadas).toBe(2);
    expect(cum.canceladasEnProceso).toBe(1);
    expect(cum.tasaCumplimientoPorcentaje).toBe(67);
    expect(cum.tasaCancelacionPorcentaje).toBe(33);
    expect(cum.motivosFrecuentes).toEqual([{ motivo: 'Falta de transporte', conteo: 1 }]);
  });

  it('4. calcularActividadRed calcula % de organizaciones y líderes activos', () => {
    const act = calcularActividadRed(50, 40, 100, 75);
    expect(act.organizaciones.inscritas).toBe(50);
    expect(act.organizaciones.activas30d).toBe(40);
    expect(act.organizaciones.porcentajeActivas).toBe(80);

    expect(act.lideresComunitarios.inscritos).toBe(100);
    expect(act.lideresComunitarios.activos30d).toBe(75);
    expect(act.lideresComunitarios.porcentajeActivos).toBe(75);
  });
});
