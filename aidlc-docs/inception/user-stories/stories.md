# User Stories — Receptor de eventos del bot de WhatsApp

## S1 — Esquema de datos en Supabase
Como ingeniero del receptor, quiero tablas en Supabase (`needs` y `ingest_responses`) con RLS, para persistir incidentes y los eventos crudos del webhook.

**Criterios de aceptación:**
- Migración SQL crea `needs` espejando el modelo `Need` (categorías, tipo de lugar, prioridad, estado, verificación, contacto, ubicación).
- `ingest_responses` guarda el evento crudo + metadatos (`event_id`, `type`, `conversation_id`, `from`, `body`, `message_type`, `workflow_step`, timestamps).
- RLS: solo service role escribe; sin acceso anónimo.

**Escenarios (Gherkin):**

```gherkin
Scenario: La migración crea la tabla needs espejando el modelo Need
  Given un proyecto Supabase con la extensión uuid-ossp habilitada
  When se ejecuta la migración SQL del esquema del receptor
  Then la tabla needs existe con una PK uuid en id
  And están presentes las columnas del modelo Need: categories, place_type, priority, status, verification_status, requester_type
  And están presentes las columnas de contacto y ubicación: contact_name, contact_phone, contact_whatsapp, contact_email, address, neighborhood, latitude, longitude, city_id
  And los valores por defecto del modelo se reflejan (priority=MEDIUM, status=NEED_HELP_NOW, verification_status=PENDING_VERIFICATION)
  And existen índices para filtrar por status, priority, verification_status y created_at
```

```gherkin
Scenario: La migración crea la tabla ingest_responses para auditoría
  Given un proyecto Supabase con la extensión uuid-ossp habilitada
  When se ejecuta la migración SQL del esquema del receptor
  Then la tabla ingest_responses existe
  And incluye las columnas de metadatos del evento: event_id, type, conversation_id, from, message_type, workflow_step
  And guarda el cuerpo del evento tal cual llega en una columna JSONB (body/raw_payload)
  And incluye timestamps de recepción (received_at/created_at) y estado de procesamiento (processing_status)
  And declara una unicidad sobre event_id para soportar idempotencia
```

```gherkin
Scenario: RLS solo permite escribir al service role y bloquea el acceso anónimo
  Given las tablas needs e ingest_responses con RLS habilitado
  When un cliente autenticado con la anon key intenta leer o escribir en ingest_responses
  Then la operación es rechazada (no hay políticas para el rol anon)
  When el service role (server/Edge Function) inserta y lee con su clave
  Then la operación se completa correctamente
  And no existe ninguna política que otorgue SELECT/INSERT/UPDATE/DELETE al rol anon sobre ingest_responses
```

```gherkin
Scenario: Un evento con campos faltantes se persiste sin perder la auditoría
  Given un evento crudo que solo trae event_id y body (sin type, conversation_id ni from)
  When el receptor intenta guardarlo en ingest_responses
  Then la fila se crea con el payload crudo intacto en la columna JSONB
  And las columnas de metadatos ausentes quedan NULL
  And el evento queda disponible para procesamiento y trazabilidad posterior
```

```gherkin
Scenario: Un reenvío con el mismo event_id no genera una fila duplicada
  Given una fila existente en ingest_responses con event_id = 'evt_123'
  When llega un reenvío del mismo evento con event_id = 'evt_123'
  Then el esquema (constraint único sobre event_id) rechaza el duplicado o lo señala como ya existente
  And la capa de idempotencia puede devolver la fila existente sin duplicar
```

```gherkin
Scenario: Un incidente sin coordenadas puede persistirse y enriquecerse con geocoding
  Given un incidente cuyo evento no incluye latitud ni longitud
  When se persiste el need correspondiente en la tabla needs
  Then el esquema permite guardarlo sin coordenadas resueltas (lat/long NULL o pendientes de geocoding)
  And el flujo de enriquecimiento puede actualizar la fila con latitud, longitud y ciudad posteriormente
```

