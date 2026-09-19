/**
 * Contratos de los avisos (mockup/*): lo que le pasa a la cuenta con lo suyo. Origen:
 * `Producto/assets/avisos.js` del prototipo de RaDAR.
 *
 *   tipo    de qué es el aviso; decide el icono y su color, y el grupo de la página.
 *   leido   en falso cuenta en la campana.
 *   accion  la única que toca; su nivel lo da la consecuencia (primario compromete,
 *           secundario cambia un dato propio, terciario solo navega).
 */
export type TipoAviso = 'solicitud' | 'compromiso' | 'camino' | 'recibir' | 'confirmada' | 'devuelta' | 'vence' | 'revalidar' | 'cuenta';

export type DiaAviso = 'hoy' | 'ayer' | 'antes';

export interface AccionAviso {
  texto: string;
  nivel: 'primario' | 'secundario' | 'terciario';
  /** Ruta a la que lleva, o el nombre de lo que hace en la maqueta (`confirmar`, `revalidar`). */
  al: string;
}

export interface Aviso {
  id: number;
  tipo: TipoAviso;
  cuando: string;
  dia: DiaAviso;
  leido: boolean;
  quien: string;
  titulo: string;
  detalle: string;
  accion: AccionAviso | null;
}
