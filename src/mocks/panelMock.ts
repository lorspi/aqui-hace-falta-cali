/**
 * Datos simulados del panel (mockup/*): la cuenta abierta es Bomberos Voluntarios Usme, la
 * misma de la Radar y de los avisos. Cuadra con `publicacionesMock.ts` (`oferta-usme`: 900 L
 * de agua, 50 kits, 2 plantas) y con `avisosMock.ts`. Origen: `src/organizacion.html` y
 * `src/comunidad.html` del prototipo. Hoy es 14 de septiembre.
 */
import type { Actividad, DatosOrg, EntregaRecibida, Invitado, MetricasImpactoPanel, MiembroEquipo, NecesidadPublicada, OfertaPublicada, OfrecimientoEnviado, PermisosRol, Solicitud, SolicitudEnviada, TransicionEstado } from '../types/panel';
import { calcularActividadRed, calcularTiemposPorColumna } from '../utils/impacto';

/** Dos contactos, y no se mezclan: `contacto` es el de la organización y es el único que
 *  ven los demás; `enlace` es la persona a la que RaDAR le escribe. */
export const ORG: DatosOrg = {
  nombre: 'Bomberos Voluntarios Usme',
  tipo: 'Cuerpo de socorro',
  nit: '830.123.456-7',
  dir: 'Estación Usme, Cl. 91 sur #3-20',
  contacto: { tel: '+57 601 555 2020', wa: true, correo: 'contacto@bomberosusme.org' },
  enlace: 'Carlos Peña · +57 310 555 0199',
  directorio: false,
  directorioDesde: '',
  web: 'instagram.com/bomberosusme',
  verificacion: 'verificada',
  canalesRevisados: false,
};

/** Lo que la organización OFRECE (se abre con el módulo `ofrece`). */
export const OFERTA: OfertaPublicada = {
  id: 'oferta-usme',
  publicada: 'hace 2 días',
  confirmada: 'hace 6 horas',
  recursos: [
    { n: 'Agua potable', icono: 'drop', unidad: 'L', total: 900, disp: 'Hasta agotar', pres: 'Carrotanque' },
    { n: 'Alimentos', icono: 'bowl', unidad: 'kits', total: 50, disp: 'Hasta el 20 sep', pres: 'Kits de mercado' },
    { n: 'Planta eléctrica', icono: 'bolt', unidad: 'unidades', total: 2, disp: '48 horas', pres: '5 a 20 kW' },
  ],
};

/** Quién pidió qué de la oferta, en su ciclo. */
export const SOLICITUDES: Solicitud[] = [
  { id: 1, quien: 'Albergue Bosa', rec: 'Agua potable', cant: 180, u: 'L', estado: 'confirmada', cuando: '12 sep, 9:40 a. m.', vol: 3, cerradaEl: '2026-09-12', cierre: { entrega: { fotos: 2 }, recibe: { fotos: 1 }, historia: 'Con esa agua la cocina del albergue y los baños aguantaron el fin de semana para 140 personas evacuadas.' } },
  { id: 2, quien: 'Comedor Villa Gloria', rec: 'Agua potable', cant: 270, u: 'L', estado: 'camino', cuando: 'sale hoy 6:00 p. m.', vol: 1 },
  { id: 3, quien: 'Comedor Villa Gloria', rec: 'Alimentos', cant: 30, u: 'kits', estado: 'confirmada', cuando: '13 sep, 11:20 a. m.', vol: 2, cerradaEl: '2026-09-13', cierre: { recibe: { fotos: 1 }, historia: 'Los 30 kits de alimentos permitieron reactivar el comedor comunitario durante 4 días para 85 niños y adultos mayores de Villa Gloria.' } },
  { id: 8, quien: 'JAC Vereda El Destino', rec: 'Agua potable', cant: 120, u: 'L', estado: 'confirmada', cuando: '2 ago, 4:00 p. m.', vol: 1, cerradaEl: '2026-08-02', cierre: { entrega: { fotos: 1 }, recibe: { fotos: 2 }, historia: 'Abastecimiento de agua vital distribuido a 35 familias campesinas que quedaron incomunicadas por el derrumbe en la vía principal.' } },
  { id: 4, quien: 'Hospital de Usme', rec: 'Planta eléctrica', cant: 1, u: 'unidad', estado: 'entregada', cuando: 'ayer 4:10 p. m.', vol: 3 },
  { id: 5, quien: 'Fundación Colombia Unida', rec: 'Agua potable', cant: 200, u: 'L', estado: 'nueva', cuando: 'hace 40 min', vol: null, dist: '9,1 km' },
  { id: 6, quien: 'Colegio Ciudad de Bogotá', rec: 'Planta eléctrica', cant: 1, u: 'unidad', estado: 'nueva', cuando: 'hace 2 horas', vol: null, dist: '6,4 km' },
  { id: 7, quien: 'JAC El Recuerdo', rec: 'Alimentos', cant: 10, u: 'kits', estado: 'aceptada', cuando: 'aceptada hace 1 hora', vol: null, dist: '3,2 km' },
];

