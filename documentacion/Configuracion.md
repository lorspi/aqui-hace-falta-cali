# Configuración

## Variables de Entorno

### Frontend (prefijo `VITE_`)

Las variables con prefijo `VITE_` son accesibles en el código del frontend (se inyectan en build time).

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `VITE_CONVEX_URL` | ✅ | URL del deployment de Convex | `https://tu-deployment.convex.cloud` |
| `VITE_TURNSTILE_SITE_KEY` | ✅ | Site key de Cloudflare Turnstile | `tu-site-key` |
| `VITE_CLARITY_ID` | ❌ | ID de Microsoft Clarity (analytics) | `tu-clarity-id` |
| `VITE_ALLOWED_HOSTS` | ❌ | Hosts permitidos en el dev server (CSV) | `mi-dominio.com,otro.com` |

### Backend (Convex Environment Variables)

Se configuran en el **Dashboard de Convex** → Settings → Environment Variables. NO van en archivos del repositorio.

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `TURNSTILE_SECRET_KEY` | ✅ | Secret key de Cloudflare Turnstile para validar tokens server-side |

### Desarrollo local (auto-configuradas por `npx convex dev`)

| Variable | Descripción |
|----------|-------------|
| `CONVEX_DEPLOYMENT` | Nombre del deployment de desarrollo (ej: `dev:mellow-alpaca-311`) |

---

## Archivos de Configuración

### `.env.local` (desarrollo)

Se genera automáticamente al ejecutar `npx convex dev`. Contiene:

```env
CONVEX_DEPLOYMENT=dev:tu-deployment
VITE_CONVEX_URL=https://tu-deployment.convex.cloud
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

> La key `1x00000000000000000000AA` es la test key de Turnstile que siempre aprueba.

### `.env.production` (producción)

Creado manualmente con los valores de producción:

```env
VITE_CONVEX_URL=https://tu-prod-deployment.convex.cloud
VITE_TURNSTILE_SITE_KEY=tu-site-key-real
VITE_CLARITY_ID=tu-clarity-id
```

### `.env.example` (template)

Archivo de referencia con todas las variables documentadas (sin valores sensibles). Se commitea al repo.

---

## Archivos de Configuración del Proyecto

### `vite.config.ts`

```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(",").map((h) => h.trim())
    : [];

  return {
    server: {
      host: "::",        // Escucha en todas las interfaces
      port: 8080,        // Puerto del dev server
      ...(allowedHosts.length > 0 && { allowedHosts }),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(__dirname, ".") },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            convex: ["convex", "convex/react"],
            map: ["leaflet"],
            ui: ["lucide-react", "motion"],
          },
        },
      },
    },
  };
});
```

### `tsconfig.json`

Configuración de TypeScript para el frontend. Targets ES2020, strict mode habilitado.

### `convex/tsconfig.json`

Configuración separada de TypeScript para el backend de Convex.

### `firebase.json`

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### `.firebaserc`

Vincula el directorio local con el proyecto de Firebase.

### `vitest.config.ts`

Configuración del framework de testing Vitest.

---

## Configuración de Servicios Externos

### Cloudflare Turnstile

1. Ir a [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Crear un widget para el dominio de producción
3. **Site Key** → variable `VITE_TURNSTILE_SITE_KEY` en `.env.production`
4. **Secret Key** → variable `TURNSTILE_SECRET_KEY` en Convex env vars

Para desarrollo: usar test key `1x00000000000000000000AA` (siempre aprueba).

### Microsoft Clarity (opcional)

1. Crear proyecto en [clarity.microsoft.com](https://clarity.microsoft.com)
2. Copiar el **Clarity ID** (ej: `abc123xyz`)
3. Agregar a `.env.production`: `VITE_CLARITY_ID=tu-id`
4. Si no se define, el script simplemente no se ejecuta

### Convex

1. Crear cuenta en [convex.dev](https://convex.dev)
2. Ejecutar `npx convex dev` para vincular y crear deployment de desarrollo
3. Para producción: `npx convex deploy` crea el deployment de producción

### Firebase Hosting

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Instalar CLI: `npm install -g firebase-tools`
3. Autenticar: `firebase login`
4. Inicializar (ya hecho): la config está en `firebase.json` y `.firebaserc`

---

## Seguridad de la Configuración

### Archivos en `.gitignore`

```
.env.local
.env.production
node_modules/
dist/
```

### Reglas

- **NUNCA** commitear archivos `.env.local` o `.env.production` con valores reales
- Los secretos del backend (`TURNSTILE_SECRET_KEY`) van SOLO en el dashboard de Convex
- El archivo `.env.example` es el único que se commitea (solo con comentarios, sin valores)
- Las variables `VITE_*` son públicas (se incluyen en el bundle del frontend) — no poner secretos ahí
