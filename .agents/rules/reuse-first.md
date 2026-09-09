# Reutilizar antes de crear (Reuse-First Protocol)

ANTES de crear cualquier archivo, componente, hook, utilidad o servicio nuevo:

1. Lee el inventario vivo: `docs/INVENTORY.md`.
2. Busca en `src/` por nombre y por concepto (modal, select, combobox, toast, filter, format, geocod…).
3. Si existe algo equivalente, REÚSALO. Si es parecido pero incompleto, EXTIÉNDELO. Solo crea algo nuevo si no hay equivalente, y justifícalo explícitamente.
4. No dupliques componentes (Select, Modal, Toast, Combobox), utilidades de `src/utils/`, ni el cliente de datos (`src/lib/supabaseClient.ts`).
5. Al crear algo nuevo, añádelo a `docs/INVENTORY.md` en el mismo cambio.

Fuente de verdad completa: `.kiro/steering/reuse-first.md` y `docs/INVENTORY.md`.
