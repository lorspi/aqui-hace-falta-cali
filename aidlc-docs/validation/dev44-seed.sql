-- Seed temporal de reportes del chatbot (US-5 / DEV-44) para evidencia local.
-- Prefijo dev44%; se elimina al final de la batería de evidencia.
INSERT INTO needs
  (title, description, place_type, address, neighborhood, latitude, longitude,
   priority, status, verification_status, source, contact_name, contact_whatsapp,
   requester_type, created_at, updated_at, source_event_id, conversation_id, location_enrichment_status)
VALUES
  ('dev44_agua_critical', 'Falla el suministro de agua en todo el barrio', 'COMUNIDAD_AFECTADA', 'Calle 1 #2-3', 'El Peñón', 3.4516, -76.532,
   'CRITICAL', 'NEED_HELP_NOW', 'PENDING_VERIFICATION', 'WhatsApp', 'Ciudadano WhatsApp', '573101111111',
   'PERSONA', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes', 'evt_dev44_01', 'conv_dev44_01', 'RESOLVED'),
  ('dev44_medicamentos_high', 'Se necesitan medicamentos urgentes', 'HOSPITAL', 'Calle 2 #3-4', 'San Fernando', 3.45, -76.53,
   'HIGH', 'NEED_HELP_NOW', 'PENDING_VERIFICATION', 'WhatsApp', 'Ciudadano WhatsApp', '573102222222',
   'PERSONA', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', 'evt_dev44_02', 'conv_dev44_02', 'PENDING'),
  ('dev44_refugio_verified', 'Se ofrece refugio temporal', 'REFUGIO', 'Calle 3 #4-5', 'Centro', 3.44, -76.51,
   'MEDIUM', 'NEED_HELP_NOW', 'VERIFIED', 'WhatsApp', 'Ciudadano WhatsApp', '573103333333',
   'PERSONA', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', 'evt_dev44_03', 'conv_dev44_03', 'RESOLVED'),
  ('dev44_escombros_rejected', 'Reporte duplicado', 'EDIFICIO_AFECTADO', 'Calle 4 #5-6', 'Granada', 3.43, -76.5,
   'LOW', 'NEED_HELP_NOW', 'REJECTED', 'WhatsApp', 'Ciudadano WhatsApp', '573104444444',
   'PERSONA', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', 'evt_dev44_04', 'conv_dev44_04', 'PENDING'),
  ('dev44_otro_sincontacto', 'Reporte sin teléfono legible', 'OTRO', 'Calle 5 #6-7', 'Nueva Granada', 3.42, -76.49,
   'MEDIUM', 'NEED_HELP_NOW', 'PENDING_VERIFICATION', 'WhatsApp', 'Ciudadano WhatsApp', NULL,
   'PERSONA', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', 'evt_dev44_05', 'conv_dev44_05', 'PENDING'),
  ('dev44_app_agua', 'Reporte desde la app (fuente distinta)', 'COMUNIDAD_AFECTADA', 'Calle 9 #8-7', 'Valle del Lili', 3.41, -76.48,
   'HIGH', 'NEED_HELP_NOW', 'PENDING_VERIFICATION', 'Reporte ciudadano en línea', 'Ciudadano App', NULL,
   'PERSONA', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes', NULL, NULL, 'RESOLVED');
