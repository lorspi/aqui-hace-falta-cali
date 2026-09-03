# Guía de Pruebas End-to-End — Integración Bot de WhatsApp (RaDAR de Ayuda)

**Instancia verificada:** `https://etylcnafubtljlzbzkhz.supabase.co` (Backend Dev - Radar de ayudas)

---

## Qué valida esta guía

| # | Flujo | Historia |
|---|-------|----------|
| 1 | Recepción y persistencia idempotente de eventos del webhook | S2 / S4 / S6 / S7 |
| 2 | Creación automática del incidente al completar la conversación | S5 |
| 3 | Reconstrucción de la conversación para el frontend | US-3 |
| 4 | Revisión (aprobar / rechazar) | US-4 |
| 5 | Pantalla del panel de moderación (listado + detalle + acciones) | US-5 / US-6 / US-7 |

---

## Endpoints (instancia dev)

| Función | Método / Ruta | Auth |
|---------|---------------|------|
| `webhook` | `POST {URL}/functions/v1/webhook` | Bearer service role key |
| `conversation` | `GET {URL}/functions/v1/conversation/needs/{id}/conversation` | anon key |
| `review` | `POST {URL}/functions/v1/review` | anon key |

Donde `{URL} = https://etylcnafubtljlzbzkhz.supabase.co`.

> Para el `webhook`, usa la **service role key** del proyecto receptor
> (server-to-server), no la anon key. Guárdala como secreto en el proyecto del
> bot y envíala como `Authorization: Bearer <key>`.

**Anon key (pública):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0eWxjbmFmdWJ0bGpsemJ6a2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDA5ODUsImV4cCI6MjEwMjgxNjk4NX0.9n05cJe6AXyEJNWHASS2_kCy5xu-pFD0EmdsazbjxE4
```

---

## 1) Webhook — mensaje entrante (`message.received`)

```bash
SRV="<SERVICE_ROLE_KEY_DEL_PROYECTO_RECEPTOR>"
curl -X POST https://etylcnafubtljlzbzkhz.supabase.co/functions/v1/webhook \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $SRV" \
  -d '{
    "id": "evt_prueba_001",
    "type": "message.received",
    "conversation_id": "conv_prueba_001",
    "data": {
      "body": "Necesito agua potable en mi barrio",
      "from": "573001234567",
      "message_type": "text",
      "workflow": { "step": "awaiting_location" }
    }
  }'
```

**Esperado (HTTP 200):** `{ "ok": true, "status": "accepted", "persisted": true, "mapping": {...} }`

> El `id` debe ser **único**. Reenviar el mismo `id` → `409 duplicate_event`.

---

## 2) Webhook — completar conversación (`conversation_completed`) → crea el incidente

```bash
SRV="<SERVICE_ROLE_KEY_DEL_PROYECTO_RECEPTOR>"
curl -X POST https://etylcnafubtljlzbzkhz.supabase.co/functions/v1/webhook \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $SRV" \
  -d '{
    "id": "evt_prueba_002",
    "type": "conversation_completed",
    "conversation_id": "conv_prueba_001",
    "data": {
      "body": "Gracias, eso es todo",
      "from": "573001234567",
      "address": "Calle 5 # 10-20",
      "neighborhood": "San Antonio"
    }
  }'
```

**Esperado (HTTP 200):** `"incident": { "outcome": "created", "id": "...", ... }`.
El incidente se crea en `needs` con `source=WhatsApp`, `verification_status=PENDING_VERIFICATION`, `priority=MEDIUM`, `status=NEED_HELP_NOW`.

> El completado también requiere `body`. Tipos reconocidos: `conversation_completed`, `conversation.completed` o `data.workflow.step = "COMPLETED"`.

---

## 3) Reconstrucción de conversación (US-3)

Usa el `need.id` del paso 2.

```bash
ANON="<ANON_KEY_DE_ARRIBA>"
curl -s "https://etylcnafubtljlzbzkhz.supabase.co/functions/v1/conversation/needs/{need_id}/conversation" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```

**Esperado (HTTP 200):** `{ "conversation_id", "has_need": true, "need": {...}, "messages": [{ "event_id", "sender", "content", "type", "attachments", "received_at" }] }`

---

## 4) Revisión — aprobar / rechazar (US-4)

```bash
ANON="<ANON_KEY_DE_ARRIBA>"
# Aprobar
curl -X POST "https://etylcnafubtljlzbzkhz.supabase.co/functions/v1/review" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -d '{"need_id": "{need_id}", "decision": "aprobar", "verified_by": "operador@radar.local", "notes": "Verificado en prueba"}'

# Rechazar
curl -X POST "https://etylcnafubtljlzbzkhz.supabase.co/functions/v1/review" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -d '{"need_id": "{need_id}", "decision": "rechazar", "verified_by": "operador@radar.local", "notes": "Datos no confirmados"}'
```

**Esperado (HTTP 200):** `{ "ok": true, "status": "reviewed", "decision": "approve|reject", "need": { "verification_status": "VERIFIED|REJECTED", "verified_by": "...", "verified_at": "..." } }`

---

## 5) Pantalla del panel (frontend)

1. Levantar el frontend: `npm run dev` (`.env.local` → `https://etylcnafubtljlzbzkhz.supabase.co`).
2. Abrir **http://localhost:8080/panel**.
3. Login rápido: usuario cualquiera + contraseña `moderador123` (o `admin123`).
4. Ver **"Reportes del chatbot"** (needs con `source = 'WhatsApp'`).
5. Abrir el **detalle** de un reporte → conversación formateada + datos del incidente.
6. Usar **Aprobar** / **Rechazar** → llama a la función `review` (US-4).

---

## Códigos de respuesta

| HTTP | Código | Significado |
|------|--------|-------------|
| 200 | — | Evento aceptado / incidente creado / revisión aplicada |
| 400 | `validation_failed` | Campos mínimos faltantes o inválidos |
| 400 | `invalid_json` | Body no es JSON válido |
| 400 | `invalid_from` | `data.from` no es un WhatsApp válido (E.164) |
| 400 | `invalid_decision` / `missing_operator` | Revisión inválida |
| 404 | `need_not_found` | `need_id` inexistente |
| 409 | `duplicate_event` | Reenvío del mismo `event.id` |
| 409 | `no_messages` | Completado sin mensajes previos |
| 409 | `invalid_verification_status` | El need ya no está `PENDING_VERIFICATION` |
| 415 | `invalid_content_type` | Content-Type distinto de JSON |
| 405 | `method_not_allowed` | Método distinto del esperado |
| 500 | `persistence_failed` / `incident_creation_failed` / `review_failed` | Error interno (genérico) |

---

## Modelo de datos relevante

- **`ingest_responses`**: auditoría de eventos crudos. Clave `event_id` UNIQUE (idempotencia). `raw_payload` (jsonb) con el evento completo.
- **`needs`**: incidente. Columnas clave: `conversation_id`, `source_event_id`, `source`, `contact_whatsapp`, `address`, `neighborhood`, `priority`, `status`, `verification_status`, `verified_by`, `verified_at`, `verification_notes`, `latitude`, `longitude`, `city_id`, `location_enrichment_status`.
- **Un incidente por conversación** (idempotencia por `source_event_id` y `conversation_id`).
