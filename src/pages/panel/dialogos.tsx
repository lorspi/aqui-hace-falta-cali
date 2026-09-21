import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Edit3, Eye, MapPin, Phone, Plus, Trash2, Truck, X } from 'lucide-react';
import type { MiembroEquipo, RecursoOfrecido, RecursoPedido, RolPlataforma, Solicitud } from '../../types/panel';
import type { Foto } from '../../types/flujo';
import type { Publicacion } from '../../types/publicacion';
import { EQUIPO } from '../../mocks/panelMock';
import { cifra } from '../../utils/publicaciones';
import { Dialogo, Opciones } from '../../components/ui/Dialogo';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { CampoFotos } from '../flujos/comunes';

/**
 * Los diálogos del panel que comparten varias pestañas.
 *
 * `DialogoAsignar`: quién lleva una entrega, elegido del equipo. Va en diálogo y no en un
 * `<select>` dentro de la tarjeta porque el `index.css` del repo fuerza los selects a 16 px bajo
 * 768 (contra el zoom de iOS) y se ven enormes en una tarjeta de 280.
 *
 * `DialogoCierre`: cerrar una entrega con foto, desde cualquiera de los dos lados (Alejandro,
 * 16 de septiembre de 2026): quien entrega la certifica y quien recibe la confirma. Las fotos
 * son opcionales y no salen del navegador en la maqueta; se cuenta cuántas se adjuntaron.
 */
export const DialogoAsignar: React.FC<{
  solicitud: Solicitud | null;
  equipo?: MiembroEquipo[];
  onCerrar: () => void;
  onAsignar: (id: number, vol: number) => void;
}> = ({ solicitud: s, equipo = EQUIPO, onCerrar, onAsignar }) => (
  <Dialogo
    abierto={s !== null}
    titulo={s ? `¿Quién lleva ${cifra(s.cant)} ${s.u} de ${s.rec.toLowerCase()}?` : ''}
    accion="Asignar"
    onCerrar={onCerrar}
    onEnviar={(form) => {
      if (!s) return;
      const id = Number(new FormData(form).get('vol'));
      onCerrar();
      if (id) onAsignar(s.id, id);
    }}
  >
    <p className="mb-4 text-rd-14 text-rd-ink-2">
      A {s?.quien}
      {s?.dist ? `, a ${s.dist}` : ''}. Le avisamos a quien elijas y queda con la entrega en su lista.
    </p>
    <Opciones
      nombre="vol"
      etiqueta="Del equipo"
      opciones={equipo.map((e) => ({ valor: String(e.id), texto: `${e.n} · ${e.veh}` }))}
      inicial={String(s?.vol ?? equipo[0]?.id ?? 1)}
      columna
    />
  </Dialogo>
);

/**
 * Diálogo para editar un recurso ofrecido directamente desde «Mis ofertas».
 */
export const DialogoEditarRecursoOfrecido: React.FC<{
  recurso: RecursoOfrecido | null;
  onCerrar: () => void;
  onGuardar: (actualizado: RecursoOfrecido) => void;
}> = ({ recurso: r, onCerrar, onGuardar }) => {
  const [total, setTotal] = useState('');
  const [unidad, setUnidad] = useState('');
  const [disp, setDisp] = useState('');
  const [pres, setPres] = useState('');

  useEffect(() => {
    if (r) {
      setTotal(String(r.total));
      setUnidad(r.unidad);
      setDisp(r.disp);
      setPres(r.pres);
    }
  }, [r]);

  if (!r) return null;

  return (
    <Dialogo
      abierto={r !== null}
      titulo={`Editar oferta de ${r.n}`}
      accion="Guardar cambios"
      onCerrar={onCerrar}
      onEnviar={() => {
        const num = parseFloat(total);
        onGuardar({
          ...r,
          total: isNaN(num) || num <= 0 ? r.total : num,
          unidad: unidad.trim() || r.unidad,
          disp: disp.trim() || r.disp,
          pres: pres.trim() || r.pres,
        });
        onCerrar();
      }}
    >
      <p className="mb-4 text-rd-14 text-rd-ink-2">
        Ajusta las cantidades disponibles y detalles de este recurso para la coordinación en el Radar.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="edit-of-total"
          etiqueta="Cantidad total disponible"
          tipo="text"
          inputMode="numeric"
          valor={total}
          onChange={setTotal}
          requerido
        />
        <Field
          id="edit-of-unidad"
          etiqueta="Unidad de medida"
          tipo="text"
          valor={unidad}
          onChange={setUnidad}
          requerido
        />
        <div className="sm:col-span-2">
          <Field
            id="edit-of-disp"
            etiqueta="Disponibilidad"
            tipo="text"
            valor={disp}
            onChange={setDisp}
            ayuda="Ej. «Hasta agotar», «Hasta el 30 de septiembre» o «48 horas»"
            requerido
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            id="edit-of-pres"
            etiqueta="Presentación o empaque"
            tipo="text"
            valor={pres}
            onChange={setPres}
            ayuda="Ej. «Carrotanque», «Kits de mercado de 15 kg» o «5 a 20 kW»"
          />
        </div>
      </div>
    </Dialogo>
  );
};

