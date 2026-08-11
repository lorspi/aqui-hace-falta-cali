import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Password encoding matching auth.ts implementation (XOR-based, deterministic).
 */
const ENCODE_KEY = "AquiHaceFalta2026CaliEmergencia";

function encodePassword(password: string): string {
  const encoded: number[] = [];
  for (let i = 0; i < password.length; i++) {
    const keyChar = ENCODE_KEY.charCodeAt(i % ENCODE_KEY.length);
    const passChar = password.charCodeAt(i);
    encoded.push(passChar ^ keyChar);
  }
  return encoded.map((n) => n.toString(16).padStart(2, "0")).join("");
}

/**
 * Seed the first admin user.
 * Run with: npx convex run seed:createFirstAdmin
 *
 * After running, you can login with the email and password you provide.
 */
export const createFirstAdmin = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if any admin already exists
    const existingUsers = await ctx.db.query("users").collect();
    const hasAdmin = existingUsers.some((u) => u.role === "ADMIN");

    if (hasAdmin) {
      throw new Error(
        "Ya existe un administrador. Usa el panel de admin para crear más usuarios."
      );
    }

    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase().trim(),
      name: args.name,
      passwordHash: encodePassword(args.password),
      role: "ADMIN",
      active: true,
      createdAt: new Date().toISOString(),
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      action: "FIRST_ADMIN_CREATED",
      adminEmail: args.email,
      timestamp: new Date().toISOString(),
      details: `Primer administrador creado: ${args.name} (${args.email})`,
    });

    return {
      success: true,
      userId,
      message: `Admin "${args.name}" creado exitosamente. Ya puedes iniciar sesión.`,
    };
  },
});
