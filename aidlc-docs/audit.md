# AI-DLC Audit Log

Registro de interacciones que dieron forma a los requisitos y las user stories.

## Inception - Requisitos (conversación inicial)
**Timestamp**: 2026-08-21T00:00:00Z
**User Input**: "arranquemos creando un nuevo branch, a partir de main, llamado feature/whatsappbot en el cual se estara agregando un bot para registrar incidentes a traves de un agente por whatsapp, usando AI-DLC planeemos esta nueva funcionalidad"
**AI Response**: Investigación de AI-DLC (AI-Driven Development Lifecycle, AWS) y del codebase actual (Convex). Propuesta de plan.
**Context**: Solicitud inicial del feature y del uso de AI-DLC.

---

## Inception - Decisión de backend
**Timestamp**: 2026-08-21T00:00:00Z
**User Input**: "antes de continuar, te aclaro que el backend fue migrado a supabase"
**AI Response**: Verificación del repo (sin rastros de Supabase; todo en Convex). Pregunta de aclaración.
**Context**: El backend objetivo del bot es Supabase.

---

## Inception - Alcance
**Timestamp**: 2026-08-21T00:00:00Z
**User Input**: "El bot debe escribirse directo contra Supabase (Edge Functions + PostgREST), ignorando el código Convex actual"
**AI Response**: Ajuste del plan al stack Supabase.
**Context**: Definido el stack del bot.

---

## Inception - División de responsabilidades
**Timestamp**: 2026-08-21T00:00:00Z
**User Input**: "la parte conversacional y el flujo esta fuera de este alcance, ya fue realizado por otro equipo, de nuestro lado debemos persistir respuestas e impactar en nuestro sistema"
**AI Response**: Reducción del alcance: solo receptor → persistencia → impacto en el sistema.
**Context**: El agente conversacional lo hace otro equipo; nosotros solo persistimos respuestas e impactamos el sistema.

---

## Inception - Ejecución y entrega
**Timestamp**: 2026-08-21T00:00:00Z
**User Input**: "cuando cambie a Act, vas a empezar creando el branch que te dije, luego vas a descargar al proyecto lo necesario para implementar AI-DLC, luego iniciamos el proceso AI-DLC teniendo en cuenta nuestra conversacion, y cuando ya tengamos definido las features, vas a escribir las user stories en Linear, en el proyecto RADAR, en la columna backlog, sin hacer nada de codigo"
**AI Response**: Ejecución: branch + instalación de AI-DLC + proceso Inception + user stories a Linear (sin código).
**Context**: Alcance de la ejecución en modo Act.

---

## Inception - Credencial de Linear
**Timestamp**: 2026-08-21T00:00:00Z
**User Input**: "linear key: lin_api_***REDACTADO*** (rotar la key tras la sesión)"
**AI Response**: Validación de la key y localización del proyecto RADAR (equipo Humans) y columna Backlog.
**Context**: Acceso a Linear para escribir las user stories.

---

## Inception - Escritura en Linear
**Timestamp**: 2026-08-21T00:00:00Z
**AI Response**: Creadas 8 issues en Linear (proyecto RADAR, columna Backlog): DEV-31 .. DEV-38.
**Context**: User stories persistidas en Linear; sin código implementado.

---

## Inception - Contrato confirmado (webhook de eventos crudos)
**Timestamp**: 2026-08-21T00:00:00Z
**User Input**: Respuestas a las 5 preguntas: 1) eventos crudos 2) `from` traerá el número del ciudadano 3) otro `type` de evento marca el fin de la conversación 4) varios tipos, empezar con `message.received` 5) autenticación abierta por ahora.
**AI Response**: Actualizados `requirements.md`, `requirement-verification-questions.md`, `stories.md` y las 8 issues de Linear para reflejar el contrato confirmado.
**Context**: Cierre del contrato de integración (webhook de eventos crudos; incidente se crea al recibir el evento de completado).
