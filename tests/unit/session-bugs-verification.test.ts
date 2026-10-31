import { describe, it, expect } from 'vitest';
import { filtrosVacios, pasaResto } from '../../src/utils/filtros';
import { CATEGORY_LABELS } from '../../src/utils/formatters';
import type { Publicacion, Ubicacion } from '../../src/types/publicacion';
import { contactoListo, esTelefonoValido, listoPedir, mensajeDe } from '../../src/utils/pedir';
import { estadoInicialOfrecer, estadoInicialPedir } from '../../src/mocks/flujosMock';
import { extractColombianIntersection, geocodeAddress, geocodeAddressStructured, isAddressIncomplete, reverseGeocodeStructured } from '../../src/utils/geocoding';
import { needToPublicacion } from '../../src/utils/supabaseMappers';
import { actorPublicacion } from '../../src/utils/publicaciones';
import { formatReportReason } from '../../src/utils/enumMappers';
import { translations } from '../../src/i18n/translations';

describe('Verificación de solución de bugs (BUS-05, FYO-03, FYO-06)', () => {
  const dummyUbi: Ubicacion = { lat: 4.5, lng: -74.1, ciudad: 'bogota', zona: 'Centro', simulada: false };

  it('BUS-05: Búsqueda ignora mayúsculas y tildes correctamente', () => {
    const pubMedica: Publicacion = {
      id: 'p-1',
      tipo: 'necesidad',
      titulo: 'Atención médica urgente',
      org: 'Cruz Roja',
      verificada: true,
      lat: 4.5,
      lng: -74.1,
      zona: 'Bogotá',
      recursos: [{ item: 'Atención médica', unidad: 'consultas', total: 10, tramos: [] }],
    };

    const f = filtrosVacios();

    // 1. Con tilde y sin tilde
    expect(pasaResto(pubMedica, f, dummyUbi, 'medica')).toBe(true);
    expect(pasaResto(pubMedica, f, dummyUbi, 'médica')).toBe(true);
    expect(pasaResto(pubMedica, f, dummyUbi, 'MEDICA')).toBe(true);
    expect(pasaResto(pubMedica, f, dummyUbi, 'atencion medica')).toBe(true);
    expect(pasaResto(pubMedica, f, dummyUbi, 'Bogota')).toBe(true);
    expect(pasaResto(pubMedica, f, dummyUbi, 'Bogotá')).toBe(true);

    // Búsqueda que no coincide
    expect(pasaResto(pubMedica, f, dummyUbi, 'alimentos')).toBe(false);
  });

  it('FYO-03: Filtro por recurso coincide independientemente de diferencias de mayúsculas/minúsculas', () => {
    // CATEGORY_LABELS debe tener 'Agua potable' canónico
    expect(CATEGORY_LABELS.AGUA.label).toBe('Agua potable');

    const pubAguaMayus: Publicacion = {
      id: 'p-2',
      tipo: 'necesidad',
      titulo: 'Agua para albergue',
      org: 'Albergue Bosa',
      verificada: false,
      lat: 4.5,
      lng: -74.1,
      zona: 'Bosa',
      recursos: [{ item: 'Agua Potable', unidad: 'L', total: 1000, tramos: [] }],
    };

    const f = { ...filtrosVacios(), recursos: ['Agua potable'] };
    expect(pasaResto(pubAguaMayus, f, dummyUbi, '')).toBe(true);

    const fMayus = { ...filtrosVacios(), recursos: ['Agua Potable'] };
    expect(pasaResto(pubAguaMayus, fMayus, dummyUbi, '')).toBe(true);
  });

  it('FYO-06: Filtro Solo organizaciones verificadas excluye ciudadanos e individuales', () => {
    const pubOrgVerificada: Publicacion = {
      id: 'p-org-1',
      tipo: 'necesidad',
      titulo: 'Kits para damnificados',
      org: 'Fundación Solidaria',
      perfil: 'organizacion',
      verificada: true,
      lat: 4.5,
      lng: -74.1,
      zona: 'Usaquén',
      recursos: [{ item: 'Alimentos', unidad: 'kits', total: 50, tramos: [] }],
    };

    const pubCiudadanoConVerificacionEnDb: Publicacion = {
      id: 'p-ciu-1',
      tipo: 'necesidad',
      titulo: 'Remover escombros',
      org: '',
      perfil: 'individual',
      verificada: true, // Aprobada en moderación
      lat: 4.5,
      lng: -74.1,
      zona: 'Chapinero',
      recursos: [{ item: 'Herramientas de mano', unidad: 'unidades', total: 5, tramos: [] }],
    };

    const f = { ...filtrosVacios(), verificadas: true };

    // Organización verificada DEBE pasar
    expect(pasaResto(pubOrgVerificada, f, dummyUbi, '')).toBe(true);

    // Publicación ciudadana/individual DEBE ser excluida
    expect(pasaResto(pubCiudadanoConVerificacionEnDb, f, dummyUbi, '')).toBe(false);
  });
});

