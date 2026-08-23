/**
 * Departamentos y Municipios de Colombia
 * Organizados alfabéticamente por departamento y ciudad.
 * Fuente: DANE - División Político-Administrativa de Colombia
 */

export interface ColombiaCity {
  id: string;
  name: string;
  departmentId: string;
}

export interface Department {
  id: string;
  name: string;
  cities: ColombiaCity[];
}

/** Genera un id slug a partir de un nombre */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Crea un departamento con sus ciudades ya slugificadas */
function dept(name: string, cities: string[]): Department {
  const deptId = toSlug(name);
  return {
    id: deptId,
    name,
    cities: cities.map((c) => ({ id: toSlug(c), name: c, departmentId: deptId })),
  };
}

export const DEPARTMENTS: Department[] = [
  dept("Amazonas", ["Leticia", "Puerto Nariño"]),
  dept("Antioquia", [
    "Abejorral", "Abriaquí", "Alejandría", "Amagá", "Amalfi", "Andes", "Angelópolis",
    "Angostura", "Anorí", "Anzá", "Apartadó", "Arboletes", "Argelia", "Armenia",
    "Barbosa", "Bello", "Belmira", "Betania", "Betulia", "Briceño", "Buriticá",
    "Cáceres", "Caicedo", "Caldas", "Campamento", "Cañasgordas", "Caracolí",
    "Caramanta", "Carepa", "Carolina del Príncipe", "Caucasia", "Chigorodó",
    "Cisneros", "Ciudad Bolívar", "Cocorná", "Concepción", "Concordia", "Copacabana",
    "Dabeiba", "Donmatías", "Ebéjico", "El Bagre", "El Carmen de Viboral",
    "El Peñol", "El Retiro", "El Santuario", "Entrerríos", "Envigado", "Fredonia",
    "Frontino", "Giraldo", "Girardota", "Gómez Plata", "Granada", "Guadalupe",
    "Guarne", "Guatapé", "Heliconia", "Hispania", "Itagüí", "Ituango", "Jardín",
    "Jericó", "La Ceja", "La Estrella", "La Pintada", "La Unión", "Liborina",
    "Maceo", "Marinilla", "Medellín", "Montebello", "Murindó", "Mutatá", "Nariño",
    "Nechí", "Necoclí", "Olaya", "Peque", "Pueblorrico", "Puerto Berrío",
    "Puerto Nare", "Puerto Triunfo", "Remedios", "Rionegro", "Sabanalarga",
    "Sabaneta", "Salgar", "San Andrés de Cuerquia", "San Carlos", "San Francisco",
    "San Jerónimo", "San José de la Montaña", "San Juan de Urabá", "San Luis",
    "San Pedro de Urabá", "San Pedro de los Milagros", "San Rafael", "San Roque",
    "San Vicente", "Santa Bárbara", "Santa Fe de Antioquia", "Santa Rosa de Osos",
    "Santo Domingo", "Segovia", "Sonsón", "Sopetrán", "Támesis", "Tarazá", "Tarso",
    "Titiribí", "Toledo", "Turbo", "Uramita", "Urrao", "Valdivia", "Valparaíso",
    "Vegachí", "Venecia", "Vigía del Fuerte", "Yalí", "Yarumal", "Yolombó",
    "Yondó", "Zaragoza"
  ]),
  dept("Arauca", ["Arauca", "Arauquita", "Cravo Norte", "Fortul", "Puerto Rondón", "Saravena", "Tame"]),
  dept("Atlántico", [
    "Baranoa", "Barranquilla", "Campo de la Cruz", "Candelaria", "Galapa",
    "Juan de Acosta", "Luruaco", "Malambo", "Manatí", "Palmar de Varela", "Piojó",
    "Polonuevo", "Ponedera", "Puerto Colombia", "Repelón", "Sabanagrande",
    "Sabanalarga", "Santa Lucía", "Santo Tomás", "Soledad", "Suán", "Tubará", "Usiacurí"
  ]),
  dept("Bolívar", [
    "Achí", "Altos del Rosario", "Arenal", "Arjona", "Arroyohondo",
    "Barranco de Loba", "Brazuelo de Papayal", "Calamar", "Cantagallo",
    "Cartagena de Indias", "Cicuco", "Clemencia", "El Carmen de Bolívar",
    "El Guamo", "El Peñón", "Hatillo de Loba", "Magangué", "Mahates", "Margarita",
    "María la Baja", "Mompós", "Montecristo", "Morales", "Norosí", "Pinillos",
    "Regidor", "Río Viejo", "San Cristóbal", "San Estanislao", "San Fernando",
    "San Jacinto del Cauca", "San Jacinto", "San Juan Nepomuceno",
    "San Martín de Loba", "San Pablo", "Santa Catalina", "Santa Rosa",
    "Santa Rosa del Sur", "Simití", "Soplaviento", "Talaigua Nuevo", "Tiquisio",
    "Turbaco", "Turbaná", "Villanueva", "Zambrano"
  ]),
  dept("Boyacá", [
    "Almeida", "Aquitania", "Arcabuco", "Belén", "Berbeo", "Betéitiva", "Boavita",
    "Boyacá", "Briceño", "Buenavista", "Busbanzá", "Caldas", "Campohermoso",
    "Cerinza", "Chinavita", "Chiquinquirá", "Chíquiza", "Chiscas", "Chita",
    "Chitaraque", "Chivatá", "Chivor", "Ciénega", "Cómbita", "Coper", "Corrales",
    "Covarachía", "Cubará", "Cucaita", "Cuítiva", "Duitama", "El Cocuy",
    "El Espino", "Firavitoba", "Floresta", "Gachantivá", "Gámeza", "Garagoa",
    "Guacamayas", "Guateque", "Guayatá", "Güicán", "Iza", "Jenesano", "Jericó",
    "La Capilla", "La Uvita", "La Victoria", "Labranzagrande", "Macanal", "Maripí",
    "Miraflores", "Mongua", "Monguí", "Moniquirá", "Motavita", "Muzo", "Nobsa",
    "Nuevo Colón", "Oicatá", "Otanche", "Pachavita", "Páez", "Paipa", "Pajarito",
    "Panqueba", "Pauna", "Paya", "Paz del Río", "Pesca", "Pisba", "Puerto Boyacá",
    "Quípama", "Ramiriquí", "Ráquira", "Rondón", "Saboyá", "Sáchica", "Samacá",
    "San Eduardo", "San José de Pare", "San Luis de Gaceno", "San Mateo",
    "San Miguel de Sema", "San Pablo de Borbur", "Santa María", "Santa Rosa de Viterbo",
    "Santa Sofía", "Santana", "Sativanorte", "Sativasur", "Siachoque", "Soatá",
    "Socha", "Socotá", "Sogamoso", "Somondoco", "Sora", "Soracá", "Sotaquirá",
    "Susacón", "Sutamarchán", "Sutatenza", "Tasco", "Tenza", "Tibaná", "Tibasosa",
    "Tinjacá", "Tipacoque", "Toca", "Togüí", "Tópaga", "Tota", "Tunja",
    "Tununguá", "Turmequé", "Tuta", "Tutazá", "Úmbita", "Ventaquemada",
    "Villa de Leyva", "Viracachá", "Zetaquira"
  ]),
  dept("Caldas", [
    "Aguadas", "Anserma", "Aranzazu", "Belalcázar", "Chinchiná", "Filadelfia",
    "La Dorada", "La Merced", "Manizales", "Manzanares", "Marmato", "Marquetalia",
    "Marulanda", "Neira", "Norcasia", "Pácora", "Palestina", "Pensilvania",
    "Riosucio", "Risaralda", "Salamina", "Samaná", "San José", "Supía", "Victoria",
    "Villamaría", "Viterbo"
  ]),
  dept("Caquetá", [
    "Albania", "Belén de los Andaquíes", "Cartagena del Chairá", "Curillo",
    "El Doncello", "El Paujil", "Florencia", "La Montañita", "Milán", "Morelia",
    "Puerto Rico", "San José del Fragua", "San Vicente del Caguán", "Solano",
    "Solita", "Valparaíso"
  ]),
  dept("Casanare", [
    "Aguazul", "Chámeza", "Hato Corozal", "La Salina", "Maní", "Monterrey",
    "Nunchía", "Orocué", "Paz de Ariporo", "Pore", "Recetor", "Sabanalarga",
    "Sácama", "San Luis de Palenque", "Támara", "Tauramena", "Trinidad",
    "Villanueva", "Yopal"
  ]),
  dept("Cauca", [
    "Almaguer", "Argelia", "Balboa", "Bolívar", "Buenos Aires", "Cajibío",
    "Caldono", "Caloto", "Corinto", "El Tambo", "Florencia", "Guachené", "Guapí",
    "Inzá", "Jambaló", "La Sierra", "La Vega", "López de Micay", "Mercaderes",
    "Miranda", "Morales", "Padilla", "Páez", "Patía", "Piamonte", "Piendamó",
    "Popayán", "Puerto Tejada", "Puracé", "Rosas", "San Sebastián", "Santa Rosa",
    "Santander de Quilichao", "Silvia", "Sotará", "Suárez", "Sucre", "Timbío",
    "Timbiquí", "Toribío", "Totoró", "Villa Rica"
  ]),
  dept("Cesar", [
    "Aguachica", "Agustín Codazzi", "Astrea", "Becerril", "Bosconia",
    "Chimichagua", "Chiriguaná", "Curumaní", "El Copey", "El Paso", "Gamarra",
    "González", "La Gloria", "La Jagua de Ibirico", "La Paz",
    "Manaure Balcón del Cesar", "Pailitas", "Pelaya", "Pueblo Bello", "Río de Oro",
    "San Alberto", "San Diego", "San Martín", "Tamalameque", "Valledupar"
  ]),
  dept("Chocó", [
    "Acandí", "Alto Baudó", "Bagadó", "Bahía Solano", "Bajo Baudó", "Bojayá",
    "Cantón de San Pablo", "Cértegui", "Condoto", "El Atrato", "El Carmen de Atrato",
    "El Carmen del Darién", "Istmina", "Juradó", "Litoral de San Juan", "Lloró",
    "Medio Atrato", "Medio Baudó", "Medio San Juan", "Nóvita", "Nuquí", "Quibdó",
    "Río Iró", "Río Quito", "Riosucio", "San José del Palmar", "Sipí", "Tadó",
    "Unión Panamericana", "Unguía"
  ]),
  dept("Cundinamarca", [
    "Agua de Dios", "Albán", "Anapoima", "Anolaima", "Apulo", "Arbeláez", "Beltrán",
    "Bituima", "Bogotá", "Bojacá", "Cabrera", "Cachipay", "Cajicá", "Caparrapí",
    "Cáqueza", "Carmen de Carupa", "Chaguaní", "Chía", "Chipaque", "Choachí",
    "Chocontá", "Cogua", "Cota", "Cucunubá", "El Colegio", "El Peñón", "El Rosal",
    "Facatativá", "Fómeque", "Fosca", "Funza", "Fúquene", "Fusagasugá", "Gachalá",
    "Gachancipá", "Gachetá", "Gama", "Girardot", "Granada", "Guachetá", "Guaduas",
    "Guasca", "Guataquí", "Guatavita", "Guayabal de Síquima", "Guayabetal",
    "Gutiérrez", "Jerusalén", "Junín", "La Calera", "La Mesa", "La Palma", "La Peña",
    "La Vega", "Lenguazaque", "Machetá", "Madrid", "Manta", "Medina", "Mosquera",
    "Nariño", "Nemocón", "Nilo", "Nimaima", "Nocaima", "Pacho", "Paime", "Pandi",
    "Paratebueno", "Pasca", "Puerto Salgar", "Pulí", "Quebradanegra", "Quetame",
    "Quipile", "Ricaurte", "San Antonio del Tequendama", "San Bernardo",
    "San Cayetano", "San Francisco", "San Juan de Rioseco", "Sasaima", "Sesquilé",
    "Sibaté", "Silvania", "Simijaca", "Soacha", "Sopó", "Subachoque", "Suesca",
    "Supatá", "Susa", "Sutatausa", "Tabio", "Tausa", "Tena", "Tenjo", "Tibacuy",
    "Tibirita", "Tocaima", "Tocancipá", "Topaipí", "Ubalá", "Ubaque", "Ubaté",
    "Une", "Útica", "Venecia", "Vergara", "Vianí", "Villagómez", "Villapinzón",
    "Villeta", "Viotá", "Yacopí", "Zipacón", "Zipaquirá"
  ]),
  dept("Córdoba", [
    "Ayapel", "Buenavista", "Canalete", "Cereté", "Chimá", "Chinú",
    "Ciénaga de Oro", "Cotorra", "La Apartada", "Lorica", "Los Córdobas", "Momil",
    "Montelíbano", "Montería", "Moñitos", "Planeta Rica", "Pueblo Nuevo",
    "Puerto Escondido", "Puerto Libertador", "Purísima", "Sahagún",
    "San Andrés de Sotavento", "San Antero", "San Bernardo del Viento", "San Carlos",
    "San José de Uré", "San Pelayo", "Tierralta", "Tuchín", "Valencia"
  ]),
  dept("Guainía", ["Inírida"]),
  dept("Guaviare", ["Calamar", "El Retorno", "Miraflores", "San José del Guaviare"]),
  dept("Huila", [
    "Acevedo", "Agrado", "Aipe", "Algeciras", "Altamira", "Baraya", "Campoalegre",
    "Colombia", "El Pital", "Elías", "Garzón", "Gigante", "Guadalupe", "Hobo",
    "Íquira", "Isnos", "La Argentina", "La Plata", "Nátaga", "Neiva", "Oporapa",
    "Paicol", "Palermo", "Palestina", "Pitalito", "Rivera", "Saladoblanco",
    "San Agustín", "Santa María", "Suaza", "Tarqui", "Tello", "Teruel", "Tesalia",
    "Timaná", "Villavieja", "Yaguará"
  ]),
  dept("La Guajira", [
    "Albania", "Barrancas", "Dibulla", "Distracción", "El Molino", "Fonseca",
    "Hatonuevo", "La Jagua del Pilar", "Maicao", "Manaure", "Riohacha",
    "San Juan del Cesar", "Uribia", "Urumita", "Villanueva"
  ]),
  dept("Magdalena", [
    "Algarrobo", "Aracataca", "Ariguaní", "Cerro de San Antonio", "Chibolo",
    "Ciénaga", "Concordia", "El Banco", "El Piñón", "El Retén", "Fundación",
    "Guamal", "Nueva Granada", "Pedraza", "Pijiño del Carmen", "Pivijay", "Plato",
    "Pueblo Viejo", "Remolino", "Sabanas de San Ángel", "Salamina",
    "San Sebastián de Buenavista", "San Zenón", "Santa Ana",
    "Santa Bárbara de Pinto", "Santa Marta", "Sitionuevo", "Tenerife", "Zapayán",
    "Zona Bananera"
  ]),
  dept("Meta", [
    "Acacías", "Barranca de Upía", "Cabuyaro", "Castilla la Nueva", "Cubarral",
    "Cumaral", "El Calvario", "El Castillo", "El Dorado", "Fuente de Oro", "Granada",
    "Guamal", "La Macarena", "La Uribe", "Lejanías", "Mapiripán", "Mesetas",
    "Puerto Concordia", "Puerto Gaitán", "Puerto Lleras", "Puerto López",
    "Puerto Rico", "Restrepo", "San Carlos de Guaroa", "San Juan de Arama",
    "San Juanito", "San Martín", "Villavicencio", "Vista Hermosa"
  ]),
  dept("Nariño", [
    "Aldana", "Ancuyá", "Arboleda", "Barbacoas", "Belén", "Buesaco", "Chachagüí",
    "Colón", "Consacá", "Contadero", "Cumbal", "Cumbitara", "El Charco", "El Peñol",
    "El Rosario", "El Tablón", "El Tambo", "Francisco Pizarro", "Funes", "Guachucal",
    "Guaitarilla", "Gualmatán", "Iles", "Imués", "Ipiales", "La Cruz", "La Florida",
    "La Llanada", "La Tola", "La Unión", "Leiva", "Linares", "Los Andes",
    "Magüí Payán", "Mallama", "Mosquera", "Nariño", "Olaya Herrera", "Ospina",
    "Pasto", "Policarpa", "Potosí", "Providencia", "Puerres", "Pupiales",
    "Ricaurte", "Roberto Payán", "Samaniego", "San Bernardo", "San José de Albán",
    "San Lorenzo", "San Pablo", "San Pedro de Cartago", "Sandoná", "Santa Bárbara",
    "Santacruz", "Sapuyes", "Taminango", "Tangua", "Tumaco", "Túquerres", "Yacuanquer"
  ]),
  dept("Norte de Santander", [
    "Ábrego", "Arboledas", "Bochalema", "Bucarasica", "Cáchira", "Cácota",
    "Chinácota", "Chitagá", "Convención", "Cúcuta", "Cucutilla", "Durania",
    "El Carmen", "El Tarra", "El Zulia", "Gramalote", "Hacarí", "Herrán",
    "La Esperanza", "La Playa de Belén", "Labateca", "Los Patios", "Lourdes",
    "Mutiscua", "Ocaña", "Pamplona", "Pamplonita", "Puerto Santander", "Ragonvalia",
    "Salazar de Las Palmas", "San Calixto", "San Cayetano", "Santiago",
    "Santo Domingo de Silos", "Sardinata", "Teorama", "Tibú", "Toledo",
    "Villa Caro", "Villa del Rosario"
  ]),
  dept("Putumayo", [
    "Colón", "Mocoa", "Orito", "Puerto Asís", "Puerto Caicedo", "Puerto Guzmán",
    "Puerto Leguízamo", "San Francisco", "San Miguel", "Santiago", "Sibundoy",
    "Valle del Guamuez", "Villagarzón"
  ]),
  dept("Quindío", [
    "Armenia", "Buenavista", "Calarcá", "Circasia", "Córdoba", "Filandia", "Génova",
    "La Tebaida", "Montenegro", "Pijao", "Quimbaya", "Salento"
  ]),
  dept("Risaralda", [
    "Apía", "Balboa", "Belén de Umbría", "Dosquebradas", "Guática", "La Celia",
    "La Virginia", "Marsella", "Mistrató", "Pereira", "Pueblo Rico", "Quinchía",
    "Santa Rosa de Cabal", "Santuario"
  ]),
  dept("San Andrés y Providencia", ["Providencia y Santa Catalina Islas", "San Andrés"]),
  dept("Santander", [
    "Aguada", "Albania", "Aratoca", "Barbosa", "Barichara", "Barrancabermeja",
    "Betulia", "Bolívar", "Bucaramanga", "Cabrera", "California", "Capitanejo",
    "Carcasí", "Cepitá", "Cerrito", "Charalá", "Charta", "Chima", "Chipatá",
    "Cimitarra", "Concepción", "Confines", "Contratación", "Coromoro", "Curití",
    "El Carmen de Chucurí", "El Guacamayo", "El Peñón", "El Playón", "El Socorro",
    "Encino", "Enciso", "Florián", "Floridablanca", "Galán", "Gámbita", "Girón",
    "Guaca", "Guadalupe", "Guapotá", "Guavatá", "Güepsa", "Hato", "Jesús María",
    "Jordán", "La Belleza", "La Paz", "Landázuri", "Lebrija", "Los Santos",
    "Macaravita", "Málaga", "Matanza", "Mogotes", "Molagavita", "Ocamonte", "Oiba",
    "Onzaga", "Palmar", "Palmas del Socorro", "Páramo", "Piedecuesta", "Pinchote",
    "Puente Nacional", "Puerto Parra", "Puerto Wilches", "Rionegro",
    "Sabana de Torres", "San Andrés", "San Benito", "San Gil", "San Joaquín",
    "San José de Miranda", "San Miguel", "San Vicente de Chucurí", "Santa Bárbara",
    "Santa Helena del Opón", "Simacota", "Suaita", "Sucre", "Suratá", "Tona",
    "Valle de San José", "Vélez", "Vetas", "Villanueva", "Zapatoca"
  ]),
  dept("Sucre", [
    "Buenavista", "Caimito", "Chalán", "Colosó", "Corozal", "Coveñas", "El Roble",
    "Galeras", "Guaranda", "La Unión", "Los Palmitos", "Majagual", "Morroa",
    "Ovejas", "Sampués", "San Antonio de Palmito", "San Benito Abad",
    "San Juan de Betulia", "San Marcos", "San Onofre", "San Pedro", "Sincé",
    "Sincelejo", "Sucre", "Tolú", "Tolú Viejo"
  ]),
  dept("Tolima", [
    "Alpujarra", "Alvarado", "Ambalema", "Anzoátegui", "Armero", "Ataco",
    "Cajamarca", "Carmen de Apicalá", "Casabianca", "Chaparral", "Coello", "Coyaima",
    "Cunday", "Dolores", "El Espinal", "Falán", "Flandes", "Fresno", "Guamo",
    "Herveo", "Honda", "Ibagué", "Icononzo", "Lérida", "Líbano", "Mariquita",
    "Melgar", "Murillo", "Natagaima", "Ortega", "Palocabildo", "Piedras", "Planadas",
    "Prado", "Purificación", "Rioblanco", "Roncesvalles", "Rovira", "Saldaña",
    "San Antonio", "San Luis", "Santa Isabel", "Suárez", "Valle de San Juan",
    "Venadillo", "Villahermosa", "Villarrica"
  ]),
  dept("Valle del Cauca", [
    "Alcalá", "Andalucía", "Ansermanuevo", "Argelia", "Bolívar", "Buenaventura",
    "Buga", "Bugalagrande", "Caicedonia", "Cali", "Calima", "Candelaria", "Cartago",
    "Dagua", "El Águila", "El Cairo", "El Cerrito", "El Dovio", "Florida", "Ginebra",
    "Guacarí", "Jamundí", "La Cumbre", "La Unión", "La Victoria", "Obando", "Palmira",
    "Pradera", "Restrepo", "Riofrío", "Roldanillo", "San Pedro", "Sevilla", "Toro",
    "Trujillo", "Tuluá", "Ulloa", "Versalles", "Vijes", "Yotoco", "Yumbo", "Zarzal"
  ]),
  dept("Vaupés", ["Carurú", "Mitú", "Taraira"]),
  dept("Vichada", ["Cumaribo", "La Primavera", "Puerto Carreño", "Santa Rosalía"]),
];

