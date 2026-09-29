import React from 'react';
import { BadgeCheck, MapPin } from 'lucide-react';
import { PUBLICACIONES } from '../../../mocks/publicacionesMock';
import { ENTIDADES } from '../../../mocks/directorioMock';

/**
 * Vistas del producto en pequeño, para acompañar a las secciones de la landing.
 *
 * Nacen el 28 de septiembre de 2026 porque los recuadros grises con un número que había antes
 * «parecían estados vacíos» (Alejandro). La referencia llena ese sitio con pantallas reales del
 * producto; aquí se hace lo mismo con los datos de `publicacionesMock` y `directorioMock`, así
 * que lo que se ve en la landing es lo que hay dentro, no un dibujo inventado.
 *
 * Son ilustraciones, no controles: van `aria-hidden` y sin eventos. Quien usa lector de pantalla
 * ya tiene el texto de la sección al lado, y no se le ofrecen botones que no llevan a ninguna
 * parte. El marco exterior lo pone quien las usa.
 */

const Marco: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none overflow-hidden rounded-rd-xl border border-rd-line bg-rd-surface shadow-2xs select-none"
  >
    {children}
  </div>
);

/** La barra superior de una ventana, con el título de la pantalla. */
const Barra: React.FC<{ titulo: string }> = ({ titulo }) => (
  <div className="flex items-center gap-2 border-b border-rd-line bg-rd-fondo px-4 py-2.5">
    <span className="flex shrink-0 items-center gap-1.25">
      <span className="h-2 w-2 rounded-full bg-rd-line-strong" />
      <span className="h-2 w-2 rounded-full bg-rd-line-strong" />
      <span className="h-2 w-2 rounded-full bg-rd-line-strong" />
    </span>
    <span className="font-rd ml-1 text-rd-12 font-semibold text-rd-ink-2">{titulo}</span>
  </div>
);

const PuntoTipo: React.FC<{ tipo: string }> = ({ tipo }) => (
  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tipo === 'necesidad' ? 'bg-rd-coral' : 'bg-rd-navy'}`} />
);

/** Radar: lo que hace falta y lo que hay, en fila, como se ve en la lista del mapa. */
export const VistaRadar: React.FC = () => {
  const lista = PUBLICACIONES.slice(0, 4);
  return (
    <Marco>
      <Barra titulo="Radar" />
      <div className="flex flex-col gap-2.5 p-4">
        {lista.map((p) => (
          <div key={p.id} className="flex items-start gap-2.5 rounded-rd-lg border border-rd-line bg-rd-surface p-3">
            <PuntoTipo tipo={p.tipo} />
            <div className="min-w-0 flex-1">
              <p className="font-rd m-0 truncate text-rd-13 font-semibold text-rd-ink">{p.org}</p>
              <p className="font-rd m-0 mt-1 flex items-center gap-1 text-rd-11-5 text-rd-ink-meta">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{p.zona}</span>
              </p>
            </div>
            <span className="font-rd shrink-0 rounded-full bg-rd-sunken px-2 py-0.5 text-rd-11 font-semibold text-rd-ink-2">
              {p.recursos.length}
            </span>
          </div>
        ))}
      </div>
    </Marco>
  );
};

/** Directorio: quién está respondiendo y dónde. */
export const VistaDirectorio: React.FC = () => {
  const lista = ENTIDADES.slice(0, 4);
  return (
    <Marco>
      <Barra titulo="Directorio" />
      <div className="flex flex-col p-4">
        {lista.map((e, i) => (
          <div key={e.id} className={`flex items-center gap-3 py-2.5 ${i ? 'border-t border-rd-line-soft' : ''}`}>
            <span className="font-rd flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rd-sunken text-rd-11-5 font-semibold text-rd-ink-2">
              {e.nombre.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-rd m-0 flex items-center gap-1 text-rd-13 font-semibold text-rd-ink">
                <span className="truncate">{e.nombre}</span>
                {e.verificada && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-rd-navy" />}
              </p>
              <p className="font-rd m-0 mt-0.5 truncate text-rd-11-5 text-rd-ink-meta">
                {e.tipo}, {e.zona}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Marco>
  );
};

/** Seguimiento: el tablero por el que pasa una entrega hasta quedar certificada. */
export const VistaSeguimiento: React.FC = () => {
  const columnas = [
    { titulo: 'Comprometido', tarjetas: ['Agua potable, 900 L'] },
    { titulo: 'En camino', tarjetas: ['Kits de mercado, 50'] },
    { titulo: 'Entregada', tarjetas: ['Frazadas, 120', 'Planta eléctrica, 2'] },
  ];
  return (
    <Marco>
      <Barra titulo="Seguimiento" />
      <div className="grid grid-cols-3 gap-2 p-4">
        {columnas.map((c) => (
          <div key={c.titulo} className="rounded-rd-lg bg-rd-fondo p-2">
            <p className="font-rd m-0 mb-2 truncate text-rd-11 font-semibold text-rd-ink">{c.titulo}</p>
            <div className="flex flex-col gap-1.5">
              {c.tarjetas.map((t) => (
                <p key={t} className="font-rd m-0 rounded-rd-sm border border-rd-line bg-rd-surface p-2 text-rd-11 leading-snug text-rd-ink-2">
                  {t}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Marco>
  );
};
