import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Clock, Hand, HeartHandshake, Monitor, Smartphone, ShieldCheck, User, Building, Users } from 'lucide-react';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { Button } from '../../components/ui/Button';
import { Caja, FilaDato } from '../../components/ui/Caja';
import { Dialogo } from '../../components/ui/Dialogo';
import { Avatar, EtiquetaCiclo } from '../../components/ui/Etiqueta';
import { Field } from '../../components/ui/Field';
import { Pestanas } from '../../components/ui/Pestanas';
import { BotonMenu, Cuenta, Shell } from '../../components/ui/Shell';
import { FilaSwitch, Switch } from '../../components/ui/Switch';
import { InlineNotice } from '../../components/ui/InlineNotice';
import { RUTAS, RUTAS_SHELL, TIPOS_DOC } from '../../mocks/cuentasMock';
import { INVITADOS, ORG, RECIBIDAS, SOLICITUDES } from '../../mocks/panelMock';
import { CANALES } from '../../mocks/perfilMock';
import type { CanalAviso, Persona, PestanaPerfil, Sesion } from '../../types/perfil';
import type { DatosOrg, Invitado } from '../../types/panel';
import { entidadActual, guardarVerificacion, nombrePanel } from '../../utils/cuenta';
import { modulosGuardados, pendientesCuenta } from '../../utils/panel';
import { iniciales } from '../../utils/publicaciones';
import { supabase } from '../../lib/supabaseClient';
import { fetchUserProfile, updateUserProfile, fetchOrganizationByUserId } from '../../lib/supabaseService';
import { DocumentosVerificacionSection } from '../../components/perfil/DocumentosVerificacionSection';

export interface PersonaExt extends Persona {
  ciudad?: string;
  departamento?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  tipoPerfil?: 'organizacion' | 'lider' | 'voluntario';
  tipoComunidad?: string;
  disponibilidad?: string;
  habilidades?: string;
}

const PESTANAS: { id: PestanaPerfil; nombre: string }[] = [
  { id: 'datos', nombre: 'Tus datos' },
  { id: 'acceso', nombre: 'Acceso' },
  { id: 'avisos', nombre: 'Notificaciones' },
  { id: 'seguridad', nombre: 'Seguridad' },
];

