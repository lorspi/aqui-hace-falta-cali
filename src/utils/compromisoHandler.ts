import type { Publicacion } from '../types/publicacion';
import type { Compromiso } from './compromiso';
import type { SolicitudEnviada, OfrecimientoEnviado } from '../types/panel';
import { createCommitment } from '../lib/supabaseService';
import { activarModulo } from './panel';

/**
 * Registra y persiste un compromiso o solicitud realizado desde el diálogo de compromiso
 * (Radar, Directorio o Cruces de coincidencias).
 * Guarda de inmediato en localStorage y, si hay sesión de usuario, lo crea en Supabase.
 */
export async function registrarCompromisoPublicacion(
  p: Publicacion,
  c: Compromiso,
  usuarioActual?: any
): Promise<void> {
  const partes = c.partes || [];
  if (partes.length === 0) return;

  const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id);
  const ahora = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

  if (p.tipo === 'oferta') {
    // Si la publicación es una OFERTA, el usuario está SOLICITANDO ayuda de esa oferta -> SolicitudEnviada
    activarModulo('pide');

    const nuevasSolicitudes: SolicitudEnviada[] = partes.map((parte, i) => ({
      id: `sol-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      publicacionId: p.id,
      donante: p.org || 'Organización donante',
      donanteTipo: p.perfil === 'individual' ? 'Persona voluntaria' : 'Organización',
      rec: parte.item,
      cant: parte.cantidad,
      u: parte.unidad,
      cuando: ahora,
      estado: 'en_revision',
      contacto: p.contactoTel ? { tel: p.contactoTel, wa: Boolean(p.contactoWa) } : undefined,
    }));

    try {
      const guardado = typeof window !== 'undefined' ? localStorage.getItem('rd-solicitudes-enviadas') : null;
      const existentes: SolicitudEnviada[] = guardado ? JSON.parse(guardado) : [];
      const combinadas = [
        ...nuevasSolicitudes,
        ...existentes.filter((s) => s.id !== 'sol-env-1' && s.id !== 'sol-env-2' && s.id !== 'sol-env-3'),
      ];
      localStorage.setItem('rd-solicitudes-enviadas', JSON.stringify(combinadas));
    } catch {}

    if (usuarioActual?.id) {
      let huboCambios = false;
      for (let i = 0; i < partes.length; i++) {
        const parte = partes[i];
        try {
          const inserted = await createCommitment({
            offerId: esUuid ? p.id : undefined,
            requesterUserId: usuarioActual.id,
            providerUserId: p.userId || undefined,
            originType: 'DIRECT_OFFER_REQUEST',
            resourceName: parte.item,
            quantity: parte.cantidad,
            unit: parte.unidad,
            status: 'en_revision',
          });
          if (inserted?.id) {
            nuevasSolicitudes[i].dbId = String(inserted.id);
            huboCambios = true;
          }
        } catch (e) {
          console.warn('Error registrando solicitud en Supabase:', e);
        }
      }
      if (huboCambios) {
        try {
          const guardado = typeof window !== 'undefined' ? localStorage.getItem('rd-solicitudes-enviadas') : null;
          const existentes: SolicitudEnviada[] = guardado ? JSON.parse(guardado) : [];
          const actualizadas = existentes.map((ex) => {
            const match = nuevasSolicitudes.find((n) => n.id === ex.id);
            return match && match.dbId ? { ...ex, dbId: match.dbId } : ex;
          });
          localStorage.setItem('rd-solicitudes-enviadas', JSON.stringify(actualizadas));
        } catch {}
      }
    }
  } else {
    // Si la publicación es una NECESIDAD, el usuario está OFRECIENDO ayuda a esa necesidad -> OfrecimientoEnviado
    activarModulo('ofrece');

    const nuevosOfrecimientos: OfrecimientoEnviado[] = partes.map((parte, i) => ({
      id: `ofr-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      necesidadId: p.id,
      comunidad: p.org || 'Comunidad atendida',
      lugar: p.zona || p.dir || 'Territorio',
      rec: parte.item,
      cant: parte.cantidad,
      u: parte.unidad,
      cuando: ahora,
      estado: 'pendiente',
      contacto: p.contactoTel
        ? { nombre: p.contactoNombre || p.org, tel: p.contactoTel, wa: Boolean(p.contactoWa) }
        : undefined,
    }));

    try {
      const guardado = typeof window !== 'undefined' ? localStorage.getItem('rd-ofrecimientos-enviados') : null;
      const existentes: OfrecimientoEnviado[] = guardado ? JSON.parse(guardado) : [];
      const combinadas = [
        ...nuevosOfrecimientos,
        ...existentes.filter((o) => o.id !== 'ofr-env-1' && o.id !== 'ofr-env-2' && o.id !== 'ofr-env-3'),
      ];
      localStorage.setItem('rd-ofrecimientos-enviados', JSON.stringify(combinadas));
    } catch {}

    if (usuarioActual?.id) {
      let huboCambios = false;
      for (let i = 0; i < partes.length; i++) {
        const parte = partes[i];
        try {
          const inserted = await createCommitment({
            needId: esUuid ? p.id : undefined,
            providerUserId: usuarioActual.id,
            providerOrgId: usuarioActual.organizacionId || usuarioActual.organization_id || undefined,
            requesterUserId: p.userId || undefined,
            originType: 'DIRECT_NEED_RESPONSE',
            resourceName: parte.item,
            quantity: parte.cantidad,
            unit: parte.unidad,
            status: 'propuesta',
          });
          if (inserted?.id) {
            nuevosOfrecimientos[i].dbId = String(inserted.id);
            huboCambios = true;
          }
        } catch (e) {
          console.warn('Error registrando ofrecimiento en Supabase:', e);
        }
      }
      if (huboCambios) {
        try {
          const guardado = typeof window !== 'undefined' ? localStorage.getItem('rd-ofrecimientos-enviados') : null;
          const existentes: OfrecimientoEnviado[] = guardado ? JSON.parse(guardado) : [];
          const actualizadas = existentes.map((ex) => {
            const match = nuevosOfrecimientos.find((n) => n.id === ex.id);
            return match && match.dbId ? { ...ex, dbId: match.dbId } : ex;
          });
          localStorage.setItem('rd-ofrecimientos-enviados', JSON.stringify(actualizadas));
        } catch {}
      }
    }
  }
}