// --- Constante de compatibilidad ---
export const ALL_COLOMBIA_ID = "todo-colombia";

/** Flat list of all cities across all departments */
export const ALL_CITIES: ColombiaCity[] = DEPARTMENTS.flatMap((d) => d.cities);

// Capital city overrides for homonymous city IDs when department is omitted
const CAPITAL_HOMONYMS: Record<string, string> = {
  'armenia': 'quindio',
  'barbosa': 'santander',
  'granada': 'meta',
  'san-carlos': 'antioquia',
  'la-union': 'valle-del-cauca',
};

/** Find a city by its slug id and optional department id */
export function findCityById(cityId: string, departmentId?: string): ColombiaCity | undefined {
  if (!cityId) return undefined;
  const cleanCity = cityId.toLowerCase().trim();
  const cleanDept = (departmentId || CAPITAL_HOMONYMS[cleanCity])?.toLowerCase().trim();

  if (cleanDept) {
    const found = ALL_CITIES.find((c) => c.id === cleanCity && c.departmentId === cleanDept);
    if (found) return found;
  }

  return ALL_CITIES.find((c) => c.id === cleanCity);
}

/** Find the department a city belongs to */
export function findDepartmentByCityId(cityId: string, departmentId?: string): Department | undefined {
  if (departmentId) {
    const d = DEPARTMENTS.find((dept) => dept.id === departmentId.toLowerCase().trim());
    if (d) return d;
  }
  const city = findCityById(cityId, departmentId);
  if (!city) return undefined;
  return DEPARTMENTS.find((d) => d.id === city.departmentId);
}

