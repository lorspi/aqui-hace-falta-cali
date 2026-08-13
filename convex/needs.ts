import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

// List needs with filters
export const list = query({
  args: {
    cityId: v.optional(v.string()),
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
    placeType: v.optional(v.string()),
    status: v.optional(v.string()),
    verificationStatus: v.optional(v.string()),
    userLat: v.optional(v.number()),
    userLng: v.optional(v.number()),
    distanceKm: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db.query("needs").collect();

    // Exclude archived unless specifically requested
    if (args.verificationStatus !== "ARCHIVED") {
      results = results.filter((n) => n.verificationStatus !== "ARCHIVED");
    }

    // City filter
    if (args.cityId) {
      results = results.filter((n) => n.cityId === args.cityId);
    }

    // Text search
    if (args.search) {
      const q = args.search.toLowerCase().trim();
      results = results.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.neighborhood.toLowerCase().includes(q) ||
          n.address.toLowerCase().includes(q) ||
          n.categories.some((c) => c.toLowerCase().includes(q)) ||
          n.resources.some((r) => r.description.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (args.category && args.category !== "ALL") {
      results = results.filter((n) =>
        n.categories.includes(args.category!)
      );
    }

    // Priority filter
    if (args.priority && args.priority !== "ALL") {
      results = results.filter((n) => n.priority === args.priority);
    }

    // Place type filter
    if (args.placeType && args.placeType !== "ALL") {
      results = results.filter((n) => n.placeType === args.placeType);
    }

    // Status filter
    if (args.status && args.status !== "ALL") {
      results = results.filter((n) => n.status === args.status);
    }

    // Verification status filter
    if (args.verificationStatus && args.verificationStatus !== "ALL") {
      results = results.filter(
        (n) => n.verificationStatus === args.verificationStatus
      );
    }

    // Distance filter
    if (
      args.userLat !== undefined &&
      args.userLng !== undefined &&
      args.distanceKm !== undefined
    ) {
      results = results.filter((n) => {
        const dist = getDistanceKm(
          args.userLat!,
          args.userLng!,
          n.latitude,
          n.longitude
        );
        return dist <= args.distanceKm!;
      });
    }

    // Sorting
    const priorityWeight: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    if (args.sortBy === "RECENT") {
      results.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
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
      // Default: Priority -> Verification -> Updated date
      results.sort((a, b) => {
        const pA = priorityWeight[a.priority] || 0;
        const pB = priorityWeight[b.priority] || 0;
        if (pB !== pA) return pB - pA;

        const vA = a.verificationStatus === "VERIFIED" ? 1 : 0;
        const vB = b.verificationStatus === "VERIFIED" ? 1 : 0;
        if (vB !== vA) return vB - vA;

        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    }

    return results;
  },
});

// Count needs per city (for dropdown display)
export const countsByCity = query({
  args: {},
  handler: async (ctx) => {
    const allNeeds = await ctx.db.query("needs").collect();
    const counts: Record<string, number> = {};
    for (const need of allNeeds) {
      if (need.verificationStatus === "ARCHIVED") continue;
      const city = need.cityId || "cali";
      counts[city] = (counts[city] || 0) + 1;
    }
    return counts;
  },
});

// Get single need by ID
export const getById = query({
  args: { id: v.id("needs") },
  handler: async (ctx, args) => {
    const need = await ctx.db.get(args.id);
    if (!need) return null;
    const updates = await ctx.db
      .query("updateLogs")
      .withIndex("by_need", (q) => q.eq("needId", args.id))
      .collect();
    return { ...need, updates };
  },
});

// Check duplicates
export const checkDuplicate = query({
  args: {
    title: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allNeeds = await ctx.db.query("needs").collect();
    const matches = allNeeds.filter((n) => {
      let isNearby = false;
      if (
        args.latitude !== undefined &&
        args.longitude !== undefined &&
        n.latitude &&
        n.longitude
      ) {
        const dist = getDistanceKm(
          args.latitude,
          args.longitude,
          n.latitude,
          n.longitude
        );
        if (dist <= 0.5) isNearby = true;
      }
      const titleSimilar =
        args.title &&
        n.title.toLowerCase().includes(args.title.toLowerCase().slice(0, 10));
      const sameNeighborhood =
        args.neighborhood &&
        n.neighborhood.toLowerCase().trim() ===
          args.neighborhood.toLowerCase().trim();

      return (isNearby && sameNeighborhood) || (isNearby && titleSimilar);
    });

    return {
      hasDuplicates: matches.length > 0,
      matches: matches.slice(0, 3),
    };
  },
});

// Create a new need
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    placeType: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    resources: v.optional(
      v.array(
        v.object({
          type: v.optional(v.string()),
          description: v.optional(v.string()),
          requestedQuantity: v.optional(v.number()),
          fulfilledQuantity: v.optional(v.number()),
          unit: v.optional(v.string()),
        })
      )
    ),
    address: v.string(),
    neighborhood: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    contactName: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactWhatsapp: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    requesterType: v.optional(v.string()),
    source: v.optional(v.string()),
    evidenceUrl: v.optional(v.string()),
    operatingHours: v.optional(v.string()),
    priority: v.optional(v.string()),
    cityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const resources = (args.resources || []).map((r, idx) => ({
      id: `res-${Date.now()}-${idx}`,
      type: r.type || "VOLUNTARIADO_GENERAL",
      description: r.description || "",
      requestedQuantity: r.requestedQuantity,
      fulfilledQuantity: r.fulfilledQuantity || 0,
      unit: r.unit || "unidades",
      status: "PENDING" as const,
    }));

    const needId = await ctx.db.insert("needs", {
      cityId: args.cityId || "cali",
      emergencyId: "terremoto-cali-2026",
      title: args.title,
      description: args.description,
      placeType: args.placeType || "OTRO",
      categories: args.categories || ["VOLUNTARIADO_GENERAL"],
      resources,
      address: args.address,
      neighborhood: args.neighborhood,
      latitude: args.latitude || 3.4516,
      longitude: args.longitude || -76.532,
      priority: args.priority || "MEDIUM",
      status: "NEED_HELP_NOW",
      verificationStatus: "PENDING_VERIFICATION",
      source: args.source || "Reporte ciudadano en línea",
      contactName: args.contactName || "Anon",
      contactPhone: args.contactPhone,
      contactWhatsapp: args.contactWhatsapp,
      contactEmail: args.contactEmail,
      organizationName: args.organizationName,
      requesterType: args.requesterType || "PERSONA",
      operatingHours: args.operatingHours,
      evidenceUrl: args.evidenceUrl,
      createdAt: now,
      updatedAt: now,
      isDemoData: false,
    });

    // Log creation
    await ctx.db.insert("updateLogs", {
      needId,
      previousStatus: "NEED_HELP_NOW",
      newStatus: "NEED_HELP_NOW",
      description:
        "Punto de necesidad registrado por el usuario. Pendiente de verificación.",
      updatedBy: args.contactName || "Ciudadano",
      createdAt: now,
    });

    return needId;
  },
});

// Update need status
export const updateStatus = mutation({
  args: {
    id: v.id("needs"),
    newStatus: v.optional(v.string()),
    description: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
    resources: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          description: v.string(),
          requestedQuantity: v.optional(v.number()),
          fulfilledQuantity: v.optional(v.number()),
          unit: v.optional(v.string()),
          status: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const need = await ctx.db.get(args.id);
    if (!need) throw new Error("Necesidad no encontrada");

    const now = new Date().toISOString();
    const prevStatus = need.status;

    const patch: Record<string, any> = { updatedAt: now };
    if (args.newStatus) patch.status = args.newStatus;
    if (args.description) patch.description = args.description;
    if (args.resources) patch.resources = args.resources;

    await ctx.db.patch(args.id, patch);

    // Log the update
    await ctx.db.insert("updateLogs", {
      needId: args.id,
      previousStatus: prevStatus,
      newStatus: args.newStatus || need.status,
      description: args.description || `Estado cambiado a ${args.newStatus || need.status}`,
      updatedBy: args.updatedBy || "Ciudadano / Responsable del punto",
      createdAt: now,
    });

    return args.id;
  },
});

// Add update note to timeline
export const addUpdateNote = mutation({
  args: {
    id: v.id("needs"),
    newStatus: v.optional(v.string()),
    description: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const need = await ctx.db.get(args.id);
    if (!need) throw new Error("Necesidad no encontrada");

    const now = new Date().toISOString();
    const prevStatus = need.status;

    if (args.newStatus) {
      await ctx.db.patch(args.id, {
        status: args.newStatus,
        updatedAt: now,
      });
    }

    const log = await ctx.db.insert("updateLogs", {
      needId: args.id,
      previousStatus: prevStatus,
      newStatus: args.newStatus || need.status,
      description: args.description || "Actualización registrada en el punto.",
      updatedBy: args.updatedBy || "Coordinador del punto",
      createdAt: now,
    });

    return log;
  },
});

// Submit report
export const submitReport = mutation({
  args: {
    needId: v.id("needs"),
    reason: v.string(),
    description: v.string(),
    reporterContact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const need = await ctx.db.get(args.needId);
    if (!need) throw new Error("Necesidad no encontrada");

    const now = new Date().toISOString();

    await ctx.db.insert("reports", {
      needId: args.needId,
      needTitle: need.title,
      reason: args.reason,
      description: args.description,
      reporterContact: args.reporterContact,
      status: "PENDING",
      createdAt: now,
    });

    // If unverified and reported, mark as REPORTED
    if (need.verificationStatus !== "VERIFIED") {
      await ctx.db.patch(args.needId, {
        verificationStatus: "REPORTED",
      });
    }

    return { success: true };
  },
});
