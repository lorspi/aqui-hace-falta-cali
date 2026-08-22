#!/usr/bin/env bash
# DEV-36 — Evidencia en ejecución: Idempotencia / deduplicación (S6)
# Ejercita la Edge Function `webhook` local (bootstrap Node con stores
# PostgREST reales) y captura las respuestas + el estado de ingest_responses.
#
# Escenarios Gherkin S6:
#   1. El primer evento con un event.id nuevo se persiste una sola vez.
#   2. El reenvío con el mismo event.id no crea duplicados.
#   3. El reenvío con el mismo event.id pero body diferente no duplica ni
#      sobreescribe.
#   4. Reenvíos concurrentes del mismo event.id generan una sola fila.
#   5. Un evento sin id se rechaza (400, detallando el campo, sin persistir).
#   6. Eventos distintos con event.id diferente se persisten por separado.
#   7. Un reenvío tras un intento fallido de validación se procesa como nuevo.
#   8. La deduplicación por event.id protege el pipeline aguas abajo (no se
#      re-crea el incidente).
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
echo "# DEV-36 — Idempotencia / deduplicación (S6)"
echo "# Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Rama: agent/DEV-36"
echo "############################################################"

# ---------------------------------------------------------------------
# Escenario 1: El primer evento con un event.id nuevo se persiste una sola vez
# ---------------------------------------------------------------------
post "1. Primer evento evt_s6_001 -> persisted=true, se crea la fila" '{
  "id": "evt_s6_001",
  "type": "message.received",
  "conversation_id": "conv_s6",
  "data": {
    "body": "Necesito agua potable en mi barrio",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}'

echo "--- fila en DB (una sola con event_id=evt_s6_001):"
$DB "SELECT event_id, type, processing_status, raw_event->>'id' AS raw_id FROM ingest_responses WHERE event_id='evt_s6_001';"
$DB "SELECT count(*) FROM ingest_responses WHERE event_id='evt_s6_001';"

# ---------------------------------------------------------------------
# Escenario 2: El reenvío con el mismo event.id no crea duplicados
# ---------------------------------------------------------------------
post "2. Reenvío del mismo event.id (evt_s6_001) -> duplicate=true, sin fila nueva" '{
  "id": "evt_s6_001",
  "type": "message.received",
  "conversation_id": "conv_s6",
  "data": {
    "body": "Necesito agua potable en mi barrio",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}'

echo "--- nº de filas para evt_s6_001 (debe ser 1):"
$DB "SELECT count(*) FROM ingest_responses WHERE event_id='evt_s6_001';"

# ---------------------------------------------------------------------
# Escenario 3: Mismo event.id pero body diferente -> no duplica ni sobreescribe
# ---------------------------------------------------------------------
post "3. Reenvío del mismo id (evt_s6_001) con BODY distinto -> no sobreescribe" '{
  "id": "evt_s6_001",
  "type": "message.received",
  "conversation_id": "conv_s6",
  "data": {
    "body": "BODY MODIFICADO en el reenvío",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}'

echo "--- la fila conserva su raw_event y body ORIGINALES:"
$DB "SELECT body, raw_event->'data'->>'body' AS raw_body, received_at, created_at FROM ingest_responses WHERE event_id='evt_s6_001';"
$DB "SELECT count(*) FROM ingest_responses WHERE event_id='evt_s6_001';"

# ---------------------------------------------------------------------
# Escenario 4: Reenvíos concurrentes del mismo event.id generan una sola fila
# ---------------------------------------------------------------------
echo ""
echo "=== 4. Dos POST simultáneos con el mismo id (evt_s6_004) ==="
PAYLOAD4='{"id":"evt_s6_004","type":"message.received","conversation_id":"conv_s6","data":{"body":"Concurrente","from":"573001234567","message_type":"text"}}'
curl -s -o /tmp/dev36_c1.json -w "POST 1 -> HTTP %{http_code}\n" -X POST "$BASE/webhook" -H "$CT" -d "$PAYLOAD4" &
curl -s -o /tmp/dev36_c2.json -w "POST 2 -> HTTP %{http_code}\n" -X POST "$BASE/webhook" -H "$CT" -d "$PAYLOAD4" &
wait
echo "--- respuesta POST 1:"
cat /tmp/dev36_c1.json
echo ""
echo "--- respuesta POST 2:"
cat /tmp/dev36_c2.json
echo ""
echo "--- nº de filas para evt_s6_004 (debe ser 1):"
$DB "SELECT count(*) FROM ingest_responses WHERE event_id='evt_s6_004';"

