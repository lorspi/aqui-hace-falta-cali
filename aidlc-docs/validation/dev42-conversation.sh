#!/usr/bin/env bash
# DEV-42 — Evidencia en ejecución: US-3 (Endpoint de reconstrucción de
# conversación para el frontend)
#
# Ejercita la Edge Function `conversation` (bootstrap Deno con stores PostgREST
# reales) contra el Supabase local de RADAR (API 54341 / DB 54342), usando la
# Edge Function `webhook` para sembrar los eventos.
#
# Escenarios Gherkin US-3 (DEV-42):
#   1.  La conversación de un need se reconstruye en orden cronológico.
#   2.  La reconstrucción incluye los datos estructurados del incidente.
#   3.  Conversación sin evento de completado -> mensajes disponibles sin need.
#   4.  Mensaje de texto normalizado (type=TEXT, sin adjuntos).
#   5.  Mensaje con imagen expone su adjunto de imagen.
#   6.  Mensaje de ubicación expone su adjunto de coordenadas.
#   7.  Ubicación sin coordenadas no rompe la reconstrucción.
#   8.  message_type desconocido/ausente -> UNKNOWN.
#   9.  Campos faltantes -> normalización tolerante (auditoría).
#  10.  Reenvío del mismo event.id aparece una sola vez.
#  11.  El evento de completado no se lista como mensaje del ciudadano.
#  12.  need.id inexistente -> 404 con error estructurado.
#  13.  Conversación sin mensajes -> lista vacía (contrato intacto).
set -u
WH="${WH:-http://127.0.0.1:8000/functions/v1/webhook}"
CV="${CV:-http://127.0.0.1:8001/functions/v1/conversation}"
DB="docker exec supabase_db_aqui-hace-falta-cali psql -U postgres -d postgres -t -A -c"
CT="Content-Type: application/json"
P="dev42"

post() {
  local label="$1"
  local payload="$2"
  echo ""
  echo "--- $label"
  curl -s -w "\n    HTTP %{http_code}\n" -X POST "$WH" -H "$CT" -d "$payload"
  echo ""
}

get() {
  local label="$1"
  local url="$2"
  echo ""
  echo "--- $label"
  curl -s -w "\n    HTTP %{http_code}\n" "$url"
  echo ""
}

echo "############################################################"
echo "# DEV-42 — US-3: Endpoint de reconstrucción de conversación"
echo "# Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Rama: agent/DEV-42"
echo "# Endpoints reales (Deno): $WH | $CV"
echo "############################################################"

# Limpieza previa de datos de prueba del prefijo (stack reproducible).
$DB "DELETE FROM needs WHERE conversation_id LIKE '${P}_%';" > /dev/null 2>&1
$DB "DELETE FROM ingest_responses WHERE conversation_id LIKE '${P}_%';" > /dev/null 2>&1

# ---------------------------------------------------------------------
# Escenario 1+2+4+5+6+8+11: conversación completa con mensajes variados
# ---------------------------------------------------------------------
echo ""
echo "=== 1. Siembra: conversación ${P}_conv_full (mensajes variados) ==="
post "1a. message.received texto (recibido 10:01Z)" "{\"id\":\"${P}_m1\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_full\",\"data\":{\"body\":\"Necesito agua potable\",\"from\":\"573001234567\",\"message_type\":\"text\",\"workflow\":{\"step\":\"awaiting_location\"}}}"
post "1b. message.received imagen (recibido 10:02Z)" "{\"id\":\"${P}_m2\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_full\",\"data\":{\"body\":\"Te adjunto la foto del daño\",\"from\":\"573001234567\",\"message_type\":\"image\",\"workflow\":{\"step\":\"awaiting_details\"},\"attachments\":[{\"type\":\"image\",\"url\":\"https://media.example.com/foto.jpg\",\"mime\":\"image/jpeg\"}]}}"
post "1c. message.received ubicación (recibido 10:03Z)" "{\"id\":\"${P}_m3\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_full\",\"data\":{\"body\":{\"text\":\"Estoy aquí\",\"latitude\":3.4516,\"longitude\":-76.532,\"address\":\"Calle 5 #10-20\"},\"from\":\"573001234567\",\"message_type\":\"location\"}}"
post "1d. message.received tipo desconocido (recibido 10:04Z)" "{\"id\":\"${P}_m4\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_full\",\"data\":{\"body\":\"Mensaje raro\",\"from\":\"573001234567\",\"message_type\":\"holograma\"}}"
post "1e. evento de completado -> crea el need" "{\"id\":\"${P}_comp\",\"type\":\"conversation_completed\",\"conversation_id\":\"${P}_conv_full\",\"data\":{\"body\":\"Conversación finalizada\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"

echo ""
echo "--- id del need creado para ${P}_conv_full:"
NEED_ID=$($DB "SELECT id FROM needs WHERE conversation_id='${P}_conv_full' LIMIT 1;")
echo "    $NEED_ID"

echo ""
echo "=== 2. GET /needs/{id}/conversation (reconstrucción ordenada + datos del incidente) ==="
get "GET /needs/$NEED_ID/conversation" "$CV/needs/$NEED_ID/conversation"

echo ""
echo "--- Verificación en BD: filas de ingest_responses ordenadas por received_at"
$DB "SELECT event_id, message_type, received_at FROM ingest_responses WHERE conversation_id='${P}_conv_full' ORDER BY received_at ASC;"

