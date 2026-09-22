# Inventario del proyecto (Radar de Ayuda)

> Mapa vivo de lo que YA EXISTE. Consúltalo antes de crear cualquier cosa nueva.
> Regla asociada: `.kiro/steering/reuse-first.md`.
> Al agregar/renombrar/eliminar algo, actualiza este archivo en el mismo commit.

## Stack

TanStack Start · Tailwind CSS · Radix UI · Zod · Supabase · Vite · Vitest

## Estructura de carpetas (`src/`)

| Carpeta                                    | Qué contiene                                | Antes de crear aquí, busca…                         |
| --------------------------------------------| ---------------------------------------------| -----------------------------------------------------|
| `components/`                              | Componentes UI reutilizables (`.tsx`)       | modal, card, select, combobox, toast, page, bar     |
| `features/`                                | Lógica y UI por feature (`auth`, `landing`) | el feature ya existente antes de crear uno paralelo |
| `components/ui/`                           | Átomos del sistema de diseño (`Button`, `Field`, …) — ver `docs/DESIGN_SYSTEM.md` | un átomo con el mismo propósito antes de crear otro |
| `pages/`                                   | Pantallas completas de Producto (`registro/`)  | la pantalla ya existente                            |
| `types/`, `mocks/`                         | Contratos (`cuenta.ts`) y datos simulados (`cuentasMock.ts`) del patrón Mock-First | el tipo o el mock ya definido |
| `hooks/`                                   | Hooks de React                              | `use…` con el mismo propósito                       |
| `utils/`                                   | Funciones puras (sin React)                 | formateo, filtros, geocoding, lógica de estado      |
| `lib/`                                     | Clientes y servicios de datos               | acceso a Supabase / servicios                       |
| `constants/`, `content/`, `data/`, `i18n/` | Constantes, textos, datos, traducciones     | strings/valores ya definidos                        |

## Componentes existentes (`src/components/`)

Modales: `AdminDashboardModal`, `ChatbotTicketModal`, `CreateNeedModal`, `CreateOfferModal`,
`ConfirmDialog`, `LandingOfferActionModal`, `NeedDetailModal`, `OfferDetailModal`,
`PublicEditModal`, `PublicEditOfferModal`, `QuieroAyudarModal`, `RadarMatchModal`,
`ReportModal`, `UpdateStatusModal`, `WelcomeOnboardingModal`.

Selección / entrada: `CityCombobox`, `CityFormCombobox`, `CustomSelect`, `SearchAutocomplete`,
`LanguageSelector`, `Turnstile`.

Cards / listas: `NeedCard`, `OfferCard`, `ChatbotReportsList`, `ChatbotReportDetail`, `SocialCardView`.

Páginas: `AdminPanelPage`, `CifrasPage`, `LandingHomePage`, `LegalPage`, `ModeradorPage`,
`SimulatedRegisterPage`.

Layout / navegación / feedback: `Header`, `Footer`, `FilterBar`, `MobileBottomBar`,
`FloatingCreateNeedFAB`, `Toast`, `BannerDisclaimer`, `DevEnvironmentBanner`,
`WelcomeOnboardingModal`.

Mapa: `MapView`, `MiniMapPicker`, `InteractiveRadarSymbolGuide`.

> Antes de crear un nuevo modal/select/card/toast, **reutiliza o extiende** uno de estos.

## Sistema de diseño (`src/components/ui/`)

Átomos tipados, sin lógica de datos, construidos sobre las clases de `src/index.css`
(`.btn-*`, `.input-base`, `.select-base`, `.form-label`, `.toggle-chip`). Documentados en
`docs/DESIGN_SYSTEM.md`. Nacieron con `mockup/registro-v2`:

- `Button` — nivel por consecuencia (`primario` · `pedir` · `secundario` · `terciario`) × tamaño
  (`lg` · `md` · `sm`); 44 con el dedo.