/**
 * Diálogo para editar una necesidad publicada directamente desde «Mis necesidades».
 */
export const DialogoEditarRecursoPedido: React.FC<{
  recurso: RecursoPedido | null;
  onCerrar: () => void;
  onGuardar: (actualizado: RecursoPedido) => void;
}> = ({ recurso: r, onCerrar, onGuardar }) => {
  const [total, setTotal] = useState('');
  const [unidad, setUnidad] = useState('');
  const [para, setPara] = useState('');

  useEffect(() => {
    if (r) {
      setTotal(String(r.total));
      setUnidad(r.unidad);
      setPara(r.para);
    }
  }, [r]);

  if (!r) return null;

  return (
    <Dialogo
      abierto={r !== null}
      titulo={`Editar necesidad de ${r.n}`}
      accion="Guardar cambios"
      onCerrar={onCerrar}
      onEnviar={() => {
        const num = parseFloat(total);
        onGuardar({
          ...r,
          total: isNaN(num) || num <= 0 ? r.total : num,
          unidad: unidad.trim() || r.unidad,
          para: para.trim() || r.para,
        });
        onCerrar();
      }}
    >
      <p className="mb-4 text-rd-14 text-rd-ink-2">
        Modifica la meta requerida y la justificación para que las organizaciones aliadas conozcan tu situación.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="edit-ped-total"
          etiqueta="Cantidad que hace falta"
          tipo="text"
          inputMode="numeric"
          valor={total}
          onChange={setTotal}
          requerido
        />
        <Field
          id="edit-ped-unidad"
          etiqueta="Unidad"
          tipo="text"
          valor={unidad}
          onChange={setUnidad}
          requerido
        />
        <div className="sm:col-span-2">
          <Field
            id="edit-ped-para"
            etiqueta="Destino o justificación"
            tipo="textarea"
            filas={2}
            valor={para}
            onChange={setPara}
            ayuda="Ej. «Para las familias albergadas en el salón comunal»"
            requerido
          />
        </div>
      </div>
    </Dialogo>
  );
};

/**
 * Diálogo para registrar a un nuevo miembro en el equipo de la organización.
 */