```gherkin
Scenario: Las restricciones del esquema rechazan inserts inválidos
  Given la tabla needs creada por la migración
  When se intenta insertar un need sin los campos obligatorios del modelo (title, description, contact_name)
  Then la operación falla con un error de violación de restricción NOT NULL
  When se intenta insertar en ingest_responses sin event_id
  Then la operación falla (event_id es obligatorio por ser la clave de idempotencia)
```

## S2 — Endpoint receptor de eventos
Como sistema receptor, quiero un endpoint HTTP que reciba los eventos del webhook del equipo de conversación.

**Criterios de aceptación:**
- Acepta POST con JSON (eventos crudos de cualquier `type`).
- Autenticación abierta por ahora (sin auth; deuda de seguridad).
- Valida estructura mínima del body → 400 con errores detallados.
- Responde 200 por cada evento.

**Escenarios (Gherkin):**

```gherkin
Scenario: El endpoint acepta un evento crudo válido y responde 200
  Given el endpoint POST /webhook/events del receptor de eventos
  When el equipo de conversación envía un POST con Content-Type application/json y un evento crudo válido (id, type, conversation_id, body)
  Then el receptor responde 200 OK
  And el evento queda disponible para la validación y persistencia posteriores
```

```gherkin
Scenario: El endpoint acepta eventos de cualquier type, incluido el de completado
  Given el endpoint POST /webhook/events del receptor de eventos
  When el equipo de conversación envía un evento con type 'conversation_completed'
  Then el receptor responde 200 OK
  And el type del evento no condiciona su aceptación en el endpoint
```

```gherkin
Scenario: El endpoint rechaza un body que no es JSON válido
  Given el endpoint POST /webhook/events del receptor de eventos
  When el equipo de conversación envía un POST con un body vacío o no parseable como JSON
  Then el receptor responde 400 Bad Request
  And el error detalla que el body debe ser un JSON válido
```

```gherkin
Scenario: El endpoint rechaza un evento con campos mínimos faltantes
  Given el endpoint POST /webhook/events del receptor de eventos
  When se envía un evento JSON sin id, type, conversation_id o body
  Then el receptor responde 400 Bad Request
  And el error detalla los campos faltantes o con formato inválido
```

```gherkin
Scenario: Un reenvío con el mismo event_id se acepta en el endpoint
  Given el endpoint POST /webhook/events del receptor de eventos
  When el remitente reenvía un evento con el mismo event_id ya recibido previamente
  Then el receptor responde 200 OK
  And la deduplicación se delega a la capa de idempotencia (S4/S6)
```

```gherkin
Scenario: El endpoint acepta peticiones sin autenticación
  Given el endpoint POST /webhook/events del receptor de eventos
  When el equipo de conversación envía un POST sin token ni credenciales
  Then el receptor responde 200 OK
  And la autenticación queda registrada como deuda de seguridad (ver S8)
```

```gherkin
Scenario: Un evento sin coordenadas se acepta en el endpoint
  Given el endpoint POST /webhook/events del receptor de eventos
  When se envía un evento crudo que cumple la estructura mínima pero no incluye latitud ni longitud
  Then el receptor responde 200 OK
  And el enriquecimiento con geocoding queda delegado a la capa de mapeo (S5)
```

```gherkin
Scenario: El endpoint responde 200 por cada evento de una ráfaga
  Given el endpoint POST /webhook/events del receptor de eventos
  When el equipo de conversación envía varios eventos en secuencia
  Then cada evento recibe una respuesta 200 OK
  And ninguno se rechaza por razones de transporte
```

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

## S9 — Pruebas e2e del receptor
Como equipo, quiero una suite de pruebas end-to-end contra el stack real (Edge Function + Supabase local) para verificar que el receptor funciona completamente y detectar regresiones.

**Criterios de aceptación:**
- Suite en `e2e/run_e2e.py` (Python, stdlib, reproducible) contra el stack real: Edge Function servida con Deno en el puerto 8000 y Supabase local de RADAR (API 54341 / DB 54342).
- La BD local tiene las 4 migraciones del receptor aplicadas (S1 schema, S4 ingest, S5 incident, S6 idempotencia).
- Endpoint real servido con Deno: `deno run --allow-net --allow-env --allow-read --env-file=/tmp/radar_edge.env index.ts` — mismo runtime que usa Supabase Edge (el CLI `supabase functions serve` falla con entrypoint en v2.109.1).
- Verificación de persistencia con SQL directo vía `docker exec`.
- Datos de prueba con prefijo `e2e_%`; la suite es limpia y reproducible (borra al final).
- 10 escenarios / 27 checks, 0 fallos.
- No toca código de la app ni del endpoint: solo pruebas y documentación.