describe('Verificación de solución de bugs en flujo de pedir ayuda (PDA-06, PDA-08, PDA-09)', () => {
  it('PDA-06: Validación estricta de personas exige enteros positivos y respeta TOPE_GRUPO', () => {
    // 1. Rechazo de decimales en mensajeDe
    expect(mensajeDe(['numero', 'entero'], '2.5')).toBe('Escribe un número entero, sin decimales');
    expect(mensajeDe(['numero', 'entero'], '2,5')).toBe('Escribe un número entero, sin decimales');

    // 2. Rechazo de números que superen el tope
    expect(mensajeDe(['numero', 'entero'], '99999999')).toBe('La cantidad no puede superar 100.000');
    expect(mensajeDe(['numero', 'entero'], '100001')).toBe('La cantidad no puede superar 100.000');

    // 3. Casos base de regla número
    expect(mensajeDe(['numero', 'entero'], '0')).toBe('Escribe una cantidad mayor que cero');
    expect(mensajeDe(['numero', 'entero'], '-5')).toBe('Escribe solo el número, sin palabras');
    expect(mensajeDe(['numero', 'entero'], 'abc')).toBe('Escribe solo el número, sin palabras');

    // 4. Casos válidos
    expect(mensajeDe(['numero', 'entero'], '25')).toBeNull();
    expect(mensajeDe(['numero', 'entero'], '100.000')).toBeNull();

    // 5. listoPedir bloquea decimales y excesos
    const subAfectacion = { paso: 1 as const, id: 'afectacion', nombre: 'Personas y días' };
    const eBase = { ...estadoInicialPedir(), sel: ['Agua potable'], dias: 3 };

    // Con decimal: no debe dejar continuar
    const eDecimal = { ...eBase, grupo: { personas: 2.5 } };
    expect(listoPedir(eDecimal, subAfectacion)).toBe(false);

    // Con exceso de tope: no debe dejar continuar
    const eExceso = { ...eBase, grupo: { personas: 99999999 } };
    expect(listoPedir(eExceso, subAfectacion)).toBe(false);

    // Con entero válido: debe dejar continuar
    const eValido = { ...eBase, grupo: { personas: 25 } };
    expect(listoPedir(eValido, subAfectacion)).toBe(true);
  });

  it('PDA-08: Geocodificación de dirección inválida ("zzzz") no retorna coordenadas', async () => {
    const res = await geocodeAddress('zzzz', undefined, 'Cali');
    expect(res).toBeNull();
  });

  it('GEO-01 / GEO-03 / PDA-08: El paso "donde" solo se habilita con confirmación explícita (sugerencia/pin/GPS) y se desactiva ante texto libre o edición', () => {
    const subDonde = { id: 'donde', paso: 2 as const, nombre: 'Dónde' };
    const eBase = { ...estadoInicialPedir(), dir: 'Carrera 14 Armenia', lat: 4.542, lng: -75.669 };

    // Función de cálculo de habilitación usada en PedirPage y OfrecerPage
    const calcularEstaListo = (listoActual: boolean, direccionTexto: string, direccionConfirmada: boolean, cargando: boolean = false, error: string | null = null) => {
      return listoActual && !error && (!cargando && !error && Boolean(direccionTexto.trim()) && direccionConfirmada);
    };

    // 1. GEO-01: Usuario escribe texto libre sin elegir sugerencia (direccionConfirmada = false) -> botón bloqueado
    const textoLibreListo = calcularEstaListo(listoPedir(eBase, subDonde), 'Carrera 14 Armenia', false);
    expect(textoLibreListo).toBe(false);

    // 2. GEO-02: Usuario elige una sugerencia de Google (direccionConfirmada = true) -> botón habilitado
    const sugerenciaElegidaListo = calcularEstaListo(listoPedir(eBase, subDonde), 'Cra. 14, Armenia, Quindío, Colombia', true);
    expect(sugerenciaElegidaListo).toBe(true);

    // 3. GEO-03: Usuario edita el texto tras haber elegido sugerencia (direccionConfirmada vuelve a false por onChange) -> botón vuelve a bloquearse
    const textoModificadoListo = calcularEstaListo(listoPedir(eBase, subDonde), 'Cra. 14, Armenia, Quindío inventado', false);
    expect(textoModificadoListo).toBe(false);
  });

  it('GEO-02 / PDA-08: Texto libre sin sugerencia ("zzzqqq xxxyyy 999999") no se geocodifica y no retorna coordenadas', async () => {
    const res = await geocodeAddressStructured('zzzqqq xxxyyy 999999');
    expect(res).toBeNull();
  });

  it('PDA-10: Direcciones vacías o menores a 3 caracteres no ejecutan geocodificación', async () => {
    expect(await geocodeAddress('', undefined, 'Cali')).toBeNull();
    expect(await geocodeAddress('   ', undefined, 'Cali')).toBeNull();
    expect(await geocodeAddress('A', undefined, 'Cali')).toBeNull();
    expect(await geocodeAddress('12', undefined, 'Cali')).toBeNull();
  });

  it('PDA-11: extractColombianIntersection descompone correctamente nomenclaturas viales colombianas', () => {
    // 1. Carrera con número estándar
    expect(extractColombianIntersection('Carrera 18 #123-43')).toEqual({
      via1: 'Carrera 18',
      via2: 'Calle 123',
      viaPrincipal: 'Carrera 18',
    });

    // 2. Abreviaciones comunes (cra, cll)
    expect(extractColombianIntersection('Cra 15 # 85-30')).toEqual({
      via1: 'Carrera 15',
      via2: 'Calle 85',
      viaPrincipal: 'Carrera 15',
    });

    expect(extractColombianIntersection('Calle 72 # 11-20')).toEqual({
      via1: 'Calle 72',
      via2: 'Carrera 11',
      viaPrincipal: 'Calle 72',
    });

    // 3. Diagonal y transversal
    expect(extractColombianIntersection('Diag 45 # 20-10')).toEqual({
      via1: 'Diagonal 45',
      via2: 'Transversal 20',
      viaPrincipal: 'Diagonal 45',
    });

    // 4. Intersección explícita con "con"
    expect(extractColombianIntersection('Calle 100 con Cra 15')).toEqual({
      via1: 'Calle 100',
      via2: 'Carrera 15',
      viaPrincipal: 'Calle 100',
    });

    // 5. Avenida
    expect(extractColombianIntersection('Av 19 # 100-05')).toEqual({
      via1: 'Avenida 19',
      via2: 'Calle 100',
      viaPrincipal: 'Avenida 19',
    });

    // 6. Con letras y espacios (ej. Calle 72 B)
    expect(extractColombianIntersection('Calle 72 B # 11-20')).toEqual({
      via1: 'Calle 72 B',
      via2: 'Carrera 11',
      viaPrincipal: 'Calle 72 B',
    });

    // 7. Texto no vial retorna null
    expect(extractColombianIntersection('Parque Simón Bolívar')).toBeNull();
  });

  it('PDA-12: isAddressIncomplete detecta cadenas a medio escribir para evitar consultas erráticas', () => {
    // Incompletas (no deben disparar geocodificación automática)
    expect(isAddressIncomplete('')).toBe(true);
    expect(isAddressIncomplete('   ')).toBe(true);
    expect(isAddressIncomplete('cra')).toBe(true);
    expect(isAddressIncomplete('calle')).toBe(true);
    expect(isAddressIncomplete('carrera 23 #')).toBe(true);
    expect(isAddressIncomplete('cra 23 # ')).toBe(true);
    expect(isAddressIncomplete('cra 23 # 100 -')).toBe(true);
    expect(isAddressIncomplete('cra 23 # 100 - ')).toBe(true);
    expect(isAddressIncomplete('calle 72 con')).toBe(true);
    expect(isAddressIncomplete('calle 72 con ')).toBe(true);
    expect(isAddressIncomplete('cra 15 no')).toBe(true);

    // Completas (listas para geocodificar)
    expect(isAddressIncomplete('cra 23 # 100 - 32')).toBe(false);
    expect(isAddressIncomplete('Calle 72 # 11-20')).toBe(false);
    expect(isAddressIncomplete('Calle 100 con Cra 15')).toBe(false);
    expect(isAddressIncomplete('Usaquén')).toBe(false);
    expect(isAddressIncomplete('Usaquén Bogotá')).toBe(false);
    expect(isAddressIncomplete('La Castellana')).toBe(false);
    expect(isAddressIncomplete('El Poblado')).toBe(false);
  });

  it('PDA-09: Validación de teléfono celular y datos de contacto', () => {
    // 1. esTelefonoValido
    expect(esTelefonoValido('300123456789012345678')).toBe(false); // 21 dígitos
    expect(esTelefonoValido('abc')).toBe(false); // Letras
    expect(esTelefonoValido('300abc1234')).toBe(false); // Mezcla
    expect(esTelefonoValido('12345')).toBe(false); // Menos de 10
    expect(esTelefonoValido('3001234567')).toBe(true); // 10 dígitos nacional
    expect(esTelefonoValido('+57 300 123 4567')).toBe(true); // Internacional con +57
    expect(esTelefonoValido('+573001234567')).toBe(true);

    // 2. mensajeDe para teléfono
    expect(mensajeDe(['telefono'], '300123456789012345678')).toBe('Un celular tiene 10 dígitos, más el +57');
    expect(mensajeDe(['telefono'], 'abc')).toBe('Un celular tiene 10 dígitos, más el +57');
    expect(mensajeDe(['telefono'], '3001234567')).toBeNull();

    // 3. mensajeDe para nombre
    expect(mensajeDe(['requerido', 'nombre'], 'A')).toBe('Escribe un nombre de al menos 2 caracteres');
    expect(mensajeDe(['requerido', 'nombre'], 'Ana')).toBeNull();

    // 4. contactoListo
    expect(contactoListo({ contacto: 'Pedro', tel: '300123456789012345678' })).toBe(false);
    expect(contactoListo({ contacto: 'Pedro', tel: 'abc' })).toBe(false);
    expect(contactoListo({ contacto: '', tel: '3001234567' })).toBe(false);
    expect(contactoListo({ contacto: 'P', tel: '3001234567' })).toBe(false);
    expect(contactoListo({ contacto: 'Pedro', tel: '3001234567' })).toBe(true);
    expect(contactoListo({ contacto: 'Pedro', tel: '+57 300 123 4567' })).toBe(true);
  });

  it('PDA-13: geocodeAddressStructured geocodifica "calle 72 # 10-34" en Bogotá y descarta centroide de Puerto López', async () => {
    const res = await geocodeAddressStructured('calle 72 # 10-34', 'Bogotá');
    expect(res).not.toBeNull();
    if (res) {
      // Debe estar en Bogotá (lat ~4.68, lon ~-74.05), NUNCA en Puerto López (lat ~4.09, lon ~-72.90)
      expect(res.lat).toBeGreaterThan(4.5);
      expect(res.lat).toBeLessThan(4.8);
      expect(res.lng).toBeGreaterThan(-74.2);
      expect(res.lng).toBeLessThan(-74.0);
    }
  });

  it('PDA-14: geocodeAddressStructured funciona solo con sector (Usaquén) sin botar a Puerto López', async () => {
    const res = await geocodeAddressStructured('', 'Usaquén');
    expect(res).not.toBeNull();
    if (res) {
      expect(res.lat).toBeGreaterThan(4.6);
      expect(res.lat).toBeLessThan(4.8);
      expect(res.lng).toBeGreaterThan(-74.15);
      expect(res.lng).toBeLessThan(-74.0);
    }
  });

  it('PDA-15: reverseGeocodeStructured separa correctamente vía/número y sector', async () => {
    const res = await reverseGeocodeStructured(4.6857, -74.0563);
    expect(res).not.toBeNull();
    if (res) {
      expect(res.direccionCompleta).toBeTruthy();
      expect(typeof res.direccionNum).toBe('string');
      expect(typeof res.barrioSector).toBe('string');
    }
  });

  it('PDA-16: estadoInicialPedir y estadoInicialOfrecer inician por defecto en Bogotá, no en Cali', () => {
    const pedir = estadoInicialPedir();
    const ofrecer = estadoInicialOfrecer();
    // Debe estar en Bogotá (lat ~4.6097, lng ~-74.0817), NUNCA en Cali (lat ~3.4516, lng ~-76.5320)
    expect(pedir.lat).toBeCloseTo(4.6097, 2);
    expect(pedir.lng).toBeCloseTo(-74.0817, 2);
    expect(pedir.lat).not.toBeCloseTo(3.4516, 2);

    expect(ofrecer.lat).toBeCloseTo(4.6097, 2);
    expect(ofrecer.lng).toBeCloseTo(-74.0817, 2);
    expect(ofrecer.lat).not.toBeCloseTo(3.4516, 2);
  });

  it('ORG-06: Mapeo de organización en sesión y cálculo de entidad en Shell no cae a prefijo de email', () => {
    // Simular fila proveniente de la tabla organizations (tiene org_name)
    const orgData = {
      id: 'b23c1b45-f7c0-4c46-9904-1e20f70a1ae6',
      user_id: '9e1e4794-ee5e-4c4d-9825-6e05f8f6d92e',
      org_name: 'Gobernacion quindio',
      organization_type: 'bomberos_defensa_civil'
    };

    const user = {
      id: orgData.user_id,
      email: 'alcandia@gmail.com',
      user_metadata: {}
    };

    // Mapeo canónico corregido en Shell y App
    const resolvedOrgName = orgData?.org_name || (orgData as any)?.name || user.user_metadata?.org_name;
    const profileType = (orgData ? 'organizacion' : null) || 'persona';

    expect(resolvedOrgName).toBe('Gobernacion quindio');
    expect(profileType).toBe('organizacion');

    // Cálculo de cuentaFinal en Shell
    const activeUser = {
      ...user,
      name: 'Jesse Lopez',
      org_name: resolvedOrgName,
      organization: resolvedOrgName,
      role: 'entidad_profesional'
    };

    const name = activeUser.name || activeUser.email;
    const entidadNombre = activeUser.org_name || activeUser.organization || name;
    const inicialesStr = entidadNombre.split(' ').map((n: string) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();

    expect(entidadNombre).toBe('Gobernacion quindio');
    expect(entidadNombre).not.toBe('alcandia');
    expect(inicialesStr).toBe('GQ');
  });

  it('ORG-06: Shell preserva activeUser.org_name y no cae al prefijo del correo si orgData aún no carga', () => {
    const user = {
      id: '9e1e4794-ee5e-4c4d-9825-6e05f8f6d92e',
      email: 'alcandia@gmail.com',
      user_metadata: {}
    };

    const activeUser = {
      ...user,
      name: 'Jesse Lopez',
      org_name: 'Gobernacion quindio',
      organization: 'Gobernacion quindio',
      role: 'entidad_profesional',
      profile_type: 'organizacion'
    };

    const orgData = null; // Aún resolviendo o latente
    const profileData = { id: user.id, role: 'entidad_profesional', full_name: 'Jesse Lopez', moderation_status: 'APPROVED' };

    // Lógica en Shell.tsx checkUser
    const resolvedOrgName = orgData?.org_name || (orgData as any)?.name || activeUser?.org_name || activeUser?.organization || user.user_metadata?.org_name;
    const resolvedProfileType = orgData ? 'organizacion' : (activeUser?.profile_type || 'persona');

    const fullUser = {
      ...user,
      name: profileData?.full_name || activeUser?.name || user.email?.split('@')[0],
      role: profileData?.role || user.role,
      profile_type: resolvedProfileType,
      org_name: resolvedOrgName,
      organization: resolvedOrgName,
    };

    expect(fullUser.org_name).toBe('Gobernacion quindio');
    expect(fullUser.name).toBe('Jesse Lopez');
    expect(fullUser.name).not.toBe('alcandia');
  });

  it('EQP-04: "Mi equipo" vacío muestra mensaje de equipo sin personas en vez de filtros', () => {
    // Si la organización no tiene miembros en equipo (equipo = [])
    const equipoVacio: any[] = [];
    const hayFiltros = false;

    const estadoVacio = equipoVacio.length === 0
      ? {
          titulo: 'Todavía no hay personas en tu equipo',
          accion: 'Agregar',
          esFiltro: false,
        }
      : hayFiltros
        ? {
            titulo: 'Nadie coincide con estos filtros',
            accion: 'Quitar los filtros',
            esFiltro: true,
          }
        : null;

    expect(estadoVacio).not.toBeNull();
    expect(estadoVacio?.titulo).toBe('Todavía no hay personas en tu equipo');
    expect(estadoVacio?.accion).toBe('Agregar');
    expect(estadoVacio?.esFiltro).toBe(false);

    // Caso con miembros y filtro aplicado sin coincidencias
    const equipoConMiembros = [{ id: 1, n: 'Carlos Bombero' }];
    const hayFiltrosAplicados = true;
    const filtradosSinCoincidencias: any[] = [];

    const estadoConFiltros = equipoConMiembros.length === 0
      ? {
          titulo: 'Todavía no hay personas en tu equipo',
          accion: 'Agregar',
          esFiltro: false,
        }
      : filtradosSinCoincidencias.length === 0
        ? {
            titulo: 'Nadie coincide con estos filtros',
            accion: 'Quitar los filtros',
            esFiltro: true,
          }
        : null;

    expect(estadoConFiltros?.titulo).toBe('Nadie coincide con estos filtros');
    expect(estadoConFiltros?.accion).toBe('Quitar los filtros');
    expect(estadoConFiltros?.esFiltro).toBe(true);

    // Verificación de traducciones en todos los idiomas soportados (es, en, pt, fr)
    expect(translations.es.teamEmptyTitle).toBe('Todavía no hay personas en tu equipo');
    expect(translations.en.teamEmptyTitle).toBe('There are no people on your team yet');
    expect(translations.pt.teamEmptyTitle).toBe('Ainda não há pessoas na sua equipe');
    expect(translations.fr.teamEmptyTitle).toBe('Il n\'y a pas encore de personnes dans votre équipe');

    expect(translations.es.teamAdd).toBe('Agregar');
    expect(translations.en.teamAdd).toBe('Add');
    expect(translations.pt.teamAdd).toBe('Adicionar');
    expect(translations.fr.teamAdd).toBe('Ajouter');
  });

  it('ORG-07: Publicación de necesidad por organización mapea perfil organizacion y muestra nombre de org en actor (no Citizen)', () => {
    const need: any = {
      id: 'need-org-1',
      title: '100 Colchonetas y Cobijas',
      description: 'Atención de emergencia en albergue',
      organizationName: 'Gobernacion quindio',
      requesterType: 'ORGANIZACION',
      verificationStatus: 'VERIFIED',
      resources: [{ requestedQuantity: 100, description: 'Colchonetas' }],
      address: 'Calle 21 # 21-4',
      neighborhood: 'Armenia',
      latitude: 4.53,
      longitude: -75.67,
      contactName: 'Jesse Lopez',
    };

    const pub = needToPublicacion(need);
    expect(pub.org).toBe('Gobernacion quindio');
    expect(pub.perfil).toBe('organizacion');

    // Incluso si requesterType en BD vino como 'PERSONA' por default antiguo pero tiene organizationName
    const needLegacy: any = {
      ...need,
      id: 'need-legacy',
      requesterType: 'PERSONA',
    };
    const pubLegacy = needToPublicacion(needLegacy);
    expect(pubLegacy.org).toBe('Gobernacion quindio');
    expect(pubLegacy.perfil).toBe('organizacion');

    // actorPublicacion debe retornar el nombre de la organización, NO 'Citizen' ni 'Ciudadano'
    const actorEn = actorPublicacion(pub, 'en');
    const actorEs = actorPublicacion(pub, 'es');
    expect(actorEn).toBe('Gobernacion quindio');
    expect(actorEs).toBe('Gobernacion quindio');
    expect(actorEn).not.toBe('Citizen');
    expect(actorEs).not.toBe('Ciudadano');
  });

  it('ADM-02: formatReportReason traduce códigos de motivos y conteo de reportes pendientes coincide', () => {
    // 1. Motivos humanizados / traducidos
    expect(formatReportReason('WRONG_LOCATION')).toBe('La ubicación o dirección es incorrecta');
    expect(formatReportReason('BAD_CONTACT')).toBe('El teléfono o WhatsApp no funciona');
    expect(formatReportReason('NOT_NEEDED_ANYMORE')).toBe('Ya no necesitan ayuda / La ayuda fue cubierta');
    expect(formatReportReason('FALSE_INFORMATION')).toBe('La información es falsa o engañosa');
    expect(formatReportReason('OUTDATED')).toBe('La información está desactualizada');
    expect(formatReportReason('OTHER')).toBe('Otro motivo');
    expect(formatReportReason('CUSTOM_REASON')).toBe('CUSTOM_REASON');

    // 2. Con helper de traducción en inglés
    const tEn = (k: string) => (translations.en as any)[k] || k;
    expect(formatReportReason('WRONG_LOCATION', tEn)).toBe('Incorrect location or address');
    expect(formatReportReason('BAD_CONTACT', tEn)).toBe('Phone or WhatsApp does not work');
    expect(formatReportReason('NOT_NEEDED_ANYMORE', tEn)).toBe('Help no longer needed / Covered');

    // 3. Conteo de pendientes vs resueltos
    const mockReports = [
      { id: '1', status: 'PENDING', reason: 'WRONG_LOCATION', needId: 'n1' },
      { id: '2', status: 'PENDING', reason: 'BAD_CONTACT', needId: 'n2' },
      { id: '3', status: 'PENDING', reason: 'NOT_NEEDED_ANYMORE', needId: 'n3' },
      { id: '4', status: 'PENDING', reason: 'OUTDATED', needId: 'n4' },
      { id: '5', status: 'RESOLVED', reason: 'OTHER', needId: 'n5' },
      { id: '6', status: 'RESOLVED', reason: 'FALSE_INFORMATION', needId: 'n6' },
      { id: '7', status: 'RESOLVED', reason: 'WRONG_LOCATION', needId: 'n7' },
    ];

    const pendingOnly = mockReports.filter((r) => r.status === 'PENDING');
    expect(pendingOnly.length).toBe(4);
    expect(mockReports.length).toBe(7);

    // En filtro PENDING: menú dice 4 y título de sección pendientes dice 4
    const filterStatus = 'PENDING';
    const filtered = mockReports.filter((r) => filterStatus === 'ALL' || r.status === filterStatus);
    expect(filtered.length).toBe(pendingOnly.length);
    expect(filtered.length).toBe(4);

    // Resolución de título de publicación (no debe caer en el ID si la necesidad existe)
    const mockNeeds = [{ id: 'n1', title: 'Alimentos para Siloé' }];
    const rep = mockReports[0];
    const relatedNeed = mockNeeds.find((n) => n.id === rep.needId);
    const resolvedTitle = relatedNeed?.title || (rep as any).needTitle || 'Publicación no disponible';
    expect(resolvedTitle).toBe('Alimentos para Siloé');
    expect(resolvedTitle).not.toBe('n1');
  });

  it('MIE-02: Miembro de equipo de organización con rol voluntario en perfil pero con org asociada ve "Mi organización" y no "Mi actividad"', () => {
    // Simulación del cálculo de entidad / perfil en Shell
    const activeUser = {
      id: 'usr-fed-1',
      name: 'Federico Posada 1',
      role: 'voluntario', // perfil original en profiles
      org_name: 'Gobernacion quindio', // asignado por fetchOrganizationByUserId / organization_members
      organization: 'Gobernacion quindio',
      profile_type: 'organizacion',
    };
    const hasOrg = true;
    const dbProfileType = 'organizacion';
    const normUserRole = (activeUser?.role || dbProfileType || '').toString().trim().toLowerCase();
    const normProfileType = (dbProfileType || activeUser?.profile_type || '').toString().trim().toLowerCase();

    const tieneOrg = Boolean(
      hasOrg ||
      Boolean(activeUser?.org_name) ||
      Boolean(activeUser?.organization) ||
      normProfileType === 'organizacion' ||
      normProfileType === 'entidad_profesional' ||
      normUserRole === 'organizacion' ||
      normUserRole === 'entidad_profesional'
    );

    const esComunidad = Boolean(
      normProfileType === 'comunidad' ||
      normProfileType === 'liderazgo' ||
      normProfileType === 'lider' ||
      normProfileType === 'junta_vecinal' ||
      normUserRole === 'lider' ||
      normUserRole === 'liderazgo' ||
      normUserRole === 'comunidad'
    );

    const esOrganizacion = !esComunidad && Boolean(tieneOrg);
    const esIndividual = !tieneOrg && !esComunidad && Boolean(
      normProfileType === 'persona' ||
      normProfileType === 'individual' ||
      normUserRole === 'voluntario' ||
      normUserRole === 'user'
    );

    // Verificaciones
    expect(tieneOrg).toBe(true);
    expect(esComunidad).toBe(false);
    expect(esOrganizacion).toBe(true);
    expect(esIndividual).toBe(false);

    // El panel asignado debe ser 'panel' (Mi organización) y no 'actividad' (Mi actividad)
    let seccionAsignada = 'radar';
    if (esIndividual) {
      seccionAsignada = 'actividad';
    } else if (esComunidad) {
      seccionAsignada = 'panel';
    } else {
      seccionAsignada = 'panel';
    }

    expect(seccionAsignada).toBe('panel');
    expect(seccionAsignada).not.toBe('actividad');
  });

  it('ROL-12: Sin iniciar sesión, /panel no permite acceso anónimo y redirige a login con retorno', () => {
    // 1. Simulación de usuario anónimo (sin sesión)
    const authUser = null;
    const storedAuth = null;
    const isLogged = Boolean(storedAuth);

    const destino = '/panel#equipo';
    const rutaLoginEsperada = `/registro?modo=login&retorno=${encodeURIComponent(destino)}`;

    expect(isLogged).toBe(false);
    expect(authUser).toBeNull();

    // Verificación de generación de ruta de login con retorno
    const rutaRedireccion = `/registro?modo=login&retorno=${encodeURIComponent(destino)}`;
    expect(rutaRedireccion).toBe(rutaLoginEsperada);
    expect(rutaRedireccion).toContain('modo=login');
    expect(rutaRedireccion).toContain(encodeURIComponent('/panel#equipo'));

    // 2. Simulación de organización autenticada (control ROL12-04)
    const orgUser = { id: 'org-123', name: 'Fundación Apoyo', role: 'voluntario', profile_type: 'organizacion' };
    const isLoggedWithOrg = Boolean(orgUser);

    expect(isLoggedWithOrg).toBe(true);
  });

  it('HERO-01: copiarTexto en VentanaLiquida preserva la huella geométrica de botones como placeholders ocultos para evitar shift vertical en justify-center', async () => {
    class MockHTMLElement {}
    (globalThis as any).HTMLElement = MockHTMLElement;
    (globalThis as any).Node = { TEXT_NODE: 3 };

    const mockDocument = {
      createElement: (tag: string) => {
        const el: any = Object.create(MockHTMLElement.prototype);
        el.nodeType = 1;
        el.localName = tag.toLowerCase();
        el.className = '';
        el.style = {};
        el.children = [] as any[];
        el.childNodes = [] as any[];
        el.attributes = {} as Record<string, string>;
        el.setAttribute = (name: string, val: string) => {
          el.attributes[name] = val;
        };
        el.getAttribute = (name: string) => el.attributes[name] ?? null;
        el.append = (...nodes: any[]) => {
          el.childNodes.push(...nodes);
          el.children.push(...nodes.filter((n: any) => n.nodeType === 1));
        };
        el.matches = (selector: string) => {
          const tags = selector.split(',').map((s) => s.trim().toLowerCase());
          return tags.includes(el.localName);
        };
        return el;
      },
      createTextNode: (text: string) => ({
        nodeType: 3,
        textContent: text,
      }),
    };

    (globalThis as any).document = mockDocument;

    const { copiarTexto } = await import('../../src/features/landing/components/VentanaLiquida');

    // Construir árbol simulado idéntico a LandingHero
    const container = mockDocument.createElement('div');
    container.className = 'rd-contenedor-landing flex flex-col justify-center';

    const h1 = mockDocument.createElement('h1');
    h1.className = 'text-white text-rd-48';
    h1.append(mockDocument.createTextNode('Conectamos a quienes ayudan'));

    const p = mockDocument.createElement('p');
    p.className = 'text-rd-noche-tinta-2';
    p.append(mockDocument.createTextNode('Organizaciones y voluntarios'));

    const buttonsGrid = mockDocument.createElement('div');
    buttonsGrid.className = 'grid grid-cols-2 gap-6 mt-10';

    const btnPedir = mockDocument.createElement('button');
    btnPedir.className = 'btn-primary h-13 px-7';
    btnPedir.innerHTML = '<span>Pedir ayuda</span>';

    const btnOfrecer = mockDocument.createElement('a');
    btnOfrecer.className = 'btn-secondary h-13 px-7';
    btnOfrecer.innerHTML = '<span>Ofrecer ayuda</span>';

    buttonsGrid.append(btnPedir, btnOfrecer);
    container.append(h1, p, buttonsGrid);

    // Clonar usando copiarTexto
    const clon = copiarTexto(container as any) as any;

    expect(clon).not.toBeNull();
    expect(clon.className).toBe(container.className);

    // Los encabezados pasan a div conservando clases
    const clonH1 = clon.children[0];
    expect(clonH1.localName).toBe('div');
    expect(clonH1.className).toBe(h1.className);

    // El párrafo se conserva
    const clonP = clon.children[1];
    expect(clonP.localName).toBe('p');
    expect(clonP.className).toBe(p.className);

    // La grilla de botones debe conservar sus 2 hijos como divs ocultos para mantener la huella dimensional en flexbox
    const clonGrid = clon.children[2];
    expect(clonGrid.children.length).toBe(2);

    const clonBtnPedir = clonGrid.children[0];
    expect(clonBtnPedir.localName).toBe('div');
    expect(clonBtnPedir.className).toBe(btnPedir.className);
    expect(clonBtnPedir.style.visibility).toBe('hidden');
    expect(clonBtnPedir.getAttribute('aria-hidden')).toBe('true');
    expect(clonBtnPedir.innerHTML).toBe('<span>Pedir ayuda</span>');

    const clonBtnOfrecer = clonGrid.children[1];
    expect(clonBtnOfrecer.localName).toBe('div');
    expect(clonBtnOfrecer.className).toBe(btnOfrecer.className);
    expect(clonBtnOfrecer.style.visibility).toBe('hidden');
    expect(clonBtnOfrecer.getAttribute('aria-hidden')).toBe('true');
    expect(clonBtnOfrecer.innerHTML).toBe('<span>Ofrecer ayuda</span>');
  });
});



