import React, { useEffect, useState } from 'react';
import type { MiembroEquipo, RecursoOfrecido, RecursoPedido, RolPlataforma, Solicitud } from '../../types/panel';
import type { Foto } from '../../types/flujo';
import { EQUIPO } from '../../mocks/panelMock';
import { cifra } from '../../utils/publicaciones';
import { Dialogo, Opciones } from '../../components/ui/Dialogo';
import { Field } from '../../components/ui/Field';
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
export const DialogoAsignar: React.FC<{
  solicitud: Solicitud | null;
  equipo?: MiembroEquipo[];
  onCerrar: () => void;
  onAsignar: (id: number, vol: number) => void;
}> = ({ solicitud: s, equipo = EQUIPO, onCerrar, onAsignar }) => (
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
    <Opciones
      nombre="vol"
      etiqueta="Del equipo"
      opciones={equipo.map((e) => ({ valor: String(e.id), texto: `${e.n} · ${e.veh}` }))}
      inicial={String(s?.vol ?? equipo[0]?.id ?? 1)}
      columna
    />
  </Dialogo>
);

/**
 * Diálogo para editar un recurso ofrecido directamente desde «Mis ofertas».
 */
export const DialogoEditarRecursoOfrecido: React.FC<{
  recurso: RecursoOfrecido | null;
  onCerrar: () => void;
  onGuardar: (actualizado: RecursoOfrecido) => void;
}> = ({ recurso: r, onCerrar, onGuardar }) => {
  const [total, setTotal] = useState('');
  const [unidad, setUnidad] = useState('');
  const [disp, setDisp] = useState('');
  const [pres, setPres] = useState('');

  useEffect(() => {
    if (r) {
      setTotal(String(r.total));
      setUnidad(r.unidad);
      setDisp(r.disp);
      setPres(r.pres);
    }
  }, [r]);

  if (!r) return null;

  return (
    <Dialogo
      abierto={r !== null}
      titulo={`Editar oferta de ${r.n}`}
      accion="Guardar cambios"
      onCerrar={onCerrar}
      onEnviar={() => {
        const num = parseFloat(total);
        onGuardar({
          ...r,
          total: isNaN(num) || num <= 0 ? r.total : num,
          unidad: unidad.trim() || r.unidad,
          disp: disp.trim() || r.disp,
          pres: pres.trim() || r.pres,
        });
        onCerrar();
      }}
    >
      <p className="mb-4 text-rd-14 text-rd-ink-2">
        Ajusta las cantidades disponibles y detalles de este recurso para la coordinación en el Radar.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="edit-of-total"
          etiqueta="Cantidad total disponible"
          tipo="text"
          inputMode="numeric"
          valor={total}
          onChange={setTotal}
          requerido
        />
        <Field
          id="edit-of-unidad"
          etiqueta="Unidad de medida"
          tipo="text"
          valor={unidad}
          onChange={setUnidad}
          requerido
        />
        <div className="sm:col-span-2">
          <Field
            id="edit-of-disp"
            etiqueta="Disponibilidad"
            tipo="text"
            valor={disp}
            onChange={setDisp}
            ayuda="Ej. «Hasta agotar», «Hasta el 30 de septiembre» o «48 horas»"
            requerido
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            id="edit-of-pres"
            etiqueta="Presentación o empaque"
            tipo="text"
            valor={pres}
            onChange={setPres}
            ayuda="Ej. «Carrotanque», «Kits de mercado de 15 kg» o «5 a 20 kW»"
          />
        </div>
      </div>
    </Dialogo>
  );
};

/**
 * Diálogo para editar una necesidad publicada directamente desde «Mis necesidades».
 */
export const DialogoEditarRecursoPedido: React.FC<{
  recurso: RecursoPedido | null;
  onCerrar: () => void;
  onGuardar: (actualizado: RecursoPedido) => void;
}> = ({ recurso: r, onCerrar, onGuardar }) => {
  const [total, setTotal] = useState('');
  const [unidad, setUnidad] = useState('');
  const [para, setPara] = useState('');

  useEffect(() => {
    if (r) {
      setTotal(String(r.total));
      setUnidad(r.unidad);
      setPara(r.para);
    }
  }, [r]);

  if (!r) return null;

  return (
    <Dialogo
      abierto={r !== null}
      titulo={`Editar necesidad de ${r.n}`}
      accion="Guardar cambios"
      onCerrar={onCerrar}
      onEnviar={() => {
        const num = parseFloat(total);
        onGuardar({
          ...r,
          total: isNaN(num) || num <= 0 ? r.total : num,
          unidad: unidad.trim() || r.unidad,
          para: para.trim() || r.para,
        });
        onCerrar();
      }}
    >
      <p className="mb-4 text-rd-14 text-rd-ink-2">
        Modifica la meta requerida y la justificación para que las organizaciones aliadas conozcan tu situación.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="edit-ped-total"
          etiqueta="Cantidad que hace falta"
          tipo="text"
          inputMode="numeric"
          valor={total}
          onChange={setTotal}
          requerido
        />
        <Field
          id="edit-ped-unidad"
          etiqueta="Unidad"
          tipo="text"
          valor={unidad}
          onChange={setUnidad}
          requerido
        />
        <div className="sm:col-span-2">
          <Field
            id="edit-ped-para"
            etiqueta="Destino o justificación"
            tipo="textarea"
            filas={2}
            valor={para}
            onChange={setPara}
            ayuda="Ej. «Para las familias albergadas en el salón comunal»"
            requerido
          />
        </div>
      </div>
    </Dialogo>
  );
};

