import React, { useEffect, useState } from 'react';
import type { Publicacion } from '../../types/publicacion';
import { estadoRecurso, cifra, restante, unidad } from '../../utils/publicaciones';
import { cantidadDe, type Compromiso } from '../../utils/compromiso';
import { Casilla } from './Casilla';
import { Dialogo, Opciones } from './Dialogo';

/**
 * Sin bajada: el título ya pregunta y cada fila ya dice lo que falta o lo que queda. Hubo una
 * y se cayó (Alejandro, 23 de septiembre de 2026): explicaba el funcionamiento de las casillas
 * en vez de ayudar, que es exactamente lo que el manual prohíbe en un subtítulo («una pregunta
 * clara no necesita escolta»).
 *
 * «Ayudar» (en una necesidad) / «Solicitar» (en una oferta): `comprometer()` de `acciones.js`.
 * Una fila por recurso con saldo —marcada por defecto, con lo que falta o queda debajo y la
 * cantidad editable— y cuándo llega o cuándo lo recogen. Sin backend: al enviar, quien llama
 * recibe qué y cuánto, pone la publicación «En proceso» y avisa.
 *
 * Rehecho el 22 de septiembre de 2026. Lo que estaba mal:
 *  - **Las cantidades se tiraban.** Se enviaba `datos.getAll('rec').length`, o sea cuántas
 *    casillas quedaron marcadas; los números que escribía la persona no llegaban a ninguna
 *    parte y el aviso decía «3 recursos» sin decir cuántos de cada cosa. Ahora viajan en
 *    `Compromiso.partes` y el aviso los dice.
 *  - **La columna de números salía torcida** (37 px de diferencia entre la primera fila y la
 *    tercera): cada fila usaba `justify-between` y las etiquetas miden distinto. Ahora el campo
 *    vive en una caja de ancho fijo con la unidad dentro, así que todas caen en la misma línea.
 *  - **Desmarcar no se notaba**: el campo de esa fila seguía activo y se podía enviar el
 *    diálogo con todo desmarcado. Ahora el campo se apaga con su fila y sin nada marcado no se
 *    puede enviar.
 *  - La casilla nativa pasó a ser la dibujada del sistema (`Casilla`).
 */
export interface DialogoCompromisoProps {
  publicacion: Publicacion | null;
  onCerrar: () => void;
  onEnviar: (publicacion: Publicacion, compromiso: Compromiso) => void;
}

const CUANDO = ['Hoy', 'Mañana', 'Esta semana'].map((t) => ({ valor: t, texto: t }));

interface EstadoFila {
  marcado: boolean;
  cantidad: string;
}

