"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Public edit action: validates Turnstile then calls the mutation
export const submitEdit = action({
  args: {
    turnstileToken: v.string(),
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
    // 1. Validate Turnstile token
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Turnstile no configurado en el servidor.");
    }

    const turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: args.turnstileToken,
        }),
      }
    );

    const turnstileResult = (await turnstileResponse.json()) as { success: boolean };
    if (!turnstileResult.success) {
      throw new Error("Verificación anti-bot fallida. Intenta de nuevo.");
    }

    // 2. Apply the edit via mutation (pass all fields except turnstileToken)
    const { turnstileToken, ...editArgs } = args;
    await ctx.runMutation(api.publicEdit.applyEdit, editArgs);

    return { success: true };
  },
});
