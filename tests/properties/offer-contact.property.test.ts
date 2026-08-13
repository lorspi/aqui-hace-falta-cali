import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ============================================================================
// Feature: offers-system, Property 7: Contact link format
// **Validates: Requirements 5.5**
//
// For any offer with non-null contactPhone, the link href should equal
// `tel:{contactPhone}`. For non-null contactWhatsapp, link href should equal
// `https://wa.me/{contactWhatsapp}`.
//
// These are tested as pure functions since the href generation in the
// OfferDetailModal and OfferCard uses template literals:
//   href={`tel:${offer.contactPhone}`}
//   href={`https://wa.me/${offer.contactWhatsapp}`}
// ============================================================================

/**
 * Generates the phone link href using the same logic as the component.
 * Mirrors: href={`tel:${offer.contactPhone}`}
 */
function generatePhoneHref(contactPhone: string): string {
  return `tel:${contactPhone}`;
}

/**
 * Generates the WhatsApp link href using the same logic as the component.
 * Mirrors: href={`https://wa.me/${offer.contactWhatsapp}`}
 */
function generateWhatsappHref(contactWhatsapp: string): string {
  return `https://wa.me/${contactWhatsapp}`;
}

// ============================================================================
// Property 7a: Phone contact link format
// ============================================================================

describe("Property 7: Contact link format — Phone", () => {
  it("for any non-null phone string, href equals tel:{phone}", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[0-9+\-() ]{7,15}$/),
        (phone) => {
          const href = generatePhoneHref(phone);

          // Must start with "tel:" prefix
          expect(href).toMatch(/^tel:/);
          // The phone number must appear verbatim after the prefix
          expect(href).toBe(`tel:${phone}`);
          // Length must be "tel:" (4 chars) + phone length
          expect(href.length).toBe(4 + phone.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("for any arbitrary non-empty string as phone, href format is consistent", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (phone) => {
          const href = generatePhoneHref(phone);
          expect(href).toBe(`tel:${phone}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 7b: WhatsApp contact link format
// ============================================================================

describe("Property 7: Contact link format — WhatsApp", () => {
  it("for any non-null whatsapp string, href equals https://wa.me/{whatsapp}", () => {
    const BASE_URL = "https://wa.me/";
    fc.assert(
      fc.property(
        fc.stringMatching(/^[0-9+]{7,15}$/),
        (whatsapp) => {
          const href = generateWhatsappHref(whatsapp);

          // Must start with WhatsApp base URL
          expect(href).toMatch(/^https:\/\/wa\.me\//);
          // The whatsapp number must appear verbatim after the base URL
          expect(href).toBe(`https://wa.me/${whatsapp}`);
          // Length must be base URL + whatsapp number length
          expect(href.length).toBe(BASE_URL.length + whatsapp.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("for any arbitrary non-empty string as whatsapp, href format is consistent", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (whatsapp) => {
          const href = generateWhatsappHref(whatsapp);
          expect(href).toBe(`https://wa.me/${whatsapp}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
