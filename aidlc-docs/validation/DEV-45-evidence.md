# Evidencia de validación — DEV-45 (US-6: Pantalla de detalle — conversación formateada + datos de validación — Frontend)

Fecha: 2026-08-24
Rama: `agent/DEV-45`
Base: `feature/whatsappbot`

## Contexto

US-6 agrega al panel de moderación la **pantalla de detalle de un reporte del
chatbot**: al abrir el detalle de un need, la pantalla consulta el endpoint de
reconstrucción de conversación (`GET /needs/{id}/conversation`, US-3 / DEV-42)
y muestra:

- Los mensajes en **orden cronológico** (`received_at` ascendente),
  diferenciando visualmente los **entrantes** (ciudadano, `sender` igual a
  `contact_whatsapp`) de los **salientes** (bot/equipo, `sender` distinto).
- Las **fotos** y **ubicaciones** renderizadas (imagen / mapa o tarjeta de
  ubicación), NO como texto o enlace crudo.
- En un **panel separado**, los campos ya mapeados por el receptor:
  `contact_whatsapp`, `address`, `neighborhood`, `title`, `description`,
  `priority` y `verification_status`.
- `location_enrichment_status = PENDING` → el panel indica que la ubicación aún
  no fue geolocalizada (no muestra un mapa vacío).
- Tolerancia a datos incompletos (mensajes sin `sender`, sin contenido o con
  `message_type` desconocido).
- Estados claros de carga, error (need inexistente / fallo de red) y de
  conversación sin incidente asociado (aún sin evento de completado).

La pantalla **NO interpreta `raw_event`**: consume el formato uniforme de US-3
(`sender`, `content`, `type` canónico, `attachments`, `received_at`,
`event_id`). La distinción entrante/saliente se resuelve comparando `sender`
contra `contact_whatsapp` del need.

## Cambios en esta rama

| Archivo | Cambio |
|---------|--------|
| `src/utils/conversationDetailUtils.ts` | **Nuevo.** Lógica PURE (NFR-4) de la pantalla de detalle: `classifyMessageDirection` (entrante/saliente/neutro vs `contact_whatsapp`), `sortConversationMessages` (orden cronológico), `dedupeConversationMessages` (por `event_id`), `buildChatMessages` (vistas de chat), `isValidImageAttachment`, `isLocationWithCoordinates`/`isLocationWithAddress` (mapa vs tarjeta), `isLocationPending`/`hasResolvedCoordinates` (panel de ubicación). |
| `src/components/ChatbotReportDetail.tsx` | **Nuevo.** Pantalla de detalle: consulta `GET /needs/{id}/conversation`, renderiza el chat (burbujas entrante/saliente/neutra con hora), adjuntos renderizados (imagen con placeholder, ubicación con iframe OpenStreetMap o tarjeta), panel "Datos del incidente" con `title`, `description`, `contact_whatsapp`, `address`, `neighborhood`, `priority`, `verification_status`, `status`, `conversation_id`, `source_event_id`; estado de ubicación PENDING/RESOLVED; estados de carga/error/vacío/sin incidente. |
| `src/lib/supabaseService.ts` | **Nuevo.** Tipos del contrato US-3 (`ConversationRebuild`, `ConversationMessage`, `ConversationAttachment`, `ConversationNeedSummary`) + `fetchConversationByNeedId` (consume `/functions/v1/conversation/needs/{id}/conversation` con la anon key, maneja errores estructurados `need_not_found`/red). |
| `src/components/ChatbotReportsList.tsx` | Las tarjetas del listado (US-5) se vuelven clicables y abren el detalle (US-6) en lugar del listado; botón "Ver detalle" por tarjeta. |
| `src/i18n/translations.ts` | Nuevas claves `conversationDetail*`, `conversationSender*`, `conversationAttachment*`, `conversationMessageType*`, `conversationNeed*`, `conversationLocation*`, `conversationNoContact` en los 4 idiomas (es/en/pt/fr). |
| `tests/unit/conversation-detail.test.ts` | **Nuevo.** 29 tests de la lógica PURE cubriendo los escenarios Gherkin US-6 (orden, dirección entrante/saliente, imágenes, ubicaciones, panel, PENDING/RESOLVED, tolerancia a datos faltantes, UNKNOWN, dedup por event.id, completado no mostrado, conversación sin incidente). |
| `aidlc-docs/validation/dev45-ui-render.mjs` | **Nuevo.** Captura del DOM renderizado con Chrome headless vía CDP (login rápido `moderador123`, tab Reportes del Chatbot, detalle, pestaña Datos del incidente, need PENDING). |
| `aidlc-docs/validation/DEV-45-evidence.md` | **Nuevo.** Esta evidencia. |

