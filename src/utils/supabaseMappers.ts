import type { Need, Offer, HelpCategory } from '../types';
import type { Publicacion, Recurso } from '../types/publicacion';
import type { SolicitudEnviada, OfrecimientoEnviado, EstadoSolicitudEnviada, EstadoOfrecimientoEnviado } from '../types/panel';
import { CATEGORY_LABELS } from './formatters';
import { detectCityFromCoords, findCityById } from '../data/colombiaCities';

/**
 * Convierte un Need (de Supabase) al tipo unificado Publicacion (v2 RaDAR)
 */
export function needToPublicacion(need: Need): Publicacion {
  const recursos: Recurso[] = (need.resources || []).map((r) => {
    const total = r.requestedQuantity ?? 1;
    const hecho = r.fulfilledQuantity ?? 0;
    const catLabel = r.type && CATEGORY_LABELS[r.type as HelpCategory]?.label;
    return {
      item: r.description || catLabel || r.type || 'Ayuda',
      unidad: r.unit || 'unidades',
      total,
      tramos: hecho > 0 ? [{ t: 'hecho', cant: hecho, quien: 'Confirmado', cuando: 'Recientemente' }] : [],
    };
  });

  if (recursos.length === 0 && Array.isArray(need.categories) && need.categories.length > 0) {
    need.categories.forEach((cat) => {
      const label = CATEGORY_LABELS[cat as HelpCategory]?.label || cat;
      recursos.push({
        item: label,
        unidad: 'unidades',
        total: 1,
        tramos: [],
      });
    });
  }

  const tieneOrg = Boolean(
    need.organizationName &&
    need.organizationName.trim() &&
    need.organizationName.toLowerCase() !== 'ciudadano' &&
    need.organizationName.toLowerCase() !== 'citizen' &&
    need.organizationName.toLowerCase() !== 'organización / comunidad' &&
    need.organizationName.toLowerCase() !== 'organizacion / comunidad'
  );
  const esComunidad = need.requesterType === 'COMUNIDAD';
  const esIndividual = !tieneOrg && (need.requesterType === 'PERSONA' || !need.organizationName);

  const detectedCity = (typeof need.latitude === 'number' && typeof need.longitude === 'number')
    ? detectCityFromCoords(need.latitude, need.longitude)
    : null;
  const rawNeedCityId = need.cityId && need.cityId !== 'todo-colombia' && need.cityId !== 'all_colombia'
    ? (need.cityId === 'bogota-d-c' ? 'bogota' : need.cityId)
    : undefined;
  const ciudadId = rawNeedCityId || detectedCity?.id;
  const nombreCiudadDetectada = detectedCity?.name || (ciudadId ? (findCityById(ciudadId)?.name || (ciudadId.charAt(0).toUpperCase() + ciudadId.slice(1))) : '');
  const zonaFinal = need.neighborhood || nombreCiudadDetectada || '';

  const pub: Publicacion = {
    id: need.id,
    tipo: 'necesidad',
    titulo: need.title || 'Solicitud de ayuda',
    org: tieneOrg ? need.organizationName! : '',
    perfil: esIndividual ? 'individual' : (esComunidad ? 'liderazgo' : (tieneOrg ? 'organizacion' : 'individual')),
    verificada: need.verificationStatus === 'VERIFIED',
    lat: need.latitude,
    lng: need.longitude,
    ciudad: ciudadId,
    zona: zonaFinal,
    dir: need.address,
    descripcion: need.description,
    recursos: recursos.length > 0 ? recursos : [{ item: 'Ayuda general', unidad: 'solicitud', total: 1, tramos: [] }],
    fotos: need.evidenceUrl
      ? need.evidenceUrl.split(',').filter(Boolean).map((url: string, i: number) => ({
          url: url.trim(),
          alt: need.title || `Evidencia ${i + 1}`,
          quien: need.organizationName || '',
          cuando: 'Evidencia',
        }))
      : [],
    sourceUrl: need.sourceUrl,
    userId: need.userId,
    contactoNombre: need.contactName,
    contactoTel: need.contactPhone,
    contactoWa: Boolean(need.contactWhatsapp),
    contactoEmail: need.contactEmail,
    horario: need.operatingHours,
    comoLlegar: need.comoLlegar,
    paraQuien: need.paraQuien,
  };

  return pub;
}

