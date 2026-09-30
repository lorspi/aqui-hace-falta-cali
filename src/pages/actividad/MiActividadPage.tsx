import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  Edit3,
  Eye,
  Hand,
  HeartHandshake,
  Map as MapIcon,
  Pause,
  Play,
  RefreshCw,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Shell } from '../../components/ui/Shell';
import { Button } from '../../components/ui/Button';
import { Vacio } from '../../components/ui/Vacio';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { CampanaAvisos } from '../../components/ui/Avisos';
import { BotonMenu } from '../../components/ui/Shell';
import { DialogoCierre } from '../panel/dialogos';
import { Dialogo } from '../../components/ui/Dialogo';
import { DialogoDetallePublicacion } from '../../components/ui/DialogoDetallePublicacion';
import { Field } from '../../components/ui/Field';
import { IconoWhatsApp } from '../../components/ui/IconoMarca';
import { Anillo } from '../../components/ui/Recursos';
import { Donde } from '../../components/ui/Donde';
import { Avatar, EtiquetaEstado, EtiquetaTipo } from '../../components/ui/Etiqueta';
import { Pestanas, type Pestana } from '../../components/ui/Pestanas';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { obtenerPublicaciones } from '../../mocks/publicacionesMock';
import type { Aviso } from '../../types/aviso';
import type { Publicacion, Recurso } from '../../types/publicacion';
import type { Foto } from '../../types/flujo';
import { supabase, dbNeedToNeed, dbOfferToOffer } from '../../lib/supabaseClient';
import { needToPublicacion, offerToPublicacion } from '../../utils/supabaseMappers';
import {
  estadoPublicacion,
  estadoRecurso,
  iniciales,
  restante,
  tituloPublicacion,
} from '../../utils/publicaciones';

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

import { clearStoredAuthUser, getStoredAuthUser, EVENTO_AUTH_CHANGED } from '../../utils/session';

export interface MiActividadPageProps {
  authUser?: any;
}

export const MiActividadPage: React.FC<MiActividadPageProps> = ({ authUser }) => (
  <AvisosProvider>
    <MiActividad authUser={authUser} />
  </AvisosProvider>
);

const PESTANAS_ACTIVIDAD: Pestana[] = [
  { id: 'necesidades', nombre: 'Lo que pedí' },
  { id: 'ofertas', nombre: 'Lo que ofrecí' },
];

