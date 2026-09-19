# Sistema de diseño · Radar de Ayuda

> El estándar es la unión: el sistema que ya existe en `src/index.css` y `src/components/`, más
> el sistema de diseño de Producto (RaDAR, prefijo `rd-`) con el que se construyen las maquetas
> `mockup/*`. Este documento nació con `mockup/registro-v2` y describe lo que ese bloque
> estrenó. Todo está escrito con **Tailwind sobre tokens** (`@theme`), sin hojas aparte ni valores
> arbitrarios, para que Frontend pueda fundirlo con lo suyo token a token. Regla asociada:
> `docs/INVENTORY.md` (reutilizar antes de crear).

## 1. Tokens

Los de siempre (`--color-brand-*`, `--font-sans`, `--font-body`) no cambian. Producto añadió en
`@theme` los suyos con prefijo `rd-` (origen: `Producto/css/tokens.css` del prototipo). Navy,
coral y ámbar **referencian** `brand-blue`, `brand-red` y `brand-yellow`: son los mismos valores.

| Grupo | Tokens (`--color-rd-*` genera `bg-rd-*`, `text-rd-*`, `border-rd-*`…) |
|---|---|
| Acción y tipo | `navy` (= brand-blue), `navy-hover`, `navy-soft`, `navy-line`; `coral` (= brand-red), `coral-ink`, `coral-soft` |
| Estado | `amber` (= brand-yellow), `amber-ink`, `amber-soft`, `amber-line`; `green`, `green-soft`, `green-line` |
| Texto | `ink` (principal y selección), `ink-2` (secundario), `ink-meta` (menor), `ink-3` (solo iconos y bordes: no llega a 4,5:1 como texto) |
| Superficie | `surface` (blanco), `sunken`, `fondo`, `line`, `line-soft`, `sel` |
| Tipografía | `--font-rd` (Inter) → `font-rd`; escala por píxel `--text-rd-10` … `--text-rd-32` (con `-18` para los títulos de diálogo) → `text-rd-13-5`, etc.; `--tracking-rd-*`; `--leading-rd-titular` |
| Forma | `--radius-rd-sm` 6 · `-md` 8 · `-lg` 12 · `-xl` 16 → `rounded-rd-md`… |
| Alturas | `--spacing-rd-h-sm` 32 · `-h-md` 40 · `-h-lg` 48 · `-tactil` 44 → `h-rd-h-md`, `min-h-rd-tactil`…; `--spacing-rd-hoja-1` 50dvh · `-hoja-2` 100dvh − 96 (la hoja del pin) |

Espacio: la escala de 4 de Tailwind (`gap-1` … `gap-8`). **Sin valores arbitrarios** (`[...]`)
ni hex fuera de `@theme`.

Una regla fuera de las capas, junto a la de Figtree: dentro de `.font-rd` todo va en Inter,
incluidos `h1`, `button` y `label` (la regla de Figtree es de elemento y sin capa, y le gana a
cualquier utilidad; esta va después y gana por orden).

## 2. Gramática de color (la de RaDAR, sobre estos tokens)

Cinco preguntas, en orden. La primera que aplique decide el color:

1. **¿Es una acción?** `rd-navy`.
2. **¿De qué tipo es la publicación?** `rd-navy` = oferta; `rd-coral` = necesidad.
3. **¿En qué estado está?** `rd-green` = confirmado; `rd-amber` = pendiente, en camino, en
   revisión; neutro (`rd-ink-*`, `rd-line`) = sin iniciar o en proceso.
4. **¿Está seleccionado?** Tinta (`rd-sel`). **Elegir no es actuar**: nada seleccionado va en navy.
5. **¿Es «Pedir ayuda»?** `rd-coral`. Es la única acción en coral.

**Verde solo para lo confirmado.** Es el color de la métrica norte (necesidades resueltas y
confirmadas). Lo irreversible (eliminar, salir) **no lleva color**: va como secundario o
terciario y confirma en un diálogo cuyo primario dice el verbo. `.btn-danger` se conserva para
lo que ya lo usa; lo nuevo no lo usa.

## 3. Botones · `Button`

`src/components/ui/Button.tsx`. Utilidades sobre `rd-*`; no toca `.btn-*`.

**Nivel = consecuencia de tocarlo.**

| Nivel | Cómo se ve | Cuándo | Equivalente suyo más cercano |
|---|---|---|---|
| `primario` | relleno navy, texto blanco | Crea o cambia algo que otros ven: Continuar, Crear la cuenta, Entrar, Ver cómo funciona | `.btn-primary-blue` |
| `pedir` | relleno coral | Solo «Pedir ayuda» | — |
| `secundario` | contorno `rd-line` sobre blanco | Cambia datos propios, reversible: Adjuntar, Cambiar | `.btn-secondary` (el suyo es relleno claro) |
| `terciario` | solo texto `rd-ink-2` | No cambia datos: Volver, Ir al mapa | `.btn-ghost` |

