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

**Escenarios (Gherkin):**

Escenario: Un evento válido se persiste tal cual en `ingest_responses`
  Dado que llega un evento `message.received` válido con `id`, `type` y `data` completos (`conversation_id`, `from`, `body`, `message_type`, `workflow.step`)
  Cuando el receptor lo persiste
  Entonces se crea una fila en `ingest_responses`
  Y la columna del evento crudo (`raw_event`) guarda el JSON completo del evento sin modificar
  Y los metadatos se copian a `event_id`, `type`, `conversation_id`, `from`, `body`, `message_type` y `workflow_step`
  Y el estado de procesamiento queda en `RECEIVED`
  Y se registran los timestamps de recepción y creación

Escenario: Un reenvío con el mismo `event.id` no crea una fila duplicada
  Dado que ya existe una fila en `ingest_responses` con `event_id = abc123`
  Cuando llega un reenvío del mismo evento con el mismo `id`
  Entonces no se inserta una nueva fila
  Y se devuelve la fila existente
  Y el número de filas para ese `event_id` sigue siendo 1

Escenario: Un reenvío con el mismo `event.id` no modifica la fila original
  Dado que ya existe una fila en `ingest_responses` con `event_id = abc123` y un `raw_event` original
  Cuando llega un reenvío con el mismo `id` pero con un `body` distinto
  Entonces no se crea una fila duplicada
  Y la fila original conserva su `raw_event` y sus timestamps sin cambios

Escenario: Un evento sin campos obligatorios no se persiste
  Dado que llega un evento que no cumple los campos mínimos (`id`, `type`, `conversation_id`, `body`)
  Cuando se intenta persistir
  Entonces la validación devuelve un error 400 con los campos faltantes
  Y no se crea ninguna fila en `ingest_responses`

Escenario: Un evento sin coordenadas se persiste tal cual
  Dado que llega un evento de mensaje sin coordenadas en su payload
  Cuando el receptor lo persiste
  Entonces se crea la fila en `ingest_responses` con el evento crudo sin modificar
  Y el estado de procesamiento queda en `RECEIVED`
  Y el enriquecimiento de coordenadas (geocoding) queda pendiente para el procesamiento posterior

Escenario: Eventos distintos de la misma conversación generan filas separadas
  Dado que dos eventos de la misma `conversation_id` tienen `id` distintos
  Cuando ambos se persisten
  Entonces cada evento genera su propia fila en `ingest_responses`
  Y la idempotencia aplica por `event.id`, no por `conversation_id`

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

**Escenarios (Gherkin):**

```gherkin
Scenario: Evento válido se confirma con 200
  Given el equipo de conversación envía un POST con un evento válido
    And el evento incluye `event.id`, `type`, `data.conversation_id` y `data.body`
  When el receptor procesa el evento
  Then responde 200 OK
    And el ACK confirma la recepción y devuelve el `event.id` del evento

Scenario: Body que no es JSON válido devuelve 400
  Given el equipo de conversación envía un POST con un body que no es JSON válido
  When el receptor intenta procesar el evento
  Then responde 400 Bad Request
    And el error es estructurado con `code` y `message`

Scenario Outline: Evento con un campo requerido faltante devuelve 400
  Given el equipo de conversación envía un evento sin el campo <campo>
  When el receptor valida el evento
  Then responde 400 Bad Request
    And el error estructurado indica el campo faltante (<campo>)

  Examples:
    | campo                |
    | event.id             |
    | type                 |
    | data.conversation_id |
    | data.body            |

Scenario: Evento con tipo de dato inválido devuelve 400
  Given el equipo de conversación envía un evento cuyo `type` no es una cadena válida
  When el receptor valida el evento
  Then responde 400 Bad Request
    And el error estructurado detalla la causa de validación

Scenario: Reenvío del mismo event.id devuelve 409
  Given el receptor ya procesó con éxito un evento con `event.id` "evt-123"
  When el equipo de conversación reenvía un POST con el mismo `event.id`
  Then responde 409 Conflict
    And el error estructurado indica que el evento ya fue recibido
    And no se crea un duplicado en `ingest_responses`

Scenario: Fallo interno de persistencia devuelve 500
  Given el receptor recibe un evento válido
    But la base de datos no está disponible
  When el receptor intenta persistir el evento
  Then responde 500 Internal Server Error
    And el error estructurado es genérico (sin exponer detalles internos)

Scenario: Evento de completado sin coordenadas se confirma con 200
  Given el equipo de conversación envía el evento de completado de una conversación sin coordenadas
  When el receptor confirma la recepción del evento
  Then responde 200 OK
    And el ACK confirma la recepción aunque falten coordenadas
    And el enriquecimiento por geocoding queda como paso posterior (no bloquea el ACK)
```

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

## US-4 — Transición de estado de revisión (aprobar / rechazar)
Como operador de RaDAR de Ayuda, quiero poder aprobar o rechazar un reporte ya revisado, para confirmar cuáles necesidades son reales y cuáles no, dejando todas marcadas como revisadas.

