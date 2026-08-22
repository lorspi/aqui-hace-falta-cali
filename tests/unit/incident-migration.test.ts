import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

// ============================================================================
// Unit Tests — S5: Migración agrega columnas de idempotencia a needs (DEV-35)
//
// Validan el DDL de la migración S5 como código: columnas de trazabilidad/
// idempotencia, índices únicos parciales y estado de enriquecimiento.
// ============================================================================

const MIGRATIONS_DIR = join(
  fileURLToPath(new URL("..", import.meta.url)),
  "..",
  "supabase",
  "migrations",
);

function readS5Migration(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) =>
    f.toLowerCase().includes("s5_incident_webhook_columns"),
  );
  expect(files.length).toBeGreaterThan(0);
  return readFileSync(join(MIGRATIONS_DIR, files[0]), "utf-8");
}

const sql = readS5Migration();

describe("S5 — Migración agrega columnas de idempotencia a needs", () => {
  it("existe la migración S5 en supabase/migrations", () => {
    expect(sql).toBeTruthy();
  });

  it("agrega source_event_id a needs (idempotencia por event.id del completado)", () => {
    expect(sql).toMatch(/ALTER TABLE needs/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS source_event_id TEXT/);
  });

  it("agrega conversation_id a needs (un incidente por conversación)", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS conversation_id TEXT/);
  });

  it("agrega location_enrichment_status con default PENDING", () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS location_enrichment_status VARCHAR\(50\) NOT NULL DEFAULT 'PENDING'/,
    );
  });

  it("crea un índice único parcial sobre source_event_id (idempotencia S5/S6)", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS idx_needs_source_event_id\s+ON needs\(source_event_id\)\s+WHERE source_event_id IS NOT NULL/,
    );
  });

  it("crea un índice único parcial sobre conversation_id (no mezclar conversaciones)", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS idx_needs_conversation_id\s+ON needs\(conversation_id\)\s+WHERE conversation_id IS NOT NULL/,
    );
  });

  it("crea un índice para localizar incidentes pendientes de enriquecimiento", () => {
    expect(sql).toMatch(
      /CREATE INDEX IF NOT EXISTS idx_needs_location_enrichment_status\s+ON needs\(location_enrichment_status\)/,
    );
  });

  it("otorga privilegios a service_role para que el receptor cree el incidente (S5)", () => {
    expect(sql).toMatch(
      /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE needs TO service_role/,
    );
  });
});
