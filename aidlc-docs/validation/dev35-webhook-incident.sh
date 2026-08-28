#!/usr/bin/env bash
# DEV-35 — Evidencia en ejecución: Creación del incidente al completar (S5)
# Ejercita la Edge Function `webhook` local (bootstrap Node con stores
# PostgREST reales + geocoder Nominatim) y captura las respuestas + el estado
# de `needs` e `ingest_responses`.
set -u
BASE="${BASE:-http://127.0.0.1:8081}"
DB="docker exec supabase_db_aqui-hace-falta-cali psql -U postgres -d postgres -t -A -c"
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
echo "# DEV-35 — Creación del incidente al completar (S5)"
echo "# Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Rama: agent/DEV-35"
echo "############################################################"

# ---------------------------------------------------------------------
# Escenario 1: acumula mensajes + completado -> crea incidente con defaults
# ---------------------------------------------------------------------
post "1a. message.received de conv_s5_a (mensaje 1)" '{
  "id": "evt_s5_a1",
  "type": "message.received",
  "conversation_id": "conv_s5_a",
  "data": {
    "body": "Necesito agua potable en mi barrio",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}'

post "1b. message.received de conv_s5_a (mensaje 2)" '{
  "id": "evt_s5_a2",
  "type": "message.received",
  "conversation_id": "conv_s5_a",
  "data": {
    "body": "Quedo en San Fernando",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_details" }
  }
}'

post "1c. Evento de completado para conv_s5_a" '{
  "id": "evt_s5_c1",
  "type": "conversation_completed",
  "conversation_id": "conv_s5_a",
  "data": {
    "body": "Conversación finalizada",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "completed" }
  }
}'

echo "--- incidente en needs (defaults, contact_whatsapp, mensajes acumulados):"
$DB "SELECT source_event_id, conversation_id, source, contact_whatsapp, priority, status, verification_status, emergency_id, city_id, address, neighborhood, latitude, longitude, location_enrichment_status, left(description, 90) AS descr FROM needs WHERE conversation_id='conv_s5_a';"

# ---------------------------------------------------------------------
# Escenario 2: completado con coordenadas -> sin geocoding, city_id resuelto
# ---------------------------------------------------------------------
post "2a. message.received con coordenadas (conv_s5_b)" '{
  "id": "evt_s5_b1",
  "type": "message.received",
  "conversation_id": "conv_s5_b",
  "data": {
    "body": { "text": "Estoy aquí", "latitude": 3.4516, "longitude": -76.532 },
    "from": "573001234567",
    "message_type": "location"
  }
}'

post "2b. Completado para conv_s5_b" '{
  "id": "evt_s5_c2",
  "type": "conversation_completed",
  "conversation_id": "conv_s5_b",
  "data": {
    "body": "Terminamos",
    "from": "573001234567",
    "workflow": { "step": "completed" }
  }
}'

echo "--- incidente con coordenadas y city_id (sin geocoding):"
$DB "SELECT conversation_id, latitude, longitude, city_id, location_enrichment_status FROM needs WHERE conversation_id='conv_s5_b';"

# ---------------------------------------------------------------------
# Escenario 3: sin coordenadas + dirección -> geocoding + ciudad
# ---------------------------------------------------------------------
post "3a. message.received con address/neighborhood (conv_s5_c)" '{
  "id": "evt_s5_c1m",
  "type": "message.received",
  "conversation_id": "conv_s5_c",
  "data": {
    "body": { "text": "Necesito ayuda", "address": "Calle 5 #10-20", "neighborhood": "San Fernando" },
    "from": "573001234567",
    "message_type": "text"
  }
}'

post "3b. Completado para conv_s5_c (dispara geocoding)" '{
  "id": "evt_s5_c3",
  "type": "conversation_completed",
  "conversation_id": "conv_s5_c",
  "data": {
    "body": "Listo",
    "from": "573001234567",
    "workflow": { "step": "completed" }
  }
}'

echo "--- incidente enriquecido con geocoding (lat/lng + city_id):"
$DB "SELECT conversation_id, address, neighborhood, latitude, longitude, city_id, location_enrichment_status FROM needs WHERE conversation_id='conv_s5_c';"

# ---------------------------------------------------------------------
# Escenario 4: geocoding no disponible/no resuelve -> incidente igual con NULL + PENDING
# ---------------------------------------------------------------------
post "4a. message.received sin coordenadas ni dirección (conv_s5_d)" '{
  "id": "evt_s5_d1",
  "type": "message.received",
  "conversation_id": "conv_s5_d",
  "data": {
    "body": "Necesito ayuda, sin datos de ubicación",
    "from": "573001234567",
    "message_type": "text"
  }
}'

