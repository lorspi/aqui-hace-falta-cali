# 👥 Matriz de Roles y Asignación del Equipo (Radar de Ayuda)

Este documento registra a los integrantes del equipo, sus roles asignados, usuarios de GitHub y responsabilidades específicas dentro del proyecto **Aquí Hace Falta Cali**.

---

## 📋 1. Directorio de Integrantes por Rol

> *Edita esta tabla para agregar los nombres y usuarios reales de tu equipo.*

### 🎨 Equipo de Producto (UI / Mockups)
**Función:** Aterrizar requerimientos, crear datos simulados (`src/mocks/`) y construir maquetas en React + Tailwind.

| Nombre Completo | Usuario GitHub | Canal / Contacto | Modulo / Pantallas a cargo |
| :--- | :--- | :--- | :--- |
| *[Nombre Integrante 1]* | `@usuario_github_1` | Slack / WA | Registros / Formularios |
| *[Nombre Integrante 2]* | `@usuario_github_2` | Slack / WA | Mapa / Tarjetas de Ayuda |

---

### 💻 Equipo Frontend (Arquitectura UI & Validación)
**Función:** Refinar maquetas, modularizar componentes, aplicar validaciones con Zod y asegurar experiencia responsive/accesible.

| Nombre Completo | Usuario GitHub | Canal / Contacto | Módulo / Componentes a cargo |
| :--- | :--- | :--- | :--- |
| *[Nombre Integrante 3]* | `@usuario_github_3` | Slack / WA | Sistema de Diseño / Forms |
| *[Nombre Integrante 4]* | `@usuario_github_4` | Slack / WA | Vistas Interactivas / Filtros |

---

### ⚙️ Equipo Full-stack / Backend (Supabase & APIs)
**Función:** Modelar base de datos en Supabase, configurar políticas RLS y conectar servicios reales (`src/services/`).

| Nombre Completo | Usuario GitHub | Canal / Contacto | Servicios a cargo |
| :--- | :--- | :--- | :--- |
| Jesse López | `@jesselopez08` | WhatsApp | Autenticación / Tablas Supabase / APIs |


---

## 🔀 2. Flujo de Notificaciones y Revisiones

* **Para revisar maquetas (`mockup/*`):** Etiquetar al **Equipo Frontend** en GitHub.
* **Para revisar refactorización UI (`feature/*`):** Etiquetar al **Equipo Backend** y a **Producto**.
* **Para aprobaciones finales a `development` / `main`:** Requiere al menos **1 aprobación de Frontend** y **1 de Backend**.

---

## 🛠️ 3. Mantenimiento de la Matriz

Cuando ingrese un nuevo miembro al equipo o cambie de responsabilidades:
1. Abrir una rama corta (`docs/actualizar-matriz-equipo`).
2. Actualizar las filas correspondientes en este archivo.
3. Hacer Pull Request hacia `main`.
