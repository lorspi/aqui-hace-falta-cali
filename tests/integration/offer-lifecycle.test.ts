import { describe, it, expect } from "vitest";
import {
  validateOfferInput,
  createOfferDocument,
} from "../../convex/offerValidation";
import {
  computeVerifyResult,
  computeArchiveResult,
  computeOfferStatusFromResources,
  isValidStatusTransition,
  isValidOfferStatus,
  computeReportDecision,
  canModerate,
} from "../../convex/offerStatusLogic";
import {
  isOfferVisible,
  isNeedVisible,
  filterOffers,
} from "../../src/utils/offerFilters";
import type { Offer, ViewMode } from "../../src/types";

// ============================================================================
// Helpers
// ============================================================================

function makeValidOfferInput() {
  return {
    title: "Refugio disponible con capacidad para 20 personas",
    description: "Espacio seguro con baños, cocina y dormitorios disponibles para familias desplazadas.",
    categories: ["ALOJAMIENTO" as const, "ALIMENTOS" as const],
    resources: [
      { type: "ALOJAMIENTO", description: "Camas disponibles", quantity: 20, unit: "camas" },
      { type: "ALIMENTOS", description: "Raciones de comida", quantity: 100, unit: "porciones" },
    ],
    address: "Calle 5 #23-45, Barrio San Antonio",
    neighborhood: "San Antonio",
    cityId: "cali",
    latitude: 3.4516,
    longitude: -76.532,
    contactName: "María López",
    contactPhone: "+573001234567",
    contactWhatsapp: "573001234567",
    contactEmail: "maria@example.com",
    organizationName: "Fundación Ayuda Cali",
    operatingHours: "Lunes a Viernes 8:00-18:00",
  };
}

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: "offer-1",
    cityId: "cali",
    title: "Refugio disponible",
    description: "Espacio seguro para familias",
    categories: ["ALOJAMIENTO"],
    resources: [],
    address: "Calle 5 #23-45",
    neighborhood: "San Antonio",
    latitude: 3.4516,
    longitude: -76.532,
    offerStatus: "AVAILABLE",
    verificationStatus: "PENDING_VERIFICATION",
    contactName: "María López",
    contactPhone: "+573001234567",
    contactWhatsapp: "573001234567",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
    ...overrides,
  };
}

// ============================================================================
// Integration: Full offer lifecycle
// **Validates: Requirements 2.1, 6.3, 7.1, 8.3**
// ============================================================================