const MiActividad: React.FC<{ authUser?: any }> = ({ authUser }) => {
  const avisar = useAviso();
  const [tab, setTab] = useState<'necesidades' | 'ofertas'>('necesidades');
  const [cajon, setCajon] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>(AVISOS);
  const [cargando, setCargando] = useState(true);
  const [misPubs, setMisPubs] = useState<Publicacion[]>([]);
  const [certificandoItem, setCertificandoItem] = useState<Publicacion | null>(null);
  const [detalleItem, setDetalleItem] = useState<Publicacion | null>(null);
  const [editandoItem, setEditandoItem] = useState<Publicacion | null>(null);
  const [editRecursos, setEditRecursos] = useState<{ item: string; total: string; unidad: string }[]>([]);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editZona, setEditZona] = useState('');
  const [editDir, setEditDir] = useState('');
  const [editContacto, setEditContacto] = useState('');
  const [editTel, setEditTel] = useState('');
  const [sessionUser, setSessionUser] = useState<any>(() => {
    if (authUser === null) return null;
    if (authUser !== undefined) return authUser;
    return getStoredAuthUser();
  });

  useEffect(() => {
    if (authUser !== undefined) {
      setSessionUser(authUser);
    }
  }, [authUser]);

  useEffect(() => {
    const handleAuthChanged = (e: any) => {
      const u = e.detail !== undefined ? e.detail : getStoredAuthUser();
      setSessionUser(u);
    };
    window.addEventListener(EVENTO_AUTH_CHANGED, handleAuthChanged);
    return () => window.removeEventListener(EVENTO_AUTH_CHANGED, handleAuthChanged);
  }, []);

  // Cargar usuario actual
  useEffect(() => {
    if (authUser === null) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setSessionUser(data.user);
    });
  }, [authUser]);

  // Cargar publicaciones del usuario
  const cargarActividad = useCallback(async () => {
    setCargando(true);
    try {
      let userId = sessionUser?.id;

      if (!userId) {
        try {
          const saved = localStorage.getItem('ahf_auth_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            userId = parsed.id;
          }
        } catch {}
      }

      const [{ data: needsData }, { data: offersData }] = await Promise.all([
        supabase
          .from('needs')
          .select('*')
          .neq('verification_status', 'ARCHIVED')
          .order('created_at', { ascending: false }),
        supabase
          .from('offers')
          .select('*')
          .neq('verification_status', 'ARCHIVED')
          .order('created_at', { ascending: false }),
      ]);

      const needsMapped = (needsData || []).map(dbNeedToNeed).map(needToPublicacion);
      const offersMapped = (offersData || []).map(dbOfferToOffer).map(offerToPublicacion);
      const todas = [...needsMapped, ...offersMapped];

      // Filtrar las que pertenecen al usuario (por user_id o marcadas como propias)
      let filtradas = todas.filter((p) => {
        if (p.propia) return true;
        if (userId && (p as any).userId === userId) return true;
        return false;
      });

      // Si no hay vinculadas por ID, cargamos las creadas localmente en sesión o datos de ejemplo propios
      if (filtradas.length === 0) {
        const locales = obtenerPublicaciones().filter((p) => p.propia || p.id === 'oferta-usme');
        if (locales.length > 0) {
          filtradas = locales;
        } else {
          // Si el mock no tiene propias, mostramos las primeras 2 para dar contexto en desarrollo
          filtradas = todas.slice(0, 2);
        }
      }

      setMisPubs(filtradas);
    } catch (e) {
      console.error('Error cargando actividad:', e);
      setMisPubs(obtenerPublicaciones().filter((p) => p.propia));
    } finally {
      setCargando(false);
    }
  }, [sessionUser]);

  useEffect(() => {
    cargarActividad();
  }, [cargarActividad]);

  const misNecesidades = useMemo(() => misPubs.filter((p) => p.tipo === 'necesidad'), [misPubs]);
  const misOfertas = useMemo(() => misPubs.filter((p) => p.tipo === 'oferta'), [misPubs]);

  const listaActual = tab === 'necesidades' ? misNecesidades : misOfertas;

  // Acciones sobre publicaciones
  const abrirEdicion = (p: Publicacion) => {
    setEditandoItem(p);
    setEditRecursos(
      p.recursos.map((r) => ({
        item: r.item,
        total: String(r.total),
        unidad: r.unidad,
      }))
    );
    setEditDescripcion(p.descripcion || '');
    setEditZona(p.zona || '');
    setEditDir(p.dir || '');
    setEditContacto((p as any).contactName || p.org || '');
    setEditTel((p as any).contactPhone || (p as any).tel || '');
  };

  const tituloCalculado = useMemo(() => {
    if (!editandoItem) return '';
    const tempPub: Publicacion = {
      ...editandoItem,
      zona: editZona.trim() || editandoItem.zona,
      dir: editDir.trim() || editandoItem.dir,
      org: editContacto.trim() || editandoItem.org,
      recursos: editRecursos.map((r, idx) => ({
        ...(editandoItem.recursos[idx] || { item: r.item, total: 1, unidad: r.unidad, tramos: [] }),
        item: r.item,
        total: parseFloat(r.total) || 1,
        unidad: r.unidad,
      })),
    };
    return tituloPublicacion(tempPub);
  }, [editandoItem, editRecursos, editZona, editDir, editContacto]);

  const guardarEdicion = async () => {
    if (!editandoItem) return;

    // Recursos actualizados con las nuevas cantidades
    const recursosActualizados: Recurso[] = editandoItem.recursos.map((r, i) => {
      const editado = editRecursos[i];
      const nuevoTotal = editado ? parseFloat(editado.total) || r.total : r.total;
      return {
        ...r,
        total: nuevoTotal,
      };
    });

    const pubActualizada: Publicacion = {
      ...editandoItem,
      descripcion: editDescripcion.trim(),
      zona: editZona.trim() || editandoItem.zona,
      dir: editDir.trim() || editandoItem.dir,
      org: editContacto.trim() || editandoItem.org,
      recursos: recursosActualizados,
    };
    pubActualizada.titulo = tituloPublicacion(pubActualizada);

    // Actualizar localmente de inmediato
    setMisPubs((prev) =>
      prev.map((item) => (item.id === editandoItem.id ? pubActualizada : item))
    );

    // Intentar actualizar en Supabase
    try {
      const tabla = editandoItem.tipo === 'necesidad' ? 'needs' : 'offers';
      const payload: Record<string, any> = {
        title: pubActualizada.titulo,
        description: editDescripcion.trim(),
        address: editDir.trim() || undefined,
        neighborhood: editZona.trim() || undefined,
        contact_name: editContacto.trim() || undefined,
        contact_phone: editTel.trim() || undefined,
      };

      await supabase.from(tabla).update(payload).eq('id', editandoItem.id);
    } catch (e) {
      console.error('Error actualizando en Supabase:', e);
    }

    setEditandoItem(null);
    avisar('Cambios guardados con éxito', { tipo: 'ok' });
  };

  const alternarPausa = async (p: Publicacion) => {
    const pausada = (p as any)._pausada;
    const nuevoEstado = !pausada;

    setMisPubs((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, _pausada: nuevoEstado } as any : item))
    );

    avisar(nuevoEstado ? 'Publicación pausada temporalmente' : 'Publicación reactivada en el radar', {
      tipo: 'ok',
    });
  };

  const certificarYCerrar = async (
    fotos: number,
    fotosLista?: Foto[],
    notaTexto?: string
  ) => {
    if (!certificandoItem) return;
    const id = certificandoItem.id;
    const tipo = certificandoItem.tipo;

    // Actualizar en el estado local
    setMisPubs((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          _resuelta: true,
          recursos: item.recursos.map((r) => ({
            ...r,
            tramos: [{ t: 'hecho', cant: r.total, quien: 'Confirmado con fotos', cuando: 'Hoy' }],
          })),
        };
      })
    );

    // Actualizar en Supabase si es posible
    try {
      const tabla = tipo === 'necesidad' ? 'needs' : 'offers';
      const statusField = tipo === 'necesidad' ? 'status' : 'offer_status';
      await supabase
        .from(tabla)
        .update({
          [statusField]: 'FULFILLED',
          verification_notes: notaTexto || 'Certificado por el ciudadano con fotos de constancia.',
        })
        .eq('id', id);
    } catch {}

    const mensaje =
      tipo === 'necesidad'
        ? '¡Ayuda confirmada y recibida! Tu solicitud se marcó como resuelta.'
        : '¡Entrega certificada con éxito!';

    avisar(mensaje, { tipo: 'ok' });
    setCertificandoItem(null);
  };

  const compartir = (id: string) => {
    const url = `${window.location.origin}${RUTAS.radar}?punto=${encodeURIComponent(id)}`;
    if (navigator.share) {
      navigator.share({ title: 'RaDAR de ayuda', url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      avisar('Enlace copiado al portapapeles', { tipo: 'ok' });
    }
  };

  const leerTodos = () => setAvisos((lista) => lista.map((a) => ({ ...a, leido: true })));
  const accionDeAviso = (a: Aviso) => {
    setAvisos((lista) => lista.map((x) => (x.id === a.id ? { ...x, leido: true } : x)));
    if (!a.accion) return;
    if (a.accion.al === 'confirmar') avisar(`Confirmaste lo que llegó de ${a.quien}`, { tipo: 'ok' });
    else if (a.accion.al === 'revalidar') avisar('Tu necesidad sigue arriba en el mapa', { tipo: 'ok' });
    else irA(a.accion.al);
  };

  return (
    <Shell
      seccion="actividad"
      panelNombre="Mi actividad"
      cuenta={CUENTA}
      authUser={authUser !== undefined ? authUser : sessionUser}
      rutas={RUTAS_SHELL}
      onPedir={() => irA(RUTAS.pedir)}
      onOfrecer={() => irA(RUTAS.ofrecer)}
      onLogout={async () => {
        clearStoredAuthUser();
        try {
          await supabase.auth.signOut();
        } catch {}
        window.location.href = '/mapa-ayudas-necesidades';
      }}
      cajonAbierto={cajon}
      onCerrarCajon={() => setCajon(false)}
    >
      <div className="flex h-full min-h-0 flex-col bg-rd-surface">
        {/* Cabecera superior */}
        <header className="border-b border-rd-line px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-rd m-0 text-rd-20 font-bold text-rd-ink sm:text-rd-22">Mi actividad</h1>
              <p className="m-0 mt-0.5 text-rd-13 text-rd-ink-2">
                Consulta y gestiona las solicitudes de ayuda que has pedido o los aportes que has ofrecido.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button nivel="pedir" tamano="md" icono={<Hand className="h-4 w-4" />} onClick={() => irA(RUTAS.pedir)}>
                Pedir ayuda
              </Button>
              <Button nivel="primario" tamano="md" icono={<HeartHandshake className="h-4 w-4" />} onClick={() => irA(RUTAS.ofrecer)}>
                Ofrecer ayuda
              </Button>
              <span aria-hidden="true" className="mx-1 h-6 w-px bg-rd-line max-lg:hidden" />
              <CampanaAvisos avisos={avisos} rutaAvisos={RUTAS_SHELL.avisos} onLeerTodos={leerTodos} onAccion={accionDeAviso} />
              <BotonMenu onClick={() => setCajon(true)} abierto={cajon} />
            </div>
          </div>
        </header>

        {/* Pestañas de navegación estándar del sistema (sin iconos ni colores personalizados) */}
        <Pestanas
          etiqueta="Tipo de actividad"
          pestanas={PESTANAS_ACTIVIDAD}
          actual={tab}
          onCambiar={(id) => setTab(id as 'necesidades' | 'ofertas')}
        />

        {/* Contenido principal: Estructura de lista idéntica al Radar */}
        <main
          role="region"
          aria-label="Lista de tu actividad"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] bg-rd-surface px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pb-6"
        >
          {cargando ? (
            <div className="flex h-64 items-center justify-center gap-2 text-rd-ink-meta">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Cargando tu actividad...</span>
            </div>
          ) : listaActual.length === 0 ? (
            tab === 'necesidades' ? (
              <Vacio
                icono={<Hand className="h-8 w-8 text-rd-coral" />}
                titulo="No has pedido ayuda aún"
                texto="Si tú o tu sector necesitan agua, alimentos, maquinaria o insumos, publícalo en el Radar para coordinar la ayuda."
                accion={
                  <Button nivel="pedir" tamano="sm" onClick={() => irA(RUTAS.pedir)}>
                    + Pedir ayuda
                  </Button>
                }
              />
            ) : (
              <Vacio
                icono={<HeartHandshake className="h-8 w-8 text-rd-navy" />}
                titulo="No has ofrecido ayuda aún"
                texto="Si tienes insumos, herramientas, albergue o transporte disponible para donar, publícalos para conectar con quienes lo necesitan."
                accion={
                  <Button nivel="primario" tamano="sm" onClick={() => irA(RUTAS.ofrecer)}>
                    + Ofrecer ayuda
                  </Button>
                }
              />
            )
          ) : (
            <div className="flex flex-col gap-3">
              {/* Cabecera de columnas, solo desde 1280 (idéntica a la vista de lista del Radar) */}
              <div className="hidden px-5 pb-1 xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_260px] xl:items-center xl:gap-8">
                <span className="text-rd-11 font-semibold tracking-wider text-rd-ink-meta uppercase">
                  Publicación y estado
                </span>
                <span className="text-rd-11 font-semibold tracking-wider text-rd-ink-meta uppercase">
                  Recursos
                </span>
                <span className="text-rd-11 font-semibold tracking-wider text-rd-ink-meta uppercase">
                  Acciones
                </span>
              </div>

              {listaActual.map((item) => (
                <FilaActividad
                  key={item.id}
                  publicacion={item}
                  onCertificar={setCertificandoItem}
                  onVerDetalle={setDetalleItem}
                  onEditar={abrirEdicion}
                  onPausar={alternarPausa}
                  onCompartir={compartir}
                  onVerEnMapa={(id) => irA(`${RUTAS.radar}?punto=${encodeURIComponent(id)}&vista=mapa`)}
                />
              ))}
            </div>
          )}
        </main>

        {/* Diálogo de edición estructurada de la publicación */}
        <Dialogo
          abierto={editandoItem !== null}
          titulo="Editar publicación"
          accion="Guardar cambios"
          textoAlterno="Cancelar"
          onCerrar={() => setEditandoItem(null)}
          onEnviar={guardarEdicion}
        >
          {editandoItem && (
            <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
              {/* Título institucional auto-calculado */}
              <div className="rounded-rd-md border border-rd-line bg-rd-sunken/40 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <EtiquetaTipo tipo={editandoItem.tipo} />
                  <span className="text-rd-11 font-medium text-rd-ink-meta">
                    Título automático en el radar:
                  </span>
                </div>
                <p className="font-rd m-0 text-rd-13-5 font-semibold text-rd-ink truncate">
                  {tituloCalculado}
                </p>
                <span className="mt-1 block text-rd-11 text-rd-ink-meta">
                  El título se actualiza solo a partir de tus recursos y ubicación.
                </span>
              </div>

              {/* 1. Bloque de Recursos y Cantidades */}
              <div className="rounded-rd-md border border-rd-line bg-rd-surface overflow-hidden">
                <div className="border-b border-rd-line bg-rd-sunken/60 px-3 py-2 text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                  {editandoItem.tipo === 'necesidad' ? 'Recursos solicitados y cantidades' : 'Recursos ofrecidos y cantidades'}
                </div>
                <div className="divide-y divide-rd-line-soft">
                  {editRecursos.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 gap-3">
                      <span className="text-rd-13 font-semibold text-rd-ink truncate min-w-0">
                        {r.item}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={r.total}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditRecursos((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, total: val } : item))
                            );
                          }}
                          aria-label={`Cantidad de ${r.item}`}
                          className="font-rd h-9 w-24 rounded-rd-sm border border-rd-line bg-rd-surface px-2.5 text-right text-rd-13 font-semibold text-rd-ink tabular-nums focus:border-rd-navy focus:outline-none"
                        />
                        <span className="text-rd-12-5 font-medium text-rd-ink-2 min-w-14 truncate">
                          {r.unidad}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Descripción y contexto */}
              <div className="space-y-1">
                <label htmlFor="edit-act-desc" className="block text-rd-13 font-semibold text-rd-ink">
                  Descripción y detalles
                </label>
                <textarea
                  id="edit-act-desc"
                  rows={3}
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 text-rd-13 text-rd-ink focus:border-rd-navy focus:outline-none"
                  placeholder="Detalles sobre el punto de entrega, estado de la vía o especificaciones..."
                />
                <span className="text-rd-11 text-rd-ink-meta">
                  Explica brevemente la situación para quienes van a coordinar contigo.
                </span>
              </div>

              {/* 3. Ubicación y entrega */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  id="edit-act-zona"
                  etiqueta="Barrio o sector"
                  tipo="text"
                  valor={editZona}
                  onChange={setEditZona}
                  ayuda="Ej: Bosa Centro, El Poblado"
                />
                <Field
                  id="edit-act-dir"
                  etiqueta="Dirección o punto de entrega"
                  tipo="text"
                  valor={editDir}
                  onChange={setEditDir}
                  ayuda="Ej: Cra 80 # 65-12 sur"
                />
              </div>

              {/* 4. Contacto para coordinar */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  id="edit-act-contacto"
                  etiqueta="Nombre de contacto"
                  tipo="text"
                  valor={editContacto}
                  onChange={setEditContacto}
                  ayuda="Persona que atiende las entregas"
                />
                <Field
                  id="edit-act-tel"
                  etiqueta="Teléfono / WhatsApp"
                  tipo="tel"
                  valor={editTel}
                  onChange={setEditTel}
                  ayuda="Para coordinar la ayuda"
                />
              </div>
            </div>
          )}
        </Dialogo>

        {/* Diálogo de certificación y cierre con fotos */}
        <DialogoCierre
          abierto={certificandoItem !== null}
          titulo={
            certificandoItem?.tipo === 'necesidad'
              ? 'Confirmar que recibiste la ayuda'
              : 'Certificar entrega de tu oferta'
          }
          texto={
            certificandoItem?.tipo === 'necesidad'
              ? 'Al confirmar, tu solicitud se marcará como resuelta y saldrá del radar activo para que no sigan llamándote. Opcionalmente puedes adjuntar una foto de constancia.'
              : 'Al certificar, quedará constancia verificada de que la ayuda llegó a su destino.'
          }
          accion={certificandoItem?.tipo === 'necesidad' ? 'Confirmar y cerrar' : 'Certificar entrega'}
          etiquetaFotos="Fotos de constancia o entrega"
          nota={{
            etiqueta: 'Observaciones o mensaje de agradecimiento',
            placeholder: 'Ej. Insumos recibidos completos a entera satisfacción de la comunidad...',
            ayuda: 'Tus notas y fotos certificarán la transparencia de la entrega.',
          }}
          onCerrar={() => setCertificandoItem(null)}
          onEnviar={certificarYCerrar}
        />

        {/* Diálogo con la tarjeta completa de la publicación */}
        <DialogoDetallePublicacion
          publicacion={detalleItem}
          textoPrimaria={
            detalleItem
              ? (detalleItem as any)._resuelta
                ? 'Resuelta'
                : detalleItem.tipo === 'necesidad'
                ? 'Confirmar recibido'
                : 'Certificar entrega'
              : undefined
          }
          onCerrar={() => setDetalleItem(null)}
          onPrimaria={() => {
            if (detalleItem && !(detalleItem as any)._resuelta) {
              const item = detalleItem;
              setDetalleItem(null);
              setCertificandoItem(item);
            }
          }}
          onVerEnMapa={(id) => irA(`${RUTAS.radar}?punto=${encodeURIComponent(id)}&vista=mapa`)}
          onCompartir={compartir}
        />
      </div>
    </Shell>
  );
};

