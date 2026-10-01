# Reglas del Proyecto (Radar de Ayuda)

## 🔎 Reutilizar antes de crear (Reuse-First Protocol)
ANTES de crear cualquier componente, hook, utilidad o servicio nuevo:
1. Lee el inventario vivo `docs/INVENTORY.md`.
2. Busca en `src/` por nombre y concepto (modal, select, combobox, toast, filter, format, geocod…).
3. Reúsa lo existente; extiéndelo si es parecido pero incompleto; solo crea algo nuevo si no hay equivalente y justifícalo.
4. No dupliques componentes/utilidades/servicios existentes. Al crear algo nuevo, añádelo a `docs/INVENTORY.md`.
Fuente completa: `.kiro/steering/reuse-first.md`.

## 🛡️ Reglas Generales de Antigravity (Surgical Modification Protocol)
1. NO reescribas ni modifiques componentes o estilos existentes que no hayan sido expresamente mencionados en la tarea.
2. Sigue estrictamente la arquitectura del proyecto (TanStack Start + Tailwind CSS + Radix UI + Zod + Supabase).
3. Mantén fidelidad visual de 100% con las imágenes de referencia provistas.
4. Aplica tipado estricto TypeScript y separación clara entre capa de presentación (UI) y validación de datos (Zod).
5. Toda modificación debe ser mínima, limpia y quirúrgica.
6. **Uso Canónico de Tailwind CSS:** Usa siempre las clases canónicas y los tokens del sistema de diseño definidos en `src/index.css` (ej. `bg-brand-surface`, `border-brand-blue`, `h-14`, `h-dvh`). Prohibido usar valores arbitrarios con corchetes (`bg-[#...]`, `h-[...px]`) cuando exista una clase estándar o un token equivalente.

## 🚫 Regla de Despliegues y Entornos (Deployment Protocol)
1. **ENTORNO DE DESARROLLO Y PRUEBAS:** Todo desarrollo y prueba debe correr únicamente en el servidor local de desarrollo (`npx vite --mode development`) apuntando al ambiente de pruebas / desarrollo.
2. **PROHIBIDO EL DESPLIEGUE AUTOMÁTICO:** Queda estrictamente prohibido ejecutar `git push` o desplegar a Firebase Hosting (`firebase deploy`) automáticamente al terminar un cambio.
3. **DESPLIEGUE BAJO DEMANDA:** ÚNICAMENTE se subirá el código a GitHub o se desplegará a producción en Firebase Hosting cuando el usuario lo pida explícitamente con un comando o instrucción explícita.

## 🌿 Flujo de Trabajo en Git (Git Workflow)
1. **PROHIBIDO CREAR RAMAS O COMMITS AUTOMÁTICOS:** Queda estrictamente prohibido crear ramas nuevas (`git checkout -b`) o realizar commits automáticos (`git commit`) por cuenta del agente. Únicamente el usuario decide cuándo y cómo commitear o crear ramas.
2. **Rama de Trabajo:** Trabajar directamente sobre la rama activa indicada por el usuario (rama actual: `frontend`), sin conmutar de rama salvo autorización expresa.
3. **Guía Oficial:** Consultar la guía completa en [GIT_WORKFLOW.md](file:///Users/JesseLopez/offbeat/Radar%20de%20Ayuda/aqui-hace-falta-cali/GIT_WORKFLOW.md) para la coordinación en equipo con IA.

## 🛑 Estabilidad del IDE y Prevención de Crashes
1. **PROHIBIDO COMANDOS MULTILÍNEA EN SHELL:** Queda estrictamente prohibido ejecutar scripts multilínea inline con comillas o saltos de línea complejos (`node -e '...'` o `python3 -c '...'`) mediante `run_command`. Esto corrompe el almacén de permisos de Antigravity IDE (`permission_grant_store`) y provoca un crash fatal `SIGABRT` en el language server. Si se requiere un script auxiliar, se debe guardar primero en un archivo físico y ejecutarse desde allí.
2. **SIN TESTING DE BROWSER / GRABACIONES DE PANTALLA:** No invocar el subagente de navegador ni grabar pantalla a menos que el usuario lo solicite explícitamente, ya que consume recursos excesivos y ralentiza la interacción.