/**
 * Convierte un Offer (de Supabase) al tipo unificado Publicacion (v2 RaDAR)
 */
export function offerToPublicacion(offer: Offer): Publicacion {
  const recursos: Recurso[] = (offer.resources || []).map((r) => {
    const total = r.quantity ?? 1;
    const hecho = r.fulfilledQuantity ?? 0;
    const catLabel = r.type && CATEGORY_LABELS[r.type as HelpCategory]?.label;
    return {
      item: r.description || catLabel || r.type || 'Aporte',
      unidad: r.unit || 'unidades',
      total,
      tramos: hecho > 0 ? [{ t: 'hecho', cant: hecho, quien: 'Entregado', cuando: 'Recientemente' }] : [],
      ficha: [
        ['Disponibilidad', offer.offerStatus === 'AVAILABLE' ? 'Disponible hoy' : 'Hasta agotar'],
        ['Cómo se entrega', offer.deliveryMode || 'A convenir'],
      ],
    };
  });

  if (recursos.length === 0 && Array.isArray(offer.categories) && offer.categories.length > 0) {
    offer.categories.forEach((cat) => {
      const label = CATEGORY_LABELS[cat as HelpCategory]?.label || cat;
      recursos.push({
        item: label,
        unidad: 'unidades',
        total: 1,
        tramos: [],
        ficha: [
          ['Disponibilidad', offer.offerStatus === 'AVAILABLE' ? 'Disponible hoy' : 'Hasta agotar'],
          ['Cómo se entrega', offer.deliveryMode || 'A convenir'],
        ],
      });
    });
  }

  const tieneOrg = Boolean(
    offer.organizationName &&
    offer.organizationName.trim() &&
    offer.organizationName.toLowerCase() !== 'ciudadano' &&
    offer.organizationName.toLowerCase() !== 'citizen' &&
    offer.organizationName.toLowerCase() !== 'organización oferente' &&
    offer.organizationName.toLowerCase() !== 'organizacion oferente' &&
    offer.organizationName.toLowerCase() !== 'mi organización' &&
    offer.organizationName.toLowerCase() !== 'mi organizacion'
  );
  const esIndividual = !tieneOrg;

  const detectedCity = (typeof offer.latitude === 'number' && typeof offer.longitude === 'number')
    ? detectCityFromCoords(offer.latitude, offer.longitude)
    : null;
  const rawOfferCityId = offer.cityId && offer.cityId !== 'todo-colombia' && offer.cityId !== 'all_colombia'
    ? (offer.cityId === 'bogota-d-c' ? 'bogota' : offer.cityId)
    : undefined;
  const ciudadId = rawOfferCityId || detectedCity?.id;
  const nombreCiudadDetectada = detectedCity?.name || (ciudadId ? (findCityById(ciudadId)?.name || (ciudadId.charAt(0).toUpperCase() + ciudadId.slice(1))) : '');
  const zonaFinal = offer.neighborhood || nombreCiudadDetectada || '';

  const pub: Publicacion = {
    id: offer.id,
    tipo: 'oferta',
    titulo: offer.title || 'Oferta de ayuda',
    org: tieneOrg ? offer.organizationName! : '',
    perfil: esIndividual ? 'individual' : 'organizacion',
    verificada: offer.verificationStatus === 'VERIFIED' || Boolean(tieneOrg && offer.verificationStatus !== 'REJECTED'),
    lat: offer.latitude,
    lng: offer.longitude,
    ciudad: ciudadId,
    zona: zonaFinal,
    dir: offer.address,
    descripcion: offer.description,
    recursos: recursos.length > 0 ? recursos : [{ item: 'Aporte general', unidad: 'oferta', total: 1, tramos: [] }],
    fotos: offer.evidenceUrl
      ? offer.evidenceUrl.split(',').filter(Boolean).map((url: string, i: number) => ({
          url: url.trim(),
          alt: offer.title || `Evidencia ${i + 1}`,
          quien: offer.organizationName || '',
          cuando: 'Evidencia',
        }))
      : [],
    modoEntrega: offer.deliveryMode as any,
    radio: offer.deliveryRadius || (offer as any).coverageRadius,
    userId: offer.userId,
    contactoNombre: offer.contactName,
    contactoTel: offer.contactPhone,
    contactoWa: Boolean(offer.contactWhatsapp),
    contactoEmail: offer.contactEmail,
    horario: offer.operatingHours,
  };

  return pub;
}

