#!/usr/bin/env python3
"""Suite e2e del receptor RADAR (edge function webhook) contra el stack real.

Endpoint: http://127.0.0.1:8000 (Deno sirviendo supabase/functions/webhook)
Persistencia: Supabase local de RADAR (API 54341, DB 54342).

Cubre el contrato S2-S7 end-to-end (HTTP real + BD real):
  E01 POST válido message.received            -> 200 accepted + persisted
  E02 POST JSON inválido                      -> 400 invalid_json
  E03 POST content-type no JSON               -> 415 invalid_content_type
  E04 POST campos mínimos faltantes           -> 400 validation_failed
  E05 GET (método no permitido)               -> 405 method_not_allowed
  E06 Reenvío mismo event.id                  -> 409 duplicate_event (S6/S7)
  E07 Completado sin mensajes acumulados      -> 409 no_messages (S5)
  E08 Flujo completo: msgs + completado       -> 200 + incident creado (S5)
  E09 Reenvío del completado                  -> 409 duplicate_event (sin duplicar incidente)
  E10 Verificación en BD (ingest_responses, needs)
"""
import json
import subprocess
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000/functions/v1/webhook"
PASS = 0
FAIL = 0
RESULTS = []


def post(payload: dict, path: str = "", content_type: str = "application/json") -> tuple[int, dict]:
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": content_type},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body[:200]}


def check(name: str, cond: bool, detail: str = ""):
    global PASS, FAIL
    if cond:
        PASS += 1
        RESULTS.append(f"  ✅ {name}")
    else:
        FAIL += 1
        RESULTS.append(f"  ❌ {name} — {detail}")


def sql(q: str) -> str:
    r = subprocess.run(
        ["docker", "exec", "supabase_db_aqui-hace-falta-cali", "psql", "-U", "postgres", "-d", "postgres", "-t", "-A", "-c", q],
        capture_output=True, text=True, timeout=30,
    )
    return r.stdout.strip()


def msg_event(eid: str, conv: str, body: str, _from: str = "573001234567") -> dict:
    return {
        "id": eid,
        "type": "message.received",
        "conversation_id": conv,
        "data": {
            "body": body,
            "from": _from,
            "message_type": "text",
            "workflow": {"step": "awaiting_location"},
        },
    }


def completion_event(eid: str, conv: str) -> dict:
    return {
        "id": eid,
        "type": "conversation.completed",
        "conversation_id": conv,
        "data": {
            "body": "Conversación terminada",
            "from": "573001234567",
            "message_type": "system",
            "workflow": {"step": "completed"},
        },
    }


print("=" * 70)
print("SUITE E2E — Receptor RADAR (S2-S7) contra stack real")
print("=" * 70)

# --- E01: evento válido ---
s, b = post(msg_event("e2e_evt_001", "e2e_conv_001", "Necesito agua potable en mi barrio"))
check("E01 POST válido -> 200 accepted", s == 200 and b.get("ok") is True and b.get("status") == "accepted",
      f"status={s} body={json.dumps(b)[:150]}")
check("E01a ACK devuelve event_id/type", b.get("event_id") == "e2e_evt_001" and b.get("type") == "message.received")
check("E01b persisted=true y mapping presente", b.get("persisted") is True and "mapping" in b,
      f"persisted={b.get('persisted')}")
m = b.get("mapping") or {}
check("E01c mapping normaliza message_type/workflow", m.get("message_type") == "TEXT" and m.get("workflow_step") == "AWAITING_LOCATION", f"got {m.get('message_type')}/{m.get('workflow_step')}")
check("E01d contact_whatsapp mapeado", m.get("contact_whatsapp") == "573001234567")
check("E01e builds_incident=true (message.received)", m.get("builds_incident") is True)
check("E01f location_pending_geocoding (sin coords)", m.get("location_pending_geocoding") is True)

# --- E02: JSON inválido ---
try:
    req = urllib.request.Request(BASE, data=b"{not-json", headers={"Content-Type": "application/json"}, method="POST")
    urllib.request.urlopen(req, timeout=15)
    check("E02 JSON inválido -> 400", False, "no lanzó HTTPError")
except urllib.error.HTTPError as e:
    body = json.loads(e.read().decode())
    check("E02 JSON inválido -> 400 invalid_json", e.code == 400 and body.get("code") == "invalid_json", f"code={e.code}")

# --- E03: content-type no JSON ---
s, b = post({"id": "x"}, content_type="text/plain")
check("E03 content-type text/plain -> 415", s == 415 and b.get("code") == "invalid_content_type", f"status={s}")

