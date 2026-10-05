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
  agregarFotosEntrega,
  agregarFotosRecibida,
  fotosDeEntrega,
  fotosDeRecibida,
  cuentaFotos,
  listaFotos,
  hidratarFotosDesdeCommitments,
} from '../../src/mocks/fotosMock';

describe('Persistencia y sincronización de fotos (fotosMock.ts)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('guarda fotos de entrega y las recupera por id numérico y dbId', () => {
    const foto = {
      url: 'https://images.unsplash.com/photo-1?w=800',
      alt: 'Foto de prueba 1',
      quien: 'Bomberos Voluntarios',
      cuando: 'Hoy cert.',
    };

    agregarFotosEntrega(999, [foto], 'entrega', 'uuid-commitment-999');

    // Recuperar con id numérico
    const fNum = fotosDeEntrega(999);
    expect(fNum.entrega.length).toBe(1);
    expect(fNum.entrega[0].url).toBe(foto.url);

    // Recuperar con dbId
    const fDb = fotosDeEntrega('uuid-commitment-999');
    expect(fDb.entrega.length).toBe(1);
    expect(fDb.entrega[0].url).toBe(foto.url);

    // Verificar que se guardó en localStorage
    expect(mockLocalStorage.getItem('rd-fotos-entrega')).toBeTruthy();
  });

  it('guarda fotos de recibida y no duplica fotos repetidas', () => {
    const foto = {
      url: 'https://images.unsplash.com/photo-rec-1?w=800',
      alt: 'Foto recibida 1',
      quien: 'JAC Comunal',
      cuando: 'Hoy conf.',
    };

    agregarFotosRecibida(888, [foto], 'recibe', 'uuid-commitment-888');
    agregarFotosRecibida(888, [foto], 'recibe', 'uuid-commitment-888');

    const f = fotosDeRecibida(888, 'uuid-commitment-888');
    expect(f.recibe.length).toBe(1);
    expect(cuentaFotos(f)).toBe(1);
    expect(listaFotos(f)[0].url).toBe(foto.url);
  });

  it('hidrata fotos desde commitments de Supabase ignorando blobs temporales', () => {
    const mockCommitments = [
      {
        id: 'c-uuid-1234',
        provider_org_name: 'Cruz Roja Seccional',
        requester_name: 'Comedor La Esperanza',
        delivery_photos: [
          'https://supabase.co/storage/v1/evidence/entrega1.jpg',
          'blob:http://localhost:5173/dead-blob-url', // URL efímera que debe descartarse
        ],
        reception_photos: [
          'https://supabase.co/storage/v1/evidence/recibe1.jpg',
        ],
        updated_at: '2026-10-05T12:00:00Z',
      },
    ];

    hidratarFotosDesdeCommitments(mockCommitments);

    const fEntrega = fotosDeEntrega('c-uuid-1234');
    expect(fEntrega.entrega.length).toBe(1);
    expect(fEntrega.entrega[0].url).toBe('https://supabase.co/storage/v1/evidence/entrega1.jpg');
    expect(fEntrega.recibe.length).toBe(1);
    expect(fEntrega.recibe[0].url).toBe('https://supabase.co/storage/v1/evidence/recibe1.jpg');

    // Verificar que también esté disponible en fotosDeRecibida para la contraparte
    const fRecibida = fotosDeRecibida('c-uuid-1234');
    expect(fRecibida.entrega.length).toBe(1);
    expect(fRecibida.recibe.length).toBe(1);
  });
});