- `Field` — etiqueta visible, control (`text` · `email` · `tel` · `password` · `select` ·
  `checkbox` · `textarea` · `date`), icono, ayuda y error con `aria-describedby`, soporte `deshabilitado`. La contraseña no pasa por el estado.
- `Combobox` — selector accesible con búsqueda y filtrado en tiempo real, opciones desplegables con teclado/mouse y variantes `base` y `pildora`.
- `Segmented` — conmutador de modos con `aria-pressed`.
- `OptionCard` — tarjeta de opción única con radio nativo.
- `Stepper` — fases nombradas + tramos.
- `PasswordRules` — las reglas de contraseña vivas (`REGLAS_CONTRASENA` de `registerSchema.ts`).
- `InlineNotice` — aviso en línea (`info` · `pendiente` · `hecho`).
- `Success` — pantalla de éxito al cerrar un flujo.
- `Etiqueta` — `EtiquetaTipo` (Se necesita · Se ofrece), `EtiquetaEstado` (Cubierta · En proceso · Sin iniciar), `Avatar`, `Contador`.
- `Recursos` — el bloque de recursos de una publicación: `Anillo`, `BarraRecurso`, filas plegables con ficha (`soloFilas` para solo las filas, sin cabecera ni anillos: el Directorio); `iconoDe()`, `categoriaDe()`.
- `Consulta` — las piezas de la barra de consulta, una sola para la Radar y el Directorio: `BotonFiltros` (con el conteo de aplicados), `ChipAplicado`, `QuitarTodos`, `ZonaChips` (fila que se desplaza, con › cuando desborda en móvil), `CampoBuscar`.
- `Caja` — la caja de una sección (`rd-caja`: borde, radio 12, `h2` 16/600 con la acción a la derecha, siempre en la misma fila), `Conteo` (el chip de conteo junto a un título: cuenta cosas, no dice estados) y `FilaDato` (`rd-dato`: rótulo, valor con nota y acción a la derecha). Los usan el panel y el Perfil.
- `Donde` — dónde está algo, en un renglón: pin, el lugar (con «…» si no cabe), divisor vertical y la distancia entera. La usan la tarjeta de Radar y el Directorio.
- `Switch` — el interruptor (`rd-switch`: pista 40 × 24, tinta cuando está encendido, `input` con `role="switch"`) y `FilaSwitch` (rótulo, nota y el interruptor a la derecha, toda la fila es el `label`). Para ajustes: aparecer en el Directorio, canales de aviso, solo verificadas.
- `IconoMarca` — `IconoWhatsApp`, el símbolo de WhatsApp del prototipo (Lucide no lo trae): pegado al teléfono para «también por WhatsApp» y en el ⋮.
- `Vacio` — el vacío del sistema (icono en círculo hundido, título, texto y acción). Lo usan el panel y el Directorio.
- `Barra` — la barra de avance, una sola para toda la maqueta: 8 px, pista `rd-track`, tramos contiguos con un color por estado (`CLASE_TONO`: nueva coral · comprometida gris · en camino ámbar rayado · por confirmar navy · confirmada verde · archivada línea) y `PuntoTono` para las leyendas. La usan los recursos de una publicación, Mis necesidades y los bloques del Resumen.
- `VisorFotos` — `TiraFotos` (miniaturas «Fotos · N», hasta tres y «+N») y `VisorFotos` (visor a pantalla completa en `<dialog>`: una foto, flechas y teclado, «2 de 3», quién y cuándo; recibe grupos con título para las fotos de una entrega por lado). Las fotos de prueba y sus permisos en `mocks/fotosMock.ts`: las de publicación son públicas (`Publicacion.fotos`); las de una entrega las ven las dos organizaciones de esa entrega. En el panel van como galería de cuadritos: en la tarjeta del tablero y en la columna Fotos de Entregas recibidas.
- `MenuAcciones` — el ⋮ de una tarjeta: `items` (`texto`, `icono`, `onElegir`, `tono: 'peligro'`), `tamano`, `flotante` (fijo a la ventana desde el botón, para tarjetas dentro de zonas que se desplazan; se cierra al desplazar). Lo usan la tarjeta de la Radar y el tablero de seguimiento.
- `Tarjeta` — la tarjeta de una publicación en la lista (etiquetas, quién, dónde con distancia, recursos, el resumen de coincidencias, acciones en el pie).
- `Coincidencias` — el «Radar Match» con nuestra interfaz: `Puntaje`, `ListaCoincidencias` (quién, porcentaje, distancia, qué tiene en común, Solicitar / Quiero ayudar y Ver en el mapa), `DialogoCoincidencias` (la lista en un `<dialog>`, desde la tarjeta) y `ResumenCoincidencias` (dentro de la tarjeta: «¡RaDAR Match activado!», cuántas organizaciones necesitan u ofrecen alguno de estos recursos, y «Consultar», que abre la lista).
- `HojaFiltros` — la hoja lateral de filtros (Filtrar / Ordenar, lugar, distancia, recurso por categoría, estado, solo verificadas; «Ver N resultados»).
- `HojaPin` — la hoja del pin bajo 1024: sube deslizándose mientras el mapa vuela al pin; a media pantalla y expandida es la misma pieza (carrusel de tres ranuras con vecinas asomando y puntos en las dos alturas); cambiar de publicación hace volar el mapa a su pin; asa con flecha y arrastre, × y Escape.
- `Shell` — el cascarón con sesión: side nav de 232 plegable a 64 (≥ 1024; Radar · Mi organización / Mi comunidad · Directorio), píldora flotante con «+», panel Pedir / Ofrecer y cajón lateral (< 1024); `BotonMenu`.
- `AvisoCorto` — el aviso corto abajo (`rd-toast`): `AvisosProvider` + `useAviso()`; negro, centrado, icono por tipo (`neutro` · `ok` · `error` · `cargando`), acción opcional, se va solo. Convive con `components/Toast.tsx`.
- `Dialogo` — `<dialog>` nativo con `showModal()`: título, cuerpo (un formulario), pie Cancelar + la acción que cierra (lg); bajo 640 en columna. `Opciones`: chips con radio real.
- `DialogoCompromiso` — «Quiero ayudar» / «Solicitar»: filas de recursos pendientes con cantidad, «Cuándo llega». Devuelve cuántos recursos y el cuándo.
- `DialogoReporte` — «Reportar un problema»: tres motivos (`MOTIVOS_PUBLICACION`, el directorio pasa los suyos) y «Qué viste (opcional)».
- `Tabla` — la tabla del panel (`rd-tabla`, decisión 184): tabla desde 1280; por debajo cada fila es una tarjeta (título con su meta, estado a la derecha, datos a media fila con rótulo, controles y barras a lo ancho, acciones como pie). Columnas tipadas.
- `Pestanas` — las pestañas de una pantalla (`rd-pestanas`): fila que se desplaza, activa en tinta, conteo de pendientes; `role="tablist"` con flechas.
- `Etiqueta.EtiquetaCiclo` — el paso del ciclo de una entrega (nueva · aceptada · en camino · por confirmar · confirmada) con el tono de la gramática.
- `Avisos` — `FilaAviso` (la misma fila en el panel y en la página), `ListaAvisos` (por día: Hoy · Ayer · Antes) y `CampanaAvisos` (la campana con su panel: Todos · Sin leer, «Marcar todos como leídos», «Ver todos»).

