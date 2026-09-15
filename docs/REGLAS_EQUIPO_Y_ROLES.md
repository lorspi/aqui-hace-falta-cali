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