function irA(ruta: string): void {
  if (!ruta || ruta === '#') return;
  if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
    window.location.href = ruta;
    return;
  }
  if (window.location.pathname !== ruta) {
    window.history.pushState({}, '', ruta);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
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
  const [yo, setYo] = useState<PersonaExt>({
    nombre: 'Cargando...',
    cargo: 'Usuario',
    tel: 'Sin teléfono',
    correo: '',
    pais: 'Colombia',
    ciudad: 'Cali',
    departamento: 'Valle del Cauca',
    tipoDocumento: 'Cédula de ciudadanía',
    numeroDocumento: '',
    tipoPerfil: 'voluntario',
    desde: 'recientemente',
    wa: '',
    mismoWa: true,
  });
  const [hasOrg, setHasOrg] = useState(false);
  const [orgData, setOrgData] = useState<DatosOrg | null>(null);
  const [canales, setCanales] = useState<CanalAviso[]>(() => {
    const saved = localStorage.getItem('ahf_user_notification_channels');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return CANALES;
  });
  const [confirmando, setConfirmando] = useState<'salir' | 'eliminar' | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Perfil, RaDAR de ayuda';
    async function loadProfile() {
      try {
        let user: any = null;
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          user = authData.user;
        } else {
          const saved = localStorage.getItem('ahf_auth_user') || localStorage.getItem('ahf_admin_user');
          if (saved) {
            try { user = JSON.parse(saved); } catch {}
          }
        }

        if (user) {
          setDbUserId(user.id);
          const profile = await fetchUserProfile(user.id);
          const org = await fetchOrganizationByUserId(user.id);

          const fullName = profile?.full_name ||
            (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : null) ||
            user.name ||
            user.user_metadata?.full_name ||
            user.email ||
            'Usuario';

          const rawType = (profile?.profile_type || profile?.role || user.user_metadata?.profile_type || user.user_metadata?.role || 'voluntario').toLowerCase();
          let tipoPerfil: 'organizacion' | 'lider' | 'voluntario' = 'voluntario';
          if (rawType.includes('lider') || rawType.includes('comunidad') || rawType.includes('junta')) {
            tipoPerfil = 'lider';
          } else if (rawType.includes('organizacion') || rawType.includes('profesional') || rawType.includes('ong') || org) {
            tipoPerfil = 'organizacion';
          }

          const cargoDefault = tipoPerfil === 'organizacion' 
            ? 'Representante de Organización' 
            : tipoPerfil === 'lider' 
              ? 'Líder Comunitario' 
              : 'Voluntario / Ciudadano';

          const cargo = profile?.cargo || cargoDefault;

          const tel = profile?.phone ||
            profile?.whatsapp ||
            profile?.phone_number ||
            user.phone ||
            'Sin teléfono registrado';

          const correo = profile?.email || user.email || '';
          const pais = profile?.country || 'Colombia';
          const ciudad = profile?.city || 'Cali';
          const departamento = profile?.department || 'Valle del Cauca';
          const tipoDocumento = profile?.document_type || 'Cédula de ciudadanía';
          const numeroDocumento = profile?.document_number || '';
          const tipoComunidad = profile?.community_type || 'Junta de Acción Comunal';

          const desde = profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
            : 'recientemente';

          setYo({
            nombre: fullName,
            cargo,
            tel,
            correo,
            pais,
            ciudad,
            departamento,
            tipoDocumento,
            numeroDocumento,
            tipoPerfil,
            tipoComunidad,
            desde,
            wa: tel,
            mismoWa: true,
          });

          if (org) {
            setHasOrg(true);
            setOrgData({
              nombre: org.org_name || 'Mi Organización',
              tipo: org.organization_type || (tipoPerfil === 'lider' ? 'Comunidad' : 'Organización'),
              nit: org.document_number || 'No especificado',
              dir: org.address || `${ciudad}, ${departamento}`,
              contacto: {
                tel: org.contact_phone || org.contact_whatsapp || tel,
                wa: Boolean(org.contact_whatsapp),
                correo: org.contact_email || correo,
              },
              enlace: org.website_or_social || 'No especificado',
              web: org.website_or_social || 'No especificado',
              verificacion: org.is_verified ? 'verificada' : 'sin',
              directorio: true,
              directorioDesde: org.created_at ? new Date(org.created_at).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }) : 'recientemente',
              canalesRevisados: true,
            });
          } else if (profile?.organization_name || user.user_metadata?.org_name) {
            const orgName = profile?.organization_name || user.user_metadata?.org_name;
            setHasOrg(true);
            setOrgData({
              nombre: orgName,
              tipo: tipoPerfil === 'lider' ? 'Comunidad' : 'Organización',
              nit: 'No especificado',
              dir: `${ciudad}, ${departamento}`,
              contacto: { tel, wa: true, correo },
              enlace: 'No especificado',
              web: 'No especificado',
              verificacion: 'sin',
              directorio: true,
              directorioDesde: 'recientemente',
              canalesRevisados: true,
            });
          } else {
            setHasOrg(tipoPerfil !== 'voluntario');
            setOrgData(null);
          }
        }
      } catch (err) {
        console.warn('Error al cargar datos del usuario:', err);
      }
    }
    loadProfile();
  }, []);

  const cuentaUsuario: Cuenta = useMemo(() => {
    return {
      entidad: orgData?.nombre || yo.nombre || 'Mi Cuenta',
      persona: yo.nombre || 'Usuario',
      rol: yo.cargo || 'Miembro',
      iniciales: iniciales(yo.nombre || 'U'),
    };
  }, [orgData, yo]);

  const cambiarTab = (id: string) => {
    setActual(id as PestanaPerfil);
    window.history.replaceState(null, '', `#${id}`);
  };

  const cambiarCanal = (id: string, k: 'wa' | 'correo', v: boolean) => {
    const c = canales.find((x) => x.id === id);
    if (!c) return;
    const nuevo = { ...c, [k]: v };
    if (c.fijo && !nuevo.wa && !nuevo.correo) {
      avisar('Deja encendido WhatsApp o correo', { tipo: 'error' });
      return;
    }
    const actualizados = canales.map((x) => (x.id === id ? nuevo : x));
    setCanales(actualizados);
    localStorage.setItem('ahf_user_notification_channels', JSON.stringify(actualizados));
    avisar('Preferencia de notificación guardada', { tipo: 'ok' });
  };

  return (
    <Shell seccion="perfil" panelNombre={nombrePanel()} cuenta={cuentaUsuario} pendientes={pendientesCuenta(modulosGuardados(), { sol: SOLICITUDES, recibidas: RECIBIDAS })} rutas={RUTAS_SHELL} onPedir={() => irA(RUTAS.pedir)} onOfrecer={() => irA(RUTAS.ofrecer)} cajonAbierto={cajon} onCerrarCajon={() => setCajon(false)}>
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
        <Pestanas etiqueta="Pestañas del perfil" pestanas={PESTANAS} actual={actual} onCambiar={cambiarTab} className="px-4 sm:px-6 lg:px-8" />

        <main id={`panel-${actual}`} role="tabpanel" aria-labelledby={`pestana-${actual}`} className="min-h-0 flex-1 overflow-y-auto bg-rd-surface px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {/* quién: la cabecera del perfil */}
            <section aria-label="Resumen del perfil" className="flex flex-wrap items-start gap-3 rounded-rd-lg border border-rd-line bg-rd-surface p-4">
              <Avatar iniciales={iniciales(yo.nombre)} tamano="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-rd m-0 text-rd-15 leading-snug font-semibold tracking-rd-titulo text-rd-ink">{yo.nombre}</h2>
                  {yo.tipoPerfil === 'organizacion' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-rd-11 font-semibold text-blue-800 border border-blue-200">
                      <Building className="h-3 w-3" /> Organización
                    </span>
                  )}
                  {yo.tipoPerfil === 'lider' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-rd-11 font-semibold text-amber-800 border border-amber-200">
                      <Users className="h-3 w-3" /> Líder Comunitario
                    </span>
                  )}
                  {yo.tipoPerfil === 'voluntario' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-rd-11 font-semibold text-emerald-800 border border-emerald-200">
                      <User className="h-3 w-3" /> Voluntario Natural
                    </span>
                  )}
                </div>
                <p className="m-0 text-rd-13-5 text-rd-ink-2">{yo.cargo}</p>
                <p className="m-0 mt-1.5 flex flex-wrap items-center gap-x-1.5 text-rd-12-5 text-rd-ink-2">
                  {hasOrg && orgData?.verificacion === 'verificada' && <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5 text-rd-navy" />}
                  <b className="font-semibold text-rd-ink">
                    {hasOrg ? (orgData?.nombre || 'Mi Organización') : `${yo.ciudad || 'Cali'}, ${yo.departamento || 'Valle del Cauca'}`}
                  </b>
                  <span className="text-rd-ink-meta">En RaDAR desde {yo.desde}</span>
                </p>
              </div>
              {(hasOrg || yo.tipoPerfil !== 'voluntario') && (
                <Button nivel="secundario" tamano="md" className="max-sm:basis-full" onClick={() => irA(RUTAS.miOrganizacion)}>
                  Ir al panel
                </Button>
              )}
            </section>

            {actual === 'datos' && (
              <>
                <TusDatos yo={yo} dbUserId={dbUserId} onGuardar={(p) => { setYo(p); avisar('Datos de perfil actualizados en Supabase', { tipo: 'ok' }); }} />
                <DocumentosVerificacionSection yo={yo} dbUserId={dbUserId} orgData={orgData} />
                {yo.tipoPerfil === 'organizacion' && (
                  <DatosOrganizacion orgInicial={orgData} dbUserId={dbUserId} onGuardarOrg={(updated) => setOrgData(updated)} />
                )}
                {yo.tipoPerfil === 'lider' && (
                  <DatosComunidad orgInicial={orgData} dbUserId={dbUserId} onGuardarOrg={(updated) => setOrgData(updated)} />
                )}
                {yo.tipoPerfil === 'voluntario' && (
                  <DatosVoluntario yo={yo} dbUserId={dbUserId} onGuardarVoluntario={(updated) => setYo(updated)} />
                )}
              </>
            )}

            {actual === 'acceso' && (
              <>
                <Caja titulo="Correo y contraseña">
                  <FilaDato rotulo="Correo de ingreso" nota="Con él entras a la plataforma" accion={<span className="text-rd-12 text-emerald-700 font-semibold">🟢 Autenticado</span>}>
                    {yo.correo}
                  </FilaDato>
                  <FilaDato rotulo="Contraseña" nota="Protegida con Supabase Auth" accion={<Button nivel="secundario" tamano="sm" onClick={async () => {
                    try {
                      await supabase.auth.resetPasswordForEmail(yo.correo);
                      avisar('Te enviamos un enlace para restablecer tu contraseña a tu correo', { tipo: 'ok' });
                    } catch {
                      avisar('Error enviando enlace de restablecimiento', { tipo: 'error' });
                    }
                  }}>Cambiar contraseña</Button>}>
                    ••••••••••
                  </FilaDato>
                </Caja>
                <Caja titulo="Sesión activa">
                  <div className="flex items-start gap-3 py-2">
                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rd-sunken text-rd-ink-2">
                      <Monitor className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block text-rd-13-5 font-semibold text-rd-ink">Navegador actual ({navigator.userAgent.includes('Mac') ? 'macOS' : 'Windows / Móvil'})</b>
                      <span className="text-rd-12-5 text-rd-ink-2">Sesión iniciada con Supabase Auth</span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-rd-11 font-semibold text-emerald-800 border border-emerald-200">
                      Activa ahora
                    </span>
                  </div>
                </Caja>
              </>
            )}

            {actual === 'avisos' && <Notificaciones canales={canales} onCambiar={cambiarCanal} />}

            {actual === 'seguridad' && (
              <Caja titulo="Seguridad y cuenta">
                {hasOrg && (
                  <FilaDato rotulo="Salir de la organización" nota="Dejas de administrar sus solicitudes y entregas." accion={<Button nivel="secundario" tamano="sm" onClick={() => setConfirmando('salir')}>Salir</Button>}>
                    {orgData?.nombre || 'Mi Organización'}
                  </FilaDato>
                )}
                <FilaDato rotulo="Cerrar sesión" nota="Cierra la sesión activa en este dispositivo." accion={<Button nivel="secundario" tamano="sm" onClick={async () => {
                  await supabase.auth.signOut();
                  localStorage.clear();
                  window.location.href = '/';
                }}>Cerrar sesión</Button>}>
                  {yo.correo}
                </FilaDato>
                <FilaDato rotulo="Eliminar tu cuenta" nota="Se borran tus datos personales." accion={<Button nivel="secundario" tamano="sm" onClick={() => setConfirmando('eliminar')}>Eliminar la cuenta</Button>}>
                  {yo.correo}
                </FilaDato>
              </Caja>
            )}
          </div>
        </main>

        <Dialogo
          abierto={confirmando !== null}
          titulo={confirmando === 'salir' ? `¿Sales de ${orgData?.nombre || 'la organización'}?` : '¿Eliminas tu cuenta?'}
          accion={confirmando === 'salir' ? 'Salir de la organización' : 'Eliminar la cuenta'}
          nivelAccion="secundario"
          textoAlterno="Dejar como está"
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

const TusDatos: React.FC<{ yo: PersonaExt; dbUserId?: string | null; onGuardar: (p: PersonaExt) => void }> = ({ yo, dbUserId, onGuardar }) => {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState<PersonaExt>(yo);

  useEffect(() => {
    setBorrador(yo);
  }, [yo]);

  const empezar = () => {
    setBorrador(yo);
    setEditando(true);
  };

  const guardar = async () => {
    onGuardar(borrador);
    if (dbUserId) {
      try {
        await updateUserProfile(dbUserId, {
          fullName: borrador.nombre,
          phone: borrador.tel,
          cargo: borrador.cargo,
          city: borrador.ciudad,
          department: borrador.departamento,
          country: borrador.pais,
          documentType: borrador.tipoDocumento,
          documentNumber: borrador.numeroDocumento,
        });
      } catch (err) {
        console.error('Error guardando perfil en Supabase:', err);
      }
    }
    setEditando(false);
  };

  return (
    <Caja
      titulo="Tus datos personales"
      accion={
        editando ? (
          <div className="flex items-center gap-2">
            <Button nivel="terciario" tamano="md" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
            <Button nivel="primario" tamano="md" onClick={guardar}>
              Guardar
            </Button>
          </div>
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
          <Field id="perfil-cargo" etiqueta="Cargo / Rol" valor={borrador.cargo} onChange={(v) => setBorrador({ ...borrador, cargo: v })} />
          <Field id="perfil-tel" etiqueta="Celular" tipo="tel" valor={borrador.tel} onChange={(v) => setBorrador({ ...borrador, tel: v, wa: v, mismoWa: true })} autoComplete="tel" inputMode="tel" />
          <Field id="perfil-tipodoc" etiqueta="Tipo de documento" tipo="select" valor={borrador.tipoDocumento || 'Cédula de ciudadanía'} onChange={(v) => setBorrador({ ...borrador, tipoDocumento: v })} opciones={TIPOS_DOC} />
          <Field id="perfil-numdoc" etiqueta="Número de documento" valor={borrador.numeroDocumento || ''} onChange={(v) => setBorrador({ ...borrador, numeroDocumento: v })} />
          <Field id="perfil-ciudad" etiqueta="Ciudad" valor={borrador.ciudad || 'Cali'} onChange={(v) => setBorrador({ ...borrador, ciudad: v })} />
          <Field id="perfil-depto" etiqueta="Departamento" valor={borrador.departamento || 'Valle del Cauca'} onChange={(v) => setBorrador({ ...borrador, departamento: v })} />
          <Field id="perfil-pais" etiqueta="País" valor={borrador.pais || 'Colombia'} onChange={(v) => setBorrador({ ...borrador, pais: v })} />
        </div>
      ) : (
        <>
          <FilaDato rotulo="Nombre">{yo.nombre}</FilaDato>
          <FilaDato rotulo="Cargo / Rol">{yo.cargo || <span className="text-rd-ink-meta">Sin cargo</span>}</FilaDato>
          <FilaDato rotulo="Celular">{yo.tel}</FilaDato>
          {yo.numeroDocumento && <FilaDato rotulo="Documento">{`${yo.tipoDocumento || 'Documento'}: ${yo.numeroDocumento}`}</FilaDato>}
          <FilaDato rotulo="Ubicación">{`${yo.ciudad || 'Cali'}, ${yo.departamento || 'Valle del Cauca'}, ${yo.pais || 'Colombia'}`}</FilaDato>
        </>
      )}
    </Caja>
  );
};

/* ---------- Notificaciones ---------- */

const Notificaciones: React.FC<{ canales: CanalAviso[]; onCambiar: (id: string, k: 'wa' | 'correo', v: boolean) => void }> = ({ canales, onCambiar }) => (
  <Caja titulo="Canales de notificación">
    <p className="m-0 mb-3 text-rd-12-5 text-rd-ink-2">En RaDAR se muestran siempre. Elige por cuál medio deseas recibirlas además.</p>
    <div className="hidden grid-cols-12 gap-3 border-b border-rd-line pb-2 text-rd-13 font-semibold text-rd-ink sm:grid">
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

/* ---------- Datos de la Organización ---------- */

const DatosOrganizacion: React.FC<{
  orgInicial?: DatosOrg | null;
  dbUserId?: string | null;
  onGuardarOrg?: (org: DatosOrg) => void;
}> = ({ orgInicial, dbUserId, onGuardarOrg }) => {
  const avisar = useAviso();
  const [org, setOrg] = useState<DatosOrg>(orgInicial || ORG);
  const [directorio, setDirectorio] = useState(orgInicial?.directorio ?? ORG.directorio);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState<DatosOrg>(orgInicial || ORG);

  useEffect(() => {
    if (orgInicial) {
      setOrg(orgInicial);
      setBorrador(orgInicial);
      setDirectorio(orgInicial.directorio);
    }
  }, [orgInicial]);

  const empezar = () => {
    setBorrador(org);
    setEditando(true);
  };

  const guardar = async () => {
    setOrg(borrador);
    onGuardarOrg?.(borrador);
    setEditando(false);

    if (dbUserId) {
      try {
        await supabase.from('organizations').upsert({
          user_id: dbUserId,
          org_name: borrador.nombre,
          organization_type: borrador.tipo,
          document_number: borrador.nit,
          address: borrador.dir,
          contact_phone: borrador.contacto.tel,
          contact_email: borrador.contacto.correo,
          website_or_social: borrador.web || borrador.enlace,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        avisar('Datos de la organización guardados en Supabase', { tipo: 'ok' });
      } catch (err) {
        console.error('Error guardando organización en Supabase:', err);
        avisar('Datos de la organización guardados', { tipo: 'ok' });
      }
    } else {
      avisar('Datos de la organización guardados', { tipo: 'ok' });
    }
  };

  return (
    <Caja
      titulo={`Datos de ${org.nombre}`}
      accion={
        editando ? (
          <div className="flex items-center gap-2">
            <Button nivel="primario" tamano="md" onClick={guardar}>
              Guardar
            </Button>
            <Button nivel="terciario" tamano="md" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button nivel="secundario" tamano="md" onClick={empezar}>
            Editar
          </Button>
        )
      }
    >
      {editando ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="org-nombre" etiqueta="Nombre de la entidad" valor={borrador.nombre} onChange={(v) => setBorrador({ ...borrador, nombre: v })} requerido />
          <Field id="org-tipo" etiqueta="Tipo de entidad" valor={borrador.tipo} onChange={(v) => setBorrador({ ...borrador, tipo: v })} />
          <Field id="org-nit" etiqueta="NIT / Registro" valor={borrador.nit} onChange={(v) => setBorrador({ ...borrador, nit: v })} />
          <Field id="org-dir" etiqueta="Dirección" valor={borrador.dir} onChange={(v) => setBorrador({ ...borrador, dir: v })} />
          <Field id="org-tel" etiqueta="Teléfono público" tipo="tel" valor={borrador.contacto.tel} onChange={(v) => setBorrador({ ...borrador, contacto: { ...borrador.contacto, tel: v } })} />
          <Field id="org-correo" etiqueta="Correo público" tipo="email" valor={borrador.contacto.correo} onChange={(v) => setBorrador({ ...borrador, contacto: { ...borrador.contacto, correo: v } })} />
          <Field id="org-web" etiqueta="Sitio web o redes" valor={borrador.web} onChange={(v) => setBorrador({ ...borrador, web: v })} />
        </div>
      ) : (
        <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-3">
          {[
            ['Nombre', org.nombre],
            ['Tipo', org.tipo],
            ['NIT / Registro', org.nit],
            ['Dirección', org.dir],
            ['Contacto público', `${org.contacto.tel}, ${org.contacto.correo}`],
            ['Web / Redes', org.web],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-rd-11-5 font-medium text-rd-ink-meta">{k}</dt>
              <dd className="m-0 text-rd-13-5 text-rd-ink wrap-anywhere">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </Caja>
  );
};

/* ---------- Datos de la Comunidad (Perfil Líder) ---------- */

const DatosComunidad: React.FC<{
  orgInicial?: DatosOrg | null;
  dbUserId?: string | null;
  onGuardarOrg?: (org: DatosOrg) => void;
}> = ({ orgInicial, dbUserId, onGuardarOrg }) => {
  const avisar = useAviso();
  const [com, setCom] = useState<DatosOrg>(
    orgInicial || {
      nombre: 'Comunidad / Sector',
      tipo: 'Junta de Acción Comunitaria',
      nit: 'No especificado',
      dir: 'Cali, Valle del Cauca',
      contacto: { tel: '', wa: true, correo: '' },
      enlace: 'Representante Comunitario',
      web: 'No especificado',
      verificacion: 'sin',
      directorio: true,
      directorioDesde: 'recientemente',
      canalesRevisados: true,
    }
  );
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState<DatosOrg>(com);

  useEffect(() => {
    if (orgInicial) {
      setCom(orgInicial);
      setBorrador(orgInicial);
    }
  }, [orgInicial]);

  const guardar = async () => {
    setCom(borrador);
    onGuardarOrg?.(borrador);
    setEditando(false);

    if (dbUserId) {
      try {
        await supabase.from('organizations').upsert({
          user_id: dbUserId,
          org_name: borrador.nombre,
          organization_type: borrador.tipo,
          document_number: borrador.nit,
          address: borrador.dir,
          contact_phone: borrador.contacto.tel,
          contact_email: borrador.contacto.correo,
          website_or_social: borrador.web || borrador.enlace,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        avisar('Datos de la comunidad guardados en Supabase', { tipo: 'ok' });
      } catch {
        avisar('Datos guardados localmente', { tipo: 'ok' });
      }
    } else {
      avisar('Datos guardados', { tipo: 'ok' });
    }
  };

  return (
    <Caja
      titulo={`Datos de la comunidad: ${com.nombre}`}
      accion={
        editando ? (
          <div className="flex items-center gap-2">
            <Button nivel="primario" tamano="md" onClick={guardar}>
              Guardar
            </Button>
            <Button nivel="terciario" tamano="md" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button nivel="secundario" tamano="md" onClick={() => { setBorrador(com); setEditando(true); }}>
            Editar
          </Button>
        )
      }
    >
      {editando ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="com-nombre" etiqueta="Nombre del sector / barrio / comunidad" valor={borrador.nombre} onChange={(v) => setBorrador({ ...borrador, nombre: v })} requerido />
          <Field id="com-tipo" etiqueta="Tipo de representación (ej. JAC, Comuna)" valor={borrador.tipo} onChange={(v) => setBorrador({ ...borrador, tipo: v })} />
          <Field id="com-dir" etiqueta="Ubicación o dirección del sector" valor={borrador.dir} onChange={(v) => setBorrador({ ...borrador, dir: v })} />
          <Field id="com-tel" etiqueta="Teléfono de contacto para la comunidad" tipo="tel" valor={borrador.contacto.tel} onChange={(v) => setBorrador({ ...borrador, contacto: { ...borrador.contacto, tel: v } })} />
          <Field id="com-correo" etiqueta="Correo de contacto comunitarios" tipo="email" valor={borrador.contacto.correo} onChange={(v) => setBorrador({ ...borrador, contacto: { ...borrador.contacto, correo: v } })} />
        </div>
      ) : (
        <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-3">
          {[
            ['Comunidad o sector', com.nombre],
            ['Tipo de representación', com.tipo],
            ['Ubicación', com.dir],
            ['Contacto comunitario', `${com.contacto.tel || 'Sin teléfono'}, ${com.contacto.correo || 'Sin correo'}`],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-rd-11-5 font-medium text-rd-ink-meta">{k}</dt>
              <dd className="m-0 text-rd-13-5 text-rd-ink wrap-anywhere">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </Caja>
  );
};

/* ---------- Datos de Voluntario (Perfil Persona Natural) ---------- */

const DatosVoluntario: React.FC<{
  yo: PersonaExt;
  dbUserId?: string | null;
  onGuardarVoluntario: (p: PersonaExt) => void;
}> = ({ yo, dbUserId, onGuardarVoluntario }) => {
  const avisar = useAviso();
  const [editando, setEditando] = useState(false);
  const [disp, setDisp] = useState(yo.disponibilidad || 'Fines de semana y emergencias');
  const [apoyo, setApoyo] = useState(yo.habilidades || 'Apoyo en terreno, coordinación logística y donaciones');

  const guardar = async () => {
    onGuardarVoluntario({ ...yo, disponibilidad: disp, habilidades: apoyo });
    setEditando(false);
    if (dbUserId) {
      try {
        await updateUserProfile(dbUserId, {
          cargo: `Voluntario: ${disp}`
        });
        avisar('Información de voluntariado guardada en Supabase', { tipo: 'ok' });
      } catch {
        avisar('Información guardada', { tipo: 'ok' });
      }
    }
  };

  return (
    <Caja
      titulo="Información de voluntariado y apoyo"
      accion={
        editando ? (
          <div className="flex items-center gap-2">
            <Button nivel="primario" tamano="md" onClick={guardar}>
              Guardar
            </Button>
            <Button nivel="terciario" tamano="md" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button nivel="secundario" tamano="md" onClick={() => setEditando(true)}>
            Editar
          </Button>
        )
      }
    >
      {editando ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="vol-disp" etiqueta="Disponibilidad de tiempo" valor={disp} onChange={setDisp} />
          <Field id="vol-apoyo" etiqueta="Habilidades o tipo de apoyo ofrecido" valor={apoyo} onChange={setApoyo} />
        </div>
      ) : (
        <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-rd-11-5 font-medium text-rd-ink-meta">Disponibilidad de tiempo</dt>
            <dd className="m-0 text-rd-13-5 text-rd-ink">{disp}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-rd-11-5 font-medium text-rd-ink-meta">Habilidades y apoyo ofrecido</dt>
            <dd className="m-0 text-rd-13-5 text-rd-ink">{apoyo}</dd>
          </div>
        </dl>
      )}
    </Caja>
  );
};
