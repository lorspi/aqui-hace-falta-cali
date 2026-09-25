/**
 * La escala de títulos de la herramienta, en un solo sitio (decisión 242, 25 de septiembre de
 * 2026). El tamaño lo fija el contenedor, no el nivel de encabezado:
 *
 * | Contenedor                                     | Título              | Subtítulo debajo    |
 * |------------------------------------------------|---------------------|---------------------|
 * | Pantalla, y cada paso de un flujo              | `rd-22`             | `rd-14` `rd-ink-2`  |
 * | Enhorabuena que cierra un flujo (excepción)    | `rd-24`/`sm:rd-28`  | `rd-14` `rd-ink-2`  |
 * | Diálogo y hoja                                 | `rd-18`             | `rd-14` `rd-ink-2`  |
 * | Sección, y el rótulo de un grupo de opciones   | `rd-16`             | `rd-13-5` `rd-ink-2`|
 * | Tarjeta o bloque                               | `rd-15`             | `rd-13-5` `rd-ink-2`|
 * | Rótulo de un grupo de campos                   | `ROTULO_GRUPO`      | —                   |
 *
 * `rd-12` `rd-ink-meta` no es un tamaño de subtítulo: es metadato y letra menuda.
 */

/** El rótulo que nombra un grupo de campos o de opciones dentro de una hoja, un diálogo o un
 *  formulario. Nunca en altas: sentence case (decisión 242). Había ocho copias de esta cadena
 *  repartidas por la maqueta, una de ellas todavía con `uppercase`. */
export const ROTULO_GRUPO = 'font-rd mb-3 text-rd-12-5 font-semibold text-rd-ink-meta';
