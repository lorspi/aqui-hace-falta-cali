import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Admin: get all data
export const getAllData = query({
  args: {},
  handler: async (ctx) => {
    const needs = await ctx.db.query("needs").collect();
    const reports = await ctx.db.query("reports").collect();
    const auditLogs = await ctx.db.query("auditLogs").collect();
    return { needs, reports, auditLogs };
  },
});

// Admin: get metrics
export const getMetrics = query({
  args: {},
  handler: async (ctx) => {
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
        reports.some(
          (r) => r.needId === n._id && r.status === "PENDING"
        )
    ).length;
    const covered = needs.filter(
      (n) => n.status === "COVERED" || n.status === "CLOSED"
    ).length;

    // Demand by category
    const categoryCounts: Record<string, number> = {};
    needs.forEach((n) => {
      n.categories.forEach((c) => {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
    });

    // Neighborhood clusters
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

// Admin: verify/moderate need
export const verifyNeed = mutation({
  args: {
    id: v.id("needs"),
    verificationStatus: v.optional(v.string()),
    priority: v.optional(v.string()),
    verifiedBy: v.optional(v.string()),
    verificationNotes: v.optional(v.string()),
    status: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    adminEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
      adminEmail: args.adminEmail || "moderador@aquihacefalta.org",
      timestamp: now,
      details: `Verificación: ${oldVerification} -> ${args.verificationStatus || oldVerification}. Prioridad: ${oldPriority} -> ${args.priority || oldPriority}.`,
    });

    return args.id;
  },
});

// Admin: resolve report
export const resolveReport = mutation({
  args: {
    reportId: v.id("reports"),
    action: v.string(), // 'DISMISS' | 'RESOLVE_ARCHIVE' | 'RESOLVE_FIX'
    adminEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Reporte no encontrado");

    const now = new Date().toISOString();
    const newStatus = args.action === "DISMISS" ? "DISMISSED" : "RESOLVED";

    await ctx.db.patch(args.reportId, {
      status: newStatus,
      resolvedAt: now,
      resolvedBy: args.adminEmail || "Admin",
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
      adminEmail: args.adminEmail || "Admin",
      timestamp: now,
      details: `Reporte ${args.reportId} marcado como ${newStatus}. Acción: ${args.action}`,
    });

    return { success: true };
  },
});
