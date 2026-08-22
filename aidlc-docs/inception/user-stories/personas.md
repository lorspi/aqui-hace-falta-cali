# Personas

## 1. Ciudadano afectado
Persona que reporta una necesidad por WhatsApp. Es el origen del dato, pero su interacción conversacional la gestiona el equipo de conversación (fuera de nuestro alcance).

## 2. Equipo de Conversación (agente WhatsApp)
Sistema externo que produce y envía los incidentes estructurados. Es nuestro **remitente**: consume nuestro endpoint y espera un ACK.

## 3. Moderador / Operador
Persona que verifica y gestiona los incidentes registrados en el sistema. Espera que los incidentes del bot lleguen como pendientes de verificación y con trazabilidad.

## 4. Ingeniero del receptor (nosotros)
Construye la persistencia de respuestas y el impacto en el sistema (esquema Supabase + receptor + mapeo + idempotencia + ACK).
