import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // --- AUTH ---
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(), // bcrypt-style hash stored as string
    role: v.string(), // "ADMIN" | "MODERATOR"
    active: v.boolean(),
    createdAt: v.string(),
    lastLoginAt: v.optional(v.string()),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.string(),
    createdAt: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // --- CORE DATA ---
  needs: defineTable({
    cityId: v.string(),
    emergencyId: v.string(),
    title: v.string(),
    description: v.string(),
    placeType: v.string(),
    categories: v.array(v.string()),
    resources: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        description: v.string(),
        requestedQuantity: v.optional(v.number()),
        fulfilledQuantity: v.optional(v.number()),
        unit: v.optional(v.string()),
        status: v.string(),
      })
    ),
    address: v.string(),
    neighborhood: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    priority: v.string(),
    status: v.string(),
    verificationStatus: v.string(),
    verifiedBy: v.optional(v.string()),
    verificationNotes: v.optional(v.string()),
    verifiedAt: v.optional(v.string()),
    source: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    contactName: v.string(),
    contactPhone: v.optional(v.string()),
    contactWhatsapp: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    requesterType: v.string(),
    operatingHours: v.optional(v.string()),
    evidenceUrl: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    lastUpdatedBy: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    isDemoData: v.optional(v.boolean()),
  })
    .index("by_city", ["cityId"])
    .index("by_emergency", ["emergencyId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_verification", ["verificationStatus"])
    .index("by_neighborhood", ["neighborhood"]),

  reports: defineTable({
    needId: v.id("needs"),
    needTitle: v.optional(v.string()),
    reason: v.string(),
    description: v.string(),
    reporterContact: v.optional(v.string()),
    status: v.string(),
    createdAt: v.string(),
    resolvedAt: v.optional(v.string()),
    resolvedBy: v.optional(v.string()),
  }).index("by_need", ["needId"]),

  updateLogs: defineTable({
    needId: v.id("needs"),
    previousStatus: v.string(),
    newStatus: v.string(),
    description: v.string(),
    updatedBy: v.string(),
    createdAt: v.string(),
  }).index("by_need", ["needId"]),

  auditLogs: defineTable({
    action: v.string(),
    needId: v.optional(v.id("needs")),
    adminEmail: v.string(),
    timestamp: v.string(),
    details: v.string(),
  }),

  // --- OFFER REPORTS ---
  offerReports: defineTable({
    offerId: v.id("offers"),
    offerTitle: v.optional(v.string()),
    reason: v.string(),
    description: v.string(),
    reporterContact: v.optional(v.string()),
    status: v.string(),
    createdAt: v.string(),
  }).index("by_offer", ["offerId"]),

  // --- OFFERS ---
  offers: defineTable({
    cityId: v.string(),
    title: v.string(),
    description: v.string(),
    categories: v.array(v.string()),
    resources: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        description: v.string(),
        quantity: v.optional(v.number()),
        unit: v.optional(v.string()),
        status: v.string(), // "AVAILABLE" | "EXHAUSTED"
      })
    ),
    address: v.string(),
    neighborhood: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    offerStatus: v.string(), // "AVAILABLE" | "PARTIALLY_AVAILABLE" | "EXHAUSTED" | "CLOSED"
    verificationStatus: v.string(), // "PENDING_VERIFICATION" | "VERIFIED" | "REPORTED" | "ARCHIVED"
    verifiedBy: v.optional(v.string()),
    verifiedAt: v.optional(v.string()),
    contactName: v.string(),
    contactPhone: v.optional(v.string()),
    contactWhatsapp: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    operatingHours: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_city", ["cityId"])
    .index("by_verification", ["verificationStatus"])
    .index("by_offer_status", ["offerStatus"]),
});
