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
export const FOTOS_ENTREGA: Record<string | number, FotosEntrega> = {
  1: {
    entrega: [
      { url: `${RUTA}brigadistas-camion.jpg`, alt: 'El carrotanque llegando al albergue', quien: 'Andrés Peña, Bomberos Voluntarios Usme', cuando: '12 sep, 9:35 a. m.' },
      { url: `${RUTA}voluntarios-accion.jpg`, alt: 'Descarga del agua en los tanques del albergue', quien: 'Andrés Peña, Bomberos Voluntarios Usme', cuando: '12 sep, 9:40 a. m.' },
    ],
    recibe: [{ url: `${RUTA}baldes-escombros.jpg`, alt: 'Tanques llenos en la cocina del albergue', quien: 'Esperanza Gómez, Albergue Bosa', cuando: '12 sep, 10:05 a. m.' }],
  },
  2: {
    entrega: [
      { url: `${RUTA}brigadistas-camion.jpg`, alt: 'Carrotanque cargado en ruta al comedor', quien: 'Andrés Peña, Bomberos Voluntarios Usme', cuando: 'Hoy, 5:45 p. m.' },
    ],
    recibe: [],
  },
  3: { entrega: [], recibe: [{ url: `${RUTA}voluntarios-accion.jpg`, alt: 'Los kits de alimentos en la despensa del comedor', quien: 'Luz Marina Silva, Comedor Villa Gloria', cuando: '13 sep, 11:20 a. m.' }] },
  8: {
    entrega: [{ url: `${RUTA}brigadistas-camion.jpg`, alt: 'Entrega del agua en la vereda', quien: 'Mateo Rojas, Bomberos Voluntarios Usme', cuando: '2 ago, 3:50 p. m.' }],
    recibe: [
      { url: `${RUTA}colapso-rescate.jpg`, alt: 'Los bidones en el salón comunal', quien: 'JAC Vereda El Destino', cuando: '2 ago, 4:00 p. m.' },
      { url: `${RUTA}baldes-escombros.jpg`, alt: 'Reparto a las familias de la vereda', quien: 'JAC Vereda El Destino', cuando: '2 ago, 4:20 p. m.' },
    ],
  },
};

/** Por id de entrega recibida (lo que ME entregan). Aquí «entrega» es la otra organización. */
export const FOTOS_RECIBIDA: Record<string | number, FotosEntrega> = {
  102: {
    entrega: [{ url: `${RUTA}voluntarios-accion.jpg`, alt: 'Cajas de respiradores en el vehículo de la alcaldía', quien: 'Alcaldía local de Usme', cuando: '11 sep, 9:50 a. m.' }],
    recibe: [{ url: `${RUTA}brigadistas-camion.jpg`, alt: 'Los respiradores ya en la estación', quien: 'Carlos Peña, Bomberos Voluntarios Usme', cuando: '11 sep, 10:00 a. m.' }],
  },
};

const STORAGE_KEY_ENTREGA = 'rd-fotos-entrega';
const STORAGE_KEY_RECIBIDA = 'rd-fotos-recibida';

/**
 * Carga fotos persistidas en localStorage y las integra a los almacenes en memoria
 */
function cargarFotosPersistidas() {
  if (typeof localStorage === 'undefined') return;
  try {
    const rawE = localStorage.getItem(STORAGE_KEY_ENTREGA);
    if (rawE) {
      const parsed = JSON.parse(rawE);
      Object.assign(FOTOS_ENTREGA, parsed);
    }
  } catch {}
  try {
    const rawR = localStorage.getItem(STORAGE_KEY_RECIBIDA);
    if (rawR) {
      const parsed = JSON.parse(rawR);
      Object.assign(FOTOS_RECIBIDA, parsed);
    }
  } catch {}
}

// Carga automática inicial
cargarFotosPersistidas();

export function persistirFotosEntrega(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ENTREGA, JSON.stringify(FOTOS_ENTREGA));
  } catch (err) {
    console.warn('Error guardando fotos de entrega en localStorage:', err);
  }
}

export function persistirFotosRecibida(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_RECIBIDA, JSON.stringify(FOTOS_RECIBIDA));
  } catch (err) {
    console.warn('Error guardando fotos de recibida en localStorage:', err);
  }
}

/**
 * Registra fotos de entrega asociándolas al id numérico y opcionalmente a su dbId UUID
 */
export function agregarFotosEntrega(
  id: number | string,
  fotos: FotoPublicada[],
  lado: 'entrega' | 'recibe' = 'entrega',
  dbId?: string
): void {
  if (!fotos || fotos.length === 0) return;
  const ids = [String(id)];
  if (dbId && String(dbId) !== String(id)) ids.push(String(dbId));

  for (const clave of ids) {
    if (!FOTOS_ENTREGA[clave]) {
      FOTOS_ENTREGA[clave] = { entrega: [], recibe: [] };
    }
    const actuales = FOTOS_ENTREGA[clave][lado] || [];
    const urlsExistentes = new Set(actuales.map((f) => f.url));
    const nuevas = fotos.filter((f) => f.url && !urlsExistentes.has(f.url));
    if (nuevas.length > 0) {
      FOTOS_ENTREGA[clave][lado] = [...nuevas, ...actuales];
    }
  }

  persistirFotosEntrega();
}

