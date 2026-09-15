# 🛠️ Estándar Técnico y Patrón de Datos Simulados (Mock-First)

Este documento especifica las convenciones de código, la estructura de carpetas y el **patrón Mock-First** que permite al equipo de Producto y Frontend construir interfaces sin depender del estado del servidor/backend.

---

## 📁 1. Estructura Estándar de Archivos y Responsabilidades

Para mantener el orden y evitar colisiones entre roles, el código del proyecto se organiza de la siguiente manera:

```text
src/
├── components/          # Componentes reutilizables
│   ├── ui/              # Átomos y elementos base (Botones, Inputs, Modales)
│   ├── forms/           # Formularios modulares con validación Zod
│   └── mockups/         # Maquetas iniciales creadas por el equipo de Producto
├── pages/               # Vistas/Pantallas completas de la aplicación
├── types/               # Contratos y tipos de datos en TypeScript (.ts)
├── mocks/               # Datos simulados (JSON / arrays TypeScript)
├── services/            # Capa de integración (Servicios de Supabase o API)
└── utils/               # Utilidades puras e imutables (formateadores, helpers)
```

---

## 📄 2. El Patrón "Mock-First" en 3 Pasos

Para garantizar que Producto entregue Maquetas utilizables y Backend no bloquee el desarrollo visual, se implementa el patrón **Mock-First**:

### Paso 1: Definir la Interfaz de Datos (`src/types/`)
Producto o Frontend crea el modelo de datos formal.

```typescript
// src/types/voluntario.ts
export interface Voluntario {
  id: string;
  nombreCompleto: string;
  correo: string;
  habilidades: string[];
  disponible: boolean;
  fechaRegistro: string;
}
```

### Paso 2: Crear los Datos Falsos de Prueba (`src/mocks/`)
Producto crea los datos simulados que usará la pantalla.

```typescript
// src/mocks/voluntariosMock.ts
import { Voluntario } from '../types/voluntario';

export const MOCK_VOLUNTARIOS: Voluntario[] = [
  {
    id: 'vol-101',
    nombreCompleto: 'María Fernanda Gómez',
    correo: 'maria.gomez@example.com',
    habilidades: ['Primeros Auxilios', 'Logística'],
    disponible: true,
    fechaRegistro: '2026-09-01'
  },
  {
    id: 'vol-102',
    nombreCompleto: 'Carlos Alberto Ríos',
    correo: 'carlos.rios@example.com',
    habilidades: ['Conducción', 'Distribución de alimentos'],
    disponible: false,
    fechaRegistro: '2026-09-05'
  }
];
```

### Paso 3: Servicio con Switch (Mock vs. Producción)
El servicio expone la función que la pantalla consumirá. Inicialmente retorna el Mock; posteriormente Backend conecta Supabase.

```typescript
// src/services/voluntarioService.ts
import { Voluntario } from '../types/voluntario';
import { MOCK_VOLUNTARIOS } from '../mocks/voluntariosMock';
import { supabase } from './supabaseClient'; // Cliente de Supabase

const USAR_DATOS_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export async function obtenerVoluntarios(): Promise<Voluntario[]> {
  if (USAR_DATOS_MOCK) {
    // Retorna datos de prueba para Producto y Frontend
    return Promise.resolve(MOCK_VOLUNTARIOS);
  }

  // Consulta real a Supabase (Backend)
  const { data, error } = await supabase.from('voluntarios').select('*');
  if (error) throw new Error(error.message);
  return data as Voluntario[];
}
```

---

## 🛡️ 3. Reglas Antirregresión (Para no romper lo existente)

1. **Jamás modificar contratos compartidos sin aviso:** Si un cambio en `src/types/` requiere renombrar un campo (ej. `nombreCompleto` → `fullName`), debes buscar y actualizar **todas las referencias** en la aplicación antes de subir los cambios.
2. **Componentes Aislados:** Cada nueva funcionalidad debe crearse en su propio componente/archivo dentro de `src/components/` o `src/pages/`. No agregues cientos de líneas a archivos existentes como `App.tsx` o `MapView.tsx`.
3. **No eliminar clases CSS globales ni estilos base:** Si necesitas personalizar un estilo para un mockup, usa clases de Tailwind directamente en el elemento en lugar de modificar variables CSS globales.
4. **Respetar los componentes UI base (`src/components/ui`):** Reutiliza los botones, modales e inputs existentes. Si un componente existente no cumple un requerimiento, extiende sus propiedades mediante `props` opcionales en lugar de duplicarlo o sobreescribirlo.
