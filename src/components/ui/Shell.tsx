import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronLeft, ClipboardList, Hand, HeartHandshake, House, LogIn, LogOut, MapPin, Menu, Plus, ShieldCheck, Users, X } from 'lucide-react';
import { Avatar, Contador } from './Etiqueta';
import { Divisor } from './Divisor';
import { supabase } from '../../lib/supabaseClient';
import { entidadActual } from '../../utils/cuenta';

/**
 * El cascarón de la app con sesión (`rd-shell` del prototipo), con utilidades sobre los
 * tokens `rd-*`.
 *   ≥ 1024  side nav de 232 (plegable a 64: solo iconos) con la marca, tres secciones, la
 *           cuenta y «Cerrar sesión»; el contenido en una tarjeta de radio 16.
 *   < 1024  el side nav no existe: una píldora flotante solo con iconos —Radar · Directorio ·
 *           «+» · Avisos · Panel— (decisiones 144, 167), el panel del «+» con Pedir y Ofrecer,
 *           y un cajón lateral con la cuenta y las secciones que abre el ☰ de la cabecera.
 * El nombre del panel lo pone la entidad («Mi organización» / «Mi comunidad»); lo que hay
 * dentro lo decide el objetivo.
 */
export type Seccion = 'panel' | 'panel-admin' | 'radar' | 'directorio' | 'avisos' | 'perfil' | 'actividad';

export interface Cuenta {
  entidad: string;
  persona: string;
  rol: string;
  iniciales: string;
}

export interface ShellProps {
  seccion: Seccion;
  panelNombre: string;
  cuenta: Cuenta;
  authUser?: any;
  isModeratorOrAdmin?: boolean;
  pendientes?: number;
  avisosNuevos?: number;
  rutas: Record<Seccion | 'inicio' | 'salir', string>;
  onPedir?: () => void;
  onOfrecer?: () => void;
  onOpenLoginModal?: () => void;
  onOpenProfileModal?: () => void;
  onLogout?: () => void;
  /** El ☰ de la cabecera móvil se conecta aquí. */
  cajonAbierto?: boolean;
  onCerrarCajon?: () => void;
  children: React.ReactNode;
}

const ITEM = 'font-rd flex h-9.5 shrink-0 items-center gap-3 rounded-rd-lg px-3 text-rd-13-5 font-medium whitespace-nowrap text-rd-ink-2 no-underline hover:bg-rd-fondo hover:text-rd-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy';
const ITEM_ACTUAL = 'bg-rd-navy-soft font-semibold text-rd-navy hover:bg-rd-navy-soft hover:text-rd-navy';

