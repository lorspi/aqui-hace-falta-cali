#!/usr/bin/env node
// =============================================================================
// dev46-ui-review.mjs — Captura de las acciones de aprobar / rechazar (US-7)
//
// Usa Chrome headless vía CDP (ws) para:
//   1. Abrir http://localhost:8080/panel con el token de moderador inyectado
//      ANTES de cargar la app (Page.addScriptToEvaluateOnNewDocument) para
//      evitar carreras de login (acceso rápido moderador123).
//   2. Clickear el tab "Reportes del Chatbot".
//   3. Abrir el detalle del reporte PENDING dev46_aprobado (US-6) y volcar el
//      panel de revisión: botones Aprobar/Rechazar HABILITADOS.
//   4. Clickear "Aprobar" → volcar el panel tras la decisión: estado VERIFIED,
//      acciones deshabilitadas y trazabilidad quién/cuándo.
//   5. Abrir el detalle del reporte dev46_ya_revisado (VERIFIED por otro
//      operador) → acciones deshabilitadas + quién/cuándo visibles.
//   6. (Estado de error) Se verifica con curl aparte el 400 missing_operator.
//
// Evidencia textual: el panel de revisión antes/después de la decisión y la
// trazabilidad del reporte ya revisado.
// =============================================================================
import WebSocket from 'ws';

const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.TARGET_URL || 'http://localhost:8080/panel';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { spawn } = await import('node:child_process');
  const port = 9356;
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/dev46-chrome-profile',
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

  // Inyecta el token de moderador ANTES de que la app lea localStorage.
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

  // Navega al panel.
  await send('Page.navigate', { url: URL });
  await sleep(4000);

  // Espera el tab "Reportes del Chatbot".
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

  // Click en el tab "Reportes del Chatbot".
  await evalJs(`(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tab = buttons.find((b) => b.textContent.includes('Reportes del Chatbot'));
    if (tab) { tab.click(); return true; }
    return false;
  })()`);
  await sleep(4000);

  // Lee el listado de reportes del chatbot (US-5).
  const listBody = await evalJs(`(() => {
    const cards = Array.from(document.querySelectorAll('[role="button"]'));
    return cards.map((c) => c.textContent.replace(/\\s+/g, ' ').trim()).filter((t) => t.length > 0);
  })()`);
  console.log('\\n=== LISTADO REPORTES CHATBOT ===');
  console.log(JSON.stringify(listBody, null, 2));

  // --- 1. Abrir el detalle del reporte PENDING dev46_aprobado ---
  const openedPending = await evalJs(`(() => {
    const cards = Array.from(document.querySelectorAll('[role="button"]'));
    const target = cards.find((c) => c.textContent.includes('Necesito agua potable para mi familia en El Peñón'));
    if (target) { target.click(); return true; }
    return false;
  })()`);
  console.log('\\nabierto detalle dev46_aprobado (PENDING):', openedPending);
  await sleep(4000);

  const pendingPanel = await evalJs(`(() => {
    const panel = document.querySelector('[data-testid="review-actions-panel"]');
    if (!panel) return null;
    const approveBtn = panel.querySelector('[data-testid="review-approve"]');
    const rejectBtn = panel.querySelector('[data-testid="review-reject"]');
    return {
      panelTitle: panel.querySelector('h4')?.textContent || '',
      pendingHint: panel.textContent.includes('pendiente de verificación'),
      approveLabel: approveBtn?.textContent?.trim() || '',
      rejectLabel: rejectBtn?.textContent?.trim() || '',
      approveEnabled: approveBtn ? !approveBtn.disabled : false,
      rejectEnabled: rejectBtn ? !rejectBtn.disabled : false,
    };
  })()`);
  console.log('\\n=== PANEL REVISIÓN ANTES DE APROBAR (PENDING) ===');
  console.log(JSON.stringify(pendingPanel, null, 2));

  // Click en "Aprobar".
  await evalJs(`(() => {
    const btn = document.querySelector('[data-testid="review-approve"]');
    if (btn) { btn.click(); return true; }
    return false;
  })()`);
  await sleep(3500);

  const approvedPanel = await evalJs(`(() => {
    const panel = document.querySelector('[data-testid="review-actions-panel"]');
    if (!panel) return null;
    const approveBtn = panel.querySelector('[data-testid="review-approve"]');
    const rejectBtn = panel.querySelector('[data-testid="review-reject"]');
    return {
      text: panel.textContent.replace(/\\s+/g, ' ').trim(),
      verifiedBy: panel.querySelector('[data-testid="review-verified-by"]')?.textContent?.trim() || '',
      verifiedAt: panel.querySelector('[data-testid="review-verified-at"]')?.textContent?.trim() || '',
      actionsPresent: !!approveBtn || !!rejectBtn,
      approveDisabled: approveBtn ? approveBtn.disabled : null,
      rejectDisabled: rejectBtn ? rejectBtn.disabled : null,
    };
  })()`);
  console.log('\\n=== PANEL REVISIÓN DESPUÉS DE APROBAR ===');
  console.log(JSON.stringify(approvedPanel, null, 2));

  // Volver al listado.
  await evalJs(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Volver a reportes');
    if (btn) { btn.click(); return true; }
    return false;
  })()`);
  await sleep(3500);

  // --- 2. Abrir el detalle del reporte ya revisado dev46_ya_revisado ---
  const openedVerified = await evalJs(`(() => {
    const cards = Array.from(document.querySelectorAll('[role="button"]'));
    const target = cards.find((c) => c.textContent.includes('dev46_ya_revisado'));
    if (target) { target.click(); return true; }
    return false;
  })()`);
  console.log('\\nabierto detalle dev46_ya_revisado (VERIFIED):', openedVerified);
  await sleep(4000);

  const reviewedPanel = await evalJs(`(() => {
    const panel = document.querySelector('[data-testid="review-actions-panel"]');
    if (!panel) return null;
    const approveBtn = panel.querySelector('[data-testid="review-approve"]');
    const rejectBtn = panel.querySelector('[data-testid="review-reject"]');
    return {
      text: panel.textContent.replace(/\\s+/g, ' ').trim(),
      alreadyReviewedLabel: panel.textContent.includes('ya fue revisado') || panel.textContent.includes('already reviewed'),
      verifiedBy: panel.querySelector('[data-testid="review-verified-by"]')?.textContent?.trim() || '',
      verifiedAt: panel.querySelector('[data-testid="review-verified-at"]')?.textContent?.trim() || '',
      notes: panel.querySelector('[data-testid="review-notes"]')?.textContent?.trim() || '',
      actionsPresent: !!approveBtn || !!rejectBtn,
      approveDisabled: approveBtn ? approveBtn.disabled : null,
      rejectDisabled: rejectBtn ? rejectBtn.disabled : null,
    };
  })()`);
  console.log('\\n=== PANEL REVISIÓN REPORTE YA REVISADO ===');
  console.log(JSON.stringify(reviewedPanel, null, 2));

  console.log('\\n=== FIN CAPTURA UI DEV-46 ===');
  chrome.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
