# 🤝 Guía de Alineación y Reglas de Juego por Rol (Radar de Ayuda)

Este documento establece las **reglas de convivencia, responsabilidades por rol, protocolos de traspaso (hand-off) y listas de chequeo (Definition of Done)** para sincronizar los equipos de **Producto**, **Frontend** y **Full-stack/Backend** acelerando con Inteligencia Artificial.

---

## 🎯 1. Principio Fundamental de Alineación

> **"Un solo repositorio, un solo lenguaje (React + TS + Tailwind), cero trabajo desechable."**

Todo el equipo trabaja en el mismo repositorio de GitHub (`aqui-hace-falta-cali`). Ningún equipo crea maquetas o prototipos en herramientas o tecnologías externas (como HTML plano o scripts independientes de Python). La maquetación inicial en React/Tailwind realizada por Producto es el punto de partida directo para el equipo de desarrollo.

---

## 👥 2. Reglas y Responsabilidades por Rol

### 🎨 A. Equipo de Producto (Diseño & Prototipado en Código)
**Objetivo:** Aterrizar requerimientos de negocio en vistas funcionales y maquetas visuales vivas con datos de prueba.

* **Responsabilidades:**
  1. Crear ramas con prefijo `mockup/` (ej. `mockup/registro-voluntarios`).
  2. Construir la interfaz de usuario en React + Tailwind CSS dentro de `src/pages/` o `src/components/mockups/`.
  3. Crear interfaces de TypeScript (`src/types/`) y datos simulados en formato JSON/TS (`src/mocks/`).
  4. Usar componentes ya existentes en la biblioteca del proyecto (`src/components/ui`) y mantener coherencia gráfica.
  5. Asistirse con IA para generar el marcado JSX y adaptar la maquetación inicial.
* **Lo que NO debe hacer Producto:**
  * ❌ No conectar base de datos ni escribir llamadas directas a APIs reales.
  * ❌ No modificar lógica de negocio existente de otros módulos.
  * ❌ No cambiar configuraciones globales del proyecto (ej. `vite.config.ts`, `package.json`, tailwind config).

---

### 💻 B. Equipo Frontend (Refinamiento & Arquitectura UI)
**Objetivo:** Transformar la maqueta de Producto en componentes modulares, accesibles, validados y listos para producción.

* **Responsabilidades:**
  1. Tomar el Pull Request de la rama `mockup/` y crear la rama `feature/` o refactorizar sobre la misma.
  2. Abstraer el código de Producto: separar archivos gigantes en componentes pequeños y reutilizables.
  3. Implementar validación de formularios con **Zod** y **React Hook Form**.
  4. Garantizar la responsividad (móvil, tablet, escritorio) y accesibilidad (contraste, etiquetas aria).
  5. Asegurar el manejo de estados de la UI (Cargando / Éxito / Error / Lista vacía).
* **Lo que NO debe hacer Frontend:**
  * ❌ No rediseñar drásticamente la propuesta de Producto sin alineación previa.
  * ❌ No acoplar componentes UI directamente a llamadas SQL; usar capas de abstracción/servicios (`src/services/`).

---

### ⚙️ C. Equipo Full-stack / Backend (Servicios, DB & Supabase)
**Objetivo:** Conectar las pantallas validadas por Frontend con la infraestructura real de datos y backend.

* **Responsabilidades:**
  1. Diseñar o actualizar las tablas, tipos SQL y políticas de seguridad (RLS) en **Supabase** basándose en `src/types/`.
  2. Reemplazar los datos simulados (`src/mocks/`) por funciones reales en el servicio correspondiente (`src/services/supabaseService.ts`).
  3. Probar autenticación, permisos, persistencia de datos y rendimiento de consultas.
  4. Abrir PR final hacia la rama de integración `development` o `main`.
* **Lo que NO debe hacer Backend:**
  * ❌ No alterar la estética o el layout visual ajustado por Producto y Frontend.
  * ❌ No romper las firmas de funciones o interfaces de datos compartidas sin notificar a los otros equipos.

---

## 🔄 3. Protocolo de Transición entre Etapas (Hand-off Checklist)

