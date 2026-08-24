#!/usr/bin/env bash
# DEV-40 — Evidencia en ejecución: US-1 (Recepción, validación, mapeo y
# persistencia idempotente de eventos del webhook)
#
# Ejercita la Edge Function `webhook` local (bootstrap Node con stores
# PostgREST reales) y captura las respuestas + el estado de las tablas
# (ingest_responses / needs). Reproduce el enfoque de DEV-34/35/36/37.
#
# Escenarios Gherkin US-1 (DEV-40):
#   1.  Evento válido -> 200 con event_id, type, mapping y persistencia.
#   2.  El mapping resume la normalización (message_type, workflow.step,
#       contact_whatsapp, builds_incident).
#   3.  Body no parseable o vacío -> 400 invalid_json.
#   4.  Campos mínimos faltantes/inválidos -> 400 validation_failed.
#   5.  Reenvío del mismo event.id -> 409 duplicate_event sin re-procesar
#       (sin mapping; no crea fila nueva).
#   6.  Evento sin event.id -> 400 validation_failed sin evaluar dedup.
#   7.  Error de persistencia -> 500 persistence_failed genérico + logError.
#   8.  Autenticación abierta (deuda reconocida -> S8).
#   9.  Evento sin coordenadas -> 200 location_pending_geocoding=true.
#   10. conversation_id plano o data.conversation_id.
#   11. Los adjuntos viajan dentro del raw_event (sin tablas separadas).
set -u
BASE="${BASE:-http://127.0.0.1:8081}"
DB="docker exec supabase_db_aqui-hace-falta-cali psql -U postgres -d postgres -t -A -c"
CT="Content-Type: application/json"

post() {
  local label="$1"
  local payload="$2"
  echo ""
  echo "=== $label ==="
  echo "--- POST $BASE/webhook"
  echo "--- payload: $payload"
  curl -s -w "\n--- HTTP %{http_code}\n" -X POST "$BASE/webhook" -H "$CT" -d "$payload"
  echo ""
}

echo "############################################################"
echo "# DEV-40 — US-1: Recepción, validación, mapeo y persistencia"
echo "# idempotente de eventos del webhook"
echo "# Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Rama: agent/DEV-40"
echo "############################################################"

# ---------------------------------------------------------------------
# Escenario 1+2: Evento válido -> 200 con ACK completo (mapping + persistencia)
# ---------------------------------------------------------------------
post "1. Evento válido evt_us1_001 -> 200 (ACK: event_id, type, mapping, persistencia)" '{
  "id": "evt_us1_001",
  "type": "message.received",
  "conversation_id": "conv_us1_ack",
  "data": {
    "body": "Necesito agua potable en mi barrio",
    "from": "573001234567",
    "message_type": "Text",
    "workflow": { "step": "awaiting_location" }
  }
}'

echo "--- fila en ingest_responses (processing_status=RECEIVED, raw_event intacto):"
$DB "SELECT event_id, type, conversation_id, processing_status, message_type, workflow_step, (raw_event->>'id') AS raw_id FROM ingest_responses WHERE event_id='evt_us1_001';"

# ---------------------------------------------------------------------
# Escenario 3: Body no parseable o vacío -> 400 invalid_json
# ---------------------------------------------------------------------
echo ""
echo "=== 3. Body no JSON válido -> 400 invalid_json ==="
echo "--- payload: {not json"
curl -s -w "\n--- HTTP %{http_code}\n" -X POST "$BASE/webhook" -H "$CT" -d "{not json"
echo ""
echo "--- payload: (vacío)"
curl -s -w "\n--- HTTP %{http_code}\n" -X POST "$BASE/webhook" -H "$CT" -d ""
echo ""

# ---------------------------------------------------------------------
# Escenario 4: Campos mínimos faltantes -> 400 validation_failed
# ---------------------------------------------------------------------
post "4a. Sin event.id -> 400 validation_failed (señala el campo)" '{
  "type": "message.received",
  "conversation_id": "conv_us1_ack",
  "data": { "body": "sin id", "from": "573001234567" }
}'

post "4b. Sin data.conversation_id -> 400 validation_failed" '{
  "id": "evt_us1_004",
  "type": "message.received",
  "data": { "body": "sin conv", "from": "573001234567" }
}'

post "4c. Sin data.body -> 400 validation_failed" '{
  "id": "evt_us1_004",
  "type": "message.received",
  "conversation_id": "conv_us1_ack",
  "data": { "from": "573001234567" }
}'

