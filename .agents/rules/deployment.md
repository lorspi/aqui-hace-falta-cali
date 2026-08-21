# Reglas de Entornos y Despliegues (Deployment Protocol)

1. **Despliegues Bajo Demanda Explícita:**
   - NO ejecutes `git push` ni despliegues a Firebase Hosting (`firebase deploy`) automáticamente al completar una tarea.
   - ÚNICAMENTE despliega a GitHub o a Firebase Hosting cuando el usuario lo solicite de manera explícita y textual (ejemplo: *"Despliega a GitHub"*, *"Sube a Firebase"*, *"Publica en producción"*).

2. **Desarrollo y Pruebas en Entorno Local:**
   - Todo desarrollo, modificación y verificación de código debe ejecutarse en el servidor local de desarrollo (`npx vite --mode development`) apuntando al ambiente de pruebas / desarrollo.
