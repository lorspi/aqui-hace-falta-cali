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

    // Build patch with only ACTUALLY CHANGED fields (compare against current values)
    const patch: Record<string, any> = { updatedAt: now };
    const changedFields: string[] = [];

    if (args.title !== undefined && args.title !== need.title) { patch.title = args.title; changedFields.push("título"); }
    if (args.description !== undefined && args.description !== need.description) { patch.description = args.description; changedFields.push("descripción"); }
    if (args.placeType !== undefined && args.placeType !== need.placeType) { patch.placeType = args.placeType; changedFields.push("tipo de lugar"); }
    if (args.categories !== undefined && JSON.stringify(args.categories) !== JSON.stringify(need.categories)) { patch.categories = args.categories; changedFields.push("categorías"); }
    if (args.address !== undefined && args.address !== need.address) { patch.address = args.address; changedFields.push("dirección"); }
    if (args.neighborhood !== undefined && args.neighborhood !== need.neighborhood) { patch.neighborhood = args.neighborhood; changedFields.push("barrio"); }
    if (args.latitude !== undefined && args.latitude !== need.latitude) { patch.latitude = args.latitude; changedFields.push("ubicación"); }
    if (args.longitude !== undefined && args.longitude !== need.longitude) { patch.longitude = args.longitude; if (!changedFields.includes("ubicación")) changedFields.push("ubicación"); }
    if (args.contactName !== undefined && args.contactName !== need.contactName) { patch.contactName = args.contactName; changedFields.push("contacto"); }
    if (args.contactPhone !== undefined && args.contactPhone !== (need.contactPhone || '')) { patch.contactPhone = args.contactPhone; changedFields.push("teléfono"); }
    if (args.contactWhatsapp !== undefined && args.contactWhatsapp !== (need.contactWhatsapp || '')) { patch.contactWhatsapp = args.contactWhatsapp; changedFields.push("WhatsApp"); }
    if (args.organizationName !== undefined && args.organizationName !== (need.organizationName || '')) { patch.organizationName = args.organizationName; changedFields.push("organización"); }
    if (args.operatingHours !== undefined && args.operatingHours !== (need.operatingHours || '')) { patch.operatingHours = args.operatingHours; changedFields.push("horario"); }
    if (args.priority !== undefined && args.priority !== need.priority) { patch.priority = args.priority; changedFields.push("prioridad"); }
    if (JSON.stringify(args.resources) !== JSON.stringify(need.resources)) { patch.resources = args.resources; changedFields.push("recursos"); }

    patch.lastUpdatedBy = args.editorName || "Ciudadano anónimo";

    await ctx.db.patch(args.needId, patch);

    // Log the public edit for audit trail (only if something actually changed)
    if (changedFields.length > 0) {
      await ctx.db.insert("updateLogs", {
        needId: args.needId,
        previousStatus: need.status,
        newStatus: need.status,
        description: `${args.editReason || "Edición ciudadana"}. Cambios: ${changedFields.join(", ")}`,
        updatedBy: args.editorName || "Ciudadano anónimo",
        createdAt: now,
      });
    }

    return args.needId;
  },
});
