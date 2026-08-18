# Stack Tecnológico

## Resumen

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript | React 19, TS ~5.8 |
| Estilos | Tailwind CSS (via Vite plugin) | v4.1 |
| Bundler | Vite | v6.2 |
| Backend / Base de datos | Convex | v1.17 |
| Mapas | Leaflet + OpenStreetMap | v1.9 |
| Animaciones | Motion (Framer Motion) | v12.23 |
| Iconos | Lucide React | v0.546 |
| Anti-bot | Cloudflare Turnstile | — |
| Geocoding | Nominatim (OpenStreetMap) | Gratuito, sin API key |
| Export de imágenes | html-to-image | v1.11 |
| Analytics | Microsoft Clarity | Opcional |
| Hosting Frontend | Firebase Hosting | — |
| Hosting Backend | Convex Cloud | — |
| Testing | Vitest + fast-check | Vitest v4.1, fast-check v4.9 |

---

## Frontend

### React 19 + TypeScript

La aplicación es una SPA (Single Page Application) construida con React 19 y TypeScript. No utiliza ningún framework de routing externo; el enrutamiento se maneja de forma manual en `App.tsx` leyendo `window.location.pathname`.

### Tailwind CSS v4

Los estilos se aplican con Tailwind CSS v4 integrado directamente como plugin de Vite (`@tailwindcss/vite`). No se usa el archivo `tailwind.config.js` tradicional; la configuración está en `src/index.css`.

### Vite 6

Bundler y dev server. Configuración relevante:
- Puerto de desarrollo: `8080`
- Chunks manuales optimizados para producción:
  - `vendor`: react, react-dom
  - `convex`: convex, convex/react
  - `map`: leaflet
  - `ui`: lucide-react, motion
- Alias `@` apuntando a la raíz del proyecto

### Leaflet

Librería de mapas interactivos con tiles de OpenStreetMap. Se usa para:
- Mapa principal de necesidades/ofertas
- Marcadores por prioridad y tipo (colores distintos)
- MiniMapPicker para selección de coordenadas en formularios
- Detección de scroll + hint visual

---

## Backend

### Convex

Convex es una base de datos reactiva + funciones serverless todo en uno. Ofrece:
- **Queries reactivas**: Los datos se actualizan automáticamente en el UI cuando cambian
- **Mutations**: Operaciones de escritura transaccionales
- **Actions**: Funciones con runtime de Node.js para operaciones con APIs externas (Turnstile)
- **Schema tipado**: Validación en tiempo de desarrollo y producción
- **Índices**: Para consultas eficientes

Los archivos del backend viven en `convex/` y se despliegan con `npx convex deploy`.

---

## Dependencias Principales (package.json)

### Producción

| Paquete | Uso |
|---------|-----|
| `react` / `react-dom` | Framework UI |
| `convex` | SDK del backend (queries, mutations, client) |
| `leaflet` | Mapa interactivo |
| `@types/leaflet` | Tipos TypeScript para Leaflet |
| `lucide-react` | Iconos SVG |
| `motion` | Animaciones y transiciones |
| `html-to-image` | Generación de tarjetas sociales (export a imagen) |
| `@tailwindcss/vite` | Plugin Tailwind para Vite |
| `@vitejs/plugin-react` | Soporte React para Vite |
| `vite` | Bundler y dev server |

### Desarrollo

| Paquete | Uso |
|---------|-----|
| `typescript` | Tipado estático |
| `vitest` | Framework de testing |
| `fast-check` | Property-based testing |
| `autoprefixer` | Post-procesado CSS |
| `tailwindcss` | Motor de CSS utility-first |
| `npm-run-all` | Ejecutar scripts en paralelo |
| `@types/node` / `@types/react` / `@types/react-dom` | Tipos de desarrollo |

---

## Servicios Externos

| Servicio | Propósito | Costo |
|----------|-----------|-------|
| Convex Cloud | Backend serverless + DB | Free tier disponible |
| Firebase Hosting | Hosting del frontend (estático) | Free tier disponible |
| Cloudflare Turnstile | Protección anti-bot | Gratuito |
| Nominatim (OSM) | Geocoding (dirección → coordenadas) | Gratuito (rate limit 1 req/s) |
| Microsoft Clarity | Analytics de uso | Gratuito |
| OpenStreetMap | Tiles del mapa | Gratuito |

---

## Herramientas de Desarrollo

| Herramienta | Uso |
|-------------|-----|
| `npx convex dev` | Dev server del backend (hot reload del schema y funciones) |
| `npm run dev` | Ejecuta frontend + backend en paralelo |
| `npx convex deploy` | Deploy del backend a producción |
| `firebase deploy` | Deploy del frontend a producción |
| `npm run lint` | Verificación de tipos TypeScript (`tsc --noEmit`) |
| `npm run test` | Ejecuta tests con Vitest |
