import { describe, it, expect } from 'vitest';
import { filtrosVacios, pasaResto } from '../../src/utils/filtros';
import { CATEGORY_LABELS } from '../../src/utils/formatters';
import type { Publicacion, Ubicacion } from '../../src/types/publicacion';
import { contactoListo, esTelefonoValido, listoPedir, mensajeDe } from '../../src/utils/pedir';
import { estadoInicialPedir } from '../../src/mocks/flujosMock';
import { geocodeAddress } from '../../src/utils/geocoding';

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
});
