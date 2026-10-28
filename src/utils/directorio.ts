/**
 * La lógica del Directorio (pura, sin React): qué publica cada entidad, su estado, y la
 * consulta (filtros, orden, chips). Lo que una entidad ofrece o pide sale de sus
 * publicaciones, nunca de un dato aparte: el directorio y la Radar cuentan lo mismo.
 */
import type { ClaseEntidad, ConsultaDirectorio, Entidad, EstadoComunidad } from '../types/directorio';
import type { Publicacion, Ubicacion } from '../types/publicacion';
import type { Language } from '../i18n/translations';
import { translations } from '../i18n/translations';
import { enCiudades, nombreCiudades, nombreCorto } from './lugares';
import { cifra as miles, distanciaKm, estadoPublicacion } from './publicaciones';
import { ORGANIZATION_TYPE_CONFIG } from '../constants/domainConstants';

export function consultaVacia(): ConsultaDirectorio {
  return { texto: '', ciudades: [], recursos: [], verificadas: false, orden: 'cercania' };
}

/** Las publicaciones de una entidad, por su nombre. */
export function publicacionesDe(e: Entidad, pubs: Publicacion[]): Publicacion[] {
  return pubs.filter((p) => p.org === e.nombre);
}

export function ofertasDe(e: Entidad, pubs: Publicacion[]): Publicacion[] {
  return publicacionesDe(e, pubs).filter((p) => p.tipo === 'oferta');
}

export function necesidadesDe(e: Entidad, pubs: Publicacion[]): Publicacion[] {
  return publicacionesDe(e, pubs).filter((p) => p.tipo === 'necesidad');
}

/** Los nombres de recurso que una entidad ofrece o pide (para filtrar y buscar). */
export function recursosDe(e: Entidad, pubs: Publicacion[]): string[] {
  return sinDuplicados(publicacionesDe(e, pubs).flatMap((p) => p.recursos.map((r) => r.item)));
}

/** El resumen en números de lo que publica: cuántos recursos ofrece y cuántos pide. El
 *  Directorio es de consulta (Alejandro, 16 de septiembre de 2026): no muestra el detalle ni
 *  deja actuar; para eso está la Radar, filtrada por la organización. */
export function resumenPublica(e: Entidad, pubs: Publicacion[]): { ofrece: number; pide: number } {
  return {
    ofrece: ofertasDe(e, pubs).reduce((t, p) => t + p.recursos.length, 0),
    pide: necesidadesDe(e, pubs).reduce((t, p) => t + p.recursos.length, 0),
  };
}

/** Cuántas solicitudes tiene abiertas una comunidad: un recurso pedido es una solicitud. */
export function solicitudesDe(e: Entidad, pubs: Publicacion[]): number {
  return necesidadesDe(e, pubs).reduce((t, p) => t + p.recursos.length, 0);
}

/** La cifra que compara en la lista: entregas confirmadas (organización) o solicitudes (comunidad). */
export function cifraDe(e: Entidad, pubs: Publicacion[], lang: Language = 'es'): { n: number; que: string } {
  if (e.clase === 'comunidad') {
    const n = solicitudesDe(e, pubs);
    const queMap: Record<Language, [string, string]> = {
      es: ['solicitud', 'solicitudes'],
      en: ['request', 'requests'],
      pt: ['solicitação', 'solicitações'],
      fr: ['demande', 'demandes'],
    };
    const forms = queMap[lang] || queMap.es;
    return { n, que: n === 1 ? forms[0] : forms[1] };
  }
  const queMap: Record<Language, [string, string]> = {
    es: ['entrega confirmada', 'entregas confirmadas'],
    en: ['confirmed delivery', 'confirmed deliveries'],
    pt: ['entrega confirmada', 'entregas confirmadas'],
    fr: ['livraison confirmée', 'livraisons confirmées'],
  };
  const forms = queMap[lang] || queMap.es;
  return { n: e.entregas, que: e.entregas === 1 ? forms[0] : forms[1] };
}

/** Las cifras de una entidad, en el orden en que se leen: lo que publica, su cifra de
 *  comparación y a cuánta gente cubre. Se derivan aquí una sola vez para que la tarjeta, la
 *  fila de tabla y el detalle digan exactamente lo mismo. */