## Pantallas de Producto (`src/pages/`)

- `radar/RadarPage` — ruta `/radar-v2` (`?punto=<id>` abre esa publicación: es el enlace que se comparte; `?buscar=<texto>` abre con ese texto en el buscador, desde el Directorio): cabecera con Pedir / Ofrecer (a `RUTAS`) y la campana, consulta (Todo · Necesidades · Ofertas con conteos calculados, Filtros, buscar), mapa Leaflet con pines de anillo que se agrupan al alejar (`radar/MapaRadar.tsx`, Supercluster) y lista de tarjetas; conmutador Mapa | Lista (flotante bajo 1024; en la barra desde 1024, donde «Lista» pone las mismas tarjetas a lo ancho en cuadrícula de 2 · 3 columnas, con las acciones pegadas abajo). Las acciones de la tarjeta: compromiso, compartir (`navigator.share` o portapapeles), reporte, «Ver quién ofrece / lo necesita» (resalta y encuadra).
- `panel/PanelPage` — ruta `/panel-v2` («Mi organización»). **Se arma con lo que la cuenta hizo**: siempre Resumen · Mi equipo · Datos; publicar una necesidad abre Mis necesidades · Entregas recibidas; publicar una oferta abre Mis ofertas · Solicitudes · Seguimiento. Sin nada publicado, dos puertas (pedir, ofrecer) que dicen qué abre cada una. `?modulos=pide,ofrece` o `?modulos=ninguno` para verlo sin publicar. El Resumen abre con un bloque por cara («Lo que pediste», «Lo que ofreces»: las entregas de esa cara por estado en cuatro cuadritos y una barra que cuentan lo mismo, con el conteo en chip; `bloquesResumen`, `kpisDe` en `utils/panel.ts`) y sigue en dos niveles («Decisiones inmediatas», «Operaciones del día») con las acciones a la mano, más «Historias de impacto». Las solicitudes se aceptan, asignan (por diálogo) y mueven de estado (también arrastrándolas en el tablero de Seguimiento, que siempre va en horizontal, con Nuevas solo cuando hay y Archivadas al final); se certifican con foto, se archivan (a mano o solas a los 30 días) o se cancela el compromiso con motivo; lo recibido se confirma con foto. **Reportes** (con cualquier cara abierta): una acta por entrega confirmada o archivada, de las dos caras —código `RD-<año>-<siglas>-<n.º>`, fecha, qué, quién entregó y quién recibió, quién la llevó, cómo se confirmó, fotos de los dos lados, historia—, tabla desde 1280 y tarjeta por debajo; CTA secundario «Ver acta» abre `DialogoActa` (Acta oficial de entrega y recepción en formato institucional con membrete oficial de RaDAR, desglose bilateral de entidades y operador logístico, detalle del recurso verificado, testimonio de impacto comunitario de «lo que permitió», soportes fotográficos con visor y firmas de constancia física para impresión o exportación a PDF vía `@media print`) y el ⋮ permite descargar en PDF (`actasDe`, `resumenActas` en `utils/panel.ts`). `panel/dialogos.tsx`: `DialogoAsignar`, `DialogoCierre`, `DialogoEditarRecursoOfrecido`, `DialogoEditarRecursoPedido`, `DialogoGestionPublicacion`, `DialogoMiembro` (`DialogoRegistrarMiembro`). Las fotos de cada entrega van como galería en la tarjeta y en Entregas recibidas, y el visor las agrupa por lado.
- `directorio/DirectorioPage` — ruta `/directorio-v2` (`?vista=comunidades` abre esa pestaña; `#<id>` es el enlace que se comparte). Quién está en la red, como sección de consulta: pestañas Organizaciones · Comunidades, la barra de consulta con búsqueda a la izquierda junto a Filtros y chips, y una vista de lista estructurada con contenedor unificado y divisores claros (`divide-y divide-rd-line`): quién (avatar, insignia, tipo), dónde y a cuánto, métricas en pastillas verticales (Ofrece · Pide · entregas confirmadas · personas · familias; sale de sus publicaciones: `Publicacion.org` es la llave), contacto (Teléfono con WhatsApp · Dirección · Correo) y acciones («Ver detalle» que abre `DialogoDetalleEntidad` con los datos completos y mini-lista de sus publicaciones con botón directo al mapa por punto, y ⋮ con Ver en el mapa, WhatsApp, Llamar, Compartir, Reportar). Sin Solicitar ni Quiero ayudar. En escritorio organizado en columnas horizontales alineadas con cabecera. La propia no sale.
- `avisos/AvisosPage` — ruta `/avisos-v2`: la página de Avisos (la pestaña de la barra bajo 1024; «Ver todos» de la campana desde 1024). La misma `ListaAvisos` de la campana, completa y agrupada por día, con Todos · Sin leer (`Segmented`), «Marcar todos como leídos» y la acción que cada aviso pide. Bajo 640 la acción baja a su línea.
- `perfil/PerfilPage` — ruta `/perfil-v2` (`#datos` · `#acceso` · `#avisos` · `#seguridad`): «Configuración y perfil», lo de la persona con sesión. Cabecera con avatar, nombre, cargo, organización y «Ver la organización» (al panel, pestaña Datos); pestañas Tus datos (ver y editar en la misma caja, con `Field`), Acceso (correo y contraseña con «Cambiar», sesiones abiertas con «Cerrar»), Notificaciones (por qué canal llega cada aviso: en RaDAR siempre, WhatsApp y correo a elección; los que piden hacer algo exigen un canal fuera de RaDAR) y Seguridad (salir de la organización, cerrar sesión en todo, eliminar la cuenta; confirman en `Dialogo`). Tipos en `types/perfil.ts`, datos en `mocks/perfilMock.ts`.
- `flujos/PedirPage` — ruta `/pedir-v2`: pedir ayuda (emergencia, qué hace falta, cuántas personas con días de cobertura / viviendas / animales, cantidades a mano, dónde con mapa, contacto, fotos, revisar). Las metas salen de `utils/equivalencias.ts` y se ven cambiar mientras se responde.
- `flujos/OfrecerPage` — ruta `/ofrecer-v2` (`?insumo=&cant=&u=&origen=` precarga un aporte de donación): qué ofreces (lo registrado primero), cantidad y campos por recurso, cómo se entrega, dónde, contacto, fotos, revisar.
- `panel/TarjetaEntrega.tsx` — la tarjeta de una entrega, una sola para todo el panel (`TarjetaEntrega`; `TarjetaSolicitud` y `TarjetaRecibida` la llenan desde el estado): título = qué, meta = quién · cuándo · distancia, chip del recurso · quién la lleva, detalle, cierre y fotos, y un pie con botones `sm` a la izquierda (el siguiente paso primario primero) y el ⋮ a la derecha. `accionesDe` y `menuDe` dan las mismas acciones en el tablero, en la tabla de Solicitudes y en las tarjetas. La `Tabla` acepta `tarjeta` para usarla bajo 1280.
- `flujos/comunes.tsx` — el marco del flujo (`MarcoFlujo`: progreso fijo, cuerpo que desplaza, pie con Volver y Continuar; a ≥ 1024 una ventana de 680 sobre la Radar inerte y atenuada, del alto de la ventana y con el pie siempre a la vista), `SalidaDialogo` («¿Sales sin publicar?»), `ListaRecursos`, `Acordeon`, `FilaRecurso`, `TarjetasOpcion`, `Chips`, `Sugeridos`, `CampoNumero`, `CamposContacto`, `AlgoMas`, `MiniMapa`, `CampoFotos`, `FilaRevisar`, `ResumenPub`, `MetaPub`, `ExitoFlujo`; `useErrores` (validación al salir del campo). `flujos/useFlujo.ts`: estado, camino, avanzar y volver, publicar con guarda, borrador en `localStorage`, pregunta de salida.
- `registro/RegistroPage` — ruta `/registro-v2` (`?rapida=1` para la cuenta de un paso).
  Soporta perfiles de Organización, Comunidad y Persona natural (con datos de acceso, celular, captcha Turnstile, términos y tipo/número de documento).
  Textos en `registro/textos.ts`, camino y validación en `registro/pasos.ts`, el panel derecho
  en `registro/RegistroCarrusel.tsx` (Leaflet decorativo). Convive con
  `SimulatedRegisterPage` (`/registro`); cuál queda es decisión de Frontend.

