import type { FotoPublicada } from '../types/publicacion';

/**
 * Las fotos de prueba de la maqueta (Alejandro, 16 de septiembre de 2026: «cómo hacemos para que
 * las personas puedan acceder a las fotos cargadas»). Son las cuatro fotos reales que ya tiene
 * el repo en `public/images/landing/`; en producción vienen del almacenamiento.
 *
 * Dos accesos distintos, con dos permisos distintos:
 *   - Las fotos de una PUBLICACIÓN son públicas en el mapa (`Publicacion.fotos`).
 *   - Las fotos de una ENTREGA son el soporte de la confirmación cruzada: las ven solo las dos
 *     organizaciones de esa entrega y RaDAR. Van por lado: quien entregó y quien recibió.
 */
const RUTA = '/images/landing/';

export const FOTOS_PUBLICACION: Record<string, FotoPublicada[]> = {
  'oferta-usme': [
    { url: `${RUTA}brigadistas-camion.jpg`, alt: 'Brigadistas cargando el camión cisterna en la estación', quien: 'Bomberos Voluntarios Usme', cuando: '14 sep, 8:10 a. m.' },
    { url: `${RUTA}voluntarios-accion.jpg`, alt: 'Voluntarios organizando los kits de alimentos', quien: 'Bomberos Voluntarios Usme', cuando: '14 sep, 8:12 a. m.' },
  ],
  'necesidad-bosa': [
    { url: `${RUTA}baldes-escombros.jpg`, alt: 'Baldes con barro y escombros a la entrada del albergue', quien: 'Albergue Bosa', cuando: '15 sep, 6:40 a. m.' },
    { url: `${RUTA}colapso-rescate.jpg`, alt: 'Vía colapsada por la creciente de la quebrada', quien: 'Albergue Bosa', cuando: '15 sep, 6:45 a. m.' },
    { url: `${RUTA}voluntarios-accion.jpg`, alt: 'Familias evacuadas en el salón comunal', quien: 'Albergue Bosa', cuando: '15 sep, 7:05 a. m.' },
  ],
  'necesidad-sanfrancisco': [{ url: `${RUTA}colapso-rescate.jpg`, alt: 'Deslizamiento sobre la vía de acceso al barrio', quien: 'JAC Barrio San Francisco', cuando: '15 sep, 9:20 a. m.' }],
};

export interface FotosEntrega {
  entrega: FotoPublicada[];
  recibe: FotoPublicada[];
}

/** Por id de solicitud (lo que YO entrego). Las cuentas coinciden con `cierre` en `panelMock`. */
export const FOTOS_ENTREGA: Record<number, FotosEntrega> = {
  1: {
    entrega: [
      { url: `${RUTA}brigadistas-camion.jpg`, alt: 'El carrotanque llegando al albergue', quien: 'Andrés Peña · Bomberos Voluntarios Usme', cuando: '12 sep, 9:35 a. m.' },
      { url: `${RUTA}voluntarios-accion.jpg`, alt: 'Descarga del agua en los tanques del albergue', quien: 'Andrés Peña · Bomberos Voluntarios Usme', cuando: '12 sep, 9:40 a. m.' },
    ],
    recibe: [{ url: `${RUTA}baldes-escombros.jpg`, alt: 'Tanques llenos en la cocina del albergue', quien: 'Esperanza Gómez · Albergue Bosa', cuando: '12 sep, 10:05 a. m.' }],
  },
  3: { entrega: [], recibe: [{ url: `${RUTA}voluntarios-accion.jpg`, alt: 'Los kits de alimentos en la despensa del comedor', quien: 'Luz Marina Silva · Comedor Villa Gloria', cuando: '13 sep, 11:20 a. m.' }] },
  8: {
    entrega: [{ url: `${RUTA}brigadistas-camion.jpg`, alt: 'Entrega del agua en la vereda', quien: 'Mateo Rojas · Bomberos Voluntarios Usme', cuando: '2 ago, 3:50 p. m.' }],
    recibe: [
      { url: `${RUTA}colapso-rescate.jpg`, alt: 'Los bidones en el salón comunal', quien: 'JAC Vereda El Destino', cuando: '2 ago, 4:00 p. m.' },
      { url: `${RUTA}baldes-escombros.jpg`, alt: 'Reparto a las familias de la vereda', quien: 'JAC Vereda El Destino', cuando: '2 ago, 4:20 p. m.' },
    ],
  },
};

/** Por id de entrega recibida (lo que ME entregan). Aquí «entrega» es la otra organización. */
export const FOTOS_RECIBIDA: Record<number, FotosEntrega> = {
  102: {
    entrega: [{ url: `${RUTA}voluntarios-accion.jpg`, alt: 'Cajas de respiradores en el vehículo de la alcaldía', quien: 'Alcaldía local de Usme', cuando: '11 sep, 9:50 a. m.' }],
    recibe: [{ url: `${RUTA}brigadistas-camion.jpg`, alt: 'Los respiradores ya en la estación', quien: 'Carlos Peña · Bomberos Voluntarios Usme', cuando: '11 sep, 10:00 a. m.' }],
  },
};

export function fotosDePublicacion(id: string): FotoPublicada[] {
  return FOTOS_PUBLICACION[id] ?? [];
}

export function fotosDeEntrega(id: number): FotosEntrega {
  return FOTOS_ENTREGA[id] ?? { entrega: [], recibe: [] };
}

export function fotosDeRecibida(id: number): FotosEntrega {
  return FOTOS_RECIBIDA[id] ?? { entrega: [], recibe: [] };
}

/** Cuántas fotos tiene una entrega, sumando los dos lados. */
export function cuentaFotos(f: FotosEntrega): number {
  return f.entrega.length + f.recibe.length;
}

/** Las fotos de una entrega en una sola lista, primero las de quien entregó (el mismo orden
 *  que los grupos del visor). */
export function listaFotos(f: FotosEntrega): FotoPublicada[] {
  return [...f.entrega, ...f.recibe];
}
