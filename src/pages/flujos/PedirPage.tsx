import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Bug, Flame, Info, Mountain, TriangleAlert, Waves, Wind } from 'lucide-react';
import { Field } from '../../components/ui/Field';
import { RUTAS } from '../../mocks/cuentasMock';
import { BASES, DETALLE, EQUIV } from '../../mocks/equivalenciasMock';
import { AVISO_GUIA, CUENTA_PEDIR, DIAS_OPCIONES, ICONO_EVENTO, PARA_QUIEN, PREGUNTA_GRUPO, SUGERIDOS, TIPOS_LUGAR, TOPE_GRUPO, estadoInicialPedir, type IconoEvento } from '../../mocks/flujosMock';
import { PUERTAS } from '../../mocks/panelMock';
import { TAXONOMIA } from '../../mocks/publicacionesMock';
import type { EstadoPedir, Foto, Meta, RespuestasDetalle } from '../../types/flujo';
import type { Publicacion } from '../../types/publicacion';
import { calcularMetas, declarado, detalleTexto, numero } from '../../utils/equivalencias';
import { aDeclarar, caminoPedir, listoPedir } from '../../utils/pedir';
import { cifra, unidad } from '../../utils/publicaciones';
import { AlgoMas, AvisoLinea, CampoFotos, CampoNumero, CamposContacto, Chips, ExitoFlujo, FilaRevisar, ListaRecursos, MarcaEditada, MarcoFlujo, MetaPub, MiniMapa, Opt, Pregunta, ResumenPub, SalidaDialogo, Sugeridos, TarjetasOpcion, useErrores } from './comunes';
import { AvisosProvider } from '../../components/ui/AvisoCorto';
import { useFlujo } from './useFlujo';

/**
 * Pedir ayuda (mockup/*): `src/pedir.html` del prototipo. Una pregunta por pantalla. Lo que
 * la cuenta ya sabe (dónde, contacto) llega resuelto y se confirma con un toque. Las
 * cantidades salen de la tabla de equivalencias —se ven cambiar mientras se responde, con
 * su fórmula— y siempre se pueden corregir en «Revisar». Todo sale de `flujosMock.ts` y
 * `equivalenciasMock.ts`.
 */
const FASES = ['Qué necesitas', 'Revisar y publicar'];

const ICONO: Record<IconoEvento, React.ReactNode> = {
  waves: <Waves className="h-5.5 w-5.5" />,
  pulse: <Activity className="h-5.5 w-5.5" />,
  wind: <Wind className="h-5.5 w-5.5" />,
  fire: <Flame className="h-5.5 w-5.5" />,
  mountains: <Mountain className="h-5.5 w-5.5" />,
  virus: <Bug className="h-5.5 w-5.5" />,
  warning: <TriangleAlert className="h-5.5 w-5.5" />,
};

function irA(ruta: string): void {
  window.location.href = ruta;
}

export const PedirPage: React.FC = () => (
  <AvisosProvider>
    <Pedir />
  </AvisosProvider>
);

/** La necesidad tal como se publicaría: es lo que se cruza contra lo que hay cerca. */
function publicacionDe(e: EstadoPedir, metas: Meta[]): Publicacion {
  const recursos = metas
    .map((m) => {
      const total = m.meta === null ? (declarado(m.item, e.det[m.item])?.valor ?? 0) : (e.metas[m.item] ?? m.meta);
      const unidad = m.meta === null ? (declarado(m.item, e.det[m.item])?.unidad ?? '') : (m.unidad ?? '');
      return { item: m.item, unidad, total, tramos: [] };
    })
    .filter((r) => r.total > 0);
  return { id: 'nueva', tipo: 'necesidad', titulo: CUENTA_PEDIR.organizacion, org: CUENTA_PEDIR.organizacion, verificada: true, lat: e.lat, lng: e.lng, zona: '', recursos };
}