describe("Integration: Full offer lifecycle", () => {
  it("create → verify → update status → archive", () => {
    // 1. CREATE: validate input and produce document
    const input = makeValidOfferInput();
    const validation = validateOfferInput(input);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    const doc = createOfferDocument(input);
    expect(doc.verificationStatus).toBe("PENDING_VERIFICATION");
    expect(doc.offerStatus).toBe("AVAILABLE");
    expect(doc.title).toBe(input.title);
    expect(doc.categories).toEqual(input.categories);
    expect(doc.resources).toHaveLength(2);
    expect(doc.resources[0].status).toBe("AVAILABLE");
    expect(doc.createdAt).toBeDefined();
    expect(doc.updatedAt).toBeDefined();

    // 2. VERIFY: compute moderation result
    const verifyResult = computeVerifyResult(
      "moderador@ciudad.gov.co",
      "Carlos Moderador",
      doc.title,
      "2024-01-16T09:00:00.000Z"
    );
    expect(verifyResult.newVerificationStatus).toBe("VERIFIED");
    expect(verifyResult.verifiedBy).toBe("moderador@ciudad.gov.co");
    expect(verifyResult.verifiedAt).toBe("2024-01-16T09:00:00.000Z");
    expect(verifyResult.auditAction).toBe("MODERATE_OFFER");
    expect(verifyResult.auditDetails).toContain(doc.title);
    expect(verifyResult.auditDetails).toContain("verificada");

    // 3. UPDATE STATUS: transition to PARTIALLY_AVAILABLE via resource update
    // Simulate: one resource FULFILLED, one still PENDING
    const resourceStates = [
      { status: "FULFILLED" },
      { status: "PENDING" },
    ];
    const computedStatus = computeOfferStatusFromResources(resourceStates);
    expect(computedStatus).toBe("PARTIALLY_AVAILABLE");

    // Verify that PARTIALLY_AVAILABLE → CLOSED is valid
    expect(isValidStatusTransition("PARTIALLY_AVAILABLE", "CLOSED")).toBe(true);

    // 4. ARCHIVE: compute archive result
    const archiveResult = computeArchiveResult(
      "admin@ciudad.gov.co",
      "Admin Principal",
      doc.title,
      "2024-01-20T15:00:00.000Z"
    );
    expect(archiveResult.newVerificationStatus).toBe("ARCHIVED");
    expect(archiveResult.verifiedBy).toBe("admin@ciudad.gov.co");
    expect(archiveResult.verifiedAt).toBe("2024-01-20T15:00:00.000Z");
    expect(archiveResult.auditAction).toBe("MODERATE_OFFER");
    expect(archiveResult.auditDetails).toContain("archivada");
  });

  it("create → update resources → auto-compute EXHAUSTED", () => {
    // 1. Create offer with resources
    const input = makeValidOfferInput();
    const validation = validateOfferInput(input);
    expect(validation.valid).toBe(true);

    const doc = createOfferDocument(input);
    expect(doc.offerStatus).toBe("AVAILABLE");
    expect(doc.resources).toHaveLength(2);

    // 2. Set all resources to FULFILLED
    const allFulfilledResources = doc.resources.map(() => ({ status: "FULFILLED" }));
    const computedStatus = computeOfferStatusFromResources(allFulfilledResources);

    // 3. Verify auto-computed status is EXHAUSTED
    expect(computedStatus).toBe("EXHAUSTED");
  });

  it("create → partial fulfillment → auto-compute PARTIALLY_AVAILABLE", () => {
    const input = makeValidOfferInput();
    const doc = createOfferDocument(input);

    // Mix of PENDING and FULFILLED
    const mixedResources = [
      { status: "PENDING" },
      { status: "FULFILLED" },
    ];
    const computedStatus = computeOfferStatusFromResources(mixedResources);
    expect(computedStatus).toBe("PARTIALLY_AVAILABLE");
  });

  it("create → all resources still PENDING → status remains AVAILABLE", () => {
    const input = makeValidOfferInput();
    const doc = createOfferDocument(input);

    const allPending = doc.resources.map(() => ({ status: "PENDING" }));
    const computedStatus = computeOfferStatusFromResources(allPending);
    expect(computedStatus).toBe("AVAILABLE");
  });

  it("CLOSED offer cannot be reactivated", () => {
    // 1. Offer exists (simulated as CLOSED)
    // 2. Attempt any transition from CLOSED
    expect(isValidStatusTransition("CLOSED", "AVAILABLE")).toBe(false);
    expect(isValidStatusTransition("CLOSED", "PARTIALLY_AVAILABLE")).toBe(false);
    expect(isValidStatusTransition("CLOSED", "EXHAUSTED")).toBe(false);
    expect(isValidStatusTransition("CLOSED", "CLOSED")).toBe(false);
  });

  it("valid transitions from non-CLOSED states are accepted", () => {
    // AVAILABLE → any valid status
    expect(isValidStatusTransition("AVAILABLE", "PARTIALLY_AVAILABLE")).toBe(true);
    expect(isValidStatusTransition("AVAILABLE", "EXHAUSTED")).toBe(true);
    expect(isValidStatusTransition("AVAILABLE", "CLOSED")).toBe(true);

    // PARTIALLY_AVAILABLE → other valid statuses
    expect(isValidStatusTransition("PARTIALLY_AVAILABLE", "AVAILABLE")).toBe(true);
    expect(isValidStatusTransition("PARTIALLY_AVAILABLE", "EXHAUSTED")).toBe(true);
    expect(isValidStatusTransition("PARTIALLY_AVAILABLE", "CLOSED")).toBe(true);

    // EXHAUSTED → other valid statuses
    expect(isValidStatusTransition("EXHAUSTED", "AVAILABLE")).toBe(true);
    expect(isValidStatusTransition("EXHAUSTED", "CLOSED")).toBe(true);
  });

  it("invalid target status values are rejected", () => {
    expect(isValidOfferStatus("INVALID")).toBe(false);
    expect(isValidOfferStatus("OPEN")).toBe(false);
    expect(isValidOfferStatus("")).toBe(false);
    expect(isValidStatusTransition("AVAILABLE", "INVALID")).toBe(false);
  });

  it("report on non-VERIFIED offer sets REPORTED status", () => {
    const decision = computeReportDecision("PENDING_VERIFICATION");
    expect(decision.shouldCreateReport).toBe(true);
    expect(decision.shouldUpdateVerificationStatus).toBe(true);
    expect(decision.newVerificationStatus).toBe("REPORTED");
  });

  it("report on VERIFIED offer preserves verification status", () => {
    const decision = computeReportDecision("VERIFIED");
    expect(decision.shouldCreateReport).toBe(true);
    expect(decision.shouldUpdateVerificationStatus).toBe(false);
    expect(decision.newVerificationStatus).toBeNull();
  });

  it("moderation requires ADMIN or MODERATOR role", () => {
    expect(canModerate("ADMIN")).toBe(true);
    expect(canModerate("MODERATOR")).toBe(true);
    expect(canModerate("USER")).toBe(false);
    expect(canModerate("VIEWER")).toBe(false);
    expect(canModerate("")).toBe(false);
  });
});

