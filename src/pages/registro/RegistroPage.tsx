import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CreditCard,
  Hand,
  HeartHandshake,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Field, type FieldProps } from '../../components/ui/Field';
import { InlineNotice } from '../../components/ui/InlineNotice';
import { OptionCard } from '../../components/ui/OptionCard';
import { PasswordRules } from '../../components/ui/PasswordRules';
import { Segmented } from '../../components/ui/Segmented';
import { Success } from '../../components/ui/Success';
import { DEPTOS, PERFILES, RUTAS, TIPOS_COM, TIPOS_ORG, estadoInicial } from '../../mocks/cuentasMock';
import { guardarEntidad } from '../../utils/cuenta';
import type { EstadoRegistro, IconoCuenta, ModoRegistro, PerfilCuenta } from '../../types/cuenta';
import { camino, listo, loginListo, pasoActual, validar, type Contrasenas, type Regla } from './pasos';
import { RegistroCarrusel } from './RegistroCarrusel';
import { TEXTOS as T } from './textos';

/**
 * Registro (mockup/registro-v2). Réplica de `Producto/src/registro-v2.html` del prototipo de
 * RaDAR sobre el sistema de este repo: logo pequeño arriba a la izquierda, el formulario
 * centrado en su columna y, desde 1024, el carrusel a la derecha. Sin Supabase: al terminar
 * muestra el éxito y enlaza a la app.
 *
 * Las contraseñas no viven en el estado de React ni en el marcado: quedan en un `ref` que
 * `Field` alimenta, y un contador fuerza el repintado de las reglas.
 */

/* Un concepto, un icono: la comunidad es la gente. */
const ICONO: Record<IconoCuenta, React.ReactNode> = {
  organizacion: <Building2 className="h-5.5 w-5.5" />,
  liderazgo: <Users className="h-5.5 w-5.5" />,
  persona: <User className="h-5.5 w-5.5" />,
};

const ico = {
  organizacion: <Building2 className="h-5 w-5" />,
  persona: <User className="h-5 w-5" />,
  documento: <CreditCard className="h-5 w-5" />,
  cargo: <Briefcase className="h-5 w-5" />,
  contrasena: <Lock className="h-5 w-5" />,
  correo: <Mail className="h-5 w-5" />,
  celular: <Phone className="h-5 w-5" />,
  lugar: <MapPin className="h-5 w-5" />,
};

/* Todo campo de registro es la píldora del prototipo, con la etiqueta como placeholder. */
const PILDORA: Pick<FieldProps, 'forma' | 'etiquetaOculta' | 'verComoTexto'> = { forma: 'pildora', etiquetaOculta: true, verComoTexto: true };

/* El h1 del flujo de registro: 28 (24 bajo 640), semibold, tinta. */
const CLASE_H1 = 'font-rd text-rd-24 leading-tight font-semibold tracking-rd-titulo text-rd-ink text-balance focus:outline-none sm:text-rd-28';
const CLASE_ENLACE = 'font-semibold text-rd-ink underline underline-offset-3';

function leerRapida(): boolean {
  return /[?&]rapida=1/.test(window.location.search);
}