**Tamaño = peso del momento.**

| Tamaño | Alto | Letra | Cuándo |
|---|---|---|---|
| `lg` | 48 | 15 | La acción que cierra un flujo, un diálogo o una hoja |
| `md` | 40; 44 con el dedo | 13,5 | Dentro de tarjetas, filas, cabeceras y pies |
| `sm` | 32; 44 con el dedo | 12,5 | En línea dentro del cuerpo |

Radio 8 (6 en `sm`), peso 600, borde de 1 px del mismo color, `disabled` al 45 %, foco con
contorno navy de 2 px. Cruces que no existen: primario en `sm`, terciario en `lg`. **Un primario
por pantalla, tarjeta o diálogo.** En un pie en columna el primario va arriba y el terciario
debajo (`flex-col-reverse` con el orden del DOM Volver → Continuar).

Texto: sentence case, infinitivo, sin «+ », sin signos, sin emojis.

## 4. Campos · `Field`

`src/components/ui/Field.tsx`. Dos formas:

- `forma="base"`: 40 de alto, radio 8, letra 14, etiqueta visible encima (12, `rd-ink-2`).
- `forma="pildora"` con `etiquetaOculta`: el campo de registro del prototipo, 52 de alto,
  redondo, letra 15, icono a la izquierda (`rd-ink-3`, 20); la etiqueta vive para tecnologías de
  apoyo (`sr-only`) y el placeholder la repite.

En las dos: borde `rd-line`, fondo blanco; foco = borde navy + anillo de 3 px `rd-navy-soft`;
error = borde coral (`aria-invalid`), mensaje de 12,5 en coral con icono, `aria-describedby` que
enlaza ayuda (12, `rd-ink-meta`) y error. Lo opcional se dice en la etiqueta, «(opcional)». La
validación corre **al salir del campo** (`onBlur`) y el error se quita al corregir. Placeholder
en `rd-ink-meta` (el reset de Tailwind lo pondría al 50 %, por debajo de 4,5:1).

Contraseña: el control no es controlado; su valor no pasa por el estado de React ni por un
atributo `value` (quien lo use lo guarda en un `ref` y `valorInicial` lo repone al volver). El
conmutador de visibilidad es el texto «Ver / Ocultar» (`verComoTexto`, 12,5, `rd-ink-meta`) o el
ojo con `aria-label`; en ambos `aria-pressed`. El campo lleva los atributos que lo enmascaran en
Clarity, Hotjar, FullStory, LogRocket y Quantum Metric.

Checkbox: `label` de 13,5 con `accent-rd-sel` (elegir no es actuar) y 44 con el dedo.

Regla de React que importa: si dos pantallas consecutivas ponen un `Field` en la misma
posición, React reutiliza la instancia. Cada pantalla de un flujo va con `key` (ver
`RegistroPage`).

## 5. Las demás piezas del bloque

| Pieza | Archivo | Qué es |
|---|---|---|
| `Segmented` | `ui/Segmented.tsx` | Conmutador de modos (`rd-segmentado`): caja `rd-sunken` con borde y radio 12; botones de 34 (44 con el dedo), 13,5 semibold; activo en blanco con tinta y sombra fina; `role="group"` con nombre, `aria-pressed`. Los botones no se destruyen al cambiar, así que el foco se queda |
| `OptionCard` | `ui/OptionCard.tsx` | Tarjeta de opción única (`rd-evento` en fila) con `input[type=radio]` real dentro del `label`; icono en caja de 44 `rd-sunken`; seleccionada = borde y anillo de 1 px en tinta, icono relleno en tinta. Se agrupan con `role="radiogroup"` y `aria-label` |
| `Stepper` | `ui/Stepper.tsx` | `rd-progreso`: fases como pestañas + tramos. **Registro no lo usa** (el diseño final no muestra progreso); queda para pedir y ofrecer |
| `PasswordRules` | `ui/PasswordRules.tsx` | Las cinco reglas (`rd-reglas`) en dos columnas, 12, marcándose al cumplirse; `aria-live="polite"`; verde solo lo cumplido |
| `InlineNotice` | `ui/InlineNotice.tsx` | `rd-doc` / `rd-espera`: `neutro` (borde a rayas), `info` (`rd-navy-soft`), `pendiente` (`rd-amber-soft`), `hecho` (`rd-green-soft`); icono en círculo blanco de 32 |
| `Success` | `ui/Success.tsx` | `rd-exito`: círculo de 64 `rd-green-soft`, `h1` enfocable de 28, texto de 14, acciones (un primario) y enlace de pie |
| `RegistroCarrusel` | `pages/registro/RegistroCarrusel.tsx` | El panel derecho de registro (de la página, no átomo): tres láminas —mapa Leaflet decorativo con seis pines por tipo (`var(--color-rd-*)`), tarjeta de necesidad, confirmación—, texto encima, «Pausar» / «Reanudar», barras de 6 s; se detiene con el foco, el puntero y `prefers-reduced-motion` |

