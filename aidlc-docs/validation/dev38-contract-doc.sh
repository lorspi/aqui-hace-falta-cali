#!/usr/bin/env bash
# DEV-38 — Evidencia en ejecución: Documentación del contrato de integración (S8)
# Ejercita la Edge Function `webhook` local (bootstrap Node con stores
# PostgREST reales) para verificar que el comportamiento documentado en
# documentacion/Contrato-de-Integracion.md coincide con el receptor real.
#
# Escenarios cubiertos (contrato S8):
#   1. Evento crudo `message.received` con `data.conversation_id` (shape
#      documentado) → 200 ACK; se persiste con el conversation_id resuelto.
#   2. Validación de campos faltantes → 400 indicando el campo (event.id /
#      type / data.conversation_id / data.body).
#   3. Reenvío del mismo event.id → 409 (idempotencia por event.id).
#   4. Evento de completado sin coordenadas → 200 ACK; incidente creado con
#      enriquecimiento PENDING (el geocoding no bloquea el ACK).
#   5. Verificación de que el documento del contrato existe en
#      documentacion/Contrato-de-Integracion.md.
set -u
BASE="${BASE:-http://127.0.0.1:8081}"
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
echo "# DEV-38 — Documentación del contrato de integración (S8)"
echo "# Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Rama: agent/DEV-38"
echo "############################################################"

# ---------------------------------------------------------------------
# Escenario 1: Evento crudo message.received con data.conversation_id
# ---------------------------------------------------------------------
post "1. message.received con data.conversation_id -> 200 ACK" '{
  "id": "evt_s8_001",
  "type": "message.received",
  "data": {
    "conversation_id": "conv_s8_001",
    "from": "573001234567",
    "body": "Necesito agua potable en mi barrio",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}'

# ---------------------------------------------------------------------
# Escenario 2: Validación de campos faltantes -> 400 indicando el campo
# ---------------------------------------------------------------------
post "2a. Sin event.id -> 400 (indica el campo)" '{
  "type": "message.received",
  "data": { "conversation_id": "conv_s8_001", "body": "sin id", "from": "573001234567" }
}'

post "2b. Sin type -> 400 (indica el campo)" '{
  "id": "evt_s8_002",
  "data": { "conversation_id": "conv_s8_001", "body": "sin type", "from": "573001234567" }
}'

post "2c. Sin data.conversation_id -> 400 (indica el campo)" '{
  "id": "evt_s8_003",
  "type": "message.received",
  "data": { "body": "sin conv", "from": "573001234567" }
}'

post "2d. Sin data.body -> 400 (indica el campo)" '{
  "id": "evt_s8_004",
  "type": "message.received",
  "data": { "conversation_id": "conv_s8_001", "from": "573001234567" }
}'

# ---------------------------------------------------------------------
# Escenario 3: Reenvío del mismo event.id -> 409 (idempotencia)
# ---------------------------------------------------------------------
post "3a. Primer envío evt_s8_dup -> 200" '{
  "id": "evt_s8_dup",
  "type": "message.received",
  "data": { "conversation_id": "conv_s8_001", "body": "Necesito ayuda", "from": "573001234567" }
}'

post "3b. Reenvío del mismo event.id -> 409 (sin duplicado)" '{
  "id": "evt_s8_dup",
  "type": "message.received",
  "data": { "conversation_id": "conv_s8_001", "body": "Necesito ayuda", "from": "573001234567" }
}'

# ---------------------------------------------------------------------
# Escenario 4: Completado sin coordenadas -> 200 ACK + incidente PENDING
# ---------------------------------------------------------------------
post "4a. message.received de conv_s8_nocoords (sin coordenadas)" '{
  "id": "evt_s8_m1",
  "type": "message.received",
  "data": { "conversation_id": "conv_s8_nocoords", "body": "Necesito ayuda sin ubicación", "from": "573001234567" }
}'

post "4b. Completado de conv_s8_nocoords (sin coordenadas) -> 200 ACK" '{
  "id": "evt_s8_c1",
  "type": "conversation_completed",
  "data": { "conversation_id": "conv_s8_nocoords", "body": "Conversación finalizada", "from": "573001234567", "workflow": { "step": "completed" } }
}'

# ---------------------------------------------------------------------
# Escenario 5: El documento del contrato existe (lugar compartido)
# ---------------------------------------------------------------------
echo ""
echo "=== 5. El documento del contrato existe en el lugar compartido ==="
if [ -f "documentacion/Contrato-de-Integracion.md" ]; then
  echo "OK: documentacion/Contrato-de-Integracion.md existe"
  grep -n "^# \|^\|Versión\|autenticación" documentacion/Contrato-de-Integracion.md | head -20
else
  echo "ERROR: falta documentacion/Contrato-de-Integracion.md"
  exit 1
fi

echo ""
echo "=== Fin de la batería de evidencia DEV-38 ==="