# ---------------------------------------------------------------------
# Escenario 3: conversación sin completado -> mensajes sin need
# ---------------------------------------------------------------------
echo ""
echo "=== 3. Conversación ${P}_conv_ongoing SIN evento de completado ==="
post "3a. message.received en curso" "{\"id\":\"${P}_o1\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_ongoing\",\"data\":{\"body\":\"Estamos atrapados en el 5to piso\",\"from\":\"573001234567\",\"message_type\":\"text\"}}"
get "GET ?conversation_id=${P}_conv_ongoing (has_need=false, mensajes disponibles)" "$CV?conversation_id=${P}_conv_ongoing"

# ---------------------------------------------------------------------
# Escenario 9: campos faltantes -> normalización tolerante
# ---------------------------------------------------------------------
echo ""
echo "=== 9. Conversación ${P}_conv_tol: fila con campos faltantes (sin body/from) ==="
echo "--- El webhook rechaza el evento con 400 (no se persiste):"
post "9a. mensaje sin body ni from -> 400 validation_failed (borde correcto)" "{\"id\":\"${P}_t1\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_tol\",\"data\":{\"workflow\":{\"step\":\"awaiting_location\"}}}"
echo "--- Una fila malformada SÍ puede existir en ingest_responses (p. ej. insertada"
echo "--- por una ruta anterior del pipeline); la reconstrucción NO la pierde:"
$DB "INSERT INTO ingest_responses (event_id, type, conversation_id, \"from\", body, raw_event, raw_payload, processing_status, received_at, created_at) VALUES ('${P}_t1', 'message.received', '${P}_conv_tol', NULL, NULL, '{\"id\":\"${P}_t1\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_tol\",\"data\":{\"workflow\":{\"step\":\"awaiting_location\"}}}'::jsonb, '{\"id\":\"${P}_t1\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_tol\",\"data\":{\"workflow\":{\"step\":\"awaiting_location\"}}}'::jsonb, 'RECEIVED', NOW(), NOW());" && echo "    fila insertada vía SQL"
get "GET ?conversation_id=${P}_conv_tol (content por defecto, sender null, auditoría)" "$CV?conversation_id=${P}_conv_tol"

# ---------------------------------------------------------------------
# Escenario 7: ubicación sin coordenadas no rompe
# ---------------------------------------------------------------------
echo ""
echo "=== 7. Conversación ${P}_conv_locnc: ubicación sin coordenadas ==="
post "7a. message.received location con address solamente" "{\"id\":\"${P}_lnc1\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_locnc\",\"data\":{\"body\":{\"text\":\"Estoy en San Fernando\",\"address\":\"San Fernando\"},\"from\":\"573001234567\",\"message_type\":\"location\"}}"
post "7b. mensaje normal posterior" "{\"id\":\"${P}_lnc2\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_locnc\",\"data\":{\"body\":\"Otro mensaje normal\",\"from\":\"573001234567\"}}"
get "GET ?conversation_id=${P}_conv_locnc (adjunto location sin coords + resto intacto)" "$CV?conversation_id=${P}_conv_locnc"

# ---------------------------------------------------------------------
# Escenario 10: reenvío del mismo event.id aparece una sola vez
# ---------------------------------------------------------------------
echo ""
echo "=== 10. Reenvío del mismo event.id -> una sola fila en ingest ==="
post "10a. reenvío del event.id ${P}_m1 (debe responder 409 duplicate_event)" "{\"id\":\"${P}_m1\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_full\",\"data\":{\"body\":\"DUPLICADO\",\"from\":\"573001234567\"}}"
echo "--- nº de filas para event_id ${P}_m1 (debe ser 1):"
$DB "SELECT count(*) FROM ingest_responses WHERE event_id='${P}_m1';"

# ---------------------------------------------------------------------
# Escenario 12: need.id inexistente -> 404
# ---------------------------------------------------------------------
echo ""
echo "=== 12. need.id inexistente -> 404 need_not_found ==="
get "GET /needs/need_999/conversation" "$CV/needs/need_999/conversation"

# ---------------------------------------------------------------------
# Escenario 13: conversación sin mensajes -> lista vacía
# ---------------------------------------------------------------------
echo ""
echo "=== 13. Conversación sin mensajes -> lista vacía (contrato intacto) ==="
get "GET ?conversation_id=${P}_conv_vacia" "$CV?conversation_id=${P}_conv_vacia"

# ---------------------------------------------------------------------
# Limpieza de datos de prueba (stack reproducible)
# ---------------------------------------------------------------------
echo ""
echo "=== Limpieza de datos de prueba ${P}_% ==="
$DB "DELETE FROM needs WHERE conversation_id LIKE '${P}_%';"
$DB "DELETE FROM ingest_responses WHERE conversation_id LIKE '${P}_%';"
echo "needs restantes con prefijo ${P}: $($DB "SELECT count(*) FROM needs WHERE conversation_id LIKE '${P}_%';")"
echo "ingest restantes con prefijo ${P}: $($DB "SELECT count(*) FROM ingest_responses WHERE conversation_id LIKE '${P}_%';")"

echo ""
echo "=== Fin de la batería de evidencia DEV-42 ==="