**Decisión de diseño — Opción A (alineada al código ya construido):**
- El registro en `needs` siempre existe tras completar la conversación (US-2/S5, con `verification_status = PENDING_VERIFICATION`). No se modifica US-2 ni el modelo.
- "Aprobar" transiciona `verification_status` a `VERIFIED`; "Rechazar" lo transiciona a `REJECTED` (permanece en la tabla para trazabilidad, pero se excluye de las vistas/consultas de necesidades "oficiales").
- Se guarda quién revisó, cuándo y, opcionalmente, el motivo. El esquema S1 ya contempla las columnas `verified_by`, `verified_at` y `verification_notes`.

**Criterios de aceptación:**
- Dado un need con `verification_status = PENDING_VERIFICATION`, aprobar lo transiciona a `VERIFIED` y guarda quién aprobó y cuándo; a partir de ahí el need cuenta como necesidad real para el resto del sistema.
- Dado un need con `verification_status = PENDING_VERIFICATION`, rechazar lo transiciona a `REJECTED`, guarda quién rechazó, cuándo y opcionalmente el motivo; el registro queda excluido de las vistas/consultas "oficiales" pero no se borra.
- Ante un need con `verification_status` distinto de `PENDING_VERIFICATION`, el endpoint de revisión rechaza la operación e informa el estado actual, sin modificar el registro.
- Un need inexistente o con id inválido devuelve un error estructurado (404).
- Una decisión que no sea "aprobar"/"rechazar" devuelve un error de validación (400) y no modifica el registro.
- La decisión debe identificar al operador que la toma; sin esa identificación, la operación se rechaza (400) para poder cumplir con la trazabilidad de quién revisó.

**Escenarios (Gherkin):**

```gherkin
Scenario: Aprobar un reporte pendiente lo convierte en necesidad real
  Given un need con id 'need_1' y verification_status = 'PENDING_VERIFICATION'
  When un operador envía la decisión "aprobar" para 'need_1'
  Then verification_status pasa a 'VERIFIED'
  And se guarda quién aprobó (verified_by) y cuándo (verified_at)
  And a partir de ahí el need cuenta como necesidad real para el resto del sistema
  And el need deja de aparecer en el listado de pendientes de verificación

Scenario: Aprobar un reporte con nota opcional
  Given un need con verification_status = 'PENDING_VERIFICATION'
  When un operador envía la decisión "aprobar" incluyendo un motivo o nota
  Then verification_status pasa a 'VERIFIED'
  And la nota se guarda en verification_notes
  And se guarda quién aprobó y cuándo

Scenario: Rechazar un reporte pendiente lo excluye de las vistas oficiales sin borrarlo
  Given un need con id 'need_2' y verification_status = 'PENDING_VERIFICATION'
  When un operador envía la decisión "rechazar" para 'need_2'
  Then verification_status pasa a 'REJECTED'
  And se guarda quién rechazó (verified_by), cuándo (verified_at) y opcionalmente el motivo (verification_notes)
  And el registro queda excluido de las vistas/consultas de necesidades "oficiales"
  And el registro no se borra y permanece disponible para trazabilidad

Scenario: Rechazar un reporte sin motivo es válido
  Given un need con verification_status = 'PENDING_VERIFICATION'
  When un operador envía la decisión "rechazar" sin incluir motivo
  Then verification_status pasa a 'REJECTED'
  And verification_notes queda vacío o nulo
  And la operación se completa correctamente

Scenario: Reintentar aprobar un reporte ya revisado es rechazado
  Given un need con verification_status distinto de 'PENDING_VERIFICATION' (p. ej. 'VERIFIED')
  When un operador envía la decisión "aprobar" para ese need
  Then el endpoint rechaza la operación
  And informa el estado actual del need
  And el registro no se modifica

Scenario: Reintentar rechazar un reporte ya revisado es rechazado
  Given un need con verification_status distinto de 'PENDING_VERIFICATION' (p. ej. 'REJECTED')
  When un operador envía la decisión "rechazar" para ese need
  Then el endpoint rechaza la operación
  And informa el estado actual del need
  And el registro no se modifica

Scenario: Un need inexistente devuelve error estructurado
  Given no existe un need con id 'need_999'
  When un operador envía la decisión "aprobar" o "rechazar" para 'need_999'
  Then el endpoint devuelve un error estructurado (404)
  And no se modifica ningún registro

Scenario: Una decisión inválida devuelve error de validación
  Given un need con verification_status = 'PENDING_VERIFICATION'
  When un operador envía una decisión que no es "aprobar" ni "rechazar" (p. ej. "quizás")
  Then el endpoint devuelve un error de validación (400)
  And el registro no se modifica

Scenario: Una decisión sin operador identificado devuelve error de validación
  Given un need con verification_status = 'PENDING_VERIFICATION'
  When se envía la decisión "aprobar" o "rechazar" sin identificar al operador
  Then el endpoint devuelve un error de validación (400)
  And no se puede registrar quién aprobó o rechazó
  And el registro no se modifica
```

> ⚠️ **Nota de dominio**: el frontend actual tipa `VerificationStatus = VERIFIED | PENDING_VERIFICATION | REPORTED | ARCHIVED` (sin `REJECTED`) y las vistas públicas ya excluyen `ARCHIVED`. Los criterios asumen `REJECTED` tal como pide la card; al implementar, confirmar si `REJECTED` se agrega al enum/filtros del frontend o se mapea a `ARCHIVED`, que el resto del sistema ya reconoce como "descartado por moderador".
