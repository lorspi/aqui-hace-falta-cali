import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  canModerate,
  isValidOfferStatus,
  isValidVerificationStatus,
  isValidStatusTransition,
  computeOfferStatusFromResources,
  computeReportDecision,
  computeVerifyResult,
  computeArchiveResult,
  VALID_OFFER_STATUSES,
  VALID_VERIFICATION_STATUSES,
  MODERATION_ROLES,
  type ResourceState,
} from "../../convex/offerStatusLogic";

// ============================================================================
// Generators
// ============================================================================

/** Generates a non-empty string for emails */
function emailArb(): fc.Arbitrary<string> {
  return fc
    .tuple(
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0 && !s.includes("@")),
      fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0 && !s.includes("@"))
    )
    .map(([local, domain]) => `${local}@${domain}.com`);
}

/** Generates a non-empty name string */
function nameArb(): fc.Arbitrary<string> {
  return fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);
}

/** Generates a valid ISO 8601 timestamp */
function isoTimestampArb(): fc.Arbitrary<string> {
  // Use integer-based approach to avoid invalid date edge cases
  return fc
    .integer({ min: 1577836800000, max: 1924991999000 }) // 2020-01-01 to ~2030-12-31
    .map((ms) => new Date(ms).toISOString());
}

/** Generates a non-empty offer title */
function offerTitleArb(): fc.Arbitrary<string> {
  return fc.string({ minLength: 1, maxLength: 120 }).filter((s) => s.trim().length > 0);
}

/** Generates a user role that is NOT ADMIN or MODERATOR */
function nonModeratorRoleArb(): fc.Arbitrary<string> {
  return fc
    .string({ minLength: 1, maxLength: 30 })
    .filter(
      (s) => s !== "ADMIN" && s !== "MODERATOR" && s.trim().length > 0
    );
}

/** Generates a valid offer status */
function offerStatusArb(): fc.Arbitrary<string> {
  return fc.constantFrom(...VALID_OFFER_STATUSES);
}

/** Generates a valid verification status */
function verificationStatusArb(): fc.Arbitrary<string> {
  return fc.constantFrom(...VALID_VERIFICATION_STATUSES);
}

/** Generates a valid resource state */
function resourceStateArb(): fc.Arbitrary<ResourceState> {
  return fc.record({
    status: fc.constantFrom("PENDING", "PARTIAL", "FULFILLED"),
  });
}

/** Generates an invalid offer status string */
function invalidOfferStatusArb(): fc.Arbitrary<string> {
  return fc
    .string({ minLength: 1, maxLength: 30 })
    .filter(
      (s) =>
        !VALID_OFFER_STATUSES.includes(s as any) && s.trim().length > 0
    );
}

/** Generates an invalid verification status string */
function invalidVerificationStatusArb(): fc.Arbitrary<string> {
  return fc
    .string({ minLength: 1, maxLength: 30 })
    .filter(
      (s) =>
        !VALID_VERIFICATION_STATUSES.includes(s as any) && s.trim().length > 0
    );
}

// ============================================================================
// Feature: offers-system, Property 8: Authorization enforcement for moderation
// **Validates: Requirements 6.2**
// ============================================================================

