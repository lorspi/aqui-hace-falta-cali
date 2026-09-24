# Especificación Técnica: Métricas de Impacto y Auditoría de Estados (RaDAR)

> **Destinatario:** Desarrollador backend / full-stack encargado de implementar la persistencia en Supabase (PostgreSQL) y el cálculo de métricas para el equipo de impacto.
> **Contexto Frontend / Mockup:** Implementado en `src/types/panel.ts`, `src/utils/impacto.ts` y `src/mocks/panelMock.ts`.

---

## 1. Modelo de Datos en Base de Datos (Supabase / PostgreSQL)

### A. Tabla de Auditoría de Transiciones (`solicitud_historial`)
Para medir **cuánto tiempo pasa cada ítem en cada columna** y detectar caídas en el ciclo:

```sql
create table if not exists public.solicitud_historial (
  id uuid primary key default gen_random_uuid(),
  solicitud_id bigint not null references public.solicitudes(id) on delete cascade,
  tipo varchar(20) not null check (tipo in ('solicitud', 'recibida')),
  estado_anterior varchar(30), -- null en la creación inicial
  estado_nuevo varchar(30) not null,
  actor_id uuid references auth.users(id),
  motivo text, -- obligatorio si se cancela o rechaza
  created_at timestamptz not null default now()
);

-- Índices recomendados para consultas analíticas rápidas
create index if not exists idx_solicitud_historial_solicitud on public.solicitud_historial(solicitud_id, created_at);
create index if not exists idx_solicitud_historial_estado_nuevo on public.solicitud_historial(estado_nuevo, created_at);
```

### B. Trigger Automático de Transiciones
Para garantizar que **ningún cambio de estado escape a la auditoría**, se implementa un trigger a nivel de base de datos:

```sql
create or replace function public.fn_registrar_transicion_estado()
returns trigger as $$
begin
  if (tg_op = 'INSERT') or (old.estado is distinct from new.estado) then
    insert into public.solicitud_historial (
      solicitud_id,
      tipo,
      estado_anterior,
      estado_nuevo,
      actor_id,
      motivo,
      created_at
    ) values (
      new.id,
      case when tg_table_name = 'solicitudes' then 'solicitud' else 'recibida' end,
      case when tg_op = 'INSERT' then null else old.estado end,
      new.estado,
      auth.uid(),
      new.motivo_cancelacion,
      now()
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger sobre solicitudes
create or replace trigger trg_solicitudes_historial
after insert or update on public.solicitudes
for each row execute function public.fn_registrar_transicion_estado();

-- Trigger sobre entregas recibidas
create or replace trigger trg_entregas_recibidas_historial
after insert or update on public.entregas_recibidas
for each row execute function public.fn_registrar_transicion_estado();
```

### C. Columnas requeridas en `solicitudes` y `entregas_recibidas`
```sql
alter table public.solicitudes
  add column if not exists motivo_cancelacion text,
  add column if not exists cancelada_en_estado varchar(30),
  add column if not exists historia_impacto text,
  add column if not exists personas_beneficiadas integer check (personas_beneficiadas >= 0),
  add column if not exists cerrada_el timestamptz;

alter table public.entregas_recibidas
  add column if not exists historia_impacto text,
  add column if not exists personas_beneficiadas integer check (personas_beneficiadas >= 0),
  add column if not exists cerrada_el timestamptz;
```

---

## 2. Vistas y Consultas SQL para los 4 Requerimientos de Impacto

### Requerimiento 1: Tiempo promedio que pasa cada ítem en cada columna
Calcula la diferencia de tiempo entre cada estado y el siguiente utilizando funciones de ventana (`lead`):

```sql
create or replace view public.view_tiempo_promedio_columnas as
with transiciones_ordenadas as (
  select
    solicitud_id,
    estado_nuevo as estado,
    created_at as entrada_estado,
    lead(created_at) over (
      partition by solicitud_id
      order by created_at asc
    ) as salida_estado
  from public.solicitud_historial
),
duraciones as (
  select
    estado,
    extract(epoch from (salida_estado - entrada_estado)) / 3600.0 as horas_en_estado
  from transiciones_ordenadas
  where salida_estado is not null
)
select
  estado,
  count(*) as total_transiciones,
  round(avg(horas_en_estado)::numeric, 1) as horas_promedio,
  round((avg(horas_en_estado) / 24.0)::numeric, 1) as dias_promedio
from duraciones
group by estado;
```

---

### Requerimiento 2: Calidad de certificación comunitaria y cobertura humana
Mide qué porcentaje de entregas distribuidas cuentan con evidencia completa (fotos + historia de impacto + beneficiarios):

```sql
create or replace view public.view_certificacion_impacto_lideres as
with entregas_distribuidas as (
  select
    id,
    cierre_fotos_count,
    historia_impacto,
    personas_beneficiadas,
    (cierre_fotos_count > 0) as tiene_foto,
    (historia_impacto is not null and length(trim(historia_impacto)) > 10) as tiene_historia,
    (personas_beneficiadas is not null and personas_beneficiadas > 0) as tiene_beneficiarios
  from public.entregas_recibidas
  where estado = 'distribuida'
)
select
  count(*) as total_distribuidas,
  count(*) filter (where tiene_foto) as con_foto,
  count(*) filter (where tiene_historia) as con_historia,
  count(*) filter (where tiene_beneficiarios) as con_beneficiarios,
  count(*) filter (where tiene_foto and tiene_historia and tiene_beneficiarios) as certificacion_completa,
  round(
    (count(*) filter (where tiene_foto and tiene_historia and tiene_beneficiarios)::numeric / nullif(count(*), 0) * 100),
    1
  ) as porcentaje_certificacion_completa,
  coalesce(sum(personas_beneficiadas), 0) as total_personas_beneficiadas
from entregas_distribuidas;
```

