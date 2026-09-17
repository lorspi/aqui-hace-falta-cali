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
    titulo: '¿Qué organización es?',
    nombre: 'Nombre de la organización',
    tipo: 'Tipo de organización',
  },

  com: {
    titulo: '¿Qué comunidad representas?',
    nombre: 'Barrio, vereda o sector',
    tipo: 'Tipo de comunidad',
    departamento: 'Departamento',
  },

  persona: {
    titulo: '¿A quién le escribimos?',
    nombre: 'Nombre y apellidos',
    cargo: 'Cargo',
    cedula: 'Cédula',
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
