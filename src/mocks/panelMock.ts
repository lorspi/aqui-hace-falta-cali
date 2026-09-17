/**
 * Datos simulados del panel (mockup/*): la cuenta abierta es Bomberos Voluntarios Usme, la
 * misma de la Radar y de los avisos. Cuadra con `publicacionesMock.ts` (`oferta-usme`: 900 L
 * de agua, 50 kits, 2 plantas) y con `avisosMock.ts`. Origen: `src/organizacion.html` y
 * `src/comunidad.html` del prototipo. Hoy es 14 de septiembre.
 */
import type { Actividad, DatosOrg, EntregaRecibida, Invitado, MiembroEquipo, NecesidadPublicada, OfertaPublicada, Solicitud } from '../types/panel';

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
  { id: 3, quien: 'Comedor Villa Gloria', rec: 'Alimentos', cant: 30, u: 'kits', estado: 'confirmada', cuando: '13 sep, 11:20 a. m.', vol: 2, cerradaEl: '2026-09-13', cierre: { recibe: { fotos: 1 } } },
  { id: 8, quien: 'JAC Vereda El Destino', rec: 'Agua potable', cant: 120, u: 'L', estado: 'confirmada', cuando: '2 ago, 4:00 p. m.', vol: 1, cerradaEl: '2026-08-02', cierre: { entrega: { fotos: 1 }, recibe: { fotos: 2 } } },
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

export const EQUIPO: MiembroEquipo[] = [
  { id: 1, n: 'Mateo Rojas', rolPlataforma: 'coordinador', rol: 'Conducción', veh: 'Camioneta 4×4', tel: '+57 311 200 1001', correo: 'mateo.rojas@bomberosusme.org', disp: 'hoy', hechas: 4 },
  { id: 2, n: 'Laura Díaz', rolPlataforma: 'admin', rol: 'Logística y bodega', veh: 'Sin vehículo', tel: '+57 311 200 1002', correo: 'laura.diaz@bomberosusme.org', disp: 'manana', hechas: 2 },
  { id: 3, n: 'Andrés Peña', rolPlataforma: 'coordinador', rol: 'Rescate', veh: 'Moto', tel: '+57 311 200 1003', correo: 'andres.pena@bomberosusme.org', disp: 'hoy', hechas: 6 },
  { id: 4, n: 'Sofía Mora', rolPlataforma: 'auditor', rol: 'Salud', veh: 'Carro', tel: '+57 311 200 1004', correo: 'sofia.mora@bomberosusme.org', disp: 'finde', hechas: 1 },
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

export const ROL_PLATAFORMA: Record<MiembroEquipo['rolPlataforma'], string> = { admin: 'Administra', coordinador: 'Coordina entregas', auditor: 'Solo ve' };
export const DISPONIBILIDAD: Record<MiembroEquipo['disp'], string> = { hoy: 'Hoy', manana: 'Mañana', finde: 'Fin de semana' };

export const ESTADO_SOLICITUD: Record<Solicitud['estado'], { texto: string; tono: 'inicial' | 'proceso' | 'completo' }> = {
  nueva: { texto: 'Nueva', tono: 'inicial' },
  aceptada: { texto: 'Aceptada', tono: 'inicial' },
  camino: { texto: 'En camino', tono: 'proceso' },
  entregada: { texto: 'Entregada · por confirmar', tono: 'proceso' },
  confirmada: { texto: 'Confirmada', tono: 'completo' },
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
  confirmada: { texto: 'Confirmada', tono: 'completo' },
  archivada: { texto: 'Archivada', tono: 'completo' },
};

/** Las dos puertas del panel vacío: lo que abre cada una. */
export const PUERTAS = {
  pedir: {
    titulo: 'Pedir ayuda',
    texto: 'Publica lo que hace falta y sigue aquí quién se compromete, qué va en camino y qué te llegó.',
    abre: ['Mis necesidades', 'Entregas recibidas'],
  },
  ofrecer: {
    titulo: 'Ofrecer ayuda',
    texto: 'Publica lo que tienen disponible y sigue aquí quién te lo pide, a quién asignas cada entrega y cómo va cada una.',
    abre: ['Mis ofertas', 'Solicitudes', 'Seguimiento'],
  },
};
