import { describe, it, expect } from 'vitest';
import { camino, listo } from '../../src/pages/registro/pasos';
import { PERFILES, estadoInicial } from '../../src/mocks/cuentasMock';
import { entidadGuardada, nombrePanel } from '../../src/utils/cuenta';

describe('Registro de persona natural', () => {
  it('PERFILES incluye persona natural justo abajo de organizacion y comunidad', () => {
    const ids = PERFILES.map((p) => p.id);
    expect(ids).toEqual(['organizacion', 'liderazgo', 'individual']);
    expect(PERFILES[2].nombre).toBe('Persona natural');
    expect(PERFILES[2].icono).toBe('persona');
  });

  it('camino("individual") tiene los pasos correctos: perfil -> ind_datos -> ind_cuenta', () => {
    const c = camino('individual');
    expect(c.map((p) => p.id)).toEqual(['perfil', 'ind_datos', 'ind_cuenta']);
    expect(c[1].nombre).toBe('Tus datos');
    expect(c[2].nombre).toBe('Tu cuenta');
  });

  it('valida paso 1 (ind_datos): requiere nombre, apellido, tipo de documento y número de documento', () => {
    const e = estadoInicial(false);
    e.perfil = 'individual';
    const pasoDatos = camino('individual')[1];

    expect(listo(pasoDatos, e, {})).toBe(false);

    e.ind.nombre = 'Ana';
    e.ind.apellido = 'Gómez';
    expect(listo(pasoDatos, e, {})).toBe(false);

    e.ind.tipoDocumento = 'Cédula de ciudadanía';
    e.ind.numeroDocumento = '1234567890';
    expect(listo(pasoDatos, e, {})).toBe(true);
  });

  it('valida paso 2 (ind_cuenta): requiere correo, celular, clave válida, repetir clave y aceptar términos', () => {
    const e = estadoInicial(false);
    e.perfil = 'individual';
    const pasoCuenta = camino('individual')[2];

    // Vacío no está listo
    expect(listo(pasoCuenta, e, {})).toBe(false);

    // Con datos incompletos (sin celular)
    e.ind.correo = 'ana@ejemplo.com';
    expect(listo(pasoCuenta, e, { ip: 'ClaveSegura1!', iq: 'ClaveSegura1!' })).toBe(false);

    // Con celular pero faltan términos
    e.ind.celular = '3001234567';
    expect(listo(pasoCuenta, e, { ip: 'ClaveSegura1!', iq: 'ClaveSegura1!' })).toBe(false);

    // Con términos pero contraseñas no coinciden
    e.ind.terminos = true;
    expect(listo(pasoCuenta, e, { ip: 'ClaveSegura1!', iq: 'OtraClave!' })).toBe(false);

    // Con todo listo (sin captcha en entorno node/test)
    expect(listo(pasoCuenta, e, { ip: 'ClaveSegura1!', iq: 'ClaveSegura1!' })).toBe(true);
  });

  it('entidadGuardada y nombrePanel reconocen individual', () => {
    expect(entidadGuardada('?entidad=individual')).toBe('individual');
    expect(nombrePanel('individual')).toBe('Mi cuenta');
  });
});
