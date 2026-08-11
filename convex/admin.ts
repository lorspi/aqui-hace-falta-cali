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

// Admin: get all data (protected)
export const getAllData = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.token);
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
      throw new Error("Sin permisos de moderación.");
    }

    const needs = await ctx.db.query("needs").collect();
    const reports = await ctx.db.query("reports").collect();
    const auditLogs = await ctx.db.query("auditLogs").collect();
    return { needs, reports, auditLogs };
  },
});

// Admin: get metrics (protected)
export const getMetrics = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.token);
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
      throw new Error("Sin permisos de moderación.");
    }

    const needs = await ctx.db.query("needs").collect();
    const reports = await ctx.db.query("reports").collect();

    const total = needs.length;
    const active = needs.filter(
      (n) => n.status !== "CLOSED" && n.verificationStatus !== "ARCHIVED"
    ).length;
    const pendingVerification = needs.filter(
      (n) => n.verificationStatus === "PENDING_VERIFICATION"
    ).length;
    const critical = needs.filter(
      (n) => n.priority === "CRITICAL" && n.status !== "CLOSED"
    ).length;
    const verified = needs.filter(
      (n) => n.verificationStatus === "VERIFIED"
    ).length;
    const reported = needs.filter(
      (n) =>
        n.verificationStatus === "REPORTED" ||
        reports.some((r) => r.needId === n._id && r.status === "PENDING")
    ).length;
    const covered = needs.filter(
      (n) => n.status === "COVERED" || n.status === "CLOSED"
    ).length;

    const categoryCounts: Record<string, number> = {};
    needs.forEach((n) => {
      n.categories.forEach((c) => {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
    });

    const neighborhoodCounts: Record<string, number> = {};
    needs.forEach((n) => {
      if (n.neighborhood) {
        neighborhoodCounts[n.neighborhood] =
          (neighborhoodCounts[n.neighborhood] || 0) + 1;
      }
    });

    return {
      total,
      active,
      pendingVerification,
      critical,
      verified,
      reported,
      covered,
      categoryCounts,
      neighborhoodCounts,
      lastUpdate: new Date().toISOString(),
    };
  },
});

// Admin: verify/moderate need (protected)
export const verifyNeed = mutation({
  args: {
    token: v.string(),
    id: v.id("needs"),
    verificationStatus: v.optional(v.string()),
    priority: v.optional(v.string()),
    verifiedBy: v.optional(v.string()),
    verificationNotes: v.optional(v.string()),
    status: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.token);
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
      throw new Error("Sin permisos de moderación.");
    }

    const need = await ctx.db.get(args.id);
    if (!need) throw new Error("Necesidad no encontrada");

    const now = new Date().toISOString();
    const oldVerification = need.verificationStatus;
    const oldPriority = need.priority;

    const patch: Record<string, any> = { updatedAt: now };
    if (args.verificationStatus) patch.verificationStatus = args.verificationStatus;
    if (args.priority) patch.priority = args.priority;
    if (args.verifiedBy) patch.verifiedBy = args.verifiedBy;
    if (args.verificationNotes) patch.verificationNotes = args.verificationNotes;
    if (args.status) patch.status = args.status;
    if (args.title) patch.title = args.title;
    if (args.description) patch.description = args.description;
    if (args.categories) patch.categories = args.categories;
    if (args.verificationStatus === "VERIFIED") patch.verifiedAt = now;

    await ctx.db.patch(args.id, patch);

    // Audit log
    await ctx.db.insert("auditLogs", {
      action: "MODERATE_NEED",
      needId: args.id,
      adminEmail: user.email,
      timestamp: now,
      details: `Verificación: ${oldVerification} -> ${args.verificationStatus || oldVerification}. Prioridad: ${oldPriority} -> ${args.priority || oldPriority}. Por: ${user.name}`,
    });

    return args.id;
  },
});

// Admin: resolve report (protected)
export const resolveReport = mutation({
  args: {
    token: v.string(),
    reportId: v.id("reports"),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.token);
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
      throw new Error("Sin permisos de moderación.");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Reporte no encontrado");

    const now = new Date().toISOString();
    const newStatus = args.action === "DISMISS" ? "DISMISSED" : "RESOLVED";

    await ctx.db.patch(args.reportId, {
      status: newStatus,
      resolvedAt: now,
      resolvedBy: user.email,
    });

    if (args.action === "RESOLVE_ARCHIVE") {
      await ctx.db.patch(report.needId, {
        verificationStatus: "ARCHIVED",
        status: "CLOSED",
        updatedAt: now,
      });
    }

    // Audit log
    await ctx.db.insert("auditLogs", {
      action: "RESOLVE_REPORT",
      needId: report.needId,
      adminEmail: user.email,
      timestamp: now,
      details: `Reporte ${args.reportId} marcado como ${newStatus}. Acción: ${args.action}. Por: ${user.name}`,
    });

    return { success: true };
  },
});
