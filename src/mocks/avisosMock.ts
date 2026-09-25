/**
 * Los avisos de la cuenta con sesión (mockup/*): `RD_AVISOS` de `Producto/assets/avisos.js`.
 * Los nueve son la misma historia vista desde Bomberos Voluntarios Usme, y cuadran con sus
 * publicaciones: la oferta de agua (900 L: 180 entregados al Albergue Bosa, 270 en camino al
 * Comedor Villa Gloria), la de alimentos (50 kits: 30 confirmados por el Comedor), la planta
 * eléctrica del Hospital de Usme y la necesidad propia de equipos de bombeo. Hoy es 14 de
 * septiembre. Las rutas van a las de la app real (`RUTAS`); lo que la maqueta no tiene
 * todavía lleva al mapa.
 */
import type { Aviso } from '../types/aviso';
import { RUTAS } from './cuentasMock';

export const AVISOS: Aviso[] = [
  {
    id: 1,
    tipo: 'recibir',
    cuando: 'hace 12 min',
    dia: 'hoy',
    leido: false,
    quien: 'Cruz Roja seccional',
    titulo: 'Cruz Roja seccional te entregó 2 motobombas',
    detalle: 'Van para tu necesidad de equipos de bombeo. Confirma que llegaron.',
    accion: { texto: 'Confirmar recibido', nivel: 'primario', al: 'confirmar' },
  },
  {
    id: 2,
    tipo: 'solicitud',
    cuando: 'hace 40 min',
    dia: 'hoy',
    leido: false,
    quien: 'Fundación Colombia Unida',
    titulo: 'Fundación Colombia Unida te pide 200 L de agua potable',
    detalle: 'A 9,1 km. Sale de tu oferta de agua potable.',
    accion: { texto: 'Ver la solicitud', nivel: 'terciario', al: RUTAS.miOrganizacion },
  },
  {
    id: 3,
    tipo: 'camino',
    cuando: 'hace 2 horas',
    dia: 'hoy',
    leido: false,
    quien: 'Comedor Villa Gloria',
    titulo: '270 L de agua potable van en camino al Comedor Villa Gloria',
    detalle: 'Los lleva Mateo Rojas y salen hoy 6:00 p. m.',
    accion: { texto: 'Ver en el mapa', nivel: 'terciario', al: '/radar-v2?punto=m4' },
  },
  {
    id: 4,
    tipo: 'compromiso',
    cuando: 'ayer 5:20 p. m.',
    dia: 'ayer',
    leido: true,
    quien: 'Cruz Roja seccional',
    titulo: 'Cruz Roja seccional se comprometió con 2 motobombas',
    detalle: 'Para tu necesidad de equipos de bombeo. Te avisamos cuando vayan en camino.',
    accion: { texto: 'Ver la necesidad', nivel: 'terciario', al: RUTAS.miOrganizacion },
  },
  {
    id: 5,
    tipo: 'confirmada',
    cuando: 'ayer 11:20 a. m.',
    dia: 'ayer',
    leido: true,
    quien: 'Comedor Villa Gloria',
    titulo: 'Comedor Villa Gloria confirmó 30 kits de alimentos',
    detalle: 'Van 30 de 50 kits entregados de tu oferta de alimentos.',
    accion: null,
  },
  {
    id: 6,
    tipo: 'vence',
    cuando: 'ayer 8:00 a. m.',
    dia: 'ayer',
    leido: true,
    quien: 'RaDAR',
    titulo: 'Tu oferta de alimentos deja de estar disponible el 20 de septiembre',
    detalle: 'Quedan 20 kits. Si siguen disponibles, amplía la fecha.',
    accion: { texto: 'Ampliar la fecha', nivel: 'secundario', al: RUTAS.miOrganizacion },
  },
  {
    id: 7,
    tipo: 'devuelta',
    cuando: '12 sep, 11:30 a. m.',
    dia: 'antes',
    leido: true,
    quien: 'Hospital de Usme',
    titulo: 'Hospital de Usme devolvió a En camino la planta eléctrica',
    detalle: 'Ya no cuenta como entregada. Vuelve a aparecer en camino en tu oferta.',
    accion: { texto: 'Ver la entrega', nivel: 'terciario', al: RUTAS.miOrganizacion },
  },
  {
    id: 8,
    tipo: 'revalidar',
    cuando: '11 sep',
    dia: 'antes',
    leido: true,
    quien: 'RaDAR',
    titulo: 'Tu necesidad de equipos de bombeo lleva 5 días sin avance',
    detalle: '¿Sigue haciendo falta? Si no confirmas, baja en el orden del mapa.',
    accion: { texto: 'Confirmar que sigue haciendo falta', nivel: 'primario', al: 'revalidar' },
  },
  {
    id: 9,
    tipo: 'cuenta',
    cuando: '10 sep',
    dia: 'antes',
    leido: true,
    quien: 'RaDAR',
    titulo: 'Tu organización quedó verificada',
    detalle: 'La insignia de verificación sale en cada publicación.',
    accion: null,
  },
];

export const DIAS: { id: Aviso['dia']; nombre: string }[] = [
  { id: 'hoy', nombre: 'Hoy' },
  { id: 'ayer', nombre: 'Ayer' },
  { id: 'antes', nombre: 'Antes' },
];