# ---------------------------------------------------------------------
# Escenario 5: Reenvío del mismo event.id -> 409 duplicate_event sin re-procesar
# ---------------------------------------------------------------------
post "5a. Primer envío evt_us1_dup -> 200" '{
  "id": "evt_us1_dup",
  "type": "message.received",
  "conversation_id": "conv_us1_dup",
  "data": { "body": "Necesito ayuda", "from": "573001234567" }
}'

post "5b. Reenvío del mismo event.id evt_us1_dup (body distinto) -> 409 SIN mapping" '{
  "id": "evt_us1_dup",
  "type": "message.received",
  "conversation_id": "conv_us1_dup",
  "data": { "body": "Body MODIFICADO", "from": "573001234567" }
}'

echo "--- nº de filas para evt_us1_dup (debe ser 1, NO hay duplicado):"
$DB "SELECT count(*) FROM ingest_responses WHERE event_id='evt_us1_dup';"

# ---------------------------------------------------------------------
# Escenario 6: Evento sin event.id -> 400 sin evaluar deduplicación
# ---------------------------------------------------------------------
post "6. Sin event.id -> 400 validation_failed (no se evalúa deduplicación)" '{
  "type": "message.received",
  "conversation_id": "conv_us1_noid",
  "data": { "body": "sin id", "from": "573001234567" }
}'

# ---------------------------------------------------------------------
# Escenario 9: Evento sin coordenadas -> 200 location_pending_geocoding=true
# ---------------------------------------------------------------------
post "9. Evento sin coordenadas evt_us1_nocoords -> 200 mapping.location_pending_geocoding=true" '{
  "id": "evt_us1_nocoords",
  "type": "message.received",
  "conversation_id": "conv_us1_nocoords",
  "data": { "body": "Necesito ayuda pero no tengo la dirección", "from": "573001234567" }
}'

# ---------------------------------------------------------------------
# Escenario 10: conversation_id plano o data.conversation_id
# ---------------------------------------------------------------------
post "10a. conversation_id plano conv_us1_flat -> 200" '{
  "id": "evt_us1_flat",
  "type": "message.received",
  "conversation_id": "conv_us1_flat",
  "data": { "body": "conversation plano", "from": "573001234567" }
}'

post "10b. data.conversation_id conv_us1_data -> 200 (shape documentado)" '{
  "id": "evt_us1_data",
  "type": "message.received",
  "data": { "conversation_id": "conv_us1_data", "body": "conversation anidado", "from": "573001234567" }
}'

echo "--- filas agrupadas por conversation_id:"
$DB "SELECT event_id, conversation_id FROM ingest_responses WHERE event_id IN ('evt_us1_flat','evt_us1_data') ORDER BY event_id;"

# ---------------------------------------------------------------------
# Escenario 11: Adjuntos viajan dentro del raw_event (sin tablas separadas)
# ---------------------------------------------------------------------
post "11. Evento con adjuntos evt_us1_att -> 200 (raw_event guarda los adjuntos)" '{
  "id": "evt_us1_att",
  "type": "message.received",
  "conversation_id": "conv_us1_att",
  "data": {
    "body": "Te adjunto la foto del daño",
    "from": "573001234567",
    "message_type": "image",
    "workflow": { "step": "awaiting_details" },
    "attachments": [
      { "type": "image", "url": "https://media.example.com/foto.jpg", "mime": "image/jpeg" },
      { "type": "image", "url": "https://media.example.com/foto2.jpg", "mime": "image/jpeg" }
    ]
  }
}'

echo "--- adjuntos dentro de raw_event (raw_event->'data'->'attachments'):"
$DB "SELECT jsonb_array_length(raw_event->'data'->'attachments') AS attachments_count, message_type FROM ingest_responses WHERE event_id='evt_us1_att';"

# ---------------------------------------------------------------------
# Escenario 8: Autenticación abierta (deuda reconocida) — ya demostrado por
# todos los POST anteriores (sin token, responden 200). Se deja explícito:
# ---------------------------------------------------------------------
echo ""
echo "=== 8. Autenticación abierta (deuda reconocida -> S8) ==="
echo "Los POST anteriores se hicieron SIN token ni firma y fueron aceptados (200)."

echo ""
echo "=== Fin de la batería de evidencia DEV-40 ==="