## 5b. Las piezas de la Radar

| Pieza | Archivo | Qué es |
|---|---|---|
| `Etiqueta` | `ui/Etiqueta.tsx` | `EtiquetaTipo` (Se necesita en coral, Se ofrece en navy), `EtiquetaEstado` (Sin iniciar · En proceso · Cubierta), `Avatar` (iniciales), `Contador` (coral, 20) |
| `Recursos` | `ui/Recursos.tsx` | El bloque de recursos: `Anillo` (verde hecho, ámbar en camino), `BarraRecurso`, filas plegables con la ficha; `iconoDe()` resuelve la taxonomía a Lucide |
| `Tarjeta` | `ui/Tarjeta.tsx` | La publicación en la lista: etiquetas, quién, dónde con la distancia debajo, recursos, sugerencia del cruce y el pie con **una** primaria («Quiero ayudar» / «Solicitar», md), «Ver en el mapa» (secundario, solo icono) y el ⋮ (Compartir · Reportar, `role="menu"`; al elegir, el foco vuelve al ⋮). `enHoja` la pega a la hoja del pin; `enProceso` la pasa a «En proceso» tras el compromiso |
| `HojaFiltros` | `ui/HojaFiltros.tsx` | Hoja lateral (≥ 1024) u hoja completa (< 1024) con Filtrar / Ordenar; chips con `input` real dentro; «Ver N resultados» (lg) |
| `HojaPin` | `ui/HojaPin.tsx` | La hoja del pin bajo 1024. Sube deslizándose (300 ms, `ease-out`) mientras el mapa vuela al pin (450 ms) y lo deja centrado en la franja libre; se queda a **media pantalla** (`h-rd-hoja-1` = 50dvh). Es una sola pieza en sus dos alturas —mismo carrusel, mismo fondo, misma tarjeta—: expandir (flecha del asa, arrastre o toque en la tarjeta) solo transiciona la altura hasta `100dvh − 96` (`h-rd-hoja-2`). Carrusel con 2+ visibles: pista de tres ranuras (`pista-rd-hoja`, `ranura-rd-hoja`; vecinas al 70 % e `inert`), puntos en píldora de tinta, arrastre lateral de 48 para cambiar; al cambiar, el mapa vuela a ese pin y su halo lo señala. × y Escape la deslizan hacia abajo antes de desmontarla |
| `Shell` | `ui/Shell.tsx` | El cascarón con sesión: side nav 232 → 64 (≥ 1024); píldora flotante de 56 con «+» (Pedir / Ofrecer), Avisos y el panel (< 1024); cajón lateral desde ☰ |
| `AvisoCorto` | `ui/AvisoCorto.tsx` | `rd-toast`: negro, redondo, a 24 del borde inferior, 13/500; icono por tipo (`neutro` gris, `ok` verde, `error` coral, `cargando` anillo); acción opcional en píldora blanca al 15 %; 3,6 s (6 con acción). `AvisosProvider` envuelve la pantalla; `useAviso()` devuelve `avisar(texto, {tipo, accion})` |
| `Dialogo` | `ui/Dialogo.tsx` | `<dialog>` + `showModal()`: 520 de ancho (16 de margen bajo 640), radio 16, padding 20, `h2` 18/600; pie con Cancelar (terciario md) y la acción que cierra (lg); bajo 640 en columna, la acción arriba. `Opciones`: chips con radio real, en fila o en columna |
| `DialogoCompromiso` · `DialogoReporte` | `ui/Dialogo*.tsx` | Los dos diálogos de la tarjeta (`comprometer()` y `reportar()` del prototipo). Enviar el reporte es **secundario**: no compromete a nadie |
| `Avisos` | `ui/Avisos.tsx` | `FilaAviso` (icono de 36 con el color del contexto, título 13,5/600, detalle 12,5, cuándo 11,5; sin leer = `rd-navy-soft` + punto), `ListaAvisos` por día, `CampanaAvisos` (botón de 36 con contador; panel de 400 colgado, `role="dialog"`, Escape devuelve el foco) |
| `MapaRadar` | `pages/radar/MapaRadar.tsx` | Leaflet + Supercluster (radio 48 sobre teselas de 256): pin de 40 con anillo de avance y sombra `drop-shadow-rd-pin`; seleccionado = halo de su color al 15 % (`after:bg-current`) y escala 1,1 con transición; grupo de 44 con anillo cónico coral/navy (`.rd-grupo`, `--p`) y conteo, tocar vuela al zoom que lo abre. Los marcadores persisten entre selecciones (solo se alternan clases: nada parpadea). `encuadrar` vuela al punto y, bajo 1024, lo deja centrado en la franja que la hoja no tapa (`tapadoAbajo`); `resaltadas` pone anillo navy a los pines sugeridos (o al grupo que los esconde) y encuadra |

