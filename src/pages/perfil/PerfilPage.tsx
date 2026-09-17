import React, { useEffect, useState } from 'react';
import { BadgeCheck, Hand, HeartHandshake, Monitor, Smartphone } from 'lucide-react';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { Button } from '../../components/ui/Button';
import { Caja, FilaDato } from '../../components/ui/Caja';
import { Dialogo } from '../../components/ui/Dialogo';
import { Avatar } from '../../components/ui/Etiqueta';
import { Field } from '../../components/ui/Field';
import { Pestanas } from '../../components/ui/Pestanas';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { Switch } from '../../components/ui/Switch';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { ORG, RECIBIDAS, SOLICITUDES } from '../../mocks/panelMock';
import { CANALES, SESIONES, YO } from '../../mocks/perfilMock';
import type { CanalAviso, Persona, PestanaPerfil, Sesion } from '../../types/perfil';
import { nombrePanel } from '../../utils/cuenta';
import { modulosGuardados, pendientesCuenta } from '../../utils/panel';
import { iniciales } from '../../utils/publicaciones';

/**
 * El Perfil (mockup/*): «Configuración y perfil» del prototipo (`perfil.html`), lo de la
 * persona con sesión. Cuatro pestañas: Tus datos (nombre, cargo, celular; se editan en la
 * misma caja), Acceso (correo, contraseña, sesiones abiertas), Notificaciones (por qué canal
 * llega cada aviso) y Seguridad (salir de la organización, cerrar sesión en todo, eliminar la
 * cuenta; cada una confirma en un diálogo cuyo primario dice el verbo). Los datos de la
 * organización viven en el panel, pestaña Datos: aquí solo se enlazan.
 */
const PESTANAS: { id: PestanaPerfil; nombre: string }[] = [
  { id: 'datos', nombre: 'Tus datos' },
  { id: 'acceso', nombre: 'Acceso' },
  { id: 'avisos', nombre: 'Notificaciones' },
  { id: 'seguridad', nombre: 'Seguridad' },
];

function irA(ruta: string): void {
  window.location.href = ruta;
}

function pestanaPedida(): PestanaPerfil {
  const t = window.location.hash.slice(1);
  return PESTANAS.some((p) => p.id === t) ? (t as PestanaPerfil) : 'datos';
}

export const PerfilPage: React.FC = () => (
  <AvisosProvider>
    <Perfil />
  </AvisosProvider>
);

