#!/usr/bin/env node
// =============================================================================
// dev44-ui-render.mjs — Captura del listado de reportes del chatbot (US-5)
//
// Usa Chrome headless vía CDP (ws) para:
//   1. Abrir http://localhost:8081/panel
//   2. Setear el token de moderador en localStorage (acceso rápido moderador123)
//   3. Recargar y clickear el tab "Reportes del Chatbot"
//   4. Volcar el DOM renderizado (contenido del listado)
//
// Evidencia textual: los reportes del chatbot (source=WhatsApp) con su badge de
// estado, prioridad, contacto, conversación y estado de enriquecimiento.
// =============================================================================
import WebSocket from 'ws';

const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.TARGET_URL || 'http://localhost:8081/panel';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // Lanza Chrome headless con debugging remoto en un puerto libre.
  const { spawn } = await import('node:child_process');
  const port = 9333;
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/dev44-chrome-profile',
    'about:blank',
  ], { stdio: 'ignore' });

  await sleep(2000);

  // Busca un page target (no browser) para poder usar Runtime/Page.
  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page');
  if (!pageTarget) {
    throw new Error('No se encontró un page target en Chrome.');
  }
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

  // Habilita Runtime y Page.
  await send('Runtime.enable');
  await send('Page.enable');

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

  // Setea el token de moderador (login rápido: moderador123) y recarga.
  await evalJs(`(() => {
    localStorage.setItem('ahf_admin_token', 'ahf_token_dev44_evidence');
    localStorage.setItem('ahf_admin_user', JSON.stringify({ name: 'Operador Evidencia', email: 'operador@radar.local', role: 'ADMIN', active: true, id: 'session-dev44', createdAt: new Date().toISOString() }));
    return true;
  })()`);
  await send('Page.navigate', { url: URL });
  await sleep(4500);

  // Espera a que el panel (login superado) renderice los tabs.
  let tabFound = false;
  for (let i = 0; i < 10; i++) {
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

  // Extrae el DOM del listado (body completo del panel).
  const dom = await evalJs(`document.body.innerText.slice(0, 9000)`);

  console.log('=== DOM RENDERIZADO DEL PANEL (tab Reportes del Chatbot) ===');
  console.log(dom);
  console.log('=== FIN DOM ===');

  ws.close();
  chrome.kill();
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
