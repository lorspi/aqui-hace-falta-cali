import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Helper: verify session and return user (or throw)
async function requireAuth(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || new Date(session.expiresAt) < new Date()) {
    throw new Error("Sesión expirada. Inicia sesión de nuevo.");
  }

  const user = await ctx.db.get(session.userId);
  if (!user || !user.active) {
    throw new Error("Usuario no encontrado o desactivado.");
  }

  return user;
}

// Helper: haversine distance in km
function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Create a new offer
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    categories: v.array(v.string()),
    resources: v.optional(
      v.array(
        v.object({
          type: v.string(),
          description: v.string(),
          quantity: v.optional(v.number()),
          unit: v.optional(v.string()),
        })
      )
    ),
    address: v.string(),
    neighborhood: v.string(),
    cityId: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    contactName: v.string(),
    contactPhone: v.optional(v.string()),
    contactWhatsapp: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    operatingHours: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate required fields
    if (!args.title || args.title.trim().length === 0) {
      throw new Error("El campo 'title' es obligatorio.");
    }
    if (!args.description || args.description.trim().length === 0) {
      throw new Error("El campo 'description' es obligatorio.");
    }
    if (!args.address || args.address.trim().length === 0) {
      throw new Error("El campo 'address' es obligatorio.");
    }
    if (!args.neighborhood || args.neighborhood.trim().length === 0) {
      throw new Error("El campo 'neighborhood' es obligatorio.");
    }
    if (!args.cityId || args.cityId.trim().length === 0) {
      throw new Error("El campo 'cityId' es obligatorio.");
    }
    if (!args.contactName || args.contactName.trim().length === 0) {
      throw new Error("El campo 'contactName' es obligatorio.");
    }
    if (!args.categories || args.categories.length < 1) {
      throw new Error("El campo 'categories' es obligatorio.");
    }

    // Validate field lengths
    if (args.title.length > 120) {
      throw new Error("El título no puede superar 120 caracteres.");
    }
    if (args.description.length > 1000) {
      throw new Error("La descripción no puede superar 1000 caracteres.");
    }

    // Validate resources array
    const rawResources = args.resources || [];
    if (rawResources.length > 20) {
      throw new Error("Máximo 20 recursos por oferta.");
    }

    for (const resource of rawResources) {
      if (resource.description && resource.description.length > 200) {
        throw new Error(
          "La descripción del recurso no puede superar 200 caracteres."
        );
      }
      if (
        resource.quantity !== undefined &&
        (resource.quantity < 1 || resource.quantity > 999999)
      ) {
        throw new Error("La cantidad debe estar entre 1 y 999999.");
      }
      if (resource.unit && resource.unit.length > 30) {
        throw new Error("La unidad no puede superar 30 caracteres.");
      }
    }

    const now = new Date().toISOString();

    const resources = rawResources.map((r, idx) => ({
      id: `res-${Date.now()}-${idx}`,
      type: r.type,
      description: r.description || "",
      quantity: r.quantity,
      unit: r.unit,
      status: "AVAILABLE" as const,
    }));

    const offerId = await ctx.db.insert("offers", {
      cityId: args.cityId,
      title: args.title,
      description: args.description,
      categories: args.categories,
      resources,
      address: args.address,
      neighborhood: args.neighborhood,
      latitude: args.latitude,
      longitude: args.longitude,
      offerStatus: "AVAILABLE",
      verificationStatus: "PENDING_VERIFICATION",
      contactName: args.contactName,
      contactPhone: args.contactPhone,
      contactWhatsapp: args.contactWhatsapp,
      contactEmail: args.contactEmail,
      organizationName: args.organizationName,
      operatingHours: args.operatingHours,
      createdAt: now,
      updatedAt: now,
    });

    return offerId;
  },
});

