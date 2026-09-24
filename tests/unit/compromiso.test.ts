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
  it('nunca pasa de lo que falta, y sin número legible va por todo', () => {
    expect(cantidadDe('9999', 450)).toBe(450);
    expect(cantidadDe('', 450)).toBe(450);
    expect(cantidadDe('0', 450)).toBe(450);
    expect(cantidadDe('menos tres', 450)).toBe(450);
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
    expect(avisoCompromiso('Cruz Roja', 'necesidad', c)).toBe('Listo, avisamos a Cruz Roja. Te comprometiste con 450 L de agua potable.');
    expect(avisoCompromiso('Cruz Roja', 'oferta', c)).toBe('Listo, le solicitaste 450 L de agua potable a Cruz Roja.');
  });
  it('no usa punto medio ni pasiva impersonal', () => {
    const a = avisoCompromiso('Cruz Roja', 'necesidad', c);
    expect(a).not.toContain('·');
    expect(a).not.toMatch(/^Compromiso enviado/);
  });
});
