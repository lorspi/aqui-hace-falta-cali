import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  validateOfferInput,
  createOfferDocument,
  type OfferInput,
  type OfferResourceInput,
} from "../../convex/offerValidation";

// ============================================================================
// Generators
// ============================================================================

/** Generates a non-empty trimmed string of up to `maxLen` characters. */
function nonEmptyString(maxLen: number): fc.Arbitrary<string> {
  return fc
    .string({ minLength: 1, maxLength: maxLen })
    .filter((s) => s.trim().length > 0);
}

/** Generates a valid resource item within constraints. */
function validResourceArb(): fc.Arbitrary<OfferResourceInput> {
  return fc.record({
    type: nonEmptyString(30),
    description: fc.string({ minLength: 0, maxLength: 200 }),
    quantity: fc.option(fc.integer({ min: 1, max: 999999 }), { nil: undefined }),
    unit: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  });
}

/** Generates a valid complete offer input. */
function validOfferInputArb(): fc.Arbitrary<OfferInput> {
  return fc.record({
    title: nonEmptyString(120),
    description: nonEmptyString(1000),
    categories: fc.array(nonEmptyString(50), { minLength: 1, maxLength: 5 }),
    resources: fc.option(fc.array(validResourceArb(), { minLength: 0, maxLength: 20 }), {
      nil: undefined,
    }),
    address: nonEmptyString(200),
    neighborhood: nonEmptyString(100),
    cityId: nonEmptyString(50),
    latitude: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    contactName: nonEmptyString(100),
    contactPhone: fc.option(fc.string({ minLength: 7, maxLength: 15 }), { nil: undefined }),
    contactWhatsapp: fc.option(fc.string({ minLength: 7, maxLength: 15 }), { nil: undefined }),
    contactEmail: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
    organizationName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    operatingHours: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  });
}

// ============================================================================
// Feature: offers-system, Property 1: Offer creation round-trip with defaults
// **Validates: Requirements 1.1, 1.4, 2.1**
// ============================================================================