/** Lo que la organización PIDE (se abre con el módulo `pide`): la necesidad propia de
 *  equipos de bombeo que cuentan los avisos. */
export const NECESIDAD: NecesidadPublicada = {
  id: 'necesidad-usme',
  publicada: 'hace 5 días',
  recursos: [
    { n: 'Equipos de bombeo', icono: 'bolt', unidad: 'motobombas', total: 4, confirmada: 0, camino: 2, para: 'Sacar el agua de los sótanos de la calle 91 sur' },
    { n: 'Protección respiratoria', icono: 'stetho', unidad: 'unidades', total: 100, confirmada: 100, camino: 0, para: 'Para el equipo que remueve lodo' },
  ],
};

/** Lo que nos traen para la necesidad, en el mismo ciclo. */
export const RECIBIDAS: EntregaRecibida[] = [
  { id: 101, org: 'Cruz Roja seccional', rec: 'Equipos de bombeo', cant: 2, u: 'motobombas', estado: 'entregada', cuando: 'hace 12 min', dist: '9,1 km', detalle: 'Dos motobombas de 3 pulgadas', vol: 'Camilo Torres' },
  { id: 102, org: 'Alcaldía local de Usme', rec: 'Protección respiratoria', cant: 100, u: 'unidades', estado: 'confirmada', cuando: '11 sep, 10:00 a. m.', dist: '1,7 km', detalle: 'Respiradores N95', vol: 'Transporte de la alcaldía', cerradaEl: '2026-09-11', cierre: { entrega: { fotos: 1 }, recibe: { fotos: 1 }, historia: 'Con los respiradores el equipo pudo entrar a remover el lodo de la calle 91 sur el mismo día, sin esperar dotación.' } },
];

/** Solicitudes directas que el líder o la organización envió a ofertas en el Radar. */
export const SOLICITUDES_ENVIADAS: SolicitudEnviada[] = [
  {
    id: 'sol-env-1',
    publicacionId: 'oferta-cruz-roja',
    donante: 'Cruz Roja seccional',
    donanteTipo: 'Cuerpo de socorro',
    rec: 'Equipos de bombeo',
    icono: 'bolt',
    cant: 2,
    u: 'motobombas',
    cuando: 'ayer 2:30 p. m.',
    estado: 'aceptada',
    contacto: { tel: '+57 312 456 7890', wa: true },
    entregaRecibidaId: 101,
  },
  {
    id: 'sol-env-2',
    donante: 'Fundación Éxito · Acopio Sur',
    donanteTipo: 'Fundación',
    rec: 'Alimentos no perecederos',
    icono: 'bowl',
    cant: 50,
    u: 'mercados',
    cuando: 'hoy 10:15 a. m.',
    estado: 'en_revision',
    contacto: { tel: '+57 300 123 4567', wa: true },
  },
  {
    id: 'sol-env-3',
    donante: 'Defensa Civil Colombiana',
    donanteTipo: 'Organismo de socorro',
    rec: 'Frazadas y colchonetas',
    icono: 'package',
    cant: 80,
    u: 'unidades',
    cuando: 'hace 3 días',
    estado: 'declinada',
    motivo: 'Capacidad de stock asignada a contingencia prioritaria en zona rural.',
  },
];

