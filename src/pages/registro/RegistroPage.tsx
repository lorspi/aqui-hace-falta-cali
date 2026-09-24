import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  CreditCard,
  FileText,
  Globe,
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
import { Combobox } from '../../components/ui/Combobox';
import { Field, type FieldProps } from '../../components/ui/Field';
import { InlineNotice } from '../../components/ui/InlineNotice';
import { OptionCard } from '../../components/ui/OptionCard';
import { PasswordRules } from '../../components/ui/PasswordRules';
import { contrasenaCumple } from '../../features/auth/schemas/registerSchema';
import { Segmented } from '../../components/ui/Segmented';
import { Success } from '../../components/ui/Success';
import { DEPTOS, PERFILES, RUTAS, TIPOS_COM, TIPOS_DOC, TIPOS_ORG, estadoInicial } from '../../mocks/cuentasMock';
import { Turnstile } from '../../components/Turnstile';
import { guardarEntidad } from '../../utils/cuenta';
import type { EstadoRegistro, IconoCuenta, ModoRegistro, PerfilCuenta } from '../../types/cuenta';
import { camino, esCorreo, listo, loginListo, pasoActual, validar, type Contrasenas, type Regla } from './pasos';
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
  web: <Globe className="h-5 w-5" />,
  nit: <FileText className="h-5 w-5" />,
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

  const [correoRecuperar, setCorreoRecuperar] = useState('');

  const paso = pasoActual(e);
  const c = camino(e.perfil);
  const indice = Math.min(e.indice, c.length - 1);
  const ultimo = indice === c.length - 1;

  /* Qué pantalla se ve. Cuando cambia, el foco se mueve; en la primera pintura no
     (arranca con la clave actual, así el doble efecto de StrictMode tampoco enfoca). */
  const clavePantalla = e.listo
    ? 'exito'
    : e.modo === 'login'
    ? 'login'
    : e.modo === 'recuperar'
    ? 'recuperar'
    : e.modo === 'recuperar_enviado'
    ? 'recuperar_enviado'
    : e.modo === 'nueva_contrasena'
    ? 'nueva_contrasena'
    : paso.id;
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
  const patchOrgContacto = (p: Partial<EstadoRegistro['org']['contacto']>) =>
    setE((prev) => ({ ...prev, org: { ...prev.org, contacto: { ...prev.org.contacto, ...p } } }));
  const patchCom = (p: Partial<EstadoRegistro['com']>) => setE((prev) => ({ ...prev, com: { ...prev.com, ...p } }));
  const patchComContacto = (p: Partial<EstadoRegistro['com']['contacto']>) =>
    setE((prev) => ({ ...prev, com: { ...prev.com, contacto: { ...prev.com.contacto, ...p } } }));
  const patchPer = (p: Partial<EstadoRegistro['per']>) => setE((prev) => ({ ...prev, per: { ...prev.per, ...p } }));
  const patchInd = (p: Partial<EstadoRegistro['ind']>) => setE((prev) => ({ ...prev, ind: { ...prev.ind, ...p } }));

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
    if (e.modo === 'recuperar') {
      if (esCorreo(correoRecuperar)) patch({ modo: 'recuperar_enviado' });
      return;
    }
    if (e.modo === 'recuperar_enviado') {
      patch({ modo: 'nueva_contrasena' });
      return;
    }
    if (e.modo === 'nueva_contrasena') {
      const nuevaLista =
        Boolean(pass.current.np) &&
        contrasenaCumple(pass.current.np || '', correoRecuperar) &&
        pass.current.np === pass.current.nq;
      if (nuevaLista) window.location.assign(RUTAS.mapa);
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

  const pie = (
    <div className="mt-6 flex flex-col-reverse gap-2">
      {indice > 0 && (
        <Button nivel="terciario" tamano="md" ancho icono={<ArrowLeft className="h-4 w-4" />} onClick={atras}>
          {T.pie.volver}
        </Button>
      )}
      {ultimo ? (
        <Button nivel="primario" tamano="lg" ancho disabled={!puedeContinuar} onClick={terminar}>
          {e.perfil === 'rapida' ? T.rapida.crear : e.perfil === 'individual' ? 'Registrar' : T.pie.crear}
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
        <button
          type="button"
          onClick={() => {
            setCorreoRecuperar(e.login.correo || '');
            patch({ modo: 'recuperar' });
          }}
          className={CLASE_ENLACE}
        >
          {T.login.olvido}
        </button>
      </p>
    </>
  );

  /* Flujo de recuperación de contraseña en el mockup */
  const pantallaRecuperar = (
    <>
      <span
        aria-hidden="true"
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-rd-line bg-rd-sunken text-rd-ink"
      >
        <Mail className="h-6.5 w-6.5" />
      </span>
      {titulo(T.recuperar.titulo, T.recuperar.sub)}
      <div ref={cuerpoRef} className="space-y-3 text-left mt-5">
        <Field
          {...PILDORA}
          id="recuperar-correo"
          etiqueta={T.recuperar.correo}
          tipo="email"
          icono={ico.correo}
          autoComplete="email"
          valor={correoRecuperar}
          onChange={alEscribir('recuperar-correo', (v) => setCorreoRecuperar(v))}
          onBlur={alSalir('recuperar-correo', ['requerido', 'correo'], T.errores.correo)}
          error={error('recuperar-correo')}
        />
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <Button
          nivel="primario"
          tamano="lg"
          ancho
          disabled={!esCorreo(correoRecuperar)}
          onClick={() => patch({ modo: 'recuperar_enviado' })}
        >
          {T.recuperar.enviar}
        </Button>
        <Button
          nivel="terciario"
          tamano="md"
          ancho
          icono={<ArrowLeft className="h-4 w-4" />}
          onClick={() => patch({ modo: 'login' })}
        >
          {T.recuperar.volver}
        </Button>
      </div>
    </>
  );

  const pantallaRecuperarEnviado = (
    <>
      <span
        aria-hidden="true"
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-rd-line bg-rd-sunken text-rd-green"
      >
        <Check className="h-6.5 w-6.5" />
      </span>
      {titulo(T.recuperar.enviadoTitulo, T.recuperar.enviadoSub)}
      <div className="mt-6 flex flex-col gap-2">
        <Button
          nivel="primario"
          tamano="lg"
          ancho
          onClick={() => patch({ modo: 'nueva_contrasena' })}
        >
          {T.recuperar.simularEnlace}
        </Button>
        <Button
          nivel="terciario"
          tamano="md"
          ancho
          icono={<ArrowLeft className="h-4 w-4" />}
          onClick={() => patch({ modo: 'login' })}
        >
          {T.recuperar.volver}
        </Button>
      </div>
    </>
  );

  const nuevaLista =
    Boolean(pass.current.np) &&
    contrasenaCumple(pass.current.np || '', correoRecuperar) &&
    pass.current.np === pass.current.nq;

  const pantallaNuevaContrasena = (
    <>
      <span
        aria-hidden="true"
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-rd-line bg-rd-sunken text-rd-ink"
      >
        <Lock className="h-6.5 w-6.5" />
      </span>
      {titulo(T.recuperar.nuevaTitulo, T.recuperar.nuevaSub)}
      <div ref={cuerpoRef} className="space-y-3 text-left mt-5">
        <div>
          <Field
            {...PILDORA}
            id="nueva-pass"
            etiqueta={T.recuperar.nuevaPass}
            tipo="password"
            icono={ico.contrasena}
            autoComplete="new-password"
            valorInicial={pass.current.np}
            onChange={guardarPass('np')}
          />
          <PasswordRules className="mt-2" id="nueva-reglas" contrasena={pass.current.np || ''} correo={correoRecuperar} />
        </div>
        <Field
          {...PILDORA}
          id="nueva-repetir"
          etiqueta={T.recuperar.repetirPass}
          tipo="password"
          icono={ico.contrasena}
          autoComplete="new-password"
          valorInicial={pass.current.nq}
          onChange={guardarPass('nq')}
          error={pass.current.nq && pass.current.np !== pass.current.nq ? T.cuenta.noCoinciden : null}
        />
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <Button
          nivel="primario"
          tamano="lg"
          ancho
          disabled={!nuevaLista}
          onClick={() => window.location.assign(RUTAS.mapa)}
        >
          {T.recuperar.guardar}
        </Button>
        <Button
          nivel="terciario"
          tamano="md"
          ancho
          icono={<ArrowLeft className="h-4 w-4" />}
          onClick={() => patch({ modo: 'login' })}
        >
          {T.recuperar.volver}
        </Button>
      </div>
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
        <Field
          {...PILDORA}
          id="o-nombre"
          etiqueta={T.org.nombre}
          icono={ico.organizacion}
          autoComplete="organization"
          valor={e.org.nombre}
          onChange={alEscribir('o-nombre', (v) => patchOrg({ nombre: v }))}
          onBlur={alSalir('o-nombre', ['requerido'], T.errores.nombreOrg)}
          error={error('o-nombre')}
        />
        <Field
          {...PILDORA}
          id="o-tipo"
          etiqueta={T.org.tipo}
          tipo="select"
          opciones={TIPOS_ORG}
          valor={e.org.tipo}
          onChange={(v) => patchOrg({ tipo: v })}
        />
        <Field
          {...PILDORA}
          id="o-nit"
          opcional
          etiqueta={T.org.nit}
          icono={ico.nit}
          valor={e.org.nit}
          onChange={alEscribir('o-nit', (v) => patchOrg({ nit: v }))}
        />
        <Field
          {...PILDORA}
          id="o-web"
          opcional
          etiqueta={T.org.web}
          icono={ico.web}
          valor={e.org.web}
          onChange={alEscribir('o-web', (v) => patchOrg({ web: v }))}
        />

        {/* Bloque Contacto Público de la Organización */}
        <div className="rounded-2xl border border-rd-line bg-rd-surface p-4 space-y-3 shadow-2xs">
          <div>
            <span className="block text-rd-13 font-semibold text-rd-ink">
              {T.org.contactoTitulo}
            </span>
            <span className="block text-rd-11 text-rd-ink-2 mt-0.5">
              {T.org.contactoSub}
            </span>
          </div>

          <Field
            {...PILDORA}
            id="o-tel"
            etiqueta={T.org.tel}
            tipo="tel"
            icono={ico.celular}
            autoComplete="tel"
            valor={e.org.contacto.tel}
            onChange={alEscribir('o-tel', (v) => patchOrgContacto({ tel: v }))}
            onBlur={alSalir('o-tel', ['requerido', 'celular'], T.errores.celular)}
            error={error('o-tel')}
          />

          <Field
            {...PILDORA}
            id="o-correo"
            etiqueta={T.org.correo}
            tipo="email"
            icono={ico.correo}
            autoComplete="email"
            valor={e.org.contacto.correo}
            onChange={alEscribir('o-correo', (v) => patchOrgContacto({ correo: v }))}
            onBlur={alSalir('o-correo', ['requerido', 'correo'], T.errores.correo)}
            error={error('o-correo')}
          />
        </div>

        {/* Documento de representación legal */}
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-rd-line bg-rd-surface p-3.5 px-4 text-rd-12 text-rd-ink-2">
          {e.org.documentoAdjunto ? (
            <Check className="h-5 w-5 shrink-0 text-rd-green" />
          ) : (
            <ShieldCheck className="h-5 w-5 shrink-0 text-rd-ink-meta" />
          )}
          <div className="flex-1">
            <b className="block font-semibold text-rd-ink">
              {T.org.docTitulo} <span className="font-normal text-rd-ink-meta">(opcional)</span>
            </b>
            <span>
              {e.org.documentoAdjunto ? T.org.docAdjuntado : T.org.docSub}
            </span>
          </div>
          <Button
            type="button"
            nivel="secundario"
            tamano="sm"
            onClick={() => patchOrg({ documentoAdjunto: !e.org.documentoAdjunto })}
          >
            {e.org.documentoAdjunto ? T.org.cambiar : T.org.adjuntar}
          </Button>
        </div>
      </div>
    </>
  );

  const pantallaCom = (
    <>
      {titulo(T.com.titulo)}
      <div ref={cuerpoRef} className="mt-5 space-y-3 text-left">
        <Field
          {...PILDORA}
          id="c-nombre"
          etiqueta={T.com.nombre}
          icono={ico.persona}
          valor={e.com.nombre}
          onChange={alEscribir('c-nombre', (v) => patchCom({ nombre: v }))}
          onBlur={alSalir('c-nombre', ['requerido'], T.errores.nombreCom)}
          error={error('c-nombre')}
        />
        <Field
          {...PILDORA}
          id="c-tipo"
          etiqueta={T.com.tipo}
          tipo="select"
          opciones={TIPOS_COM}
          valor={e.com.tipo}
          onChange={(v) => patchCom({ tipo: v })}
        />
        <Combobox
          forma="pildora"
          etiquetaOculta
          id="c-depto"
          etiqueta={T.com.departamento}
          icono={ico.lugar}
          opciones={DEPTOS}
          valor={e.com.departamento}
          onChange={(v) => patchCom({ departamento: v })}
          onBlur={alSalir('c-depto', ['requerido'])}
          error={error('c-depto')}
        />

        {/* Bloque Contacto Público de la Comunidad */}
        <div className="rounded-2xl border border-rd-line bg-rd-surface p-4 space-y-3 shadow-2xs">
          <div>
            <span className="block text-rd-13 font-semibold text-rd-ink">
              {T.com.contactoTitulo}
            </span>
            <span className="block text-rd-11 text-rd-ink-2 mt-0.5">
              {T.com.contactoSub}
            </span>
          </div>

          <Field
            {...PILDORA}
            id="c-tel"
            etiqueta={T.com.tel}
            tipo="tel"
            icono={ico.celular}
            autoComplete="tel"
            valor={e.com.contacto.tel}
            onChange={alEscribir('c-tel', (v) => patchComContacto({ tel: v }))}
            onBlur={alSalir('c-tel', ['requerido', 'celular'], T.errores.celular)}
            error={error('c-tel')}
          />

          <Field
            {...PILDORA}
            id="c-correo"
            etiqueta={T.com.correo}
            tipo="email"
            icono={ico.correo}
            autoComplete="email"
            valor={e.com.contacto.correo}
            onChange={alEscribir('c-correo', (v) => patchComContacto({ correo: v }))}
            onBlur={alSalir('c-correo', ['requerido', 'correo'], T.errores.correo)}
            error={error('c-correo')}
          />
        </div>
      </div>
    </>
  );

  const esOrg = e.perfil === 'organizacion';
  const pantallaPersona = (
    <>
      {titulo(T.persona.titulo)}
      <div ref={cuerpoRef} className="mt-5 space-y-3 text-left">
        <Field {...PILDORA} id="p-nombre" etiqueta={T.persona.nombre} icono={ico.persona} autoComplete="name" valor={e.per.nombre} onChange={alEscribir('p-nombre', (v) => patchPer({ nombre: v }))} onBlur={alSalir('p-nombre', ['requerido'], T.errores.nombre)} error={error('p-nombre')} />
        <Field
          {...PILDORA}
          id="p-tipo-doc"
          etiqueta={T.persona.tipoDoc}
          tipo="select"
          opciones={TIPOS_DOC}
          valor={e.per.tipoDocumento}
          onChange={(v) => patchPer({ tipoDocumento: v })}
        />
        <Field
          {...PILDORA}
          id="p-cedula"
          etiqueta={T.persona.cedula}
          icono={ico.documento}
          inputMode="numeric"
          valor={e.per.cedula}
          onChange={alEscribir('p-cedula', (v) => patchPer({ cedula: v }))}
          onBlur={alSalir('p-cedula', ['requerido'], T.errores.cedula)}
          error={error('p-cedula')}
        />
        {esOrg && (
          <Field {...PILDORA} id="p-cargo" etiqueta={T.persona.cargo} opcional icono={ico.cargo} autoComplete="organization-title" valor={e.per.cargo} onChange={(v) => patchPer({ cargo: v })} />
        )}
        <Field
          {...PILDORA}
          id="p-tel"
          opcional
          etiqueta={T.persona.celular}
          tipo="tel"
          icono={ico.celular}
          autoComplete="tel"
          ayuda={T.persona.ayudaCelular}
          valor={e.per.tel}
          onChange={alEscribir('p-tel', (v) => patchPer({ tel: v }))}
          onBlur={alSalir('p-tel', ['celular'], T.errores.celularFormato)}
          error={error('p-tel')}
        />
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
        <div className="flex justify-center py-2">
          <Turnstile
            onVerify={(token) => patchPer({ captchaToken: token })}
            onError={() => patchPer({ captchaToken: '' })}
            onExpire={() => patchPer({ captchaToken: '' })}
            appearance="always"
            size="flexible"
            theme="light"
            language="es"
          />
        </div>
        <Field
          id="q-terminos"
          etiqueta={
            <span className="text-rd-13 text-rd-ink-2">
              Acepto los{' '}
              <a href={RUTAS.terminos} target="_blank" rel="noreferrer" className="font-semibold text-rd-ink underline hover:text-rd-navy">
                términos y condiciones
              </a>{' '}
              y la{' '}
              <a href={RUTAS.privacidad} target="_blank" rel="noreferrer" className="font-semibold text-rd-ink underline hover:text-rd-navy">
                política de privacidad
              </a>
            </span>
          }
          tipo="checkbox"
          marcado={e.per.terminos}
          onChangeMarcado={(v) => patchPer({ terminos: v })}
        />
      </div>
    </>
  );

  const pantallaIndDatos = (
    <>
      {titulo(T.individual.tituloDatos, T.individual.subDatos)}
      <div ref={cuerpoRef} className="mt-5 space-y-3 text-left">
        <Field
          {...PILDORA}
          id="ind-nombre"
          etiqueta={T.individual.nombre}
          icono={ico.persona}
          autoComplete="given-name"
          valor={e.ind.nombre}
          onChange={alEscribir('ind-nombre', (v) => patchInd({ nombre: v }))}
          onBlur={alSalir('ind-nombre', ['requerido'], T.individual.errorNombre)}
          error={error('ind-nombre')}
        />
        <Field
          {...PILDORA}
          id="ind-apellido"
          etiqueta={T.individual.apellido}
          icono={ico.persona}
          autoComplete="family-name"
          valor={e.ind.apellido}
          onChange={alEscribir('ind-apellido', (v) => patchInd({ apellido: v }))}
          onBlur={alSalir('ind-apellido', ['requerido'], T.individual.errorApellido)}
          error={error('ind-apellido')}
        />
        <Field
          {...PILDORA}
          id="ind-tipo-doc"
          etiqueta={T.individual.tipoDoc}
          tipo="select"
          opciones={TIPOS_DOC}
          valor={e.ind.tipoDocumento}
          onChange={(v) => patchInd({ tipoDocumento: v })}
        />
        <Field
          {...PILDORA}
          id="ind-num-doc"
          etiqueta={T.individual.numeroDoc}
          icono={ico.documento}
          inputMode="numeric"
          valor={e.ind.numeroDocumento}
          onChange={alEscribir('ind-num-doc', (v) => patchInd({ numeroDocumento: v }))}
          onBlur={alSalir('ind-num-doc', ['requerido'], T.individual.errorDoc)}
          error={error('ind-num-doc')}
        />
        <Field
          {...PILDORA}
          id="ind-tel"
          etiqueta={T.individual.celular}
          tipo="tel"
          icono={ico.celular}
          autoComplete="tel"
          valor={e.ind.celular}
          onChange={alEscribir('ind-tel', (v) => patchInd({ celular: v }))}
          onBlur={alSalir('ind-tel', ['requerido', 'celular'], T.errores.celular)}
          error={error('ind-tel')}
        />
      </div>
    </>
  );

  const pantallaIndCuenta = (
    <>
      {titulo(T.individual.tituloCuenta, T.individual.subCuenta)}
      <div ref={cuerpoRef} className="mt-5 space-y-3 text-left">
        <Field
          {...PILDORA}
          id="ind-correo"
          etiqueta={T.individual.correo}
          tipo="email"
          icono={ico.correo}
          autoComplete="email"
          valor={e.ind.correo}
          onChange={alEscribir('ind-correo', (v) => patchInd({ correo: v }))}
          onBlur={alSalir('ind-correo', ['requerido', 'correo'], T.errores.correo)}
          error={error('ind-correo')}
        />
        <div>
          <Field
            {...PILDORA}
            id="ind-pass"
            etiqueta={T.individual.contrasena}
            tipo="password"
            icono={ico.contrasena}
            autoComplete="new-password"
            valorInicial={pass.current.ip}
            onChange={guardarPass('ip')}
          />
          <PasswordRules className="mt-2" id="ind-reglas" contrasena={pass.current.ip || ''} correo={e.ind.correo} />
        </div>
        <Field
          {...PILDORA}
          id="ind-repetir"
          etiqueta={T.individual.repetir}
          tipo="password"
          icono={ico.contrasena}
          autoComplete="new-password"
          valorInicial={pass.current.iq}
          onChange={guardarPass('iq')}
          error={pass.current.iq && pass.current.ip !== pass.current.iq ? T.cuenta.noCoinciden : null}
        />
        <div className="flex justify-center py-2">
          <Turnstile
            onVerify={(token) => patchInd({ captchaToken: token })}
            onError={() => patchInd({ captchaToken: '' })}
            onExpire={() => patchInd({ captchaToken: '' })}
            appearance="always"
            size="flexible"
            theme="light"
            language="es"
          />
        </div>
        <Field
          id="ind-terminos"
          etiqueta={
            <span className="text-rd-13 text-rd-ink-2">
              Acepto los{' '}
              <a href={RUTAS.terminos} target="_blank" rel="noreferrer" className="font-semibold text-rd-ink underline hover:text-rd-navy">
                términos y condiciones
              </a>{' '}
              y la{' '}
              <a href={RUTAS.privacidad} target="_blank" rel="noreferrer" className="font-semibold text-rd-ink underline hover:text-rd-navy">
                política de privacidad
              </a>
            </span>
          }
          tipo="checkbox"
          marcado={e.ind.terminos}
          onChangeMarcado={(v) => patchInd({ terminos: v })}
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
    const quien = esOrg ? e.org.nombre : e.perfil === 'individual' ? `${e.ind.nombre} ${e.ind.apellido}` : e.com.nombre;
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
        {esOrg && (
          <InlineNotice
            variante={e.org.documentoAdjunto ? 'pendiente' : 'info'}
            icono={<ShieldCheck className="h-4 w-4" />}
            titulo={e.org.documentoAdjunto ? 'Documento en revisión' : T.exito.sinVerificarTitulo}
            texto={
              e.org.documentoAdjunto
                ? 'Revisaremos el documento para otorgar la insignia de verificación.'
                : T.exito.sinVerificarTexto(panel)
            }
          />
        )}
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
    ind_datos: pantallaIndDatos,
    ind_cuenta: pantallaIndCuenta,
  };

  /* `key` por paso: React reutilizaría un `Field` que quede en la misma posición del paso
     anterior (p-tel → q-repetir) y su efecto de montaje —el que repone la contraseña— no
     correría. Con la clave, cambiar de paso es remontar la pantalla. */
  const contenido = e.listo ? (
    exito
  ) : e.modo === 'login' ? (
    login
  ) : e.modo === 'recuperar' ? (
    pantallaRecuperar
  ) : e.modo === 'recuperar_enviado' ? (
    pantallaRecuperarEnviado
  ) : e.modo === 'nueva_contrasena' ? (
    pantallaNuevaContrasena
  ) : (
    <React.Fragment key={paso.id}>
      {pantallas[paso.id]}
      {pie}
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
