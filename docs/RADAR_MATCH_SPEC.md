# Especificación Técnica: Motor Radar Match Multimodal
*Documento de arquitectura y guía de implementación para el equipo de desarrollo (Frontend & Backend/Supabase).*

---

## 1. Propósito y Filosofía

El motor **Radar Match** conecta automáticamente las necesidades de las comunidades con las ofertas de las organizaciones donantes y voluntarias.

En versiones anteriores, el motor utilizaba un filtro rígido de proximidad (`≤ 20 km`), lo cual generaba dos puntos ciegos críticos para la respuesta humanitaria en Colombia:
1. **Invisibilidad de ayudas intermunicipales o nacionales:** Impedía conectar ofertas de ciudades principales (ej. Bogotá o Medellín) con emergencias en otras regiones (ej. Cali, Mocoa, Chocó), a pesar de tratarse de insumos fácilmente despachables (medicamentos, cobijas, kits).
2. **Invisibilidad de servicios remotos/virtuales:** Descartaba apoyos que no dependen de la distancia física (tele-apoyo psicológico, asesoría jurídica, voluntariado digital, donación económica).

El nuevo modelo **Radar Match Multimodal (Opción 1)** resuelve esto evaluando la **modalidad de entrega**, la **naturaleza del recurso** y la **cobertura declarada**.

---

## 2. Los 3 Alcances Operativos

| Alcance | Descripción | Restricción de Distancia | Rango de Score | Etiqueta en UI |
| :--- | :--- | :--- | :---: | :--- |
| **`remoto`** | Servicios virtuales, telefónicos o digitales. | **Sin límite** (distancia física irrelevante). | **85% – 98%** | `🌐 Asistencia virtual` |
| **`local`** | Ayuda física inmediata dentro del área urbana o veredal. | **$\le 20\text{ km}$** (o radio declarado: 5, 10, 25 km). | **70% – 98%** | `📍 a X km` *(o 'a menos de 1 km')* |
| **`regional`** | Desplazamiento o despacho intermedio en el mismo departamento. | **$20\text{ km} < \text{distancia} \le 100\text{ km}$**. | **60% – 85%** | `🚚 Regional · a X km` |
| **`nacional`** | Insumos despachables por paquetería o corredor humanitario entre ciudades (ej. Bogotá $\leftrightarrow$ Cali). | **$> 100\text{ km}$** (hasta 1.200 km en territorio nacional). | **45% – 65%** | `📦 Envío nacional (X km)` |

---

## 3. Taxonomía y Clasificación de Recursos

### A. Recursos Inherentemente Virtuales / Remotos (`RECURSOS_VIRTUALES`)
No requieren presencia física:
* `Salud mental y apoyo psicosocial`
* `Asesoría legal y jurídica`
* `Auditoría, contabilidad y finanzas`
* `Ingeniería, arquitectura y peritaje`
* `Evaluación estructural y técnica`
* `Geología, geotecnia y gestión del riesgo`
* `Aporte económico / Donación en dinero`

> **Regla:** Si una publicación ofrece o solicita estos ítems, o si declara `modoEntrega: 'remoto'`, califica automáticamente como alcance **`remoto`**.

### B. Recursos Físicos Despachables a Nivel Nacional (`RECURSOS_DESPACHABLES`)
Bienes no perecederos, empacables y transportables por transporte de carga o paquetería:
* `Medicamentos / Botiquín`
* `Cobijas y colchonetas`
* `Ropa y calzado`
* `Implementos de aseo e higiene`
* `Alimentos` *(kits secos / no perecederos)*
* `Protección respiratoria`
* `Herramientas de mano`
* `Plantas eléctricas / Generadores`
* `Equipos de bombeo`
* `Cuidado y alimento de animales`

> **Regla:** Si coinciden en estos recursos y ninguna de las partes restringió explícitamente a entrega exclusiva en sitio (`sitio`), se habilita el cruce nacional o regional con puntaje modulado.

### C. Recursos Presenciales Estrictos (Locales Inmediatos)
Bienes o servicios que exigen inmediatez y presencia física pesada:
* `Agua potable` *(distribución a granel en carrotanques / cisternas)*
* `Remoción de escombros y barro`
* `Maquinaria pesada y operarios`
* `Alojamiento temporal`
* `Cocinas comunitarias`