/** Ofrecimientos directos de ayuda que la organización envió a necesidades comunitarias en el Radar. */
export const OFRECIMIENTOS_ENVIADOS: OfrecimientoEnviado[] = [
  {
    id: 'ofr-env-1',
    necesidadId: 'nec-comedor-san-jose',
    comunidad: 'Comedor Comunitario Siloé',
    lugar: 'Siloé, Comuna 20 · Cali',
    rec: 'Tanques de agua potable',
    icono: 'drop',
    cant: 2,
    u: 'tanques 500L',
    cuando: 'ayer 4:00 p. m.',
    estado: 'aceptado',
    contacto: { nombre: 'Gladys Mina (Líder comunitaria)', tel: '+57 312 849 2031', wa: true },
    solicitudId: 1,
  },
  {
    id: 'ofr-env-2',
    necesidadId: 'nec-albergue-bosa',
    comunidad: 'Albergue Infantil Bosa',
    lugar: 'Bosa Centro · Bogotá D. C.',
    rec: 'Kits de primeros auxilios',
    icono: 'package',
    cant: 40,
    u: 'kits',
    cuando: 'hoy 11:30 a. m.',
    estado: 'pendiente',
    contacto: { nombre: 'Carlos Ruiz (Coordinador)', tel: '+57 315 987 6543', wa: true },
  },
  {
    id: 'ofr-env-3',
    comunidad: 'Junta de Acción Comunal Terrón Colorado',
    lugar: 'Terrón Colorado · Cali',
    rec: 'Ropa térmica y cobijas',
    icono: 'package',
    cant: 60,
    u: 'unidades',
    cuando: 'hace 2 días',
    estado: 'declinado',
    motivo: 'Meta de abrigo ya cubierta en su totalidad por donación comunitaria previa.',
  },
];

export const EQUIPO: MiembroEquipo[] = [
  { id: 1, n: 'Mateo Rojas', rolPlataforma: 'coordinador', rol: 'Arquitectura y peritaje', veh: 'Camioneta', tel: '+57 311 200 1001', correo: 'mateo.rojas@bomberosusme.org', disp: 'tiempo_completo', hechas: 4, ubicacion: 'Bogotá D. C.' },
  { id: 2, n: 'Laura Díaz', rolPlataforma: 'admin', rol: 'Logística y acopio', veh: 'Sin vehículo (a pie)', tel: '+57 311 200 1002', correo: 'laura.diaz@bomberosusme.org', disp: 'tardes', hechas: 2, ubicacion: 'Bogotá D. C.' },
  { id: 3, n: 'Andrés Peña', rolPlataforma: 'terreno', rol: 'Peritaje hídrico y suelos', veh: 'Moto', tel: '+57 311 200 1003', correo: '', disp: 'tiempo_completo', hechas: 6, ubicacion: 'Cundinamarca' },
  { id: 4, n: 'Sofía Mora', rolPlataforma: 'terreno', rol: 'Atención médica prehospitalaria', veh: 'Carro particular', tel: '+57 311 200 1004', correo: '', disp: 'fines_de_semana', hechas: 1, ubicacion: 'Valle del Cauca' },
];

export const INVITADOS: Invitado[] = [
  { n: 'Laura Díaz', rol: 'Gestiona entregas y equipo', estado: 'activa' },
  { n: 'Mateo Rojas', rol: 'Solo ve', estado: 'pendiente', cuando: 'hace 2 días' },
];

export const ACTIVIDAD: Actividad[] = [
  { cuando: '9:40', texto: 'Albergue Bosa confirmó 180 L de agua potable.' },
  { cuando: '9:28', texto: 'Cruz Roja seccional te entregó 2 motobombas. Falta que confirmes.' },
  { cuando: '8:15', texto: 'Fundación Colombia Unida solicitó 200 L de agua potable.' },
  { cuando: 'ayer', texto: 'Andrés Peña entregó la planta eléctrica al Hospital de Usme.' },
  { cuando: 'ayer', texto: 'Aceptaste la solicitud de JAC El Recuerdo: 10 kits.' },
  { cuando: '13 sep', texto: 'Comedor Villa Gloria confirmó 30 kits de alimentos.' },
];

export const ROL_PLATAFORMA: Record<MiembroEquipo['rolPlataforma'], string> = {
  admin: 'Administrador',
  coordinador: 'Coordinador',
  voluntario: 'Voluntario / Repartidor',
  auditor: 'Solo ve',
  terreno: 'Solo en terreno',
};

export const DESCRIPCION_ROL_PLATAFORMA: Record<MiembroEquipo['rolPlataforma'], string> = {
  admin: 'Control total: edita la entidad, gestiona el equipo y publica ayudas.',
  coordinador: 'Logística diaria: asigna voluntarios, aprueba solicitudes y valida entregas.',
  voluntario: 'Acceso móvil: ve el detalle completo de la ayuda asignada y certifica con fotos.',
  terreno: 'Sin cuenta en la app: solo contacto para coordinar por llamada o WhatsApp.',
  auditor: 'Solo consulta: veeduría y seguimiento sin permisos de edición.',
};

