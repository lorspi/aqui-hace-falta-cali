import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronLeft, Hand, HeartHandshake, House, LogOut, MapPin, Menu, Plus, Users, X } from 'lucide-react';
import { Avatar, Contador } from './Etiqueta';

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
export type Seccion = 'panel' | 'radar' | 'directorio' | 'avisos' | 'perfil';

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
  pendientes?: number;
  avisosNuevos?: number;
  rutas: Record<Seccion | 'inicio' | 'salir', string>;
  onPedir?: () => void;
  onOfrecer?: () => void;
  /** El ☰ de la cabecera móvil se conecta aquí. */
  cajonAbierto?: boolean;
  onCerrarCajon?: () => void;
  children: React.ReactNode;
}

const ITEM = 'font-rd flex h-9.5 shrink-0 items-center gap-3 rounded-rd-lg px-3 text-rd-13-5 font-medium whitespace-nowrap text-rd-ink-2 no-underline hover:bg-rd-fondo hover:text-rd-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy';
const ITEM_ACTUAL = 'bg-rd-navy-soft font-semibold text-rd-navy hover:bg-rd-navy-soft hover:text-rd-navy';

export const Shell: React.FC<ShellProps> = ({ seccion, panelNombre, cuenta, pendientes = 0, avisosNuevos = 0, rutas, onPedir, onOfrecer, cajonAbierto = false, onCerrarCajon, children }) => {
  const [plegado, setPlegado] = useState(false);
  const [masAbierto, setMasAbierto] = useState(false);
  const masRef = useRef<HTMLDivElement>(null);

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

  const secciones: { id: Seccion; nombre: string; href: string; icono: React.ReactNode; n?: number }[] = [
    /* Radar primero: es la portada; luego el panel (con el nombre de la entidad) y el
       Directorio (Alejandro, 16 de septiembre de 2026). */
    { id: 'radar', nombre: 'Radar', href: rutas.radar, icono: <MapPin className="h-5 w-5" /> },
    { id: 'panel', nombre: panelNombre, href: rutas.panel, icono: <House className="h-5 w-5" />, n: pendientes },
    { id: 'directorio', nombre: 'Directorio', href: rutas.directorio, icono: <Users className="h-5 w-5" /> },
  ];

  const enlace = (s: (typeof secciones)[number], grande = false) => {
    const actual = s.id === seccion;
    return (
      <a
        key={s.id}
        href={s.href}
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
    <div className={`font-rd flex min-h-dvh gap-3 bg-rd-fondo p-3 lg:h-dvh lg:overflow-hidden text-rd-15 leading-relaxed tracking-rd-cuerpo text-rd-ink antialiased max-lg:block max-lg:gap-0 max-lg:bg-rd-surface max-lg:p-0 ${plegado ? 'is-plegado' : ''}`}>
      {/* ---- side nav (solo ≥ 1024) ---- */}
      <nav
        aria-label="Secciones"
        className={`flex h-full shrink-0 flex-col rounded-rd-md border border-rd-line bg-rd-surface py-4 transition-all duration-200 max-lg:hidden ${plegado ? 'w-16 px-2' : 'w-58 px-3'}`}
      >
        <div className={`flex shrink-0 flex-col gap-2 ${plegado ? 'items-center' : ''}`}>
          <button
            type="button"
            onClick={() => setPlegado((p) => !p)}
            aria-label={plegado ? 'Desplegar el menú' : 'Plegar el menú'}
            aria-expanded={!plegado}
            className={`inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-3 hover:bg-rd-fondo hover:text-rd-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy ${plegado ? 'self-center' : 'self-end'}`}
          >
            <ChevronLeft aria-hidden="true" className={`h-4.5 w-4.5 transition-transform duration-200 ${plegado ? 'rotate-180' : ''}`} />
          </button>
          {!plegado && (
            <a href={rutas.inicio} aria-label="RaDAR de ayuda · inicio" className="flex w-full items-center px-1 focus-visible:rounded-rd-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rd-navy">
              <img src="/logo-radar.svg" alt="" className="block h-9.5 w-auto" />
            </a>
          )}
        </div>
        <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto">
          {secciones.map((s) => (
            <li key={s.id}>{enlace(s)}</li>
          ))}
        </ul>
        <div className="mt-auto flex shrink-0 flex-col gap-1 border-t border-rd-line pt-2">
          <a href={rutas.perfil} aria-current={seccion === 'perfil' ? 'page' : undefined} className={`flex items-start gap-2 rounded-rd-lg p-2 text-rd-ink no-underline hover:bg-rd-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy ${plegado ? 'justify-center p-1' : ''}`}>
            <Avatar iniciales={cuenta.iniciales} tamano="md" />
            {!plegado && (
              <span className="flex min-w-0 flex-col">
                <b className="truncate text-rd-13 font-semibold">{cuenta.entidad}</b>
                <span className="truncate text-rd-11-5 text-rd-ink-meta">
                  {cuenta.persona} · {cuenta.rol}
                </span>
              </span>
            )}
          </a>
          <a href={rutas.salir} className={`${ITEM} h-9 text-rd-13 text-rd-ink-meta ${plegado ? 'justify-center px-0' : ''}`}>
            <LogOut aria-hidden="true" className="h-5 w-5 shrink-0 text-rd-ink-3" />
            <span className={plegado ? 'sr-only' : ''}>Cerrar sesión</span>
          </a>
        </div>
      </nav>

      {/* ---- contenido ---- */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-rd-xl border border-rd-line bg-rd-surface max-lg:min-h-dvh max-lg:overflow-visible max-lg:rounded-none max-lg:border-0 max-lg:pb-16">
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
        <TabItem href={rutas.panel} actual={seccion === 'panel'} nombre={panelNombre} icono={<House className="h-6 w-6" />} n={pendientes} etiqueta={`${panelNombre}, ${pendientes} pendientes`} />
      </nav>

      {/* ---- cajón lateral (solo < 1024) ---- */}
      {cajonAbierto && (
        <div className="fixed inset-0 z-900 lg:hidden">
          <button type="button" aria-label="Cerrar el menú" onClick={onCerrarCajon} className="absolute inset-0 cursor-default bg-rd-ink/40" />
          <div role="dialog" aria-modal="true" aria-label="Menú" className="absolute top-0 right-0 bottom-0 flex w-4/5 max-w-90 flex-col overflow-auto rounded-l-rd-md bg-rd-surface shadow-rd-2">
            <div className="flex min-h-16 items-center justify-between border-b border-rd-line px-4 py-3 sm:px-6">
              <a href={rutas.inicio} aria-label="RaDAR de ayuda · inicio">
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
                <a href={rutas.avisos} aria-current={seccion === 'avisos' ? 'page' : undefined} className={`${ITEM} h-13 rounded-rd-md text-rd-16 ${seccion === 'avisos' ? ITEM_ACTUAL : ''}`}>
                  <Bell aria-hidden="true" className="h-5.5 w-5.5 shrink-0 text-rd-ink-3" />
                  <span className="flex-1">Avisos</span>
                  {avisosNuevos > 0 && <Contador n={avisosNuevos} className="ml-auto" />}
                </a>
              </li>
            </ul>
            {/* La cuenta abajo, encima del divisor y de Cerrar sesión, sin fondo (Alejandro,
                16 de septiembre de 2026). */}
            <a href={rutas.perfil} aria-current={seccion === 'perfil' ? 'page' : undefined} className="mt-auto flex items-start gap-3 px-4 py-3 text-rd-ink no-underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy sm:px-6">
              <Avatar iniciales={cuenta.iniciales} tamano="lg" />
              <span className="flex min-w-0 flex-col">
                <b className="truncate text-rd-14 font-semibold">{cuenta.entidad}</b>
                <span className="truncate text-rd-12 text-rd-ink-meta">
                  {cuenta.persona} · {cuenta.rol}
                </span>
              </span>
            </a>
            <div className="border-t border-rd-line px-4 pt-3 pb-6 sm:px-6">
              <a href={rutas.salir} className={`${ITEM} h-12 text-rd-15 text-rd-ink-meta`}>
                <LogOut aria-hidden="true" className="h-5.5 w-5.5 shrink-0 text-rd-ink-3" />
                <span>Cerrar sesión</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TabItem: React.FC<{ href: string; actual: boolean; nombre: string; icono: React.ReactNode; n?: number; etiqueta?: string }> = ({ href, actual, nombre, icono, n = 0, etiqueta }) => (
  <a
    href={href}
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
