# Base de Datos

## Motor

La base de datos es **Convex** — una base de datos NoSQL reactiva con esquema tipado. Los datos se almacenan como documentos JSON con tipado fuerte definido en `convex/schema.ts`.

Cada documento tiene automáticamente:
- `_id`: ID único generado por Convex (tipo `Id<"tableName">`)
- `_creationTime`: Timestamp de creación (milliseconds)

---

## Esquema Completo

### Tabla: `users`

Usuarios del sistema (administradores y moderadores).

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| email | string | ✅ | Email único del usuario |
| name | string | ✅ | Nombre del usuario |
| passwordHash | string | ✅ | Contraseña codificada (XOR) |
| role | string | ✅ | Rol: `"ADMIN"` o `"MODERATOR"` |
| active | boolean | ✅ | Si la cuenta está activa |
| createdAt | string | ✅ | Fecha de creación (ISO 8601) |
| lastLoginAt | string | ❌ | Último inicio de sesión |

**Índices:**
- `by_email` → `["email"]`

---

### Tabla: `sessions`

Sesiones activas de usuarios autenticados.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| userId | Id\<"users"\> | ✅ | Referencia al usuario |
| token | string | ✅ | Token de sesión (48+ caracteres) |
| expiresAt | string | ✅ | Fecha de expiración (ISO 8601, 24h) |
| createdAt | string | ✅ | Fecha de creación |

**Índices:**
- `by_token` → `["token"]`
- `by_user` → `["userId"]`

---

### Tabla: `needs`

Puntos de necesidad reportados por la ciudadanía.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| cityId | string | ✅ | ID de la ciudad (ej: `"cali"`, `"palmira"`) |
| emergencyId | string | ✅ | ID de la emergencia (ej: `"terremoto-cali-2026"`) |
| title | string | ✅ | Título descriptivo |
| description | string | ✅ | Descripción detallada |
| placeType | string | ✅ | Tipo de lugar (ver enum PlaceType) |
| categories | string[] | ✅ | Categorías de ayuda necesaria |
| resources | object[] | ✅ | Lista de recursos requeridos |
| address | string | ✅ | Dirección |
| neighborhood | string | ✅ | Barrio |
| latitude | number | ✅ | Latitud |
| longitude | number | ✅ | Longitud |
| priority | string | ✅ | Prioridad: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| status | string | ✅ | Estado operativo (ver enum NeedStatus) |
| verificationStatus | string | ✅ | Estado de verificación |
| verifiedBy | string | ❌ | Email del moderador que verificó |
| verificationNotes | string | ❌ | Notas de verificación |
| verifiedAt | string | ❌ | Fecha de verificación |
| source | string | ❌ | Fuente del reporte (ej: "Cruz Roja") |
| sourceUrl | string | ❌ | URL de la fuente |
| contactName | string | ✅ | Nombre del contacto |
| contactPhone | string | ❌ | Teléfono |
| contactWhatsapp | string | ❌ | WhatsApp |
| contactEmail | string | ❌ | Email |
| organizationName | string | ❌ | Nombre de la organización |
| requesterType | string | ✅ | Tipo: `PERSONA`, `ORGANIZACION`, `FUNDACION`, `COMUNIDAD`, `EMPRESA`, `OTRO` |
| operatingHours | string | ❌ | Horario de atención |
| evidenceUrl | string | ❌ | URL de evidencia |
| createdAt | string | ✅ | Fecha de creación (ISO 8601) |
| updatedAt | string | ✅ | Última actualización |
| lastUpdatedBy | string | ❌ | Nombre de quien hizo el último cambio |
| expiresAt | string | ❌ | Fecha de expiración |
| isDemoData | boolean | ❌ | Si es dato semilla/demo |

**Subestructura `resources[]`:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID único del recurso |
| type | string | Tipo/categoría del recurso |
| description | string | Descripción del recurso |
| requestedQuantity | number? | Cantidad solicitada |
| fulfilledQuantity | number? | Cantidad cubierta |
| unit | string? | Unidad (ej: "litros", "personas") |
| status | string | `"PENDING"`, `"PARTIAL"`, `"FULFILLED"` |

**Índices:**
- `by_city` → `["cityId"]`
- `by_emergency` → `["emergencyId"]`
- `by_status` → `["status"]`
- `by_priority` → `["priority"]`
- `by_verification` → `["verificationStatus"]`
- `by_neighborhood` → `["neighborhood"]`

---

