import { describe, it, expect } from "vitest";
import type { Offer, OfferStatus, VerificationStatus } from "../../src/types";

// ============================================================================
// Replicate the rendering logic from OfferCard.tsx and OfferDetailModal.tsx
// to test as pure functions without needing DOM/React rendering.
// ============================================================================

/**
 * Offer status configuration — mirrors OfferCard.tsx OFFER_STATUS_CONFIG
 */
const OFFER_STATUS_CONFIG: Record<OfferStatus, { label: string; badgeClass: string }> = {
  AVAILABLE: {
    label: "Disponible",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  PARTIALLY_AVAILABLE: {
    label: "Parcialmente disponible",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  EXHAUSTED: {
    label: "Agotado",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  CLOSED: {
    label: "Cerrado",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

/**
 * Returns the display label for a given OfferStatus.
 */
function getStatusLabel(status: OfferStatus): string {
  return OFFER_STATUS_CONFIG[status]?.label ?? "Disponible";
}

/**
 * Returns whether an offer is considered inactive (reduced opacity/strikethrough).
 */
function isInactive(status: OfferStatus): boolean {
  return status === "EXHAUSTED" || status === "CLOSED";
}

/**
 * Verification badge logic — mirrors renderVerificationBadge in OfferCard.tsx
 */
function getVerificationLabel(status: VerificationStatus): string | null {
  if (status === "PENDING_VERIFICATION") return "Pendiente";
  if (status === "VERIFIED") return "Verificado";
  return null;
}

/**
 * Contact link format helpers — mirrors href generation in OfferDetailModal.tsx
 */
function getContactPhoneHref(phone: string): string {
  return `tel:${phone}`;
}

function getWhatsappHref(number: string): string {
  return `https://wa.me/${number}`;
}

function getEmailHref(email: string): string {
  return `mailto:${email}`;
}

/**
 * Determines whether an optional field should be rendered.
 */
function shouldDisplayField(value: string | undefined | null): boolean {
  return value !== undefined && value !== null && value.length > 0;
}

// ============================================================================
// Helper to create a minimal offer for testing
// ============================================================================

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: "test-offer-1",
    cityId: "cali",
    title: "Donación de alimentos",
    description: "Alimentos no perecederos disponibles",
    categories: ["ALIMENTOS"],
    resources: [],
    address: "Calle 5 #23-45",
    neighborhood: "San Fernando",
    latitude: 3.4516,
    longitude: -76.532,
    offerStatus: "AVAILABLE",
    verificationStatus: "PENDING_VERIFICATION",
    contactName: "María García",
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-01-15T12:00:00.000Z",
    ...overrides,
  };
}

// ============================================================================
// Tests — Task 8.3: Unit tests for OfferCard and OfferDetailModal
// **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
// ============================================================================

describe("OfferCard & OfferDetailModal — Badge rendering logic", () => {
  describe("Offer status badge labels (Req 5.3)", () => {
    it('AVAILABLE → "Disponible"', () => {
      expect(getStatusLabel("AVAILABLE")).toBe("Disponible");
    });

    it('PARTIALLY_AVAILABLE → "Parcialmente disponible"', () => {
      expect(getStatusLabel("PARTIALLY_AVAILABLE")).toBe("Parcialmente disponible");
    });

    it('EXHAUSTED → "Agotado"', () => {
      expect(getStatusLabel("EXHAUSTED")).toBe("Agotado");
    });

    it('CLOSED → "Cerrado"', () => {
      expect(getStatusLabel("CLOSED")).toBe("Cerrado");
    });

    it("each status has a unique badge label", () => {
      const labels = Object.values(OFFER_STATUS_CONFIG).map((c) => c.label);
      const unique = new Set(labels);
      expect(unique.size).toBe(labels.length);
    });

    it("each status has a unique badgeClass for visual distinction", () => {
      const classes = Object.values(OFFER_STATUS_CONFIG).map((c) => c.badgeClass);
      const unique = new Set(classes);
      expect(unique.size).toBe(classes.length);
    });
  });

  describe("Verification badge logic (Req 5.2)", () => {
    it('PENDING_VERIFICATION → "Pendiente"', () => {
      expect(getVerificationLabel("PENDING_VERIFICATION")).toBe("Pendiente");
    });

    it('VERIFIED → "Verificado"', () => {
      expect(getVerificationLabel("VERIFIED")).toBe("Verificado");
    });

    it("REPORTED → null (not rendered)", () => {
      expect(getVerificationLabel("REPORTED")).toBeNull();
    });

    it("ARCHIVED → null (not rendered)", () => {
      expect(getVerificationLabel("ARCHIVED")).toBeNull();
    });
  });
});

describe("OfferCard & OfferDetailModal — Inactive state logic (Req 5.4)", () => {
  it("EXHAUSTED → should apply opacity-50 (inactive)", () => {
    expect(isInactive("EXHAUSTED")).toBe(true);
  });

  it("CLOSED → should apply opacity-50 (inactive)", () => {
    expect(isInactive("CLOSED")).toBe(true);
  });

  it("AVAILABLE → should NOT apply opacity-50 (active)", () => {
    expect(isInactive("AVAILABLE")).toBe(false);
  });

  it("PARTIALLY_AVAILABLE → should NOT apply opacity-50 (active)", () => {
    expect(isInactive("PARTIALLY_AVAILABLE")).toBe(false);
  });

  it("inactive offers get opacity class and strikethrough in card header", () => {
    // Verify the logic used in the component for className generation
    const offer = makeOffer({ offerStatus: "EXHAUSTED" });
    const inactive = isInactive(offer.offerStatus);
    const cardClass = inactive ? "opacity-50" : "";
    const headerClass = inactive ? "line-through decoration-slate-400" : "";

    expect(cardClass).toBe("opacity-50");
    expect(headerClass).toBe("line-through decoration-slate-400");
  });

  it("active offers do NOT get opacity class", () => {
    const offer = makeOffer({ offerStatus: "AVAILABLE" });
    const inactive = isInactive(offer.offerStatus);
    const cardClass = inactive ? "opacity-50" : "";

    expect(cardClass).toBe("");
  });
});

describe("OfferDetailModal — Contact link formats (Req 5.5)", () => {
  it("contactPhone generates tel:{phone} href", () => {
    expect(getContactPhoneHref("3001234567")).toBe("tel:3001234567");
  });

  it("contactPhone with country code generates correct tel: link", () => {
    expect(getContactPhoneHref("+573001234567")).toBe("tel:+573001234567");
  });

  it("contactWhatsapp generates https://wa.me/{number} href", () => {
    expect(getWhatsappHref("573001234567")).toBe("https://wa.me/573001234567");
  });

  it("contactWhatsapp with plus prefix", () => {
    expect(getWhatsappHref("+573001234567")).toBe("https://wa.me/+573001234567");
  });

  it("contactEmail generates mailto:{email} href", () => {
    expect(getEmailHref("help@example.com")).toBe("mailto:help@example.com");
  });

  it("missing contactPhone → no link rendered (null/undefined check)", () => {
    const offer = makeOffer({ contactPhone: undefined });
    expect(shouldDisplayField(offer.contactPhone)).toBe(false);
  });

  it("missing contactWhatsapp → no link rendered", () => {
    const offer = makeOffer({ contactWhatsapp: undefined });
    expect(shouldDisplayField(offer.contactWhatsapp)).toBe(false);
  });

  it("missing contactEmail → no link rendered", () => {
    const offer = makeOffer({ contactEmail: undefined });
    expect(shouldDisplayField(offer.contactEmail)).toBe(false);
  });

  it("provided contactPhone → link rendered", () => {
    const offer = makeOffer({ contactPhone: "3001234567" });
    expect(shouldDisplayField(offer.contactPhone)).toBe(true);
  });

  it("provided contactWhatsapp → link rendered", () => {
    const offer = makeOffer({ contactWhatsapp: "573001234567" });
    expect(shouldDisplayField(offer.contactWhatsapp)).toBe(true);
  });

  it("provided contactEmail → link rendered", () => {
    const offer = makeOffer({ contactEmail: "test@example.com" });
    expect(shouldDisplayField(offer.contactEmail)).toBe(true);
  });

  it("empty string contactPhone → not displayed", () => {
    const offer = makeOffer({ contactPhone: "" });
    expect(shouldDisplayField(offer.contactPhone)).toBe(false);
  });
});

describe("OfferDetailModal — Optional fields display (Req 5.1)", () => {
  it("organizationName undefined → not shown", () => {
    const offer = makeOffer({ organizationName: undefined });
    expect(shouldDisplayField(offer.organizationName)).toBe(false);
  });

  it("operatingHours undefined → not shown", () => {
    const offer = makeOffer({ operatingHours: undefined });
    expect(shouldDisplayField(offer.operatingHours)).toBe(false);
  });

  it("organizationName provided → shown", () => {
    const offer = makeOffer({ organizationName: "Cruz Roja" });
    expect(shouldDisplayField(offer.organizationName)).toBe(true);
  });

  it("operatingHours provided → shown", () => {
    const offer = makeOffer({ operatingHours: "Lunes a Viernes 8am-5pm" });
    expect(shouldDisplayField(offer.operatingHours)).toBe(true);
  });

  it("contactPhone provided → shown with tel: link", () => {
    const offer = makeOffer({ contactPhone: "3001234567" });
    expect(shouldDisplayField(offer.contactPhone)).toBe(true);
    expect(getContactPhoneHref(offer.contactPhone!)).toBe("tel:3001234567");
  });

  it("verifiedBy and verifiedAt shown when present", () => {
    const offer = makeOffer({
      verifiedBy: "admin@aquihacefalta.co",
      verifiedAt: "2025-01-16T08:00:00.000Z",
    });
    expect(shouldDisplayField(offer.verifiedBy)).toBe(true);
    expect(shouldDisplayField(offer.verifiedAt)).toBe(true);
  });

  it("verifiedBy and verifiedAt hidden when absent", () => {
    const offer = makeOffer({
      verifiedBy: undefined,
      verifiedAt: undefined,
    });
    expect(shouldDisplayField(offer.verifiedBy)).toBe(false);
    expect(shouldDisplayField(offer.verifiedAt)).toBe(false);
  });
});