export const DialogoRegistrarMiembro: React.FC<{
  abierto: boolean;
  onCerrar: () => void;
  onRegistrar: (m: Omit<MiembroEquipo, 'id' | 'hechas'>) => void;
}> = ({ abierto, onCerrar, onRegistrar }) => {
  const [nombre, setNombre] = useState('');
  const [tel, setTel] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('Conducción');
  const [veh, setVeh] = useState('Camioneta 4×4');
  const [rolPlataforma, setRolPlataforma] = useState<RolPlataforma>('coordinador');
  const [disp, setDisp] = useState<MiembroEquipo['disp']>('hoy');
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorTel, setErrorTel] = useState<string | null>(null);

  const reset = () => {
    setNombre('');
    setTel('');
    setCorreo('');
    setRol('Conducción');
    setVeh('Camioneta 4×4');
    setRolPlataforma('coordinador');
    setDisp('hoy');
    setErrorNombre(null);
    setErrorTel(null);
  };

  const cerrar = () => {
    reset();
    onCerrar();
  };

  return (
    <Dialogo
      abierto={abierto}
      titulo="Registrar a alguien en tu equipo"
      accion="Registrar miembro"
      onCerrar={cerrar}
      onEnviar={() => {
        let hayError = false;
        if (!nombre.trim()) {
          setErrorNombre('El nombre es obligatorio');
          hayError = true;
        } else {
          setErrorNombre(null);
        }
        if (!tel.trim()) {
          setErrorTel('El teléfono es obligatorio para coordinar');
          hayError = true;
        } else {
          setErrorTel(null);
        }
        if (hayError) return;

        onRegistrar({
          n: nombre.trim(),
          tel: tel.trim(),
          correo: correo.trim() || `${nombre.toLowerCase().trim().replace(/\s+/g, '.')}@organizacion.org`,
          rol,
          veh,
          rolPlataforma,
          disp,
        });
        cerrar();
      }}
    >
      <p className="mb-4 text-rd-14 text-rd-ink-2">
        Agrega a un colaborador o voluntario. Podrás asignarle solicitudes y entregas en el tablero de seguimiento.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            id="miembro-nombre"
            etiqueta="Nombre y apellidos"
            tipo="text"
            valor={nombre}
            onChange={(v) => {
              setNombre(v);
              if (errorNombre) setErrorNombre(null);
            }}
            error={errorNombre}
            placeholder="Ej. Mateo Rojas"
            autoComplete="name"
            requerido
          />
        </div>
        <Field
          id="miembro-tel"
          etiqueta="Celular"
          tipo="tel"
          inputMode="tel"
          valor={tel}
          onChange={(v) => {
            setTel(v);
            if (errorTel) setErrorTel(null);
          }}
          error={errorTel}
          placeholder="+57 310 000 0000"
          autoComplete="tel"
          requerido
        />
        <Field
          id="miembro-correo"
          etiqueta="Correo electrónico"
          tipo="email"
          opcional
          valor={correo}
          onChange={setCorreo}
          placeholder="correo@ejemplo.org"
          autoComplete="email"
        />
        <Field
          id="miembro-rol"
          etiqueta="Qué hace en terreno"
          tipo="select"
          valor={rol}
          onChange={setRol}
          opciones={['Qué hace en terreno', 'Conducción', 'Logística y bodega', 'Rescate', 'Salud', 'Coordinación']}
        />
        <Field
          id="miembro-veh"
          etiqueta="Vehículo"
          tipo="select"
          valor={veh}
          onChange={setVeh}
          opciones={['Vehículo disponible', 'Camioneta 4×4', 'Moto', 'Carro', 'Camión / Furgón', 'Sin vehículo']}
        />
        <Field
          id="miembro-disp"
          etiqueta="Disponibilidad habitual"
          tipo="select"
          valor={disp === 'hoy' ? 'Hoy' : disp === 'manana' ? 'Mañana' : 'Fin de semana'}
          onChange={(v) => {
            if (v === 'Mañana') setDisp('manana');
            else if (v === 'Fin de semana') setDisp('finde');
            else setDisp('hoy');
          }}
          opciones={['Disponibilidad', 'Hoy', 'Mañana', 'Fin de semana']}
        />
        <Field
          id="miembro-acceso"
          etiqueta="Acceso en RaDAR"
          tipo="select"
          valor={rolPlataforma === 'admin' ? 'Administra' : rolPlataforma === 'auditor' ? 'Solo ve' : 'Coordina entregas'}
          onChange={(v) => {
            if (v === 'Administra') setRolPlataforma('admin');
            else if (v === 'Solo ve') setRolPlataforma('auditor');
            else setRolPlataforma('coordinador');
          }}
          opciones={['Acceso en RaDAR', 'Coordina entregas', 'Administra', 'Solo ve']}
        />
      </div>
    </Dialogo>
  );
};

