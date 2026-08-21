/**
 * Pure logic for offer status, moderation, and transitions.
 * Extracted for testability — used by Supabase mutations and tests.
 */

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

export function canModerate(userRole: string): boolean {
  return (MODERATION_ROLES as readonly string[]).includes(userRole);
}

export function isValidOfferStatus(status: string): status is OfferStatus {
  return (VALID_OFFER_STATUSES as readonly string[]).includes(status);
}

export function isValidVerificationStatus(
  status: string
): status is VerificationStatus {
  return (VALID_VERIFICATION_STATUSES as readonly string[]).includes(status);
}

export function isValidStatusTransition(
  currentStatus: string,
  targetStatus: string
): boolean {
  if (!isValidOfferStatus(targetStatus)) return false;
  if (currentStatus === "CLOSED") return false;
  if (!isValidOfferStatus(currentStatus)) return false;
  return true;
}

export interface ResourceState {
  status: string;
}

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

  if (hasPending && !hasPartialOrFulfilled) {
    return "AVAILABLE";
  }

  if (hasPartialOrFulfilled && !hasPending) {
    return "PARTIALLY_AVAILABLE";
  }

  return "AVAILABLE";
}