## 5c. Las piezas de los flujos de publicar (`pages/flujos/comunes.tsx`)

| Pieza | Qué es |
|---|---|
| `MarcoFlujo` | La ventana del flujo: bajo 1024 la pantalla entera; desde 1024 una tarjeta de 680 centrada sobre `rd-fondo` con 24 de margen (el modal del prototipo). Progreso (`Stepper`) fijo arriba, cuerpo que desplaza, pie fijo con Volver (terciario md) y Continuar / Publicar (primario lg, apagado hasta que el paso —o el camino entero, en el último— está listo). Al cambiar de paso, el foco va al `h1` |
| `Pregunta` | `h1` de 22/600 y una línea de 14 en `rd-ink-2` |
| `TarjetasOpcion` | Cuadrícula de tarjetas con icono (`rd-eventos`): 2 por fila, 4 desde 640; marcada = borde y anillo en tinta, icono relleno en tinta |
| `ListaRecursos` · `Acordeon` · `FilaRecurso` | Buscador, un primer grupo especial (sugeridos para la emergencia en `rd-sunken`; lo registrado por la organización) y la taxonomía en acordeones (`details`), con el conteo de marcados; fila con casilla, icono de 28 y nombre |
| `Chips` | Opciones controladas como chips (radio o checkbox real dentro, 32; 44 con el dedo) |
| `Sugeridos` | Cifras que llenan el campo sin reemplazarlo; la que coincide va marcada (`aria-pressed`) |
| `CampoNumero` · `MetaPub` | Campo numérico de texto con su unidad al lado: acepta «1.500» como manda el manual; lo tecleado manda mientras se teclea y el formato se impone al salir |
| `MiniMapa` | Leaflet de 280 con el punto que se arrastra |
| `CampoFotos` | Zona punteada para elegir archivos; lista con miniatura (`objectURL`), peso y «Quitar»; los de más de 25 MB no entran y se dice |
| `FilaRevisar` | Clave · valor · «Cambiar» en una fila que es toda el botón |
| `ResumenPub` · `MetaPub` | «Se solicita» / «Se ofrece»: nombre, cifra editable, unidad, y debajo la fórmula, la marca «editada» y el detalle |
| `ExitoFlujo` | La pantalla de éxito con «Qué pasa ahora» (tres pasos, el primero hecho), las coincidencias y las dos acciones |
| `Coincidencias` (`ui/Coincidencias.tsx`) | El «Radar Match» de la app real (`RadarMatchModal`) con nuestro cruce. Vive en tres sitios: **al publicar** (la lista bajo «Qué pasa ahora»), **en cada tarjeta** (`ResumenCoincidencias`: «¡RaDAR Match activado!», «5 organizaciones necesitan alguno de estos recursos» y «Consultar») y **en un diálogo** desde la tarjeta (`DialogoCoincidencias`, con Solicitar / Quiero ayudar y Ver en el mapa, que resalta y encuadra ese pin). Al publicar, hasta 5 publicaciones a menos de 20 km que tienen (o piden) algo de lo publicado, cada una con su porcentaje (70 de base, hasta 15 por cercanía, 8 por cada recurso más; tope 98), lo que tiene en común y dos acciones: comprometerse desde ahí (abre `DialogoCompromiso`) o verla en el mapa. Primero «busca» un momento; sin coincidencias lo dice sin drama |
| `SalidaDialogo` | `<dialog>` de alerta: Seguir editando (primario) · Guardar borrador · Salir sin guardar |

## 5d. El panel («Mi organización», `pages/panel/PanelPage.tsx`)

**Se arma con lo que la cuenta hizo, no con lo que dijo ser** (Alejandro, 16 de septiembre de 2026). `ModulosCuenta` (`types/cuenta.ts`) nace en falso; `activarModulo()` lo enciende cuando el flujo publica; el panel lo lee (`utils/panel.ts`) y de ahí salen pestañas, cifras y pendientes:

| Estado | Pestañas | Resumen |
|---|---|---|
| Sin publicar nada | Resumen · Mi equipo · Datos | Dos puertas —Pedir ayuda (coral), Ofrecer ayuda (navy)— que dicen qué abre cada una; Primeros pasos; actividad vacía |
| Publicó una necesidad (`pide`) | + Mis necesidades · Entregas recibidas (n por confirmar) | Bloque «Lo que pediste»: entregas hacia ti por estado (Comprometidas, En camino, Por confirmar, Confirmadas) en cuadritos y barra. Pendiente que bloquea: confirmar lo que llegó |
| Publicó cualquiera de las dos | + Reportes: las actas de entrega, una por entrega confirmada de cualquier cara, con «Ver el acta» y ⋮ (copiar, descargar) | — |
| Publicó una oferta (`ofrece`) | + Mis ofertas · Solicitudes (n nuevas) · Seguimiento (n nuevas) | Bloque «Lo que ofreces»: solicitudes recibidas por estado (Nuevas, En camino, Por confirmar, Confirmadas) en cuadritos y barra. Pendientes: responder, asignar, recordar, ampliar la fecha |
| Las dos | Todo, lo que se pide antes que lo que se ofrece | Las ocho cifras; los pendientes de recibir primero |

