# Reglas del Proyecto (Radar de Ayuda)

## 🛡️ Reglas Generales de Antigravity (Surgical Modification Protocol)
1. NO reescribas ni modifiques componentes o estilos existentes que no hayan sido expresamente mencionados en la tarea.
2. Sigue estrictamente la arquitectura del proyecto (TanStack Start + Tailwind CSS + Radix UI + Zod + Supabase).
3. Mantén fidelidad visual de 100% con las imágenes de referencia provistas.
4. Aplica tipado estricto TypeScript y separación clara entre capa de presentación (UI) y validación de datos (Zod).
5. Toda modificación debe ser mínima, limpia y quirúrgica.

## 🚫 Regla de Despliegues y Entornos (Deployment Protocol)
1. **ENTORNO DE DESARROLLO Y PRUEBAS:** Todo desarrollo y prueba debe correr únicamente en el servidor local de desarrollo (`npx vite --mode development`) apuntando al ambiente de pruebas / desarrollo.
2. **PROHIBIDO EL DESPLIEGUE AUTOMÁTICO:** Queda estrictamente prohibido ejecutar `git push` o desplegar a Firebase Hosting (`firebase deploy`) automáticamente al terminar un cambio.
3. **DESPLIEGUE BAJO DEMANDA:** ÚNICAMENTE se subirá el código a GitHub o se desplegará a producción en Firebase Hosting cuando el usuario lo pida explícitamente con un comando o instrucción explícita.

## 🌿 Flujo de Trabajo en Git (Git Workflow)
1. **Ramas por Tarea:** Todo nuevo desarrollo o corrección se debe realizar en una rama dedicada (`feature/nombre-tarea`, `fix/solucion-bug`) y jamás directamente sobre `main`.
2. **Guía Oficial:** Consultar la guía completa en [GIT_WORKFLOW.md](file:///Users/JesseLopez/offbeat/Radar%20de%20Ayuda/aqui-hace-falta-cali/GIT_WORKFLOW.md) para la coordinación en equipo con IA.

