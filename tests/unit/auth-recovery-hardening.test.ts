import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TEXTOS } from '../../src/pages/registro/textos';

const ROOT = process.cwd();

describe('Blindaje de recuperación de contraseña y retiro de wizard v1', () => {
  it('elimina el texto y botón de simular enlace de recuperación', () => {
    expect((TEXTOS.recuperar as Record<string, string>).simularEnlace).toBeUndefined();
    expect(TEXTOS.recuperar.actualizando).toBeTruthy();
    expect(TEXTOS.recuperar.enlaceInvalido).toBeTruthy();
    expect(TEXTOS.recuperar.solicitarNuevo).toBeTruthy();
  });

  it('RegistroPage no permite saltar a nueva_contrasena ni redirige sin llamar updateUser', () => {
    const src = readFileSync(join(ROOT, 'src/pages/registro/RegistroPage.tsx'), 'utf-8');

    expect(src).not.toContain('simularEnlace');
    expect(src).not.toMatch(/if\s*\(\s*e\.modo\s*===\s*'recuperar_enviado'\s*\)\s*\{\s*patch\(\{\s*modo:\s*'nueva_contrasena'/);

    // El botón guardar debe invocar hacerActualizarContrasena, no saltar directo a RUTAS.mapa
    expect(src).toContain('onClick={hacerActualizarContrasena}');
    expect(src).toContain('sesionRecuperacionLista');
    expect(src).toContain('supabase.auth.updateUser({ password: newPassword })');
  });

  it('LoginModal y PerfilPage redirigen la recuperación hacia /registro?modo=nueva_contrasena', () => {
    const loginSrc = readFileSync(join(ROOT, 'src/features/auth/components/LoginModal.tsx'), 'utf-8');
    expect(loginSrc).toContain('redirectTo: `${window.location.origin}/registro?modo=nueva_contrasena`');

    const perfilSrc = readFileSync(join(ROOT, 'src/pages/perfil/PerfilPage.tsx'), 'utf-8');
    expect(perfilSrc).toContain('redirectTo: `${window.location.origin}/registro?modo=nueva_contrasena`');
    expect(perfilSrc).toContain('if (error) throw error;');
  });

  it('App.tsx maneja PASSWORD_RECOVERY en la raíz y no dispara RegisterWizard v1 si falta profile', () => {
    const src = readFileSync(join(ROOT, 'src/App.tsx'), 'utf-8');

    // ResetPasswordModal debe montarse en la raíz App() para cubrir también el landing (/)
    const rootAppSection = src.split('function MainApp')[0];
    expect(rootAppSection).toContain('<ResetPasswordModal');
    expect(rootAppSection).toContain("event === 'PASSWORD_RECOVERY'");

    // No debe existir el disparo automático del wizard v1 cuando !profile
    expect(src).not.toContain('setRegisterInitialStep(2)');
    expect(src).not.toContain('<RegisterWizard');
  });
});
