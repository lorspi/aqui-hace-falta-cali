/**
 * La lógica del panel (pura, sin React): qué módulos tiene abiertos la cuenta, qué pestañas
 * y cifras salen de eso, y qué necesita atención. Decisión de Alejandro (16 de septiembre de
 * 2026): el panel no depende de si la cuenta es organización o comunidad, sino de lo que
 * hizo. Publicar una necesidad abre `pide`; publicar una oferta abre `ofrece`.
 */
import type { ModulosCuenta } from '../types/cuenta';
import type { Acta, BloqueResumen, EntregaRecibida, EstadoSolicitud, Kpi, NecesidadPublicada, OfertaPublicada, Pendiente, PestanaPanel, RecursoOfrecido, Solicitud, TramoBarra } from '../types/panel';
import { DIAS_PARA_ARCHIVAR } from '../mocks/panelMock';

const CLAVE = 'rd-modulos';

/** Los módulos abiertos: lo guardado al publicar, o lo que diga la URL para verlo sin
 *  publicar (`?modulos=pide,ofrece` · `?modulos=ninguno`). */
export function leerModulos(search = '', guardado: string | null = null): ModulosCuenta {
  const forzado = new URLSearchParams(search).get('modulos');
  if (forzado !== null) return { pide: forzado.includes('pide'), ofrece: forzado.includes('ofrece') };
  try {
    const g = guardado ? (JSON.parse(guardado) as Partial<ModulosCuenta>) : null;
    const tienePide = !!g?.pide || (typeof window !== 'undefined' && !!localStorage.getItem('rd-necesidad-creada-gestion'));
    const tieneOfrece = !!g?.ofrece || (typeof window !== 'undefined' && !!localStorage.getItem('rd-oferta-creada-gestion'));
    return { pide: tienePide, ofrece: tieneOfrece };
  } catch {
    return { pide: false, ofrece: false };
  }
}

export function modulosGuardados(): ModulosCuenta {
  try {
    return leerModulos(window.location.search, localStorage.getItem(CLAVE));
  } catch {
    return { pide: false, ofrece: false };
  }
}

/** Publicar abre el módulo para siempre: lo llaman los flujos al publicar. */
export function activarModulo(modulo: keyof ModulosCuenta): void {
  try {
    const actual = leerModulos('', localStorage.getItem(CLAVE));
    localStorage.setItem(CLAVE, JSON.stringify({ ...actual, [modulo]: true }));
  } catch {
    /* sin almacenamiento */
  }
}

/** Las pestañas: lo que se pide antes que lo que se ofrece, Seguimiento unificado para
 *  ambas caras, y siempre Resumen al principio y Mi equipo al final. */
export function pestanasDe(m: ModulosCuenta, conteos: { porConfirmarRecibidas: number; nuevas: number; porConfirmar: number }): PestanaPanel[] {
  const p: PestanaPanel[] = [{ id: 'resumen', nombre: 'Resumen' }];
  if (m.pide) {
    p.push({ id: 'necesidades', nombre: 'Mis necesidades', modulo: 'pide' });
  }
  if (m.ofrece) {
    p.push({ id: 'ofertas', nombre: 'Mis ofertas', modulo: 'ofrece' });
  }
  /* Seguimiento unificado para ambas caras (organización y líder comunitario) */
  if (m.pide || m.ofrece) {
    const badge = (m.ofrece ? conteos.nuevas : 0) + (m.pide ? conteos.porConfirmarRecibidas : 0);
    p.push({ id: 'seguimiento', nombre: 'Seguimiento', n: badge });
  }
  /* Reportes solo cuando hay algo que reportar: entregas confirmadas de alguna cara. */
  if (m.pide || m.ofrece) p.push({ id: 'reportes', nombre: 'Reportes' });
  p.push({ id: 'equipo', nombre: 'Mi equipo' });
  return p;
}

/* ---------- cuentas sobre lo que se ofrece ---------- */

export function cantidadPorEstado(sol: Solicitud[], rec: string, estados: Solicitud['estado'][]): number {
  return sol.filter((s) => s.rec === rec && estados.includes(s.estado)).reduce((t, s) => t + s.cant, 0);
}

/** Lo que queda de un recurso ofrecido: el total menos todo lo comprometido, en camino,
 *  entregado o confirmado. */
export function quedan(sol: Solicitud[], r: RecursoOfrecido): number {
  return Math.max(0, r.total - cantidadPorEstado(sol, r.n, ['aceptada', 'camino', 'entregada', 'confirmada', 'archivada']));
}

export function nuevas(sol: Solicitud[]): number {
  return sol.filter((s) => s.estado === 'nueva').length;
}

export function porConfirmar(sol: Solicitud[]): Solicitud[] {
  return sol.filter((s) => s.estado === 'entregada');
}