Para que el pase entre etapas sea fluido y nada se rompa, se deben cumplir las siguientes condiciones antes de avanzar:

```
[ ETAPA 1: MOCKUP ]  ---> (Checklist 1) --->  [ ETAPA 2: FRONTEND ]  ---> (Checklist 2) --->  [ ETAPA 3: FULLSTACK ]
```

### ✅ Checklist 1: Transición de Producto → Frontend
Antes de solicitar revisión a Frontend, Producto verifica:
- [ ] La pantalla compila sin errores TypeScript (`npm run lint`).
- [ ] Todos los datos que se muestran provienen de un archivo dentro de `src/mocks/` (ningún valor quemado/hardcoded en el JSX).
- [ ] Las interfaces del modelo de datos se definieron formalmente en `src/types/`.
- [ ] Se incluyó una captura o GIF descriptivo en la descripción del Pull Request en GitHub.

### ✅ Checklist 2: Transición de Frontend → Full-stack/Backend
Antes de entregar a Backend, Frontend verifica:
- [ ] Todos los campos de formulario tienen esquema de validación en Zod.
- [ ] Se manejan visualmente los estados de `loading`, `error` y `empty`.
- [ ] Las pruebas unitarias/integración de la interfaz pasan (`npm run test`).
- [ ] El código está separado en componentes dentro de `src/components/`.

### ✅ Checklist 3: Integración a `development` / `main`
Antes de fusionar el trabajo final:
- [ ] Los datos simulados fueron reemplazados por llamadas reales a Supabase.
- [ ] No hay secretos ni llaves API expuestas en el código.
- [ ] La aplicación compila correctamente (`npm run build`).

---

## 🤖 4. Reglas de Oro para el uso de Asistentes de IA (Cursor / Antigravity / Copilot)

1. **Protocolo de Modificación Quirúrgica:** Pide a la IA modificar **solamente** los archivos involucrados en tu tarea. Prohíbele explícitamente reescribir archivos globales o reemplazar componentes existentes.
2. **Revisión Humana Obligatoria:** Ningún código generado por IA se sube al repositorio sin que el desarrollador haya leído y comprendido lo que hace.
3. **Mismo Contexto:** Todos los miembros deben contar con las reglas de IA actualizadas en el repositorio (`.cursorrules` / `GEMINI.md`).

---

## 🔐 5. Matriz de Roles y Permisos en RaDAR (Hand-off Oficial para Backend & Frontend)

### 5.1 Diferenciación Conceptual Fundamental
1. **Labor / Tarea en Terreno (`rol`):** Lo que la persona hace físicamente en el mundo real (*Reparto y entregas, Logística y acopio, Censo comunitario, Salud / primeros auxilios, Coordinación general*). No otorga permisos de software ni requiere usuario.
2. **Permisos en la Plataforma (`rolPlataforma`):** Lo que el usuario puede ver, editar o certificar dentro de la aplicación web y base de datos (políticas RLS de Supabase).

---

### 5.2 Matriz de Capacidades por Rol de Plataforma

| Rol en RaDAR | Cuenta Web | Correo | Gestionar Entidad | Gestionar Equipo | Publicar Oferta/Necesidad | Coordinar / Asignar | Ver Detalle de Asignación | Certificar Entrega (Fotos) | Auditoría / Actas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Administrador** (`admin`) | ✅ | Requerido | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Coordinador** (`coordinador`) | ✅ | Requerido | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Voluntario / Repartidor** (`voluntario`) | ✅ | Requerido | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Solo en terreno** (`terreno`) | ❌ | Opcional | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Solo ve / Auditor** (`auditor`) | ✅ | Requerido | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

---

### 5.3 Especificación del Rol: Voluntario / Repartidor (`voluntario`)

