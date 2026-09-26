/**
 * Funciones de cálculo y agregación para el equipo de impacto de RaDAR.
 * Diseñadas para mapear la telemetría del frontend con las vistas SQL en PostgreSQL/Supabase.
 */

import type {
  EntregaRecibida,
  EstadoSolicitud,
  MetricasImpactoPanel,
  Solicitud,
  TransicionEstado,
} from '../types/panel';

/**
 * 1. Calcula el tiempo promedio que las solicitudes pasan en cada columna.
 * Se calcula a partir de las transiciones consecutivas de cada solicitud (`solicitud_historial`).
 */
export function calcularTiemposPorColumna(
  transiciones: TransicionEstado[]
): Record<EstadoSolicitud, { horasPromedio: number; diasPromedio: number; muestra: number }> {
  const estados: EstadoSolicitud[] = ['nueva', 'aceptada', 'camino', 'entregada', 'confirmada', 'distribuida', 'archivada'];
  const acumulado: Record<EstadoSolicitud, { totalHoras: number; cuenta: number }> = {
    nueva: { totalHoras: 0, cuenta: 0 },
    aceptada: { totalHoras: 0, cuenta: 0 },
    camino: { totalHoras: 0, cuenta: 0 },
    entregada: { totalHoras: 0, cuenta: 0 },
    confirmada: { totalHoras: 0, cuenta: 0 },
    distribuida: { totalHoras: 0, cuenta: 0 },
    archivada: { totalHoras: 0, cuenta: 0 },
  };

  // Agrupar transiciones por solicitud
  const porSolicitud = new Map<number, TransicionEstado[]>();
  transiciones.forEach((t) => {
    const lista = porSolicitud.get(t.solicitudId) ?? [];
    lista.push(t);
    porSolicitud.set(t.solicitudId, lista);
  });

  // Para cada solicitud ordenada en el tiempo, calcular diferencia entre estado y el siguiente
  porSolicitud.forEach((eventos) => {
    const ordenados = [...eventos].sort(
      (a, b) => new Date(a.creadoEl).getTime() - new Date(b.creadoEl).getTime()
    );

    for (let i = 0; i < ordenados.length - 1; i++) {
      const actual = ordenados[i];
      const siguiente = ordenados[i + 1];
      const horas =
        (new Date(siguiente.creadoEl).getTime() - new Date(actual.creadoEl).getTime()) /
        (1000 * 60 * 60);

      if (horas >= 0 && acumulado[actual.estadoNuevo]) {
        acumulado[actual.estadoNuevo].totalHoras += horas;
        acumulado[actual.estadoNuevo].cuenta += 1;
      }
    }
  });

  const resultado = {} as Record<EstadoSolicitud, { horasPromedio: number; diasPromedio: number; muestra: number }>;

  estados.forEach((e) => {
    const d = acumulado[e];
    const horas = d.cuenta > 0 ? Math.round((d.totalHoras / d.cuenta) * 10) / 10 : 0;
    resultado[e] = {
      horasPromedio: horas,
      diasPromedio: Math.round((horas / 24) * 10) / 10,
      muestra: d.cuenta,
    };
  });

  return resultado;
}

/**
 * 2. Calcula la calidad de certificación comunitaria y cobertura humana:
 * % de líderes que certifican con foto + historia + beneficiarios.
 */