export const DialogoCompromiso: React.FC<DialogoCompromisoProps> = ({ publicacion: p, onCerrar, onEnviar }) => {
  const esNecesidad = p?.tipo === 'necesidad';
  const filas = (p?.recursos ?? []).map((r, i) => ({ i, r, queda: restante(r) })).filter((f) => f.queda > 0);
  const [estado, setEstado] = useState<Record<number, EstadoFila>>({});

  /* Al abrir otra publicación se vuelve a empezar: todo marcado y con el saldo entero. Depende
     solo del id, no de `filas`, que se reconstruye en cada pintada. */
  const id = p?.id ?? '';
  useEffect(() => {
    if (!p) return;
    const inicial: Record<number, EstadoFila> = {};
    p.recursos.forEach((r, i) => {
      const queda = restante(r);
      if (queda > 0) inicial[i] = { marcado: true, cantidad: cifra(queda) };
    });
    setEstado(inicial);
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de publicación */
  }, [id]);

  const filaDe = (i: number, queda: number): EstadoFila => estado[i] ?? { marcado: true, cantidad: cifra(queda) };
  const cambiar = (i: number, cambio: Partial<EstadoFila>) => setEstado((e) => ({ ...e, [i]: { ...filaDe(i, 0), ...e[i], ...cambio } }));
  const elegidas = filas.filter((f) => filaDe(f.i, f.queda).marcado);

  return (
    <Dialogo
      abierto={p !== null}
      titulo={p ? `${esNecesidad ? '¿Con qué puedes ayudar a' : '¿Qué le solicitas a'} ${p.org}?` : ''}
      accion={esNecesidad ? 'Ayudar' : 'Solicitar'}
      accionActiva={elegidas.length > 0}
      onCerrar={onCerrar}
      onEnviar={(form) => {
        if (!p || elegidas.length === 0) return;
        const datos = new FormData(form);
        onEnviar(p, {
          partes: elegidas.map(({ i, r, queda }) => ({ item: r.item, cantidad: cantidadDe(filaDe(i, queda).cantidad, queda), unidad: r.unidad })),
          cuando: String(datos.get('cuando') ?? ''),
        });
      }}
    >
      {filas.length === 0 ? (
        <p className="mb-4 rounded-rd-md border border-rd-line bg-rd-fondo px-3 py-3 text-rd-13 text-rd-ink-2">
          {esNecesidad ? 'Esta necesidad ya está cubierta. Puedes ver otras cerca de ti.' : 'De esta oferta ya no queda nada. Puedes ver otras cerca de ti.'}
        </p>
      ) : (
        <ul className="m-0 mb-3 flex list-none flex-col p-0">
          {filas.map(({ i, r, queda }) => {
            const f = filaDe(i, queda);
            const unidadFila = unidad(cantidadDe(f.cantidad, queda), r.unidad);
            /* Bajo 640 el campo baja a su propio renglón, sangrado hasta el texto: con él al
               lado, «Plantas eléctricas / Generadores» se parte en tres. Abajo sigue en columna
               con los demás, que es lo que se quería. */
            return (
              <li key={r.item} className="flex items-center gap-x-3 gap-y-2 border-b border-rd-line-soft py-2.5 last:border-b-0 max-sm:flex-wrap">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 max-sm:basis-full">
                  <input
                    type="checkbox"
                    checked={f.marcado}
                    onChange={(e) => cambiar(i, { marcado: e.target.checked })}
                    className="peer sr-only"
                  />
                  <Casilla marca={f.marcado ? 'si' : 'no'} className="mt-0.5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rd-navy" />
                  <span className="min-w-0">
                    <span className={`block text-rd-13-5 leading-snug font-semibold ${f.marcado ? 'text-rd-ink' : 'text-rd-ink-meta'}`}>{r.item}</span>
                    <span className="block text-rd-12-5 text-rd-ink-meta tabular-nums">{p ? estadoRecurso(r, p.tipo) : ''}</span>
                  </span>
                </label>
                {/* La caja de ancho fijo con la unidad dentro es lo que mantiene los números en
                    columna, midan lo que midan los nombres de los recursos. */}
                <span
                  className={`flex h-rd-h-md w-36 shrink-0 items-center rounded-rd-sm border transition-colors max-sm:ml-6.5 pointer-coarse:h-rd-tactil focus-within:border-rd-navy focus-within:ring-3 focus-within:ring-rd-navy-soft ${f.marcado ? 'border-rd-line bg-rd-surface hover:not-focus-within:border-rd-ink-3' : 'border-rd-line-soft bg-rd-sunken'}`}
                >
                  {/* Texto, no `type="number"`: la etiqueta de al lado dice «faltan 1.500 L» y un
                      campo numérico nativo no acepta ese punto de miles, así que daba el valor
                      por inválido y lo enviaba vacío. Se escribe como se lee y `numero()` lo
                      interpreta (el mismo trato que `CampoNumero` en los flujos). */}
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={!f.marcado}
                    value={f.cantidad}
                    onChange={(e) => cambiar(i, { cantidad: e.target.value })}
                    onBlur={() => cambiar(i, { cantidad: cifra(cantidadDe(f.cantidad, queda)) })}
                    aria-label={`Cuánto de ${r.item}`}
                    className="font-rd min-w-0 flex-1 bg-transparent px-2 text-right text-rd-13-5 text-rd-ink tabular-nums focus:outline-none disabled:text-rd-ink-meta"
                  />
                  <span className={`shrink-0 pr-2.5 pl-1 text-rd-12-5 font-semibold ${f.marcado ? 'text-rd-ink-2' : 'text-rd-ink-meta'}`}>{unidadFila}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {filas.length > 0 && <Opciones nombre="cuando" etiqueta={esNecesidad ? 'Cuándo llega' : 'Cuándo lo necesitas'} opciones={CUANDO} />}
    </Dialogo>
  );
};