/**
 * Registra fotos de recibida asociándolas al id numérico y opcionalmente a su dbId UUID
 */
export function agregarFotosRecibida(
  id: number | string,
  fotos: FotoPublicada[],
  lado: 'entrega' | 'recibe' = 'recibe',
  dbId?: string
): void {
  if (!fotos || fotos.length === 0) return;
  const ids = [String(id)];
  if (dbId && String(dbId) !== String(id)) ids.push(String(dbId));

  for (const clave of ids) {
    if (!FOTOS_RECIBIDA[clave]) {
      FOTOS_RECIBIDA[clave] = { entrega: [], recibe: [] };
    }
    const actuales = FOTOS_RECIBIDA[clave][lado] || [];
    const urlsExistentes = new Set(actuales.map((f) => f.url));
    const nuevas = fotos.filter((f) => f.url && !urlsExistentes.has(f.url));
    if (nuevas.length > 0) {
      FOTOS_RECIBIDA[clave][lado] = [...nuevas, ...actuales];
    }
  }

  persistirFotosRecibida();
}

/**
 * Hidrata el almacén de fotos con los registros persistidos en Supabase `commitments`
 */
export function hidratarFotosDesdeCommitments(commitments: any[]): void {
  if (!Array.isArray(commitments) || commitments.length === 0) return;

  for (const c of commitments) {
    if (!c) continue;
    const numericId =
      typeof c.id === 'number'
        ? c.id
        : Math.abs(String(c.id).split('').reduce((acc: number, char: string) => (acc << 5) - acc + char.charCodeAt(0), 0));
    const uuid = String(c.id);

    const quienEntrego = c.provider_org_name || c.provider_name || 'Organización donante';
    const quienRecibio = c.requester_name || c.target_community || 'Comunidad atendida';
    const cuandoTxt = c.updated_at
      ? new Date(c.updated_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
      : 'Certificada';

    // 1. Fotos de entrega
    if (Array.isArray(c.delivery_photos) && c.delivery_photos.length > 0) {
      const valid = c.delivery_photos.filter((u: any) => typeof u === 'string' && u && !u.startsWith('blob:'));
      if (valid.length > 0) {
        const fotosPublicadas: FotoPublicada[] = valid.map((url: string, i: number) => ({
          url,
          alt: `Soporte de entrega - Registro ${i + 1}`,
          quien: quienEntrego,
          cuando: cuandoTxt,
        }));
        agregarFotosEntrega(numericId, fotosPublicadas, 'entrega', uuid);
        agregarFotosRecibida(numericId, fotosPublicadas, 'entrega', uuid);
      }
    }

    // 2. Fotos de recepción
    if (Array.isArray(c.reception_photos) && c.reception_photos.length > 0) {
      const valid = c.reception_photos.filter((u: any) => typeof u === 'string' && u && !u.startsWith('blob:'));
      if (valid.length > 0) {
        const fotosPublicadas: FotoPublicada[] = valid.map((url: string, i: number) => ({
          url,
          alt: `Constancia de recibido - Registro ${i + 1}`,
          quien: quienRecibio,
          cuando: cuandoTxt,
        }));
        agregarFotosRecibida(numericId, fotosPublicadas, 'recibe', uuid);
        agregarFotosEntrega(numericId, fotosPublicadas, 'recibe', uuid);
      }
    }
  }
}

export function fotosDePublicacion(id: string): FotoPublicada[] {
  return FOTOS_PUBLICACION[id] ?? [];
}

export function fotosDeEntrega(id: number | string, dbId?: string): FotosEntrega {
  const fId = FOTOS_ENTREGA[String(id)] || FOTOS_ENTREGA[id as any];
  if (fId && (fId.entrega.length > 0 || fId.recibe.length > 0)) {
    return fId;
  }
  if (dbId) {
    const fDb = FOTOS_ENTREGA[String(dbId)] || FOTOS_ENTREGA[dbId as any];
    if (fDb && (fDb.entrega.length > 0 || fDb.recibe.length > 0)) {
      return fDb;
    }
  }
  return fId ?? { entrega: [], recibe: [] };
}

export function fotosDeRecibida(id: number | string, dbId?: string): FotosEntrega {
  const fId = FOTOS_RECIBIDA[String(id)] || FOTOS_RECIBIDA[id as any];
  if (fId && (fId.entrega.length > 0 || fId.recibe.length > 0)) {
    return fId;
  }
  if (dbId) {
    const fDb = FOTOS_RECIBIDA[String(dbId)] || FOTOS_RECIBIDA[dbId as any];
    if (fDb && (fDb.entrega.length > 0 || fDb.recibe.length > 0)) {
      return fDb;
    }
  }
  return fId ?? { entrega: [], recibe: [] };
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
