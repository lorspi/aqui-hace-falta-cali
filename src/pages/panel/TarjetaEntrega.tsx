import { Archive, Check, CircleDashed, CircleDot, Clock, Eye, MapPin, Package, Phone, Truck, Users, X } from 'lucide-react';
import type { EntregaRecibida, MiembroEquipo, Solicitud } from '../../types/panel';
import { EQUIPO } from '../../mocks/panelMock';
import { ENTIDADES } from '../../mocks/directorioMock';
import { cuentaFotos, fotosDeEntrega, fotosDeRecibida, listaFotos } from '../../mocks/fotosMock';
import { cifra, iniciales } from '../../utils/publicaciones';
import { textoCierre } from '../../utils/panel';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Etiqueta';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { IconoRecursoDe, iconoDe } from '../../components/ui/Recursos';
import { IconoWhatsApp } from '../../components/ui/IconoMarca';
import { TiraFotos } from '../../components/ui/VisorFotos';

export interface ContactoEntidad {
  tel: string;
  wa?: boolean;
  nombre: string;
  lider?: string;
}

export function buscarContactoEntidad(nombre: string): ContactoEntidad | null {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  const n = norm(nombre);
  const found = ENTIDADES.find((e) => {
    const en = norm(e.nombre);
    return en.includes(n) || n.includes(en);
  });
  if (found) {
    return { tel: found.tel, wa: found.wa, nombre: found.nombre, lider: found.lider };
  }
  return { tel: '+57 312 555 0100', wa: true, nombre };
}

/**
 * La tarjeta de una entrega, una sola para todo el panel (Alejandro, 16 de septiembre de 2026:
 * «casi todas muestran la misma información pero de manera diferente»). La usan el tablero de
 * seguimiento, Solicitudes y Entregas recibidas bajo 1280. Anatomía fija:
 *
 *   1. Título = QUÉ («200 L de agua potable»), en negrita; el chip de estado a la derecha cuando
 *      la tarjeta está fuera del tablero (allí la columna ya lo dice).
 *   2. Meta = QUIÉN · CUÁNDO · DISTANCIA (pin, reloj, camión), 12 en gris; «hoy» en ámbar.
 *   3. Chip del recurso · quién la lleva; el detalle y el cierre con sus fotos, si los hay.
 *   4. Pie: línea arriba, botones `sm` a la izquierda con el primario primero, el ⋮ a la
 *      derecha. Nunca a lo ancho.
 */
export interface TarjetaEntregaProps {
  titulo: string;
  quien: string;
  cuando: string;
  dist?: string;
  recurso: string;
  /** Quién la lleva o la trae, ya resuelto a texto («Mateo Rojas · Camioneta 4×4»). */
  lleva?: string | null;
  detalle?: string;
  estado?: React.ReactNode;
  cierre?: React.ReactNode;
  fotos?: React.ReactNode;
  acciones?: React.ReactNode;
  menu?: React.ReactNode;
  contacto?: ContactoEntidad | null;
  /** Sin quien la lleve: borde punteado. */
  sinAsignar?: boolean;
  atenuada?: boolean;
  /** Para arrastrarla en el tablero. */
  arrastre?: { draggable: boolean; onDragStart: (e: React.DragEvent) => void };
}