## Validaciones

### Unitarias (vitest)

- `npm run test` → **468 passed** (26 archivos; +29 tests nuevos de DEV-45 en
  `conversation-detail.test.ts`).
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `src/components/*` (migración Convex→Supabase, fuera de alcance; idénticos a
  los documentados en DEV-35/DEV-41/DEV-42/DEV-43/DEV-44). **0 errores** en los
  archivos nuevos ni en los modificados por esta historia.

### En ejecución (Vite dev + Supabase local real + Edge Function `conversation`)

Se arrancó `npm run dev` (vite `--mode development`, puerto 8081) con `.env.local`
apuntando al Supabase local de RADAR (API `127.0.0.1:54341`). La Edge Function
`conversation` (US-3) se sirvió por el edge-runtime local de Supabase
(`/functions/v1/conversation`), accesible con la anon key.

**Siembra** (via webhook real, prefijo `dev45_%`):

```
POST /functions/v1/webhook  → 200 (5 eventos: 4 message.received + completado)
→ need creado: 77621a79-1bf5-49d7-8cea-442e90ce9078
  conversation_id=dev45_conv_full, contact_whatsapp=573001234567
  title="Necesito agua potable para mi familia"
  messages: TEXT (ciudadano) · IMAGE (adjunto image) · LOCATION (lat/lng) ·
            UNKNOWN · TEXT (sender 573000000001 → bot/equipo)
  location_enrichment_status=RESOLVED, latitude=3.4516, longitude=-76.532
```

**1. La pantalla consulta el endpoint de reconstrucción (US-3) y muestra el
chat en orden cronológico con burbujas entrantes y salientes**

`GET /needs/{id}/conversation` (anon key) → `200` con 5 mensajes normalizados.
DOM renderizado del detalle (pestaña Conversación):

```
CIUDADANO — Necesito agua potable para mi familia
CIUDADANO [IMAGEN] — Te adjunto la foto del daño
CIUDADANO [UBICACIÓN] — Estoy en San Fernando · Calle 5 #10-20 · Ver en el mapa
CIUDADANO [MENSAJE] — Mensaje raro
BOT / EQUIPO — ¿Puedes confirmar tu ubicación exacta?
```

Checks DOM automatizados:

```json
{
  "showsRawJson": false,
  "showsRawUrl": false,
  "imageRendered": true,
  "locationIframe": true,
  "conversationTitle": true,
  "citizenBubbles": 4,
  "botBubbles": 1,
  "unknownGeneric": true
}
```

- Los mensajes con `sender = 573001234567` (igual a `contact_whatsapp`) se
  muestran como **CIUDADANO** (entrantes).
- El mensaje con `sender = 573000000001` (distinto) se muestra como
  **BOT / EQUIPO** (saliente).
- `showsRawJson: false` y `showsRawUrl: false` → NO se muestra el JSON crudo ni
  la URL cruda del adjunto; la imagen se renderiza (`imageRendered: true`) y la
  ubicación se renderiza en un iframe/mapa (`locationIframe: true`).
- `unknownGeneric: true` → el `message_type` desconocido se muestra como
  mensaje genérico sin romper el chat.

**2. El panel separado muestra los campos ya identificados por el receptor**

DOM renderizado del detalle (pestaña "Datos del incidente"):

```
DATOS DEL INCIDENTE
TÍTULO           Necesito agua potable para mi familia
DESCRIPCIÓN      Necesito agua potable para mi familia | Te adjunto la foto del daño | ...
CONTACTO WHATSAPP 573001234567
DIRECCIÓN        Calle 5 #10-20
BARRIO           Por confirmar
PRIORIDAD        🟡 Prioridad Media
ESTADO DE VERIFICACIÓN  ◷ Pendiente
ESTADO           NEED_HELP_NOW
Conversación: dev45_conv_full · Evento fuente: dev45_comp
DIRECCIÓN        ✓ Ubicación resuelta · Calle 5 #10-20 · Por confirmar
```

