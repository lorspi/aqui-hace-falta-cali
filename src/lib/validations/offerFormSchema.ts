import { z } from 'zod';

export const offerStep1Schema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.').max(120, 'El título no puede superar 120 caracteres.'),
  deliveryMode: z.string().min(1, 'Selecciona la modalidad de entrega.'),
  coverageRadius: z.string().optional(),
  shippingCost: z.string().optional(),
});

export const offerStep2Schema = z.object({
  items: z.array(
    z.object({
      resourceId: z.string().min(1, 'El ID de recurso es obligatorio.'),
      categoryId: z.string().min(1, 'La categoría es obligatoria.'),
      resourceName: z.string().min(1, 'El nombre del recurso es obligatorio.'),
      unit: z.string().min(1, 'La unidad es obligatoria.'),
      availableQuantity: z.number().min(0.1, 'La cantidad ofrecida debe ser mayor a 0.'),
    })
  ).min(1, 'Debes ofrecer al menos un recurso o servicio.'),
});

export const offerStep3Schema = z.object({
  cityId: z.string().min(1, 'Selecciona un municipio o ciudad.'),
  neighborhood: z.string().min(2, 'Ingresa el barrio o sector.'),
  address: z.string().min(3, 'Ingresa la dirección exacta.'),
  latitude: z.number(),
  longitude: z.number(),
});

export const offerStep4Schema = z.object({
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  contactName: z.string().min(2, 'Ingresa el nombre de contacto.'),
  contactPhone: z.string().min(7, 'Ingresa un número de teléfono válido.'),
  contactWhatsapp: z.string().optional(),
  contactEmail: z.string().email('Ingresa un correo electrónico válido.').optional().or(z.literal('')),
  organizationName: z.string().optional(),
});

export const completeOfferFormSchema = offerStep1Schema
  .merge(offerStep2Schema)
  .merge(offerStep3Schema)
  .merge(offerStep4Schema);

export type OfferStep1Data = z.infer<typeof offerStep1Schema>;
export type OfferStep2Data = z.infer<typeof offerStep2Schema>;
export type OfferStep3Data = z.infer<typeof offerStep3Schema>;
export type OfferStep4Data = z.infer<typeof offerStep4Schema>;
export type CompleteOfferFormData = z.infer<typeof completeOfferFormSchema>;
