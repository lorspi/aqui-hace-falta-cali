import { mutation } from "./_generated/server";

const DEMO_NEEDS = [
  {
    cityId: "cali",
    emergencyId: "terremoto-cali-2026",
    title: "Edificio Residencial Las Acacias — Colapso Parcial de Muro",
    description:
      "Se requieren voluntarios capacitados y herramientas de mano para la remoción segura de escombros en el acceso principal y clasificación de enseres. Acceso libre para vehículos de carga liviana.",
    placeType: "EDIFICIO_AFECTADO",
    categories: ["ESCOMBROS", "MANO_OBRA", "HERRAMIENTAS", "AGUA"],
    resources: [
      { id: "r1", type: "MANO_OBRA", description: "Voluntarios con experiencia en construcción", requestedQuantity: 15, fulfilledQuantity: 8, unit: "personas", status: "PARTIAL" },
      { id: "r2", type: "HERRAMIENTAS", description: "Palas metálicas y carretillas de carga", requestedQuantity: 8, fulfilledQuantity: 3, unit: "unidades", status: "PARTIAL" },
      { id: "r3", type: "AGUA", description: "Cajas de agua embotellada para hidratación de brigada", requestedQuantity: 20, fulfilledQuantity: 12, unit: "cajas", status: "PARTIAL" },
    ],
    address: "Calle 5 # 34-12",
    neighborhood: "San Fernando",
    latitude: 3.4325,
    longitude: -76.5412,
    priority: "CRITICAL",
    status: "NEED_HELP_NOW",
    verificationStatus: "VERIFIED",
    verifiedBy: "Defensa Civil Seccional Cali & Moderador",
    verificationNotes: "Información verificada presencialmente por brigada móvil.",
    verifiedAt: "2026-08-11T07:15:00Z",
    source: "Junta de Acción Comunal San Fernando",
    contactName: "Carlos Eduardo Restrepo",
    contactPhone: "+57 315 555 0192",
    contactWhatsapp: "573155550192",
    contactEmail: "jac.sanfernando@ejemplo.org",
    organizationName: "Comité Vecinal San Fernando",
    requesterType: "COMUNIDAD",
    operatingHours: "07:00 a. m. - 06:00 p. m.",
    createdAt: "2026-08-10T16:00:00Z",
    updatedAt: "2026-08-11T08:20:00Z",
    isDemoData: true,
  },
  {
    cityId: "cali",
    emergencyId: "terremoto-cali-2026",
    title: "Centro de Acopio Principal — Colegio Santa Librada",
    description:
      "Punto oficial de recepción de donaciones y empaque de kits alimentarios. Se necesitan con urgencia personas para clasificar ropa, empacar alimentos no perecederos y agua potable.",
    placeType: "CENTRO_ACOPIO",
    categories: ["CLASIFICACION_DONACIONES", "VOLUNTARIADO_GENERAL", "ALIMENTOS", "AGUA", "LOGISTICA"],
    resources: [
      { id: "r4", type: "CLASIFICACION_DONACIONES", description: "Voluntarios para separación y sellado de cajas", requestedQuantity: 30, fulfilledQuantity: 18, unit: "personas", status: "PARTIAL" },
      { id: "r5", type: "AGUA", description: "Agua potable en garrafones o bolsas", requestedQuantity: 100, fulfilledQuantity: 65, unit: "unidades", status: "PARTIAL" },
      { id: "r6", type: "ALIMENTOS", description: "Granos, enlatados y leche en polvo", requestedQuantity: 200, fulfilledQuantity: 110, unit: "kg", status: "PARTIAL" },
    ],
    address: "Carrera 15 # 5-62",
    neighborhood: "San Bosco / Centro",
    latitude: 3.4442,
    longitude: -76.5361,
    priority: "HIGH",
    status: "RECEIVING_HELP",
    verificationStatus: "VERIFIED",
    verifiedBy: "Alcaldía de Cali - Secretaría de Bienestar Social",
    verificationNotes: "Centro de acopio coordinado con la administración municipal.",
    verifiedAt: "2026-08-10T18:00:00Z",
    source: "Cruz Roja Colombiana Seccional Valle",
    contactName: "Dra. María Fernanda Gómez",
    contactPhone: "+57 312 444 8821",
    contactWhatsapp: "573124448821",
    organizationName: "Cruz Roja Seccional Valle",
    requesterType: "ORGANIZACION",
    operatingHours: "24 horas rotativo",
    createdAt: "2026-08-10T15:30:00Z",
    updatedAt: "2026-08-11T08:10:00Z",
    isDemoData: true,
  },
  {
    cityId: "cali",
    emergencyId: "terremoto-cali-2026",
    title: "Hospital Universitario del Valle — Campaña de Sangre",
    description:
      "Se requieren donantes de sangre de todos los grupos sanguíneos, en especial O negativo y A positivo, para la atención de heridos remitidos por el evento sísmico.",
    placeType: "BANCO_SANGRE",
    categories: ["SANGRE", "ATENCION_MEDICA", "VOLUNTARIADO_GENERAL"],
    resources: [
      { id: "r7", type: "SANGRE", description: "Donantes de sangre O- y A+", requestedQuantity: 50, fulfilledQuantity: 28, unit: "donantes", status: "PARTIAL" },
      { id: "r8", type: "VOLUNTARIADO_GENERAL", description: "Orientadores para registro de donantes", requestedQuantity: 6, fulfilledQuantity: 6, unit: "personas", status: "FULFILLED" },
    ],
    address: "Calle 5 # 36-08",
    neighborhood: "San Fernando Viejo",
    latitude: 3.4302,
    longitude: -76.5435,
    priority: "CRITICAL",
    status: "NEED_HELP_NOW",
    verificationStatus: "VERIFIED",
    verifiedBy: "Banco de Sangre HUV Oficial",
    verificationNotes: "Confirmado telefónicamente con el Banco de Sangre HUV.",
    verifiedAt: "2026-08-11T06:30:00Z",
    source: "Hospital Universitario del Valle",
    contactName: "Coordinación Banco de Sangre HUV",
    contactPhone: "+57 602 554 1100",
    contactWhatsapp: "573187771234",
    organizationName: "HUV E.S.E.",
    requesterType: "ORGANIZACION",
    operatingHours: "06:00 a. m. - 08:00 p. m.",
    createdAt: "2026-08-10T17:00:00Z",
    updatedAt: "2026-08-11T08:05:00Z",
    isDemoData: true,
  },
  {
    cityId: "cali",
    emergencyId: "terremoto-cali-2026",
    title: "Comunidad Afectada Siloé — Sector La Estrella",
    description:
      "Varias familias sufrieron agrietamiento severo en viviendas de ladera. Se requieren plásticos de gran calibre, madera para apuntalamiento temporal, alimentos preparados y kits de aseo.",
    placeType: "COMUNIDAD_AFECTADA",
    categories: ["ALOJAMIENTO", "ALIMENTOS", "HERRAMIENTAS", "APOYO_PSICOLOGICO"],
    resources: [
      { id: "r9", type: "ALOJAMIENTO", description: "Lonas impermeables y plásticos de 4x6m", requestedQuantity: 25, fulfilledQuantity: 10, unit: "unidades", status: "PARTIAL" },
      { id: "r10", type: "ALIMENTOS", description: "Comidas preparadas / ollas comunitarias", requestedQuantity: 80, fulfilledQuantity: 40, unit: "raciones", status: "PARTIAL" },
      { id: "r11", type: "APOYO_PSICOLOGICO", description: "Psicólogos o trabajadores sociales para contención de crisis en niños", requestedQuantity: 4, fulfilledQuantity: 1, unit: "profesionales", status: "PARTIAL" },
    ],
    address: "Diagonal 51 con Calle 2 Oeste",
    neighborhood: "Siloé",
    latitude: 3.4189,
    longitude: -76.5521,
    priority: "HIGH",
    status: "NEED_HELP_NOW",
    verificationStatus: "VERIFIED",
    verifiedBy: "Líder de Junta Comunal & Brigada de Emergencia",
    verificationNotes: "Verificado por la Red Comunitaria de Gestión del Riesgo.",
    verifiedAt: "2026-08-10T19:30:00Z",
    source: "Colectivo Comunitario Siloé",
    contactName: "Jhon Jairo Valencia",
    contactPhone: "+57 317 889 0211",
    contactWhatsapp: "573178890211",
    organizationName: "Comité de Emergencia Siloé",
    requesterType: "COMUNIDAD",
    operatingHours: "08:00 a. m. - 05:00 p. m.",
    createdAt: "2026-08-10T17:45:00Z",
    updatedAt: "2026-08-11T07:50:00Z",
    isDemoData: true,
  },
  {
    cityId: "cali",
    emergencyId: "terremoto-cali-2026",
    title: "Refugio Temporal Parque de los Jovita",
    description:
      "Campamento temporal habilitado para familias evacuadas de zonas de riesgo. Necesitan colchones inflables, cobijas, pañales para bebé y alimentos para mascotas.",
    placeType: "REFUGIO",
    categories: ["ALOJAMIENTO", "ROPA", "ANIMALES", "AGUA"],
    resources: [
      { id: "r12", type: "ALOJAMIENTO", description: "Cobijas térmicas y aislantes", requestedQuantity: 40, fulfilledQuantity: 22, unit: "cobijas", status: "PARTIAL" },
      { id: "r13", type: "ANIMALES", description: "Alimento concentrado para perros y gatos", requestedQuantity: 15, fulfilledQuantity: 8, unit: "bultos", status: "PARTIAL" },
      { id: "r14", type: "ROPA", description: "Pañales etapas 2, 3 y 4", requestedQuantity: 30, fulfilledQuantity: 15, unit: "paquetes", status: "PARTIAL" },
    ],
    address: "Calle 5 con Carrera 15",
    neighborhood: "San Antonio / Centro",
    latitude: 3.4468,
    longitude: -76.5388,
    priority: "MEDIUM",
    status: "RECEIVING_HELP",
    verificationStatus: "VERIFIED",
    verifiedBy: "Secretaría de Salud y Gestión del Riesgo",
    verifiedAt: "2026-08-11T08:00:00Z",
    source: "Voluntariado Universitario Univalle",
    contactName: "Sofía Caicedo",
    contactPhone: "+57 300 912 3456",
    contactWhatsapp: "573009123456",
    organizationName: "Red de Apoyo Jovita",
    requesterType: "FUNDACION",
    operatingHours: "24 horas",
    createdAt: "2026-08-10T20:00:00Z",
    updatedAt: "2026-08-11T08:15:00Z",
    isDemoData: true,
  },
  {
    cityId: "cali",
    emergencyId: "terremoto-cali-2026",
    title: "Punto Logístico y Flete Voluntario — Alfonso López",
    description:
      "Se requieren camionetas tipo estacas o furgones pequeños para transportar agua y cajas de kits desde el centro de acopio hacia comunas del oriente (Comuna 7 y Comuna 14).",
    placeType: "PUNTO_LOGISTICO",
    categories: ["TRANSPORTE", "LOGISTICA", "MANO_OBRA"],
    resources: [
      { id: "r15", type: "TRANSPORTE", description: "Vehículos de carga liviana con conductor", requestedQuantity: 6, fulfilledQuantity: 2, unit: "vehículos", status: "PARTIAL" },
      { id: "r16", type: "MANO_OBRA", description: "Cargadores para despejar furgones", requestedQuantity: 10, fulfilledQuantity: 6, unit: "personas", status: "PARTIAL" },
    ],
    address: "Carrera 7C # 73-10",
    neighborhood: "Alfonso López",
    latitude: 3.4682,
    longitude: -76.5012,
    priority: "HIGH",
    status: "NEED_HELP_NOW",
    verificationStatus: "PENDING_VERIFICATION",
    source: "Reporte ciudadano enviado por formulario",
    contactName: "Hernán Ospina",
    contactPhone: "+57 311 234 5678",
    contactWhatsapp: "573112345678",
    requesterType: "PERSONA",
    operatingHours: "08:00 a. m. - 05:00 p. m.",
    createdAt: "2026-08-11T07:30:00Z",
    updatedAt: "2026-08-11T07:30:00Z",
    isDemoData: true,
  },
  {
    cityId: "cali",
    emergencyId: "terremoto-cali-2026",
    title: "Atención Médica Veterinaria y Mascotas Desorientadas — Granada",
    description:
      "Clínica veterinaria solidaria atendiendo mascotas heridas o desorientadas durante las evacuaciones. Se necesitan medicamentos de curación, sueros veterinarios y jaulas de transporte.",
    placeType: "ORGANIZACION",
    categories: ["ANIMALES", "MEDICAMENTOS", "ATENCION_MEDICA"],
    resources: [
      { id: "r17", type: "MEDICAMENTOS", description: "Gazas, antisépticos y analgésicos veterinarios", requestedQuantity: 20, fulfilledQuantity: 14, unit: "kits", status: "PARTIAL" },
      { id: "r18", type: "ANIMALES", description: "Guacales / Jaulas de transporte temporal", requestedQuantity: 10, fulfilledQuantity: 10, unit: "unidades", status: "FULFILLED" },
    ],
    address: "Avenida 9 Norte # 14N-30",
    neighborhood: "Granada",
    latitude: 3.4578,
    longitude: -76.5341,
    priority: "MEDIUM",
    status: "PARTIALLY_COVERED",
    verificationStatus: "VERIFIED",
    verifiedBy: "Colectivo Protección Animal Cali",
    verifiedAt: "2026-08-10T22:00:00Z",
    source: "Fundación Huellitas Cali",
    contactName: "Dra. Andrea Morales",
    contactPhone: "+57 316 789 0123",
    contactWhatsapp: "573167890123",
    organizationName: "Fundación Huellitas Cali",
    requesterType: "FUNDACION",
    operatingHours: "08:00 a. m. - 07:00 p. m.",
    createdAt: "2026-08-10T19:00:00Z",
    updatedAt: "2026-08-11T08:12:00Z",
    isDemoData: true,
  },
  {
    cityId: "cali",
    emergencyId: "terremoto-cali-2026",
    title: "Comunidad Terrón Colorado — Desprendimiento en Vía al Mar",
    description:
      "Afectación vial y paso restringido. Requieren personas con botas de seguridad y palas para apoyar despeje de tierra en paso peatonal de acceso al barrio.",
    placeType: "COMUNIDAD_AFECTADA",
    categories: ["ESCOMBROS", "MAQUINARIA", "MANO_OBRA", "HERRAMIENTAS"],
    resources: [
      { id: "r19", type: "HERRAMIENTAS", description: "Palas anchas y picos", requestedQuantity: 12, fulfilledQuantity: 12, unit: "unidades", status: "FULFILLED" },
      { id: "r20", type: "MANO_OBRA", description: "Voluntarios con botas de caucho", requestedQuantity: 10, fulfilledQuantity: 4, unit: "personas", status: "PARTIAL" },
    ],
    address: "Avenida 4 Oeste con Calle 10",
    neighborhood: "Terrón Colorado",
    latitude: 3.4589,
    longitude: -76.5543,
    priority: "LOW",
    status: "PARTIALLY_COVERED",
    verificationStatus: "VERIFIED",
    verifiedBy: "Secretaría de Infraestructura Cali",
    verifiedAt: "2026-08-11T06:00:00Z",
    source: "Comité de Gestión Terrón Colorado",
    contactName: "Gustavo Adolfo Mina",
    contactPhone: "+57 318 333 4455",
    contactWhatsapp: "573183334455",
    requesterType: "COMUNIDAD",
    operatingHours: "07:00 a. m. - 05:00 p. m.",
    createdAt: "2026-08-10T21:00:00Z",
    updatedAt: "2026-08-11T07:10:00Z",
    isDemoData: true,
  },
];

// Seed demo data - run with: npx convex run seed:seedDemoData
export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existing = await ctx.db.query("needs").first();
    if (existing) {
      // Clear existing data first
      const allNeeds = await ctx.db.query("needs").collect();
      for (const need of allNeeds) {
        await ctx.db.delete(need._id);
      }
      const allReports = await ctx.db.query("reports").collect();
      for (const report of allReports) {
        await ctx.db.delete(report._id);
      }
      const allLogs = await ctx.db.query("updateLogs").collect();
      for (const log of allLogs) {
        await ctx.db.delete(log._id);
      }
      const allAudit = await ctx.db.query("auditLogs").collect();
      for (const audit of allAudit) {
        await ctx.db.delete(audit._id);
      }
    }

    // Insert demo needs
    for (const need of DEMO_NEEDS) {
      await ctx.db.insert("needs", need);
    }

    // Insert audit log
    await ctx.db.insert("auditLogs", {
      action: "SEED_INITIAL_DEMO_DATA",
      adminEmail: "sistema@aquihacefalta.org",
      timestamp: new Date().toISOString(),
      details: "Datos demo iniciales cargados para la emergencia en Cali.",
    });

    return { success: true, count: DEMO_NEEDS.length };
  },
});
