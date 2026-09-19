/**
 * La tabla de equivalencias de RaDAR (mockup/*): `Producto/assets/equivalencias.js`, tal cual.
 *
 * Pedir ayuda cuantifica por GRUPO (cuántas personas, viviendas o animales); ofrecer, por
 * recurso con número exacto. Cada recurso declara su unidad y su ración estándar: el número
 * del grupo se multiplica por la ración y por los días, y sale la meta. Se muestra CON SU
 * FÓRMULA y SIEMPRE es editable: la equivalencia propone, la organización decide.
 *
 * SOBRE LAS CIFRAS: solo el agua (3 L de bebida por persona y día) y los baños vienen de un
 * estándar publicado (Esfera). Las demás son puntos de partida que TIENE QUE VALIDAR el equipo
 * de operación antes de usarse en una emergencia real (`fuente: 'Por validar'`).
 */
import type { Base, CampoDetalle, DetalleRecurso, Equivalencia, OfertaRecurso } from '../types/flujo';

/** Qué mide cada base. Las tres responden igual: un número escrito, con cifras sugeridas. */
export const BASES: Record<string, Base> = {
  personas: {
    unidad: 'personas', libre: true,
    sugeridos: [10, 25, 50, 100, 200]
  },
  inmuebles: {
    unidad: 'viviendas', libre: true,
    sugeridos: [1, 5, 15, 40, 80]
  },
  animales: {
    unidad: 'animales', libre: true,
    sugeridos: [2, 10, 40, 100, 300]
  }
};

/** La ración por recurso: base, cantidad por unidad de base, unidad, si se consume a diario
 *  (y si los días la multiplican), la regla en palabras y de dónde sale. */
