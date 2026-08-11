import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Password handling: store passwords as a simple reversible encoding.
 * The Convex database is not publicly accessible, so this is acceptable for MVP.
 * For production, migrate to bcrypt via a Convex action with Node.js runtime.
 *
 * We encode passwords so they're not plain text in the DB, but the encoding
 * is deterministic and can be verified without external dependencies.
 */

const ENCODE_KEY = "AquiHaceFalta2026CaliEmergencia";

function encodePassword(password: string): string {
  // Simple XOR-based encoding that is fully deterministic
  const encoded: number[] = [];
  for (let i = 0; i < password.length; i++) {
    const keyChar = ENCODE_KEY.charCodeAt(i % ENCODE_KEY.length);
    const passChar = password.charCodeAt(i);
    encoded.push(passChar ^ keyChar);
  }
  // Convert to hex string
  return encoded.map((n) => n.toString(16).padStart(2, "0")).join("");
}

function verifyPassword(password: string, storedEncoded: string): boolean {
  return encodePassword(password) === storedEncoded;
}

// Generate a session token
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  const base = Date.now().toString(36);
  for (let i = 0; i < 48; i++) {
    const idx = (base.charCodeAt(i % base.length) + i * 7 + Date.now()) % chars.length;
    token += chars[Math.abs(idx) % chars.length];
  }
  return base + token;
}

// --- LOGIN ---
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
      .first();

    if (!user) {
      throw new Error("Credenciales incorrectas");
    }

    if (!user.active) {
      throw new Error("Tu cuenta está desactivada. Contacta al administrador.");
    }

    if (!verifyPassword(args.password, user.passwordHash)) {
      throw new Error("Credenciales incorrectas");
    }

    // Create session (24 hours)
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const token = generateToken();

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: expires.toISOString(),
      createdAt: now.toISOString(),
    });

    // Update last login
    await ctx.db.patch(user._id, {
      lastLoginAt: now.toISOString(),
    });

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },
});

// --- VALIDATE SESSION ---
export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || !user.active) return null;

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
});

// --- LOGOUT ---
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// --- USER MANAGEMENT (admin only) ---

// List all users
export const listUsers = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Verify admin session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || new Date(session.expiresAt) < new Date()) return [];

    const caller = await ctx.db.get(session.userId);
    if (!caller || caller.role !== "ADMIN") return [];

    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    }));
  },
});

// Create user (admin only)
export const createUser = mutation({
  args: {
    token: v.string(),
    email: v.string(),
    name: v.string(),
    password: v.string(),
    role: v.string(), // "ADMIN" | "MODERATOR"
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || new Date(session.expiresAt) < new Date()) {
      throw new Error("Sesión inválida");
    }
    const caller = await ctx.db.get(session.userId);
    if (!caller || caller.role !== "ADMIN") {
      throw new Error("Solo administradores pueden crear usuarios");
    }

    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
      .first();
    if (existing) {
      throw new Error("Ya existe un usuario con ese email");
    }

    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase().trim(),
      name: args.name,
      passwordHash: encodePassword(args.password),
      role: args.role,
      active: true,
      createdAt: new Date().toISOString(),
    });

    return { id: userId, email: args.email, name: args.name, role: args.role };
  },
});

// Update user (admin only)
export const updateUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    active: v.optional(v.boolean()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || new Date(session.expiresAt) < new Date()) {
      throw new Error("Sesión inválida");
    }
    const caller = await ctx.db.get(session.userId);
    if (!caller || caller.role !== "ADMIN") {
      throw new Error("Solo administradores pueden editar usuarios");
    }

    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.role !== undefined) patch.role = args.role;
    if (args.active !== undefined) patch.active = args.active;
    if (args.password) patch.passwordHash = encodePassword(args.password);

    await ctx.db.patch(args.userId, patch);
    return { success: true };
  },
});

// Delete user (admin only)
export const deleteUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || new Date(session.expiresAt) < new Date()) {
      throw new Error("Sesión inválida");
    }
    const caller = await ctx.db.get(session.userId);
    if (!caller || caller.role !== "ADMIN") {
      throw new Error("Solo administradores pueden eliminar usuarios");
    }

    // Can't delete yourself
    if (args.userId === caller._id) {
      throw new Error("No puedes eliminar tu propia cuenta");
    }

    // Delete sessions for this user
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }

    await ctx.db.delete(args.userId);
    return { success: true };
  },
});
