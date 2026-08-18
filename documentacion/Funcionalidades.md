# Funcionalidades

## Funcionalidades Públicas (sin autenticación)

### 📍 Mapa Interactivo

- Mapa basado en Leaflet con tiles de OpenStreetMap
- Marcadores color-coded por prioridad:
  - 🔴 Crítica (rojo)
  - 🟠 Alta (naranja)
  - 🟡 Media (ámbar)
  - 🟢 Baja (verde)
  - 🟣 Centros de acopio (púrpura)
  - 🔵 Ofertas de ayuda (azul)
- Popups informativos al hacer clic en un marcador
- Scroll wheel zoom deshabilitado por defecto (requiere Ctrl+scroll) — con hint visual
- Auto-centrado en la ciudad seleccionada
- Detección automática de la ciudad más cercana al usuario

### 🔍 Filtros Avanzados

- **Modo de vista**: Todos / Necesidades / Ofertas (toggle segmentado)
- **Selector de ciudad**: Combobox con 25 municipios del Valle + opción "Todos" + badge de conteo
- **Búsqueda por texto**: Filtra por título, descripción, barrio, dirección, categorías, recursos
- **Ordenamiento**: Más urgente primero / Más recientes / Más cercanos
- **Filtros expandibles**: Prioridad, Tipo de lugar, Estado de verificación
- **Categorías de ayuda**: 20 categorías con pills interactivas
- **Limpieza de filtros**: Botón para restablecer todos

### 📝 Registro de Necesidades

- Formulario multi-campo:
  - Título y descripción
  - Tipo de lugar (10 opciones)
  - Categorías de ayuda (20 opciones, múltiples)
  - Recursos requeridos (lista dinámica con tipo, descripción, cantidad, unidad)
  - Dirección con geocodificación automática (Nominatim)
  - Selector de ubicación en mini-mapa interactivo
  - Prioridad
  - Datos de contacto (nombre, teléfono, WhatsApp, email)
  - Organización y tipo de solicitante
  - Horario de atención
- **Detección de duplicados**: Busca necesidades similares por título + cercanía geográfica (500m)
- Estado inicial: `NEED_HELP_NOW` + `PENDING_VERIFICATION`

### 🎁 Registro de Ofertas de Ayuda

- Formulario similar al de necesidades:
  - Título (max 120 chars), descripción (max 1000 chars)
  - Categorías ofrecidas
  - Recursos disponibles (max 20, con cantidad y unidad)
  - Ubicación con geocoding + mini-mapa
  - Datos de contacto
- Validación estricta en frontend y backend
- Estado inicial: `AVAILABLE` + `PENDING_VERIFICATION`

### 🤝 "Quiero Ayudar"

- Modal que muestra la información de contacto del punto de necesidad
- Genera enlace directo a WhatsApp con mensaje pre-armado que incluye el título y categorías
- Formato de número colombiano (agrega prefijo +57 automáticamente)

### ✏️ Edición Ciudadana

- Cualquier persona puede editar la información de necesidades y ofertas
- Protegido por Cloudflare Turnstile (anti-bot)
- Solo persiste campos que realmente cambiaron
- Registra en el historial quién editó y qué campos se modificaron
- Si el editor es moderador (prefijo `[MOD]`), se salta la validación Turnstile

### 📊 Actualización de Estado

- El responsable de un punto puede actualizar:
  - Estado operativo (recibiendo ayuda, parcialmente cubierto, cubierto, cerrado)
  - Estado de recursos individuales (PENDING → PARTIAL → FULFILLED)
  - Notas descriptivas del progreso
- Todo queda registrado en el historial con timestamp

### 🚩 Reportes

- Cualquier persona puede reportar una necesidad u oferta
- Motivos: ya no se necesita, ubicación incorrecta, información falsa, mal contacto, desactualizada, otro
- Si la necesidad/oferta NO está verificada, se marca como `REPORTED`
- Si ya está `VERIFIED`, se crea el reporte pero no se cambia el estado

### 🔗 URLs Compartibles (Deep Links)

- Cada necesidad tiene URL única: `/:cityId/:needId`
- Cada oferta tiene URL única: `/:cityId/offer/:offerId`
- Al compartir la URL, se abre directamente el modal de detalle

### 📱 Vista Social (Tarjetas)

- Ruta especial: `/:cityId/:needId/post` o `/story`
- Genera una tarjeta visual (imagen exportable) para compartir en redes sociales
- Formato post (cuadrado) y story (vertical)

### 📱 Diseño Responsive

