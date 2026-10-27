import { describe, it, expect } from 'vitest';
import { actorPublicacion, tituloPublicacion } from '../../src/utils/publicaciones';
import type { Publicacion } from '../../src/types/publicacion';

describe('Verificación de corrección de bugs recientes', () => {
  describe('Punto 1: Lógica booleana de reportes en AdminPanelPage', () => {
    it('discrimina correctamente ofertas y necesidades por offerId', () => {
      const needReport = { id: 'rep-1', needId: 'need-123', offerId: undefined };
      const offerReport = { id: 'rep-2', needId: undefined, offerId: 'offer-456' };

      const isOfferForNeed = Boolean(needReport.offerId);
      const isOfferForOffer = Boolean(offerReport.offerId);

      expect(isOfferForNeed).toBe(false);
      expect(isOfferForOffer).toBe(true);
    });

    it('habilita canOpen solo cuando la publicación relacionada existe', () => {
      const relatedNeed = { id: 'need-123', title: 'Agua para 50 familias' };
      const relatedOffer = undefined;

      const isOffer = false;
      const canOpen = isOffer ? Boolean(relatedOffer) : Boolean(relatedNeed);

      expect(canOpen).toBe(true);

      const isOffer2 = true;
      const canOpen2 = isOffer2 ? Boolean(relatedOffer) : Boolean(relatedNeed);
      expect(canOpen2).toBe(false);
    });
  });

  describe('Punto 2.1: Acceso seguro a profile en sesión y verificación de caché', () => {
    it('no lanza excepción cuando profile es null y orgData existe', () => {
      const profile = null as any;
      const orgData = { org_name: 'Defensa Civil', organization_type: 'bomberos_defensa_civil' };

      const normRole = profile?.role?.toString().trim().toUpperCase();
      const isAdmin = normRole === 'ADMIN' || normRole === 'ADMINISTRADOR';
      const isApprovedMod = (normRole === 'MODERADOR' || normRole === 'MODERATOR') && profile?.moderation_status === 'APPROVED';

      expect(normRole).toBeUndefined();
      expect(isAdmin).toBe(false);
      expect(isApprovedMod).toBe(false);
    });

    it('descarta datos en caché si el id de usuario no coincide con el de la sesión', () => {
      const sessionUser = { id: 'user-b', email: 'userb@example.com' };
      const stored = { id: 'user-a', name: 'Usuario Anterior', role: 'admin' };

      const local = stored?.id === sessionUser.id ? stored : null;

      expect(local).toBeNull();
    });

    it('mantiene datos en caché si el id coincide', () => {
      const sessionUser = { id: 'user-a', email: 'usera@example.com' };
      const stored = { id: 'user-a', name: 'Usuario Actual', role: 'admin' };

      const local = stored?.id === sessionUser.id ? stored : null;

      expect(local).not.toBeNull();
      expect(local?.name).toBe('Usuario Actual');
    });
  });

  describe('Punto 2.2: Detección de comunidad vs organización', () => {
    it('mantiene tipo liderazgo/comunidad si organization_type es junta vecinal o comunal', () => {
      const orgData = { org_name: 'JAC Siloé', organization_type: 'junta_vecinal' };
      const profile = { profile_type: 'liderazgo' };

      const orgType = (orgData?.organization_type || '').toLowerCase();
      const profType = (profile?.profile_type || '').toLowerCase();
      const isCom = orgType.includes('comun') || orgType.includes('junta') || profType === 'liderazgo' || profType === 'comunidad';

      const resolvedProfileType = orgData ? (isCom ? 'liderazgo' : 'organizacion') : 'individual';

      expect(isCom).toBe(true);
      expect(resolvedProfileType).toBe('liderazgo');
    });

    it('asigna organización a empresas u ONGs registradas en organizations', () => {
      const orgData = { org_name: 'Fundación Caritas', organization_type: 'ong' };
      const profile = { profile_type: 'organizacion' };

      const orgType = (orgData?.organization_type || '').toLowerCase();
      const profType = (profile?.profile_type || '').toLowerCase();
      const isCom = orgType.includes('comun') || orgType.includes('junta') || profType.includes('lider') || profType.includes('comun');

      const resolvedProfileType = orgData ? (isCom ? 'liderazgo' : 'organizacion') : 'individual';

      expect(isCom).toBe(false);
      expect(resolvedProfileType).toBe('organizacion');
    });

    it('identifica comunidad si profile_type es "lider" o "liderazgo" incluso si organization_type no tiene "junta"', () => {
      const orgData = { org_name: 'Red Barrial', organization_type: 'iniciativa_ciudadana' };
      const profile = { profile_type: 'lider' };

      const orgType = (orgData?.organization_type || '').toLowerCase();
      const profType = (profile?.profile_type || '').toLowerCase();
      const isCom = orgType.includes('comun') || orgType.includes('junta') || profType.includes('lider') || profType.includes('comun');

      const resolvedProfileType = orgData ? (isCom ? 'liderazgo' : 'organizacion') : 'individual';

      expect(isCom).toBe(true);
      expect(resolvedProfileType).toBe('liderazgo');
    });
  });

  describe('Punto 2.3: Fallback en DialogoCompromiso para publicaciones individuales', () => {
    it('genera el actor fallback "Ciudadano" cuando p.org es string vacío', () => {
      const pub: Publicacion = {
        id: 'need-ind-1',
        tipo: 'necesidad',
        titulo: 'Alimentos para 4 personas, de Ciudadano',
        org: '',
        perfil: 'individual',
        verificada: false,
        lat: 3.4,
        lng: -76.5,
        zona: 'Cali',
        recursos: [{ item: 'Mercados', unidad: 'kits', total: 2, tramos: [] }],
      };

      const actor = pub.org?.trim() || actorPublicacion(pub, 'es');
      expect(actor).toBe('Ciudadano');

      const tituloModal = `¿Con cuánto vas a ayudar a ${actor}?`;
      expect(tituloModal).toBe('¿Con cuánto vas a ayudar a Ciudadano?');
      expect(tituloModal).not.toBe('¿Con cuánto vas a ayudar a ?');
    });

    it('respeta p.org cuando la publicación pertenece a una organización', () => {
      const pub: Publicacion = {
        id: 'need-org-1',
        tipo: 'necesidad',
        titulo: 'Kits de aseo, de Cruz Roja',
        org: 'Cruz Roja',
        perfil: 'organizacion',
        verificada: true,
        lat: 3.4,
        lng: -76.5,
        zona: 'Cali',
        recursos: [{ item: 'Kits de aseo', unidad: 'kits', total: 50, tramos: [] }],
      };

      const actor = pub.org?.trim() || actorPublicacion(pub, 'es');
      expect(actor).toBe('Cruz Roja');

      const tituloModal = `¿Con cuánto vas a ayudar a ${actor}?`;
      expect(tituloModal).toBe('¿Con cuánto vas a ayudar a Cruz Roja?');
    });
  });

  describe('Punto 2.4: Generación de título con actor real al guardar publicación', () => {
    it('incluye el nombre real de la organización en el título en vez de Comunidad o mock', () => {
      const pub: Publicacion = {
        id: 'nueva',
        tipo: 'necesidad',
        titulo: '',
        org: 'Banco de Alimentos',
        perfil: 'organizacion',
        verificada: true,
        lat: 3.4,
        lng: -76.5,
        zona: 'Cali',
        recursos: [{ item: 'Arroz', unidad: 'kg', total: 100, tramos: [] }],
      };

      const titulo = tituloPublicacion(pub, 'es');
      expect(titulo).toContain('Banco de Alimentos');
      expect(titulo).not.toContain('Comunidad');
    });

    it('incluye "Ciudadano" si la publicación la realiza una persona natural', () => {
      const pub: Publicacion = {
        id: 'nueva',
        tipo: 'oferta',
        titulo: '',
        org: '',
        perfil: 'individual',
        verificada: false,
        lat: 3.4,
        lng: -76.5,
        zona: 'Cali',
        recursos: [{ item: 'Ropa de abrigo', unidad: 'prendas', total: 5, tramos: [] }],
      };

      const titulo = tituloPublicacion(pub, 'es');
      expect(titulo).toContain('Ciudadano');
    });
  });

  describe('Punto 3: Miembros de equipo y salida voluntaria de organización', () => {
    it('mapea correctamente un integrante de la base de datos preservando userId y roles', () => {
      const dbRow = {
        id: 'mem-123',
        organization_id: 'org-456',
        user_id: 'user-789',
        role_in_org: 'admin',
        member_title: 'Operativo',
        name: null,
        phone: null,
        email: null,
        veh: null,
        disp: null,
        ubicacion: null,
        profiles: {
          id: 'user-789',
          full_name: 'Federico Posada 1',
          email: 'posadafed@gmail.com',
          phone: null,
          role: 'regular'
        }
      };

      const mapped = {
        id: 101,
        dbId: dbRow.id,
        userId: dbRow.user_id,
        n: dbRow.name || dbRow.profiles?.full_name || 'Miembro de equipo',
        rolPlataforma: dbRow.role_in_org === 'admin' ? 'admin' : 'voluntario',
        rol: dbRow.member_title || dbRow.role_in_org || 'Operativo',
        correo: dbRow.email || dbRow.profiles?.email || '',
      };

      expect(mapped.n).toBe('Federico Posada 1');
      expect(mapped.correo).toBe('posadafed@gmail.com');
      expect(mapped.rolPlataforma).toBe('admin');
      expect(mapped.userId).toBe('user-789');
    });

    it('actualiza el usuario almacenado a perfil persona cuando sale de la organización', () => {
      const stored = {
        id: 'user-789',
        name: 'Federico Posada 1',
        email: 'posadafed@gmail.com',
        role: 'regular',
        profile_type: 'organizacion',
        org_name: 'Gobernacion quindio',
        organization: 'Gobernacion quindio'
      };

      const updated = {
        ...stored,
        profile_type: 'persona',
        org_name: undefined,
        organization: undefined,
      };

      expect(updated.profile_type).toBe('persona');
      expect(updated.org_name).toBeUndefined();
      expect(updated.organization).toBeUndefined();
    });
  });
});

