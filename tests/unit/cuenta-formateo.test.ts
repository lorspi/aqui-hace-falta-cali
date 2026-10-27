import { describe, expect, it } from 'vitest';
import { formatearRol, formatearTipoDocumento } from '../../src/utils/cuenta';
import { formatearTipoEntidad } from '../../src/utils/directorio';

describe('ORG-03: Formateo de roles, documentos y tipos de entidad', () => {
  describe('formatearRol', () => {
    it('traduce entidad_profesional a texto legible para personas', () => {
      expect(formatearRol('entidad_profesional')).toBe('Entidad profesional');
      expect(formatearRol('entidad_profesional', 'es')).toBe('Entidad profesional');
      expect(formatearRol('entidad_profesional', 'en')).toBe('Professional entity');
      expect(formatearRol('entidad_profesional', 'pt')).toBe('Entidade profissional');
      expect(formatearRol('entidad_profesional', 'fr')).toBe('Entité professionnelle');
    });

    it('traduce roles conocidos del sistema', () => {
      expect(formatearRol('voluntario')).toBe('Voluntario / Donante');
      expect(formatearRol('moderador')).toBe('Moderador');
      expect(formatearRol('regular')).toBe('Usuario regular');
      expect(formatearRol('admin')).toBe('Administrador');
      expect(formatearRol('administrador')).toBe('Administrador');
      expect(formatearRol('rescatista')).toBe('Rescatista / Operativo');
      expect(formatearRol('acopio')).toBe('Centro de acopio');
    });

    it('formatea roles con guiones bajos no mapeados explícitamente', () => {
      expect(formatearRol('coordinador_general')).toBe('Coordinador General');
      expect(formatearRol('lider_brigada')).toBe('Lider Brigada');
    });

    it('conserva roles ya formateados o textos limpios', () => {
      expect(formatearRol('Miembro')).toBe('Miembro');
      expect(formatearRol('Sin cargo')).toBe('Sin cargo');
    });

    it('maneja valores indefinidos o vacíos', () => {
      expect(formatearRol(undefined)).toBe('');
      expect(formatearRol('')).toBe('');
    });
  });

  describe('formatearTipoDocumento', () => {
    it('traduce tarjeta_identidad a texto legible', () => {
      expect(formatearTipoDocumento('tarjeta_identidad')).toBe('Tarjeta de identidad');
      expect(formatearTipoDocumento('tarjeta_identidad', 'es')).toBe('Tarjeta de identidad');
      expect(formatearTipoDocumento('tarjeta_identidad', 'en')).toBe('Identity card');
      expect(formatearTipoDocumento('tarjeta_identidad', 'pt')).toBe('Carteira de identidade');
      expect(formatearTipoDocumento('tarjeta_identidad', 'fr')).toBe("Carte d'identité");
    });

    it('traduce otros tipos de documento de base de datos', () => {
      expect(formatearTipoDocumento('cedula')).toBe('Cédula de ciudadanía');
      expect(formatearTipoDocumento('cedula_extranjeria')).toBe('Cédula de extranjería');
      expect(formatearTipoDocumento('pasaporte')).toBe('Pasaporte');
      expect(formatearTipoDocumento('ppt_pep')).toBe('PPT / PEP');
      expect(formatearTipoDocumento('nit')).toBe('NIT');
    });

    it('conserva tipos ya formateados', () => {
      expect(formatearTipoDocumento('Cédula de ciudadanía')).toBe('Cédula de ciudadanía');
      expect(formatearTipoDocumento('Tarjeta de identidad')).toBe('Tarjeta de identidad');
    });

    it('ofrece fallback adecuado cuando tipoDoc es vacío', () => {
      expect(formatearTipoDocumento(undefined, 'es')).toBe('Documento');
      expect(formatearTipoDocumento(undefined, 'en')).toBe('Document');
    });
  });

  describe('formatearTipoEntidad (reutilización en perfil)', () => {
    it('traduce bomberos_defensa_civil correctamente', () => {
      expect(formatearTipoEntidad('bomberos_defensa_civil')).toBe('Bomberos / Defensa Civil / Socorristas');
      expect(formatearTipoEntidad('bomberos_defensa_civil', false, 'en')).toBe('Firefighters / Civil Defense / First Responders');
    });
  });
});
