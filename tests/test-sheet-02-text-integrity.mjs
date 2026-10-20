import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9550 + Math.floor(Math.random() * 40);
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-sheet02-text-${Date.now()}`);

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
  console.log('=== VERIFICANDO INTEGRIDAD DE TEXTOS EN HOJA 02/35 ===\n');

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

  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!!window.book && !!document.getElementById('btnToggleBook')`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 150));
  }

  // Abrir libro
  await evalInPage(`window.book.openBook();`);
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

  // Inspección detallada del DOM de Hoja 02
  const domInfo = await evalInPage(`
    (() => {
      const leftContent = document.getElementById('pageLeftContent');
      const dateLeft = leftContent.querySelector('.date-typewritten-1961-left');
      const headerRight = leftContent.querySelector('.header-el-argentino-1961');
      const dateRight = leftContent.querySelector('.date-typewritten-1961-right');
      const groupTrinchera = leftContent.querySelector('.heading-group-trinchera');
      const wrapNino = leftContent.querySelector('.wrap-nino-dice');
      const wrapTrinchera = leftContent.querySelector('.wrap-trinchera');

      const getBox = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          left: Math.round(r.left),
          top: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
          src: el.src || null,
          alt: el.alt || null,
          naturalWidth: el.naturalWidth || null,
          naturalHeight: el.naturalHeight || null
        };
      };

      return {
        dateLeft: getBox(dateLeft),
        headerRight: getBox(headerRight),
        dateRight: getBox(dateRight),
        groupTrinchera: getBox(groupTrinchera),
        wrapNino: getBox(wrapNino),
        wrapTrinchera: getBox(wrapTrinchera)
      };
    })()
  `);

  console.log('Información de elementos en DOM:');
  console.log(JSON.stringify(domInfo, null, 2));

  // Validaciones
  if (!domInfo.dateLeft || domInfo.dateLeft.naturalWidth !== 485) {
    throw new Error(`dateLeft esperado 485x110, se obtuvo: ${JSON.stringify(domInfo.dateLeft)}`);
  }
  if (!domInfo.headerRight || domInfo.headerRight.naturalWidth !== 908) {
    throw new Error(`headerRight esperado 908x132, se obtuvo: ${JSON.stringify(domInfo.headerRight)}`);
  }
  if (!domInfo.dateRight || domInfo.dateRight.naturalWidth !== 500) {
    throw new Error(`dateRight esperado 500x88, se obtuvo: ${JSON.stringify(domInfo.dateRight)}`);
  }
  if (!domInfo.groupTrinchera) {
    throw new Error('No se encontró .heading-group-trinchera');
  }

  // Verificar que dateRight está verticalmente DEBAJO de headerRight
  const isBelow = domInfo.dateRight.top >= domInfo.headerRight.top + domInfo.headerRight.height - 2;
  console.log(`\n¿dateRight (26.7.61) está debajo de headerRight (el argentino)? ${isBelow} (header bottom: ${domInfo.headerRight.top + domInfo.headerRight.height}, date top: ${domInfo.dateRight.top})`);
  if (!isBelow) {
    throw new Error('dateRight no está ubicado debajo de headerRight');
  }

  // Capturar closeup de la hoja 02
  const pl = await evalInPage(`(() => {
    const el = document.querySelector('#pageLeft');
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);

  const snapSheet2 = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: pl.x, y: pl.y, width: pl.width, height: pl.height, scale: 2 }
  });
  fs.writeFileSync('tests/screenshots/test-sheet-02-closeup.png', Buffer.from(snapSheet2.data, 'base64'));
  console.log('✓ Captura macro guardada en tests/screenshots/test-sheet-02-closeup.png');

  // Capturar macro del bloque izquierdo (8.7.61)
  const snapDateLeft = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: domInfo.dateLeft.left - 10,
      y: domInfo.dateLeft.top - 10,
      width: domInfo.dateLeft.width + 20,
      height: domInfo.dateLeft.height + 20,
      scale: 3
    }
  });
  fs.writeFileSync('tests/screenshots/test-sheet-02-date-left-macro.png', Buffer.from(snapDateLeft.data, 'base64'));
  console.log('✓ Macro de 8.7.61 guardado en tests/screenshots/test-sheet-02-date-left-macro.png');

  // Capturar macro del bloque derecho (el argentino + 26.7.61)
  const snapHeaderRight = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: domInfo.groupTrinchera.left - 10,
      y: domInfo.groupTrinchera.top - 10,
      width: domInfo.groupTrinchera.width + 20,
      height: domInfo.groupTrinchera.height + 20,
      scale: 3
    }
  });
  fs.writeFileSync('tests/screenshots/test-sheet-02-header-right-macro.png', Buffer.from(snapHeaderRight.data, 'base64'));
  console.log('✓ Macro de "el argentino" y "26.7.61" guardado en tests/screenshots/test-sheet-02-header-right-macro.png');

  // Probar apertura del recorte 1 en primer plano (wrap-nino-dice)
  console.log('\n--- Probando apertura interactiva de recorte Nino Dice ---');
  await evalInPage(`window.book.openForegroundClipping(document.querySelector('.wrap-nino-dice'));`);
  await new Promise(r => setTimeout(r, 650));

  const fgActive1 = await evalInPage(`window.book.isForegroundClippingActive`);
  console.log('Primer plano activo:', fgActive1);
  if (!fgActive1) throw new Error('Primer plano no se activó para Nino Dice');

  // Cerrar primer plano
  await evalInPage(`document.getElementById('btnCloseClipping').click();`);
  await new Promise(r => setTimeout(r, 500));

  // Probar apertura del recorte 2 en primer plano (wrap-trinchera)
  console.log('\n--- Probando apertura interactiva de recorte Trinchera ---');
  await evalInPage(`window.book.openForegroundClipping(document.querySelector('.wrap-trinchera'));`);
  await new Promise(r => setTimeout(r, 650));

  const fgActive2 = await evalInPage(`window.book.isForegroundClippingActive`);
  console.log('Primer plano activo:', fgActive2);
  if (!fgActive2) throw new Error('Primer plano no se activó para Trinchera');

  // Cerrar primer plano
  await evalInPage(`document.getElementById('btnCloseClipping').click();`);
  await new Promise(r => setTimeout(r, 500));

  console.log('\n=== TODAS LAS VERIFICACIONES COMPLETADAS CON ÉXITO ===');
} catch (err) {
  console.error('\n❌ ERROR:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  edge.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
}
