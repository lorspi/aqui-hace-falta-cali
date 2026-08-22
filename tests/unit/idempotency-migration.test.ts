import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

// ============================================================================
// Unit Tests — S6: Migración de idempotencia / deduplicación (DEV-36)
//
// La historia S6 exige que reenvíos del mismo evento no generen duplicados,
// con `event.id` como clave de idempotencia. La migración S1 (DEV-31) ya creó
// la constraint `ingest_responses_event_id_key UNIQUE (event_id)`; la migración
// S6 la asegura de forma idempotente y documenta la columna como clave de
// idempotencia.
// ============================================================================

const MIGRATIONS_DIR = join(
  fileURLToPath(new URL("..", import.meta.url)),
  "..",
  "supabase",
  "migrations"
);

function readS6Migration(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) =>
    f.toLowerCase().includes("s6_idempotencia")
  );
  expect(files.length).toBeGreaterThan(0);
  return readFileSync(join(MIGRATIONS_DIR, files[0]), "utf-8");
}

const sql = readS6Migration();

describe("S6 — Migración de idempotencia / deduplicación", () => {
  it("existe la migración S6 en supabase/migrations", () => {
    expect(sql).toBeTruthy();
  });

  it("asegura la constraint UNIQUE(event_id) de forma idempotente (DO block)", () => {
    expect(sql).toMatch(/DO\s*\$\$/);
    expect(sql).toMatch(/pg_constraint/);
    expect(sql).toMatch(/ingest_responses_event_id_key/);
    expect(sql).toMatch(/ADD CONSTRAINT ingest_responses_event_id_key UNIQUE \(event_id\)/);
  });

  it("documenta event_id como clave de idempotencia en el esquema", () => {
    expect(sql).toMatch(/COMMENT ON COLUMN ingest_responses\.event_id/);
    expect(sql).toMatch(/Clave de idempotencia/);
  });

  it("no elimina la columna event_id ni su NOT NULL", () => {
    expect(sql).not.toMatch(/DROP COLUMN event_id/);
  });
});