Piezas: `TarjetaEntrega` (una sola tarjeta de entrega para tablero, Solicitudes y Entregas recibidas —Alejandro, 16 de septiembre de 2026: «casi todas muestran la misma información de manera diferente»—: qué · quién, cuándo, distancia · recurso y quién la lleva · pie con botones `sm` a la izquierda, primario primero, ⋮ a la derecha; nunca a lo ancho. Las mismas acciones y el mismo orden en la tabla de escritorio, y las dos tablas de entregas —Solicitudes, Entregas recibidas— con las mismas columnas: Qué · Estado · Quién lo lleva · Cierre · Acciones. El título de cada caja es el nombre de su pestaña, con el conteo en píldora; los botones de cabecera son siempre secundarios `md`), `Tabla` (decisión 184: tabla desde 1280 —rótulos 11,5 en mayúscula pequeña, filas con línea suave, cifras a la derecha—; por debajo, cada fila es una tarjeta con borde y radio 16: el título 15/600 con su meta, el chip de estado a su derecha, los datos a media fila con el rótulo encima, controles y barras a lo ancho, y las acciones como pie con línea arriba, que bajo 640 reparten el ancho), `Pestanas` (fila en posición absoluta dentro de una caja de alto fijo, para que su ancho no cuente como ancho mínimo de la página en móvil), `Caja` (borde `rd-line`, radio 12, 16 de relleno; `h2` 16/600), el Resumen en bloques (Alejandro, 16 de septiembre de 2026, sobre el patrón «Spend overview»): un bloque por cara de la cuenta —«Lo que pediste», «Lo que ofreces»— en una `Caja` normal (título 16/600 y la acción a la derecha, siempre en la misma fila: el título envuelve por dentro y el botón no baja solo), un subtítulo 12 con el chip `Conteo` («Entregas hacia ti 2», «Solicitudes recibidas 8»; el conteo va en el chip del sistema, nunca en una línea con puntos, y `Conteo` cuenta cosas de una lista, no dice estados: el avance de la publicación —cuántos recursos cubiertos o con saldo— no va en el Resumen, vive en su pestaña —Alejandro, 16 de septiembre de 2026—), cuatro cuadritos con borde —icono a la izquierda en un cuadro con borde (encima de la cifra bajo 640, donde «Comprometidas» no cabe al lado), cifra 22 siempre en tinta y rótulo; **cada cuadrito es un estado de las entregas, el mismo tramo de la barra con la misma cifra** (Comprometidas · En camino · Por confirmar · Confirmadas en lo que se pide; Nuevas · En camino · Por confirmar · Confirmadas en lo que se ofrece; las archivadas no se suman) y el icono lleva el color de ese estado (`ICONO_ESTADO`, `Kpi.estado`)— y debajo, sin contenedor, la `Barra` del sistema (la misma de los recursos y de Mis necesidades: 8 px, tramos contiguos, un color por estado y el ámbar rayado para lo que va en camino) de las entregas de esa cara por estado con la leyenda en filas alineadas (nombre a la izquierda; a la derecha la cantidad en tinta y el porcentaje en gris, en dos columnas alineadas; una columna bajo 640, dos desde 640, tres desde 1024) en los colores de las columnas del tablero (`bloquesResumen`, `tramosPorEstado`). Nada se cruza entre bloques, pendiente (icono de 36 con el color del contexto, título 13,5, detalle 12,5, la acción a la derecha), `EtiquetaCiclo`, el kanban de Seguimiento (siempre horizontal, como Trello —Alejandro, 16 de septiembre de 2026—: nunca se apila, tampoco en escritorio; bajo 640 cada columna ocupa casi todo el ancho con 40 px de asomo de la siguiente (`ranura-rd-tablero`) y desde 640 mide 320, con enganche al desplazar y `scroll-pl` para que la primera columna quede alineada con el margen de la página. Seis columnas: **Nuevas** (coral, el color de «espera tu respuesta»; solo aparece cuando hay algo nuevo, con Aceptar / No podemos) · Comprometida · En camino (ámbar) · Por confirmar (navy) · Confirmada (verde) · **Archivadas** (gris; las confirmadas pasan con «Archivar» o solas a los 30 días —`archivarViejas`, `DIAS_PARA_ARCHIVAR`— para que el tablero no acumule). En la tarjeta, tres niveles: título 13,5/600, datos 12 en gris, y un pie de una sola línea con las acciones del paso al frente —el siguiente paso es el único primario `sm`— y Reasignar / Cancelar el compromiso dentro del ⋮ (`MenuAcciones` con `flotante`). El cierre es de los dos lados con foto (`Cierre`): quien entrega certifica y quien recibe confirma; la tarjeta dice quién confirmó (`textoCierre`, sin conteo) y debajo lleva las fotos como galería de cuadritos (`TiraFotos`, hasta cuatro y «+N») que abre el `VisorFotos` con las fotos por lado —las de una entrega las ven solo las dos organizaciones de esa entrega—; en la tarjeta de una publicación, la `TiraFotos` bajo la descripción abre el mismo visor (fotos públicas). Reglas al arrastrar (`puedeMover`): lo nuevo no se arrastra, a Confirmada y Archivadas no se llega arrastrando, de a un paso, En camino exige asignado, y devolver atrás abre «¿Devolver a…?» con la consecuencia para quien pidió. Asignar abre un diálogo con el equipo, nunca un `<select>` nativo en la tarjeta (su `index.css` lo fuerza a 16 px bajo 768 contra el zoom de iOS)). La pantalla de éxito de los flujos dice qué se abrió («En tu panel ya está abierto…») con un enlace al panel.

