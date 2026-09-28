import React, { useState } from 'react';
import { BadgeCheck, Clock, Copy, ExternalLink, Flag, Mail, Map as MapIcon, MapPin, Maximize2, Phone, Share2, Users } from 'lucide-react';
import type { CoincidenciaPublicacion } from '../../utils/cruce';
import { ResumenCoincidencias } from './Coincidencias';
import type { Publicacion } from '../../types/publicacion';
import { actorPublicacion, distanciaTexto, estadoPublicacion, iniciales } from '../../utils/publicaciones';
import { sanitizeExternalUrl } from '../../utils/formatters';
import { TituloPublicacion } from './TituloPublicacion';
import { Button } from './Button';
import { MenuAcciones, type ItemMenu } from './MenuAcciones';
import { TiraFotos, VisorFotos } from './VisorFotos';
import { Avatar, EtiquetaEstado, EtiquetaTipo } from './Etiqueta';
import { Donde } from './Donde';
import { Recursos } from './Recursos';
import { IconoWhatsApp } from './IconoMarca';
import { useAviso } from './AvisoCorto';

/**
 * La tarjeta de una publicación (`rd-tarjeta` del prototipo): etiquetas de tipo y estado,
 * quién, descripción, dónde (con la distancia debajo, 195), el bloque de recursos, la
 * las coincidencias del cruce (la mejor en una línea y el botón que abre la lista) y las acciones. Una sola primaria por tarjeta: «Solicitar» en una
 * oferta, «Quiero ayudar» en una necesidad (223, C1). El contacto y lo ocasional van en el
 * ⋮ (C6). Dentro de la hoja del pin (`enHoja`) va sin borde y con las acciones pegadas abajo.
 */
export interface TarjetaProps {
  publicacion: Publicacion;
  distanciaKm?: number | null;
  /** Las coincidencias del cruce (el «Radar Match»); sin ninguna, no se pinta el bloque. */
  coincidencias?: CoincidenciaPublicacion[];
  enHoja?: boolean;
  onVerEnMapa?: (id: string) => void;
  onPrimaria?: (id: string) => void;
  /** Texto personalizado para el botón de acción principal */
  textoPrimaria?: string;
  /** Abrir la lista de coincidencias de esta publicación. */
  onVerCoincidencias?: (id: string) => void;
  onCompartir?: (id: string) => void;
  onReportar?: (id: string) => void;
  /** Callback para abrir la ficha o tarjeta completa en un modal */
  onVerDetalle?: (id: string) => void;
  /** Si es true, muestra la información completa sin truncar descripción ni recursos */
  completa?: boolean;
  /** La persona ya se comprometió o solicitó en esta sesión: pasa a «En proceso». */
  enProceso?: boolean;
  /** Para que quien la use la esconda en un ancho. */
  className?: string;
}