export const EQUIV: Record<string, Equivalencia> = {
  /* racion: la regla en palabras, tal como se le muestra a quien publica.
     fuente: de dónde sale. 'Por validar' = puesta por nosotros, sin respaldo aún. */
  /* Solo la bebida. Esfera fija 15 L por persona al día, pero eso incluye higiene
     (2 a 6 L) y cocina (3 a 6 L); la ingesta de supervivencia son 2,5 a 3 L. RaDAR
     pide únicamente esa línea, así que la ración lo dice para que nadie lea el número
     como si cubriera lavarse y cocinar. */
  'Agua potable':                  { base:'personas',  por:'persona',  cantidad:3,     unidad:'L',             diario:true,  racion:'3 L de bebida por persona al día',     fuente:'Esfera' },
  /* Todo se cuenta en personas, también lo que se entrega en paquete: un kit cubre a
     5 personas durante 15 días, así que la tasa es 1/(5×15) por persona y por día. El 5
     es el núcleo de referencia de la UNGRD; antes vivía escondido en una base «familias»
     que obligaba a una segunda pregunta y a que quien publica tradujera gente a hogares.
     Ahora está a la vista dentro de la ración y se corrige como cualquier otra cifra. */
  'Alimentos':                     { base:'personas',  por:'persona',  cantidad:1/75,  unidad:'kits',          diario:true,  racion:'1 kit de mercado cada 5 personas, cada 15 días', fuente:'Por validar' },
  /* Antes esto era «Ropa y cobijas · 2 unidades por persona»: una cobija y una muda
     contadas como dos unidades iguales. Alguien que donara 200 cobijas cubría el 100 %
     de una meta de 200 y todos seguían sin con qué vestirse — el mismo promedio que la
     decisión 6 prohibió entre recursos, reproducido dentro de uno. Las cobijas se fueron
     con las colchonetas, que es como se entregan (kit de dormida de la UNGRD), y aquí
     queda una unidad que significa una sola cosa. */
  'Ropa y calzado':                { base:'personas',  por:'persona',  cantidad:1,     unidad:'mudas',         diario:false, racion:'1 muda de ropa por persona',           fuente:'Por validar' },
  'Implementos de aseo e higiene': { base:'personas',  por:'persona',  cantidad:1/150, unidad:'kits',          diario:true,  racion:'1 kit de aseo cada 5 personas, cada 30 días', fuente:'Por validar' },
  /* El kit de dormida: cobija y colchoneta viajan juntas, así que son una sola unidad
     (decisión 8: «una oferta es lo que se entrega junto»). Las carpas se fueron a
     «Alojamiento temporal», donde ya vivía el espacio bajo techo: una carpa ES
     alojamiento, y tenerlas en dos recursos hacía que dos publicaciones pidieran lo
     mismo. Además la ración de aquí solo contaba colchonetas, así que quien pedía
     carpas recibía un número que no era el suyo. */
  'Cobijas y colchonetas':         { base:'personas',  por:'persona',  cantidad:1,     unidad:'juegos',        diario:false, racion:'1 cobija y 1 colchoneta por persona', fuente:'Por validar' },
  'Alojamiento temporal':          { base:'personas',  por:'persona',  cantidad:1,     unidad:'cupos',         diario:false, racion:'1 cupo por persona',                   fuente:'Por validar' },
  'Cuidado y alimento de animales':{ base:'animales',  por:'animal',   cantidad:1,     unidad:'kg',            diario:true,  racion:'1 kg por animal al día',               fuente:'Por validar' },

  'Atención médica':               { base:'personas',  por:'persona',  cantidad:1/100, unidad:'profesionales', diario:false, racion:'1 profesional por cada 100 personas',  fuente:'Por validar' },
  'Medicamentos / Botiquín':       { base:'personas',  por:'persona',  cantidad:1/50,  unidad:'botiquines',    diario:false, racion:'1 botiquín por cada 50 personas',      fuente:'Por validar' },

  'Remoción de escombros y barro': { base:'inmuebles', por:'vivienda', cantidad:1/4,   unidad:'cuadrillas',    diario:true,  multiplicaDias:false, racion:'1 cuadrilla despeja 4 viviendas al día', fuente:'Por validar' },
  'Mano de obra técnica y oficios':{ base:'inmuebles', por:'vivienda', cantidad:2,     unidad:'personas',      diario:false, racion:'2 oficiales por vivienda',             fuente:'Por validar' },
  'Materiales de obra básica':     { base:'inmuebles', por:'vivienda', cantidad:40,    unidad:'bultos',        diario:false, racion:'40 bultos por vivienda',               fuente:'Por validar' },
  'Cubiertas y cerramientos':      { base:'inmuebles', por:'vivienda', cantidad:12,    unidad:'tejas',         diario:false, racion:'12 tejas por vivienda',                fuente:'Por validar' },
  'Evaluación estructural y técnica':{ base:'inmuebles',por:'vivienda',cantidad:1,     unidad:'evaluaciones',  diario:false, racion:'1 evaluación por vivienda',            fuente:'Por validar' },

  'Saneamiento y baños portátiles':{ base:'personas',  por:'persona',  cantidad:1/20,  unidad:'unidades',      diario:false, racion:'1 baño por cada 20 personas',          fuente:'Esfera' },
};

/** Recursos que NO admiten meta calculada: su cantidad la declara quien publica. */
export const SIN_META: string[] = [
  'Maquinaria pesada y operarios', 'Plantas eléctricas / Generadores',
  'Equipos de bombeo', 'Transporte terrestre', 'Transporte aéreo', 'Transporte fluvial',
  'Almacenamiento y bodegaje', 'Aulas y espacios educativos temporales', 'Cocinas comunitarias',
  'Donar sangre / Banco de sangre', 'Aporte económico / Donación en dinero',
  'Equipo búsqueda y rescate', 'Ferretería e instalaciones básicas',
  'Herramientas de construcción', 'Censo, registro y apoyo operativo',
  'Voluntariado social y comunitario',
  /* Los cuatro salieron de la base «fuerza», que se retiró. Los dos voluntariados
     ERAN el grupo partido por tipo, así que un solo número se multiplicaba: 40
     personas de apoyo salían como 40 en acopio Y 40 en terreno. Los tapabocas y las
     herramientas son cosas, no gente, y quién las use lo decide la organización. */
  'Voluntariado en terreno', 'Voluntariado en acopio y empaque',
  'Herramientas de mano', 'Protección respiratoria',
  /* Capacidades técnicas. Ninguna calcula: nadie publica «un ingeniero por cada N
     viviendas». «Salud mental y apoyo psicosocial» absorbe al viejo «Apoyo psicológico
     y emocional», que traía una ración de 1 por cada 40 personas sin respaldo: el marco
     IASC organiza esa respuesta en niveles de intervención, no en razones. */
  'Ingeniería, arquitectura y peritaje', 'Geología, geotecnia y gestión del riesgo',
  'Asesoría legal y jurídica', 'Auditoría, contabilidad y finanzas',
  'Veterinaria y manejo zootécnico', 'Salud mental y apoyo psicosocial'
];

