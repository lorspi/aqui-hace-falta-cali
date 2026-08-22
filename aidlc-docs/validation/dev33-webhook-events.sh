#!/usr/bin/env bash
# DEV-33 — Evidencia en ejecución: Validación y mapeo de eventos (S3)
# Ejercita la Edge Function `webhook` local y captura las respuestas.
set -u
BASE="${BASE:-http://127.0.0.1:54341/functions/v1/webhook}"
# Anon key del stack local de Supabase (pública por diseño). Se puede
# sobreescribir con SUPABASE_ANON_KEY para apuntar a otro entorno.
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
CT="Content-Type: application/json"

post() {
  local label="$1"
  local payload="$2"
  echo ""
  echo "=== $label ==="
  echo "--- POST $BASE"
  echo "--- payload: $payload"
  curl -s -w "\n--- HTTP %{http_code}\n" -X POST "$BASE" -H "$CT" -H "Authorization: Bearer $ANON_KEY" -H "apikey: $ANON_KEY" -d "$payload"
  echo ""
}

# S1: Evento válido de message.received con campos mínimos + data.from
post "1. Evento válido -> borrador de Need con defaults" '{
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

# S2: message_type con formato inconsistente ('Text', 'image') -> normaliza a canónico
post "2. message_type inconsistente ('Text') se normaliza a TEXT" '{
  "id": "evt_002",
  "type": "message.received",
  "conversation_id": "conv_001",
  "data": {
    "body": "Foto de la zona",
    "message_type": "Text"
  }
}'

post "3. message_type 'image' se normaliza a IMAGE" '{
  "id": "evt_003",
  "type": "message.received",
  "conversation_id": "conv_001",
  "data": {
    "body": "Adjunto imagen",
    "message_type": "image"
  }
}'

# S3: workflow.step 'completed' -> incident_ready true
post "4. workflow.step 'completed' -> incident_ready true (delegado a S5)" '{
  "id": "evt_004",
  "type": "message.received",
  "conversation_id": "conv_001",
  "data": {
    "body": "Listo, esa es toda la información",
    "message_type": "text",
    "workflow": { "step": "completed" }
  }
}'

# S4: Evento con campos mínimos faltantes (sin body, sin conversation_id) -> 400
post "5. Faltan body y conversation_id -> 400 con detalle de campos" '{
  "id": "evt_005",
  "type": "message.received",
  "data": { "from": "573001234567" }
}'

# S5: Campos con formato inválido (id vacío, body numérico) -> 400
post "6. id vacío y body numérico -> 400 indicando cada campo inválido" '{
  "id": "",
  "type": "message.received",
  "conversation_id": "conv_001",
  "data": { "body": 42 }
}'

# S6: Reenvío con el mismo event.id (el endpoint es stateless; la dedupe durable es S4/S6)
post "7. Reenvío del mismo event.id (evt_001) -> ACK 200 (dedupe durable en S4/S6)" '{
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

# S7: Evento sin coordenadas -> location_pending_geocoding true, conserva address/neighborhood
post "8. Sin coordenadas, con address/neighborhood en el body -> pendiente de geocoding" '{
  "id": "evt_008",
  "type": "message.received",
  "conversation_id": "conv_001",
  "data": {
    "body": {
      "text": "Necesito ayuda en mi barrio",
      "address": "Calle 5 #10-20",
      "neighborhood": "San Fernando"
    },
    "from": "573001234567"
  }
}'

# S8: type conversation_completed -> valida sin armar incidente (builds_incident false)
post "9. type conversation_completed -> builds_incident false, incident_ready true" '{
  "id": "evt_009",
  "type": "conversation_completed",
  "conversation_id": "conv_001",
  "data": {
    "body": "Conversación finalizada",
    "from": "573001234567"
  }
}'

echo ""
echo "=== Fin de la batería de evidencia DEV-33 ==="
