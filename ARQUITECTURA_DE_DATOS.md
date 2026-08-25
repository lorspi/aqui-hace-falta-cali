# 🗺️ Arquitectura de Datos y Entidades — Aquí Hace Falta
**Documento Ejecutivo y Funcional para Equipos No Técnicos y Técnicos**

---

> [!NOTE]
> **Resumen Ejecutivo:** Este documento explica en lenguaje sencillo, de negocio y visual cómo está organizada la información dentro de la base de datos de la plataforma **Aquí Hace Falta**. Permite entender cómo se conectan los ciudadanos, los voluntarios, las organizaciones oficiales y los moderadores para coordinar la ayuda en momentos de emergencia o necesidad comunitaria.

---

## 📐 1. Diagrama Conceptual de Relaciones (Visión de Negocio)

El siguiente mapa visual muestra cómo interactúan las distintas entidades desde una perspectiva de procesos de negocio:

```mermaid
erDiagram
    USUARIO ||--o| ORGANIZACION : "Representa o administra"
    USUARIO ||--o{ NECESIDAD : "Publica / Reporta"
    USUARIO ||--o{ OFERTA : "Ofrece ayuda / Donación"
    USUARIO ||--o{ AUDITORIA : "Registra acciones como Moderador/Admin"
    
    NECESIDAD ||--o{ REPORTE_NECESIDAD : "Recibe reportes de ciudadanos"
    NECESIDAD ||--o{ HISTORIAL_CAMBIOS : "Registra actualizaciones de estado"
    
    OFERTA ||--o{ REPORTE_OFERTA : "Recibe reportes de la comunidad"
    
    USUARIO {
        string ID "Identificador Único"
        string NombreCompleto "Nombre y Apellidos"
        string Correo "Email de contacto"
        string Rol "Regular | Voluntario | Moderador | Entidad | Admin"
        string EstadoModerador "Pendiente | Aprobado"
        string Ciudad "Municipio y Departamento"
    }

    ORGANIZACION {
        string ID "Identificador Único"
        string NombreOficial "Nombre de la Entidad / ONG"
        string TipoOrganizacion "Bomberos | Rescate | Gobierno | ONG"
        string NIT_Documento "Identificación Legal (NIT / Cédula)"
        string UbicacionSede "Dirección y Coordenadas en Mapa"
        boolean Verificada "Sello de Verificación Oficial"
    }

    NECESIDAD {
        string ID "Identificador Único"
        string Titulo "Resumen del requerimiento"
        string Categoria "Víveres | Salud | Rescate | Albergue"
        string Prioridad "Alta | Media | Baja"
        string Estado "Necesita Ayuda | En Proceso | Resuelto"
        string Verificacion "Pendiente | Verificado por Moderador"
        string Ubicacion "Dirección y Punto en Mapa"
    }

    OFERTA {
        string ID "Identificador Único"
        string Titulo "Recurso o donación ofrecida"
        string Categoria "Centro de Acopio | Transporte | Voluntariado"
        string Estado "Disponible | Agotado"
        string Ubicacion "Dirección y Punto en Mapa"
    }

    REPORTE_NECESIDAD {
        string Motivo "Información Falsa | Ya Resuelto | Inapropiado"
        string Detalle "Explicación del ciudadano"
        string Estado "Pendiente | Resuelto"
    }
```

---

## 🏛️ 2. Los 5 Módulos Principales de Información

### 👤 Módulo 1: Perfiles de Usuario (`public.profiles`)
Es la libreta principal de datos de cualquier persona registrada en la plataforma.

* **¿Qué almacena?** Nombre completo, documento de identidad (Cédula/NIT), teléfono de contacto, correo electrónico, ubicación (País, Departamento, Ciudad) y aceptación de términos de privacidad.
* **Roles en la Plataforma:**
  * **👤 Usuario Regular:** Ciudadano registrado que puede publicar o solicitar ayuda.
  * **❤️ Voluntario / Donante:** Ciudadano dispuesto a brindar recursos o apoyo en terreno.
  * **⚡ Moderador:** Usuario postulante o aprobado para verificar publicaciones y velar por la veracidad de la información.
  * **🛡️ Entidad / Organización:** Cuenta representante de una institución oficial o comunidad.
  * **👑 Administrador:** Gestor total con acceso a métricas globales y aprobación de moderadores.

---

### 🏢 Módulo 2: Organizaciones e Instituciones (`public.organizations`)
Registra la información institucional de las entidades que coordinan o prestan auxilio.

