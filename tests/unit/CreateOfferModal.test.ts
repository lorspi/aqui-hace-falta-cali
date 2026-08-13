import { describe, it, expect } from "vitest";
import {
  validateOfferInput,
  type OfferInput,
} from "../../convex/offerValidation";

// ============================================================================
// Unit Tests for CreateOfferModal form validation
// These test the validation logic extracted into convex/offerValidation.ts,
// which mirrors the inline validation in CreateOfferModal's validateForm().
//
// **Validates: Requirements 2.2, 2.4, 2.6, 2.8**
// ============================================================================

/** Helper: build a fully valid offer input for baseline tests. */
function buildValidInput(overrides: Partial<OfferInput> = {}): OfferInput {
  return {
    title: "Centro de acopio - Alimentos",
    description: "Ofrecemos alimentos no perecederos y agua embotellada.",
    categories: ["ALIMENTOS"],
    resources: [],
    address: "Calle 5 con Carrera 44",
    neighborhood: "San Fernando",
    cityId: "cali",
    latitude: 3.4516,
    longitude: -76.532,
    contactName: "María González",
    ...overrides,
  };
}

// ============================================================================
// Section 1: Required field validation
// ============================================================================

describe("CreateOfferModal — Required field validation", () => {
  it("should pass validation with all required fields present", () => {
    const result = validateOfferInput(buildValidInput());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject when title is missing", () => {
    const input = buildValidInput();
    delete (input as any).title;
    const result = validateOfferInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "title")).toBe(true);
  });

  it("should reject when title is empty string", () => {
    const result = validateOfferInput(buildValidInput({ title: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "title")).toBe(true);
  });

  it("should reject when title is only whitespace", () => {
    const result = validateOfferInput(buildValidInput({ title: "   " }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "title")).toBe(true);
  });

  it("should reject when description is missing", () => {
    const input = buildValidInput();
    delete (input as any).description;
    const result = validateOfferInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "description")).toBe(true);
  });

  it("should reject when categories is empty array", () => {
    const result = validateOfferInput(buildValidInput({ categories: [] }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "categories")).toBe(true);
  });

  it("should reject when address is missing", () => {
    const input = buildValidInput();
    delete (input as any).address;
    const result = validateOfferInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "address")).toBe(true);
  });

  it("should reject when neighborhood is missing", () => {
    const input = buildValidInput();
    delete (input as any).neighborhood;
    const result = validateOfferInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "neighborhood")).toBe(true);
  });

  it("should reject when contactName is missing", () => {
    const input = buildValidInput();
    delete (input as any).contactName;
    const result = validateOfferInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "contactName")).toBe(true);
  });

  it("should reject when latitude is not provided", () => {
    const input = buildValidInput();
    delete (input as any).latitude;
    const result = validateOfferInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "latitude")).toBe(true);
  });

  it("should reject when longitude is not provided", () => {
    const input = buildValidInput();
    delete (input as any).longitude;
    const result = validateOfferInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "longitude")).toBe(true);
  });
});

// ============================================================================
// Section 2: Max length validation
// ============================================================================

describe("CreateOfferModal — Max length validation", () => {
  it("should reject title longer than 120 characters", () => {
    const longTitle = "A".repeat(121);
    const result = validateOfferInput(buildValidInput({ title: longTitle }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "title")).toBe(true);
  });

  it("should accept title at exactly 120 characters", () => {
    const exactTitle = "A".repeat(120);
    const result = validateOfferInput(buildValidInput({ title: exactTitle }));
    expect(result.valid).toBe(true);
  });

  it("should reject description longer than 1000 characters", () => {
    const longDesc = "B".repeat(1001);
    const result = validateOfferInput(buildValidInput({ description: longDesc }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "description")).toBe(true);
  });

  it("should accept description at exactly 1000 characters", () => {
    const exactDesc = "B".repeat(1000);
    const result = validateOfferInput(buildValidInput({ description: exactDesc }));
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// Section 3: Valid complete input passes validation
// ============================================================================

describe("CreateOfferModal — Complete valid input acceptance", () => {
  it("should accept input with all optional fields provided", () => {
    const result = validateOfferInput(
      buildValidInput({
        contactPhone: "3124448821",
        contactWhatsapp: "3155550192",
        contactEmail: "contacto@org.co",
        organizationName: "Cruz Roja",
        operatingHours: "8:00 a.m. - 5:00 p.m.",
        resources: [
          { type: "ALIMENTOS", description: "Arroz integral", quantity: 50, unit: "kg" },
          { type: "AGUA", description: "Agua embotellada 500ml", quantity: 200, unit: "botellas" },
        ],
      })
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should accept input with no resources (empty array)", () => {
    const result = validateOfferInput(buildValidInput({ resources: [] }));
    expect(result.valid).toBe(true);
  });

  it("should accept input with no resources (undefined)", () => {
    const result = validateOfferInput(buildValidInput({ resources: undefined }));
    expect(result.valid).toBe(true);
  });

  it("should accept multiple categories", () => {
    const result = validateOfferInput(
      buildValidInput({ categories: ["ALIMENTOS", "AGUA", "ROPA"] })
    );
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// Section 4: Geocoding trigger and form reset (behavioral notes)
// ============================================================================

describe("CreateOfferModal — Geocoding and form reset (behavioral documentation)", () => {
  // The geocoding trigger (address >= 5 chars) and success confirmation + form reset
  // are tested via manual verification since they depend on React component state,
  // useEffect hooks, and the Convex useMutation hook.
  //
  // The validation logic ensures:
  // - If lat/lng is not set, validation fails (which mirrors the form preventing submission
  //   when geocoding hasn't resolved and no map location was picked).
  //
  // The form reset behavior is handled by the component's resetForm() function
  // after a successful mutation call.

  it("should reject submission when latitude is missing (simulating no geocoding result)", () => {
    const input = buildValidInput();
    delete (input as any).latitude;
    const result = validateOfferInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "latitude")).toBe(true);
  });

  it("should reject submission when longitude is missing (simulating no geocoding result)", () => {
    const input = buildValidInput();
    delete (input as any).longitude;
    const result = validateOfferInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "longitude")).toBe(true);
  });
});
