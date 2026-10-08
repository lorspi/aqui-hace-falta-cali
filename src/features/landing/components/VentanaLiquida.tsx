import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * El cursor líquido de la landing: un radar de agua que sigue al cursor por toda la página —tres
 * anillos y un punto amarillos que se estiran y ondulan al moverse— y que, cuando se queda quieto
 * en el hero, se abre y lleva dentro una foto, otra cada vez (Alejandro, 6 de octubre de 2026:
 * «como cuando uno mete el dedo en el agua y mientras lo mueve se genera ese efecto de ondas»; esa
 * noche: «deja el dot del cursor sin la foto detrás pero cuando se queda quieto y se abre aparece,
 * pero es más como las fotos dentro del cursor, más no como que hagan parte del fondo […] un cursor
 * que parece un radar liquid, se mueve en liquid pero cuando se queda quieto se abre y dentro hay
 * un elemento visual que es una foto y sería chevere que esa foto siempre cambiara cada vez que se
 * queda quieto»; y luego: «ese cursor parece un huevo, le pondria dos anillos más para el estado de
 * inicio y en movimiento», «el cursor como tal debe ser el mismo en toda la interfaz no solo en el
 * hero […] y como ultima regla, este solo se expande en estatico cuando está en el hero»). La gota
 * con la foto pasa por detrás del texto del hero, y donde se ve la foto las letras llevan sombra.
 *
 * CÓMO ESTÁ HECHA
 * La gota es una máscara con su forma, y lo que va dentro de ella se recorta con esa máscara.
 * Mientras el cursor se mueve dentro no hay nada: de la gota solo se ve su silueta en el primer
 * anillo, y el punto. Al abrirse, dentro aparece la foto (ver LA FOTO DENTRO). Hasta la noche del 6
 * de octubre de 2026 lo de dentro era un mural de cuatro fotos fijo detrás del hero, y la gota era
 * una ventana que lo destapaba al pasar; Alejandro no la quería como fondo, sino dentro del cursor.
 *
 * La gota no es un círculo con borde ondulado: son ocho círculos —el de 32 de radio que sigue al
 * cursor y siete más pequeños que van detrás, cada uno persiguiendo al anterior— fundidos por un
 * filtro. El filtro desenfoca y después sube el contraste del canal alfa, así que donde dos
 * círculos se acercan sus desenfoques se suman y la forma se une con un cuello, como el agua. Es
 * la técnica de las metabolas, y es la que da la estela al mover y la gota redonda al parar.
 * Un ruido de turbulencia desplaza el borde: eso es la onda. Su fuerza sube con la velocidad de
 * la gota, así que quieta apenas tiembla y rápida se agita.
 *
 * LAS DOS CAPAS
 * - La del cursor, para toda la página: un SVG fijo del tamaño de la ventana, encima de todo
 *   (`z-50`, sobre el header), montado en `body` con un portal. Lleva los tres anillos y el punto.
 *   Hasta el 6 de octubre de 2026 el cursor vivía dentro del hero, y fuera de él se cortaba: sobre
 *   el panel de la sección 2, que se monta en los últimos píxeles del hero, solo salía la mitad del
 *   punto (Alejandro: «cuando está dentro del contenedor grande, solo sale el dot de la mitad»).
 * - La de la foto, solo en el hero: un SVG del tamaño del hero sobre el titular y la bajada pero
 *   debajo de los botones (`z-10` aquí, `z-20` en los botones de `LandingHero`), con la definición
 *   de la gota y, recortadas por ella, la foto y la copia del texto (ver EL TEXTO SOBRE LA FOTO).
 *   Aparecen y se van juntas, y con la gota cerrada la capa no se pinta.
 * Las dos trabajan en coordenadas del hero. La del cursor las lleva a la ventana con un solo
 * `translate` en su grupo de fuera (`origen`), la posición del hero en pantalla, que el bucle
 * reescribe cuando cambia con el scroll; así las paredes, la gota y los anillos hablan de los
 * mismos puntos aunque el cursor esté en el pie de la página.
 *
 * EL PUNTO
 * Alejandro, 6 de octubre de 2026: «al cursor ponle un punto blanco de 16px en el centro». La gota
 * es, para él, el cursor, y el punto marca su centro exacto: en el centro de la cabeza, que en
 * reposo es donde está el cursor y en movimiento va con la gota, un poco detrás de él.
 * - Mide 16 px siempre (`PUNTO`): no crece con los tamaños de la gota, porque lo que marca es un
 *   punto, no un área. Solo la entrada lo escala: nace de 0 y se va con ella.
 * - Es la misma receta líquida que la gota en chico (ver `PUNTO_COLA`), en el amarillo del logo.
 * - Va en la capa del cursor, encima de todo y sin máscara: entero en cualquier parte de la página.
 *   Hasta que el cursor salió del hero iba dentro de la máscara de la gota y junto a las paredes se
 *   apartaba de ellas para que no se le cortara la mitad; sin máscara ya no hace falta.
 * - No recibe el cursor (el SVG es `pointer-events-none`) y no cambia el cursor del sistema: la
 *   flecha sigue encima, y en reposo queda en el centro del punto.
 *
 * LOS DOS TAMAÑOS
 * La gota mide 24 mientras el cursor se mueve y también recién detenido; en el hero, si sigue
 * quieto más de un segundo, crece despacio hasta 96 y se abre con la foto dentro (Alejandro, 6 de
 * octubre de 2026: «cuando esté quieto antes de expandirse debe estar en 24px ya luego si se expande
 * como dijimos»; hasta ese momento, recién detenida pasaba a 64). Fuera del hero se queda en 24
 * aunque se quede quieto (Alejandro, ese mismo día: «este solo se expande en
 * estatico cuando está en el hero»). En el hero quiere decir con el cursor sobre algo del hero: el
 * panel de la sección 2 se monta sobre su final, y encima de él ya no se abre. Al hacer scroll la
 * gota se cierra, como al mover el cursor: lo que hay debajo se mueve. Los tamaños son de
 * Alejandro (6 de octubre de 2026:
 * «cuando esté en movimiento el cursor pasa a 40 px. cuando se detiene a 64px cuando se mantiene
 * quieto más de 1 seg aumenta a 100px»; ese mismo día, más tarde, «hasta 500px», luego
 * «demasiado gigante, dejalo máximo en 320 px», y ya con los tres anillos: «el tamaño del cursor
 * también puedes ponerlo más pequeño ahora, al menos al inicio puede ser de 24 y en movimiento, y
 * que crezca a máximo 96 px»). Esa regla manda sobre las anteriores: la de 84 y, del mismo día,
 * la de 64 que crecía a 128 en reposo. De aquel pedido se queda lo que le gustó: «apenas uno entra
 * en la página como que la "gota" se expande de 0 a 100%», así que al entrar sigue naciendo de
 * nada, y nace en 24.
 * - Quieto es que el cursor no se alejó más de 3 px de donde está desde hace más de un segundo
 *   (`MOVER_PX`, `ESPERA`).
 * - De 24 a 96 va una curva que arranca y llega despacio (`suave`), en dos segundos.
 * - De vuelta a 24 al moverse va un resorte de unos 300 ms que se pasa menos de un píxel y vuelve,
 *   como el agua. Arranca con la velocidad que lleve, así que moverse a mitad de un cambio no da
 *   un salto.
 * Todo lo demás escala con ella —la estela y el empuje de las paredes— menos la separación de los
 * anillos, que se queda en 12 (ver LOS ANILLOS), y las regiones de la máscara y de los filtros
 * siguen a sus círculos, así que a 96 nada se recorta.
 *
 * EL BORDE NÍTIDO
 * Antes salía semidifuminado (Alejandro, 6 de octubre de 2026: «que no se vea como con los bordes
 * semi difuminados»): el filtro terminaba en un desenfoque de 1,2 para tapar los dientes que dejaba
 * la onda. Esos dientes vienen de que Chrome desplaza tomando el píxel más cercano, sin mezclar
 * vecinos: un borde ya recortado se mueve a saltos de un píxel. Ahora la onda va antes del umbral,
 * sobre el desenfoque todavía suave, con un alisado de 1,5 en medio que borra esos saltos; el
 * umbral viene al final y es él quien decide el borde, así que el alisado no lo ablanda. Queda un
 * borde de un píxel de transición: limpio, sin escalera y sin halo (comparado en capturas sin
 * suavizar ampliadas ×4, el 6 de octubre de 2026).
 *
 * LOS ANILLOS
 * «Poner un círculo al rededor de ese primer elemento y que tenga el mismo efecto de fluidez al
 * momento de mover el cursor» (Alejandro, 6 de octubre de 2026). El primero es un trazo de 1,5 px a
 * 12 px de la gota, sea del tamaño que sea —ni la separación ni el trazo crecen con ella—. Con él
 * solo y el punto dentro, el cursor «parece un huevo», y esa noche pidió «dos anillos más para el
 * estado de inicio y en movimiento»: van a 10 y a 20 px por fuera del primero, cada uno más tenue
 * (`ANILLOS`), y se apagan mientras la gota se abre con la foto, al mismo paso que ella aparece. Con
 * la gota abierta queda solo el primero, abrazando la foto. Tres círculos concéntricos y un punto:
 * el radar del logo.
 * Son el amarillo del logo, #FBB000, como el punto (Alejandro, 6 de octubre de 2026: «el dot y el
 * anillo del liquid que sean amarillo FBB000»); ese mismo día el primero fue antes violeta y navy.
 * Cada uno tiene sus propios ocho círculos y su propio filtro con el mismo desenfoque, la misma
 * onda y el mismo umbral, así que se funden y se estiran igual que la gota. Los tres persiguen a
 * la cabeza de la gota por la misma estela, no al cursor: llegan después, y al parar la gota queda
 * centrada dentro. No se puede sacar los tres del mismo campo con tres umbrales: a 20 px del borde
 * el campo desenfocado ya vale menos de 0,01 y el umbral no tendría con qué trabajar.
 * El trazo sale de cortar el campo dos veces: un umbral da la forma por fuera y otro un poco más
 * alto da la misma forma 1,5 px más adentro; lo que queda entre los dos es el anillo. La
 * alternativa obvia —erosionar la forma y restarla— salió de 2,1 a 2,9 px en la prueba del 6 de
 * octubre de 2026: Chrome redondea el radio de la erosión a píxeles enteros y la hace con un
 * cuadrado, que adelgaza menos en diagonal.
 * Van en la capa del cursor, encima de todo, también del texto y de los botones del hero: son el
 * cursor. Hasta que el cursor salió del hero, el anillo iba por debajo de las letras.
 * Dentro del panel de la sección 2 el cursor es solo el punto (Alejandro, 6 de octubre de 2026:
 * «cuando el cursor estuviera dentro de esta sección 2 (dentro del contenedor específicamente) solo
 * apareciera el dot del centro, sin los anillos»). Lo marca el propio panel con
 * `data-cursor-punto`, así este archivo no conoce sus clases. Al entrar, los tres anillos se
 * recogen hacia el punto hasta la mitad de su aire y se apagan, en el mismo paso que la entrada de
 * la gota (`anillosVistos`); al salir vuelven igual.
 * Sobre un eco del radar de la sección 4 (`data-cursor-eco`, 7 de octubre de 2026) el cursor «lo
 * detecta»: sus anillos laten, abriéndose hasta 6 px más en un pulso de 0,9 s (`latido`). Es la
 * idea de esa sección: el cursor es otro radar.
 *
 * EL TEXTO SOBRE LA FOTO
 * Dentro de la gota las letras oscuras quedaban sobre la foto y no se leían (hallazgo H3 de la
 * revisión del 6 de octubre de 2026). Se probó que el agua rodeara el texto como si fuera aceite y
 * no gustó. Alejandro, el mismo día: «Mejor que quede como al inicio, que pase por detrás del texto
 * y si algo, que genere un efecto de color contraste a la imagen que se visualiza detrás. o sea
 * que cuando el liquid pase detrás la tipo cambie de color para que genere contraste». Así que la
 * gota vuelve a pasar libre por detrás del titular, la bajada y los botones, y donde se ve la foto
 * el texto va encima, en una copia. Desde el tema oscuro la copia ya no cambia de color —el texto
 * es claro y las fotos son cálidas y oscuras—: lo que pone es la sombra (ver `SOMBRA`). Los botones
 * no cambian: tienen fondo propio y la gota pasa por debajo.
 * - El cambio sigue la forma de la gota al píxel porque es la misma máscara: una copia del texto,
 *   en el SVG de encima, recortada por ella. Una letra a medio cubrir queda partida justo en el
 *   borde líquido; fuera de la gota la copia no pinta nada y el texto queda como está.
 * - Debajo de la copia, en la misma máscara, va la foto, que es opaca: tapa entera la letra de
 *   verdad. Con la copia sola encima, el borde suavizado de cada letra dejaría asomar el de la de
 *   debajo, un contorno sucio alrededor de cada letra. Y la máscara se usa una sola vez por cuadro.
 * - La copia aparece y se va con la foto: con la gota cerrada no hay foto que tapar, y su sombra
 *   se vería sobre el fondo.
 * - No se invierte el color (`mix-blend-mode: difference`): eso pinta las letras de colores que
 *   nadie eligió y en los medios tonos de la foto las deja ilegibles.
 * - La copia se hace del DOM real, nodo por nodo (`copiarTexto`): las mismas clases en una caja del
 *   mismo ancho, así que parte en los mismos renglones en cualquier ancho y al cambiar el tamaño.
 *   Se rehace si el texto cambia (el idioma). Los encabezados pasan a `div` —un solo h1 por
 *   página—, los botones no se copian, y la copia es `inert` dentro de un SVG `aria-hidden`: no se
 *   lee, no se enfoca, no se selecciona y no recibe el cursor. El texto de verdad sigue en su
 *   sitio, entero, para los lectores de pantalla.
 * - En las zonas claras de las fotos la letra clara sola bajaba de 3:1; por eso la copia lleva una
 *   sombra sutil, que como ella solo existe dentro de la gota (medido el 6 de octubre de 2026; ver
 *   `SOMBRA`).
 *
 * LOS BORDES DEL HERO
 * La foto no se desvanece arriba ni abajo. Ese desvanecido era el degradado que Alejandro seguía
 * viendo donde el header se une con la sección (6 de octubre de 2026: «yo sigo viendo el degradado
 * en el header, en la parte inferior cuando se conecta con la sección 1»): junto al header la foto
 * de la gota se fundía a crema. Arriba no hace falta nada: el header es opaco y va encima, así que
 * la gota pasa por debajo de él y llega nítida hasta su borde. Abajo, el borde del hero y el panel
 * de la sección 2, que se monta sobre sus últimos píxeles, son paredes: la gota abierta no entra en
 * ellas y se redondea contra ellas, así que nunca se ve cortada en plano. Antes el panel la tapaba,
 * y su borde recto la cortaba como un cuchillo (capturas del 6 de octubre de 2026). Las paredes son
 * lo único que queda de aquel aceite: el texto ya no repele.
 * Solo valen para la gota abierta. Desde que el cursor recorre toda la página, una pared que lo
 * empujara o se lo comiera al moverse dejaría el cursor lejos de la flecha o cortado sobre el
 * panel, así que su peso sigue a la apertura (`abierta`): nada con la gota cerrada, entero desde
 * los 88 px, en los dos lados. Son dos piezas:
 * - El empuje. Cada pared es una caja que empieza 16 px antes de lo que tapa (`HOLGURA`). Cada
 *   círculo persigue su meta de siempre, pero si esa meta cae dentro de una pared persigue el punto
 *   de salida más cercano, a media gota del borde (`alejar`): la gota se desliza por encima de la
 *   pared en vez de meterse.
 * - Las metabolas negativas. El empuje mueve la gota, pero no impide que su borde roce la pared. El
 *   filtro pinta las mismas cajas, las desenfoca igual que a los círculos y resta ese campo del de
 *   la gota antes de la onda y del umbral. Así el contorno contra la pared es borde de agua
 *   —redondeado, con la misma onda—, nunca un recorte recto. El primer anillo resta el mismo campo;
 *   los otros dos, que con la gota abierta no se ven, no llevan paredes.
 * Las paredes van en coordenadas del hero y se miden al montar, al cambiar su tamaño, al entrar el
 * cursor y cuando el scroll se detiene, nunca en cada cuadro: lo que tapa el hero por abajo cambia
 * con el scroll (ver `medirParedes`).
 *
 * LA FOTO DENTRO
 * - Va con la gota, no con la página: un cuadrado de 128 (`LADO_FOTO`, la gota abierta de 96 con
 *   aire para su onda y para cuando se aplasta contra una pared) centrado en la cabeza de la gota.
 *   Si la gota se mueve, la foto se mueve con ella.
 * - Aparece mientras la gota se abre y se va mientras se cierra: su opacidad sigue al tamaño, de
 *   nada a 38 a entera a 88 (`DESDE_FOTO`, `ABRE_FOTO`), así que en 24 no hay foto, y al moverse
 *   otra vez, en los 300 ms que tarda en volver a 24, se apaga.
 * - Cada vez que se abre es otra (`cambiarFoto`), en el orden de `FOTOS` y vuelta a empezar. Solo
 *   cambia si se abre desde cerrada: si el cursor se mueve y vuelve a parar antes de que la gota se
 *   cierre del todo, la foto que todavía se ve se queda, para no cambiar una foto a la vista.
 * - Las cuatro se cargan al montar, una encima de otra, y solo la que toca está visible: así la
 *   primera vez que se abre cada una no hay un cuadro vacío mientras baja del servidor.
 *
 * LAS FOTOS
 * Las cuatro del registro aspiracional, en el orden del recorrido de RaDAR: alguien reporta, se
 * carga la ayuda, se entrega, se recibe. Al abrirse una tras otra cuentan ese recorrido. Las otras
 * cuatro de la carpeta —escombros, polvo, un edificio colapsado— cuentan la tragedia y no la
 * reconstrucción.
 *
 * SOLO ESCRITORIO
 * Se monta con 1024 o más, puntero fino y sin movimiento reducido. En cualquier otro caso no
 * existe: no pinta nada, no escucha el cursor, no mide las paredes, no copia el texto y no
 * descarga las fotos. En móvil no hay cursor y el hero es el fondo liso, como pidió Alejandro.
 *
 * RENDIMIENTO
 * Los filtros solo trabajan sobre el recuadro de sus círculos, y su región y la de la máscara se
 * recortan a ese recuadro en cada cuadro, así que la foto solo se pinta dentro de la gota. Con la
 * gota cerrada la capa de la foto no se pinta (`display: none`) y no se escriben los círculos de la
 * gota; con la gota abierta no se pintan los dos anillos de fuera. El bucle de animación corre
 * mientras el cursor está en la página o la gota termina de desvanecerse; después se detiene.
 * Mientras corre, solo escribe los atributos cuyo texto cambió: con el cursor quieto y la
 * gota ya asentada —en 24 o, tras crecer, en 96— solo mueve la deriva del ruido, y la página
 * deja de repintar en cada cuadro (hallazgo H22 de la revisión del 6 de octubre de 2026; ver
 * `escribir`). El crecer sí repinta en cada cuadro, los dos segundos que dura. La copia del texto
 * no se toca en el bucle: la recorta la misma máscara que ya se movía. Moviendo la gota sobre el
 * texto, la capa de encima completa, sin el segundo anillo, sin la copia y sin su sombra dieron lo
 * mismo, 60 cuadros por segundo sin un cuadro largo (Chrome sin pantalla a 1440 × 900, tres
 * vueltas de 2 s cada una, el 6 de octubre de 2026). El punto blanco tampoco cuesta: 60,4 con él y
 * 60,3 sin él, sin un cuadro largo (cinco vueltas, el mismo día). Medir las paredes pregunta
 * unas 600 veces qué hay encima del hero y tarda unos 4 ms (medido a 1440 × 900 el 6 de octubre de
 * 2026), y solo se hace en los momentos que se listan en LOS BORDES DEL HERO, nunca en el bucle.
 *
 * LOS HERCIOS
 * Las persecuciones, la onda y el crecer de la gota se ajustaron mirando una pantalla de 60 Hz.
 * Cada cuadro avanza según el tiempo que de verdad pasó desde el anterior, así que en una de 120
 * o 144 Hz la gota tarda lo mismo en llegar, la estela se estira igual, el anillo va igual de
 * atrás y la onda se agita igual (hallazgo H15 de la revisión del 6 de octubre de 2026; ver
 * `alTiempo` y `alTrecho`). El crecer en reposo va por reloj y la vuelta a 24 es un
 * resorte en pasos fijos de 1/240 s: tampoco dependen de los hercios.
 */

