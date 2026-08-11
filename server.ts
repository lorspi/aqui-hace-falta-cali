import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DEMO_CITY, DEMO_EMERGENCY, INITIAL_DEMO_NEEDS } from './src/data/demoData';
import { AuditLog, Need, NeedUpdateLog, Report } from './src/types';

const DATA_FILE = path.join(process.cwd(), 'data_store.json');

// In-memory persistent data store
let needsStore: Need[] = [];
let reportsStore: Report[] = [];
let updateLogsStore: NeedUpdateLog[] = [];
let auditLogsStore: AuditLog[] = [];

// Helper to calculate haversine distance in KM
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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

// Load data store from disk or seed with demo data
function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      needsStore = parsed.needsStore || [];
      reportsStore = parsed.reportsStore || [];
      updateLogsStore = parsed.updateLogsStore || [];
      auditLogsStore = parsed.auditLogsStore || [];
      console.log(`[Store] Loaded ${needsStore.length} needs from file.`);
    } else {
      needsStore = [...INITIAL_DEMO_NEEDS];
      reportsStore = [];
      updateLogsStore = [];
      auditLogsStore = [
        {
          id: 'audit-0',
          action: 'SEED_INITIAL_DEMO_DATA',
          adminEmail: 'sistema@aquihacefalta.org',
          timestamp: new Date().toISOString(),
          details: 'Datos demo iniciales cargados para la emergencia en Cali.',
        },
      ];
      saveStore();
      console.log(`[Store] Initialized with ${needsStore.length} demo needs.`);
    }
  } catch (err) {
    console.error('[Store] Error loading data store:', err);
    needsStore = [...INITIAL_DEMO_NEEDS];
  }
}