## 5e. Directorio, Avisos y Perfil (`pages/directorio`, `pages/avisos`, `pages/perfil`)

| Pantalla | Qué es |
|---|---|
| Directorio (`/directorio-v2`) | **Sección de consulta, no de acción** (Alejandro, 16 de septiembre de 2026): pestañas Organizaciones · Comunidades con conteo; la misma barra de consulta de la Radar (`ui/Consulta.tsx`) con su hoja (lugar, qué recurso, solo verificadas con `Switch`, ordenar); y una tarjeta por entidad con la anatomía de la tarjeta de Radar (§5f): cabecera con avatar, nombre e insignia (sin chip de estado: en consulta no aporta), «Dónde está» con pin y distancia, la ficha en números (Ofrece N recursos · Pide N recursos · entregas confirmadas o personas y familias) y el contacto como ficha (Teléfono con el icono de WhatsApp si lo recibe · Dirección · Correo; **nunca el nombre de una persona**). Pie: «Ver en el mapa» (secundario con icono: abre la Radar con `?buscar=<nombre>`, todo lo suyo filtrado) y el ⋮ (WhatsApp, Llamar, Compartir, Reportar). Sin Solicitar ni Quiero ayudar: eso vive en la Radar. En escritorio, la cuadrícula de la vista Lista (2 columnas desde 1024, 3 desde 1280). |
| Avisos (`/avisos-v2`) | La misma `ListaAvisos` de la campana, completa: Todos · Sin leer (`Segmented`), «Marcar todos como leídos», la acción de cada aviso (bajo 640 baja a su línea). |
| Perfil (`/perfil-v2`) | «Configuración y perfil»: cabecera de la persona con «Ver la organización»; pestañas Tus datos (ver y editar en la misma `Caja` con `Field`), Acceso (`FilaDato` con «Cambiar»; sesiones abiertas), Notificaciones (canales por tipo de aviso; los que piden hacer algo exigen un canal fuera de RaDAR) y Seguridad (salir, cerrar en todo, eliminar; cada una confirma en `Dialogo` con el verbo en el primario y «Dejar como está»). |

## 5f. Reglas transversales de tarjetas, filas y cajas (fijadas el 16 de septiembre de 2026)

Salieron de las revisiones de Alejandro sobre el panel, el Resumen y el Directorio. Valen para
toda tarjeta, fila o caja nueva; las existentes ya las cumplen.

