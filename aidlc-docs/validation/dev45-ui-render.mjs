#!/usr/bin/env node
// =============================================================================
// dev45-ui-render.mjs — Captura de la pantalla de detalle del reporte del
// chatbot (US-6)
//
// Usa Chrome headless vía CDP (ws) para:
//   1. Abrir http://localhost:8081/panel con el token de moderador inyectado
//      ANTES de cargar la app (Page.addScriptToEvaluateOnNewDocument) para
//      evitar carreras de login (acceso rápido moderador123)
//   2. Clickear el tab "Reportes del Chatbot"
//   3. Clickear el reporte con la conversación completa (imagen + ubicación +
//      tipo desconocido + mensaje saliente del bot) para abrir el detalle (US-6)
//   4. Volcar el DOM del chat (burbujas entrante/saliente, foto renderizada,
//      ubicación renderizada, orden cronológico)
//   5. Clickear la pestaña "Datos del incidente" y volcar el panel de
//      validación (contact_whatsapp, address, neighborhood, title, description,
//      priority, verification_status)
//   6. Volver al listado y abrir un need con location_enrichment_status=PENDING
//      para verificar que el panel indica "ubicación aún no geolocalizada"
//
// Evidencia textual: la conversación tipo chat en orden cronológico, los
// adjuntos renderizados (no como texto/enlace crudo) y los campos del panel.
// =============================================================================
import WebSocket from 'ws';

const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.TARGET_URL || 'http://localhost:8081/panel';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { spawn } = await import('node:child_process');
  const port = 9334;
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/dev45-chrome-profile',
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
      localStorage.setItem('ahf_admin_token', 'ahf_token_dev45_evidence');
      localStorage.setItem('ahf_admin_user', JSON.stringify({ name: 'Operador Evidencia', email: 'operador@radar.local', role: 'ADMIN', active: true, id: 'session-dev45', createdAt: new Date().toISOString() }));
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

  // Abre el detalle del reporte "Necesito agua potable para mi familia".
  const opened = await evalJs(`(() => {
    const cards = Array.from(document.querySelectorAll('[role="button"]'));
    const card = cards.find((c) => c.textContent.includes('Necesito agua potable para mi familia'));
    if (card) { card.click(); return true; }
    return false;
  })()`);
  console.log('detalle abierto (need completo):', opened);
  await sleep(4500);

  const domChat = await evalJs(`document.body.innerText.slice(0, 10000)`);
  console.log('=== DOM RENDERIZADO — DETALLE (need completo, pestaña Conversación) ===');
  console.log(domChat);
  console.log('=== FIN DOM ===');

  // Verifica que el chat no muestra URLs crudas ni JSON.
  const rawChecks = await evalJs(`(() => {
    const text = document.body.innerText;
    const citizenCount = (text.match(/CIUDADANO/g) || []).length;
    const botCount = (text.match(/BOT \\/ EQUIPO/g) || []).length;
    const iframes = Array.from(document.querySelectorAll('iframe'));
    return {
      showsRawJson: text.includes('"event_id"') || text.includes('raw_event'),
      showsRawUrl: text.includes('media.example.com'),
      imageRendered: document.querySelectorAll('img').length > 0,
      locationIframe: iframes.length > 0,
      conversationTitle: text.includes('Detalle de la conversación'),
      panelTitle: text.includes('Datos del incidente'),
      contact: text.includes('573001234567'),
      address: text.includes('Calle 5 #10-20'),
      citizenBubbles: citizenCount,
      botBubbles: botCount,
      unknownGeneric: text.includes('Mensaje raro') && text.includes('MENSAJE'),
    };
  })()`);
  console.log('=== CHECKS DOM (need completo, conversación) ===');
  console.log(JSON.stringify(rawChecks, null, 2));

  // ---- Pestaña "Datos del incidente" ----
  await evalJs(`(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tab = buttons.find((b) => b.textContent.includes('Datos del incidente'));
    if (tab) { tab.click(); return true; }
    return false;
  })()`);
  await sleep(2500);

  const domPanel = await evalJs(`document.body.innerText.slice(0, 7000)`);
  console.log('=== DOM RENDERIZADO — DETALLE (need completo, pestaña Datos del incidente) ===');
  console.log(domPanel);
  console.log('=== FIN DOM ===');

  const panelChecks = await evalJs(`(() => {
    const text = document.body.innerText;
    return {
      title: text.includes('Necesito agua potable para mi familia'),
      description: text.includes('Necesito agua potable para mi familia | Te adjunto la foto del daño'),
      contact: text.includes('573001234567'),
      address: text.includes('Calle 5 #10-20'),
      neighborhood: text.includes('Por confirmar'),
      priority: text.includes('Prioridad Media'),
      verification: text.includes('Pendiente'),
      status: text.includes('NEED_HELP_NOW'),
      conversationTrace: text.includes('dev45_conv_full'),
      sourceEvent: text.includes('dev45_comp'),
    };
  })()`);
  console.log('=== CHECKS PANEL (need completo) ===');
  console.log(JSON.stringify(panelChecks, null, 2));

  // ---- Vuelve al listado ----
  await evalJs(`(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const back = buttons.find((b) => b.querySelector('svg') && !b.querySelector('span'));
    if (back) { back.click(); return true; }
    return false;
  })()`);
  await sleep(3000);

  // Abre el reporte dev45_pending_loc (PENDING de ubicación)
  const openedPending = await evalJs(`(() => {
    const cards = Array.from(document.querySelectorAll('[role="button"]'));
    const card = cards.find((c) => c.textContent.includes('dev45_pending_loc'));
    if (card) { card.click(); return true; }
    return false;
  })()`);
  console.log('detalle abierto (need PENDING loc):', openedPending);
  await sleep(4500);

  // Click en pestaña "Datos del incidente" para ver el panel de ubicación
  await evalJs(`(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tab = buttons.find((b) => b.textContent.includes('Datos del incidente'));
    if (tab) { tab.click(); return true; }
    return false;
  })()`);
  await sleep(2500);

  const domPending = await evalJs(`document.body.innerText.slice(0, 8000)`);
  console.log('=== DOM RENDERIZADO — DETALLE (need PENDING loc) ===');
  console.log(domPending);
  console.log('=== FIN DOM ===');

  const pendingChecks = await evalJs(`(() => {
    const text = document.body.innerText;
    return {
      locationPendingShown: text.includes('Ubicación aún no geolocalizada'),
      hasIncidentPanel: text.includes('Datos del incidente'),
      showsConversation: text.includes('Necesito ayuda en mi barrio'),
      noEmptyMap: !text.includes('Mapa vacío'),
    };
  })()`);
  console.log('=== CHECKS DOM (need PENDING loc) ===');
  console.log(JSON.stringify(pendingChecks, null, 2));

  ws.close();
  chrome.kill();
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