// ============================================================================
// Integration: ViewMode query selection
// **Validates: Requirements 3.2, 4.1, 8.3**
// ============================================================================

describe("Integration: ViewMode query selection", () => {
  it("NEEDS mode: needs visible, offers not visible", () => {
    const viewMode: ViewMode = "NEEDS";

    // Needs should be visible
    expect(isNeedVisible(viewMode)).toBe(true);

    // Offers should NOT be visible regardless of their status
    const verifiedAvailableOffer = makeOffer({
      verificationStatus: "VERIFIED",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(verifiedAvailableOffer, viewMode)).toBe(false);

    const pendingOffer = makeOffer({
      verificationStatus: "PENDING_VERIFICATION",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(pendingOffer, viewMode)).toBe(false);
  });

  it("OFFERS mode: offers visible, needs not visible", () => {
    const viewMode: ViewMode = "OFFERS";

    // Needs should NOT be visible
    expect(isNeedVisible(viewMode)).toBe(false);

    // Valid offers should be visible
    const verifiedAvailableOffer = makeOffer({
      verificationStatus: "VERIFIED",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(verifiedAvailableOffer, viewMode)).toBe(true);

    const pendingPartialOffer = makeOffer({
      verificationStatus: "PENDING_VERIFICATION",
      offerStatus: "PARTIALLY_AVAILABLE",
    });
    expect(isOfferVisible(pendingPartialOffer, viewMode)).toBe(true);
  });

  it("ALL mode: both needs and eligible offers visible", () => {
    const viewMode: ViewMode = "ALL";

    // Needs visible
    expect(isNeedVisible(viewMode)).toBe(true);

    // Valid offers visible
    const verifiedOffer = makeOffer({
      verificationStatus: "VERIFIED",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(verifiedOffer, viewMode)).toBe(true);
  });

  it("OFFERS mode hides EXHAUSTED/CLOSED offers", () => {
    const viewMode: ViewMode = "OFFERS";

    const exhaustedOffer = makeOffer({
      verificationStatus: "VERIFIED",
      offerStatus: "EXHAUSTED",
    });
    expect(isOfferVisible(exhaustedOffer, viewMode)).toBe(false);

    const closedOffer = makeOffer({
      verificationStatus: "VERIFIED",
      offerStatus: "CLOSED",
    });
    expect(isOfferVisible(closedOffer, viewMode)).toBe(false);
  });

  it("ALL mode hides ARCHIVED/REPORTED offers", () => {
    const viewMode: ViewMode = "ALL";

    const archivedOffer = makeOffer({
      verificationStatus: "ARCHIVED",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(archivedOffer, viewMode)).toBe(false);

    const reportedOffer = makeOffer({
      verificationStatus: "REPORTED",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(reportedOffer, viewMode)).toBe(false);
  });

  it("category filter in ALL mode applies to offers correctly", () => {
    const offers: Offer[] = [
      makeOffer({ id: "o1", categories: ["ALIMENTOS"] }),
      makeOffer({ id: "o2", categories: ["ALOJAMIENTO"] }),
      makeOffer({ id: "o3", categories: ["ALIMENTOS", "AGUA"] }),
    ];

    const filtered = filterOffers(offers, { category: "ALIMENTOS" });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((o) => o.categories.includes("ALIMENTOS"))).toBe(true);
  });
});

// ============================================================================
// Integration: Map marker visibility per ViewMode
// **Validates: Requirements 4.1, 7.3**
// ============================================================================

describe("Integration: Map marker visibility per ViewMode", () => {
  it("VERIFIED + AVAILABLE offer visible in OFFERS mode", () => {
    const offer = makeOffer({
      verificationStatus: "VERIFIED",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(offer, "OFFERS")).toBe(true);
  });

  it("VERIFIED + AVAILABLE offer visible in ALL mode", () => {
    const offer = makeOffer({
      verificationStatus: "VERIFIED",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(offer, "ALL")).toBe(true);
  });

  it("VERIFIED + EXHAUSTED offer NOT visible (marker removed)", () => {
    const offer = makeOffer({
      verificationStatus: "VERIFIED",
      offerStatus: "EXHAUSTED",
    });
    // Not visible in any mode
    expect(isOfferVisible(offer, "OFFERS")).toBe(false);
    expect(isOfferVisible(offer, "ALL")).toBe(false);
    expect(isOfferVisible(offer, "NEEDS")).toBe(false);
  });

  it("VERIFIED + CLOSED offer NOT visible (marker removed)", () => {
    const offer = makeOffer({
      verificationStatus: "VERIFIED",
      offerStatus: "CLOSED",
    });
    expect(isOfferVisible(offer, "OFFERS")).toBe(false);
    expect(isOfferVisible(offer, "ALL")).toBe(false);
  });

  it("PENDING_VERIFICATION + AVAILABLE visible in OFFERS mode", () => {
    const offer = makeOffer({
      verificationStatus: "PENDING_VERIFICATION",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(offer, "OFFERS")).toBe(true);
  });

  it("PENDING_VERIFICATION + AVAILABLE visible in ALL mode", () => {
    const offer = makeOffer({
      verificationStatus: "PENDING_VERIFICATION",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(offer, "ALL")).toBe(true);
  });

  it("PENDING_VERIFICATION + PARTIALLY_AVAILABLE visible in OFFERS mode", () => {
    const offer = makeOffer({
      verificationStatus: "PENDING_VERIFICATION",
      offerStatus: "PARTIALLY_AVAILABLE",
    });
    expect(isOfferVisible(offer, "OFFERS")).toBe(true);
  });

  it("REPORTED offer NOT visible regardless of ViewMode", () => {
    const offer = makeOffer({
      verificationStatus: "REPORTED",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(offer, "NEEDS")).toBe(false);
    expect(isOfferVisible(offer, "OFFERS")).toBe(false);
    expect(isOfferVisible(offer, "ALL")).toBe(false);
  });

  it("ARCHIVED offer NOT visible regardless of ViewMode", () => {
    const offer = makeOffer({
      verificationStatus: "ARCHIVED",
      offerStatus: "AVAILABLE",
    });
    expect(isOfferVisible(offer, "NEEDS")).toBe(false);
    expect(isOfferVisible(offer, "OFFERS")).toBe(false);
    expect(isOfferVisible(offer, "ALL")).toBe(false);
  });

  it("NEEDS mode hides all offer markers", () => {
    const offers: Offer[] = [
      makeOffer({ id: "o1", verificationStatus: "VERIFIED", offerStatus: "AVAILABLE" }),
      makeOffer({ id: "o2", verificationStatus: "PENDING_VERIFICATION", offerStatus: "PARTIALLY_AVAILABLE" }),
      makeOffer({ id: "o3", verificationStatus: "VERIFIED", offerStatus: "PARTIALLY_AVAILABLE" }),
    ];

    // All offers should be hidden in NEEDS mode
    const visibleOffers = offers.filter((o) => isOfferVisible(o, "NEEDS"));
    expect(visibleOffers).toHaveLength(0);
  });

  it("OFFERS mode shows only eligible offers as markers", () => {
    const offers: Offer[] = [
      makeOffer({ id: "o1", verificationStatus: "VERIFIED", offerStatus: "AVAILABLE" }),
      makeOffer({ id: "o2", verificationStatus: "VERIFIED", offerStatus: "EXHAUSTED" }),
      makeOffer({ id: "o3", verificationStatus: "ARCHIVED", offerStatus: "AVAILABLE" }),
      makeOffer({ id: "o4", verificationStatus: "PENDING_VERIFICATION", offerStatus: "PARTIALLY_AVAILABLE" }),
      makeOffer({ id: "o5", verificationStatus: "REPORTED", offerStatus: "AVAILABLE" }),
    ];

    const visibleOffers = offers.filter((o) => isOfferVisible(o, "OFFERS"));
    expect(visibleOffers).toHaveLength(2); // o1 and o4
    expect(visibleOffers.map((o) => o.id)).toEqual(["o1", "o4"]);
  });

  it("ALL mode shows eligible offers alongside needs visibility", () => {
    const offers: Offer[] = [
      makeOffer({ id: "o1", verificationStatus: "VERIFIED", offerStatus: "AVAILABLE" }),
      makeOffer({ id: "o2", verificationStatus: "VERIFIED", offerStatus: "CLOSED" }),
      makeOffer({ id: "o3", verificationStatus: "PENDING_VERIFICATION", offerStatus: "AVAILABLE" }),
    ];

    // Both needs and eligible offers visible in ALL mode
    expect(isNeedVisible("ALL")).toBe(true);

    const visibleOffers = offers.filter((o) => isOfferVisible(o, "ALL"));
    expect(visibleOffers).toHaveLength(2); // o1 and o3
    expect(visibleOffers.map((o) => o.id)).toEqual(["o1", "o3"]);
  });
});
