import { z } from 'zod';

/**
 * Roles de usuario permitidos en la plataforma
 */
export const userRoleEnum = z.enum([
  'voluntario',
  'rescatista',
  'acopio',
  'entidad_profesional',
]);

/**
 * Tipos de documento de identidad permitidos
 */
export const documentTypeEnum = z.enum(['cedula', 'pasaporte']);

/**
 * Esquema de validación - Paso 1: Selección de Rol
 */
export const step1Schema = z.object({
  role: userRoleEnum,
});

/**
 * Esquema de validación - Paso 2: Ubicación / Territorio
 */
export const step2Schema = z.object({
  country: z.string().min(1, 'El país es obligatorio'),
  department: z.string().min(1, 'El departamento es obligatorio'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  isAutoDetected: z.boolean(),
});

/**
 * Esquema de validación - Paso 3: Identificación de la Persona
 */
export const step3Schema = z.object({
  fullName: z
    .string()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres'),
  documentType: documentTypeEnum,
  documentNumber: z
    .string()
    .min(4, 'El número de documento debe tener al menos 4 caracteres'),
});

/**
 * Esquema de validación - Paso 4: Credenciales y Contacto
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
 * Esquema consolidado que fusiona los 4 pasos del registro
 */
export const registerSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);

/**
 * Tipos TypeScript inferidos a partir de los esquemas Zod
 */
export type UserRole = z.infer<typeof userRoleEnum>;
export type DocumentType = z.infer<typeof documentTypeEnum>;

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;

export type RegisterFormData = z.infer<typeof registerSchema>;