export const Shell: React.FC<ShellProps> = ({ seccion, panelNombre, cuenta, authUser, isModeratorOrAdmin = false, pendientes = 0, avisosNuevos = 0, rutas, onPedir, onOfrecer, onOpenLoginModal, onOpenProfileModal, onLogout, cajonAbierto = false, onCerrarCajon, children }) => {
  const [plegado, setPlegado] = useState(false);
  const [masAbierto, setMasAbierto] = useState(false);
  const masRef = useRef<HTMLDivElement>(null);

  const [sessionUser, setSessionUser] = useState<any>(authUser || null);

  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user && isMounted) {
          setSessionUser(data.user);
          return;
        }
      } catch {}
      const saved = localStorage.getItem('ahf_auth_user') || localStorage.getItem('ahf_admin_user');
      if (saved && isMounted) {
        try {
          setSessionUser(JSON.parse(saved));
        } catch {}
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isMounted) {
        setSessionUser(session.user);
      } else if (!authUser && isMounted) {
        setSessionUser(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [authUser]);

  const activeUser = useMemo(() => {
    if (!authUser && !sessionUser) return null;
    return {
      ...(sessionUser || {}),
      ...(authUser || {}),
      id: authUser?.id || sessionUser?.id,
      user_metadata: {
        ...(sessionUser?.user_metadata || {}),
        ...(authUser?.user_metadata || {}),
      },
      role: authUser?.role || sessionUser?.user_metadata?.role || sessionUser?.role,
      profile_type: authUser?.profile_type || sessionUser?.user_metadata?.profile_type || sessionUser?.user_metadata?.profileType || sessionUser?.profile_type,
      org_name: authUser?.org_name || sessionUser?.user_metadata?.org_name || sessionUser?.org_name || sessionUser?.organization,
    };
  }, [authUser, sessionUser]);

  const estaLogueado = Boolean(activeUser);

  const cuentaFinal = useMemo(() => {
    if (!activeUser) return cuenta;
    const name = activeUser.name || activeUser.user_metadata?.full_name || activeUser.email || cuenta.entidad;
    const inicialesStr = name.split(' ').map((n: string) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || cuenta.iniciales;
    return {
      entidad: name,
      persona: activeUser.email || cuenta.persona,
      rol: activeUser.user_metadata?.role || cuenta.rol,
      iniciales: inicialesStr
    };
  }, [activeUser, cuenta]);

  const handleLogoutAction = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('ahf_auth_user');
    localStorage.removeItem('ahf_admin_user');
    localStorage.removeItem('ahf_admin_token');
    window.location.href = '/';
  };

  /* El panel del «+» se cierra con Escape o tocando fuera. */
  useEffect(() => {
    if (!masAbierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setMasAbierto(false);
    const alTocar = (e: MouseEvent) => {
      if (masRef.current && !masRef.current.contains(e.target as Node)) setMasAbierto(false);
    };
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('mousedown', alTocar);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('mousedown', alTocar);
    };
  }, [masAbierto]);

  useEffect(() => {
    if (!cajonAbierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrarCajon?.();
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [cajonAbierto, onCerrarCajon]);

  const handleClickNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href || href === '#' || href.startsWith('http://') || href.startsWith('https://')) return;
    e.preventDefault();
    if (window.location.pathname !== href) {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const [hasOrg, setHasOrg] = useState<boolean>(false);

  useEffect(() => {
    if (!activeUser?.id) {
      setHasOrg(false);
      return;
    }
    async function checkOrg() {
      try {
        const { data } = await supabase.from('organizations').select('id').eq('user_id', activeUser.id).maybeSingle();
        if (data) {
          setHasOrg(true);
        }
      } catch {}
    }
    checkOrg();
  }, [activeUser?.id]);

  const userRole = (activeUser?.user_metadata?.role || activeUser?.role || cuentaFinal?.rol || '').toLowerCase();
  const profileType = (activeUser?.user_metadata?.profile_type || activeUser?.user_metadata?.profileType || activeUser?.profile_type || '').toLowerCase();
  const entidadStorage = (typeof window !== 'undefined' ? localStorage.getItem('rd-entidad') : '') || '';

  const esComunidad =
    profileType === 'comunidad' ||
    profileType === 'liderazgo' ||
    profileType === 'lider' ||
    userRole === 'lider' ||
    userRole === 'liderazgo' ||
    userRole === 'comunidad' ||
    entidadStorage === 'liderazgo' ||
    entidadStorage === 'comunidad' ||
    entidadActual() === 'liderazgo';

  const esOrganizacion = (
    hasOrg ||
    profileType === 'organizacion' ||
    profileType === 'comunidad' ||
    profileType === 'liderazgo' ||
    profileType === 'lider' ||
    userRole === 'organizacion' ||
    userRole === 'lider' ||
    userRole === 'liderazgo' ||
    userRole === 'comunidad' ||
    userRole === 'moderador' ||
    userRole === 'entidad_profesional' ||
    Boolean(activeUser?.user_metadata?.org_name) ||
    Boolean(activeUser?.org_name) ||
    Boolean(activeUser?.organization) ||
    entidadStorage === 'organizacion' ||
    entidadStorage === 'liderazgo' ||
    entidadStorage === 'comunidad' ||
    entidadActual() === 'organizacion' ||
    entidadActual() === 'liderazgo'
  );

  const esAdminOModerador = (
    isModeratorOrAdmin ||
    userRole === 'admin' ||
    userRole === 'moderador' ||
    activeUser?.email?.includes('admin') ||
    activeUser?.email?.includes('moderador')
  );

  const esIndividual =
    profileType === 'persona' ||
    profileType === 'individual' ||
    userRole === 'voluntario' ||
    userRole === 'regular' ||
    entidadStorage === 'individual' ||
    entidadActual() === 'individual' ||
    (!esOrganizacion && !esAdminOModerador && estaLogueado);

  const nombrePanelDinamico = esComunidad
    ? 'Mi comunidad'
    : (panelNombre && panelNombre !== 'Panel' ? panelNombre : 'Mi organización');

  const secciones: { id: Seccion; nombre: string; href: string; icono: React.ReactNode; n?: number }[] = [
    { id: 'radar', nombre: 'Radar', href: rutas.radar || '/mapa-ayudas-necesidades', icono: <MapPin className="h-5 w-5" /> },
    { id: 'directorio', nombre: 'Directorio', href: rutas.directorio || '/directorio-v2', icono: <Users className="h-5 w-5" /> },
  ];

  if (esAdminOModerador) {
    secciones.push({ id: 'panel-admin' as Seccion, nombre: 'Panel admin', href: rutas['panel-admin'] || '/panel-admin', icono: <ShieldCheck className="h-5 w-5" /> });
    if (esOrganizacion) {
      secciones.push({ id: 'panel', nombre: nombrePanelDinamico, href: rutas.panel || '/panel-organizacion', icono: <House className="h-5 w-5" />, n: pendientes });
    }
  } else if (esComunidad || esOrganizacion) {
    secciones.push({ id: 'panel', nombre: nombrePanelDinamico, href: rutas.panel || '/panel-organizacion', icono: <House className="h-5 w-5" />, n: pendientes });
  } else if (esIndividual) {
    secciones.push({ id: 'actividad', nombre: 'Mi actividad', href: rutas.actividad || '/mi-actividad', icono: <ClipboardList className="h-5 w-5" />, n: pendientes });
  } else {
    secciones.push({ id: 'panel', nombre: nombrePanelDinamico, href: rutas.panel || '/panel-organizacion', icono: <House className="h-5 w-5" />, n: pendientes });
  }

  // 5ta pestaña móvil: Mi organización / Mi comunidad / Mi actividad / Panel admin según perfil
  const tabPerfil = useMemo(() => {
    // 1. Administrador o Moderador
    if (esAdminOModerador && (userRole === 'admin' || userRole === 'moderador' || seccion === 'panel-admin' || !esOrganizacion)) {
      return {
        id: 'panel-admin' as Seccion,
        nombre: 'Panel admin',
        href: rutas['panel-admin'] || '/panel-admin',
        icono: <ShieldCheck className="h-6 w-6" />,
        actual: seccion === 'panel-admin',
        n: 0,
        etiqueta: 'Panel admin',
      };
    }

    // 2. Líder comunitario / Comunidad
    if (esComunidad) {
      return {
        id: 'panel' as Seccion,
        nombre: 'Mi comunidad',
        href: rutas.panel || '/panel-v2',
        icono: <House className="h-6 w-6" />,
        actual: seccion === 'panel',
        n: pendientes,
        etiqueta: `Mi comunidad${pendientes > 0 ? `, ${pendientes} pendientes` : ''}`,
      };
    }

    // 3. Voluntario / Persona natural / Mi actividad
    if (esIndividual) {
      return {
        id: 'actividad' as Seccion,
        nombre: 'Mi actividad',
        href: rutas.actividad || '/mi-actividad',
        icono: <ClipboardList className="h-6 w-6" />,
        actual: seccion === 'actividad',
        n: pendientes,
        etiqueta: `Mi actividad${pendientes > 0 ? `, ${pendientes} pendientes` : ''}`,
      };
    }

    // 4. Organización (ONG, Fundación, etc.) por defecto
    return {
      id: 'panel' as Seccion,
      nombre: nombrePanelDinamico || 'Mi organización',
      href: rutas.panel || '/panel-v2',
      icono: <House className="h-6 w-6" />,
      actual: seccion === 'panel',
      n: pendientes,
      etiqueta: `${nombrePanelDinamico || 'Mi organización'}${pendientes > 0 ? `, ${pendientes} pendientes` : ''}`,
    };
  }, [esAdminOModerador, userRole, seccion, esOrganizacion, esComunidad, esIndividual, rutas, pendientes, nombrePanelDinamico]);

  const enlace = (s: (typeof secciones)[number], grande = false) => {
    const actual = s.id === seccion;
    return (
      <a
        key={s.id}
        href={s.href}
        onClick={(e) => {
          if (grande) onCerrarCajon?.();
          handleClickNav(e, s.href);
        }}
        aria-current={actual ? 'page' : undefined}
        className={`${ITEM} ${actual ? ITEM_ACTUAL : ''} ${grande ? 'h-13 rounded-rd-md text-rd-16' : ''} ${plegado && !grande ? 'relative justify-center px-0' : ''}`}
      >
        <span aria-hidden="true" className={`shrink-0 ${actual ? 'text-rd-navy' : 'text-rd-ink-3'}`}>
          {s.icono}
        </span>
        <span className={`min-w-0 flex-1 truncate ${plegado && !grande ? 'sr-only' : ''}`}>{s.nombre}</span>
        {s.n ? <Contador n={s.n} titulo={`${s.n} pendientes`} className={plegado && !grande ? 'absolute top-1 right-1 h-4 min-w-4 px-1 text-rd-10' : 'ml-auto'} /> : null}
      </a>
    );
  };

  return (
    <div className={`rd-app font-rd flex min-h-dvh w-full max-w-full overflow-x-hidden gap-3 bg-rd-fondo p-3 lg:h-dvh lg:overflow-hidden text-rd-15 leading-relaxed tracking-rd-cuerpo text-rd-ink antialiased max-lg:block max-lg:gap-0 max-lg:bg-rd-surface max-lg:p-0 ${plegado ? 'is-plegado' : ''}`}>
      {/* ---- side nav (solo ≥ 1024) ---- */}
      <nav
        aria-label="Secciones"
        className={`flex h-full shrink-0 flex-col rounded-rd-md border border-rd-line bg-rd-surface py-4 transition-all duration-200 max-lg:hidden ${plegado ? 'w-16 px-2' : 'w-58 px-3'}`}
      >
        <div className={`flex shrink-0 ${plegado ? 'flex-col items-center gap-2 mb-2' : 'items-center justify-between px-1 mb-2'}`}>
          <a
            href={rutas.inicio}
            onClick={(e) => handleClickNav(e, rutas.inicio || '/mapa-ayudas-necesidades')}
            aria-label="RaDAR de ayuda, inicio"
            title="RaDAR de ayuda, inicio"
            className="flex items-center justify-center focus-visible:rounded-rd-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rd-navy hover:opacity-90 transition-opacity"
          >
            {plegado ? (
              <img src="/simbolo-radar.svg" alt="Radar de Ayuda" className="block h-7.5 w-7.5 shrink-0 object-contain" />
            ) : (
              <img src="/logo-radar.svg" alt="Radar de Ayuda" className="block h-8 w-auto min-w-0" />
            )}
          </a>
          <button
            type="button"
            onClick={() => setPlegado((p) => !p)}
            aria-label={plegado ? 'Desplegar el menú' : 'Plegar el menú'}
            aria-expanded={!plegado}
            title={plegado ? 'Desplegar el menú' : 'Plegar el menú'}
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-3 hover:bg-rd-fondo hover:text-rd-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy"
          >
            <ChevronLeft aria-hidden="true" className={`h-4.5 w-4.5 transition-transform duration-200 ${plegado ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto">
          {secciones.map((s) => (
            <li key={s.id}>{enlace(s)}</li>
          ))}
        </ul>

        {/* ---- cuenta o login/registro en parte inferior ---- */}
        <div className="mt-auto flex shrink-0 flex-col gap-1 border-t border-rd-line pt-2">
          {estaLogueado ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  if (onOpenProfileModal) {
                    onOpenProfileModal();
                  } else {
                    handleClickNav(e as any, rutas.perfil || '/perfil-v2');
                  }
                }}
                aria-current={seccion === 'perfil' ? 'page' : undefined}
                className={`flex items-start gap-2 rounded-rd-lg p-2 text-rd-ink text-left no-underline hover:bg-rd-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy cursor-pointer w-full ${plegado ? 'justify-center p-1' : ''}`}
                title="Ver perfil de usuario"
              >
                <Avatar iniciales={cuentaFinal.iniciales} tamano="md" />
                {!plegado && (
                  <span className="flex min-w-0 flex-col">
                    <b className="truncate text-rd-13 font-semibold">{cuentaFinal.entidad}</b>
                    <span className="truncate text-rd-11-5 text-rd-ink-meta">
                      {cuentaFinal.persona}
                      <Divisor />
                      {cuentaFinal.rol}
                    </span>
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={handleLogoutAction}
                className={`${ITEM} h-9 text-rd-13 text-rd-ink-meta ${plegado ? 'justify-center px-0' : ''} cursor-pointer w-full text-left`}
              >
                <LogOut aria-hidden="true" className="h-5 w-5 shrink-0 text-rd-ink-3" />
                <span className={plegado ? 'sr-only' : ''}>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal || (() => {
                window.history.pushState({}, '', '/registro-v2?modo=login');
                window.dispatchEvent(new PopStateEvent('popstate'));
              })}
              className={`flex items-center gap-2.5 rounded-rd-lg px-3 py-2.5 text-rd-navy font-semibold bg-rd-navy-soft hover:bg-rd-navy/20 transition-all cursor-pointer ${plegado ? 'justify-center px-0' : ''}`}
              title="Iniciar sesión / Registro"
            >
              <LogIn aria-hidden="true" className="h-5 w-5 shrink-0 text-rd-navy" />
              {!plegado && (
                <span className="truncate text-rd-13 font-bold">
                  Iniciar sesión / Registro
                </span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* ---- contenido ---- */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-rd-xl border border-rd-line bg-rd-surface max-lg:min-h-dvh max-lg:w-full max-lg:max-w-full max-lg:overflow-x-hidden max-lg:rounded-none max-lg:border-0 max-lg:pb-16">
        {children}
      </div>

      {/* ---- píldora móvil (solo < 1024) ---- */}
      <nav
        aria-label="Secciones"
        className="fixed right-4 bottom-2 left-4 z-800 box-border flex h-14 items-center rounded-full border border-rd-line bg-rd-surface px-2 shadow-rd-2 lg:hidden"
      >
        <TabItem href={rutas.radar} actual={seccion === 'radar'} nombre="Radar" icono={<MapPin className="h-6 w-6" />} />
        <TabItem href={rutas.directorio} actual={seccion === 'directorio'} nombre="Directorio" icono={<Users className="h-6 w-6" />} />
        <div ref={masRef} className="relative flex w-11 shrink-0 justify-center">
          <button
            type="button"
            onClick={() => setMasAbierto((a) => !a)}
            aria-label="Pedir o ofrecer ayuda"
            aria-haspopup="dialog"
            aria-expanded={masAbierto}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-rd-navy text-white hover:bg-rd-navy-hover focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-rd-navy"
          >
            <Plus aria-hidden="true" className={`h-6 w-6 transition-transform ${masAbierto ? 'rotate-45' : ''}`} />
          </button>
          {masAbierto && (
            <div role="dialog" aria-label="Pedir o ofrecer ayuda" className="absolute bottom-full left-1/2 mb-4 flex -translate-x-1/2 gap-4 rounded-rd-xl bg-rd-ink px-4 py-3 shadow-rd-2 after:absolute after:-bottom-1.5 after:left-1/2 after:h-3 after:w-3 after:-translate-x-1/2 after:rotate-45 after:bg-rd-ink">
              <FichaMas nombre="Pedir ayuda" color="bg-rd-coral" icono={<Hand className="h-6 w-6" />} onClick={() => { setMasAbierto(false); onPedir?.(); }} />
              <FichaMas nombre="Ofrecer ayuda" color="bg-rd-navy" icono={<HeartHandshake className="h-6 w-6" />} onClick={() => { setMasAbierto(false); onOfrecer?.(); }} />
            </div>
          )}
        </div>
        <TabItem href={rutas.avisos} actual={seccion === 'avisos'} nombre="Avisos" icono={<Bell className="h-6 w-6" />} n={avisosNuevos} etiqueta={`Avisos, ${avisosNuevos} nuevos`} />
        <TabItem
          href={tabPerfil.href}
          actual={tabPerfil.actual}
          nombre={tabPerfil.nombre}
          icono={tabPerfil.icono}
          n={tabPerfil.n}
          etiqueta={tabPerfil.etiqueta}
        />
      </nav>

      {/* ---- cajón lateral (solo < 1024) ---- */}
      {cajonAbierto && (
        <div className="fixed inset-0 z-900 lg:hidden">
          <button type="button" aria-label="Cerrar el menú" onClick={onCerrarCajon} className="absolute inset-0 cursor-default bg-rd-ink/40" />
          <div role="dialog" aria-modal="true" aria-label="Menú" className="absolute top-0 right-0 bottom-0 flex w-4/5 max-w-90 flex-col overflow-auto rounded-l-rd-md bg-rd-surface shadow-rd-2">
            <div className="flex min-h-16 items-center justify-between border-b border-rd-line px-4 py-3 sm:px-6">
              <a
                href={rutas.inicio}
                onClick={(e) => {
                  onCerrarCajon?.();
                  handleClickNav(e, rutas.inicio || '/mapa-ayudas-necesidades');
                }}
                aria-label="RaDAR de ayuda, inicio"
              >
                <img src="/logo-radar.svg" alt="" className="block h-7.5 w-auto" />
              </a>
              <button type="button" onClick={onCerrarCajon} aria-label="Cerrar el menú" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-rd-md bg-rd-sunken text-rd-ink focus-visible:outline-2 focus-visible:outline-rd-navy">
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <ul className="px-4 py-3 sm:px-6">
              {secciones.map((s) => (
                <li key={s.id}>{enlace(s, true)}</li>
              ))}
              <li>
                <a
                  href={rutas.avisos}
                  onClick={(e) => {
                    onCerrarCajon?.();
                    handleClickNav(e, rutas.avisos || '/avisos-v2');
                  }}
                  aria-current={seccion === 'avisos' ? 'page' : undefined}
                  className={`${ITEM} h-13 rounded-rd-md text-rd-16 ${seccion === 'avisos' ? ITEM_ACTUAL : ''}`}
                >
                  <Bell aria-hidden="true" className="h-5.5 w-5.5 shrink-0 text-rd-ink-3" />
                  <span className="flex-1">Avisos</span>
                  {avisosNuevos > 0 && <Contador n={avisosNuevos} className="ml-auto" />}
                </a>
              </li>
            </ul>

            {/* La cuenta o login abajo en cajón móvil */}
            {estaLogueado ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    onCerrarCajon?.();
                    if (onOpenProfileModal) {
                      onOpenProfileModal();
                    } else {
                      handleClickNav(e as any, rutas.perfil || '/perfil-v2');
                    }
                  }}
                  aria-current={seccion === 'perfil' ? 'page' : undefined}
                  className="mt-auto flex items-start gap-3 px-4 py-3 text-rd-ink text-left no-underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy sm:px-6 cursor-pointer w-full"
                >
                  <Avatar iniciales={cuentaFinal.iniciales} tamano="lg" />
                  <span className="flex min-w-0 flex-col">
                    <b className="truncate text-rd-14 font-semibold">{cuentaFinal.entidad}</b>
                    <span className="truncate text-rd-12 text-rd-ink-meta">
                      {cuentaFinal.persona}
                      <Divisor />
                      {cuentaFinal.rol}
                    </span>
                  </span>
                </button>
                <div className="border-t border-rd-line px-4 pt-3 pb-6 sm:px-6">
                  <button
                    type="button"
                    onClick={handleLogoutAction}
                    className={`${ITEM} h-12 text-rd-15 text-rd-ink-meta w-full text-left cursor-pointer`}
                  >
                    <LogOut aria-hidden="true" className="h-5.5 w-5.5 shrink-0 text-rd-ink-3" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-auto border-t border-rd-line px-4 pt-4 pb-6 sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    onCerrarCajon?.();
                    if (onOpenLoginModal) {
                      onOpenLoginModal();
                    } else {
                      window.history.pushState({}, '', '/registro-v2?modo=login');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2.5 rounded-rd-lg px-4 py-3 text-rd-navy font-bold bg-rd-navy-soft hover:bg-rd-navy/20 transition-all cursor-pointer text-rd-15"
                >
                  <LogIn aria-hidden="true" className="h-5.5 w-5.5 shrink-0 text-rd-navy" />
                  <span>Iniciar sesión / Registro</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const TabItem: React.FC<{ href: string; actual: boolean; nombre: string; icono: React.ReactNode; n?: number; etiqueta?: string }> = ({ href, actual, nombre, icono, n = 0, etiqueta }) => (
  <a
    href={href}
    onClick={(e) => {
      if (href && !href.startsWith('http://') && !href.startsWith('https://')) {
        e.preventDefault();
        if (window.location.pathname !== href) {
          window.history.pushState({}, '', href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    }}
    aria-current={actual ? 'page' : undefined}
    aria-label={etiqueta}
    className={`group relative flex min-h-11 flex-1 items-center justify-center no-underline focus-visible:outline-none ${actual ? 'text-rd-navy' : 'text-rd-ink-2'}`}
  >
    <span aria-hidden="true" className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-rd-navy group-active:bg-rd-sunken ${actual ? 'bg-rd-navy-soft' : ''}`}>
      {icono}
    </span>
    <span className="sr-only">{nombre}</span>
    {n > 0 && <Contador n={n} className="absolute top-1 left-1/2 ml-1 h-4 min-w-4 px-1 text-rd-10 ring-2 ring-rd-surface" />}
  </a>
);

const FichaMas: React.FC<{ nombre: string; color: string; icono: React.ReactNode; onClick: () => void }> = ({ nombre, color, icono, onClick }) => (
  <button type="button" onClick={onClick} className="font-rd flex min-w-24 cursor-pointer flex-col items-center gap-2 rounded-rd-md p-2 text-rd-12-5 font-semibold whitespace-nowrap text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
    <span aria-hidden="true" className={`inline-flex h-rd-h-lg w-rd-h-lg items-center justify-center rounded-full text-white ${color}`}>
      {icono}
    </span>
    <span>{nombre}</span>
  </button>
);

/** El ☰ de la cabecera móvil (40; 44 con el dedo). */
export const BotonMenu: React.FC<{ onClick: () => void; abierto: boolean }> = ({ onClick, abierto }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Menú"
    aria-expanded={abierto}
    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-rd-md border border-rd-line bg-rd-surface text-rd-ink pointer-coarse:h-11 pointer-coarse:w-11 focus-visible:outline-2 focus-visible:outline-rd-navy lg:hidden"
  >
    <Menu aria-hidden="true" className="h-5 w-5" />
  </button>
);
