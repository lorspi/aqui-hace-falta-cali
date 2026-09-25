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
- `Segmented` — conmutador de modos con `aria-pressed`: pista con marco y la opción activa en píldora llena de tinta (bg-rd-sel, texto blanco). El conteo va en pastilla aparte, no suelto junto al rótulo, para que se distinga la cifra del texto.
- `OptionCard` — tarjeta de opción única con radio nativo.
- `Stepper` — fases nombradas + tramos.
- `PasswordRules` — las reglas de contraseña vivas (`REGLAS_CONTRASENA` de `registerSchema.ts`).
- `InlineNotice` — aviso en línea (`info` · `pendiente` · `hecho`).
- `Success` — pantalla de éxito al cerrar un flujo.
- `Etiqueta` — `EtiquetaTipo` (Se necesita · Se ofrece), `EtiquetaEstado` (Cubierta · En proceso · Sin iniciar), `Avatar`, `Contador`.
- `Recursos` — el bloque de recursos de una publicación: `Anillo`, `BarraRecurso`, filas plegables con ficha (`soloFilas` para solo las filas, sin cabecera ni anillos: el Directorio), `className`; `iconoDe()`, `categoriaDe()`.
- `Consulta` — las piezas de la barra de consulta y el estándar de filtro y búsqueda de toda la herramienta: `BotonFiltros` (por defecto «Filtrar y ordenar» con el conteo de aplicados; `etiqueta` lo cambia donde solo se filtra, `chevron` para un desplegable en vez de una hoja, `refBoton` para el clic afuera), `ChipAplicado`, `QuitarTodos`, `ZonaChips` (fila que se desplaza, con › cuando desborda en móvil), `CampoBuscar` (el de la barra, con su sitio por ancho) y `CampoBuscarEnBloque` (el mismo dibujo dentro de una hoja o un bloque, sin la lógica de sitio). Los tres miden 40 de alto, esquina redonda y marco en tinta al foco.
- `Caja` — la caja de una sección (`rd-caja`: borde, radio 12, `h2` 16/600 con la acción a la derecha, siempre en la misma fila; 20 de aire entre el título y el contenido; `planaMovil` para omitir caja contenedora exterior en móvil con tablas de tarjetas hijas; `plana` la quita en todos los anchos, para las secciones cuyo contenido ya se dibuja solo: Mis necesidades, Mis ofertas, Reportes, Mi equipo y Seguimiento), `Conteo` (el chip de conteo junto a un título: cuenta cosas, no dice estados) y `FilaDato` (`rd-dato`: rótulo, valor con nota y acción a la derecha). Los usan el panel y el Perfil.
- `Divisor` — el trazo vertical sutil (`h-3 w-px bg-rd-line`, `aria-hidden`) que separa dos datos en un renglón: quién y cuándo, persona y rol, lugar y distancia. Reemplaza al punto medio, prohibido en toda la herramienta; lo guarda `tests/unit/punto-medio.test.ts`.
- `TituloPublicacion` — el título de una publicación para pintar: los recursos y, con `actor`, quién la publica detrás de un divisor vertical sutil (el mismo de `Donde`). Sin punto medio. Para texto plano —nombre accesible del pin, etiqueta del ⋮, campo `titulo`— sigue `tituloPublicacion()` de `utils/publicaciones`, que une con «, de».
- `Donde` — dónde está algo, en un renglón: pin, el lugar (con «…» si no cabe), divisor vertical y la distancia entera. La usan la tarjeta de Radar y el Directorio.
- `Switch` — el interruptor (`rd-switch`: pista 40 × 24, tinta cuando está encendido, `input` con `role="switch"`) y `FilaSwitch` (rótulo, nota y el interruptor a la derecha, toda la fila es el `label`). Para ajustes: aparecer en el Directorio, canales de aviso, solo verificadas.
- `IconoMarca` — `IconoWhatsApp`, el símbolo de WhatsApp del prototipo (Lucide no lo trae): pegado al teléfono para «también por WhatsApp» y en el ⋮.
- `Vacio` — el vacío del sistema (icono en círculo hundido, título, texto y acción). Lo usan el panel y el Directorio.
- `Barra` — la barra de avance, una sola para toda la maqueta: 8 px, pista `rd-track`, tramos contiguos con un color por estado (`CLASE_TONO`: nueva coral · comprometida gris · en camino ámbar rayado · por confirmar navy · confirmada verde · archivada línea) y `PuntoTono` para las leyendas. La usan los recursos de una publicación, Mis necesidades y los bloques del Resumen.
- `VisorFotos` — `TiraFotos` (miniaturas «Fotos · N», hasta tres y «+N») y `VisorFotos` (visor a pantalla completa en `<dialog>`: una foto, flechas y teclado, «2 de 3», quién y cuándo; recibe grupos con título para las fotos de una entrega por lado). Las fotos de prueba y sus permisos en `mocks/fotosMock.ts`: las de publicación son públicas (`Publicacion.fotos`); las de una entrega las ven las dos organizaciones de esa entrega. En el panel van como galería de cuadritos: en la tarjeta del tablero y en la columna Fotos de Entregas recibidas.
- `MenuAcciones` — el ⋮ de una tarjeta: `items` (`texto`, `icono`, `onElegir`, `tono: 'peligro'`), `tamano`, `nivel`, `className`, `flotante` (fijo a la ventana desde el botón, para tarjetas dentro de zonas que se desplazan; se cierra al desplazar). Lo usan la tarjeta de la Radar, las filas del Directorio y el tablero de seguimiento.
- `Tarjeta` — la tarjeta de una publicación, la misma en el mapa, en la lista y en la hoja del pin (etiquetas, quién, dónde con distancia, recursos, lo compatible, acciones en el pie). Pie en una fila: las acciones a la izquierda, de mayor a menor jerarquía (decidir, después el mapa), y el ⋮ al extremo derecho. Pegarlos entre sí es el patrón de la fila de tabla, no el de la tarjeta. No se selecciona al tocarla: solo hover (borde navy-line y sombra leve); la selección del pin la lleva el mapa.
- `Coincidencias` — las sugerencias del cruce (el «Radar Match» de producción): `Puntaje`, `ListaCoincidencias` (quién, porcentaje, distancia/alcance, qué tiene en común, Solicitar / Ayudar y Ver en el mapa), `DialogoCoincidencias` (la lista en un `<dialog>`, desde la tarjeta y desde la tabla de recursos del Panel con `recursoFoco`), `textoSugerencias` (nomenclatura unificada: «1 compatible», «N compatibles» y tope «5+ compatibles»; «match» es el nombre del motor, nunca la palabra de la interfaz), `FilaSugerencias` (la fila con el radar de la marca, botón y chevron; `variante: 'suave' | 'relleno' | 'destacada'`, donde `destacada` —botón secundario con degradado en el marco y destello interior— la usa solo la pantalla de éxito al publicar, en degradado coral → navy con un brillo que la recorre una vez; `brillo` lo apaga, soporta `compacta` y `tamano: 'sm' | 'md'`) y `ResumenCoincidencias` (la fila dentro de la tarjeta). Al publicar (`flujos/comunes.tsx`): barrido del radar mientras busca y, si la mejor compatible es fuerte (`SUGERENCIA_FUERTE`, ≥ 90 %), ping corto (`utils/sonido.ts`) y brillo; en el panel (`MisNecesidades`, `MisOfertas`), CTA compacto de sugerencias (`tamano="sm"`) junto al menú de 3 puntos (`MenuAcciones` con Ver publicación, Editar recurso y Pausar/Reanudar recurso) cuando hay compatibles disponibles.
- `Hoja` — el armazón de toda hoja de filtros: velo, panel de 440 a la derecha, cabecera con el título (`rd-18`) y la ×, pestañas opcionales, cuerpo que se desplaza y pie fijo. Escape y el velo cierran. Lo usan `HojaFiltros` y `HojaFiltrosEquipo`.
- `HojaFiltros` — la hoja de filtros de la Radar y del Directorio sobre `Hoja` (Filtrar / Ordenar; lugar con `SelectorCiudad`, recurso por categoría, estado, solo verificadas; en Ordenar, «Más cerca» con su radio en km; «Ver N resultados»).
- `Opcion` — una opción de filtro como chip con `input` real (checkbox o radio). La usan las hojas y `SelectorCiudad`.
- `tipografia.ts` — la escala de títulos en un solo sitio y `ROTULO_GRUPO`, el rótulo que nombra un grupo de campos o de opciones (nunca en altas).
- `SelectorCiudad` — el lugar en una sola pieza: un campo `combobox` que busca por ciudad o departamento y, desplegado, ofrece el botón «Cerca de mí» (una acción), «Seleccionar todo» y las ciudades agrupadas por departamento, cada una con su casilla a la derecha (la del departamento marca todas las suyas; a medias, una raya); sin búsqueda, solo las que tienen algo, con su conteo. Varias ciudades; vacío es todas («Todas las ciudades» en el campo). No nombra el país: el territorio lo pone el dataset. Teclado con flechas, Enter o espacio y Escape. Iconos sin color, hover `rd-fondo/50`. Reutiliza `data/colombiaCities.ts` vía `utils/lugares.ts`. Lo usan la hoja de la Radar y la del Directorio.
- `HojaPin` — la hoja del pin bajo 1024: sube deslizándose mientras el mapa vuela al pin; a media pantalla y expandida es la misma pieza (carrusel de tres ranuras con vecinas asomando y puntos en las dos alturas); cambiar de publicación hace volar el mapa a su pin; asa con flecha y arrastre, × y Escape.
- `Shell` — el cascarón con sesión: side nav de 232 plegable a 64 (≥ 1024; Radar · Mi organización / Mi comunidad · Directorio), píldora flotante con «+», panel Pedir / Ofrecer y cajón lateral (< 1024); `BotonMenu`.
- `AvisoCorto` — el aviso corto abajo (`rd-toast`): `AvisosProvider` + `useAviso()`; negro, centrado, icono por tipo (`neutro` · `ok` · `error` · `cargando`), acción opcional, se va solo. Convive con `components/Toast.tsx`.
- `Dialogo` — `<dialog>` nativo con `showModal()`: título (que le da el nombre accesible por
  `aria-labelledby`), cuerpo (un formulario), pie Cancelar + la acción que cierra (lg); bajo 640
  en columna con la acción abajo, al alcance del pulgar. `accionActiva={false}` apaga la acción
  cuando no hay nada que enviar. `Opciones`: chips con radio real.