## Tipos y mocks de Producto (`src/types/`, `src/mocks/`)

- `types/cuenta.ts` — entidad (organización · comunidad · individual: pone nombre al panel), `ModulosCuenta` (los módulos se habilitan con el uso: al publicar una necesidad, al publicar una oferta), contacto público, estado del registro.
- `types/publicacion.ts` — `Publicacion`, `Recurso`, `Tramo`, `CategoriaRecurso`, `Ubicacion`.
- `types/aviso.ts` — `Aviso`, `TipoAviso`, `AccionAviso`.
- `types/perfil.ts` — `Persona`, `Sesion`, `CanalAviso`, `PestanaPerfil`; `mocks/perfilMock.ts` — `YO`, `SESIONES`, `CANALES`.
- `types/directorio.ts` — `Entidad` (organización o comunidad con su contacto; lo que ofrece o pide sale de sus publicaciones), `ClaseEntidad`, `ConsultaDirectorio`, `OrdenDirectorio`, `EstadoComunidad`.
- `mocks/directorioMock.ts` — `ENTIDADES` (una por organización que publica en la Radar, mismas coordenadas), `ENTIDAD_PROPIA`.
- `types/panel.ts` — `Solicitud`, `EstadoSolicitud`, `OfertaPublicada`, `NecesidadPublicada`, `EntregaRecibida`, `MiembroEquipo`, `DatosOrg`, `PestanaPanel`, `Kpi` (con su `estado`), `TramoBarra`, `BloqueResumen`, `Cierre`, `Pendiente`, `Acta`.
- `mocks/panelMock.ts` — `ORG`, `OFERTA`, `SOLICITUDES`, `NECESIDAD`, `RECIBIDAS`, `EQUIPO`, `INVITADOS`, `ACTIVIDAD`, `ESTADO_SOLICITUD`, `ESTADO_RECIBIDA`, `PUERTAS`.
- `types/flujo.ts` — `Base`, `Equivalencia`, `CampoDetalle`, `DetalleRecurso`, `OfertaRecurso`, `Meta`, `Foto`, `SubPaso`, `EstadoPedir`, `EstadoOfrecer`, `CuentaFlujo`.
- `mocks/equivalenciasMock.ts` — `BASES`, `EQUIV`, `SIN_META`, `DETALLE`, `OFERTA` (la tabla de equivalencias del prototipo, tal cual, con sus fuentes).
- `mocks/flujosMock.ts` — `CUENTA_PEDIR`, `CUENTA_OFRECER` (con inventario), `EMERGENCIA`, `SUGERIDOS`, `ICONO_EVENTO`, `PREGUNTA_GRUPO`, `NOMBRE_GRUPO`, `DIAS_OPCIONES`, `TIPOS_LUGAR`, `PARA_QUIEN`, `MODOS_ENTREGA`, `RADIOS`, `ENVIOS`, `CANALES`, `TIPOS_ORG_OFERTA`, `DISPONIBLE`, `EXITO`, `estadoInicialPedir()`, `estadoInicialOfrecer()`.
- `mocks/publicacionesMock.ts` — `PUBLICACIONES` (las 15 del prototipo), `TAXONOMIA`, `ICONO_ITEM`, `UBICACION`.
- `mocks/avisosMock.ts` — `AVISOS` (los nueve de la cuenta con sesión), `DIAS`.
- `mocks/cuentasMock.ts` — `PERFILES`, `TIPOS_ORG`, `TIPOS_COM`, `DEPTOS`,
  `RUTAS`, `CUENTA_SESION` y `RUTAS_SHELL` (la cuenta con sesión y las rutas del cascarón, una sola vez para las cinco pantallas), `LAMINAS`, `LAMINA_CARTA`, `LAMINA_CIERRE`, `LAMINA_MAPA`, `estadoInicial()`.

