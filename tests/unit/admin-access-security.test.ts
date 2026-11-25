import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  clearAdminSession,
  getPanelAccessRole,
  getStoredAuthUser,
  saveStoredAuthUser,
} from '../../src/utils/session';

const ROOT = resolve(__dirname, '../..');
const readRepoFile = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf-8');

describe('Seguridad de acceso al Panel Admin y roles (getPanelAccessRole / session)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('otorga acceso ADMIN para roles admin/administrador sin depender de moderation_status', () => {
    expect(getPanelAccessRole({ role: 'ADMIN' })).toBe('ADMIN');
    expect(getPanelAccessRole({ role: 'admin', moderation_status: null })).toBe('ADMIN');
    expect(getPanelAccessRole({ role: 'ADMINISTRADOR', moderation_status: 'PENDING' })).toBe('ADMIN');
  });

  it('otorga acceso MODERATOR únicamente cuando role es moderador/moderator Y moderation_status es APPROVED', () => {
    expect(getPanelAccessRole({ role: 'moderador', moderation_status: 'APPROVED' })).toBe('MODERATOR');
    expect(getPanelAccessRole({ role: 'MODERATOR', moderationStatus: 'APPROVED' })).toBe('MODERATOR');
    expect(getPanelAccessRole({ role: 'moderador', moderation_status: 'PENDING' })).toBeNull();
    expect(getPanelAccessRole({ role: 'moderador', moderation_status: 'REJECTED' })).toBeNull();
    expect(getPanelAccessRole({ role: 'moderador' })).toBeNull();
    expect(getPanelAccessRole({ role: 'MODERATOR', moderation_status: '' })).toBeNull();
  });

  it('deniega acceso al panel a Comunidad (lider), Organización, Voluntario y Usuario regular', () => {
    expect(getPanelAccessRole({ role: 'lider', moderation_status: 'APPROVED' })).toBeNull();
    expect(getPanelAccessRole({ role: 'voluntario', moderation_status: 'APPROVED' })).toBeNull();
    expect(getPanelAccessRole({ role: 'regular', moderation_status: 'APPROVED' })).toBeNull();
    expect(getPanelAccessRole({ role: 'entidad_profesional', moderation_status: 'APPROVED' })).toBeNull();
    expect(getPanelAccessRole({ role: 'organizacion', moderation_status: 'APPROVED' })).toBeNull();
    expect(getPanelAccessRole(null)).toBeNull();
    expect(getPanelAccessRole(undefined)).toBeNull();
  });

  it('clearAdminSession limpia ahf_admin_* sin afectar la sesión normal del usuario', () => {
    mockLocalStorage.setItem('ahf_admin_token', 'stale-admin-token');
    mockLocalStorage.setItem(
      'ahf_admin_user',
      JSON.stringify({ id: 'admin-1', name: 'Admin Previo', role: 'ADMIN' })
    );
    saveStoredAuthUser({
      id: 'com-1',
      name: 'Junta Vecinal El Jardín',
      email: 'junta@comunidad.org',
      role: 'lider',
      profile_type: 'liderazgo',
    });

    // Antes de limpiar, ahf_admin_token + ahf_admin_user tenían prioridad
    expect(getStoredAuthUser()?.role).toBe('ADMIN');

    clearAdminSession();
    const user = getStoredAuthUser();
    expect(user?.id).toBe('com-1');
    expect(user?.role).toBe('lider');
    expect(mockLocalStorage.getItem('ahf_admin_token')).toBeNull();
    expect(mockLocalStorage.getItem('ahf_admin_user')).toBeNull();
  });

  it('ignora ahf_admin_user huérfano si no existe ahf_admin_token', () => {
    mockLocalStorage.setItem(
      'ahf_admin_user',
      JSON.stringify({ id: 'admin-1', name: 'Admin Huérfano', role: 'ADMIN' })
    );
    saveStoredAuthUser({
      id: 'org-1',
      name: 'Fundación Viva',
      email: 'hola@fundacionviva.org',
      role: 'voluntario',
      profile_type: 'organizacion',
    });

    const user = getStoredAuthUser();
    expect(user?.id).toBe('org-1');
    expect(user?.role).toBe('voluntario');
  });
});

describe('Contratos de seguridad contra escalamiento y brechas en frontend/SQL', () => {
  it('RegistroPage y cuentasMock asignan role "lider" (nunca "moderador") al perfil Comunidad', () => {
    const registroSrc = readRepoFile('src/pages/registro/RegistroPage.tsx');
    const mockSrc = readRepoFile('src/mocks/cuentasMock.ts');

    expect(registroSrc).toContain("profile_type: 'liderazgo'");
    expect(registroSrc).toContain("role: 'lider'");
    expect(registroSrc).not.toMatch(/profile_type:\s*'liderazgo'[\s\S]{0,160}role:\s*'moderador'/);

    expect(mockSrc).toContain("rolSupabase: 'lider'");
    expect(mockSrc).not.toContain("rolSupabase: 'moderador'");
  });

  it('Shell.tsx no concede privilegios admin por coincidencia en el correo electrónico', () => {
    const shellSrc = readRepoFile('src/components/ui/Shell.tsx');

    expect(shellSrc).not.toContain("includes('admin')");
    expect(shellSrc).not.toContain("includes('moderador')");
    expect(shellSrc).toContain('getPanelAccessRole');
    expect(shellSrc).toContain('clearAdminSession');
  });

  it('supabaseService.ts elimina claves backdoor y valida rol aprobado en adminLogin', () => {
    const serviceSrc = readRepoFile('src/lib/supabaseService.ts');

    expect(serviceSrc).not.toContain('moderador123');
    expect(serviceSrc).not.toContain('admin123');
    expect(serviceSrc).toContain('getPanelAccessRole(profile)');
  });

  it('AdminPanelPage.tsx revalida la sesión contra Supabase al montar y no confía en localStorage como estado inicial', () => {
    const adminPageSrc = readRepoFile('src/components/AdminPanelPage.tsx');

    expect(adminPageSrc).not.toMatch(/useState<string \| null>\(\(\)\s*=>\s*localStorage\.getItem\(["']ahf_admin_token["']\)/);
    expect(adminPageSrc).toContain('supabase.auth.getUser()');
    expect(adminPageSrc).toContain('getPanelAccessRole(profile)');
    expect(adminPageSrc).toContain('clearAdminSession()');
  });

  it('Migraciones SQL blindan handle_new_user() con whitelist y endurecen RLS con is_platform_admin/is_platform_staff', () => {
    const migWhitelist = readRepoFile(
      'supabase/migrations/20261125120000_fix_community_role_and_signup_whitelist.sql'
    );
    const migRls = readRepoFile('supabase/migrations/20261125121000_harden_admin_rls.sql');

    expect(migWhitelist).toContain("v_requested_role IN ('voluntario', 'regular', 'entidad_profesional', 'lider')");
    expect(migWhitelist).toContain("role = 'lider'");
    expect(migWhitelist).toContain("WHERE profile_type = 'liderazgo'");

    expect(migRls).toContain('is_platform_admin');
    expect(migRls).toContain('is_platform_staff');
    expect(migRls).toContain('protect_profile_privileged_columns');
    expect(migRls).toContain('protect_organization_privileged_columns');
    expect(migRls).toContain('trg_protect_profile_privileged_columns');
    expect(migRls).toContain('trg_protect_organization_privileged_columns');
  });
});
