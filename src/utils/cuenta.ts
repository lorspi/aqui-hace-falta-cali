/**
 * La entidad de la cuenta (organización · comunidad), guardada al terminar el registro. Solo
 * pone nombre al panel: «Mi organización» / «Mi comunidad» (decisión de Alejandro, 16 de
 * septiembre de 2026). `?entidad=comunidad` la fuerza para verlo sin registrarse.
 */
import { PERFILES } from '../mocks/cuentasMock';
import type { PerfilCuenta } from '../types/cuenta';
import type { Language } from '../i18n/translations';

const CLAVE = 'rd-entidad';

export function guardarEntidad(perfil: PerfilCuenta): void {
  if (perfil === 'rapida') return;
  try {
    localStorage.setItem(CLAVE, perfil);
  } catch {
    /* sin almacenamiento */
  }
}

export function entidadGuardada(search = '', guardado: string | null = null): Exclude<PerfilCuenta, 'rapida'> {
  const forzada = new URLSearchParams(search).get('entidad');
  if (forzada === 'comunidad' || forzada === 'liderazgo') return 'liderazgo';
  if (forzada === 'individual' || forzada === 'persona') return 'individual';
  if (forzada === 'organizacion') return 'organizacion';
  if (guardado === 'individual') return 'individual';
  return guardado === 'liderazgo' ? 'liderazgo' : 'organizacion';
}

export function entidadActual(): Exclude<PerfilCuenta, 'rapida'> {
  try {
    return entidadGuardada(window.location.search, localStorage.getItem(CLAVE));
  } catch {
    return 'organizacion';
  }
}

/** «Mi organización» o «Mi comunidad», según la entidad. */
export function nombrePanel(perfil: Exclude<PerfilCuenta, 'rapida'> = entidadActual()): string {
  return PERFILES.find((p) => p.id === perfil)?.panel ?? 'Mi organización';
}

const CLAVE_VERIFICACION = 'rd-verificacion';

export type EstadoVerificacionCuenta = 'sin' | 'revision' | 'verificada' | 'rechazada';

export function guardarVerificacion(estado: EstadoVerificacionCuenta): void {
  try {
    localStorage.setItem(CLAVE_VERIFICACION, estado);
  } catch {
    /* sin almacenamiento */
  }
}

export function verificacionActual(): EstadoVerificacionCuenta {
  const entidad = entidadActual();
  if (entidad === 'individual') return 'sin';
  try {
    const v = localStorage.getItem(CLAVE_VERIFICACION);
    if (v === 'sin' || v === 'revision' || v === 'verificada' || v === 'rechazada') {
      return v;
    }
  } catch {
    /* fallback */
  }
  // En la sesión demo predeterminada de organización/comunidad arranca verificada
  return 'verificada';
}

/**
 * Regla de oro: una publicación sale verificada por defecto si y solo si la entidad que la publica
 * está verificada manualmente por el equipo de RaDAR.
 * Los perfiles individuales nunca salen verificados por defecto (salen como reportes ciudadanos).
 */
export function publicacionSaleVerificada(): boolean {
  const entidad = entidadActual();
  if (entidad === 'individual') return false;
  return verificacionActual() === 'verificada';
}