// List offers with filters
export const list = query({
  args: {
    cityId: v.optional(v.string()),
    category: v.optional(v.string()),
    verificationStatus: v.optional(v.string()),
    offerStatus: v.optional(v.string()),
    search: v.optional(v.string()),
    userLat: v.optional(v.number()),
    userLng: v.optional(v.number()),
    distanceKm: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db.query("offers").collect();

    // Public listing: only show VERIFIED/PENDING_VERIFICATION and AVAILABLE/PARTIALLY_AVAILABLE
    results = results.filter(
      (o) =>
        ["VERIFIED", "PENDING_VERIFICATION"].includes(o.verificationStatus) &&
        ["AVAILABLE", "PARTIALLY_AVAILABLE"].includes(o.offerStatus)
    );

    // City filter
    if (args.cityId) {
      results = results.filter((o) => o.cityId === args.cityId);
    }

    // Category filter
    if (args.category && args.category !== "ALL") {
      results = results.filter((o) =>
        o.categories.includes(args.category!)
      );
    }

    // Verification status filter (override public default)
    if (args.verificationStatus && args.verificationStatus !== "ALL") {
      results = results.filter(
        (o) => o.verificationStatus === args.verificationStatus
      );
    }

    // Offer status filter (override public default)
    if (args.offerStatus && args.offerStatus !== "ALL") {
      results = results.filter((o) => o.offerStatus === args.offerStatus);
    }

    // Text search (min 2 chars)
    if (args.search && args.search.trim().length >= 2) {
      const q = args.search.toLowerCase().trim();
      results = results.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.address.toLowerCase().includes(q)
      );
    }

    // Distance filter
    if (
      args.userLat !== undefined &&
      args.userLng !== undefined &&
      args.distanceKm !== undefined
    ) {
      results = results.filter((o) => {
        const dist = getDistanceKm(
          args.userLat!,
          args.userLng!,
          o.latitude,
          o.longitude
        );
        return dist <= args.distanceKm!;
      });
    }

    // Sorting
    if (args.sortBy === "RECENT") {
      results.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (
      args.sortBy === "DISTANCE" &&
      args.userLat !== undefined &&
      args.userLng !== undefined
    ) {
      results.sort((a, b) => {
        const dA = getDistanceKm(args.userLat!, args.userLng!, a.latitude, a.longitude);
        const dB = getDistanceKm(args.userLat!, args.userLng!, b.latitude, b.longitude);
        return dA - dB;
      });
    } else {
      // Default: most recent first
      results.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return results;
  },
});

// Get single offer by ID
export const getById = query({
  args: { id: v.id("offers") },
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.id);
    if (!offer) {
      throw new Error("Oferta no encontrada");
    }
    return offer;
  },
});

// Moderator verify/archive offer
export const verify = mutation({
  args: {
    token: v.string(),
    offerId: v.id("offers"),
    action: v.string(), // "verify" or "archive"
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.token);
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
      throw new Error("Sin permisos de moderación.");
    }

    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Oferta no encontrada");
    }

    const now = new Date().toISOString();
    let newVerificationStatus: string;

    if (args.action === "verify") {
      newVerificationStatus = "VERIFIED";
    } else if (args.action === "archive") {
      newVerificationStatus = "ARCHIVED";
    } else {
      throw new Error(`Estado inválido: '${args.action}'`);
    }

    await ctx.db.patch(args.offerId, {
      verificationStatus: newVerificationStatus,
      verifiedBy: user.email,
      verifiedAt: now,
      updatedAt: now,
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      action: "MODERATE_OFFER",
      adminEmail: user.email,
      timestamp: now,
      details: `Oferta "${offer.title}" ${args.action === "verify" ? "verificada" : "archivada"} por ${user.name}.`,
    });

    return args.offerId;
  },
});