/**
 * Convierte un row de Supabase `commitments` a `Solicitud` para el Panel (Tablero y Solicitudes)
 */
export function commitmentToSolicitud(c: any): any {
  const deliveryPhotosCount = Array.isArray(c.delivery_photos) ? c.delivery_photos.length : 0;
  const receptionPhotosCount = Array.isArray(c.reception_photos) ? c.reception_photos.length : 0;
  const numericId =
    typeof c.id === 'number'
      ? c.id
      : Math.abs(String(c.id).split('').reduce((acc: number, char: string) => (acc << 5) - acc + char.charCodeAt(0), 0));

  return {
    id: numericId,
    dbId: String(c.id),
    quien:
      c.origin_type === 'INTERNAL_BRIGADE'
        ? c.target_community || (c.neighborhood ? `Comunidad de ${c.neighborhood}` : '') || 'Comunidad beneficiaria'
        : c.requester_name || c.requester_user_id || 'Comunidad atendida',
    rec: c.resource_name || 'Ayuda',
    cant: c.quantity || 1,
    u: c.unit || 'unidades',
    estado: (c.status === 'propuesta' ? 'nueva' : (c.status || 'nueva')) as any,
    cuando: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Reciente',
    vol: c.assigned_volunteer_name || null,
    dist: c.distance_text || (c.origin_type === 'INTERNAL_BRIGADE' ? 'Brigada interna' : undefined),
    esInterna: c.origin_type === 'INTERNAL_BRIGADE',
    esEntregaDirecta: c.origin_type === 'DIRECT_OFFER_DISPATCH',
    medioEnvio: c.medio_envio || 'directa',
    empresaTransporte: c.empresa_transporte || undefined,
    notasCamino: c.notas_camino || c.notes_camino || c.confirmation_story || undefined,
    notasEntrega: c.notas_entrega || c.notes_entrega || c.confirmation_story || undefined,
    cierre: {
      entrega: { fotos: deliveryPhotosCount },
      recibe: { fotos: receptionPhotosCount },
      historia: c.confirmation_story || undefined,
      notasCamino: c.notas_camino || c.notes_camino || undefined,
      notasEntrega: c.notas_entrega || c.notes_entrega || undefined,
      medioEnvio: c.medio_envio || 'directa',
      empresaTransporte: c.empresa_transporte || undefined,
      personasBeneficiadas: c.personas_beneficiadas || undefined,
    },
    cerradaEl: c.status === 'confirmada' || c.status === 'archivada' || c.status === 'distribuida' ? (c.updated_at ? c.updated_at.split('T')[0] : undefined) : undefined,
    rawCommitment: c,
  };
}

/**
 * Convierte un row de Supabase `commitments` a `EntregaRecibida` para el Panel
 */
export function commitmentToEntregaRecibida(c: any): any {
  const deliveryPhotosCount = Array.isArray(c.delivery_photos) ? c.delivery_photos.length : 0;
  const receptionPhotosCount = Array.isArray(c.reception_photos) ? c.reception_photos.length : 0;
  const numericId =
    typeof c.id === 'number'
      ? c.id
      : Math.abs(String(c.id).split('').reduce((acc: number, char: string) => (acc << 5) - acc + char.charCodeAt(0), 0));

  return {
    id: numericId,
    dbId: String(c.id),
    org: c.provider_org_name || c.provider_user_id || 'Organización aliada',
    rec: c.resource_name || 'Ayuda',
    cant: c.quantity || 1,
    u: c.unit || 'unidades',
    estado: (c.status === 'propuesta' ? 'nueva' : (c.status || 'nueva')) as any,
    cuando: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Reciente',
    quienEntrega: c.assigned_volunteer_name || 'Coordinación operativa',
    vol: c.assigned_volunteer_name || null,
    esInterna: c.origin_type === 'INTERNAL_BRIGADE',
    medioEnvio: c.medio_envio || 'directa',
    empresaTransporte: c.empresa_transporte || undefined,
    cierre: {
      entrega: { fotos: deliveryPhotosCount },
      recibe: { fotos: receptionPhotosCount },
      historia: c.confirmation_story || undefined,
      medioEnvio: c.medio_envio || 'directa',
      empresaTransporte: c.empresa_transporte || undefined,
      personasBeneficiadas: c.personas_beneficiadas || undefined,
    },
    cerradaEl: c.status === 'confirmada' || c.status === 'archivada' || c.status === 'distribuida' ? (c.updated_at ? c.updated_at.split('T')[0] : undefined) : undefined,
    rawCommitment: c,
  };
}

