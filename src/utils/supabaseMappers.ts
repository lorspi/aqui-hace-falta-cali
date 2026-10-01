import type { Need, Offer, HelpCategory } from '../types';
import type { Publicacion, Recurso } from '../types/publicacion';
import { CATEGORY_LABELS } from './formatters';

/**
 * Convierte un Need (de Supabase) al tipo unificado Publicacion (v2 RaDAR)
 */
export function needToPublicacion(need: Need): Publicacion {
  const recursos: Recurso[] = (need.resources || []).map((r) => {
    const total = r.requestedQuantity ?? 1;
    const hecho = r.fulfilledQuantity ?? 0;
    const catLabel = r.type && CATEGORY_LABELS[r.type as HelpCategory]?.label;
    return {
      item: catLabel || r.description || r.type || 'Ayuda',
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

  const esIndividual = need.requesterType === 'PERSONA' || (!need.organizationName && Boolean(need.contactName));

  const pub: Publicacion = {
    id: need.id,
    tipo: 'necesidad',
    titulo: need.title || 'Solicitud de ayuda',
    org: need.organizationName || '',
    perfil: esIndividual ? 'individual' : (need.organizationName ? 'organizacion' : 'liderazgo'),
    verificada: need.verificationStatus === 'VERIFIED',
    lat: need.latitude,
    lng: need.longitude,
    ciudad: need.cityId,
    zona: need.neighborhood || (need.cityId ? need.cityId.charAt(0).toUpperCase() + need.cityId.slice(1) : 'Cali'),
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
      item: catLabel || r.description || r.type || 'Aporte',
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

  const esIndividual = !offer.organizationName && Boolean(offer.contactName);

  const pub: Publicacion = {
    id: offer.id,
    tipo: 'oferta',
    titulo: offer.title || 'Oferta de ayuda',
    org: offer.organizationName || '',
    perfil: esIndividual ? 'individual' : 'organizacion',
    verificada: Boolean(offer.organizationName),
    lat: offer.latitude,
    lng: offer.longitude,
    ciudad: offer.cityId,
    zona: offer.neighborhood || (offer.cityId ? offer.cityId.charAt(0).toUpperCase() + offer.cityId.slice(1) : 'Cali'),
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
    estado: (c.status || 'nueva') as any,
    cuando: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Reciente',
    vol: c.assigned_volunteer_name || null,
    dist: c.distance_text || (c.origin_type === 'INTERNAL_BRIGADE' ? 'Brigada interna' : undefined),
    esInterna: c.origin_type === 'INTERNAL_BRIGADE',
    esEntregaDirecta: c.origin_type === 'DIRECT_OFFER_DISPATCH',
    medioEnvio: c.medio_envio || 'directa',
    empresaTransporte: c.empresa_transporte || undefined,
    notasCamino: c.notes_camino || c.confirmation_story || undefined,
    notasEntrega: c.notes_entrega || c.confirmation_story || undefined,
    cierre: {
      entrega: { fotos: deliveryPhotosCount },
      recibe: { fotos: receptionPhotosCount },
      historia: c.confirmation_story || undefined,
      notasCamino: c.notes_camino || undefined,
      notasEntrega: c.notes_entrega || undefined,
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
    estado: (c.status || 'nueva') as any,
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