---

### Requerimiento 3: Cumplimiento de compromisos por organizaciones vs solicitudes canceladas
Mide la tasa de cumplimiento (`fulfillment rate`) y analiza los motivos de cancelación de solicitudes aceptadas:

```sql
create or replace view public.view_cumplimiento_organizaciones as
with solicitudes_comprometidas as (
  select
    id,
    estado,
    cancelada_en_estado,
    motivo_cancelacion,
    case
      when estado in ('confirmada', 'distribuida', 'archivada') then 'completada'
      when motivo_cancelacion is not null and cancelada_en_estado != 'nueva' then 'cancelada_en_proceso'
      else 'en_curso'
    end as resultado
  from public.solicitudes
  where estado != 'nueva' or cancelada_en_estado is not null
)
select
  count(*) as total_comprometidas,
  count(*) filter (where resultado = 'completada') as completadas,
  count(*) filter (where resultado = 'cancelada_en_proceso') as canceladas_en_proceso,
  round(
    (count(*) filter (where resultado = 'completada')::numeric / nullif(count(*) filter (where resultado in ('completada', 'cancelada_en_proceso')), 0) * 100),
    1
  ) as tasa_cumplimiento_porcentaje,
  round(
    (count(*) filter (where resultado = 'cancelada_en_proceso')::numeric / nullif(count(*) filter (where resultado in ('completada', 'cancelada_en_proceso')), 0) * 100),
    1
  ) as tasa_cancelacion_porcentaje
from solicitudes_comprometidas;
```

---

### Requerimiento 4: Organizaciones y líderes activos vs inscritos
Define actividad operativa (acción en los últimos 30 días) vs simple inscripción:

- **Organización activa (30d):** Ha publicado/actualizado una oferta o aceptado/entregado una solicitud en los últimos 30 días.
- **Líder comunitario activo (30d):** Ha publicado una necesidad comunitaria, confirmado recibido o distribuido ayuda en los últimos 30 días.

```sql
create or replace view public.view_actividad_red as
with orgs as (
  select
    count(distinct o.id) as total_inscritas,
    count(distinct case when sh.created_at >= now() - interval '30 days' then o.id end) as activas_30d
  from public.organizaciones o
  left join public.solicitudes s on s.organizacion_ofertante_id = o.id
  left join public.solicitud_historial sh on sh.solicitud_id = s.id
  where o.tipo != 'comunidad'
),
lideres as (
  select
    count(distinct o.id) as total_inscritos,
    count(distinct case when sh.created_at >= now() - interval '30 days' then o.id end) as activos_30d
  from public.organizaciones o
  left join public.entregas_recibidas er on er.comunidad_receptora_id = o.id
  left join public.solicitud_historial sh on sh.solicitud_id = er.id
  where o.tipo = 'comunidad'
)
select
  orgs.total_inscritas as orgs_inscritas,
  orgs.activas_30d as orgs_activas_30d,
  round((orgs.activas_30d::numeric / nullif(orgs.total_inscritas, 0) * 100), 1) as orgs_porcentaje_activas,
  lideres.total_inscritos as lideres_inscritos,
  lideres.activos_30d as lideres_activos_30d,
  round((lideres.activos_30d::numeric / nullif(lideres.total_inscritos, 0) * 100), 1) as lideres_porcentaje_activos
from orgs cross join lideres;
```

---

## 3. Mapeo en el Código del Frontend

| Tipo TypeScript (`src/types/panel.ts`) | Columna / Vista Supabase | Propósito |
| :--- | :--- | :--- |
| `TransicionEstado` | Tabla `solicitud_historial` | Registro del evento de cambio de columna |
| `MetricasImpactoPanel['tiemposPorColumna']` | Vista `view_tiempo_promedio_columnas` | Horas/días promedio por estado |
| `MetricasImpactoPanel['certificacionLideres']` | Vista `view_certificacion_impacto_lideres` | Calidad del reporte comunitario y personas beneficiadas |
| `MetricasImpactoPanel['cumplimientoOrganizaciones']` | Vista `view_cumplimiento_organizaciones` | Cumplimiento y motivos de cancelación |
| `MetricasImpactoPanel['actividadRed']` | Vista `view_actividad_red` | Activos vs inscritos (30d) |
| `Solicitud['motivoCancelacion']` | Columna `motivo_cancelacion` | Motivo de abandono del compromiso |
| `Solicitud['canceladaEnEstado']` | Columna `cancelada_en_estado` | Columna donde se cayó el proceso |
| `Cierre['personasBeneficiadas']` | Columna `personas_beneficiadas` | Número de personas/familias atendidas |
| `Cierre['historia']` | Columna `historia_impacto` | Testimonio de impacto en territorio |