/**
 * Convierte un row de Supabase `commitments` a `SolicitudEnviada` para el Panel
 */
export function commitmentToSolicitudEnviada(c: any): SolicitudEnviada {
  const numericId =
    typeof c.id === 'number'
      ? c.id
      : Math.abs(String(c.id).split('').reduce((acc: number, char: string) => (acc << 5) - acc + char.charCodeAt(0), 0));

  let estado: EstadoSolicitudEnviada = 'en_revision';
  if (['aceptada', 'camino', 'entregada', 'confirmada', 'distribuida'].includes(c.status)) {
    estado = 'aceptada';
  } else if (['rechazada', 'declinada'].includes(c.status)) {
    estado = 'declinada';
  } else if (c.status === 'cancelada') {
    estado = 'cancelada';
  }

  const donanteNombre = c.offers?.organization_name || c.offers?.title || c.provider_org_name || 'Organización donante';
  const donanteTel = c.offers?.contact_phone || c.provider_phone;
  const donanteWa = c.offers?.contact_whatsapp !== undefined ? Boolean(c.offers.contact_whatsapp) : Boolean(c.provider_wa);

  return {
    id: numericId,
    dbId: String(c.id),
    publicacionId: c.offer_id || undefined,
    donante: donanteNombre,
    donanteTipo: 'Organización',
    rec: c.resource_name || 'Ayuda',
    cant: c.quantity || 1,
    u: c.unit || 'unidades',
    cuando: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Reciente',
    estado,
    contacto: donanteTel ? { tel: donanteTel, wa: donanteWa } : undefined,
  };
}

/**
 * Convierte un row de Supabase `commitments` a `OfrecimientoEnviado` para el Panel
 */
export function commitmentToOfrecimientoEnviado(c: any): OfrecimientoEnviado {
  const numericId =
    typeof c.id === 'number'
      ? c.id
      : Math.abs(String(c.id).split('').reduce((acc: number, char: string) => (acc << 5) - acc + char.charCodeAt(0), 0));

  let estado: EstadoOfrecimientoEnviado = 'pendiente';
  if (['aceptada', 'aceptado', 'camino', 'entregada', 'confirmada', 'distribuida'].includes(c.status)) {
    estado = 'aceptado';
  } else if (['rechazada', 'rechazado', 'declinada', 'declinado'].includes(c.status)) {
    estado = 'declinado';
  } else if (c.status === 'cancelada' || c.status === 'cancelado') {
    estado = 'cancelado';
  }

  const comunidadNombre = c.needs?.organization_name || c.needs?.contact_name || c.needs?.title || c.target_community || 'Comunidad atendida';
  const comunidadLugar = c.needs?.neighborhood || c.needs?.address || c.neighborhood;
  const comunidadTel = c.needs?.contact_phone;
  const comunidadWa = c.needs?.contact_whatsapp !== undefined ? Boolean(c.needs.contact_whatsapp) : false;

  return {
    id: numericId,
    dbId: String(c.id),
    necesidadId: c.need_id || undefined,
    comunidad: comunidadNombre,
    lugar: comunidadLugar,
    rec: c.resource_name || 'Ayuda',
    cant: c.quantity || 1,
    u: c.unit || 'unidades',
    cuando: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Reciente',
    estado,
    contacto: comunidadTel ? { nombre: comunidadNombre, tel: comunidadTel, wa: comunidadWa } : undefined,
  };
}