/** Find a department by its slug id */
export function findDepartmentById(deptId: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === deptId);
}

/** Get a display name for a city id (includes department disambiguation if needed) */
export function getCityDisplayName(cityId: string, departmentId?: string): string {
  const city = findCityById(cityId, departmentId);
  return city?.name || cityId;
}

/**
 * Detect which city a coordinate falls into based on proximity.
 * Uses a simple nearest-city approach with a 15km radius threshold.
 * For the legacy Valle del Cauca cities we have exact coords; for others
 * we fall back to department capitals or return null.
 */
export function detectCityFromCoords(lat: number, lng: number): ColombiaCity | null {
  // Known coordinates for major cities (capitals and key municipalities)
  const KNOWN_COORDS: Record<string, { lat: number; lng: number; radius: number }> = {
    "leticia": { lat: -4.2153, lng: -69.9406, radius: 10 },
    "medellin": { lat: 6.2442, lng: -75.5812, radius: 15 },
    "arauca": { lat: 7.0847, lng: -70.7592, radius: 10 },
    "barranquilla": { lat: 10.9639, lng: -74.7964, radius: 12 },
    "cartagena-de-indias": { lat: 10.3910, lng: -75.5144, radius: 12 },
    "tunja": { lat: 5.5353, lng: -73.3678, radius: 8 },
    "manizales": { lat: 5.0689, lng: -75.5174, radius: 8 },
    "florencia": { lat: 1.6144, lng: -75.6062, radius: 10 },
    "yopal": { lat: 5.3378, lng: -72.3959, radius: 10 },
    "popayan": { lat: 2.4419, lng: -76.6061, radius: 10 },
    "valledupar": { lat: 10.4631, lng: -73.2532, radius: 10 },
    "quibdo": { lat: 5.6947, lng: -76.6611, radius: 10 },
    "bogota": { lat: 4.7110, lng: -74.0721, radius: 20 },
    "monteria": { lat: 8.7479, lng: -75.8814, radius: 10 },
    "inirida": { lat: 3.8653, lng: -67.9239, radius: 10 },
    "san-jose-del-guaviare": { lat: 2.5686, lng: -72.6394, radius: 10 },
    "neiva": { lat: 2.9273, lng: -75.2819, radius: 10 },
    "riohacha": { lat: 11.5444, lng: -72.9072, radius: 10 },
    "santa-marta": { lat: 11.2408, lng: -74.1990, radius: 12 },
    "villavicencio": { lat: 4.1420, lng: -73.6266, radius: 12 },
    "pasto": { lat: 1.2136, lng: -77.2811, radius: 10 },
    "cucuta": { lat: 7.8939, lng: -72.5078, radius: 12 },
    "mocoa": { lat: 1.1492, lng: -76.6519, radius: 10 },
    "armenia": { lat: 4.5339, lng: -75.6811, radius: 8 },
    "pereira": { lat: 4.8133, lng: -75.6961, radius: 10 },
    "san-andres": { lat: 12.5567, lng: -81.7186, radius: 10 },
    "bucaramanga": { lat: 7.1254, lng: -73.1198, radius: 12 },
    "sincelejo": { lat: 9.3047, lng: -75.3978, radius: 8 },
    "ibague": { lat: 4.4389, lng: -75.2322, radius: 10 },
    "cali": { lat: 3.4516, lng: -76.5320, radius: 12 },
    "palmira": { lat: 3.5394, lng: -76.3036, radius: 8 },
    "buenaventura": { lat: 3.8824, lng: -77.0198, radius: 10 },
    "tulua": { lat: 4.0847, lng: -76.1994, radius: 6 },
    "buga": { lat: 3.9006, lng: -76.2978, radius: 6 },
    "cartago": { lat: 4.7461, lng: -75.9117, radius: 5 },
    "jamundi": { lat: 3.2618, lng: -76.5394, radius: 6 },
    "yumbo": { lat: 3.5847, lng: -76.4967, radius: 5 },
    "florida": { lat: 3.3255, lng: -76.2358, radius: 5 },
    "candelaria": { lat: 3.4073, lng: -76.3469, radius: 5 },
    "pradera": { lat: 3.4225, lng: -76.2456, radius: 5 },
    "dagua": { lat: 3.6578, lng: -76.6928, radius: 6 },
    "la-cumbre": { lat: 3.6578, lng: -76.5667, radius: 5 },
    "vijes": { lat: 3.6942, lng: -76.4361, radius: 4 },
    "ginebra": { lat: 3.7239, lng: -76.2683, radius: 4 },
    "el-cerrito": { lat: 3.6894, lng: -76.3189, radius: 5 },
    "guacari": { lat: 3.7633, lng: -76.3317, radius: 4 },
    "san-pedro": { lat: 3.9972, lng: -76.2233, radius: 4 },
    "sevilla": { lat: 4.2714, lng: -75.9347, radius: 5 },
    "caicedonia": { lat: 4.3292, lng: -75.8319, radius: 4 },
    "roldanillo": { lat: 4.4133, lng: -76.1539, radius: 4 },
    "zarzal": { lat: 4.3947, lng: -76.0736, radius: 4 },
    "la-union": { lat: 4.5331, lng: -76.1042, radius: 4 },
    "restrepo": { lat: 3.8267, lng: -76.5242, radius: 4 },
    "calima": { lat: 3.9167, lng: -76.4833, radius: 5 },
    "mitu": { lat: 1.1983, lng: -70.1736, radius: 10 },
    "puerto-carreno": { lat: 6.1891, lng: -67.4850, radius: 10 },
    "soacha": { lat: 4.5794, lng: -74.2169, radius: 8 },
    "soledad": { lat: 10.9180, lng: -74.7647, radius: 8 },
    "bello": { lat: 6.3383, lng: -75.5564, radius: 8 },
    "girardot": { lat: 4.3022, lng: -74.8022, radius: 6 },
    "dosquebradas": { lat: 4.8372, lng: -75.6681, radius: 6 },
    "envigado": { lat: 6.1711, lng: -75.5906, radius: 5 },
    "itagui": { lat: 6.1847, lng: -75.5992, radius: 5 },
    "floridablanca": { lat: 7.0642, lng: -73.0867, radius: 6 },
    "pitalito": { lat: 1.8547, lng: -76.0486, radius: 6 },
  };

  let closest: { id: string; dist: number } | null = null;

  for (const [cityId, coords] of Object.entries(KNOWN_COORDS)) {
    const dist = getDistanceKm(lat, lng, coords.lat, coords.lng);
    if (dist <= coords.radius && (!closest || dist < closest.dist)) {
      closest = { id: cityId, dist };
    }
  }

  if (closest) {
    return findCityById(closest.id) || null;
  }
  return null;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Backwards compatibility with valleCities.ts ---
// Keep the old interface shape available for imports that need it
export interface ValleCity {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export const KNOWN_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "cali": { lat: 3.4516, lng: -76.5320 },
  "bogota": { lat: 4.7110, lng: -74.0721 },
  "medellin": { lat: 6.2442, lng: -75.5812 },
  "barranquilla": { lat: 10.9639, lng: -74.7964 },
  "cartagena": { lat: 10.3910, lng: -75.5144 },
  "cartagena-de-indias": { lat: 10.3910, lng: -75.5144 },
  "ibague": { lat: 4.4389, lng: -75.2322 },
  "quibdo": { lat: 5.6947, lng: -76.6611 },
  "bucaramanga": { lat: 7.1254, lng: -73.1198 },
  "pereira": { lat: 4.8133, lng: -75.6961 },
  "manizales": { lat: 5.0689, lng: -75.5174 },
  "villavicencio": { lat: 4.1420, lng: -73.6266 },
  "armenia": { lat: 4.5339, lng: -75.6811 },
  "popayan": { lat: 2.4419, lng: -76.6061 },
  "cucuta": { lat: 7.8939, lng: -72.5078 },
  "pasto": { lat: 1.2136, lng: -77.2811 },
  "buenaventura": { lat: 3.8824, lng: -77.0198 },
  "tulua": { lat: 4.0847, lng: -76.1994 },
  "chia": { lat: 4.8608, lng: -74.0537 },
  "jamundi": { lat: 3.2618, lng: -76.5394 },
  "yumbo": { lat: 3.5847, lng: -76.4967 },
  "palmira": { lat: 3.5394, lng: -76.3036 },
  "mosquera": { lat: 4.7059, lng: -74.2302 },
  "chocó": { lat: 5.6947, lng: -76.6611 },
  "choco": { lat: 5.6947, lng: -76.6611 },
  "nacional": { lat: 4.5709, lng: -74.2973 },
  "virtual": { lat: 4.5709, lng: -74.2973 },
};

const DEPARTMENT_CAPITALS: Record<string, { lat: number; lng: number }> = {
  "amazonas": { lat: -4.2153, lng: -69.9406 },
  "antioquia": { lat: 6.2442, lng: -75.5812 },
  "arauca": { lat: 7.0847, lng: -70.7592 },
  "atlantico": { lat: 10.9639, lng: -74.7964 },
  "bolivar": { lat: 10.3910, lng: -75.5144 },
  "boyaca": { lat: 5.5353, lng: -73.3678 },
  "caldas": { lat: 5.0689, lng: -75.5174 },
  "caqueta": { lat: 1.6144, lng: -75.6062 },
  "casanare": { lat: 5.3378, lng: -72.3959 },
  "cauca": { lat: 2.4419, lng: -76.6061 },
  "cesar": { lat: 10.4631, lng: -73.2532 },
  "choco": { lat: 5.6947, lng: -76.6611 },
  "cordoba": { lat: 8.7479, lng: -75.8814 },
  "cundinamarca": { lat: 4.7110, lng: -74.0721 },
  "guainia": { lat: 3.8653, lng: -67.9239 },
  "guaviare": { lat: 2.5648, lng: -72.6459 },
  "huila": { lat: 2.9273, lng: -75.2819 },
  "la-guajira": { lat: 11.5444, lng: -72.9072 },
  "magdalena": { lat: 11.2408, lng: -74.1990 },
  "meta": { lat: 4.1420, lng: -73.6266 },
  "narino": { lat: 1.2136, lng: -77.2811 },
  "norte-de-santander": { lat: 7.8939, lng: -72.5078 },
  "putumayo": { lat: 1.1496, lng: -76.6464 },
  "quindio": { lat: 4.5339, lng: -75.6811 },
  "risaralda": { lat: 4.8133, lng: -75.6961 },
  "san-andres-y-providencia": { lat: 12.5847, lng: -81.7006 },
  "santander": { lat: 7.1254, lng: -73.1198 },
  "sucre": { lat: 9.3047, lng: -75.3978 },
  "tolima": { lat: 4.4389, lng: -75.2322 },
  "valle-del-cauca": { lat: 3.4516, lng: -76.5320 },
  "vaupes": { lat: 1.1983, lng: -70.1733 },
  "vichada": { lat: 6.1838, lng: -67.4858 },
  "bogota-d-c": { lat: 4.7110, lng: -74.0721 },
};

export function getCityCoordinates(cityId: string, departmentId?: string): { lat: number; lng: number } {
  if (!cityId) return { lat: 3.4516, lng: -76.5320 };
  const clean = cityId.toLowerCase().trim();
  if (KNOWN_CITY_COORDS[clean]) return KNOWN_CITY_COORDS[clean];

  const citySlug = clean.includes('-') ? clean.split('-').pop()! : clean;
  if (KNOWN_CITY_COORDS[citySlug]) return KNOWN_CITY_COORDS[citySlug];

  const dept = findDepartmentByCityId(cityId, departmentId);
  if (dept && DEPARTMENT_CAPITALS[dept.id]) {
    return DEPARTMENT_CAPITALS[dept.id];
  }

  return { lat: 3.4516, lng: -76.5320 };
}

export const ALL_VALLE_ID = ALL_COLOMBIA_ID;

/** Legacy VALLE_CITIES - now returns all cities as a flat array for compatibility */
export const VALLE_CITIES = ALL_CITIES;
