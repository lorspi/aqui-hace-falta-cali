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

## S3 — Validación y mapeo de eventos
Como sistema receptor, quiero validar y mapear los eventos crudos a nuestro modelo (`Need`) para garantizar integridad.

**Criterios de aceptación:**
- Campos mínimos requeridos por evento (`id`, `type`, `conversation_id`, `body`).
- Normalización de `message_type` y `workflow.step` para armar el incidente.
- Defaults: `priority=MEDIUM`, `status=NEED_HELP_NOW`, `verification_status=PENDING_VERIFICATION`, `source=WhatsApp`.

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