**Escenarios (Gherkin):**

```gherkin
Scenario: E01 — Un evento válido se acepta con 200 y se mapea al modelo
  Given el stack RADAR local está levantado con las 4 migraciones aplicadas
    And la Edge Function `webhook` se sirve con Deno en el puerto 8000
  When la suite envía un evento válido `message.received` (id con prefijo `e2e_%`)
  Then el endpoint responde 200 con `status=accepted`
    And el ACK incluye `mapping` con `message_type=TEXT`
    And el mapping normaliza `workflow.step` a `AWAITING_LOCATION`
    And el mapping incluye `contact_whatsapp` y `builds_incident`
    And `location_pending_geocoding=true` cuando el evento no trae coordenadas

Scenario: E02 — Un body JSON inválido responde 400 invalid_json
  Given la Edge Function `webhook` se sirve con Deno en el puerto 8000
  When la suite envía un POST con un body que no se puede parsear como JSON
  Then el endpoint responde 400 con `code=invalid_json`

Scenario: E03 — Un Content-Type distinto de JSON responde 415
  Given la Edge Function `webhook` se sirve con Deno en el puerto 8000
  When la suite envía un POST con `Content-Type: text/plain` y un body JSON válido
  Then el endpoint responde 415 con `code=invalid_content_type`

Scenario Outline: E04 — Campos mínimos faltantes responden 400 validation_failed
  Given la Edge Function `webhook` se sirve con Deno en el puerto 8000
  When la suite envía un evento sin el campo <campo> obligatorio
  Then el endpoint responde 400 con `code=validation_failed`
    And el body detalla el campo faltante

  Examples:
    | campo           |
    | id              |
    | type            |
    | conversation_id |
    | body            |

Scenario: E05 — Un método distinto de POST responde 405
  Given la Edge Function `webhook` se sirve con Deno en el puerto 8000
  When la suite envía un GET al endpoint
  Then el endpoint responde 405 con `code=method_not_allowed`

Scenario: E06 — El reenvío del mismo event.id responde 409 duplicate_event
  Given la suite envió un evento válido que fue aceptado (200)
  When la suite reenvía el mismo evento con el mismo `event.id`
  Then el endpoint responde 409 con `code=duplicate_event`
    And el body incluye `details.record` con la fila existente
    And la verificación en BD confirma que no se creó un duplicado en `ingest_responses`

Scenario: E07 — Un completado sin mensajes acumulados responde 409 no_messages
  Given no hay eventos `message.received` previos para la conversación
  When la suite envía el evento de completado de esa conversación
  Then el endpoint responde 409 con `code=no_messages`
    And la verificación en BD confirma que no se creó un incidente en `needs`

Scenario: E08 — El flujo completo mensajes + completado crea el incidente
  Given la suite envía uno o más `message.received` para la conversación `e2e_%`
  When la suite envía el evento de completado de la misma conversación
  Then el endpoint responde 200
    And el ACK incluye `incident` con `source=WhatsApp` y `verification_status=PENDING_VERIFICATION`
    And la verificación en BD confirma el incidente en `needs`

Scenario: E09 — El reenvío del completado no duplica el incidente
  Given el flujo completo ya creó el incidente (E08)
  When la suite reenvía el mismo evento de completado (mismo `event.id`)
  Then el endpoint responde 409 `duplicate_event`
    And la verificación en BD confirma que no hay un segundo incidente en `needs`

Scenario: E10 — La persistencia se verifica con SQL directo
  Given la suite envió y aceptó un evento válido
  When la suite verifica con SQL directo vía `docker exec` la fila en `ingest_responses`
  Then `raw_event` queda intacto (JSON idéntico al evento enviado)
    And `processing_status=RECEIVED`
    And no hay filas duplicadas para el mismo `event.id`
    And los datos de prueba con prefijo `e2e_%` se limpian al final de la suite
```
