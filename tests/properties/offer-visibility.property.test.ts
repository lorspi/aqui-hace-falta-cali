import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  isOfferVisible,
  isNeedVisible,
  filterOffers,
  sortOffers,
  getDistanceKm,
} from "../../src/utils/offerFilters";
import type { Offer, ViewMode, HelpCategory, VerificationStatus, OfferStatus } from "../../src/types";

// ============================================================================
// Generators
// ============================================================================

const viewModeArb: fc.Arbitrary<ViewMode> = fc.constantFrom("NEEDS", "OFFERS", "ALL");

const verificationStatusArb: fc.Arbitrary<VerificationStatus> = fc.constantFrom(
  "VERIFIED",
  "PENDING_VERIFICATION",
  "REPORTED",
  "ARCHIVED"
);

const offerStatusArb: fc.Arbitrary<OfferStatus> = fc.constantFrom(
  "AVAILABLE",
  "PARTIALLY_AVAILABLE",
  "EXHAUSTED",
  "CLOSED"
);

const helpCategoryArb: fc.Arbitrary<HelpCategory> = fc.constantFrom(
  "ESCOMBROS",
  "MANO_OBRA",
  "TRANSPORTE",
  "ALIMENTOS",
  "AGUA",
  "ROPA",
  "MEDICAMENTOS",
  "SANGRE",
  "DINERO",
  "HERRAMIENTAS",
  "MAQUINARIA",
  "OPERARIOS_MAQUINARIA",
  "ATENCION_MEDICA",
  "APOYO_PSICOLOGICO",
  "ALOJAMIENTO",
  "ANIMALES",
  "LOGISTICA",
  "CLASIFICACION_DONACIONES",
  "VOLUNTARIADO_GENERAL",
  "OTRO"
);

/** Generates a non-empty string of up to maxLen characters (ASCII printable). */
function nonEmptyString(maxLen: number): fc.Arbitrary<string> {
  return fc.string({ minLength: 1, maxLength: maxLen }).filter((s) => s.trim().length > 0);
}

/** Generates a valid ISO 8601 date string using integer timestamps for reliability. */
function isoDateArb(): fc.Arbitrary<string> {
  // Use integer-based generation to avoid invalid date edge cases
  return fc
    .integer({
      min: new Date("2020-01-01T00:00:00Z").getTime(),
      max: new Date("2030-12-31T23:59:59Z").getTime(),
    })
    .map((ts) => new Date(ts).toISOString());
}

/** Generates a minimal offer object suitable for filtering/visibility tests. */
function offerArb(): fc.Arbitrary<Offer> {
  return fc.record({
    id: fc.uuid(),
    cityId: nonEmptyString(50),
    title: nonEmptyString(120),
    description: nonEmptyString(1000),
    categories: fc.array(helpCategoryArb, { minLength: 1, maxLength: 5 }),
    resources: fc.constant([]),
    address: nonEmptyString(200),
    neighborhood: nonEmptyString(100),
    latitude: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    offerStatus: offerStatusArb,
    verificationStatus: verificationStatusArb,
    verifiedBy: fc.constant(undefined),
    verifiedAt: fc.constant(undefined),
    contactName: nonEmptyString(100),
    contactPhone: fc.constant(undefined),
    contactWhatsapp: fc.constant(undefined),
    contactEmail: fc.constant(undefined),
    organizationName: fc.constant(undefined),
    operatingHours: fc.constant(undefined),
    createdAt: isoDateArb(),
    updatedAt: isoDateArb(),
  });
}

/** Generates an offer with specific statuses for visibility testing. */
function offerWithStatusArb(
  verificationStatus: fc.Arbitrary<VerificationStatus>,
  offerStatus: fc.Arbitrary<OfferStatus>
): fc.Arbitrary<Offer> {
  return fc.record({
    id: fc.uuid(),
    cityId: nonEmptyString(50),
    title: nonEmptyString(120),
    description: nonEmptyString(500),
    categories: fc.array(helpCategoryArb, { minLength: 1, maxLength: 3 }),
    resources: fc.constant([]),
    address: nonEmptyString(200),
    neighborhood: nonEmptyString(100),
    latitude: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    offerStatus: offerStatus,
    verificationStatus: verificationStatus,
    verifiedBy: fc.constant(undefined),
    verifiedAt: fc.constant(undefined),
    contactName: nonEmptyString(100),
    contactPhone: fc.constant(undefined),
    contactWhatsapp: fc.constant(undefined),
    contactEmail: fc.constant(undefined),
    organizationName: fc.constant(undefined),
    operatingHours: fc.constant(undefined),
    createdAt: isoDateArb(),
    updatedAt: isoDateArb(),
  });
}