function saveStore() {
  try {
    const payload = {
      needsStore,
      reportsStore,
      updateLogsStore,
      auditLogsStore,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Failed to save store:', err);
  }
}

async function startServer() {
  loadStore();

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const PORT = 3000;

  // --- API ENDPOINTS ---

  // Cities
  app.get('/api/cities', (req, res) => {
    res.json({ success: true, data: [DEMO_CITY] });
  });

  // Emergencies
  app.get('/api/emergencies', (req, res) => {
    res.json({ success: true, data: [DEMO_EMERGENCY] });
  });

  // Query needs with filters
  app.get('/api/needs', (req, res) => {
    const {
      search,
      category,
      priority,
      placeType,
      status,
      verificationStatus,
      userLat,
      userLng,
      distanceKm,
      sortBy,
    } = req.query;

    let result = [...needsStore];

    // Exclude archived unless requested
    if (verificationStatus !== 'ARCHIVED') {
      result = result.filter((n) => n.verificationStatus !== 'ARCHIVED');
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.neighborhood.toLowerCase().includes(q) ||
          n.address.toLowerCase().includes(q) ||
          n.categories.some((c) => c.toLowerCase().includes(q)) ||
          n.resources.some((r) => r.description.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'ALL') {
      const cats = Array.isArray(category) ? category : [category];
      result = result.filter((n) => n.categories.some((c) => cats.includes(c)));
    }

    if (priority && priority !== 'ALL') {
      result = result.filter((n) => n.priority === priority);
    }

    if (placeType && placeType !== 'ALL') {
      result = result.filter((n) => n.placeType === placeType);
    }

    if (status && status !== 'ALL') {
      result = result.filter((n) => n.status === status);
    }

    if (verificationStatus && verificationStatus !== 'ALL') {
      result = result.filter((n) => n.verificationStatus === verificationStatus);
    }

    // Geolocation distance filter
    if (userLat && userLng && distanceKm) {
      const uLat = parseFloat(String(userLat));
      const uLng = parseFloat(String(userLng));
      const maxDist = parseFloat(String(distanceKm));
      if (!isNaN(uLat) && !isNaN(uLng) && !isNaN(maxDist)) {
        result = result.filter((n) => {
          const dist = getDistanceKm(uLat, uLng, n.latitude, n.longitude);
          return dist <= maxDist;
        });
      }
    }

    // Sort order
    const priorityWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    if (sortBy === 'RECENT') {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sortBy === 'DISTANCE' && userLat && userLng) {
      const uLat = parseFloat(String(userLat));
      const uLng = parseFloat(String(userLng));
      result.sort((a, b) => {
        const dA = getDistanceKm(uLat, uLng, a.latitude, a.longitude);
        const dB = getDistanceKm(uLat, uLng, b.latitude, b.longitude);
        return dA - dB;
      });
    } else {
      // Default: Priority -> Verification -> Updated date
      result.sort((a, b) => {
        const pA = priorityWeight[a.priority] || 0;
        const pB = priorityWeight[b.priority] || 0;
        if (pB !== pA) return pB - pA;

        const vA = a.verificationStatus === 'VERIFIED' ? 1 : 0;
        const vB = b.verificationStatus === 'VERIFIED' ? 1 : 0;
        if (vB !== vA) return vB - vA;

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    res.json({ success: true, count: result.length, data: result });
  });

  // Duplicate Check API
  app.post('/api/needs/check-duplicate', (req, res) => {
    const { title, neighborhood, latitude, longitude } = req.body;
    const matches = needsStore.filter((n) => {
      let isNearby = false;
      if (latitude && longitude && n.latitude && n.longitude) {
        const dist = getDistanceKm(latitude, longitude, n.latitude, n.longitude);
        if (dist <= 0.5) isNearby = true;
      }
      const titleSimilar =
        title && n.title.toLowerCase().includes(String(title).toLowerCase().slice(0, 10));
      const sameNeighborhood =
        neighborhood && n.neighborhood.toLowerCase().trim() === String(neighborhood).toLowerCase().trim();

      return (isNearby && sameNeighborhood) || (isNearby && titleSimilar);
    });

    res.json({
      success: true,
      hasDuplicates: matches.length > 0,
      matches: matches.slice(0, 3),
    });
  });

  // Get Single Need by ID
  app.get('/api/needs/:id', (req, res) => {
    const item = needsStore.find((n) => n.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Necesidad no encontrada' });
    }
    const updates = updateLogsStore.filter((u) => u.needId === item.id);
    res.json({ success: true, data: item, updates });
  });

  // Create new Need (Propose Need)
  app.post('/api/needs', (req, res) => {
    try {
      const {
        title,
        description,
        placeType,
        categories,
        resources,
        address,
        neighborhood,
        latitude,
        longitude,
        contactName,
        contactPhone,
        contactWhatsapp,
        contactEmail,
        organizationName,
        requesterType,
        source,
        evidenceUrl,
        operatingHours,
      } = req.body;

      if (!title || !description || !address || !neighborhood) {
        return res
          .status(400)
          .json({ success: false, error: 'Campos requeridos incompletos (título, descripción, dirección, barrio)' });
      }

      const now = new Date().toISOString();
      const newNeed: Need = {
        id: `need-${Date.now()}`,
        cityId: 'cali',
        emergencyId: 'terremoto-cali-2026',
        title,
        description,
        placeType: placeType || 'OTRO',
        categories: categories || ['VOLUNTARIADO_GENERAL'],
        resources: Array.isArray(resources)
          ? resources.map((r: any, idx: number) => ({
              id: `res-${Date.now()}-${idx}`,
              type: r.type || 'VOLUNTARIADO_GENERAL',
              description: r.description || '',
              requestedQuantity: r.requestedQuantity ? Number(r.requestedQuantity) : undefined,
              fulfilledQuantity: r.fulfilledQuantity ? Number(r.fulfilledQuantity) : 0,
              unit: r.unit || 'unidades',
              status: 'PENDING',
            }))
          : [],
        address,
        neighborhood,
        latitude: Number(latitude) || 3.4516,
        longitude: Number(longitude) || -76.532,
        priority: 'MEDIUM', // Default priority before admin review
        status: 'NEED_HELP_NOW',
        verificationStatus: 'PENDING_VERIFICATION', // STRICT RULE: Starts as pending verification
        source: source || 'Reporte ciudadano en línea',
        contactName: contactName || 'Anon',
        contactPhone,
        contactWhatsapp,
        contactEmail,
        organizationName,
        requesterType: requesterType || 'PERSONA',
        operatingHours,
        evidenceUrl,
        createdAt: now,
        updatedAt: now,
        isDemoData: false,
      };

      needsStore.unshift(newNeed);

      // Add creation log
      updateLogsStore.unshift({
        id: `upd-${Date.now()}`,
        needId: newNeed.id,
        previousStatus: 'NEED_HELP_NOW',
        newStatus: 'NEED_HELP_NOW',
        description: 'Punto de necesidad registrado por el usuario. Pendiente de verificación.',
        updatedBy: contactName || 'Ciudadano',
        createdAt: now,
      });

      saveStore();
      res.status(201).json({ success: true, data: newNeed });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error guardando necesidad' });
    }
  });

  // User updates need status / progress
  app.patch('/api/needs/:id', (req, res) => {
    const item = needsStore.find((n) => n.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Necesidad no encontrada' });
    }

    const { status, description, resources } = req.body;
    const now = new Date().toISOString();
    const prevStatus = item.status;

    if (status) item.status = status;
    if (description) item.description = description;
    if (resources && Array.isArray(resources)) {
      item.resources = resources;
    }
    item.updatedAt = now;

    // Log update
    updateLogsStore.unshift({
      id: `upd-${Date.now()}`,
      needId: item.id,
      previousStatus: prevStatus,
      newStatus: item.status,
      description: description || `Estado cambiado a ${item.status}`,
      updatedBy: req.body.updatedBy || 'Ciudadano / Responsable del punto',
      createdAt: now,
    });

    saveStore();
    res.json({ success: true, data: item });
  });

  // Add custom update note to timeline
  app.post('/api/needs/:id/updates', (req, res) => {
    const item = needsStore.find((n) => n.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Necesidad no encontrada' });
    }

    const { newStatus, description, updatedBy } = req.body;
    const now = new Date().toISOString();
    const prevStatus = item.status;

    if (newStatus) {
      item.status = newStatus;
      item.updatedAt = now;
    }

    const updateLog: NeedUpdateLog = {
      id: `upd-${Date.now()}`,
      needId: item.id,
      previousStatus: prevStatus,
      newStatus: item.status,
      description: description || 'Actualización registrada en el punto.',
      updatedBy: updatedBy || 'Coordinador del punto',
      createdAt: now,
    };

    updateLogsStore.unshift(updateLog);
    saveStore();

    res.json({ success: true, data: updateLog, need: item });
  });

  // Submit report for incorrect or outdated information
  app.post('/api/needs/:id/reports', (req, res) => {
    const item = needsStore.find((n) => n.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Necesidad no encontrada' });
    }

    const { reason, description, reporterContact } = req.body;
    const now = new Date().toISOString();

    const newReport: Report = {
      id: `rep-${Date.now()}`,
      needId: item.id,
      needTitle: item.title,
      reason: reason || 'OTHER',
      description: description || 'Reporte de información incorrecta',
      reporterContact,
      status: 'PENDING',
      createdAt: now,
    };

    reportsStore.unshift(newReport);

    // If 2+ reports or critical flag, mark verificationStatus as REPORTED to warn users
    const pendingReports = reportsStore.filter((r) => r.needId === item.id && r.status === 'PENDING');
    if (pendingReports.length >= 1 && item.verificationStatus !== 'VERIFIED') {
      item.verificationStatus = 'REPORTED';
    }

    saveStore();
    res.status(201).json({ success: true, data: newReport, message: 'Reporte enviado a moderación' });
  });

  // --- ADMIN ENDPOINTS ---

  // Admin login
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === 'admin123' || password === process.env.ADMIN_PASSWORD) {
      return res.json({ success: true, token: 'session-admin-token-2026', role: 'ADMIN' });
    }
    return res.status(401).json({ success: false, error: 'Contraseña de administración incorrecta' });
  });

  // Admin list all needs + reports + audit logs
  app.get('/api/admin/needs', (req, res) => {
    res.json({
      success: true,
      needs: needsStore,
      reports: reportsStore,
      auditLogs: auditLogsStore,
    });
  });

  // Admin moderation action (verify, set priority, edit, archive)
  app.post('/api/admin/needs/:id/verify', (req, res) => {
    const item = needsStore.find((n) => n.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Necesidad no encontrada' });
    }

    const {
      verificationStatus,
      priority,
      verifiedBy,
      verificationNotes,
      status,
      title,
      description,
      categories,
      adminEmail,
    } = req.body;

    const now = new Date().toISOString();
    const oldVerification = item.verificationStatus;
    const oldPriority = item.priority;

    if (verificationStatus) item.verificationStatus = verificationStatus;
    if (priority) item.priority = priority;
    if (verifiedBy) item.verifiedBy = verifiedBy;
    if (verificationNotes) item.verificationNotes = verificationNotes;
    if (status) item.status = status;
    if (title) item.title = title;
    if (description) item.description = description;
    if (categories && Array.isArray(categories)) item.categories = categories;

    if (verificationStatus === 'VERIFIED') {
      item.verifiedAt = now;
    }
    item.updatedAt = now;

    // Audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'MODERATE_NEED',
      needId: item.id,
      adminEmail: adminEmail || 'moderador@aquihacefalta.org',
      timestamp: now,
      details: `Verificación: ${oldVerification} -> ${item.verificationStatus}. Prioridad: ${oldPriority} -> ${item.priority}.`,
    };
    auditLogsStore.unshift(audit);

    saveStore();
    res.json({ success: true, data: item });
  });

  // Admin resolve report
  app.post('/api/admin/reports/:id/resolve', (req, res) => {
    const report = reportsStore.find((r) => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Reporte no encontrado' });
    }

    const { action, adminEmail } = req.body; // 'DISMISS' or 'RESOLVE_ARCHIVE' or 'RESOLVE_FIX'
    const now = new Date().toISOString();

    report.status = action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';
    report.resolvedAt = now;
    report.resolvedBy = adminEmail || 'Admin';

    if (action === 'RESOLVE_ARCHIVE') {
      const need = needsStore.find((n) => n.id === report.needId);
      if (need) {
        need.verificationStatus = 'ARCHIVED';
        need.status = 'CLOSED';
        need.updatedAt = now;
      }
    }

    auditLogsStore.unshift({
      id: `audit-${Date.now()}`,
      action: 'RESOLVE_REPORT',
      needId: report.needId,
      adminEmail: adminEmail || 'Admin',
      timestamp: now,
      details: `Reporte ${report.id} marcado como ${report.status}. Acción: ${action}`,
    });

    saveStore();
    res.json({ success: true, data: report });
  });

  // Admin Metrics API
  app.get('/api/admin/metrics', (req, res) => {
    const total = needsStore.length;
    const active = needsStore.filter((n) => n.status !== 'CLOSED' && n.verificationStatus !== 'ARCHIVED').length;
    const pendingVerification = needsStore.filter((n) => n.verificationStatus === 'PENDING_VERIFICATION').length;
    const critical = needsStore.filter((n) => n.priority === 'CRITICAL' && n.status !== 'CLOSED').length;
    const verified = needsStore.filter((n) => n.verificationStatus === 'VERIFIED').length;
    const reported = needsStore.filter((n) => n.verificationStatus === 'REPORTED' || reportsStore.some((r) => r.needId === n.id && r.status === 'PENDING')).length;
    const covered = needsStore.filter((n) => n.status === 'COVERED' || n.status === 'CLOSED').length;

    // Demand by Category
    const categoryCounts: Record<string, number> = {};
    needsStore.forEach((n) => {
      n.categories.forEach((c) => {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
    });

    // Neighborhood clusters
    const neighborhoodCounts: Record<string, number> = {};
    needsStore.forEach((n) => {
      if (n.neighborhood) {
        neighborhoodCounts[n.neighborhood] = (neighborhoodCounts[n.neighborhood] || 0) + 1;
      }
    });

    res.json({
      success: true,
      metrics: {
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
      },
    });
  });

  // Reset demo data API
  app.post('/api/admin/reset-demo', (req, res) => {
    needsStore = [...INITIAL_DEMO_NEEDS];
    reportsStore = [];
    updateLogsStore = [];
    auditLogsStore = [
      {
        id: `audit-${Date.now()}`,
        action: 'RESET_DEMO_DATA',
        adminEmail: 'admin@aquihacefalta.org',
        timestamp: new Date().toISOString(),
        details: 'Datos restablecidos a la semilla inicial de Cali.',
      },
    ];
    saveStore();
    res.json({ success: true, message: 'Datos demo restablecidos exitosamente' });
  });

  // Vite Integration in Express
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aquí Hace Falta] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
