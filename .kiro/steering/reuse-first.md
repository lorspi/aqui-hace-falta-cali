# Reutilizar antes de crear (Reuse-First Protocol)

> Regla de flujo obligatoria para cualquier asistente de IA que trabaje en este repo.
> Objetivo: evitar que se reconstruyan componentes, hooks, utilidades o servicios que **ya existen**.

## Flujo obligatorio ANTES de crear cualquier archivo, componente, hook o función

1. **Consulta el inventario primero.** Lee `docs/INVENTORY.md` (mapa vivo de lo que ya existe).
2. **Busca en el código.** Antes de escribir algo nuevo, haz una búsqueda por nombre y por concepto
   (ej. "modal", "combobox", "select", "toast", "filter", "format", "geocod") en `src/`.
   - Componentes UI → `src/components/`
   - Lógica de features → `src/features/`
   - Hooks → `src/hooks/`
   - Utilidades puras → `src/utils/`
   - Servicios / acceso a datos → `src/lib/`
3. **Decide con esta jerarquía:**
   - ¿Existe algo que hace exactamente esto? → **Reúsalo.**
   - ¿Existe algo parecido pero incompleto? → **Extiéndelo / parametrízalo**, no lo dupliques.
   - ¿No existe nada equivalente? → Solo entonces **crea algo nuevo**, siguiendo las convenciones existentes.
4. **Justifica la creación.** Si vas a crear un archivo nuevo, di explícitamente en tu respuesta:
   "Busqué X, Y, Z y no encontré equivalente, por eso creo …". Si no puedes justificarlo, no lo crees.

## Prohibiciones

- ❌ No crear un segundo componente que duplique uno existente (ej. otro `Select`, `Modal`, `Toast`, `Combobox`).
- ❌ No reimplementar utilidades que ya viven en `src/utils/` (formateo, filtros, geocoding, etc.).
- ❌ No crear un cliente/servicio de datos nuevo: usar `src/lib/supabaseClient.ts` y `supabaseService.ts`.
- ❌ No reintroducir Convex: el backend es Supabase. La lógica pura de ofertas vive en `src/utils/offerValidation.ts` y `src/utils/offerStatusLogic.ts`.
- ❌ No introducir librerías nuevas si una del stack ya resuelve el caso (TanStack + Tailwind + Radix + Zod + Supabase).

## Convenciones al crear algo genuinamente nuevo

- Colócalo en la carpeta correcta según su tipo (ver arriba).
- Sigue el patrón de nombres existente (PascalCase para componentes `.tsx`, camelCase para utils/hooks).
- Usa los tokens de diseño de `src/index.css` (ej. `bg-brand-surface`, `border-brand-blue`), nunca valores arbitrarios.
- Tipado estricto TypeScript, separación UI vs validación (Zod).

## Mantenimiento del inventario

- Cuando agregues un componente/hook/util/servicio nuevo, **añádelo a `docs/INVENTORY.md`** en el mismo cambio.
- Si el inventario y el código no coinciden, el código manda: actualiza el inventario.