export const TarjetaEntrega: React.FC<TarjetaEntregaProps> = ({
  titulo,
  quien,
  cuando,
  dist,
  recurso,
  lleva,
  detalle,
  estado,
  cierre,
  fotos,
  acciones,
  menu,
  contacto,
  sinAsignar = false,
  atenuada = false,
  arrastre,
}) => {
  const hoy = /hoy|ahora/.test(cuando);
  return (
    <article
      draggable={arrastre?.draggable}
      onDragStart={arrastre?.onDragStart}
      className={`flex flex-col rounded-rd-md border border-rd-line bg-rd-surface p-3 text-rd-13 transition-transform hover:-translate-y-px ${
        arrastre?.draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${atenuada ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <b className="text-rd-13-5 leading-snug font-semibold text-rd-ink">{titulo}</b>
        {estado && <span className="shrink-0">{estado}</span>}
      </div>
      <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-rd-12 text-rd-ink-2">
        <span className="flex items-center gap-1.5">
          <MapPin aria-hidden="true" className="h-3.25 w-3.25 shrink-0 text-rd-ink-3" />
          <span className="font-medium text-rd-ink">{quien}</span>
        </span>
        <span className={`flex items-center gap-1 ${hoy ? 'font-medium text-rd-amber-ink' : ''}`}>
          <Clock aria-hidden="true" className="h-3.25 w-3.25 shrink-0 text-rd-ink-3" />
          {cuando}
        </span>
        {dist && (
          <span className="flex items-center gap-1">
            <Truck aria-hidden="true" className="h-3.25 w-3.25 shrink-0 text-rd-ink-3" />
            {dist}
          </span>
        )}
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-rd-sm bg-rd-sunken px-2 py-0.5 text-rd-11-5 font-medium text-rd-ink-2">
          <IconoRecursoDe nombre={iconoDe(recurso)} className="h-3.25 w-3.25" />
          {recurso}
        </span>
        {lleva && (
          <span className="flex min-w-0 items-center gap-1.5 text-rd-12 text-rd-ink-2">
            <Avatar iniciales={iniciales(lleva.split(' · ')[0])} tamano="xs" />
            <span className="truncate">{lleva}</span>
          </span>
        )}
      </span>
      {detalle && <span className="mt-2 text-rd-12-5 text-rd-ink-2">{detalle}</span>}
      {cierre}
      {fotos}
      {(acciones || menu) && (
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-rd-line-soft pt-2">
          {acciones}
          {menu && <span className="ml-auto">{menu}</span>}
        </div>
      )}
    </article>
  );
};

/* ---------- las piezas por estado, compartidas por el tablero y Solicitudes ---------- */

export interface AccionesSolicitud {
  onAceptar: (id: number) => void;
  onRechazar: (id: number) => void;
  onMover: (id: number, e: Solicitud['estado']) => void;
  onEnCamino?: (s: Solicitud) => void;
  onAsignar: (s: Solicitud) => void;
  onRecordar: (id: number) => void;
  onCertificar: (s: Solicitud) => void;
  onArchivar: (id: number) => void;
  onCancelar: (s: Solicitud) => void;
  onVerFotos: (s: Solicitud, i: number) => void;
  onVerPublicacion?: (s: Solicitud) => void;
}

export function quienLleva(s: Solicitud, eq: MiembroEquipo[] = EQUIPO): string | null {
  const v = s.vol ? eq.find((x) => x.id === s.vol) : null;
  return v ? `${v.n} · ${v.veh}` : null;
}

/** Los botones del paso: el siguiente paso es el único primario, a lo sumo un secundario. */
export function accionesDe(s: Solicitud, a: AccionesSolicitud): React.ReactNode {
  const v = quienLleva(s);
  switch (s.estado) {
    case 'nueva':
      return (
        <>
          <Button nivel="primario" tamano="sm" onClick={() => a.onAceptar(s.id)}>
            Aceptar
          </Button>
          <Button nivel="secundario" tamano="sm" onClick={() => a.onRechazar(s.id)}>
            No podemos
          </Button>
        </>
      );
    case 'aceptada':
      return (
        <>
          {!v && (
            <Button nivel="primario" tamano="sm" onClick={() => a.onAsignar(s)}>
              Asignar
            </Button>
          )}
          <Button
            nivel={v ? 'primario' : 'secundario'}
            tamano="sm"
            disabled={!v}
            title={v ? undefined : 'Asigna primero a alguien'}
            onClick={() => (a.onEnCamino ? a.onEnCamino(s) : a.onMover(s.id, 'camino'))}
          >
            Marcar en camino
          </Button>
        </>
      );
    case 'camino':
      return (
        <Button nivel="primario" tamano="sm" onClick={() => a.onMover(s.id, 'entregada')}>
          Marcar entregada
        </Button>
      );
    case 'entregada':
      return (
        <>
          <Button nivel="primario" tamano="sm" onClick={() => a.onCertificar(s)}>
            Certificar entrega
          </Button>
          <Button nivel="secundario" tamano="sm" onClick={() => a.onRecordar(s.id)}>
            Recordar
          </Button>
        </>
      );
    case 'confirmada':
      return (
        <Button nivel="secundario" tamano="sm" onClick={() => a.onArchivar(s.id)}>
          Archivar
        </Button>
      );
    case 'archivada':
      return (
        <span className="flex min-w-0 items-center gap-1 text-rd-11-5 font-medium text-rd-ink-meta">
          <Archive aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span>Archivada</span>
        </span>
      );
  }
}

/** El ⋮: comunicarse con la entidad, reasignar y cancelar. */
export function menuDe(s: Solicitud, a: AccionesSolicitud, flotante = false): React.ReactNode {
  const contacto = buscarContactoEntidad(s.quien);
  const v = quienLleva(s);
  const puedeModificar = s.estado === 'aceptada' || s.estado === 'camino';

  const items: { texto: string; icono: React.ReactNode; tono?: 'peligro'; onElegir: () => void }[] = [];

  if (a.onVerPublicacion) {
    items.push({
      texto: 'Ver publicación completa',
      icono: <Eye className="h-4 w-4" />,
      onElegir: () => a.onVerPublicacion!(s),
    });
  }

  if (contacto) {
    items.push({
      texto: `Llamar (${contacto.tel})`,
      icono: <Phone className="h-4 w-4" />,
      onElegir: () => {
        window.location.href = `tel:${contacto.tel.replace(/\s/g, '')}`;
      },
    });
    if (contacto.wa) {
      items.push({
        texto: 'Escribir por WhatsApp',
        icono: <IconoWhatsApp className="h-4 w-4" />,
        onElegir: () => {
          window.open(`https://wa.me/${contacto.tel.replace(/\D/g, '')}`, '_blank', 'noopener');
        },
      });
    }
  }

  if (s.estado === 'camino') {
    items.push({
      texto: 'Entregar y certificar',
      icono: <Check className="h-4 w-4" />,
      onElegir: () => a.onCertificar(s),
    });
  }

  if (s.estado === 'confirmada') {
    if (!s.cierre?.recibe) {
      items.push({
        texto: 'Recordar confirmación a la entidad',
        icono: <Clock className="h-4 w-4" />,
        onElegir: () => a.onRecordar(s.id),
      });
    }
    if (!s.cierre?.entrega) {
      items.push({
        texto: 'Adjuntar soporte / certificación',
        icono: <Check className="h-4 w-4" />,
        onElegir: () => a.onCertificar(s),
      });
    }
  }

  if (puedeModificar) {
    if (v) {
      items.push({
        texto: 'Reasignar',
        icono: <Users aria-hidden="true" className="h-4.5 w-4.5" />,
        onElegir: () => a.onAsignar(s),
      });
    }
    items.push({
      texto: 'Cancelar el compromiso',
      icono: <X aria-hidden="true" className="h-4.5 w-4.5" />,
      tono: 'peligro',
      onElegir: () => a.onCancelar(s),
    });
  }

  if (items.length === 0) return null;

  return (
    <MenuAcciones
      tamano="sm"
      flotante={flotante}
      etiqueta={`Opciones sobre la entrega a ${s.quien}`}
      items={items}
    />
  );
}

