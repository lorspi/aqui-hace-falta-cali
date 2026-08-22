# 🌿 Guía de Buenas Prácticas de Git para Desarrollo en Equipo con IA

Este documento establece las reglas y el flujo de trabajo estándar en Git para el proyecto **Aquí Hace Falta**. Está diseñado para garantizar la estabilidad del código cuando múltiples desarrolladores (y asistentes de IA) trabajan simultáneamente en el mismo repositorio.

---

## 📌 1. Glosario Rápido: Local vs. Remoto

* **`main` (Rama Local):** Es la línea de tiempo del código en tu propia computadora.
* **`origin`:** Es el apodo del servidor remoto en GitHub (`https://github.com/lorspi/aqui-hace-falta-cali.git`).
* **`origin/main` (Rama Remota de Rastreo):** Es la copia en tu computadora que indica cómo estaba la rama `main` en GitHub en el último `git fetch` o `git pull`.

---

## 🛡️ 2. Reglas de Oro del Equipo

1. **`main` es Sagrada:** Nadie programa ni hace `commit` directo sobre `main`. Todo cambio entra a `main` únicamente mediante un **Pull Request (PR)** aprobado.
2. **Una Rama por Tarea:** Cada desarrollador crea una rama corta para cada funcionalidad o corrección.
3. **Modificaciones Quirúrgicas con IA:** Instruir a los asistentes de IA para realizar cambios mínimos en archivos específicos y evitar reescrituras masivas innecesarias.
4. **Coordinación de Archivos:** Avisar al equipo si vas a trabajar en componentes compartidos complejos (ej. `MapView.tsx`, `App.tsx` o `supabaseService.ts`) para evitar edición simultánea.

---

## 🚀 3. Flujo de Trabajo Diario (Paso a Paso)

### Paso 1: Actualizar tu `main` local antes de empezar
```bash
git checkout main
git pull origin main
```

### Paso 2: Crear tu rama de trabajo
Usa nombres descriptivos y prefijos estándar:
* `feature/` para nuevas características (ej: `feature/filtro-prioridad`)
* `fix/` para corrección de errores (ej: `fix/error-modal-mapa`)
* `docs/` para documentación (ej: `docs/guia-git`)

```bash
git checkout -b feature/mi-nueva-tarea
```

### Paso 3: Trabajar con la IA y guardar cambios progresivos
Realiza commits cortos con mensajes descriptivos usando la convención [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat(mapa): agrego vista panorámica inicial de Colombia"
```

### Paso 4: Sincronizar tu rama con `main` antes de subir
Para asegurarte de que tu código no rompa nada de lo que subieron tus compañeros mientras trabajabas:

```bash
git fetch origin
git merge origin/main
```
*(Si hay conflictos, resuélvelos localmente con ayuda de tu IA antes de publicar la rama).*

### Paso 5: Publicar la rama en GitHub y abrir Pull Request
```bash
git push origin feature/mi-nueva-tarea
```
Ve a la página del repositorio en GitHub, presiona **Compare & pull request**, describe tus cambios y solicita revisión del equipo.

---

## 🛠️ 4. Cheat Sheet de Comandos Útiles

| Acción | Comando |
| :--- | :--- |
| **Ver estado actual y archivos modificados** | `git status` |
| **Ver todas las ramas (locales y remotas)** | `git branch -a` |
| **Cambiar a una rama existente** | `git checkout nombre-rama` |
| **Crear y cambiar a una rama nueva** | `git checkout -b feature/nueva-rama` |
| **Descargar referencias remotas sin cambiar tu código** | `git fetch origin` |
| **Traer y fusionar los cambios de GitHub** | `git pull origin main` |
| **Descartar cambios locales no guardados en un archivo** | `git restore ruta/al/archivo.tsx` |

---

## 🚨 5. ¿Qué hacer en caso de Conflicto de Merge?

Si al hacer `git merge` aparece `CONFLICT (content): Merge conflict in...`:

1. Abre el archivo conflictivo en VS Code / Antigravity.
2. Identifica los marcadores de conflicto:
   ```typescript
   <<<<<<< HEAD (Tu código)
   const zoom = 5.6;
   =======
   const zoom = 6.0;
   >>>>>>> origin/main (Código de tu compañero)
   ```
3. Pídele a tu asistente de IA: *"Ayúdame a resolver este conflicto de merge en `MapView.tsx` manteniendo ambas funcionalidades intactas."*
4. Guarda el archivo limpio, ejecuta `git add .` y finaliza con `git commit -m "fix: resuelvo conflicto de merge"`.
