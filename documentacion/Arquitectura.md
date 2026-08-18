# Arquitectura

## Visión General

La aplicación sigue una arquitectura **cliente-servidor con datos reactivos**:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                        │
│  React 19 + TypeScript + Tailwind CSS + Leaflet         │
│  Hosting: Firebase Hosting (archivos estáticos)         │
└────────────────────────┬────────────────────────────────┘
                         │ WebSocket (suscripciones reactivas)
                         │ HTTP (mutations/actions)
┌────────────────────────┴────────────────────────────────┐
│                    BACKEND (Convex Cloud)                │
│  Queries (reactivas) + Mutations + Actions (Node.js)    │
│  Base de datos NoSQL con esquema tipado                 │
└─────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos

### Lectura (Queries Reactivas)

1. El componente React se suscribe a una query de Convex via `useQuery(api.needs.list, args)`
2. Convex mantiene una conexión WebSocket y envía actualizaciones automáticamente cuando los datos cambian
3. React re-renderiza el componente con los datos frescos (sin polling, sin refetch manual)

### Escritura (Mutations)

1. El usuario interactúa con el UI (crear necesidad, editar oferta, etc.)
2. El componente llama a una mutation via `useMutation(api.needs.create)`
3. Convex ejecuta la mutation transaccionalmente
4. Los datos se actualizan y todas las queries dependientes se re-ejecutan automáticamente

### Acciones Externas (Actions)

1. Para operaciones que requieren APIs externas (validar Turnstile), se usan Actions con runtime Node.js
2. El flujo es: Frontend → Action (valida Turnstile con fetch) → Mutation (aplica cambios a DB)

---

## Patrón de Enrutamiento

No se usa ningún router library. El enrutamiento es manual basado en `window.location.pathname`:

```
/                          → MainApp (mapa + lista)
/:cityId                   → MainApp filtrado por ciudad
/:cityId/:needId           → MainApp + modal de necesidad abierto
/:cityId/offer/:offerId    → MainApp + modal de oferta abierto
/:cityId/:needId/post      → SocialCardView (formato post)
/:cityId/:needId/story     → SocialCardView (formato story)
/moderador                 → ModeradorPage (guía de moderación)
/panel                     → AdminPanelPage (panel de administración)
```

---

## Estructura de Carpetas

```
aqui-hace-falta-cali/
├── convex/                    # Backend (Convex)
│   ├── schema.ts              # Esquema de la base de datos
│   ├── needs.ts               # CRUD de necesidades
│   ├── offers.ts              # CRUD de ofertas
│   ├── admin.ts               # Funciones protegidas de admin/moderación
│   ├── auth.ts                # Autenticación y gestión de usuarios
│   ├── publicEdit.ts          # Edición ciudadana (mutation)
│   ├── publicEditAction.ts    # Validación Turnstile (action Node.js)
│   ├── offerStatusLogic.ts    # Lógica pura de estados (testable)
│   ├── offerValidation.ts     # Validación pura de ofertas (testable)
│   ├── seed.ts                # Scripts de inicialización
│   ├── tsconfig.json          # Config TS del backend
│   └── _generated/            # Código auto-generado por Convex
├── src/                       # Frontend
│   ├── App.tsx                # Componente principal + enrutamiento
│   ├── main.tsx               # Entry point (ConvexProvider)
│   ├── types.ts               # Tipos TypeScript compartidos
│   ├── index.css              # Estilos globales (Tailwind imports)
│   ├── components/            # Componentes React
│   ├── data/                  # Datos estáticos (ciudades)
│   └── utils/                 # Utilidades (geocoding, formatters, filters)
├── public/                    # Assets estáticos
├── tests/                     # Tests (unit, integration, property-based)
├── dist/                      # Build de producción (generado)
├── .docs/                     # Notas internas del equipo
├── documentacion/             # Documentación para la wiki
├── index.html                 # HTML principal (entry point de Vite)
├── vite.config.ts             # Configuración de Vite
├── firebase.json              # Configuración de Firebase Hosting
├── package.json               # Dependencias y scripts
└── tsconfig.json              # Configuración TypeScript
```

---

## Patrones de Diseño

### Separación de Lógica Pura

La lógica de negocio compleja se extrae en módulos puros (sin dependencias de Convex ni React) para facilitar testing:

- `convex/offerStatusLogic.ts` — Transiciones de estado, auto-cómputo de status
- `convex/offerValidation.ts` — Validación de campos de ofertas
- `src/utils/offerFilters.ts` — Filtros, ordenamiento, visibilidad de ofertas

Estos módulos se testean con property-based testing (fast-check).

### Estado de UI

El estado de la aplicación se maneja con `useState` en `App.tsx` y se distribuye vía props. No se usa ningún estado global como Redux o Zustand. Convex provee la capa de datos reactivos.

### Seguridad por Capas

1. **Frontend**: Validación de formularios (UX)
2. **Backend**: Validación de datos en mutations (seguridad real)
3. **Turnstile**: Protección anti-bot para ediciones públicas
4. **Auth + RBAC**: Token de sesión + roles (ADMIN/MODERATOR) para operaciones protegidas

---

## Comunicación entre Capas

```
┌──────────────┐     useQuery()      ┌──────────────────┐
│   React UI   │ ◄──────────────────► │  Convex Queries  │ (lecturas reactivas)
│              │                      │                  │
│              │     useMutation()    │  Convex          │
│              │ ───────────────────► │  Mutations       │ (escrituras)
│              │                      │                  │
│              │     useMutation()    │  Convex Actions  │
│              │ ───────────────────► │  (Node.js)       │ (APIs externas)
└──────────────┘                      └──────────────────┘
                                              │
                                              ▼
                                      ┌──────────────────┐
                                      │  Convex Database  │
                                      │  (NoSQL, tipada)  │
                                      └──────────────────┘
```