- `Casilla` — la casilla de verificación dibujada del sistema (marcada, sin marcar, a medias).
  Solo la parte visual: quien la usa pone el `input` real. La usan `SelectorCiudad` y
  `DialogoCompromiso`.
- `DialogoCompromiso` — «Ayudar» / «Solicitar» desde una tarjeta: una fila por recurso con saldo
  (casilla, nombre, lo que falta o queda, y la cantidad en una columna alineada con su unidad
  dentro del campo) y el pie del `Dialogo`. Devuelve qué y cuánto
  (`utils/compromiso.ts`: `Compromiso.partes`, `avisoCompromiso`), no solo cuántas filas.
- `DialogoReporte` — «Reportar un problema»: tres motivos (`MOTIVOS_PUBLICACION`, el directorio pasa los suyos) y «Qué viste (opcional)».
- `Tabla` — la tabla del panel (`rd-tabla`, decisión 184): tabla desde 1280; por debajo cada fila es una tarjeta (título con su meta, estado a la derecha, datos a media fila con rótulo, controles y barras a lo ancho, acciones como pie). Columnas tipadas.
- `Pestanas` — las pestañas de una pantalla (`rd-pestanas`): fila que se desplaza sobre la línea inferior, activa en tinta con la línea abajo, conteo de pendientes; `role="tablist"` con flechas, Inicio y Fin. Alto 46 en las dos vistas.
- `Etiqueta.EtiquetaCiclo` — el paso del ciclo de una entrega (nueva · aceptada · en camino · por confirmar · confirmada) con el tono de la gramática.
- `Avisos` — `FilaAviso` (la misma fila en el panel y en la página), `ListaAvisos` (por día: Hoy · Ayer · Antes) y `CampanaAvisos` (la campana con su panel: Todos · Sin leer, «Marcar todos como leídos», «Ver todos»).

