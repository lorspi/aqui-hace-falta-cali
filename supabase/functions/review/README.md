# Edge Function `review` — Transición de estado de revisión (US-4 / DEV-43)

Endpoint de **escritura** para el operador/moderador de RaDAR de Ayuda: aprueba
o rechaza un reporte **ya revisado** (un need con
`verification_status = PENDING_VERIFICATION`), confirmando cuáles necesidades
son reales y cuáles no.

## Ruta

| Método | Ruta (local) | Descripción |
|--------|--------------|-------------|
| `POST` | `http://127.0.0.1:8002/functions/v1/review` | Aprueba o rechaza un need pendiente de verificación |

En producción la base es `https://<project-ref>.supabase.co/functions/v1/review`.

## Cuerpo de la solicitud

```json
{
  "need_id": "…uuid del need…",
  "decision": "aprobar",
  "verified_by": "operador@ra dar.local",
  "notes": "Verificado en terreno por voluntarios de la Cruz Roja"
}
```

| Campo | Tipo | ¿Requerido? | Descripción |
|-------|------|-------------|-------------|
| `need_id` | `string` | ✅ | Id del need a revisar (UUID). |
| `decision` | `string` | ✅ | `aprobar` / `approve` (→ `VERIFIED`) o `rechazar` / `reject` (→ `REJECTED`). |
| `verified_by` | `string` | ✅ | Identificación del operador que toma la decisión (trazabilidad). |
| `notes` | `string` | — | Motivo / nota opcional de la decisión. |

## Respuesta

### 200 — revisión aplicada

```json
{
  "ok": true,
  "status": "reviewed",
  "decision": "approve",
  "need": {
    "id": "…uuid…",
    "title": "Necesito agua potable en mi barrio",
    "description": "Necesito agua potable en mi barrio",
    "source": "WhatsApp",
    "contact_whatsapp": "573001234567",
    "conversation_id": "conv_001",
    "source_event_id": "evt_c1",
    "verification_status": "VERIFIED",
    "verified_by": "operador@radar.local",
    "verified_at": "2026-08-24T19:20:48.547Z",
    "verification_notes": "Verificado en terreno por voluntarios de la Cruz Roja",
    "last_updated_by": "operador@radar.local",
    "updated_at": "…"
  }
}
```

### Transiciones

| Decisión | `verification_status` destino | Nota de dominio |
|----------|-------------------------------|-----------------|
| `aprobar` / `approve` | `VERIFIED` | El need cuenta como **necesidad real** para el resto del sistema. |
| `rechazar` / `reject` | `REJECTED` | El registro **permanece** en `needs` para trazabilidad pero se **excluye** de las vistas/consultas de necesidades "oficiales". |

En ambos casos se guarda `verified_by` (quién), `verified_at` (cuándo) y,
opcionalmente, `verification_notes` (motivo). **Rechazar sin motivo es válido**:
`verification_notes` queda vacío/nulo.

## Errores

| Caso | HTTP | Body |
|------|------|------|
| Need inexistente o id inválido (no-UUID) | `404` | `{ "code": "need_not_found", "details": { "need_id": "…" } }` |
| Need con `verification_status` distinto de `PENDING_VERIFICATION` (p. ej. ya `VERIFIED`/`REJECTED`) | `409` | `{ "code": "invalid_verification_status", "details": { "need_id": "…", "current_status": "VERIFIED" } }` — el registro **no se modifica** |
| Decisión que no es aprobar/rechazar | `400` | `{ "code": "invalid_decision", ... }` — el registro **no se modifica** |
| Falta `verified_by` (operador no identificado) | `400` | `{ "code": "missing_operator", ... }` — el registro **no se modifica** |
| Falta `need_id` / body inválido | `400` | `{ "code": "validation_failed", ... }` |
| Body no es JSON válido | `400` | `{ "code": "invalid_json", ... }` |
| Content-Type no es JSON | `415` | `{ "code": "invalid_content_type", ... }` |
| Método distinto de POST | `405` | `{ "code": "method_not_allowed", ... }` |
| Error interno | `500` | `{ "code": "review_failed", ... }` (genérico; causa vía log) |

> **Decisión de dominio**: el frontend actual tipa
> `VerificationStatus = VERIFIED | PENDING_VERIFICATION | REPORTED | ARCHIVED`
> (sin `REJECTED`). US-4 asume `REJECTED` tal como pide la card. Esta historia
> implementa el endpoint de backend con `REJECTED`; el frontend deberá agregar
> `REJECTED` al enum/filtros (o mapearlo a `ARCHIVED`) cuando consuma este
> endpoint — ver nota de dominio de US-4.

## Ejecución local

```bash
supabase start          # (opcional) levanta el stack local
supabase functions serve review
# POST http://127.0.0.1:54341/functions/v1/review
```

Si el CLI falla (ver nota de DEV-42), se sirve la función con Deno directamente:

```bash
deno run --allow-net --allow-env --allow-read \
  --env-file=/tmp/radar_edge.env supabase/functions/review/index.ts
```

El bootstrap (`index.ts`) crea el store de `needs` contra PostgREST usando
`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. El rol `service_role` lee y
actualiza `needs` (BYPASSRLS).
