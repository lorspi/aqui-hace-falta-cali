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

  const pub: Publicacion = {
    id: need.id,
    tipo: 'necesidad',
    titulo: need.title || 'Solicitud de ayuda',
    org: need.organizationName || need.contactName || 'Comunidad',
    verificada: need.verificationStatus === 'VERIFIED',
    lat: need.latitude,
    lng: need.longitude,
    ciudad: need.cityId,
    zona: need.neighborhood || need.address || 'Colombia',
    dir: need.address,
    descripcion: need.description,
    recursos: recursos.length > 0 ? recursos : [{ item: 'Ayuda general', unidad: 'solicitud', total: 1, tramos: [] }],
    fotos: need.evidenceUrl
      ? need.evidenceUrl.split(',').filter(Boolean).map((url: string, i: number) => ({
          url: url.trim(),
          alt: need.title || `Evidencia ${i + 1}`,
          quien: need.organizationName || need.contactName || '',
          cuando: 'Evidencia',
        }))
      : [],
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

  const pub: Publicacion = {
    id: offer.id,
    tipo: 'oferta',
    titulo: offer.title || 'Oferta de ayuda',
    org: offer.organizationName || offer.contactName || 'Organización Oferente',
    verificada: true,
    lat: offer.latitude,
    lng: offer.longitude,
    ciudad: offer.cityId,
    zona: offer.neighborhood || offer.address || 'Colombia',
    dir: offer.address,
    descripcion: offer.description,
    recursos: recursos.length > 0 ? recursos : [{ item: 'Aporte general', unidad: 'oferta', total: 1, tramos: [] }],
    fotos: offer.evidenceUrl
      ? offer.evidenceUrl.split(',').filter(Boolean).map((url: string, i: number) => ({
          url: url.trim(),
          alt: offer.title || `Evidencia ${i + 1}`,
          quien: offer.organizationName || offer.contactName || '',
          cuando: 'Evidencia',
        }))
      : [],
    modoEntrega: offer.deliveryMode as any,
    radio: offer.deliveryRadius || (offer as any).coverageRadius,
  };

  return pub;
}