const FOTOS = [
  { src: '/images/landing/reporta.jpg', encuadre: 'xMidYMid slice' },
  { src: '/images/landing/conecta.jpg', encuadre: 'xMidYMid slice' },
  /* La de la caja es panorámica y lo importante está a la derecha —la entrega y las sonrisas—;
     centrada, el cuadrado de la gota mostraría el valle y no a las personas. */
  { src: '/images/landing/hero.jpg', encuadre: 'xMaxYMid slice' },
  { src: '/images/landing/monitorea.jpg', encuadre: 'xMidYMid slice' },
] as const;

/* La forma de la gota en la escala de 64: la cabeza de 32 de radio y la estela, que baja en la
   misma proporción que tuvo siempre (la de antes de pasar a 84). Los dos tamaños escalan esta
   misma forma. */
const RADIOS = [32, 27, 23, 19, 15, 12, 9, 6];
const DIAMETRO_BASE = RADIOS[0] * 2;

/* Los dos tamaños, como fracción de esa forma de 64 (ver LOS DOS TAMAÑOS arriba): 24 mientras se
   mueve o recién detenida, 96 abierta. */
const MOVIENDO = 24 / DIAMETRO_BASE;
const REPOSO = 96 / DIAMETRO_BASE;

/* Cuándo el cursor se movió. Cuenta como moverse alejarse más de 3 px de alguna de las huellas de
   los últimos 150 ms. Los 3 px son el temblor de la mano: un trackpad con el dedo apoyado manda
   movimientos de un píxel, y sin ese margen la gota se cerraría sin que nadie la moviera. Los 150
   ms son el medio de lo que se le propuso a Alejandro (de 120 a 180): un ratón manda un movimiento
   cada 8 a 16 ms, así que es un silencio que solo deja el que paró. Y como se mide la distancia y
   no los eventos, lo más lento que cuenta como moverse son 20 px por segundo.
   Quieto: más de un segundo sin moverse, como lo pidió. Ahí empieza a crecer, y llega a 96 en dos
   segundos («lentamente», en su primer pedido). */