/** El detalle de cada recurso al pedir: una pregunta, y campos (`num` hace de cantidad en
 *  los recursos sin meta; `texto` es libre y opcional). */
export const DETALLE: Record<string, DetalleRecurso> = {
  'Agua potable':                  { pregunta:'¿Cómo puedes recibir el agua?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: botellas o bolsas, carrotanque, tanque para almacenar'} ] },
  'Alimentos':                     { pregunta:'¿Qué tipo de alimentos?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: mercados no perecederos, comida preparada, alimento para bebés, sin gluten, sin cocina para preparar'} ] },
  'Ropa y calzado':                { pregunta:'¿Qué ropa hace falta?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: ropa de adulto, ropa de niños y niñas, calzado, impermeables'} ] },
  'Implementos de aseo e higiene': { pregunta:'¿Qué implementos de aseo?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: kit de aseo personal, pañales de bebé, pañales de adulto, toallas higiénicas'} ] },
  'Cobijas y colchonetas':            { pregunta:'¿Cobijas, colchonetas o ambas?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: cobijas, colchonetas, sábanas y almohadas'} ] },
  'Cuidado y alimento de animales':{ pregunta:'¿Qué animales son y qué necesitas?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: perros y gatos, ganado, aves de corral; alimento, atención veterinaria o traslado'} ] },

  'Atención médica':               { pregunta:'¿Qué perfil de salud necesitas?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: medicina general, enfermería, pediatría, paramédicos, salud mental'} ] },
  'Medicamentos / Botiquín':       { pregunta:'¿Qué medicamentos necesitas?', ayuda:'Si hay recetas, escribe los nombres tal cual.', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: botiquín básico, antibióticos, sueros de rehidratación, losartán 50 mg, insulina con refrigeración'} ] },
  'Donar sangre / Banco de sangre':{ pregunta:'¿Qué tipo de sangre necesitas?', ayuda:'Si no saben el tipo, escríbelo como «cualquiera».', campos:[
      {k:'num', t:'num', l:'Cuántas personas donantes', u:'donantes', req:true, sug:[10,25,50,100]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: O+, O−, A+, cualquiera; reciben en el Hospital de Bosa o en la Cruz Roja'} ] },
  'Protección respiratoria':       { pregunta:'¿Qué protección respiratoria?', campos:[
      {k:'num', t:'num', l:'Cuántos tapabocas', u:'unidades', req:true, sug:[50,100,200,500]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: tapabocas quirúrgicos, respiradores N95, gafas de protección'} ] },

  'Ingeniería, arquitectura y peritaje': { pregunta:'¿Qué necesitas que revisen o diseñen?', campos:[
      {k:'num', t:'num', l:'Cuántos profesionales', u:'profesionales', req:true, sug:[1,2,3,5]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: peritaje de una casa agrietada, diseño de un puente peatonal, cálculo estructural'} ] },
  'Geología, geotecnia y gestión del riesgo': { pregunta:'¿Qué hay que evaluar del terreno?', campos:[
      {k:'num', t:'num', l:'Cuántos profesionales', u:'profesionales', req:true, sug:[1,2,3,5]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: una ladera que se movió, riesgo de nuevo deslizamiento, estudio de suelos'} ] },
  'Asesoría legal y jurídica':       { pregunta:'¿En qué necesitas asesoría?', campos:[
      {k:'num', t:'num', l:'Cuántos profesionales', u:'profesionales', req:true, sug:[1,2,3,5]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: recuperar documentos perdidos, tutelas, títulos de propiedad, derechos de petición'} ] },
  'Auditoría, contabilidad y finanzas': { pregunta:'¿En qué necesitas apoyo contable?', campos:[
      {k:'num', t:'num', l:'Cuántos profesionales', u:'profesionales', req:true, sug:[1,2,3,5]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: rendir cuentas de lo donado, contabilidad de la fundación, auditoría de la entrega'} ] },
  'Veterinaria y manejo zootécnico': { pregunta:'¿Qué necesitan los animales?', campos:[
      {k:'num', t:'num', l:'Cuántos profesionales', u:'profesionales', req:true, sug:[1,2,3,5]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: atención a animales heridos, vacunación, manejo de un lote de ganado'} ] },
  'Salud mental y apoyo psicosocial': { pregunta:'¿Para quién es el acompañamiento?', campos:[
      {k:'num', t:'num', l:'Cuántos profesionales', u:'profesionales', req:true, sug:[1,2,3,5]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: niños y niñas, personas mayores, familias que perdieron a alguien, equipos de respuesta'} ] },
  'Equipo búsqueda y rescate':     { pregunta:'¿Qué tipo de rescate?', campos:[
      {k:'num', t:'num', l:'Personas atrapadas o sin ubicar', u:'personas', req:true, sug:[1,3,5,10]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: estructuras colapsadas, rescate en el agua, perros de búsqueda, rescate en ladera'} ] },
  'Herramientas de mano':          { pregunta:'¿Qué herramientas de mano?', campos:[
      {k:'num', t:'num', l:'Cuántos juegos', u:'juegos', req:true, sug:[2,5,10,20]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: palas, picas, carretillas, machetes, motosierras'} ] },
  'Remoción de escombros y barro': { pregunta:'¿Qué necesitas remover?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: barro y lodo, escombros de construcción, árboles caídos'} ] },
  'Maquinaria pesada y operarios': { pregunta:'¿Qué maquinaria necesitas?', campos:[
      {k:'num', t:'num', l:'Cuántas máquinas', u:'máquinas', req:true, sug:[1,2,3,5]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: retroexcavadora, volqueta, cargador, grúa, minicargador'} ] },
  'Plantas eléctricas / Generadores':{ pregunta:'¿Qué planta eléctrica necesitas?', ayuda:'Si no saben la potencia, describe qué van a conectar.', campos:[
      {k:'num', t:'num', l:'Cuántas', u:'plantas', req:true, sug:[1,2,5]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: luces y cargadores de celular, un albergue completo, un centro de salud o una motobomba'} ] },
  'Equipos de bombeo':             { pregunta:'¿Qué necesitas bombear?', campos:[
      {k:'num', t:'num', l:'Cuántas motobombas', u:'motobombas', req:true, sug:[1,2,5]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: agua limpia o con lodo; en viviendas, sótanos, calles o cultivos'} ] },

  'Evaluación estructural y técnica':{ pregunta:'¿Qué necesitas evaluar?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: viviendas, colegio o salón comunal, puente o vía, ladera o talud'} ] },
  'Materiales de obra básica':     { pregunta:'¿Qué materiales de obra?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: cemento, arena y gravilla, ladrillo o bloque, madera, varilla'} ] },
  'Ferretería e instalaciones básicas':{ pregunta:'¿Qué instalaciones necesitas arreglar?', campos:[
      {k:'num', t:'num', l:'Cuántas viviendas', u:'viviendas', req:true, sug:[1,5,15,40]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: instalaciones eléctricas, plomería y tubería, puertas y cerraduras, ventanas'} ] },
  'Cubiertas y cerramientos':      { pregunta:'¿Qué tipo de cubierta?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: tejas de zinc, tejas de fibrocemento, plásticos o lonas, listones y madera'} ] },
  'Herramientas de construcción':  { pregunta:'¿Qué herramientas de construcción?', campos:[
      {k:'num', t:'num', l:'Cuántos juegos', u:'juegos', req:true, sug:[1,2,5,10]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: taladros, pulidoras, mezcladora, andamios, escaleras'} ] },
  'Mano de obra técnica y oficios':{ pregunta:'¿Qué oficios necesitas?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: albañilería, electricidad, plomería, carpintería, soldadura'} ] },

  'Alojamiento temporal':          { pregunta:'¿Para quién es el alojamiento?', campos:[
      {k:'noches', t:'num', l:'Por cuántas noches', u:'noches', req:true, sug:[1,3,7,15]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: carpas para 4, familias completas, personas solas, personas con mascotas o con movilidad reducida'} ] },
  'Transporte terrestre':          { pregunta:'¿Para qué es el transporte?', ayuda:'La vía nos dice qué carro puede llegar.', campos:[
      {k:'num', t:'num', l:'Cuántos viajes', u:'viajes', req:true, sug:[1,3,5,10]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: personas o carga; vía pavimentada, destapada o solo 4×4 y moto'} ] },
  'Transporte aéreo':              { pregunta:'¿Para qué es el transporte aéreo?', campos:[
      {k:'num', t:'num', l:'Cuántas personas', u:'personas', req:true, sug:[5,10,20,50]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: evacuación médica, personas aisladas, llevar carga'} ] },
  'Transporte fluvial':            { pregunta:'¿Para qué es el transporte fluvial?', campos:[
      {k:'num', t:'num', l:'Cuántos viajes', u:'viajes', req:true, sug:[1,3,5,10]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: personas o carga; veredas a las que solo se llega por el río'} ] },
  'Saneamiento y baños portátiles':{ pregunta:'¿Qué necesitas de saneamiento?', campos:[
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: baños portátiles, duchas, lavamanos, manejo de basuras'} ] },
  'Almacenamiento y bodegaje':     { pregunta:'¿Qué necesitas guardar?', campos:[
      /* Se medía en días, que es duración y no cantidad: una bodega no se necesita
         «doce» por doce días, es la misma bodega. Además el lado de ofrecer ya declara
         Área en m², así que las dos mitades hablaban idiomas distintos y el cruce, que
         empareja por recurso y unidad, nunca las habría juntado. El tiempo pasa al
         detalle, donde vive el resto del contexto. */
      {k:'num', t:'num', l:'Cuántos metros cuadrados', u:'m²', req:true, sug:[20,50,100,200]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: alimentos, ropa, herramientas, medicamentos con refrigeración; por 15 o 30 días'} ] },
  'Aulas y espacios educativos temporales':{ pregunta:'¿Cuántos niños y niñas?', campos:[
      {k:'num', t:'num', l:'Cuántos cupos', u:'cupos', req:true, sug:[20,50,100]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: espacio, docentes, materiales y útiles'} ] },
  'Cocinas comunitarias':          { pregunta:'¿Cuántas raciones al día?', campos:[
      {k:'num', t:'num', l:'Raciones al día', u:'raciones al día', req:true, sug:[50,100,300]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: espacio y equipo, personas que cocinen, alimentos para preparar'} ] },

  'Aporte económico / Donación en dinero':{ pregunta:'¿Cuánto y para qué?', ayuda:'Un aproximado sirve.', campos:[
      {k:'num', t:'num', l:'Monto aproximado', u:'pesos', req:true},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: para alimentos, materiales o lo que más urja; lo reciben en la cuenta de la fundación o por Nequi'} ] },

  'Voluntariado en acopio y empaque':{ pregunta:'¿En qué horario?', campos:[
      {k:'num', t:'num', l:'Cuántas personas', u:'personas', req:true, sug:[2,5,10,20]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: mañana, tarde, noche, fin de semana'} ] },
  'Voluntariado en terreno':       { pregunta:'¿Qué perfil de voluntariado?', campos:[
      {k:'num', t:'num', l:'Cuántas personas', u:'personas', req:true, sug:[2,5,10,20]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: buena condición física, con experiencia en emergencias, con vehículo'} ] },
  'Voluntariado social y comunitario':{ pregunta:'¿Para qué es el voluntariado?', campos:[
      {k:'num', t:'num', l:'Cuántas personas', u:'personas', req:true, sug:[2,5,10,20]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: acompañar familias, actividades con niños y niñas, personas mayores, lengua de señas'} ] },
  'Censo, registro y apoyo operativo':{ pregunta:'¿Qué apoyo operativo?', campos:[
      {k:'num', t:'num', l:'Cuántas personas', u:'personas', req:true, sug:[2,5,10,20]},
      {k:'nota', t:'texto', l:'Detalles', p:'Por ejemplo: censo puerta a puerta, registro en el albergue, logística y bodega'} ] }
};

const TIEMPO_DISP: CampoDetalle = {k:'tiempo', t:'una', l:'Tiempo disponible', req:true, op:['48 horas','3 días','1 semana']};
const DEDICACION: CampoDetalle = {k:'ded', t:'una', l:'Dedicación', req:true, op:['Jornada completa','Medio tiempo','Fines de semana','Turnos de guardia']};
const TURNO: CampoDetalle = {k:'turno', t:'multi', l:'Turnos', req:true, op:['Mañana (7 a. m. a 1 p. m.)','Tarde (1 p. m. a 7 p. m.)','Jornada completa','Fin de semana']};

/** Lo que declara una OFERTA de cada recurso: presentación, dedicación, vehículo, tiempo.
 *  Si un recurso no está aquí, la oferta reutiliza los campos de `DETALLE` que no son
 *  cantidad. `unidad`: en qué se cuenta la oferta (si no, la de la equivalencia). */
export const OFERTA: Record<string, OfertaRecurso> = {
  'Agua potable':                  { campos:[{k:'pres', t:'una', l:'Presentación', req:true, op:['Botellones de 5 L','Botellas de 500 ml','Galones','Carrotanque']}] },
  'Alimentos':                     { campos:[{k:'pres', t:'una', l:'Presentación', req:true, op:['Kits de mercado','Bultos de 25 kg','Bultos de 50 kg','Kilos sueltos','Comida preparada']}] },
  'Ropa y calzado':                { campos:[{k:'que', t:'multi', l:'Qué', req:true, op:['Ropa de adulto','Ropa de niños y niñas','Calzado','Impermeables']}, {k:'esp', t:'texto', l:'Tallas o especificación', p:'Por ejemplo: colchonetas nuevas de 1 plaza, tapabocas N95'}] },
  'Cobijas y colchonetas':            { campos:[{k:'que', t:'multi', l:'Qué', req:true, op:['Cobijas','Colchonetas','Sábanas y almohadas']}, {k:'esp', t:'texto', l:'Especificación', p:'Por ejemplo: carpas para 4 personas, colchonetas de 1 plaza'}] },
  'Atención médica':               { unidad:'profesionales', campos:[{k:'perfil', t:'multi', l:'Perfil', req:true, op:['Medicina general','Enfermería','Pediatría','Paramédicos','Salud mental','Otro']}, DEDICACION] },
  'Ingeniería, arquitectura y peritaje': { unidad:'profesionales', campos:[
      {k:'perfil', t:'multi', l:'Perfil', req:true, op:['Ingeniería civil','Arquitectura','Peritaje de daños','Cálculo estructural','Diseño de obra']},
      DEDICACION,
      {k:'esp', t:'texto', l:'Tarjeta profesional o especialidad', p:'Por ejemplo: matrícula vigente del COPNIA, diez años en obra civil'} ] },
  'Geología, geotecnia y gestión del riesgo': { unidad:'profesionales', campos:[
      {k:'perfil', t:'multi', l:'Perfil', req:true, op:['Geología','Geotecnia','Estudio de suelos','Evaluación de amenaza','Gestión del riesgo']},
      DEDICACION,
      {k:'esp', t:'texto', l:'Tarjeta profesional o especialidad', p:'Por ejemplo: matrícula vigente del COPNIA, diez años en obra civil'} ] },
  'Asesoría legal y jurídica':       { unidad:'profesionales', campos:[
      {k:'perfil', t:'multi', l:'Perfil', req:true, op:['Derecho civil','Derecho de familia','Tutelas y peticiones','Títulos y propiedad','Documentos de identidad']},
      DEDICACION,
      {k:'esp', t:'texto', l:'Tarjeta profesional o especialidad', p:'Por ejemplo: matrícula vigente del COPNIA, diez años en obra civil'} ] },
  'Auditoría, contabilidad y finanzas': { unidad:'profesionales', campos:[
      {k:'perfil', t:'multi', l:'Perfil', req:true, op:['Contabilidad','Auditoría','Rendición de cuentas','Formulación de proyectos']},
      DEDICACION,
      {k:'esp', t:'texto', l:'Tarjeta profesional o especialidad', p:'Por ejemplo: matrícula vigente del COPNIA, diez años en obra civil'} ] },
  'Veterinaria y manejo zootécnico': { unidad:'profesionales', campos:[
      {k:'perfil', t:'multi', l:'Perfil', req:true, op:['Medicina veterinaria','Manejo de ganado','Vacunación','Traslado de animales']},
      DEDICACION,
      {k:'esp', t:'texto', l:'Tarjeta profesional o especialidad', p:'Por ejemplo: matrícula vigente del COPNIA, diez años en obra civil'} ] },
  'Salud mental y apoyo psicosocial': { unidad:'profesionales', campos:[
      {k:'perfil', t:'multi', l:'Perfil', req:true, op:['Psicología clínica','Primeros auxilios psicológicos','Acompañamiento a duelo','Trabajo social','Trabajo con niños y niñas']},
      DEDICACION,
      {k:'esp', t:'texto', l:'Tarjeta profesional o especialidad', p:'Por ejemplo: matrícula vigente del COPNIA, diez años en obra civil'} ] },
  'Voluntariado en acopio y empaque':{ unidad:'personas', campos:[TURNO] },
  'Voluntariado en terreno':       { unidad:'personas', campos:[{k:'perfil', t:'multi', l:'Perfil', req:true, op:['Buena condición física','Con experiencia en emergencias','Con vehículo']}, TURNO] },
  'Voluntariado social y comunitario':{ unidad:'personas', campos:[{k:'para', t:'multi', l:'Para qué', req:true, op:['Acompañar familias','Actividades con niños y niñas','Personas mayores','Lengua de señas o traducción']}, TURNO] },
  'Censo, registro y apoyo operativo':{ unidad:'personas', campos:[{k:'tarea', t:'multi', l:'Tareas', req:true, op:['Censo puerta a puerta','Registro en el albergue','Logística y bodega','Comunicaciones']}, TURNO] },
  'Remoción de escombros y barro': { unidad:'cuadrillas', campos:[{k:'personas', t:'num', l:'Personas por cuadrilla', u:'personas', req:true}, TURNO] },
  'Mano de obra técnica y oficios':{ unidad:'personas', campos:[{k:'que', t:'multi', l:'Oficios', req:true, op:['Albañilería','Electricidad','Plomería','Carpintería','Soldadura']}, DEDICACION] },
  'Transporte terrestre':          { unidad:'viajes', campos:[{k:'veh', t:'una', l:'Tipo de vehículo', req:true, op:['Camioneta 4×4','Camión o furgón','Vehículo particular','Moto']}, {k:'cap', t:'una', l:'Capacidad', req:true, op:['1 tonelada','3 a 5 toneladas','4 pasajeros','Más de 10 pasajeros']}] },
  'Transporte fluvial':            { unidad:'viajes', campos:[{k:'veh', t:'una', l:'Tipo', req:true, op:['Lancha rápida','Canoa con motor','Planchón']}, {k:'cap', t:'una', l:'Capacidad', req:true, op:['Hasta 4 personas','5 a 10 personas','Carga']}] },
  'Transporte aéreo':              { unidad:'personas', campos:[{k:'veh', t:'una', l:'Tipo', req:true, op:['Helicóptero','Avioneta','Dron de carga']}] },
  'Maquinaria pesada y operarios': { unidad:'máquinas', campos:[{k:'que', t:'multi', l:'Cuál', req:true, op:['Retroexcavadora','Volqueta','Cargador','Grúa','Minicargador']}, TIEMPO_DISP] },
  'Plantas eléctricas / Generadores':{ unidad:'plantas', campos:[{k:'potencia', t:'una', l:'Potencia', req:true, op:['Hasta 5 kW','5 a 20 kW','Más de 20 kW']}, TIEMPO_DISP] },
  'Equipos de bombeo':             { unidad:'motobombas', campos:[{k:'tipo', t:'una', l:'Tipo', req:true, op:['Motobomba de 2 pulgadas','Motobomba de 3 pulgadas','Bomba sumergible']}, TIEMPO_DISP] },
  'Herramientas de mano':          { unidad:'juegos', campos:[{k:'que', t:'multi', l:'Cuáles', req:true, op:['Palas','Picas','Carretillas','Machetes','Motosierras','Baldes']}] },
  'Herramientas de construcción':  { unidad:'juegos', campos:[{k:'que', t:'multi', l:'Cuáles', req:true, op:['Taladros','Pulidoras','Mezcladora','Andamios','Escaleras']}, TIEMPO_DISP] },
  'Almacenamiento y bodegaje':     { unidad:'m²', campos:[{k:'esp', t:'una', l:'Tipo de espacio', req:true, op:['Bodega techada','Patio de acopio','Cuarto o local']}, {k:'m2', t:'num', l:'Área', u:'m²', req:true}, {k:'tiempo', t:'una', l:'Tiempo de préstamo', req:true, op:['15 días','30 días']}] },
  'Alojamiento temporal':          { unidad:'cupos', campos:[{k:'tipo', t:'una', l:'Tipo', req:true, op:['Camas en albergue','Habitaciones en casas','Carpas en lote','Carpas para entregar']}, {k:'quien', t:'multi', l:'Reciben', req:true, op:['Familias completas','Personas solas','Personas con mascotas','Personas con movilidad reducida']}, {k:'tiempo', t:'una', l:'Por cuánto tiempo', req:true, op:['15 días','30 días']}] },
  'Cocinas comunitarias':          { unidad:'raciones al día', campos:[{k:'que', t:'multi', l:'Qué ofrecen', req:true, op:['Espacio y equipo','Personas que cocinen','Alimentos para preparar']}] },
  'Aulas y espacios educativos temporales':{ unidad:'cupos', campos:[{k:'que', t:'multi', l:'Qué ofrecen', req:true, op:['Espacio','Docentes','Materiales y útiles']}] },
  'Donar sangre / Banco de sangre':{ unidad:'donantes', campos:[{k:'tipo', t:'multi', l:'Tipo de sangre', req:true, op:['O+','O−','A+','A−','B+','B−','AB+','AB−']}] },
  /* --- Los diez que antes heredaban sus campos de RD_DETALLE.
     Ahora tienen entrada propia, porque el lado de PEDIR pasó a texto libre y el
     de OFRECER conserva sus opciones cerradas. La razón es la misma asimetría con
     la que nació este archivo: quien pide está dentro de la emergencia y escribe
     como puede; quien ofrece está en una bodega y tiene calma para elegir. --- */
  'Implementos de aseo e higiene': { campos:[{k:'que', t:'multi', l:'Qué', req:true, op:['Kit de aseo personal','Pañales de bebé','Pañales de adulto','Toallas higiénicas','Productos de limpieza']}] },
  'Cuidado y alimento de animales':{ campos:[{k:'tipo', t:'multi', l:'Tipo de animales', req:true, op:['Perros y gatos','Ganado','Aves de corral','Caballos o mulas','Otros']}, {k:'que', t:'multi', l:'Qué ofrecen', req:true, op:['Alimento','Atención veterinaria','Refugio o traslado']}] },
  'Medicamentos / Botiquín':       { campos:[{k:'que', t:'multi', l:'Qué', req:true, op:['Botiquín básico','Medicamentos para enfermedades crónicas','Antibióticos','Sueros de rehidratación','Insulina (con refrigeración)']}, {k:'esp', t:'texto', l:'Medicamentos específicos', p:'Por ejemplo: losartán 50 mg, salbutamol inhalador'}] },
  'Protección respiratoria':       { campos:[{k:'que', t:'multi', l:'Qué', req:true, op:['Tapabocas quirúrgicos','Respiradores N95','Gafas de protección']}] },
  'Equipo búsqueda y rescate':     { campos:[{k:'tipo', t:'multi', l:'Tipo', req:true, op:['Estructuras colapsadas','Rescate acuático','Binomios caninos','Rescate en montaña o ladera']}] },
  'Evaluación estructural y técnica':{ campos:[{k:'que', t:'multi', l:'Tipo de construcción', req:true, op:['Viviendas','Colegio o salón comunal','Puente o vía','Edificio en altura','Ladera o talud']}] },
  'Materiales de obra básica':     { campos:[{k:'que', t:'multi', l:'Cuáles', req:true, op:['Cemento','Arena y gravilla','Ladrillo o bloque','Madera','Varilla']}] },
  'Ferretería e instalaciones básicas':{ campos:[{k:'que', t:'multi', l:'Qué', req:true, op:['Instalaciones eléctricas','Plomería y tubería','Puertas y cerraduras','Ventanas']}] },
  'Cubiertas y cerramientos':      { campos:[{k:'que', t:'multi', l:'Cuáles', req:true, op:['Tejas de zinc','Tejas de fibrocemento','Plásticos o lonas','Listones y madera']}] },
  'Saneamiento y baños portátiles':{ campos:[{k:'que', t:'multi', l:'Qué', req:true, op:['Baños portátiles','Duchas','Lavamanos','Manejo de basuras']}] },

  'Aporte económico / Donación en dinero':{ unidad:'pesos', campos:[{k:'para', t:'una', l:'Para qué', req:true, op:['Alimentos','Materiales','Transporte','Lo que más urja']}] }
};
