import React, { useCallback, useEffect } from 'react';
import { Info, MapPin, Monitor, Package, Truck } from 'lucide-react';
import { Field } from '../../components/ui/Field';
import { InlineNotice } from '../../components/ui/InlineNotice';
import { IconoRecursoDe, iconoDe } from '../../components/ui/Recursos';
import { RUTAS } from '../../mocks/cuentasMock';
import { CANALES, CUENTA_OFRECER, DISPONIBLE, ENVIOS, MODOS_ENTREGA, RADIOS, REGISTRADO, TIPOS_ORG_OFERTA, estadoInicialOfrecer } from '../../mocks/flujosMock';
import { PUERTAS } from '../../mocks/panelMock';
import { TAXONOMIA } from '../../mocks/publicacionesMock';
import type { CampoDetalle, EstadoOfrecer, Foto, ModoEntrega, RespuestasDetalle } from '../../types/flujo';
import { camposOferta, camposTexto, numero, unidadOferta } from '../../utils/equivalencias';
import { caminoOfrecer, fechaCorta, listoOfrecer, textoEntrega } from '../../utils/ofrecer';
import { cifra } from '../../utils/publicaciones';
import { AlgoMas, CampoFotos, CampoNumero, CamposContacto, Chips, ExitoFlujo, FilaRevisar, ListaRecursos, MarcoFlujo, MetaPub, MiniMapa, Opt, Pregunta, ResumenPub, SalidaDialogo, TarjetasOpcion, useErrores } from './comunes';
import { AvisosProvider } from '../../components/ui/AvisoCorto';
import type { Publicacion } from '../../types/publicacion';
import { useFlujo } from './useFlujo';

/**
 * Ofrecer ayuda (mockup/*): `src/ofrecer-v2.html` del prototipo. Una organización registrada
 * ya dijo qué tiene: eso llega primero, con su cantidad, y solo confirma o ajusta. Lo que no
 * registró lo busca en la lista. Cada recurso declara cantidad, presentación o perfil y
 * hasta cuándo; luego cómo se entrega, dónde, contacto, fotos y revisar. `?insumo=&cant=&u=
 * &origen=` precarga un aporte que llega de una donación.
 */
const FASES = ['Qué ofreces', 'Revisar y publicar'];
const ICONO_MODO = { truck: <Truck className="h-5.5 w-5.5" />, pin: <MapPin className="h-5.5 w-5.5" />, monitor: <Monitor className="h-5.5 w-5.5" /> };

/** Lo registrado se precarga solo cuando la persona lo marca. */
function precarga(e: EstadoOfrecer, it: string): Partial<EstadoOfrecer> {
  const inv = CUENTA_OFRECER.inventario?.[it];
  if (!inv) return {};
  const det: RespuestasDetalle = { ...(e.det[it] ?? {}) };
  Object.keys(inv).forEach((k) => {
    if (k !== 'cantidad' && det[k] == null) det[k] = inv[k];
  });
  return { cant: e.cant[it] == null ? { ...e.cant, [it]: inv.cantidad } : e.cant, det: { ...e.det, [it]: det } };
}

/** `?insumo=&cant=&u=&origen=`: el aporte de una donación llega marcado y con su cantidad. */
function conParametros(base: EstadoOfrecer): EstadoOfrecer {
  const params = new URLSearchParams(window.location.search);
  const insumo = params.get('insumo');
  if (!insumo) return base;
  const cant = parseFloat(params.get('cant') ?? '');
  const u = params.get('u');
  const origen = params.get('origen');
  const q = insumo.toLowerCase();
  let item = insumo;
  let cat: string | null = null;
  TAXONOMIA.forEach((c) =>
    c.items.forEach((it) => {
      const x = it.toLowerCase();
      if (x === q || q.includes(x) || x.includes(q)) {
        item = it;
        cat = c.nombre;
      }
    }),
  );
  let e: EstadoOfrecer = { ...base, sel: base.sel.includes(item) ? base.sel : [...base.sel, item] };
  e = { ...e, ...precarga(e, item) };
  if (!isNaN(cant) && cant > 0) e.cant = { ...e.cant, [item]: cant };
  if (cat) e.abiertos = { ...e.abiertos, [cat]: true };
  if (origen) {
    e.origenDonacion = origen;
    e.origenCant = !isNaN(cant) && cant > 0 ? `${cant}${u ? ` ${u}` : ''}` : '';
    e.condiciones = `Insumo provisto por donación de ${origen}.`;
  }
  return e;
}

function irA(ruta: string): void {
  window.location.href = ruta;
}

export const OfrecerPage: React.FC = () => (
  <AvisosProvider>
    <Ofrecer />
  </AvisosProvider>
);

