import { z } from 'zod';

/**
 * Roles de usuario permitidos en la plataforma
 */
export const userRoleEnum = z.enum([
  'voluntario',
  'moderador',
  'rescatista',
  'acopio',
  'entidad_profesional',
]);

/**
 * Subcategorías de organización / entidad permitidas
 */
export const organizationTypeEnum = z.enum([
  'bomberos_defensa_civil',
  'organismo_rescate',
  'ong_animal',
  'ong_personas',
  'municipalidad_gobierno',
  'junta_vecinal',
  'apoyo_psicosocial',
  'empresa_privada',
  'profesional_individual',
]);

/**
 * Tipos de documento de identidad permitidos
 */
export const documentTypeEnum = z.enum([
  'cedula',
  'cedula_extranjeria',
  'pasaporte',
  'ppt_pep',
  'nit',
  'tarjeta_identidad',
]);

/**
 * Esquema de validación - Paso 1: Selección de Rol
 */
export const step1Schema = z.object({
  role: userRoleEnum,
});

/**
 * Esquema de validación - Paso 1: Creación de Cuenta (Email, Clave, Captcha, Términos)
 */
export const step1AccountAuthSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'El nombre es obligatorio'),
    lastName: z
      .string()
      .min(2, 'El apellido es obligatorio'),
    email: z
      .string()
      .min(1, 'El correo electrónico es obligatorio')
      .email('Ingresa un correo electrónico válido'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z
      .string()
      .min(1, 'Confirma tu contraseña'),
    captchaVerified: z
      .boolean()
      .refine((val) => val === true, 'Por favor confirma que no eres un robot'),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, 'Debes aceptar los términos y la política de privacidad'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/**
 * Esquema de validación - Paso 2: Ubicación / Territorio (Flujo Individual)
 */
export const step2Schema = z.object({
  country: z.string().min(1, 'El país es obligatorio'),
  department: z.string().min(1, 'El departamento es obligatorio'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  isAutoDetected: z.boolean(),
});

/**
 * Esquema de validación - Paso 3: Identificación de la Persona (Flujo Individual)
 */
export const step3Schema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre es obligatorio'),
  lastName: z
    .string()
    .min(2, 'El apellido es obligatorio'),
  documentType: documentTypeEnum,
  documentNumber: z
    .string()
    .min(4, 'El número de documento es obligatorio (mínimo 4 caracteres)'),
});

/**
 * Esquema de validación - Paso 3 Exclusivo para Moderadores (Postulación)
 */
export const stepModeratorSchema = z.object({
  moderatorCommunityCollective: z.string().optional(),
  moderatorMotivation: z
    .string()
    .min(10, 'Describe tu motivación o experiencia para moderar (mínimo 10 caracteres)'),
});

/**
 * Esquema de validación - Paso 4: Credenciales y Contacto (Flujo Individual)
 */
export const step4Schema = z.object({
  phoneCountryCode: z.string().min(1, 'El código de país es obligatorio'),
  phoneNumber: z
    .string()
    .min(7, 'El número de teléfono debe tener al menos 7 dígitos'),
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/**
 * Esquema de validación - Paso 2 (Organización): Subcategoría de la Entidad
 */
export const stepOrgSubcategorySchema = z.object({
  organizationType: organizationTypeEnum,
});

/**
 * Esquema de validación - Paso 4 (Organización): Ubicación en Mapa con Coordenadas
 */
export const stepOrgMapLocationSchema = z.object({
  searchAddress: z.string().min(1, 'La dirección de búsqueda es obligatoria'),
  latitude: z.number({ message: 'La latitud es requerida' }),
  longitude: z.number({ message: 'La longitud es requerida' }),
});

/**
 * Esquema de validación - Paso 5 (Organización): Datos de la Organización
 */
export const stepOrgDetailsSchema = z.object({
  orgName: z
    .string()
    .min(2, 'El nombre de la organización debe tener al menos 2 caracteres'),
  orgDescription: z.string().optional(),
  orgWebsiteOrSocial: z.string().optional(),
});

/**
 * Esquema consolidado para el flujo individual de 4 pasos
 */
export const registerSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);

/**
 * Esquema consolidado para el flujo de organizaciones y entidades (7 pasos)
 */
export const organizationRegisterSchema = step1Schema
  .merge(stepOrgSubcategorySchema)
  .merge(step2Schema)
  .merge(stepOrgMapLocationSchema)
  .merge(stepOrgDetailsSchema)
  .merge(step3Schema)
  .merge(step4Schema);

/**
 * Tipos TypeScript inferidos a partir de los esquemas Zod
 */
export type UserRole = z.infer<typeof userRoleEnum>;
export type OrganizationType = z.infer<typeof organizationTypeEnum>;
export type DocumentType = z.infer<typeof documentTypeEnum>;

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;

export type StepOrgSubcategoryData = z.infer<typeof stepOrgSubcategorySchema>;
export type StepOrgMapLocationData = z.infer<typeof stepOrgMapLocationSchema>;
export type StepOrgDetailsData = z.infer<typeof stepOrgDetailsSchema>;

export type RegisterFormData = z.infer<typeof registerSchema>;
export type OrganizationFormData = z.infer<typeof organizationRegisterSchema>;
