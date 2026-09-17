import React, { useState } from 'react';
import type { Solicitud } from '../../types/panel';
import type { Foto } from '../../types/flujo';
import { EQUIPO } from '../../mocks/panelMock';
import { cifra } from '../../utils/publicaciones';
import { Dialogo, Opciones } from '../../components/ui/Dialogo';
import { CampoFotos } from '../flujos/comunes';

/**
 * Los diálogos del panel que comparten varias pestañas.
 *
 * `DialogoAsignar`: quién lleva una entrega, elegido del equipo. Va en diálogo y no en un
 * `<select>` dentro de la tarjeta porque el `index.css` del repo fuerza los selects a 16 px bajo
 * 768 (contra el zoom de iOS) y se ven enormes en una tarjeta de 280.
 *
 * `DialogoCierre`: cerrar una entrega con foto, desde cualquiera de los dos lados (Alejandro,
 * 16 de septiembre de 2026): quien entrega la certifica y quien recibe la confirma. Las fotos
 * son opcionales y no salen del navegador en la maqueta; se cuenta cuántas se adjuntaron.
 */
export const DialogoAsignar: React.FC<{ solicitud: Solicitud | null; onCerrar: () => void; onAsignar: (id: number, vol: number) => void }> = ({ solicitud: s, onCerrar, onAsignar }) => (
  <Dialogo
    abierto={s !== null}
    titulo={s ? `¿Quién lleva ${cifra(s.cant)} ${s.u} de ${s.rec.toLowerCase()}?` : ''}
    accion="Asignar"
    onCerrar={onCerrar}
    onEnviar={(form) => {
      if (!s) return;
      const id = Number(new FormData(form).get('vol'));
      onCerrar();
      if (id) onAsignar(s.id, id);
    }}
  >
    <p className="mb-4 text-rd-14 text-rd-ink-2">
      A {s?.quien}
      {s?.dist ? `, a ${s.dist}` : ''}. Le avisamos a quien elijas y queda con la entrega en su lista.
    </p>
    <Opciones nombre="vol" etiqueta="Del equipo" opciones={EQUIPO.map((e) => ({ valor: String(e.id), texto: `${e.n} · ${e.veh}` }))} inicial={String(s?.vol ?? EQUIPO[0].id)} columna />
  </Dialogo>
);

export const DialogoCierre: React.FC<{ abierto: boolean; titulo: string; texto: string; accion: string; onCerrar: () => void; onEnviar: (fotos: number) => void }> = ({ abierto, titulo, texto, accion, onCerrar, onEnviar }) => {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [pesados, setPesados] = useState(0);
  const cerrar = () => {
    setFotos([]);
    setPesados(0);
    onCerrar();
  };
  return (
    <Dialogo
      abierto={abierto}
      titulo={titulo}
      accion={accion}
      onCerrar={cerrar}
      onEnviar={() => {
        const n = fotos.length;
        setFotos([]);
        setPesados(0);
        onEnviar(n);
      }}
    >
      <p className="mb-4 text-rd-14 text-rd-ink-2">{texto}</p>
      <p className="mb-2 text-rd-13 font-semibold text-rd-ink">Fotos de la entrega (opcionales)</p>
      <CampoFotos fotos={fotos} onAgregar={(nuevas, p) => {
        setFotos((l) => [...l, ...nuevas]);
        setPesados(p);
      }} onQuitar={(i) => setFotos((l) => l.filter((_, k) => k !== i))} error={pesados ? `${pesados === 1 ? 'Un archivo pesa' : `${pesados} archivos pesan`} más de 25 MB y no ${pesados === 1 ? 'se adjuntó' : 'se adjuntaron'}.` : null} />
    </Dialogo>
  );
};
