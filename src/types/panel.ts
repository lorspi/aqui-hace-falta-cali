/**
 * Contratos del panel de la cuenta (mockup/*): «Mi organización» / «Mi comunidad». Origen:
 * `src/organizacion.html` y `src/comunidad.html` del prototipo de RaDAR.
 *
 * El panel se arma con lo que la cuenta ya hizo (`ModulosCuenta`, en `cuenta.ts`): publicar
 * una oferta abre el módulo de ofrecer (mis ofertas, quién pidió qué, seguimiento de
 * entregas); publicar una necesidad abre el de pedir (mis necesidades, lo que llega y hay
 * que confirmar). Lo demás —resumen, equipo, datos— está siempre.
 */
import type { IconoRecurso } from './publicacion';

/** Una solicitud que alguien hizo sobre MI oferta, en su ciclo:
 *  nueva → aceptada → camino → entregada (por confirmar) → confirmada.
 *  La confirmación es de los dos lados (Alejandro, 16 de septiembre de 2026, sobre la rama de
 *  Fede): quien entrega la certifica con foto y quien recibe la confirma con foto; cualquiera
 *  de los dos la cierra y el otro la valida. */
export type EstadoSolicitud = 'nueva' | 'aceptada' | 'camino' | 'entregada' | 'confirmada' | 'distribuida' | 'archivada';

/** Cómo se cerró una entrega: quién confirmó y con cuántas fotos cada lado. */
export interface Cierre {
  entrega?: { fotos: number };
  recibe?: { fotos: number };
  /** Lo que esa ayuda permitió, contado por quien entregó (historia de impacto). */
  historia?: string;
  /** Número de personas o familias beneficiadas con la entrega/distribución comunitaria. */
  personasBeneficiadas?: number;
  /** Notas de ruta / despacho / transporte registradas en camino. */
  notasCamino?: string;
  /** Observaciones registradas al certificar la entrega. */
  notasEntrega?: string;
  /** Observaciones registradas al confirmar la recepción. */
  notasRecibe?: string;
}

export interface Solicitud {
  id: number;
  quien: string;
  rec: string;
  cant: number;
  u: string;
  estado: EstadoSolicitud;
  cuando: string;
  /** Quién la lleva: id de `MiembroEquipo`. */
  vol: number | null;
  dist?: string;
  cierre?: Cierre;
  /** Notas de ruta o transporte cuando se marcó en camino. */
  notasCamino?: string;
  /** Observaciones registradas al certificar la entrega. */
  notasEntrega?: string;
  /** Motivo si la solicitud no pudo ser atendida por la organización. */
  motivoRechazo?: string;
  /** Motivo si la solicitud fue cancelada o desistida en algún punto del ciclo. */
  motivoCancelacion?: string;
  /** En qué estado se encontraba cuando fue cancelada (ej. 'aceptada', 'camino'). */
  canceladaEnEstado?: EstadoSolicitud;
  /** Fecha (AAAA-MM-DD) en que quedó confirmada. Las confirmadas se archivan a mano con
   *  «Archivar» o solas a los 30 días (Alejandro, 16 de septiembre de 2026), para que no se
   *  acumulen en el tablero. */
  cerradaEl?: string;
}

/** Un recurso de MI oferta publicada. Sin `entregado` ni `quedan`: se cuentan desde las
 *  solicitudes, que es donde vive el estado de cada entrega. */
export interface RecursoOfrecido {
  n: string;
  icono: IconoRecurso;
  unidad: string;
  total: number;
  disp: string;
  pres: string;
  pausado?: boolean;
}

export interface OfertaPublicada {
  id: string;
  publicada: string;
  confirmada: string;
  recursos: RecursoOfrecido[];
}

/** Un recurso de MI necesidad publicada, con lo comprometido y lo que ya llegó. */
export interface RecursoPedido {
  n: string;
  icono: IconoRecurso;
  unidad: string;
  total: number;
  confirmada: number;
  camino: number;
  para: string;
  pausado?: boolean;
}

export interface NecesidadPublicada {
  id: string;
  publicada: string;
  recursos: RecursoPedido[];
}

/** Lo que otra organización nos trae para nuestra necesidad, en el mismo ciclo. */
export interface EntregaRecibida {
  id: number;
  org: string;
  rec: string;
  cant: number;
  u: string;
  estado: EstadoSolicitud;
  cuando: string;
  dist?: string;
  detalle?: string;
  vol: string | null;
  cierre?: Cierre;
  /** Notas de ruta o transporte de la entrega recibida. */
  notasCamino?: string;
  /** Observaciones registradas al confirmar la recepción. */
  notasRecibe?: string;
  /** Motivo si el ofrecimiento de ayuda fue declinado o no aceptado. */
  motivoRechazo?: string;
  /** Motivo si fue cancelada o no recibida. */
  motivoCancelacion?: string;
  /** Fecha (AAAA-MM-DD) en que la confirmaste o distribuiste. */
  cerradaEl?: string;
}

