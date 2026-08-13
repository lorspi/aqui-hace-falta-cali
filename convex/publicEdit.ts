import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Mutation to apply a public edit (called by the action after Turnstile validation)
export const applyEdit = mutation({
  args: {
    needId: v.id("needs"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    placeType: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    address: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    contactName: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactWhatsapp: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    operatingHours: v.optional(v.string()),
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
    editorName: v.optional(v.string()),
    editReason: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const need = await ctx.db.get(args.needId);
    if (!need) throw new Error("Necesidad no encontrada");

    const now = new Date().toISOString();

    // Build patch with only provided fields
    const patch: Record<string, any> = { updatedAt: now };
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.placeType !== undefined) patch.placeType = args.placeType;
    if (args.categories !== undefined) patch.categories = args.categories;
    if (args.address !== undefined) patch.address = args.address;
    if (args.neighborhood !== undefined) patch.neighborhood = args.neighborhood;
    if (args.latitude !== undefined) patch.latitude = args.latitude;
    if (args.longitude !== undefined) patch.longitude = args.longitude;
    if (args.contactName !== undefined) patch.contactName = args.contactName;
    if (args.contactPhone !== undefined) patch.contactPhone = args.contactPhone;
    if (args.contactWhatsapp !== undefined) patch.contactWhatsapp = args.contactWhatsapp;
    if (args.organizationName !== undefined) patch.organizationName = args.organizationName;
    if (args.operatingHours !== undefined) patch.operatingHours = args.operatingHours;
    if (args.priority !== undefined) patch.priority = args.priority;
    patch.resources = args.resources;
    patch.lastUpdatedBy = args.editorName || "Ciudadano anónimo";

    await ctx.db.patch(args.needId, patch);

    // Log the public edit for audit trail
    const changedFields = Object.keys(patch).filter(k => k !== "updatedAt");
    await ctx.db.insert("updateLogs", {
      needId: args.needId,
      previousStatus: need.status,
      newStatus: need.status,
      description: `Edición ciudadana${args.editReason ? `: ${args.editReason}` : ""}. Campos: ${changedFields.join(", ")}`,
      updatedBy: args.editorName || "Ciudadano anónimo",
      createdAt: now,
    });

    return args.needId;
  },
});
