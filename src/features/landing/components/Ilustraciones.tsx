import React from 'react';
import { PantallaActa, PantallaCruce, PantallaReporte } from './Maquetas';

/**
 * Las piezas visuales de la landing. Una por punto, ninguna repetida.
 *
 * **Rehechas el 28 de septiembre de 2026 por una crítica de Alejandro que las invalidó enteras:**
 * «hay muchos elementos minimalistas que no son claros. piensa desde un usuario que acaba de
 * vivir una tragedia y necesita saber si RaDAR es lo que le sirve para solucionarlo. esos
 * elementos comunican poco o nada».
 *
 * Tenía razón. La primera versión copiaba la abstracción de la referencia —arcos, puntos,
 * cuadrículas— y esa abstracción funciona ahí porque le vende infraestructura a gente técnica.
 * Aquí el que mira acaba de perder su casa y tiene una sola pregunta: *¿esto me sirve?*
 *
 * Así que la regla de estas piezas cambió: **contenido legible antes que dibujo**. Cada una
 * muestra un caso completo y concreto, con nombres, cantidades y estados que se leen sin
 * esforzarse, y responde una pregunta que esa persona se está haciendo:
 *
 *   1. Reporta   → «¿puedo pedir exactamente lo que me falta, y me van a creer?»
 *   2. Conecta   → «¿alguien tiene eso y me lo va a llevar?»
 *   3. Monitorea → «¿cómo sé que llegó y que no se perdió por el camino?»
 *
 * Lo que se ve es la interfaz del producto, a tamaño que se lee, sobre una fotografía de la
 * escena. El mapa de Colombia con la ruta de Cali a Bogotá, la barra de recurso que se llenaba y
 * las tres piezas de los accesos (`UnionOrganizaciones`, `RedDeRespuesta`, `EntregaCertificada`)
 * se borraron el 6 de octubre de 2026: ya no las montaba nadie (Alejandro: «borre lo que ya no se
 * usa»).
 */

/**
 * La composición de la referencia: una fotografía de base y, encabalgada sobre ella, la pieza de
 * interfaz. Allí son esferas con burbujas de chat encima; aquí es la escena real con la tarjeta
 * del producto saliéndose del borde, para que se vea que lo de la pantalla es lo de la calle.
 *
 * Las fotografías se generaron con Higgsfield el 28 de septiembre de 2026 a pedido de Alejandro.
 * **Son ilustrativas, no documentales**: muestran qué hace RaDAR, y por eso ninguna va dentro del
 * acta de entrega, donde se leerían como prueba de una entrega que no ocurrió.
 */
export const Composicion: React.FC<{ foto: string; alt: string; children: React.ReactNode }> = ({ foto, alt, children }) => (
  <figure className="relative m-0 flex aspect-square items-center justify-center overflow-hidden rounded-rd-3xl">
    <img src={foto} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
    {/* Un velo tenue: la fotografía sigue viéndose, pero la superficie de producto encima se lee
        sin competir con ella. */}
    <span aria-hidden="true" className="absolute inset-0 bg-rd-ink/25" />
    <div className="relative scale-90 sm:scale-100">{children}</div>
  </figure>
);

/* ------------------------------------------------------------- cómo funciona ---- */

/**
 * Paso 1, Reporta. Responde: «¿puedo pedir exactamente lo que me falta, y me van a creer?».
 * Por eso lo que se ve es una necesidad real, con sus cantidades y, abajo, quién la verificó.
 */
export const NecesidadEnTerritorio: React.FC = () => (
  <Composicion foto="/images/landing/reporta.jpg" alt="Una líder comunitaria anota en su teléfono lo que hace falta en el barrio, con las casas inundadas al fondo.">
    <PantallaReporte />
  </Composicion>
);

/**
 * Paso 2, Conecta. Responde: «¿alguien tiene eso y me lo va a llevar?». Se ve el panel de
 * compatibles: la necesidad arriba y, debajo, quién tiene eso, con nombre, cantidad y distancia.
 * Hasta el 6 de octubre de 2026 el comentario hablaba de un mapa de Colombia; ese mapa ya no se
 * pintaba y se borró ese día.
 */
export const RutaEntreCiudades: React.FC = () => (
  <Composicion foto="/images/landing/conecta.jpg" alt="Voluntarios y bomberos cargan botellones de agua y cajas de insumos en una camioneta.">
    <PantallaCruce />
  </Composicion>
);

/**
 * Paso 3, Monitorea. Responde: «¿cómo sé que llegó y que no se perdió por el camino?». Se ve el
 * acta de entrega con las dos firmas: la de quien entregó y la de quien recibió.
 */
export const LineaDeEntrega: React.FC = () => (
  <Composicion foto="/images/landing/monitorea.jpg" alt="Vecinos se pasan botellones de agua en fila mientras una mujer confirma la entrega en su teléfono.">
    <PantallaActa />
  </Composicion>
);