/** Estado de una solicitud directa que el líder comunitario envió a la oferta de un donante. */
export type EstadoSolicitudEnviada = 'en_revision' | 'aceptada' | 'declinada' | 'cancelada';

/** Una solicitud directa que la comunidad u organización hizo sobre la oferta de un tercero. */
export interface SolicitudEnviada {
  id: number | string;
  publicacionId?: string;
  donante: string;
  donanteTipo?: string;
  rec: string;
  icono?: IconoRecurso;
  cant: number;
  u: string;
  cuando: string;
  estado: EstadoSolicitudEnviada;
  motivo?: string;
  motivoCancelacion?: string;
  contacto?: { tel?: string; wa?: boolean };
  entregaRecibidaId?: number;
}

/** Estado de un ofrecimiento directo que la organización hizo sobre la necesidad de una comunidad. */
export type EstadoOfrecimientoEnviado = 'pendiente' | 'aceptado' | 'declinado' | 'cancelado';

/** Un ofrecimiento directo de ayuda que la organización envió a una necesidad comunitaria en el Radar. */
export interface OfrecimientoEnviado {
  id: number | string;
  necesidadId?: string;
  comunidad: string;
  lugar?: string;
  rec: string;
  icono?: IconoRecurso;
  cant: number;
  u: string;
  cuando: string;
  estado: EstadoOfrecimientoEnviado;
  motivo?: string;
  motivoCancelacion?: string;
  contacto?: { nombre?: string; tel?: string; wa?: boolean };
  solicitudId?: number;
}

export type RolPlataforma = 'admin' | 'coordinador' | 'voluntario' | 'auditor' | 'terreno';

/**
 * Matriz de capacidades por rol de plataforma para desarrollo (Frontend / RLS Supabase)
 */
export interface PermisosRol {
  /** Modificar datos de la entidad, certificados, configuración */
  gestionEntidad: boolean;
  /** Invitar, dar de baja y asignar roles al equipo */
  gestionEquipo: boolean;
  /** Crear, pausar y editar ofertas y necesidades */
  publicarAyuda: boolean;
  /** Aprobar solicitudes y asignar quién lleva la entrega */
  coordinarEntregas: boolean;
  /** Ver la ficha / tarjeta detallada de la necesidad u oferta asignada */
  verDetalleAsignacion: boolean;
  /** Marcar entrega y adjuntar fotografías de soporte */
  certificarEntrega: boolean;
  /** Acceso al resumen, auditoría y actas */
  auditoriaLectura: boolean;
}

export type DisponibilidadMiembro = 'tiempo_completo' | 'fines_de_semana' | 'emergencias' | 'tardes' | 'hoy' | 'manana' | 'finde' | '';

export interface MiembroEquipo {
  id: number;
  n: string;
  rolPlataforma: RolPlataforma;
  rol: string;
  veh: string;
  tel: string;
  correo: string;
  disp: DisponibilidadMiembro;
  hechas: number;
  ubicacion?: string;
}

export interface Actividad {
  cuando: string;
  texto: string;
}

export type Verificacion = 'sin' | 'revision' | 'verificada' | 'rechazada';

export interface DatosOrg {
  nombre: string;
  tipo: string;
  nit: string;
  dir: string;
  contacto: { tel: string; wa: boolean; correo: string };
  enlace: string;
  directorio: boolean;
  directorioDesde: string;
  web: string;
  verificacion: Verificacion;
  motivoRechazo?: string;
  canalesRevisados: boolean;
}

export interface Invitado {
  n: string;
  rol: string;
  estado: 'activa' | 'pendiente';
  cuando?: string;
}

/** Una pestaña del panel. `modulo` dice qué la abre; sin módulo, está siempre. */
export interface PestanaPanel {
  id: string;
  nombre: string;
  modulo?: 'pide' | 'ofrece';
  /** Conteo de lo pendiente en esa pestaña, si lo hay. */
  n?: number;
}

/** Un cuadrito del Resumen: cuántas entregas hay en un estado. Lleva el estado para que el
 *  icono tome el mismo color que ese estado en la barra y en el tablero (Alejandro, 16 de
 *  septiembre de 2026: cuadritos y barra cuentan lo mismo, o confunden). */
export interface Kpi {
  k: string;
  v: number;
  d: string;
  estado: EstadoSolicitud;
}

/** Un tramo de la barra proporcional de un bloque del Resumen. */
export interface TramoBarra {
  estado: EstadoSolicitud;
  texto: string;
  n: number;
}

/** Un bloque del Resumen (Alejandro, 16 de septiembre de 2026, sobre el patrón del «Spend
 *  overview»): una cara de la cuenta —lo que pidió o lo que ofrece— con sus entregas por
 *  estado: cuadritos y barra con las mismas cifras. Lo de los recursos no va aquí: vive en su
 *  pestaña, a la que lleva el enlace. Nada se cruza entre bloques. */
