// Captura: doble clic en Aprobar no duplica la llamada; y operador sin sesión
// muestra error missing_operator sin llamar al endpoint.
import WebSocket from 'ws';
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const { spawn } = await import('node:child_process');
  const port = 9361;
  const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',`--remote-debugging-port=${port}`,'--user-data-dir=/tmp/dev46-dbl-profile','about:blank'], { stdio: 'ignore' });
  await sleep(2000);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const pageTarget = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
  let msgId = 0; const pending = new Map();
  const send = (m, p={}) => new Promise((res, rej) => { const id=++msgId; pending.set(id,{resolve:res,reject:rej}); ws.send(JSON.stringify({id,method:m,params:p})); });
  ws.on('message', (raw) => { const m = JSON.parse(raw.toString()); if (m.id && pending.has(m.id)) { const {resolve,reject}=pending.get(m.id); pending.delete(m.id); m.error?reject(new Error(m.error.message)):resolve(m.result); } });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { localStorage.setItem('ahf_admin_token','t'); localStorage.setItem('ahf_admin_user', JSON.stringify({name:'Op',email:'op@radar.local',role:'ADMIN'})); })();` });
  await send('Page.navigate', { url: 'http://localhost:8080/panel' });
  await sleep(4000);
  const evalJs = async (e) => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.value;
  await evalJs(`(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent.includes('Reportes del Chatbot')); if(b){b.click();return true;} return false; })()`);
  await sleep(4000);
  await evalJs(`(() => { const c=Array.from(document.querySelectorAll('[role="button"]')).find(x=>x.textContent.includes('Prueba de doble clic')); if(c){c.click();return true;} return false; })()`);
  await sleep(5000);
  const before = await evalJs(`(() => { const p=document.querySelector('[data-testid="review-actions-panel"]'); const a=p?.querySelector('[data-testid="review-approve"]'); return { enabled: a ? !a.disabled : null }; })()`);
  console.log('APROBAR HABILITADO ANTES:', JSON.stringify(before));
  // Doble clic rápido
  await evalJs(`(() => { const a=document.querySelector('[data-testid="review-approve"]'); if(a){a.click();a.click();} return true; })()`);
  // Inmediatamente después del doble clic, los botones deben estar disabled/busy
  const mid = await evalJs(`(() => { const p=document.querySelector('[data-testid="review-actions-panel"]'); const a=p?.querySelector('[data-testid="review-approve"]'); return { disabled: a ? a.disabled : null, processing: p?.textContent.includes('Procesando') || p?.textContent.includes('Processing') }; })()`);
  console.log('ESTADO DURANTE PETICIÓN (tras doble clic):', JSON.stringify(mid));
  await sleep(4000);
  const after = await evalJs(`(() => { const p=document.querySelector('[data-testid="review-actions-panel"]'); const a=p?.querySelector('[data-testid="review-approve"]'); return { actionsPresent: !!a, reviewedBy: p?.querySelector('[data-testid="review-verified-by"]')?.textContent?.trim() || null, text: p?.textContent.replace(/\\s+/g,' ').trim() }; })()`);
  console.log('DESPUÉS (una sola decisión procesada):', JSON.stringify(after));
  chrome.kill(); process.exit(0);
}
main().catch((e)=>{console.error(e);process.exit(1);});
