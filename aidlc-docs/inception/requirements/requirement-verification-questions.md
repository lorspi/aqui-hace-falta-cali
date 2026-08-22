# Requirement Verification Questions (Resueltas)

Contrato de integración confirmado con el equipo de conversación (2026-08-21).

## Question 1 — RESUELTA
¿Cómo nos enviará el otro equipo las respuestas/incidentes del agente?

A) HTTP webhook: nos hacen POST con JSON a nuestro endpoint (Edge Function)

B) Escriben en una tabla compartida de Supabase (staging) y nosotros la procesamos

C) WebSocket o cola de mensajes (SQS, RabbitMQ, etc.)

X) Other (please describe after [Answer]: tag below)

[Answer]: A — HTTP webhook POST con JSON en el body hacia nuestra URL.

## Question 2 — RESUELTA
¿Qué mecanismo de autenticación usaremos entre el equipo de conversación y nuestro receptor?

A) API key compartida en header

B) HMAC (firma del body con secreto compartido)

C) Ambas (API key + HMAC)

X) Other (please describe after [Answer]: tag below)

[Answer]: X — Abierto por ahora (sin autenticación). Deuda de seguridad a añadir luego (API key/HMAC).

## Question 3 — RESUELTA
¿El payload ya incluye coordenadas (latitud/longitud) y ciudad resuelta?

A) Sí, incluye coordenadas y ciudad

B) Solo dirección/barrio en texto libre (necesitamos geocoding)

C) A veces (necesitamos geocoding como fallback)

X) Other (please describe after [Answer]: tag below)

[Answer]: B — Los eventos crudos no traen coordenadas ni ciudad resueltas. Necesitaremos geocoding (o extraer de mensajes tipo `location`).

## Question 4 — RESUELTA
¿Qué tipos de registros puede enviar el agente?

A) Solo incidentes/necesidades (needs)

B) Incidentes y ofertas de ayuda (offers)

C) Incidentes, ofertas y otros eventos

X) Other (please describe after [Answer]: tag below)

[Answer]: A — Solo incidentes/necesidades (needs).

## Question 5 — RESUELTA
¿Qué clave usamos para la idempotencia/deduplicación?

A) Un `request_id`/`conversation_id` enviado por el otro equipo

B) Número de teléfono + timestamp del mensaje

C) Hash del contenido (título + barrio + coordenadas)

X) Other (please describe after [Answer]: tag below)

[Answer]: X — `event.id` del webhook como clave de idempotencia; agrupación por `data.conversation_id`.

---

# Preguntas de verificación (JSON real del webhook)

Resueltas tras analizar el payload compartido por el otro equipo.

## FQ1 — ¿Eventos crudos o evento final estructurado?
**Respuesta**: Solo eventos crudos (ej. `type: message.received`). No llega un incidente estructurado.

## FQ2 — ¿El campo `from` traerá el número del ciudadano?
**Respuesta**: Sí, en producción traerá el número. Lo usamos para `contact_whatsapp` / `contact_phone`.

## FQ3 — ¿Cómo se detecta el fin de la conversación?
**Respuesta**: Otro `type` de evento (distinto de `message.received`). *Pendiente: el schema de ese evento de completado.*

## FQ4 — ¿Qué tipos de eventos llegan?
**Respuesta**: Varios. Empezamos por `message.received`.

## FQ5 — ¿Autenticación del webhook?
**Respuesta**: Abierta por ahora.

---

## Pendiente (bloqueante para DEV-35)
- Schema del **evento de completado** (el otro `type`): nombre y campos (¿resumen del incidente o solo señal de fin?).
