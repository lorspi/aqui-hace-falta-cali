/**
 * Utilidades de sesión sincronizada en cliente (localStorage + estado rápido).
 * Evita el parpadeo (flasheo) de estado no logueado al navegar entre pantallas.
 */

export type PanelAccessRole = 'ADMIN' | 'MODERATOR' | null;

export interface StoredUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
  moderation_status?: string | null;
  profile_type?: string;
  org_name?: string;
  organization?: any;
  user_metadata?: Record<string, any>;
  createdAt?: string;
  [key: string]: any;
}

const CLAVE_AUTH_USER = 'ahf_auth_user';
const CLAVE_ADMIN_USER = 'ahf_admin_user';
const CLAVE_ADMIN_TOKEN = 'ahf_admin_token';

/**
 * Determina el rol autorizado para acceder al Panel Admin y funciones de moderación
 * a partir del perfil en DB (`public.profiles`).
 * - `ADMIN` / `ADMINISTRADOR` -> `'ADMIN'`
 * - `MODERADOR` / `MODERATOR` solo si `moderation_status === 'APPROVED'` -> `'MODERATOR'`
 * - Cualquier otro rol (incluyendo `'lider'`, `'voluntario'`, etc.) o moderador no aprobado -> `null`
 */
export function getPanelAccessRole(
  profile:
    | {
        role?: string | null;
        moderation_status?: string | null;
        moderationStatus?: string | null;
      }
    | null
    | undefined
): PanelAccessRole {
  if (!profile?.role) return null;
  const normRole = profile.role.toString().trim().toUpperCase();
  if (normRole === 'ADMIN' || normRole === 'ADMINISTRADOR') {
    return 'ADMIN';
  }
  if (normRole === 'MODERADOR' || normRole === 'MODERATOR') {
    const status = (profile.moderation_status ?? profile.moderationStatus ?? '')
      .toString()
      .trim()
      .toUpperCase();
    return status === 'APPROVED' ? 'MODERATOR' : null;
  }
  return null;
}

/**
 * Limpia únicamente las credenciales administrativas en `localStorage` sin cerrar la sesión regular.
 */
export function clearAdminSession(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(CLAVE_ADMIN_USER);
    localStorage.removeItem(CLAVE_ADMIN_TOKEN);
  } catch {}
}

/**
 * Obtiene el usuario autenticado de forma sincrónica desde localStorage.
 * Permite que los componentes monten directamente con el estado de sesión correcto
 * sin esperar la resolución asíncrona de Supabase.
 */
export function getStoredAuthUser(): StoredUser | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const adminToken = localStorage.getItem(CLAVE_ADMIN_TOKEN);
    const adminRaw = localStorage.getItem(CLAVE_ADMIN_USER);
    if (adminToken && adminRaw) {
      const parsed = JSON.parse(adminRaw);
      if (parsed?.id || parsed?.name) {
        return {
          ...parsed,
          role: parsed.role || 'ADMIN',
        };
      }
    }
  } catch {}

  try {
    const authRaw = localStorage.getItem(CLAVE_AUTH_USER);
    if (authRaw) {
      const parsed = JSON.parse(authRaw);
      if (parsed?.id || parsed?.email) {
        return parsed;
      }
    }
  } catch {}

  return null;
}

export type StoredAuthUser = StoredUser;

export const EVENTO_AUTH_CHANGED = 'ahf_auth_changed';

/**
 * Guarda el usuario normalizado en localStorage y notifica a los componentes en tiempo real.
 */
export function saveStoredAuthUser(user: StoredUser): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CLAVE_AUTH_USER, JSON.stringify(user));
  } catch {}
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(EVENTO_AUTH_CHANGED, { detail: user }));
    } catch {}
  }
}

/**
 * Comprueba de forma síncrona si hay una sesión guardada.
 */
export function isUserLoggedIn(): boolean {
  return getStoredAuthUser() !== null;
}

/**
 * Limpia la sesión del usuario en localStorage y notifica a todos los componentes para actualizar la UI inmediatamente.
 */
export function clearStoredAuthUser(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(CLAVE_AUTH_USER);
    localStorage.removeItem(CLAVE_ADMIN_USER);
    localStorage.removeItem(CLAVE_ADMIN_TOKEN);
  } catch {}
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(EVENTO_AUTH_CHANGED, { detail: null }));
    } catch {}
  }
}
