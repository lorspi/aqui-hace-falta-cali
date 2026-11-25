import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const mockState = vi.hoisted(() => ({
  orgsData: [] as any[],
  profilesData: [] as any[],
  updateCalls: [] as { table: string; payload: Record<string, any>; eqCol: string; eqVal: string }[],
  upsertCalls: [] as { table: string; rows: Record<string, any>[] }[],
  simulateRlsEmptyUpdateForTables: [] as string[],
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
    insert: vi.fn(async () => ({ data: [], error: null })),
    upsert: vi.fn((rows: Record<string, any>[]) => {
      mockState.upsertCalls.push({ table, rows });
      return {
        select: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: rows[0] || null, error: null })),
        })),
      };
    }),
    update: vi.fn((payload: Record<string, any>) => ({
      eq: vi.fn((eqCol: string, eqVal: string) => {
        mockState.updateCalls.push({ table, payload, eqCol, eqVal });
        const buildResult = () => {
          if (mockState.simulateRlsEmptyUpdateForTables.includes(table)) {
            return { data: [], error: null };
          }
          return { data: [{ id: eqVal, ...payload }], error: null };
        };
        return {
          select: vi.fn(async () => buildResult()),
          then: (resolve: (val: any) => void) => Promise.resolve(buildResult()).then(resolve),
        };
      }),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn((eqCol: string, eqVal: string) => {
        const buildResult = () => {
          if (mockState.simulateRlsEmptyUpdateForTables.includes(table)) {
            return { data: [], error: null };
          }
          return { data: [{ id: eqVal }], error: null };
        };
        return {
          select: vi.fn(async () => buildResult()),
          then: (resolve: (val: any) => void) => Promise.resolve(buildResult()).then(resolve),
        };
      }),
    })),
  }));

  return {
    supabase: { from },
  };
});

import {
  deleteAdminUser,
  deleteReport,
  fetchAdminOrganizationsList,
  fetchDirectorioEntidades,
  resolveReport,
  updateOrganizationDirectoryVisibility,
  updateUserModerationStatus,
  upsertOrganization,
  upsertUserProfile,
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
    mockState.upsertCalls = [];
    mockState.simulateRlsEmptyUpdateForTables = [];
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

  it('AdminPanelPage conecta el toggle Switch, recarga estado real desde BD y registra auditoría', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/AdminPanelPage.tsx'), 'utf-8');

    expect(src).toContain('updateOrganizationDirectoryVisibility');
    expect(src).toContain('handleToggleOrgDirectoryVisibility');
    expect(src).toContain('Mostrar en directorio');
    expect(src).toContain('Oculta en directorio');
    expect(src).toContain('SHOW_ORG_IN_DIRECTORY');
    expect(src).toContain('HIDE_ORG_FROM_DIRECTORY');

    const toggleBlockMatch = src.match(/const handleToggleOrgDirectoryVisibility\s*=[\s\S]*?\r?\n  \};/);
    expect(toggleBlockMatch).not.toBeNull();
    expect(toggleBlockMatch?.[0]).toContain('fetchAdminOrganizationsList()');
  });

  it('updateOrganizationDirectoryVisibility lanza error si RLS bloquea silenciosamente (0 filas) en perfil prof-*', async () => {
    mockState.simulateRlsEmptyUpdateForTables = ['profiles'];

    await expect(updateOrganizationDirectoryVisibility('prof-user-5', undefined, false)).rejects.toThrow(
      /No se pudo actualizar la visibilidad del perfil comunitario/i
    );
  });

  it('updateOrganizationDirectoryVisibility lanza error si RLS bloquea silenciosamente (0 filas) en organizations', async () => {
    mockState.simulateRlsEmptyUpdateForTables = ['organizations'];

    await expect(updateOrganizationDirectoryVisibility('org-test', 'user-2', false)).rejects.toThrow(
      /No se pudo actualizar la visibilidad en la base de datos/i
    );
  });

  it('migración consolidada asegura columnas, handle_new_user() completo y permisos granulares de staff', () => {
    const migSql = readFileSync(
      join(process.cwd(), 'supabase/migrations/20261125123500_allow_staff_directory_visibility_on_profiles.sql'),
      'utf-8'
    );

    expect(migSql).toContain('contact_phone');
    expect(migSql).toContain('contact_whatsapp');
    expect(migSql).toContain('contact_email');
    expect(migSql).toContain('show_in_directory');
    expect(migSql).toContain('volunteer_connection_type');

    expect(migSql).toContain('CREATE OR REPLACE FUNCTION public.handle_new_user()');
    expect(migSql).toContain("v_safe_role := 'moderador'");
    expect(migSql).toContain("v_safe_mod_status := 'PENDING'");
    expect(migSql).toContain('INSERT INTO public.organizations');

    expect(migSql).toContain('is_platform_staff()');
    expect(migSql).toContain('protect_profile_privileged_columns');
    expect(migSql).toContain("LOWER(TRIM(COALESCE(OLD.role, ''))) <> 'voluntario'");
    expect(migSql).toContain('CREATE POLICY "Permitir edicion de perfiles"');
  });

  it('upsertUserProfile y upsertOrganization no envían is_verified: false hardcoded', async () => {
    await upsertUserProfile({
      id: 'user-1',
      email: 'test@org.co',
      full_name: 'Entidad Verificada',
    });
    await upsertOrganization({
      user_id: 'user-1',
      org_name: 'Entidad Verificada',
      organization_type: 'ong_personas',
    });

    expect(mockState.upsertCalls).toHaveLength(2);
    expect(mockState.upsertCalls[0].rows[0]).not.toHaveProperty('is_verified');
    expect(mockState.upsertCalls[0].rows[0]).not.toHaveProperty('role');
    expect(mockState.upsertCalls[0].rows[0]).not.toHaveProperty('moderation_status');
    expect(mockState.upsertCalls[1].rows[0]).not.toHaveProperty('is_verified');
  });

  it('updateUserModerationStatus, resolveReport, deleteReport y deleteAdminUser lanzan error ante 0 filas por RLS', async () => {
    mockState.simulateRlsEmptyUpdateForTables = ['profiles', 'reports', 'offer_reports'];

    await expect(updateUserModerationStatus('vol-1', 'APPROVED')).rejects.toThrow(/estado de moderación/i);
    await expect(resolveReport('rep-1', 'RESOLVED', 'admin@test.org')).rejects.toThrow(/actualizar el reporte/i);
    await expect(deleteReport('rep-2', 'admin@test.org', true)).rejects.toThrow(/eliminar el reporte/i);
    await expect(deleteAdminUser('vol-1')).rejects.toThrow(/eliminar el usuario/i);
  });
});
