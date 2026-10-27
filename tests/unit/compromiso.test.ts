import { describe, expect, it } from 'vitest';
import { avisoCompromiso, cantidadDe, textoCompromiso, type ParteCompromiso } from '../../src/utils/compromiso';

const agua: ParteCompromiso = { item: 'Agua potable', cantidad: 450, unidad: 'L' };
const kits: ParteCompromiso = { item: 'Alimentos', cantidad: 20, unidad: 'kits' };
const planta: ParteCompromiso = { item: 'Plantas eléctricas', cantidad: 1, unidad: 'plantas' };

describe('lo que se escribe en el campo de cantidad', () => {
  it('entiende el punto de miles y la coma decimal del manual', () => {
    expect(cantidadDe('1.500', 2000)).toBe(1500);
    expect(cantidadDe('1,5', 10)).toBe(1.5);
  });
  it('nunca pasa de lo que falta, y con 0, vacío, negativo o no numérico devuelve 0 (TRX-04)', () => {
    expect(cantidadDe('9999', 450)).toBe(450);
    expect(cantidadDe('', 450)).toBe(0);
    expect(cantidadDe('0', 450)).toBe(0);
    expect(cantidadDe('-10', 450)).toBe(0);
    expect(cantidadDe('menos tres', 450)).toBe(0);
  });
});

describe('lo comprometido, dicho en una línea', () => {
  it('une con «y», nunca con punto medio', () => {
    expect(textoCompromiso([agua], 'necesidad')).toBe('450 L de agua potable');
    expect(textoCompromiso([agua, kits], 'necesidad')).toBe('450 L de agua potable y 20 kits de alimentos');
    expect(textoCompromiso([agua, kits], 'necesidad')).not.toContain('·');
  });
  it('de tres en adelante resume con la palabra del vocabulario según el tipo', () => {
    expect(textoCompromiso([agua, kits, planta], 'necesidad')).toBe('450 L de agua potable y 2 solicitudes más');
    expect(textoCompromiso([agua, kits, planta], 'oferta')).toBe('450 L de agua potable y 2 recursos más');
  });
  it('pone el singular de la unidad cuando va una sola', () => {
    expect(textoCompromiso([planta], 'oferta')).toBe('1 planta de plantas eléctricas');
  });
});

describe('el aviso del resultado', () => {
  const c = { partes: [agua] };
  it('habla en verbo y confirma lo acordado sin fechas innecesarias', () => {
    expect(avisoCompromiso('Cruz Roja', 'necesidad', c)).toBe('Listo, te comprometiste con 450 L de agua potable para Cruz Roja');
    expect(avisoCompromiso('Cruz Roja', 'oferta', c)).toBe('Listo, le solicitaste 450 L de agua potable a Cruz Roja');
  });

  /* Un aviso dura 3,6 segundos: si no se alcanza a leer, no sirve (Alejandro, 24 de septiembre
     de 2026). El manual pide frases de hasta veinte palabras; en un aviso, la mitad. */
  it('cabe en una frase corta', () => {
    const a = avisoCompromiso('Cruz Roja', 'necesidad', c);
    expect(a.split(' ').length).toBeLessThanOrEqual(12);
    expect(a.split('. ').length).toBe(1);
  });
  it('no usa punto medio ni pasiva impersonal', () => {
    const a = avisoCompromiso('Cruz Roja', 'necesidad', c);
    expect(a).not.toContain('·');
    expect(a).not.toMatch(/^Compromiso enviado/);
  });
});

describe('TRX-04: validación de cantidades en diálogo de compromiso', () => {
  it('identifica cantidades no válidas (0, vacías, negativas o mayores a lo que queda)', () => {
    const queda = 1800;

    // Con 0 no debe registrar lo que falta sino 0
    expect(cantidadDe('0', queda)).toBe(0);
    // Con negativos debe devolver 0
    expect(cantidadDe('-5', queda)).toBe(0);
    // Con vacío debe devolver 0
    expect(cantidadDe('', queda)).toBe(0);
    // Con más de lo que queda, cantidadDe limita al saldo disponible
    expect(cantidadDe('180000', queda)).toBe(1800);
    // Con valor válido dentro del rango
    expect(cantidadDe('500', queda)).toBe(500);
  });
});

describe('TRX-03: flujo de Ayudar en matches de panel', () => {
  it('genera el aviso correcto de compromiso al ayudar a una necesidad de match', () => {
    const aviso = avisoCompromiso('Gobernacion quindio', 'necesidad', {
      partes: [{ item: 'Ropa y calzado', cantidad: 50, unidad: 'prendas' }],
    });
    expect(aviso).toBe('Listo, te comprometiste con 50 prendas de ropa y calzado para Gobernacion quindio');
  });

  it('genera el aviso correcto al solicitar ayuda de una oferta', () => {
    const aviso = avisoCompromiso('Defensa Civil', 'oferta', {
      partes: [{ item: 'Agua potable', cantidad: 100, unidad: 'L' }],
    });
    expect(aviso).toBe('Listo, le solicitaste 100 L de agua potable a Defensa Civil');
  });
});

