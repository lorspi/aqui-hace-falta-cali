#!/usr/bin/env node
// =============================================================================
// dev46-ui-review-full.mjs — Captura completa de las acciones de aprobar /
// rechazar (US-7) contra un reporte PENDING recién sembrado.
//
// Flujo:
//   1. Login rápido (token inyectado) + tab "Reportes del Chatbot".
//   2. Abre el detalle del reporte PENDING `dev46_fresco` (US-6) y vuelca el
//      panel de revisión ANTES de decidir: Aprobar/Rechazar habilitados.
//   3. Click "Aprobar" → vuelca el panel DESPUÉS: estado ya revisado, acciones
//      deshabilitadas y trazabilidad quién/cuándo.
//   4. Abre el detalle del reporte `dev46_ya_revisado` (VERIFIED por otra
//      operadora): acciones deshabilitadas + quién/cuándo/nota visibles.
//   5. Abre el detalle del reporte `dev46_rechazado` (PENDING) y click
//      "Rechazar" → vuelca el panel tras rechazar (REJECTED).
// Evidencia textual de cada paso.
// =============================================================================
import WebSocket from 'ws';

const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.TARGET_URL || 'http://localhost:8080/panel';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { spawn } = await import('node:child_process');
  const port = 9360;
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/dev46-full-profile',
    'about:blank',
  ], { stdio: 'ignore' });

  await sleep(2000);

  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page');
  if (!pageTarget) throw new Error('No page target en Chrome.');
  const webSocketDebuggerUrl = pageTarget.webSocketDebuggerUrl;

  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  let msgId = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++msgId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');

  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      localStorage.setItem('ahf_admin_token', 'ahf_token_dev46_evidence');
      localStorage.setItem('ahf_admin_user', JSON.stringify({ name: 'Operador DEV46', email: 'operador.dev46@radar.local', role: 'ADMIN', active: true, id: 'session-dev46', createdAt: new Date().toISOString() }));
    })();`,
  });

  const evalJs = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    return result.result?.value;
  };

  const clickTab = async () => {
    const ok = await evalJs(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find((b) => b.textContent.includes('Reportes del Chatbot'));
      if (tab) { tab.click(); return true; }
      return false;
    })()`);
    return ok;
  };

  const openCard = async (needle) => {
    const ok = await evalJs(`(() => {
      const cards = Array.from(document.querySelectorAll('[role="button"]'));
      const target = cards.find((c) => c.textContent.includes(${JSON.stringify(needle)}));
      if (target) { target.click(); return true; }
      return false;
    })()`);
    return ok;
  };

  const goBack = async () => {
    const ok = await evalJs(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Volver a reportes');
      if (btn) { btn.click(); return true; }
      return false;
    })()`);
    return ok;
  };

  const dumpPanel = async (label) => {
    const panel = await evalJs(`(() => {
      const p = document.querySelector('[data-testid="review-actions-panel"]');
      if (!p) return null;
      const approveBtn = p.querySelector('[data-testid="review-approve"]');
      const rejectBtn = p.querySelector('[data-testid="review-reject"]');
      const err = p.querySelector('[data-testid="review-error"]');
      return {
        text: p.textContent.replace(/\\s+/g, ' ').trim(),
        approveEnabled: approveBtn ? !approveBtn.disabled : null,
        rejectEnabled: rejectBtn ? !rejectBtn.disabled : null,
        approveLabel: approveBtn?.textContent?.trim() || null,
        rejectLabel: rejectBtn?.textContent?.trim() || null,
        verifiedBy: p.querySelector('[data-testid="review-verified-by"]')?.textContent?.trim() || null,
        verifiedAt: p.querySelector('[data-testid="review-verified-at"]')?.textContent?.trim() || null,
        notes: p.querySelector('[data-testid="review-notes"]')?.textContent?.trim() || null,
        error: err?.textContent?.replace(/\\s+/g, ' ').trim() || null,
      };
    })()`);
    console.log(`\\n=== ${label} ===`);
    console.log(JSON.stringify(panel, null, 2));
    return panel;
  };

  const clickAction = async (testid) => {
    const ok = await evalJs(`(() => {
      const btn = document.querySelector('[data-testid="${testid}"]');
      if (btn) { btn.click(); return true; }
      return false;
    })()`);
    return ok;
  };

  await send('Page.navigate', { url: URL });
  await sleep(4000);

  let tabFound = false;
  for (let i = 0; i < 12; i++) {
    tabFound = await evalJs(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((b) => b.textContent.includes('Reportes del Chatbot'));
    })()`);
    if (tabFound) break;
    await sleep(1000);
  }
  console.log('tab Reportes del Chatbot visible:', tabFound);
  await clickTab();
  await sleep(4000);

  // ---- 2. Detalle PENDING dev46_fresco: acciones habilitadas ----
  console.log('\\n>>> ABRIENDO DETALLE dev46_fresco (PENDING)');
  console.log('opened:', await openCard('Solicito carpa y frazadas'));
  await sleep(5000);
  await dumpPanel('PANEL ANTES DE APROBAR (PENDING)');

  // ---- 3. Aprobar ----
  console.log('\\n>>> CLICK APROBAR');
  console.log('clicked:', await clickAction('review-approve'));
  await sleep(4000);
  await dumpPanel('PANEL DESPUÉS DE APROBAR (VERIFIED)');

  // Volver al listado
  console.log('\\n>>> VOLVER AL LISTADO');
  await goBack();
  await sleep(4000);

  // ---- 4. Detalle ya revisado dev46_ya_revisado ----
  console.log('\\n>>> ABRIENDO DETALLE dev46_ya_revisado (VERIFIED por otra operadora)');
  console.log('opened:', await openCard('dev46_ya_revisado'));
  await sleep(5000);
  await dumpPanel('PANEL REPORTE YA REVISADO (VERIFIED)');

  // Volver al listado
  await goBack();
  await sleep(4000);

  // ---- 5. Rechazar dev46_rechazado (PENDING) ----
  console.log('\\n>>> ABRIENDO DETALLE dev46_rechazado (PENDING)');
  console.log('opened:', await openCard('Reporte duplicado con datos incompletos'));
  await sleep(5000);
  await dumpPanel('PANEL ANTES DE RECHAZAR (PENDING)');

  console.log('\\n>>> CLICK RECHAZAR');
  console.log('clicked:', await clickAction('review-reject'));
  await sleep(4000);
  await dumpPanel('PANEL DESPUÉS DE RECHAZAR (REJECTED)');

  console.log('\\n=== FIN CAPTURA UI DEV-46 ===');
  chrome.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