export interface BloqueResumen {
  id: 'pide' | 'ofrece';
  titulo: string;
  enlace: { texto: string; al: string };
  kpis: Kpi[];
  /** Qué se cuenta en la barra («Entregas hacia ti», «Solicitudes recibidas»). */
  barraTitulo: string;
  barra: TramoBarra[];
}

/** Lo que espera a la persona en el Resumen, en dos niveles (de la rama de Fede, por
 *  decisión de Alejandro, 16 de septiembre de 2026): `decision` es lo que hay que responder ya
 *  (solicitudes nuevas, entregas recibidas sin confirmar); `operacion` es lo que está en curso
 *  (asignar, en camino, por certificar, fechas por vencer). */
export interface Pendiente {
  id: string;
  grupo: 'decision' | 'operacion';
  icono: 'nueva' | 'tiempo' | 'equipo' | 'paquete' | 'aviso' | 'camino';
  titulo: string;
  detalle: string;
  accion: { texto: string; nivel: 'primario' | 'secundario' | 'terciario'; al: string };
  /** Una segunda salida, a la izquierda de la principal («Rechazar», «Recordar»). */
  secundaria?: { texto: string; al: string };
  /** Bloquea pedir más ayuda hasta resolverse (confirmar lo recibido). */
  bloquea?: boolean;
}

/** El acta de una entrega confirmada, para la pestaña Reportes (de «Histórico y reportes» del
 *  prototipo de comunidad, por decisión de Alejandro, 16 de septiembre de 2026): una por
 *  entrega cerrada, de las dos caras, con todo lo que alguien va a querer mostrar después
 *  (quién entregó, quién recibió, qué, cuándo, quién la llevó, cómo se confirmó, la historia). */
export interface Acta {
  /** El código del acta: RD-<año>-<siglas>-<n.º>. */
  codigo: string;
  lado: 'pide' | 'ofrece';
  /** Fecha AAAA-MM-DD de la confirmación. */
  fecha: string;
  fechaTexto: string;
  entrego: string;
  recibio: string;
  rec: string;
  cant: number;
  u: string;
  /** Quién la llevó (nombre), si se sabe. */
  lleva?: string;
  cierre: Cierre;
  /** Texto de cómo se confirmó («Confirmada por ti y por …»). */
  confirmacion: string;
  historia?: string;
  notasCamino?: string;
  notasEntrega?: string;
  notasRecibe?: string;
  /** La entrega de la que sale, para abrir sus fotos. */
  origen: { tipo: 'solicitud' | 'recibida'; id: number };
}

/**
 * Evento en la tabla de historial de auditoría (`solicitud_historial` en PostgreSQL).
 * Permite calcular tiempos de permanencia en cada columna, lead times y abandonos.
 */
export interface TransicionEstado {
  id: string;
  solicitudId: number;
  tipo: 'solicitud' | 'recibida';
  estadoAnterior: EstadoSolicitud | null;
  estadoNuevo: EstadoSolicitud;
  actor: string;
  creadoEl: string; // ISO 8601 string
  motivo?: string;
}

/**
 * Métricas requeridas por el equipo de impacto:
 * 1. Tiempos en cada columna
 * 2. % de certificación completa (foto + historia + beneficiarios) y cobertura
 * 3. Cumplimiento de compromisos vs cancelaciones
 * 4. Activos vs Inscritos
 */
export interface MetricasImpactoPanel {
  /** 1. Tiempo promedio en horas y días que pasa cada ítem en cada columna */
  tiemposPorColumna: Record<EstadoSolicitud, { horasPromedio: number; diasPromedio: number; muestra: number }>;
  /** 2. % de entregas que certifican con foto + historia + beneficiarios */
  certificacionLideres: {
    totalDistribuidas: number;
    conFoto: number;
    conHistoria: number;
    conBeneficiarios: number;
    certificacionCompleta: number;
    porcentajeCertificacionCompleta: number;
    totalPersonasBeneficiadas: number;
  };
  /** 3. Cumplimiento de compromisos por organizaciones vs cancelaciones */
  cumplimientoOrganizaciones: {
    totalAceptadas: number;
    completadas: number;
    tasaCumplimientoPorcentaje: number;
    canceladasEnProceso: number;
    tasaCancelacionPorcentaje: number;
    motivosFrecuentes: { motivo: string; conteo: number }[];
  };
  /** 4. Activos vs Inscritos en la red */
  actividadRed: {
    organizaciones: {
      inscritas: number;
      activas30d: number;
      porcentajeActivas: number;
    };
    lideresComunitarios: {
      inscritos: number;
      activos30d: number;
      porcentajeActivos: number;
    };
  };
}