| Regla | Cómo | Dónde vive |
|---|---|---|
| **Una sola anatomía de tarjeta.** Quién (avatar, nombre, insignia) con el chip de estado a la derecha en la primera línea; bloques con rótulo; pie con línea arriba. | `Tarjeta` (Radar), `TarjetaEntrega` (panel), la fila del Directorio. No se inventa una tarjeta nueva por pantalla. | `ui/Tarjeta.tsx`, `panel/TarjetaEntrega.tsx`, `directorio/DirectorioPage.tsx` |
| **El ⋮ va solo, en el borde derecho.** La primaria a la izquierda (y las secundarias a su lado); el menú siempre `ml-auto`. También en la tarjeta que sale de `Tabla` bajo 1280. | `MenuAcciones` dentro de un `span.ml-auto` | todas las tarjetas y las celdas `acc` de `Tabla` |
| **Un solo tamaño de botón por pie**: `md` en tarjetas de publicación y del Directorio, `sm` en las tarjetas del panel (tablero, Solicitudes, Entregas recibidas, actas). | `Button tamano` | — |
| **Un solo nivel de rótulo dentro de una tarjeta**: el de ficha (11 medium en gris) sobre su valor (12,5 semibold en tinta). Sin rótulos de bloque («Dónde está», «Contacto»): competían con los de ficha y no decían nada que el pin o «Teléfono · Dirección · Correo» no dijeran. Los bloques se separan con la línea suave (`border-t border-rd-line-soft pt-3`). Sentence case; nunca mayúsculas espaciadas fuera de las cabeceras de tabla y de `Recursos`. | `text-rd-11 font-medium text-rd-ink-meta` · `text-rd-12-5 font-semibold text-rd-ink` | tarjeta de Radar, Directorio |
| **Ficha de datos: rótulo 11 encima, valor 12,5 semibold debajo**, en columnas que reparten el ancho. | `dl` con `min-w-31 flex-1 basis-31` | `Recursos` (ficha), Directorio (datos, contacto), acta |
| **Imagen o icono a la izquierda, alineado arriba** cuando el texto tiene dos líneas (`items-start`); centrado solo cuando el texto es de una línea. | `flex items-start gap-…` | listas del panel, Shell, `FilaRecurso`, `OptionCard`, `InlineNotice`… |
| **Los conteos van en `Conteo`**, junto al título («Mi equipo 4», «Solicitudes 2 nuevas», «Entregas hacia ti 2»). `Conteo` cuenta cosas de una lista; **nunca dice un estado** («1 de 2 cubiertos» no es un conteo: es un estado, y va con la barra o el chip de estado, en su pestaña). | `ui/Caja.tsx` | cajas y subtítulos |
| **Nada de líneas con puntos para resumir datos** («Tu necesidad · 1 de 2 recursos cubiertos»). Los puntos medios quedan solo para la línea *meta* de una tarjeta (quién · cuándo · distancia). Un dato se muestra con su componente (chip, barra, ficha), no se cuenta en una frase. | — | Resumen, cajas |
| **«N de M» en una sola línea** («2 de 4 motobombas», «330 de 900 L»); nunca la cifra arriba y «de M» debajo. | — | tablas y tarjetas |
| **Sin subtítulos que expliquen el sistema** («sin tu confirmación no cuenta como entregado»). El texto dice el dato; el sistema se explica en la guía. | manual §3 | pendientes, avisos |
| **Cabecera de `Caja`: título y acción siempre en la misma fila.** El título envuelve por dentro (el chip cae bajo el texto) y el botón no baja solo a otra línea. | `flex items-start justify-between` + `h2.min-w-0.flex-1` + acción `shrink-0` | `ui/Caja.tsx` |
| **Cuadritos y barra cuentan lo mismo.** En el Resumen cada cuadrito es un estado de las entregas, el mismo tramo de la barra con la misma cifra; el color va solo en el icono, la cifra siempre en tinta. | `ICONO_ESTADO`, `Kpi.estado`, `Barra` | Resumen del panel |
| **Una sola `Barra`** (8 px, tramos contiguos, un color por estado, ámbar rayado para lo que va en camino) para recursos, Mis necesidades, Mis ofertas y el Resumen. | `ui/Barra.tsx` | — |
| **Una sola barra de consulta** (Filtros con conteo, chips con ×, «Quitar todos», buscar) para la Radar y el Directorio. | `ui/Consulta.tsx` | — |
| **Dónde está, en un renglón**: pin + barrio o ciudad + divisor vertical + distancia. Si no cabe, el lugar termina en «…» y la distancia se queda entera; nunca en dos líneas. | `ui/Donde.tsx` | tarjeta de Radar, Directorio |
| **Un ajuste es un interruptor (`Switch`), no una casilla.** Encendido / apagado de una configuración (aparecer en el Directorio, canales de aviso, solo verificadas) va como `FilaSwitch`: rótulo y nota a la izquierda, el interruptor a la derecha, sin caja alrededor. La casilla queda para marcar cosas de una lista. | `ui/Switch.tsx` | Datos del panel, Notificaciones, hojas de filtros |
| **Contacto: «Teléfono» y el número, con el icono de WhatsApp pegado si lo recibe; correo y dirección.** Nunca el nombre de una persona como rótulo ni como valor de contacto. | `IconoWhatsApp` (`ui/IconoMarca.tsx`, el símbolo del prototipo; Lucide no lo trae) | Directorio |
| **El bloque `Recursos` tiene dos formas**: completa (cabecera que pliega + anillos + filas) en la tarjeta de Radar; `soloFilas` donde el rótulo ya lo pone la tarjeta. El Directorio no lo usa: muestra números y manda a la Radar. | `Recursos soloFilas` | — |
| **En escritorio, tarjetas en cuadrícula**, nunca columnas dentro de una fila: 2 columnas desde 1024, 3 desde 1280, todas de la altura de su fila y el pie pegado abajo (`mt-auto`). | vista Lista de la Radar, Directorio | — |
| **La cuenta en el cascarón va abajo**, encima del divisor y de «Cerrar sesión», sin fondo, igual en el side nav y en el cajón. | `ui/Shell.tsx` | — |
| **Los datos de la cuenta con sesión y las rutas del cascarón se declaran una vez** (`CUENTA_SESION`, `RUTAS_SHELL`), no en cada página. | `mocks/cuentasMock.ts` | las cinco pantallas |

