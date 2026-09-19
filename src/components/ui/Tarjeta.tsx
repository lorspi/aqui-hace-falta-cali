import React, { useState } from 'react';
import { BadgeCheck, Flag, Map as MapIcon, Share2 } from 'lucide-react';
import type { CoincidenciaPublicacion } from '../../utils/cruce';
import { ResumenCoincidencias } from './Coincidencias';
import type { Publicacion } from '../../types/publicacion';
import { distanciaTexto, estadoPublicacion, iniciales } from '../../utils/publicaciones';
import { Button } from './Button';
import { MenuAcciones } from './MenuAcciones';
import { TiraFotos, VisorFotos } from './VisorFotos';
import { Avatar, EtiquetaEstado, EtiquetaTipo } from './Etiqueta';
import { Donde } from './Donde';
import { Recursos } from './Recursos';

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
  seleccionada?: boolean;
  enHoja?: boolean;
  onSeleccionar?: (id: string) => void;
  onVerEnMapa?: (id: string) => void;
  onPrimaria?: (id: string) => void;
  /** Abrir la lista de coincidencias de esta publicación. */
  onVerCoincidencias?: (id: string) => void;
  onCompartir?: (id: string) => void;
  onReportar?: (id: string) => void;
  /** La persona ya se comprometió o solicitó en esta sesión: pasa a «En proceso». */
  enProceso?: boolean;
}

export const Tarjeta: React.FC<TarjetaProps> = ({ publicacion: p, distanciaKm, coincidencias = [], seleccionada = false, enHoja = false, enProceso = false, onSeleccionar, onVerEnMapa, onPrimaria, onVerCoincidencias, onCompartir, onReportar }) => {
  const esOferta = p.tipo === 'oferta';
  const dist = distanciaTexto(distanciaKm);
  const estado = estadoPublicacion(p);
  /* La foto abierta en el visor (índice), o ninguna. */
  const [foto, setFoto] = useState<number | null>(null);
  /* Cubierta: ya no hay nada que pedir ni que dar; la primaria se queda, pero apagada, y el
     título dice por qué (`rdBloquearCompletadas` del prototipo). */
  const cubierta = estado === 'cubierta';
  return (
    <article
      data-punto={p.id}
      aria-current={seleccionada ? 'true' : undefined}
      onClick={() => onSeleccionar?.(p.id)}
      className={
        enHoja
          ? 'relative flex min-h-full flex-col bg-rd-surface'
          : `relative flex flex-col rounded-rd-xl border bg-rd-surface p-4 transition duration-200 ${seleccionada ? 'border-rd-navy-line shadow-rd-2 -translate-y-0.5' : 'border-rd-line'}`
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <EtiquetaTipo tipo={p.tipo} />
        <EtiquetaEstado estado={enProceso && estado === 'inicial' ? 'proceso' : estado} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Avatar iniciales={iniciales(p.org)} />
        <span className="truncate text-rd-13-5 font-semibold text-rd-ink">{p.org}</span>
        {p.verificada && <BadgeCheck role="img" aria-label="Organización verificada" className="h-4 w-4 shrink-0 text-rd-navy" />}
      </div>

      {p.descripcion && <p className="mb-3 line-clamp-3 text-rd-14 leading-normal text-rd-ink">{p.descripcion}</p>}

      {p.fotos && p.fotos.length > 0 && (
        <>
          <TiraFotos fotos={p.fotos} onAbrir={setFoto} etiqueta className="mb-4" />
          <VisorFotos abierto={foto !== null} inicial={foto ?? 0} grupos={[{ fotos: p.fotos }]} titulo={`Fotos de ${p.org}`} onCerrar={() => setFoto(null)} />
        </>
      )}

      {/* Sin rótulo de bloque (Alejandro, 16 de septiembre de 2026): el pin ya dice dónde, y la
          etiqueta de arriba ya dice si se necesita o se ofrece. */}
      <Donde lugar={p.dir ?? `${p.zona}${p.localidad ? ` · ${p.localidad}` : ''}`} distancia={dist ?? undefined} className="mb-4" />

      <div className="mb-4">
        <Recursos publicacion={p} />
      </div>

      <ResumenCoincidencias publicacion={p} coincidencias={coincidencias} onVer={() => onVerCoincidencias?.(p.id)} className="mb-3" />

      <div className={`mt-auto flex items-center gap-2 border-t border-rd-line-soft pt-3 ${enHoja ? 'sticky bottom-0 z-1 bg-rd-surface pb-4' : ''}`}>
        <Button
          nivel="primario"
          tamano="md"
          disabled={cubierta}
          aria-disabled={cubierta || undefined}
          title={cubierta ? (esOferta ? 'Esta oferta ya se entregó completa' : 'Esta necesidad ya está cubierta') : undefined}
          onClick={(ev) => {
            ev.stopPropagation();
            onPrimaria?.(p.id);
          }}
        >
          {esOferta ? 'Solicitar' : 'Quiero ayudar'}
        </Button>
        {!enHoja && (
          <Button
            nivel="secundario"
            tamano="md"
            aria-label="Ver en el mapa"
            soloIcono
            onClick={(ev) => {
              ev.stopPropagation();
              onVerEnMapa?.(p.id);
            }}
          >
            <MapIcon aria-hidden="true" className="h-5 w-5" />
          </Button>
        )}
        <span className="ml-auto flex gap-1">
          <MenuAcciones
            items={[
              { texto: 'Compartir', icono: <Share2 aria-hidden="true" className="h-4.5 w-4.5" />, onElegir: () => onCompartir?.(p.id) },
              { texto: 'Reportar un problema', icono: <Flag aria-hidden="true" className="h-4.5 w-4.5" />, onElegir: () => onReportar?.(p.id) },
            ]}
          />
        </span>
      </div>
    </article>
  );
};