const DICCIONARIO_ROLES: Record<Language, Record<string, string>> = {
  es: {
    entidad_profesional: 'Entidad profesional',
    organizacion: 'Organización',
    voluntario: 'Voluntario / Donante',
    moderador: 'Moderador',
    regular: 'Usuario regular',
    admin: 'Administrador',
    administrador: 'Administrador',
    rescatista: 'Rescatista / Operativo',
    acopio: 'Centro de acopio',
    lider: 'Líder comunitario',
    liderazgo: 'Comunidad / Liderazgo',
    persona: 'Persona natural',
    ciudadano: 'Ciudadano',
  },
  en: {
    entidad_profesional: 'Professional entity',
    organizacion: 'Organization',
    voluntario: 'Volunteer / Donor',
    moderador: 'Moderator',
    regular: 'Regular user',
    admin: 'Administrator',
    administrador: 'Administrator',
    rescatista: 'Rescuer / Field Operator',
    acopio: 'Collection Center',
    lider: 'Community Leader',
    liderazgo: 'Community / Leadership',
    persona: 'Natural person',
    ciudadano: 'Citizen',
  },
  pt: {
    entidad_profesional: 'Entidade profissional',
    organizacion: 'Organização',
    voluntario: 'Voluntário / Doador',
    moderador: 'Moderador',
    regular: 'Usuário regular',
    admin: 'Administrador',
    administrador: 'Administrador',
    rescatista: 'Socorrista / Operacional',
    acopio: 'Centro de coleta',
    lider: 'Líder comunitário',
    liderazgo: 'Comunidade / Liderança',
    persona: 'Pessoa física',
    ciudadano: 'Cidadão',
  },
  fr: {
    entidad_profesional: 'Entité professionnelle',
    organizacion: 'Organisation',
    voluntario: 'Bénévole / Donateur',
    moderador: 'Modérateur',
    regular: 'Utilisateur régulier',
    admin: 'Administrateur',
    administrador: 'Administrateur',
    rescatista: 'Secouriste / Opérationnel',
    acopio: 'Centre de collecte',
    lider: 'Leader communautaire',
    liderazgo: 'Communauté / Leadership',
    persona: 'Personne physique',
    ciudadano: 'Citoyen',
  },
};

/**
 * Traduce y formatea roles técnicos de base de datos a texto legible para el usuario.
 */
export function formatearRol(rol?: string, lang: Language = 'es'): string {
  if (!rol) return '';
  const clave = rol.trim().toLowerCase();
  const dic = DICCIONARIO_ROLES[lang] || DICCIONARIO_ROLES.es;
  if (dic[clave]) {
    return dic[clave];
  }

  // Si tiene guiones bajos técnicos, formatearlo limpiamente
  if (clave.includes('_')) {
    return clave
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Si ya es un texto sin guiones (ej. 'Miembro', 'Administrador'), mantenerlo tal cual
  return rol;
}

const DICCIONARIO_DOCUMENTOS: Record<Language, Record<string, string>> = {
  es: {
    tarjeta_identidad: 'Tarjeta de identidad',
    cedula: 'Cédula de ciudadanía',
    cedula_ciudadania: 'Cédula de ciudadanía',
    cedula_extranjeria: 'Cédula de extranjería',
    pasaporte: 'Pasaporte',
    ppt_pep: 'PPT / PEP',
    nit: 'NIT',
  },
  en: {
    tarjeta_identidad: 'Identity card',
    cedula: 'Citizenship ID',
    cedula_ciudadania: 'Citizenship ID',
    cedula_extranjeria: 'Foreigner ID',
    pasaporte: 'Passport',
    ppt_pep: 'PPT / PEP',
    nit: 'Tax ID (NIT)',
  },
  pt: {
    tarjeta_identidad: 'Carteira de identidade',
    cedula: 'Cédula de cidadania',
    cedula_ciudadania: 'Cédula de cidadania',
    cedula_extranjeria: 'Cédula de estrangeiro',
    pasaporte: 'Passaporte',
    ppt_pep: 'PPT / PEP',
    nit: 'NIT (Identificação Fiscal)',
  },
  fr: {
    tarjeta_identidad: "Carte d'identité",
    cedula: 'Carte de citoyenneté',
    cedula_ciudadania: 'Carte de citoyenneté',
    cedula_extranjeria: "Carte de séjour d'étranger",
    pasaporte: 'Passeport',
    ppt_pep: 'PPT / PEP',
    nit: 'Numéro fiscal (NIT)',
  },
};

/**
 * Traduce y formatea tipos de documento técnicos a nombres legibles para personas.
 */
export function formatearTipoDocumento(tipoDoc?: string, lang: Language = 'es'): string {
  if (!tipoDoc) {
    const docDef: Record<Language, string> = {
      es: 'Documento',
      en: 'Document',
      pt: 'Documento',
      fr: 'Document',
    };
    return docDef[lang] || docDef.es;
  }

  const clave = tipoDoc.trim().toLowerCase();
  const dic = DICCIONARIO_DOCUMENTOS[lang] || DICCIONARIO_DOCUMENTOS.es;
  if (dic[clave]) {
    return dic[clave];
  }

  if (clave.includes('_')) {
    return clave
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return tipoDoc;
}
