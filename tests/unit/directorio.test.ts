import { describe, expect, it } from 'vitest';
import { formatearTipoEntidad } from '../../src/utils/directorio';
import { itemListo } from '../../src/utils/ofrecer';
import type { EstadoOfrecer } from '../../src/types/flujo';

describe('directorio - formatearTipoEntidad (DIR-01)', () => {
  it('traduce enums técnicos de base de datos a nombres legibles', () => {
    expect(formatearTipoEntidad('bomberos_defensa_civil')).toBe('Bomberos / Defensa Civil / Socorristas');
    expect(formatearTipoEntidad('ong_personas')).toBe('ONG / Fundación de Ayuda Humanitaria');
    expect(formatearTipoEntidad('organismo_rescate')).toBe('Organismo de Rescate / Búsqueda');
    expect(formatearTipoEntidad('municipalidad_gobierno')).toBe('Alcaldía / Gobernación / Entidad Pública');
    expect(formatearTipoEntidad('junta_vecinal')).toBe('Junta de Acción Comunal (JAC) / JAL');
  });

  it('mantiene intactos los textos legibles ya formateados', () => {
    expect(formatearTipoEntidad('Cuerpo de socorro')).toBe('Cuerpo de socorro');
    expect(formatearTipoEntidad('Fundación')).toBe('Fundación');
    expect(formatearTipoEntidad('Junta de acción comunal')).toBe('Junta de acción comunal');
  });

  it('proporciona fallbacks adecuados para comunidad y organización cuando tipo es vacío', () => {
    expect(formatearTipoEntidad(undefined, true)).toBe('Comunidad / Liderazgo');
    expect(formatearTipoEntidad(undefined, false)).toBe('Organización');
  });

  it('traduce enums técnicos y fallbacks en inglés', () => {
    expect(formatearTipoEntidad('bomberos_defensa_civil', false, 'en')).toBe('Firefighters / Civil Defense / First Responders');
    expect(formatearTipoEntidad('ong_personas', false, 'en')).toBe('NGO / Humanitarian Aid Foundation');
    expect(formatearTipoEntidad(undefined, true, 'en')).toBe('Community / Leadership');
    expect(formatearTipoEntidad(undefined, false, 'en')).toBe('Organization');
  });
});

describe('directorio - i18n de cifrasDe y conteoTexto', () => {
  it('conteoTexto traduce comunidades y organizaciones en es y en', async () => {
    const { conteoTexto } = await import('../../src/utils/directorio');
    expect(conteoTexto(1, 'comunidad', 'es')).toBe('1 comunidad');
    expect(conteoTexto(5, 'comunidad', 'es')).toBe('5 comunidades');
    expect(conteoTexto(1, 'comunidad', 'en')).toBe('1 community');
    expect(conteoTexto(5, 'comunidad', 'en')).toBe('5 communities');
    expect(conteoTexto(1, 'organizacion', 'en')).toBe('1 organization');
    expect(conteoTexto(3, 'organizacion', 'en')).toBe('3 organizations');
  });

  it('cifrasDe traduce rótulos de ofertas, pedidos y métricas en inglés', async () => {
    const { cifrasDe } = await import('../../src/utils/directorio');
    const entidadOrg = {
      id: 'org-1',
      nombre: 'Cruz Roja',
      clase: 'organizacion' as const,
      tipo: 'bomberos_defensa_civil',
      zona: 'Cali',
      dir: 'Calle 5',
      tel: '123',
      entregas: 10,
      lat: 3.4,
      lng: -76.5,
    };
    const pubOferta = {
      id: 'pub-1',
      tipo: 'oferta' as const,
      titulo: 'Oferta de agua',
      org: 'Cruz Roja',
      verificada: true,
      lat: 3.4,
      lng: -76.5,
      zona: 'Cali',
      recursos: [{ item: 'Agua potable', unidad: 'L', total: 100, tramos: [] }],
    };

    const filasEs = cifrasDe(entidadOrg, [pubOferta], 'es');
    expect(filasEs).toContainEqual(['Ofrece', '1 recurso']);
    expect(filasEs).toContainEqual(['Entregas confirmadas', '10']);

    const filasEn = cifrasDe(entidadOrg, [pubOferta], 'en');
    expect(filasEn).toContainEqual(['Offers', '1 resource']);
    expect(filasEn).toContainEqual(['Confirmed deliveries', '10']);
  });
});

describe('ofrecer - validación de fecha de disponibilidad (OFA-06)', () => {
  const baseEstado: EstadoOfrecer = {
    sel: ['Agua potable'],
    cant: { 'Agua potable': 100 },
    det: {},
    entrega: 'sitio',
    radio: '',
    envio: '',
    canales: [],
    horario: '',
    dir: 'Calle 10 # 5-20',
    ubicacion: null,
    contacto: { nombre: 'Juan', tel: '3001234567', wa: true },
    fotos: [],
  };

  it('rechaza fechas pasadas cuando la disponibilidad es "Hasta una fecha"', () => {
    const estadoConFechaPasada: EstadoOfrecer = {
      ...baseEstado,
      det: {
        'Agua potable': {
          disp: 'Hasta una fecha',
          fecha: '2020-01-01',
          pres: 'Botellones de 5 L',
        },
      },
    };
    expect(itemListo(estadoConFechaPasada, 'Agua potable')).toBe(false);
  });

  it('acepta fechas futuras o de hoy cuando la disponibilidad es "Hasta una fecha"', () => {
    const hoy = new Date().toISOString().split('T')[0];
    const manana = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];

    const estadoConHoy: EstadoOfrecer = {
      ...baseEstado,
      det: {
        'Agua potable': {
          disp: 'Hasta una fecha',
          fecha: hoy,
          pres: 'Botellones de 5 L',
        },
      },
    };
    expect(itemListo(estadoConHoy, 'Agua potable')).toBe(true);

    const estadoConManana: EstadoOfrecer = {
      ...baseEstado,
      det: {
        'Agua potable': {
          disp: 'Hasta una fecha',
          fecha: manana,
          pres: 'Botellones de 5 L',
        },
      },
    };
    expect(itemListo(estadoConManana, 'Agua potable')).toBe(true);
  });

  it('acepta disponibilidad "Hasta agotar" sin requerir fecha', () => {
    const estadoHastaAgotar: EstadoOfrecer = {
      ...baseEstado,
      det: {
        'Agua potable': {
          disp: 'Hasta agotar',
          pres: 'Botellones de 5 L',
        },
      },
    };
    expect(itemListo(estadoHastaAgotar, 'Agua potable')).toBe(true);
  });
});