> **Regla:** Se restringen estrictamente al radio local de la publicación (`≤ 20 km` por defecto, o `radio` explícito).

---

## 4. Algoritmo de Viabilidad (`esViableCruce`)

Dos publicaciones $A$ y $B$ para un recurso $R$ son viables de cruzarse si cumplen:
1. $A.\text{tipo} \neq B.\text{tipo}$ *(necesidad busca oferta; oferta busca necesidad)*.
2. $A.\text{org} \neq B.\text{org}$ *(no cruzar con uno mismo)*.
3. Coincidencia en ítem y unidad ($R.\text{item}$ y $R.\text{unidad}$) con saldo pendiente $> 0$.
4. **Condición de Viabilidad Logística:**
   * Es **virtual/remoto** $\implies$ **Viable siempre**.
   * Alguna declaró `radio === 'Todo el país'` o `admiteNacional` $\implies$ **Viable a nivel nacional** ($\le 1200\text{ km}$).
   * Alguna declaró radio numérico específico (ej. `radio === '50 km'`) $\implies$ Viable si $\text{distancia} \le \text{radio}$.
   * El recurso está en `RECURSOS_DESPACHABLES` y ninguna parte exige entrega exclusiva en sitio $\implies$ **Viable intermunicipal / nacional**.
   * En caso contrario (presencial estricto) $\implies$ Viable únicamente si $\text{distancia} \le 20\text{ km}$.

---

## 5. Fórmula Matemática de Compatibilidad (`puntajeCoincidencia`)

El puntaje resultante está acotado entre **40% y 98%**:

$$\text{Puntaje} = \min(\text{Tope}, \text{Base} + \text{Bono Distancia} + (\text{Recursos en Común} - 1) \times \text{Paso})$$

### Parámetros por Alcance:

| Alcance | Base | Bono por Distancia / Inmediatez | Bono Multirrecurso | Tope Máx. |
| :--- | :---: | :--- | :---: | :---: |
| **`remoto`** | **88%** | $+0\%$ *(fricción cero)* | $+8\%$ por recurso extra | **98%** |
| **`local`** ($\le 20\text{ km}$) | **70%** | $+15\%\text{ si }\le 5\text{ km}$<br>$+10\%\text{ si }\le 10\text{ km}$<br>$+5\%\text{ si }\le 20\text{ km}$ | $+8\%$ por recurso extra | **98%** |
| **`regional`** ($20\text{–}100\text{ km}$) | **60%** | $+8\%\text{ si }\le 50\text{ km}$<br>$+4\%\text{ si }\le 100\text{ km}$ | $+6\%$ por recurso extra | **85%** |
| **`nacional`** ($> 100\text{ km}$) | **45%** | $+5\%\text{ si }\le 400\text{ km}$<br>$+0\%\text{ si }> 400\text{ km}$ | $+5\%$ por recurso extra | **65%** |

---

## 6. Jerarquía Visual en el Sistema de Diseño (UI/UX)

