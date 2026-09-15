import { z } from 'zod';

export const needStep1Schema = z.object({
  emergencyId: z.string().min(1, 'Debes seleccionar un evento de emergencia.'),
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.').max(120, 'El título no puede superar 120 caracteres.'),
  placeType: z.string().min(1, 'Selecciona el tipo de lugar.'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], {
    message: 'Selecciona un nivel de prioridad válido.',
  }),
});

export const needStep2Schema = z.object({
  items: z.array(
    z.object({
      resourceId: z.string().min(1, 'El ID de recurso es obligatorio.'),
      categoryId: z.string().min(1, 'La categoría es obligatoria.'),
      resourceName: z.string().min(1, 'El nombre del recurso es obligatorio.'),
      unit: z.string().min(1, 'La unidad es obligatoria.'),
      requestedQuantity: z.number().min(0.1, 'La cantidad solicitada debe ser mayor a 0.'),
    })
  ).min(1, 'Debes agregar al menos un recurso o necesidad.'),
});

export const needStep3Schema = z.object({
  cityId: z.string().min(1, 'Selecciona un municipio o ciudad.'),
  neighborhood: z.string().min(2, 'Ingresa el barrio o sector.'),
  address: z.string().min(3, 'Ingresa la dirección exacta.'),
  latitude: z.number(),
  longitude: z.number(),
});

export const needStep4Schema = z.object({
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  contactName: z.string().min(2, 'Ingresa el nombre del contacto responsable.'),
  contactPhone: z.string().min(7, 'Ingresa un número de teléfono válido de al menos 7 dígitos.'),
  contactWhatsapp: z.string().optional(),
  contactEmail: z.string().email('Ingresa un correo electrónico válido.').optional().or(z.literal('')),
  organizationName: z.string().optional(),
  affectedPeople: z.number().min(0, 'El número de personas debe ser 0 o superior.').optional(),
  affectedAnimals: z.number().min(0, 'El número de animales debe ser 0 o superior.').optional(),
  accessInstructions: z.string().optional(),
});

export const completeNeedFormSchema = needStep1Schema
  .merge(needStep2Schema)
  .merge(needStep3Schema)
  .merge(needStep4Schema);

export type NeedStep1Data = z.infer<typeof needStep1Schema>;
export type NeedStep2Data = z.infer<typeof needStep2Schema>;
export type NeedStep3Data = z.infer<typeof needStep3Schema>;
export type NeedStep4Data = z.infer<typeof needStep4Schema>;
export type CompleteNeedFormData = z.infer<typeof completeNeedFormSchema>;
