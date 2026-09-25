import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Divisor } from '../../components/ui/Divisor';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, Clock, Droplet, Hand, HeartHandshake } from 'lucide-react';
import { LAMINAS, LAMINA_CARTA, LAMINA_CIERRE, LAMINA_MAPA } from '../../mocks/cuentasMock';
import type { LaminaCarrusel } from '../../types/cuenta';
import { TEXTOS as T } from './textos';

/**
 * El panel derecho de registro: tres láminas (el mapa, la necesidad, la confirmación) con
 * texto encima y barras segmentadas. Es el carrusel de `Producto/src/registro-v2.html`, con
 * utilidades de Tailwind sobre los tokens `rd-*`. Rota cada 6 s solo si nadie la detuvo: ni
 * el botón «Pausar», ni el foco o el puntero dentro del carrusel, ni `prefers-reduced-motion`.
 * Los botones de la barra se crean una vez y solo cambian atributos, para no arrancarle el
 * foco a quien navega con teclado. El mapa es decorativo: `aria-hidden`, fuera del orden de
 * tabulación, sin interacción.
 */
const INTERVALO_MS = 6000;

const ICONO_CHIP: Record<LaminaCarrusel['chips'][number]['icono'], React.ReactNode> = {
  pedir: <Hand className="h-3.5 w-3.5" />,
  ofrecer: <HeartHandshake className="h-3.5 w-3.5" />,
  agua: <Droplet className="h-3.5 w-3.5" />,
  reloj: <Clock className="h-3.5 w-3.5" />,
  hecho: <Check className="h-3.5 w-3.5" />,
};

const ICONO_PIN: Record<'necesidad' | 'oferta' | 'entregado', React.ReactNode> = {
  necesidad: <Hand color="white" size={24} strokeWidth={2.5} />,
  oferta: <HeartHandshake color="white" size={24} strokeWidth={2.5} />,
  entregado: <Check color="white" size={24} strokeWidth={2.5} />,
};

/** Gramática de color: necesidad = coral, oferta = navy, entregado = verde. */
const COLOR_PIN = { necesidad: '--color-rd-coral', oferta: '--color-rd-navy', entregado: '--color-rd-green' };

/** El pin del mapa decorativo: anillo blanco, relleno con el token del tipo, icono blanco. */
function pinHTML(variableColor: string, icono: React.ReactNode): string {
  return renderToStaticMarkup(
    <span className="block text-white drop-shadow-sm">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="14" fill="currentColor" stroke="currentColor" strokeWidth="7" />
        <circle cx="20" cy="20" r="11" fill={`var(${variableColor})`} />
        <svg x="13.5" y="13.5" width="13" height="13" viewBox="0 0 24 24">
          {icono}
        </svg>
      </svg>
    </span>,
  );
}

function reducido(): boolean {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/** El tramo de una lámina: lleno si ya pasó, vacío si falta, y creciendo durante 6 s si es
 *  la actual. Al volverse actual arranca de cero en el siguiente cuadro (sin eso, un tramo
 *  que venía lleno se quedaría lleno). */
const Barra: React.FC<{ estado: 'hecha' | 'actual' | 'pendiente'; quieta: boolean }> = ({ estado, quieta }) => {
  const [crece, setCrece] = useState(false);
  useEffect(() => {
    if (estado !== 'actual') return;
    setCrece(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setCrece(true)));
    return () => cancelAnimationFrame(id);
  }, [estado]);
  const escala = estado === 'hecha' ? 'scale-x-100' : estado === 'pendiente' ? 'scale-x-0' : crece ? 'scale-x-100' : 'scale-x-0';
  const duracion = estado === 'actual' && crece && !quieta ? 'duration-6000' : 'duration-0';
  return (
    <i className="relative mb-2.5 block h-0.75 overflow-hidden rounded-xs bg-white/25">
      <i className={`absolute inset-0 origin-left bg-white transition-transform ease-linear motion-reduce:transition-none ${escala} ${duracion}`} />
    </i>
  );
};

const LAMINA = 'absolute inset-0 isolate transition-opacity duration-500 motion-reduce:transition-none';
const CENTRO = 'absolute top-2/5 left-1/2 w-4/5 max-w-105 -translate-x-1/2 -translate-y-1/2';

