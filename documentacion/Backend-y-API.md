# Backend y API

## Visión General

El backend se compone de funciones serverless de Convex organizadas en módulos. Cada módulo agrupa funciones relacionadas por dominio.

**Tipos de funciones:**
- **Query**: Lectura reactiva (se re-ejecuta automáticamente cuando cambian los datos)
- **Mutation**: Escritura transaccional (atómica)
- **Action**: Función con runtime Node.js para APIs externas (no transaccional)

---

## Módulos del Backend

### `convex/needs.ts` — Necesidades

| Función | Tipo | Auth | Descripción |
|---------|------|------|-------------|
| `list` | Query | ❌ | Lista necesidades con filtros (ciudad, búsqueda, categoría, prioridad, tipo de lugar, estado, verificación, distancia, ordenamiento) |
| `countsByCity` | Query | ❌ | Conteo de necesidades por ciudad (para badges) |
| `getById` | Query | ❌ | Obtiene una necesidad por ID (incluye historial de actualizaciones) |
| `checkDuplicate` | Query | ❌ | Detecta posibles duplicados por título, barrio o proximidad (500m) |
| `create` | Mutation | ❌ | Crea una necesidad nueva (registra log de creación) |
| `updateStatus` | Mutation | ❌ | Actualiza estado y/o recursos (público, para el responsable del punto) |
| `addUpdateNote` | Mutation | ❌ | Añade nota de actualización al timeline |
| `submitReport` | Mutation | ❌ | Envía un reporte sobre la necesidad |

**Lógica de filtrado `list`:**
- Excluye `ARCHIVED` por defecto
- Filtros acumulativos (AND): ciudad, texto, categoría, prioridad, tipo de lugar, estado, verificación, distancia
- Ordenamiento: por prioridad (default), recientes, distancia
- El ordenamiento por prioridad usa: prioridad → verificación → fecha de actualización

---

### `convex/offers.ts` — Ofertas

| Función | Tipo | Auth | Descripción |
|---------|------|------|-------------|
| `create` | Mutation | ❌ | Crea una oferta (con validación completa de campos) |
| `list` | Query | ❌ | Lista ofertas públicas (solo VERIFIED/PENDING + AVAILABLE/PARTIALLY) con filtros |
| `listAll` | Query | ❌ | Lista TODAS las ofertas (uso admin) |
| `countsByCity` | Query | ❌ | Conteo de ofertas por ciudad |
| `getById` | Query | ❌ | Obtiene una oferta por ID (incluye historial) |
| `verify` | Mutation | ✅ | Moderador verifica o archiva una oferta |
| `updateStatus` | Mutation | ❌ | Actualiza estado de oferta y/o recursos |
| `updateFields` | Mutation | ❌ | Edición pública de campos (con tracking de cambios) |
| `submitReport` | Mutation | ❌ | Envía reporte sobre una oferta |
| `deleteOffer` | Mutation | ✅ (ADMIN) | Elimina una oferta y sus reportes |

**Reglas de visibilidad pública:**
- Solo se muestran ofertas con `verificationStatus ∈ {VERIFIED, PENDING_VERIFICATION}`
- Solo se muestran ofertas con `offerStatus ∈ {AVAILABLE, PARTIALLY_AVAILABLE}`

**Auto-cómputo de `offerStatus`:**
- Todos los recursos `FULFILLED` → `EXHAUSTED`
- Mix de `PENDING` y (`PARTIAL`/`FULFILLED`) → `PARTIALLY_AVAILABLE`
- Todos `PENDING` o vacío → `AVAILABLE`

---

### `convex/admin.ts` — Administración

Todas las funciones requieren autenticación con rol ADMIN o MODERATOR.

| Función | Tipo | Auth | Descripción |
|---------|------|------|-------------|
| `getAllData` | Query | ✅ | Obtiene todas las necesidades, reportes y logs de auditoría |
| `getMetrics` | Query | ✅ | Métricas: total, activas, pendientes, críticas, verificadas, reportadas, cubiertas, por categoría, por barrio |
| `verifyNeed` | Mutation | ✅ | Verifica/modera una necesidad (cambia verificación, prioridad, estado, contenido) |
| `resolveReport` | Mutation | ✅ | Resuelve un reporte (DISMISS o RESOLVE_ARCHIVE) |
| `deleteNeed` | Mutation | ✅ (ADMIN) | Elimina necesidad + reportes + logs asociados |
| `editNeed` | Mutation | ✅ | Edición completa de una necesidad (marca `lastUpdatedBy` con `[MOD] nombre`) |

---

### `convex/auth.ts` — Autenticación