/** El ⋮ de ayuda recibida: comunicarse con la organización que entrega. */
export function menuDeRecibida(
  r: EntregaRecibida,
  flotante = false,
  onVerPublicacion?: (r: EntregaRecibida) => void
): React.ReactNode {
  const contacto = buscarContactoEntidad(r.org);
  const items: { texto: string; icono: React.ReactNode; tono?: 'peligro'; onElegir: () => void }[] = [];

  if (onVerPublicacion) {
    items.push({
      texto: 'Ver publicación completa',
      icono: <Eye className="h-4 w-4" />,
      onElegir: () => onVerPublicacion(r),
    });
  }

  if (contacto) {
    items.push({
      texto: `Llamar (${contacto.tel})`,
      icono: <Phone className="h-4 w-4" />,
      onElegir: () => {
        window.location.href = `tel:${contacto.tel.replace(/\s/g, '')}`;
      },
    });
    if (contacto.wa) {
      items.push({
        texto: 'Escribir por WhatsApp',
        icono: <IconoWhatsApp className="h-4 w-4" />,
        onElegir: () => {
          window.open(`https://wa.me/${contacto.tel.replace(/\D/g, '')}`, '_blank', 'noopener');
        },
      });
    }
  }

  if (items.length === 0) return null;

  return (
    <MenuAcciones
      tamano="sm"
      flotante={flotante}
      etiqueta={`Contacto con ${r.org}`}
      items={items}
    />
  );
}

