# Guía de Desarrollo

## Requisitos Previos

- [Node.js](https://nodejs.org) v18 o superior
- [npm](https://www.npmjs.com/) v9 o superior
- Cuenta gratuita en [Convex](https://convex.dev)
- (Opcional) Cuenta en [Cloudflare](https://dash.cloudflare.com) para Turnstile
- (Opcional) [Firebase CLI](https://firebase.google.com/docs/cli) para deploy del frontend

---

## Setup Inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/aqui-hace-falta.git
cd aqui-hace-falta
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Convex

```bash
npx convex dev
```

Esto:
- Te guía por la creación de un proyecto en Convex (si es la primera vez)
- Crea automáticamente `.env.local` con `CONVEX_DEPLOYMENT` y `VITE_CONVEX_URL`
- Inicia el dev server del backend (watch mode)

### 4. Variables de entorno

Editar `.env.local` y agregar:

```env
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

(Test key que siempre aprueba — para desarrollo local)

### 5. Ejecutar en modo desarrollo

```bash
npm run dev
```

Esto ejecuta simultáneamente:
- **Frontend** (Vite) → `http://localhost:8080`
- **Backend** (Convex dev) → sincroniza funciones y esquema automáticamente

### 6. Crear primer administrador

```bash
npx convex run seed:createFirstAdmin '{"email":"dev@test.com","name":"Developer","password":"password123"}'
```

Luego accede al panel de admin en `http://localhost:8080/panel`.

---

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Frontend + backend en paralelo (desarrollo) |
| `npm run dev:frontend` | Solo el frontend (Vite dev server) |
| `npm run dev:backend` | Solo el backend (Convex dev, hot reload) |
| `npm run build` | Build del frontend (modo development) |
| `npm run build:prod` | Build del frontend (modo production, usa `.env.production`) |
| `npm run deploy` | Deploy backend + build frontend |
| `npm run lint` | Verificación de tipos TypeScript (`tsc --noEmit`) |
| `npm run seed:admin` | Crear primer administrador |
| `npm run test` | Ejecutar tests con Vitest (single run) |
| `npm run test:watch` | Tests en modo watch |

---

## Estructura de Testing

```
tests/
├── unit/                  # Tests unitarios de componentes
│   ├── CreateOfferModal.test.ts
│   └── OfferComponents.test.ts
├── integration/           # Tests de integración
│   └── offer-lifecycle.test.ts
└── properties/            # Property-based tests (fast-check)
    ├── offer-contact.property.test.ts
    ├── offer-creation.property.test.ts
    ├── offer-moderation.property.test.ts
    └── offer-visibility.property.test.ts
```

### Ejecutar tests

```bash
# Todos los tests (single run)
npm run test

# Tests en modo watch
npm run test:watch

# Un archivo específico
npx vitest run tests/unit/CreateOfferModal.test.ts
```

### Property-Based Testing

Los tests de propiedades usan `fast-check` para generar datos aleatorios y verificar invariantes del sistema:

- **offer-creation**: Toda oferta válida debe pasar validación; toda oferta inválida debe fallar
- **offer-visibility**: Las reglas de visibilidad son consistentes
- **offer-moderation**: Solo roles autorizados pueden moderar
- **offer-contact**: Los links de contacto se generan correctamente

---

## Flujo de Trabajo

### Desarrollo de una nueva feature

1. Crear rama: `git checkout -b feature/mi-feature`
2. Si afecta el backend:
   - Modificar `convex/schema.ts` si hay cambios de esquema
   - Modificar/crear funciones en `convex/`
   - `npx convex dev` aplica cambios automáticamente
3. Si afecta el frontend:
   - Modificar/crear componentes en `src/components/`
   - Agregar tipos en `src/types.ts` si es necesario
   - Vite hot-reload aplica cambios al instante
4. Verificar tipos: `npm run lint`
5. Ejecutar tests: `npm run test`
6. Commit y PR

### Agregar una nueva categoría de ayuda

1. Agregar el valor al tipo `HelpCategory` en `src/types.ts`
2. Agregar label e icono en `src/utils/formatters.ts` → `CATEGORY_LABELS`
3. La categoría aparecerá automáticamente en filtros, formularios y cards

### Agregar una nueva ciudad

1. Agregar el objeto `{ id, name, latitude, longitude, radiusKm }` en `src/data/valleCities.ts`
2. La ciudad aparecerá automáticamente en el selector

---

## Convenciones de Código

### TypeScript

- Strict mode habilitado
- Tipos explícitos para props de componentes (interfaces)
- No usar `any` salvo en adaptadores de datos externos (Convex docs → tipos internos)

### React

- Functional components con `React.FC<Props>`
- Hooks para estado y efectos
- No usar class components

### Estilos

- Solo Tailwind CSS utility classes
- No archivos CSS adicionales (excepto `index.css` para imports de Tailwind)
- Diseño mobile-first

### Backend (Convex)

- Validación de argumentos con `v` (Convex validators)
- Funciones protegidas deben llamar a `requireAuth(ctx, token)` al inicio
- Registrar acciones administrativas en `auditLogs`
- ISO 8601 para todas las fechas (strings, no Date objects)

### Nomenclatura

- Componentes: PascalCase (`NeedCard.tsx`)
- Funciones/variables: camelCase
- Tipos/interfaces: PascalCase
- Constantes: UPPER_SNAKE_CASE
- IDs de ciudades: kebab-case (`el-cerrito`, `la-cumbre`)
- Categorías: UPPER_SNAKE_CASE (`MANO_OBRA`, `APOYO_PSICOLOGICO`)

---

## Contribuir

### Flujo de contribución

1. Fork el repositorio
2. Crear rama: `git checkout -b feature/mi-mejora`
3. Hacer los cambios
4. Verificar tipos: `npm run lint`
5. Ejecutar tests: `npm run test`
6. Commit: `git commit -m 'Agrega mi mejora'`
7. Push: `git push origin feature/mi-mejora`
8. Abrir Pull Request

### Ideas para contribuir

- 🌍 Traducciones a otros idiomas
- ♿ Mejoras de accesibilidad (ARIA labels, keyboard navigation)
- 📊 Dashboard de métricas públicas
- 🔔 Sistema de notificaciones (push, email, WhatsApp)
- 📱 PWA / Service Worker para uso offline
- 🗺️ Mejor geocoding y autocompletado de direcciones
- 🧪 Más tests (unit, integration, e2e)
- 📖 Documentación adicional
- 🔐 Migración a bcrypt para passwords
- 📈 Exportación de datos (CSV, PDF)

---

## Troubleshooting

### El backend no se conecta

- Verificar que `VITE_CONVEX_URL` en `.env.local` es correcta
- Verificar que `npx convex dev` está corriendo
- Revisar la consola de Convex dev por errores de esquema

### Turnstile falla en desarrollo

- Usar la test key: `VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA`
- Verificar que el script de Turnstile carga en `index.html`

### El mapa no se muestra

- Verificar que Leaflet CSS está importado (`import 'leaflet/dist/leaflet.css'`)
- En mobile, el mapa no se inicializa si el contenedor tiene tamaño 0 (usa ResizeObserver)

### Errores de tipos TypeScript

- Ejecutar `npm run lint` para ver todos los errores
- Los tipos generados de Convex están en `convex/_generated/` — se regeneran con `npx convex dev`
