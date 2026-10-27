import { describe, expect, it } from 'vitest';
import { commitmentToEntregaRecibida, commitmentToSolicitud } from '../../src/utils/supabaseMappers';
import type { EntregaRecibida } from '../../src/types/panel';

describe('TRX-05 & CIC-01: Seguimiento - Ayuda que recibo y mapeo de estados', () => {
  it('homologa status "propuesta" a "nueva" para que aparezca en la columna Ofertas (CIC-01)', () => {
    const rawCommitmentPropuesta = {
      id: 'comm-123',
      resource_name: 'Colchonetas',
      quantity: 10,
      unit: 'unidades',
      status: 'propuesta',
      provider_org_name: 'Defensa Civil',
      created_at: new Date().toISOString(),
    };

    const mappedRec = commitmentToEntregaRecibida(rawCommitmentPropuesta);
    expect(mappedRec.estado).toBe('nueva');

    const mappedSol = commitmentToSolicitud(rawCommitmentPropuesta);
    expect(mappedSol.estado).toBe('nueva');
  });

  it('no suma ayudas canceladas o archivadas en el conteo activo de Ayuda que recibo (TRX-05)', () => {
    const COLUMNAS_RECIBIDAS = [
      { id: 'ofertas', estados: ['nueva', 'propuesta'] },
      { id: 'aceptada', estados: ['aceptada'] },
      { id: 'camino', estados: ['camino', 'entregada'] },
      { id: 'recibido', estados: ['confirmada'] },
      { id: 'distribuido', estados: ['distribuida'] },
      { id: 'archivadas', estados: ['archivada'] },
    ];

    const recibidasMock: Partial<EntregaRecibida>[] = [
      { id: 1, estado: 'nueva' }, // Oferta activa
      { id: 2, estado: 'aceptada' }, // Comprometida activa
      { id: 3, estado: 'archivada' }, // Archivada (no debe contar)
      { id: 4, estado: 'cancelada' as any }, // Cancelada (no debe contar)
      { id: 5, estado: 'rechazada' as any }, // Rechazada (no debe contar)
    ];

    const estadosActivosRecibo = COLUMNAS_RECIBIDAS
      .filter((c) => c.id !== 'archivadas')
      .flatMap((c) => c.estados);

    const nActivas = recibidasMock.filter((r) => estadosActivosRecibo.includes(r.estado as any)).length;

    // Solo debe contar las 2 tarjetas activas (nueva y aceptada)
    expect(nActivas).toBe(2);
  });

  it('cuando todas las ayudas están canceladas o archivadas, el conteo de activas es exactamente 0', () => {
    const COLUMNAS_RECIBIDAS = [
      { id: 'ofertas', estados: ['nueva', 'propuesta'] },
      { id: 'aceptada', estados: ['aceptada'] },
      { id: 'camino', estados: ['camino', 'entregada'] },
      { id: 'recibido', estados: ['confirmada'] },
      { id: 'distribuido', estados: ['distribuida'] },
      { id: 'archivadas', estados: ['archivada'] },
    ];

    const recibidasMock: Partial<EntregaRecibida>[] = [
      { id: 1, estado: 'cancelada' as any },
      { id: 2, estado: 'cancelada' as any },
      { id: 3, estado: 'archivada' },
    ];

    const estadosActivosRecibo = COLUMNAS_RECIBIDAS
      .filter((c) => c.id !== 'archivadas')
      .flatMap((c) => c.estados);

    const nActivas = recibidasMock.filter((r) => estadosActivosRecibo.includes(r.estado as any)).length;

    expect(nActivas).toBe(0);
  });
});
