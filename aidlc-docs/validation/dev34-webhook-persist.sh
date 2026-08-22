#!/usr/bin/env bash
# DEV-34 — Evidencia en ejecución: Persistencia del evento crudo (S4)
# Ejercita la Edge Function `webhook` local (edge-runtime manual) y captura
# las respuestas + el estado de ingest_responses.
set -u
BASE="${BASE:-http://127.0.0.1:8081/webhook}"
DB_EXEC="docker exec supabase_db_aqui-hace-falta-cali psql -U postgres -d postgres -t -A -c"
CT="Content-Type: application/json"

post() {
  local label="$1"
  local payload="$2"
  echo ""
  echo "=== $label ==="
  echo "--- POST $BASE"
  echo "--- payload: $payload"
  curl -s -w "\n--- HTTP %{http_code}\n" -X POST "$BASE" -H "$CT" -d "$payload"
  echo ""
}

echo "############################################################"
echo "# DEV-34 — Persistencia del evento crudo (S4)"
echo "# Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Rama: agent/DEV-34"
echo "############################################################"

# S1: Evento válido de message.received -> fila en ingest_responses
post "1. Evento válido -> se persiste con RECEIVED y raw_event intacto" '{
  "id": "evt_001",
  "type": "message.received",
  "conversation_id": "conv_001",
  "data": {
    "body": "Necesito agua potable en mi barrio",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}'

echo "--- fila en DB (raw_event == payload completo, metadatos copiados):"
$DB_EXEC "SELECT event_id, type, conversation_id, \"from\", message_type, workflow_step, processing_status, raw_event->>'id' AS raw_id, body FROM ingest_responses WHERE event_id='evt_001';"

# S2: Reenvío del mismo event.id -> NO duplica, devuelve la fila existente
post "2. Reenvío del mismo event.id (evt_001) -> duplicate=true, sin fila nueva" '{
  "id": "evt_001",
  "type": "message.received",
  "conversation_id": "conv_001",
  "data": {
    "body": "Necesito agua potable en mi barrio",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}'

echo "--- nº de filas para evt_001 (debe ser 1):"
$DB_EXEC "SELECT count(*) FROM ingest_responses WHERE event_id='evt_001';"

# S3: Reenvío con el mismo id pero body distinto -> NO modifica la fila original
post "3. Reenvío del mismo id con body distinto -> no modifica la fila original" '{
  "id": "evt_001",
  "type": "message.received",
  "conversation_id": "conv_001",
  "data": {
    "body": "BODY MODIFICADO en el reenvío",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}'

echo "--- la fila conserva su raw_event y body ORIGINALES:"
$DB_EXEC "SELECT body, raw_event->'data'->>'body' AS raw_body, received_at, created_at FROM ingest_responses WHERE event_id='evt_001';"

# S4: Evento sin campos obligatorios -> 400 y NO se persiste
post "4. Evento sin campos mínimos -> 400 con campos faltantes, sin fila" '{
  "id": "evt_004",
  "type": "message.received",
  "data": { "from": "573001234567" }
}'

echo "--- filas para evt_004 (debe ser 0):"
$DB_EXEC "SELECT count(*) FROM ingest_responses WHERE event_id='evt_004';"

# S5: Evento sin coordenadas -> se persiste tal cual, geocoding pendiente (S5)
post "5. Evento sin coordenadas -> se persiste tal cual" '{
  "id": "evt_005",
  "type": "message.received",
  "conversation_id": "conv_001",
  "data": {
    "body": "Necesito ayuda, no tengo coordenadas",
    "from": "573001234567",
    "message_type": "text"
  }
}'

echo "--- fila en DB (sin lat/lng; raw_event intacto; RECEIVED):"
$DB_EXEC "SELECT event_id, processing_status, raw_event->'data'->>'body' AS raw_body FROM ingest_responses WHERE event_id='evt_005';"

# S6: Eventos distintos de la misma conversación -> filas separadas (idempotencia por event.id, no por conversation_id)
post "6a. Evento A de la conversación conv_002" '{
  "id": "evt_conv_a",
  "type": "message.received",
  "conversation_id": "conv_002",
  "data": {
    "body": "Primer mensaje",
    "from": "573001234567"
  }
}'

post "6b. Evento B de la misma conversación conv_002 (id distinto)" '{
  "id": "evt_conv_b",
  "type": "message.received",
  "conversation_id": "conv_002",
  "data": {
    "body": "Segundo mensaje",
    "from": "573001234567"
  }
}'

echo "--- filas para conv_002 (debe ser 2, cada evento con su fila):"
$DB_EXEC "SELECT event_id, conversation_id FROM ingest_responses WHERE conversation_id='conv_002' ORDER BY event_id;"

echo ""
echo "=== Fin de la batería de evidencia DEV-34 ==="