const Perfil: React.FC = () => {
  const avisar = useAviso();
  const [actual, setActual] = useState<PestanaPerfil>(pestanaPedida);
  const [cajon, setCajon] = useState(false);
  const [yo, setYo] = useState<Persona>(YO);
  const [sesiones, setSesiones] = useState<Sesion[]>(SESIONES);
  const [canales, setCanales] = useState<CanalAviso[]>(CANALES);
  const [confirmando, setConfirmando] = useState<'salir' | 'eliminar' | null>(null);

  useEffect(() => {
    document.title = 'RaDAR · Perfil';
  }, []);

  const cambiarTab = (id: string) => {
    setActual(id as PestanaPerfil);
    window.history.replaceState(null, '', `#${id}`);
  };

  const cerrarSesion = (id: number) => {
    setSesiones((l) => l.filter((s) => s.id !== id));
    avisar('Sesión cerrada', { tipo: 'ok' });
  };
  /* Un aviso que pide hacer algo necesita al menos un canal fuera de RaDAR. */
  const cambiarCanal = (id: string, k: 'wa' | 'correo', v: boolean) => {
    const c = canales.find((x) => x.id === id);
    if (!c) return;
    const nuevo = { ...c, [k]: v };
    if (c.fijo && !nuevo.wa && !nuevo.correo) {
      avisar('Este aviso te pide hacer algo: deja WhatsApp o correo encendido', { tipo: 'error' });
      return;
    }
    setCanales((l) => l.map((x) => (x.id === id ? nuevo : x)));
    avisar('Preferencia guardada', { tipo: 'ok' });
  };

  return (
    <Shell seccion="perfil" panelNombre={nombrePanel()} cuenta={CUENTA} pendientes={pendientesCuenta(modulosGuardados(), { sol: SOLICITUDES, recibidas: RECIBIDAS })} rutas={RUTAS_SHELL} onPedir={() => irA(RUTAS.pedir)} onOfrecer={() => irA(RUTAS.ofrecer)} cajonAbierto={cajon} onCerrarCajon={() => setCajon(false)}>
      <div className="flex h-full min-h-0 flex-col max-lg:min-h-dvh">
        <header className="flex flex-none flex-wrap items-center gap-3 border-b border-rd-line px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="font-rd m-0 text-rd-22 leading-tight font-semibold tracking-rd-titulo text-rd-ink">Configuración y perfil</h1>
          <span className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 lg:flex">
              <Button nivel="pedir" tamano="md" icono={<Hand className="h-4 w-4" />} onClick={() => irA(RUTAS.pedir)}>
                Pedir ayuda
              </Button>
              <Button nivel="primario" tamano="md" icono={<HeartHandshake className="h-4 w-4" />} onClick={() => irA(RUTAS.ofrecer)}>
                Ofrecer ayuda
              </Button>
            </span>
            <BotonMenu onClick={() => setCajon(true)} abierto={cajon} />
          </span>
        </header>
        <div className="min-w-0 flex-none px-4 sm:px-6 lg:px-8">
          <Pestanas etiqueta="Pestañas del perfil" pestanas={PESTANAS} actual={actual} onCambiar={cambiarTab} />
        </div>

        <main id={`panel-${actual}`} role="tabpanel" aria-labelledby={`pestana-${actual}`} className="min-h-0 flex-1 overflow-y-auto bg-rd-fondo px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {/* quién: la cabecera del perfil, en todas las pestañas */}
            <section aria-label="Resumen del perfil" className="flex flex-wrap items-start gap-3 rounded-rd-lg border border-rd-line bg-rd-surface p-4">
              <Avatar iniciales={iniciales(yo.nombre)} tamano="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="font-rd m-0 text-rd-16 leading-snug font-semibold tracking-rd-titulo text-rd-ink">{yo.nombre}</h2>
                <p className="m-0 text-rd-12-5 text-rd-ink-2">{yo.cargo}</p>
                <p className="m-0 mt-1.5 flex flex-wrap items-center gap-x-1.5 text-rd-12-5 text-rd-ink-2">
                  {ORG.verificacion === 'verificada' && <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5 text-rd-navy" />}
                  <b className="font-semibold text-rd-ink">{ORG.nombre}</b>
                  <span className="text-rd-ink-meta">En RaDAR desde {yo.desde}</span>
                </p>
              </div>
              <Button nivel="secundario" tamano="md" className="max-sm:basis-full" onClick={() => irA(`${RUTAS.miOrganizacion}#datos`)}>
                Ver la organización
              </Button>
            </section>

            {actual === 'datos' && <TusDatos yo={yo} onGuardar={(p) => { setYo(p); avisar('Datos guardados', { tipo: 'ok' }); }} />}
            {actual === 'acceso' && (
              <>
                <Caja titulo="Correo y contraseña">
                  <FilaDato rotulo="Correo de ingreso" nota="Con él entras y a él llegan las confirmaciones" accion={<Button nivel="secundario" tamano="sm" onClick={() => avisar('Te enviamos un enlace de confirmación al correo', { tipo: 'ok' })}>Cambiar</Button>}>
                    {yo.correo}
                  </FilaDato>
                  <FilaDato rotulo="Contraseña" nota="Protegida con cifrado" accion={<Button nivel="secundario" tamano="sm" onClick={() => avisar('Te enviamos un enlace para restablecerla', { tipo: 'ok' })}>Cambiar</Button>}>
                    ••••••••••
                  </FilaDato>
                </Caja>
                <Caja titulo="Sesiones abiertas">
                  {sesiones.map((s, i) => (
                    <div key={s.id} className={`flex items-start gap-3 py-3 ${i ? 'border-t border-rd-line-soft' : 'pt-0'} last:pb-0`}>
                      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rd-sunken text-rd-ink-2">{s.dispositivo.startsWith('Celular') ? <Smartphone className="h-4.5 w-4.5" /> : <Monitor className="h-4.5 w-4.5" />}</span>
                      <div className="min-w-0 flex-1">
                        <b className="block text-rd-13-5 font-semibold text-rd-ink">{s.dispositivo}</b>
                        <span className="text-rd-12-5 text-rd-ink-2">{s.actual ? 'Esta sesión' : s.cuando}</span>
                      </div>
                      {!s.actual && (
                        <Button nivel="terciario" tamano="sm" onClick={() => cerrarSesion(s.id)}>
                          Cerrar
                        </Button>
                      )}
                    </div>
                  ))}
                </Caja>
              </>
            )}
            {actual === 'avisos' && <Notificaciones canales={canales} onCambiar={cambiarCanal} />}
            {actual === 'seguridad' && (
              <Caja titulo="Seguridad y cuenta">
                <FilaDato rotulo="Salir de la organización" nota="Dejas de administrar sus solicitudes y entregas. Otra persona debe quedar como administradora." accion={<Button nivel="secundario" tamano="sm" onClick={() => setConfirmando('salir')}>Salir</Button>}>
                  {ORG.nombre}
                </FilaDato>
                <FilaDato rotulo="Cerrar sesión en todos los equipos" nota="Cierra la sesión en navegadores y celulares. Podrás ingresar de nuevo con tu correo." accion={<Button nivel="secundario" tamano="sm" onClick={() => { setSesiones((l) => l.filter((s) => s.actual)); avisar('Sesiones cerradas en todos los dispositivos', { tipo: 'ok' }); }}>Cerrar en todo</Button>}>
                  {sesiones.length} {sesiones.length === 1 ? 'sesión abierta' : 'sesiones abiertas'}
                </FilaDato>
                <FilaDato rotulo="Eliminar tu cuenta" nota="Se borran tus datos personales. El histórico de la organización y las actas se conservan." accion={<Button nivel="secundario" tamano="sm" onClick={() => setConfirmando('eliminar')}>Eliminar la cuenta</Button>}>
                  {yo.correo}
                </FilaDato>
              </Caja>
            )}
          </div>
        </main>

        <Dialogo
          abierto={confirmando !== null}
          titulo={confirmando === 'salir' ? `¿Sales de ${ORG.nombre}?` : '¿Eliminas tu cuenta?'}
          accion={confirmando === 'salir' ? 'Salir de la organización' : 'Eliminar la cuenta'}
          nivelAccion="secundario"
          textoCancelar="Dejar como está"
          onCerrar={() => setConfirmando(null)}
          onEnviar={() => {
            const que = confirmando;
            setConfirmando(null);
            avisar(que === 'salir' ? 'Saliste de la organización' : 'Cuenta eliminada', { tipo: 'ok' });
          }}
        >
          <p className="m-0 mb-4 text-rd-14 text-rd-ink-2">{confirmando === 'salir' ? 'Dejas de administrar sus solicitudes y entregas. Otra persona de tu equipo debe quedar como administradora.' : 'Se borran tus datos personales. El histórico de la organización y las actas emitidas se conservan.'}</p>
        </Dialogo>
      </div>
    </Shell>
  );
};

/* ---------- Tus datos: ver y editar en la misma caja ---------- */

const TusDatos: React.FC<{ yo: Persona; onGuardar: (p: Persona) => void }> = ({ yo, onGuardar }) => {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState<Persona>(yo);
  const empezar = () => {
    setBorrador(yo);
    setEditando(true);
  };
  const guardar = () => {
    onGuardar(borrador);
    setEditando(false);
  };
  return (
    <Caja
      titulo="Tus datos"
      accion={
        editando ? (
          <>
            <Button nivel="terciario" tamano="md" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
            <Button nivel="primario" tamano="md" onClick={guardar}>
              Guardar
            </Button>
          </>
        ) : (
          <Button nivel="secundario" tamano="md" onClick={empezar}>
            Editar
          </Button>
        )
      }
    >
      {editando ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="perfil-nombre" etiqueta="Nombre y apellidos" valor={borrador.nombre} onChange={(v) => setBorrador({ ...borrador, nombre: v })} autoComplete="name" />
          <Field id="perfil-cargo" etiqueta="Cargo" opcional valor={borrador.cargo} onChange={(v) => setBorrador({ ...borrador, cargo: v })} />
          <Field id="perfil-tel" etiqueta="Celular" tipo="tel" valor={borrador.tel} onChange={(v) => setBorrador({ ...borrador, tel: v })} autoComplete="tel" inputMode="tel" />
          <Field id="perfil-wa" etiqueta="Este número también es WhatsApp" tipo="checkbox" marcado={borrador.mismoWa} onChangeMarcado={(m) => setBorrador({ ...borrador, mismoWa: m })} />
          {!borrador.mismoWa && <Field id="perfil-wa-num" etiqueta="WhatsApp" tipo="tel" valor={borrador.wa} onChange={(v) => setBorrador({ ...borrador, wa: v })} inputMode="tel" />}
        </div>
      ) : (
        <>
          <FilaDato rotulo="Nombre">{yo.nombre}</FilaDato>
          <FilaDato rotulo="Cargo">{yo.cargo || <span className="text-rd-ink-meta">Sin cargo</span>}</FilaDato>
          <FilaDato rotulo="Celular" nota={yo.mismoWa ? 'También WhatsApp' : `WhatsApp: ${yo.wa || 'sin registrar'}`}>
            {yo.tel}
          </FilaDato>
          <FilaDato rotulo="País" nota="Define los formatos de fecha, hora y teléfono">
            {yo.pais}
          </FilaDato>
        </>
      )}
    </Caja>
  );
};