export const RegistroPage: React.FC = () => {
  const [e, setE] = useState<EstadoRegistro>(() => estadoInicial(leerRapida()));
  const pass = useRef<Contrasenas>({});
  const [, repintar] = useReducer((n: number) => n + 1, 0);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const cuerpoRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const paso = pasoActual(e);
  const c = camino(e.perfil);
  const indice = Math.min(e.indice, c.length - 1);
  const ultimo = indice === c.length - 1;

  /* Qué pantalla se ve. Cuando cambia, el foco se mueve; en la primera pintura no
     (arranca con la clave actual, así el doble efecto de StrictMode tampoco enfoca). */
  const clavePantalla = e.listo ? 'exito' : e.modo === 'login' ? 'login' : paso.id;
  const pantallaAnterior = useRef(clavePantalla);

  useEffect(() => {
    document.title = T.titulo;
  }, []);

  /* Al cambiar de paso, el foco va al primer campo; si el paso no tiene campo de texto (la
     intención, el éxito), al encabezado. Sin esto el foco cae a body y quien navega con
     teclado recorre la página entera otra vez. */
  useEffect(() => {
    if (pantallaAnterior.current === clavePantalla) return;
    pantallaAnterior.current = clavePantalla;
    window.scrollTo(0, 0);
    const raiz = cuerpoRef.current;
    const campo = raiz?.querySelector<HTMLElement>('input:not([type=radio]):not([type=checkbox]), select');
    if (campo) {
      campo.focus({ preventScroll: true });
      return;
    }
    tituloRef.current?.focus({ preventScroll: true });
  }, [clavePantalla]);

  const patch = (p: Partial<EstadoRegistro>) => setE((prev) => ({ ...prev, ...p }));
  const patchOrg = (p: Partial<EstadoRegistro['org']>) => setE((prev) => ({ ...prev, org: { ...prev.org, ...p } }));
  const patchCom = (p: Partial<EstadoRegistro['com']>) => setE((prev) => ({ ...prev, com: { ...prev.com, ...p } }));
  const patchPer = (p: Partial<EstadoRegistro['per']>) => setE((prev) => ({ ...prev, per: { ...prev.per, ...p } }));

  const error = (id: string) => errores[id] ?? null;
  const alSalir = (id: string, reglas: Regla[], vacio?: string) => (valor: string) =>
    setErrores((prev) => {
      const msg = validar(valor, reglas, vacio);
      const sig = { ...prev };
      if (msg) sig[id] = msg;
      else delete sig[id];
      return sig;
    });
  const alEscribir = (id: string, setter: (v: string) => void) => (valor: string) => {
    setter(valor);
    if (errores[id])
      setErrores((prev) => {
        const sig = { ...prev };
        delete sig[id];
        return sig;
      });
  };
  const guardarPass = (id: keyof Contrasenas) => (valor: string) => {
    pass.current[id] = valor;
    repintar();
  };

  const irAModo = (modo: ModoRegistro) => {
    patch({ modo, indice: modo === 'registro' ? 0 : e.indice });
    /* El conmutador no se destruye: el foco se queda en el botón pulsado. */
  };
  const siguiente = () => patch({ indice: Math.min(indice + 1, c.length - 1) });
  const atras = () => patch({ indice: Math.max(indice - 1, 0) });
  const terminar = () => {
    if (e.perfil) guardarEntidad(e.perfil);
    patch({ listo: true });
  };

  const puedeContinuar = listo(paso, e, pass.current);

  /* Enter en cualquier campo = el botón principal, si está habilitado. */
  const alTeclear = (ev: React.KeyboardEvent) => {
    if (ev.key !== 'Enter') return;
    const t = ev.target as HTMLElement;
    if (t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.tagName === 'A') return;
    ev.preventDefault();
    if (e.modo === 'login') {
      if (loginListo(e.login.correo, pass.current)) window.location.assign(RUTAS.mapa);
      return;
    }
    if (!puedeContinuar) return;
    if (ultimo) terminar();
    else siguiente();
  };

  /* ------------------------------------------------------------------ piezas ---- */

  const portada = (
    <>
      <span
        aria-hidden="true"
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-rd-line bg-rd-sunken text-rd-ink"
      >
        <MapPin className="h-6.5 w-6.5" />
      </span>
      <h1 ref={tituloRef} tabIndex={-1} className={`${CLASE_H1} mb-1`}>
        {T.portada.linea1}{' '}
        <span className="block sm:whitespace-nowrap">
          <span className="text-rd-coral">{T.portada.pide}</span> <span className="text-rd-navy">{T.portada.da}</span>
        </span>
      </h1>
    </>
  );

  const conmutador = (
    <div className="mt-2 mb-6 flex justify-center">
      <Segmented<ModoRegistro>
        etiquetaGrupo={T.conmutador.grupo}
        opciones={[
          { id: 'login', etiqueta: T.conmutador.login },
          { id: 'registro', etiqueta: T.conmutador.registro },
        ]}
        valor={e.modo}
        onChange={irAModo}
      />
    </div>
  );

  const titulo = (texto: string, sub?: string) => (
    <>
      <h1 ref={tituloRef} tabIndex={-1} className={`${CLASE_H1} mb-1`}>
        {texto}
      </h1>
      {sub && <p className="mb-6 text-rd-14 text-rd-ink-2">{sub}</p>}
    </>
  );

  /* La nota legal, en el primer y el último paso (como el prototipo). */
  const legal = (
    <p className="mt-6 text-center text-rd-12 leading-normal text-rd-ink-meta">
      {T.legal.antes}{' '}
      <a href={RUTAS.terminos} target="_blank" rel="noreferrer" className="text-rd-ink-2 underline hover:text-rd-ink">
        {T.legal.terminos}
      </a>{' '}
      {T.legal.y}{' '}
      <a href={RUTAS.privacidad} target="_blank" rel="noreferrer" className="text-rd-ink-2 underline hover:text-rd-ink">
        {T.legal.privacidad}
      </a>
      .
    </p>
  );

  const pie = (
    <div className="mt-6 flex flex-col-reverse gap-2">
      {indice > 0 && (
        <Button nivel="terciario" tamano="md" ancho icono={<ArrowLeft className="h-4 w-4" />} onClick={atras}>
          {T.pie.volver}
        </Button>
      )}
      {ultimo ? (
        <Button nivel="primario" tamano="lg" ancho disabled={!puedeContinuar} onClick={terminar}>
          {e.perfil === 'rapida' ? T.rapida.crear : T.pie.crear}
        </Button>
      ) : (
        <Button nivel="primario" tamano="lg" ancho disabled={!puedeContinuar} onClick={siguiente}>
          {T.pie.continuar}
        </Button>
      )}
    </div>
  );

  /* ---------------------------------------------------------------- pantallas ---- */

  const login = (
    <>
      {portada}
      {conmutador}
      <div ref={cuerpoRef} className="space-y-3 text-left">
        <Field
          {...PILDORA}
          id="login-correo"
          etiqueta={T.login.correo}
          tipo="email"
          icono={ico.correo}
          autoComplete="username"
          valor={e.login.correo}
          onChange={alEscribir('login-correo', (v) => patch({ login: { correo: v } }))}
          onBlur={alSalir('login-correo', ['requerido', 'correo'], T.login.errorCorreo)}
          error={error('login-correo')}
        />
        <Field
          {...PILDORA}
          id="login-pass"
          etiqueta={T.login.contrasena}
          tipo="password"
          icono={ico.contrasena}
          autoComplete="current-password"
          valorInicial={pass.current.lp}
          onChange={guardarPass('lp')}
        />
      </div>
      <div className="mt-6">
        <Button nivel="primario" tamano="lg" ancho disabled={!loginListo(e.login.correo, pass.current)} onClick={() => window.location.assign(RUTAS.mapa)}>
          {T.login.entrar}
        </Button>
      </div>
      <p className="mt-4 text-rd-14 text-rd-ink-2">
        <a href={RUTAS.recuperar} className={CLASE_ENLACE}>
          {T.login.olvido}
        </a>
      </p>
    </>
  );

  /* Quién eres: la entidad pone nombre al panel, no decide lo que hay dentro (los módulos
     se habilitan con el uso). Es el primer paso: va con la portada y el conmutador. */
  const pantallaPerfil = (
    <>
      {portada}
      {conmutador}
      <h2 className="font-rd mb-3 text-rd-15 font-semibold text-rd-ink">{T.perfil.pregunta}</h2>
      <div ref={cuerpoRef} role="radiogroup" aria-label={T.perfil.pregunta} className="grid gap-2">
        {PERFILES.map((p) => (
          <OptionCard
            key={p.id}
            name="perfil"
            id={`perfil-${p.id}`}
            valor={p.id}
            titulo={p.nombre}
            descripcion={p.descripcion}
            icono={ICONO[p.icono]}
            seleccionada={e.perfil === p.id}
            onSelect={(v) => patch({ perfil: v as PerfilCuenta })}
          />
        ))}
      </div>
    </>
  );

  const pantallaRapida = (
    <>
      {titulo(T.rapida.titulo, T.rapida.sub)}
      {/* Sin iconos, como el prototipo: los cuatro datos hablan solos. */}
      <div ref={cuerpoRef} className="mt-5 space-y-3 text-left">
        <Field {...PILDORA} id="r-nombre" etiqueta={T.rapida.nombre} autoComplete="name" valor={e.per.nombre} onChange={alEscribir('r-nombre', (v) => patchPer({ nombre: v }))} onBlur={alSalir('r-nombre', ['requerido'], T.errores.nombre)} error={error('r-nombre')} />
        <Field {...PILDORA} id="r-tel" etiqueta={T.rapida.celular} tipo="tel" autoComplete="tel" valor={e.per.tel} onChange={alEscribir('r-tel', (v) => patchPer({ tel: v }))} onBlur={alSalir('r-tel', ['requerido', 'celular'], T.errores.celular)} error={error('r-tel')} />
        <Field {...PILDORA} id="r-correo" etiqueta={T.rapida.correo} tipo="email" autoComplete="username" valor={e.per.correo} onChange={alEscribir('r-correo', (v) => patchPer({ correo: v }))} onBlur={alSalir('r-correo', ['requerido', 'correo'], T.errores.correo)} error={error('r-correo')} />
        <div>
          <Field {...PILDORA} id="r-pass" etiqueta={T.rapida.contrasena} tipo="password" autoComplete="new-password" valorInicial={pass.current.rp} onChange={guardarPass('rp')} />
          <PasswordRules className="mt-2" id="r-reglas" contrasena={pass.current.rp || ''} correo={e.per.correo} />
        </div>
      </div>
    </>
  );

  const pantallaOrg = (
    <>
      {titulo(T.org.titulo)}
      <div ref={cuerpoRef} className="mt-5 space-y-3 text-left">
        <Field {...PILDORA} id="o-nombre" etiqueta={T.org.nombre} icono={ico.organizacion} autoComplete="organization" valor={e.org.nombre} onChange={alEscribir('o-nombre', (v) => patchOrg({ nombre: v }))} onBlur={alSalir('o-nombre', ['requerido'], T.errores.nombreOrg)} error={error('o-nombre')} />
        <Field {...PILDORA} id="o-tipo" etiqueta={T.org.tipo} tipo="select" opciones={TIPOS_ORG} valor={e.org.tipo} onChange={(v) => patchOrg({ tipo: v })} />
        {/* NIT, sitio web, contacto público y documento de representación viven en el panel
            (Perfil de la entidad): el registro pide solo lo mínimo para entrar. Alejandro,
            16 de septiembre de 2026: «esto se ve muy cargado». */}
      </div>
    </>
  );

  const pantallaCom = (
    <>
      {titulo(T.com.titulo)}
      <div ref={cuerpoRef} className="mt-5 space-y-3 text-left">
        <Field {...PILDORA} id="c-nombre" etiqueta={T.com.nombre} icono={ico.lugar} valor={e.com.nombre} onChange={alEscribir('c-nombre', (v) => patchCom({ nombre: v }))} onBlur={alSalir('c-nombre', ['requerido'])} error={error('c-nombre')} />
        <Field {...PILDORA} id="c-tipo" etiqueta={T.com.tipo} tipo="select" opciones={TIPOS_COM} valor={e.com.tipo} onChange={(v) => patchCom({ tipo: v })} />
        <Field {...PILDORA} id="c-depto" etiqueta={T.com.departamento} tipo="select" opciones={DEPTOS} valor={e.com.departamento} onChange={(v) => patchCom({ departamento: v })} />
        {/* El punto de referencia y el contacto público van al panel, como en la organización. */}
      </div>
    </>
  );

  const esOrg = e.perfil === 'organizacion';
  const pantallaPersona = (
    <>
      {titulo(T.persona.titulo)}
      <div ref={cuerpoRef} className="mt-5 space-y-3 text-left">
        <Field {...PILDORA} id="p-nombre" etiqueta={T.persona.nombre} icono={ico.persona} autoComplete="name" valor={e.per.nombre} onChange={alEscribir('p-nombre', (v) => patchPer({ nombre: v }))} onBlur={alSalir('p-nombre', ['requerido'], T.errores.nombre)} error={error('p-nombre')} />
        {esOrg ? (
          <Field {...PILDORA} id="p-cargo" etiqueta={T.persona.cargo} opcional icono={ico.cargo} autoComplete="organization-title" valor={e.per.cargo} onChange={(v) => patchPer({ cargo: v })} />
        ) : (
          <Field {...PILDORA} id="p-cedula" etiqueta={T.persona.cedula} opcional icono={ico.documento} inputMode="numeric" valor={e.per.cedula} onChange={(v) => patchPer({ cedula: v })} />
        )}
        <Field
          {...PILDORA}
          id="p-tel"
          etiqueta={T.persona.celular}
          tipo="tel"
          icono={ico.celular}
          autoComplete="tel"
          ayuda={T.persona.ayudaCelular}
          valor={e.per.tel}
          onChange={alEscribir('p-tel', (v) => patchPer({ tel: v }))}
          onBlur={alSalir('p-tel', ['requerido', 'celular'], T.errores.celular)}
          error={error('p-tel')}
        />
        <Field id="p-mismo" etiqueta={T.persona.mismoWa} tipo="checkbox" marcado={e.per.mismoWa} onChangeMarcado={(v) => patchPer({ mismoWa: v })} />
        {!e.per.mismoWa && <Field {...PILDORA} id="p-wa" etiqueta={T.persona.wa} tipo="tel" icono={ico.celular} valor={e.per.wa} onChange={(v) => patchPer({ wa: v })} />}
      </div>
    </>
  );

  const pantallaCuenta = (
    <>
      {titulo(T.cuenta.titulo, T.cuenta.sub)}
      <div ref={cuerpoRef} className="mt-5 space-y-3 text-left">
        <Field {...PILDORA} id="q-correo" etiqueta={T.cuenta.correo} tipo="email" icono={ico.correo} autoComplete="username" valor={e.per.correo} onChange={alEscribir('q-correo', (v) => patchPer({ correo: v }))} onBlur={alSalir('q-correo', ['requerido', 'correo'], T.errores.correo)} error={error('q-correo')} />
        <div>
          <Field {...PILDORA} id="q-pass" etiqueta={T.cuenta.contrasena} tipo="password" icono={ico.contrasena} autoComplete="new-password" valorInicial={pass.current.cp} onChange={guardarPass('cp')} />
          <PasswordRules className="mt-2" id="q-reglas" contrasena={pass.current.cp || ''} correo={e.per.correo} />
        </div>
        <Field
          {...PILDORA}
          id="q-repetir"
          etiqueta={T.cuenta.repetir}
          tipo="password"
          icono={ico.contrasena}
          autoComplete="new-password"
          valorInicial={pass.current.cq}
          onChange={guardarPass('cq')}
          error={pass.current.cq && pass.current.cp !== pass.current.cq ? T.cuenta.noCoinciden : null}
        />
      </div>
    </>
  );

  const exito = (() => {
    if (e.perfil === 'rapida') {
      return (
        <Success
          tituloRef={tituloRef}
          titulo={T.exito.rapidaTitulo}
          texto={T.exito.rapidaSub}
          acciones={
            <Button nivel="primario" tamano="lg" ancho onClick={() => window.location.assign(RUTAS.directorio)}>
              {T.exito.verContacto}
            </Button>
          }
          pie={
            <a href={RUTAS.pedir} className={CLASE_ENLACE}>
              {T.exito.publicar}
            </a>
          }
        />
      );
    }
    /* Sin objetivo que preguntar: el mapa es donde pasa lo primero (pedir o publicar). La
       entidad solo pone nombre al panel del aviso de verificación. */
    const quien = esOrg ? e.org.nombre : e.com.nombre;
    const panel = PERFILES.find((p) => p.id === e.perfil)?.panel ?? T.exito.panelPorDefecto;
    return (
      <Success
        tituloRef={tituloRef}
        titulo={T.exito.titulo(quien.trim() || T.exito.quienPorDefecto)}
        texto={T.exito.sub}
        acciones={
          <>
            <Button nivel="terciario" tamano="md" ancho onClick={() => window.location.assign(RUTAS.comoFunciona)}>
              {T.exito.comoFunciona}
            </Button>
            <Button nivel="primario" tamano="lg" ancho onClick={() => window.location.assign(RUTAS.mapa)}>
              {T.exito.irMapa}
            </Button>
          </>
        }
      >
        {esOrg && <InlineNotice variante="info" icono={<ShieldCheck className="h-4 w-4" />} titulo={T.exito.sinVerificarTitulo} texto={T.exito.sinVerificarTexto(panel)} />}
      </Success>
    );
  })();

  const pantallas: Record<string, React.ReactNode> = {
    perfil: pantallaPerfil,
    rapida: pantallaRapida,
    org: pantallaOrg,
    com: pantallaCom,
    persona: pantallaPersona,
    cuenta: pantallaCuenta,
  };

  /* `key` por paso: React reutilizaría un `Field` que quede en la misma posición del paso
     anterior (p-tel → q-repetir) y su efecto de montaje —el que repone la contraseña— no
     correría. Con la clave, cambiar de paso es remontar la pantalla. */
  const contenido = e.listo ? (
    exito
  ) : e.modo === 'login' ? (
    login
  ) : (
    <React.Fragment key={paso.id}>
      {pantallas[paso.id]}
      {pie}
      {(paso.id === 'perfil' || ultimo) && legal}
    </React.Fragment>
  );

  return (
    <div className="font-rd flex h-dvh flex-col overflow-hidden bg-rd-surface text-rd-15 leading-relaxed tracking-rd-cuerpo text-rd-ink antialiased">
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-x-4 px-4 sm:grid-cols-8 sm:px-6 lg:grid-cols-12 lg:gap-x-6 lg:px-8">
        <section className="relative col-span-full flex min-h-0 min-w-0 flex-col items-center overflow-y-auto pt-8 pb-6 lg:col-span-6">
          <a href={RUTAS.inicio} aria-label={T.logoAria} className="absolute top-6 left-0 rounded-rd-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy">
            <img src="/logo-radar.svg" alt="" className="block h-7.5 w-auto" />
          </a>
          <main className="my-auto w-full max-w-110 flex-none pt-18 text-center" onKeyDown={alTeclear}>
            {contenido}
          </main>
        </section>

        <aside aria-label={T.panel.aria} className="hidden py-6 lg:col-span-6 lg:flex lg:min-h-0">
          <RegistroCarrusel />
        </aside>
      </div>
    </div>
  );
};