export const RegistroCarrusel: React.FC = () => {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const foco = useRef(false);
  const puntero = useRef(false);
  const timer = useRef<number | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<HTMLDivElement>(null);
  const [sinMovimiento] = useState(reducido);

  const anda = useCallback(() => !pausado && !foco.current && !puntero.current && !sinMovimiento, [pausado, sinMovimiento]);

  const programar = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    if (!anda()) return;
    timer.current = window.setTimeout(() => setActual((a) => (a + 1) % LAMINAS.length), INTERVALO_MS);
  }, [anda]);

  useEffect(() => {
    programar();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [actual, programar]);

  const irA = (i: number) => setActual(i);
  const alternarPausa = () =>
    setPausado((p) => {
      /* Reanudar es una orden explícita: levanta el retén de foco y de puntero de este
         momento; el próximo focusin o la próxima entrada del puntero lo repone. */
      if (p) {
        foco.current = false;
        puntero.current = false;
      }
      return !p;
    });

  /* El mapa real, de fondo en la primera lámina. */
  useEffect(() => {
    const nodo = mapaRef.current;
    if (!nodo) return;
    const m = L.map(nodo, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      keyboard: false,
      touchZoom: false,
      boxZoom: false,
    }).setView(LAMINA_MAPA.centro, LAMINA_MAPA.zoom);
    const cont = m.getContainer();
    cont.setAttribute('aria-hidden', 'true');
    cont.tabIndex = -1;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
    LAMINA_MAPA.pines.forEach((p) => {
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({ html: pinHTML(COLOR_PIN[p.tipo], ICONO_PIN[p.tipo]), className: '', iconSize: [40, 40], iconAnchor: [20, 20] }),
        interactive: false,
        keyboard: false,
      }).addTo(m);
    });
    requestAnimationFrame(() => m.invalidateSize());
    return () => {
      m.remove();
    };
  }, []);

  const lamina = LAMINAS[actual];

  return (
    <div
      ref={raiz}
      className="relative isolate flex min-h-0 flex-1 overflow-hidden rounded-3xl bg-rd-ink text-white"
      onFocus={() => {
        foco.current = true;
        programar();
      }}
      onBlur={(ev) => {
        if (!ev.relatedTarget || !raiz.current?.contains(ev.relatedTarget as Node)) {
          foco.current = false;
          programar();
        }
      }}
      onMouseEnter={() => {
        puntero.current = true;
        programar();
      }}
      onMouseLeave={() => {
        puntero.current = false;
        programar();
      }}
    >
      {/* Lámina 1: el mapa */}
      <div className={`${LAMINA} ${actual === 0 ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div ref={mapaRef} className="absolute inset-0 saturate-75" />
      </div>

      {/* Lámina 2: la necesidad */}
      <div className={`${LAMINA} ${actual === 1 ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="absolute inset-0 bg-radial from-rd-navy to-rd-ink to-60%" />
        <div className={CENTRO}>
          <div className="rounded-rd-lg bg-rd-surface p-4 text-left text-rd-ink shadow-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rd-coral-soft px-2.5 py-1 text-rd-12 font-semibold text-rd-coral-ink">
              <Hand aria-hidden="true" className="h-3 w-3" />
              {T.panel.seNecesita}
            </span>
            <p className="mt-2.5 mb-0.5 text-rd-14 font-semibold">{LAMINA_CARTA.organizacion}</p>
            <p className="mb-3 text-rd-12 text-rd-ink-2">{LAMINA_CARTA.direccion}</p>
            {LAMINA_CARTA.filas.map((f) => (
              <div key={f.recurso} className="border-t border-rd-line-soft py-2 text-rd-13">
                <div className="flex items-baseline justify-between gap-3">
                  <b className="font-semibold">{f.recurso}</b>
                  <span className="text-rd-12 text-rd-ink-2">{f.falta}</span>
                </div>
                <div className="mt-0.5 flex h-1.5 overflow-hidden rounded-sm bg-rd-line">
                  {f.hecho > 0 && <i className="block h-full bg-rd-green" style={{ width: `${f.hecho}%` }} />}
                  {f.camino > 0 && <i className="block h-full bg-rd-amber" style={{ width: `${f.camino}%` }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lámina 3: la confirmación */}
      <div className={`${LAMINA} ${actual === 2 ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="absolute inset-0 bg-radial from-rd-green to-rd-ink to-60%" />
        <div className={`${CENTRO} flex flex-col items-center gap-3`}>
          <span className="flex h-24 w-24 items-center justify-center rounded-full border border-white/25 bg-white/12">
            <Check aria-hidden="true" className="h-12 w-12" />
          </span>
          <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-rd-13 font-semibold text-rd-ink shadow-2xl">
            <Check aria-hidden="true" className="h-4 w-4 text-rd-green" />
            {LAMINA_CIERRE.map((parte, i) => (
              <React.Fragment key={parte}>
                {i > 0 && <Divisor />}
                {parte}
              </React.Fragment>
            ))}
          </span>
        </div>
      </div>

      {/* Texto encima */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-rd-ink/95 via-rd-ink/75 via-55% to-transparent p-8">
        <ul className="mb-3 flex flex-wrap gap-2">
          {lamina.chips.map((ch) => (
            <li key={ch.texto} className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-rd-ink px-3 py-1.5 text-rd-12-5 font-medium">
              <span aria-hidden="true" className="inline-flex">
                {ICONO_CHIP[ch.icono]}
              </span>
              {ch.texto}
            </li>
          ))}
        </ul>
        <h2 className="font-rd mb-2 max-w-lg text-rd-32 leading-rd-titular font-bold tracking-rd-titular text-balance">{lamina.titulo}</h2>
        <p className="mb-6 max-w-xl text-rd-14-5 text-white/80">{lamina.texto}</p>
        {!sinMovimiento && (
          <button
            type="button"
            onClick={alternarPausa}
            aria-pressed={pausado}
            className="font-rd mb-4 inline-flex min-h-rd-tactil cursor-pointer items-center rounded-full border border-white/45 bg-white/15 px-4 text-rd-12-5 font-semibold hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {pausado ? T.panel.reanudar : T.panel.pausar}
          </button>
        )}
        <div role="tablist" aria-label={T.panel.listaAria} className="grid grid-cols-3 gap-3">
          {LAMINAS.map((l, i) => {
            const esActual = i === actual;
            return (
              <button
                key={l.nombre}
                type="button"
                role="tab"
                aria-current={esActual ? 'true' : 'false'}
                aria-selected={esActual}
                onClick={() => irA(i)}
                className={`font-rd block cursor-pointer text-left text-rd-12-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${esActual ? 'font-semibold text-white' : 'font-medium text-white/55'}`}
              >
                <Barra estado={esActual ? 'actual' : i < actual ? 'hecha' : 'pendiente'} quieta={sinMovimiento || pausado} />
                {l.nombre}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