const MOVER_PX = 3;
const DETENER_MS = 150;
const ESPERA = 1000;
const CRECER_MS = 2000;

/* La curva del crecer: arranca y llega con velocidad cero, así que la gota empieza a crecer sin
   un tirón y se asienta en 96 sin pasarse. */
const suave = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);

/* La vuelta a 24 al moverse: un resorte con frecuencia 14 y amortiguación 0,8, el mismo que ya
   devolvía la gota a su tamaño al moverla. Simulado el 6 de octubre de 2026: de 96 a 24 da 61,6 a
   los 100 ms, 32,9 a los 200 y 24,2 a los 300, con un mínimo de 23,2. Ese poco de más es lo que
   lo hace líquido; con amortiguación 1 se detiene en seco.
   Arranca con la velocidad que llevaba el tamaño, así que moverse a mitad del crecer no da un
   salto. Se integra en pasos fijos de 1/240 s para que no dependa de los hercios. */
const RESORTE_FRECUENCIA = 14;
const RESORTE_AMORTIGUA = 0.8;
const PASO_RESORTE = 1 / 240;

/* El anillo: 12 px de aire entre la gota y el trazo, y 1,5 px de trazo, con cualquier tamaño de
   la gota (Alejandro, 6 de octubre de 2026: «la distancia entre el liquid y el anillo no varía. o
   sea siempre es el mismo, no es proporcional al crecimiento del componente»; hasta entonces el
   aire crecía con ella, 7,5 a 40 y 19 a 100). El grosor lo decide el filtro, no el radio. Cada
   círculo suyo es el de la gota más esas dos medidas, así que el anillo es la silueta de la gota
   agrandada: al estirarse ella, él se estira igual. */
const AIRE = 12;
const TRAZO = 1.5;

/* Los tres anillos del radar (ver LOS ANILLOS): el aire entre la gota y cada trazo, y lo que se ve
   cada uno. El primero es el de siempre; los dos de fuera van 10 px más allá cada uno y más
   tenues, para que se lean como ondas del mismo radar y no como tres cursores. Con la gota de 24
   miden 51, 71 y 91 de diámetro. */
const PASO_ANILLO = 10;
const ANILLOS = [
  { aire: AIRE, opacidad: 1 },
  { aire: AIRE + PASO_ANILLO, opacidad: 0.6 },
  { aire: AIRE + PASO_ANILLO * 2, opacidad: 0.32 },
];

/* El diámetro del punto del centro (ver EL PUNTO): los 16 px que pidió Alejandro el 6 de octubre
   de 2026, fijos con cualquier tamaño de la gota. */
const PUNTO = 16;

/* El punto líquido (Alejandro, 6 de octubre de 2026: «el circulo dentro del liquid, que tambien
   tenga la misma animación liquid»). Ya no es un círculo rígido: es la misma receta que la gota en
   chico. `PUNTO_COLA` son los radios de la cabeza —la de 16— y de dos gotitas que la persiguen con
   `SIGUE_PUNTO`: quietas se funden bajo la cabeza y el punto es redondo; al moverse se quedan atrás
   y el punto se estira en lágrima. Desenfoque, onda y umbral los funden y le ondulan el borde.
   `ONDA_PUNTO` es la fracción de la onda de la gota que recibe: entera, sobre un radio de 8, lo
   deshacía. `FRECUENCIA_PUNTO` es más alta que la de la gota para que en un contorno tan corto
   quepan varias ondas y no una sola joroba. */
const PUNTO_COLA = [1, 0.72, 0.5];
const SIGUE_PUNTO = 0.38;
const DESENFOQUE_PUNTO = 2.5;
const ONDA_PUNTO = 0.32;
const FRECUENCIA_PUNTO = 0.07;

/* El umbral del filtro. Con el desenfoque de 9, el borde de un disco de radio R cae en el 0,46 del
   campo justo sobre R: así la gota mide lo que dicen sus radios y el anillo queda a 12 de ella.
   Calculado integrando el disco desenfocado el 6 de octubre de 2026: con la cabeza de 32 el borde
   cae 0,4 px por dentro y con la de 64, 0,3 por fuera, menos que la transición del borde. La
   pendiente de 24 hace que el alfa pase de 0 a 1 en un píxel, porque allí el campo cambia 0,043
   por píxel con cualquiera de los dos tamaños: más pendiente dejaría el borde en escalera a 1×,
   menos lo volvería a difuminar. */
const DESENFOQUE = 9;
const NIVEL = 0.46;
const PENDIENTE = 24;
/* El borde de dentro del anillo: 1,5 px de campo más arriba (1,5 × 0,043). */
const NIVEL_DENTRO = NIVEL + TRAZO * 0.043;
const umbral = (nivel: number) => `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${PENDIENTE} ${(0.5 - PENDIENTE * nivel).toFixed(3)}`;

/* Las paredes de abajo. `HOLGURA` es cuánto antes de lo que tapa empieza cada pared: la gota se
   detiene a 16 px del borde del hero y del panel de la sección 2, y la onda más fuerte la acerca
   11, así que nunca llega a cortarse contra ellos. `EMPUJE` es dónde queda el centro de cada
   círculo empujado: a media gota del borde de la pared; tres cuartos de la gota siguen a la vista y
   el resto se funde contra ella. `REPELE` es el peso del campo de la pared al restarlo: con 1,
   dentro de la pared el agua nunca pesa más que ella y no queda foto; con más, el agua se detendría
   lejos, antes de la holgura.
   `HISTERESIS`: un círculo dentro de una pared solo cambia de salida si la otra es 8 px más corta,
   para que el cursor quieto sobre el borde del panel no lo haga saltar de un lado al otro.
   `PARED`: cuánto se extiende la pared de abajo a los lados y hacia abajo, más que cualquier
   salida posible. */
const HOLGURA = 16;
const EMPUJE = 0.5;
const REPELE = 1;
const HISTERESIS = 8;
const PARED = 2000;
/* Lo que tapa el hero se busca en sus últimos 320 px, en columnas de 16: el panel de la sección 2
   tapa 64 a 1440 × 900, y con 16 su esquina redondeada de 56 sale en cuatro escalones que el
   desenfoque funde en una curva. */
const FRANJA = 320;
const COLUMNA = 16;

/* La sombra de la copia en crema. Medido el 6 de octubre de 2026 con la copia sobre el mural
   entero, que son todas las posiciones posibles de la gota, en trozos de letra de 12 px: la crema
   contra el fondo inmediato de cada letra baja de 3:1 en 53 de 764 trozos a 1440 × 900 y en 54 de
   761 a 1280 × 800, con la mediana en 10,6:1 y 10:1. Son las zonas claras del mural: el bidón de
   agua blanco y las camisas claras. La foto no se oscurece; la letra lleva una sombra baja en tinta
   al 40 %, la `lg` de Tailwind, que deja 13 trozos bajo 3:1 en cada ancho y sube la mediana a 11,7
   y 11,5. Al 60 % quedaban 9 y 10, pero sobre las camisas ya se leía como sombra y no como borde.
   Va en la copia, así que solo existe dentro de la gota: fuera de ella el texto no lleva nada.
   Se midió sobre el mural que hubo hasta la noche del 6 de octubre de 2026; la foto dentro de la
   gota es una de esas mismas cuatro, así que las zonas claras son las mismas. */
const SOMBRA = 'text-shadow-lg text-shadow-rd-ink/40';

/* La foto dentro de la gota (ver LA FOTO DENTRO): el lado del cuadrado que la lleva, la gota
   abierta de 96 más un tercio de aire para la onda —que en una gota tan chica pesa más— y para la
   gota aplastada contra una pared; y entre qué tamaños, como fracción de la forma de 64, aparece:
   desde 0,6 (38) hasta 1,375 (88), casi todo el camino entre 24 y 96, así se ve abrirse. Empieza
   en 38 y no en 24 para que la vuelta del resorte, que baja hasta 23,2, no la encienda. */
const LADO_FOTO = 128;
const DESDE_FOTO = 0.6;
const ABRE_FOTO = 1.375;