# ---------------------------------------------------------------------
# Escenario 5: Un evento sin id se rechaza (no hay clave de idempotencia)
# ---------------------------------------------------------------------
post "5. Evento sin id -> 400 detallando el campo, sin persistir" '{
  "type": "message.received",
  "conversation_id": "conv_s6",
  "data": {
    "body": "Sin id",
    "from": "573001234567"
  }
}'

echo "--- nº de filas en ingest_responses con conversation_id=conv_s6 y body 'Sin id' (debe ser 0):"
$DB "SELECT count(*) FROM ingest_responses WHERE conversation_id='conv_s6' AND raw_event->'data'->>'body'='Sin id';"

# ---------------------------------------------------------------------
# Escenario 6: Eventos distintos con event.id diferente se persisten por separado
# ---------------------------------------------------------------------
post "6a. Evento evt_s6_006 (contenido idéntico al 6b, misma conversation_id)" '{
  "id": "evt_s6_006",
  "type": "message.received",
  "conversation_id": "conv_s6_shared",
  "data": {
    "body": "Contenido idéntico",
    "from": "573001234567"
  }
}'

post "6b. Evento evt_s6_007 (contenido idéntico, distinto event.id)" '{
  "id": "evt_s6_007",
  "type": "message.received",
  "conversation_id": "conv_s6_shared",
  "data": {
    "body": "Contenido idéntico",
    "from": "573001234567"
  }
}'

echo "--- filas para conv_s6_shared (debe ser 2, una por cada event.id):"
$DB "SELECT event_id, conversation_id FROM ingest_responses WHERE conversation_id='conv_s6_shared' ORDER BY event_id;"

# ---------------------------------------------------------------------
# Escenario 7: Un reenvío tras un intento fallido de validación se procesa como nuevo
# ---------------------------------------------------------------------
post "7a. Intento del evento evt_s6_008 que FALLA la validación (sin body) -> 400" '{
  "id": "evt_s6_008",
  "type": "message.received",
  "conversation_id": "conv_s6",
  "data": {
    "from": "573001234567"
  }
}'

echo "--- filas para evt_s6_008 tras el intento fallido (debe ser 0):"
$DB "SELECT count(*) FROM ingest_responses WHERE event_id='evt_s6_008';"

post "7b. Reenvío corregido del mismo id (evt_s6_008) -> se procesa como nuevo" '{
  "id": "evt_s6_008",
  "type": "message.received",
  "conversation_id": "conv_s6",
  "data": {
    "body": "Ahora con contenido",
    "from": "573001234567"
  }
}'

echo "--- fila creada para evt_s6_008 (debe ser 1):"
$DB "SELECT event_id, processing_status FROM ingest_responses WHERE event_id='evt_s6_008';"

# ---------------------------------------------------------------------
# Escenario 8: La deduplicación por event.id protege el pipeline aguas abajo
# ---------------------------------------------------------------------
post "8a. message.received de conv_s6_pipe (mensaje acumulado)" '{
  "id": "evt_s6_p1",
  "type": "message.received",
  "conversation_id": "conv_s6_pipe",
  "data": {
    "body": "Necesito ayuda",
    "from": "573001234567",
    "message_type": "text"
  }
}'

post "8b. Evento de completado evt_s6_009 -> crea el incidente" '{
  "id": "evt_s6_009",
  "type": "conversation_completed",
  "conversation_id": "conv_s6_pipe",
  "data": {
    "body": "Conversación finalizada",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "completed" }
  }
}'

echo "--- incidente creado para conv_s6_pipe:"
$DB "SELECT source_event_id, conversation_id, source, contact_whatsapp, priority, status FROM needs WHERE conversation_id='conv_s6_pipe';"

post "8c. Reenvío del mismo completado (evt_s6_009) -> se descarta en ingestión, NO re-crea incidente" '{
  "id": "evt_s6_009",
  "type": "conversation_completed",
  "conversation_id": "conv_s6_pipe",
  "data": {
    "body": "Conversación finalizada",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "completed" }
  }
}'

echo "--- nº de incidentes para conv_s6_pipe (debe ser 1):"
$DB "SELECT count(*) FROM needs WHERE conversation_id='conv_s6_pipe';"
echo "--- nº de filas para evt_s6_009 en ingest_responses (debe ser 1):"
$DB "SELECT count(*) FROM ingest_responses WHERE event_id='evt_s6_009';"

echo ""
echo "=== Fin de la batería de evidencia DEV-36 ==="