export const MATRIZ_PERMISOS: Record<MiembroEquipo['rolPlataforma'], PermisosRol> = {
  admin: {
    gestionEntidad: true,
    gestionEquipo: true,
    publicarAyuda: true,
    coordinarEntregas: true,
    verDetalleAsignacion: true,
    certificarEntrega: true,
    auditoriaLectura: true,
  },
  coordinador: {
    gestionEntidad: false,
    gestionEquipo: false,
    publicarAyuda: true,
    coordinarEntregas: true,
    verDetalleAsignacion: true,
    certificarEntrega: true,
    auditoriaLectura: true,
  },
  voluntario: {
    gestionEntidad: false,
    gestionEquipo: false,
    publicarAyuda: false,
    coordinarEntregas: false,
    verDetalleAsignacion: true,
    certificarEntrega: true,
    auditoriaLectura: false,
  },
  terreno: {
    gestionEntidad: false,
    gestionEquipo: false,
    publicarAyuda: false,
    coordinarEntregas: false,
    verDetalleAsignacion: false,
    certificarEntrega: false,
    auditoriaLectura: false,
  },
  auditor: {
    gestionEntidad: false,
    gestionEquipo: false,
    publicarAyuda: false,
    coordinarEntregas: false,
    verDetalleAsignacion: true,
    certificarEntrega: false,
    auditoriaLectura: true,
  },
};

export const DISPONIBILIDAD: Record<MiembroEquipo['disp'], string> = {
  tiempo_completo: 'Cualquier día',
  fines_de_semana: 'Fines de semana',
  emergencias: 'Bajo llamado',
  tardes: 'Cualquier día',
  hoy: 'Cualquier día',
  manana: 'Cualquier día',
  finde: 'Fines de semana',
  '': 'Por definir',
};

export const ESTADO_SOLICITUD: Record<Solicitud['estado'], { texto: string; tono: 'inicial' | 'proceso' | 'completo' }> = {
  nueva: { texto: 'Nueva', tono: 'inicial' },
  aceptada: { texto: 'Aceptada', tono: 'inicial' },
  camino: { texto: 'En camino', tono: 'proceso' },
  entregada: { texto: 'Entregada · por confirmar', tono: 'proceso' },
  confirmada: { texto: 'Confirmada', tono: 'completo' },
  distribuida: { texto: 'Distribuida', tono: 'completo' },
  archivada: { texto: 'Archivada', tono: 'completo' },
};

/** A los cuántos días una entrega confirmada pasa sola a Archivadas. */
export const DIAS_PARA_ARCHIVAR = 30;

/** El mismo ciclo visto desde quien recibe. */
export const ESTADO_RECIBIDA: Record<EntregaRecibida['estado'], { texto: string; tono: 'inicial' | 'proceso' | 'completo' }> = {
  nueva: { texto: 'En revisión', tono: 'inicial' },
  aceptada: { texto: 'Comprometida', tono: 'inicial' },
  camino: { texto: 'En camino', tono: 'proceso' },
  entregada: { texto: 'Por confirmar', tono: 'proceso' },
  confirmada: { texto: 'Recibido', tono: 'completo' },
  distribuida: { texto: 'Distribuida', tono: 'completo' },
  archivada: { texto: 'Archivada', tono: 'completo' },
};

/** Las dos puertas del panel vacío: lo que abre cada una. */
export const PUERTAS = {
  pedir: {
    titulo: 'Pedir ayuda',
    texto: 'Publica lo que hace falta y sigue aquí quién se compromete, qué va en camino y qué te llegó.',
    abre: ['Mis necesidades', 'Seguimiento'],
  },
  ofrecer: {
    titulo: 'Ofrecer ayuda',
    texto: 'Publica lo que tienen disponible y sigue aquí quién te lo pide, a quién asignas cada entrega y cómo va cada una.',
    abre: ['Mis ofertas', 'Seguimiento'],
  },
};

/**
 * Historial de auditoría simulado para el desarrollador.
 * En producción (Supabase), esta información se llena automáticamente con el trigger
 * `trg_solicitud_cambio_estado` sobre la tabla `solicitud_historial`.
 */
