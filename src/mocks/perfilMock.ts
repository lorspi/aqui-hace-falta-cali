/**
 * Datos simulados del Perfil (mockup/*): la persona con sesión es Carlos Peña, enlace de
 * Bomberos Voluntarios Usme (la misma cuenta de la Radar y del panel; `panelMock.ORG.enlace`).
 * Origen: `YO` y `CANALES` de `Producto/src/perfil.html`.
 */
import type { CanalAviso, Persona, Sesion } from '../types/perfil';

export const YO: Persona = {
  nombre: 'Carlos Peña',
  cargo: 'Coordinador de operaciones',
  tel: '+57 310 555 0199',
  mismoWa: true,
  wa: '',
  correo: 'carlos.pena@bomberosusme.org',
  desde: 'marzo de 2026',
  pais: 'Colombia',
};

export const SESIONES: Sesion[] = [
  { id: 1, dispositivo: 'Este computador, Chrome, Bogotá', cuando: 'ahora', actual: true },
  { id: 2, dispositivo: 'Celular, Android, Bogotá', cuando: 'hace 3 horas', actual: false },
];

export const CANALES: CanalAviso[] = [
  { id: 'recibir', titulo: 'Te entregaron algo', detalle: 'Para que confirmes que llegó', wa: true, correo: true, fijo: true },
  { id: 'solicitud', titulo: 'Te piden algo de tu oferta', detalle: 'Para que aceptes o digas que no puedes', wa: true, correo: false, fijo: true },
  { id: 'devuelta', titulo: 'Devolvieron una entrega tuya', detalle: 'Deja de contar como resuelta', wa: true, correo: true, fijo: true },
  { id: 'compromiso', titulo: 'Se comprometieron con tu necesidad', detalle: 'Para que sepas que viene ayuda', wa: true, correo: false },
  { id: 'camino', titulo: 'Una entrega va en camino', detalle: 'Con la hora en que llega', wa: false, correo: false },
  { id: 'confirmada', titulo: 'Confirmaron tu entrega', detalle: 'Ya cuenta como resuelta', wa: false, correo: false },
  { id: 'vence', titulo: 'Tu oferta está por vencer', detalle: 'Tres días antes, por si la amplías', wa: false, correo: true },
  { id: 'revalidar', titulo: 'Tu necesidad lleva días sin avance', detalle: 'Para que confirmes si sigue haciendo falta', wa: true, correo: false },
  { id: 'cuenta', titulo: 'Cambios en tu cuenta', detalle: 'Insignia, accesos y correo', wa: false, correo: true },
];