describe("Property 1: Offer creation round-trip with defaults", () => {
  it("should preserve all input values and set correct defaults for any valid offer input", () => {
    fc.assert(
      fc.property(validOfferInputArb(), (input) => {
        // Validation should pass
        const validationResult = validateOfferInput(input);
        expect(validationResult.valid).toBe(true);
        expect(validationResult.errors).toHaveLength(0);

        // Create offer document
        const doc = createOfferDocument(input);

        // Input fields preserved
        expect(doc.title).toBe(input.title);
        expect(doc.description).toBe(input.description);
        expect(doc.categories).toEqual(input.categories);
        expect(doc.address).toBe(input.address);
        expect(doc.neighborhood).toBe(input.neighborhood);
        expect(doc.cityId).toBe(input.cityId);
        expect(doc.latitude).toBe(input.latitude);
        expect(doc.longitude).toBe(input.longitude);
        expect(doc.contactName).toBe(input.contactName);
        expect(doc.contactPhone).toBe(input.contactPhone);
        expect(doc.contactWhatsapp).toBe(input.contactWhatsapp);
        expect(doc.contactEmail).toBe(input.contactEmail);
        expect(doc.organizationName).toBe(input.organizationName);
        expect(doc.operatingHours).toBe(input.operatingHours);

        // Defaults applied
        expect(doc.verificationStatus).toBe("PENDING_VERIFICATION");
        expect(doc.offerStatus).toBe("AVAILABLE");

        // Timestamps are valid ISO 8601
        expect(() => new Date(doc.createdAt)).not.toThrow();
        expect(new Date(doc.createdAt).toISOString()).toBe(doc.createdAt);
        expect(() => new Date(doc.updatedAt)).not.toThrow();
        expect(new Date(doc.updatedAt).toISOString()).toBe(doc.updatedAt);

        // Resources preserved with defaults
        const inputResources = input.resources || [];
        expect(doc.resources).toHaveLength(inputResources.length);
        for (let i = 0; i < inputResources.length; i++) {
          expect(doc.resources[i].type).toBe(inputResources[i].type);
          expect(doc.resources[i].description).toBe(inputResources[i].description || "");
          expect(doc.resources[i].quantity).toBe(inputResources[i].quantity);
          expect(doc.resources[i].unit).toBe(inputResources[i].unit);
          expect(doc.resources[i].status).toBe("AVAILABLE");
          expect(doc.resources[i].id).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 2: Form validation rejects incomplete data
// **Validates: Requirements 2.2, 2.4, 2.7**
// ============================================================================

describe("Property 2: Form validation rejects incomplete data", () => {
  const requiredFields = [
    "title",
    "description",
    "categories",
    "address",
    "neighborhood",
    "cityId",
    "latitude",
    "longitude",
    "contactName",
  ] as const;

  it("should reject input when at least one required field is missing or invalid", () => {
    fc.assert(
      fc.property(
        validOfferInputArb(),
        fc.subarray(requiredFields as unknown as string[], { minLength: 1 }),
        (validInput, fieldsToRemove) => {
          // Create a partial input by removing selected required fields
          const partialInput: Record<string, unknown> = { ...validInput };

          for (const field of fieldsToRemove) {
            if (field === "categories") {
              // Make categories invalid (empty array)
              partialInput[field] = [];
            } else if (field === "latitude" || field === "longitude") {
              // Remove numeric fields
              delete partialInput[field];
            } else {
              // Remove string fields
              delete partialInput[field];
            }
          }

          const result = validateOfferInput(partialInput as Partial<OfferInput>);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject input when required string fields are empty/whitespace", () => {
    fc.assert(
      fc.property(
        validOfferInputArb(),
        fc.constantFrom("title", "description", "address", "neighborhood", "cityId", "contactName"),
        fc.constantFrom("", "   ", "\t", "\n"),
        (validInput, fieldToInvalidate, emptyValue) => {
          const invalidInput = { ...validInput, [fieldToInvalidate]: emptyValue };
          const result = validateOfferInput(invalidInput);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === fieldToInvalidate)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 3: Resource array validation
// **Validates: Requirements 1.6, 2.5**
// ============================================================================

describe("Property 3: Resource array validation", () => {
  it("should accept arrays of 0-20 valid resource items", () => {
    fc.assert(
      fc.property(
        fc.array(validResourceArb(), { minLength: 0, maxLength: 20 }),
        (resources) => {
          const input: OfferInput = {
            title: "Test Offer",
            description: "A valid test offer",
            categories: ["FOOD"],
            resources,
            address: "123 Test Street",
            neighborhood: "Centro",
            cityId: "cali",
            latitude: 3.4516,
            longitude: -76.532,
            contactName: "Test Contact",
          };

          const result = validateOfferInput(input);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject arrays exceeding 20 items", () => {
    fc.assert(
      fc.property(
        fc.array(validResourceArb(), { minLength: 21, maxLength: 50 }),
        (resources) => {
          const input: OfferInput = {
            title: "Test Offer",
            description: "A valid test offer",
            categories: ["FOOD"],
            resources,
            address: "123 Test Street",
            neighborhood: "Centro",
            cityId: "cali",
            latitude: 3.4516,
            longitude: -76.532,
            contactName: "Test Contact",
          };

          const result = validateOfferInput(input);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === "resources")).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject resources with description exceeding 200 chars", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 201, maxLength: 500 }),
        (longDescription) => {
          const resources: OfferResourceInput[] = [
            { type: "FOOD", description: longDescription },
          ];

          const input: OfferInput = {
            title: "Test Offer",
            description: "A valid test offer",
            categories: ["FOOD"],
            resources,
            address: "123 Test Street",
            neighborhood: "Centro",
            cityId: "cali",
            latitude: 3.4516,
            longitude: -76.532,
            contactName: "Test Contact",
          };

          const result = validateOfferInput(input);
          expect(result.valid).toBe(false);
          expect(
            result.errors.some((e) => e.field.includes("description"))
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject resources with quantity outside 1-999999 range", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -1000, max: 0 }),
          fc.integer({ min: 1000000, max: 9999999 })
        ),
        (invalidQuantity) => {
          const resources: OfferResourceInput[] = [
            { type: "FOOD", description: "Valid desc", quantity: invalidQuantity },
          ];

          const input: OfferInput = {
            title: "Test Offer",
            description: "A valid test offer",
            categories: ["FOOD"],
            resources,
            address: "123 Test Street",
            neighborhood: "Centro",
            cityId: "cali",
            latitude: 3.4516,
            longitude: -76.532,
            contactName: "Test Contact",
          };

          const result = validateOfferInput(input);
          expect(result.valid).toBe(false);
          expect(
            result.errors.some((e) => e.field.includes("quantity"))
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject resources with unit exceeding 30 chars", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 31, maxLength: 100 }),
        (longUnit) => {
          const resources: OfferResourceInput[] = [
            { type: "FOOD", description: "Valid desc", quantity: 10, unit: longUnit },
          ];

          const input: OfferInput = {
            title: "Test Offer",
            description: "A valid test offer",
            categories: ["FOOD"],
            resources,
            address: "123 Test Street",
            neighborhood: "Centro",
            cityId: "cali",
            latitude: 3.4516,
            longitude: -76.532,
            contactName: "Test Contact",
          };

          const result = validateOfferInput(input);
          expect(result.valid).toBe(false);
          expect(
            result.errors.some((e) => e.field.includes("unit"))
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
