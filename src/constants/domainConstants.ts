/**
 * DICCIONARIO CENTRAL DE CONSTANTES DE DOMINIO
 * --------------------------------------------------------------------------
 * Este archivo es la fuente única de verdad para roles de usuario, estados,
 * tipos de organización y documentos en toda la aplicación.
 */

export interface RoleConfig {
  id: string;
  dbValue: string;
  labelKey: string;
  defaultLabel: string;
  descriptionKey: string;
  badgeClass: string;
}

/**
 * 1. ROLES DE USUARIO
 */
export const USER_ROLES = {
  REGULAR: {
    id: 'regular',
    dbValue: 'regular',
    labelKey: 'authRoleVolunteer',
    defaultLabel: 'Usuario regular',
    descriptionKey: 'authRoleVolunteerDesc',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  VOLUNTEER: {
    id: 'voluntario',
    dbValue: 'voluntario',
    labelKey: 'authRoleVolunteerTitle',
    defaultLabel: 'Voluntario / Donante',
    descriptionKey: 'authRoleVolunteerDesc',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  MODERATOR: {
    id: 'moderador',
    dbValue: 'moderador',
    labelKey: 'authRoleModerator',
    defaultLabel: 'Moderador voluntario',
    descriptionKey: 'authRoleModeratorDesc',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  ORGANIZATION: {
    id: 'entidad_profesional',
    dbValue: 'entidad_profesional',
    labelKey: 'authRoleOrg',
    defaultLabel: 'Gobierno / Organización',
    descriptionKey: 'authRoleOrgDesc',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
} as const;

/**
 * 2. ESTADOS DE NECESIDADES (Need Status)
 */
export const NEED_STATUS_CONFIG = {
  OPEN: {
    key: 'OPEN',
    labelKey: 'statusOpen',
    defaultLabel: 'Abierta',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  IN_PROGRESS: {
    key: 'IN_PROGRESS',
    labelKey: 'statusInProgress',
    defaultLabel: 'En proceso',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    dotClass: 'bg-blue-500',
  },
  RESOLVED: {
    key: 'RESOLVED',
    labelKey: 'statusResolved',
    defaultLabel: 'Resuelta / Atendida',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotClass: 'bg-slate-500',
  },
  CANCELLED: {
    key: 'CANCELLED',
    labelKey: 'statusCancelled',
    defaultLabel: 'Cancelada',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    dotClass: 'bg-rose-500',
  },
} as const;

/**
 * 3. TIPOS DE ORGANIZACIÓN / ENTIDAD
 */
export const ORGANIZATION_TYPE_CONFIG = {
  BOMBEROS_DEFENSA_CIVIL: {
    id: 'bomberos_defensa_civil',
    labelKey: 'authOrgCatFirefighters',
    defaultLabel: 'Bomberos / Defensa Civil / Socorristas',
    icon: '🚒',
  },
  ORGANISMO_RESCATE: {
    id: 'organismo_rescate',
    labelKey: 'authOrgCatRescue',
    defaultLabel: 'Organismo de Rescate / Búsqueda',
    icon: '🚑',
  },
  ONG_PERSONAS: {
    id: 'ong_personas',
    labelKey: 'authOrgCatOngPeople',
    defaultLabel: 'ONG / Fundación de Ayuda Humanitaria',
    icon: '🤝',
  },
  ONG_ANIMAL: {
    id: 'ong_animal',
    labelKey: 'authOrgCatOngAnimal',
    defaultLabel: 'ONG / Refugio / Protección Animal',
    icon: '🐾',
  },
  MUNICIPALIDAD_GOBIERNO: {
    id: 'municipalidad_gobierno',
    labelKey: 'authOrgCatGovernment',
    defaultLabel: 'Alcaldía / Gobernación / Entidad Pública',
    icon: '🏛️',
  },
  JUNTA_VECINAL: {
    id: 'junta_vecinal',
    labelKey: 'authOrgCatJalJac',
    defaultLabel: 'Junta de Acción Comunal (JAC) / JAL',
    icon: '🏠',
  },
  APOYO_PSICOSOCIAL: {
    id: 'apoyo_psicosocial',
    labelKey: 'authOrgCatPsychosocial',
    defaultLabel: 'Salud Mental / Apoyo Psicosocial',
    icon: '🧠',
  },
  EMPRESA_PRIVADA: {
    id: 'empresa_privada',
    labelKey: 'authOrgCatPrivateCompany',
    defaultLabel: 'Empresa Privada / Gremio Responsable',
    icon: '🏢',
  },
  PROFESIONAL_INDIVIDUAL: {
    id: 'profesional_individual',
    labelKey: 'authOrgCatIndependentProf',
    defaultLabel: 'Profesional Independiente (Médico, Ingeniero, etc.)',
    icon: '🩺',
  },
} as const;

/**
 * 4. TIPOS DE DOCUMENTO DE IDENTIDAD
 */
export const DOCUMENT_TYPE_CONFIG = {
  CEDULA: { id: 'cedula', labelKey: 'authIdentityDocCedula', defaultLabel: 'Cédula de Ciudadanía (CC)' },
  CEDULA_EXTRANJERIA: { id: 'cedula_extranjeria', labelKey: 'authIdentityDocCedulaExtranjeria', defaultLabel: 'Cédula de Extranjería (CE)' },
  PASAPORTE: { id: 'pasaporte', labelKey: 'authIdentityDocPassport', defaultLabel: 'Pasaporte (PA)' },
  PPT_PEP: { id: 'ppt_pep', labelKey: 'authIdentityDocPPT', defaultLabel: 'Permiso por Protección Temporal (PPT / PEP)' },
  NIT: { id: 'nit', labelKey: 'authIdentityDocNIT', defaultLabel: 'NIT (Identificación Tributaria)' },
  TARJETA_IDENTIDAD: { id: 'tarjeta_identidad', labelKey: 'authIdentityDocTI', defaultLabel: 'Tarjeta de Identidad (TI)' },
} as const;
