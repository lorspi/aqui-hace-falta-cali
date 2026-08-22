# 🆘 Aquí Hace Falta

**Plataforma ciudadana de código abierto para coordinar ayuda en emergencias en Colombia.**

Un mapa interactivo en tiempo real donde comunidades y organizaciones pueden registrar y encontrar necesidades activas y ofertas de ayuda: alimentos, agua, medicamentos, voluntarios, transporte, alojamiento, acopio y más. Diseñada para responder rápidamente ante desastres naturales y situaciones de emergencia.

> 🤖 **Nota:** Este proyecto ha sido desarrollado aceleradamente con asistencia de Inteligencia Artificial (Antigravity) aplicando tipado estricto, modificaciones quirúrgicas y mejores prácticas de arquitectura en un contexto de emergencia.

---

## ✨ Características Principales

- 🗺️ **Mapa Interactivo con Clustering:** Vista panorámica inicial de Colombia (`~4.57, -74.29`) con agrupación inteligente de marcadores (`supercluster`).
- 📍 **Multi-Municipio:** Cobertura para Cali y los principales municipios de Colombia.
- 🔍 **Filtros Avanzados:** Filtrado por tipo (necesidades / ofertas), categoría de ayuda, prioridad, barrio, distancia y estado de verificación.
- ✅ **Distintivos de Verificación Unificados:** Badge oficial `✓ VERIFICADO` en tarjetas y detalles.
- 📝 **Edición Ciudadana y Sección `¿QUIÉN ACTUALIZA?`:** Permite actualización de información registrando el motivo y los campos modificados.
- 🛡️ **Check de Verificación de Moderador:** Las ediciones realizadas por moderadores/staff quedan registradas con un distintivo oficial `✓` y su nombre fijado en el historial de cambios (`update_logs` / `offer_update_logs`).
- 📁 **Políticas de Archivado:** La moderación archiva (`ARCHIVED`) publicaciones en lugar de eliminarlas físicamente de la base de datos, excluyéndolas automáticamente de las vistas públicas.
- 🚨 **Banner de Emergencia Oficial:** Disclaimer con botones directos de llamada a líneas de socorro (`📞 123`, `Cruz Roja 132`, `Bomberos 119`).
- 🌐 **Soporte Multi-Idioma:** Disponible en Español (`ES`), Inglés (`EN`), Francés (`FR`) y Portugués (`PT`).
- 🛡️ **Protección Anti-Bot:** Verificación con Cloudflare Turnstile en formularios públicos.
- 👑 **Panel de Moderación:** Filtros completos por tipo, prioridad y verificación para la gestión por el equipo de administración.
- 📱 **Diseño 100% Responsivo:** Interfaz adaptable a dispositivos móviles, tablets y escritorio.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Vite 6 |
| **Backend & Base de Datos** | [Supabase](https://supabase.com) (PostgreSQL + Realtime + Auth) |
| **Mapas & Clustering** | [Leaflet](https://leafletjs.com) con OpenStreetMap y `supercluster` |
| **Iconos & UI** | Lucide React, Framer Motion |
| **Anti-bot** | Cloudflare Turnstile |
| **Túnel de Pruebas** | Cloudflare Tunnels (`cloudflared`) |
| **Hosting Producción** | Firebase Hosting |

---

## 📋 Requisitos Previos

- [Node.js](https://nodejs.org) v18 o superior
- [npm](https://www.npmjs.com/) v9 o superior
- Proyecto configurado en [Supabase](https://supabase.com)

---

## 🚀 Instalación y Desarrollo Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/lorspi/aqui-hace-falta-cali.git
cd aqui-hace-falta-cali
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` o genera tu `.env.development`:

```bash
cp .env.example .env.development
```

Define las siguientes variables en `.env.development`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase

# Cloudflare Turnstile (Test Key para desarrollo)
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA

# Microsoft Clarity (Opcional)
VITE_CLARITY_ID=tu-clarity-id
```

### 4. Iniciar el servidor local de desarrollo

```bash
npm run dev
```

La aplicación estará accesible localmente en **`http://localhost:8080`**.

### 5. (Opcional) Exponer Localhost mediante Cloudflare Tunnel

Para compartir tu entorno local con personas fuera de tu red local:

```bash
npx -y cloudflared tunnel --url http://localhost:8080
```

---

## 🌿 Flujo de Trabajo en Git

Para mantener la estabilidad en equipos de desarrollo asistidos por IA, se sigue el protocolo definido en [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md):

1. **`main` es la rama sagrada:** No se realizan commits directos en `main`.
2. **Ramas por tarea:** Crea ramas descriptivas (`feature/nombre-tarea`, `fix/solucion-bug`).
3. **Pull Requests:** Todo código se integra a `main` mediante PR revisado.

Para consultar el manual completo de Git del equipo, revisa [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md).

---

## 📁 Estructura del Proyecto

```
├── src/
│   ├── App.tsx                   # Componente principal y enrutado
│   ├── main.tsx                  # Punto de entrada de la aplicación
│   ├── types.ts                  # Definiciones de tipos TypeScript
│   ├── components/               # Componentes de la interfaz
│   │   ├── MapView.tsx           # Mapa Leaflet con panorámica de Colombia y clustering
│   │   ├── NeedCard.tsx          # Tarjetas de necesidades
│   │   ├── OfferCard.tsx         # Tarjetas de ofertas
│   │   ├── NeedDetailModal.tsx   # Modal de detalle e historial de cambios
│   │   ├── AdminPanelPage.tsx    # Panel de administración y moderación
│   │   ├── PublicEditModal.tsx   # Edición pública de necesidades (Sección 5)
│   │   ├── BannerDisclaimer.tsx  # Banner oficial de líneas de emergencia
│   │   └── ...
│   ├── hooks/                    # Hooks personalizados (useMapClustering, etc.)
│   ├── lib/
│   │   ├── supabaseClient.ts     # Cliente oficial de Supabase
│   │   └── supabaseService.ts    # Capa de datos, queries y mutations
│   ├── i18n/                     # Traducciones (ES, EN, FR, PT)
│   └── utils/                    # Geocodificación y formateadores
├── GIT_WORKFLOW.md               # Guía oficial del flujo de Git en equipo
├── GEMINI.md                     # Reglas del proyecto para asistentes de IA
├── firebase.json                 # Configuración de despliegue en Firebase Hosting
├── vite.config.ts                # Configuración de Vite dev server y allowedHosts
└── package.json
```

---

## 🌐 Despliegue a Producción

> ⚠️ **Nota:** El despliegue a producción en Firebase Hosting se realiza **únicamente bajo demanda explícita** según el protocolo del proyecto.

### Compilar y Desplegar:

```bash
# 1. Compilar bundle de producción
npm run build

# 2. Desplegar a Firebase Hosting
npx -y firebase-tools deploy --only hosting
```

La versión en producción se actualizará en **[https://aqui-hace-falta.web.app](https://aqui-hace-falta.web.app)**.

---

## 🧑‍💻 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo Vite en `http://localhost:8080` |
| `npm run build` | Compila la aplicación para producción |
| `npm run preview` | Previsualiza localmente el build de producción |

---

## 📄 Licencia

Este proyecto está licenciado bajo la licencia [Apache 2.0](LICENSE).

---

*Hecho con ❤️ para la comunidad. En emergencias, cada minuto cuenta.*
