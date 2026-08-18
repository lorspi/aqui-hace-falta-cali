# Personalización

## Adaptar a otra ciudad o emergencia

Este proyecto fue creado para el Valle del Cauca, Colombia, en respuesta al terremoto de 2026. Sin embargo, está diseñado para ser replicable por otras comunidades.

---

## Pasos para personalizar

### 1. Ciudades / Municipios

**Archivo:** `src/data/valleCities.ts`

Reemplaza el array `VALLE_CITIES` con las ciudades de tu zona:

```typescript
export const VALLE_CITIES: ValleCity[] = [
  { 
    id: "tu-ciudad",           // ID único (kebab-case)
    name: "Tu Ciudad",         // Nombre para mostrar
    latitude: 4.5709,          // Centro de la ciudad
    longitude: -74.2973,       // Centro de la ciudad
    radiusKm: 10               // Radio para detección automática
  },
  // ... más ciudades
];
```

La detección automática de ciudad usa la distancia haversine entre las coordenadas del usuario y el centro de cada ciudad.

### 2. ID de Emergencia

**Archivo:** `convex/needs.ts`

Busca `"terremoto-cali-2026"` y reemplázalo con un identificador para tu emergencia:

```typescript
emergencyId: "tu-emergencia-2026",
```

### 3. Categorías de Ayuda

**Archivo:** `src/types.ts` — Tipo `HelpCategory`

Agrega o quita categorías según las necesidades de tu emergencia:

```typescript
export type HelpCategory =
  | 'ALIMENTOS'
  | 'AGUA'
  // ... tus categorías
```

**Archivo:** `src/utils/formatters.ts` — Objeto `CATEGORY_LABELS`

Agrega label e icono para cada categoría nueva:

```typescript
export const CATEGORY_LABELS: Record<HelpCategory, { label: string; icon: string }> = {
  ALIMENTOS: { label: 'Donar alimentos', icon: '🍞' },
  // ... tus categorías
};
```

### 4. Tipos de Lugar

**Archivo:** `src/types.ts` — Tipo `PlaceType`

```typescript
export type PlaceType = 'HOSPITAL' | 'REFUGIO' | 'CENTRO_ACOPIO' | /* tus tipos */;
```

**Archivo:** `src/utils/formatters.ts` — Objeto `PLACE_TYPE_LABELS`

### 5. Coordenadas del Mapa

**Archivo:** `src/components/MapView.tsx`

Cambia el centro inicial del mapa:

```typescript
const caliCenter: [number, number] = [TU_LATITUD, TU_LONGITUD];
```

### 6. Textos y Branding

Los textos están directamente en los componentes (español colombiano). Principales archivos a modificar:

- `src/components/Header.tsx` — Nombre de la plataforma y región
- `src/components/BannerDisclaimer.tsx` — Banner de emergencia
- `index.html` — Meta tags, título, OpenGraph
- `COMPARTIR.md` — Textos para compartir en redes

### 7. OpenGraph y SEO

**Archivo:** `index.html`

Actualiza las meta tags:

```html
<title>Tu Plataforma — Tu Ciudad</title>
<meta name="description" content="..." />
<meta property="og:title" content="..." />
<meta property="og:url" content="https://tu-dominio.com" />
<meta property="og:image" content="https://tu-dominio.com/og-image.png" />
```

### 8. Assets

**Archivo:** `public/`

Reemplaza:
- `favicon.svg` — Icono de la pestaña
- `logo.svg` — Logo en el header
- `og-image.png` — Imagen para compartir en redes sociales

---

## Datos Iniciales (Seed)

Si tu emergencia tiene datos conocidos (estructuras colapsadas, hospitales afectados, etc.), puedes crear un seed script:

**Archivo:** `convex/seed.ts`

Crea una nueva mutation con los datos de tu emergencia. Luego ejecuta:

```bash
npx convex run seed:tuFuncionDeSeed
```

---

## Consideraciones Técnicas

### Multilenguaje

Actualmente los textos están hardcoded en español colombiano. Para soportar otros idiomas necesitarías implementar una solución de i18n (como `react-intl` o `next-intl`).

### Multi-emergencia

El campo `emergencyId` en `needs` permite tener múltiples emergencias en la misma instancia. Actualmente no se usa activamente para filtrar (se filtra por `cityId`), pero la estructura está preparada.

### Escalabilidad Geográfica

- Para ciudades muy grandes (>50km radio), considera dividir en zonas
- Para muchos puntos (>1000), el rendering del mapa puede volverse lento — implementar clustering con `leaflet.markercluster`
- Convex maneja la paginación a nivel de base de datos, pero el filtrado actual carga todos los documentos en memoria (funciona bien hasta ~5000 necesidades)

---

## Ejemplo: Adaptar para Bogotá

```typescript
// src/data/valleCities.ts → renombrar a bogotaCities.ts
export const BOGOTA_LOCALITIES: ValleCity[] = [
  { id: "usaquen", name: "Usaquén", latitude: 4.7066, longitude: -74.0326, radiusKm: 5 },
  { id: "chapinero", name: "Chapinero", latitude: 4.6451, longitude: -74.0556, radiusKm: 4 },
  { id: "suba", name: "Suba", latitude: 4.7421, longitude: -74.0837, radiusKm: 6 },
  // ... 20 localidades
];
```

```typescript
// convex/needs.ts
emergencyId: "inundaciones-bogota-2026",
```

```html
<!-- index.html -->
<title>Aquí Hace Falta — Bogotá</title>
```