### Tabla: `offers`

Ofertas de ayuda publicadas por ciudadanos u organizaciones.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| cityId | string | ✅ | ID de la ciudad |
| title | string | ✅ | Título (max 120 chars) |
| description | string | ✅ | Descripción (max 1000 chars) |
| categories | string[] | ✅ | Categorías de ayuda ofrecida |
| resources | object[] | ✅ | Lista de recursos disponibles |
| address | string | ✅ | Dirección |
| neighborhood | string | ✅ | Barrio |
| latitude | number | ✅ | Latitud |
| longitude | number | ✅ | Longitud |
| offerStatus | string | ✅ | Estado: `AVAILABLE`, `PARTIALLY_AVAILABLE`, `EXHAUSTED`, `CLOSED` |
| verificationStatus | string | ✅ | Estado de verificación |
| verifiedBy | string | ❌ | Email del moderador que verificó |
| verifiedAt | string | ❌ | Fecha de verificación |
| contactName | string | ✅ | Nombre del contacto |
| contactPhone | string | ❌ | Teléfono |
| contactWhatsapp | string | ❌ | WhatsApp |
| contactEmail | string | ❌ | Email |
| organizationName | string | ❌ | Nombre de la organización |
| operatingHours | string | ❌ | Horario de atención |
| createdAt | string | ✅ | Fecha de creación |
| updatedAt | string | ✅ | Última actualización |

**Subestructura `resources[]`:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID único del recurso |
| type | string | Tipo/categoría |
| description | string | Descripción |
| quantity | number? | Cantidad disponible |
| fulfilledQuantity | number? | Cantidad entregada |
| unit | string? | Unidad |
| status | string | `"AVAILABLE"` o `"EXHAUSTED"` |

**Índices:**
- `by_city` → `["cityId"]`
- `by_verification` → `["verificationStatus"]`
- `by_offer_status` → `["offerStatus"]`

---

### Tabla: `reports`

Reportes ciudadanos sobre necesidades.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| needId | Id\<"needs"\> | ✅ | Referencia a la necesidad reportada |
| needTitle | string | ❌ | Título de la necesidad (snapshot) |
| reason | string | ✅ | Motivo del reporte |
| description | string | ✅ | Descripción detallada |
| reporterContact | string | ❌ | Contacto del reportante |
| status | string | ✅ | `"PENDING"`, `"RESOLVED"`, `"DISMISSED"` |
| createdAt | string | ✅ | Fecha de creación |
| resolvedAt | string | ❌ | Fecha de resolución |
| resolvedBy | string | ❌ | Email del moderador que resolvió |

**Índices:**
- `by_need` → `["needId"]`

---

### Tabla: `offerReports`

Reportes ciudadanos sobre ofertas.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| offerId | Id\<"offers"\> | ✅ | Referencia a la oferta reportada |
| offerTitle | string | ❌ | Título de la oferta (snapshot) |
| reason | string | ✅ | Motivo del reporte |
| description | string | ✅ | Descripción |
| reporterContact | string | ❌ | Contacto del reportante |
| status | string | ✅ | `"PENDING"` |
| createdAt | string | ✅ | Fecha de creación |

**Índices:**
- `by_offer` → `["offerId"]`

---

### Tabla: `updateLogs`

Historial de actualizaciones de necesidades.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| needId | Id\<"needs"\> | ✅ | Referencia a la necesidad |
| previousStatus | string | ✅ | Estado anterior |
| newStatus | string | ✅ | Nuevo estado |
| description | string | ✅ | Descripción del cambio |
| updatedBy | string | ✅ | Quién hizo el cambio |
| createdAt | string | ✅ | Fecha del cambio |

**Índices:**
- `by_need` → `["needId"]`

---

### Tabla: `offerUpdateLogs`

Historial de actualizaciones de ofertas.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| offerId | Id\<"offers"\> | ✅ | Referencia a la oferta |
| previousStatus | string | ❌ | Estado anterior |
| newStatus | string | ❌ | Nuevo estado |
| description | string | ✅ | Descripción del cambio |
| updatedBy | string | ✅ | Quién hizo el cambio |
| createdAt | string | ✅ | Fecha del cambio |

**Índices:**
- `by_offer` → `["offerId"]`

---

### Tabla: `auditLogs`

