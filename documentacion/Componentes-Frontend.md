# Componentes Frontend

## Estructura General

Todos los componentes están en `src/components/`. La aplicación no usa un router externo — el enrutamiento se maneja en `App.tsx`.

---

## Componente Principal

### `App.tsx`

- Punto de entrada de la lógica del frontend
- Detecta la ruta actual y renderiza la página correspondiente:
  - `/moderador` → `ModeradorPage`
  - `/panel` → `AdminPanelPage`
  - `/:city/:id/post|story` → `SocialCardView`
  - Todo lo demás → `MainApp`
- `MainApp` contiene:
  - Gestión del estado global (filtros, ciudad seleccionada, modales abiertos, geolocalización)
  - Suscripciones a queries de Convex (needs, offers, counts)
  - Lógica de deep links (abrir modal por URL)
  - Rendering del layout principal (Header + FilterBar + Map/List + Modals)

---

## Componentes de Layout

### `Header.tsx`
- Barra de navegación fija (auto-hide al hacer scroll down)
- Logo + nombre de la plataforma + badge "Valle del Cauca"
- Botones de acción: "Necesito Ayuda", "Quiero Ayudar" (dropdown), "Moderación"
- En mobile: solo logo (acciones en MobileBottomBar)

### `MobileBottomBar.tsx`
- Barra fija inferior visible solo en mobile
- Toggle Lista/Mapa
- Botón para crear necesidad

### `BannerDisclaimer.tsx`
- Banner de advertencia sobre la emergencia
- Indicador de estado offline/online

### `FilterBar.tsx`
- Controles de filtrado:
  - ViewMode (Todos/Necesidades/Ofertas) con conteo
  - CityCombobox (selector de ciudad)
  - Campo de búsqueda de texto
  - Botón de ordenamiento (urgencia/recientes/distancia)
  - Panel expandible de filtros avanzados (prioridad, tipo de lugar, verificación)
  - Categorías como pills interactivas (expandible/colapsable)

### `CityCombobox.tsx`
- Selector de ciudades/municipios con autocompletado
- Muestra conteo de necesidades por ciudad
- Opción "Mi ubicación" para detectar la ciudad más cercana

---

## Componentes de Visualización

### `MapView.tsx`
- Mapa interactivo con Leaflet
- Modo normal: muestra marcadores de necesidades y ofertas
- Modo picker: permite seleccionar una ubicación (click en mapa)
- Colores de marcadores por prioridad/tipo
- Popups con resumen de la necesidad
- Scroll zoom con Ctrl (hint visual si intenta sin Ctrl)
- ResizeObserver para inicialización diferida en mobile

### `NeedCard.tsx`
- Tarjeta de necesidad para la vista de lista
- Muestra: prioridad (badge + borde lateral), título, descripción (truncada), categorías (pills), recursos con barras de progreso, dirección, distancia, tiempo desde actualización, badge de verificación
- Botón "Quiero Ayudar"
- Indicador de moderador (escudo azul) si fue editado por `[MOD]`

### `OfferCard.tsx`
- Tarjeta de oferta de ayuda
- Similar a NeedCard pero sin prioridad
- Muestra: estado de oferta, categorías, recursos, ubicación, contacto

### `NeedDetailModal.tsx`
- Vista completa de una necesidad
- Secciones: info general, prioridad, categorías, recursos con progreso, ubicación (mini-mapa), contacto, historial de actualizaciones
- Acciones: "Quiero Ayudar", "Actualizar Info", "Reportar"
- URL compartible para la necesidad

### `OfferDetailModal.tsx`
- Vista completa de una oferta
- Similar a NeedDetailModal
- Incluye estado de oferta y recursos disponibles

---

## Componentes de Creación

### `CreateNeedModal.tsx`
- Formulario para registrar una nueva necesidad
- Campos: título, descripción, tipo de lugar, categorías, recursos (lista dinámica), dirección, barrio, contacto, organización, prioridad
- Integra: geocoding automático, MiniMapPicker, detección de duplicados
- Estado de carga y errores