/** La métrica norte sale solo de las solicitudes: en verde únicamente lo confirmado
 *  (archivarlas no las descuenta). */
export function confirmadas(sol: Solicitud[]): number {
  return sol.filter((s) => s.estado === 'confirmada' || s.estado === 'archivada').length;
}

/** Las confirmadas con 30 días o más pasan solas a Archivadas (Alejandro, 16 de septiembre
 *  de 2026): el tablero es para lo que está pasando, no un histórico. Corre al abrir el panel. */
export function archivarViejas(sol: Solicitud[], hoy: Date, dias = DIAS_PARA_ARCHIVAR): Solicitud[] {
  const limite = hoy.getTime() - dias * 24 * 60 * 60 * 1000;
  return sol.map((s) => (s.estado === 'confirmada' && s.cerradaEl && new Date(`${s.cerradaEl}T12:00:00`).getTime() <= limite ? { ...s, estado: 'archivada' } : s));
}

/* ---------- cuentas sobre lo que se pide ---------- */

export function recibidasPorConfirmar(rec: EntregaRecibida[]): EntregaRecibida[] {
  return rec.filter((r) => r.estado === 'entregada');
}

/* ---------- lo que se ve en el resumen ---------- */

/** Los cuadritos: cuatro estados de las entregas de esa cara, los mismos que cuenta la barra. */
export function kpisDe(m: ModulosCuenta, d: { oferta: OfertaPublicada; sol: Solicitud[]; necesidad: NecesidadPublicada; recibidas: EntregaRecibida[] }): Kpi[] {
  const k: Kpi[] = [];
  const cuenta = (lista: { estado: EstadoSolicitud }[], e: EstadoSolicitud) => lista.filter((x) => x.estado === e).length;
  if (m.pide) {
    const comp = cuenta(d.recibidas, 'aceptada');
    const camino = cuenta(d.recibidas, 'camino');
    const porConf = recibidasPorConfirmar(d.recibidas).length;
    /* Cada cuadrito es un tramo de la barra, con la misma cifra: las archivadas van aparte. */
    const conf = cuenta(d.recibidas, 'confirmada');
    k.push({ k: 'Comprometidas', v: comp, d: comp === 1 ? 'entrega que alguien va a traer' : 'entregas que alguien va a traer', estado: 'aceptada' });
    k.push({ k: 'En camino', v: camino, d: 'hacia ti', estado: 'camino' });
    k.push({ k: 'Por confirmar', v: porConf, d: 'te llegaron, falta tu confirmación', estado: 'entregada' });
    k.push({ k: 'Confirmadas', v: conf, d: 'sin archivar', estado: 'confirmada' });
  }
  if (m.ofrece) {
    k.push({ k: 'Nuevas', v: nuevas(d.sol), d: 'esperan respuesta', estado: 'nueva' });
    k.push({ k: 'En camino', v: cuenta(d.sol, 'camino'), d: 'entregas hoy', estado: 'camino' });
    k.push({ k: 'Por confirmar', v: porConfirmar(d.sol).length, d: 'entregadas, sin confirmar', estado: 'entregada' });
    k.push({ k: 'Confirmadas', v: cuenta(d.sol, 'confirmada'), d: 'sin archivar', estado: 'confirmada' });
  }
  return k;
}

const TEXTO_TRAMO: Record<EstadoSolicitud, string> = { nueva: 'Nuevas', aceptada: 'Comprometidas', camino: 'En camino', entregada: 'Por confirmar', confirmada: 'Confirmadas', archivada: 'Archivadas' };

/** Cuántas entregas hay en cada estado, en el orden del ciclo, sin los estados vacíos. */
export function tramosPorEstado(lista: { estado: EstadoSolicitud }[]): TramoBarra[] {
  return (Object.keys(TEXTO_TRAMO) as EstadoSolicitud[]).map((estado) => ({ estado, texto: TEXTO_TRAMO[estado], n: lista.filter((x) => x.estado === estado).length })).filter((t) => t.n > 0);
}

/** Los bloques del Resumen: uno por cara abierta, cada uno con sus cifras y su barra. Las
 *  cifras son las mismas de `kpisDe`; la barra cuenta las entregas de esa cara por estado. */
export function bloquesResumen(m: ModulosCuenta, d: { oferta: OfertaPublicada; sol: Solicitud[]; necesidad: NecesidadPublicada; recibidas: EntregaRecibida[] }): BloqueResumen[] {
  const b: BloqueResumen[] = [];
  if (m.pide) {
    b.push({
      id: 'pide',
      titulo: 'Lo que pediste',
      enlace: { texto: 'Ver mis necesidades', al: '#necesidades' },
      kpis: kpisDe({ pide: true, ofrece: false }, d),
      barraTitulo: 'Entregas hacia ti',
      barra: tramosPorEstado(d.recibidas),
    });
  }
  if (m.ofrece) {
    b.push({
      id: 'ofrece',
      titulo: 'Lo que ofreces',
      enlace: { texto: 'Ver el seguimiento', al: '#seguimiento' },
      kpis: kpisDe({ pide: false, ofrece: true }, d),
      barraTitulo: 'Solicitudes recibidas',
      barra: tramosPorEstado(d.sol),
    });
  }
  return b;
}

