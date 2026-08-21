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

**Escenarios (Gherkin):**

```gherkin
Scenario: El evento de completado crea el incidente con los datos acumulados de la conversación
  Given una conversación 'conv_123' que acumuló varios eventos message.received con data.from '573001234567'
  When llega el evento de completado (otro type, p. ej. conversation.completed) con data.conversation_id 'conv_123'
  Then se crea un registro en needs
  And el incidente se construye con los mensajes acumulados de 'conv_123'
  And source = 'WhatsApp'
  And contact_whatsapp = '573001234567' tomado de data.from
  And verification_status = 'PENDING_VERIFICATION'
  And aplican los defaults del mapeo: priority = 'MEDIUM', status = 'NEED_HELP_NOW', emergency_id = 'terremoto-cali-2026'
```

```gherkin
Scenario: El evento de completado con coordenadas crea el incidente sin geocoding
  Given una conversación 'conv_123' cuyos mensajes acumulados incluyen latitud y longitud
  When llega el evento de completado para 'conv_123'
  Then se crea el incidente en needs con esas coordenadas
  And no se invoca el flujo de geocoding
  And la ciudad (city_id) se resuelve a partir de las coordenadas
```

```gherkin
Scenario: El evento de completado sin coordenadas dispara el enriquecimiento con geocoding + ciudad
  Given una conversación 'conv_123' cuyos mensajes acumulados no incluyen latitud ni longitud pero sí address/neighborhood
  When llega el evento de completado para 'conv_123'
  Then se crea el incidente en needs con las coordenadas pendientes de geocoding
  And se invoca el flujo de enriquecimiento de geocoding + detección de ciudad
  And el incidente se actualiza con latitud, longitud y city_id cuando el geocoding resuelve la dirección
```

```gherkin
Scenario: El geocoding no disponible no bloquea la creación del incidente
  Given una conversación 'conv_123' sin coordenadas y sin datos de dirección para geocoding
  When llega el evento de completado para 'conv_123' y el geocoding no puede resolver una ubicación
  Then el incidente se crea igualmente en needs con latitud/longitud NULL
  And la ubicación queda marcada como pendiente de enriquecimiento
  And el flujo no rechaza el evento de completado
```

```gherkin
Scenario: Un reenvío del mismo evento de completado no crea un incidente duplicado
  Given ya se creó el incidente en needs para el evento de completado con id 'evt_999' de la conversación 'conv_123'
  When llega un reenvío del evento de completado con el mismo id 'evt_999'
  Then no se crea un segundo incidente en needs para 'conv_123'
  And se devuelve el incidente existente (idempotencia por event.id)
```

```gherkin
Scenario: Un evento de completado sin conversation_id no crea incidente
  Given un evento de completado sin data.conversation_id o con data.conversation_id vacío
  When el receptor procesa el evento de completado
  Then la validación devuelve un error 400 detallando el campo faltante
  And no se crea ningún registro en needs
```

```gherkin
Scenario: Un evento de completado sin mensajes acumulados previos no crea incidente
  Given un evento de completado para 'conv_999' del que no se acumularon eventos message.received previos
  When el receptor procesa el evento de completado
  Then no se crea un incidente en needs
  And se devuelve un error (400/409) señalando que no hay mensajes acumulados para armar el incidente
```

```gherkin
Scenario: Un evento de completado con from inválido se rechaza
  Given un evento de completado para 'conv_123' cuyo data.from no es un número de WhatsApp válido
  When el receptor procesa el evento de completado
  Then la validación devuelve un error 400
  And no se crea el incidente en needs
  And el evento queda registrado en ingest_responses para auditoría
```

```gherkin
Scenario: Conversaciones distintas no mezclan sus mensajes acumulados
  Given dos conversaciones 'conv_A' y 'conv_B' con eventos message.received acumulados de forma separada
  When llega el evento de completado únicamente para 'conv_A'
  Then se crea el incidente solo con los mensajes acumulados de 'conv_A'
  And no se incluyen datos de 'conv_B' en el incidente
  And 'conv_B' permanece sin incidente hasta que llegue su propio evento de completado
```

> ⚠️ **Dependencia**: el schema del evento de completado (nombre del `type` y campos) está pendiente de confirmación por el equipo de conversación. Esta historia no incluye autenticación del webhook (ver S8, deuda de seguridad).

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