El voluntario es el enlace operativo de entrega en calle o comunidad con acceso móvil:
1. **Vista móvil simplificada:** Al iniciar sesión solo ve sus entregas asignadas (no accede a configuración institucional, creación de ofertas globales ni datos privados de otros miembros).
2. **Acceso al Detalle Completo de la Ayuda:**
   - En cada entrega asignada, el voluntario cuenta con una acción **«Ver detalle»**.
   - Esta acción despliega la **tarjeta / modal completa de la necesidad u oferta** (idéntica a la vista detallada de la lista del Radar).
   - **Información crítica que visualiza:**
     - Contexto y descripción de la emergencia o ayuda requerida.
     - Recursos exactos a entregar (cantidades, unidades, especificaciones técnicas).
     - Datos y teléfono directo de la persona u organización receptora.
     - Punto de entrega y mapa georreferenciado con distancia.
     - Horarios de recepción y recomendaciones de seguridad en terreno.
3. **Flujo de Cierre en Terreno:**
   - Cambiar estado a «En camino».
   - Marcar «Entregado» y adjuntar fotografía(s) de soporte directamente con la cámara de su dispositivo móvil.
   - El coordinador o receptor valida el cierre y se actualiza el acta final.

---

### 5.4 Mapeo a Supabase RLS y Esquema de Base de Datos
* `admin` / `coordinador` -> Mapean a roles con permisos sobre `organizations`, `needs`, `offers`, `deliveries`, `team_members`.
* `voluntario` -> Política RLS restrictiva: `SELECT` y `UPDATE` filtrado estrictamente por `delivery.assigned_volunteer_id = auth.uid()`.
* `terreno` -> Registro meramente informativo en tabla `team_members` con `auth_user_id = NULL` (sin credenciales).

---

## 🏗️ 6. Especificación de Base de Datos y Ciclo de Vida de Membresías (`team_members`)

Para guiar la implementación backend en Supabase, se establecen los siguientes principios de modelado y reglas de negocio:

### 6.1 Modelo Relacional Sugerido (`team_members`)
```sql
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL si es colaborador 'terreno' sin cuenta
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT, -- Correo para invitaciones o vinculación
  operational_role TEXT, -- Labor en terreno (Reparto, Logística, Salud, etc.)
  vehicle TEXT, -- Medio de transporte
  availability TEXT, -- Disponibilidad horaria
  platform_role VARCHAR(50) NOT NULL DEFAULT 'terreno', -- admin, coordinador, voluntario, auditor, terreno
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- invited, active, inactive
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Baja lógica para preservar trazabilidad
);

CREATE INDEX IF NOT EXISTS idx_team_members_org ON public.team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
```

### 6.2 Reglas de Negocio Oficiales

#### 1. Inmutabilidad del Correo al Editar Integrantes
* El correo electrónico es la credencial maestra de acceso en `auth.users`.
* Ningún administrador de una organización tiene permisos para cambiar el correo con el que otra persona inicia sesión en la plataforma global de RaDAR.
* Al editar un miembro que ya tiene correo o cuenta vinculada, el campo permanece en solo lectura con la indicación: *«Vinculado a su cuenta de RaDAR. El integrante puede actualizar su correo desde su propio perfil»*.
* Si se ingresó un correo erróneo durante una invitación pendiente (`status = 'invited'`), el administrador puede revocar dicha invitación y emitir una nueva.

#### 2. Desvinculación («Dar de baja») vs. Borrado de Perfil
* **NUNCA se borra el usuario ni su perfil (`auth.users` / `public.profiles`)**: El usuario es una persona natural ciudadana que puede participar en múltiples colectivos, JACs, ONGs o como donante/solicitante individual.
* Al «Dar de baja», la acción desvincula al miembro de la organización marcando `status = 'inactive'` y fijando `deleted_at = NOW()`.
* Si es un colaborador «Solo en terreno» sin cuenta (`user_id IS NULL`), igualmente se marca inactivo para salvaguardar el nombre registrado en las entregas históricas que ejecutó.

#### 3. Integridad de Auditoría en Entregas y Actas (`deliveries` / `reports`)
* Las actas oficiales (`RD-2026-...`) exigen validez legal e histórica.
* Si un voluntario desvinculado realizó entregas en el pasado, su registro histórico persiste intacto en los reportes y actas generadas. Las claves foráneas en entregas hacia miembros desvinculados deben configurarse con `ON DELETE SET NULL` o resolverse mediante el snapshot de auditoría guardado en el acta.
