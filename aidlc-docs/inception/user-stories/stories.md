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

**Escenarios (Gherkin):**

```gherkin
Scenario: El contrato documenta el esquema de los eventos crudos
  Given existe el documento del contrato de integración
  When un integrante del equipo de conversación lo consulta para conocer el formato de los eventos
  Then encuentra el esquema de los eventos crudos con todos sus campos
    And el esquema incluye `event.id`, `type`, `data.conversation_id`, `data.from`, `data.body`, `data.message_type` y `data.workflow.step`
    And el documento indica que el transporte es un POST HTTP con JSON al endpoint del receptor

Scenario: El contrato documenta el evento de completado
  Given existe el documento del contrato de integración
  When un integrante del equipo de conversación consulta cómo se marca el fin de la conversación
  Then encuentra el esquema del evento de completado (otro `type` distinto de `message.received`)
    And el documento explica que ese evento dispara la creación del incidente en `needs`

Scenario: El contrato incluye ejemplos de payloads
  Given existe el documento del contrato de integración
  When un desarrollador de cualquiera de los dos equipos revisa el documento
  Then encuentra al menos un ejemplo de payload válido por cada tipo de evento soportado
    And los ejemplos cubren el evento crudo `message.received` y el evento de completado

Scenario: El contrato documenta los códigos de error
  Given existe el documento del contrato de integración
  When el equipo de conversación implementa el manejo de errores de la integración
  Then encuentra una tabla con los códigos de error (400/409/500)
    And cada código incluye su significado, cuándo aplica y la acción esperada del remitente

Scenario Outline: El contrato especifica la validación de campos faltantes
  Given existe el documento del contrato de integración
  When el equipo de conversación revisa qué pasa si envía un evento sin el campo <campo>
  Then encuentra que el receptor responde 400 Bad Request
    And el error estructurado indica el campo faltante (<campo>)

  Examples:
    | campo                |
    | event.id             |
    | type                 |
    | data.conversation_id |
    | data.body            |

Scenario: El contrato especifica el comportamiento ante reenvíos con el mismo event.id
  Given existe el documento del contrato de integración
  When el equipo de conversación consulta cómo reintentar un evento ya enviado
  Then encuentra que el receptor es idempotente por `event.id`
    And el documento especifica que un reenvío con el mismo `event.id` no crea duplicados
    And el documento indica el código de respuesta esperado ante un evento duplicado

Scenario: El contrato especifica el enriquecimiento cuando faltan coordenadas
  Given existe el documento del contrato de integración
  When el equipo de conversación envía un evento de completado sin coordenadas ni ciudad resuelta
  Then el documento especifica que el receptor enriquece el incidente con geocoding y detección de ciudad
    And el documento aclara que la falta de coordenadas no bloquea la confirmación (ACK) del evento

Scenario: El contrato declara la autenticación abierta como deuda de seguridad
  Given existe el documento del contrato de integración
  When el equipo de conversación evalúa los requisitos de autenticación para conectarse
  Then encuentra la nota explícita de que la autenticación está abierta actualmente
    And el documento la marca como deuda de seguridad pendiente de resolver con API key/HMAC

Scenario: El contrato está disponible y versionado para ambos equipos
  Given existe el documento del contrato de integración
  When un integrante de cualquiera de los dos equipos necesita la versión vigente del contrato
  Then encuentra el documento en el lugar compartido del proyecto
    And el documento está versionado y cualquier cambio mantiene actualizados los ejemplos y códigos de error
```
