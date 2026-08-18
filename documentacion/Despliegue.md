# Despliegue

## Arquitectura de Despliegue

```
┌──────────────────────────────────────────────┐
│              Firebase Hosting                 │
│  (archivos estáticos: HTML, JS, CSS, assets) │
│  URL: https://aqui-hace-falta.web.app        │
└───────────────────────┬──────────────────────┘
                        │ HTTPS
                        ▼
┌──────────────────────────────────────────────┐
│              Convex Cloud                     │
│  (funciones serverless + base de datos)      │
│  URL: https://tu-deployment.convex.cloud      │
└──────────────────────────────────────────────┘
```

---

## Despliegue del Backend (Convex)

### Comando

```bash
npx convex deploy
```

### Qué hace

1. Compila las funciones TypeScript en `convex/`
2. Valida el esquema (`convex/schema.ts`)
3. Despliega funciones y esquema al deployment de producción
4. Aplica migraciones de esquema si hay cambios

### Variables de entorno del backend

Se configuran en el **Dashboard de Convex** → Settings → Environment Variables:

| Variable | Descripción |
|----------|-------------|
| `TURNSTILE_SECRET_KEY` | Secret key de Cloudflare Turnstile para validar tokens |

---

## Despliegue del Frontend (Firebase Hosting)

### Prerequisitos

1. Tener Firebase CLI instalado: `npm install -g firebase-tools`
2. Estar autenticado: `firebase login`
3. Tener el proyecto configurado en `.firebaserc`

### Comando de build

```bash
npm run build:prod
```

Esto genera los archivos estáticos en `dist/` usando las variables de `.env.production`.

### Comando de deploy

```bash
firebase deploy --project aqui-hace-falta
```

### Configuración (`firebase.json`)

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

- `public: "dist"` — Sirve archivos desde el directorio de build
- `rewrites` — SPA fallback: todas las rutas cargan `index.html` (el enrutamiento lo maneja React)

---

## Despliegue Completo (un solo comando)

```bash
npx convex deploy && npm run build:prod && firebase deploy --project aqui-hace-falta
```

O usando el script del package.json (sin Firebase):

```bash
npm run deploy
```

---

## Hosting Alternativo

El frontend es una SPA estática — puede desplegarse en cualquier hosting:

| Plataforma | Comando / Configuración |
|------------|------------------------|
| **Vercel** | `npx vercel --prod` (auto-detecta Vite) |
| **Netlify** | Build command: `npm run build:prod`, Publish dir: `dist/` |
| **Cloudflare Pages** | Conectar repo, build: `npm run build:prod`, output: `dist/` |
| **Servidor estático** | Servir `dist/` con fallback SPA a `index.html` |

**Importante**: Cualquier hosting requiere SPA fallback (todas las rutas deben servir `index.html`).

---

## Entornos

### Desarrollo

- Backend: Deployment de desarrollo en Convex Cloud (URL en `.env.local`)
- Frontend: Vite dev server en `http://localhost:8080`
- Turnstile: Test key que siempre aprueba (`1x00000000000000000000AA`)

### Producción

- Backend: URL del deployment de Convex (configurada en `.env.production`)
- Frontend: `https://aqui-hace-falta.web.app`
- Turnstile: Key de producción real

---

## Optimización del Build

El `vite.config.ts` configura chunks manuales para optimizar la carga:

```typescript
manualChunks: {
  vendor: ["react", "react-dom"],     // ~140KB
  convex: ["convex", "convex/react"], // ~80KB
  map: ["leaflet"],                    // ~150KB
  ui: ["lucide-react", "motion"],     // ~60KB
}
```

Esto permite que el navegador cachee cada chunk por separado — si solo cambia el código de la app, los vendors no se re-descargan.

---

## Checklist de Despliegue

### Primera vez

1. [ ] Crear cuenta en Convex y vincular proyecto
2. [ ] Crear proyecto en Firebase y vincular
3. [ ] Configurar `.env.production` con URLs correctas
4. [ ] Configurar Turnstile en Cloudflare Dashboard
5. [ ] Agregar `TURNSTILE_SECRET_KEY` en Convex env vars
6. [ ] Ejecutar `npx convex deploy` para desplegar backend
7. [ ] Ejecutar `npm run build:prod && firebase deploy`
8. [ ] Crear primer admin: `npx convex run --prod seed:createFirstAdmin '...'`
9. [ ] Verificar que la app funciona en la URL de producción

### Actualizaciones rutinarias

1. [ ] Si hay cambios en `convex/`: `npx convex deploy`
2. [ ] Si hay cambios en `src/`: `npm run build:prod && firebase deploy`
3. [ ] Si hay cambios en ambos: usar el comando completo

---

## Monitoreo

- **Convex Dashboard**: Métricas de funciones, errores, uso de base de datos
- **Firebase Console**: Tráfico de hosting, ancho de banda
- **Microsoft Clarity** (si configurado): Heatmaps, grabaciones de sesión, métricas de UX
- **Panel de admin** (`/panel`): Métricas de la plataforma (necesidades activas, verificadas, etc.)
