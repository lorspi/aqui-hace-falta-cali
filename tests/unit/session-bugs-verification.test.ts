import { describe, it, expect } from 'vitest';
import { filtrosVacios, pasaResto } from '../../src/utils/filtros';
import { CATEGORY_LABELS } from '../../src/utils/formatters';
import type { Publicacion, Ubicacion } from '../../src/types/publicacion';
import { contactoListo, esTelefonoValido, listoPedir, mensajeDe } from '../../src/utils/pedir';
import { estadoInicialOfrecer, estadoInicialPedir } from '../../src/mocks/flujosMock';
import { extractColombianIntersection, geocodeAddress, geocodeAddressStructured, isAddressIncomplete, reverseGeocodeStructured } from '../../src/utils/geocoding';

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
});