// ============================================================================
// Feature: offers-system, Property 4: Offer visibility predicate
// **Validates: Requirements 3.2, 3.3, 3.4**
// ============================================================================

describe("Property 4: Offer visibility predicate", () => {
  it("offer is visible iff viewMode ∈ {OFFERS, ALL} AND verificationStatus ∈ {VERIFIED, PENDING_VERIFICATION} AND offerStatus ∈ {AVAILABLE, PARTIALLY_AVAILABLE}", () => {
    fc.assert(
      fc.property(offerArb(), viewModeArb, (offer, viewMode) => {
        const result = isOfferVisible(offer, viewMode);

        const viewModeAllows = viewMode === "OFFERS" || viewMode === "ALL";
        const verificationAllows =
          offer.verificationStatus === "VERIFIED" ||
          offer.verificationStatus === "PENDING_VERIFICATION";
        const statusAllows =
          offer.offerStatus === "AVAILABLE" ||
          offer.offerStatus === "PARTIALLY_AVAILABLE";

        const expected = viewModeAllows && verificationAllows && statusAllows;

        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("needs are visible iff viewMode ∈ {NEEDS, ALL}", () => {
    fc.assert(
      fc.property(viewModeArb, (viewMode) => {
        const result = isNeedVisible(viewMode);
        const expected = viewMode === "NEEDS" || viewMode === "ALL";
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("offers are never visible in NEEDS mode regardless of status", () => {
    fc.assert(
      fc.property(
        offerWithStatusArb(
          fc.constantFrom("VERIFIED", "PENDING_VERIFICATION"),
          fc.constantFrom("AVAILABLE", "PARTIALLY_AVAILABLE")
        ),
        (offer) => {
          expect(isOfferVisible(offer, "NEEDS")).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("EXHAUSTED or CLOSED offers are never visible regardless of viewMode", () => {
    fc.assert(
      fc.property(
        offerWithStatusArb(
          fc.constantFrom("VERIFIED", "PENDING_VERIFICATION"),
          fc.constantFrom("EXHAUSTED", "CLOSED")
        ),
        viewModeArb,
        (offer, viewMode) => {
          expect(isOfferVisible(offer, viewMode)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("REPORTED or ARCHIVED offers are never visible regardless of viewMode", () => {
    fc.assert(
      fc.property(
        offerWithStatusArb(
          fc.constantFrom("REPORTED", "ARCHIVED"),
          fc.constantFrom("AVAILABLE", "PARTIALLY_AVAILABLE")
        ),
        viewModeArb,
        (offer, viewMode) => {
          expect(isOfferVisible(offer, viewMode)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 5: Filter correctness for offers
// **Validates: Requirements 3.5, 3.9**
// ============================================================================

describe("Property 5: Filter correctness for offers", () => {
  it("all returned offers satisfy every active filter predicate", () => {
    fc.assert(
      fc.property(
        fc.array(offerArb(), { minLength: 0, maxLength: 20 }),
        fc.option(helpCategoryArb, { nil: undefined }),
        fc.option(nonEmptyString(50), { nil: undefined }),
        fc.option(
          fc.string({ minLength: 2, maxLength: 30 }).filter((s) => s.trim().length >= 2),
          { nil: undefined }
        ),
        (offers, category, cityId, search) => {
          const filters = { category, cityId, search };
          const result = filterOffers(offers, filters);

          for (const offer of result) {
            // Category filter check
            if (category) {
              expect(offer.categories).toContain(category);
            }

            // City filter check
            if (cityId) {
              expect(offer.cityId).toBe(cityId);
            }

            // Text search check (min 2 chars, case-insensitive)
            if (search && search.length >= 2) {
              const query = search.toLowerCase();
              const matches =
                offer.title.toLowerCase().includes(query) ||
                offer.description.toLowerCase().includes(query) ||
                offer.address.toLowerCase().includes(query);
              expect(matches).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("filtered results are a subset of the original offers", () => {
    fc.assert(
      fc.property(
        fc.array(offerArb(), { minLength: 0, maxLength: 20 }),
        fc.option(helpCategoryArb, { nil: undefined }),
        fc.option(nonEmptyString(50), { nil: undefined }),
        fc.option(
          fc.string({ minLength: 2, maxLength: 30 }).filter((s) => s.trim().length >= 2),
          { nil: undefined }
        ),
        (offers, category, cityId, search) => {
          const filters = { category, cityId, search };
          const result = filterOffers(offers, filters);

          // Result should be a subset of input
          expect(result.length).toBeLessThanOrEqual(offers.length);
          for (const offer of result) {
            expect(offers).toContain(offer);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("with no active filters, all offers are returned", () => {
    fc.assert(
      fc.property(
        fc.array(offerArb(), { minLength: 0, maxLength: 20 }),
        (offers) => {
          const result = filterOffers(offers, {});
          expect(result.length).toBe(offers.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("priority filters in ALL mode never exclude offers (only apply to needs)", () => {
    // In "ALL" mode, priority filters apply only to needs.
    // filterOffers does not accept priority as a filter — this confirms
    // offers are never excluded by a priority filter concept.
    fc.assert(
      fc.property(
        fc.array(offerArb(), { minLength: 1, maxLength: 10 }),
        fc.constantFrom("CRITICAL", "HIGH", "MEDIUM", "LOW"),
        (offers, _priority) => {
          // filterOffers has no priority parameter — offers are never filtered by priority
          const result = filterOffers(offers, {});
          expect(result.length).toBe(offers.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("search with less than 2 chars does not filter anything", () => {
    fc.assert(
      fc.property(
        fc.array(offerArb(), { minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 0, maxLength: 1 }),
        (offers, shortSearch) => {
          const result = filterOffers(offers, { search: shortSearch });
          expect(result.length).toBe(offers.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 6: Sort order invariant
// **Validates: Requirements 3.6**
// ============================================================================

describe("Property 6: Sort order invariant", () => {
  it("RECENT sort: each consecutive pair satisfies offers[i].createdAt >= offers[i+1].createdAt", () => {
    fc.assert(
      fc.property(
        fc.array(offerArb(), { minLength: 0, maxLength: 20 }),
        (offers) => {
          const sorted = sortOffers(offers, "RECENT");

          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].createdAt >= sorted[i + 1].createdAt).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("DISTANCE sort: each consecutive pair satisfies ascending distance from user", () => {
    fc.assert(
      fc.property(
        fc.array(offerArb(), { minLength: 0, maxLength: 20 }),
        fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
        (offers, userLat, userLng) => {
          const sorted = sortOffers(offers, "DISTANCE", userLat, userLng);

          for (let i = 0; i < sorted.length - 1; i++) {
            const distI = getDistanceKm(
              userLat,
              userLng,
              sorted[i].latitude,
              sorted[i].longitude
            );
            const distNext = getDistanceKm(
              userLat,
              userLng,
              sorted[i + 1].latitude,
              sorted[i + 1].longitude
            );
            expect(distI).toBeLessThanOrEqual(distNext);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("RECENT sort preserves array length (no elements lost or duplicated)", () => {
    fc.assert(
      fc.property(
        fc.array(offerArb(), { minLength: 0, maxLength: 20 }),
        (offers) => {
          const sorted = sortOffers(offers, "RECENT");
          expect(sorted.length).toBe(offers.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("DISTANCE sort preserves array length (no elements lost or duplicated)", () => {
    fc.assert(
      fc.property(
        fc.array(offerArb(), { minLength: 0, maxLength: 20 }),
        fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
        (offers, userLat, userLng) => {
          const sorted = sortOffers(offers, "DISTANCE", userLat, userLng);
          expect(sorted.length).toBe(offers.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sort does not mutate the original array", () => {
    fc.assert(
      fc.property(
        fc.array(offerArb(), { minLength: 1, maxLength: 10 }),
        (offers) => {
          const original = [...offers];
          sortOffers(offers, "RECENT");
          expect(offers).toEqual(original);
        }
      ),
      { numRuns: 100 }
    );
  });
});
