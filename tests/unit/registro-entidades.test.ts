import { describe, it, expect } from 'vitest';
import { camino, listo } from '../../src/pages/registro/pasos';
import { estadoInicial } from '../../src/mocks/cuentasMock';

describe('Registro de Organizacion y Comunidad', () => {
  it('camino("organizacion") tiene los pasos correctos: perfil -> org -> persona -> cuenta', () => {
    const c = camino('organizacion');
    expect(c.map((p) => p.id)).toEqual(['perfil', 'org', 'persona', 'cuenta']);
    expect(c[1].nombre).toBe('Datos de la organización');
    expect(c[2].nombre).toBe('Tus datos');
    expect(c[3].nombre).toBe('Tu cuenta');
  });

  it('camino("liderazgo") tiene los pasos correctos: perfil -> com -> persona -> cuenta', () => {
    const c = camino('liderazgo');
    expect(c.map((p) => p.id)).toEqual(['perfil', 'com', 'persona', 'cuenta']);
    expect(c[1].nombre).toBe('Datos de la comunidad');
    expect(c[2].nombre).toBe('Tus datos');
    expect(c[3].nombre).toBe('Tu cuenta');
  });

  it('valida paso org: requiere nombre, tipo, celular y correo de contacto; nit, web y doc son opcionales', () => {
    const e = estadoInicial(false);
    e.perfil = 'organizacion';
    const pasoOrg = camino('organizacion')[1];

    expect(listo(pasoOrg, e, {})).toBe(false);

    e.org.nombre = 'Fundación Cali Unida';
    expect(listo(pasoOrg, e, {})).toBe(false);

    e.org.tipo = 'Fundación';
    // Falta contacto requerido (celular y correo)
    expect(listo(pasoOrg, e, {})).toBe(false);

    e.org.contacto.tel = '3001234567';
    expect(listo(pasoOrg, e, {})).toBe(false);

    e.org.contacto.correo = 'contacto@caliunida.org';
    expect(listo(pasoOrg, e, {})).toBe(true);

    // Con datos adicionales opcionales sigue siendo válido
    e.org.nit = '900.123.456-7';
    e.org.web = 'https://caliunida.org';
    e.org.contacto.mismoWa = true;
    e.org.documentoAdjunto = true;
    expect(listo(pasoOrg, e, {})).toBe(true);
  });

  it('valida paso com: requiere nombre de la comunidad, tipo, departamento, celular y correo de contacto', () => {
    const e = estadoInicial(false);
    e.perfil = 'liderazgo';
    const pasoCom = camino('liderazgo')[1];

    expect(listo(pasoCom, e, {})).toBe(false);

    e.com.nombre = 'Comunidad San Antonio';
    expect(listo(pasoCom, e, {})).toBe(false);

    e.com.tipo = 'Barrio o comuna';
    // Falta contacto requerido (celular y correo)
    expect(listo(pasoCom, e, {})).toBe(false);

    e.com.contacto.tel = '3117654321';
    expect(listo(pasoCom, e, {})).toBe(false);

    e.com.contacto.correo = 'comunidad@sanantonio.org';
    // Departamento viene con 'Valle del Cauca' por defecto en estadoInicial
    expect(listo(pasoCom, e, {})).toBe(true);

    // Si falta departamento, no está listo
    e.com.departamento = '';
    expect(listo(pasoCom, e, {})).toBe(false);

    e.com.departamento = 'Antioquia';
    expect(listo(pasoCom, e, {})).toBe(true);
  });

  it('valida paso persona (paso 2): requiere nombre y cédula; celular es opcional pero valida formato si se ingresa', () => {
    for (const perfil of ['organizacion', 'liderazgo'] as const) {
      const e = estadoInicial(false);
      e.perfil = perfil;
      const pasoPersona = camino(perfil)[2];

      expect(listo(pasoPersona, e, {})).toBe(false);

      e.per.nombre = 'Carlos Rodríguez';
      // Sin cédula no está listo
      expect(listo(pasoPersona, e, {})).toBe(false);

      e.per.cedula = '1234567890';
      // Con nombre y cédula está listo (celular es opcional)
      expect(listo(pasoPersona, e, {})).toBe(true);

      // Si se ingresa un celular inválido (menos de 10 dígitos), no está listo
      e.per.tel = '300';
      expect(listo(pasoPersona, e, {})).toBe(false);

      // Con celular válido de 10 dígitos está listo
      e.per.tel = '3001234567';
      expect(listo(pasoPersona, e, {})).toBe(true);
    }
  });

  it('valida paso cuenta (para organizacion y liderazgo): requiere correo, clave válida, repetir clave y aceptar términos', () => {
    for (const perfil of ['organizacion', 'liderazgo'] as const) {
      const e = estadoInicial(false);
      e.perfil = perfil;
      const pasoCuenta = camino(perfil)[3];

      // Vacío no está listo
      expect(listo(pasoCuenta, e, {})).toBe(false);

      // Con correo pero sin clave ni términos
      e.per.correo = 'contacto@ejemplo.com';
      expect(listo(pasoCuenta, e, {})).toBe(false);

      // Con clave pero faltan términos
      expect(listo(pasoCuenta, e, { cp: 'ClaveSegura1!', cq: 'ClaveSegura1!' })).toBe(false);

      // Con términos pero contraseñas no coinciden
      e.per.terminos = true;
      expect(listo(pasoCuenta, e, { cp: 'ClaveSegura1!', cq: 'OtraClave!' })).toBe(false);

      // Con todo listo (sin captcha en entorno node/test)
      expect(listo(pasoCuenta, e, { cp: 'ClaveSegura1!', cq: 'ClaveSegura1!' })).toBe(true);
    }
  });
});

