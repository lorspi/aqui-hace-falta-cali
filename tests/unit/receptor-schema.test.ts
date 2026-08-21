import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

// ============================================================================
// Unit Tests — S1: Esquema de datos del receptor en Supabase (DEV-31)
//
// Validan la migración SQL como código: verifican que el DDL declarado en
// supabase/migrations/<s1_receptor_schema>.sql cumple los escenarios Gherkin
// de la historia S1 (tablas, columnas, defaults, índices, unicidad y RLS).
// ============================================================================

const MIGRATIONS_DIR = join(
  fileURLToPath(new URL("..", import.meta.url)),
  "..",
  "supabase",
  "migrations"
);

function readS1Migration(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) =>
    f.toLowerCase().includes("s1_receptor_schema")
  );
  expect(files.length).toBeGreaterThan(0);
  // Leer el primer archivo S1 (si hay varios, validar el primero).
  return readFileSync(join(MIGRATIONS_DIR, files[0]), "utf-8");
}

const sql = readS1Migration();

// Helpers para inspeccionar el SQL de forma legible.
const hasNeedsCreate = (col: string) => {
  const block = sql.match(/CREATE TABLE IF NOT EXISTS needs \(([\s\S]*?)\);/)?.[1] ?? "";
  return new RegExp(`\\b${col}\\b`).test(block);
};

const needsDefault = (col: string, value: string) =>
  new RegExp(`\\b${col}\\b[^,]*DEFAULT[\\s']*${value}`, "i").test(sql);

const needsNotNull = (col: string) => {
  const block = sql.match(/CREATE TABLE IF NOT EXISTS needs \(([\s\S]*?)\);/)?.[1] ?? "";
  return new RegExp(`\\b${col}\\b[^,]*NOT NULL`).test(block);
};

