import { beforeEach, describe, expect, it } from 'vitest';

const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const k of Object.keys(store)) {
      delete store[k];
    }
  },
};

(globalThis as any).localStorage = mockLocalStorage;

import {
  clearStoredAuthUser,
  getStoredAuthUser,
  isUserLoggedIn,
  saveStoredAuthUser,
  type StoredAuthUser,
} from '../../src/utils/session';
import {
  guardarAccionPendiente,
  hayAccionPendiente,
  limpiarAccionPendiente,
  obtenerAccionPendiente,
  type AccionPendiente,
} from '../../src/utils/pendingAction';

describe('Gestión de sesión persistente síncrona (session.ts)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('retorna null cuando no hay ningún usuario guardado', () => {
    expect(getStoredAuthUser()).toBeNull();
    expect(isUserLoggedIn()).toBe(false);
  });

  it('guarda y recupera usuario normal con perfil y organización', () => {
    const usuario: StoredAuthUser = {
      id: 'usr-123',
      email: 'voluntario@fundacion.org',
      name: 'María Paz',
      role: 'voluntario',
      profile_type: 'organizacion',
      org_name: 'Fundación Huellas',
      organization: {
        org_name: 'Fundación Huellas',
        organization_type: 'Fundación',
      },
    };

    saveStoredAuthUser(usuario);
    expect(isUserLoggedIn()).toBe(true);

    const obtenido = getStoredAuthUser();
    expect(obtenido).not.toBeNull();
    expect(obtenido?.id).toBe('usr-123');
    expect(obtenido?.profile_type).toBe('organizacion');
    expect(obtenido?.org_name).toBe('Fundación Huellas');
  });

  it('da prioridad al admin de ahf_admin_user si existe token', () => {
    mockLocalStorage.setItem('ahf_admin_token', 'token-123');
    mockLocalStorage.setItem(
      'ahf_admin_user',
      JSON.stringify({
        id: 'admin-1',
        name: 'Administrador General',
        email: 'admin@radar.org',
        role: 'ADMIN',
      })
    );

    const obtenido = getStoredAuthUser();
    expect(obtenido?.id).toBe('admin-1');
    expect(obtenido?.role).toBe('ADMIN');
    expect(isUserLoggedIn()).toBe(true);
  });

  it('limpia correctamente la sesión almacenada', () => {
    saveStoredAuthUser({
      id: 'usr-456',
      email: 'persona@gmail.com',
      name: 'Carlos',
      role: 'voluntario',
      profile_type: 'persona',
    });
    expect(isUserLoggedIn()).toBe(true);

    clearStoredAuthUser();
    expect(getStoredAuthUser()).toBeNull();
    expect(isUserLoggedIn()).toBe(false);
  });
});

describe('Persistencia de intenciones y acciones pendientes (pendingAction.ts)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('informa correctamente cuando no hay acción pendiente', () => {
    expect(hayAccionPendiente()).toBe(false);
    expect(obtenerAccionPendiente()).toBeNull();
  });

  it('guarda, detecta y recupera una acción de compromiso', () => {
    const accion: AccionPendiente = {
      tipo: 'compromiso',
      publicacionId: 'pub-999',
      rutaRetorno: '/mapa-ayudas-necesidades',
      mensaje: 'Inicia sesión para ofrecer ayuda.',
      fecha: new Date().toISOString(),
    };

    guardarAccionPendiente(accion);
    expect(hayAccionPendiente()).toBe(true);

    const obtenida = obtenerAccionPendiente();
    expect(obtenida).not.toBeNull();
    expect(obtenida?.tipo).toBe('compromiso');
    expect(obtenida?.publicacionId).toBe('pub-999');
    expect(obtenida?.rutaRetorno).toBe('/mapa-ayudas-necesidades');
  });

  it('guarda y recupera una acción de publicación de flujo', () => {
    const accion: AccionPendiente = {
      tipo: 'publicar_flujo',
      rutaRetorno: '/pedir-v2',
      fecha: new Date().toISOString(),
    };

    guardarAccionPendiente(accion);
    expect(hayAccionPendiente()).toBe(true);
    expect(obtenerAccionPendiente()?.tipo).toBe('publicar_flujo');
    expect(obtenerAccionPendiente()?.rutaRetorno).toBe('/pedir-v2');
  });

  it('limpia la acción pendiente adecuadamente', () => {
    guardarAccionPendiente({
      tipo: 'generica',
      rutaRetorno: '/directorio-v2',
      fecha: new Date().toISOString(),
    });
    expect(hayAccionPendiente()).toBe(true);

    limpiarAccionPendiente();
    expect(hayAccionPendiente()).toBe(false);
    expect(obtenerAccionPendiente()).toBeNull();
  });

  it('guarda acción de compromiso desde directorio y reanuda tras inicio de sesión', () => {
    // 1. Usuario no logueado intenta solicitar/ayudar desde el directorio
    expect(getStoredAuthUser()).toBeNull();
    const accionDirectorio: AccionPendiente = {
      tipo: 'compromiso',
      publicacionId: 'pub-directorio-1',
      tipoPublicacion: 'oferta',
      rutaRetorno: '/directorio-v2',
      autoEjecutar: true,
      mensaje: 'Inicia sesión o regístrate para solicitar este recurso.',
    };

    guardarAccionPendiente(accionDirectorio);
    expect(hayAccionPendiente()).toBe(true);

    // 2. Se completa el login exitosamente
    saveStoredAuthUser({
      id: 'usr-nuevo',
      email: 'persona@ejemplo.com',
      name: 'Persona Ayuda',
      role: 'voluntario',
      profile_type: 'persona',
    });
    expect(isUserLoggedIn()).toBe(true);

    // 3. El directorio detecta la acción pendiente para auto-ejecutar el compromiso
    const pendiente = obtenerAccionPendiente();
    expect(pendiente).not.toBeNull();
    expect(pendiente?.tipo).toBe('compromiso');
    expect(pendiente?.publicacionId).toBe('pub-directorio-1');
    expect(pendiente?.autoEjecutar).toBe(true);

    // 4. Se ejecuta y se limpia
    limpiarAccionPendiente();
    expect(hayAccionPendiente()).toBe(false);
  });
});