/* Persecución: la cabeza hacia el cursor, cada gota de la estela hacia la anterior. El anillo
   persigue a la cabeza de la gota, no al cursor, y con la constante de la estela: es un eslabón
   más de ella, así que suma su retraso al de la gota y va detrás sin soltarse. Con 0,3 la gota
   iba pegada al frente del trazo ya a paso lento; con 0,42 va casi centrada a paso lento, llega
   al frente a paso normal y solo lo cruza rápida (capturas del 6 de octubre de 2026). Su propia
   estela usa la misma constante para que los dos se estiren en la misma proporción.
   Son fracciones de un cuadro de 60 Hz, que es donde se ajustaron: `alTiempo` y `alTrecho` las
   convierten al tiempo que de verdad duró cada cuadro. */
const SIGUE_CABEZA = 0.24;
const SIGUE_ESTELA = 0.42;
const SIGUE_ANILLO = SIGUE_ESTELA;

/* Cuánto se acerca la onda a su meta y cuánto crece o se encoge la gota al entrar y salir, en un
   cuadro de 60 Hz. */
const SIGUE_ONDA = 0.12;
const SIGUE_ESCALA = 0.14;

/* Lo que dura un cuadro de 60 Hz, y el cuadro más largo que se cuenta. Antes cada fracción se
   aplicaba una vez por cuadro, sin mirar cuánto duraba: a 120 Hz se aplicaba el doble de veces por
   segundo, la gota llegaba en la mitad de tiempo (150 ms al 90 % de un salto de 300 px a 60 Hz, 75
   a 120), el anillo iba a la mitad de distancia detrás de ella (11,1 px a 480 px/s a 60 Hz, 5,5 a
   120) y la onda se agitaba menos, porque la velocidad también se medía por cuadro (hallazgo H15
   de la revisión del 6 de octubre de 2026). El tope de 50 ms —tres cuadros de 60 Hz— es para un
   tirón o una pestaña que vuelve del fondo: la gota retoma desde donde estaba en vez de saltar. */
const PASO_60 = 1000 / 60;
const PASO_MAXIMO = 50;

/* Dos maneras de llevar una fracción `c`, ajustada para un cuadro de 60 Hz, a un cuadro que dura
   `pasos` cuadros de 60 Hz. Las dos devuelven `c` exacta con `pasos` = 1: a 60 Hz todo queda como
   se aprobó.

   `alTiempo` conserva el tiempo. En un cuadro de 60 Hz queda por recorrer (1 − c) de la
   distancia; en uno de 120 Hz, la raíz de eso, para que dos de ellos dejen lo mismo que uno de 60.
   La usan la cabeza —tarda lo mismo en llegar al cursor—, la onda y el crecer de la gota al entrar.

   `alTrecho` conserva la distancia. Un eslabón que persigue a otro que avanza `v` por cuadro se
   queda detrás a v × (1 − c) / c; con esta fracción, esa distancia es la misma con cualquier
   frecuencia. La usan la estela y el anillo, porque lo que se aprobó en ellos es una forma: el
   largo de la estela, el anillo a 12 px, la gota casi centrada a paso lento que llega al frente
   del trazo a paso normal. Con `alTiempo` en ellos, a 120 Hz y a 480 px/s la estela salía un 16 %
   más larga y el anillo iba 12,8 px detrás de la gota en vez de 11,1 (simulado y medido el 6 de
   octubre de 2026); con `alTrecho`, tras un salto el anillo llega a su sitio entre 8 y 10 ms
   antes que a 60 Hz, lo que dura medio cuadro. */
const alTiempo = (c: number, pasos: number) => 1 - Math.pow(1 - c, pasos);
const alTrecho = (c: number, pasos: number) => (pasos * c) / (pasos * c + 1 - c);

/* Escribe un atributo solo si su texto cambia. Chrome vuelve a calcular estilo, layout y pintura
   con cualquier `setAttribute` sobre el SVG aunque el valor sea el mismo: con el cursor quieto y
   la gota ya asentada, el bucle reescribía sesenta veces por segundo los mismos 16 círculos, la
   región de la máscara y la fuerza de la onda, y la página repintaba en cada cuadro (242 pinturas
   y 121 layouts en 2 s). Solo cambiaba de verdad el movimiento del ruido, y ese sigue: el temblor
   se ve igual. Ahora no hay layout y las pinturas bajan a 400 cada 10 s, donde antes, a 242 cada
   2 s, eran unas 1200 (hallazgo H22 de la revisión del 6 de octubre de 2026, medido cuando el
   ruido aún respiraba; ver LA DERIVA). */
const escribir = (el: Element | null | undefined, nombre: string, valor: string) => {
  if (el && el.getAttribute(nombre) !== valor) el.setAttribute(nombre, valor);
};

/* LA DERIVA. El borde ondula aunque el cursor esté quieto porque el ruido que lo desplaza se
   traslada despacio (`feOffset`), en un vaivén de ±8 px en 13 s de lado y 17 s de alto, que no
   coinciden: como mucho 4 px por segundo, igual en cualquier punto de la página. En el punto, con
   ondas más cortas, al 40 %.
   Hasta el 7 de octubre de 2026 el ruido «respiraba» cambiando su frecuencia. Eso agita el borde
   en proporción a la distancia al origen del ruido, que es la esquina del hero: cerca del hero se
   veía bien, pero desde que el cursor recorre toda la página, en la sección 2 o 3 —a miles de
   píxeles de esa esquina— el borde temblaba decenas de veces más rápido (Alejandro: «la onda del
   cursor está moviéndose muy rápido... bájale la velocidad, parece bugeada»). Trasladar el ruido
   lo mueve lo mismo en todas partes. El vaivén no pasa de 8 px, y el margen de las regiones de los
   filtros es de 70 (`MARGEN`): la orilla que la traslación deja sin ruido queda lejos del borde. */
const DERIVA = 8;
const DERIVA_X = 13;
const DERIVA_Y = 17;
const DERIVA_PUNTO = 0.4;

/* La onda: reposo, tope y cuánto pesa la velocidad. Desplaza el borde hasta la mitad de su
   valor, así que en reposo tiembla ±4 px y rápida se estira ±11. El anillo recibe la misma. */
const ONDA_REPOSO = 8;
const ONDA_TOPE = 22;
const ONDA_POR_VELOCIDAD = 1.6;

/* El alisado entre la onda y el umbral: lo justo para borrar los saltos de un píxel del
   desplazamiento. Con la onda después del umbral y sin alisado, el trazo del anillo iba de 0,3 a
   2,7 px, con cortes; con la onda antes y un alisado de 1, de 0,8 a 2,4; con 1,5, de 1,05 a 2,0,
   y con 2 ya no mejora (medido a 1× el 6 de octubre de 2026). */
const ALISADO = 1.5;

/* Margen alrededor de los círculos para las regiones de la máscara y de los filtros. La gota
   visible sale de la caja de sus círculos lo que la empuja la onda: media onda máxima (11) y la
   transición del borde, 13 px medidos en un barrido rápido el 6 de octubre de 2026. El filtro
   además necesita ver la pared que hay alrededor para desenfocarla bien: el desenfoque de 9
   alcanza 27 px y la onda toma muestras a 11, así que hacen falta 51. Nada de eso crece con la
   gota: el 70 de siempre sigue sobrado. */
const MARGEN = 70;

/* La región de una máscara o de un filtro: el recuadro de sus círculos más el margen. */
const region = (el: Element | null | undefined, x0: number, y0: number, x1: number, y1: number) => {
  escribir(el, 'x', (x0 - MARGEN).toFixed(0));
  escribir(el, 'y', (y0 - MARGEN).toFixed(0));
  escribir(el, 'width', (x1 - x0 + MARGEN * 2).toFixed(0));
  escribir(el, 'height', (y1 - y0 + MARGEN * 2).toFixed(0));
};

const CONSULTA = '(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

type Punto = { x: number; y: number };
/* Una pared, ya con su `HOLGURA`, en coordenadas del hero. */
type Caja = { x0: number; y0: number; x1: number; y1: number };

/* Las cuatro salidas posibles de una pared: arriba, abajo, izquierda, derecha. */
const SALIDAS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
] as const;

/* Cuánto hay que andar desde (px, py) en la dirección (dx, dy) para salir de todas las cajas,
   cada una agrandada `extra`. Las cajas se tocan —la pared de abajo y las del panel forman un solo
   bloque—, así que al salir de una se mira si se cayó en otra y se sigue. */
const salida = (cajas: Caja[], px: number, py: number, dx: number, dy: number, extra: number) => {
  let t = 0;
  for (let vuelta = 0; vuelta <= cajas.length; vuelta++) {
    const x = px + dx * t;
    const y = py + dy * t;
    let falta = -1;
    for (const c of cajas) {
      if (x > c.x0 - extra && x < c.x1 + extra && y > c.y0 - extra && y < c.y1 + extra) {
        falta = dx > 0 ? c.x1 + extra - x : dx < 0 ? x - c.x0 + extra : dy > 0 ? c.y1 + extra - y : y - c.y0 + extra;
        break;
      }
    }
    if (falta < 0) return t;
    t += falta + 0.5;
  }
  return t;
};

/* El empuje de las paredes. Escribe en `blanco` el punto que debe perseguir un círculo cuya meta
   es (px, py): la meta misma si está fuera de las cajas, o la salida más corta si está dentro. Las
   cajas se agrandan `extra` —media gota— para que el centro quede a esa distancia de la pared.
   Devuelve la salida elegida (−1 si no hubo empuje), que vuelve a entrar como `previa` en el
   cuadro siguiente para la histéresis. */
const alejar = (cajas: Caja[], px: number, py: number, extra: number, previa: number, blanco: Punto) => {
  let dentro = false;
  for (const c of cajas) {
    if (px > c.x0 - extra && px < c.x1 + extra && py > c.y0 - extra && py < c.y1 + extra) {
      dentro = true;
      break;
    }
  }
  if (!dentro) {
    blanco.x = px;
    blanco.y = py;
    return -1;
  }
  let mejor = 0;
  let largo = 0;
  let peso = Infinity;
  for (let k = 0; k < SALIDAS.length; k++) {
    const d = salida(cajas, px, py, SALIDAS[k][0], SALIDAS[k][1], extra);
    const p = k === previa ? d - HISTERESIS : d;
    if (p < peso) {
      peso = p;
      largo = d;
      mejor = k;
    }
  }
  blanco.x = px + SALIDAS[mejor][0] * largo;
  blanco.y = py + SALIDAS[mejor][1] * largo;
  return mejor;
};