/** La oferta tal como se publicaría: es lo que se cruza contra lo que hay cerca. */
function publicacionDe(e: EstadoOfrecer): Publicacion {
  const recursos = e.sel.filter((it) => e.cant[it] > 0).map((it) => ({ item: it, unidad: unidadOferta(it), total: e.cant[it], tramos: [] }));
  return { id: 'nueva', tipo: 'oferta', titulo: CUENTA_OFRECER.organizacion, org: CUENTA_OFRECER.organizacion, verificada: true, lat: e.lat, lng: e.lng, zona: '', recursos };
}

const Ofrecer: React.FC = () => {
  const f = useFlujo<EstadoOfrecer>('ofrecer', 'ofrece', () => conParametros(estadoInicialOfrecer()), caminoOfrecer, listoOfrecer);
  const { e, set, sub } = f;
  const errores = useErrores(sub.id);

  useEffect(() => {
    document.title = 'RaDAR · Ofrecer ayuda';
  }, []);

  const toggle = (it: string) =>
    set((p) => {
      if (p.sel.includes(it)) return { sel: p.sel.filter((x) => x !== it) };
      return { sel: [...p.sel, it], ...precarga(p, it) };
    });
  const detalle = (it: string, cambio: RespuestasDetalle) => set((p) => ({ det: { ...p.det, [it]: { ...(p.det[it] ?? {}), ...cambio } } }));
  const cantidad = (it: string, n: number) => set((p) => ({ cant: { ...p.cant, [it]: n } }));
  const irMapa = useCallback(() => irA(RUTAS.radar), []);

  const registrados = Object.keys(CUENTA_OFRECER.inventario ?? {});

  let pantalla: React.ReactNode = null;
  if (e.publicado) {
    pantalla = <ExitoFlujo tipo="ofrecer" publicacion={publicacionDe(e)} onVerMapa={irMapa} onPanel={() => irA(RUTAS.miOrganizacion)} onOtra={f.reiniciar} />;
  } else if (sub.id === 'recursos') {
    pantalla = (
      <>
        <Pregunta titulo="¿Qué puedes ofrecer?" sub="Lo que registraste va primero, con su cantidad. Marca solo lo que tengas disponible hoy." />
        {e.origenDonacion && <InlineNotice variante="info" icono={<Package className="h-4 w-4" />} titulo="Viene de una donación o acopio" texto={`Recurso recibido de ${e.origenDonacion}${e.origenCant ? ` · ${e.origenCant}` : ''}. Revisa la cantidad y publícalo como oferta.`} className="mb-3" />}
        {!registrados.length && <InlineNotice variante="info" icono={<Info className="h-4 w-4" />} titulo="Todavía no tienen recursos registrados" texto="Marca aquí lo que tengan hoy. Lo que publiques queda registrado para la próxima." className="mb-3" />}
        <ListaRecursos
          q={e.q}
          onBuscar={(q) => set({ q })}
          sel={e.sel}
          onToggle={toggle}
          abiertos={e.abiertos}
          onAbrir={(g, a) => set((p) => ({ abiertos: { ...p.abiertos, [g]: a } }))}
          primero={{ nombre: REGISTRADO, items: registrados, sugerido: false, linea: (it) => `${cifra(CUENTA_OFRECER.inventario?.[it]?.cantidad ?? 0)} ${unidadOferta(it)} registrados` }}
          vacioTexto="Prueba con otra palabra o busca la categoría que más se parezca."
        />
      </>
    );
  } else if (sub.id.startsWith('cantidad:')) {
    const items = sub.items ?? [];
    pantalla = (
      <>
        <Pregunta titulo={items.length === 1 ? items[0] : sub.nombre} />
        {items.map((it, i) => (
          <section key={it} className={items.length > 1 ? `py-4 ${i ? 'border-t border-rd-line' : 'pt-0'}` : ''}>
            {items.length > 1 && (
              <h2 className="font-rd mb-2 flex items-center gap-2 text-rd-15 font-semibold text-rd-ink">
                <IconoRecursoDe nombre={iconoDe(it)} className="h-4.5 w-4.5 text-rd-ink-2" />
                {it}
              </h2>
            )}
            <CamposCantidad it={it} e={e} onCantidad={(n) => cantidad(it, n)} onDetalle={(c) => detalle(it, c)} errores={errores} />
          </section>
        ))}
      </>
    );
  } else if (sub.id === 'entrega') {
    pantalla = (
      <>
        <Pregunta titulo="¿Cómo se entrega?" />
        <TarjetasOpcion nombre="Cómo se entrega" opciones={MODOS_ENTREGA.map((m) => ({ id: m.id, nombre: m.nombre, icono: ICONO_MODO[m.icono] }))} valor={e.entrega} onChange={(id) => set({ entrega: id as ModoEntrega })} />
        <div className="mt-5">
          {e.entrega === 'llevamos' && (
            <>
              <Chips nombre="radio" etiqueta="Hasta dónde llegan" opciones={RADIOS} valor={e.radio} onChange={(v) => set({ radio: v })} className="mb-3" />
              <Chips nombre="envio" etiqueta="El envío" opciones={ENVIOS} valor={e.envio} onChange={(v) => set({ envio: v })} />
            </>
          )}
          {e.entrega === 'sitio' && <p className="m-0 text-rd-13 text-rd-ink-2">Quien lo necesite pasa a recogerlo. La dirección va en el siguiente paso.</p>}
          {e.entrega === 'remoto' && (
            <>
              <Chips nombre="canal" etiqueta="Por dónde atienden" opciones={CANALES} valor={e.canales} multi onChange={(v, on) => set((p) => ({ canales: on ? [...p.canales, v] : p.canales.filter((x) => x !== v) }))} className="mb-3" />
              <Field id="hor" etiqueta={<>Horario<Opt /></>} valor={e.horario} placeholder="Por ejemplo: lunes a viernes de 8:00 a. m. a 6:00 p. m." onChange={(v) => set({ horario: v })} />
            </>
          )}
        </div>
      </>
    );
  } else if (sub.id === 'donde') {
    pantalla = (
      <>
        <Pregunta titulo={e.entrega === 'llevamos' ? '¿De dónde sale?' : '¿Dónde se recoge?'} sub="Pusimos la dirección de tu cuenta. Si el recurso está en otro punto, corrígela o mueve el punto en el mapa." />
        <Field id="dir" etiqueta="Dirección o sector" valor={e.dir} autoComplete="street-address" requerido onChange={(v) => { set({ dir: v }); errores.limpiar('dir'); }} onBlur={(v) => errores.validar('dir', ['requerido'], v, 'Sin dirección no podemos ubicar la ayuda')} error={errores.errores.dir} className="mb-3" />
        <MiniMapa lat={e.lat} lng={e.lng} onMover={(lat, lng) => set({ lat, lng })} />
      </>
    );
  } else if (sub.id === 'contacto') {
    pantalla = (
      <>
        <Pregunta titulo="¿Quién ofrece la ayuda?" sub="Es a quien van a escribir para pedirlo. Pusimos tu contacto; cámbialo si lo coordina alguien más." />
        <CamposContacto contacto={e.contacto} tel={e.tel} mismoWa={e.mismoWa} wa={e.wa} onChange={(campo, v) => set({ [campo]: v } as Partial<EstadoOfrecer>)} onMismoWa={(v) => set({ mismoWa: v })} errores={errores} />
        <label className="mb-4 flex cursor-pointer items-center justify-between gap-3 rounded-rd-md border border-rd-line px-3 py-2.5 text-rd-13-5 text-rd-ink">
          <span>Mostrar el nombre de {CUENTA_OFRECER.organizacion} en el mapa</span>
          <input type="checkbox" role="switch" checked={e.mostrarNombre} onChange={(ev) => set({ mostrarNombre: ev.target.checked })} className="m-0 h-4.5 w-4.5 shrink-0 cursor-pointer accent-rd-sel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy" />
        </label>
        <AlgoMas titulo="Algo más sobre la oferta">
          <Field id="to" etiqueta="Tipo de organización" tipo="select" opciones={TIPOS_ORG_OFERTA} placeholder="Sin especificar" valor={e.tipoOrg} onChange={(v) => set({ tipoOrg: v })} className="mb-3" />
          <Field id="cond" etiqueta="Condiciones" tipo="textarea" valor={e.condiciones} placeholder="Por ejemplo: viene en cajas de 12, se recoge con carta de la organización, vence el 30 de septiembre" onChange={(v) => set({ condiciones: v })} className="mb-3" />
          <Field id="ta" etiqueta="Otro número de contacto" tipo="tel" valor={e.telAlt} placeholder="+57 310 987 6543" onChange={(v) => set({ telAlt: v })} className="mb-1" />
        </AlgoMas>
      </>
    );
  } else if (sub.id === 'fotos') {
    pantalla = (
      <>
        <Pregunta titulo="Una foto de lo que ofreces" sub="Es opcional. Ver el recurso ayuda a quien lo necesita a saber si le sirve: la presentación, el tamaño, el estado en que está." />
        <CampoFotos fotos={e.fotos} onAgregar={agregarFotos} onQuitar={quitarFoto} error={errores.errores.fotos} />
      </>
    );
  } else if (sub.id === 'revisar') {
    pantalla = (
      <>
        <Pregunta titulo="Revisar y publicar" sub="Así lo van a ver las organizaciones. Toca cualquier dato para cambiarlo." />
        <ResumenPub titulo="Se ofrece">
          {e.sel.map((it) => {
            const d = e.det[it] ?? {};
            const dt = camposTexto(camposOferta(it), d);
            const conTiempo = camposOferta(it).some((c) => c.k === 'tiempo');
            const disp = d.disp === 'Hasta una fecha' ? `Hasta el ${fechaCorta(String(d.fecha ?? ''))}` : String(d.disp ?? (conTiempo ? '' : 'Hasta agotar'));
            const linea = [dt, disp].filter(Boolean).join(' · ');
            return <MetaPub key={it} item={it} valor={e.cant[it] ? cifra(e.cant[it]) : ''} unidad={unidadOferta(it)} onChange={(t) => cantidad(it, numero(t) || 0)} linea={linea || undefined} />;
          })}
        </ResumenPub>
        <FilaRevisar clave="Entrega" valor={textoEntrega(e)} onClick={() => f.irA('entrega')} />
        {e.entrega !== 'remoto' && <FilaRevisar clave="Dónde" valor={e.dir} onClick={() => f.irA('donde')} />}
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
      <MarcoFlujo nombre="Ofrecer ayuda" fases={FASES} camino={f.pasos} sub={sub} publicado={e.publicado} listo={f.listoActual} textoPublicar="Publicar oferta" onIrAFase={f.irAFase} onIrA={f.irA} onAtras={f.atras} onSiguiente={f.siguiente} onPublicar={f.publicar} onCerrar={f.cerrar}>
        {pantalla}
      </MarcoFlujo>
      <SalidaDialogo abierto={f.salida} onSeguir={() => f.setSalida(false)} onBorrador={() => { f.guardarBorrador(); f.setSalida(false); f.salir(); }} onSalir={f.salir} />
    </>
  );
};

/** Los campos de un recurso ofrecido: la cantidad con su unidad, hasta cuándo, y lo que la
 *  oferta declara (presentación, perfil, vehículo, tiempo…). */
const CamposCantidad: React.FC<{ it: string; e: EstadoOfrecer; onCantidad: (n: number) => void; onDetalle: (c: RespuestasDetalle) => void; errores: ReturnType<typeof useErrores> }> = ({ it, e, onCantidad, onDetalle, errores }) => {
  const d = e.det[it] ?? {};
  const campos = camposOferta(it);
  const conTiempo = campos.some((c) => c.k === 'tiempo');
  const idC = `cant-${it}`;
  const disp = String(d.disp ?? 'Hasta agotar');
  return (
    <>
      <CampoNumero id={idC} etiqueta="Cantidad disponible" unidad={unidadOferta(it)} valor={e.cant[it] ? cifra(e.cant[it]) : ''} onChange={(t) => { onCantidad(numero(t) || 0); errores.limpiar(idC); }} onBlur={(t) => errores.validar(idC, ['numero'], t)} error={errores.errores[idC]} />
      {!conTiempo && (
        <>
          <Chips nombre={`disp-${it}`} etiqueta="Disponible" opciones={DISPONIBLE} valor={disp} onChange={(v) => onDetalle({ disp: v })} className="mb-3" />
          {disp === 'Hasta una fecha' && <Field id={`fecha-${it}`} etiqueta="Hasta qué día" tipo="date" valor={String(d.fecha ?? '')} onChange={(v) => onDetalle({ fecha: v })} className="mb-3 max-w-56" />}
        </>
      )}
      {campos.map((c) => (
        <CampoOferta key={c.k} it={it} c={c} d={d} onDetalle={onDetalle} errores={errores} />
      ))}
    </>
  );
};

const CampoOferta: React.FC<{ it: string; c: CampoDetalle; d: RespuestasDetalle; onDetalle: (c: RespuestasDetalle) => void; errores: ReturnType<typeof useErrores> }> = ({ it, c, d, onDetalle, errores }) => {
  const id = `d-${it}-${c.k}`;
  if (c.t === 'num') return <CampoNumero id={id} etiqueta={c.l} unidad={c.u ?? ''} valor={typeof d[c.k] === 'number' && d[c.k] ? cifra(d[c.k] as number) : ''} onChange={(t) => { onDetalle({ [c.k]: numero(t) || 0 }); errores.limpiar(id); }} onBlur={(t) => errores.validar(id, ['numero'], t)} error={errores.errores[id]} />;
  if (c.t === 'texto') return <Field id={id} etiqueta={c.l} opcional tipo="textarea" filas={2} valor={String(d[c.k] ?? '')} placeholder={c.p} onChange={(t) => onDetalle({ [c.k]: t })} className="mb-3" />;
  const sel = (d[c.k] ?? (c.t === 'multi' ? [] : '')) as string | string[];
  return <Chips nombre={id} etiqueta={c.l} opciones={c.op ?? []} valor={sel} multi={c.t === 'multi'} onChange={(v, on) => onDetalle({ [c.k]: c.t === 'multi' ? (on ? [...(sel as string[]), v] : (sel as string[]).filter((x) => x !== v)) : v })} className="mb-3" />;
};