// Update offer status and/or resource items
export const updateStatus = mutation({
  args: {
    offerId: v.id("offers"),
    offerStatus: v.optional(v.string()),
    resources: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          description: v.string(),
          quantity: v.optional(v.number()),
          unit: v.optional(v.string()),
          status: v.string(),
          fulfilledQuantity: v.optional(v.number()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Oferta no encontrada");
    }

    // CLOSED is terminal — cannot transition out
    if (offer.offerStatus === "CLOSED") {
      throw new Error("No se puede reactivar una oferta cerrada.");
    }

    const now = new Date().toISOString();
    const previousStatus = offer.offerStatus;

    // Validate explicit offerStatus if provided
    const validStatuses = ["AVAILABLE", "PARTIALLY_AVAILABLE", "EXHAUSTED", "CLOSED"];
    if (args.offerStatus && !validStatuses.includes(args.offerStatus)) {
      throw new Error(`Estado inválido: '${args.offerStatus}'`);
    }

    // Build patch
    const patch: Record<string, any> = { updatedAt: now };

    // Handle resource updates and auto-compute status
    if (args.resources) {
      patch.resources = args.resources.map((r) => ({
        id: r.id,
        type: r.type,
        description: r.description,
        quantity: r.quantity,
        unit: r.unit,
        status: r.status,
        ...(r.fulfilledQuantity !== undefined ? { fulfilledQuantity: r.fulfilledQuantity } : {}),
      }));

      // Auto-compute offerStatus from resource states
      const statuses = args.resources.map((r) => r.status);
      const allFulfilled = statuses.length > 0 && statuses.every((s) => s === "FULFILLED");
      const hasPending = statuses.some((s) => s === "PENDING");
      const hasPartialOrFulfilled = statuses.some((s) => s === "PARTIAL" || s === "FULFILLED");

      if (allFulfilled) {
        patch.offerStatus = "EXHAUSTED";
      } else if (hasPending && hasPartialOrFulfilled) {
        patch.offerStatus = "PARTIALLY_AVAILABLE";
      } else if (!args.offerStatus) {
        // If no explicit status and resources are all PENDING or empty, keep AVAILABLE
        patch.offerStatus = "AVAILABLE";
      }
    }

    // Explicit offerStatus overrides auto-computation only if no resources were provided
    if (args.offerStatus && !args.resources) {
      patch.offerStatus = args.offerStatus;
    }

    await ctx.db.patch(args.offerId, patch);

    // Record previous status in update log (using auditLogs for simplicity)
    await ctx.db.insert("auditLogs", {
      action: "UPDATE_OFFER_STATUS",
      adminEmail: "system",
      timestamp: now,
      details: `Oferta "${offer.title}" estado cambiado de ${previousStatus} a ${patch.offerStatus || args.offerStatus || previousStatus}. Anterior: ${previousStatus}.`,
    });

    return args.offerId;
  },
});

// Submit a report on an offer
export const submitReport = mutation({
  args: {
    offerId: v.id("offers"),
    reason: v.string(),
    description: v.string(),
    reporterContact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Oferta no encontrada");
    }

    const now = new Date().toISOString();

    // Create report record in offerReports table
    await ctx.db.insert("offerReports", {
      offerId: args.offerId,
      offerTitle: offer.title,
      reason: args.reason,
      description: args.description,
      reporterContact: args.reporterContact,
      status: "PENDING",
      createdAt: now,
    });

    // Only update verificationStatus to REPORTED if offer is NOT already VERIFIED
    if (offer.verificationStatus !== "VERIFIED") {
      await ctx.db.patch(args.offerId, {
        verificationStatus: "REPORTED",
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Admin-only delete offer
export const deleteOffer = mutation({
  args: {
    token: v.string(),
    offerId: v.id("offers"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.token);
    if (user.role !== "ADMIN") {
      throw new Error("Sin permisos de moderación.");
    }

    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Oferta no encontrada");
    }

    // Delete related offer reports
    const reports = await ctx.db
      .query("offerReports")
      .withIndex("by_offer", (q) => q.eq("offerId", args.offerId))
      .collect();
    for (const r of reports) {
      await ctx.db.delete(r._id);
    }

    // Delete the offer
    await ctx.db.delete(args.offerId);

    // Audit log
    await ctx.db.insert("auditLogs", {
      action: "DELETE_OFFER",
      adminEmail: user.email,
      timestamp: new Date().toISOString(),
      details: `Oferta "${offer.title}" eliminada por ${user.name}.`,
    });

    return { success: true };
  },
});