/* ---------- Notificaciones: por qué canal llega cada aviso ---------- */

const Notificaciones: React.FC<{ canales: CanalAviso[]; onCambiar: (id: string, k: 'wa' | 'correo', v: boolean) => void }> = ({ canales, onCambiar }) => (
  <Caja titulo="Canales de notificación">
    <p className="m-0 mb-3 text-rd-12-5 text-rd-ink-2">En RaDAR llegan siempre. Elige cuáles quieres además por WhatsApp o por correo.</p>
    <div className="hidden grid-cols-12 gap-3 border-b border-rd-line pb-2 text-rd-11-5 font-semibold tracking-wider text-rd-ink-meta uppercase sm:grid">
      <span className="col-span-8">Aviso</span>
      <span className="col-span-2 text-center">WhatsApp</span>
      <span className="col-span-2 text-center">Correo</span>
    </div>
    {canales.map((c) => (
      <div key={c.id} className="grid grid-cols-2 items-center gap-x-3 gap-y-2 border-b border-rd-line-soft py-3 last:border-b-0 last:pb-0 sm:grid-cols-12">
        <div className="col-span-2 min-w-0 sm:col-span-8">
          <b className="block text-rd-13-5 font-semibold text-rd-ink">{c.titulo}</b>
          <span className="text-rd-12-5 text-rd-ink-2">{c.detalle}</span>
        </div>
        {(['wa', 'correo'] as const).map((k) => (
          <label key={k} className="flex cursor-pointer items-center gap-2 text-rd-12-5 text-rd-ink-2 sm:col-span-2 sm:justify-center">
            <Switch encendido={c[k]} onCambiar={(v) => onCambiar(c.id, k, v)} etiqueta={`${k === 'wa' ? 'WhatsApp' : 'Correo'}: ${c.titulo}`} />
            <span className="sm:hidden">{k === 'wa' ? 'WhatsApp' : 'Correo'}</span>
          </label>
        ))}
      </div>
    ))}
  </Caja>
);