const Pedir: React.FC = () => {
  const f = useFlujo<EstadoPedir>('pedir', 'pide', estadoInicialPedir, caminoPedir, listoPedir);
  const { e, set, sub } = f;
  const errores = useErrores(sub.id);

  useEffect(() => {
    document.title = 'RaDAR · Pedir ayuda';
  }, []);

  const metas = calcularMetas(e.sel, e.grupo, e.dias);
  const toggle = (it: string) => set((p) => ({ sel: p.sel.includes(it) ? p.sel.filter((x) => x !== it) : [...p.sel, it] }));
  const detalle = (it: string, cambio: RespuestasDetalle) => set((p) => ({ det: { ...p.det, [it]: { ...(p.det[it] ?? {}), ...cambio } } }));

  /* Un número limpio, o nada: lo que no es número no se guarda, y la validación lo dice. */
  const fijarGrupo = (g: string, txt: string) => {
    if (txt && !/^[0-9.,\s]+$/.test(txt)) return set((p) => ({ grupo: { ...p.grupo, [g]: 0 } }));
    const n = Math.min(TOPE_GRUPO, Math.round(numero(txt) || 0));
    set((p) => ({ grupo: { ...p.grupo, [g]: n } }));
  };

  const irMapa = useCallback(() => irA(RUTAS.radar), []);

  let pantalla: React.ReactNode = null;
  if (e.publicado) {
    pantalla = <ExitoFlujo tipo="pedir" publicacion={publicacionDe(e, metas)} onVerMapa={irMapa} onPanel={() => irA(RUTAS.miOrganizacion)} onOtra={f.reiniciar} />;
  } else if (sub.id === 'evento') {
    pantalla = (
      <>
        <Pregunta titulo="¿Qué emergencia estás atendiendo?" sub="Marcamos la de tu ciudad. Si es otra, cámbiala." />
        <TarjetasOpcion nombre="Emergencia" opciones={Object.keys(SUGERIDOS).map((ev) => ({ id: ev, nombre: ev, icono: ICONO[ICONO_EVENTO[ev] ?? 'warning'] }))} valor={e.evento} onChange={(ev) => set({ evento: ev })} />
      </>
    );
  } else if (sub.id === 'recursos') {
    pantalla = (
      <>
        <Pregunta titulo="¿Qué hace falta?" sub="Marca todo lo que necesites; las cantidades van después." />
        <ListaRecursos
          q={e.q}
          onBuscar={(q) => set({ q })}
          sel={e.sel}
          onToggle={toggle}
          abiertos={e.abiertos}
          onAbrir={(g, a) => set((p) => ({ abiertos: { ...p.abiertos, [g]: a } }))}
          primero={{ nombre: `Sugerido para ${e.evento.toLowerCase()}`, items: SUGERIDOS[e.evento] ?? [], icono: ICONO[ICONO_EVENTO[e.evento] ?? 'warning'], sugerido: true, linea: (it) => TAXONOMIA.find((c) => c.items.includes(it))?.nombre }}
          vacioTexto="Prueba con otra palabra. Si no está en la lista, márcalo en el recurso que más se parezca y cuéntalo en el detalle."
        />
      </>
    );
  } else if (sub.id.startsWith('grupo:')) {
    const g = sub.id.split(':')[1];
    const base = BASES[g];
    const v = e.grupo[g];
    const etiqueta = base.unidad.charAt(0).toUpperCase() + base.unidad.slice(1);
    const tieneDiarios = e.sel.some((it) => EQUIV[it]?.base === g && EQUIV[it]?.diario);
    pantalla = (
      <>
        <Pregunta titulo={PREGUNTA_GRUPO[g]} sub="Con esto calculamos cuánto hace falta. Un aproximado sirve." />
        <CampoNumero id="gv" etiqueta={etiqueta} unidad={base.unidad} valor={v ? cifra(v) : ''} onChange={(t) => { fijarGrupo(g, t); errores.limpiar('gv'); }} onBlur={(t) => errores.validar('gv', ['numero'], t)} error={errores.errores.gv} />
        <Sugeridos cifras={base.sugeridos ?? []} unidad={base.unidad} valor={v} onElegir={(n) => { set((p) => ({ grupo: { ...p.grupo, [g]: n } })); errores.limpiar('gv'); }} />
        {tieneDiarios && (
          <div className="mt-5">
            <label className="font-rd mb-0.5 block text-rd-13-5 font-semibold text-rd-ink">¿Por cuántos días?</label>
            <p className="mb-2 text-rd-12-5 text-rd-ink-2">Si tienes dudas, elige menos días: siempre puedes volver a pedir.</p>
            <Chips nombre="dias" opciones={DIAS_OPCIONES.map((d) => `${d} ${d === 1 ? 'día' : 'días'}`)} valor={`${e.dias} ${e.dias === 1 ? 'día' : 'días'}`} onChange={(v) => set({ dias: parseInt(v, 10) })} />
          </div>
        )}
        <BloqueVivo metas={metas} base={g} />
      </>
    );
  } else if (sub.id === 'declarar') {
    const pendientes = aDeclarar(e.sel);
    pantalla = (
      <>
        <Pregunta titulo="¿Cuánto hace falta de cada uno?" />
        {TAXONOMIA.map((cat) => {
          const items = cat.items.filter((it) => pendientes.includes(it));
          if (!items.length) return null;
          return (
            <section key={cat.nombre} className="mb-6">
              <h2 className="font-rd mb-3 flex items-center gap-2 text-rd-13 font-semibold tracking-wide text-rd-ink-meta uppercase">{cat.nombre}</h2>
              {items.map((it) => {
                const campo = DETALLE[it].campos.find((c) => c.k === 'num');
                const v = e.det[it]?.num;
                const id = `dec-${it}`;
                return (
                  <div key={it}>
                    <CampoNumero id={id} etiqueta={it} etiquetaClase="font-rd mb-0.5 block text-rd-13-5 font-semibold text-rd-ink" ayuda={campo?.l} unidad={campo?.u ?? ''} valor={typeof v === 'number' && v ? cifra(v) : ''} onChange={(t) => { detalle(it, { num: numero(t) || 0 }); errores.limpiar(id); }} onBlur={(t) => errores.validar(id, ['numero'], t)} error={errores.errores[id]} />
                    {campo?.sug && <Sugeridos cifras={campo.sug} unidad={campo.u ?? ''} valor={typeof v === 'number' ? v : undefined} onElegir={(n) => { detalle(it, { num: n }); errores.limpiar(id); }} etiqueta={`Cifras sugeridas para ${it}`} />}
                  </div>
                );
              })}
            </section>
          );
        })}
        <AvisoLinea className="mt-2">{AVISO_GUIA}</AvisoLinea>
      </>
    );
  } else if (sub.id === 'donde') {
    pantalla = (
      <>
        <Pregunta titulo="¿Dónde llega la ayuda?" sub="Pusimos la dirección de tu cuenta. Si la ayuda va a otro punto, corrígela o mueve el punto en el mapa." />
        <Field id="dir" etiqueta="Dirección o sector" valor={e.dir} autoComplete="street-address" requerido onChange={(v) => { set({ dir: v }); errores.limpiar('dir'); }} onBlur={(v) => errores.validar('dir', ['requerido'], v, 'Sin dirección no podemos ubicar la ayuda')} error={errores.errores.dir} className="mb-3" />
        <Field id="tl" etiqueta="Tipo de lugar o referencia" tipo="select" opciones={TIPOS_LUGAR} placeholder="Elige uno" valor={e.tipoLugar} onChange={(v) => set({ tipoLugar: v })} className="mb-3" />
        <MiniMapa lat={e.lat} lng={e.lng} onMover={(lat, lng) => set({ lat, lng })} />
        <Field id="cl" etiqueta={<>Cómo llegar<Opt /></>} tipo="textarea" valor={e.comoLlegar} placeholder="Por ejemplo: subiendo por la estación, casa esquinera azul, la vía solo sirve para moto…" onChange={(v) => set({ comoLlegar: v })} className="mt-3" />
      </>
    );
  } else if (sub.id === 'contacto') {
    pantalla = (
      <>
        <Pregunta titulo="¿Quién recibe la ayuda?" sub="Es a quien van a llamar cuando lleguen con la ayuda. Pusimos tu contacto; cámbialo si en el sitio atiende alguien más." />
        <CamposContacto contacto={e.contacto} tel={e.tel} mismoWa={e.mismoWa} wa={e.wa} onChange={(campo, v) => set({ [campo]: v } as Partial<EstadoPedir>)} onMismoWa={(v) => set({ mismoWa: v })} errores={errores} />
        <AlgoMas titulo="Algo más sobre la necesidad">
          <Field id="pq" etiqueta="Para quién es la ayuda" tipo="select" opciones={PARA_QUIEN} placeholder="Sin especificar" valor={e.paraQuien} onChange={(v) => set({ paraQuien: v })} className="mb-3" />
          <Field id="det" etiqueta="Detalles de la necesidad" tipo="textarea" valor={e.detalles} placeholder="Por ejemplo: hay personas mayores y niños pequeños, recibimos hasta las 6:00 p. m." onChange={(v) => set({ detalles: v })} className="mb-3" />
          <Field id="ta" etiqueta="Otro número de contacto" tipo="tel" valor={e.telAlt} placeholder="+57 310 987 6543" onChange={(v) => set({ telAlt: v })} className="mb-1" />
        </AlgoMas>
      </>
    );
  } else if (sub.id === 'fotos') {
    pantalla = (
      <>
        <Pregunta titulo="¿Tienes fotos de lo que pasó?" sub="Son opcionales. Una foto o un video le muestran a otra organización qué está pasando, y con eso deciden más rápido si pueden ayudar." />
        <CampoFotos fotos={e.fotos} onAgregar={(nuevas, pesados) => agregarFotos(nuevas, pesados)} onQuitar={quitarFoto} error={errores.errores.fotos} />
      </>
    );
  } else if (sub.id === 'revisar') {
    pantalla = (
      <>
        <Pregunta titulo="Revisar y publicar" sub="Así lo van a ver las organizaciones. Toca cualquier dato para cambiarlo." />
        <ResumenPub titulo="Se solicita">
          {metas.map((m) => (
            <FilaMeta key={m.item} m={m} e={e} onMeta={(n) => set((p) => ({ metas: { ...p.metas, [m.item]: n } }))} onDetalle={(cambio) => detalle(m.item, cambio)} errores={errores} />
          ))}
        </ResumenPub>
        <FilaRevisar clave="Dónde" valor={`${e.dir}${e.tipoLugar ? ` · ${e.tipoLugar}` : ''}`} onClick={() => f.irA('donde')} />
        <FilaRevisar clave="Contacto" valor={`${e.contacto} · ${e.tel}${e.mismoWa ? ' · también WhatsApp' : e.wa ? ` · WhatsApp ${e.wa}` : ''}`} onClick={() => f.irA('contacto')} />
        <FilaRevisar clave="Fotos" valor={e.fotos.length ? `${e.fotos.length} ${e.fotos.length === 1 ? 'archivo' : 'archivos'}` : 'Sin fotos'} accion={e.fotos.length ? 'Cambiar' : 'Agregar'} onClick={() => f.irA('fotos')} />
      </>
    );
  }

  function agregarFotos(nuevas: Foto[], pesados: number) {
    set((p) => ({ fotos: [...p.fotos, ...nuevas] }));
    errores.poner('fotos', pesados ? (pesados === 1 ? 'Un archivo pesa más de 25 MB y no se agregó' : `${pesados} archivos pesan más de 25 MB y no se agregaron`) : null);
  }
  function quitarFoto(i: number) {
    const foto = e.fotos[i];
    if (foto) {
      try {
        URL.revokeObjectURL(foto.url);
      } catch {
        /* nada */
      }
    }
    set((p) => ({ fotos: p.fotos.filter((_, k) => k !== i) }));
  }

  return (
    <>
      <MarcoFlujo nombre="Pedir ayuda" fases={FASES} camino={f.pasos} sub={sub} publicado={e.publicado} listo={f.listoActual} textoPublicar="Publicar necesidad" onIrAFase={f.irAFase} onIrA={f.irA} onAtras={f.atras} onSiguiente={f.siguiente} onPublicar={f.publicar} onCerrar={f.cerrar}>
        {pantalla}
      </MarcoFlujo>
      <SalidaDialogo abierto={f.salida} onSeguir={() => f.setSalida(false)} onBorrador={() => { f.guardarBorrador(); f.setSalida(false); f.salir(); }} onSalir={f.salir} />
    </>
  );
};