/** Lo que espera a la persona, en dos niveles: primero las decisiones (responder, confirmar lo
 *  recibido), luego las operaciones en curso (asignar, en camino, certificar, fechas). Cada
 *  pendiente trae su acción a la mano: se resuelve desde el Resumen, sin ir a la pestaña. */
export function pendientesDe(m: ModulosCuenta, d: { oferta: OfertaPublicada; sol: Solicitud[]; recibidas: EntregaRecibida[] }): Pendiente[] {
  const p: Pendiente[] = [];
  if (m.pide) {
    /* Lo que nos llegó y falta confirmar va primero: es lo único que bloquea. */
    recibidasPorConfirmar(d.recibidas).forEach((r) =>
      p.push({ id: `rec-${r.id}`, grupo: 'decision', icono: 'paquete', titulo: `Confirma lo que te llegó de ${r.org}`, detalle: `${r.cant} ${r.u} de ${r.rec.toLowerCase()} · entregado ${r.cuando}`, accion: { texto: 'Confirmar recibido', nivel: 'primario', al: `confirmar:${r.id}` }, bloquea: true }),
    );
  }
  if (m.ofrece) {
    d.sol.filter((s) => s.estado === 'nueva').forEach((s) => p.push({ id: `nueva-${s.id}`, grupo: 'decision', icono: 'nueva', titulo: `${s.quien} pide ${s.cant} ${s.u} de ${s.rec.toLowerCase()}`, detalle: `${s.cuando}${s.dist ? ` · a ${s.dist}` : ''}`, accion: { texto: 'Aceptar', nivel: 'primario', al: `aceptar:${s.id}` }, secundaria: { texto: 'No podemos', al: `rechazar:${s.id}` } }));
    d.sol.filter((s) => s.estado === 'aceptada' && !s.vol).forEach((s) => p.push({ id: `sin-${s.id}`, grupo: 'operacion', icono: 'equipo', titulo: `${s.quien} · ${s.cant} ${s.u} de ${s.rec.toLowerCase()} sin quien lo lleve`, detalle: 'Aceptada, sin asignar', accion: { texto: 'Asignar', nivel: 'primario', al: `asignar:${s.id}` } }));
    d.sol.filter((s) => s.estado === 'camino').forEach((s) => p.push({ id: `cam-${s.id}`, grupo: 'operacion', icono: 'camino', titulo: `${s.quien} · ${s.cant} ${s.u} de ${s.rec.toLowerCase()} en camino`, detalle: s.cuando, accion: { texto: 'Ver el seguimiento', nivel: 'secundario', al: '#seguimiento' } }));
    porConfirmar(d.sol).forEach((s) => p.push({ id: `conf-${s.id}`, grupo: 'operacion', icono: 'tiempo', titulo: `${s.quien} no ha confirmado la ${s.rec.toLowerCase()}`, detalle: `Entregada ${s.cuando}`, accion: { texto: 'Certificar', nivel: 'primario', al: `certificar:${s.id}` }, secundaria: { texto: 'Recordar', al: `recordar:${s.id}` } }));
    const ali = d.oferta.recursos.find((r) => r.n === 'Alimentos');
    if (ali && /sep/.test(ali.disp)) p.push({ id: 'vence', grupo: 'operacion', icono: 'aviso', titulo: `Los alimentos dejan de estar disponibles el 20 sep`, detalle: `Quedan ${quedan(d.sol, ali)} ${ali.unidad}`, accion: { texto: 'Ampliar la fecha', nivel: 'secundario', al: '#ofertas' } });
  }
  return p;
}

/** Lo que pasa al certificar, según si el otro lado ya confirmó. */
export function textoCertificar(s: Pick<Solicitud, 'quien' | 'cierre'>): string {
  return s.cierre?.recibe ? `${s.quien} ya la confirmó; con tu certificación queda cerrada por los dos lados.` : `Queda certificada de tu lado y le avisamos a ${s.quien} para que la confirme.`;
}

/** Cómo quedó cerrada una entrega, en una frase: quién la confirmó. Las fotos van aparte,
 *  como galería (Alejandro, 16 de septiembre de 2026), sin conteo en el texto. */
