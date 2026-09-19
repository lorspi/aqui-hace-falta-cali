/**
 * Las publicaciones de ejemplo de RaDAR, en un solo sitio (mockup/*). Origen:
 * `Producto/assets/datos.js` y `taxonomia.js` del prototipo. De aquí salen los pines del
 * mapa con su anillo, el bloque de recursos de cada tarjeta y las sugerencias del cruce.
 * Ninguna de esas cosas vuelve a escribir una cifra por su cuenta.
 */
import type { CategoriaRecurso, IconoRecurso, Publicacion, Ubicacion } from '../types/publicacion';
import { FOTOS_PUBLICACION } from './fotosMock';

/** La taxonomía de recursos. La misma para pedir, ofrecer y filtrar. */
export const TAXONOMIA: CategoriaRecurso[] = [
  { nombre: 'Víveres y bienestar básico', items: ['Agua potable', 'Alimentos', 'Ropa y calzado', 'Implementos de aseo e higiene', 'Cobijas y colchonetas', 'Cuidado y alimento de animales'], icono: 'bowl' },
  { nombre: 'Salud y asistencia', items: ['Atención médica', 'Medicamentos / Botiquín', 'Donar sangre / Banco de sangre', 'Protección respiratoria'], icono: 'stetho' },
  { nombre: 'Rescate y maquinaria', items: ['Equipo búsqueda y rescate', 'Herramientas de mano', 'Remoción de escombros y barro', 'Maquinaria pesada y operarios', 'Plantas eléctricas / Generadores', 'Equipos de bombeo'], icono: 'shovel' },
  { nombre: 'Materiales y reconstrucción', items: ['Evaluación estructural y técnica', 'Materiales de obra básica', 'Ferretería e instalaciones básicas', 'Cubiertas y cerramientos', 'Herramientas de construcción', 'Mano de obra técnica y oficios'], icono: 'hammer' },
  { nombre: 'Transporte e instalaciones', items: ['Alojamiento temporal', 'Transporte terrestre', 'Transporte aéreo', 'Transporte fluvial', 'Saneamiento y baños portátiles', 'Almacenamiento y bodegaje', 'Aulas y espacios educativos temporales', 'Cocinas comunitarias'], icono: 'truck' },
  { nombre: 'Donación económica', items: ['Aporte económico / Donación en dinero'], icono: 'package' },
  { nombre: 'Capacidades y servicios técnicos', items: ['Ingeniería, arquitectura y peritaje', 'Geología, geotecnia y gestión del riesgo', 'Asesoría legal y jurídica', 'Auditoría, contabilidad y finanzas', 'Veterinaria y manejo zootécnico', 'Salud mental y apoyo psicosocial'], icono: 'seal' },
  { nombre: 'Voluntariado y apoyo comunitario', items: ['Voluntariado en acopio y empaque', 'Voluntariado en terreno', 'Voluntariado social y comunitario', 'Censo, registro y apoyo operativo'], icono: 'house' },
];

/** Iconos propios de algunos ítems; el resto toma el de su categoría. */
export const ICONO_ITEM: Record<string, IconoRecurso> = {
  'Agua potable': 'drop',
  Alimentos: 'bowl',
  'Ropa y calzado': 'shirt',
  'Atención médica': 'stetho',
  'Medicamentos / Botiquín': 'pill',
  'Remoción de escombros y barro': 'shovel',
  'Herramientas de mano': 'hammer',
  'Plantas eléctricas / Generadores': 'bolt',
  'Transporte terrestre': 'truck',
  'Alojamiento temporal': 'house',
};

/** Ubicación simulada de la persona que mira. En producción la da el dispositivo. */
export const UBICACION: Ubicacion = { lat: 4.53, lng: -74.12, zona: 'Usme', simulada: true };