## Pantallas de Producto (`src/pages/`)

- `radar/RadarPage` — ruta `/radar-v2` (`?punto=<id>` abre esa publicación: es el enlace que se comparte; `?buscar=<texto>` abre con ese texto en el buscador, desde el Directorio): cabecera con Pedir / Ofrecer (a `RUTAS`) y la campana, consulta de la decisión 70 (Todo · Necesidades · Ofertas con conteos calculados │ Filtros y chips │ el buscador a la derecha; lupa en la cabecera bajo 1024), mapa Leaflet con pines de anillo que se agrupan al alejar (`radar/MapaRadar.tsx`, Supercluster) y lista de tarjetas; conmutador Mapa | Lista (flotante bajo 1024; desde 1024 en la barra de consulta junto al segmentado, donde «Lista» pone las mismas tarjetas a lo ancho en cuadrícula de 2 · 3 columnas, con las acciones pegadas abajo). Las acciones de la tarjeta: compromiso, compartir (`navigator.share` o portapapeles), reporte, «Ver quién ofrece / lo necesita» (resalta y encuadra).
- `panel/PanelPage` — ruta `/panel-v2` («Mi organización»). **Se arma con lo que la cuenta hizo**: siempre Resumen · Mi equipo · Datos; publicar una necesidad abre Mis necesidades · Entregas recibidas; publicar una oferta abre Mis ofertas · Solicitudes · Seguimiento. Sin nada publicado, dos puertas (pedir, ofrecer) que dicen qué abre cada una. `?modulos=pide,ofrece` o `?modulos=ninguno` para verlo sin publicar. El Resumen abre con un bloque por cara («Lo que pediste», «Lo que ofreces»: las entregas de esa cara por estado en cuatro cuadritos y una barra que cuentan lo mismo, con el conteo en chip; `bloquesResumen`, `kpisDe` en `utils/panel.ts`) y sigue en dos niveles («Decisiones inmediatas», «Operaciones del día») con las acciones a la mano, más «Historias de impacto». Las solicitudes se aceptan, asignan (por diálogo) y mueven de estado (también arrastrándolas en el tablero de Seguimiento, que siempre va en horizontal, con Nuevas solo cuando hay y Archivadas al final); se marcan en camino pidiendo foto de evidencia/despacho (`DialogoCierre`), se certifican con foto (`DialogoCierre`), se archivan (a mano o solas a los 30 días) o se cancela el compromiso con motivo; lo recibido se confirma con foto (`DialogoCierre`) y en «Ayuda que recibo» pasa a **Recibido** (en acopio) y luego los líderes certifican la entrega a las familias en **Distribuido** con historia de impacto («a quién benefició y cómo los ayudó»), selector de número de personas beneficiadas (con sugerencias rápidas 10, 25, 50, 100, 200) y fotos de la entrega o planilla comunitaria firmada (`DialogoCierre`). **Reportes** (con cualquier cara abierta): una acta por entrega confirmada, distribuida o archivada, de las dos caras —código `RD-<año>-<siglas>-<n.º>`, fecha, qué, quién entregó y quién recibió, quién la llevó, cómo se confirmó, fotos de los dos lados, historia, personas beneficiadas—, tabla desde 1280 y tarjeta por debajo; CTA secundario «Ver acta» abre `DialogoActa` (Acta oficial de entrega y recepción en formato institucional con membrete oficial de RaDAR, desglose bilateral de entidades y operador logístico, detalle del recurso verificado, testimonio de impacto comunitario de «lo que permitió», conteo de beneficiarios, soportes fotográficos con visor y firmas de constancia física para impresión o exportación a PDF vía `@media print`) y el ⋮ permite descargar en PDF (`actasDe`, `resumenActas` en `utils/panel.ts`). `panel/dialogos.tsx`: `DialogoAsignar`, `DialogoCierre`, `DialogoEditarRecursoOfrecido`, `DialogoEditarRecursoPedido`, `DialogoGestionPublicacion`, `DialogoMiembro` (`DialogoRegistrarMiembro`). Las fotos de cada entrega van como galería en la tarjeta (incluso en camino y distribuida) y en Entregas recibidas, y el visor las agrupa por lado.
- `directorio/DirectorioPage` — ruta `/directorio-v2` (`?vista=comunidades` abre esa pestaña; `#<id>` es el enlace que se comparte). Quién está en la red, como sección de consulta: pestañas Organizaciones · Comunidades, la barra de consulta de la decisión 70 (Filtros y chips a la izquierda, el buscador a la derecha; lupa en la cabecera bajo 1024), y una vista de lista donde cada fila es una tarjeta independiente (borde, radio xl, hover como la tarjeta del Radar) separada por espacio, con la cabecera de columnas como rótulo desde 1280: quién (avatar, insignia, tipo), dónde y a cuánto, métricas en pastillas verticales (Ofrece · Pide · entregas confirmadas · personas · familias; sale de sus publicaciones: `Publicacion.org` es la llave), contacto (Teléfono con WhatsApp · Dirección · Correo) y acciones («Ver detalle» que abre `DialogoDetalleEntidad` con los datos completos y mini-lista de sus publicaciones con botón directo al mapa por punto, y ⋮ con Ver en el mapa, WhatsApp, Llamar, Compartir, Reportar). Sin Solicitar ni Quiero ayudar. En escritorio organizado en columnas horizontales alineadas con cabecera. La propia no sale.
- `avisos/AvisosPage` — ruta `/avisos-v2`: la página de Avisos (la pestaña de la barra bajo 1024; «Ver todos» de la campana desde 1024). La misma `ListaAvisos` de la campana, completa y agrupada por día, con Todos · Sin leer (`Segmented`), «Marcar todos como leídos» y la acción que cada aviso pide. Bajo 640 la acción baja a su línea.
- `perfil/PerfilPage` — ruta `/perfil-v2` (`#datos` · `#acceso` · `#avisos` · `#seguridad`): «Configuración y perfil», lo de la persona con sesión. Cabecera con avatar, nombre, cargo, organización y «Ver la organización» (al panel, pestaña Datos); pestañas Tus datos (ver y editar en la misma caja, con `Field`), Acceso (correo y contraseña con «Cambiar», sesiones abiertas con «Cerrar»), Notificaciones (por qué canal llega cada aviso: en RaDAR siempre, WhatsApp y correo a elección; los que piden hacer algo exigen un canal fuera de RaDAR) y Seguridad (salir de la organización, cerrar sesión en todo, eliminar la cuenta; confirman en `Dialogo`). Tipos en `types/perfil.ts`, datos en `mocks/perfilMock.ts`.
- `flujos/PedirPage` — ruta `/pedir-v2`: pedir ayuda (emergencia, qué hace falta, cuántas personas con días de cobertura / viviendas / animales, cantidades a mano, dónde con mapa, contacto, fotos, revisar). Las metas salen de `utils/equivalencias.ts` y se ven cambiar mientras se responde.
- `flujos/OfrecerPage` — ruta `/ofrecer-v2` (`?insumo=&cant=&u=&origen=` precarga un aporte de donación): qué ofreces (lo registrado primero), cantidad y campos por recurso, cómo se entrega, dónde, contacto, fotos, revisar.
- `panel/HojaFiltrosEquipo.tsx` — la hoja de filtros de Mi equipo, sobre `Hoja`: lugar, vehículo y disponibilidad como chips `Opcion`, con «Quitar todos» / «Ver N personas». Las opciones de lugar y vehículo salen del equipo, no del catálogo completo.
- `panel/TarjetaEntrega.tsx` — la tarjeta de una entrega, una sola para todo el panel (`TarjetaEntrega`; `TarjetaSolicitud` y `TarjetaRecibida` la llenan desde el estado): título = qué, meta = quién · cuándo · distancia, chip del recurso · quién la lleva, detalle, cierre y fotos, y un pie con botones `sm` a la izquierda (el siguiente paso primario primero) y el ⋮ a la derecha. `accionesDe` y `menuDe` dan las mismas acciones en el tablero, en la tabla de Solicitudes y en las tarjetas. La `Tabla` acepta `tarjeta` para usarla bajo 1280.
- `flujos/comunes.tsx` — el marco del flujo (`MarcoFlujo`: progreso fijo, cuerpo que desplaza, pie con Volver y Continuar; a ≥ 1024 una ventana de 680 sobre la Radar inerte y atenuada, del alto de la ventana y con el pie siempre a la vista), `SalidaDialogo` («¿Sales sin publicar?»), `ListaRecursos`, `Acordeon`, `FilaRecurso`, `TarjetasOpcion`, `Chips`, `Sugeridos`, `CampoNumero`, `CamposContacto`, `AlgoMas`, `MiniMapa`, `CampoFotos`, `FilaRevisar`, `ResumenPub`, `MetaPub`, `ExitoFlujo`; `useErrores` (validación al salir del campo). `flujos/useFlujo.ts`: estado, camino, avanzar y volver, publicar con guarda, borrador en `localStorage`, pregunta de salida.
- `registro/RegistroPage` — ruta `/registro-v2` (`?rapida=1` para la cuenta de un paso).
  Soporta perfiles de Organización, Comunidad y Persona natural (con datos de acceso, celular, captcha Turnstile, términos y tipo/número de documento).
  Textos en `registro/textos.ts`, camino y validación en `registro/pasos.ts`, el panel derecho
  en `registro/RegistroCarrusel.tsx` (Leaflet decorativo). Convive con
  `SimulatedRegisterPage` (`/registro`); cuál queda es decisión de Frontend.