export function cifrasDe(e: Entidad, pubs: Publicacion[], lang: Language = 'es'): [string, string][] {
  const publica = resumenPublica(e, pubs);
  const cifraE = cifraDe(e, pubs, lang);
  const recMap: Record<Language, [string, string]> = {
    es: ['recurso', 'recursos'],
    en: ['resource', 'resources'],
    pt: ['recurso', 'recursos'],
    fr: ['ressource', 'ressources'],
  };
  const rForms = recMap[lang] || recMap.es;
  const recursos = (n: number) => `${n} ${n === 1 ? rForms[0] : rForms[1]}`;

  const labelOfrece: Record<Language, string> = { es: 'Ofrece', en: 'Offers', pt: 'Oferece', fr: 'Offre' };
  const labelPide: Record<Language, string> = { es: 'Pide', en: 'Requests', pt: 'Pede', fr: 'Demande' };
  const labelPersonas: Record<Language, string> = { es: 'Personas afectadas', en: 'Affected people', pt: 'Pessoas afetadas', fr: 'Personnes touchées' };
  const labelFamilias: Record<Language, string> = { es: 'Familias', en: 'Families', pt: 'Famílias', fr: 'Familles' };

  const filas: [string, string][] = [];
  if (publica.ofrece) filas.push([labelOfrece[lang] || labelOfrece.es, recursos(publica.ofrece)]);
  if (publica.pide) filas.push([labelPide[lang] || labelPide.es, recursos(publica.pide)]);
  if (e.clase !== 'comunidad') filas.push([cifraE.que[0].toUpperCase() + cifraE.que.slice(1), miles(cifraE.n)]);
  if (e.personas) filas.push([labelPersonas[lang] || labelPersonas.es, miles(e.personas)]);
  if (e.familias) filas.push([labelFamilias[lang] || labelFamilias.es, miles(e.familias)]);
  return filas;
}

/** El estado de una comunidad sale del avance de lo que pidió: nada movido es «Sin iniciar»,
 *  algo entregado o en camino es «En proceso», todo cubierto es «Completado». */
export function estadoComunidad(e: Entidad, pubs: Publicacion[]): EstadoComunidad {
  const nec = necesidadesDe(e, pubs);
  if (nec.length === 0) return 'inicial';
  if (nec.every((p) => estadoPublicacion(p) === 'cubierta')) return 'completo';
  if (nec.some((p) => estadoPublicacion(p) !== 'inicial')) return 'proceso';
  return 'inicial';
}

export const TEXTO_ESTADO: Record<EstadoComunidad, string> = { inicial: 'Sin iniciar', proceso: 'En proceso', completo: 'Completado' };

/** Las entidades de una vista: la propia no sale (uno no se solicita a sí mismo). */
export function entidadesDe(clase: ClaseEntidad, entidades: Entidad[], propia: string): Entidad[] {
  return entidades.filter((e) => e.clase === clase && e.nombre !== propia);
}