export const Tarjeta: React.FC<TarjetaProps> = ({
  publicacion: p,
  distanciaKm,
  coincidencias = [],
  enHoja = false,
  enProceso = false,
  completa = false,
  textoPrimaria,
  className = '',
  onVerEnMapa,
  onPrimaria,
  onVerCoincidencias,
  onCompartir,
  onReportar,
  onVerDetalle,
}) => {
  const esOferta = p.tipo === 'oferta';
  const dist = distanciaTexto(distanciaKm);
  const estado = estadoPublicacion(p);
  const avisar = useAviso();
  /* La foto abierta en el visor (índice), o ninguna. */
  const [foto, setFoto] = useState<number | null>(null);
  /* Expansión inline de texto cuando la descripción es larga */
  const [expandirTexto, setExpandirTexto] = useState(false);
  /* Cubierta: ya no hay nada que pedir ni que dar; la primaria se queda, pero apagada, y el
     título dice por qué (`rdBloquearCompletadas` del prototipo). */
  const cubierta = estado === 'cubierta';

  const copiarEnlace = (ev?: React.MouseEvent) => {
    ev?.stopPropagation();
    const url = `${window.location.origin}/mapa-ayudas-necesidades?punto=${p.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        avisar('Enlace copiado al portapapeles', { tipo: 'ok' });
      }).catch(() => {
        avisar('No se pudo copiar el enlace', { tipo: 'error' });
      });
    } else {
      avisar('Portapapeles no disponible', { tipo: 'error' });
    }
  };

  const copiarDireccion = (ev?: React.MouseEvent) => {
    ev?.stopPropagation();
    const dir = p.dir || (p.localidad ? `${p.zona}, ${p.localidad}` : p.zona);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(dir).then(() => {
        avisar('Dirección copiada al portapapeles', { tipo: 'ok' });
      }).catch(() => {
        avisar('No se pudo copiar la dirección', { tipo: 'error' });
      });
    } else {
      avisar('Portapapeles no disponible', { tipo: 'error' });
    }
  };

  const itemsMenu: ItemMenu[] = [
    ...(onCompartir
      ? [{ texto: 'Compartir', icono: <Share2 aria-hidden="true" className="h-4.5 w-4.5" />, onElegir: () => onCompartir(p.id) }]
      : [
          {
            texto: 'Copiar enlace',
            icono: <Share2 aria-hidden="true" className="h-4.5 w-4.5" />,
            onElegir: copiarEnlace,
          },
        ]),
    ...(p.dir || p.zona
      ? [
          {
            texto: 'Copiar dirección',
            icono: <Copy aria-hidden="true" className="h-4.5 w-4.5" />,
            onElegir: copiarDireccion,
          },
        ]
      : []),
    ...(p.sourceUrl
      ? [
          {
            texto: 'Abrir enlace oficial',
            icono: <ExternalLink aria-hidden="true" className="h-4.5 w-4.5" />,
            onElegir: () => {
              window.open(sanitizeExternalUrl(p.sourceUrl!), '_blank', 'noopener,noreferrer');
            },
          },
        ]
      : []),
    ...(!p.propia && onReportar
      ? [
          {
            texto: 'Reportar',
            icono: <Flag aria-hidden="true" className="h-4.5 w-4.5" />,
            onElegir: () => onReportar(p.id),
            tono: 'peligro' as const,
          },
        ]
      : []),
  ];

  return (
    /* La tarjeta no se selecciona al tocarla (Alejandro, 21 de septiembre de 2026: «no estamos
       seleccionando nada»); solo responde al hover como en el DS (`pantalla.css:752`: borde
       navy-line y sombra leve). Las acciones son sus botones. */
    <article
      data-punto={p.id}
      className={`${
        enHoja
          ? 'relative flex min-h-full flex-col bg-rd-surface'
          : 'relative flex flex-col rounded-rd-xl border border-rd-line bg-rd-surface p-3.5 sm:p-3.5 max-sm:p-3 transition duration-200 hover:border-rd-navy-line hover:shadow-xs'
      } ${className}`}
    >
      <div className="mb-2.5 max-sm:mb-2 flex items-center justify-between gap-2">
        <EtiquetaTipo tipo={p.tipo} />
        <div className="flex items-center gap-1.5">
          {!completa && p.contactoWa && (
            <span className="inline-flex items-center gap-1 rounded-rd-sm bg-rd-green-soft px-1.5 py-0.5 text-rd-11 font-medium text-rd-green">
              <IconoWhatsApp className="h-3 w-3 shrink-0" />
              <span>WhatsApp</span>
            </span>
          )}
          <EtiquetaEstado estado={enProceso && estado === 'inicial' ? 'proceso' : estado} />
        </div>
      </div>

      <div className="mb-2 max-sm:mb-1.5">
        {/* El título canónico institucional siempre une los recursos con el actor (organización o comunidad). */}
        <h3
          className={`font-rd m-0 text-rd-14 font-semibold leading-snug text-rd-ink ${
            onVerDetalle && !completa ? 'cursor-pointer hover:text-rd-navy hover:underline transition-colors' : ''
          }`}
          onClick={() => {
            if (onVerDetalle && !completa) onVerDetalle(p.id);
          }}
        >
          <TituloPublicacion publicacion={p} actor />
        </h3>
        {p.org && p.perfil !== 'individual' && p.org !== actorPublicacion(p) && (
          <div className="mt-1 flex items-center gap-1.5">
            <Avatar iniciales={iniciales(p.org)} tamano="xs" />
            <span className="truncate text-rd-11-5 font-medium text-rd-ink-2">{p.org}</span>
            {p.verificada && <BadgeCheck role="img" aria-label="Organización verificada" className="h-3.5 w-3.5 shrink-0 text-rd-navy" />}
          </div>
        )}
      </div>

      {/* El orden de la tarjeta (Alejandro, 22 de septiembre de 2026): etiquetas, quién, dónde,
          qué dice, fotos y recursos. Dónde va antes de la descripción: sitúa lo que se lee
          después. Sin rótulo de bloque (16 de septiembre): el pin ya dice que es un lugar. */}
      <Donde lugar={p.dir ?? `${p.zona}${p.localidad ? `, ${p.localidad}` : ''}`} distancia={dist ?? undefined} className="mb-2 max-sm:mb-1.5" />

      {p.descripcion && (
        <div className="mb-2.5 max-sm:mb-2">
          <p className={`text-rd-13 leading-relaxed text-rd-ink-2 ${completa || expandirTexto ? '' : 'line-clamp-2'}`}>
            {p.descripcion}
          </p>
          {!completa && p.descripcion.length > 90 && (
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation();
                setExpandirTexto((prev) => !prev);
              }}
              className="mt-0.5 inline-block text-rd-11-5 font-semibold text-rd-navy hover:underline cursor-pointer"
            >
              {expandirTexto ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
      )}

      {p.fotos && p.fotos.length > 0 && (
        <>
          <TiraFotos fotos={p.fotos} onAbrir={setFoto} etiqueta className="mb-3 max-sm:mb-2.5" />
          <VisorFotos abierto={foto !== null} inicial={foto ?? 0} grupos={[{ fotos: p.fotos }]} titulo={`Fotos de ${p.org}`} onCerrar={() => setFoto(null)} />
        </>
      )}

      {p.sourceUrl && (
        <div className="mb-2.5 max-sm:mb-2 flex items-center justify-between gap-2 rounded-rd-md border border-rd-amber-line bg-rd-amber-soft/60 px-3 py-1.5 text-rd-12">
          <span className="flex min-w-0 items-center gap-1.5 font-medium text-rd-amber-ink truncate">
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-rd-amber-ink" />
            <span className="truncate">Campaña / Enlace oficial</span>
          </span>
          <a
            href={sanitizeExternalUrl(p.sourceUrl)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(ev) => ev.stopPropagation()}
            className="inline-flex items-center gap-1 font-semibold text-rd-navy hover:underline shrink-0 text-rd-12"
          >
            <span>Ver enlace</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <Recursos publicacion={p} mostrarTodos={completa} className="mb-2.5 max-sm:mb-2" />

      {/* Información de contacto y logística en tarjeta completa */}
      {completa && (p.contactoNombre || p.contactoTel || p.contactoEmail || p.horario || p.comoLlegar || p.paraQuien) && (
        <div className="mb-2.5 max-sm:mb-2 rounded-rd-lg border border-rd-line bg-rd-sunken/40 p-3 text-rd-12.5 text-rd-ink">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-semibold text-rd-12 uppercase tracking-wider text-rd-ink-meta">
              Contacto y coordinación
            </span>
            {p.paraQuien && (
              <span className="inline-flex items-center gap-1 rounded-rd-sm bg-rd-navy-soft px-2 py-0.5 text-rd-11 font-medium text-rd-navy">
                <Users className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-44">{p.paraQuien}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-rd-12">
            {/* Responsable / Persona de contacto */}
            {(p.contactoNombre || p.org) && (
              <div className="flex items-start gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0 text-rd-ink-meta mt-0.5" />
                <div>
                  <span className="text-rd-ink-meta block text-rd-11">Responsable</span>
                  <span className="font-medium text-rd-ink">{p.contactoNombre ?? p.org}</span>
                </div>
              </div>
            )}

            {/* Teléfono / WhatsApp */}
            {p.contactoTel && (
              <div className="flex items-start gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-rd-ink-meta mt-0.5" />
                <div>
                  <span className="text-rd-ink-meta block text-rd-11">Teléfono / WhatsApp</span>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <a
                      href={`tel:${p.contactoTel.replace(/\s+/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-semibold text-rd-navy hover:underline"
                    >
                      {p.contactoTel}
                    </a>
                    {(p.contactoWa ?? true) && (
                      <a
                        href={`https://wa.me/57${p.contactoTel.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Escribir por WhatsApp"
                        aria-label="Escribir por WhatsApp"
                        className="inline-flex items-center gap-1 rounded-rd-sm bg-rd-green-soft px-1.5 py-0.5 text-rd-11 font-semibold text-rd-green hover:bg-rd-green-line/50 transition-colors"
                      >
                        <IconoWhatsApp className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Horario de atención o recepción */}
            {p.horario && (
              <div className="flex items-start gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0 text-rd-ink-meta mt-0.5" />
                <div>
                  <span className="text-rd-ink-meta block text-rd-11">Horario</span>
                  <span className="font-medium text-rd-ink">{p.horario}</span>
                </div>
              </div>
            )}

            {/* Correo electrónico */}
            {p.contactoEmail && (
              <div className="flex items-start gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-rd-ink-meta mt-0.5" />
                <div>
                  <span className="text-rd-ink-meta block text-rd-11">Correo</span>
                  <a
                    href={`mailto:${p.contactoEmail}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-rd-navy hover:underline truncate block"
                  >
                    {p.contactoEmail}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Cómo llegar o instrucciones de acceso */}
          {p.comoLlegar && (
            <div className="mt-2 border-t border-rd-line-soft pt-2 flex items-start gap-1.5 text-rd-12">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-rd-ink-meta mt-0.5" />
              <div>
                <span className="text-rd-ink-meta block text-rd-11">Cómo llegar / Acceso</span>
                <span className="text-rd-ink-2 leading-relaxed">{p.comoLlegar}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <ResumenCoincidencias publicacion={p} coincidencias={coincidencias} onVer={() => onVerCoincidencias?.(p.id)} compacta className="mb-2.5 max-sm:mb-2" />

      <div className={`mt-auto flex items-center gap-2 border-t border-rd-line-soft pt-2.5 max-sm:pt-2 ${enHoja ? 'sticky bottom-0 z-1 bg-rd-surface pb-4' : ''}`}>
        <Button
          nivel="primario"
          tamano="md"
          disabled={cubierta || Boolean((p as any)._resuelta)}
          aria-disabled={cubierta || Boolean((p as any)._resuelta) || undefined}
          title={
            (p as any)._resuelta
              ? 'Esta publicación ya fue completada y certificada'
              : cubierta
              ? esOferta
                ? 'Esta oferta ya se entregó completa'
                : 'Esta necesidad ya está cubierta'
              : undefined
          }
          onClick={(ev) => {
            ev.stopPropagation();
            onPrimaria?.(p.id);
          }}
        >
          {textoPrimaria ?? (esOferta ? 'Solicitar' : 'Ayudar')}
        </Button>
        {/* Pie de tarjeta: las acciones a la izquierda, de mayor a menor jerarquía, y el ⋮
            al extremo derecho (Alejandro, 24 de septiembre de 2026). */}
        {!enHoja && (
          <Button
            nivel="secundario"
            tamano="md"
            aria-label="Ver en el mapa"
            title="Ver en el mapa"
            soloIcono
            className="shadow-2xs"
            onClick={(ev) => {
              ev.stopPropagation();
              onVerEnMapa?.(p.id);
            }}
          >
            <MapIcon aria-hidden="true" className="h-4.5 w-4.5" />
          </Button>
        )}
        {!completa && onVerDetalle && (
          <Button
            nivel="secundario"
            tamano="md"
            aria-label="Ver tarjeta completa"
            title="Ver tarjeta completa"
            soloIcono
            className="shadow-2xs"
            onClick={(ev) => {
              ev.stopPropagation();
              onVerDetalle(p.id);
            }}
          >
            <Maximize2 aria-hidden="true" className="h-4.5 w-4.5" />
          </Button>
        )}
        {/* El `ml-auto` va aquí y no en `className`: `MenuAcciones` se lo pasa al botón de
            dentro, y quien tiene que empujarse en el flex es el contenedor. */}
        {itemsMenu.length > 0 && (
          <span className="ml-auto flex">
            <MenuAcciones
              className="shadow-2xs"
              items={itemsMenu}
              tamano="md"
              nivel="secundario"
              flotante={!completa}
            />
          </span>
        )}
      </div>
    </article>
  );
};
