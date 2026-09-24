/**
 * Todo el texto visible de la experiencia de registro (mockup/registro-v2), en la voz de
 * RaDAR según `Producto/MANUAL-DE-ESTILO.md`: tú, calma, concreto, cercano, honesto; una idea
 * por frase; sin subtítulos que expliquen el sistema; botones en infinitivo; sin signos de
 * exclamación ni emojis. Pasada de Alejandro del 16 de septiembre de 2026 («me da cringe»).
 * El i18n no entra en T12 (solo español).
 */
export const TEXTOS = {
  titulo: 'RaDAR · Registro',
  logoAria: 'RaDAR de ayuda · inicio',

  portada: {
    linea1: 'Lo que hace falta',
    pide: 'y lo que hay,',
    da: 'en un mismo mapa',
  },

  conmutador: {
    grupo: 'Ingresar o crear cuenta',
    login: 'Iniciar sesión',
    registro: 'Crear cuenta',
  },

  login: {
    correo: 'Correo',
    contrasena: 'Contraseña',
    entrar: 'Entrar',
    olvido: '¿Olvidaste la contraseña?',
    errorCorreo: 'Escribe tu correo',
  },

  recuperar: {
    titulo: '¿Olvidaste tu contraseña?',
    sub: 'Escribe el correo con el que te registraste. Te enviaremos un enlace para restablecerla.',
    correo: 'Correo',
    enviar: 'Enviar enlace de recuperación',
    volver: 'Volver a iniciar sesión',
    enviadoTitulo: 'Revisa tu correo',
    enviadoSub: 'Si el correo está registrado en RaDAR, te llegará un enlace en pocos minutos. Revisa también tu carpeta de spam.',
    simularEnlace: 'Simular apertura del enlace',
    nuevaTitulo: 'Crea tu nueva contraseña',
    nuevaSub: 'Elige una contraseña segura cumpliendo con los requisitos de seguridad.',
    nuevaPass: 'Nueva contraseña',
    repetirPass: 'Repite la nueva contraseña',
    guardar: 'Actualizar contraseña e iniciar sesión',
    exitoTitulo: 'Contraseña actualizada',
    exitoSub: 'Ya puedes acceder con tu nueva contraseña.',
  },

  perfil: {
    pregunta: '¿Quién eres?',
  },

  rapida: {
    titulo: 'Crea tu cuenta para ver el contacto',
    sub: 'Cuatro datos y listo.',
    nombre: 'Nombre y apellidos',
    celular: 'Celular',
    correo: 'Correo',
    contrasena: 'Contraseña',
    crear: 'Crear la cuenta y ver el contacto',
  },

  org: {
    titulo: 'Datos de la organización',
    nombre: 'Nombre de la organización',
    tipo: 'Tipo de organización',
    nit: 'NIT',
    web: 'Sitio web o red social',
    contactoTitulo: 'Contacto de la organización',
    contactoSub: 'Es el que ven quienes buscan ayuda y por donde se comunican los apoyos.',
    tel: 'Celular de contacto',
    mismoWa: 'Este número también es WhatsApp',
    wa: 'WhatsApp de la organización',
    correo: 'Correo de contacto',
    docTitulo: 'Documento de representación legal',
    docSub: 'Con él la organización sale con la insignia de verificación.',
    docAdjuntado: 'Adjuntado correctamente.',
    adjuntar: 'Adjuntar',
    cambiar: 'Cambiar',
  },

  com: {
    titulo: 'Datos de la comunidad',
    nombre: 'Nombre de la comunidad',
    tipo: 'Tipo de comunidad',
    departamento: 'Departamento',
    referencia: 'Punto de referencia',
    contactoTitulo: 'Contacto de la comunidad',
    contactoSub: 'Por donde se comunican los apoyos a la comunidad.',
    tel: 'Celular de contacto',
    mismoWa: 'Este número también es WhatsApp',
    wa: 'WhatsApp de la comunidad',
    correo: 'Correo de contacto',
  },

  persona: {
    titulo: 'Tus datos',
    nombre: 'Nombre y apellidos',
    cargo: 'Cargo',
    tipoDoc: 'Tipo de documento',
    cedula: 'Número de documento',
    celular: 'Celular',
    ayudaCelular: 'Solo para avisarte. No se publica.',
    mismoWa: 'Este número también es WhatsApp',
    wa: 'WhatsApp',
  },

  cuenta: {
    titulo: 'Tu cuenta',
    sub: 'Con este correo entras y recibes los avisos.',
    correo: 'Correo',
    contrasena: 'Contraseña',
    repetir: 'Repite la contraseña',
    noCoinciden: 'Las dos contraseñas no coinciden',
  },

  individual: {
    tituloDatos: 'Tus datos',
    subDatos: 'Escribe tu nombre y documento de identidad.',
    nombre: 'Nombre',
    apellido: 'Apellido',
    tipoDoc: 'Tipo de documento',
    numeroDoc: 'Número de documento',
    errorNombre: 'Escribe tu nombre',
    errorApellido: 'Escribe tu apellido',
    errorDoc: 'Escribe tu número de documento',
    tituloCuenta: 'Tu cuenta',
    subCuenta: 'Con este correo entras y recibes los avisos.',
    correo: 'Correo',
    celular: 'Número celular',
    contrasena: 'Contraseña',
    repetir: 'Repite la contraseña',
  },

  pie: {
    volver: 'Volver',
    continuar: 'Continuar',
    crear: 'Crear la cuenta',
  },

  legal: {
    antes: 'Al continuar aceptas los',
    terminos: 'términos y condiciones',
    y: 'y la',
    privacidad: 'política de privacidad',
  },

  exito: {
    rapidaTitulo: 'Listo, tu cuenta está creada',
    rapidaSub: 'Ya puedes ver el contacto. Si lo que necesitas no aparece, publícalo.',
    verContacto: 'Ver el contacto',
    publicar: 'Publicar lo que necesito',
    titulo: (quien: string) => `Listo, ${quien} ya está en RaDAR`,
    quienPorDefecto: 'tu cuenta',
    panelPorDefecto: 'tu panel',
    sub: 'Desde el mapa pides ayuda o publicas lo que tienes.',
    irMapa: 'Ir al mapa',
    sinVerificarTitulo: 'Sin verificar',
    sinVerificarTexto: (panel: string) => `Para la insignia de verificada, sube el documento de representación en ${panel}.`,
    comoFunciona: 'Ver cómo funciona',
  },

  errores: {
    requerido: 'Este dato hace falta',
    nombre: 'Escribe tu nombre',
    nombreOrg: 'Escribe el nombre de la organización',
    nombreCom: 'Escribe el nombre de la comunidad',
    cedula: 'Escribe tu número de documento',
    celular: 'Escribe tu celular',
    celularFormato: 'Un celular tiene 10 dígitos',
    correo: 'Escribe tu correo',
    correoFormato: 'Revisa el correo: falta el @ o el punto',
  },

  panel: {
    aria: 'Qué es RaDAR',
    listaAria: 'Qué hace RaDAR',
    pausar: 'Pausar',
    reanudar: 'Reanudar',
    seNecesita: 'Se necesita',
  },
} as const;
