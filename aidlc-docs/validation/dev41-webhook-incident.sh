#!/bin/bash
# Batería de evidencia DEV-41 (S5 groomed) — creación del incidente al completar
BASE="http://127.0.0.1:8000/functions/v1/webhook"
P="dev41"

post() {
  local payload="$1"
  curl -s -X POST "$BASE" -H "Content-Type: application/json" -d "$payload"
}

echo "############################################################"
echo "# DEV-41 — S5: Creación del incidente al completar (groomed)"
echo "# Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Rama: agent/DEV-41"
echo "# Endpoint real (Deno): $BASE"
echo "############################################################"

echo
echo "=== 1. Flujo completo: mensajes acumulados + completado (conversation_id en data) ==="
post "{\"id\":\"${P}_msg1\",\"type\":\"message.received\",\"data\":{\"conversation_id\":\"${P}_conv_ok\",\"body\":\"Necesito agua potable en mi barrio\",\"from\":\"573001234567\",\"message_type\":\"text\",\"workflow\":{\"step\":\"awaiting_location\"}}}"
echo
post "{\"id\":\"${P}_msg2\",\"type\":\"message.received\",\"data\":{\"conversation_id\":\"${P}_conv_ok\",\"body\":\"Quedo en San Fernando\",\"from\":\"573001234567\",\"message_type\":\"text\",\"workflow\":{\"step\":\"awaiting_details\"}}}"
echo
post "{\"id\":\"${P}_comp1\",\"type\":\"conversation_completed\",\"data\":{\"conversation_id\":\"${P}_conv_ok\",\"body\":\"Conversación finalizada\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"
echo

echo
echo "=== 2. Una conversación con varias necesidades -> un solo registro en needs ==="
post "{\"id\":\"${P}_n1\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_multi\",\"data\":{\"body\":\"Necesito agua potable\",\"from\":\"573001234567\"}}"
echo
post "{\"id\":\"${P}_n2\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_multi\",\"data\":{\"body\":\"También necesito medicinas para mi hijo\",\"from\":\"573001234567\"}}"
echo
post "{\"id\":\"${P}_comp2\",\"type\":\"conversation_completed\",\"conversation_id\":\"${P}_conv_multi\",\"data\":{\"body\":\"fin\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"
echo

echo
echo "=== 3. Completado con coordenadas -> sin geocoding, city_id resuelto ==="
post "{\"id\":\"${P}_coord_msg\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_coord\",\"data\":{\"body\":{\"text\":\"Estoy aquí\",\"latitude\":3.4516,\"longitude\":-76.532},\"from\":\"573001234567\"}}"
echo
post "{\"id\":\"${P}_coord_comp\",\"type\":\"conversation.completed\",\"conversation_id\":\"${P}_conv_coord\",\"data\":{\"body\":\"fin\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"
echo

echo
echo "=== 4. Sin coordenadas + address/neighborhood -> geocoding + ciudad ==="
post "{\"id\":\"${P}_addr_msg\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_addr\",\"data\":{\"body\":{\"text\":\"Necesito ayuda\",\"address\":\"Calle 5 #10-20\",\"neighborhood\":\"San Fernando\"},\"from\":\"573001234567\"}}"
echo
post "{\"id\":\"${P}_addr_comp\",\"type\":\"conversation_completed\",\"conversation_id\":\"${P}_conv_addr\",\"data\":{\"body\":\"fin\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"
echo

echo
echo "=== 5. Sin coordenadas ni dirección -> PENDING, lat/lng NULL, 200 ==="
post "{\"id\":\"${P}_noaddr_msg\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_noaddr\",\"data\":{\"body\":\"Necesito ayuda pero no tengo la dirección\",\"from\":\"573001234567\"}}"
echo
post "{\"id\":\"${P}_noaddr_comp\",\"type\":\"conversation_completed\",\"conversation_id\":\"${P}_conv_noaddr\",\"data\":{\"body\":\"fin\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"
echo

echo
echo "=== 6. Reenvío del mismo completado -> 409 duplicate_event ==="
post "{\"id\":\"${P}_comp1\",\"type\":\"conversation_completed\",\"data\":{\"conversation_id\":\"${P}_conv_ok\",\"body\":\"Conversación finalizada\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"
echo

echo
echo "=== 7. Completado sin conversation_id -> 400 missing_conversation_id ==="
post "{\"id\":\"${P}_noconv\",\"type\":\"conversation_completed\",\"data\":{\"body\":\"sin conv\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"
echo

echo
echo "=== 8. Completado sin mensajes acumulados -> 409 no_messages ==="
post "{\"id\":\"${P}_nomsg_comp\",\"type\":\"conversation_completed\",\"conversation_id\":\"${P}_conv_empty\",\"data\":{\"body\":\"fin\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"
echo

echo
echo "=== 9. Completado con from inválido -> 400 invalid_from (auditoría conservada) ==="
post "{\"id\":\"${P}_badfrom_msg\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_badfrom\",\"data\":{\"body\":\"Necesito ayuda\",\"from\":\"573001234567\"}}"
echo
post "{\"id\":\"${P}_badfrom_comp\",\"type\":\"conversation_completed\",\"conversation_id\":\"${P}_conv_badfrom\",\"data\":{\"body\":\"fin\",\"from\":\"no-es-un-numero\",\"workflow\":{\"step\":\"completed\"}}}"
echo

echo
echo "=== 10. Conversaciones distintas no mezclan sus mensajes ==="
post "{\"id\":\"${P}_a1\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_A\",\"data\":{\"body\":\"Mensaje de A\",\"from\":\"573001234567\"}}"
echo
post "{\"id\":\"${P}_b1\",\"type\":\"message.received\",\"conversation_id\":\"${P}_conv_B\",\"data\":{\"body\":\"Mensaje de B\",\"from\":\"573001234567\"}}"
echo
post "{\"id\":\"${P}_ca\",\"type\":\"conversation_completed\",\"conversation_id\":\"${P}_conv_A\",\"data\":{\"body\":\"fin\",\"from\":\"573001234567\",\"workflow\":{\"step\":\"completed\"}}}"
echo