# --- E04: campos faltantes ---
s, b = post({"id": "e2e_evt_incomplete"})
check("E04 evento sin type/campos -> 400 validation_failed", s == 400 and b.get("code") == "validation_failed", f"status={s} code={b.get('code')}")
check("E04a details.issues con detalle", isinstance(b.get("details", {}).get("issues"), list) and len(b["details"]["issues"]) > 0)

# --- E05: método no permitido ---
try:
    req = urllib.request.Request(BASE, method="GET")
    urllib.request.urlopen(req, timeout=15)
    check("E05 GET -> 405", False, "no lanzó HTTPError")
except urllib.error.HTTPError as e:
    body = json.loads(e.read().decode())
    check("E05 GET -> 405 method_not_allowed", e.code == 405 and body.get("code") == "method_not_allowed", f"code={e.code}")

# --- E06: reenvío mismo event.id ---
s, b = post(msg_event("e2e_evt_001", "e2e_conv_001", "Mismo evento reenviado"))
check("E06 reenvío -> 409 duplicate_event", s == 409 and b.get("code") == "duplicate_event", f"status={s} code={b.get('code')}")
check("E06a details.record trae la fila existente", b.get("details", {}).get("record", {}).get("event_id") == "e2e_evt_001")

# --- E07: completado sin mensajes acumulados ---
s, b = post(completion_event("e2e_evt_comp_solo", "e2e_conv_sin_mensajes"))
check("E07 completado sin mensajes -> 409 no_messages", s == 409 and b.get("code") == "no_messages", f"status={s} code={b.get('code')}")

# --- E08: flujo completo (mensajes + completado) ---
conv = "e2e_conv_full"
post(msg_event("e2e_evt_msg1", conv, "Primer mensaje: se cayó un árbol"))
post(msg_event("e2e_evt_msg2", conv, "Segundo mensaje: bloquea la vía"))
s, b = post(completion_event("e2e_evt_comp", conv))
check("E08 completado con mensajes -> 200", s == 200 and b.get("ok") is True, f"status={s} body={json.dumps(b)[:200]}")
inc = b.get("incident") or {}
check("E08a incident creado (outcome=created)", inc.get("outcome") == "created", f"outcome={inc.get('outcome')}")
check("E08b incidente con conversation_id", inc.get("conversation_id") == conv)
check("E08c source=WhatsApp", inc.get("source") == "WhatsApp", f"source={inc.get('source')}")
check("E08d contact_whatsapp del from", inc.get("contact_whatsapp") == "573001234567")
check("E08e PENDING_VERIFICATION", inc.get("verification_status") == "PENDING_VERIFICATION", f"vs={inc.get('verification_status')}")

# --- E09: reenvío del completado (idempotencia del incidente) ---
s, b = post(completion_event("e2e_evt_comp", conv))
check("E09 reenvío completado -> 409 duplicate_event", s == 409 and b.get("code") == "duplicate_event", f"status={s} code={b.get('code')}")

# --- E10: verificación en BD ---
n_ingest = sql("SELECT count(*) FROM ingest_responses WHERE event_id LIKE 'e2e_%';")
check("E10a ingest_responses guarda los eventos e2e", int(n_ingest) >= 4, f"filas={n_ingest}")
n_needs = sql("SELECT count(*) FROM needs WHERE conversation_id = 'e2e_conv_full';")
check("E10b needs tiene el incidente del flujo completo", int(n_needs) == 1, f"filas={n_needs}")
raw_ok = sql("SELECT raw_event->>'id' FROM ingest_responses WHERE event_id='e2e_evt_001';")
check("E10c raw_event intacto (auditoría)", raw_ok == "e2e_evt_001", f"raw={raw_ok}")
status_ok = sql("SELECT processing_status FROM ingest_responses WHERE event_id='e2e_evt_001';")
check("E10d processing_status=RECEIVED", status_ok == "RECEIVED", f"status={status_ok}")
dup_count = sql("SELECT count(*) FROM ingest_responses WHERE event_id='e2e_evt_001';")
check("E10e reenvío NO duplicó la fila", int(dup_count) == 1, f"filas={dup_count}")

# --- Resumen ---
print("-" * 70)
print("\n".join(RESULTS))
print("-" * 70)
print(f"RESULTADO: {PASS} pasaron, {FAIL} fallaron")
sys.exit(1 if FAIL else 0)
