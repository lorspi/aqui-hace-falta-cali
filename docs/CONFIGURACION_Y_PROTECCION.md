# 🔒 Guía de Configuración y Protección del Código (QA & Automatización)

Este documento detalla las configuraciones y barreras de protección que deben implementarse en el proyecto para **garantizar que ningún desarrollo nuevo rompa características existentes** ni cause errores en producción.

---

## 🛡️ 1. Protección de Ramas en GitHub (Branch Protection Rules)

Para evitar que se suba código roto a las ramas principales, el administrador del repositorio en GitHub debe configurar la protección de la rama `main` y `development`.

### Pasos para configurar en GitHub:
1. Ir al repositorio en GitHub: `Settings` → `Branches` (o `Rulesets`).
2. Añadir regla para la rama `main` y `development`:
   - ☑️ **Require a pull request before merging:** Al menos 1 aprobación requerida.
   - ☑️ **Require status checks to pass before merging:** 
     - Exigir que la compilación de TypeScript (`tsc --noEmit`) pase sin errores.
     - Exigir que las pruebas unitarias de Vitest (`vitest run`) pasen.
   - ☑️ **Do not allow bypassing the above settings:** Aplicar a todos los miembros del equipo.

---

## ⚡ 2. Verificación Automatizada Local (Git Hooks con Husky)

Para evitar que un desarrollador o diseñador haga `git commit` o `git push` con errores de sintaxis o TypeScript, se automatiza la verificación previa mediante **Git Hooks**.

### A. Comando de Verificación Manual Rápidas
Antes de hacer Push, todo desarrollador debe ejecutar en su terminal:
```bash
# 1. Verificar que no hayan errores de tipos en TypeScript
npm run lint

# 2. Ejecutar las pruebas unitarias
npm run test
```

### B. Configuración de Husky (Automatización Pre-Commit)
Para instalar y activar Husky en este proyecto:

```bash
# 1. Instalar husky
npm install --save-dev husky

# 2. Inicializar husky en el proyecto
npx husky init

# 3. Configurar el hook pre-commit para correr comprobaciones automáticas
echo "npm run lint && npm run test" > .husky/pre-commit
```

*Resultado:* Cada vez que alguien escriba `git commit`, la terminal automáticamente ejecutará la verificación de TypeScript y las pruebas. Si hay algún error, el commit será rechazado impidiendo subir código defectuoso.

---

## 🤖 3. Plantilla de Reglas para Asistentes de IA (`.cursorrules` / `.clinerules`)

Para asegurarse de que todos las personas del equipo (Producto, Frontend, Backend) usen sus asistentes de IA bajo las mismas reglas y no destruyan código previo, este proyecto incluye un archivo `.cursorrules` en la raíz.

---

## 🧪 4. Matriz de Pruebas y Prevención de Fallos

Para comprobar que una entrega está lista sin romper cosas anteriores, utilicen esta matriz de pruebas según el tipo de cambio:

| Tipo de Cambio | Verificación Requerida | Comando / Acción |
| :--- | :--- | :--- |
| **Nueva pantalla de Producto** | Compilación sin errores TypeScript y carga con datos mock. | `npm run lint` |
| **Cambio en formulario / UI** | Pruebas de validación de campos con Zod y responsividad. | `npm run test` |
| **Integración Supabase / API** | Verificación de conexión, manejo de error/loading y fallback. | Probar flujo en `dev` local con credenciales de prueba. |
