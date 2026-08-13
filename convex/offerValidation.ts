/**
 * Pure validation logic for offer creation, extracted for testability.
 * Used by both the Convex mutation and property-based tests.
 */

export interface OfferResourceInput {
  type: string;
  description: string;
  quantity?: number;
  unit?: string;
}

export interface OfferInput {
  title: string;
  description: string;
  categories: string[];
  resources?: OfferResourceInput[];
  address: string;
  neighborhood: string;
  cityId: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  organizationName?: string;
  operatingHours?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates offer input data. Returns a result indicating
 * whether the input is valid and any errors found.
 */
export function validateOfferInput(input: Partial<OfferInput>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required string fields (must be present and non-empty after trim)
  if (!input.title || input.title.trim().length === 0) {
    errors.push({ field: "title", message: "El campo 'title' es obligatorio." });
  } else if (input.title.length > 120) {
    errors.push({ field: "title", message: "El título no puede superar 120 caracteres." });
  }

  if (!input.description || input.description.trim().length === 0) {
    errors.push({ field: "description", message: "El campo 'description' es obligatorio." });
  } else if (input.description.length > 1000) {
    errors.push({ field: "description", message: "La descripción no puede superar 1000 caracteres." });
  }

  if (!input.address || input.address.trim().length === 0) {
    errors.push({ field: "address", message: "El campo 'address' es obligatorio." });
  }

  if (!input.neighborhood || input.neighborhood.trim().length === 0) {
    errors.push({ field: "neighborhood", message: "El campo 'neighborhood' es obligatorio." });
  }

  if (!input.cityId || input.cityId.trim().length === 0) {
    errors.push({ field: "cityId", message: "El campo 'cityId' es obligatorio." });
  }

  if (!input.contactName || input.contactName.trim().length === 0) {
    errors.push({ field: "contactName", message: "El campo 'contactName' es obligatorio." });
  }

  // Validate categories (must be array with at least 1 element)
  if (!input.categories || !Array.isArray(input.categories) || input.categories.length < 1) {
    errors.push({ field: "categories", message: "El campo 'categories' es obligatorio." });
  }

  // Validate latitude and longitude (must be numbers)
  if (input.latitude === undefined || input.latitude === null || typeof input.latitude !== "number" || isNaN(input.latitude)) {
    errors.push({ field: "latitude", message: "El campo 'latitude' es obligatorio." });
  }

  if (input.longitude === undefined || input.longitude === null || typeof input.longitude !== "number" || isNaN(input.longitude)) {
    errors.push({ field: "longitude", message: "El campo 'longitude' es obligatorio." });
  }

  // Validate resources array
  const resources = input.resources || [];
  if (resources.length > 20) {
    errors.push({ field: "resources", message: "Máximo 20 recursos por oferta." });
  } else {
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      if (resource.description && resource.description.length > 200) {
        errors.push({
          field: `resources[${i}].description`,
          message: "La descripción del recurso no puede superar 200 caracteres.",
        });
      }
      if (resource.quantity !== undefined && (resource.quantity < 1 || resource.quantity > 999999)) {
        errors.push({
          field: `resources[${i}].quantity`,
          message: "La cantidad debe estar entre 1 y 999999.",
        });
      }
      if (resource.unit && resource.unit.length > 30) {
        errors.push({
          field: `resources[${i}].unit`,
          message: "La unidad no puede superar 30 caracteres.",
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates the offer document shape with defaults applied.
 * Returns the complete offer data ready for insertion.
 */
export function createOfferDocument(input: OfferInput) {
  const now = new Date().toISOString();
  const rawResources = input.resources || [];

  const resources = rawResources.map((r, idx) => ({
    id: `res-${Date.now()}-${idx}`,
    type: r.type,
    description: r.description || "",
    quantity: r.quantity,
    unit: r.unit,
    status: "AVAILABLE" as const,
  }));

  return {
    cityId: input.cityId,
    title: input.title,
    description: input.description,
    categories: input.categories,
    resources,
    address: input.address,
    neighborhood: input.neighborhood,
    latitude: input.latitude,
    longitude: input.longitude,
    offerStatus: "AVAILABLE" as const,
    verificationStatus: "PENDING_VERIFICATION" as const,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    contactWhatsapp: input.contactWhatsapp,
    contactEmail: input.contactEmail,
    organizationName: input.organizationName,
    operatingHours: input.operatingHours,
    createdAt: now,
    updatedAt: now,
  };
}