export const DialogoCierre: React.FC<{ abierto: boolean; titulo: string; texto: string; accion: string; onCerrar: () => void; onEnviar: (fotos: number) => void }> = ({ abierto, titulo, texto, accion, onCerrar, onEnviar }) => {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [pesados, setPesados] = useState(0);
  const cerrar = () => {
    setFotos([]);
    setPesados(0);
    onCerrar();
  };
  return (
    <Dialogo
      abierto={abierto}
      titulo={titulo}
      accion={accion}
      onCerrar={cerrar}
      onEnviar={() => {
        const n = fotos.length;
        setFotos([]);
        setPesados(0);
        onEnviar(n);
      }}
    >
      <p className="mb-4 text-rd-14 text-rd-ink-2">{texto}</p>
      <p className="mb-2 text-rd-13 font-semibold text-rd-ink">Fotos de la entrega (opcionales)</p>
      <CampoFotos fotos={fotos} onAgregar={(nuevas, p) => {
        setFotos((l) => [...l, ...nuevas]);
        setPesados(p);
      }} onQuitar={(i) => setFotos((l) => l.filter((_, k) => k !== i))} error={pesados ? `${pesados === 1 ? 'Un archivo pesa' : `${pesados} archivos pesan`} más de 25 MB y no ${pesados === 1 ? 'se adjuntó' : 'se adjuntaron'}.` : null} />
    </Dialogo>
  );
};

export interface InsumoGestion {
  item: string;
  total: number;
  unidad: string;
  disp?: string;
  pres?: string;
  para?: string;
  icono?: string;
  pausado?: boolean;
  confirmada?: number;
  camino?: number;
}

export interface DatosPublicacionGestion {
  id: string;
  tipo: 'oferta' | 'necesidad';
  titulo: string;
  org: string;
  verificada: boolean;
  zona: string;
  dir: string;
  descripcion: string;
  personaContacto: string;
  telContacto: string;
  comoEntrega: string;
  horario: string;
  recursos: InsumoGestion[];
  pausadaGlobal?: boolean;
}

/**
 * Diálogo integral para gestionar y editar una publicación (oferta o necesidad).
 * Integra una vista previa fiel a la tarjeta del Radar y un formulario de edición
 * completo para modificar título, descripción, ubicación, insumos y contacto.
 */