export function calcularMetricasCertificacion(
  entregas: EntregaRecibida[]
): MetricasImpactoPanel['certificacionLideres'] {
  const distribuidas = entregas.filter(
    (e) => e.estado === 'distribuida' || (e.estado === 'archivada' && e.cierre?.personasBeneficiadas)
  );

  let conFoto = 0;
  let conHistoria = 0;
  let conBeneficiarios = 0;
  let certificacionCompleta = 0;
  let totalPersonasBeneficiadas = 0;

  distribuidas.forEach((e) => {
    const tieneFoto = (e.cierre?.recibe?.fotos ?? 0) > 0;
    const tieneHistoria = Boolean(e.cierre?.historia && e.cierre.historia.trim().length > 10);
    const tieneBeneficiarios = Boolean(e.cierre?.personasBeneficiadas && e.cierre.personasBeneficiadas > 0);

    if (tieneFoto) conFoto++;
    if (tieneHistoria) conHistoria++;
    if (tieneBeneficiarios) {
      conBeneficiarios++;
      totalPersonasBeneficiadas += e.cierre!.personasBeneficiadas!;
    }

    if (tieneFoto && tieneHistoria && tieneBeneficiarios) {
      certificacionCompleta++;
    }
  });

  const total = distribuidas.length;
  const porcentaje = total > 0 ? Math.round((certificacionCompleta / total) * 100) : 0;

  return {
    totalDistribuidas: total,
    conFoto,
    conHistoria,
    conBeneficiarios,
    certificacionCompleta,
    porcentajeCertificacionCompleta: porcentaje,
    totalPersonasBeneficiadas,
  };
}

/**
 * 3. Calcula cumplimiento de solicitudes por organizaciones y tasa de cancelaciones.
 */
export function calcularCumplimientoOrganizaciones(
  solicitudes: (Solicitud & { canceladaEnEstado?: EstadoSolicitud; motivoCancelacion?: string })[]
): MetricasImpactoPanel['cumplimientoOrganizaciones'] {
  const aceptadas = solicitudes.filter(
    (s) => s.estado !== 'nueva' || Boolean(s.canceladaEnEstado && s.canceladaEnEstado !== 'nueva')
  );

  const completadas = aceptadas.filter(
    (s) => !s.motivoCancelacion && (s.estado === 'confirmada' || s.estado === 'distribuida' || s.estado === 'archivada')
  ).length;

  const canceladasEnProceso = aceptadas.filter(
    (s) => Boolean(s.motivoCancelacion) && s.canceladaEnEstado !== 'nueva'
  ).length;

  const totalAceptadas = completadas + canceladasEnProceso || aceptadas.length;
  const tasaCumplimiento = totalAceptadas > 0 ? Math.round((completadas / totalAceptadas) * 100) : 0;
  const tasaCancelacion = totalAceptadas > 0 ? Math.round((canceladasEnProceso / totalAceptadas) * 100) : 0;

  const motivosMap = new Map<string, number>();
  solicitudes.forEach((s) => {
    if (s.motivoCancelacion) {
      motivosMap.set(s.motivoCancelacion, (motivosMap.get(s.motivoCancelacion) ?? 0) + 1);
    }
  });

  const motivosFrecuentes = Array.from(motivosMap.entries())
    .map(([motivo, conteo]) => ({ motivo, conteo }))
    .sort((a, b) => b.conteo - a.conteo);

  return {
    totalAceptadas,
    completadas,
    tasaCumplimientoPorcentaje: tasaCumplimiento,
    canceladasEnProceso,
    tasaCancelacionPorcentaje: tasaCancelacion,
    motivosFrecuentes,
  };
}

/**
 * 4. Calcula organizaciones y líderes comunitarios activos vs inscritos en los últimos 30 días.
 */
export function calcularActividadRed(
  totalOrgsInscritas: number,
  orgsConActividad30d: number,
  totalLideresInscritos: number,
  lideresConActividad30d: number
): MetricasImpactoPanel['actividadRed'] {
  const pctOrgs = totalOrgsInscritas > 0 ? Math.round((orgsConActividad30d / totalOrgsInscritas) * 100) : 0;
  const pctLideres = totalLideresInscritos > 0 ? Math.round((lideresConActividad30d / totalLideresInscritos) * 100) : 0;

  return {
    organizaciones: {
      inscritas: totalOrgsInscritas,
      activas30d: orgsConActividad30d,
      porcentajeActivas: pctOrgs,
    },
    lideresComunitarios: {
      inscritos: totalLideresInscritos,
      activos30d: lideresConActividad30d,
      porcentajeActivos: pctLideres,
    },
  };
}
