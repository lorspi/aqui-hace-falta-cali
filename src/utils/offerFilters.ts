/**
 * Pure utility functions for offer visibility, filtering, and sorting.
 * Extracted for testability — used by frontend components and property-based tests.
 */

import type { Offer, ViewMode, HelpCategory } from "../types";

// ============================================================================
// Visibility predicates
// ============================================================================

/**
 * Determines whether an offer should be visible based on the current ViewMode
 * and the offer's verification/status state.
 *
 * An offer is visible if and only if:
 * (a) ViewMode is "OFFERS" or "ALL", AND
 * (b) verificationStatus ∈ {"VERIFIED", "PENDING_VERIFICATION"}, AND
 * (c) offerStatus ∈ {"AVAILABLE", "PARTIALLY_AVAILABLE"}
 */
export function isOfferVisible(
  offer: Pick<Offer, "verificationStatus" | "offerStatus">,
  viewMode: ViewMode
): boolean {
  const viewModeAllowsOffers = viewMode === "OFFERS" || viewMode === "ALL";
  const verificationAllows =
    offer.verificationStatus === "VERIFIED" ||
    offer.verificationStatus === "PENDING_VERIFICATION";
  const statusAllows =
    offer.offerStatus === "AVAILABLE" ||
    offer.offerStatus === "PARTIALLY_AVAILABLE";

  return viewModeAllowsOffers && verificationAllows && statusAllows;
}

/**
 * Determines whether needs should be visible based on the current ViewMode.
 * Needs are visible if and only if ViewMode is "NEEDS" or "ALL".
 */
export function isNeedVisible(viewMode: ViewMode): boolean {
  return viewMode === "NEEDS" || viewMode === "ALL";
}

// ============================================================================
// Filter logic
// ============================================================================

export interface OfferFilters {
  category?: HelpCategory;
  cityId?: string;
  search?: string;
}

/**
 * Filters an array of offers based on the active filter predicates.
 * - category: offer.categories must include the filter category
 * - cityId: offer.cityId must match exactly
 * - search: minimum 2 chars, case-insensitive match on title, description, or address
 *
 * When ViewMode is "ALL", priority filters only apply to needs (never exclude offers).
 * This function only handles offer-specific filters.
 */
export function filterOffers(offers: Offer[], filters: OfferFilters): Offer[] {
  return offers.filter((offer) => {
    // Category filter
    if (filters.category) {
      if (!offer.categories.includes(filters.category)) {
        return false;
      }
    }

    // City filter
    if (filters.cityId) {
      if (offer.cityId !== filters.cityId) {
        return false;
      }
    }

    // Text search filter (min 2 chars)
    if (filters.search && filters.search.length >= 2) {
      const query = filters.search.toLowerCase();
      const matchesTitle = offer.title.toLowerCase().includes(query);
      const matchesDescription = offer.description.toLowerCase().includes(query);
      const matchesAddress = offer.address.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription && !matchesAddress) {
        return false;
      }
    }

    return true;
  });
}

// ============================================================================
// Sort logic
// ============================================================================

/**
 * Haversine distance formula — returns distance in kilometers between two points.
 */
export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type SortBy = "RECENT" | "DISTANCE";

/**
 * Sorts an array of offers by the given sort criterion.
 * - "RECENT": descending by createdAt (most recent first)
 * - "DISTANCE": ascending by haversine distance from userLat/userLng
 *
 * Returns a new sorted array (does not mutate the input).
 */
export function sortOffers(
  offers: Offer[],
  sortBy: SortBy,
  userLat?: number,
  userLng?: number
): Offer[] {
  const sorted = [...offers];

  if (sortBy === "RECENT") {
    sorted.sort((a, b) => {
      // Descending: newer first
      return b.createdAt.localeCompare(a.createdAt);
    });
  } else if (sortBy === "DISTANCE") {
    if (userLat !== undefined && userLng !== undefined) {
      sorted.sort((a, b) => {
        const distA = getDistanceKm(userLat, userLng, a.latitude, a.longitude);
        const distB = getDistanceKm(userLat, userLng, b.latitude, b.longitude);
        return distA - distB;
      });
    }
  }

  return sorted;
}