/* Mide las paredes en coordenadas del hero: su borde de abajo y lo que lo tapa por abajo. El texto
   y los botones ya no son pared: la gota pasa por detrás de ellos. */
const medirParedes = (el: HTMLElement): Caja[] => {
  const base = el.getBoundingClientRect();
  const { offsetWidth: w, offsetHeight: h } = el;
  /* El borde de abajo del hero, para que la gota se redondee contra él en vez de cortarse en
     plano. */
  const cajas: Caja[] = [{ x0: -PARED, y0: h - HOLGURA, x1: w + PARED, y1: h + PARED }];

  /* El panel de la sección 2 se monta sobre los últimos píxeles del hero, y la gota que se metía
     debajo se veía cortada en recto por su borde. Se encuentra preguntando al navegador qué hay
     encima en cada columna de 16 px de la franja de abajo (`elementFromPoint`, que respeta el
     recorte redondeado del panel y no ve las capas de la gota, que no reciben el cursor) y
     buscando, por bisección, dónde empieza a taparse. No nombra a nadie: si el panel cambia de
     forma o de clase, sigue valiendo, y cualquier otra cosa que se monte encima del hero también
     es pared. Solo ve lo que está dentro de la ventana; lo demás se vuelve a mirar al hacer
     scroll. */
  const tapado = (x: number, y: number) => {
    const vx = base.left + x;
    const vy = base.top + y;
    if (vx < 0 || vy < 0 || vx >= window.innerWidth || vy >= window.innerHeight) return false;
    const encima = document.elementFromPoint(vx, vy);
    return !!encima && !el.contains(encima);
  };
  const desde = Math.max(0, h - FRANJA);
  const bordes: (number | null)[] = [];
  for (let x = 0; x < w; x += COLUMNA) {
    const centro = x + COLUMNA / 2;
    if (!tapado(centro, h - 1)) {
      bordes.push(null);
      continue;
    }
    let libre = desde;
    let cubierto = h - 1;
    if (tapado(centro, libre)) cubierto = libre;
    while (cubierto - libre > 1) {
      const medio = Math.floor((libre + cubierto) / 2);
      if (tapado(centro, medio)) cubierto = medio;
      else libre = medio;
    }
    bordes.push(cubierto);
  }
  /* Las columnas seguidas con el mismo borde van en una sola caja. */
  for (let i = 0; i < bordes.length; i++) {
    const borde = bordes[i];
    if (borde === null) continue;
    let fin = i;
    while (fin + 1 < bordes.length && bordes[fin + 1] !== null && Math.abs((bordes[fin + 1] as number) - borde) <= 1) fin++;
    cajas.push({ x0: i * COLUMNA - HOLGURA, y0: borde - HOLGURA, x1: (fin + 1) * COLUMNA + HOLGURA, y1: h + PARED });
    i = fin;
  }
  return cajas;
};

/* La copia en crema de un nodo del texto del hero (ver EL TEXTO SOBRE LA FOTO). Conserva la
   etiqueta y las clases, que son las que deciden el renglón; cambia solo el color, que va en
   línea para que gane a las clases de tinta de cada nodo. Los encabezados pasan a `div`: con las
   clases de `Titular` y sin márgenes, un `div` mide lo mismo que el `h1`, y la página sigue con un
   solo h1. Los enlaces y botones se quedan fuera: van después del texto y no lo mueven. */
const copiarTexto = (nodo: Node): Node | null => {
  if (nodo.nodeType === Node.TEXT_NODE) return document.createTextNode(nodo.textContent ?? '');
  if (!(nodo instanceof HTMLElement) || nodo.matches('a, button')) return null;
  const copia = document.createElement(/^h[1-6]$/.test(nodo.localName) ? 'div' : nodo.localName);
  copia.className = nodo.className;
  /* Desde el tema oscuro (6 de octubre de 2026) la copia ya no cambia de color: el texto es claro
     —blanco el primer renglón, amarillo el segundo— y se lee sobre las fotos, que son oscuras.
     Conserva las clases de cada parte; lo que aporta dentro de la gota es la sombra que la separa
     de las zonas claras de la foto. */
  nodo.childNodes.forEach((hijo) => {
    const c = copiarTexto(hijo);
    if (c) copia.append(c);
  });
  return copia;
};

function useEscritorio(): boolean {
  const [si, setSi] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(CONSULTA).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(CONSULTA);
    if (!mq) return;
    const cambio = () => setSi(mq.matches);
    cambio();
    mq.addEventListener('change', cambio);
    return () => mq.removeEventListener('change', cambio);
  }, []);
  return si;
}

/* Desenfoque, paredes, onda, alisado: el campo que la gota y los anillos cortan con su umbral. Es
   el mismo en todos los filtros para que se fundan, ondulen y se aparten de las paredes igual.

   Las paredes entran al filtro como manchas de relleno (`feFlood` con su propia región), sin
   colores ni imágenes de fuera: el relleno por defecto es opaco, y el filtro solo mira el alfa. Se
   desenfocan como los círculos y se restan: donde la pared pesa más que el agua el campo queda en
   cero, y entre las dos el borde sale redondeado por el mismo desenfoque. La resta va antes de la
   onda, así que el borde junto a la pared también ondula. La primera mancha es transparente y sin
   región: estira la del conjunto a todo el filtro. Sin ella el desenfoque de las paredes quedaría
   recortado al recuadro de las cajas, y su borde volvería a ser una línea recta.

   El peso de la resta lo escribe el bucle en `resta` (`k3`): sigue a la apertura de la gota, así
   que con la gota cerrada las paredes no restan nada (ver LOS BORDES DEL HERO). Sin `paredes` —los
   dos anillos de fuera— el campo es el desenfoque solo. */
const Campo: React.FC<{
  deriva: React.Ref<SVGFEOffsetElement>;
  desplazar: React.Ref<SVGFEDisplacementMapElement>;
  paredes?: Caja[];
  resta?: React.Ref<SVGFECompositeElement>;
}> = ({ deriva, desplazar, paredes, resta }) => (
  <>
    <feGaussianBlur in="SourceGraphic" stdDeviation={DESENFOQUE} result={paredes ? 'difuso' : 'agua'} />
    {paredes && (
      <>
        <feFlood floodOpacity={0} result="limpio" />
        {paredes.map((c, i) => (
          <feFlood key={i} x={c.x0} y={c.y0} width={c.x1 - c.x0} height={c.y1 - c.y0} result={`pared-${i}`} />
        ))}
        <feMerge result="paredes">
          <feMergeNode in="limpio" />
          {paredes.map((_, i) => (
            <feMergeNode key={i} in={`pared-${i}`} />
          ))}
        </feMerge>
        <feGaussianBlur in="paredes" stdDeviation={DESENFOQUE} result="paredes-difusas" />
        <feComposite ref={resta} in="difuso" in2="paredes-difusas" operator="arithmetic" k1={0} k2={1} k3={0} k4={0} result="agua" />
      </>
    )}
    {/* Una sola octava: con dos, el detalle fino del ruido se volvía aristas al desplazar fuerte
        y la gota rápida parecía una piedra, no agua. El ruido es fijo y lo que se mueve es su
        posición (`deriva`, ver LA DERIVA). */}
    <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves={1} seed={7} result="ruido" />
    <feOffset ref={deriva} in="ruido" dx={0} dy={0} result="ruido-movido" />
    <feDisplacementMap
      ref={desplazar}
      in="agua"
      in2="ruido-movido"
      scale={ONDA_REPOSO}
      xChannelSelector="R"
      yChannelSelector="G"
      result="ondulado"
    />
    <feGaussianBlur in="ondulado" stdDeviation={ALISADO} result="campo" />
  </>
);

