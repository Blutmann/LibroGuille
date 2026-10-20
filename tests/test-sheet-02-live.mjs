import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9550 + Math.floor(Math.random() * 40);
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-sheet02-${Date.now()}`);

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1280,820',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/index.html'
]);

let tabs = null;
for (let i = 0; i < 25; i++) {
  await new Promise(r => setTimeout(r, 300));
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    tabs = await res.json();
    if (tabs && tabs.length > 0) break;
  } catch (_) {}
}

if (!tabs || tabs.length === 0) {
  console.error('No se pudo conectar a Edge');
  edge.kill();
  process.exit(1);
}

const tab = tabs.find(t => t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
await new Promise(r => setTimeout(r, 600));

let msgId = 10;
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === id) {
        ws.removeEventListener('message', handler);
        if (d.error) reject(d.error);
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res && res.exceptionDetails) {
    console.error('JS Eval Exception:', res.exceptionDetails);
  }
  return res && res.result ? res.result.value : null;
}

try {
  console.log('=== VERIFICANDO HOJA 02/35 EN EL LIBRO DIGITAL ===\n');

  // Transición a la escena del libro
  await evalInPage(`
    const bypass = document.getElementById('btnBypassTypewriter');
    if (bypass) bypass.click();
    const ts = document.getElementById('sceneTypewriter');
    const bs = document.getElementById('sceneBook');
    if (ts) {
      ts.classList.add('is-hidden');
      ts.style.display = 'none';
      ts.style.zIndex = '-9999';
    }
    if (bs) {
      bs.classList.remove('is-hidden');
    }
  `);

  // Wait for window.book initialization
  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!!window.book && !!document.getElementById('btnToggleBook')`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 150));
  }

  // Abrir libro
  await evalInPage(`window.book.openBook();`);
  
  // Esperar a que se abra el libro
  for (let i = 0; i < 25; i++) {
    const isOpened = await evalInPage(`!window.book.isClosed && !window.book.isAnimating`);
    if (isOpened) break;
    await new Promise(r => setTimeout(r, 100));
  }

  // Avanzar a Pliego 2 (Hojas 02/35 y 03/35)
  await evalInPage(`document.getElementById('btnNext').click();`);
  for (let i = 0; i < 30; i++) {
    const page2Ready = await evalInPage(`window.book.currentIndex === 3 && !window.book.isAnimating`);
    if (page2Ready) break;
    await new Promise(r => setTimeout(r, 100));
  }

  // Inspeccionar elementos de la página izquierda (pageLeftContent) donde reside Hoja 02
  const inspection = await evalInPage(`
    (() => {
      const leftContent = document.getElementById('pageLeftContent');
      const footerNum = leftContent ? leftContent.querySelector('.sheet-number-display') : null;
      const comp = leftContent ? leftContent.querySelector('.sheet-02-composition') : null;
      const date1 = leftContent ? leftContent.querySelector('.date-typewritten-1961-left') : null;
      const clip1 = leftContent ? leftContent.querySelector('.clipping-card-nino') : null;
      const header2 = leftContent ? leftContent.querySelector('.header-el-argentino-1961') : null;
      const clip2 = leftContent ? leftContent.querySelector('.clipping-card-trinchera') : null;
      const indicator = document.getElementById('pageIndicator');

      const getBox = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          left: Math.round(r.left),
          top: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
          src: el.src ? el.src.split('/').slice(-2).join('/') : null
        };
      };

      return {
        footerText: footerNum ? footerNum.textContent.trim() : null,
        indicatorText: indicator ? indicator.textContent.trim() : null,
        hasComposition: !!comp,
        date1: getBox(date1),
        clip1: getBox(clip1),
        header2: getBox(header2),
        clip2: getBox(clip2)
      };
    })()
  `);

  console.log('Datos de la Hoja 02 en el DOM:', JSON.stringify(inspection, null, 2));

  if (inspection.footerText !== '02/35') {
    throw new Error(`Se esperaba '02/35' en pie de página izquierda, pero se obtuvo '${inspection.footerText}'`);
  }
  if (!inspection.hasComposition) {
    throw new Error('No se encontró la composición .sheet-02-composition');
  }
  if (!inspection.date1 || inspection.date1.width <= 0) {
    throw new Error('date1 (8.7.61) no se renderizó');
  }
  if (!inspection.clip1 || inspection.clip1.width <= 0) {
    throw new Error('clip1 (Un niño dice / Soneto) no se renderizó');
  }
  if (!inspection.header2 || inspection.header2.width <= 0) {
    throw new Error('header2 (el argentino 26.7.61) no se renderizó');
  }
  if (!inspection.clip2 || inspection.clip2.width <= 0) {
    throw new Error('clip2 (Trinchera del Asombro) no se renderizó');
  }

  console.log('\n✓ Los 4 elementos documentales están correctamente renderizados con dimensiones válidas.');

  // Verificar modal de transcripción accesible
  await evalInPage(`document.getElementById('btnTranscription').click();`);
  await new Promise(r => setTimeout(r, 400));
  const modalText = await evalInPage(`document.getElementById('transcriptionContent').innerText`);
  console.log('\nMuestra de transcripción accesible (Hoja 02):\n', modalText.slice(0, 220), '...');
  await evalInPage(`document.getElementById('btnCloseModal').click();`);
  await new Promise(r => setTimeout(r, 300));

  // Captura general del pliego sobre la mesa de lectura
  const fullSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-sheet-02-desk.png', Buffer.from(fullSnap.data, 'base64'));
  console.log('\n✓ Captura general de mesa guardada: screenshot-sheet-02-desk.png');

  // Captura macro closeup de la página izquierda (Hoja 02/35) a escala 2x
  const pl = await evalInPage(`(() => {
    const el = document.querySelector('#pageLeft');
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);

  const closeupSnap = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: pl.x,
      y: pl.y,
      width: pl.width,
      height: pl.height,
      scale: 2
    }
  });

  const closeupBuffer = Buffer.from(closeupSnap.data, 'base64');
  fs.writeFileSync('assets/sheet-02/sheet-02-composite.png', closeupBuffer);
  fs.writeFileSync('screenshot-sheet-02-closeup.png', closeupBuffer);
  console.log('✓ Captura macro guardada en assets/sheet-02/sheet-02-composite.png y screenshot-sheet-02-closeup.png');

  console.log('\n=== VERIFICACIÓN DE HOJA 02 COMPLETADA EXITOSAMENTE ===');
} catch (err) {
  console.error('\n❌ ERROR EN VERIFICACIÓN:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  edge.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
}