/** La caja del cálculo, mientras se responde: solo lo que sale del número que se está
 *  respondiendo ahora, cada cifra con su fórmula detrás de un botón de ayuda. */
const BloqueVivo: React.FC<{ metas: Meta[]; base: string }> = ({ metas, base }) => {
  const [abierta, setAbierta] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const visibles = metas.filter((m) => m.meta != null && EQUIV[m.item]?.base === base);
  /* Se anuncia un resumen, y solo cuando la persona deja de escribir. */
  useEffect(() => {
    const t = window.setTimeout(() => setAnuncio(visibles.length ? `Calculado: ${visibles.map((m) => `${m.item}, ${cifra(m.meta as number)} ${unidad(m.meta as number, m.unidad ?? '')}`).join('; ')}` : ''), 700);
    return () => window.clearTimeout(t);
  }, [visibles.map((m) => `${m.item}:${m.meta}`).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const alTeclear = (ev: KeyboardEvent) => ev.key === 'Escape' && setAbierta(null);
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, []);
  return (
    <>
      {visibles.length > 0 && (
        <div className="mt-5 rounded-rd-lg bg-rd-sunken p-4">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {visibles.map((m) => {
              const idA = `comofue-${m.item}`;
              const abierto = abierta === m.item;
              return (
                <li key={m.item} className="flex flex-wrap items-center gap-3 text-rd-13-5">
                  <span className="min-w-0 flex-1 font-semibold text-rd-ink">{m.item}</span>
                  <b className="text-right whitespace-nowrap tabular-nums">
                    {cifra(m.meta as number)} {unidad(m.meta as number, m.unidad ?? '')}
                  </b>
                  <button type="button" aria-expanded={abierto} aria-controls={idA} aria-label={`Cómo se calculó ${m.item}`} onClick={() => setAbierta(abierto ? null : m.item)} className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-rd-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy ${abierto ? 'text-rd-navy' : 'text-rd-ink-3 hover:text-rd-ink-2'}`}>
                    <Info aria-hidden="true" className="h-3.75 w-3.75" />
                  </button>
                  <p id={idA} hidden={!abierto} className="m-0 mt-2 basis-full rounded-rd-md border border-rd-line bg-rd-surface p-3 text-rd-12-5 leading-relaxed text-rd-ink-2">
                    {m.formula}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 border-t border-rd-line pt-3 text-rd-12 text-rd-ink-meta">{AVISO_GUIA}</p>
        </div>
      )}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {anuncio}
      </p>
    </>
  );
};

/** Una fila de «Se solicita»: la cifra (calculada o declarada), su unidad, la fórmula y el
 *  detalle en texto libre. Si la cifra se escribió a mano y no coincide con el cálculo, se
 *  marca «editada» y al lado va lo que dio la cuenta. */
const FilaMeta: React.FC<{ m: Meta; e: EstadoPedir; onMeta: (n: number) => void; onDetalle: (c: RespuestasDetalle) => void; errores: ReturnType<typeof useErrores> }> = ({ m, e, onMeta, onDetalle, errores }) => {
  const D = DETALLE[m.item];
  const dt = detalleTexto(m.item, e.det[m.item]);
  let v: number | undefined;
  let u = '';
  let onChange: (t: string) => void;
  let linea: React.ReactNode = null;
  if (m.meta === null) {
    const dec = declarado(m.item, e.det[m.item]);
    v = dec?.valor;
    u = dec?.unidad ?? '';
    onChange = (t) => onDetalle({ num: numero(t) || 0 });
  } else {
    const manual = e.metas[m.item];
    v = manual ?? m.meta;
    u = m.unidad ?? '';
    onChange = (t) => onMeta(numero(t) || 0);
    linea =
      manual != null && manual !== m.meta ? (
        <>
          <MarcaEditada /> · calculamos {cifra(m.meta)} {m.unidad} · {m.formula}
        </>
      ) : (
        m.formula
      );
  }
  const id = `meta-${m.item}`;
  const otros = D?.campos.filter((c) => c.k !== 'num') ?? [];
  return (
    <MetaPub item={m.item} valor={v != null && v !== 0 ? cifra(v) : ''} unidad={unidad(v ?? 0, u)} onChange={(t) => { onChange(t); errores.limpiar(id); }} onBlur={(t) => errores.validar(id, ['numero'], t)} error={errores.errores[id]} linea={[linea, dt].filter(Boolean).length ? <>{linea}{linea && dt ? ' · ' : ''}{dt}</> : undefined}>
      {otros.length > 0 && (
        <>
          <p className="mb-2 text-rd-12-5 text-rd-ink-2">
            {D.pregunta}
            {D.ayuda ? ` ${D.ayuda}` : ''}
          </p>
          {otros.map((c) => (
            <Field key={c.k} id={`${id}-${c.k}`} etiqueta={c.l} opcional tipo="textarea" filas={2} valor={String(e.det[m.item]?.[c.k] ?? '')} ayuda={c.p} onChange={(t) => onDetalle({ [c.k]: t })} />
          ))}
        </>
      )}
    </MetaPub>
  );
};
