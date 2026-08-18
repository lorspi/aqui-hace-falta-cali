# Autenticación y Roles

## Sistema de Autenticación

La plataforma usa un sistema de autenticación propio (sin OAuth ni proveedores externos) basado en sesiones con tokens.

### Flujo de Login

1. El usuario ingresa email y contraseña en el formulario de `/panel`
2. El frontend llama a `api.auth.login` con las credenciales
3. El backend busca el usuario por email, verifica la contraseña, genera un token de sesión
4. El token se almacena en `localStorage` (key: `ahf_admin_token`)
5. Las funciones protegidas reciben el token como argumento y lo validan internamente

### Token de Sesión

- Longitud: 48+ caracteres alfanuméricos
- Expiración: 24 horas
- Almacenamiento: `localStorage` en el navegador
- No hay refresh token — al expirar, el usuario debe volver a loguearse

### Codificación de Contraseñas

> ⚠️ **Nota de seguridad**: La implementación actual usa una codificación XOR simple, NO un hash seguro (bcrypt/argon2). Es determinística y reversible. Fue diseñada como MVP para desarrollo rápido durante la emergencia.

**Para producción de alto riesgo**: Se recomienda migrar a bcrypt usando una Convex Action con runtime Node.js.

La codificación usa una clave fija (`AquiHaceFalta2026CaliEmergencia`) y XOR carácter por carácter, convirtiendo el resultado a hexadecimal.

---

## Roles

### ADMIN (Administrador)

Acceso completo a todas las funcionalidades:
- Todo lo que puede hacer un MODERATOR
- Gestión de usuarios (crear, editar, desactivar, eliminar)
- Eliminación de necesidades y ofertas
- No puede eliminarse a sí mismo

### MODERATOR (Moderador)

Acceso a funciones de moderación:
- Ver panel de administración
- Verificar/archivar necesidades y ofertas
- Editar contenido de necesidades (marca cambios como `[MOD] nombre`)
- Resolver reportes
- Ver métricas y logs de auditoría
- Ver lista de todas las necesidades/ofertas (sin filtros públicos)

### Público (sin autenticación)

Acceso a funciones públicas:
- Ver necesidades y ofertas (solo las visibles públicamente)
- Crear necesidades y ofertas
- Editar información (protegido por Turnstile)
- Actualizar estado
- Reportar contenido

---

## Control de Acceso

### Patrón de Verificación

Todas las funciones protegidas siguen este patrón:

```typescript
async function requireAuth(ctx, token) {
  // 1. Buscar sesión por token
  const session = await ctx.db.query("sessions")
    .withIndex("by_token", q => q.eq("token", token))
    .first();
  
  // 2. Verificar que existe y no expiró
  if (!session || new Date(session.expiresAt) < new Date()) {
    throw new Error("Sesión expirada");
  }
  
  // 3. Obtener usuario y verificar que esté activo
  const user = await ctx.db.get(session.userId);
  if (!user || !user.active) {
    throw new Error("Usuario no encontrado o desactivado");
  }
  
  return user;
}
```

### Matriz de Permisos

| Acción | Público | MODERATOR | ADMIN |
|--------|---------|-----------|-------|
| Ver necesidades/ofertas públicas | ✅ | ✅ | ✅ |
| Crear necesidad/oferta | ✅ | ✅ | ✅ |
| Editar info (con Turnstile) | ✅ | ✅ | ✅ |
| Actualizar estado | ✅ | ✅ | ✅ |
| Reportar | ✅ | ✅ | ✅ |
| Ver panel admin | ❌ | ✅ | ✅ |
| Verificar/archivar | ❌ | ✅ | ✅ |
| Editar necesidades (admin) | ❌ | ✅ | ✅ |
| Resolver reportes | ❌ | ✅ | ✅ |
| Ver métricas | ❌ | ✅ | ✅ |
| Gestión de usuarios | ❌ | ❌ | ✅ |
| Eliminar necesidades/ofertas | ❌ | ❌ | ✅ |

---

## Creación del Primer Admin

El primer administrador se crea mediante un script de seed ejecutado desde la CLI:

```bash
npx convex run seed:createFirstAdmin '{"email":"admin@ejemplo.com","name":"Nombre","password":"ContraseñaSegura"}'
```

Para producción:
```bash
npx convex run --prod seed:createFirstAdmin '{"email":"admin@ejemplo.com","name":"Nombre","password":"ContraseñaSegura"}'
```

**Restricción**: Este comando solo funciona si NO existe ningún usuario con rol ADMIN. Los siguientes usuarios se crean desde el panel de administración.

---

## Notas de Seguridad

### Vulnerabilidades Conocidas (MVP)

1. **Codificación XOR de contraseñas**: Reversible. Migrar a bcrypt para producción de alto riesgo.
2. **Token en localStorage**: Vulnerable a XSS. Aceptable para el contexto actual (no maneja datos financieros ni personales sensibles).
3. **Sin rate limiting en login**: No hay protección contra fuerza bruta a nivel de aplicación (Convex Cloud tiene protecciones básicas a nivel de plataforma).
4. **Sin HTTPS forzado en backend**: Convex Cloud maneja HTTPS automáticamente.

### Medidas de Seguridad Implementadas

1. **Turnstile (anti-bot)**: Protege ediciones públicas de ataques automatizados
2. **Sesiones con expiración**: 24 horas máximo
3. **Verificación de usuario activo**: Usuarios desactivados no pueden acceder
4. **Audit logging**: Todas las acciones administrativas quedan registradas
5. **Secretos separados**: `TURNSTILE_SECRET_KEY` configurado en Convex env vars, no en código

### Mejoras Recomendadas para Producción

- Migrar a bcrypt (via Convex Action con Node.js)
- Implementar rate limiting en login
- Agregar 2FA para admin
- Usar httpOnly cookies en lugar de localStorage
- Implementar token rotation