## Tipos y mocks de Producto (`src/types/`, `src/mocks/`)

- `types/cuenta.ts` — entidad (organización · comunidad · individual: pone nombre al panel), `ModulosCuenta` (los módulos se habilitan con el uso: al publicar una necesidad, al publicar una oferta), contacto público, estado del registro.
- `types/publicacion.ts` — `Publicacion` (con `ciudad?`, id de `data/colombiaCities.ts`; sin ella, Bogotá), `Recurso`, `Tramo`, `CategoriaRecurso`, `Ubicacion` (con `ciudad?`).
- `types/aviso.ts` — `Aviso`, `TipoAviso`, `AccionAviso`.
- `types/perfil.ts` — `Persona`, `Sesion`, `CanalAviso`, `PestanaPerfil`; `mocks/perfilMock.ts` — `YO`, `SESIONES`, `CANALES`.
- `types/directorio.ts` — `Entidad` (organización o comunidad con su contacto y `ciudad?`; lo que ofrece o pide sale de sus publicaciones), `ClaseEntidad`, `ConsultaDirectorio` (`ciudades`: ids; vacío es Toda Colombia), `OrdenDirectorio`, `EstadoComunidad`.
- `mocks/directorioMock.ts` — `ENTIDADES` (una por organización que publica en la Radar, mismas coordenadas; cuatro fuera de Bogotá: Cali, Medellín, Mocoa), `ENTIDAD_PROPIA`.
- `types/panel.ts` — `Solicitud`, `EstadoSolicitud`, `SolicitudEnviada`, `EstadoSolicitudEnviada`, `OfrecimientoEnviado`, `EstadoOfrecimientoEnviado`, `OfertaPublicada`, `NecesidadPublicada`, `EntregaRecibida`, `MiembroEquipo`, `DatosOrg`, `PestanaPanel`, `Kpi` (con su `estado`), `TramoBarra`, `BloqueResumen`, `Cierre`, `Pendiente`, `Acta`.
- `mocks/panelMock.ts` — `ORG`, `OFERTA`, `SOLICITUDES`, `SOLICITUDES_ENVIADAS`, `OFRECIMIENTOS_ENVIADOS`, `NECESIDAD`, `RECIBIDAS`, `EQUIPO`, `INVITADOS`, `ACTIVIDAD`, `ESTADO_SOLICITUD`, `ESTADO_RECIBIDA`, `PUERTAS`.
- `types/flujo.ts` — `Base`, `Equivalencia`, `CampoDetalle`, `DetalleRecurso`, `OfertaRecurso`, `Meta`, `Foto`, `SubPaso`, `EstadoPedir`, `EstadoOfrecer`, `CuentaFlujo`.
- `mocks/equivalenciasMock.ts` — `BASES`, `EQUIV`, `SIN_META`, `DETALLE`, `OFERTA` (la tabla de equivalencias del prototipo, tal cual, con sus fuentes).
- `mocks/flujosMock.ts` — `CUENTA_PEDIR`, `CUENTA_OFRECER` (con inventario), `EMERGENCIA`, `SUGERIDOS`, `ICONO_EVENTO`, `PREGUNTA_GRUPO`, `NOMBRE_GRUPO`, `DIAS_OPCIONES`, `TIPOS_LUGAR`, `PARA_QUIEN`, `MODOS_ENTREGA`, `RADIOS`, `ENVIOS`, `CANALES`, `TIPOS_ORG_OFERTA`, `DISPONIBLE`, `EXITO`, `estadoInicialPedir()`, `estadoInicialOfrecer()`.
- `mocks/publicacionesMock.ts` — `PUBLICACIONES` (las 15 del prototipo, en Bogotá, más cuatro en Cali, Medellín y Mocoa para el filtro de ciudad), `TAXONOMIA`, `ICONO_ITEM`, `UBICACION` (simulada en Usme, `ciudad: 'bogota'`).
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
- `directorio` — el Directorio (lógica pura): `publicacionesDe`, `ofertasDe`, `necesidadesDe`, `recursosDe`, `solicitudesDe`, `cifraDe`, `estadoComunidad`, `resumenPublica`, `entidadesDe`, `recursosDeVista`, `pasa`, `filtrar`, `chipsDe`, `cuantosAplicados`, `conteoTexto`. Pruebas en `tests/unit/directorio.test.ts`.
- `filtros` — el predicado de la Radar (lógica pura): `pasa`, `pasaResto`, `chipsDe`, `cuantosAplicados`, `ordenar`, `conOrden`, `conDistancia` (el radio en km solo vive con «Más cerca»); `DISTANCIAS`, `ESTADOS`, `ORDENES`. Pruebas en `tests/unit/lugares.test.ts`.
- `lugares` — el lugar (lógica pura): `CIUDAD_POR_DEFECTO`, `ciudadDe`, `enCiudades`, `ciudadDeUbicacion`, `nombreCiudad`, `nombreCorto`, `nombreCiudades`, `conteoPorCiudad`, `alternarCiudades`, `gruposDeCiudades` (por departamento; sin búsqueda solo las que tienen algo). Reutiliza `data/colombiaCities.ts`. Pruebas en `tests/unit/lugares.test.ts`.
- `cruce` — el cruce de RaDAR (lógica pura): `cruzar`, `sugerenciasDe`, `textoSugerencia`; `coincidenciasDe`, `puntajeCoincidencia`, `esViableCruce`, `resolverAlcance`, `etiquetaAlcance`, `RECURSOS_VIRTUALES`, `RECURSOS_DESPACHABLES` (el «Radar Match» multimodal: hasta 5, con porcentaje ponderado de 40 a 98% según alcance local, regional, nacional o virtual); `CRUCE_KM`. Especificación técnica completa en `docs/RADAR_MATCH_SPEC.md`. Pruebas en `tests/unit/equivalencias.test.ts`.
- `equivalencias` — la conversión de RaDAR (lógica pura): `calcularMetas`, `declarado`, `detalleTexto`, `camposOferta`, `unidadOferta`, `camposTexto`, `numero`, `redondear`. Pruebas en `tests/unit/equivalencias.test.ts`.
- `sonido` — sonidos sintetizados con Web Audio, sin archivos, como la cortinilla (76): `pingSugerencia` (dos notas cortas que suben, ~350 ms), `sinMovimiento` (`prefers-reduced-motion`: sin sonido ni movimiento).
- `cuenta` — la entidad elegida en el registro y reglas de verificación (`guardarEntidad`, `entidadActual`, `nombrePanel`, `guardarVerificacion`, `verificacionActual`, `publicacionSaleVerificada`; `localStorage` `rd-entidad` y `rd-verificacion`, `?entidad=comunidad` para verlo). Especificación técnica completa en `docs/VERIFICACION_ENTIDADES_Y_PUBLICACIONES_SPEC.md`.
- `panel` — el panel por uso (lógica pura): `leerModulos`, `modulosGuardados`, `activarModulo` (lo llaman los flujos al publicar; `localStorage` `rd-modulos`), `pestanasDe`, `kpisDe` (entregas por estado), `bloquesResumen`, `tramosPorEstado`, `archivarViejas`, `textoCierre`, `textoCierreRecibida`, `actasDe`, `textoActa`, `resumenActas`, `siglas`, `fechaCorta`, `pendientesDe`, `pendientesCuenta`, `quedan`, `cantidadPorEstado`. Pruebas en `tests/unit/panel.test.ts`.
- `impacto` — métricas y telemetría para el equipo de impacto (lógica pura): `calcularTiemposPorColumna`, `calcularMetricasCertificacion`, `calcularCumplimientoOrganizaciones`, `calcularActividadRed`. Mapeado con Supabase en `docs/IMPACTO_METRICAS_SCHEMA.md`. Pruebas en `tests/unit/impacto.test.ts`.
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
