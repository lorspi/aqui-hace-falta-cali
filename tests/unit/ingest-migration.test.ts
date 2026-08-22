import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

// ============================================================================
// Unit Tests — S4: Migración agrega raw_event a ingest_responses (DEV-34)
//
// La historia S4 exige una columna del evento crudo (`raw_event`) que guarde el
// JSON completo del evento sin modificar. La migración S4 la agrega de forma
// idempotente (ADD COLUMN IF NOT EXISTS), conservando `raw_payload` (S1).
// ============================================================================

const MIGRATIONS_DIR = join(
  fileURLToPath(new URL("..", import.meta.url)),
  "..",
  "supabase",
  "migrations"
);

function readS4Migration(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) =>
    f.toLowerCase().includes("s4_ingest_raw_event")
  );
  expect(files.length).toBeGreaterThan(0);
  return readFileSync(join(MIGRATIONS_DIR, files[0]), "utf-8");
}

const sql = readS4Migration();

describe("S4 — Migración agrega raw_event a ingest_responses", () => {
  it("existe la migración S4 en supabase/migrations", () => {
    expect(sql).toBeTruthy();
  });

  it("agrega la columna raw_event JSONB de forma idempotente", () => {
    expect(sql).toMatch(/ALTER TABLE ingest_responses/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS raw_event JSONB/);
  });

  it("conserva la columna raw_payload (compatibilidad S1)", () => {
    // La migración no elimina raw_payload; la documenta como alias.
    expect(sql).not.toMatch(/DROP COLUMN raw_payload/);
    expect(sql).toMatch(/raw_payload/);
  });

  it("documenta la columna raw_event en el esquema", () => {
    expect(sql).toMatch(/COMMENT ON COLUMN ingest_responses\.raw_event/);
  });

  it("otorga privilegios de lectura/escritura a service_role para persistir (S4)", () => {
    // La Edge Function escribe con service_role (BYPASSRLS); sin estos grants
    // la persistencia falla con 403 permission denied.
    expect(sql).toMatch(
      /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ingest_responses TO service_role/,
    );
  });

  it("los grants a anon/authenticated conviven con RLS (sin políticas, bloqueados)", () => {
    // RLS sin políticas sobre ingest_responses sigue bloqueando a anon/
    // authenticated a nivel de fila (S1): el grant de tabla no los habilita.
    expect(sql).toMatch(
      /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ingest_responses TO anon, authenticated/,
    );
  });
});