### `CreateOfferModal.tsx`
- Formulario para publicar una oferta de ayuda
- Campos: título, descripción, categorías, recursos, dirección, contacto
- Validación: max 120 chars título, max 1000 chars descripción, max 20 recursos
- Integra: geocoding, MiniMapPicker, CityCombobox

### `MiniMapPicker.tsx`
- Mapa pequeño interactivo para seleccionar coordenadas
- Click para colocar marcador
- Usado dentro de modales de creación/edición

---

## Componentes de Edición

### `PublicEditModal.tsx`
- Modal de edición ciudadana para necesidades
- Edita: título, descripción, tipo de lugar, categorías, recursos, dirección, ubicación, contacto, horario, prioridad
- Protegido por Cloudflare Turnstile (componente `Turnstile.tsx`)
- Campos: nombre del editor y razón de edición
- Solo envía campos que realmente cambiaron

### `PublicEditOfferModal.tsx`
- Modal de edición ciudadana para ofertas
- Similar a PublicEditModal pero para datos de oferta

### `UpdateStatusModal.tsx`
- Modal para actualizar el estado operativo de una necesidad
- Permite cambiar status y agregar notas
- Actualizar recursos individuales

---

## Componentes de Interacción

### `QuieroAyudarModal.tsx`
- Modal "Quiero Ayudar"
- Muestra información de contacto del punto
- Botón de WhatsApp con mensaje pre-armado
- Botón de llamada telefónica

### `ReportModal.tsx`
- Modal para reportar información incorrecta
- Selección de motivo (dropdown)
- Descripción del problema
- Contacto opcional del reportante

### `ConfirmDialog.tsx`
- Diálogo de confirmación genérico (confirm/alert)
- Funciones exportadas: `showConfirm()`, `showAlert()`

---

## Componentes de Administración

### `AdminPanelPage.tsx`
- Página completa del panel de administración (`/panel`)
- Incluye:
  - Formulario de login
  - Tabs: Pendientes, Reportes, Métricas, Todos, Auditoría, Usuarios
  - Tabla administrativa con filtros
  - Gestión de usuarios (crear, editar, eliminar)
  - Acciones de moderación: verificar, editar prioridad, edición completa

### `AdminDashboardModal.tsx`
- Modal alternativo de acceso al dashboard (legacy)

### `ModeradorPage.tsx`
- Página de guía del moderador (`/moderador`)
- Secciones:
  - Tareas del moderador (6 puntos)
  - Cómo corroborar información
  - Instrucciones de uso con capturas de pantalla
  - Reglas básicas de moderación
  - Sección de ofertas pendientes (con acciones verificar/archivar)
  - CTA para unirse como moderador

---

## Componentes Utilitarios

### `Turnstile.tsx`
- Wrapper del widget de Cloudflare Turnstile
- Renderiza el challenge anti-bot
- Retorna el token al componente padre

### `SocialCardView.tsx`
- Genera tarjetas visuales para compartir en redes sociales
- Formatos: post (cuadrado) y story (vertical)
- Usa `html-to-image` para exportar a PNG

---

## Relación entre Componentes

```
App
├── ModeradorPage (ruta /moderador)
├── AdminPanelPage (ruta /panel)
├── SocialCardView (ruta /post o /story)
└── MainApp
    ├── Header
    ├── BannerDisclaimer
    ├── FilterBar
    │   └── CityCombobox
    ├── MapView
    ├── NeedCard[] (lista)
    ├── OfferCard[] (lista)
    ├── MobileBottomBar
    └── Modals (renderizados condicionalmente)
        ├── NeedDetailModal
        ├── OfferDetailModal
        ├── CreateNeedModal
        │   └── MiniMapPicker
        ├── CreateOfferModal
        │   └── MiniMapPicker
        ├── PublicEditModal
        │   ├── MiniMapPicker
        │   └── Turnstile
        ├── PublicEditOfferModal
        │   └── Turnstile
        ├── UpdateStatusModal
        ├── QuieroAyudarModal
        └── ReportModal
```