En [`src/components/ui/Coincidencias.tsx`](file:///Users/federicoposada/Documents/GitHub/aqui-hace-falta-cali/src/components/ui/Coincidencias.tsx):
1. **Píldora de Puntaje (`Puntaje`):**
   * $\ge 80\%$: `bg-rd-green-soft text-rd-green border-rd-green-line` *(Verde: compatibilidad alta inmediata)*.
   * $65\% \text{–} 79\%$: `bg-rd-navy-soft text-rd-navy border-rd-navy-line` *(Azul: cercanía regional o multirrecurso)*.
   * $< 65\%$: `bg-rd-amber-soft text-rd-amber-ink border-rd-amber-line` *(Ámbar: despacho nacional a distancia)*.
2. **Contexto del Alcance:**
   * Virtual: Icono `Monitor` + `"Asistencia virtual"`.
   * Nacional: Icono `Package` + `"Envío nacional (320 km)"`.
   * Local / Regional: Icono de mapa + distancia en kilómetros.

---

## 7. Guía de Implementación en Backend / Supabase

Para cuando el equipo de Backend migre esta lógica a funciones almacenadas (`RPC`) en PostgreSQL:

### Campos recomendados en tablas `needs` y `offers`:
```sql
ALTER TABLE offers ADD COLUMN IF NOT EXISTS delivery_mode text DEFAULT 'delivery'; -- 'delivery' | 'pickup' | 'remote'
ALTER TABLE offers ADD COLUMN IF NOT EXISTS coverage_radius text DEFAULT '25 km'; -- '5 km', '10 km', '25 km', '50 km', 'national'
ALTER TABLE offers ADD COLUMN IF NOT EXISTS delivery_notes text;
```

### Lógica PostGIS sugerida para RPC `get_matching_offers_for_need`:
```sql
CREATE OR REPLACE FUNCTION get_matching_offers_for_need(p_need_id uuid, p_limit int DEFAULT 5)
RETURNS TABLE (
  offer_id uuid,
  score int,
  distance_km numeric,
  scope text,
  common_categories text[]
) LANGUAGE plpgsql AS $$
DECLARE
  v_need record;
BEGIN
  SELECT * INTO v_need FROM needs WHERE id = p_need_id;
  IF NOT FOUND THEN RETURN; END IF;

  RETURN QUERY
  SELECT 
    o.id AS offer_id,
    CASE 
      -- 1. Remoto
      WHEN o.delivery_mode = 'remote' THEN LEAST(98, 88 + (cardinality(ARRAY(SELECT unnest(o.categories) INTERSECT SELECT unnest(v_need.categories))) - 1) * 8)
      -- 2. Local (<= 20 km)
      WHEN ST_DistanceSphere(o.geom, v_need.geom) / 1000.0 <= 20 THEN 
        LEAST(98, 70 + (CASE WHEN ST_DistanceSphere(o.geom, v_need.geom) / 1000.0 <= 5 THEN 15 WHEN ST_DistanceSphere(o.geom, v_need.geom) / 1000.0 <= 10 THEN 10 ELSE 5 END))
      -- 3. Regional (20 a 100 km)
      WHEN ST_DistanceSphere(o.geom, v_need.geom) / 1000.0 <= 100 THEN
        LEAST(85, 60 + 6 * cardinality(ARRAY(SELECT unnest(o.categories) INTERSECT SELECT unnest(v_need.categories))))
      -- 4. Nacional (> 100 km)
      ELSE
        LEAST(65, 45 + 5 * cardinality(ARRAY(SELECT unnest(o.categories) INTERSECT SELECT unnest(v_need.categories))))
    END AS score,
    ROUND((ST_DistanceSphere(o.geom, v_need.geom) / 1000.0)::numeric, 1) AS distance_km,
    CASE 
      WHEN o.delivery_mode = 'remote' THEN 'remoto'
      WHEN ST_DistanceSphere(o.geom, v_need.geom) / 1000.0 <= 20 THEN 'local'
      WHEN ST_DistanceSphere(o.geom, v_need.geom) / 1000.0 <= 100 THEN 'regional'
      ELSE 'nacional'
    END AS scope,
    ARRAY(SELECT unnest(o.categories) INTERSECT SELECT unnest(v_need.categories)) AS common_categories
  FROM offers o
  WHERE o.status = 'ACTIVE'
    AND (
      o.delivery_mode = 'remote'
      OR o.coverage_radius = 'national'
      OR ST_DWithin(o.geom, v_need.geom, 20000) -- 20 km
      OR (o.is_shippable = true AND ST_DWithin(o.geom, v_need.geom, 1200000))
    )
    AND o.categories && v_need.categories
  ORDER BY score DESC, distance_km ASC
  LIMIT p_limit;
END;
$$;
```

---

## 8. Casos de Prueba Validados

En [`tests/unit/equivalencias.test.ts`](file:///Users/federicoposada/Documents/GitHub/aqui-hace-falta-cali/tests/unit/equivalencias.test.ts):
1. **Local estricto (3 km, 1 recurso):** `puntaje = 85%` (base 70 + cercanía 15).
2. **Local medio (12 km, 1 recurso):** `puntaje = 75%` (base 70 + cercanía 5).
3. **Local multirrecurso (3 km, 4 recursos):** `puntaje = 98%` (tope máximo alcanzado).
4. **Remoto / Virtual (450 km):** `alcance = 'remoto'`, `etiqueta = 'Asistencia virtual'`, `puntaje = 88%` (o 96% con 2 recursos).
5. **Nacional Bogotá $\leftrightarrow$ Cali (320 km):** `alcance = 'nacional'`, `etiqueta = 'Envío nacional (320 km)'`, `puntaje = 50%` (o 55% con 2 recursos).
