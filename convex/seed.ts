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

/**
 * Seed collapsed structures data.
 * Run with: npx convex run seed:seedEstructurasColapsadas
 */
export const seedEstructurasColapsadas = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();

    const estructuras = [
      {
        title: "Edificio Torres del Limonar — Colapso Estructural",
        address: "Cra 72 # 10 bis",
        neighborhood: "Capri",
        latitude: 3.3725,
        longitude: -76.5395,
      },
      {
        title: "Edificio Vanessa — Colapso Estructural",
        address: "Cra 44 # 9-35",
        neighborhood: "Los Cámbulos",
        latitude: 3.4280,
        longitude: -76.5230,
      },
      {
        title: "Edificio El Pilar — Colapso Estructural",
        address: "Carrera 56 con Guadalupe",
        neighborhood: "Guadalupe",
        latitude: 3.4350,
        longitude: -76.5480,
      },
      {
        title: "Barrio Cuarto de Legua — Colapso Estructural",
        address: "Cra 58 # 3-138",
        neighborhood: "Cuarto de Legua",
        latitude: 3.4410,
        longitude: -76.5510,
      },
      {
        title: "Conjunto Residencial Guadalupe Apto 2 — Colapso Estructural",
        address: "Calle 3 # 55 B 72",
        neighborhood: "Cuarto de Legua",
        latitude: 3.4405,
        longitude: -76.5500,
      },
      {
        title: "Edificio Cantabria — Colapso Estructural",
        address: "Carrera 67 # 3 C -15",
        neighborhood: "Nueva Tequendama",
        latitude: 3.4290,
        longitude: -76.5560,
      },
      {
        title: "Estructura Colapsada frente a Plaza de Toros — D1",
        address: "Carrera 56 # 3-92",
        neighborhood: "Tequendama",
        latitude: 3.4320,
        longitude: -76.5470,
      },
      {
        title: "Estructura Colapsada Cra 58 # 3-138",
        address: "Carrera 58 # 3-138",
        neighborhood: "Cuarto de Legua",
        latitude: 3.4412,
        longitude: -76.5515,
      },
      {
        title: "Edificio junto al Colegio Adventista Cali — Colapso",
        address: "Junto al Colegio Adventista Cali",
        neighborhood: "Nueva Tequendama",
        latitude: 3.4285,
        longitude: -76.5550,
      },
      {
        title: "Condominio Pío XXI — Colapso Estructural",
        address: "Cra 40 # 4-30",
        neighborhood: "Pío XXI",
        latitude: 3.4390,
        longitude: -76.5320,
      },
      // Estructuras colapsadas (segunda lista)
      {
        title: "Sector La Luna — Estructura Colapsada",
        address: "Calle 42 con 38",
        neighborhood: "La Luna",
        latitude: 3.4560,
        longitude: -76.5180,
      },
      {
        title: "Estructura Colapsada Calle 44",
        address: "Calle 44",
        neighborhood: "Centro",
        latitude: 3.4540,
        longitude: -76.5200,
      },
      {
        title: "Estructura Colapsada Calle 3D con 67",
        address: "Calle 3 D con 67",
        neighborhood: "Tequendama",
        latitude: 3.4300,
        longitude: -76.5555,
      },
      {
        title: "Estructura Colapsada Calle 10 con Cra 71",
        address: "Calle 10 con Cra 71",
        neighborhood: "Capri",
        latitude: 3.3730,
        longitude: -76.5400,
      },
      {
        title: "Cra 28D con 72 — Notaría 20 — Colapso",
        address: "Cra 28 D con 72 - Notaría 20",
        neighborhood: "El Limonar",
        latitude: 3.3780,
        longitude: -76.5310,
      },
      {
        title: "Estructura Colapsada Calle 9 con 24",
        address: "Calle 9 con 24",
        neighborhood: "Centro",
        latitude: 3.4470,
        longitude: -76.5310,
      },
      {
        title: "Estructura Colapsada Cra 41 con Séptima",
        address: "Cra. 41 con séptima",
        neighborhood: "Centro",
        latitude: 3.4450,
        longitude: -76.5280,
      },
      {
        title: "Motel Molino Rojo — Estructura Colapsada",
        address: "Calle 9 con 24",
        neighborhood: "Centro",
        latitude: 3.4465,
        longitude: -76.5315,
      },
      {
        title: "Estructura Colapsada Carrera 44 con 9",
        address: "Carrera 44 con 9",
        neighborhood: "Los Cámbulos",
        latitude: 3.4275,
        longitude: -76.5225,
      },
      {
        title: "Edificio Marisol — Estructura Colapsada",
        address: "Carrera 9 con 53",
        neighborhood: "San Nicolás",
        latitude: 3.4580,
        longitude: -76.5290,
      },
      {
        title: "Estructura Colapsada Calle 5 con 44",
        address: "Calle 5 con 44",
        neighborhood: "Miraflores",
        latitude: 3.4380,
        longitude: -76.5250,
      },
      {
        title: "Estructura Colapsada Calle 5 con 57",
        address: "Calle 5 con 57",
        neighborhood: "Tequendama",
        latitude: 3.4370,
        longitude: -76.5450,
      },
    ];

    const clinicas = [
      {
        title: "Clínica Alba — Requiere Evacuación",
        address: "Clínica Alba, Cali",
        neighborhood: "Centro",
        latitude: 3.4485,
        longitude: -76.5320,
      },
      {
        title: "Clínica Rey David — Requiere Evacuación",
        address: "Clínica Rey David, Cali",
        neighborhood: "San Fernando",
        latitude: 3.4330,
        longitude: -76.5420,
      },
      {
        title: "Clínica Nuestra Señora del Rosario — Requiere Evacuación",
        address: "Clínica Nuestra Señora del Rosario, Cali",
        neighborhood: "Centro",
        latitude: 3.4500,
        longitude: -76.5340,
      },
      {
        title: "Clínica Sanitas Tequendama — Requiere Evacuación",
        address: "Clínica Sanitas Tequendama, Cali",
        neighborhood: "Tequendama",
        latitude: 3.4310,
        longitude: -76.5460,
      },
      {
        title: "Clínica Cali — Requiere Evacuación",
        address: "Clínica Cali",
        neighborhood: "Centro",
        latitude: 3.4490,
        longitude: -76.5350,
      },
      {
        title: "Carlos Holmes Trujillo — Clínica Afectada",
        address: "Carlos Holmes Trujillo, Cali",
        neighborhood: "Sur",
        latitude: 3.3950,
        longitude: -76.5250,
      },
    ];

    let count = 0;

    // Insert collapsed structures
    for (const e of estructuras) {
      await ctx.db.insert("needs", {
        cityId: "cali",
        emergencyId: "terremoto-cali-2026",
        title: e.title,
        description: `Estructura reportada como colapsada o con daño estructural severo. Se requiere evaluación de Bomberos/Defensa Civil y posible rescate. Dirección: ${e.address}, Barrio ${e.neighborhood}.`,
        placeType: "EDIFICIO_AFECTADO",
        categories: ["ESCOMBROS", "MANO_OBRA", "HERRAMIENTAS"],
        resources: [
          { id: `res-${Date.now()}-${count}-1`, type: "ESCOMBROS", description: "Evaluación estructural y remoción de escombros", requestedQuantity: 1, fulfilledQuantity: 0, unit: "equipo", status: "PENDING" },
          { id: `res-${Date.now()}-${count}-2`, type: "MANO_OBRA", description: "Voluntarios para apoyo en zona", requestedQuantity: 10, fulfilledQuantity: 0, unit: "personas", status: "PENDING" },
        ],
        address: e.address,
        neighborhood: e.neighborhood,
        latitude: e.latitude,
        longitude: e.longitude,
        priority: "CRITICAL",
        status: "NEED_HELP_NOW",
        verificationStatus: "PENDING_VERIFICATION",
        source: "Reporte ciudadano - Redes sociales",
        contactName: "Reportado por ciudadanos",
        requesterType: "COMUNIDAD",
        createdAt: now,
        updatedAt: now,
        isDemoData: false,
      });
      count++;
    }

    // Insert clinics requiring evacuation
    for (const c of clinicas) {
      await ctx.db.insert("needs", {
        cityId: "cali",
        emergencyId: "terremoto-cali-2026",
        title: c.title,
        description: `Clínica afectada que requiere evacuación de pacientes y personal. Se necesitan ambulancias, camillas y voluntarios para traslado seguro. Requiere apoyo logístico inmediato.`,
        placeType: "HOSPITAL",
        categories: ["ATENCION_MEDICA", "TRANSPORTE", "MANO_OBRA", "LOGISTICA"],
        resources: [
          { id: `res-${Date.now()}-${count}-1`, type: "TRANSPORTE", description: "Ambulancias y vehículos para evacuación", requestedQuantity: 5, fulfilledQuantity: 0, unit: "vehículos", status: "PENDING" },
          { id: `res-${Date.now()}-${count}-2`, type: "MANO_OBRA", description: "Personal para apoyo en evacuación", requestedQuantity: 20, fulfilledQuantity: 0, unit: "personas", status: "PENDING" },
        ],
        address: c.address,
        neighborhood: c.neighborhood,
        latitude: c.latitude,
        longitude: c.longitude,
        priority: "CRITICAL",
        status: "NEED_HELP_NOW",
        verificationStatus: "PENDING_VERIFICATION",
        source: "Reporte ciudadano - Redes sociales",
        contactName: "Reportado por ciudadanos",
        requesterType: "ORGANIZACION",
        createdAt: now,
        updatedAt: now,
        isDemoData: false,
      });
      count++;
    }

    return { success: true, count };
  },
});
