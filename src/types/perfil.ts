/**
 * Contratos del Perfil (mockup/*): la persona con sesión y sus ajustes. Origen:
 * `Producto/src/perfil.html` del prototipo («Configuración y perfil»). Los datos de la
 * organización no van aquí: viven en la pestaña Datos del panel (`DatosOrg`).
 */
export interface Persona {
  nombre: string;
  cargo: string;
  tel: string;
  mismoWa: boolean;
  wa: string;
  correo: string;
  /** «marzo de 2026». */
  desde: string;
  pais: string;
}

export interface Sesion {
  id: number;
  dispositivo: string;
  cuando: string;
  actual: boolean;
}

/** Por qué canales llega cada tipo de aviso. En RaDAR siempre; los demás se eligen. Los
 *  avisos que piden hacer algo (`fijo`) necesitan al menos un canal fuera de RaDAR. */
export interface CanalAviso {
  id: string;
  titulo: string;
  detalle: string;
  wa: boolean;
  correo: boolean;
  fijo?: boolean;
}

export type PestanaPerfil = 'datos' | 'acceso' | 'avisos' | 'seguridad';
