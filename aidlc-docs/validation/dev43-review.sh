#!/usr/bin/env bash
# DEV-43 — Evidencia en ejecución: US-4 (Transición de estado de revisión:
# aprobar / rechazar)
#
# Ejercita la Edge Function `review` (bootstrap Deno con store PostgREST real)
# contra el Supabase local de RADAR (API 54341 / DB 54342). Los needs de prueba
# se crean con la Edge Function `webhook` (flujo mensajes + completado, US-1/S5).
#
# Escenarios Gherkin US-4 (DEV-43):
#   1.  Aprobar un need pendiente lo convierte en necesidad real (VERIFIED).
#   2.  Aprobar con nota opcional -> verification_notes guardada.
#   3.  Rechazar un need pendiente lo excluye de las vistas oficiales sin
#       borrarlo (REJECTED).
#   4.  Rechazar sin motivo es válido (verification_notes null).
#   5.  Reintentar aprobar un need ya revisado -> 409 + estado actual, sin
#       modificar.
#   6.  Reintentar rechazar un need ya revisado -> 409 + estado actual, sin
#       modificar.
#   7.  Need inexistente -> 404 estructurado (id no-UUID y UUID inexistente).
#   8.  Decisión inválida -> 400 invalid_decision, sin modificar.
#   9.  Decisión sin operador -> 400 missing_operator, sin modificar.
set -u
WH="${WH:-http://127.0.0.1:8000/functions/v1/webhook}"
RV="${RV:-http://127.0.0.1:8002/functions/v1/review}"
DB="docker exec supabase_db_aqui-hace-falta-cali psql -U postgres -d postgres -t -A -c"
CT="Content-Type: application/json"
P="dev43"

post() {
  local label="$1"
  local url="$2"
  local payload="$3"
  echo ""
  echo "--- $label"
  curl -s -w "\n    HTTP %{http_code}\n" -X POST "$url" -H "$CT" -d "$payload"
  echo ""
}

seed_need() {
  # Crea un need para el prefijo dado usando el flujo real del webhook
  # (mensaje + completado -> incidente en needs con PENDING_VERIFICATION).
  local prefix="$1"
  post "seed msg ${prefix}_m1" "$WH" "{\"id\":\"${prefix}_m1\",\"type\":\"message.received\",\"conversation_id\":\"${prefix}_conv\",\"data\":{\"body\":\"Necesito agua potable en mi barrio\",\"from\":\"573001234567\",\"message_type\":\"text\",\"workflow\":{\"step\":\"awaiting_location\"}}}" > /dev/null
  post "seed comp ${prefix}_c1" "$WH" "{\"id\":\"${prefix}_c1\",\"type\":\"conversation_completed\",\"conversation_id\":\"${prefix}_conv\",\"data\":{\"body\":\"Conversación finalizada\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"
}

echo "############################################################"
echo "# DEV-43 — US-4: Transición de estado de revisión"
echo "# Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Rama: agent/DEV-43"
echo "# Endpoints reales (Deno): $WH | $RV"
echo "############################################################"

# Limpieza previa de datos de prueba del prefijo (stack reproducible).
$DB "DELETE FROM needs WHERE conversation_id LIKE '${P}_%';" > /dev/null 2>&1
$DB "DELETE FROM ingest_responses WHERE conversation_id LIKE '${P}_%';" > /dev/null 2>&1

# ---------------------------------------------------------------------
# Escenario 1+2: Aprobar un need pendiente (con y sin nota)
# ---------------------------------------------------------------------
echo ""
echo "=== 1. Aprobar need pendiente ${P}_aprobado ==="
seed_need "${P}_aprobado"
APR_ID=$($DB "SELECT id FROM needs WHERE conversation_id='${P}_aprobado_conv' LIMIT 1;")
echo "    need id: $APR_ID"
post "1a. aprobar con nota" "$RV" "{\"need_id\":\"${APR_ID}\",\"decision\":\"aprobar\",\"verified_by\":\"operador@radar.local\",\"notes\":\"Verificado en terreno por la Cruz Roja\"}"
echo "--- verificación en BD (needs del prefijo):"
$DB "SELECT id, verification_status, verified_by, verification_notes, verified_at IS NOT NULL AS has_verified_at FROM needs WHERE conversation_id='${P}_aprobado_conv';"