Checks panel automatizados:

```json
{
  "title": true, "description": true, "contact": true, "address": true,
  "neighborhood": true, "priority": true, "verification": true, "status": true,
  "conversationTrace": true, "sourceEvent": true
}
```

**3. `location_enrichment_status = PENDING` se indica en el panel (sin mapa
vacío)**

Need `dev45_pending_loc` insertado con `location_enrichment_status='PENDING'` y
`latitude/longitude=NULL`. DOM renderizado (pestaña "Datos del incidente"):

```
DIRECCIÓN
Ubicación aún no geolocalizada
El incidente no tiene coordenadas resueltas todavía; no se muestra un mapa vacío.
```

```json
{ "locationPendingShown": true, "hasIncidentPanel": true, "noEmptyMap": true }
```

**4. Estados de error claros**

- `GET /needs/need_999/conversation` → `404` `need_not_found` (verificado con
  curl). La UI muestra el estado de error "Need no encontrado" sin romper la
  aplicación (manejo por `code === 'need_not_found'`).
- La UI tolera fallos de red/endpoint: muestra "No se pudo cargar la
  conversación" con botón "Reintentar" (el resto del panel sigue operativo).

### Verificación en BD (SQL directo vía docker exec)

- Los 5 eventos `dev45_conv_full` se leyeron por el endpoint en orden por
  `received_at` ascendente.
- El reenvío del mismo `event.id` se deduplicó en ingestión (UNIQUE event_id);
  cada `event_id` aparece una sola vez en la reconstrucción (verificado en el
  DOM: 5 burbujas para 5 eventos únicos).
- El evento de completado NO aparece como mensaje; su `event.id` queda en
  `need.source_event_id = dev45_comp` (verificado en el panel).
- Datos de prueba con prefijo `dev45%` eliminados al final (stack reproducible):
  `needs=0`, `ingest_responses=0`.

## Decisiones técnicas

- **La UI NO interpreta `raw_event`**: consume el formato uniforme del endpoint
  US-3 (`sender`, `content`, `type`, `attachments`, `received_at`, `event_id`).
  La distinción entrante/saliente se resuelve comparando `sender` contra
  `contact_whatsapp` del need; sin `sender` → remitente neutro; sin
  `contact_whatsapp` conocido, un sender presente se muestra como saliente
  (bot/equipo).
- **Lógica PURE extraída** (`conversationDetailUtils.ts`, NFR-4): clasificación
  de dirección, orden cronológico, dedup defensiva por `event_id`, validación de
  adjuntos y estado de ubicación; testeable con vitest sin React/Supabase.
- **Adjuntos renderizados**: IMAGE con URL válida → `<img>`; sin URL válida →
  placeholder que no rompe la burbuja. LOCATION con coordenadas → iframe
  OpenStreetMap + address + link "Ver en el mapa"; sin coordenadas pero con
  address → tarjeta con la dirección (sin mapa vacío).
- **Endpoint consumido desde el navegador**: `fetch` a
  `${VITE_SUPABASE_URL}/functions/v1/conversation/needs/{id}/conversation` con
  la anon key en `apikey`/`Authorization` (las Edge Functions de Supabase usan
  `verify_jwt=true` por defecto). La ruta incluye el sufijo `/conversation` que
  el handler de US-3 espera para resolver el need por path.
- **Mensaje saliente del bot**: como indica la nota de dominio, el contrato del
  webhook (S8) no define explícitamente eventos salientes; se identifica al
  remitente del bot como cualquier `sender` distinto de `contact_whatsapp`
  (en la siembra de evidencia se usó `573000000001`). Si en el futuro el bot
  se identifica por un remitente conocido, basta con ajustar
  `classifyMessageDirection`.
- **Tolerancia**: mensajes sin `sender` → burbuja neutra "Mensaje"; contenido
  vacío → "Mensaje recibido"; `message_type` desconocido → `UNKNOWN` con estilo
  genérico (no se intenta renderizar como imagen o ubicación).
- **`location_enrichment_status` no viaja en el contrato US-3** (el resumen del
  need no lo expone): la pantalla lo recibe desde el listado (US-5) vía `need`
  prop (el `Need` del frontend ya mapea `locationEnrichmentStatus`). La lógica
  `isLocationPending`/`hasResolvedCoordinates` acepta ese dato de forma
  desacoplada y testeable.
