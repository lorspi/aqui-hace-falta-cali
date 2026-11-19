import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const mockState = vi.hoisted(() => ({
  orgsData: [] as any[],
  profilesData: [] as any[],
  updateCalls: [] as { table: string; payload: Record<string, any>; eqCol: string; eqVal: string }[],
}));

vi.mock('../../src/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => ({
    select: vi.fn(() => {
      if (table === 'organizations') {
        return {
          order: vi.fn(async () => ({ data: mockState.orgsData, error: null })),
        };
      }
      if (table === 'profiles') {
        return Promise.resolve({ data: mockState.profilesData, error: null });
      }
      return Promise.resolve({ data: [], error: null });
    }),
    update: vi.fn((payload: Record<string, any>) => ({
      eq: vi.fn(async (eqCol: string, eqVal: string) => {
        mockState.updateCalls.push({ table, payload, eqCol, eqVal });
        return { error: null };
      }),
    })),
  }));

  return {
    supabase: { from },
  };
});

import {
  fetchAdminOrganizationsList,
  fetchDirectorioEntidades,
  updateOrganizationDirectoryVisibility,
} from '../../src/lib/supabaseService';

describe('Visibilidad en Directorio (show_in_directory)', () => {
  beforeEach(() => {
    mockState.orgsData = [
      {
        id: 'org-real',
        user_id: 'user-1',
        org_name: 'Cruz Roja Real',
        organization_type: 'cuerpo_socorro',
        is_verified: true,
        show_in_directory: true,
      },
      {
        id: 'org-test',
        user_id: 'user-2',
        org_name: 'Org de Prueba',
        organization_type: 'fundacion',
        is_verified: false,
        show_in_directory: false,
      },
      {
        id: 'org-legacy',
        user_id: 'user-3',
        org_name: 'Org Sin Columna',
        organization_type: 'ong_personas',
        is_verified: false,
      },
    ];

    mockState.profilesData = [
      {
        id: 'user-1',
        full_name: 'Contacto Real',
        email: 'real@test.org',
        profile_type: 'organizacion',
        show_in_directory: true,
      },
      {
        id: 'user-4',
        full_name: 'Comunidad Visible',
        email: 'com1@test.org',
        profile_type: 'liderazgo',
        moderator_community_collective: 'JAC Visible',
        show_in_directory: true,
      },
      {
        id: 'user-5',
        full_name: 'Comunidad Prueba',
        email: 'com2@test.org',
        profile_type: 'liderazgo',
        moderator_community_collective: 'JAC de Prueba',
        show_in_directory: false,
      },
    ];

    mockState.updateCalls = [];
  });

  it('fetchAdminOrganizationsList devuelve todas las entidades (visibles y ocultas) con su flag showInDirectory', async () => {
    const lista = await fetchAdminOrganizationsList();

    expect(lista).toHaveLength(5);
    expect(lista.find((o) => o.id === 'org-real')?.showInDirectory).toBe(true);
    expect(lista.find((o) => o.id === 'org-test')?.showInDirectory).toBe(false);
    expect(lista.find((o) => o.id === 'org-legacy')?.showInDirectory).toBe(true);
    expect(lista.find((o) => o.id === 'prof-user-4')?.showInDirectory).toBe(true);
    expect(lista.find((o) => o.id === 'prof-user-5')?.showInDirectory).toBe(false);
  });

  it('fetchDirectorioEntidades filtra entidades ocultas tanto de organizations como de profiles (prof-*)', async () => {
    const directorio = await fetchDirectorioEntidades();
    const ids = directorio.map((e) => e.id);

    expect(ids).toContain('org-real');
    expect(ids).toContain('org-legacy');
    expect(ids).toContain('prof-user-4');
    expect(ids).not.toContain('org-test');
    expect(ids).not.toContain('prof-user-5');
    expect(directorio).toHaveLength(3);
  });

  it('updateOrganizationDirectoryVisibility actualiza organizations (sin updated_at) y profiles para orgs normales', async () => {
    await updateOrganizationDirectoryVisibility('org-test', 'user-2', true);

    expect(mockState.updateCalls).toHaveLength(2);
    expect(mockState.updateCalls[0]).toEqual({
      table: 'organizations',
      eqCol: 'id',
      eqVal: 'org-test',
      payload: { show_in_directory: true },
    });
    expect(mockState.updateCalls[1]).toMatchObject({
      table: 'profiles',
      eqCol: 'id',
      eqVal: 'user-2',
      payload: { show_in_directory: true },
    });
  });

  it('updateOrganizationDirectoryVisibility actualiza solo profiles cuando el id es prof-*', async () => {
    await updateOrganizationDirectoryVisibility('prof-user-5', undefined, false);

    expect(mockState.updateCalls).toHaveLength(1);
    expect(mockState.updateCalls[0]).toMatchObject({
      table: 'profiles',
      eqCol: 'id',
      eqVal: 'user-5',
      payload: { show_in_directory: false },
    });
  });

  it('AdminPanelPage conecta el toggle Switch y auditoría para visibilidad en directorio', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/AdminPanelPage.tsx'), 'utf-8');

    expect(src).toContain('updateOrganizationDirectoryVisibility');
    expect(src).toContain('handleToggleOrgDirectoryVisibility');
    expect(src).toContain('Mostrar en directorio');
    expect(src).toContain('Oculta en directorio');
    expect(src).toContain('SHOW_ORG_IN_DIRECTORY');
    expect(src).toContain('HIDE_ORG_FROM_DIRECTORY');
  });
});