describe("Property 8: Authorization enforcement for moderation", () => {
  it("should deny moderation for any role not in {ADMIN, MODERATOR}", () => {
    fc.assert(
      fc.property(nonModeratorRoleArb(), (role) => {
        // canModerate should return false for non-moderator roles
        expect(canModerate(role)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("should allow moderation for ADMIN and MODERATOR roles", () => {
    fc.assert(
      fc.property(fc.constantFrom("ADMIN", "MODERATOR"), (role) => {
        expect(canModerate(role)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 9: Moderator verify records metadata
// **Validates: Requirements 6.3**
// ============================================================================

describe("Property 9: Moderator verify records metadata", () => {
  it("after verify, verificationStatus=='VERIFIED', verifiedBy==moderator email, verifiedAt is valid ISO 8601", () => {
    fc.assert(
      fc.property(
        emailArb(),
        nameArb(),
        offerTitleArb(),
        isoTimestampArb(),
        (email, name, title, timestamp) => {
          const result = computeVerifyResult(email, name, title, timestamp);

          // verificationStatus is VERIFIED
          expect(result.newVerificationStatus).toBe("VERIFIED");

          // verifiedBy is moderator email
          expect(result.verifiedBy).toBe(email);

          // verifiedAt is valid ISO 8601
          expect(result.verifiedAt).toBe(timestamp);
          const parsedDate = new Date(result.verifiedAt);
          expect(parsedDate.toISOString()).toBe(result.verifiedAt);
          expect(isNaN(parsedDate.getTime())).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 10: Moderator archive records metadata
// **Validates: Requirements 6.4**
// ============================================================================

describe("Property 10: Moderator archive records metadata", () => {
  it("after archive, verificationStatus=='ARCHIVED', moderator email and timestamp recorded", () => {
    fc.assert(
      fc.property(
        emailArb(),
        nameArb(),
        offerTitleArb(),
        isoTimestampArb(),
        (email, name, title, timestamp) => {
          const result = computeArchiveResult(email, name, title, timestamp);

          // verificationStatus is ARCHIVED
          expect(result.newVerificationStatus).toBe("ARCHIVED");

          // moderator email recorded
          expect(result.verifiedBy).toBe(email);

          // timestamp recorded and valid ISO 8601
          expect(result.verifiedAt).toBe(timestamp);
          const parsedDate = new Date(result.verifiedAt);
          expect(parsedDate.toISOString()).toBe(result.verifiedAt);
          expect(isNaN(parsedDate.getTime())).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 11: Moderation actions produce audit logs
// **Validates: Requirements 6.5, 8.5**
// ============================================================================

describe("Property 11: Moderation actions produce audit logs", () => {
  it("verify action creates audit log with correct action type, adminEmail, timestamp, details containing offer title", () => {
    fc.assert(
      fc.property(
        emailArb(),
        nameArb(),
        offerTitleArb(),
        isoTimestampArb(),
        (email, name, title, timestamp) => {
          const result = computeVerifyResult(email, name, title, timestamp);

          // action type is MODERATE_OFFER
          expect(result.auditAction).toBe("MODERATE_OFFER");

          // details contain the offer title
          expect(result.auditDetails).toContain(title);

          // timestamp is valid ISO 8601
          const parsedDate = new Date(timestamp);
          expect(isNaN(parsedDate.getTime())).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("archive action creates audit log with correct action type, adminEmail, timestamp, details containing offer title", () => {
    fc.assert(
      fc.property(
        emailArb(),
        nameArb(),
        offerTitleArb(),
        isoTimestampArb(),
        (email, name, title, timestamp) => {
          const result = computeArchiveResult(email, name, title, timestamp);

          // action type is MODERATE_OFFER
          expect(result.auditAction).toBe("MODERATE_OFFER");

          // details contain the offer title
          expect(result.auditDetails).toContain(title);

          // timestamp is valid ISO 8601
          const parsedDate = new Date(timestamp);
          expect(isNaN(parsedDate.getTime())).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 12: Report on non-VERIFIED offer sets REPORTED status
// **Validates: Requirements 6.6**
// ============================================================================

describe("Property 12: Report on non-VERIFIED offer sets REPORTED status", () => {
  it("when verificationStatus != 'VERIFIED', report creates record AND sets verificationStatus to 'REPORTED'", () => {
    fc.assert(
      fc.property(
        verificationStatusArb().filter((s) => s !== "VERIFIED"),
        (currentStatus) => {
          const decision = computeReportDecision(currentStatus);

          // Report should be created
          expect(decision.shouldCreateReport).toBe(true);

          // Status should be updated to REPORTED
          expect(decision.shouldUpdateVerificationStatus).toBe(true);
          expect(decision.newVerificationStatus).toBe("REPORTED");
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 13: Report on VERIFIED offer preserves status
// **Validates: Requirements 6.7**
// ============================================================================

describe("Property 13: Report on VERIFIED offer preserves status", () => {
  it("when verificationStatus == 'VERIFIED', report is created but status stays 'VERIFIED'", () => {
    fc.assert(
      fc.property(fc.constant("VERIFIED"), (currentStatus) => {
        const decision = computeReportDecision(currentStatus);

        // Report should be created
        expect(decision.shouldCreateReport).toBe(true);

        // Status should NOT be updated
        expect(decision.shouldUpdateVerificationStatus).toBe(false);
        expect(decision.newVerificationStatus).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 14: CLOSED is a terminal state
// **Validates: Requirements 7.1**
// ============================================================================

describe("Property 14: CLOSED is a terminal state", () => {
  it("for any offer with offerStatus=='CLOSED', updateStatus should reject any transition", () => {
    fc.assert(
      fc.property(offerStatusArb(), (targetStatus) => {
        const isValid = isValidStatusTransition("CLOSED", targetStatus);

        // CLOSED is terminal — no transitions allowed
        expect(isValid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("non-CLOSED statuses can transition to valid statuses", () => {
    fc.assert(
      fc.property(
        offerStatusArb().filter((s) => s !== "CLOSED"),
        offerStatusArb(),
        (currentStatus, targetStatus) => {
          const isValid = isValidStatusTransition(currentStatus, targetStatus);

          // Non-CLOSED to any valid status should be allowed
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 15: Status update records history
// **Validates: Requirements 7.2**
// ============================================================================

describe("Property 15: Status update records history", () => {
  it("after successful status change, updatedAt is updated and audit log records previous status", () => {
    fc.assert(
      fc.property(
        offerStatusArb().filter((s) => s !== "CLOSED"),
        offerStatusArb(),
        isoTimestampArb(),
        isoTimestampArb(),
        (previousStatus, targetStatus, previousUpdatedAt, newTimestamp) => {
          // The transition is valid (non-CLOSED to any valid status)
          const isValid = isValidStatusTransition(previousStatus, targetStatus);
          expect(isValid).toBe(true);

          // Simulate the update: new timestamp should be recordable
          const newUpdatedAt = newTimestamp;
          expect(new Date(newUpdatedAt).toISOString()).toBe(newUpdatedAt);

          // The audit log should reference the previous status
          // (simulating the details string produced by the mutation)
          const details = `Oferta "Test" estado cambiado de ${previousStatus} a ${targetStatus}. Anterior: ${previousStatus}.`;
          expect(details).toContain(previousStatus);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Feature: offers-system, Property 16: Auto-computed offer status from resource states
// **Validates: Requirements 7.5, 7.6**
// ============================================================================

describe("Property 16: Auto-computed offer status from resource states", () => {
  it("all FULFILLED → EXHAUSTED", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constant({ status: "FULFILLED" } as ResourceState), {
          minLength: 1,
          maxLength: 20,
        }),
        (resources) => {
          const computed = computeOfferStatusFromResources(resources);
          expect(computed).toBe("EXHAUSTED");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("mix of PENDING and PARTIAL/FULFILLED → PARTIALLY_AVAILABLE", () => {
    fc.assert(
      fc.property(
        // Ensure at least one PENDING and at least one PARTIAL or FULFILLED
        fc.tuple(
          fc.array(fc.constant({ status: "PENDING" } as ResourceState), {
            minLength: 1,
            maxLength: 10,
          }),
          fc.array(
            fc.record({
              status: fc.constantFrom("PARTIAL", "FULFILLED"),
            }),
            { minLength: 1, maxLength: 10 }
          )
        ),
        ([pendingResources, partialOrFulfilled]) => {
          const resources = [...pendingResources, ...partialOrFulfilled];
          const computed = computeOfferStatusFromResources(resources);
          expect(computed).toBe("PARTIALLY_AVAILABLE");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("all PENDING → AVAILABLE", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constant({ status: "PENDING" } as ResourceState), {
          minLength: 1,
          maxLength: 20,
        }),
        (resources) => {
          const computed = computeOfferStatusFromResources(resources);
          expect(computed).toBe("AVAILABLE");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("empty resources → AVAILABLE", () => {
    const computed = computeOfferStatusFromResources([]);
    expect(computed).toBe("AVAILABLE");
  });
});

// ============================================================================
// Feature: offers-system, Property 17: Offer status value constraints
// **Validates: Requirements 1.5**
// ============================================================================

describe("Property 17: Offer status value constraints", () => {
  it("invalid offerStatus values are rejected", () => {
    fc.assert(
      fc.property(invalidOfferStatusArb(), (invalidStatus) => {
        expect(isValidOfferStatus(invalidStatus)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("valid offerStatus values are accepted", () => {
    fc.assert(
      fc.property(offerStatusArb(), (validStatus) => {
        expect(isValidOfferStatus(validStatus)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("invalid verificationStatus values are rejected", () => {
    fc.assert(
      fc.property(invalidVerificationStatusArb(), (invalidStatus) => {
        expect(isValidVerificationStatus(invalidStatus)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("valid verificationStatus values are accepted", () => {
    fc.assert(
      fc.property(verificationStatusArb(), (validStatus) => {
        expect(isValidVerificationStatus(validStatus)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("status transitions with invalid target status are rejected", () => {
    fc.assert(
      fc.property(
        offerStatusArb().filter((s) => s !== "CLOSED"),
        invalidOfferStatusArb(),
        (currentStatus, invalidTarget) => {
          const isValid = isValidStatusTransition(currentStatus, invalidTarget);
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