export function textoCierre(s: Pick<Solicitud, 'quien' | 'cierre'>): string {
  const c = s.cierre ?? {};
  if (c.entrega && c.recibe) return `Confirmada por ti y por ${s.quien}`;
  if (c.recibe) return `Confirmada por ${s.quien}`;
  if (c.entrega) return `Certificada por ti · ${s.quien} aún no confirma`;
  return 'Confirmada';
}

/** Cuántas cosas esperan a la persona: lo que muestra la píldora y el side nav. */
export function pendientesCuenta(m: ModulosCuenta, d: { sol: Solicitud[]; recibidas: EntregaRecibida[] }): number {
  return (m.ofrece ? nuevas(d.sol) + porConfirmar(d.sol).length : 0) + (m.pide ? recibidasPorConfirmar(d.recibidas).length : 0);
}

/* ---------- reportes: las actas de entrega ---------- */

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «12 sep 2026» desde AAAA-MM-DD. */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MES[m - 1]} ${a}`;
}

/** Las siglas de una organización para el código del acta: hasta tres letras. */
export function siglas(nombre: string): string {
  return nombre
    .replace(/[·,]/g, ' ')
    .split(/\s+/)
    .filter((p) => p && !/^(de|del|la|el|los|las|y)$/i.test(p))
    .slice(0, 3)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

/** Las actas: una por entrega confirmada o archivada, de las dos caras, la más reciente
 *  primero. Numeradas por orden de cierre dentro de la cuenta. */
export function actasDe(m: ModulosCuenta, d: { sol: Solicitud[]; recibidas: EntregaRecibida[]; org: string; lleva: (s: Solicitud) => string | null }): Acta[] {
  const lista: Omit<Acta, 'codigo'>[] = [];
  if (m.ofrece) {
    d.sol
      .filter((s) => (s.estado === 'confirmada' || s.estado === 'archivada') && s.cerradaEl)
      .forEach((s) => {
        const v = d.lleva(s);
        lista.push({ lado: 'ofrece', fecha: s.cerradaEl!, fechaTexto: fechaCorta(s.cerradaEl!), entrego: d.org, recibio: s.quien, rec: s.rec, cant: s.cant, u: s.u, lleva: v ?? undefined, cierre: s.cierre ?? {}, confirmacion: textoCierre(s), historia: s.cierre?.historia, origen: { tipo: 'solicitud', id: s.id } });
      });
  }
  if (m.pide) {
    d.recibidas
      .filter((r) => (r.estado === 'confirmada' || r.estado === 'archivada') && r.cerradaEl)
      .forEach((r) => {
        lista.push({ lado: 'pide', fecha: r.cerradaEl!, fechaTexto: fechaCorta(r.cerradaEl!), entrego: r.org, recibio: d.org, rec: r.rec, cant: r.cant, u: r.u, lleva: r.vol ?? undefined, cierre: r.cierre ?? {}, confirmacion: textoCierreRecibida(r), historia: r.cierre?.historia, origen: { tipo: 'recibida', id: r.id } });
      });
  }
  const ordenadas = [...lista].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const sig = siglas(d.org);
  return ordenadas
    .map((a, i) => ({ ...a, codigo: `RD-${a.fecha.slice(0, 4)}-${sig}-${String(i + 1).padStart(4, '0')}` }))
    .reverse();
}

/** El cierre visto desde quien recibe: quién confirmó. */
export function textoCierreRecibida(r: Pick<EntregaRecibida, 'org' | 'cierre'>): string {
  const c = r.cierre ?? {};
  if (c.entrega && c.recibe) return `Confirmada por ti y por ${r.org}`;
  if (c.recibe) return 'Confirmada por ti';
  if (c.entrega) return `Certificada por ${r.org} · falta tu confirmación`;
  return 'Confirmada';
}

/** El acta en texto plano, para copiar y pegar (WhatsApp, un informe). */
export function textoActa(a: Acta): string {
  const lineas = [
    `Acta de entrega ${a.codigo} · RaDAR de ayuda`,
    `Fecha: ${a.fechaTexto}`,
    `Entregó: ${a.entrego}`,
    `Recibió: ${a.recibio}`,
    `Qué: ${a.cant} ${a.u} de ${a.rec.toLowerCase()}`,
    a.lleva ? `La llevó: ${a.lleva}` : '',
    `Cierre: ${a.confirmacion}`,
    a.historia ? `Lo que permitió: ${a.historia}` : '',
  ];
  return lineas.filter(Boolean).join('\n');
}

/** Las cifras de la cabecera de Reportes: cuántas actas y cuántas organizaciones distintas. */
export function resumenActas(actas: Acta[]): { actas: number; organizaciones: number } {
  const otras = new Set(actas.map((a) => (a.lado === 'ofrece' ? a.recibio : a.entrego)));
  return { actas: actas.length, organizaciones: otras.size };
}