## Hooks (`src/hooks/`)

- `useMapClustering` — clustering de puntos en el mapa.

## Utilidades (`src/utils/`)

- `analytics` · `chatbotReportUtils` · `conversationDetailUtils` · `formatters`
- `geocoding` · `offerFilters` · `reviewUtils`
- `offerStatusLogic` — validación y transiciones de estado de ofertas (lógica pura).
- `offerValidation` — validación de entrada y armado del documento de oferta (lógica pura).
- `directorio` — el Directorio (lógica pura): `publicacionesDe`, `ofertasDe`, `necesidadesDe`, `recursosDe`, `solicitudesDe`, `cifraDe`, `estadoComunidad`, `resumenPublica`, `entidadesDe`, `zonasDe`, `recursosDeVista`, `pasa`, `filtrar`, `chipsDe`, `cuantosAplicados`, `conteoTexto`. Pruebas en `tests/unit/directorio.test.ts`.
- `filtros` — el predicado de la Radar (lógica pura): `pasa`, `pasaResto`, `chipsDe`, `cuantosAplicados`, `ordenar`, `lugaresDe`; `DISTANCIAS`, `ESTADOS`, `ORDENES`.
- `cruce` — el cruce de RaDAR (lógica pura): `cruzar`, `sugerenciasDe`, `textoSugerencia`; `coincidenciasDe` y `puntajeCoincidencia` (las coincidencias al publicar, el «Radar Match» de `RadarMatchModal` con nuestro cruce: hasta 5, con porcentaje); `CRUCE_KM`.
- `equivalencias` — la conversión de RaDAR (lógica pura): `calcularMetas`, `declarado`, `detalleTexto`, `camposOferta`, `unidadOferta`, `camposTexto`, `numero`, `redondear`. Pruebas en `tests/unit/equivalencias.test.ts`.
- `cuenta` — la entidad elegida en el registro (`guardarEntidad`, `entidadActual`, `nombrePanel`; `localStorage` `rd-entidad`, `?entidad=comunidad` para verlo).
- `panel` — el panel por uso (lógica pura): `leerModulos`, `modulosGuardados`, `activarModulo` (lo llaman los flujos al publicar; `localStorage` `rd-modulos`), `pestanasDe`, `kpisDe` (entregas por estado), `bloquesResumen`, `tramosPorEstado`, `archivarViejas`, `textoCierre`, `textoCierreRecibida`, `actasDe`, `textoActa`, `resumenActas`, `siglas`, `fechaCorta`, `pendientesDe`, `pendientesCuenta`, `quedan`, `cantidadPorEstado`. Pruebas en `tests/unit/panel.test.ts`.
- `pedir` · `ofrecer` — el camino y la guarda de cada flujo (lógica pura): `caminoPedir`, `listoPedir`, `faltanCantidades`, `aDeclarar`; `caminoOfrecer`, `listoOfrecer`, `itemListo`, `textoEntrega`, `fechaCorta`.
- `publicaciones` — cuentas de RaDAR (lógica pura): `movido`, `restante`, `porcentaje`, `resumen`, `estadoRecurso`, `estadoPublicacion`, `distanciaKm`, `distanciaTexto`, `cifra`, `unidad`, `iniciales`, `tituloPublicacion`, `actorPublicacion`. Pruebas en `tests/unit/publicaciones-titulo.test.ts`.

## Esquemas (`src/features/auth/schemas/`)

- `registerSchema` — los esquemas Zod de registro. Desde `mockup/registro-v2` exporta también
  `REGLAS_CONTRASENA`, `contrasenaCumple()` y `cuentaSchema` (mínimo 8 y mezcla); los esquemas
  anteriores no cambian.

## Servicios / datos (`src/lib/`)

- `supabaseClient` — cliente Supabase (usar este, no crear otro).
- `supabaseService` — operaciones de datos.
- `reviewService` — lógica de reseñas.

## Backend

Supabase (Postgres + Edge Functions + PostgREST). El acceso desde el frontend
pasa por `src/lib/supabaseClient.ts` y `src/lib/supabaseService.ts`.
Las Edge Functions viven en `supabase/`.

> Nota: el backend Convex fue retirado del proyecto. La lógica pura que vivía en
> `convex/` (validación y estado de ofertas) se movió a `src/utils/`
> (`offerValidation.ts`, `offerStatusLogic.ts`). No reintroducir Convex.
