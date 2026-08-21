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

**Escenarios (Gherkin):**

```gherkin
Scenario: El primer evento con un event.id nuevo se persiste una sola vez
  Given un evento crudo del webhook con id 'evt_001' y type 'message.received'
  When el receptor procesa el evento 'evt_001'
  Then se crea una fila en ingest_responses con event_id = 'evt_001'
  And el evento queda disponible para el procesamiento aguas abajo
```

```gherkin
Scenario: El reenvío con el mismo event.id no crea duplicados
  Given ya existe una fila en ingest_responses con event_id = 'evt_001'
  When llega un reenvío del mismo evento con id 'evt_001'
  Then no se crea una segunda fila en ingest_responses
  And el reenvío se ignora o se devuelve el registro existente
```

```gherkin
Scenario: El reenvío con el mismo event.id pero body diferente no duplica ni sobreescribe
  Given ya existe una fila en ingest_responses con event_id = 'evt_002' y un body original registrado
  When llega un reenvío con el mismo id 'evt_002' pero con un body distinto
  Then no se crea una nueva fila en ingest_responses
  And no se sobreescribe el body original registrado
  And la clave de idempotencia event.id tiene prioridad sobre el contenido
```

```gherkin
Scenario: Reenvíos concurrentes del mismo event.id generan una sola fila
  Given el receptor recibe dos POST simultáneos con el mismo id 'evt_003'
  When ambos se procesan en paralelo
  Then solo se crea una fila en ingest_responses con event_id = 'evt_003'
  And la unicidad de event_id (constraint/índice único) resuelve la condición de carrera
```

```gherkin
Scenario: Un evento sin id se rechaza (no hay clave de idempotencia)
  Given un evento crudo del webhook sin campo id o con id vacío
  When el receptor procesa el evento
  Then la validación devuelve un error 400 detallando el campo faltante
  And no se persiste ninguna fila en ingest_responses
  And no se invoca la lógica de deduplicación
```

```gherkin
Scenario: Eventos distintos con event.id diferente se persisten por separado
  Given dos eventos crudos con id 'evt_004' y 'evt_005' aunque compartan conversation_id o contenido similar
  When el receptor los procesa en orden
  Then se crean dos filas en ingest_responses, una por cada event.id
  And la deduplicación no usa el contenido ni conversation_id como clave
```

```gherkin
Scenario: Un reenvío tras un intento fallido de validación se procesa como nuevo
  Given un primer intento del evento 'evt_006' que falló la validación y no se persistió
  When llega un reenvío corregido con el mismo id 'evt_006'
  Then se procesa como un evento nuevo
  And se crea una fila en ingest_responses con event_id = 'evt_006'
  And el intento fallido previo no bloquea el reenvío
```

```gherkin
Scenario: La deduplicación por event.id protege el pipeline aguas abajo
  Given ya existe una fila en ingest_responses con event_id = 'evt_007' y ese evento ya fue procesado
  When llega un reenvío del mismo evento 'evt_007'
  Then el reenvío se descarta en la capa de ingestión
  And no se vuelve a ejecutar el procesamiento aguas abajo (p. ej. no se re-crea el incidente)
```

> ℹ️ **Alcance**: la idempotencia por `event.id` protege la persistencia del evento crudo en `ingest_responses`. La deduplicación del incidente que se crea al completar la conversación se cubre en S5. No incluye autenticación del webhook (ver S8, deuda de seguridad).

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