/** El cierre de una entrega confirmada o archivada: quién confirmó, y las fotos como galería. */
export function cierreDe(s: Solicitud, onVerFotos: (s: Solicitud, i: number) => void): { cierre: React.ReactNode; fotos: React.ReactNode } {
  const f = fotosDeEntrega(s.id);
  const fotosNodo = cuentaFotos(f) > 0 ? <TiraFotos fotos={listaFotos(f)} max={4} tamano="sm" onAbrir={(i) => onVerFotos(s, i)} className="mt-2" /> : null;
  if (s.estado !== 'confirmada' && s.estado !== 'archivada') return { cierre: null, fotos: fotosNodo };
  return {
    cierre: (
      <span className={`mt-2 flex items-start gap-1 text-rd-11-5 font-semibold ${s.cierre?.entrega && s.cierre.recibe ? 'text-rd-green' : 'text-rd-ink-2'}`}>
        <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rd-green" />
        <span>{textoCierre(s)}</span>
      </span>
    ),
    fotos: fotosNodo,
  };
}

/** La tarjeta de una solicitud (lo que YO entrego) con todo resuelto desde su estado. */
export const TarjetaSolicitud: React.FC<{ s: Solicitud; acciones: AccionesSolicitud; estado?: React.ReactNode; arrastre?: TarjetaEntregaProps['arrastre']; menuFlotante?: boolean }> = ({ s, acciones, estado, arrastre, menuFlotante = false }) => {
  const { cierre, fotos } = cierreDe(s, acciones.onVerFotos);
  const lleva = quienLleva(s);
  const contacto = buscarContactoEntidad(s.quien);
  return (
    <TarjetaEntrega
      titulo={`${cifra(s.cant)} ${s.u} de ${s.rec.toLowerCase()}`}
      quien={s.quien}
      cuando={s.cuando}
      dist={s.dist}
      recurso={s.rec}
      lleva={lleva}
      contacto={contacto}
      estado={estado}
      cierre={cierre}
      fotos={fotos}
      acciones={accionesDe(s, acciones)}
      menu={menuDe(s, acciones, menuFlotante)}
      sinAsignar={!lleva && s.estado !== 'nueva' && s.estado !== 'confirmada' && s.estado !== 'archivada'}
      atenuada={s.estado === 'archivada'}
      arrastre={arrastre}
    />
  );
};

