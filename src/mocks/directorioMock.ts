/**
 * Las entidades del Directorio (mockup/*): una por organización que publica en la Radar
 * (`publicacionesMock.ts`, misma llave `nombre` = `Publicacion.org`, mismas coordenadas), con
 * los datos de contacto que la Radar no muestra. Origen: `ORGS` y `COMUNIDADES` de
 * `Producto/src/organizaciones.html`, cuadrados con las publicaciones de la maqueta.
 */
import type { Entidad } from '../types/directorio';

export const ENTIDADES: Entidad[] = [
  /* ---- organizaciones (ofrecen; algunas también piden) ---- */
  { id: 'bomberos-usme', nombre: 'Bomberos Voluntarios Usme', tipo: 'Cuerpo de socorro', clase: 'organizacion', verificada: true, zona: 'Usme', lat: 4.51, lng: -74.115, dir: 'Estación Usme, Cl. 91 sur #3-20', tel: '+57 601 555 2020', wa: true, correo: 'contacto@bomberosusme.org', entregas: 14 },
  { id: 'cruz-roja', nombre: 'Cruz Roja seccional Bogotá', tipo: 'Cuerpo de socorro', clase: 'organizacion', verificada: true, zona: 'Teusaquillo', lat: 4.612, lng: -74.185, dir: 'Av. 68 #68B-31', tel: '+57 601 428 0000', wa: false, correo: 'bogota@cruzroja.org.co', entregas: 57 },
  { id: 'manos-unidas', nombre: 'Fundación Manos Unidas', tipo: 'Fundación', clase: 'organizacion', verificada: true, zona: 'Kennedy', lat: 4.506, lng: -74.108, dir: 'Cl. 42 sur #78-12', tel: '+57 320 555 7788', wa: true, entregas: 22 },
  { id: 'parroquia-san-bernardino', nombre: 'Parroquia San Bernardino', tipo: 'Parroquia', clase: 'organizacion', verificada: false, zona: 'Bosa', lat: 4.604, lng: -74.199, dir: 'Cl. 63 sur #85-20', tel: '+57 601 555 8090', wa: true, entregas: 6 },
  { id: 'alcaldia-usme', nombre: 'Alcaldía local de Usme', tipo: 'Entidad pública', clase: 'organizacion', verificada: true, zona: 'Usme', lat: 4.517, lng: -74.112, dir: 'Cl. 137B sur #14-24', tel: '+57 601 769 9600', wa: false, correo: 'cdi.usme@gobiernobogota.gov.co', entregas: 19 },
  { id: 'bomberos-marichuela', nombre: 'Bomberos Marichuela', tipo: 'Cuerpo de socorro', clase: 'organizacion', verificada: true, zona: 'Marichuela', lat: 4.565, lng: -74.123, dir: 'Cra. 1 este #75 sur-40', tel: '+57 601 555 3110', wa: true, entregas: 9 },
  { id: 'colombia-unida', nombre: 'Fundación Colombia Unida', tipo: 'Fundación', clase: 'organizacion', verificada: true, zona: 'Bosa', lat: 4.6197, lng: -74.202, dir: 'Cra. 80 #57-40 sur, Bosa', tel: '+57 601 555 4410', wa: true, correo: 'ayuda@colombiaunida.org', entregas: 31 },
  { id: 'vitelma', nombre: 'Centro de salud Vitelma', tipo: 'Centro de salud', clase: 'organizacion', verificada: true, zona: 'Vitelma', lat: 4.582, lng: -74.079, dir: 'Cl. 4 sur #5 este-40', tel: '+57 601 555 6100', wa: false, correo: 'vitelma@subredsur.gov.co', entregas: 3 },
  { id: 'hospital-usme', nombre: 'Hospital de Usme', tipo: 'Hospital', clase: 'organizacion', verificada: true, zona: 'Usme', lat: 4.514, lng: -74.121, dir: 'Cl. 91 sur #3-30', tel: '+57 601 555 7300', wa: false, correo: 'urgencias@hospitalusme.gov.co', entregas: 2 },

  /* ---- comunidades (piden) ---- */
  { id: 'jac-san-francisco', nombre: 'JAC Barrio San Francisco', tipo: 'Junta de acción comunal', clase: 'comunidad', verificada: false, zona: 'San Francisco', lat: 4.568, lng: -74.166, dir: 'Cra. 19C #74 sur-12', tel: '+57 312 456 7890', wa: true, lider: 'Javier Rojas, líder comunitario', personas: 140, familias: 34, entregas: 0 },
  { id: 'albergue-bosa', nombre: 'Albergue Bosa', tipo: 'Albergue temporal', clase: 'comunidad', verificada: false, zona: 'Bosa', lat: 4.608, lng: -74.19, dir: 'Cra. 80 #57-40 sur', tel: '+57 601 555 6677', wa: true, lider: 'Comité de acogida', personas: 140, entregas: 0 },
  { id: 'jac-el-recuerdo', nombre: 'JAC El Recuerdo', tipo: 'Junta de acción comunal', clase: 'comunidad', verificada: false, zona: 'Bosa', lat: 4.615, lng: -74.196, dir: 'Cl. 59 sur #97-22', tel: '+57 313 555 1140', wa: true, lider: 'Camilo Estévez, presidente de la JAC', familias: 28, entregas: 0 },
  { id: 'comedor-villa-gloria', nombre: 'Comedor Villa Gloria', tipo: 'Comedor comunitario', clase: 'comunidad', verificada: false, zona: 'Ciudad Bolívar', lat: 4.601, lng: -74.183, dir: 'Diagonal 70 sur #34-05', tel: '+57 311 555 9021', wa: true, lider: 'Martha Gómez, coordinadora', familias: 85, entregas: 0 },
  { id: 'jac-vereda-el-destino', nombre: 'JAC Vereda El Destino', tipo: 'Junta de acción comunal', clase: 'comunidad', verificada: false, zona: 'Usme rural', lat: 4.499, lng: -74.13, dir: 'Vereda El Destino, km 12 vía Usme', tel: '+57 315 555 6012', wa: true, lider: 'Alonso Neuta, presidente de la JAC', familias: 42, entregas: 0 },
  { id: 'colegio-rafael-uribe', nombre: 'Colegio Rafael Uribe Uribe', tipo: 'Colegio y albergue temporal', clase: 'comunidad', verificada: true, zona: 'Rafael Uribe Uribe', lat: 4.571, lng: -74.118, dir: 'Cl. 32 sur #23-20', tel: '+57 601 555 2190', wa: true, lider: 'Rectoría y comité de acogida', personas: 220, entregas: 0 },
  /* ---- fuera de Bogotá (Cali, Medellín, Mocoa), las mismas que publican en la Radar ---- */
  { id: 'cruz-roja-valle', nombre: 'Cruz Roja seccional Valle', tipo: 'Cuerpo de socorro', clase: 'organizacion', verificada: true, ciudad: 'cali', zona: 'San Fernando', lat: 3.452, lng: -76.532, dir: 'Cra. 38 #5-25', tel: '+57 602 555 8100', wa: true, correo: 'valle@cruzrojacolombiana.org', entregas: 14 },
  { id: 'antioquia-presente', nombre: 'Fundación Antioquia Presente', tipo: 'Fundación', clase: 'organizacion', verificada: true, ciudad: 'medellin', zona: 'La Candelaria', lat: 6.244, lng: -75.581, dir: 'Cl. 52 #47-42', tel: '+57 604 555 2210', wa: true, correo: 'contacto@antioquiapresente.org', entregas: 7 },
  { id: 'jac-potrero-grande', nombre: 'JAC Potrero Grande', tipo: 'Junta de acción comunal', clase: 'comunidad', verificada: false, ciudad: 'cali', zona: 'Potrero Grande', lat: 3.418, lng: -76.478, dir: 'Cra. 28E #121-30', tel: '+57 316 555 4470', wa: true, lider: 'Rosa Angulo, presidenta de la JAC', familias: 96, entregas: 0 },
  { id: 'albergue-san-miguel', nombre: 'Albergue San Miguel', tipo: 'Albergue temporal', clase: 'comunidad', verificada: false, ciudad: 'mocoa', zona: 'San Miguel', lat: 1.149, lng: -76.652, dir: 'Barrio San Miguel, vía al Pepino', tel: '+57 314 555 7735', wa: true, lider: 'Comité de acogida', personas: 60, entregas: 0 },
];

/** La entidad con sesión (la misma cuenta de la Radar y del panel). */
export const ENTIDAD_PROPIA = 'Bomberos Voluntarios Usme';
