#!/usr/bin/env bash
# DEV-37 — Evidencia en ejecución: Confirmación al remitente / ACK (S7)
# Ejercita la Edge Function `webhook` local (bootstrap Node con stores
# PostgREST reales) y captura las respuestas + el estado de ingest_responses.
#
# Escenarios Gherkin S7:
#   1. Evento válido se confirma con 200 (el ACK devuelve el event.id).
#   2. Body que no es JSON válido devuelve 400 (error estructurado code+message).
#   3. Evento con un campo requerido faltante devuelve 400 (indica el campo).
#   4. Evento con tipo de dato inválido devuelve 400 (detalla la causa).
#   5. Reenvío del mismo event.id devuelve 409 (sin duplicado en ingest_responses).
#   6. Fallo interno de persistencia devuelve 500 (error genérico sin detalles
#      internos; la causa real va al log server-side).
#   7. Evento de completado sin coordenadas se confirma con 200 (el geocoding
#      queda como paso posterior, no bloquea el ACK).
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
echo "# DEV-37 — Confirmación al remitente / ACK (S7)"
echo "# Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Rama: agent/DEV-37"
echo "############################################################"

# ---------------------------------------------------------------------
# Escenario 1: Evento válido se confirma con 200
# ---------------------------------------------------------------------
post "1. Evento válido evt_s7_001 -> 200, ACK devuelve event.id" '{
  "id": "evt_s7_001",
  "type": "message.received",
  "conversation_id": "conv_s7_ack",
  "data": {
    "body": "Necesito agua potable en mi barrio",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}'

echo "--- fila en ingest_responses:"
$DB "SELECT event_id, type, conversation_id, processing_status FROM ingest_responses WHERE event_id='evt_s7_001';"

# ---------------------------------------------------------------------
# Escenario 2: Body que no es JSON válido devuelve 400
# ---------------------------------------------------------------------
echo ""
echo "=== 2. Body no JSON válido -> 400 ==="
echo "--- payload: {not json"
curl -s -w "\n--- HTTP %{http_code}\n" -X POST "$BASE/webhook" -H "$CT" -d "{not json"
echo ""

# ---------------------------------------------------------------------
# Escenario 3: Evento con un campo requerido faltante devuelve 400
# ---------------------------------------------------------------------
post "3a. Sin event.id -> 400 (indica el campo)" '{
  "type": "message.received",
  "conversation_id": "conv_s7_ack",
  "data": { "body": "sin id", "from": "573001234567" }
}'

post "3b. Sin data.conversation_id -> 400 (indica el campo)" '{
  "id": "evt_s7_003",
  "type": "message.received",
  "data": { "body": "sin conv", "from": "573001234567" }
}'

# ---------------------------------------------------------------------
# Escenario 4: Evento con tipo de dato inválido devuelve 400
# ---------------------------------------------------------------------
post "4. type numérico -> 400 (detalla la causa de validación)" '{
  "id": "evt_s7_004",
  "type": 42,
  "conversation_id": "conv_s7_ack",
  "data": { "body": "type inválido", "from": "573001234567" }
}'

# ---------------------------------------------------------------------
# Escenario 5: Reenvío del mismo event.id devuelve 409
# ---------------------------------------------------------------------
post "5a. Primer envío evt-123 -> 200" '{
  "id": "evt-123",
  "type": "message.received",
  "conversation_id": "conv_s7_ack",
  "data": { "body": "Necesito ayuda", "from": "573001234567" }
}'

post "5b. Reenvío del mismo event.id evt-123 -> 409 (sin duplicado)" '{
  "id": "evt-123",
  "type": "message.received",
  "conversation_id": "conv_s7_ack",
  "data": { "body": "Necesito ayuda", "from": "573001234567" }
}'

echo "--- nº de filas para evt-123 (debe ser 1, NO hay duplicado):"
$DB "SELECT count(*) FROM ingest_responses WHERE event_id='evt-123';"

# ---------------------------------------------------------------------
# Escenario 7: Evento de completado sin coordenadas se confirma con 200
# ---------------------------------------------------------------------
post "7a. message.received de conv_s7_nocoords (sin coordenadas)" '{
  "id": "evt_s7_m1",
  "type": "message.received",
  "conversation_id": "conv_s7_nocoords",
  "data": {
    "body": "Necesito ayuda, sin datos de ubicación",
    "from": "573001234567",
    "message_type": "text"
  }
}'

post "7b. Completado de conv_s7_nocoords (sin coordenadas) -> 200 ACK" '{
  "id": "evt_s7_c1",
  "type": "conversation_completed",
  "conversation_id": "conv_s7_nocoords",
  "data": {
    "body": "Conversación finalizada",
    "from": "573001234567",
    "workflow": { "step": "completed" }
  }
}'

echo "--- incidente creado (lat/lng NULL, enriquecimiento PENDIENTE):"
$DB "SELECT conversation_id, latitude, longitude, location_enrichment_status FROM needs WHERE conversation_id='conv_s7_nocoords';"

echo ""
echo "=== Fin de la batería de evidencia DEV-37 ==="