* **¿Qué almacena?** Nombre oficial de la organización, tipo de entidad (*Bomberos, Defensa Civil, Cruz Roja, ONG, Gobierno Municipal*), NIT o documento legal, dirección física de la sede, ubicación en mapa (Latitud/Longitud) y redes sociales/sitio web.
* **Sello de Verificación:** Permite saber si la entidad ha sido validada oficialmente por los administradores de la plataforma.

---

### 🚨 Módulo 3: Solicitudes de Ayuda / Necesidades (`public.needs`)
Representa cada punto crítico o requerimiento publicado en el mapa.

* **¿Qué almacena?** Título de la necesidad, descripción detallada, categoría (*Alimentos, Medicamentos, Herramientas, Albergue, Agua*), prioridad (*Alta / Urgente, Media, Baja*), dirección exacta, barrio y ubicación en mapa.
* **Estados de la Necesidad:**
  * `NEED_HELP_NOW`: Publicación activa en espera de atención.
  * `IN_PROGRESS`: Voluntarios u organizaciones están atendiendo el punto.
  * `RESOLVED`: Requerimiento atendido con éxito.
* **Verificación de Moderación:** Indica si un moderador oficial ya llamó o verificó en terreno que la necesidad sea real (`PENDING_VERIFICATION` / `VERIFIED`).

---

### 🎁 Módulo 4: Ofertas de Ayuda y Donaciones (`public.offers`)
Almacena los recursos que la ciudadanía o las entidades ponen a disposición.

* **¿Qué almacena?** Título del ofrecimiento, descripción de lo que se donará o prestará, categorías (*Centro de Acopio, Apoyo Médico, Transporte, Víveres*), dirección física y punto geográfico donde se puede recoger o contactar.

---

### 🛡️ Módulo 5: Transparencia, Reportes y Auditoría (`reports`, `update_logs`, `audit_logs`)
Garantiza la seguridad, la veracidad y la auditoría de la plataforma.

* **Reportes Ciudadanos (`reports` / `offer_reports`):** Si un usuario detecta que un mapa muestra información falsa, obsoleta o inapropiada, puede reportarlo para que un moderador lo revise.
* **Historial de Cambios (`update_logs`):** Guarda la bitácora de actualizaciones en las solicitudes (*quién cambió el estado y en qué fecha*).
* **Registro de Auditoría (`audit_logs`):** Bitácora de seguridad que registra cada acción realizada por los moderadores o administradores para evitar abusos y garantizar total transparencia.

---

## 📊 3. Tabla Resumen para Gestión y Negocio

| Entidad en BD | Propósito en el Negocio | ¿Quién la crea / gestiona? | Impacto en la Plataforma |
| :--- | :--- | :--- | :--- |
| **`public.profiles`** | Identificación de usuarios y asignación de permisos de acceso. | Se crea automáticamente al registrarse con correo o Google. | Control de acceso y trazabilidad de contactos. |
| **`public.organizations`** | Ficha institucional de ONGs y cuerpos de socorro. | Representante legal o delegado durante el registro. | Genera confianza y habilita sedes oficiales en el mapa. |
| **`public.needs`** | Mapear emergencias y coordinar recursos donde hace falta. | Ciudadanos, voluntarios o moderadores. | Alimenta el mapa principal de alertas de la ciudad. |
| **`public.offers`** | Mapear puntos de acopio y donaciones disponibles. | Voluntarios, ONGs y empresas solidarias. | Muestra centros de acopio y recursos de ayuda inmediata. |
| **`public.reports`** | Control de calidad e información falsa en necesidades. | Cualquier ciudadano navegando en el portal. | Mantiene limpia la información y evita pánico falso. |
| **`public.offer_reports`** | Control de calidad e información falsa en ofertas. | Cualquier ciudadano navegando en el portal. | Mantiene limpias las ofertas de ayuda. |
| **`public.update_logs`** | Bitácora de cambios de estado en publicaciones. | Sistema y moderadores al actualizar una ayuda. | Historial público de atención a emergencias. |
| **`public.audit_logs`** | Trazabilidad legal y transparencia operativa de admins. | Sistema automático al ejecutar acciones administrativas. | Permite auditar el trabajo de moderación en emergencias. |

---

## 🔍 4. Diagrama Técnico Completo (Modelo de Campos de Base de Datos)

A continuación se presenta el **diagrama físico de datos completo** con el 100% de las tablas y campos que existen actualmente en la base de datos de pruebas/desarrollo de Supabase:

