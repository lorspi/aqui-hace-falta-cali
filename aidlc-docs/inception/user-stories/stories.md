# User Stories — Receptor de eventos del bot de WhatsApp

## S1 — Esquema de datos en Supabase
Como ingeniero del receptor, quiero tablas en Supabase (`needs` y `ingest_responses`) con RLS, para persistir incidentes y los eventos crudos del webhook.

**Criterios de aceptación:**
- Migración SQL crea `needs` espejando el modelo `Need` (categorías, tipo de lugar, prioridad, estado, verificación, contacto, ubicación).
- `ingest_responses` guarda el evento crudo + metadatos (`event_id`, `type`, `conversation_id`, `from`, `body`, `message_type`, `workflow_step`, timestamps).
- RLS: solo service role escribe; sin acceso anónimo.

## S2 — Endpoint receptor de eventos
Como sistema receptor, quiero un endpoint HTTP que reciba los eventos del webhook del equipo de conversación.

**Criterios de aceptación:**
- Acepta POST con JSON (eventos crudos de cualquier `type`).
- Autenticación abierta por ahora (sin auth; deuda de seguridad).
- Valida estructura mínima del body → 400 con errores detallados.
- Responde 200 por cada evento.

## S3 — Validación y mapeo de eventos
Como sistema receptor, quiero validar y mapear los eventos crudos a nuestro modelo (`Need`) para garantizar integridad.

**Criterios de aceptación:**
- Campos mínimos requeridos por evento (`id`, `type`, `conversation_id`, `body`).
- Normalización de `message_type` y `workflow.step` para armar el incidente.
- Defaults: `priority=MEDIUM`, `status=NEED_HELP_NOW`, `verification_status=PENDING_VERIFICATION`, `source=WhatsApp`.

**Escenarios (Gherkin):**

```gherkin
Scenario: Un evento válido se valida y mapea a un borrador de Need con defaults
  Given un evento crudo de type 'message.received' con los campos mínimos requeridos (id, type, conversation_id, body)
  And data.from con el número del ciudadano
  When el receptor valida y mapea el evento
  Then el resultado es un borrador de Need válido
  And se aplican los defaults priority=MEDIUM, status=NEED_HELP_NOW, verification_status=PENDING_VERIFICATION y source=WhatsApp
  And contact_whatsapp se toma de data.from cuando está presente
  And el borrador queda listo para enriquecerse y persistirse en etapas posteriores (S4/S5)
```

```gherkin
Scenario: message_type llega con formato inconsistente y se normaliza
  Given un evento cuyos campos mínimos son válidos
  And data.message_type llega con formato inconsistente (p. ej. 'TEXT', 'Text', 'image')
  When el receptor mapea el evento
  Then message_type se normaliza a un valor canónico para clasificar el contenido del mensaje
  And un message_type desconocido no invalida el evento sino que se clasifica como genérico
```

```gherkin
Scenario: workflow.step se normaliza y alimenta el armado del incidente
  Given un evento cuyos campos mínimos son válidos
  And data.workflow.step llega en un formato crudo (p. ej. 'awaiting_location' o 'completed')
  When el receptor mapea el evento
  Then workflow.step se normaliza a un valor canónico
  And el paso normalizado determina qué información aporta el mensaje al incidente acumulado
  And cuando el paso corresponde al completado de la conversación, se señala que el incidente está listo para crearse (delegado a S5)
```

```gherkin
Scenario: Un evento con campos mínimos faltantes se rechaza con error de validación
  Given un evento crudo sin body o sin conversation_id
  When el receptor valida el evento
  Then la validación falla
  And el error detalla el o los campos faltantes
  And no se genera ningún borrador de Need
```

```gherkin
Scenario: Campos presentes pero con formato inválido se rechazan
  Given un evento cuyo id o conversation_id está vacío o no es un string no vacío
  And un body que no es string
  When el receptor valida el evento
  Then la validación falla indicando cada campo inválido
  And no se genera ningún borrador de Need
```

```gherkin
Scenario: Un reenvío con el mismo event.id no vuelve a mapear
  Given un evento que ya fue validado y mapeado previamente (mismo event.id)
  When llega un reenvío con ese mismo event.id
  Then la capa de validación/mapeo detecta el event.id ya procesado
  And no produce un segundo borrador de Need
  And la deduplicación se confirma en la capa de idempotencia (S4/S6)
```

```gherkin
Scenario: Un evento sin coordenadas produce un borrador con ubicación pendiente de geocoding
  Given un evento válido cuyo body no incluye latitud ni longitud
  When el receptor mapea el evento
  Then el borrador de Need se genera con la ubicación pendiente de resolver
  And latitud/longitud quedan pendientes de enriquecimiento por geocoding (delegado a S5)
  And address y neighborhood se conservan desde el body cuando vienen incluidos
```

```gherkin
Scenario: Un evento de type distinto a message.received pasa validación sin armar incidente
  Given un evento con type distinto de 'message.received' (p. ej. 'conversation_completed')
  When el receptor valida el evento
  Then la validación de campos mínimos pasa
  And el mapeo no arma un incidente directamente a partir de este evento
  And el evento queda como insumo para el flujo de completado de la conversación (S5)
```

## S4 — Persistencia del evento crudo
Como operador, quiero que cada evento recibido se guarde tal cual para auditoría.

**Criterios de aceptación:**
- Cada evento genera una fila en `ingest_responses` (cruda + metadatos + estado de procesamiento).
- Idempotencia por `event.id`; reintentos no duplican.

## S5 — Creación del incidente al completar la conversación
Como operador, quiero que al recibir el evento de completado (otro `type`) se cree un registro en `needs`.

**Criterios de aceptación:**
- Se acumulan mensajes por `conversation_id`; el evento de completado dispara la creación del incidente.
- Incidente con `source=WhatsApp`, `contact_whatsapp` desde `from` y pendiente de verificación.
- Si faltan coordenadas, se enriquece con geocoding + ciudad.
- Depende del schema del evento de completado.

## S6 — Idempotencia / deduplicación
Como operador, quiero que reenvíos del mismo evento no generen duplicados.

**Criterios de aceptación:**
- Clave de idempotencia: `event.id`.
- Reenvío con el mismo `event.id` no crea duplicados; se ignora o devuelve el existente.

## S7 — Confirmación al remitente (ACK)
Como equipo de conversación, quiero recibir confirmación de recepción de cada evento.

**Criterios de aceptación:**
- Respuesta 200 por evento recibido.
- Errores → códigos y mensajes estructurados (400/409/500).

## S8 — Documentación del contrato de integración
Como equipo, quiero documentar el contrato para alinear a ambos equipos.

**Criterios de aceptación:**
- Documento con el esquema de los eventos crudos, el evento de completado, ejemplos y códigos de error.
- Nota explícita: autenticación abierta (deuda de seguridad).
