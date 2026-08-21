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