```mermaid
erDiagram
    auth_users ||--|| profiles : "id = id (1:1)"
    profiles ||--o| organizations : "id = user_id (1:1)"
    needs ||--o{ reports : "id = need_id (1:N)"
    needs ||--o{ update_logs : "id = need_id (1:N)"
    offers ||--o{ offer_reports : "id = offer_id (1:N)"

    auth_users {
        uuid id PK
        string email
        timestamptz created_at
    }

    profiles {
        uuid id PK,FK "Ref auth.users(id)"
        string email UK
        string first_name
        string last_name
        string full_name
        string phone_country_code
        string phone_number
        string phone
        string document_type "cedula | nit | pasaporte | extrangeria"
        string document_number
        string country
        string department
        string city
        boolean is_auto_detected_location
        string role "regular | voluntario | moderador | entidad_profesional | ADMIN"
        boolean is_verified
        boolean accept_terms
        timestamptz terms_accepted_at
        string moderator_community_collective
        string moderator_motivation
        string moderation_status "PENDING | APPROVED | REJECTED"
        timestamptz created_at
        timestamptz updated_at
    }

    organizations {
        uuid id PK
        uuid user_id FK,UK "Ref profiles(id)"
        string org_name
        string organization_type "Bomberos | Defensa Civil | Cruz Roja | ONG | Gobierno | Empresa"
        string description
        string website_or_social
        string address
        float latitude
        float longitude
        string document_type "nit | cedula"
        string document_number
        boolean is_verified
        timestamptz created_at
        timestamptz updated_at
    }

    needs {
        uuid id PK
        string city_id
        string emergency_id
        string title
        string description
        string place_type
        jsonb categories
        jsonb resources
        string address
        string neighborhood
        float latitude
        float longitude
        string priority "HIGH | MEDIUM | LOW"
        string status "NEED_HELP_NOW | IN_PROGRESS | RESOLVED"
        string verification_status "PENDING_VERIFICATION | VERIFIED | REJECTED"
        string verified_by
        string verification_notes
        timestamptz verified_at
        string source
        string source_url
        string contact_name
        string contact_phone
        string contact_whatsapp
        string contact_email
        string organization_name
        string requester_type "PERSONA | ORGANIZACION | GRUPO"
        string operating_hours
        string evidence_url
        timestamptz created_at
        timestamptz updated_at
        string last_updated_by
        timestamptz expires_at
        boolean is_demo_data
    }

    offers {
        uuid id PK
        string city_id
        string title
        string description
        jsonb categories
        jsonb resources
        string address
        string neighborhood
        float latitude
        float longitude
        string offer_status "AVAILABLE | EXHAUSTED | CLOSED"
        string verification_status "PENDING_VERIFICATION | VERIFIED | ARCHIVED"
        string verified_by
        timestamptz verified_at
        string contact_name
        string contact_phone
        string contact_whatsapp
        string contact_email
        string organization_name
        string operating_hours
        timestamptz created_at
        timestamptz updated_at
    }

    reports {
        uuid id PK
        uuid need_id FK "Ref needs(id)"
        string need_title
        string reason
        string description
        string reporter_contact
        string status "PENDING | RESOLVED | DISMISSED"
        timestamptz created_at
        timestamptz resolved_at
        string resolved_by
    }

    offer_reports {
        uuid id PK
        uuid offer_id FK "Ref offers(id)"
        string offer_title
        string reason
        string description
        string reporter_contact
        string status "PENDING | RESOLVED | DISMISSED"
        timestamptz created_at
        timestamptz resolved_at
        string resolved_by
    }

    update_logs {
        uuid id PK
        uuid need_id FK "Ref needs(id)"
        string previous_status
        string new_status
        string description
        string updated_by
        timestamptz created_at
    }

    audit_logs {
        uuid id PK
        string action
        uuid need_id
        uuid offer_id
        string admin_email
        string details
        timestamptz timestamp
    }
```

---

## 🔄 5. Flujo de Trabajo: Ciclo de Vida de una Necesidad

```mermaid
sequenceDiagram
    autonumber
    actor Ciudadano
    participant Sistema as Plataforma AHF
    actor Moderador
    actor Voluntario

    Ciudadano->>Sistema: 1. Publica necesidad ("Agua embotellada en Barrio X")
    Sistema-->>Sistema: 2. Registra la ubicación y queda en estado "PENDIENTE DE VERIFICACIÓN"
    Moderador->>Sistema: 3. Revisa la necesidad y llama al contacto
    Moderador->>Sistema: 4. Marca la publicación como "VERIFICADA"
    Voluntario->>Sistema: 5. Consulta el mapa, ve el pin verificado y acude a ayudar
    Voluntario->>Sistema: 6. Actualiza el estado a "RESUELTO"
    Sistema-->>Ciudadano: 7. Notifica cierre exitoso de la ayuda
```

---

> [!TIP]
> **Nota de Exportación:** Este documento está listo para ser revisado en pantalla o exportado a formato **PDF** para presentaciones institucionales, comités de emergencia u organizaciones aliadas.