/**
 * Diálogo para registrar a un nuevo miembro en el equipo de la organización.
 */
export const DialogoRegistrarMiembro: React.FC<{
  abierto: boolean;
  onCerrar: () => void;
  onRegistrar: (m: Omit<MiembroEquipo, 'id' | 'hechas'>) => void;
}> = ({ abierto, onCerrar, onRegistrar }) => {
  const [nombre, setNombre] = useState('');
  const [tel, setTel] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('Conducción');
  const [veh, setVeh] = useState('Camioneta 4×4');
  const [rolPlataforma, setRolPlataforma] = useState<RolPlataforma>('coordinador');
  const [disp, setDisp] = useState<MiembroEquipo['disp']>('hoy');
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorTel, setErrorTel] = useState<string | null>(null);

  const reset = () => {
    setNombre('');
    setTel('');
    setCorreo('');
    setRol('Conducción');
    setVeh('Camioneta 4×4');
    setRolPlataforma('coordinador');
    setDisp('hoy');
    setErrorNombre(null);
    setErrorTel(null);
  };

  const cerrar = () => {
    reset();
    onCerrar();
  };

  return (
    <Dialogo
      abierto={abierto}
      titulo="Registrar a alguien en tu equipo"
      accion="Registrar miembro"
      onCerrar={cerrar}
      onEnviar={() => {
        let hayError = false;
        if (!nombre.trim()) {
          setErrorNombre('El nombre es obligatorio');
          hayError = true;
        } else {
          setErrorNombre(null);
        }
        if (!tel.trim()) {
          setErrorTel('El teléfono es obligatorio para coordinar');
          hayError = true;
        } else {
          setErrorTel(null);
        }
        if (hayError) return;

        onRegistrar({
          n: nombre.trim(),
          tel: tel.trim(),
          correo: correo.trim() || `${nombre.toLowerCase().trim().replace(/\s+/g, '.')}@organizacion.org`,
          rol,
          veh,
          rolPlataforma,
          disp,
        });
        cerrar();
      }}
    >
      <p className="mb-4 text-rd-14 text-rd-ink-2">
        Agrega a un colaborador o voluntario. Podrás asignarle solicitudes y entregas en el tablero de seguimiento.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            id="miembro-nombre"
            etiqueta="Nombre y apellidos"
            tipo="text"
            valor={nombre}
            onChange={(v) => {
              setNombre(v);
              if (errorNombre) setErrorNombre(null);
            }}
            error={errorNombre}
            placeholder="Ej. Mateo Rojas"
            autoComplete="name"
            requerido
          />
        </div>
        <Field
          id="miembro-tel"
          etiqueta="Celular"
          tipo="tel"
          inputMode="tel"
          valor={tel}
          onChange={(v) => {
            setTel(v);
            if (errorTel) setErrorTel(null);
          }}
          error={errorTel}
          placeholder="+57 310 000 0000"
          autoComplete="tel"
          requerido
        />
        <Field
          id="miembro-correo"
          etiqueta="Correo electrónico"
          tipo="email"
          opcional
          valor={correo}
          onChange={setCorreo}
          placeholder="correo@ejemplo.org"
          autoComplete="email"
        />
        <Field
          id="miembro-rol"
          etiqueta="Qué hace en terreno"
          tipo="select"
          valor={rol}
          onChange={setRol}
          opciones={['Qué hace en terreno', 'Conducción', 'Logística y bodega', 'Rescate', 'Salud', 'Coordinación']}
        />
        <Field
          id="miembro-veh"
          etiqueta="Vehículo"
          tipo="select"
          valor={veh}
          onChange={setVeh}
          opciones={['Vehículo disponible', 'Camioneta 4×4', 'Moto', 'Carro', 'Camión / Furgón', 'Sin vehículo']}
        />
        <Field
          id="miembro-disp"
          etiqueta="Disponibilidad habitual"
          tipo="select"
          valor={disp === 'hoy' ? 'Hoy' : disp === 'manana' ? 'Mañana' : 'Fin de semana'}
          onChange={(v) => {
            if (v === 'Mañana') setDisp('manana');
            else if (v === 'Fin de semana') setDisp('finde');
            else setDisp('hoy');
          }}
          opciones={['Disponibilidad', 'Hoy', 'Mañana', 'Fin de semana']}
        />
        <Field
          id="miembro-acceso"
          etiqueta="Acceso en RaDAR"
          tipo="select"
          valor={rolPlataforma === 'admin' ? 'Administra' : rolPlataforma === 'auditor' ? 'Solo ve' : 'Coordina entregas'}
          onChange={(v) => {
            if (v === 'Administra') setRolPlataforma('admin');
            else if (v === 'Solo ve') setRolPlataforma('auditor');
            else setRolPlataforma('coordinador');
          }}
          opciones={['Acceso en RaDAR', 'Coordina entregas', 'Administra', 'Solo ve']}
        />
      </div>
    </Dialogo>
  );
};

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