describe("S1 — Migración crea la tabla needs espejando el modelo Need", () => {
  it("existe la migración del receptor en supabase/migrations", () => {
    expect(sql).toBeTruthy();
    expect(sql).toMatch(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp"/);
  });

  it("la tabla needs existe con PK uuid en id", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS needs \(/);
    expect(sql).toMatch(/id UUID PRIMARY KEY DEFAULT uuid_generate_v4\(\)/);
  });

  it("están presentes las columnas del modelo Need", () => {
    for (const col of [
      "categories",
      "place_type",
      "priority",
      "status",
      "verification_status",
      "requester_type",
    ]) {
      expect(hasNeedsCreate(col), `columna ${col} en needs`).toBe(true);
    }
  });

  it("están presentes las columnas de contacto y ubicación", () => {
    for (const col of [
      "contact_name",
      "contact_phone",
      "contact_whatsapp",
      "contact_email",
      "address",
      "neighborhood",
      "latitude",
      "longitude",
      "city_id",
    ]) {
      expect(hasNeedsCreate(col), `columna ${col} en needs`).toBe(true);
    }
  });

  it("los valores por defecto del modelo se reflejan", () => {
    expect(needsDefault("priority", "MEDIUM")).toBe(true);
    expect(needsDefault("status", "NEED_HELP_NOW")).toBe(true);
    expect(needsDefault("verification_status", "PENDING_VERIFICATION")).toBe(true);
  });

  it("existen índices para filtrar por status, priority, verification_status y created_at", () => {
    expect(sql).toMatch(/idx_needs_status ON needs\(status\)/);
    expect(sql).toMatch(/idx_needs_priority ON needs\(priority\)/);
    expect(sql).toMatch(/idx_needs_verification ON needs\(verification_status\)/);
    expect(sql).toMatch(/idx_needs_created_at ON needs\(created_at/);
  });

  it("las coordenadas son opcionales (lat/lng NULL) para enriquecer con geocoding", () => {
    // En la creación: lat/long sin NOT NULL.
    expect(hasNeedsCreate("latitude")).toBe(true);
    expect(hasNeedsCreate("longitude")).toBe(true);
    // Y además se relaja el esquema existente (DROP NOT NULL / DROP DEFAULT).
    expect(sql).toMatch(/ALTER TABLE needs ALTER COLUMN latitude DROP NOT NULL/);
    expect(sql).toMatch(/ALTER TABLE needs ALTER COLUMN longitude DROP NOT NULL/);
    expect(sql).toMatch(/ALTER TABLE needs ALTER COLUMN latitude DROP DEFAULT/);
    expect(sql).toMatch(/ALTER TABLE needs ALTER COLUMN longitude DROP DEFAULT/);
  });

  it("los campos obligatorios del modelo son NOT NULL (title, description, contact_name)", () => {
    expect(needsNotNull("title")).toBe(true);
    expect(needsNotNull("description")).toBe(true);
    expect(needsNotNull("contact_name")).toBe(true);
  });
});

describe("S1 — Migración crea la tabla ingest_responses para auditoría", () => {
  const block = sql.match(/CREATE TABLE IF NOT EXISTS ingest_responses \(([\s\S]*?)\);/)?.[1] ?? "";

  it("la tabla ingest_responses existe", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS ingest_responses \(/);
  });

  it("incluye las columnas de metadatos del evento", () => {
    for (const col of ["event_id", "type", "conversation_id", "message_type", "workflow_step"]) {
      expect(new RegExp(`\\b${col}\\b`).test(block), `columna ${col}`).toBe(true);
    }
    // `from` es palabra reservada en SQL → debe estar entre comillas.
    expect(block).toMatch(/"from"/);
  });

  it("guarda el cuerpo del evento tal cual llega en una columna JSONB", () => {
    expect(block).toMatch(/body JSONB/);
    expect(block).toMatch(/raw_payload JSONB/);
  });

  it("incluye timestamps de recepción y estado de procesamiento", () => {
    expect(block).toMatch(/received_at TIMESTAMPTZ DEFAULT NOW\(\)/);
    expect(block).toMatch(/created_at TIMESTAMPTZ DEFAULT NOW\(\)/);
    expect(block).toMatch(/processing_status VARCHAR\(50\) DEFAULT 'PENDING'/);
  });

  it("declara una unicidad sobre event_id para soportar idempotencia", () => {
    expect(block).toMatch(/event_id TEXT NOT NULL/);
    expect(block).toMatch(/CONSTRAINT ingest_responses_event_id_key UNIQUE \(event_id\)/);
  });

  it("solo event_id es obligatorio: el resto de metadatos puede quedar NULL", () => {
    expect(block).toMatch(/event_id TEXT NOT NULL/);
    // type, conversation_id y "from" son opcionales (sin NOT NULL).
    expect(block).not.toMatch(/type TEXT NOT NULL/);
    expect(block).not.toMatch(/conversation_id TEXT NOT NULL/);
    expect(block).not.toMatch(/"from" TEXT NOT NULL/);
  });
});

describe("S1 — RLS solo permite escribir al service role y bloquea el acceso anónimo", () => {
  it("habilita RLS en needs e ingest_responses", () => {
    expect(sql).toMatch(/ALTER TABLE needs ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/ALTER TABLE ingest_responses ENABLE ROW LEVEL SECURITY/);
  });

  it("no existe ninguna política que otorgue acceso al rol anon sobre ingest_responses", () => {
    // Buscar cualquier CREATE POLICY cuyo objetivo sea ingest_responses y
    // conceda a anon (o sin rol explícito) algún privilegio.
    const policyMatches = [...sql.matchAll(/CREATE POLICY[^;]*?ON ingest_responses[^;]*?;/gi)];
    expect(policyMatches).toHaveLength(0);
    // Además, no debe haber ningún GRANT ... TO anon sobre ingest_responses.
    expect(sql).not.toMatch(/GRANT[\s\S]*?ON ingest_responses[\s\S]*?TO\s+anon/i);
  });

  it("no existe ninguna política de tipo ALL/USING/CHECK abierta sobre ingest_responses", () => {
    // Con RLS habilitado y cero políticas, anon es rechazado por defecto.
    expect(sql).not.toMatch(/CREATE POLICY/i);
  });
});

describe("S1 — Restricciones del esquema rechazan inserts inválidos", () => {
  it("needs exige title, description y contact_name (NOT NULL)", () => {
    expect(needsNotNull("title")).toBe(true);
    expect(needsNotNull("description")).toBe(true);
    expect(needsNotNull("contact_name")).toBe(true);
  });

  it("ingest_responses exige event_id (NOT NULL) por ser la clave de idempotencia", () => {
    expect(sql).toMatch(/event_id TEXT NOT NULL/);
  });
});
