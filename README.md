# 🆘 Aquí Hace Falta

**Plataforma ciudadana de código abierto para coordinar ayuda en emergencias.**

Un mapa interactivo en tiempo real donde comunidades pueden registrar y encontrar necesidades activas: alimentos, agua, medicamentos, voluntarios, transporte, escombros, sangre, alojamiento y más. Diseñada para activarse rápidamente ante desastres naturales y emergencias humanitarias.

> 🤖 **Nota:** Este proyecto fue construido con apoyo significativo de inteligencia artificial (Claude/Kiro). El diseño, la arquitectura y gran parte del código fueron generados y refinados con asistencia de IA como herramienta de desarrollo acelerado en contexto de emergencia.

---

## ✨ Características

- 📍 **Mapa interactivo** con puntos de necesidad geolocalizados (Leaflet)
- 🔍 **Filtros avanzados** por categoría, prioridad, barrio, distancia y estado
- 📝 **Registro ciudadano** — cualquier persona puede reportar una necesidad
- ✅ **Sistema de verificación** — moderadores confirman la información
- 🚨 **Prioridades claras** — Crítica, Alta, Media, Baja
- 📱 **Responsive** — funciona en móvil, tablet y escritorio
- 🔗 **URLs compartibles** por necesidad para difusión en redes
- 🛡️ **Protección anti-bot** con Cloudflare Turnstile
- 👥 **Panel de administración** para moderadores
- 🏙️ **Multi-ciudad** — soporta múltiples municipios/ciudades
- ✏️ **Edición ciudadana** — la comunidad puede actualizar información
- 📊 **Métricas** de necesidades activas, verificadas y cubiertas

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite |
| Backend | [Convex](https://convex.dev) (base de datos reactiva + funciones serverless) |
| Mapa | [Leaflet](https://leafletjs.com) con OpenStreetMap |
| Animaciones | Motion (Framer Motion) |
| Iconos | Lucide React |
| Anti-bot | Cloudflare Turnstile |
| Hosting Frontend | Firebase Hosting (o cualquier hosting estático) |
| Hosting Backend | Convex Cloud |

---

## 📋 Requisitos Previos

- [Node.js](https://nodejs.org) v18 o superior
- [npm](https://www.npmjs.com/) v9 o superior
- Cuenta gratuita en [Convex](https://convex.dev)
- (Opcional) Cuenta en [Cloudflare](https://dash.cloudflare.com) para Turnstile
- (Opcional) Proyecto en [Firebase](https://firebase.google.com) para hosting

---

## 🚀 Instalación y Desarrollo

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/aqui-hace-falta.git
cd aqui-hace-falta
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Convex

Crea una cuenta gratuita en [convex.dev](https://convex.dev) y ejecuta:

```bash
npx convex dev
```

Esto creará automáticamente un archivo `.env.local` con las variables de tu deployment de desarrollo. Sigue las instrucciones en la terminal para vincular tu proyecto.

### 4. Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env.local
```

Las variables necesarias son:

```env
# Se configuran automáticamente al ejecutar `npx convex dev`
CONVEX_DEPLOYMENT=dev:tu-deployment
VITE_CONVEX_URL=https://tu-deployment.convex.cloud

# Cloudflare Turnstile (opcional en desarrollo)
# Test key que siempre aprueba:
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA

# Microsoft Clarity - analytics (opcional)
VITE_CLARITY_ID=tu-clarity-id

# Hosts permitidos en el dev server de Vite (opcional, separados por coma)
VITE_ALLOWED_HOSTS=tu-dominio.com
```

### 5. Ejecutar en modo desarrollo

```bash
npm run dev
```

Esto ejecuta simultáneamente:
- **Frontend** (Vite) en `http://localhost:8080`
- **Backend** (Convex dev) sincronizando funciones y esquema

---

## 👤 Crear el Primer Administrador

Después de que Convex esté corriendo, crea el primer usuario administrador:

```bash
npx convex run seed:createFirstAdmin '{"email":"admin@tudominio.com","name":"Tu Nombre","password":"TuPasswordSeguro123"}'
```

> ⚠️ **Importante:** Usa una contraseña segura. Este comando solo funciona si no existe ningún administrador. Usuarios adicionales se crean desde el panel de administración.

Para producción, usa el flag `--prod`:

```bash
npx convex run --prod seed:createFirstAdmin '{"email":"admin@tudominio.com","name":"Tu Nombre","password":"TuPasswordSeguro123"}'
```

Una vez creado, puedes acceder al panel de administración haciendo clic en "Acceso Moderación" en el footer de la app.

---

## 🌐 Despliegue a Producción

### Backend (Convex)

1. Despliega las funciones y esquema a producción:

```bash
npx convex deploy
```

2. Configura las variables de entorno de producción en el dashboard de Convex:
   - `TURNSTILE_SECRET_KEY` — tu secret key de Cloudflare Turnstile

### Frontend (Firebase Hosting)

1. Crea un archivo `.env.production`:

```env
VITE_CONVEX_URL=https://tu-prod-deployment.convex.cloud
VITE_TURNSTILE_SITE_KEY=tu-turnstile-site-key
VITE_CLARITY_ID=tu-clarity-id
```

2. Compila el frontend:

```bash
npm run build:prod
```

3. Despliega a Firebase:

```bash
firebase deploy
```

### Despliegue Completo (un solo comando)

```bash
npx convex deploy && npm run build:prod && firebase deploy
```

### Hosting Alternativo

El frontend compila a archivos estáticos en `dist/`. Puedes usar cualquier hosting:

- **Vercel**: `npx vercel --prod`
- **Netlify**: Apunta al directorio `dist/` con `npm run build:prod`
- **Cloudflare Pages**: Conecta el repo y configura `npm run build:prod` como build command
- **Cualquier servidor estático**: Sirve `dist/` con un fallback SPA a `index.html`

---

## 🔐 Configurar Cloudflare Turnstile (Anti-bot)

Turnstile protege la edición ciudadana de bots:

1. Ve a [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Crea un widget para tu dominio
3. Copia el **Site Key** a tu `.env.production` como `VITE_TURNSTILE_SITE_KEY`
4. Copia el **Secret Key** y configúralo como variable de entorno en Convex:
   - Dashboard de Convex → Settings → Environment Variables → `TURNSTILE_SECRET_KEY`

Para desarrollo, usa el test key `1x00000000000000000000AA` que siempre aprueba.

---

## 📊 Analytics (Microsoft Clarity)

La plataforma soporta [Microsoft Clarity](https://clarity.microsoft.com) para analytics de uso. Es completamente opcional y se configura por variable de entorno (no queda hardcodeado en el código).

1. Crea un proyecto en [clarity.microsoft.com](https://clarity.microsoft.com)
2. Copia tu **Clarity ID** (ej: `abc123xyz`)
3. Agrégalo a tu `.env.production`:

```env
VITE_CLARITY_ID=tu-clarity-id
```

Si la variable no está definida, el script de Clarity simplemente no se ejecuta. No afecta el funcionamiento de la app.

---

## 🔧 Configuración del Dev Server

El archivo `vite.config.ts` lee la variable `VITE_ALLOWED_HOSTS` para restringir qué dominios pueden acceder al servidor de desarrollo. Esto es útil si expones tu dev server a través de un proxy o tunnel:

```env
# En .env.local
VITE_ALLOWED_HOSTS=mi-dominio.com,otro-dominio.com
```

Si no la defines, Vite no aplica restricción (comportamiento por defecto).

---

## 📁 Estructura del Proyecto

```
├── convex/                 # Backend (Convex functions + schema)
│   ├── schema.ts           # Esquema de base de datos
│   ├── needs.ts            # CRUD de necesidades
│   ├── admin.ts            # Funciones de administración
│   ├── auth.ts             # Autenticación y sesiones
│   ├── seed.ts             # Scripts de seed (primer admin)
│   ├── publicEdit.ts       # Edición ciudadana
│   └── publicEditAction.ts # Action con validación Turnstile
├── src/
│   ├── App.tsx             # Componente principal
│   ├── main.tsx            # Entry point con ConvexProvider
│   ├── types.ts            # Tipos TypeScript
│   ├── components/         # Componentes React
│   │   ├── Header.tsx
│   │   ├── MapView.tsx
│   │   ├── NeedCard.tsx
│   │   ├── FilterBar.tsx
│   │   ├── CreateNeedModal.tsx
│   │   ├── AdminDashboardModal.tsx
│   │   └── ...
│   ├── data/               # Datos estáticos (ciudades)
│   └── utils/              # Utilidades (geocoding, formatters)
├── public/                 # Assets estáticos
├── .env.example            # Template de variables de entorno
├── firebase.json           # Config de Firebase Hosting
├── vite.config.ts          # Config de Vite
└── package.json
```

---

## 🏙️ Personalización para tu Ciudad/Emergencia

Este proyecto fue creado para el Valle del Cauca, Colombia, pero puede adaptarse a cualquier ubicación:

1. **Ciudades**: Edita `src/data/valleCities.ts` con los municipios de tu zona
2. **Categorías**: Modifica los tipos en `src/types.ts` según las necesidades de tu emergencia
3. **ID de emergencia**: Cambia `"terremoto-cali-2026"` en `convex/needs.ts` por tu evento
4. **Textos**: Los textos de la UI están en español colombiano dentro de los componentes
5. **Coordenadas iniciales**: Ajusta el centro del mapa en `src/components/MapView.tsx`

---

## 🧑‍💻 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia frontend + backend en desarrollo |
| `npm run dev:frontend` | Solo el frontend (Vite) |
| `npm run dev:backend` | Solo el backend (Convex dev) |
| `npm run build` | Compila el frontend |
| `npm run build:prod` | Compila para producción |
| `npm run deploy` | Despliega backend + compila frontend |
| `npm run lint` | Verifica tipos TypeScript |
| `npm run seed:admin` | Crea el primer administrador |

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este es un proyecto de impacto social y toda ayuda cuenta.

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/mi-mejora`)
3. Haz commit de tus cambios (`git commit -m 'Agrega mi mejora'`)
4. Push a la rama (`git push origin feature/mi-mejora`)
5. Abre un Pull Request

### Ideas para contribuir

- 🌍 Traducciones a otros idiomas
- ♿ Mejoras de accesibilidad
- 📊 Dashboard de métricas públicas
- 🔔 Notificaciones (push, email, WhatsApp)
- 📱 PWA / App nativa
- 🗺️ Mejor geocoding y autocompletado de direcciones
- 🧪 Tests automatizados
- 📖 Documentación adicional

---

## ⚠️ Notas de Seguridad

- La autenticación de admin usa un encoding XOR simple (no bcrypt). Para producción de alto riesgo, se recomienda migrar a un hash seguro usando una Convex Action con Node.js runtime.
- Las variables de entorno con secretos (`TURNSTILE_SECRET_KEY`) deben configurarse en el dashboard de Convex, nunca en archivos del repositorio.
- Los archivos `.env.local` y `.env.production` están en `.gitignore` y no deben commitearse.

---

## 📄 Licencia

Este proyecto está licenciado bajo la [Apache License 2.0](LICENSE).

---

## 🙏 Créditos

- Construido con apoyo de **inteligencia artificial** (Claude/Kiro) como herramienta de desarrollo acelerado
- Mapas por [OpenStreetMap](https://www.openstreetmap.org) contribuidores
- Backend reactivo por [Convex](https://convex.dev)
- Iconos por [Lucide](https://lucide.dev)

---

*Hecho con ❤️ para la comunidad. En emergencias, cada minuto cuenta.*
