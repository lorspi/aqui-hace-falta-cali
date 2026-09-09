# Inventario del proyecto (Radar de Ayuda)

> Mapa vivo de lo que YA EXISTE. Consúltalo antes de crear cualquier cosa nueva.
> Regla asociada: `.kiro/steering/reuse-first.md`.
> Al agregar/renombrar/eliminar algo, actualiza este archivo en el mismo commit.

## Stack

TanStack Start · Tailwind CSS · Radix UI · Zod · Supabase · Vite · Vitest

## Estructura de carpetas (`src/`)

| Carpeta                                    | Qué contiene                                | Antes de crear aquí, busca…                         |
| --------------------------------------------| ---------------------------------------------| -----------------------------------------------------|
| `components/`                              | Componentes UI reutilizables (`.tsx`)       | modal, card, select, combobox, toast, page, bar     |
| `features/`                                | Lógica y UI por feature (`auth`, `landing`) | el feature ya existente antes de crear uno paralelo |
| `hooks/`                                   | Hooks de React                              | `use…` con el mismo propósito                       |
| `utils/`                                   | Funciones puras (sin React)                 | formateo, filtros, geocoding, lógica de estado      |
| `lib/`                                     | Clientes y servicios de datos               | acceso a Supabase / servicios                       |
| `constants/`, `content/`, `data/`, `i18n/` | Constantes, textos, datos, traducciones     | strings/valores ya definidos                        |

## Componentes existentes (`src/components/`)

Modales: `AdminDashboardModal`, `ChatbotTicketModal`, `CreateNeedModal`, `CreateOfferModal`,
`ConfirmDialog`, `LandingOfferActionModal`, `NeedDetailModal`, `OfferDetailModal`,
`PublicEditModal`, `PublicEditOfferModal`, `QuieroAyudarModal`, `RadarMatchModal`,
`ReportModal`, `UpdateStatusModal`, `WelcomeOnboardingModal`.

Selección / entrada: `CityCombobox`, `CityFormCombobox`, `CustomSelect`, `SearchAutocomplete`,
`LanguageSelector`, `Turnstile`.

Cards / listas: `NeedCard`, `OfferCard`, `ChatbotReportsList`, `ChatbotReportDetail`, `SocialCardView`.

Páginas: `AdminPanelPage`, `CifrasPage`, `LandingHomePage`, `LegalPage`, `ModeradorPage`,
`SimulatedRegisterPage`.

Layout / navegación / feedback: `Header`, `Footer`, `FilterBar`, `MobileBottomBar`,
`FloatingCreateNeedFAB`, `Toast`, `BannerDisclaimer`, `DevEnvironmentBanner`,
`WelcomeOnboardingModal`.

Mapa: `MapView`, `MiniMapPicker`, `InteractiveRadarSymbolGuide`.

> Antes de crear un nuevo modal/select/card/toast, **reutiliza o extiende** uno de estos.

## Hooks (`src/hooks/`)

- `useMapClustering` — clustering de puntos en el mapa.

## Utilidades (`src/utils/`)

- `analytics` · `chatbotReportUtils` · `conversationDetailUtils` · `formatters`
- `geocoding` · `offerFilters` · `reviewUtils`
- `offerStatusLogic` — validación y transiciones de estado de ofertas (lógica pura).
- `offerValidation` — validación de entrada y armado del documento de oferta (lógica pura).

## Servicios / datos (`src/lib/`)

- `supabaseClient` — cliente Supabase (usar este, no crear otro).
- `supabaseService` — operaciones de datos.
- `reviewService` — lógica de reseñas.

## Backend

Supabase (Postgres + Edge Functions + PostgREST). El acceso desde el frontend
pasa por `src/lib/supabaseClient.ts` y `src/lib/supabaseService.ts`.
Las Edge Functions viven en `supabase/`.

> Nota: el backend Convex fue retirado del proyecto. La lógica pura que vivía en
> `convex/` (validación y estado de ofertas) se movió a `src/utils/`
> (`offerValidation.ts`, `offerStatusLogic.ts`). No reintroducir Convex.