| Función | Tipo | Auth | Descripción |
|---------|------|------|-------------|
| `login` | Mutation | ❌ | Login con email/password → retorna token de sesión (24h) |
| `validateSession` | Query | — | Valida un token y retorna datos del usuario |
| `logout` | Mutation | — | Elimina la sesión |
| `listUsers` | Query | ✅ (ADMIN) | Lista todos los usuarios del sistema |
| `createUser` | Mutation | ✅ (ADMIN) | Crea un nuevo usuario |
| `updateUser` | Mutation | ✅ (ADMIN) | Actualiza nombre, rol, estado activo o contraseña |
| `deleteUser` | Mutation | ✅ (ADMIN) | Elimina usuario y sus sesiones |

---

### `convex/publicEdit.ts` — Edición Ciudadana (Mutation)

| Función | Tipo | Auth | Descripción |
|---------|------|------|-------------|
| `applyEdit` | Mutation | ❌ | Aplica los cambios de una edición pública. Solo persiste campos que realmente cambiaron. Registra en `updateLogs` con detalle de los campos modificados. |

---

### `convex/publicEditAction.ts` — Validación Turnstile (Action)

| Función | Tipo | Auth | Descripción |
|---------|------|------|-------------|
| `submitEdit` | Action | ❌ | Valida token de Cloudflare Turnstile y luego llama a `publicEdit.applyEdit`. Skippea Turnstile si `editorName` empieza con `[MOD] `. |

---

### `convex/seed.ts` — Scripts de Inicialización

| Función | Tipo | Descripción |
|---------|------|-------------|
| `createFirstAdmin` | Mutation | Crea el primer administrador. Solo funciona si no existe ningún admin. |
| `seedEstructurasColapsadas` | Mutation | Inserta datos de estructuras colapsadas y clínicas afectadas del terremoto. |

---

## Estados y Transiciones

### Necesidades (`status`)

```
NEED_HELP_NOW → RECEIVING_HELP → PARTIALLY_COVERED → COVERED → CLOSED
                                                              ↗
NEED_HELP_NOW → ────────────────────────────────────────────→ CLOSED
```

Cualquier estado puede transicionar a `CLOSED` directamente.

### Ofertas (`offerStatus`)

```
AVAILABLE → PARTIALLY_AVAILABLE → EXHAUSTED
    │              │                   │
    └──────────────┴───────────────────┴──→ CLOSED (terminal, no reversible)
```

`CLOSED` es un estado terminal — no se puede salir de él.

### Verificación (`verificationStatus`)

```
PENDING_VERIFICATION → VERIFIED
PENDING_VERIFICATION → REPORTED (por reportes ciudadanos)
PENDING_VERIFICATION → ARCHIVED (por moderador)
VERIFIED → ARCHIVED (por moderador)
REPORTED → VERIFIED (moderador verifica)
REPORTED → ARCHIVED (moderador archiva)
```

**Regla especial**: Si una necesidad/oferta ya es `VERIFIED` y recibe un reporte, se crea el reporte pero NO se cambia el `verificationStatus`.

---

## Lógica de Negocio Extraída

### `convex/offerStatusLogic.ts`

Funciones puras sin dependencias de Convex:

- `canModerate(role)` — ¿Puede moderar? (ADMIN o MODERATOR)
- `isValidOfferStatus(status)` — Valida si un status es válido
- `isValidVerificationStatus(status)` — Valida verification status
- `isValidStatusTransition(current, target)` — ¿Es válida la transición?
- `computeOfferStatusFromResources(resources[])` — Auto-computa offerStatus desde el estado de recursos
- `computeReportDecision(currentVerification)` — Decide el comportamiento al recibir un reporte
- `computeVerifyResult(...)` / `computeArchiveResult(...)` — Computa el resultado de acciones de moderación

### `convex/offerValidation.ts`

Validación pura para creación de ofertas:

- `validateOfferInput(input)` — Valida todos los campos y retorna `{ valid, errors[] }`
- `createOfferDocument(input)` — Crea el shape del documento con defaults

**Reglas de validación:**
- `title`: requerido, max 120 chars
- `description`: requerido, max 1000 chars
- `address`, `neighborhood`, `cityId`, `contactName`: requeridos
- `categories`: array con al menos 1 elemento
- `latitude`, `longitude`: números requeridos
- `resources`: max 20, descripción max 200 chars, cantidad 1–999999, unidad max 30 chars

---

## Patrón de Autenticación

```
1. Login: email + password → servidor verifica → genera token (48+ chars) → inserta en sessions
2. Uso: Frontend almacena token en localStorage (key: "ahf_admin_token")
3. Validación: Cada función protegida recibe `token` → busca session → verifica expiración → obtiene user
4. Logout: Elimina session de la DB
```

Las sesiones expiran en 24 horas. No hay refresh token.