# ---------------------------------------------------------------------
# Escenario 3+4: Rechazar un need pendiente (con y sin motivo)
# ---------------------------------------------------------------------
echo ""
echo "=== 3. Rechazar need pendiente ${P}_rechazado (con motivo) ==="
seed_need "${P}_rechazado"
REJ_ID=$($DB "SELECT id FROM needs WHERE conversation_id='${P}_rechazado_conv' LIMIT 1;")
echo "    need id: $REJ_ID"
post "3a. rechazar con motivo" "$RV" "{\"need_id\":\"${REJ_ID}\",\"decision\":\"rechazar\",\"verified_by\":\"operador@radar.local\",\"notes\":\"Información falsa\"}"
echo "--- verificación en BD (registro NO borrado, REJECTED):"
$DB "SELECT count(*) AS total_rechazados, verification_status FROM needs WHERE conversation_id='${P}_rechazado_conv' GROUP BY verification_status;"

echo ""
echo "=== 4. Rechazar sin motivo es válido ${P}_rechazado_sinmotivo ==="
seed_need "${P}_rechazado_sinmotivo"
REJ2_ID=$($DB "SELECT id FROM needs WHERE conversation_id='${P}_rechazado_sinmotivo_conv' LIMIT 1;")
echo "    need id: $REJ2_ID"
post "4a. rechazar sin notas" "$RV" "{\"need_id\":\"${REJ2_ID}\",\"decision\":\"rechazar\",\"verified_by\":\"operador@radar.local\"}"
echo "--- verificación en BD (verification_notes NULL, operación completada):"
$DB "SELECT verification_status, verification_notes, verified_by FROM needs WHERE conversation_id='${P}_rechazado_sinmotivo_conv';"

# ---------------------------------------------------------------------
# Escenario 5+6: Reintentar aprobar/rechazar un need ya revisado
# ---------------------------------------------------------------------
echo ""
echo "=== 5. Reintentar aprobar un need ya VERIFIED -> 409 ==="
post "5a. aprobar de nuevo" "$RV" "{\"need_id\":\"${APR_ID}\",\"decision\":\"aprobar\",\"verified_by\":\"operador@radar.local\"}"
echo "--- verificación en BD (registro NO modificado):"
$DB "SELECT verification_status, verified_by, verification_notes FROM needs WHERE id='${APR_ID}';"

echo ""
echo "=== 6. Reintentar rechazar un need ya REJECTED -> 409 ==="
post "6a. rechazar de nuevo" "$RV" "{\"need_id\":\"${REJ_ID}\",\"decision\":\"rechazar\",\"verified_by\":\"operador@radar.local\"}"
echo "--- verificación en BD (registro NO modificado):"
$DB "SELECT verification_status, verified_by, verification_notes FROM needs WHERE id='${REJ_ID}';"

# ---------------------------------------------------------------------
# Escenario 7: Need inexistente -> 404
# ---------------------------------------------------------------------
echo ""
echo "=== 7. Need inexistente -> 404 need_not_found ==="
post "7a. id no-UUID 'need_999'" "$RV" "{\"need_id\":\"need_999\",\"decision\":\"aprobar\",\"verified_by\":\"operador@radar.local\"}"
post "7b. UUID bien formado inexistente" "$RV" "{\"need_id\":\"00000000-0000-0000-0000-000000000999\",\"decision\":\"rechazar\",\"verified_by\":\"operador@radar.local\"}"

# ---------------------------------------------------------------------
# Escenario 8: Decisión inválida -> 400
# ---------------------------------------------------------------------
echo ""
echo "=== 8. Decisión inválida -> 400 invalid_decision ==="
seed_need "${P}_invalido"
INV_ID=$($DB "SELECT id FROM needs WHERE conversation_id='${P}_invalido_conv' LIMIT 1;")
echo "    need id: $INV_ID"
post "8a. decisión 'quizás'" "$RV" "{\"need_id\":\"${INV_ID}\",\"decision\":\"quizás\",\"verified_by\":\"operador@radar.local\"}"
echo "--- verificación en BD (registro NO modificado):"
$DB "SELECT verification_status, verified_by FROM needs WHERE id='${INV_ID}';"

# ---------------------------------------------------------------------
# Escenario 9: Decisión sin operador -> 400
# ---------------------------------------------------------------------
echo ""
echo "=== 9. Decisión sin operador -> 400 missing_operator ==="
seed_need "${P}_sinop"
SINOP_ID=$($DB "SELECT id FROM needs WHERE conversation_id='${P}_sinop_conv' LIMIT 1;")
echo "    need id: $SINOP_ID"
post "9a. sin verified_by" "$RV" "{\"need_id\":\"${SINOP_ID}\",\"decision\":\"aprobar\"}"
echo "--- verificación en BD (registro NO modificado):"
$DB "SELECT verification_status, verified_by FROM needs WHERE id='${SINOP_ID}';"

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
echo "=== Fin de la batería de evidencia DEV-43 ==="