post "4b. Completado para conv_s5_d" '{
  "id": "evt_s5_c4",
  "type": "conversation_completed",
  "conversation_id": "conv_s5_d",
  "data": {
    "body": "Fin",
    "from": "573001234567",
    "workflow": { "step": "completed" }
  }
}'

echo "--- incidente creado igual con lat/lng NULL y PENDING:"
$DB "SELECT conversation_id, latitude, longitude, location_enrichment_status FROM needs WHERE conversation_id='conv_s5_d';"

# ---------------------------------------------------------------------
# Escenario 5: reenvío del mismo completado -> no duplica, devuelve existente
# ---------------------------------------------------------------------
post "5. Reenvío del evento de completado evt_s5_c1 (conv_s5_a)" '{
  "id": "evt_s5_c1",
  "type": "conversation_completed",
  "conversation_id": "conv_s5_a",
  "data": {
    "body": "Conversación finalizada",
    "from": "573001234567",
    "workflow": { "step": "completed" }
  }
}'

echo "--- nº de incidentes para conv_s5_a (debe ser 1):"
$DB "SELECT count(*) FROM needs WHERE conversation_id='conv_s5_a';"

# ---------------------------------------------------------------------
# Escenario 6: completado sin conversation_id -> 400 (sin incidente)
# ---------------------------------------------------------------------
post "6. Evento de completado sin conversation_id -> 400" '{
  "id": "evt_s5_c6",
  "type": "conversation_completed",
  "conversation_id": "",
  "data": {
    "body": "fin",
    "from": "573001234567",
    "workflow": { "step": "completed" }
  }
}'

echo "--- filas en needs con source_event_id=evt_s5_c6 (debe ser 0):"
$DB "SELECT count(*) FROM needs WHERE source_event_id='evt_s5_c6';"

# ---------------------------------------------------------------------
# Escenario 7: completado sin mensajes acumulados previos -> 409
# ---------------------------------------------------------------------
post "7. Completado para conv_999 sin mensajes previos -> 409" '{
  "id": "evt_s5_c7",
  "type": "conversation_completed",
  "conversation_id": "conv_999",
  "data": {
    "body": "Fin",
    "from": "573001234567",
    "workflow": { "step": "completed" }
  }
}'

echo "--- filas en needs para conv_999 (debe ser 0):"
$DB "SELECT count(*) FROM needs WHERE conversation_id='conv_999';"

# ---------------------------------------------------------------------
# Escenario 8: completado con from inválido -> 400 + evento en ingest_responses
# ---------------------------------------------------------------------
post "8. Completado con from inválido (conv_s5_h) -> 400" '{
  "id": "evt_s5_c8",
  "type": "conversation_completed",
  "conversation_id": "conv_s5_h",
  "data": {
    "body": "Fin",
    "from": "numero-invalido",
    "workflow": { "step": "completed" }
  }
}'

echo "--- el evento quedó en ingest_responses para auditoría:"
$DB "SELECT event_id, type, conversation_id, \"from\", processing_status FROM ingest_responses WHERE event_id='evt_s5_c8';"

echo "--- filas en needs para conv_s5_h (debe ser 0):"
$DB "SELECT count(*) FROM needs WHERE conversation_id='conv_s5_h';"

# ---------------------------------------------------------------------
# Escenario 9: conversaciones distintas no mezclan sus mensajes
# ---------------------------------------------------------------------
post "9a. message.received de conv_s5_e (mensaje)" '{
  "id": "evt_s5_e1",
  "type": "message.received",
  "conversation_id": "conv_s5_e",
  "data": {
    "body": "Mensaje de E",
    "from": "573001234567",
    "message_type": "text"
  }
}'

post "9b. message.received de conv_s5_f (mensaje)" '{
  "id": "evt_s5_f1",
  "type": "message.received",
  "conversation_id": "conv_s5_f",
  "data": {
    "body": "Mensaje de F",
    "from": "573001234567",
    "message_type": "text"
  }
}'

post "9c. Completado solo para conv_s5_e" '{
  "id": "evt_s5_c9",
  "type": "conversation_completed",
  "conversation_id": "conv_s5_e",
  "data": {
    "body": "Fin",
    "from": "573001234567",
    "workflow": { "step": "completed" }
  }
}'

echo "--- incidente de conv_s5_e (solo mensajes de E, no de F):"
$DB "SELECT conversation_id, description FROM needs WHERE conversation_id='conv_s5_e';"

echo "--- conv_s5_f permanece sin incidente (debe ser 0):"
$DB "SELECT count(*) FROM needs WHERE conversation_id='conv_s5_f';"

echo ""
echo "=== Fin de la batería de evidencia DEV-35 ==="