export function recursosDeVista(entidades: Entidad[], pubs: Publicacion[]): string[] {
  return sinDuplicados(entidades.flatMap((e) => recursosDe(e, pubs))).sort((a, b) => a.localeCompare(b, 'es'));
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Cada sección de la hoja acota; entre valores de una misma sección, cualquiera vale. */
export function pasa(e: Entidad, pubs: Publicacion[], q: ConsultaDirectorio): boolean {
  if (!enCiudades(e, q.ciudades)) return false;
  const recs = recursosDe(e, pubs);
  if (q.recursos.length) {
    const recsNorm = recs.map(normalizar);
    if (!q.recursos.some((r) => recsNorm.includes(normalizar(r)))) return false;
  }
  if (q.verificadas && !e.verificada) return false;
  const texto = normalizar(q.texto);
  if (texto) {
    const pajar = normalizar([e.nombre, e.tipo, e.zona, e.lider ?? '', ...recs].join(' '));
    if (!pajar.includes(texto)) return false;
  }
  return true;
}

export function filtrar(entidades: Entidad[], pubs: Publicacion[], q: ConsultaDirectorio, ubicacion?: Ubicacion | null): Entidad[] {
  const km = (e: Entidad) => (ubicacion ? distanciaKm(ubicacion, e) : 0);
  return entidades
    .filter((e) => pasa(e, pubs, q))
    .sort((a, b) => {
      if (q.orden === 'cifra') {
        const d = cifraDe(b, pubs).n - cifraDe(a, pubs).n;
        if (d !== 0) return d;
      }
      if (ubicacion) {
        return km(a) - km(b);
      }
      return a.nombre.localeCompare(b.nombre, 'es');
    });
}

export function cuantosAplicados(q: ConsultaDirectorio): number {
  return q.ciudades.length + q.recursos.length + (q.verificadas ? 1 : 0) + (q.texto.trim() ? 1 : 0);
}

export interface ChipDirectorio {
  clave: string;
  texto: string;
  quitar: (q: ConsultaDirectorio) => ConsultaDirectorio;
}

/** Los filtros aplicados, en el orden en que se ven como chips (el orden no es chip). */
export function chipsDe(q: ConsultaDirectorio): ChipDirectorio[] {
  const chips: ChipDirectorio[] = [];
  q.ciudades.forEach((z) => chips.push({ clave: `ciudad:${z}`, texto: nombreCorto(z), quitar: (c) => ({ ...c, ciudades: c.ciudades.filter((x) => x !== z) }) }));
  q.recursos.forEach((r) => chips.push({ clave: `recurso:${r}`, texto: r, quitar: (c) => ({ ...c, recursos: c.recursos.filter((x) => x !== r) }) }));
  if (q.verificadas) chips.push({ clave: 'verificadas', texto: 'Solo verificadas', quitar: (c) => ({ ...c, verificadas: false }) });
  if (q.texto.trim()) chips.push({ clave: 'texto', texto: `“${q.texto.trim()}”`, quitar: (c) => ({ ...c, texto: '' }) });
  return chips;
}

export interface VacioDirectorio {
  titulo: string;
  texto: string;
  accion: string;
  aflojar: (q: ConsultaDirectorio) => ConsultaDirectorio;
}

/** Qué decir cuando no queda nada: nombra el filtro que más acota y ofrece soltar ese (igual
 *  que en la Radar, `utils/filtros.ts`). */
export function vacioDe(q: ConsultaDirectorio, clase: ClaseEntidad): VacioDirectorio {
  const quienes = clase === 'comunidad' ? 'comunidades' : 'organizaciones';
  const texto = q.texto.trim();
  if (texto) return { titulo: `Nada para «${texto}»`, texto: 'Prueba con otra palabra, o quita la búsqueda y filtra por recurso.', accion: 'Quitar la búsqueda', aflojar: (c) => ({ ...c, texto: '' }) };
  if (q.ciudades.length) return { titulo: `Ninguna en ${nombreCiudades(q.ciudades)}`, texto: `Todavía no hay ${quienes} aquí con estos filtros.`, accion: 'Ver todas las ciudades', aflojar: (c) => ({ ...c, ciudades: [] }) };
  return { titulo: `Ninguna ${clase === 'comunidad' ? 'comunidad' : 'organización'} con estos filtros`, texto: 'Prueba con menos filtros o busca otro recurso.', accion: 'Quitar los filtros', aflojar: (c) => ({ ...consultaVacia(), orden: c.orden }) };
}

/** Qué dice el conteo de la lista, para la región viva y la cabecera. */
export function conteoTexto(n: number, clase: ClaseEntidad, lang: Language = 'es'): string {
  const nadaMap: Record<Language, string> = {
    es: 'Nada con estos filtros',
    en: 'Nothing with these filters',
    pt: 'Nada com estes filtros',
    fr: 'Rien avec ces filtres',
  };
  if (n === 0) return nadaMap[lang] || nadaMap.es;
  if (clase === 'comunidad') {
    const comMap: Record<Language, [string, string]> = {
      es: ['comunidad', 'comunidades'],
      en: ['community', 'communities'],
      pt: ['comunidade', 'comunidades'],
      fr: ['communauté', 'communautés'],
    };
    const forms = comMap[lang] || comMap.es;
    return `${n} ${n === 1 ? forms[0] : forms[1]}`;
  }
  const orgMap: Record<Language, [string, string]> = {
    es: ['organización', 'organizaciones'],
    en: ['organization', 'organizations'],
    pt: ['organização', 'organizações'],
    fr: ['organisation', 'organisations'],
  };
  const forms = orgMap[lang] || orgMap.es;
  return `${n} ${n === 1 ? forms[0] : forms[1]}`;
}

function sinDuplicados<T>(lista: T[]): T[] {
  return lista.filter((x, i) => lista.indexOf(x) === i);
}

const DICCIONARIO_TIPOS_CONOCIDOS: Record<Language, Record<string, string>> = {
  es: {
    bomberos_defensa_civil: 'Bomberos / Defensa Civil / Socorristas',
    organismo_rescate: 'Organismo de Rescate / Búsqueda',
    ong_personas: 'ONG / Fundación de Ayuda Humanitaria',
    ong_animal: 'ONG / Refugio / Protección Animal',
    municipalidad_gobierno: 'Alcaldía / Gobernación / Entidad Pública',
    junta_vecinal: 'Junta de Acción Comunal (JAC) / JAL',
    apoyo_psicosocial: 'Salud Mental / Apoyo Psicosocial',
    empresa_privada: 'Empresa Privada / Gremio Responsable',
    profesional_individual: 'Profesional Independiente',
  },
  en: {
    bomberos_defensa_civil: 'Firefighters / Civil Defense / First Responders',
    organismo_rescate: 'Search and Rescue Agency',
    ong_personas: 'NGO / Humanitarian Aid Foundation',
    ong_animal: 'NGO / Animal Shelter & Protection',
    municipalidad_gobierno: "Mayor's Office / Government / Public Agency",
    junta_vecinal: 'Community Action Board (CAB)',
    apoyo_psicosocial: 'Mental Health / Psychosocial Support',
    empresa_privada: 'Private Company / Responsible Association',
    profesional_individual: 'Independent Professional',
  },
  pt: {
    bomberos_defensa_civil: 'Bombeiros / Defesa Civil / Socorristas',
    organismo_rescate: 'Organismo de Resgate / Busca',
    ong_personas: 'ONG / Fundação de Ajuda Humanitária',
    ong_animal: 'ONG / Abrigo / Proteção Animal',
    municipalidad_gobierno: 'Prefeitura / Governo / Entidade Pública',
    junta_vecinal: 'Associação de Moradores / Bairro',
    apoyo_psicosocial: 'Saúde Mental / Apoio Psicossocial',
    empresa_privada: 'Empresa Privada / Associação Responsável',
    profesional_individual: 'Profissional Independente',
  },
  fr: {
    bomberos_defensa_civil: 'Pompiers / Protection Civile / Secouristes',
    organismo_rescate: 'Organisme de Recherche et Sauvetage',
    ong_personas: 'ONG / Fondation d\'Aide Humanitaire',
    ong_animal: 'ONG / Refuge / Protection Animale',
    municipalidad_gobierno: 'Mairie / Gouvernement / Entité Publique',
    junta_vecinal: 'Comité de Quartier / Conseil Citoyen',
    apoyo_psicosocial: 'Santé Mentale / Soutien Psychosocial',
    empresa_privada: 'Entreprise Privée / Organisation Responsable',
    profesional_individual: 'Professionnel Indépendant',
  },
};

/**
 * Traduce códigos técnicos o enums de base de datos a nombres legibles para el usuario según el idioma.
 */
export function formatearTipoEntidad(tipo?: string, esComunidad?: boolean, lang: Language = 'es'): string {
  if (!tipo) {
    if (esComunidad) {
      const defCom: Record<Language, string> = {
        es: 'Comunidad / Liderazgo',
        en: 'Community / Leadership',
        pt: 'Comunidade / Liderança',
        fr: 'Communauté / Leadership',
      };
      return defCom[lang] || defCom.es;
    }
    const defOrg: Record<Language, string> = {
      es: 'Organización',
      en: 'Organization',
      pt: 'Organização',
      fr: 'Organisation',
    };
    return defOrg[lang] || defOrg.es;
  }

  const dic = DICCIONARIO_TIPOS_CONOCIDOS[lang] || DICCIONARIO_TIPOS_CONOCIDOS.es;
  if (dic[tipo]) {
    return dic[tipo];
  }

  // Si ya venía traducido al español (por ejemplo desde el servicio), buscar su código técnico para traducir a otros idiomas
  if (lang !== 'es') {
    const entradaEs = Object.entries(DICCIONARIO_TIPOS_CONOCIDOS.es).find(([, val]) => val === tipo);
    if (entradaEs && dic[entradaEs[0]]) {
      return dic[entradaEs[0]];
    }
    if (tipo === 'Comunidad / Liderazgo') {
      return formatearTipoEntidad(undefined, true, lang);
    }
    if (tipo === 'Organización') {
      return formatearTipoEntidad(undefined, false, lang);
    }
  }

  const match = Object.values(ORGANIZATION_TYPE_CONFIG).find((c) => c.id === tipo);
  if (match) {
    if (match.labelKey && translations[lang] && (translations[lang] as Record<string, string>)[match.labelKey]) {
      return (translations[lang] as Record<string, string>)[match.labelKey];
    }
    return match.defaultLabel;
  }

  // Si tiene guiones bajos técnicos pero no estaba en el mapa, formatearlo limpiamente
  if (tipo.includes('_')) {
    return tipo
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return tipo;
}