export const DialogoGestionPublicacion: React.FC<{
  abierto: boolean;
  publicacion: DatosPublicacionGestion | null;
  modoInicial?: 'vista' | 'editar';
  recursoFoco?: string;
  onCerrar: () => void;
  onGuardar: (datos: DatosPublicacionGestion) => void;
  onVerEnMapa?: (id: string) => void;
}> = ({
  abierto,
  publicacion: pubInicial,
  modoInicial = 'vista',
  recursoFoco,
  onCerrar,
  onGuardar,
  onVerEnMapa,
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [modo, setModo] = useState<'vista' | 'editar'>(modoInicial);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [zona, setZona] = useState('');
  const [dir, setDir] = useState('');
  const [comoEntrega, setComoEntrega] = useState('');
  const [horario, setHorario] = useState('');
  const [personaContacto, setPersonaContacto] = useState('');
  const [telContacto, setTelContacto] = useState('');
  const [recursos, setRecursos] = useState<InsumoGestion[]>([]);
  const [pausadaGlobal, setPausadaGlobal] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    else if (!abierto && d.open) d.close();
  }, [abierto]);

  useEffect(() => {
    if (abierto) {
      setModo(modoInicial);
    }
  }, [abierto, modoInicial]);

  useEffect(() => {
    if (pubInicial) {
      setTitulo(pubInicial.titulo);
      setDescripcion(pubInicial.descripcion);
      setZona(pubInicial.zona);
      setDir(pubInicial.dir);
      setComoEntrega(pubInicial.comoEntrega);
      setHorario(pubInicial.horario);
      setPersonaContacto(pubInicial.personaContacto);
      setTelContacto(pubInicial.telContacto);
      setRecursos(pubInicial.recursos.map((r) => ({ ...r })));
      setPausadaGlobal(pubInicial.pausadaGlobal ?? false);
    }
  }, [pubInicial]);

  const publicacionParaTarjeta: Publicacion | null = useMemo(() => {
    if (!pubInicial) return null;
    return {
      id: pubInicial.id,
      tipo: pubInicial.tipo,
      titulo: titulo || pubInicial.titulo,
      org: pubInicial.org,
      verificada: pubInicial.verificada,
      propia: true,
      lat: 4.51,
      lng: -74.115,
      zona: zona || pubInicial.zona,
      dir: dir || pubInicial.dir,
      descripcion: descripcion || pubInicial.descripcion,
      recursos: recursos.map((r) => ({
        item: r.item,
        unidad: r.unidad,
        total: r.total,
        tramos: [
          ...(r.confirmada ? [{ t: 'hecho' as const, cant: r.confirmada, quien: 'Entregas previas', cuando: 'Confirmada' }] : []),
          ...(r.camino ? [{ t: 'camino' as const, cant: r.camino, quien: 'En ruta', cuando: 'En camino' }] : []),
        ],
        ficha:
          pubInicial.tipo === 'oferta'
            ? [
                ['Disponibilidad', r.disp || 'Inmediata'],
                ['Cómo se entrega', comoEntrega || 'Lo llevamos · 15 km'],
              ]
            : [['Para quién', r.para || 'Comunidad afectada']],
      })),
    };
  }, [pubInicial, titulo, zona, dir, descripcion, recursos, comoEntrega]);

  if (!pubInicial) return null;

  const esOferta = pubInicial.tipo === 'oferta';

  const agregarRecurso = () => {
    setRecursos((prev) => [
      ...prev,
      {
        item: esOferta ? 'Nuevo insumo' : 'Nuevo requerimiento',
        total: 10,
        unidad: esOferta ? 'kits' : 'unidades',
        disp: esOferta ? 'Hasta agotar' : undefined,
        pres: esOferta ? 'Empaque original' : undefined,
        para: !esOferta ? 'Familias afectadas' : undefined,
        icono: esOferta ? 'package' : 'bolt',
        pausado: false,
        confirmada: 0,
        camino: 0,
      },
    ]);
  };

  const actualizarRecurso = (index: number, campo: keyof InsumoGestion, valor: string | number | boolean | undefined) => {
    setRecursos((prev) => prev.map((r, i) => (i === index ? { ...r, [campo]: valor } : r)));
  };

  const eliminarRecurso = (index: number) => {
    if (recursos.length <= 1) return;
    setRecursos((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePausaRecurso = (index: number) => {
    setRecursos((prev) => prev.map((r, i) => (i === index ? { ...r, pausado: !r.pausado } : r)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardar({
      ...pubInicial,
      titulo,
      descripcion,
      zona,
      dir,
      comoEntrega,
      horario,
      personaContacto,
      telContacto,
      recursos,
      pausadaGlobal,
    });
    onCerrar();
  };

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="font-rd m-auto w-full max-w-3xl rounded-rd-xl border border-rd-line bg-rd-surface p-0 text-rd-ink shadow-rd-2 backdrop:bg-rd-ink/30 max-sm:mx-4 max-sm:w-auto overflow-hidden"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-rd-line px-5 py-3 bg-rd-sunken/40">
        <div>
          <span className="text-rd-10 font-bold uppercase tracking-wider text-rd-ink-meta">
            {esOferta ? 'Publicación de Oferta' : 'Publicación de Necesidad'}
          </span>
          <h2 className="text-rd-16 font-semibold text-rd-ink">
            {pubInicial.titulo}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar diálogo"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Selector de modo (Pestañas) */}
      <div className="flex border-b border-rd-line bg-rd-sunken/20 px-5">
        <button
          type="button"
          onClick={() => setModo('vista')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-rd-13 font-semibold transition-colors cursor-pointer ${
            modo === 'vista'
              ? 'border-rd-navy text-rd-navy'
              : 'border-transparent text-rd-ink-meta hover:text-rd-ink'
          }`}
        >
          <Eye className="h-4 w-4" />
          Vista previa (Radar)
        </button>
        <button
          type="button"
          onClick={() => setModo('editar')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-rd-13 font-semibold transition-colors cursor-pointer ${
            modo === 'editar'
              ? 'border-rd-navy text-rd-navy'
              : 'border-transparent text-rd-ink-meta hover:text-rd-ink'
          }`}
        >
          <Edit3 className="h-4 w-4" />
          Editar publicación
        </button>
      </div>

      {/* Contenido según modo */}
      {modo === 'vista' ? (
        <div className="max-h-[72vh] overflow-y-auto p-5 bg-rd-fondo/30 space-y-4">
          <div className="rounded-rd-xl bg-rd-surface border border-rd-line p-1">
            {publicacionParaTarjeta && (
              <Tarjeta
                publicacion={publicacionParaTarjeta}
                onVerEnMapa={() => {
                  onCerrar();
                  onVerEnMapa?.(pubInicial.id);
                }}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rd-line pt-4">
            <span className="text-rd-12 text-rd-ink-meta">
              Así es como ven esta publicación los demás actores en el mapa del Radar.
            </span>
            <div className="flex items-center gap-2">
              <Button nivel="secundario" tamano="md" onClick={() => onVerEnMapa?.(pubInicial.id)}>
                Ver en el mapa
              </Button>
              <Button nivel="primario" tamano="md" onClick={() => setModo('editar')}>
                Editar esta publicación
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="max-h-[68vh] overflow-y-auto p-5 space-y-6">
            {/* 1. Contexto general */}
            <div className="rounded-rd-lg border border-rd-line bg-rd-surface p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-rd-14 font-semibold text-rd-ink">
                  1. Información general
                </h3>
                <span className="text-rd-12 text-rd-ink-meta">Visible en el Radar</span>
              </div>

              <Field
                id="pub-titulo"
                etiqueta="Título de la publicación"
                valor={titulo}
                onChange={setTitulo}
                ayuda="Describe claramente qué se ofrece o qué hace falta"
                requerido
              />

              <div>
                <label className="mb-1 block text-rd-13 font-medium text-rd-ink">
                  Descripción y contexto de la situación
                </label>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalla la situación del albergue, la capacidad de la brigada o las condiciones de entrega..."
                  className="w-full rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 text-rd-14 text-rd-ink placeholder:text-rd-ink-meta focus:border-rd-navy focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Ubicación y Logística */}
            <div className="rounded-rd-lg border border-rd-line bg-rd-surface p-4 space-y-4">
              <h3 className="text-rd-14 font-semibold text-rd-ink">
                2. Ubicación y logística de entrega
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="pub-zona"
                  etiqueta="Zona o barrio"
                  valor={zona}
                  onChange={setZona}
                  requerido
                />
                <Field
                  id="pub-dir"
                  etiqueta="Dirección o punto de referencia"
                  valor={dir}
                  onChange={setDir}
                  requerido
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="pub-comoEntrega"
                  etiqueta={esOferta ? 'Modalidad de entrega / Cobertura' : 'Cómo se recibe la ayuda'}
                  valor={comoEntrega}
                  onChange={setComoEntrega}
                  ayuda={esOferta ? 'Ej: Lo llevamos · 15 km o Entrega en estación' : 'Ej: Acopio en colegio o Recibimos en sitio'}
                />
                <Field
                  id="pub-horario"
                  etiqueta="Horario / Disponibilidad"
                  valor={horario}
                  onChange={setHorario}
                  ayuda="Ej: Lunes a domingo 8:00 a 18:00"
                />
              </div>
            </div>

            {/* 3. Recursos e Insumos */}
            <div className="rounded-rd-lg border border-rd-line bg-rd-surface p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-rd-14 font-semibold text-rd-ink">
                    3. Insumos y recursos de la publicación
                  </h3>
                  <p className="text-rd-12 text-rd-ink-meta">
                    Modifica metas, cantidades, unidades o añade nuevos recursos a esta publicación.
                  </p>
                </div>
                <Button
                  type="button"
                  nivel="secundario"
                  tamano="sm"
                  onClick={agregarRecurso}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Agregar insumo
                </Button>
              </div>

              <div className="space-y-3">
                {recursos.map((r, i) => {
                  const estaEnfocado = recursoFoco === r.item;
                  return (
                    <div
                      key={i}
                      className={`rounded-rd-md border p-3 transition-colors ${
                        estaEnfocado
                          ? 'border-rd-navy bg-rd-navy-surface/30'
                          : r.pausado
                          ? 'border-rd-amber-line bg-rd-amber-surface/20'
                          : 'border-rd-line bg-rd-sunken/30'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-rd-12 font-bold text-rd-ink-2">
                            #{i + 1}
                          </span>
                          <span className="text-rd-13 font-semibold text-rd-ink">
                            {r.item || 'Insumo sin nombre'}
                          </span>
                          {r.pausado && (
                            <span className="rounded-full bg-rd-amber-surface border border-rd-amber-line px-2 py-0.5 text-rd-10 font-bold uppercase tracking-wider text-rd-amber-ink">
                              Pausado
                            </span>
                          )}
                          {estaEnfocado && (
                            <span className="rounded-full bg-rd-navy-surface border border-rd-navy-line px-2 py-0.5 text-rd-10 font-bold uppercase tracking-wider text-rd-navy">
                              Seleccionado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            nivel="terciario"
                            tamano="sm"
                            onClick={() => togglePausaRecurso(i)}
                          >
                            {r.pausado ? 'Reanudar' : 'Pausar'}
                          </Button>
                          {recursos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => eliminarRecurso(i)}
                              aria-label={`Eliminar ${r.item}`}
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-coral transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        <Field
                          id={`item-${i}`}
                          etiqueta="Nombre del insumo"
                          valor={r.item}
                          onChange={(v) => actualizarRecurso(i, 'item', v)}
                          requerido
                        />
                        <Field
                          id={`total-${i}`}
                          etiqueta="Cantidad total"
                          tipo="text"
                          inputMode="numeric"
                          valor={String(r.total)}
                          onChange={(v) => actualizarRecurso(i, 'total', Math.max(0, Number(v) || 0))}
                          requerido
                        />
                        <Field
                          id={`unidad-${i}`}
                          etiqueta="Unidad"
                          valor={r.unidad}
                          onChange={(v) => actualizarRecurso(i, 'unidad', v)}
                          requerido
                        />
                      </div>

                      {esOferta ? (
                        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <Field
                            id={`pres-${i}`}
                            etiqueta="Presentación / Empaque"
                            valor={r.pres || ''}
                            onChange={(v) => actualizarRecurso(i, 'pres', v)}
                          />
                          <Field
                            id={`disp-${i}`}
                            etiqueta="Disponibilidad"
                            valor={r.disp || ''}
                            onChange={(v) => actualizarRecurso(i, 'disp', v)}
                          />
                        </div>
                      ) : (
                        <div className="mt-2.5">
                          <Field
                            id={`para-${i}`}
                            etiqueta="¿Para quién o para qué es?"
                            valor={r.para || ''}
                            onChange={(v) => actualizarRecurso(i, 'para', v)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Contacto de coordinación */}
            <div className="rounded-rd-lg border border-rd-line bg-rd-surface p-4 space-y-4">
              <h3 className="text-rd-14 font-semibold text-rd-ink">
                4. Contacto de coordinación para esta publicación
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="pub-personaContacto"
                  etiqueta="Persona responsable"
                  valor={personaContacto}
                  onChange={setPersonaContacto}
                />
                <Field
                  id="pub-telContacto"
                  etiqueta="Teléfono móvil / WhatsApp"
                  valor={telContacto}
                  onChange={setTelContacto}
                />
              </div>
            </div>
          </div>

          {/* Pie de edición */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rd-line bg-rd-sunken/40 px-5 py-3">
            <button
              type="button"
              onClick={() => setPausadaGlobal((p) => !p)}
              className="text-rd-13 font-semibold text-rd-amber-ink hover:underline cursor-pointer"
            >
              {pausadaGlobal ? 'Reanudar toda la publicación' : 'Pausar toda la publicación'}
            </button>
            <div className="flex items-center gap-2">
              <Button type="button" nivel="terciario" tamano="md" onClick={() => setModo('vista')}>
                Cancelar
              </Button>
              <Button type="submit" nivel="primario" tamano="md">
                Guardar cambios
              </Button>
            </div>
          </div>
        </form>
      )}
    </dialog>
  );
};