export const HISTORIAL_TRANSICIONES_MOCK: TransicionEstado[] = [
  // Solicitud 1: Albergue Bosa (Agua)
  { id: 'ev-1', solicitudId: 1, tipo: 'solicitud', estadoAnterior: null, estadoNuevo: 'nueva', actor: 'Albergue Bosa', creadoEl: '2026-09-10T08:00:00Z' },
  { id: 'ev-2', solicitudId: 1, tipo: 'solicitud', estadoAnterior: 'nueva', estadoNuevo: 'aceptada', actor: 'Bomberos Voluntarios Usme', creadoEl: '2026-09-10T10:30:00Z' },
  { id: 'ev-3', solicitudId: 1, tipo: 'solicitud', estadoAnterior: 'aceptada', estadoNuevo: 'camino', actor: 'Mateo Rojas', creadoEl: '2026-09-11T14:00:00Z' },
  { id: 'ev-4', solicitudId: 1, tipo: 'solicitud', estadoAnterior: 'camino', estadoNuevo: 'entregada', actor: 'Andrés Peña', creadoEl: '2026-09-11T16:30:00Z' },
  { id: 'ev-5', solicitudId: 1, tipo: 'solicitud', estadoAnterior: 'entregada', estadoNuevo: 'confirmada', actor: 'Albergue Bosa', creadoEl: '2026-09-12T09:40:00Z' },

  // Solicitud 3: Comedor Villa Gloria (Alimentos)
  { id: 'ev-6', solicitudId: 3, tipo: 'solicitud', estadoAnterior: null, estadoNuevo: 'nueva', actor: 'Comedor Villa Gloria', creadoEl: '2026-09-11T09:00:00Z' },
  { id: 'ev-7', solicitudId: 3, tipo: 'solicitud', estadoAnterior: 'nueva', estadoNuevo: 'aceptada', actor: 'Bomberos Voluntarios Usme', creadoEl: '2026-09-11T10:00:00Z' },
  { id: 'ev-8', solicitudId: 3, tipo: 'solicitud', estadoAnterior: 'aceptada', estadoNuevo: 'camino', actor: 'Laura Díaz', creadoEl: '2026-09-12T08:00:00Z' },
  { id: 'ev-9', solicitudId: 3, tipo: 'solicitud', estadoAnterior: 'camino', estadoNuevo: 'entregada', actor: 'Laura Díaz', creadoEl: '2026-09-12T10:30:00Z' },
  { id: 'ev-10', solicitudId: 3, tipo: 'solicitud', estadoAnterior: 'entregada', estadoNuevo: 'confirmada', actor: 'Comedor Villa Gloria', creadoEl: '2026-09-13T11:20:00Z' },

  // Entrega Recibida 102: Protección respiratoria (confirmada)
  { id: 'ev-11', solicitudId: 102, tipo: 'recibida', estadoAnterior: null, estadoNuevo: 'nueva', actor: 'Bomberos Voluntarios Usme', creadoEl: '2026-09-09T08:00:00Z' },
  { id: 'ev-12', solicitudId: 102, tipo: 'recibida', estadoAnterior: 'nueva', estadoNuevo: 'aceptada', actor: 'Alcaldía local de Usme', creadoEl: '2026-09-09T11:00:00Z' },
  { id: 'ev-13', solicitudId: 102, tipo: 'recibida', estadoAnterior: 'aceptada', estadoNuevo: 'camino', actor: 'Transporte de la alcaldía', creadoEl: '2026-09-10T14:00:00Z' },
  { id: 'ev-14', solicitudId: 102, tipo: 'recibida', estadoAnterior: 'camino', estadoNuevo: 'entregada', actor: 'Transporte de la alcaldía', creadoEl: '2026-09-10T16:00:00Z' },
  { id: 'ev-15', solicitudId: 102, tipo: 'recibida', estadoAnterior: 'entregada', estadoNuevo: 'confirmada', actor: 'Bomberos Voluntarios Usme', creadoEl: '2026-09-11T10:00:00Z' },
];

/**
 * Métricas consolidadas para el equipo de impacto.
 * Permite que cualquier componente o pantalla consulte los 4 indicadores clave.
 */
export const METRICAS_IMPACTO_MOCK: MetricasImpactoPanel = {
  tiemposPorColumna: calcularTiemposPorColumna(HISTORIAL_TRANSICIONES_MOCK),
  certificacionLideres: {
    totalDistribuidas: 18,
    conFoto: 16,
    conHistoria: 15,
    conBeneficiarios: 17,
    certificacionCompleta: 14,
    porcentajeCertificacionCompleta: 78,
    totalPersonasBeneficiadas: 1420,
  },
  cumplimientoOrganizaciones: {
    totalAceptadas: 24,
    completadas: 21,
    tasaCumplimientoPorcentaje: 88,
    canceladasEnProceso: 3,
    tasaCancelacionPorcentaje: 12,
    motivosFrecuentes: [
      { motivo: 'Falta de transporte o vehículo disponible', conteo: 2 },
      { motivo: 'Insumos averiados durante el alistamiento', conteo: 1 },
    ],
  },
  actividadRed: calcularActividadRed(42, 34, 58, 47),
};