/* Las fotos viven en `fotosMock.ts`; se cuelgan aquí para que cada publicación las lleve. */
const SIN_FOTOS: Publicacion[] = [
  {
    id: 'oferta-usme',
    tipo: 'oferta',
    titulo: 'Bomberos Voluntarios Usme',
    org: 'Bomberos Voluntarios Usme',
    verificada: true,
    propia: true,
    lat: 4.51,
    lng: -74.115,
    zona: 'Usme',
    dir: 'Estación Usme, Cl. 91 sur #3-20',
    descripcion: 'Recursos de la estación disponibles para la emergencia de la quebrada. Coordinamos por radio con el puesto de mando.',
    recursos: [
      {
        item: 'Agua potable',
        unidad: 'L',
        total: 900,
        tramos: [
          { t: 'hecho', cant: 180, quien: 'Albergue Bosa', cuando: '12 sep, 9:40 a. m.' },
          { t: 'camino', cant: 270, quien: 'Comedor Villa Gloria', cuando: 'Sale hoy 6:00 p. m.' },
        ],
        ficha: [
          ['Disponibilidad', 'Hasta agotar'],
          ['Cómo se entrega', 'Lo llevamos · 15 km'],
        ],
      },
      {
        item: 'Alimentos',
        unidad: 'kits',
        total: 50,
        tramos: [{ t: 'hecho', cant: 30, quien: 'Comedor Villa Gloria', cuando: '13 sep, 11:20 a. m.' }],
        ficha: [
          ['Disponibilidad', 'Hasta el 20 sep'],
          ['Cómo se entrega', 'Lo llevamos · 15 km'],
        ],
      },
      {
        item: 'Plantas eléctricas / Generadores',
        unidad: 'plantas',
        total: 2,
        tramos: [{ t: 'camino', cant: 1, quien: 'Hospital de Usme', cuando: 'Ayer 4:10 p. m.' }],
        ficha: [
          ['Disponibilidad', '48 horas'],
          ['Cómo se entrega', 'Lo llevamos · 15 km'],
        ],
      },
    ],
  },
  {
    id: 'necesidad-bosa',
    tipo: 'necesidad',
    titulo: 'Albergue Bosa',
    org: 'Fundación Colombia Unida',
    verificada: true,
    lat: 4.6197,
    lng: -74.202,
    zona: 'Bosa',
    dir: 'Cra. 80 #57-40 sur, Bosa',
    descripcion: 'Albergue temporal en el Colegio Ciudad de Bogotá. Recibimos 34 familias evacuadas por el desbordamiento de la quebrada.',
    recursos: [
      { item: 'Ropa y calzado', unidad: 'mudas', total: 200, tramos: [] },
      { item: 'Agua potable', unidad: 'L', total: 900, tramos: [{ t: 'hecho', cant: 180, quien: 'Bomberos Voluntarios Usme', cuando: '12 sep, 9:40 a. m.' }] },
      { item: 'Atención médica', unidad: 'profesionales', total: 2, tramos: [{ t: 'camino', cant: 1, quien: 'Cruz Roja seccional', cuando: 'Llega mañana 7:00 a. m.' }] },
      { item: 'Alimentos', unidad: 'kits', total: 50, tramos: [{ t: 'hecho', cant: 50, quien: 'Comedor Villa Gloria', cuando: '13 sep, 11:20 a. m.' }] },
      { item: 'Medicamentos / Botiquín', unidad: 'botiquines', total: 400, tramos: [{ t: 'hecho', cant: 400, quien: 'Cruz Roja seccional', cuando: '11 sep, 3:00 p. m.' }] },
    ],
  },
  {
    id: 'necesidad-sanfrancisco',
    tipo: 'necesidad',
    titulo: 'Barrio San Francisco',
    org: 'JAC Barrio San Francisco',
    verificada: false,
    lat: 4.568,
    lng: -74.166,
    zona: 'San Francisco',
    localidad: 'Ciudad Bolívar',
    recursos: [
      { item: 'Ropa y calzado', unidad: 'mudas', total: 120, tramos: [] },
      { item: 'Implementos de aseo e higiene', unidad: 'kits', total: 30, tramos: [] },
    ],
  },
  {
    id: 'necesidad-vitelma',
    tipo: 'necesidad',
    titulo: 'Centro de salud Vitelma',
    org: 'Centro de salud Vitelma',
    verificada: true,
    lat: 4.582,
    lng: -74.079,
    zona: 'Vitelma',
    localidad: 'San Cristóbal',
    recursos: [{ item: 'Medicamentos / Botiquín', unidad: 'botiquines', total: 20, tramos: [{ t: 'hecho', cant: 20, quien: 'Cruz Roja seccional', cuando: '11 sep, 3:00 p. m.' }] }],
  },
  /* Las demás publicaciones del mapa. Menos detalle, mismas reglas. */
  { id: 'm1', tipo: 'necesidad', titulo: 'Albergue Bosa', org: 'Albergue Bosa', verificada: false, lat: 4.608, lng: -74.19, zona: 'Bosa', recursos: [{ item: 'Cobijas y colchonetas', unidad: 'juegos', total: 50, tramos: [{ t: 'camino', cant: 20, quien: 'Parroquia San Bernardino', cuando: 'Llega hoy 5:00 p. m.' }] }] },
  { id: 'm2', tipo: 'oferta', titulo: 'Cruz Roja seccional', org: 'Cruz Roja · seccional Bogotá', verificada: true, lat: 4.612, lng: -74.185, zona: 'Teusaquillo', recursos: [{ item: 'Atención médica', unidad: 'profesionales', total: 5, tramos: [{ t: 'hecho', cant: 3, quien: 'Albergue Bosa', cuando: '12 sep' }] }, { item: 'Medicamentos / Botiquín', unidad: 'botiquines', total: 600, tramos: [{ t: 'hecho', cant: 420, quien: 'Varias', cuando: '11 sep' }] }] },
  { id: 'm3', tipo: 'necesidad', titulo: 'JAC El Recuerdo', org: 'JAC El Recuerdo', verificada: false, lat: 4.615, lng: -74.196, zona: 'Bosa', recursos: [{ item: 'Agua potable', unidad: 'L', total: 600, tramos: [] }] },
  { id: 'm4', tipo: 'necesidad', titulo: 'Comedor Villa Gloria', org: 'Comedor Villa Gloria', verificada: false, lat: 4.601, lng: -74.183, zona: 'Ciudad Bolívar', recursos: [{ item: 'Alimentos', unidad: 'kits', total: 100, tramos: [{ t: 'hecho', cant: 20, quien: 'Bomberos Voluntarios Usme', cuando: '13 sep' }, { t: 'camino', cant: 30, quien: 'Fundación Manos Unidas', cuando: 'Llega mañana' }] }] },
  { id: 'm5', tipo: 'oferta', titulo: 'Parroquia San Bernardino', org: 'Parroquia San Bernardino', verificada: false, lat: 4.604, lng: -74.199, zona: 'Bosa', recursos: [{ item: 'Cobijas y colchonetas', unidad: 'juegos', total: 60, tramos: [] }, { item: 'Ropa y calzado', unidad: 'mudas', total: 300, tramos: [] }] },
  { id: 'm6', tipo: 'necesidad', titulo: 'Hospital de Usme', org: 'Hospital de Usme', verificada: true, lat: 4.514, lng: -74.121, zona: 'Usme', recursos: [{ item: 'Plantas eléctricas / Generadores', unidad: 'plantas', total: 2, tramos: [{ t: 'camino', cant: 1, quien: 'Bomberos Voluntarios Usme', cuando: 'Ayer 4:10 p. m.' }] }] },
  { id: 'm7', tipo: 'oferta', titulo: 'Fundación Manos Unidas', org: 'Fundación Manos Unidas', verificada: true, lat: 4.506, lng: -74.108, zona: 'Kennedy', recursos: [{ item: 'Agua potable', unidad: 'L', total: 1500, tramos: [] }, { item: 'Implementos de aseo e higiene', unidad: 'kits', total: 80, tramos: [] }] },
  { id: 'm8', tipo: 'necesidad', titulo: 'Vereda El Destino', org: 'JAC Vereda El Destino', verificada: false, lat: 4.499, lng: -74.13, zona: 'Usme rural', localidad: 'Usme', recursos: [{ item: 'Transporte terrestre', unidad: 'viajes', total: 4, tramos: [] }] },
  { id: 'm9', tipo: 'oferta', titulo: 'Alcaldía local de Usme', org: 'Alcaldía local de Usme', verificada: true, lat: 4.517, lng: -74.112, zona: 'Usme', recursos: [{ item: 'Transporte terrestre', unidad: 'viajes', total: 6, tramos: [{ t: 'hecho', cant: 6, quien: 'Vereda El Destino', cuando: '10 sep' }] }] },
  { id: 'm10', tipo: 'necesidad', titulo: 'Colegio Rafael Uribe Uribe', org: 'Colegio Rafael Uribe Uribe', verificada: true, lat: 4.571, lng: -74.118, zona: 'Rafael Uribe Uribe', recursos: [{ item: 'Alimentos', unidad: 'kits', total: 80, tramos: [{ t: 'camino', cant: 48, quien: 'Fundación Manos Unidas', cuando: 'Llega hoy' }] }] },
  { id: 'm11', tipo: 'oferta', titulo: 'Bomberos Marichuela', org: 'Bomberos Marichuela', verificada: true, lat: 4.565, lng: -74.123, zona: 'Marichuela', localidad: 'Usme', recursos: [{ item: 'Agua potable', unidad: 'L', total: 800, tramos: [] }, { item: 'Atención médica', unidad: 'profesionales', total: 2, tramos: [] }] },
];

export const PUBLICACIONES: Publicacion[] = SIN_FOTOS.map((p) => (FOTOS_PUBLICACION[p.id] ? { ...p, fotos: FOTOS_PUBLICACION[p.id] } : p));