/** La tarjeta de una entrega recibida (lo que ME traen). */
export const TarjetaRecibida: React.FC<{
  r: EntregaRecibida;
  estado?: React.ReactNode;
  onConfirmar: (id: number) => void;
  onDistribuir?: (r: EntregaRecibida) => void;
  onArchivar?: (id: number) => void;
  onVerFotos: (r: EntregaRecibida, i: number) => void;
  onAceptar?: (id: number) => void;
  onRechazar?: (id: number) => void;
  onVerPublicacion?: (r: EntregaRecibida) => void;
  menuFlotante?: boolean;
  arrastre?: TarjetaEntregaProps['arrastre'];
}> = ({ r, estado, onConfirmar, onDistribuir, onArchivar, onVerFotos, onAceptar, onRechazar, onVerPublicacion, menuFlotante = false, arrastre }) => {
  const f = fotosDeRecibida(r.id);
  const contacto = buscarContactoEntidad(r.org);
  const acciones = (() => {
    if (r.estado === 'nueva') {
      return (
        <>
          {onAceptar && (
            <Button nivel="primario" tamano="sm" onClick={() => onAceptar(r.id)}>
              Aceptar ayuda
            </Button>
          )}
          {onRechazar && (
            <Button nivel="secundario" tamano="sm" onClick={() => onRechazar(r.id)}>
              No gracias
            </Button>
          )}
        </>
      );
    }
    if (r.estado === 'entregada') {
      return (
        <Button nivel="primario" tamano="sm" onClick={() => onConfirmar(r.id)}>
          Confirmar recibido
        </Button>
      );
    }
    if (r.estado === 'confirmada') {
      return (
        <>
          {onDistribuir && (
            <Button nivel="primario" tamano="sm" onClick={() => onDistribuir(r)}>
              Registrar distribución
            </Button>
          )}
        </>
      );
    }
    if (r.estado === 'distribuida') {
      return (
        <>
          {onArchivar && (
            <Button nivel="secundario" tamano="sm" onClick={() => onArchivar(r.id)}>
              Archivar
            </Button>
          )}
        </>
      );
    }
    return null;
  })();

  const badgeEstado = estado ?? (() => {
    if (r.estado === 'aceptada') {
      return (
        <span className="inline-flex items-center gap-1 rounded-rd-full border border-rd-line bg-rd-sunken px-2 py-0.5 text-rd-11 font-medium text-rd-ink-2">
          <CircleDashed aria-hidden="true" className="h-3 w-3 shrink-0 text-rd-ink-3" />
          <span>Coordinando</span>
        </span>
      );
    }
    if (r.estado === 'camino') {
      return (
        <span className="inline-flex items-center gap-1 rounded-rd-full border border-rd-amber-line bg-rd-amber-soft px-2 py-0.5 text-rd-11 font-medium text-rd-amber-ink">
          <Truck aria-hidden="true" className="h-3 w-3 shrink-0 text-rd-amber-ink" />
          <span>En ruta</span>
        </span>
      );
    }
    if (r.estado === 'entregada') {
      return (
        <span className="inline-flex items-center gap-1 rounded-rd-full border border-rd-navy-line bg-rd-navy-soft px-2 py-0.5 text-rd-11 font-semibold text-rd-navy">
          <CircleDot aria-hidden="true" className="h-3 w-3 shrink-0 text-rd-navy" />
          <span>Por confirmar</span>
        </span>
      );
    }
    return null;
  })();

  const cierre = (() => {
    if (r.estado === 'confirmada') {
      return (
        <span className="mt-2 flex items-start gap-1 text-rd-11-5 font-semibold text-rd-green">
          <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rd-green" />
          <span>Recibido en acopio</span>
        </span>
      );
    }
    if (r.estado === 'distribuida') {
      return (
        <div className="mt-2 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-start gap-1 text-rd-11-5 font-semibold text-rd-green">
              <Users aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rd-green" />
              <span>Distribuido en la comunidad</span>
            </span>
            {r.cierre?.personasBeneficiadas && (
              <span className="rounded-rd-full bg-rd-green-soft px-2 py-0.5 text-rd-11 font-medium text-rd-green">
                {r.cierre.personasBeneficiadas} {r.cierre.personasBeneficiadas === 1 ? 'persona beneficiada' : 'personas beneficiadas'}
              </span>
            )}
          </div>
          {r.cierre?.historia && (
            <p className="m-0 text-rd-12 leading-relaxed text-rd-ink-2 italic">
              «{r.cierre.historia}»
            </p>
          )}
        </div>
      );
    }
    if (r.estado === 'archivada') {
      return (
        <span className="mt-2 flex items-start gap-1 text-rd-11-5 font-semibold text-rd-ink-meta">
          <Archive aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Archivada</span>
        </span>
      );
    }
    return null;
  })();

  return (
    <TarjetaEntrega
      titulo={`${cifra(r.cant)} ${r.u} de ${r.rec.toLowerCase()}`}
      quien={r.org}
      cuando={r.cuando}
      dist={r.dist}
      recurso={r.rec}
      lleva={r.vol}
      contacto={contacto}
      detalle={r.detalle}
      estado={badgeEstado}
      cierre={cierre}
      fotos={cuentaFotos(f) > 0 ? <TiraFotos fotos={listaFotos(f)} max={4} tamano="sm" onAbrir={(i) => onVerFotos(r, i)} className="mt-2" /> : null}
      acciones={acciones}
      menu={menuDeRecibida(r, menuFlotante, onVerPublicacion)}
      atenuada={r.estado === 'archivada'}
      arrastre={arrastre}
    />
  );
};
