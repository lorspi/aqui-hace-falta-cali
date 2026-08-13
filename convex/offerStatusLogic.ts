/**
 * Pure logic for offer status, moderation, and transitions.
 * Extracted for testability — used by Convex mutations and property-based tests.
 */

// ============================================================================
// Valid values
// ============================================================================

export const VALID_OFFER_STATUSES = [
  "AVAILABLE",
  "PARTIALLY_AVAILABLE",
  "EXHAUSTED",
  "CLOSED",
] as const;

export const VALID_VERIFICATION_STATUSES = [
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REPORTED",
  "ARCHIVED",
] as const;

export const MODERATION_ROLES = ["ADMIN", "MODERATOR"] as const;

export type OfferStatus = (typeof VALID_OFFER_STATUSES)[number];
export type VerificationStatus = (typeof VALID_VERIFICATION_STATUSES)[number];
export type ModerationRole = (typeof MODERATION_ROLES)[number];

// ============================================================================
// Authorization
// ============================================================================

/**
 * Checks if the given role is allowed to perform moderation actions.
 */
export function canModerate(userRole: string): boolean {
  return (MODERATION_ROLES as readonly string[]).includes(userRole);
}

// ============================================================================
// Status validation
// ============================================================================

/**
 * Returns true if the given value is a valid offerStatus.
 */
export function isValidOfferStatus(status: string): status is OfferStatus {
  return (VALID_OFFER_STATUSES as readonly string[]).includes(status);
}

/**
 * Returns true if the given value is a valid verificationStatus.
 */
export function isValidVerificationStatus(
  status: string
): status is VerificationStatus {
  return (VALID_VERIFICATION_STATUSES as readonly string[]).includes(status);
}

// ============================================================================
// Status transitions
// ============================================================================

/**
 * Validates whether a status transition is allowed.
 * CLOSED is a terminal state — no transitions are allowed out of it.
 * Returns true if the transition is valid.
 */
export function isValidStatusTransition(
  currentStatus: string,
  targetStatus: string
): boolean {
  // Target must be a valid offer status
  if (!isValidOfferStatus(targetStatus)) {
    return false;
  }

  // CLOSED is terminal — cannot transition out
  if (currentStatus === "CLOSED") {
    return false;
  }

  // Current status must be valid
  if (!isValidOfferStatus(currentStatus)) {
    return false;
  }

  // Same-status transition is technically valid (no-op)
  return true;
}

// ============================================================================
// Auto-computed status from resources
// ============================================================================

export interface ResourceState {
  status: string;
}

/**
 * Computes the offerStatus based on the current state of all resources.
 *
 * Rules:
 * - All FULFILLED → EXHAUSTED
 * - Mix of PENDING and (PARTIAL or FULFILLED) → PARTIALLY_AVAILABLE
 * - All PENDING (or empty array) → AVAILABLE
 */
export function computeOfferStatusFromResources(
  resources: ResourceState[]
): OfferStatus {
  if (resources.length === 0) {
    return "AVAILABLE";
  }

  const allFulfilled = resources.every((r) => r.status === "FULFILLED");
  if (allFulfilled) {
    return "EXHAUSTED";
  }

  const hasPending = resources.some((r) => r.status === "PENDING");
  const hasPartialOrFulfilled = resources.some(
    (r) => r.status === "PARTIAL" || r.status === "FULFILLED"
  );

  if (hasPending && hasPartialOrFulfilled) {
    return "PARTIALLY_AVAILABLE";
  }

  // All PENDING (no mix)
  if (hasPending && !hasPartialOrFulfilled) {
    return "AVAILABLE";
  }

  // Edge case: all PARTIAL (no PENDING, no FULFILLED) — treat as PARTIALLY_AVAILABLE
  // since some resources are partially consumed
  if (hasPartialOrFulfilled && !hasPending) {
    return "PARTIALLY_AVAILABLE";
  }

  return "AVAILABLE";
}

// ============================================================================
// Report behavior decision
// ============================================================================

export interface ReportDecision {
  shouldCreateReport: boolean;
  shouldUpdateVerificationStatus: boolean;
  newVerificationStatus: VerificationStatus | null;
}

/**
 * Determines the behavior when a report is submitted on an offer.
 *
 * - If verificationStatus != "VERIFIED": create report AND set status to "REPORTED"
 * - If verificationStatus == "VERIFIED": create report but do NOT change status
 */
export function computeReportDecision(
  currentVerificationStatus: string
): ReportDecision {
  if (currentVerificationStatus === "VERIFIED") {
    return {
      shouldCreateReport: true,
      shouldUpdateVerificationStatus: false,
      newVerificationStatus: null,
    };
  }

  return {
    shouldCreateReport: true,
    shouldUpdateVerificationStatus: true,
    newVerificationStatus: "REPORTED",
  };
}

// ============================================================================
// Moderation result computation
// ============================================================================

export interface ModerationResult {
  newVerificationStatus: VerificationStatus;
  verifiedBy: string;
  verifiedAt: string;
  auditAction: string;
  auditDetails: string;
}

/**
 * Computes the expected results of a verify action.
 */
export function computeVerifyResult(
  moderatorEmail: string,
  moderatorName: string,
  offerTitle: string,
  timestamp: string
): ModerationResult {
  return {
    newVerificationStatus: "VERIFIED",
    verifiedBy: moderatorEmail,
    verifiedAt: timestamp,
    auditAction: "MODERATE_OFFER",
    auditDetails: `Oferta "${offerTitle}" verificada por ${moderatorName}.`,
  };
}

/**
 * Computes the expected results of an archive action.
 */
export function computeArchiveResult(
  moderatorEmail: string,
  moderatorName: string,
  offerTitle: string,
  timestamp: string
): ModerationResult {
  return {
    newVerificationStatus: "ARCHIVED",
    verifiedBy: moderatorEmail,
    verifiedAt: timestamp,
    auditAction: "MODERATE_OFFER",
    auditDetails: `Oferta "${offerTitle}" archivada por ${moderatorName}.`,
  };
}