Log de auditoría de todas las acciones administrativas.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| action | string | ✅ | Tipo de acción (ver lista abajo) |
| needId | Id\<"needs"\> | ❌ | Necesidad relacionada |
| adminEmail | string | ✅ | Email del admin/moderador |
| timestamp | string | ✅ | Fecha de la acción |
| details | string | ✅ | Descripción detallada |

**Acciones registradas:**
- `FIRST_ADMIN_CREATED` — Creación del primer admin
- `MODERATE_NEED` — Verificación/moderación de necesidad
- `EDIT_NEED` — Edición administrativa de necesidad
- `DELETE_NEED` — Eliminación de necesidad
- `RESOLVE_REPORT` — Resolución de reporte
- `MODERATE_OFFER` — Verificación/moderación de oferta
- `UPDATE_OFFER_STATUS` — Cambio de estado de oferta
- `UPDATE_OFFER_FIELDS` — Edición de campos de oferta
- `DELETE_OFFER` — Eliminación de oferta

---

## Enums y Valores Válidos

### Priority (Prioridad)
| Valor | Descripción |
|-------|-------------|
| `CRITICAL` | Urgente — riesgo directo |
| `HIGH` | Alta — requiere atención en horas |
| `MEDIUM` | Media — relevante pero no inmediata |
| `LOW` | Baja — complementaria para estabilización |

### NeedStatus (Estado de necesidad)
| Valor | Descripción |
|-------|-------------|
| `NEED_HELP_NOW` | Necesita ayuda ahora |
| `RECEIVING_HELP` | Recibiendo ayuda |
| `PARTIALLY_COVERED` | Ayuda parcialmente cubierta |
| `COVERED` | Ayuda cubierta |
| `CLOSED` | Cerrado / Finalizado |

### OfferStatus (Estado de oferta)
| Valor | Descripción |
|-------|-------------|
| `AVAILABLE` | Disponible |
| `PARTIALLY_AVAILABLE` | Parcialmente disponible |
| `EXHAUSTED` | Agotada |
| `CLOSED` | Cerrada (estado terminal) |

### VerificationStatus
| Valor | Descripción |
|-------|-------------|
| `PENDING_VERIFICATION` | Pendiente de verificación |
| `VERIFIED` | Verificada por moderador |
| `REPORTED` | Reportada por usuarios |
| `ARCHIVED` | Archivada |

### PlaceType (Tipo de lugar)
| Valor | Descripción |
|-------|-------------|
| `EDIFICIO_AFECTADO` | Edificio afectado |
| `CENTRO_ACOPIO` | Centro de acopio |
| `CENTRO_DISTRIBUCION` | Centro de distribución |
| `HOSPITAL` | Hospital / Centro médico |
| `BANCO_SANGRE` | Banco de sangre |
| `REFUGIO` | Refugio / Albergue |
| `COMUNIDAD_AFECTADA` | Comunidad afectada |
| `PUNTO_LOGISTICO` | Punto logístico |
| `ORGANIZACION` | Organización |
| `OTRO` | Otro tipo de lugar |

### HelpCategory (20 categorías)
| Valor | Etiqueta | Icono |
|-------|----------|-------|
| `ESCOMBROS` | Remover escombros | ⛏️ |
| `MANO_OBRA` | Mano de obra | 👷 |
| `TRANSPORTE` | Transporte / Flete | 🚚 |
| `ALIMENTOS` | Donar alimentos | 🍞 |
| `AGUA` | Donar agua potable | 💧 |
| `ROPA` | Ropa y cobijas | 👕 |
| `MEDICAMENTOS` | Medicamentos / Botiquín | 💊 |
| `SANGRE` | Donar sangre | 🩸 |
| `DINERO` | Aporte económico | 💳 |
| `HERRAMIENTAS` | Herramientas de mano | 🛠️ |
| `MAQUINARIA` | Maquinaria pesada | 🚜 |
| `OPERARIOS_MAQUINARIA` | Operarios de maquinaria | 🏗️ |
| `ATENCION_MEDICA` | Atención médica | 🩺 |
| `APOYO_PSICOLOGICO` | Apoyo psicológico | 🧠 |
| `ALOJAMIENTO` | Alojamiento / Carpas | ⛺ |
| `ANIMALES` | Cuidado de animales | 🐾 |
| `LOGISTICA` | Apoyo logístico | 📋 |
| `CLASIFICACION_DONACIONES` | Clasificar donaciones | 📦 |
| `VOLUNTARIADO_GENERAL` | Voluntariado general | 🤝 |
| `OTRO` | Otro tipo de ayuda | 🔹 |