- **Mobile**: Toggle lista/mapa en la barra inferior + botón crear
- **Tablet**: Layout adaptable
- **Desktop**: Mapa y lista side-by-side

### 🌐 Multi-Ciudad

- 25 municipios del Valle del Cauca soportados
- Detección automática de ciudad por geolocalización del usuario
- Selector de ciudad con badge de conteo de necesidades
- Cada need/offer tiene un `cityId` que filtra resultados

---

## Funcionalidades de Moderación (requiere login)

### ✅ Verificación de Información

- Ver todas las necesidades/ofertas pendientes de verificación
- Marcar como `VERIFIED` (confirmada) o `ARCHIVED` (descartada)
- Registra quién verificó y cuándo

### 📝 Edición Administrativa

- Edición completa de cualquier campo de una necesidad
- Marca los cambios con `[MOD] nombre` para diferenciar de ediciones ciudadanas
- Escudo azul 🛡️ en el historial para cambios de moderador
- Cambio de prioridad, categorías, ubicación, contacto, etc.

### 🚩 Resolución de Reportes

- Lista de reportes pendientes
- Acciones: `DISMISS` (descartar) o `RESOLVE_ARCHIVE` (archivar la necesidad)
- Registra quién resolvió el reporte

### 📊 Dashboard de Métricas

- Total de necesidades
- Activas / Pendientes de verificación / Críticas
- Verificadas / Reportadas / Cubiertas
- Distribución por categoría
- Distribución por barrio

### 🔍 Tabla Administrativa

- Vista de todas las necesidades y ofertas con filtros avanzados
- Búsqueda, filtro por prioridad, verificación y tipo (necesidad/oferta)
- Acciones rápidas: verificar, editar, eliminar

---

## Funcionalidades de Admin (rol ADMIN)

### 👥 Gestión de Usuarios

- Crear nuevos usuarios (moderadores o admins)
- Editar nombre, rol, estado activo y contraseña
- Desactivar/activar cuentas
- Eliminar usuarios (no se puede eliminar a sí mismo)

### 🗑️ Eliminación

- Solo admins pueden eliminar necesidades y ofertas
- La eliminación también borra reportes y logs asociados

### 📋 Log de Auditoría

- Registro completo de todas las acciones administrativas
- Muestra: acción, quién, cuándo, detalles

---

## Categorías de Ayuda

La plataforma maneja 20 categorías de ayuda que se usan tanto para necesidades como ofertas:

| # | Categoría | Icono | Uso típico |
|---|-----------|-------|------------|
| 1 | Remover escombros | ⛏️ | Estructuras colapsadas |
| 2 | Mano de obra | 👷 | Voluntarios para trabajo físico |
| 3 | Transporte / Flete | 🚚 | Mover suministros o personas |
| 4 | Donar alimentos | 🍞 | Comida para afectados |
| 5 | Donar agua potable | 💧 | Agua limpia |
| 6 | Ropa y cobijas | 👕 | Vestimenta y abrigo |
| 7 | Medicamentos / Botiquín | 💊 | Suministros médicos |
| 8 | Donar sangre | 🩸 | Bancos de sangre |
| 9 | Aporte económico | 💳 | Donaciones monetarias |
| 10 | Herramientas de mano | 🛠️ | Palas, picos, etc. |
| 11 | Maquinaria pesada | 🚜 | Retroexcavadoras, grúas |
| 12 | Operarios de maquinaria | 🏗️ | Operadores calificados |
| 13 | Atención médica | 🩺 | Médicos, enfermeras |
| 14 | Apoyo psicológico | 🧠 | Psicólogos, terapeutas |
| 15 | Alojamiento / Carpas | ⛺ | Refugio temporal |
| 16 | Cuidado de animales | 🐾 | Mascotas y animales |
| 17 | Apoyo logístico | 📋 | Coordinación y organización |
| 18 | Clasificar donaciones | 📦 | Organizar centros de acopio |
| 19 | Voluntariado general | 🤝 | Ayuda no específica |
| 20 | Otro tipo de ayuda | 🔹 | Categoría genérica |

---

## Protección Anti-Bot

La edición ciudadana (modificar información de necesidades/ofertas sin estar logueado) está protegida con **Cloudflare Turnstile**:

1. El frontend renderiza el widget de Turnstile
2. Al enviar el formulario, se incluye el token generado
3. El backend (Convex Action con Node.js) valida el token contra la API de Cloudflare
4. Si es válido, se aplica la edición; si no, se rechaza

Para desarrollo se usa el test key `1x00000000000000000000AA` que siempre aprueba.