export const VentanaLiquida: React.FC<{
  /** La sección del hero: la gota se abre con la foto solo con el cursor sobre ella. */
  anfitrion: React.RefObject<HTMLElement | null>;
  /** El bloque de texto del hero, el que se copia dentro de la gota. */
  texto: React.RefObject<HTMLElement | null>;
}> = ({ anfitrion, texto }) => {
  const activo = useEscritorio();
  const [caja, setCaja] = useState({ w: 0, h: 0 });
  /* Las paredes se pintan en los filtros (estado) y empujan en el bucle (referencia): el bucle no
     pasa por React. */
  const [paredes, setParedes] = useState<Caja[]>([]);
  const paredesVivas = useRef<Caja[]>([]);
  /* Las capas solo existen cuando el hero ya tiene tamaño. */
  const montada = activo && caja.w > 0;

  const copia = useRef<HTMLDivElement>(null);
  const circulos = useRef<(SVGCircleElement | null)[]>([]);
  const mascara = useRef<SVGMaskElement>(null);
  const filtro = useRef<SVGFilterElement>(null);
  const desplazar = useRef<SVGFEDisplacementMapElement>(null);
  const deriva = useRef<SVGFEOffsetElement>(null);
  const restaGota = useRef<SVGFECompositeElement>(null);
  /* Los tres anillos (ver LOS ANILLOS): por anillo, su grupo, sus ocho círculos, su filtro, la
     deriva de su ruido y su onda, y la resta de paredes del primero. */
  const grupoAnillo = useRef<(SVGGElement | null)[]>([]);
  const circulosAnillo = useRef<(SVGCircleElement | null)[][]>(ANILLOS.map(() => []));
  const filtroAnillo = useRef<(SVGFilterElement | null)[]>([]);
  const desplazarAnillo = useRef<(SVGFEDisplacementMapElement | null)[]>([]);
  const derivaAnillo = useRef<(SVGFEOffsetElement | null)[]>([]);
  const restaAnillo = useRef<SVGFECompositeElement>(null);
  const puntos = useRef<(SVGCircleElement | null)[]>([]);
  /* La capa del cursor lleva sus coordenadas del hero a la ventana con este grupo. */
  const origen = useRef<SVGGElement>(null);
  /* La foto dentro de la gota (ver LA FOTO DENTRO): la capa recortada por la gota, el grupo que
     aparece y se va, el que la lleva con la gota y las cuatro fotos. */
  const grupoMascara = useRef<SVGGElement>(null);
  const capaFoto = useRef<SVGGElement>(null);
  const marcoFoto = useRef<SVGGElement>(null);
  const imagenes = useRef<(SVGImageElement | null)[]>([]);
  const filtroPunto = useRef<SVGFilterElement>(null);
  const derivaPunto = useRef<SVGFEOffsetElement>(null);
  const desplazarPunto = useRef<SVGFEDisplacementMapElement>(null);

  /* Oculta la flecha nativa del ratón mientras el cursor líquido está activo en pantalla,
     para que la animación actúe como puntero principal en toda la landing. */
  useEffect(() => {
    if (!activo) return;
    document.documentElement.classList.add('rd-cursor-activo');
    return () => {
      document.documentElement.classList.remove('rd-cursor-activo');
    };
  }, [activo]);

  /* El tamaño del hero, con su relleno: la ventana cubre toda la sección, no solo el contenido. Con
     sus decimales: el alto suele tenerlos (502,84 a 1024), y con `offsetHeight`, que redondea a
     503, el `viewBox` no medía lo mismo que el SVG y el navegador encogía todo un 0,03 % para que
     cupiera. A la gota no se le notaba, pero corría la copia del texto una décima de píxel contra
     el de verdad entre 1024 y 1279 (medido el 6 de octubre de 2026). */
  useEffect(() => {
    if (!activo) return;
    const el = anfitrion.current;
    if (!el) return;
    const medir = () => {
      const { width, height } = el.getBoundingClientRect();
      setCaja({ w: width, h: height });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activo, anfitrion]);

  /* Las paredes: se miden al montar, al cambiar el tamaño del hero y al entrar el cursor. Lo que
     tapa el hero depende además del scroll —el panel de la sección 2 cambia con él—, así que se
     vuelven a medir cuando el scroll se detiene, y también un momento después de cada cambio de
     tamaño, cuando el panel ya se acomodó. Solo se pasan a React si alguna caja se movió. */
  useEffect(() => {
    if (!activo) return;
    const el = anfitrion.current;
    if (!el) return;
    let vivo = true;
    let anterior = '';
    let espera = 0;
    const medir = () => {
      if (!vivo) return;
      const cajas = medirParedes(el);
      const texto = JSON.stringify(cajas);
      if (texto === anterior) return;
      anterior = texto;
      paredesVivas.current = cajas;
      setParedes(cajas);
    };
    const luego = () => {
      window.clearTimeout(espera);
      espera = window.setTimeout(medir, 120);
    };
    medir();
    const ro = new ResizeObserver(() => {
      medir();
      luego();
    });
    ro.observe(el);
    window.addEventListener('scroll', luego, { passive: true });
    el.addEventListener('pointerenter', medir);
    return () => {
      vivo = false;
      window.clearTimeout(espera);
      ro.disconnect();
      window.removeEventListener('scroll', luego);
      el.removeEventListener('pointerenter', medir);
    };
  }, [activo, anfitrion]);

  /* La copia en crema del texto. Se hace al montar las capas y se rehace entera si el texto de
     verdad cambia —el idioma— o cambian sus clases: son unos pocos nodos y pasa casi nunca. El
     bloque copiado no lleva `position`: el `relative` del de verdad está para subirlo sobre el
     anillo, y en la copia solo crearía una capa de pintura más dentro del SVG. */
  useEffect(() => {
    if (!montada) return;
    const origen = texto.current;
    const destino = copia.current;
    if (!origen || !destino) return;
    const rehacer = () => {
      const nueva = copiarTexto(origen);
      if (nueva instanceof HTMLElement) nueva.style.position = 'static';
      destino.replaceChildren(...(nueva ? [nueva] : []));
    };
    rehacer();
    const mo = new MutationObserver(rehacer);
    mo.observe(origen, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    return () => {
      mo.disconnect();
      destino.replaceChildren();
    };
  }, [montada, texto]);

  /* El cursor y el bucle. Todo se escribe directo en los atributos del SVG: pasar por el estado
     de React sesenta veces por segundo volvería a pintar el componente entero en cada cuadro. */
  useEffect(() => {
    if (!activo) return;
    const el = anfitrion.current;
    if (!el) return;

    const n = RADIOS.length;
    const pos = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
    const posAnillo = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
    /* La salida de la pared que tomó cada círculo en el cuadro anterior, para la histéresis. */
    const salidas = new Array<number>(n).fill(-1);
    const salidasAnillo = new Array<number>(n).fill(-1);
    /* El radio de cada círculo de la gota en este cuadro. */
    const radios = new Array<number>(n).fill(0);
    /* Dónde está la flecha en la ventana, y lo mismo en coordenadas del hero, que es lo que
       persigue la gota: se recalcula en cada cuadro porque con el scroll el hero se mueve debajo de
       una flecha quieta. */
    const cliente = { x: 0, y: 0 };
    const meta = { x: 0, y: 0 };
    const blanco = { x: 0, y: 0 };
    /* La cola líquida del punto (ver EL PUNTO). */
    const posPunto = PUNTO_COLA.map(() => ({ x: 0, y: 0 }));
    /* Por dónde pasó el cursor en los últimos `DETENER_MS` y dónde estaba al empezar ese rato, y
       cuándo se movió de verdad por última vez. */
    const huellas: { t: number; x: number; y: number }[] = [];
    let movido = 0;
    /* `dentro`: la flecha está en la página. `enHero`: está sobre algo del hero, que es lo único
       que deja abrirse a la gota (ver LOS DOS TAMAÑOS). */
    let dentro = false;
    let enHero = false;
    /* `soloPunto`: la flecha está dentro de algo marcado con `data-cursor-punto` (el panel de la
       sección 2), donde el cursor deja solo el punto; `anillosVistos` lo sigue suave, de 1 a 0. */
    let soloPunto = false;
    let anillosVistos = 1;
    /* `enEco`: la flecha está sobre un eco del radar de la sección 4 (`data-cursor-eco`), y el
       cursor «lo detecta»: sus anillos laten (`latido`, de 0 a 1, lo sigue suave). */
    let enEco = false;
    let latido = 0;
    let escala = 0;
    /* Cuánto está abierta la gota, de 0 (cerrada, hasta 38) a 1 (desde 88): decide la foto, los
       anillos de fuera y el peso de las paredes. */
    let abierta = 0;
    /* El tamaño de la gota como fracción de la forma de 64: `MOVIENDO` o `REPOSO`, y lo que hay en
       medio mientras cambia. */
    let tamano = MOVIENDO;
    let velocidadTamano = 0;
    let creciendo: { desde: number; inicio: number; dura: number } | null = null;
    let onda = ONDA_REPOSO;
    let corriendo = false;
    let raf = 0;
    /* El tiempo del cuadro anterior; null al arrancar, porque el hueco desde la última vez que el
       bucle corrió no es tiempo de animación. */
    let ultimo: number | null = null;
    let cajas: Caja[] = [];
    const t0 = performance.now();
    /* La foto que toca, −1 antes de la primera vez que la gota se abre, y cuánto se ve (de 0 a 1). */
    let foto = -1;
    let verFoto = 0;
    const cambiarFoto = () => {
      foto = (foto + 1) % FOTOS.length;
      imagenes.current.forEach((im, i) => escribir(im, 'visibility', i === foto ? 'visible' : 'hidden'));
    };

    /* Cada punto de una estela persigue al anterior; el primero persigue a `guia`. Si lo que
       persigue cae dentro de una pared, persigue su salida, tanto más cuanto más abierta está la
       gota (ver LOS BORDES DEL HERO): cerrada, va derecho a la flecha. */
    const perseguir = (
      puntos: Punto[],
      elegidas: number[],
      guia: Punto,
      sigue: number,
      sigueEstela: number,
    ) => {
      for (let i = 0; i < n; i++) {
        const delante = i === 0 ? guia : puntos[i - 1];
        if (abierta > 0) {
          elegidas[i] = alejar(cajas, delante.x, delante.y, radios[i] * EMPUJE, elegidas[i], blanco);
          blanco.x = delante.x + (blanco.x - delante.x) * abierta;
          blanco.y = delante.y + (blanco.y - delante.y) * abierta;
        } else {
          elegidas[i] = -1;
          blanco.x = delante.x;
          blanco.y = delante.y;
        }
        const c = i === 0 ? sigue : sigueEstela;
        puntos[i].x += (blanco.x - puntos[i].x) * c;
        puntos[i].y += (blanco.y - puntos[i].y) * c;
      }
    };

    /* El tamaño: 24, y en el hero, quieto más de un segundo, crece despacio hasta 96. */
    const ajustarTamano = (ahora: number, segundos: number) => {
      const quieto = ahora - movido;
      if (dentro && enHero && quieto > ESPERA) {
        /* Si empieza a crecer desde más arriba de 24 —se movió y volvió a parar a mitad del
           regreso—, tarda en proporción a lo que le falta. */
        if (!creciendo) {
          creciendo = { desde: tamano, inicio: ahora, dura: (CRECER_MS * Math.max(0, REPOSO - tamano)) / (REPOSO - MOVIENDO) };
          /* Otra foto cada vez que se abre, pero solo desde cerrada: si la de antes todavía se ve,
             se queda (ver LA FOTO DENTRO). */
          if (verFoto < 0.01) cambiarFoto();
        }
        const u = creciendo.dura > 0 ? Math.min(1, (ahora - creciendo.inicio) / creciendo.dura) : 1;
        const nuevo = creciendo.desde + (REPOSO - creciendo.desde) * suave(u);
        velocidadTamano = segundos > 0 ? (nuevo - tamano) / segundos : 0;
        tamano = nuevo;
        return;
      }
      creciendo = null;
      const destino = MOVIENDO;
      if (tamano === destino && velocidadTamano === 0) return;
      for (let t = segundos; t > 0; t -= PASO_RESORTE) {
        const h = Math.min(t, PASO_RESORTE);
        const tiron =
          RESORTE_FRECUENCIA * RESORTE_FRECUENCIA * (destino - tamano) - 2 * RESORTE_AMORTIGUA * RESORTE_FRECUENCIA * velocidadTamano;
        velocidadTamano += tiron * h;
        tamano += velocidadTamano * h;
      }
      /* Ya asentado: se fija en el destino exacto para que los radios dejen de cambiar y
         `escribir` deje de repintar. */
      if (Math.abs(tamano - destino) < 0.0005 && Math.abs(velocidadTamano) < 0.005) {
        tamano = destino;
        velocidadTamano = 0;
      }
    };

    const cuadro = (ahora: number) => {
      /* Cuántos cuadros de 60 Hz duró este: 1 a 60 Hz, 0,5 a 120. El primero cuenta como uno. */
      const pasos = ultimo === null ? 1 : Math.min(PASO_MAXIMO, Math.max(0, ahora - ultimo)) / PASO_60;
      ultimo = ahora;
      const sigueEstela = alTrecho(SIGUE_ESTELA, pasos);
      cajas = paredesVivas.current;

      /* La flecha en coordenadas del hero, y el hero en la ventana para la capa del cursor (ver
         LAS DOS CAPAS). Se lee antes de escribir nada en este cuadro, así no fuerza un layout. */
      const hero = el.getBoundingClientRect();
      meta.x = cliente.x - hero.left;
      meta.y = cliente.y - hero.top;
      escribir(origen.current, 'transform', `translate(${hero.left.toFixed(1)} ${hero.top.toFixed(1)})`);

      /* Al entrar la gota crece desde nada y al salir se encoge: es el dedo que entra al agua y
         sale, no un círculo que aparece de golpe. Los anillos crecen y se encogen con ella. Encima
         van los tres tamaños. */
      escala += ((dentro ? 1 : 0) - escala) * alTiempo(SIGUE_ESCALA, pasos);
      anillosVistos += ((soloPunto ? 0 : 1) - anillosVistos) * alTiempo(SIGUE_ESCALA, pasos);
      if (Math.abs(anillosVistos - (soloPunto ? 0 : 1)) < 0.002) anillosVistos = soloPunto ? 0 : 1;
      latido += ((enEco ? 1 : 0) - latido) * alTiempo(SIGUE_ESCALA, pasos);
      if (!enEco && latido < 0.002) latido = 0;
      /* El latido sobre un eco: los anillos se abren hasta 6 px más, cada uno un poco más que el
         de dentro, en un pulso de 0,9 s. */
      const pulso = latido * 6 * (0.5 + 0.5 * Math.sin((2 * Math.PI * (ahora - t0)) / 900));
      ajustarTamano(ahora, (pasos * PASO_60) / 1000);
      const s = escala * tamano;
      for (let i = 0; i < n; i++) radios[i] = RADIOS[i] * s;

      /* La apertura, de nada a 38 a entera a 88 (ver `DESDE_FOTO`). Las paredes pesan lo mismo que
         ella (ver LOS BORDES DEL HERO). */
      abierta = Math.min(1, Math.max(0, (tamano - DESDE_FOTO) / (ABRE_FOTO - DESDE_FOTO)));
      const pesoParedes = (-REPELE * abierta).toFixed(3);
      escribir(restaGota.current, 'k3', pesoParedes);
      escribir(restaAnillo.current, 'k3', pesoParedes);

      const antesX = pos[0].x;
      const antesY = pos[0].y;
      perseguir(pos, salidas, meta, alTiempo(SIGUE_CABEZA, pasos), sigueEstela);
      perseguir(posAnillo, salidasAnillo, pos[0], alTrecho(SIGUE_ANILLO, pasos), sigueEstela);

      /* La foto: tanto más visible cuanto más abierta la gota, y la entrada y la salida la apagan
         con ella. Va centrada en la cabeza; mientras no se ve no se mueve, y en el primer cuadro en
         que se ve ya está en su sitio. Con la gota cerrada su capa no se pinta. */
      verFoto = abierta * escala;
      escribir(grupoMascara.current, 'display', verFoto > 0 ? 'inline' : 'none');
      escribir(capaFoto.current, 'opacity', verFoto.toFixed(3));
      if (verFoto > 0) escribir(marcoFoto.current, 'transform', `translate(${pos[0].x.toFixed(1)} ${pos[0].y.toFixed(1)})`);

      /* Lo que avanzaría la cabeza en un cuadro de 60 Hz, para que el mismo gesto agite la onda
         igual con cualquier frecuencia. */
      const velocidad = pasos > 0 ? Math.hypot(pos[0].x - antesX, pos[0].y - antesY) / pasos : 0;
      const ondaMeta = ONDA_REPOSO + Math.min(velocidad * ONDA_POR_VELOCIDAD, ONDA_TOPE - ONDA_REPOSO);
      onda += (ondaMeta - onda) * alTiempo(SIGUE_ONDA, pasos);

      /* La gota: solo hace falta con la foto a la vista, que es lo único que recorta. */
      if (verFoto > 0) {
        let x0 = Infinity;
        let y0 = Infinity;
        let x1 = -Infinity;
        let y1 = -Infinity;
        for (let i = 0; i < n; i++) {
          const c = circulos.current[i];
          if (!c) continue;
          const r = radios[i];
          escribir(c, 'cx', pos[i].x.toFixed(1));
          escribir(c, 'cy', pos[i].y.toFixed(1));
          escribir(c, 'r', r.toFixed(2));
          x0 = Math.min(x0, pos[i].x - r);
          y0 = Math.min(y0, pos[i].y - r);
          x1 = Math.max(x1, pos[i].x + r);
          y1 = Math.max(y1, pos[i].y + r);
        }
        if (Number.isFinite(x0)) {
          region(mascara.current, x0, y0, x1, y1);
          region(filtro.current, x0, y0, x1, y1);
        }
      }

      /* Los anillos, la silueta de la gota agrandada cada uno con su aire (ver LOS ANILLOS). El
         aire y el trazo no crecen con la gota, solo con la entrada. Los dos de fuera se apagan
         mientras la gota se abre, y los tres dentro del panel de la sección 2, donde además se
         recogen hasta la mitad de su aire (ver LOS ANILLOS). Apagados no se pintan ni se
         escriben. */
      for (let k = 0; k < ANILLOS.length; k++) {
        const visto = (k === 0 ? 1 : ANILLOS[k].opacidad * (1 - abierta)) * anillosVistos;
        const grupo = grupoAnillo.current[k];
        escribir(grupo, 'display', visto > 0 ? 'inline' : 'none');
        escribir(grupo, 'opacity', visto.toFixed(3));
        if (visto <= 0) continue;
        const aire = (ANILLOS[k].aire + TRAZO + pulso * (1 + k * 0.5)) * escala * (0.5 + 0.5 * anillosVistos);
        let ax0 = Infinity;
        let ay0 = Infinity;
        let ax1 = -Infinity;
        let ay1 = -Infinity;
        for (let i = 0; i < n; i++) {
          const a = circulosAnillo.current[k][i];
          if (!a) continue;
          const r = RADIOS[i] * s + aire;
          escribir(a, 'cx', posAnillo[i].x.toFixed(1));
          escribir(a, 'cy', posAnillo[i].y.toFixed(1));
          escribir(a, 'r', r.toFixed(2));
          ax0 = Math.min(ax0, posAnillo[i].x - r);
          ay0 = Math.min(ay0, posAnillo[i].y - r);
          ax1 = Math.max(ax1, posAnillo[i].x + r);
          ay1 = Math.max(ay1, posAnillo[i].y + r);
        }
        if (Number.isFinite(ax0)) region(filtroAnillo.current[k], ax0, ay0, ax1, ay1);
      }

      /* El punto, en el centro de la cabeza, con su cola persiguiéndola (ver EL PUNTO). Mide
         siempre `PUNTO` y solo la entrada lo escala. Con la gota quieta y asentada no cambia
         ninguno de sus atributos, así que no vuelve a pintar. */
      posPunto[0].x = pos[0].x;
      posPunto[0].y = pos[0].y;
      const siguePunto = alTrecho(SIGUE_PUNTO, pasos);
      let px0 = Infinity;
      let py0 = Infinity;
      let px1 = -Infinity;
      let py1 = -Infinity;
      for (let i = 0; i < posPunto.length; i++) {
        if (i > 0) {
          posPunto[i].x += (posPunto[i - 1].x - posPunto[i].x) * siguePunto;
          posPunto[i].y += (posPunto[i - 1].y - posPunto[i].y) * siguePunto;
        }
        const r = (PUNTO / 2) * PUNTO_COLA[i] * escala;
        const c = puntos.current[i];
        escribir(c, 'cx', posPunto[i].x.toFixed(1));
        escribir(c, 'cy', posPunto[i].y.toFixed(1));
        escribir(c, 'r', r.toFixed(2));
        px0 = Math.min(px0, posPunto[i].x - r);
        py0 = Math.min(py0, posPunto[i].y - r);
        px1 = Math.max(px1, posPunto[i].x + r);
        py1 = Math.max(py1, posPunto[i].y + r);
      }
      if (Number.isFinite(px0)) region(filtroPunto.current, px0, py0, px1, py1);
      const fuerza = onda.toFixed(1);
      escribir(desplazar.current, 'scale', fuerza);
      desplazarAnillo.current.forEach((d) => escribir(d, 'scale', fuerza));
      escribir(desplazarPunto.current, 'scale', (onda * ONDA_PUNTO).toFixed(1));
      /* La deriva del ruido (ver LA DERIVA): así el borde ondula aunque la gota esté quieta, como
         la superficie del agua, sin quedarse con una forma fija. Con un decimal su texto no cambia
         en todos los cuadros, y `escribir` solo repinta cuando cambia. */
      const t = (ahora - t0) / 1000;
      const dx = DERIVA * Math.sin((2 * Math.PI * t) / DERIVA_X);
      const dy = DERIVA * Math.cos((2 * Math.PI * t) / DERIVA_Y);
      for (const o of [deriva.current, ...derivaAnillo.current]) {
        escribir(o, 'dx', dx.toFixed(1));
        escribir(o, 'dy', dy.toFixed(1));
      }
      escribir(derivaPunto.current, 'dx', (dx * DERIVA_PUNTO).toFixed(1));
      escribir(derivaPunto.current, 'dy', (dy * DERIVA_PUNTO).toFixed(1));

      if (!dentro && escala < 0.002) {
        corriendo = false;
        return;
      }
      raf = requestAnimationFrame(cuadro);
    };

    const arrancar = () => {
      if (corriendo) return;
      corriendo = true;
      ultimo = null;
      raf = requestAnimationFrame(cuadro);
    };

    /* El cursor se mueve por toda la página (ver LAS DOS CAPAS). Las huellas van en coordenadas de
       la ventana: lo que cuenta como moverse es la mano, no el scroll, que se cuenta aparte. */
    const mover = (e: PointerEvent) => {
      const ahora = performance.now();
      cliente.x = e.clientX;
      cliente.y = e.clientY;
      enHero = e.target instanceof Node && el.contains(e.target);
      soloPunto = e.target instanceof Element && !!e.target.closest('[data-cursor-punto]');
      enEco = e.target instanceof Element && !!e.target.closest('[data-cursor-eco]');
      /* Se queda la última huella de antes de la ventana: es donde estaba el cursor cuando
         empezó, así que un solo movimiento tras un rato quieto también cuenta. */
      while (huellas.length > 1 && ahora - huellas[1].t > DETENER_MS) huellas.shift();
      if (!dentro) {
        dentro = true;
        huellas.length = 0;
        movido = ahora;
        /* Si la gota ya se había ido, nace donde está el cursor en vez de cruzar la página desde
           el último sitio donde estuvo, y nace con el tamaño de moverse: de 0 a 24, y a 96 si el
           cursor se queda quieto en el hero. Los anillos nacen con ella. */
        if (escala < 0.05) {
          const hero = el.getBoundingClientRect();
          const x = cliente.x - hero.left;
          const y = cliente.y - hero.top;
          [...pos, ...posAnillo, ...posPunto].forEach((p) => ((p.x = x), (p.y = y)));
          tamano = MOVIENDO;
          velocidadTamano = 0;
          creciendo = null;
        }
      } else if (huellas.some((p) => Math.hypot(cliente.x - p.x, cliente.y - p.y) > MOVER_PX)) {
        movido = ahora;
      }
      huellas.push({ t: ahora, x: cliente.x, y: cliente.y });
      arrancar();
    };
    /* La flecha sale de la ventana: `pointerout` sin nada adonde ir. */
    const salir = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      dentro = false;
      arrancar();
    };
    /* Con el scroll el hero se mueve debajo de una flecha quieta: la gota se cierra como si se
       moviera, y lo que hay debajo de la flecha puede dejar de ser el hero. */
    const alDesplazar = () => {
      if (!dentro) return;
      movido = performance.now();
      const debajo = document.elementFromPoint(cliente.x, cliente.y);
      enHero = !!debajo && el.contains(debajo);
      soloPunto = !!debajo?.closest('[data-cursor-punto]');
      enEco = !!debajo?.closest('[data-cursor-eco]');
      arrancar();
    };

    window.addEventListener('pointermove', mover, { passive: true });
    document.addEventListener('pointerout', salir);
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', mover);
      document.removeEventListener('pointerout', salir);
      window.removeEventListener('scroll', alDesplazar);
    };
  }, [activo, anfitrion]);

  if (!montada) return null;

  const { w, h } = caja;

  return (
    <>
      {/* La capa de la foto, solo en el hero (ver LAS DOS CAPAS): sobre el titular y la bajada,
          debajo de los botones. Todo lo que lleva va recortado por la gota, y con la gota cerrada
          no se pinta (`display`, que escribe el bucle). */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
      >
        <defs>
          {/* La gota: el campo cortado por el umbral. Nada después del umbral: cualquier
              desenfoque ahí devuelve el borde semidifuminado que Alejandro pidió quitar. La región
              va en coordenadas del hero y la mueve el bucle, como la de la máscara. */}
          <filter
            ref={filtro}
            id="rd-hero-liquido"
            filterUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={0}
            height={0}
            colorInterpolationFilters="sRGB"
          >
            <Campo deriva={deriva} desplazar={desplazar} paredes={paredes} resta={restaGota} />
            <feColorMatrix in="campo" type="matrix" values={umbral(NIVEL)} />
          </filter>

          {/* La máscara recorta por la opacidad (`mask-type-alpha`), no por la luz: así el color
              de lo que lleva dentro no importa y no hace falta un blanco escrito a mano. Antes era
              de luz y pintaba sus círculos con blancos hexadecimales fuera del archivo de tokens
              (hallazgo H23 de la revisión del 6 de octubre de 2026). Blanco opaco por luz y
              cualquier color opaco por opacidad dejan pasar lo mismo: comparadas en capturas,
              ningún píxel de la gota se movió más de 2 niveles de 255, que es redondeo. */}
          <mask
            ref={mascara}
            id="rd-hero-ventana"
            className="mask-type-alpha"
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={0}
            height={0}
          >
            <g filter="url(#rd-hero-liquido)">
              {RADIOS.map((_, i) => (
                <circle
                  key={i}
                  ref={(c) => {
                    circulos.current[i] = c;
                  }}
                  cx={0}
                  cy={0}
                  r={0}
                />
              ))}
            </g>
          </mask>
        </defs>
        <g ref={grupoMascara} mask="url(#rd-hero-ventana)" display="none">
          {/* Lo que aparece cuando la gota se abre y se va cuando se cierra (ver LA FOTO DENTRO):
              la opacidad la escribe el bucle. */}
          <g ref={capaFoto} opacity={0}>
            {/* La foto, en un cuadrado centrado en la cabeza de la gota, que el bucle lleva con
                ella. Las cuatro cargadas y una sola visible: la que toca. */}
            <g ref={marcoFoto}>
              {FOTOS.map((f, i) => (
                <image
                  key={f.src}
                  ref={(im) => {
                    imagenes.current[i] = im;
                  }}
                  href={f.src}
                  x={-LADO_FOTO / 2}
                  y={-LADO_FOTO / 2}
                  width={LADO_FOTO}
                  height={LADO_FOTO}
                  preserveAspectRatio={f.encuadre}
                  visibility="hidden"
                />
              ))}
            </g>
            {/* La copia del texto, del ancho del hero como el bloque de verdad. `copiarTexto` la
                llena; React no le pone hijos. La sombra se hereda a todo su texto, y
                `rd-sobre-foto` le deja los colores claros también en el modo claro: va sobre una
                foto oscura. */}
            <foreignObject x={0} y={0} width={w} height={h}>
              <div ref={copia} inert className={`rd-sobre-foto ${SOMBRA}`} />
            </foreignObject>
          </g>
        </g>
      </svg>

      {/* La capa del cursor, para toda la página (ver LAS DOS CAPAS): fija, del tamaño de la
          ventana y encima de todo, montada en `body` para que ninguna sección la tape. Sin
          `viewBox`: sus unidades son píxeles de la ventana, y `origen` lleva a ellos las
          coordenadas del hero. */}
      {createPortal(
        <svg aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 h-full w-full select-none">
          <defs>
            {/* Los anillos: cada uno su campo cortado dos veces, la forma de dentro restada de la
                de fuera, y lo que queda pintado del amarillo del logo, #FBB000 (Alejandro, 6 de
                octubre de 2026: «el dot y el anillo del liquid que sean amarillo FBB000»); da 9:1
                sobre el negro del tema oscuro. Solo el primero lleva paredes. */}
            {ANILLOS.map((_, k) => (
              <filter
                key={k}
                ref={(f) => {
                  filtroAnillo.current[k] = f;
                }}
                id={`rd-cursor-anillo-${k}`}
                filterUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={0}
                height={0}
                colorInterpolationFilters="sRGB"
              >
                <Campo
                  deriva={(o) => {
                    derivaAnillo.current[k] = o;
                  }}
                  desplazar={(d) => {
                    desplazarAnillo.current[k] = d;
                  }}
                  paredes={k === 0 ? paredes : undefined}
                  resta={k === 0 ? restaAnillo : undefined}
                />
                <feColorMatrix in="campo" type="matrix" values={umbral(NIVEL)} result="fuera" />
                <feColorMatrix in="campo" type="matrix" values={umbral(NIVEL_DENTRO)} result="dentro" />
                <feComposite in="fuera" in2="dentro" operator="out" result="trazo" />
                <feFlood style={{ floodColor: 'var(--color-rd-amber)' }} result="tinta" />
                <feComposite in="tinta" in2="trazo" operator="in" />
              </filter>
            ))}

            {/* El punto líquido (ver `PUNTO_COLA`): desenfoque, onda, alisado y el mismo umbral
                que la gota. La región la mueve el bucle, como la de los otros filtros. */}
            <filter
              ref={filtroPunto}
              id="rd-cursor-punto"
              filterUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={0}
              height={0}
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation={DESENFOQUE_PUNTO} result="difuso" />
              <feTurbulence type="fractalNoise" baseFrequency={FRECUENCIA_PUNTO} numOctaves={1} seed={11} result="ruido" />
              <feOffset ref={derivaPunto} in="ruido" dx={0} dy={0} result="ruido-movido" />
              <feDisplacementMap
                ref={desplazarPunto}
                in="difuso"
                in2="ruido-movido"
                scale={ONDA_REPOSO * ONDA_PUNTO}
                xChannelSelector="R"
                yChannelSelector="G"
                result="ondulado"
              />
              <feGaussianBlur in="ondulado" stdDeviation={ALISADO} result="campo" />
              <feColorMatrix in="campo" type="matrix" values={umbral(NIVEL)} />
            </filter>
          </defs>

          <g ref={origen}>
            {/* Los tres anillos, del de dentro al de fuera. Sus círculos no llevan relleno: el
                filtro solo usa la forma y el color lo pone el amarillo. */}
            {ANILLOS.map((a, k) => (
              <g
                key={k}
                ref={(g) => {
                  grupoAnillo.current[k] = g;
                }}
                filter={`url(#rd-cursor-anillo-${k})`}
                opacity={a.opacidad}
              >
                {RADIOS.map((_, i) => (
                  <circle
                    key={i}
                    ref={(c) => {
                      circulosAnillo.current[k][i] = c;
                    }}
                    cx={0}
                    cy={0}
                    r={0}
                  />
                ))}
              </g>
            ))}
            {/* El punto del centro, encima de los anillos (ver EL PUNTO), ya líquido: cabeza y
                cola fundidas por su filtro. En el amarillo del logo, como los anillos (Alejandro,
                6 de octubre de 2026). */}
            <g filter="url(#rd-cursor-punto)">
              {PUNTO_COLA.map((_, i) => (
                <circle
                  key={i}
                  ref={(c) => {
                    puntos.current[i] = c;
                  }}
                  className="fill-rd-amber"
                  style={{ fill: 'var(--color-rd-amber)' }}
                  cx={0}
                  cy={0}
                  r={0}
                />
              ))}
            </g>
          </g>
        </svg>,
        document.body,
      )}
    </>
  );
};