## 6. Grilla y anchos

4 / 8 / 12 columnas: `grid-cols-4 gap-x-4 px-4` hasta 639, `sm:grid-cols-8 sm:px-6` de 640 a
1023, `lg:grid-cols-12 lg:gap-x-6 lg:px-8` desde 1024. Se prueba en 360, 768 y 1280 sin scroll
horizontal. Registro: formulario `lg:col-span-6` (contenido a 440, desplaza dentro de su columna)
+ panel `lg:col-span-6` (solo desde 1024).

## 7. Foco y teclado

Al cambiar de pantalla el foco va al primer campo; si no hay campo de texto, al `h1`
(`tabIndex={-1}`). Enter en cualquier campo equivale al botón principal si está habilitado.
Nunca se mueve el foco en la primera pintura (y el doble efecto de `StrictMode` tampoco lo
mueve: la guarda compara la clave de la pantalla, no un contador). Anillos de foco: contorno
navy de 2 px (`focus-visible:outline-rd-navy`), blanco sobre el carrusel.

## 8. Iconos

Lucide, un concepto un icono, `currentColor`, tamaños 16 / 20 / 24 (`h-4` / `h-5` / `h-6`),
`aria-hidden` cuando hay texto al lado.

| Concepto | Icono |
|---|---|
| Organización | `Building2` |
| Pedir ayuda · «Se necesita» | `Hand` |
| Comunidad | `Users` |
| Persona · Voluntariado | `User` |
| Ofrecer ayuda · «Se ofrece» | `HeartHandshake` |
| Documento (NIT, cédula) | `CreditCard` |
| Verificación / insignia | `ShieldCheck` |
| Cargo | `Briefcase` |
| Contraseña | `Lock` |
| Correo | `Mail` |
| Sitio web | `Globe` |
| Celular · WhatsApp | `Phone` |
| Lugar · marca de portada | `MapPin` |
| Punto de referencia | `Flag` |
| Hecho | `Check` |
| Regla pendiente | `CircleDashed` |
| Volver | `ArrowLeft` |
| Ver / ocultar contraseña | texto «Ver / Ocultar»; en la forma base, `Eye` / `EyeOff` |
| Error de campo | `CircleAlert` |
| En revisión | `Clock` |
| Agua (lámina) | `Droplet` |

## 9. Voz

Tú, nunca usted. Sentence case en títulos, etiquetas y botones («Correo electrónico», no
«Correo Electrónico»). Botones en infinitivo. Sin signos de exclamación en textos que piden o
confirman algo («Listo, tu cuenta está creada», no «¡Cuenta creada exitosamente!»). Cero emojis
en pantalla: icono + texto. Vocabulario: *necesidad*, *oferta*, *publicación*, *perfil*,
*en camino*, *entregado*, *por validar*. Toda cifra que la interfaz estime dice de dónde sale.

## 10. Para Frontend: cómo se funde con lo suyo

- Los tokens `rd-*` viven junto a los `brand-*` en el mismo `@theme`. Los que coinciden ya se
  referencian (navy, coral, ámbar). Los demás son la propuesta de Producto para neutros, escala
  tipográfica, radios y alturas; se pueden renombrar o fundir con un buscar-y-reemplazar de
  utilidades, sin tocar el JSX más que en los nombres.
- Nada de la maqueta usa `.btn-*`, `.input-base` ni `.toggle-chip`: los átomos de
  `src/components/ui/` son la versión en React de las mismas ideas. Si Frontend quiere una sola
  capa de botones, `Button` es el punto de unión (§3, columna «equivalente suyo»).
- Abierto: `.btn-primary` (slate-900) y `.btn-primary-blue` conviven en la app; la maqueta usa
  navy. Contraseña: `step1AccountAuthSchema` pide `.min(6)`, `cuentaSchema` pide 8 + reglas.
  Cuenta: el registro no pregunta qué va a hacer la persona; **los módulos del panel se
  habilitan con el uso** (`ModulosCuenta`: `pide` al publicar una necesidad, `ofrece` al
  publicar una oferta). No tiene campo en el esquema de Supabase todavía.
  La entidad (organización · comunidad; voluntariado individual fuera por ahora)
  solo pone nombre al panel; `userRoleEnum` no tiene rol para la comunidad
  (`mocks/cuentasMock.ts` lo mapea a `moderador` + `junta_vecinal` de forma provisional). Tipografía: Inter en las maquetas, Figtree / Hanken en
  el resto. Los textos de `translations.ts` en Title Case y con exclamaciones no se tocaron.
  `/registro` (`SimulatedRegisterPage`) y `/registro-v2` (`RegistroPage`) conviven.
