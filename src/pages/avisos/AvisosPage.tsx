import React, { useEffect, useState } from 'react';
import { Bell, Hand, HeartHandshake } from 'lucide-react';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { ListaAvisos } from '../../components/ui/Avisos';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { Vacio } from '../../components/ui/Vacio';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { RECIBIDAS, SOLICITUDES } from '../../mocks/panelMock';
import type { Aviso } from '../../types/aviso';
import { nombrePanel } from '../../utils/cuenta';
import { modulosGuardados, pendientesCuenta } from '../../utils/panel';

/**
 * Los Avisos (mockup/*): la página de `avisos.html` del prototipo. La misma lista de la
 * campana (`ListaAvisos`, agrupada por día), aquí completa y con el detalle: Todos · Sin leer,
 * «Marcar todos como leídos» y la acción que cada aviso pide. Es la pestaña Avisos de la
 * barra bajo 1024; desde 1024 la campana de la cabecera lleva aquí con «Ver todos».
 */
type Filtro = 'todos' | 'nuevos';

function irA(ruta: string): void {
  window.location.href = ruta;
}

export const AvisosPage: React.FC = () => (
  <AvisosProvider>
    <Avisos />
  </AvisosProvider>
);

const Avisos: React.FC = () => {
  const avisar = useAviso();
  const [avisos, setAvisos] = useState<Aviso[]>(AVISOS);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [cajon, setCajon] = useState(false);

  useEffect(() => {
    document.title = 'RaDAR · Avisos';
  }, []);

  const sinLeer = avisos.filter((a) => !a.leido).length;
  const lista = filtro === 'nuevos' ? avisos.filter((a) => !a.leido) : avisos;

  const leerTodos = () => {
    setAvisos((l) => l.map((a) => ({ ...a, leido: true })));
    avisar('Todos los avisos quedaron leídos', { tipo: 'ok' });
  };
  const accionDeAviso = (a: Aviso) => {
    setAvisos((l) => l.map((x) => (x.id === a.id ? { ...x, leido: true } : x)));
    if (!a.accion) return;
    if (a.accion.al === 'confirmar') avisar(`Confirmaste lo que llegó de ${a.quien}`, { tipo: 'ok' });
    else if (a.accion.al === 'revalidar') avisar('Tu necesidad sigue arriba en el mapa', { tipo: 'ok' });
    else irA(a.accion.al);
  };

  return (
    <Shell seccion="avisos" panelNombre={nombrePanel()} cuenta={CUENTA} pendientes={pendientesCuenta(modulosGuardados(), { sol: SOLICITUDES, recibidas: RECIBIDAS })} avisosNuevos={sinLeer} rutas={RUTAS_SHELL} onPedir={() => irA(RUTAS.pedir)} onOfrecer={() => irA(RUTAS.ofrecer)} cajonAbierto={cajon} onCerrarCajon={() => setCajon(false)}>
      <div className="flex h-full min-h-0 flex-col max-lg:min-h-dvh">
        <header className="flex flex-none flex-wrap items-center gap-3 border-b border-rd-line px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="font-rd m-0 text-rd-22 leading-tight font-semibold tracking-rd-titulo text-rd-ink">Avisos</h1>
          <span className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 lg:flex">
              <Button nivel="pedir" tamano="md" icono={<Hand className="h-4 w-4" />} onClick={() => irA(RUTAS.pedir)}>
                Pedir ayuda
              </Button>
              <Button nivel="primario" tamano="md" icono={<HeartHandshake className="h-4 w-4" />} onClick={() => irA(RUTAS.ofrecer)}>
                Ofrecer ayuda
              </Button>
            </span>
            <BotonMenu onClick={() => setCajon(true)} abierto={cajon} />
          </span>
        </header>

        {/* ---- consulta: Todos · Sin leer, y marcar todos ---- */}
        <div className="flex flex-none flex-wrap items-center gap-3 border-b border-rd-line bg-rd-surface px-4 py-2 max-lg:gap-2 sm:px-6 lg:px-8">
          <Segmented<Filtro>
            etiquetaGrupo="Qué avisos ver"
            valor={filtro}
            onChange={setFiltro}
            opciones={[
              { id: 'todos', etiqueta: 'Todos', n: avisos.length },
              { id: 'nuevos', etiqueta: 'Sin leer', n: sinLeer },
            ]}
          />
          <Button nivel="terciario" tamano="md" className="ml-auto" onClick={leerTodos} disabled={sinLeer === 0}>
            Marcar todos como leídos
          </Button>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto bg-rd-fondo px-3 pt-3 pb-24 sm:px-6 sm:pt-4 lg:px-8 lg:pb-6">
          <section className="mx-auto max-w-3xl rounded-rd-xl border border-rd-line bg-rd-surface p-1.5 sm:py-2 sm:px-2">
            {lista.length === 0 ? <Vacio icono={<Bell className="h-6.5 w-6.5" />} titulo={filtro === 'nuevos' ? 'Nada sin leer' : 'Nada nuevo'} texto="Cuando pase algo con lo tuyo, aparece aquí." /> : <ListaAvisos avisos={lista} onAccion={accionDeAviso} />}
          </section>
        </main>
      </div>
    </Shell>
  );
};