interface FilaActividadProps {
  publicacion: Publicacion;
  onCertificar: (p: Publicacion) => void;
  onVerDetalle: (p: Publicacion) => void;
  onEditar: (p: Publicacion) => void;
  onPausar: (p: Publicacion) => void;
  onCompartir: (id: string) => void;
  onVerEnMapa: (id: string) => void;
}

/**
 * Fila de publicación adaptada para Mi Actividad, que sigue estrictamente la anatomía y
 * diseño de FilaPublicacion en la vista de lista del Radar (Avatar, Tipo/Estado, Título,
 * Dónde, Descripción, Recursos con Anillos y columna de Acciones estructurada).
 */
const FilaActividad: React.FC<FilaActividadProps> = ({
  publicacion: p,
  onCertificar,
  onVerDetalle,
  onEditar,
  onPausar,
  onCompartir,
  onVerEnMapa,
}) => {
  const pausada = Boolean((p as any)._pausada);
  const resuelta = Boolean((p as any)._resuelta);
  const primerRecurso = p.recursos[0];
  const compromisoEnCamino = p.recursos
    .flatMap((r) => r.tramos)
    .find((t) => t.t === 'camino');
  const est = estadoPublicacion(p);

  const menu = [
    {
      texto: 'Ver tarjeta completa',
      icono: <Eye className="h-4 w-4" />,
      onElegir: () => onVerDetalle(p),
    },
    {
      texto: 'Editar publicación',
      icono: <Edit3 className="h-4 w-4" />,
      onElegir: () => onEditar(p),
    },
    {
      texto: pausada ? 'Reanudar en el radar' : 'Pausar publicación',
      icono: pausada ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />,
      onElegir: () => onPausar(p),
    },
    {
      texto: 'Compartir',
      icono: <Share2 className="h-4 w-4" />,
      onElegir: () => onCompartir(p.id),
    },
  ];

  return (
    <article
      id={p.id}
      className={`min-w-0 rounded-rd-xl border bg-rd-surface p-3.5 transition duration-200 hover:border-rd-navy-line hover:shadow-xs sm:p-5 xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_260px] xl:items-center xl:gap-8 ${
        resuelta
          ? 'border-rd-green/40 bg-rd-green/5'
          : pausada
          ? 'border-rd-line opacity-75'
          : 'border-rd-line'
      }`}
    >
      {/* 1. Publicación, tipo, ubicación y estado */}
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-3.5">
        <Avatar iniciales={iniciales(p.org || 'Tú')} tamano="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-1.5">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <EtiquetaTipo tipo={p.tipo} />
            {resuelta ? (
              <span className="rounded-rd-sm bg-rd-green-soft px-1.5 py-0.5 text-rd-10-5 font-bold text-rd-green sm:px-2 sm:text-rd-11">
                ✅ Resuelta / Completada
              </span>
            ) : pausada ? (
              <span className="rounded-rd-sm bg-rd-sunken px-1.5 py-0.5 text-rd-10-5 font-semibold text-rd-ink-meta sm:px-2 sm:text-rd-11">
                ⏸ Pausada
              </span>
            ) : (
              <EtiquetaEstado estado={est} />
            )}
          </div>

          <div className="flex min-w-0 items-center gap-1.5">
            <h2
              className="font-rd m-0 min-w-0 truncate text-rd-13 font-semibold leading-snug text-rd-ink sm:text-rd-14 cursor-pointer hover:text-rd-navy hover:underline transition-colors"
              onClick={() => onVerDetalle(p)}
              title="Ver tarjeta completa"
            >
              {p.titulo}
            </h2>
            {p.verificada && (
              <BadgeCheck
                role="img"
                aria-label="Verificada"
                className="h-4 w-4 shrink-0 text-rd-navy"
              />
            )}
          </div>

          <Donde
            lugar={p.dir ?? `${p.zona}${p.localidad ? ` · ${p.localidad}` : ''}`}
            className="mt-0.5"
          />

          {p.descripcion && (
            <p className="m-0 mt-0.5 text-rd-11-5 sm:text-rd-12 text-rd-ink-2 line-clamp-1 sm:line-clamp-2 leading-relaxed">
              {p.descripcion}
            </p>
          )}

          {/* Banner de compromiso / entrega en camino con WhatsApp */}
          {compromisoEnCamino && !resuelta && (
            <div className="mt-1.5 flex items-center justify-between gap-2 rounded-rd-md border border-rd-green/30 bg-rd-green-soft/40 px-2.5 py-1 text-rd-11-5 sm:text-rd-12 sm:px-3 sm:py-1.5 text-rd-ink">
              <div className="flex min-w-0 items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-rd-green" />
                <span className="truncate">
                  <strong className="text-rd-green">
                    {p.tipo === 'necesidad' ? '¡Ayuda en camino!' : 'Compromiso activo:'}
                  </strong>{' '}
                  {p.tipo === 'necesidad'
                    ? `${compromisoEnCamino.quien} te lleva ${compromisoEnCamino.cant} ${primerRecurso?.unidad}`
                    : `Para ${compromisoEnCamino.quien} (${compromisoEnCamino.cant} ${primerRecurso?.unidad})`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.open('https://wa.me/', '_blank')}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rd-green px-2.5 py-1 text-rd-11 font-semibold text-white hover:bg-rd-green-hover transition-colors cursor-pointer"
                title="Coordinar entrega por WhatsApp"
              >
                <IconoWhatsApp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Recursos con sus anillos y estados (idéntico a la fila del Radar) */}
      <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2 max-xl:mt-2.5 sm:max-xl:mt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-3">
          {p.recursos.map((r) => {
            const completo = restante(r) === 0;
            return (
              <span key={r.item} className="flex items-center gap-2 sm:gap-2.5">
                <Anillo recurso={r} />
                <span className="flex min-w-0 flex-col leading-tight">
                  <b className="truncate text-rd-12-5 sm:text-rd-13 font-semibold text-rd-ink">{r.item}</b>
                  <span
                    className={`text-rd-11 sm:text-rd-11-5 tabular-nums ${
                      completo ? 'font-semibold text-rd-green' : 'text-rd-ink-2'
                    }`}
                  >
                    {estadoRecurso(r, p.tipo)}
                  </span>
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* 3. Acciones en el extremo derecho en una sola línea compacta */}
      <div className="flex min-w-0 flex-col items-end gap-2 self-stretch max-xl:mt-2 max-xl:border-t max-xl:border-rd-line max-xl:pt-2 sm:max-xl:mt-3 sm:max-xl:pt-3">
        <div className="mt-auto flex w-full flex-nowrap items-center justify-between gap-2 xl:w-auto xl:justify-end">
          {!resuelta ? (
            <Button
              nivel="primario"
              tamano="sm"
              className="shadow-2xs shrink-0"
              onClick={() => onCertificar(p)}
            >
              {p.tipo === 'necesidad' ? 'Confirmar recibido' : 'Certificar entrega'}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-rd-12 font-semibold text-rd-green shrink-0">
              <CheckCircle2 className="h-4 w-4" /> Resuelta
            </span>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <Button
              nivel="secundario"
              tamano="sm"
              soloIcono
              aria-label="Ver en el mapa"
              className="shadow-2xs"
              onClick={() => onVerEnMapa(p.id)}
            >
              <MapIcon aria-hidden="true" className="h-4 w-4" />
            </Button>

            <MenuAcciones
              items={menu}
              etiqueta={`Más acciones de ${p.titulo}`}
              tamano="sm"
              nivel="secundario"
              className="shadow-2xs"
              flotante
            />
          </div>
        </div>
      </div>
    </article>
  );
};
